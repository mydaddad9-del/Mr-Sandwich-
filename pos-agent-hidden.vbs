' pos-agent-hidden.vbs - Silent background launcher for Hybrid POS Print Agent
' Runs pos-agent.js in the background without showing any cmd prompt window.

Set WshShell = CreateObject("WScript.Shell")
currentDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = currentDir
WshShell.Run "node pos-agent.js", 0, False
Set WshShell = Nothing
