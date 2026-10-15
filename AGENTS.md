# Agent Instructions & Workflow Rules

- **Autonomous Execution**: Proactively execute terminal commands (builds, package installs, syntax checks, scripts) directly without asking the user for permission in chat first.
- **No Confirmation Prompts**: Do not ask "Would you like me to run this command?" or ask for confirmation before running routine tasks. Run them immediately and report the result.
- **No Auto-Commits or Auto-Pushes**: Never run `git commit` or `git push` automatically. Only stage, commit, or push changes when explicitly requested by the user.
