// Hooks shared by the feed, day page and saved/profile screens.
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import type { City } from "@/data/types";
import { communityDays, doThisDay as copyDay, type CommunityDay } from "@/lib/community";
import { actions, useStore } from "@/state/store";
import { fromCommunity, fromMine, type DayPost } from "./dayPost";

// The planner builds the sample days; do it after first paint, like Home does.
export function useCommunityDays(city: City | null): CommunityDay[] | null {
  const [days, setDays] = useState<{ slug: string; days: CommunityDay[] } | null>(null);
  useEffect(() => {
    if (!city) return;
    const t = setTimeout(() => setDays({ slug: city.slug, days: communityDays(city) }), 30);
    return () => clearTimeout(t);
  }, [city]);
  return city && days?.slug === city.slug ? days.days : null;
}

export function useCommunityPosts(city: City | null): DayPost[] | null {
  const days = useCommunityDays(city);
  return useMemo(() => {
    if (!city || !days) return null;
    const now = Date.now();
    return days.map((d) => fromCommunity(d, city, now));
  }, [city, days]);
}

// The user's own posted days in this city, newest first.
export function useMyPosts(city: City | null): DayPost[] {
  const posts = useStore((s) => s.posts);
  const plans = useStore((s) => s.plans);
  const profile = useStore((s) => s.profile);
  return useMemo(() => {
    if (!city) return [];
    return posts
      .filter((p) => p.city === city.slug && plans[p.planId])
      .map((p) => fromMine(p, plans[p.planId], city, profile))
      .sort((a, b) => b.at.getTime() - a.at.getTime());
  }, [city, posts, plans, profile]);
}

// Three sample faces for a post's kudos facepile: other sample authors, never the poster.
export function facesFor(post: DayPost, all: DayPost[], index: number): string[] {
  const names = [...new Set(all.filter((p) => p.sample).map((p) => p.author.name))].filter((n) => n !== post.author.name);
  if (!names.length) return [];
  return [0, 1, 2].map((k) => names[(index + k) % names.length]).filter((n, i, a) => a.indexOf(n) === i);
}

// "Do this day": is inspired by the day's exact stops for today (tomorrow if today's start has
// passed) with lib/community.ts doThisDay, saves it to your days, then opens it.
export function doThisDay(post: DayPost, city: City) {
  const day: CommunityDay = { id: post.id, city: city.slug, plan: post.plan, author: post.author, sample: true, doneCount: post.doneCount ?? 0, likes: post.likes, daysAgo: 0, quote: post.quote };
  const plan = copyDay(day, city);
  if (post.kind === "mine") plan.log = ["Copied from your own day. Swap any stop or re-plan as you go."];
  actions.savePlan(plan);
  actions.markDoneDay(post.id);
  router.push(`/plan/${encodeURIComponent(plan.id)}`);
}
