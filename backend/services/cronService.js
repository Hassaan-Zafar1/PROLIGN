import cron from "node-cron";
import { autoReleaseExpiredEscrow } from "./escrowService.js";

export function initCronJobs() {
  console.log("Initializing Cron Jobs...");
  
  // Schedule autoReleaseExpiredEscrow to run every hour (at minute 0 of every hour)
  cron.schedule("0 * * * *", async () => {
    console.log(`[Cron Job] Running auto-release of expired escrow payments at ${new Date().toISOString()}`);
    try {
      const results = await autoReleaseExpiredEscrow();
      const successCount = results.filter(r => r.status === "success").length;
      const failedCount = results.filter(r => r.status === "failed").length;
      console.log(`[Cron Job] Finished auto-release. Total processed: ${results.length}. Success: ${successCount}, Failed: ${failedCount}`);
      
      // Log individual errors without crashing the job
      results.forEach(r => {
        if (r.status === "failed") {
          console.error(`[Cron Job] Failed to auto-release payment ${r.paymentId}: ${r.error}`);
        }
      });
    } catch (err) {
      console.error("[Cron Job] Global error in auto-release cron job:", err);
    }
  });

  console.log("Cron Jobs Initialized successfully.");
}
