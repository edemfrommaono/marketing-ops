import { Worker } from "bullmq";
import IORedis from "ioredis";

// BullMQ requires maxRetriesPerRequest: null for blocking commands (BRPOP etc.)
const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

connection.on("connect", () => console.log("🔗 Worker Redis connected"));
connection.on("error",   (err) => console.error("Redis error:", err.message));

export const syncWorker = new Worker(
  "syncQueue",
  async (job) => {
    console.log(`📦 Job [${job.name}] received — id: ${job.id}`);

    if (job.name === "odooSync") {
      console.log("🔄 Executing Odoo sync for user", job.data.userId);
      // TODO: call OdooClient.syncData(job.data.userId)
    }

    if (job.name === "sendReminder") {
      console.log("📧 Sending reminder for content", job.data.contentId);
      // TODO: call SMTP service
    }
  },
  { connection },
);

syncWorker.on("completed", (job) => console.log(`✅ Job [${job.name}] completed`));
syncWorker.on("failed",    (job, err) => console.error(`❌ Job [${job?.name}] failed:`, err.message));

console.log("🚀 BullMQ worker started — listening on queue: syncQueue");
