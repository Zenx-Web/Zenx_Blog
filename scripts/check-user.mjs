import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkUser() {
  console.log('🔍 Checking if user exists in Supabase...\n')
  
  const emails = [
    'zenxen368@gmail.com',
    'kbarhoi367@gmail.com'
  ]
  
  for (const email of emails) {
    console.log(`Checking: ${email}`)
    
    try {
      const { data, error } = await supabase.auth.admin.listUsers()
      
      if (error) {
        console.error('Error listing users:', error.message)
        continue
      }
      
      const user = data.users.find(u => u.email === email)
      
      if (user) {
        console.log(`✅ User EXISTS`)
        console.log(`  - User ID: ${user.id}`)
        console.log(`  - Email: ${user.email}`)
        console.log(`  - Email Confirmed: ${user.email_confirmed_at ? 'Yes ✅' : 'No ❌ (NEEDS CONFIRMATION!)'}`)
        console.log(`  - Created: ${new Date(user.created_at).toLocaleString()}`)
        console.log(`  - Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`)
      } else {
        console.log(`❌ User NOT FOUND - You need to REGISTER first!`)
      }
      console.log('')
    } catch (err) {
      console.error('Unexpected error:', err.message)
    }
  }
  
  console.log('\n📋 Solution:')
  console.log('If user NOT FOUND: Go to http://localhost:3000/auth/register and create an account')
  console.log('If email NOT CONFIRMED: Check the email confirmation link Supabase sent')
  console.log('If email IS CONFIRMED but login fails: Password might be wrong')
}

checkUser()
