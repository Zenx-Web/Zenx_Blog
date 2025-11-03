import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSubscriptions() {
  console.log('🔍 Checking email subscriptions...\n')

  // Get all subscriptions
  const { data: allSubs, error: allError } = await supabase
    .from('email_subscriptions')
    .select('*')
    .order('created_at', { ascending: false })

  if (allError) {
    console.error('Error fetching subscriptions:', allError)
    return
  }

  console.log(`📊 Total subscriptions: ${allSubs?.length || 0}\n`)

  if (allSubs && allSubs.length > 0) {
    allSubs.forEach((sub, index) => {
      console.log(`\n--- Subscription ${index + 1} ---`)
      console.log(`Email: ${sub.email}`)
      console.log(`Verified: ${sub.is_verified ? '✅ YES' : '❌ NO'}`)
      console.log(`Unsubscribed: ${sub.unsubscribed_at ? '⛔ YES' : '✅ NO'}`)
      console.log(`Preferences:`, JSON.stringify(sub.preferences, null, 2))
      console.log(`Created: ${sub.created_at}`)
    })
  }

  // Get verified, active subscribers
  const { data: activeSubs, error: activeError } = await supabase
    .from('email_subscriptions')
    .select('email, preferences')
    .eq('is_verified', true)
    .is('unsubscribed_at', null)

  if (activeError) {
    console.error('Error fetching active subscriptions:', activeError)
    return
  }

  console.log(`\n\n✉️ ACTIVE SUBSCRIBERS (verified + not unsubscribed): ${activeSubs?.length || 0}`)
  
  if (activeSubs && activeSubs.length > 0) {
    activeSubs.forEach((sub) => {
      const prefs = sub.preferences || {}
      const newPostsEnabled = prefs.newPosts !== false
      console.log(`  - ${sub.email} ${newPostsEnabled ? '✅ Will receive emails' : '❌ New posts disabled'}`)
    })
  }

  console.log('\n\n💡 TIP: To receive emails, you need:')
  console.log('   1. ✅ Verified email (is_verified = true)')
  console.log('   2. ✅ Not unsubscribed (unsubscribed_at = null)')
  console.log('   3. ✅ New posts enabled in preferences')
}

checkSubscriptions()
