import {
  ensureQueueConsistency,
  checkQueueConsistency
} from "./queueRecoveryService.js";

// ==========================================
// REPAIR REDIS AFTER A PARTIAL FAILURE
// ==========================================

export const repairQueueAfterFailure = async (
  queueId,
  lock,
  originalError
) => {
  console.error(
    `Queue operation partially failed for ${queueId}:`,
    originalError.message
  );

  try {
    // Attempt to repair Redis FIFO from MongoDB.
    const recoveryResult =
      await ensureQueueConsistency(
        queueId,
        lock
      );

    // Verify the final Redis state.
    const verification =
      await checkQueueConsistency(queueId);

    if (!verification.consistent) {
      console.error(
        `Queue recovery verification failed for ${queueId}`,
        verification
      );

      return {
        recovered: false,
        originalError,
        recoveryResult,
        verification
      };
    }

    console.log(
      `Queue consistency restored for ${queueId}`
    );

    return {
      recovered: true,
      consistency: verification
    };
  } catch (recoveryError) {
    console.error(
      `Queue recovery failed for ${queueId}:`,
      recoveryError.message
    );

    return {
      recovered: false,
      originalError,
      recoveryError
    };
  }
};