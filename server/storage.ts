import { type DrawRecord, type InsertDrawRecord } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  getDrawHistory(sessionId: string): Promise<DrawRecord[]>;
  addDrawRecord(record: InsertDrawRecord): Promise<DrawRecord>;
  clearDrawHistory(sessionId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, any>;
  private drawRecords: Map<string, DrawRecord>;

  constructor() {
    this.users = new Map();
    this.drawRecords = new Map();
  }

  async getUser(id: string): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDrawHistory(sessionId: string): Promise<DrawRecord[]> {
    return Array.from(this.drawRecords.values())
      .filter(record => record.sessionId === sessionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async addDrawRecord(record: InsertDrawRecord): Promise<DrawRecord> {
    const id = randomUUID();
    const drawRecord: DrawRecord = {
      id,
      ...record,
      timestamp: new Date(),
    };
    this.drawRecords.set(id, drawRecord);
    return drawRecord;
  }

  async clearDrawHistory(sessionId: string): Promise<void> {
    const toDelete = Array.from(this.drawRecords.entries())
      .filter(([_, record]) => record.sessionId === sessionId)
      .map(([id, _]) => id);
    
    toDelete.forEach(id => this.drawRecords.delete(id));
  }
}

export const storage = new MemStorage();
