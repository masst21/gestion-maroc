#Requires -RunAsAdministrator
param([Parameter(Mandatory)][string]$ConfigFile,[Parameter(Mandatory)][ValidateSet('new','existing')][string]$Mode)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$target=Join-Path $env:ProgramFiles 'Mon Magasin Serveur'
$private=Join-Path $env:ProgramData 'MonMagasinServer'
$name='MonMagasinServer'
if ((Test-Path $target) -or (Test-Path $private) -or (Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue)) { throw 'Installation existante : aucune écriture, utilisez une procédure de mise à niveau dédiée.' }
if (!(Test-Path $ConfigFile -PathType Leaf)) { throw 'Configuration absente.' }
$node=Join-Path $root 'runtime\node.exe'
if (!(Test-Path $node)) { throw 'Runtime Node manquant.' }
if (!(Get-Command psql -ErrorAction SilentlyContinue)) { throw 'Installez les outils clients PostgreSQL et ajoutez psql au PATH.' }
New-Item -ItemType Directory -Path $private | Out-Null
& icacls $private /inheritance:r /grant:r '*S-1-5-32-544:(OI)(CI)F' '*S-1-5-18:(OI)(CI)F' '*S-1-5-19:(OI)(CI)RX' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Protection du dossier impossible.' }
$cfg=Join-Path $private 'server.env'
Copy-Item -LiteralPath $ConfigFile -Destination $cfg
New-Item -ItemType Directory -Path $target | Out-Null
Get-ChildItem -LiteralPath $root -Force | Copy-Item -Destination $target -Recurse -Force
& icacls $target /inheritance:r /grant:r '*S-1-5-32-544:(OI)(CI)F' '*S-1-5-18:(OI)(CI)F' '*S-1-5-19:(OI)(CI)RX' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Protection de l’application impossible.' }
$cache=Join-Path $target 'app\.next\cache'
New-Item -ItemType Directory -Path $cache -Force | Out-Null
& icacls $cache /grant:r '*S-1-5-19:(OI)(CI)M' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Dossier cache non accessible.' }
$node=Join-Path $target 'runtime\node.exe'
& $node (Join-Path $target 'setup-server.cjs') $cfg $Mode
if ($LASTEXITCODE -ne 0) { throw 'Initialisation non validée. Aucun démarrage automatique enregistré.' }
# Task Scheduler is an automatic startup option, not a native SCM service.
$action=New-ScheduledTaskAction -Execute $node -Argument ('"'+(Join-Path $target 'start-server.cjs')+'" "'+$cfg+'"') -WorkingDirectory $target
$trigger=New-ScheduledTaskTrigger -AtStartup
$principal=New-ScheduledTaskPrincipal -UserId 'S-1-5-19' -LogonType ServiceAccount -RunLevel Limited
$settings=New-ScheduledTaskSettingsSet -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -StartWhenAvailable
Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Principal $principal -Settings $settings | Out-Null
Start-ScheduledTask -TaskName $name
Write-Host 'Démarrage automatique enregistré (tâche planifiée). Vérifiez http://127.0.0.1:3010/login ou le port configuré.'
