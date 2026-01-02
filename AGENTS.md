# AGENTS.md - AI Agent Guidelines

> Guidelines for AI coding agents operating in the `gitlab-issue-prompt` repository.

## Project Overview

CLI tool to extract GitLab issue data (title, description, labels, comments) and format it for AI context.

- **Language:** TypeScript (ES2022, ESM modules)
- **Runtime:** Node.js >= 18.0.0
- **Package Manager:** npm
- **Key Dependencies:** Zod (validation), dotenv (config)

## Build & Run Commands

```bash
npm run dev -- <issue-iid>    # Development (tsx hot reload)
npm run build                  # Build to dist/
npm run typecheck              # Type check only
npm start -- <issue-iid>       # Run built version
```

**No test/lint scripts configured.** When adding, consider Vitest + ESLint.

## Project Structure

```
src/
  index.ts           # CLI entrypoint
  config.ts          # Environment config & CLI parsing
  gitlab/
    index.ts         # Barrel exports
    client.ts        # GitLab API client
    types.ts         # Zod schemas & types
  formatters/
    index.ts         # Barrel exports
    prompt.ts        # Markdown/JSON formatters
```

## Code Style

### Imports

- External packages first, then local (separated by blank line)
- Use `import type { ... }` for type-only imports
- **Always use `.js` extension** for local imports (NodeNext requirement)

```typescript
import { z } from "zod";

import type { Config } from "../config.js";
import { GitLabClient } from "./gitlab/index.js";
```

### Types

**Zod schemas** for runtime validation with inferred types:
```typescript
export const GitLabUserSchema = z.object({
  id: z.number(),
  username: z.string(),
});
export type GitLabUser = z.infer<typeof GitLabUserSchema>;
```

**Interfaces** for internal types without runtime validation:
```typescript
export interface CliOptions {
  issueIid: number;
  noComments: boolean;
}
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Types/Interfaces | PascalCase | `GitLabUser`, `Config` |
| Zod Schemas | PascalCase + `Schema` | `GitLabUserSchema` |
| Classes | PascalCase | `GitLabClient` |
| Functions/Variables | camelCase | `loadConfig`, `issueIid` |

### Error Handling

Custom errors extend Error with typed properties:
```typescript
export class GitLabApiError extends Error {
  constructor(message: string, public statusCode: number, public response?: string) {
    super(message);
    this.name = "GitLabApiError";
  }
}
```

Handle with `instanceof` checks, exit with `process.exit(1)` for user-facing errors.

### Async Patterns

- Use `async/await` exclusively
- Explicit return types: `async function main(): Promise<void>`
- Generic typed request methods with Zod parsing

### Formatting

- 2 spaces indentation
- Double quotes
- Semicolons required
- Trailing commas in multi-line

### File Organization

- Barrel exports via `index.ts`
- Feature folders group related code
- Types co-located with implementation

## Environment

Required `.env` variables (validated with Zod at startup):
```env
GITLAB_URL=https://gitlab.example.com
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
GITLAB_PROJECT_ID=123
```

## Common Tasks

### Adding a CLI Flag
1. Add to `CliOptions` in `config.ts`
2. Initialize default in `parseCliArgs()`
3. Add parsing logic in args loop
4. Update `printHelp()`
5. Use in `main()` in `index.ts`

### Adding API Methods
```typescript
async getIssue(issueIid: number): Promise<GitLabIssue> {
  return this.request(`/projects/${this.projectId}/issues/${issueIid}`, GitLabIssueSchema);
}
```

### Extending GitLab Types
1. Add fields to Zod schema in `gitlab/types.ts`
2. Type is auto-inferred
3. Use `.optional()` or `.nullable()` for optional fields

## Don'ts

- **Don't** use `any` or `@ts-ignore`
- **Don't** use CommonJS (`require()`, `module.exports`)
- **Don't** forget `.js` extension in imports
- **Don't** commit `.env` files
- **Don't** mix Zod with manual type assertions
