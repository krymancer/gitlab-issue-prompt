# gitlab-issue-prompt

CLI tool to extract GitLab issue data (title, description, labels, comments) and format it for AI context.

## Installation

```bash
# Clone and install
cd gitlab-issue-prompt
npm install
npm run build

# Optional: Link globally
npm link
```

## Configuration

Create a `.env` file in the project root (or your working directory):

```bash
cp .env.example .env
```

Edit `.env` with your GitLab settings:

```env
GITLAB_URL=https://gitlab.com
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
GITLAB_PROJECT_ID=123
```

### Getting a Personal Access Token

1. Go to GitLab → User Settings → Access Tokens
2. Create a new token with `read_api` scope
3. Copy the token to your `.env` file

### Project ID

You can use either:
- Numeric project ID: `123`
- URL-encoded path: `group%2Fsubgroup%2Fproject`

Find your project ID on the project's main page (under the project name).

## Usage

```bash
# Basic usage
npm run dev -- 13001

# Or if built/linked
issue-prompt 13001

# Copy to clipboard (Linux with wl-copy)
issue-prompt 13001 | wl-copy

# Copy to clipboard (macOS)
issue-prompt 13001 | pbcopy

# Pipe to AI tool
issue-prompt 13001 | opencode

# Save to file
issue-prompt 13001 > issue-context.md
```

### Options

```
Usage: issue-prompt <issue-iid> [options]

Arguments:
  issue-iid          The IID (internal ID) of the issue to fetch

Options:
  --no-comments      Exclude comments from output
  --comments-only    Only include user comments (exclude system notes)
  --json             Output raw JSON instead of formatted markdown
  -h, --help         Show this help message
```

### Examples

```bash
# Fetch issue with all comments
issue-prompt 13001

# Fetch issue without comments (faster)
issue-prompt 13001 --no-comments

# Only user comments, no system activity
issue-prompt 13001 --comments-only

# Get raw JSON for further processing
issue-prompt 13001 --json | jq '.issue.title'
```

## Output Format

The tool outputs a markdown-formatted prompt optimized for AI context:

```markdown
# GitLab Issue #13001

## Metadata
- **Title:** Fix login button not working
- **State:** opened
- **Author:** @johndoe (John Doe)
- **Assignees:** @janedoe
- **Labels:** `bug`, `priority::high`, `frontend`
- **Milestone:** v2.0
- **Created:** 2024-01-15 10:30:00
- **Updated:** 2024-01-20 14:22:00

## Description
The login button on the homepage doesn't respond to clicks...

## Comments (3 total, 2 user comments)

### Comment 1 - @janedoe (2024-01-16 09:00:00)
I can reproduce this issue on Chrome...

### Comment 2 [System] - @gitlab-bot (2024-01-16 09:05:00)
added ~bug label

---
**Issue URL:** https://gitlab.com/group/project/-/issues/13001
```

## Development

```bash
# Run in development mode
npm run dev -- 13001

# Type check
npm run typecheck

# Build
npm run build
```

## License

MIT
