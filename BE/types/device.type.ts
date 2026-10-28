import { Document, Types } from 'mongoose';

export interface IDevice extends Document {
  _id: Types.ObjectId;
  name: string;
  plugId?: Types.ObjectId;
  plugPort?: number;
  lastTurnedOn?: Date;
  timerClosesAt?: Date | null;
  timerDurationMins?: number | null;
}

