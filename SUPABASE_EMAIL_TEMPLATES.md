# Professional Supabase Email Templates for Zenx Blog

## 📧 How to Use These Templates

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/umfhehmdhiusxmyezdkk
2. Navigate to: **Authentication** → **Email Templates**
3. Copy and paste each template below into the corresponding email type
4. Customize the colors/branding if needed

---

## 1️⃣ Confirm Signup Email

**Subject:**
```
Welcome to Zenx Blog - Confirm Your Email 🎉
```

**Email Body (HTML):**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    .header .emoji {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
      color: #374151;
      line-height: 1.6;
    }
    .content h2 {
      color: #1F2937;
      font-size: 24px;
      margin-top: 0;
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
    }
    .button:hover {
      background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
    }
    .info-box {
      background-color: #EFF6FF;
      border-left: 4px solid #3B82F6;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      background-color: #F9FAFB;
      padding: 30px;
      text-align: center;
      color: #6B7280;
      font-size: 14px;
    }
    .footer a {
      color: #3B82F6;
      text-decoration: none;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #6B7280;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">🚀</div>
      <h1>Welcome to Zenx Blog!</h1>
    </div>
    
    <div class="content">
      <h2>Hi there! 👋</h2>
      
      <p>Thanks for joining <strong>Zenx Blog</strong> - your source for the hottest trending topics and AI-powered insights!</p>
      
      <p>To get started, please confirm your email address by clicking the button below:</p>
      
      <center>
        <a href="{{ .ConfirmationURL }}" class="button">
          ✉️ Confirm Your Email
        </a>
      </center>
      
      <div class="info-box">
        <strong>⏰ This link expires in 24 hours</strong><br>
        If you didn't create an account with Zenx Blog, you can safely ignore this email.
      </div>
      
      <p><strong>What's Next?</strong></p>
      <ul>
        <li>📖 Discover trending topics and hot news</li>
        <li>🔖 Save your favorite articles</li>
        <li>📊 Track your reading history</li>
        <li>📧 Get personalized content recommendations</li>
      </ul>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #3B82F6; font-size: 12px;">{{ .ConfirmationURL }}</p>
    </div>
    
    <div class="footer">
      <p><strong>Zenx Blog</strong> - Hot Topics & Trending News</p>
      <p>Stay updated with what's trending around the world 🌍</p>
      
      <div class="social-links">
        <a href="https://imzenx.in">🌐 Website</a> •
        <a href="https://imzenx.in/about">ℹ️ About</a> •
        <a href="https://imzenx.in/contact">📧 Contact</a>
      </div>
      
      <p style="font-size: 12px; color: #9CA3AF; margin-top: 20px;">
        © 2025 Zenx Blog. All rights reserved.<br>
        <a href="https://imzenx.in">imzenx.in</a>
      </p>
    </div>
  </div>
</body>
</html>
```

---

## 2️⃣ Magic Link Email (Passwordless Login)

**Subject:**
```
Your Magic Link to Sign In - Zenx Blog ✨
```

**Email Body (HTML):**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    .header .emoji {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
      color: #374151;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);
    }
    .warning-box {
      background-color: #FEF3C7;
      border-left: 4px solid #F59E0B;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      background-color: #F9FAFB;
      padding: 30px;
      text-align: center;
      color: #6B7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">✨</div>
      <h1>Sign In to Zenx Blog</h1>
    </div>
    
    <div class="content">
      <h2>Your Magic Link is Ready! 🔐</h2>
      
      <p>Click the button below to securely sign in to your Zenx Blog account:</p>
      
      <center>
        <a href="{{ .ConfirmationURL }}" class="button">
          🚀 Sign In Now
        </a>
      </center>
      
      <div class="warning-box">
        <strong>🔒 Security Notice</strong><br>
        This link expires in <strong>1 hour</strong> and can only be used once.<br>
        If you didn't request this, please ignore this email.
      </div>
      
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #8B5CF6; font-size: 12px;">{{ .ConfirmationURL }}</p>
    </div>
    
    <div class="footer">
      <p><strong>Zenx Blog</strong> - Hot Topics & Trending News</p>
      <p style="font-size: 12px; color: #9CA3AF; margin-top: 20px;">
        © 2025 Zenx Blog. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
```

---

## 3️⃣ Reset Password Email

**Subject:**
```
Reset Your Password - Zenx Blog 🔑
```

**Email Body (HTML):**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    .header .emoji {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
      color: #374151;
      line-height: 1.6;
    }
    .content h2 {
      color: #1F2937;
      font-size: 24px;
      margin-top: 0;
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);
    }
    .alert-box {
      background-color: #FEE2E2;
      border-left: 4px solid #EF4444;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .security-tips {
      background-color: #F0FDF4;
      border: 1px solid #86EFAC;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      background-color: #F9FAFB;
      padding: 30px;
      text-align: center;
      color: #6B7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">🔑</div>
      <h1>Reset Your Password</h1>
    </div>
    
    <div class="content">
      <h2>Password Reset Request</h2>
      
      <p>We received a request to reset the password for your Zenx Blog account.</p>
      
      <p>Click the button below to create a new password:</p>
      
      <center>
        <a href="{{ .ConfirmationURL }}" class="button">
          🔒 Reset Password
        </a>
      </center>
      
      <div class="alert-box">
        <strong>⏰ Important:</strong><br>
        This link expires in <strong>1 hour</strong> for security reasons.<br>
        If you didn't request this, please ignore this email and your password will remain unchanged.
      </div>
      
      <div class="security-tips">
        <strong>💡 Security Tips:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Use a unique password (not used on other sites)</li>
          <li>Include uppercase, lowercase, numbers, and symbols</li>
          <li>Make it at least 8 characters long</li>
          <li>Don't share your password with anyone</li>
        </ul>
      </div>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #EF4444; font-size: 12px;">{{ .ConfirmationURL }}</p>
      
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
        <strong>Need help?</strong> Contact us at <a href="mailto:support@imzenx.in" style="color: #3B82F6;">support@imzenx.in</a>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Zenx Blog</strong> - Hot Topics & Trending News</p>
      <p style="font-size: 12px; color: #9CA3AF; margin-top: 20px;">
        © 2025 Zenx Blog. All rights reserved.<br>
        This email was sent because a password reset was requested for this account.
      </p>
    </div>
  </div>
</body>
</html>
```

---

## 4️⃣ Change Email Address Confirmation

**Subject:**
```
Confirm Your New Email Address - Zenx Blog 📧
```

**Email Body (HTML):**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    .header .emoji {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
      color: #374151;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
    }
    .info-box {
      background-color: #ECFDF5;
      border-left: 4px solid #10B981;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      background-color: #F9FAFB;
      padding: 30px;
      text-align: center;
      color: #6B7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">📧</div>
      <h1>Email Address Change</h1>
    </div>
    
    <div class="content">
      <h2>Confirm Your New Email</h2>
      
      <p>You recently requested to change your email address on Zenx Blog.</p>
      
      <p>Please confirm your new email address by clicking the button below:</p>
      
      <center>
        <a href="{{ .ConfirmationURL }}" class="button">
          ✅ Confirm New Email
        </a>
      </center>
      
      <div class="info-box">
        <strong>ℹ️ What happens next:</strong><br>
        After confirmation, this email address will be used for all future communications and account access.
      </div>
      
      <p>If you didn't make this change, please contact our support team immediately at <a href="mailto:support@imzenx.in" style="color: #3B82F6;">support@imzenx.in</a></p>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #10B981; font-size: 12px;">{{ .ConfirmationURL }}</p>
    </div>
    
    <div class="footer">
      <p><strong>Zenx Blog</strong> - Hot Topics & Trending News</p>
      <p style="font-size: 12px; color: #9CA3AF; margin-top: 20px;">
        © 2025 Zenx Blog. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
```

---

## 5️⃣ Invite User Email (Optional)

**Subject:**
```
You've Been Invited to Join Zenx Blog! 🎉
```

**Email Body (HTML):**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    .header .emoji {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
      color: #374151;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);
    }
    .features {
      background-color: #FFFBEB;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      border: 1px solid #FDE68A;
    }
    .footer {
      background-color: #F9FAFB;
      padding: 30px;
      text-align: center;
      color: #6B7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">🎉</div>
      <h1>You're Invited!</h1>
    </div>
    
    <div class="content">
      <h2>Join Zenx Blog Today</h2>
      
      <p>You've been invited to join <strong>Zenx Blog</strong> - your source for trending topics and breaking news!</p>
      
      <p>Click the button below to accept your invitation and create your account:</p>
      
      <center>
        <a href="{{ .ConfirmationURL }}" class="button">
          🚀 Accept Invitation
        </a>
      </center>
      
      <div class="features">
        <strong>✨ What You'll Get:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>📰 Access to trending topics and hot news</li>
          <li>🔖 Save and bookmark your favorite articles</li>
          <li>📊 Track your reading history</li>
          <li>📧 Personalized email updates</li>
          <li>💬 Join discussions and comment on posts</li>
        </ul>
      </div>
      
      <p>This invitation will expire in 7 days, so don't wait!</p>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #F59E0B; font-size: 12px;">{{ .ConfirmationURL }}</p>
    </div>
    
    <div class="footer">
      <p><strong>Zenx Blog</strong> - Hot Topics & Trending News</p>
      <p style="font-size: 12px; color: #9CA3AF; margin-top: 20px;">
        © 2025 Zenx Blog. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
```

---

## 📝 How to Apply These Templates

### Step-by-Step Instructions:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/umfhehmdhiusxmyezdkk
   - Navigate to: **Authentication** → **Email Templates**

2. **For Each Template Type:**
   - Click on the template name (e.g., "Confirm signup")
   - Replace the **Subject** field with the subject line above
   - Replace the **Message (Body)** with the HTML code above
   - Click **Save**

3. **Available Template Types in Supabase:**
   - **Confirm signup** → Use Template #1
   - **Magic Link** → Use Template #2
   - **Change Email Address** → Use Template #4
   - **Reset Password** → Use Template #3
   - **Invite User** → Use Template #5 (if you use invitations)

### 🎨 Customization Options:

**Change Colors:**
- Blue gradient: `#3B82F6` → `#2563EB` (default)
- Purple gradient: `#8B5CF6` → `#7C3AED` (magic link)
- Red gradient: `#EF4444` → `#DC2626` (password reset)
- Green gradient: `#10B981` → `#059669` (email change)
- Orange gradient: `#F59E0B` → `#D97706` (invites)

**Add Your Logo:**
Add this inside the `<div class="header">` section:
```html
<img src="https://imzenx.in/logo.png" alt="Zenx Blog" style="height: 40px; margin-bottom: 10px;">
```

**Change Font:**
Replace the font-family in the `<style>` section with your preferred font.

### 🧪 Test Your Templates:

1. Create a test account to see the confirmation email
2. Request a password reset to see that template
3. Check how emails look on:
   - Desktop email clients (Gmail, Outlook)
   - Mobile devices (iOS Mail, Gmail app)
   - Dark mode vs light mode

### 📱 Mobile Responsive:

All templates are mobile-responsive! They will:
- Adjust width for small screens
- Stack content vertically
- Maintain readable font sizes
- Keep buttons easily tappable

---

## ✅ Supabase Template Variables

These variables are automatically replaced by Supabase:

- `{{ .ConfirmationURL }}` - The confirmation/action link
- `{{ .Token }}` - The verification token (if needed)
- `{{ .TokenHash }}` - Hashed token (if needed)
- `{{ .SiteURL }}` - Your site URL from Supabase settings
- `{{ .Email }}` - The recipient's email address

---

## 🎯 Pro Tips:

1. **Test Before Production**: Send test emails to yourself first
2. **Check Spam Folders**: Verify emails aren't marked as spam
3. **Mobile First**: Most users read emails on mobile
4. **Clear CTAs**: Make buttons obvious and easy to click
5. **Brand Consistency**: Match your website's colors and style
6. **Add Social Links**: Link to your social media profiles
7. **Legal Footer**: Include unsubscribe link if required

---

Your Supabase emails will now look professional and match your Zenx Blog branding! 🎨✨
