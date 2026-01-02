#!/usr/bin/env node

import { spawn } from "child_process";

import { loadConfig, parseCliArgs } from "./config.js";
import { GitLabClient, GitLabApiError } from "./gitlab/index.js";
import { formatIssuePrompt, formatIssueJson } from "./formatters/index.js";

function runOpencode(prompt: string): void {
  const child = spawn("opencode", ["--prompt", prompt], {
    stdio: "inherit",
    shell: false,
  });

  child.on("error", (err) => {
    console.error(`Failed to start opencode: ${err.message}`);
    process.exit(1);
  });

  child.on("close", (code) => {
    process.exit(code ?? 0);
  });
}

async function main(): Promise<void> {
  // Parse command line arguments (skip node and script path)
  const args = process.argv.slice(2);
  const options = parseCliArgs(args);

  // Load configuration from environment
  const config = loadConfig();

  // Create GitLab client
  const client = new GitLabClient(config);

  try {
    // Fetch issue data
    const data = await client.getIssueData(options.issueIid, {
      includeComments: !options.noComments,
      onlyUserComments: options.commentsOnly,
    });

    if (options.json) {
      console.log(formatIssueJson(data));
    } else if (options.opencode) {
      const prompt = formatIssuePrompt(data);
      runOpencode(prompt);
      return;
    } else {
      console.log(formatIssuePrompt(data));
    }
  } catch (error) {
    console.log(error)
    if (error instanceof GitLabApiError) {
      console.error(`Error: ${error.message}`);
      if (error.response) {
        console.error(`Response: ${error.response}`);
      }
      process.exit(1);
    }

    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }

    console.error("An unexpected error occurred");
    process.exit(1);
  }
}

main();
