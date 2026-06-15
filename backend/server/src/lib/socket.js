// Thin wrapper around the Socket.IO server so any route can broadcast a
// catalogue change. The frontend listens for "catalog:updated" and re-fetches.
let ioInstance = null;

export function initSocket(io) {
  ioInstance = io;
}

export function emitCatalogUpdate(reason = "update") {
  if (ioInstance) ioInstance.emit("catalog:updated", { reason, at: Date.now() });
}
