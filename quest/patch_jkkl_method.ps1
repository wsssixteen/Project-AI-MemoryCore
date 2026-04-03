$path = 'E:\Projects\Melaka\etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\constant\PelupusanExtraParamMethodConstant.java'
$content = [System.IO.File]::ReadAllText($path)

$old = "`tprotected String populateKeputusanJKKL(final Aplikasi aplikasi, final AppTugasan apptugasan, final AppLangkah applangkah) {`r`n`t`t`r`n`t`t`r`n`t`t`r`n`t`treturn `"`";`r`n`t}"

$new = "`tprotected String populateKeputusanJKKL(final Aplikasi aplikasi, final AppTugasan apptugasan, final AppLangkah applangkah) {`r`n`t`tAppPelupusan aplp = SpringUtil.lookupBean(AppPelupusanRepository.class).findByAplikasi(aplikasi);`r`n`t`tif (aplp == null) {`r`n`t`t`treturn StringAndCharacterConstant.HYPHEN;`r`n`t`t}`r`n`t`tString keputusanJKKL = DynamicFieldUtil.getDynamicFieldAsString(aplp.getMaklumatTambahan(), PelupusanConstant.KEY_KEPUTUSAN_JKKL);`r`n`t`treturn StringUtils.isNotBlank(keputusanJKKL) ? `"true`" : `"false`";`r`n`t}"

if ($content.Contains($old)) {
    $updated = $content.Replace($old, $new)
    [System.IO.File]::WriteAllText($path, $updated)
    Write-Host 'REPLACED OK'
} else {
    Write-Host 'NOT FOUND'
    # Debug: count blank lines inside the method
    $lines = $content -split "`r`n"
    $idx = $lines | Select-String -Pattern 'protected String populateKeputusanJKKL' | Select-Object -First 1 -ExpandProperty LineNumber
    Write-Host "Method found at line: $idx"
    for ($i = $idx - 1; $i -lt [Math]::Min($idx + 8, $lines.Count); $i++) {
        $escaped = $lines[$i] -replace "`t", '<TAB>' -replace "`r", '<CR>'
        Write-Host "  [$i] $escaped"
    }
}
