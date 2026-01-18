# Global Agent Guidance

## AskUserQuestion Tool (tb__ask_user)

When facing uncertainty or before taking significant actions, use the `tb__ask_user` tool to ask for user confirmation.

### When to use this tool:
- Before making significant code changes with multiple valid approaches
- When requirements are ambiguous or unclear
- Before destructive operations (deleting files, overwriting configs)
- When choosing between different architectures or patterns
- Before committing or pushing code
- When debugging and multiple root causes are possible

### How to use:
1. Formulate a clear, specific question
2. Provide at least 2 options with labels and descriptions
3. Include context explaining why you're asking
4. Wait for user selection before proceeding
5. Tool returns JSON with `status`, `prompt`, and `answer_format` (see ASK_USER.md for details)

### Example usage:
```json
{
  "question": "How should I implement the authentication system?",
  "context": "The codebase doesn't have existing auth patterns to follow.",
  "options": [
    {"label": "JWT tokens", "description": "Stateless, good for APIs"},
    {"label": "Session cookies", "description": "Traditional, good for web apps"},
    {"label": "OAuth2 only", "description": "Delegate auth to external providers"}
  ]
}
```
