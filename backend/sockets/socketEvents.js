let ioInstance = null;

export const setSocketIO = (io) => {
  ioInstance = io;
};

export const emitQueueUpdate = (queueId) => {
  if (!ioInstance) return;

  ioInstance.emit("queue_updated", {
    queueId: queueId.toString(),
    timestamp: new Date().toISOString()
  });
};