import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
// Reminders are scheduled one by one; this sweep catches any the scheduler missed.
crons.interval("send due reminders", { minutes: 5 }, internal.flow.sweepReminders, {});
export default crons;
