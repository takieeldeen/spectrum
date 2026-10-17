export interface IDevice {
  _id: string;
  nameEn: string;
  nameAr?: string;
  plugId?:
    | {
        _id: string;
        arabicName: string;
        name: string;
      }
    | string;
  plugPort?: number;
  createdAt?: string;
  updatedAt?: string;
  lastTurnedOn?: string;
}
