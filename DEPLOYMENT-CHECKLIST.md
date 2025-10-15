# 🚀 Zenx Blog - Quick Deployment Checklist

## ✅ Pre-Deployment Steps

- [ ] Test locally: `npm run dev` works properly
- [ ] All features working: Admin panel, AI generation, blog display
- [ ] Environment variables configured in `.env.local`
- [ ] Database tables created in Supabase
- [ ] API keys working (OpenAI & Gemini)

## 🛠️ Build & Export Steps

```bash
# 1. Build the application
npm run build

# 2. Export static files
npm run export

# 3. Check the 'out' folder is created with all files
```

## 📁 Upload to Hostinger

### Method 1: File Manager (Recommended)
1. **Login to Hostinger Control Panel**
2. **Open File Manager**
3. **Navigate to `public_html` folder**
4. **Delete any existing files** (backup first!)
5. **Upload ALL contents from `out/` folder**
6. **Create `.htaccess` file** (see DEPLOYMENT-GUIDE.md)

### Method 2: FTP/SFTP
```
Host: your-domain.com or IP address
Username: your_hostinger_username
Password: your_hostinger_password
Port: 21 (FTP) or 22 (SFTP)
```

## 🔧 Post-Upload Configuration

### 1. Create .htaccess file in public_html:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^([^.]+)$ $1.html [NC,L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

### 2. Update Supabase CORS settings:
- Add `https://imzenx.in` to allowed origins
- Add `https://*.imzenx.in` for subdomains

### 3. Environment Variables (if needed):
- Check if Hostinger supports environment variables
- Or use build-time environment variables

## 🧪 Testing After Deployment

- [ ] **Homepage loads**: https://imzenx.in
- [ ] **Admin panel**: https://imzenx.in/admin/
- [ ] **Blog posts display**: Navigation works
- [ ] **Mobile responsive**: Test on phone
- [ ] **SEO meta tags**: View page source
- [ ] **SSL certificate**: Green padlock in browser

## 🚨 Troubleshooting

### If pages show 404:
- Check `.htaccess` file is uploaded correctly
- Verify all HTML files are in root directory

### If admin panel doesn't work:
- Check if `admin/index.html` exists
- Verify Supabase connection works from live site

### If images don't load:
- Ensure `images.unoptimized: true` in next.config.js
- Check image paths are relative, not absolute

### If API calls fail:
- Static export doesn't support API routes
- Ensure all external API calls work (Supabase, OpenAI, etc.)

## 📈 SEO & Analytics Setup

### After deployment:
- [ ] Submit sitemap to Google Search Console
- [ ] Setup Google Analytics
- [ ] Configure Google AdSense
- [ ] Test Core Web Vitals
- [ ] Setup social media meta tags

## 🎉 Go Live Checklist

- [ ] Domain points to Hostinger
- [ ] SSL certificate installed
- [ ] All pages load correctly
- [ ] Admin functionality works  
- [ ] Blog generation works
- [ ] Mobile-friendly
- [ ] Fast loading times
- [ ] SEO optimized

## 📞 Need Help?

If deployment fails:
1. Check the DEPLOYMENT-GUIDE.md for detailed instructions
2. Contact Hostinger support for hosting-specific issues
3. Test locally first to ensure code works
4. Consider Vercel/Netlify as alternatives

Your blog will be live at: **https://imzenx.in** 🚀