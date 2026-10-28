import { IDevice } from "./device";

export type GuardAction = "ON" | "OFF";

export type GuardTarget = "CURRENT" | "TEMPERATURE" | "POWER";

export type GuardComparator = "MAX" | "MIN";

export interface IGuard {
  _id: string;
  deviceId?: string | IDevice;
  action: GuardAction;
  target: GuardTarget;
  comparator: GuardComparator;
  value: number;
  isEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
