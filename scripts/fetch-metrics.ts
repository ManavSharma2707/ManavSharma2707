import { writeFile, readFile, appendFile, access } from "node:fs/promises";
import { fetchViewerData, fetchFeaturedRepo, fetchPunchCard, type FeaturedRepoRef } from "./lib/github.js";
import { levelForCount } from "./lib/format.js";
import { MetricsSchema, type Metrics } from "./lib/schema.js";

const METRICS_PATH = "assets/generated/metrics.json";
const HISTORY_PATH = "assets/generated/history.csv";

// title and featured repos are curated by hand rather than pulled from pinned items,
// since the pins mix owners (personal repos plus one under an org)
const PROFILE_TITLE = "Full-Stack Developer · AI/ML Research";

const FEATURED: FeaturedRepoRef[] = [
  { owner: "ManavSharma2707", name: "Amazon-ML-Hackathon" },
  { owner: "ManavSharma2707", name: "AgenticSafety-Research" },
  { owner: "maxoutlabs", name: "omninpc" },
  { owner: "ManavSharma2707", name: "Cognitia" },
];

function computeStreaks(calendar: Array<{ date: string; count: number }>) {
  let current = 0;
  let longest = 0;
  let currentStart: string | null = null;
  let longestStart: string | null = null;
  let longestEnd: string | null = null;
  let runStart: string | null = null;

  for (const day of calendar) {
    if (day.count > 0) {
      if (runStart === null) runStart = day.date;
      current += 1;
      if (current > longest) {
        longest = current;
        longestStart = runStart;
        longestEnd = day.date;
      }
    } else {
      current = 0;
      runStart = null;
    }
  }

  // a streak "current" only counts if it reaches up to the most recent day fetched
  const lastDay = calendar.at(-1);
  const tailIsActive = lastDay && lastDay.count > 0;
  if (!tailIsActive) {
    current = 0;
    currentStart = null;
  } else {
    currentStart = runStart;
  }

  return {
    current,
    longest,
    currentStart,
    longestRange: longestStart && longestEnd ? ([longestStart, longestEnd] as [string, string]) : null,
  };
}

async function readPreviousDelta(): Promise<{ stars: number; commits: number }> {
  try {
    const raw = await readFile(HISTORY_PATH, "utf8");
    const lines = raw.trim().split("\n").filter(Boolean);
    if (lines.length < 2) return { stars: 0, commits: 0 };
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const rows = lines.slice(1).map((line) => line.split(","));
    const past = rows.find((row) => new Date(row[0] ?? "").getTime() >= cutoff);
    const latest = rows.at(-1);
    if (!past || !latest) return { stars: 0, commits: 0 };
    return {
      stars: Number(latest[1] ?? 0) - Number(past[1] ?? 0),
      commits: Number(latest[2] ?? 0) - Number(past[2] ?? 0),
    };
  } catch {
    return { stars: 0, commits: 0 };
  }
}

async function appendHistoryRow(stars: number, commits: number): Promise<void> {
  const exists = await access(HISTORY_PATH).then(() => true).catch(() => false);
  if (!exists) {
    await writeFile(HISTORY_PATH, "date,stars,commits\n", "utf8");
  }
  const today = new Date().toISOString().slice(0, 10);
  await appendFile(HISTORY_PATH, `${today},${stars},${commits}\n`, "utf8");
}

