import type { Config } from "../config.js";
import {
  GitLabIssueSchema,
  GitLabNotesArraySchema,
  type GitLabIssue,
  type GitLabNote,
  type IssueData,
} from "./types.js";

export class GitLabApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: string
  ) {
    super(message);
    this.name = "GitLabApiError";
  }
}

export class GitLabClient {
  private baseUrl: string;
  private token: string;
  private projectId: string;

  constructor(config: Config) {
    this.baseUrl = config.gitlabUrl;
    this.token = config.gitlabToken;
    this.projectId = encodeURIComponent(config.projectId);
  }

  private async request<T>(
    endpoint: string,
    schema: { parse: (data: unknown) => T }
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v4${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "PRIVATE-TOKEN": this.token,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      
      if (response.status === 401) {
        throw new GitLabApiError(
          "Authentication failed. Check your GITLAB_TOKEN.",
          response.status,
          text
        );
      }
      
      if (response.status === 403) {
        throw new GitLabApiError(
          "Access forbidden. Your token may not have sufficient permissions.",
          response.status,
          text
        );
      }
      
      if (response.status === 404) {
        throw new GitLabApiError(
          "Issue or project not found. Check your GITLAB_PROJECT_ID and issue IID.",
          response.status,
          text
        );
      }

      throw new GitLabApiError(
        `GitLab API error: ${response.status} ${response.statusText}`,
        response.status,
        text
      );
    }

    const data = await response.json();
    return schema.parse(data);
  }

  private async requestPaginated<T>(
    endpoint: string,
    itemSchema: { parse: (data: unknown) => T[] }
  ): Promise<T[]> {
    const allItems: T[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const separator = endpoint.includes("?") ? "&" : "?";
      const url = `${this.baseUrl}/api/v4${endpoint}${separator}page=${page}&per_page=${perPage}`;

      const response = await fetch(url, {
        headers: {
          "PRIVATE-TOKEN": this.token,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new GitLabApiError(
          `GitLab API error: ${response.status} ${response.statusText}`,
          response.status,
          text
        );
      }

      const data = await response.json();
      const items = itemSchema.parse(data);
      allItems.push(...items);

      // Check if there are more pages
      const totalPages = parseInt(response.headers.get("x-total-pages") || "1", 10);
      if (page >= totalPages) {
        break;
      }
      page++;
    }

    return allItems;
  }

  async getIssue(issueIid: number): Promise<GitLabIssue> {
    const endpoint = `/projects/${this.projectId}/issues/${issueIid}`;
    return this.request(endpoint, GitLabIssueSchema);
  }

  async getIssueNotes(
    issueIid: number,
    onlyComments: boolean = false
  ): Promise<GitLabNote[]> {
    let endpoint = `/projects/${this.projectId}/issues/${issueIid}/notes?sort=asc&order_by=created_at`;
    
    if (onlyComments) {
      endpoint += "&activity_filter=only_comments";
    }

    return this.requestPaginated(endpoint, GitLabNotesArraySchema);
  }

  async getIssueData(
    issueIid: number,
    options: { includeComments?: boolean; onlyUserComments?: boolean } = {}
  ): Promise<IssueData> {
    const { includeComments = true, onlyUserComments = false } = options;

    const issue = await this.getIssue(issueIid);

    let notes: GitLabNote[] = [];
    if (includeComments) {
      notes = await this.getIssueNotes(issueIid, onlyUserComments);
      
      // If onlyUserComments is true, also filter out system notes client-side
      // (the API filter might not catch everything)
      if (onlyUserComments) {
        notes = notes.filter((note) => !note.system);
      }
    }

    return { issue, notes };
  }
}
