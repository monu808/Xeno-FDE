# Quick Vercel Deployment Script

Write-Host "=== Xeno FDE Vercel Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host ""
Write-Host "Step 1: Deploying Backend..." -ForegroundColor Green
Set-Location backend

Write-Host "Running vercel (follow the prompts)..." -ForegroundColor Yellow
vercel

Write-Host ""
Write-Host "Setting environment variables..." -ForegroundColor Yellow
Write-Host "You'll need to add these in Vercel dashboard or via CLI:"
Write-Host "- DATABASE_URL" -ForegroundColor Cyan
Write-Host "- SHOPIFY_API_KEY" -ForegroundColor Cyan
Write-Host "- SHOPIFY_API_SECRET" -ForegroundColor Cyan
Write-Host "- SHOPIFY_API_VERSION" -ForegroundColor Cyan
Write-Host "- APP_BASE_URL" -ForegroundColor Cyan
Write-Host "- SESSION_SECRET" -ForegroundColor Cyan

$addEnv = Read-Host "Add environment variables now? (y/n)"
if ($addEnv -eq 'y') {
    vercel env add DATABASE_URL
    vercel env add SHOPIFY_API_KEY
    vercel env add SHOPIFY_API_SECRET
    vercel env add SHOPIFY_API_VERSION
    vercel env add APP_BASE_URL
    vercel env add SESSION_SECRET
}

Write-Host ""
$deployProd = Read-Host "Deploy to production? (y/n)"
if ($deployProd -eq 'y') {
    vercel --prod
}

Write-Host ""
Write-Host "Step 2: Deploying Dashboard..." -ForegroundColor Green
Set-Location ../dashboard

Write-Host "Running vercel..." -ForegroundColor Yellow
vercel

Write-Host ""
Write-Host "Setting NEXT_PUBLIC_BACKEND_URL..." -ForegroundColor Yellow
$backendUrl = Read-Host "Enter your backend URL (e.g., https://xeno-fde-backend.vercel.app)"
if ($backendUrl) {
    Write-Host $backendUrl | vercel env add NEXT_PUBLIC_BACKEND_URL
}

Write-Host ""
$deployDashProd = Read-Host "Deploy dashboard to production? (y/n)"
if ($deployDashProd -eq 'y') {
    vercel --prod
}

Write-Host ""
Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update Shopify app URLs at https://partners.shopify.com/" -ForegroundColor Cyan
Write-Host "2. Test backend health: YOUR-BACKEND-URL/health" -ForegroundColor Cyan
Write-Host "3. Test OAuth: YOUR-BACKEND-URL/auth/start?shop=xeno-test-store-5.myshopify.com" -ForegroundColor Cyan
Write-Host "4. Open dashboard: YOUR-DASHBOARD-URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "See VERCEL_DEPLOYMENT.md for detailed instructions" -ForegroundColor Yellow

Set-Location ..
