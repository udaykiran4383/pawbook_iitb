# Environment & Deployment Setup Guide

## 🔐 Required Environment Variables

Your `.env.local` should already have these from the Supabase integration. Verify they exist:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Cloudinary (image storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Upstash Redis (cache for /api/state)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# These should also be set:
POSTGRES_URL=postgresql://postgres:password@host:5432/postgres
POSTGRES_PRISMA_URL=postgresql://user:password@host:5432/postgres?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgresql://user:password@host:5432/postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=postgres
POSTGRES_HOST=your-db.supabase.co
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_ANON_KEY=your_anon_key
```

## ✅ Verification Steps

### 1. Verify Supabase Configuration
```bash
# In your project directory:
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Both should output values (not empty)
```

### 2. Test Database Connection
```bash
# Using psql (install if needed):
psql $POSTGRES_URL -c "SELECT 1"

# Should return: 
# ?column?
# ----------
#        1
```

### 3. Test Supabase Client
```bash
# In Node.js REPL:
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
await supabase.from('animals').select('*');
```

---

## 🗄️ Database Setup Sequence

### Step 1: Execute Migration Script
```sql
-- Login to Supabase Dashboard
-- Go to: SQL Editor > New Query
-- Copy entire contents of: scripts/02-enhanced-schema.sql
-- Paste and run
-- Wait for success message
```

**What gets created:**
- ✅ Enhanced `animals` table with unique_hash
- ✅ All new tables (images, comments, medical, etc.)
- ✅ Triggers for auto-hash generation
- ✅ RLS policies for security
- ✅ Helper functions for queries
- ✅ Indexes for performance

### Step 2: Create Storage Buckets
```
Supabase Dashboard > Storage > New Bucket

Bucket 1: animal-images
├─ Visibility: Public
├─ File size limit: 5 MB
└─ Allowed MIME types: image/*

Bucket 2: animal-profiles  
├─ Visibility: Public
├─ File size limit: 10 MB
└─ Allowed MIME types: image/*

Bucket 3: medical-documents
├─ Visibility: Private
├─ File size limit: 20 MB
└─ Allowed MIME types: application/pdf, image/*
```

### Step 3: Verify Tables Exist
```sql
-- Run in Supabase SQL Editor:

-- Check animals table
SELECT * FROM animals LIMIT 1;

-- Check new tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Should show: animal_comments, animal_images, care_events, 
-- donors, adoption_records, emotional_memories, help_needed, 
-- image_comments, image_likes, medical_records, user_profiles
```

### Step 4: Verify Indexes Created
```sql
-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY indexname;

-- Should show idx_animals_* indexes, etc.
```

### Step 5: Verify RLS Enabled
```sql
-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;

-- All tables should have multiple policies
```

---

## 🚀 Local Development Setup

### 1. Install Dependencies
```bash
cd /vercel/share/v0-project
pnpm install

# Or if using npm/yarn:
npm install
# or
yarn install
```

### 2. Create `.env.local`
```bash
# Copy the template from env variables above
# Paste into .env.local
# Fill in your Supabase credentials

cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
EOF
```

### 3. Start Development Server
```bash
pnpm dev
# or
npm run dev
```

The app should be available at `http://localhost:3000`

### 4. Test in Browser
```
- Open http://localhost:3000
- Should see loading, then main page
- No red errors in browser console
```

---

## 🧪 Testing the New Features

### Test 1: Image Upload
```
1. Navigate to http://localhost:3000
2. Click "+ Add a Memory"
3. Fill in animal details
4. Click "Add Photos" or use the gallery
5. Select/capture image
6. Verify upload success
7. Check image appears in animal profile
```

### Test 2: Duplicate Detection
```
1. Create animal: "Brownie", "H21", "dog"
2. Click "+ Add a Memory" again
3. Enter same: "Brownie", "H21"
4. Should show: "Similar animals found"
5. Select existing profile
6. Should offer to add photos instead of creating duplicate
```

### Test 3: Real-time Likes
```
1. Open an animal profile with images
2. Open in two browser windows side-by-side
3. Like image in window 1
4. Check window 2 → count should update instantly
5. Refresh window 2 → should still show like
```

### Test 4: Comments
```
1. Open image in animal profile
2. Scroll to comments section
3. Type comment and submit
4. Should appear immediately
5. Open in another browser → should see comment
```

### Test 5: Medical Records
```
1. Open animal profile
2. Scroll to "Medical Records"
3. Click "Add Record"
4. Fill form and submit
5. Should appear in medical records list
6. Click to expand and verify details
```

### Test 6: Help Needed
```
1. Open animal profile with status = "injured"
2. Scroll to "Help Needed"
3. Click "Add Help Request"
4. Mark as CRITICAL
5. Should show red alert at top of profile
6. Community should see it
```

---

## 📦 Build for Production

### 1. Build the Project
```bash
pnpm build
# or
npm run build

# Should see: ✓ Compiled successfully
```

### 2. Test Production Build Locally
```bash
pnpm start
# or
npm start

# Should be available at http://localhost:3000
```

### 3. Check for Errors
```bash
# No red lines in build output
# No [v0] errors in browser console
# All pages load without errors
```

---

## 🚢 Deploy to Vercel

### Option 1: From GitHub (Recommended)
```bash
1. Push code to GitHub
2. Go to Vercel Dashboard
3. Click "New Project"
4. Select GitHub repo
5. Vercel auto-imports env vars
6. Click "Deploy"
```

### Option 2: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Follow prompts
# Confirm env vars are set
```

### Option 3: Manual via Vercel Dashboard
```
1. Connect GitHub repo
2. Go to Settings > Environment Variables
3. Add all env vars from above
4. Deploy button in main view
```

### Verify Deployment
```
After deployment:
1. Visit your Vercel URL
2. Test image upload
3. Test real-time features
4. Check Storage bucket access
5. Verify database queries work
```

---

## 🔍 Environment Variables Checklist

```
✅ NEXT_PUBLIC_SUPABASE_URL
   - Format: https://xxxxx.supabase.co
   - Source: Supabase Dashboard > Settings > API

✅ NEXT_PUBLIC_SUPABASE_ANON_KEY  
   - Format: Long string starting with eyJ...
   - Source: Supabase Dashboard > Settings > API > anon public key

✅ SUPABASE_SERVICE_ROLE_KEY
   - Format: Long string starting with eyJ...
   - Source: Supabase Dashboard > Settings > API > service_role secret
   - ⚠️ Keep this SECRET - don't commit to GitHub

✅ CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
   - Source: Cloudinary Console > Programmable Media > API Keys
   - Used by: `POST /api/upload-image`
   - ⚠️ Keep `CLOUDINARY_API_SECRET` private

✅ UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
   - Source: Upstash Console > Redis > REST API
   - Used by: `/api/state` read/write cache
   - Optional: app still works without Redis, but with no cache acceleration

✅ POSTGRES_URL
   - Format: postgresql://user:pass@host:5432/postgres
   - Source: Supabase Dashboard > Database > Connection strings

✅ All other POSTGRES_* variables
   - Set by Supabase integration
   - Use same connection string as above
```

---

## 🐛 Troubleshooting Deployment

### Issue: "Missing environment variables"
**Solution:**
```bash
# Verify .env.local
cat .env.local

# Check Vercel dashboard
Settings > Environment Variables

# All vars should be listed
```

### Issue: "Storage bucket not found"
**Solution:**
```bash
# In Supabase Dashboard:
1. Go to Storage
2. Create buckets: animal-images, animal-profiles, medical-documents
3. Set correct visibility (public/private)
4. Retry upload
```

### Issue: "RLS policy denies access"
**Solution:**
```sql
-- Verify RLS is working (should return rows)
SELECT * FROM animals;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'animals';
-- Should show: schemaname=public, tablename=animals, rowsecurity=true
```

### Issue: "Rate limit exceeded"
**Solution:**
```bash
# Check Supabase plan
Dashboard > Settings > Billing

# Upgrade if needed
# Or implement caching/throttling
```

---

## 📊 Monitoring After Deployment

### Monitor Database
```
Supabase Dashboard > Database > Logs
- Watch for slow queries
- Monitor connection pool
- Check for RLS errors
```

### Monitor Storage
```
Supabase Dashboard > Storage > Usage
- Track total files uploaded
- Monitor storage usage
- Check download bandwidth
```

### Monitor Errors
```
Vercel Dashboard > Deployments > [Your Deployment] > Logs
- Check for 500 errors
- Monitor API performance
- Watch for memory issues
```

---

## 🔄 Backup & Recovery

### Automated Backups
Supabase includes:
- ✅ Daily automated backups
- ✅ Point-in-time recovery (last 7 days)
- ✅ Archive storage (30 days)

### Manual Backup
```bash
# Export database
pg_dump $POSTGRES_URL > backup.sql

# Export images (if needed)
# Use Supabase dashboard or aws cli for S3-like storage
```

### Recovery
```bash
# If data corrupted, ask Supabase support for recovery
# They can restore from automated backups
```

---

## 🎓 Final Checklist Before Going Live

- [ ] All environment variables set
- [ ] Database migration executed successfully
- [ ] Storage buckets created and public/private set correctly
- [ ] RLS policies enabled on all tables
- [ ] Tested image upload from camera
- [ ] Tested image upload from gallery
- [ ] Tested real-time likes and comments
- [ ] Tested duplicate detection
- [ ] Tested all new components
- [ ] Mobile responsiveness verified
- [ ] No console errors
- [ ] Build completes without errors
- [ ] Vercel deployment successful
- [ ] Production testing completed
- [ ] Monitoring configured
- [ ] Backup/recovery plan in place

---

## 📞 Support Resources

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Supabase Support: https://supabase.com/support
- Vercel Support: https://vercel.com/help

---

## 🎉 Ready to Deploy!

Once all checklist items are complete, your PawBook IITB application is ready for production use by the IITB community!

