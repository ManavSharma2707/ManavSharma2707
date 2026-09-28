const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";
const REST_ENDPOINT = "https://api.github.com";

function token(): string {
  const value = process.env.METRICS_TOKEN;
  if (!value) throw new Error("METRICS_TOKEN is not set");
  return value;
}

async function graphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${await response.text()}`);
  }
  const payload = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (payload.errors?.length) {
    throw new Error(`GraphQL errors: ${payload.errors.map((e) => e.message).join("; ")}`);
  }
  if (!payload.data) throw new Error("GraphQL response had no data");
  return payload.data;
}

async function rest<T>(path: string): Promise<T> {
  // stats endpoints answer 202 with an empty body while GitHub computes them
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(`${REST_ENDPOINT}${path}`, {
      headers: {
        Authorization: `Bearer ${token()}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (response.status === 202) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      continue;
    }
    if (!response.ok) {
      throw new Error(`REST request failed: ${response.status} ${path}`);
    }
    return (await response.json()) as T;
  }
  throw new Error(`REST request still computing after retries: ${path}`);
}

const VIEWER_QUERY = `
query {
  viewer {
    login
    name
    avatarUrl
    location
    followers { totalCount }
    repositories(ownerAffiliations: OWNER, isFork: false, first: 100) {
      totalCount
      nodes {
        name
        stargazerCount
        forkCount
        pushedAt
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name color } }
        }
      }
    }
    contributionsCollection {
      totalCommitContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays { date contributionCount weekday }
        }
      }
    }
    pullRequests(first: 1) { totalCount }
    mergedPrs: pullRequests(states: MERGED, first: 1) { totalCount }
  }
}`;

export interface ViewerData {
  viewer: {
    login: string;
    name: string | null;
    avatarUrl: string;
    location: string | null;
    followers: { totalCount: number };
    repositories: {
      totalCount: number;
      nodes: Array<{
        name: string;
        stargazerCount: number;
        forkCount: number;
        pushedAt: string;
        languages: { edges: Array<{ size: number; node: { name: string; color: string | null } }> };
      }>;
    };
    contributionsCollection: {
      totalCommitContributions: number;
      totalIssueContributions: number;
      totalPullRequestReviewContributions: number;
      contributionCalendar: {
        totalContributions: number;
        weeks: Array<{ contributionDays: Array<{ date: string; contributionCount: number; weekday: number }> }>;
      };
    };
    pullRequests: { totalCount: number };
    mergedPrs: { totalCount: number };
  };
}

export function fetchViewerData(): Promise<ViewerData> {
  return graphql<ViewerData>(VIEWER_QUERY);
}

const REPO_QUERY = `
query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    name
    description
    stargazerCount
    forkCount
    primaryLanguage { name }
    url
    repositoryTopics(first: 5) { nodes { topic { name } } }
  }
}`;

export interface FeaturedRepoRef {
  owner: string;
  name: string;
}

export interface FeaturedRepoData {
  name: string;
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string } | null;
  url: string;
  repositoryTopics: { nodes: Array<{ topic: { name: string } }> };
}

export async function fetchFeaturedRepo(ref: FeaturedRepoRef): Promise<FeaturedRepoData> {
  const data = await graphql<{ repository: FeaturedRepoData }>(REPO_QUERY, { owner: ref.owner, name: ref.name });
  return data.repository;
}

export interface PunchCardEntry {
  weekday: number;
  hour: number;
  commits: number;
}

export async function fetchPunchCard(owner: string, repo: string): Promise<PunchCardEntry[]> {
  const raw = await rest<number[][]>(`/repos/${owner}/${repo}/stats/punch_card`);
  return raw.map((row) => ({ weekday: row[0] ?? 0, hour: row[1] ?? 0, commits: row[2] ?? 0 }));
}
