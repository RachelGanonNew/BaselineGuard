Param()

Write-Host "Attempting to install circom compiler (local npm package)..."
Write-Host "If this fails, please install circom manually from https://docs.circom.io/getting-started/ or use the docker image." -ForegroundColor Yellow

Write-Host "Installing circom-compiler as a convenience..."
try {
    npm i -D circom-compiler | Out-Host
} catch {
    Write-Host "npm install failed; please install circom manually or use docker" -ForegroundColor Red
}

Write-Host "Done. Try: npx circom --version" -ForegroundColor Green
