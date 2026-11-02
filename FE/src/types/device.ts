export interface IDevice {
  _id: string;
  name: string;
  plugId?: {
    _id: string;
    name: string;
  } | string;
  plugPort?: number;
  createdAt?: string;
  updatedAt?: string;
  lastTurnedOn?: string;
  timerClosesAt?: string | null;
  timerDurationMins?: number | null;
}

