#!/bin/bash

# Script to make an email admin in Supabase
# Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node make-admin.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const emailToPromote = 'marcibartok07@gmail.com';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  console.error('\nUsage:');
  console.error('  SUPABASE_URL=your_url SUPABASE_SERVICE_ROLE_KEY=your_key node make-admin.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function makeAdmin() {
  try {
    console.log(`Making ${emailToPromote} an admin...`);

    // Find user by email
    const { data: user, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, is_admin')
      .eq('email', emailToPromote)
      .single();

    if (fetchError || !user) {
      console.error('Error: User not found with email:', emailToPromote);
      process.exit(1);
    }

    console.log(`Found user: ${user.full_name || user.email} (ID: ${user.id})`);
    console.log(`Current admin status: ${user.is_admin ? 'ADMIN ✓' : 'MEMBER'}`);

    if (user.is_admin) {
      console.log('✓ User is already an admin');
      process.exit(0);
    }

    // Update to admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating admin status:', updateError);
      process.exit(1);
    }

    console.log('✓ Successfully promoted to admin!');
    console.log('\nNext steps:');
    console.log('1. Deploy to Vercel: git push origin main');
    console.log('2. Log in and check the sidebar - you should see "Admin Access" badge');
    console.log('3. Visit /admin to manage users');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

makeAdmin();
