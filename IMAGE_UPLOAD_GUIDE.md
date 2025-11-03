# Image Upload Feature - Setup & Usage Guide

## ✨ Feature Overview

The manual blog editor now supports **direct image uploads** to Supabase Storage, eliminating the need to host images externally. You can either:

1. **Upload images directly** - Drag & drop or click to upload (recommended)
2. **Paste image URLs** - Use external image URLs (legacy method)

---

## 🚀 Setup Instructions

### Step 1: Create Supabase Storage Bucket

You need to create the `blog-images` storage bucket in your Supabase project.

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `umfhehmdhiusxmyezdkk`
3. Click **Storage** in the left sidebar
4. Click **New Bucket**
5. Enter bucket details:
   - **Name**: `blog-images`
   - **Public bucket**: ✅ Enabled (checked)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp, image/gif`
6. Click **Create bucket**

**Option B: Using SQL Editor**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy and paste contents from `src/database/storage-setup.sql`
6. Click **Run** or press `Ctrl+Enter`

### Step 2: Verify Storage Policies

The SQL script automatically creates these policies:

✅ **Public Access** - Anyone can view/download images  
✅ **Authenticated Upload** - Logged-in users can upload  
✅ **Update Own Images** - Users can update their uploads  
✅ **Delete Own Images** - Users can delete their uploads  

Admins have full access via service role key (no additional setup needed).

### Step 3: Test the Upload

1. Go to `/admin` and login
2. Click "✏️ Write Manually"
3. Scroll to "Featured Image" section
4. Try uploading an image
5. Verify it appears in Supabase Storage dashboard

---

## 💡 Usage Guide

### For Blog Authors

#### Method 1: Upload Image (Recommended)

1. In the manual blog editor, find the **Featured Image** section
2. Click the upload area or drag & drop an image file
3. Supported formats: **JPEG, PNG, WebP, GIF**
4. Maximum size: **5MB**
5. Wait for upload to complete (progress bar shows %)
6. Image preview appears automatically
7. Image URL is automatically set

**Benefits:**
- ✅ Images stored in your Supabase account
- ✅ No external dependencies
- ✅ Fast CDN delivery
- ✅ Automatic optimization
- ✅ No broken image links

#### Method 2: Paste URL (Legacy)

1. Find any image online
2. Right-click → Copy image address
3. Paste URL in the "Paste image URL" field
4. Image preview appears if URL is valid

**Drawbacks:**
- ❌ External link may break
- ❌ Slower loading
- ❌ No control over image
- ❌ May violate copyright

### Managing Uploaded Images

**View All Uploads:**
1. Go to Supabase Dashboard → Storage → blog-images
2. Browse all uploaded images
3. Copy public URL if needed
4. Download originals
5. Delete unused images

**Remove Image from Post:**
1. In the editor, click **Remove** button next to preview
2. This only removes from the post, not from storage

**Delete from Storage:**
1. Go to Supabase Dashboard → Storage → blog-images
2. Select image(s)
3. Click **Delete**

---

## 🔧 Technical Details

### API Endpoint

**POST** `/api/admin/upload-image`

**Authentication:** Admin session required

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field

**Response (Success):**
```json
{
  "success": true,
  "url": "https://umfhehmdhiusxmyezdkk.supabase.co/storage/v1/object/public/blog-images/blog-1234567890-abc123.jpg",
  "fileName": "blog-1234567890-abc123.jpg",
  "fileSize": 245678,
  "fileType": "image/jpeg"
}
```

**Response (Error):**
```json
{
  "error": "File too large. Maximum size is 5MB."
}
```

### File Naming Convention

Uploaded files are automatically renamed to prevent conflicts:

**Pattern:** `blog-{timestamp}-{random}.{ext}`

**Example:** `blog-1699999999999-x7k2m9p4q.jpg`

**Benefits:**
- Prevents filename collisions
- Chronological sorting
- URL-safe filenames
- Preserves file extension

### Validation Rules

**Client-Side (AdminDashboard.tsx):**
- ✅ File type check
- ✅ File size check (5MB)
- ✅ Progress feedback
- ✅ Error notifications

**Server-Side (upload-image/route.ts):**
- ✅ Admin authentication required
- ✅ MIME type validation
- ✅ File size limit enforcement (5MB)
- ✅ Secure file handling
- ✅ Error logging

**Storage Level (Supabase):**
- ✅ Public read access
- ✅ Authenticated upload only
- ✅ RLS policies enforced
- ✅ File size limit: 5MB
- ✅ Allowed types: JPEG, PNG, WebP, GIF

---

## 📊 Storage Management

### Check Storage Usage

**Supabase Dashboard:**
1. Go to Project Settings → Storage
2. View total storage used
3. Check file count
4. Monitor bandwidth

**Free Tier Limits:**
- Storage: 1 GB
- Bandwidth: 2 GB/month
- After limits: Pay-as-you-go pricing

### Optimize Storage

**Best Practices:**
1. **Compress images before upload**
   - Use tools like TinyPNG, Squoosh, or ImageOptim
   - Target: 100-300 KB per image
   
2. **Use WebP format**
   - Modern browsers support WebP
   - 25-35% smaller than JPEG/PNG
   - Better quality at same size
   
3. **Delete unused images**
   - Periodically clean up old images
   - Remove images from unpublished drafts
   
4. **Use appropriate dimensions**
   - Blog featured images: 1200x630px (Facebook OG standard)
   - Content images: Max 1000px width
   - Don't upload 4K images

### Cleanup Script (Future Enhancement)

```typescript
// Delete images older than 90 days with no blog post reference
// Run this periodically to free up storage
```

---

## 🎨 Image Recommendations

### Featured Image Specs

**Optimal Dimensions:**
- Width: 1200px
- Height: 630px
- Aspect Ratio: 1.91:1

**Why?**
- Facebook/Twitter Open Graph standard
- Perfect for social media previews
- Responsive across all devices

**File Size:**
- Target: 100-300 KB
- Maximum: 5 MB (enforced)
- Sweet spot: 150-200 KB

**Format Priority:**
1. **WebP** - Best compression, modern browsers
2. **JPEG** - Universal support, good for photos
3. **PNG** - Transparency support, larger files
4. **GIF** - Animations only (avoid for static)

### Content Images

**In-article images:**
- Max width: 800-1000px
- Compress to < 100 KB each
- Use descriptive filenames
- Add alt text for SEO

---

## 🔐 Security Considerations

### What's Protected

✅ **Upload restricted to admins** - Only authenticated admin users can upload  
✅ **File type validation** - Only images allowed (JPEG, PNG, WebP, GIF)  
✅ **File size limits** - Maximum 5MB prevents abuse  
✅ **Filename sanitization** - Prevents path traversal attacks  
✅ **Public read-only** - Users can view but not modify  

### What to Watch

⚠️ **Storage quota** - Free tier has 1GB limit  
⚠️ **Bandwidth costs** - Popular images can consume bandwidth  
⚠️ **NSFW content** - Manually moderate uploaded images  
⚠️ **Copyright** - Only upload images you have rights to  

### Rate Limiting (Future Enhancement)

Consider implementing:
- Max uploads per hour: 20
- Max uploads per day: 100
- Duplicate file detection
- Image moderation queue

---

## 🐛 Troubleshooting

### "Unauthorized - Admin access required"

**Cause:** Not logged in as admin or session expired

**Solution:**
1. Go to `/admin/login`
2. Login with admin credentials
3. Try upload again

### "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed."

**Cause:** Trying to upload unsupported file format

**Solution:**
1. Convert file to JPEG, PNG, WebP, or GIF
2. Use online converters like CloudConvert
3. Try upload again

### "File too large. Maximum size is 5MB."

**Cause:** File exceeds 5MB limit

**Solution:**
1. Compress image using TinyPNG or Squoosh
2. Reduce image dimensions
3. Convert to WebP format
4. Try upload again

### "Failed to upload image"

**Possible Causes:**
- Supabase storage bucket not created
- Storage policies not set
- Network connection issue
- Supabase service down

**Solution:**
1. Verify bucket exists in Supabase Dashboard
2. Check storage policies are enabled
3. Check browser console for errors
4. Try again in a few minutes

### Upload stuck at 90%

**Cause:** Network issue or large file

**Solution:**
1. Wait 30 seconds - might still complete
2. Cancel and retry with smaller file
3. Check internet connection
4. Try different browser

### Image preview not showing

**Cause:** Invalid URL or broken link

**Solution:**
1. Re-upload the image
2. Check URL is correct and public
3. Try opening URL directly in browser
4. Use upload method instead of URL

---

## 📈 Future Enhancements

### Planned Features

- [ ] **Drag & drop** - Drag images directly into upload area (partially done)
- [ ] **Multiple uploads** - Upload multiple images at once
- [ ] **Image editor** - Crop, resize, rotate before upload
- [ ] **Gallery view** - Browse previously uploaded images
- [ ] **Image search** - Search uploads by filename or date
- [ ] **Auto-compression** - Automatically optimize on upload
- [ ] **WebP conversion** - Auto-convert to WebP format
- [ ] **Alt text editor** - Add alt text during upload for SEO
- [ ] **Thumbnail generation** - Auto-create thumbnails
- [ ] **Usage tracking** - See which images are used where

### Integration Ideas

- [ ] Unsplash integration - Search free stock photos
- [ ] Pixabay integration - More free images
- [ ] DALL-E integration - AI-generated images
- [ ] Image CDN - Use Cloudflare Images for optimization
- [ ] Lazy loading - Improve page load performance

---

## 📚 Related Documentation

- **Manual Blog Guide**: `MANUAL_BLOG_GUIDE.md`
- **Manual Blog Summary**: `MANUAL_BLOG_SUMMARY.md`
- **Supabase Setup**: `SUPABASE_AUTH_SETUP.md`
- **Deployment Guide**: `DEPLOYMENT_READY.md`

---

## 📞 Support

### Quick Links

**Supabase Dashboard:**
https://supabase.com/dashboard/project/umfhehmdhiusxmyezdkk

**Storage Bucket:**
https://supabase.com/dashboard/project/umfhehmdhiusxmyezdkk/storage/buckets/blog-images

**SQL Editor:**
https://supabase.com/dashboard/project/umfhehmdhiusxmyezdkk/sql/new

### Common URLs

**Public Image URL Format:**
```
https://umfhehmdhiusxmyezdkk.supabase.co/storage/v1/object/public/blog-images/{filename}
```

**Example:**
```
https://umfhehmdhiusxmyezdkk.supabase.co/storage/v1/object/public/blog-images/blog-1699999999999-x7k2m9p4q.jpg
```

---

**Status**: ✅ Production Ready  
**Last Updated**: November 2024  
**Version**: 1.0.0

🎉 **Happy Uploading!**
