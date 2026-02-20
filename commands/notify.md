# /notify — Send to all PAI channels

Send a message to herbert via Email, ntfy, and Telegram simultaneously.

## When to use

Run this command whenever:
- A milestone or task is complete
- A report or summary needs to be delivered
- Any notification should reach herbert

## Usage

```
/notify [title] | [message]
/notify          ← prompts for title and message
```

## Behavior

When this command is invoked:

1. Extract `title` and `message` from `$ARGUMENTS` (format: `Title | Message body`)
2. If no arguments given, ask herbert for title and message
3. Run: `bun ~/.claude/skills/PAI/Tools/Notify.ts --title "TITLE" --message "MESSAGE"`
4. Report the results of all 3 channels

## Channels

| Channel | Destination |
|---------|-------------|
| Email   | herboko@gmail.com |
| ntfy    | atompa-pai-sendbote |
| Telegram | chat_id 83283230 |

## Example

```bash
bun ~/.claude/skills/PAI/Tools/Notify.ts \
  --title "Build Complete" \
  --message "The Docker image has been built and pushed to registry."
```

## Rules

- ALWAYS send to ALL 3 channels — never just one
- Credentials are auto-loaded from ~/.env — never hardcode them
- Never write inline send code — always use Notify.ts
