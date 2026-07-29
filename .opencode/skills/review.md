# Code Review Skill

When the user asks you to review code, review changes, or check for bugs:

1. Run the reviewer subagent via bash:
   ```bash
   opencode run --model logfare/kimi-k2.7-code --no-stream "review the current git diff in this project for bugs, logic errors, security issues, and edge cases. Provide a structured report with severity levels (Critical, Warning, Optimization) and suggested fixes."
   ```

2. Read the reviewer's full output from the command result.

3. Analyze each finding and fix valid issues directly.

4. Report back to the user what was found and what was fixed.
