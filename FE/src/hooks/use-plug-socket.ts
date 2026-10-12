import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { CONFIG } from 'src/config-global';
import { toast } from 'src/components/snackbar';

// The URL should match where your Node backend is running (strip the /api suffix).
const SOCKET_URL = (CONFIG.serverUrl || 'http://localhost:8080').replace(/\/api$/, '');

export function usePlugSocket(plugId: string) {
  const { t } = useTranslation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [liveData, setLiveData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!plugId) return;

    // 1. Connect to the WebSocket Server
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      upgrade: false,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket backend');

      // 2. Join the dedicated room for this plug
      socketInstance.emit('join_plug', plugId);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket backend');
    });

    // 3. Listen for the real-time stream from hardware
    socketInstance.on('live_data', (payload) => {
      // payload will contain the parsed JSON from the hardware
      setLiveData(payload);
    });

    // 4. Listen for safety guard triggers from backend hardware protection
    socketInstance.on('guard_triggered', (payload: any) => {
      console.warn('🚨 Guard triggered event received from strip:', payload);
      const isPower = payload.target === 'POWER';

      let description = '';
      if (isPower && payload.comparator === 'MAX') {
        description = t('GUARD_TRIGGERED_MAX_POWER');
      } else {
        const metricLabel =
          payload.target === 'POWER'
            ? t('POWER_CONSUMPTION')
            : payload.target === 'CURRENT'
              ? t('CURRENT')
              : t('TEMPERATURE');
        description = `${payload.deviceName || ''}: ${payload.comparator === 'MAX' ? t('GUARD_MAX') : t('GUARD_MIN')} ${metricLabel}`;
      }

      toast.warning(t('WARNING'), description);
    });

    setSocket(socketInstance);

    // 5. Disconnect when the user leaves the details page
    return () => {
      socketInstance.disconnect();
    };
  }, [plugId, t]);

  // 5. A helper function to send actions back to the power strip (Phase 5)
  const sendOrder = useCallback(
    (command: string) => {
      if (socket && isConnected) {
        socket.emit('order_plug', { plugId, command });
      } else {
        console.warn('Socket is not connected. Cannot send order.');
      }
    },
    [socket, isConnected, plugId]
  );

  const toggleOutlet = useCallback(
    (newState: 'on' | 'off', outletNumber: number) => {
      sendOrder(`up:onoff:${outletNumber}:${newState}\r\n`);
    },
    [sendOrder]
  );

  const toggleMultipleOutlets = useCallback(
    (newState: 'on' | 'off', outletNumbers: number[]) => {
      outletNumbers.forEach((num) => {
        sendOrder(`up:onoff:${num}:${newState}\r\n`);
      });
    },
    [sendOrder]
  );

  return { liveData, isConnected, sendOrder, toggleOutlet, toggleMultipleOutlets };
}
