param(
    [switch]$DeployToRoot,
    [string]$TargetDir = ""
)

# deploy.ps1 — Builds Next.js frontend with safety backup for root SPA
# Usage: .\deploy.ps1 -DeployToRoot (to deploy to root with automatic backup)
#    or: .\deploy.ps1 -TargetDir "dist" (to deploy to a separate folder)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$FrontendDir = Join-Path $ProjectRoot "frontend"
$OutDir = Join-Path $FrontendDir "out"

if (-not $DeployToRoot -and [string]::IsNullOrWhiteSpace($TargetDir)) {
    Write-Host "`n⚠️  SAFETY NOTICE:" -ForegroundColor Yellow
    Write-Host "The project root contains the production hand-crafted luxury SPA (index.html, style.css, script.js)."
    Write-Host "To deploy Next.js build to root, run with: .\deploy.ps1 -DeployToRoot"
    Write-Host "To deploy to a separate folder, run with: .\deploy.ps1 -TargetDir 'dist'"
    exit 0
}

Write-Host "`n🔨 Building Next.js TypeScript frontend..." -ForegroundColor Cyan
Set-Location $FrontendDir
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Build failed. Aborting deploy." -ForegroundColor Red
    exit 1
}

Set-Location $ProjectRoot

if ($DeployToRoot) {
    $BackupDir = Join-Path $ProjectRoot "backups\pre_deploy_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Write-Host "`n💾 Creating safety backup of root SPA in $BackupDir..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    @("index.html", "admin.html", "style.css", "script.js", "admin.js", "catalog-data.js", "404.html") | ForEach-Object {
        if (Test-Path $_) { Copy-Item $_ -Destination $BackupDir -Force }
    }

    Write-Host "`n🗑️  Removing old deployed files from root..." -ForegroundColor Yellow
    @("index.html", "404.html", "index.txt") | ForEach-Object {
        Remove-Item $_ -Force -ErrorAction SilentlyContinue
    }
    Remove-Item "_next" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "admin" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "404" -Recurse -Force -ErrorAction SilentlyContinue

    Write-Host "`n📦 Deploying build output to project root..." -ForegroundColor Cyan
    Copy-Item -Path "$OutDir\*" -Destination $ProjectRoot -Recurse -Force
    Remove-Item $OutDir -Recurse -Force
    Write-Host "`n✅ Deploy complete! Root backup saved to $BackupDir" -ForegroundColor Green
} else {
    $Dest = Join-Path $ProjectRoot $TargetDir
    Write-Host "`n📦 Deploying build output to $Dest..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $Dest -Force | Out-Null
    Copy-Item -Path "$OutDir\*" -Destination $Dest -Recurse -Force
    Remove-Item $OutDir -Recurse -Force
    Write-Host "`n✅ Deploy complete to $Dest!" -ForegroundColor Green
}
