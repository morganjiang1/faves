// Faves on Convex: group chats, plan tickets and the butler. Shapes match the plain JSON in
// src/chat/reduce.d.mts (ids made on the phone; Convex keeps its own _creationTime too).
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({ userId: v.string(), name: v.string(), handle: v.string(), interests: v.optional(v.array(v.string())), mode: v.optional(v.string()), seenAt: v.number() })
    .index("by_userId", ["userId"]).index("by_handle", ["handle"]),
  groups: defineTable({ groupId: v.string(), name: v.string(), emoji: v.string(), city: v.string(), inviteCode: v.string(), createdBy: v.string(), createdAt: v.number(), updatedAt: v.number(), butlerName: v.optional(v.string()), butlerThread: v.optional(v.string()) })
    .index("by_groupId", ["groupId"]).index("by_code", ["inviteCode"]),
  members: defineTable({ groupId: v.string(), userId: v.string(), name: v.string(), handle: v.string(), sample: v.optional(v.boolean()), order: v.number() })
    .index("by_group", ["groupId"]).index("by_user", ["userId"]).index("by_group_user", ["groupId", "userId"]),
  // Starting points, neighborhood-level only (never an exact location).
  locations: defineTable({ groupId: v.string(), userId: v.string(), hood: v.union(v.string(), v.null()), lat: v.number(), lng: v.number(), mode: v.string(), live: v.boolean(), at: v.number() })
    .index("by_group", ["groupId"]).index("by_group_user", ["groupId", "userId"]),
  messages: defineTable({ messageId: v.string(), groupId: v.string(), authorId: v.string(), authorName: v.string(), kind: v.string(), text: v.optional(v.string()), ticketId: v.optional(v.string()), placeId: v.optional(v.string()), dayId: v.optional(v.string()), createdAt: v.number() })
    .index("by_group", ["groupId", "createdAt"]).index("by_messageId", ["messageId"]),
  plans: defineTable({ ticketId: v.string(), groupId: v.string(), plan: v.any(), status: v.string(), createdBy: v.string(), createdAt: v.number(), updatedAt: v.number(), revision: v.number(), workflowId: v.optional(v.string()) })
    .index("by_ticketId", ["ticketId"]).index("by_group", ["groupId"]),
  stops: defineTable({ ticketId: v.string(), index: v.number(), placeId: v.string(), start: v.number(), end: v.number() }).index("by_ticket", ["ticketId"]),
  rsvps: defineTable({ ticketId: v.string(), userId: v.string(), answer: v.string() }).index("by_ticket", ["ticketId"]),
  votes: defineTable({ ticketId: v.string(), userId: v.string(), up: v.boolean() }).index("by_ticket", ["ticketId"]),
  reminders: defineTable({ groupId: v.string(), ticketId: v.string(), at: v.number(), text: v.string(), sent: v.boolean() }).index("by_due", ["sent", "at"]).index("by_ticket", ["ticketId"]),
  agentRuns: defineTable({ groupId: v.string(), kind: v.string(), askedBy: v.optional(v.string()), input: v.string(), output: v.optional(v.string()), status: v.string(), startedAt: v.number(), finishedAt: v.optional(v.number()) })
    .index("by_group", ["groupId", "startedAt"]),
  // The cities' spots, for "find a spot by vibe" (vector search) and booking details.
  places: defineTable({ placeId: v.string(), city: v.string(), name: v.string(), kind: v.union(v.string(), v.null()), hood: v.union(v.string(), v.null()), locals: v.number(), reserveUrl: v.union(v.string(), v.null()), phone: v.union(v.string(), v.null()), lat: v.number(), lng: v.number(), embedding: v.array(v.float64()) })
    .index("by_placeId", ["placeId"])
    .vectorIndex("by_vibe", { vectorField: "embedding", dimensions: 128, filterFields: ["city"] }),
  // Spot clips served from Convex file storage.
  clips: defineTable({ placeId: v.string(), city: v.string(), order: v.number(), video: v.id("_storage"), poster: v.optional(v.id("_storage")), creator: v.optional(v.string()), plays: v.optional(v.number()) })
    .index("by_place", ["placeId", "order"]).index("by_city", ["city"]),
});
