import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { SOCKET_URL } from "@/constants/api";
import { useGetPlugList } from "@/api";
import { OutletData, PlugData } from "@/hooks/use-control-strip";
import { useAuth } from "@/context/auth-context";
import { useSnackbar } from "@/components/ui/snackbar-provider";
import { normalizeNotification } from "@/utils/notification-normalizer";
import { INotificationItem } from "@/types/notifications";

type PlugsContextValue = {
  liveData: Record<string, PlugData>;
  connected: boolean;
  sendOrder: (plugId: string, command: string) => void;
  toggleAll: (plugId: string, newState: "on" | "off") => void;
  joinPlug: (plugId: string) => void;
  allOutlets: OutletData[][];
  socket: Socket | null;
};

const PlugsContext = createContext<PlugsContextValue | null>(null);

export function PlugsProvider({ children }: { children: React.ReactNode }) {
  const { data: plugs } = useGetPlugList();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

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

    // Listen for real-time notifications
    socket.on("notification", (rawItem: INotificationItem) => {
      console.log("🔔 Real-time notification received via socket:", rawItem);
      const normalized = normalizeNotification(rawItem, tRef.current);

      // In-app alert banner
      snackbar.warning(`${normalized.title}: ${normalized.body}`, {
        autoHideDuration: 6000,
        position: "top",
      });

      // Optimistically prepend to TanStack Query cache
      queryClient.setQueriesData({ queryKey: ["notifications", "list"] }, (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return {
            pages: [
              {
                success: true,
                items: [rawItem],
                total: 1,
                page: 1,
                totalPages: 1,
                hasMore: false,
              },
            ],
            pageParams: [1],
          };
        }

        const newPages = [...oldData.pages];
        const firstPage = newPages[0];
        // Deduplicate
        if (firstPage.items && firstPage.items.some((i: any) => i._id === rawItem._id)) {
          return oldData;
        }

        newPages[0] = {
          ...firstPage,
          items: [rawItem, ...(firstPage.items || [])],
          total: (firstPage.total || 0) + 1,
        };

        return {
          ...oldData,
          pages: newPages,
        };
      });

      // Background refetch invalidation
      queryClient.invalidateQueries({
        queryKey: ["notifications", "list"],
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
        refetchType: "active",
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const joinedPlugsRef = useRef<Set<string>>(new Set());

  // Reset joined plugs on disconnect
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleDisconnect = () => {
      joinedPlugsRef.current.clear();
    };

    socket.on("disconnect", handleDisconnect);
    return () => {
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  // 2. join every plug (again after each reconnect)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !plugs) return;

    const joinAll = () => {
      plugs.forEach((p) => {
        if (p._id && !joinedPlugsRef.current.has(p._id)) {
          joinedPlugsRef.current.add(p._id);
          socket.emit("join_plug", p._id);
        }
      });
    };

    if (socket.connected) joinAll();
    socket.on("connect", joinAll);

    return () => {
      socket.off("connect", joinAll);
    };
  }, [plugs]);

  const sendOrder = useCallback((plugId: string, command: string) => {
    socketRef.current?.emit("order_plug", { plugId, command });
  }, []);

  const toggleAll = useCallback(
    (plugId: string, newState: "on" | "off") => {
      socketRef.current?.emit("toggle_all_plugs", { plugId, newState });
    },
    [],
  );

  const joinPlug = useCallback((plugId: string) => {
    if (plugId) {
      joinedPlugsRef.current.add(plugId);
      socketRef.current?.emit("join_plug", plugId);
    }
  }, []);

  return (
    <PlugsContext.Provider
      value={{
        liveData,
        connected,
        sendOrder,
        toggleAll,
        joinPlug,
        allOutlets,
        socket: socketRef.current,
      }}
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
