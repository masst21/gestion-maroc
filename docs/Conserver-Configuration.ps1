# Copy existing configuration only; do not modify the original installation or database.
param([string]$AncienneInstallation,[string]$NouvelleInstallation = (Join-Path $PSScriptRoot 'Mon Magasin'))
$ErrorActionPreference = 'Stop'
if (-not $AncienneInstallation) {
    $candidates = @(
      (Join-Path $env:LOCALAPPDATA 'Programs\Mon Magasin'),
      (Join-Path $env:ProgramFiles 'Mon Magasin'),
      (Join-Path ${env:ProgramFiles(x86)} 'Mon Magasin')
    ) | Where-Object { Test-Path (Join-Path $_ 'resources\app\server.js') }
    if (@($candidates).Count -eq 1) { $AncienneInstallation = @($candidates)[0] }
    else { $AncienneInstallation = Read-Host 'Dossier de votre ancienne installation Mon Magasin' }
}
$old = (Resolve-Path -LiteralPath $AncienneInstallation).Path
$new = (Resolve-Path -LiteralPath $NouvelleInstallation).Path
if ($old -eq $new) { throw 'Les deux installations doivent etre distinctes.' }
$source = Join-Path $old 'resources\app'
$dest = Join-Path $new 'resources\app'
if (!(Test-Path (Join-Path $source 'server.js')) -or !(Test-Path (Join-Path $dest 'server.js'))) { throw 'Serveur embarque introuvable. Aucun changement.' }
$files = @('.env','.env.local','.env.production','.env.production.local') | Where-Object { Test-Path -LiteralPath (Join-Path $source $_) -PathType Leaf }
foreach ($f in $files) {
    $line = Get-Content -LiteralPath (Join-Path $source $f) | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
    if ($line -and $line -notmatch '^\s*DATABASE_URL\s*=\s*["'']?postgres(?:ql)?://') { throw 'Base non PostgreSQL : arret sans modification.' }
    if (Test-Path -LiteralPath (Join-Path $dest $f)) { throw 'Configuration deja presente dans la nouvelle version. Aucun ecrasement autorise.' }
}
if ($env:DATABASE_URL -and $env:DATABASE_URL -notmatch '^postgres(?:ql)?://') { throw 'Base non PostgreSQL : arret sans modification.' }
if (-not $env:DATABASE_URL -and -not @($files | Where-Object { Select-String -LiteralPath (Join-Path $source $_) -Pattern '^\s*DATABASE_URL\s*=' -Quiet }).Count) { throw 'Connexion existante introuvable. Ne pas lancer la nouvelle version.' }
foreach ($f in $files) { Copy-Item -LiteralPath (Join-Path $source $f) -Destination (Join-Path $dest $f) -ErrorAction Stop }
Write-Host 'Configuration conservee sans afficher les identifiants.'
Write-Host 'Fermez Mon Magasin ancien, puis lancez Mon Magasin.exe dans le dossier de la nouvelle version.'
Write-Host 'Controlez les compteurs de ventes, clients et articles avant toute nouvelle saisie.'
