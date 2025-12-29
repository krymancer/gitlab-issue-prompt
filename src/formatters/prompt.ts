import type { IssueData, GitLabNote, GitLabUser } from "../gitlab/types.js";

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toISOString().split("T")[0];
}

function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toISOString().replace("T", " ").split(".")[0];
}

function formatUser(user: GitLabUser): string {
  return `@${user.username} (${user.name})`;
}

function formatAssignees(assignees: GitLabUser[]): string {
  if (assignees.length === 0) {
    return "None";
  }
  return assignees.map((a) => `@${a.username}`).join(", ");
}

function formatLabels(labels: string[]): string {
  if (labels.length === 0) {
    return "None";
  }
  return labels.map((l) => `\`${l}\``).join(", ");
}

function formatNote(note: GitLabNote, index: number): string {
  const lines: string[] = [];
  
  const noteType = note.system ? " [System]" : "";
  const confidentialTag = note.confidential || note.internal ? " [Internal]" : "";
  
  lines.push(
    `### Comment ${index + 1}${noteType}${confidentialTag} - @${note.author.username} (${formatDateTime(note.created_at)})`
  );
  lines.push("");
  lines.push(note.body);
  lines.push("");

  return lines.join("\n");
}

export function formatIssuePrompt(data: IssueData): string {
  const { issue, notes } = data;
  const lines: string[] = [];

  // Header
  lines.push(`# GitLab Issue #${issue.iid}`);
  lines.push("");

  // Metadata section
  lines.push("## Metadata");
  lines.push("");
  lines.push(`- **Title:** ${issue.title}`);
  lines.push(`- **State:** ${issue.state}`);
  lines.push(`- **Type:** ${issue.issue_type || issue.type || "issue"}`);
  lines.push(`- **Author:** ${formatUser(issue.author)}`);
  lines.push(`- **Assignees:** ${formatAssignees(issue.assignees)}`);
  lines.push(`- **Labels:** ${formatLabels(issue.labels)}`);
  
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

  lines.push("");

  // Description section
  lines.push("## Description");
  lines.push("");
  if (issue.description) {
    lines.push(issue.description);
  } else {
    lines.push("_No description provided._");
  }
  lines.push("");

  // Comments section
  if (notes.length > 0) {
    const userNotes = notes.filter((n) => !n.system);
    const systemNotes = notes.filter((n) => n.system);

    lines.push(`## Comments (${notes.length} total, ${userNotes.length} user comments)`);
    lines.push("");

    notes.forEach((note, index) => {
      lines.push(formatNote(note, index));
    });
  } else {
    lines.push("## Comments");
    lines.push("");
    lines.push("_No comments._");
    lines.push("");
  }

  // Footer with link
  lines.push("---");
  lines.push(`**Issue URL:** ${issue.web_url}`);
  lines.push("");

  const issueType = issue.issue_type || issue.type || "issue";
  const branchPrefix = issueType === "bug" || issueType === "incident" ? "fix" : "feat";
  const commitPrefix = branchPrefix;
  const branchName = `${branchPrefix}/${issue.iid}`;
  
  const projectUrl = issue.web_url.replace(/\/-\/issues\/\d+$/, "");
  const mrUrl = `${projectUrl}/-/merge_requests/new?merge_request%5Bsource_branch%5D=${branchName}`;

  lines.push("## Workflow Instructions");
  lines.push("");
  lines.push("1. **Pull latest changes** before starting work:");
  lines.push("   ```bash");
  lines.push("   git fetch origin");
  lines.push("   git checkout develop || git checkout main || git checkout master");
  lines.push("   git pull");
  lines.push("   ```");
  lines.push("");
  lines.push(`2. **Create branch:** \`${branchName}\``);
  lines.push("   ```bash");
  lines.push(`   git checkout -b ${branchName}`);
  lines.push("   ```");
  lines.push("");
  lines.push(`3. **Commit format:** \`${commitPrefix}: <description> #${issue.iid}\``);
  lines.push("");
  lines.push(`4. **Push and create MR:**`);
  lines.push("   ```bash");
  lines.push(`   git push -u origin ${branchName}`);
  lines.push("   ```");
  lines.push("");
  lines.push(`5. **Open MR:** [Create Merge Request](${mrUrl})`);
  lines.push("");

  return lines.join("\n");
}

export function formatIssueJson(data: IssueData): string {
  return JSON.stringify(data, null, 2);
}
