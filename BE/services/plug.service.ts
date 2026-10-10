import PlugModel from '../models/plug.model';
import { IPlug } from '../types/plug.type';

export class PlugService {
  /**
   * Creates a new Plug entity in the database
   * @param data The plug data to be inserted
   * @returns The created plug entity
   */
  async createPlug(data: Partial<IPlug>): Promise<IPlug> {
    return await PlugModel.create(data);
  }

  /**
   * Retrieves all Plug entities from the database
   * @returns Array of plug entities
   */
  async getAllPlugs(): Promise<IPlug[]> {
    return await PlugModel.find({});
  }

  /**
   * Retrieves a single Plug entity by ID
   * @param id The ID of the plug
   * @returns The plug entity or null if not found
   */
  async getPlugById(id: string): Promise<IPlug | null> {
    return await PlugModel.findById(id);
  }
}

export default new PlugService();
