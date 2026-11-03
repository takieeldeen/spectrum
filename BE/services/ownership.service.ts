import mongoose from "mongoose";
import OwnershipModel from "../models/ownership.model";
import { IOwnership } from "../types/ownership.type";

export class OwnershipService {
  /**
   * Adds an ownership record linking a user to a plug
   */
  async addOwnership(userId: string, plugId: string): Promise<IOwnership> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const plugObjectId = new mongoose.Types.ObjectId(plugId);

    const ownership = await OwnershipModel.findOneAndUpdate(
      { user: userObjectId, plug: plugObjectId },
      { user: userObjectId, plug: plugObjectId },
      { new: true, upsert: true }
    );

    return ownership;
  }

  /**
   * Removes an ownership record between a user and a plug
   */
  async removeOwnership(userId: string, plugId: string): Promise<boolean> {
    const result = await OwnershipModel.findOneAndDelete({
      user: new mongoose.Types.ObjectId(userId),
      plug: new mongoose.Types.ObjectId(plugId),
    });
    return Boolean(result);
  }

  /**
   * Checks if a user has ownership of a plug
   */
  async hasOwnership(userId: string, plugId: string): Promise<boolean> {
    if (!userId || !plugId) return false;
    try {
      const exists = await OwnershipModel.exists({
        user: new mongoose.Types.ObjectId(userId),
        plug: new mongoose.Types.ObjectId(plugId),
      });
      return Boolean(exists);
    } catch {
      return false;
    }
  }

  /**
   * Retrieves all users who own a plug
   */
  async getPlugOwners(plugId: string): Promise<IOwnership[]> {
    return await OwnershipModel.find({
      plug: new mongoose.Types.ObjectId(plugId),
    })
      .populate("user", "name email")
      .sort({ createdAt: 1 });
  }

  /**
   * Retrieves all plug IDs owned by a user
   */
  async getUserPlugIds(userId: string): Promise<mongoose.Types.ObjectId[]> {
    if (!userId) return [];
    const ownerships = await OwnershipModel.find({
      user: new mongoose.Types.ObjectId(userId),
    }).select("plug");

    return ownerships
      .map((doc) => doc.plug as mongoose.Types.ObjectId)
      .filter(Boolean);
  }
}

export default new OwnershipService();
