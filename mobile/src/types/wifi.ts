export interface IWifi {
  _id: string;
  ssid: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWifiPayload {
  ssid: string;
  password: string;
}

export interface WifiApiResponse {
  success: boolean;
  message?: string;
  data: IWifi;
}

export interface WifiListApiResponse {
  success: boolean;
  message?: string;
  data: IWifi[];
}
