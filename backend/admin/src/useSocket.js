import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { api } from "./api.js";

let socket;
function getSocket() {
  if (!socket) socket = io(api.url, { transports: ["websocket", "polling"] });
  return socket;
}

// Returns a counter that bumps whenever the backend broadcasts a catalogue
// change. Pages put it in their fetch effect deps to auto-refresh (handy when
// multiple admin tabs are open).
export function useCatalogVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const s = getSocket();
    const onUpdate = () => setVersion((v) => v + 1);
    s.on("catalog:updated", onUpdate);
    return () => s.off("catalog:updated", onUpdate);
  }, []);
  return version;
}
