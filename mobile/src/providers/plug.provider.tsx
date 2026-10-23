// PlugsProvider.tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "@/constants/api";
import { useGetPlugList } from "@/api";
import { OutletData, PlugData } from "@/hooks/use-control-strip";
import { useAuth } from "@/context/auth-context";

type PlugsContextValue = {
  liveData: Record<string, PlugData>;
  connected: boolean;
  sendOrder: (plugId: string, command: string) => void;
  toggleAll: (plugId: string, newState: "on" | "off") => void;
  allOutlets: OutletData[][];
};

const PlugsContext = createContext<PlugsContextValue | null>(null);

export function PlugsProvider({ children }: { children: React.ReactNode }) {
  const { data: plugs } = useGetPlugList();
  const { token } = useAuth();
  const [liveData, setLiveData] = useState<Record<string, PlugData>>({});
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const allOutlets = useMemo(
    () =>
      Object.values(liveData ?? {}).map((strip) =>
        Object.values(strip.outlets),
      ),
    [liveData],
  );

  // 1. open ONE socket
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("live_data", (d: PlugData) =>
      setLiveData((prev) => ({ ...prev, [d.plugId]: d })),
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  // 2. join every plug (again after each reconnect)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !plugs) return;

    const joinAll = () => plugs.forEach((p) => socket.emit("join_plug", p._id));
    if (socket.connected) joinAll();
    socket.on("connect", joinAll);

    return () => {
      socket.off("connect", joinAll);
    };
  }, [plugs]);

  const sendOrder = (plugId: string, command: string) => {
    socketRef.current?.emit("order_plug", { plugId, command });
  };

  const toggleAll = (plugId: string, newState: "on" | "off") => {
    socketRef.current?.emit("toggle_all_plugs", { plugId, newState });
  };

  return (
    <PlugsContext.Provider
      value={{ liveData, connected, sendOrder, toggleAll, allOutlets }}
    >
      {children}
    </PlugsContext.Provider>
  );
}

export function usePlugs() {
  const ctx = useContext(PlugsContext);
  if (!ctx) throw new Error("usePlugs must be used inside PlugsProvider");
  return ctx;
}
