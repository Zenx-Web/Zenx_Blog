import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function subscribeAllUsers() {
  console.log('🔍 Finding all users...\n')

  // Get all users from auth
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('❌ Error fetching users:', authError)
    return
  }

  const users = authData.users
  console.log(`📊 Found ${users.length} total users\n`)

  if (users.length === 0) {
    console.log('No users to subscribe')
    return
  }

  // Get existing subscriptions
  const { data: existingSubs, error: subsError } = await supabase
    .from('email_subscriptions')
    .select('email')

  if (subsError) {
    console.error('❌ Error fetching subscriptions:', subsError)
    return
  }

  const existingEmails = new Set(existingSubs?.map(s => s.email.toLowerCase()) || [])
  console.log(`📧 Already subscribed: ${existingEmails.size} emails\n`)

  let addedCount = 0
  let skippedCount = 0
  let errorCount = 0

  console.log('📝 Processing users...\n')

  for (const user of users) {
    const email = user.email

    if (!email) {
      console.log(`⏭️  Skipping user ${user.id} - no email`)
      skippedCount++
      continue
    }

    // Check if already subscribed
    if (existingEmails.has(email.toLowerCase())) {
      console.log(`⏭️  ${email} - already subscribed`)
      skippedCount++
      continue
    }

    // Add to subscriptions
    const { error: insertError } = await supabase
      .from('email_subscriptions')
      .insert({
        email: email,
        is_verified: true, // Auto-verify since they already have an account
        preferences: {
          newPosts: true,
          weeklyDigest: true,
          emailNotifications: true
        },
        subscribed_at: new Date().toISOString()
      })

    if (insertError) {
      console.error(`❌ Failed to subscribe ${email}:`, insertError.message)
      errorCount++
    } else {
      console.log(`✅ Added ${email} to subscriptions`)
      addedCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 SUMMARY')
  console.log('='.repeat(50))
  console.log(`Total users: ${users.length}`)
  console.log(`✅ Newly subscribed: ${addedCount}`)
  console.log(`⏭️  Already subscribed: ${skippedCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log('='.repeat(50))

  if (addedCount > 0) {
    console.log('\n✨ Success! All users are now subscribed to email notifications.')
  }
}

subscribeAllUsers()
