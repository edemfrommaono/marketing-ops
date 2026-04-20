import { queue } from "@/server/queue/worker";
import { EmailJob } from "@/server/queue/jobs";

export async function enqueueEmail(job: EmailJob) {
  await queue.add("email", job, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
  });
}
