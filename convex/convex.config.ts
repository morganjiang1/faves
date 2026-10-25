import agent from "@convex-dev/agent/convex.config";
import presence from "@convex-dev/presence/convex.config";
import workflow from "@convex-dev/workflow/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(agent); // the in-app agent's threads, messages and tool calls
app.use(workflow); // plan -> vote -> lock -> book -> remind, durable
app.use(presence); // who's in the chat right now
export default app;
