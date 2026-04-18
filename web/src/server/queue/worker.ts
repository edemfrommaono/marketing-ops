import { Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");

export const syncWorker = new Worker("syncQueue", async job => {
  if (job.name === "odooSync") {
    console.log("Executing background Odoo sync for user", job.data.userId);
    // Call OdooClient logic here
  }
}, { connection });
