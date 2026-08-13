<#
  verify-docx-across-refs.ps1
  ----------------------------
  Purpose: a .docx is a BINARY file, so a git merge cannot 3-way it — a conflict is
  resolved by keeping ONE whole file. That is how a template fix silently vanishes when
  a ticket branch is merged into an env branch (int-env / stag-env): git keeps the env
  side, the fix is gone, and nothing checks the DESTINATION file before it reaches the BA.

  This script extracts word/document.xml from the SAME .docx at several git refs and
  diffs each env ref against the source-of-truth ref. It answers one question with
  bytes, not memory: "does the file on the branch the BA builds from actually carry
  the fix?"

  Run it at Phase-1 close for EVERY .docx touched, once per env branch it was merged to.

  Example:
    pwsh quest/verify-docx-across-refs.ps1 `
      -Repo "E:\Projects\Melaka\etanah-pelupusan" `
      -DocxPath "src/main/resources/template/MLK/TemplateSuratNilaianJPPH_PLTP_PSBS.docx" `
      -SourceRef "mlk/master" `
      -DestRefs "origin/mlk/int-env"

  Exit codes: 0 = dest matches source (or diffs all acknowledged by eye) ; 1 = DIFFERENCE FOUND (inspect).
#>
param(
  [Parameter(Mandatory=$true)][string]$Repo,
  [Parameter(Mandatory=$true)][string]$DocxPath,
  [Parameter(Mandatory=$true)][string]$SourceRef,
  [Parameter(Mandatory=$true)][string[]]$DestRefs
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem
$tmp = Join-Path $env:TEMP ("docx-verify-" + [guid]::NewGuid().ToString("N").Substring(0,8))
New-Item -ItemType Directory -Force -Path $tmp | Out-Null

function Get-DocumentXml([string]$ref) {
  $safe = ($ref -replace '[\\/:]','_')
  $docx = Join-Path $tmp "$safe.docx"
  Push-Location $Repo
  cmd /c "git show ${ref}:$DocxPath > `"$docx`"" 2>$null
  Pop-Location
  if (-not (Test-Path $docx) -or (Get-Item $docx).Length -eq 0) { return $null }
  $zip = [System.IO.Compression.ZipFile]::OpenRead($docx)
  $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
  if (-not $entry) { $zip.Dispose(); return $null }
  $reader = New-Object System.IO.StreamReader($entry.Open())
  $xml = $reader.ReadToEnd(); $reader.Close(); $zip.Dispose()
  # normalise: one tag per line so diff is readable
  return ($xml -replace '><', ">`n<")
}

Write-Output "════ docx destination-verify ════"
Write-Output "  file   : $DocxPath"
Write-Output "  source : $SourceRef (source of truth)"
Write-Output ""

$srcXml = Get-DocumentXml $SourceRef
if ($null -eq $srcXml) { Write-Output "🚨 could not read $DocxPath at $SourceRef"; exit 1 }
$srcFile = Join-Path $tmp "SOURCE.xml"; Set-Content -Path $srcFile -Value $srcXml -Encoding UTF8

$anyDiff = $false
foreach ($ref in $DestRefs) {
  $destXml = Get-DocumentXml $ref
  if ($null -eq $destXml) { Write-Output "🚨 [$ref] could not read $DocxPath"; $anyDiff = $true; continue }
  $destFile = Join-Path $tmp (($ref -replace '[\\/:]','_') + ".xml"); Set-Content -Path $destFile -Value $destXml -Encoding UTF8
  $diff = Compare-Object (Get-Content $srcFile) (Get-Content $destFile)
  if ($null -eq $diff) {
    Write-Output "✓ [$ref] document.xml IDENTICAL to $SourceRef — fix present"
  } else {
    $anyDiff = $true
    $n = ($diff | Measure-Object).Count
    Write-Output "🚨 [$ref] DIFFERS from $SourceRef — $n differing line(s). Every diff must be explained (legit env delta vs DROPPED FIX):"
    $diff | ForEach-Object {
      $side = if ($_.SideIndicator -eq '<=') { "source-only" } else { "$ref-only  " }
      Write-Output ("    [$side] " + $_.InputObject.Trim())
    } | Select-Object -First 60
  }
}

Write-Output ""
if ($anyDiff) { Write-Output "VERDICT: 🚨 differences found — do NOT declare shipped until each is confirmed intended."; exit 1 }
else { Write-Output "VERDICT: ✓ all destination refs carry the source file."; exit 0 }
