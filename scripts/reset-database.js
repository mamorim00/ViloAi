#!/usr/bin/env node

/**
 * ViloAi Database Reset Script
 *
 * ⚠️ WARNING: This will DELETE ALL DATA including users, messages, and subscriptions
 * Use this script for testing purposes only
 *
 * Usage: node scripts/reset-database.js
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

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function resetDatabase() {
  console.log('🚨 WARNING: This will DELETE ALL DATA from the database!');
  console.log('📋 Tables to be cleared:');
  console.log('   - auth.users (all users and authentication)');
  console.log('   - profiles');
  console.log('   - instagram_messages');
  console.log('   - instagram_comments');
  console.log('   - message_analytics');
  console.log('   - follower_insights');
  console.log('   - auto_reply_queue');
  console.log('   - automation_rules');
  console.log('');
  console.log('⏳ Waiting 5 seconds... Press Ctrl+C to cancel.');
  console.log('');

  // Wait 5 seconds to give user time to cancel
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log('🔄 Starting database reset...');
  console.log('');

  try {
    // Step 1: Delete application data (in reverse dependency order)
    console.log('1️⃣  Deleting follower_insights...');
    const { error: e1 } = await supabaseAdmin.from('follower_insights').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e1) console.error('   Error:', e1.message);

    console.log('2️⃣  Deleting message_analytics...');
    const { error: e2 } = await supabaseAdmin.from('message_analytics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e2) console.error('   Error:', e2.message);

    console.log('3️⃣  Deleting auto_reply_queue...');
    const { error: e3 } = await supabaseAdmin.from('auto_reply_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e3) console.error('   Error:', e3.message);

    console.log('4️⃣  Deleting automation_rules...');
    const { error: e4 } = await supabaseAdmin.from('automation_rules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e4) console.error('   Error:', e4.message);

    console.log('5️⃣  Deleting instagram_comments...');
    const { error: e5 } = await supabaseAdmin.from('instagram_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e5) console.error('   Error:', e5.message);

    console.log('6️⃣  Deleting instagram_messages...');
    const { error: e6 } = await supabaseAdmin.from('instagram_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e6) console.error('   Error:', e6.message);

    console.log('7️⃣  Deleting profiles...');
    const { error: e7 } = await supabaseAdmin.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e7) console.error('   Error:', e7.message);

    // Step 2: Delete auth users using admin API
    console.log('8️⃣  Deleting auth.users...');

    // Get all users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('   Error listing users:', listError.message);
    } else {
      console.log(`   Found ${users.length} users to delete`);

      // Delete each user
      for (const user of users) {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.error(`   Error deleting user ${user.email}:`, deleteError.message);
        } else {
          console.log(`   ✓ Deleted user: ${user.email}`);
        }
      }
    }

    console.log('');
    console.log('✅ Database reset complete!');
    console.log('');

    // Verify deletion
    console.log('📊 Verification - Remaining rows:');

    const tables = [
      'profiles',
      'instagram_messages',
      'instagram_comments',
      'message_analytics',
      'follower_insights',
      'auto_reply_queue',
      'automation_rules',
    ];

    for (const table of tables) {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ${table}: Error - ${error.message}`);
      } else {
        console.log(`   ${table}: ${count} rows`);
      }
    }

    // Check auth users
    const { data: { users: remainingUsers } } = await supabaseAdmin.auth.admin.listUsers();
    console.log(`   auth.users: ${remainingUsers?.length || 0} rows`);

    console.log('');
    console.log('🎉 All done! Database is now clean.');

  } catch (error) {
    console.error('');
    console.error('❌ Fatal error during reset:', error);
    process.exit(1);
  }
}

// Run the script
resetDatabase();
