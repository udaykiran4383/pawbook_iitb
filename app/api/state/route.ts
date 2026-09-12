import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { redisDel, redisGetJSON, redisRateLimited, redisSetJSON } from '@/lib/redis-cache';
import { mergeState } from '@/lib/state-merge';
import { checkStateId, checkStatePayload, clientIp } from '@/lib/state-guard';

const CACHE_TTL_SECONDS = 90;
const cacheKey = (id: string) => `pawbook:state:${id}`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const idCheck = checkStateId(id);
    if (!idCheck.ok) return NextResponse.json({ error: idCheck.error }, { status: idCheck.status });

    const cached = await redisGetJSON<unknown>(cacheKey(id!));
    if (cached) {
      return NextResponse.json({ data: cached, source: 'redis' }, { status: 200 });
    }

    const { data, error } = await supabaseAdmin
      .from('pawbook_state')
      .select('data')
      .eq('id', id!)
      .single();

    if (error) {
      // No row yet is a normal case.
      if (error.code === 'PGRST116') return NextResponse.json({ data: null }, { status: 200 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const value = data?.data ?? null;
    if (value) {
      await redisSetJSON(cacheKey(id!), value, CACHE_TTL_SECONDS);
    }

    return NextResponse.json({ data: value, source: 'database' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, data } = body || {};

    // This endpoint is unauthenticated and writes with the service-role key,
    // so everything it accepts has to be checked here. See lib/state-guard.ts.
    const idCheck = checkStateId(id);
    if (!idCheck.ok) return NextResponse.json({ error: idCheck.error }, { status: idCheck.status });

    const payloadCheck = checkStatePayload(data);
    if (!payloadCheck.ok) return NextResponse.json({ error: payloadCheck.error }, { status: payloadCheck.status });

    if (await redisRateLimited(`pawbook:ratelimit:put:${clientIp(request)}`, 60, 60)) {
      return NextResponse.json({ error: 'Too many writes, please slow down' }, { status: 429 });
    }

    // Every client writes the whole state blob, so a plain upsert loses whatever
    // another student added since this client last loaded. Merge against the
    // stored row instead, so concurrent writes converge. See lib/state-merge.ts.
    const { data: existing, error: readError } = await supabaseAdmin
      .from('pawbook_state')
      .select('data')
      .eq('id', id)
      .single();

    // PGRST116 = no row yet, which is a normal first write.
    if (readError && readError.code !== 'PGRST116') {
      return NextResponse.json({ error: readError.message }, { status: 500 });
    }

    const merged = existing?.data ? mergeState(existing.data, data) : data;

    const { error } = await supabaseAdmin
      .from('pawbook_state')
      .upsert({ id, data: merged, updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await redisSetJSON(cacheKey(id), merged, CACHE_TTL_SECONDS);

    return NextResponse.json({ ok: true, data: merged }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const idCheck = checkStateId(id);
    if (!idCheck.ok) return NextResponse.json({ error: idCheck.error }, { status: idCheck.status });

    // Deleting this row erases every animal, comment and memory in the app, and
    // the free tier has no backups. It is not something a browser should be
    // able to do: require a secret that only the server side knows.
    const adminSecret = process.env.STATE_ADMIN_SECRET;
    if (!adminSecret || request.headers.get('x-admin-secret') !== adminSecret) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from('pawbook_state').delete().eq('id', id!);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await redisDel(cacheKey(id!));

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
