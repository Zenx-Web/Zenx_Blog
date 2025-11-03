import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testLogin() {
  console.log('🧪 Testing Supabase Login...\n')
  
  const email = process.env.ADMIN_EMAIL || 'kbarhoi367@gmail.com'
  const password = process.env.ADMIN_PASSWORD || 'kbarhoi@122'
  
  console.log(`Testing credentials:`)
  console.log(`Email: ${email}`)
  console.log(`Password: ${'*'.repeat(password.length)}\n`)

  try {
    // Test without captcha first
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ Login failed:')
      console.error(`Error code: ${error.status}`)
      console.error(`Error message: ${error.message}`)
      
      if (error.message.includes('captcha')) {
        console.log('\n⚠️  CAPTCHA is required!')
        console.log('Solution: Disable hCaptcha in Supabase or add the secret key')
        console.log('Link: https://supabase.com/dashboard/project/umfhehmdhiusxmyezdkk/settings/auth')
      } else if (error.message.includes('Invalid')) {
        console.log('\n⚠️  Invalid credentials')
        console.log('Possible issues:')
        console.log('1. User does not exist - try registering first')
        console.log('2. Password is incorrect')
        console.log('3. Email confirmation required')
      }
      
      return false
    }

    console.log('✅ Login successful!')
    console.log(`User ID: ${data.user?.id}`)
    console.log(`Email: ${data.user?.email}`)
    console.log(`Email confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No'}`)
    
    // Sign out
    await supabase.auth.signOut()
    console.log('\n✅ Test completed successfully!')
    return true

  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
    return false
  }
}

testLogin()
