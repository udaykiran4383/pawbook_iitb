# Bring PawBook to your campus

**The fast way — no deployment at all.** This site already serves many
campuses. Add yours to `lib/campuses.ts` (copy the template at the bottom of
that file, ten minutes) and open a pull request. Once merged, your campus is
live at `/c/<your-slug>` with its own animals, map, rules, register and bite
page. Nothing below is required for that.

**The self-hosted way** — if your institution wants its own copy on its own
domain — is the rest of this guide.


PawBook is a memory book and care log for the animals that live on a campus.
It started at IIT Bombay. Since 19 May 2026 every educational institution in
India has a named officer answerable for its campus animals, and PawBook keeps
the records that role needs — in the vocabulary the survey teams already use,
without exposing where any animal sleeps.

You do not need to fork anything. Set a handful of environment variables and
deploy.

## 1. Accounts you need (all free tiers)

| Service | For | Sign up |
|---|---|---|
| Vercel | hosting | vercel.com |
| Supabase | the database | supabase.com |
| Cloudinary | photos | cloudinary.com |
| Upstash | cache + rate limiting (optional) | upstash.com |

## 2. Database

In Supabase → SQL Editor, run `scripts/00-pawbook-state.sql` (or paste this):

```sql
CREATE TABLE IF NOT EXISTS public.pawbook_state (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now())
);
ALTER TABLE public.pawbook_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read"   ON public.pawbook_state FOR SELECT USING (true);
CREATE POLICY "insert" ON public.pawbook_state FOR INSERT WITH CHECK (true);
CREATE POLICY "update" ON public.pawbook_state FOR UPDATE USING (true);
```

## 3. Environment variables

Set these in Vercel → Project → Settings → Environment Variables.

**Your campus** (all optional — defaults are IIT Bombay):

```
NEXT_PUBLIC_CAMPUS_NAME=IIT Madras
NEXT_PUBLIC_CAMPUS_SHORT=IITM
NEXT_PUBLIC_CAMPUS_PLACE=Chennai
NEXT_PUBLIC_SITE_URL=https://pawbook-iitm.vercel.app
NEXT_PUBLIC_CAMPUS_MIN_LAT=12.98
NEXT_PUBLIC_CAMPUS_MAX_LAT=13.01
NEXT_PUBLIC_CAMPUS_MIN_LNG=80.22
NEXT_PUBLIC_CAMPUS_MAX_LNG=80.25
NEXT_PUBLIC_CAMPUS_ZONES=Main Gate,Velachery Gate,Krishna Hostel,Library,GC
NEXT_PUBLIC_CAMPUS_WELFARE_GROUP=IITM Animal Welfare Club
NEXT_PUBLIC_CAMPUS_AUTHORITY=the Dean of Students' office
NEXT_PUBLIC_CAMPUS_POPULATION=180
```

The bounds matter: a location reading outside them is discarded as a bad fix.
Find them by right-clicking two corners of your campus in Google Maps.

**Services** (required):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**Optional:**

```
UPSTASH_REDIS_REST_URL=        # caching + write rate limiting
UPSTASH_REDIS_REST_TOKEN=
OPENAI_API_KEY=                # screens uploads; never blocks injury photos
STATE_ADMIN_SECRET=            # required for DELETE /api/state; off when unset
NEXT_PUBLIC_EMERGENCY_CONTACT= # ONLY after you have dialled it and it works
```

## 4. Deploy

Import the repository into Vercel, add the variables, deploy. Open `/rules`
first and read it with your welfare group — those eight rules are the ones the
courts and the Japanese community-cat programmes converge on, and they are what
your institution will ask you to show.

## 5. What you now have

- A page and a printable QR poster for every animal (`/animals/<name>-<id>`)
- Sighting logs by zone, never by coordinate
- Survey-standard health observations (the Mission Rabies / WVS fields)
- Sterilisation and rabies coverage, computed from vet records only
- A register export — CSV — for a Nodal Officer, an affidavit or a survey team
- Anonymous-by-default contributions; nobody is asked for a name

## 6. Before you go live — three things not in the code

1. **Find out whether your institution has named a Nodal Officer** under the
   7 November 2025 order and whether any student body has filed the liability
   affidavit para 74 of 2026 INSC 506 requires. One email to the Dean's office.
2. **Dial every phone number** before you print it on a poster.
3. **Talk to whoever already feeds the animals.** They existed before the app.
