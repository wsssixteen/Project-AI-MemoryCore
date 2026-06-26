$ErrorActionPreference = 'Stop'
$target = 'JabatanTeknikal.docx'
try {
    $word = [System.Runtime.InteropServices.Marshal]::GetActiveObject('Word.Application')
} catch {
    Write-Output ("NO_WORD_COM: " + $_.Exception.Message)
    exit 0
}
$hit = $null
foreach ($d in @($word.Documents)) { if ($d.Name -eq $target) { $hit = $d } }
if ($hit) {
    $wasDirty = -not $hit.Saved
    if ($wasDirty) { $hit.Save() }
    $hit.Close()
    Write-Output ("CLOSED: $target (was dirty=$wasDirty -> saved+closed)")
    Write-Output ("Remaining open docs: " + (@($word.Documents).Count))
} else {
    Write-Output ("NOT_OPEN: $target is not among the open Word documents")
}
