# Zenx Blog - Quick Vercel Deployment Script
# Run this script to deploy your blog to production

Write-Host "🚀 Zenx Blog - Vercel Deployment Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "Checking Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    Write-Host "✅ Vercel CLI installed!" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI found!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Running production build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed! Fix errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🌐 Ready to deploy!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choose deployment option:" -ForegroundColor Yellow
Write-Host "1. Deploy to preview (test deployment)" -ForegroundColor White
Write-Host "2. Deploy to production (live site)" -ForegroundColor White
Write-Host "3. Cancel" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🔍 Deploying to preview..." -ForegroundColor Yellow
        vercel
        Write-Host ""
        Write-Host "✅ Preview deployment complete!" -ForegroundColor Green
        Write-Host "Test your site at the provided URL" -ForegroundColor Cyan
    }
    "2" {
        Write-Host ""
        Write-Host "🚀 Deploying to production..." -ForegroundColor Yellow
        vercel --prod
        Write-Host ""
        Write-Host "✅ Production deployment complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 POST-DEPLOYMENT CHECKLIST:" -ForegroundColor Cyan
        Write-Host "1. Add environment variables in Vercel dashboard" -ForegroundColor White
        Write-Host "2. Update NEXT_PUBLIC_SITE_URL to your production URL" -ForegroundColor White
        Write-Host "3. Update NEXTAUTH_URL to your production URL" -ForegroundColor White
        Write-Host "4. Update Supabase redirect URLs" -ForegroundColor White
        Write-Host "5. Test admin login at /admin" -ForegroundColor White
        Write-Host "6. Apply for Google AdSense" -ForegroundColor White
        Write-Host ""
        Write-Host "📖 See PRODUCTION_DEPLOY.md for detailed instructions" -ForegroundColor Yellow
    }
    "3" {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "Invalid choice. Deployment cancelled." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Deployment process complete!" -ForegroundColor Green
Write-Host ""
