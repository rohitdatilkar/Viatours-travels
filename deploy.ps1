# deploy.ps1 — Builds the Next.js TypeScript frontend and deploys to project root for GitHub Pages
# Usage: .\deploy.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$FrontendDir = Join-Path $ProjectRoot "frontend"
$OutDir = Join-Path $FrontendDir "out"

Write-Host "`n🔨 Building Next.js TypeScript frontend..." -ForegroundColor Cyan
Set-Location $FrontendDir
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Build failed. Aborting deploy." -ForegroundColor Red
    exit 1
}

Write-Host "`n🗑️  Removing old deployed files from root..." -ForegroundColor Yellow
Set-Location $ProjectRoot

# Remove old Next.js output (HTML pages and _next/ chunks)
@("index.html", "404.html", "index.txt") | ForEach-Object {
    Remove-Item $_ -Force -ErrorAction SilentlyContinue
}
Remove-Item "_next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "admin" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "404" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "`n📦 Deploying build output to project root..." -ForegroundColor Cyan
Copy-Item -Path "$OutDir\*" -Destination $ProjectRoot -Recurse -Force
Remove-Item $OutDir -Recurse -Force

Write-Host "`n✅ Deploy complete! Project root now serves the TypeScript-built site." -ForegroundColor Green
Write-Host "   → index.html  (Home page — Next.js compiled)"
Write-Host "   → admin/      (Admin portal — Next.js compiled)"
Write-Host "   → 404.html    (Error page — Next.js compiled)"
Write-Host "   → _next/      (Compiled JS/CSS chunks)"
Write-Host "`n🚀 Commit and push to GitHub Pages to go live."
