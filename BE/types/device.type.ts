import { Document, Types } from 'mongoose';

export interface IDevice extends Document {
  _id: Types.ObjectId;
  nameEn: string;
  nameAr?: string;
  plugId?: Types.ObjectId;
  plugPort?: number;
  lastTurnedOn?: Date;
}
