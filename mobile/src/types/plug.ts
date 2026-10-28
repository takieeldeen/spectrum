export interface IPlug {
  _id?: string;
  user?: string;
  name: string;
  arabicName?: string;
  nameAr?: string;
  nameEn?: string;
  serialNumber: string;
  SSID?: string;
  wifiPassword?: string;
  ipAddress?: string;
  roomId?: string;
  connected?: boolean;
  isOnline?: boolean;
  createdAt?: string;
  updatedAt?: string;
  outlets?: Record<string, any>;
  device1?: string;
  device2?: string;
  device3?: string;
  device4?: string;
}

export interface CreatePlugPayload {
  name: string;
  arabicName?: string;
  serialNumber: string;
  SSID?: string;
  wifiPassword?: string;
  ipAddress?: string;
  roomId?: string;
  device1?: string;
  device2?: string;
  device3?: string;
  device4?: string;
}

export interface PlugApiResponse {
  success: boolean;
  message?: string;
  data: IPlug;
}

export interface PlugListApiResponse {
  success: boolean;
  message?: string;
  data: IPlug[];
}
