$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$filmRoot = Split-Path $PSScriptRoot -Parent
$filmAudio = Join-Path $filmRoot 'tmp\film'
New-Item -ItemType Directory -Force -Path $filmAudio | Out-Null
$filmScenes = Get-Content (Join-Path $PSScriptRoot 'film-scenes.json') -Raw | ConvertFrom-Json
$filmNarrator = New-Object System.Speech.Synthesis.SpeechSynthesizer
$filmNarrator.SelectVoice('Microsoft Zira Desktop')
$filmNarrator.Rate = 0
for ($filmIndex = 0; $filmIndex -lt $filmScenes.Count; $filmIndex++) {
  $filmNarrator.SetOutputToWaveFile((Join-Path $filmAudio "$filmIndex.wav"))
  $filmNarrator.Speak($filmScenes[$filmIndex].voice)
}
$filmNarrator.Dispose()
Write-Output 'Nine local synthetic narration clips generated.'
