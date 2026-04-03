Add-Type -AssemblyName System.IO.Compression.FileSystem

function Read-DocxTags([string]$path) {
    try {
        $zip = [System.IO.Compression.ZipFile]::OpenRead($path)
        $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
        $reader = New-Object System.IO.StreamReader($entry.Open())
        $xml = $reader.ReadToEnd()
        $reader.Close()
        $zip.Dispose()
        $pattern = 'w:tag w:val="([^"]+)"'
        $matches = [regex]::Matches($xml, $pattern)
        return ($matches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
    } catch {
        return @("ERR: $_")
    }
}

$r   = 'C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\1. Tasks\Melaka\4. 246 512 - PPJK - Penambahbaikan Skrin dan Template Risalat MMKN PDT & PTG\0. Resources'
$m   = 'E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK'

$files = [ordered]@{
    '=== NEW from QA ==='              = $null
    'PDT_LULUS'                        = "$r\PPJK_RISALAT MMKN PDT - LULUS.docx"
    'PDT_TOLAK'                        = "$r\PPJK_RISALAT MMKN PDT - TOLAK.docx"
    'PTG_LULUS'                        = "$r\PPJK_RISALAT MMKN PTG - LULUS.docx"
    'PTG_TOLAK'                        = "$r\PPJK_RISALAT MMKN PTG - TOLAK.docx"
    'RINGKASAN_JKKL'                   = "$r\RINGKASAN RISALAT - JIKA ADA JKKL.docx"
    'RINGKASAN_TIADA_JKKL'             = "$r\RINGKASAN RISALAT - TIADA JKKL.docx"
    '=== EXISTING (codebase) ==='      = $null
    'TemplateRisalatMMKN_PDT_PPJK'     = "$m\TemplateRisalatMMKN_PDT_PPJK.docx"
    'TemplateRisalatMMKNSyarikat_PDT_PPJK' = "$m\TemplateRisalatMMKNSyarikat_PDT_PPJK.docx"
    'TemplateRingkasanRisalatPPJK'     = "$m\TemplateRingkasanRisalatPPJK.docx"
}

foreach ($name in $files.Keys) {
    $path = $files[$name]
    if ($null -eq $path) {
        Write-Host ""
        Write-Host "---------- $name ----------"
        continue
    }
    Write-Host ""
    Write-Host "[$name]"
    $tags = Read-DocxTags $path
    if ($tags.Count -eq 0) {
        Write-Host "  (no CC tags)"
    } else {
        $tags | ForEach-Object { Write-Host "  $_" }
    }
}
