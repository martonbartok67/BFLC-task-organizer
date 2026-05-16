# Make Email Admin

To make `marcibartok07@gmail.com` an admin, you need to:

## Option 1: Use the Script (Easiest)

1. Get your Supabase credentials:
   - Go to https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/settings/api
   - Copy `Project URL` (SUPABASE_URL)
   - Copy `service_role` key (SUPABASE_SERVICE_ROLE_KEY) - use the secret key!

2. Run the script:
```bash
cd /home/claude/BFLC-task-organizer
SUPABASE_URL="https://xxx.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key" \
node make-admin.js
```

3. If successful, you'll see:
```
✓ Successfully promoted to admin!
```

## Option 2: Manual via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click "SQL Editor"
3. Run this query:
```sql
UPDATE profiles 
SET is_admin = true 
WHERE email = 'marcibartok07@gmail.com';
```

## Option 3: Manual via Supabase UI

1. Go to Table Editor → `profiles` table
2. Find the row with your email
3. Click the row and set `is_admin` = TRUE

---

## After Making Admin:

1. Deploy to Vercel (git push will fail due to network, so deploy via Vercel dashboard)
2. Log back in - check sidebar for "Admin Access" amber badge
3. Visit `/admin` to see User Management panel
4. Now you can promote other users to admin!