async function main() {
  const { viewer } = await fetchViewerData();

  const calendarDays = viewer.contributionsCollection.contributionCalendar.weeks.flatMap(
    (w) => w.contributionDays,
  );
  const maxDayCount = Math.max(1, ...calendarDays.map((d) => d.contributionCount));
  const calendar = calendarDays.map((d) => ({
    date: d.date,
    count: d.contributionCount,
    level: levelForCount(d.contributionCount, maxDayCount),
  }));

  const monthlyMap = new Map<string, number>();
  for (const day of calendarDays) {
    const month = day.date.slice(0, 7);
    monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + day.contributionCount);
  }
  const monthlyCommits = [...monthlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  const languageSizes = new Map<string, { size: number; color: string }>();
  let totalStars = 0;
  let totalForks = 0;
  for (const repo of viewer.repositories.nodes) {
    totalStars += repo.stargazerCount;
    totalForks += repo.forkCount;
    for (const edge of repo.languages.edges) {
      const entry = languageSizes.get(edge.node.name) ?? { size: 0, color: edge.node.color ?? "#8B929C" };
      entry.size += edge.size;
      languageSizes.set(edge.node.name, entry);
    }
  }
  const totalLanguageSize = [...languageSizes.values()].reduce((sum, l) => sum + l.size, 0) || 1;
  const languages = [...languageSizes.entries()]
    .map(([name, { size, color }]) => ({ name, color, percent: (size / totalLanguageSize) * 100 }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 8);

  const projects = await Promise.all(
    FEATURED.map(async (ref) => {
      const repo = await fetchFeaturedRepo(ref);
      return {
        name: repo.name,
        owner: ref.owner,
        description: repo.description,
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        language: repo.primaryLanguage?.name ?? null,
        url: repo.url,
        topics: repo.repositoryTopics.nodes.map((n) => n.topic.name),
      };
    }),
  );

  const topReposByStars = [...viewer.repositories.nodes].sort((a, b) => b.stargazerCount - a.stargazerCount).slice(0, 5);
  const weeklyRhythm: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const repo of topReposByStars) {
    try {
      const punchCard = await fetchPunchCard(viewer.login, repo.name);
      for (const entry of punchCard) {
        const day = weeklyRhythm[entry.weekday];
        if (day) day[entry.hour] = (day[entry.hour] ?? 0) + entry.commits;
      }
    } catch {
      // punch card stats can be empty or still computing on GitHub's side; skip that repo
    }
  }

  const delta = await readPreviousDelta();

  const metrics: Metrics = {
    generatedAt: new Date().toISOString(),
    profile: {
      login: viewer.login,
      name: viewer.name ?? viewer.login,
      title: PROFILE_TITLE,
      avatarUrl: viewer.avatarUrl,
      location: viewer.location,
      followers: viewer.followers.totalCount,
    },
    totals: {
      repositories: viewer.repositories.totalCount,
      stars: totalStars,
      forks: totalForks,
      commitsThisYear: viewer.contributionsCollection.totalCommitContributions,
      pullRequests: viewer.pullRequests.totalCount,
      issues: viewer.contributionsCollection.totalIssueContributions,
      reviews: viewer.contributionsCollection.totalPullRequestReviewContributions,
      contributionsThisYear: viewer.contributionsCollection.contributionCalendar.totalContributions,
    },
    streak: computeStreaks(calendar),
    calendar,
    monthlyCommits,
    languages,
    weeklyRhythm: weeklyRhythm as Metrics["weeklyRhythm"],
    projects,
    trends: {
      starsDelta30d: delta.stars,
      commitsDelta30d: delta.commits,
      mergedPrRate: viewer.pullRequests.totalCount > 0
        ? Number((viewer.mergedPrs.totalCount / viewer.pullRequests.totalCount).toFixed(3))
        : 0,
    },
  };

  const parsed = MetricsSchema.parse(metrics);
  await writeFile(METRICS_PATH, JSON.stringify(parsed, null, 2) + "\n", "utf8");
  await appendHistoryRow(totalStars, parsed.totals.commitsThisYear);
  console.log(`Wrote ${METRICS_PATH}`);
}

main().catch(async (error) => {
  console.error("fetch-metrics failed, leaving the previous metrics.json in place:", error);
  const previousExists = await access(METRICS_PATH).then(() => true).catch(() => false);
  if (!previousExists) {
    console.error("No previous metrics.json to fall back on either. Failing the job.");
  }
  process.exitCode = 1;
});
