import type { IssueData, GitLabIssue, GitLabNote, GitLabUser } from "../gitlab/types.js";

function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toISOString().replace("T", " ").split(".")[0];
}

function formatUser(user: GitLabUser): string {
  return `@${user.username} (${user.name})`;
}

function formatAssignees(assignees: GitLabUser[]): string {
  if (assignees.length === 0) return "None";
  return assignees.map((a) => `@${a.username}`).join(", ");
}

function formatLabels(labels: string[]): string {
  if (labels.length === 0) return "None";
  return labels.map((l) => `\`${l}\``).join(", ");
}

function formatMetadata(issue: GitLabIssue): string {
  const lines: string[] = [
    `- **Title:** ${issue.title}`,
    `- **State:** ${issue.state}`,
    `- **Type:** ${issue.issue_type || issue.type || "issue"}`,
    `- **Author:** ${formatUser(issue.author)}`,
    `- **Assignees:** ${formatAssignees(issue.assignees)}`,
    `- **Labels:** ${formatLabels(issue.labels)}`,
  ];

  if (issue.milestone) {
    lines.push(`- **Milestone:** ${issue.milestone.title}`);
  }

  if (issue.due_date) {
    lines.push(`- **Due Date:** ${issue.due_date}`);
  }

  lines.push(`- **Created:** ${formatDateTime(issue.created_at)}`);
  lines.push(`- **Updated:** ${formatDateTime(issue.updated_at)}`);

  if (issue.closed_at) {
    lines.push(`- **Closed:** ${formatDateTime(issue.closed_at)}`);
    if (issue.closed_by) {
      lines.push(`- **Closed By:** ${formatUser(issue.closed_by)}`);
    }
  }

  if (issue.confidential) {
    lines.push(`- **Confidential:** Yes`);
  }

  if (issue.weight !== undefined && issue.weight !== null) {
    lines.push(`- **Weight:** ${issue.weight}`);
  }

  if (issue.time_stats) {
    if (issue.time_stats.human_time_estimate) {
      lines.push(`- **Time Estimate:** ${issue.time_stats.human_time_estimate}`);
    }
    if (issue.time_stats.human_total_time_spent) {
      lines.push(`- **Time Spent:** ${issue.time_stats.human_total_time_spent}`);
    }
  }

  if (issue.task_completion_status && issue.task_completion_status.count > 0) {
    lines.push(
      `- **Tasks:** ${issue.task_completion_status.completed_count}/${issue.task_completion_status.count} completed`
    );
  }

  return `## Metadata

${lines.join("\n")}`;
}

function formatDescription(issue: GitLabIssue): string {
  const content = issue.description || "_No description provided._";
  return `## Description

${content}`;
}

function formatNote(note: GitLabNote, index: number): string {
  const noteType = note.system ? " [System]" : "";
  const confidentialTag = note.confidential || note.internal ? " [Internal]" : "";
  const header = `### Comment ${index + 1}${noteType}${confidentialTag} - @${note.author.username} (${formatDateTime(note.created_at)})`;

  return `${header}

${note.body}`;
}

function formatComments(notes: GitLabNote[]): string {
  if (notes.length === 0) {
    return `## Comments

_No comments._`;
  }

  const userNotes = notes.filter((n) => !n.system);
  const header = `## Comments (${notes.length} total, ${userNotes.length} user comments)`;
  const comments = notes.map((note, index) => formatNote(note, index)).join("\n\n");

  return `${header}

${comments}`;
}

function formatWorkflowInstructions(issue: GitLabIssue): string {
  const issueType = issue.issue_type || issue.type || "issue";
  const branchPrefix = issueType === "bug" || issueType === "incident" ? "fix" : "feat";
  const branchName = `${branchPrefix}/${issue.iid}`;
  const projectUrl = issue.web_url.replace(/\/-\/issues\/\d+$/, "");
  const mrUrl = `${projectUrl}/-/merge_requests/new?merge_request%5Bsource_branch%5D=${branchName}`;

  return `## Workflow Instructions

1. **Pull latest changes** before starting work:
   \`\`\`bash
   git fetch origin
   git checkout develop || git checkout main || git checkout master
   git pull
   \`\`\`

2. **Create branch:** \`${branchName}\`
   \`\`\`bash
   git checkout -b ${branchName}
   \`\`\`

3. **Commit format:** \`${branchPrefix}: <description> #${issue.iid}\`

4. **Push and create MR:**
   \`\`\`bash
   git push -u origin ${branchName}
   \`\`\`

5. **Open MR:** [Create Merge Request](${mrUrl})

## Available Tools & Context

- **glab CLI:** You can leverage \`glab\` commands to:
  - Create merge requests: \`glab mr create\`
  - Look up repositories: \`glab repo list\`, \`glab repo view\`
  - Manage issues: \`glab issue view\`, \`glab issue update\`

- **Project Location:** All projects are located in \`~/projects/\`
- **Multi-Project Context:** The issue may involve multiple repositories in the \`~/projects/\` folder`;
}

export function formatIssuePrompt(data: IssueData): string {
  const { issue, notes } = data;

  return `ultrathink

# GitLab Issue #${issue.iid}

${formatMetadata(issue)}

${formatDescription(issue)}

${formatComments(notes)}

---
**Issue URL:** ${issue.web_url}

${formatWorkflowInstructions(issue)}
`;
}

export function formatIssueJson(data: IssueData): string {
  return JSON.stringify(data, null, 2);
}
