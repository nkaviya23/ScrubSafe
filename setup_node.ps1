$ErrorActionPreference = 'Stop'
$zipUrl = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip"
$destDir = "C:\Users\sivac\nodejs"
$zipFile = "C:\Users\sivac\node.zip"

if (-not (Test-Path $destDir)) {
    Write-Host "Downloading Node.js v20.18.0..."
    curl.exe -L -o $zipFile $zipUrl
    Write-Host "Extracting..."
    Expand-Archive -Path $zipFile -DestinationPath "C:\Users\sivac" -Force
    Rename-Item -Path "C:\Users\sivac\node-v20.18.0-win-x64" -NewName "nodejs" -Force
    Remove-Item $zipFile -Force
}

# Permanently add to User PATH if not already present
$userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$destDir*") {
    [System.Environment]::SetEnvironmentVariable("Path", "$destDir;$userPath", "User")
}

Write-Host "Node version:"
& "$destDir\node.exe" -v
Write-Host "NPM version:"
& "$destDir\npm.cmd" -v
