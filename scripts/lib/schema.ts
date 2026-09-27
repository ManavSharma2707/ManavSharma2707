import { z } from "zod";

export const ProfileSchema = z.object({
  login: z.string(),
  name: z.string(),
  title: z.string(),
  avatarUrl: z.string().url(),
  location: z.string().nullable(),
  followers: z.number().int().nonnegative(),
});

export const TotalsSchema = z.object({
  repositories: z.number().int().nonnegative(),
  stars: z.number().int().nonnegative(),
  forks: z.number().int().nonnegative(),
  commitsThisYear: z.number().int().nonnegative(),
  pullRequests: z.number().int().nonnegative(),
  issues: z.number().int().nonnegative(),
  reviews: z.number().int().nonnegative(),
  contributionsThisYear: z.number().int().nonnegative(),
});

export const StreakSchema = z.object({
  current: z.number().int().nonnegative(),
  longest: z.number().int().nonnegative(),
  currentStart: z.string().nullable(),
  longestRange: z.tuple([z.string(), z.string()]).nullable(),
});

export const CalendarDaySchema = z.object({
  date: z.string(),
  count: z.number().int().nonnegative(),
  level: z.number().int().min(0).max(4),
});

export const MonthlyCommitSchema = z.object({
  month: z.string(),
  count: z.number().int().nonnegative(),
});

export const LanguageSchema = z.object({
  name: z.string(),
  percent: z.number().min(0).max(100),
  color: z.string(),
});

export const ProjectSchema = z.object({
  name: z.string(),
  owner: z.string(),
  description: z.string().nullable(),
  stars: z.number().int().nonnegative(),
  forks: z.number().int().nonnegative(),
  language: z.string().nullable(),
  url: z.string().url(),
  topics: z.array(z.string()),
});

export const TrendsSchema = z.object({
  starsDelta30d: z.number().int(),
  commitsDelta30d: z.number().int(),
  mergedPrRate: z.number().min(0).max(1),
});

export const MetricsSchema = z.object({
  generatedAt: z.string(),
  profile: ProfileSchema,
  totals: TotalsSchema,
  streak: StreakSchema,
  calendar: z.array(CalendarDaySchema),
  monthlyCommits: z.array(MonthlyCommitSchema),
  languages: z.array(LanguageSchema),
  weeklyRhythm: z.array(z.array(z.number().int().nonnegative()).length(24)).length(7),
  projects: z.array(ProjectSchema),
  trends: TrendsSchema,
});

export type Metrics = z.infer<typeof MetricsSchema>;
export type Project = z.infer<typeof ProjectSchema>;
