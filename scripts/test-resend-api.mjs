import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { Resend } from 'resend'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '..', '.env.local') })

console.log('=== Testing Resend API Configuration ===\n')

// Check environment variables
const apiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Zenx Blog <noreply@imzenx.in>'

console.log('API Key:', apiKey ? '✅ Set (' + apiKey.substring(0, 10) + '...)' : '❌ NOT SET')
console.log('From Email:', fromEmail)
console.log('')

if (!apiKey) {
  console.log('❌ Cannot test - RESEND_API_KEY not set')
  process.exit(1)
}

// Initialize Resend
const resend = new Resend(apiKey)

// Test 1: Send a test email
console.log('📧 Sending test email...\n')

const testEmail = {
  from: fromEmail,
  to: 'kbarhoi367@gmail.com', // Your Resend account email (testing only)
  subject: '🧪 Test Email from ImZenx Blog - ' + new Date().toLocaleString(),
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success { background: #10b981; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Email System Test</h1>
          </div>
          <div class="content">
            <h2>Test Successful!</h2>
            <p>If you're reading this, your ImZenx email notification system is working perfectly!</p>
            
            <div class="success">
              ✅ Resend API: Connected<br>
              ✅ Email Delivery: Working<br>
              ✅ Domain Configuration: Valid
            </div>
            
            <p><strong>Test Details:</strong></p>
            <ul>
              <li>From: ${fromEmail}</li>
              <li>To: kbarhoi367@gmail.com</li>
              <li>Time: ${new Date().toLocaleString()}</li>
            </ul>
            
            <p>You should now receive email notifications when new posts are published on ImZenx!</p>
          </div>
        </div>
      </body>
    </html>
  `,
  text: 'ImZenx Email System Test - If you receive this, email notifications are working!'
}

try {
  console.log('Sending to:', testEmail.to)
  console.log('From:', testEmail.from)
  console.log('Subject:', testEmail.subject)
  console.log('')
  
  const response = await resend.emails.send(testEmail)
  
  console.log('✅ EMAIL SENT SUCCESSFULLY!\n')
  console.log('Response:', JSON.stringify(response, null, 2))
  console.log('')
  console.log('📬 Check your inbox at kbarhoi367@gmail.com')
  console.log('   (Check spam folder if not in inbox)')
  console.log('')
  
  // Additional domain verification check
  console.log('=== Domain Verification Status ===\n')
  console.log('From domain: imzenx.in')
  console.log('')
  console.log('⚠️  IMPORTANT: For Resend to work, you need to:')
  console.log('1. Add DNS records for imzenx.in in your Resend dashboard')
  console.log('2. Verify the domain at https://resend.com/domains')
  console.log('3. OR use a verified Resend testing domain (like onboarding@resend.dev)')
  console.log('')
  console.log('If emails are not arriving:')
  console.log('• Check Resend dashboard: https://resend.com/emails')
  console.log('• Verify domain DNS records are correct')
  console.log('• Check email spam/junk folder')
  console.log('• Try using resend.dev testing domain first')
  
} catch (error) {
  console.log('❌ FAILED TO SEND EMAIL\n')
  console.error('Error details:', error)
  console.log('')
  
  if (error.message?.includes('domain')) {
    console.log('🔴 DOMAIN NOT VERIFIED!')
    console.log('')
    console.log('Your domain "imzenx.in" is not verified in Resend.')
    console.log('')
    console.log('SOLUTIONS:')
    console.log('1. Verify imzenx.in domain in Resend:')
    console.log('   → Go to https://resend.com/domains')
    console.log('   → Add imzenx.in')
    console.log('   → Add the DNS records to your Hostinger account')
    console.log('   → Wait for verification (can take up to 72 hours)')
    console.log('')
    console.log('2. OR use Resend test domain (immediate):')
    console.log('   → Change RESEND_FROM_EMAIL to: "ImZenx <onboarding@resend.dev>"')
    console.log('   → This works instantly for testing')
  } else if (error.message?.includes('API key')) {
    console.log('🔴 INVALID API KEY!')
    console.log('')
    console.log('Your Resend API key may be invalid or expired.')
    console.log('Get a new one at: https://resend.com/api-keys')
  }
}

console.log('\n=== Test Complete ===\n')
