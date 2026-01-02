import { z } from "zod";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

// Load .env file from project root or current directory
dotenvConfig({ path: resolve(process.cwd(), ".env") });

// Configuration schema
const ConfigSchema = z.object({
  gitlabUrl: z
    .string()
    .url("GITLAB_URL must be a valid URL")
    .transform((url) => url.replace(/\/$/, "")), // Remove trailing slash
  gitlabToken: z
    .string()
    .min(1, "GITLAB_TOKEN is required"),
  projectId: z
    .string()
    .min(1, "GITLAB_PROJECT_ID is required"),
});

export type Config = z.infer<typeof ConfigSchema>;

// CLI options
export interface CliOptions {
  issueIid: number;
  noComments: boolean;
  commentsOnly: boolean;
  json: boolean;
  opencode: boolean;
}

export function loadConfig(): Config {
  const result = ConfigSchema.safeParse({
    gitlabUrl: process.env.GITLAB_URL,
    gitlabToken: process.env.GITLAB_TOKEN,
    projectId: process.env.GITLAB_PROJECT_ID,
  });

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    
    console.error("Configuration error:\n" + errors);
    console.error("\nMake sure you have a .env file with:");
    console.error("  GITLAB_URL=https://gitlab.example.com");
    console.error("  GITLAB_TOKEN=glpat-xxxx");
    console.error("  GITLAB_PROJECT_ID=123");
    process.exit(1);
  }

  return result.data;
}

export function parseCliArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    issueIid: 0,
    noComments: false,
    commentsOnly: false,
    json: false,
    opencode: false,
  };

  const positionalArgs: string[] = [];

  for (const arg of args) {
    if (arg === "--no-comments") {
      options.noComments = true;
    } else if (arg === "--comments-only") {
      options.commentsOnly = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--opencode") {
      options.opencode = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith("-")) {
      positionalArgs.push(arg);
    } else {
      console.error(`Unknown option: ${arg}`);
      printHelp();
      process.exit(1);
    }
  }

  if (positionalArgs.length === 0) {
    console.error("Error: Issue IID is required\n");
    printHelp();
    process.exit(1);
  }

  const issueIid = parseInt(positionalArgs[0], 10);
  if (isNaN(issueIid) || issueIid <= 0) {
    console.error(`Error: Invalid issue IID: ${positionalArgs[0]}`);
    process.exit(1);
  }

  options.issueIid = issueIid;

  return options;
}

function printHelp(): void {
  console.log(`
Usage: issue-prompt <issue-iid> [options]

Extract GitLab issue data for AI context.

Arguments:
  issue-iid          The IID (internal ID) of the issue to fetch

Options:
  --no-comments      Exclude comments from output
  --comments-only    Only include user comments (exclude system notes)
  --json             Output raw JSON instead of formatted markdown
  --opencode         Open the prompt directly in opencode
  -h, --help         Show this help message

Examples:
  issue-prompt 13001                    # Fetch issue #13001
  issue-prompt 13001 | wl-copy          # Copy to clipboard
  issue-prompt 13001 --no-comments      # Fetch without comments
  issue-prompt 13001 --json             # Output as JSON

Environment Variables:
  GITLAB_URL         GitLab instance URL (e.g., https://gitlab.com)
  GITLAB_TOKEN       Personal Access Token with read_api scope
  GITLAB_PROJECT_ID  Project ID or URL-encoded path (e.g., 123 or group%2Fproject)
`);
}
