#!/usr/bin/env node

/**
 * Delete Single User Script
 *
 * Usage: node scripts/delete-user.js email@example.com
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Email address required');
  console.error('Usage: node scripts/delete-user.js email@example.com');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function deleteUser() {
  console.log(`🔍 Looking for user: ${email}`);
  console.log('');

  try {
    // Find user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      process.exit(1);
    }

    const user = users.find(u => u.email === email);

    if (!user) {
      console.log(`⚠️  User not found: ${email}`);
      console.log('');
      console.log('Available users:');
      users.forEach(u => console.log(`   - ${u.email}`));
      process.exit(1);
    }

    console.log(`✓ Found user:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
    console.log('');

    // Delete from profiles first (to avoid foreign key issues)
    console.log('🗑️  Deleting profile...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.warn('⚠️  Profile deletion warning:', profileError.message);
    } else {
      console.log('✓ Profile deleted');
    }

    // Delete user from auth
    console.log('🗑️  Deleting user from auth...');
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError.message);
      process.exit(1);
    }

    console.log('');
    console.log('✅ User deleted successfully!');
    console.log(`   Email: ${email}`);
    console.log('');
    console.log('You can now sign up with this email again.');

  } catch (error) {
    console.error('');
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
deleteUser();
