import { User } from "./user";
import { IPlug } from "./plug";

export interface IOwnership {
  _id: string;
  user: string | User;
  plug: string | IPlug;
  createdAt?: string;
  updatedAt?: string;
}

export interface JoinPlugPayload {
  plugId: string;
}

export interface OwnershipListApiResponse {
  success: boolean;
  message?: string;
  data: IOwnership[];
}

export interface OwnershipApiResponse {
  success: boolean;
  message?: string;
  data: IOwnership;
}
