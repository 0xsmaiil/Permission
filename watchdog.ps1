param(
  [int]$MaxIterations = 100,
  [string]$Model = "opencode/deepseek-v4-flash-free",
  [string]$CheckpointFile = "CHECKPOINT.md",
  [int]$IterationDelay = 10
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Permission Auto-Improvement Watchdog" -ForegroundColor Cyan
Write-Host "  Model: $Model" -ForegroundColor Cyan
Write-Host "  Max iterations: $MaxIterations" -ForegroundColor Cyan
Write-Host "  Delay between runs: ${IterationDelay}s" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

for ($i = 1; $i -le $MaxIterations; $i++) {
  $checkpoint = if (Test-Path $CheckpointFile) { Get-Content $CheckpointFile -Raw } else { "No checkpoint found" }

  $prompt = @"
You are an autonomous improvement agent.

## Instructions
1. Read the CHECKPOINT.md file below to understand current state.
2. Execute the **first** task in the Pending list. Do ONE task only.
3. After completing it, verify with: npx tsc --noEmit && npx vitest run
4. Update CHECKPOINT.md: move the completed task from Pending to Completed. Add any new tasks discovered.
5. Report what was done. Then stop.

## Current CHECKPOINT.md State
$checkpoint
"@

  Write-Host "[$i/$MaxIterations] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') Starting iteration..." -ForegroundColor Green

  opencode run --model $Model --auto $prompt 2>&1
  $exit = $LASTEXITCODE

  if ($exit -eq 0) {
    Write-Host "[$i/$MaxIterations] Iteration completed successfully." -ForegroundColor Green
  } else {
    Write-Host "[$i/$MaxIterations] Exit code: $exit (may be OOM or error)" -ForegroundColor Yellow
  }

  # Read updated checkpoint to verify state was changed
  if (Test-Path $CheckpointFile) {
    $updated = Get-Content $CheckpointFile -Raw
    $pendingCount = ($updated | Select-String -Pattern "^\d+\. \*\*" -AllMatches).Matches.Count
    Write-Host "[$i/$MaxIterations] Remaining pending tasks: $pendingCount" -ForegroundColor Cyan
  }

  Write-Host "[$i/$MaxIterations] Waiting ${IterationDelay}s before next iteration..." -ForegroundColor Gray
  Start-Sleep -Seconds $IterationDelay
}

Write-Host "Watchdog: Reached max iterations ($MaxIterations). Exiting." -ForegroundColor Magenta
