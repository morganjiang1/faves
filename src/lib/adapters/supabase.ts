// Optional live sync for group votes through Supabase's REST endpoint (PostgREST), used
// only when EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set. Without
// them, votes travel in the invite links (src/lib/group.ts) and nothing here runs.
//
// Table:
//   create table group_votes (
//     group_id text not null,
//     voter text not null,
//     votes jsonb not null,           -- option key -> "going" | "maybe" | "cant"
//     updated_at timestamptz not null default now(),
//     primary key (group_id, voter)
//   );
import type { Group } from "@/state/store";
import { services } from "./index";

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const votesSyncOn = services.supabase;

const headers = () => ({ apikey: KEY ?? "", Authorization: `Bearer ${KEY ?? ""}`, "Content-Type": "application/json" });

// Save one voter's answers (insert or replace).
export async function pushVotes(groupId: string, voter: string, votes: Group["votes"][string]): Promise<boolean> {
  if (!votesSyncOn) return false;
  try {
    const res = await fetch(`${URL}/rest/v1/group_votes?on_conflict=group_id,voter`, {
      method: "POST",
      headers: { ...headers(), Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify([{ group_id: groupId, voter, votes, updated_at: new Date().toISOString() }]),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Everyone's answers for a group, or null when sync is off or unreachable.
export async function pullVotes(groupId: string): Promise<Group["votes"] | null> {
  if (!votesSyncOn) return null;
  try {
    const res = await fetch(`${URL}/rest/v1/group_votes?group_id=eq.${encodeURIComponent(groupId)}&select=voter,votes`, { headers: headers() });
    if (!res.ok) return null;
    const rows = (await res.json()) as { voter: string; votes: Group["votes"][string] }[];
    const out: Group["votes"] = {};
    for (const r of rows) if (r && typeof r.voter === "string" && r.votes && typeof r.votes === "object") out[r.voter] = r.votes;
    return out;
  } catch {
    return null;
  }
}
