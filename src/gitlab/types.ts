import { z } from "zod";

// GitLab User schema
export const GitLabUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  name: z.string(),
  state: z.string(),
  avatar_url: z.string().nullable(),
  web_url: z.string(),
});

export type GitLabUser = z.infer<typeof GitLabUserSchema>;

// GitLab Milestone schema
export const GitLabMilestoneSchema = z.object({
  id: z.number(),
  iid: z.number(),
  project_id: z.number().nullable().optional(),
  title: z.string(),
  description: z.string().nullable(),
  state: z.string(),
  due_date: z.string().nullable(),
  start_date: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  web_url: z.string().optional(),
});

export type GitLabMilestone = z.infer<typeof GitLabMilestoneSchema>;

// GitLab Issue schema
export const GitLabIssueSchema = z.object({
  id: z.number(),
  iid: z.number(),
  project_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  state: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  closed_at: z.string().nullable(),
  closed_by: GitLabUserSchema.nullable().optional(),
  labels: z.array(z.string()),
  milestone: GitLabMilestoneSchema.nullable(),
  assignees: z.array(GitLabUserSchema),
  assignee: GitLabUserSchema.nullable().optional(),
  author: GitLabUserSchema,
  type: z.string().optional(),
  user_notes_count: z.number(),
  merge_requests_count: z.number(),
  upvotes: z.number(),
  downvotes: z.number(),
  due_date: z.string().nullable(),
  confidential: z.boolean(),
  discussion_locked: z.boolean().nullable(),
  issue_type: z.string().optional(),
  severity: z.string().optional(),
  web_url: z.string(),
  time_stats: z.object({
    time_estimate: z.number(),
    total_time_spent: z.number(),
    human_time_estimate: z.string().nullable(),
    human_total_time_spent: z.string().nullable(),
  }).optional(),
  task_completion_status: z.object({
    count: z.number(),
    completed_count: z.number(),
  }).optional(),
  weight: z.number().nullable().optional(),
  has_tasks: z.boolean().optional(),
  references: z.object({
    short: z.string(),
    relative: z.string(),
    full: z.string(),
  }).optional(),
  _links: z.object({
    self: z.string(),
    notes: z.string(),
    award_emoji: z.string(),
    project: z.string(),
    closed_as_duplicate_of: z.string().nullable().optional(),
  }).optional(),
});

export type GitLabIssue = z.infer<typeof GitLabIssueSchema>;

// GitLab Note (Comment) schema
export const GitLabNoteSchema = z.object({
  id: z.number(),
  body: z.string(),
  author: GitLabUserSchema,
  created_at: z.string(),
  updated_at: z.string(),
  system: z.boolean(),
  noteable_id: z.number(),
  noteable_type: z.string(),
  project_id: z.number().nullable().optional(),
  noteable_iid: z.number().nullable().optional(),
  resolvable: z.boolean(),
  confidential: z.boolean().optional(),
  internal: z.boolean().optional(),
  imported: z.boolean().optional(),
  imported_from: z.string().optional(),
});

export type GitLabNote = z.infer<typeof GitLabNoteSchema>;

// Array schemas for API responses
export const GitLabNotesArraySchema = z.array(GitLabNoteSchema);

// Combined issue data for formatting
export interface IssueData {
  issue: GitLabIssue;
  notes: GitLabNote[];
}
