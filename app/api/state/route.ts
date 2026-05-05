import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { redisDel, redisGetJSON, redisSetJSON } from '@/lib/redis-cache';

const CACHE_TTL_SECONDS = 90;
const cacheKey = (id: string) => `pawbook:state:${id}`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const cached = await redisGetJSON<unknown>(cacheKey(id));
    if (cached) {
      return NextResponse.json({ data: cached, source: 'redis' }, { status: 200 });
    }

    const { data, error } = await supabaseAdmin
      .from('pawbook_state')
      .select('data')
      .eq('id', id)
      .single();

    if (error) {
      // No row yet is a normal case.
      if (error.code === 'PGRST116') return NextResponse.json({ data: null }, { status: 200 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const value = data?.data ?? null;
    if (value) {
      await redisSetJSON(cacheKey(id), value, CACHE_TTL_SECONDS);
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
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { error } = await supabaseAdmin.from('pawbook_state').upsert({ id, data });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await redisSetJSON(cacheKey(id), data, CACHE_TTL_SECONDS);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { error } = await supabaseAdmin.from('pawbook_state').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await redisDel(cacheKey(id));

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
