' run-hidden.vbs - the scheduled launcher for protime-plan.js, with NO console window.
' Waits for node and returns its exit code, so Task Scheduler sees a failure and retries.
Dim sh, fso, here, nodeExe
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
here = fso.GetParentFolderName(WScript.ScriptFullName)
nodeExe = "C:\Program Files\nodejs\node.exe"
WScript.Quit sh.Run("""" & nodeExe & """ """ & here & "\protime-plan.js"" --live --once-per-week --notify", 0, True)
