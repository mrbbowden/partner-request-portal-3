import { type Partner, type InsertPartner, type Request, type InsertRequest } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  getPartner(id: string): Promise<Partner | undefined>;
  createRequest(request: InsertRequest): Promise<Request>;
}

export class MemStorage implements IStorage {
  private users: Map<string, any>;
  private partners: Map<string, Partner>;
  private requests: Map<string, Request>;

  constructor() {
    this.users = new Map();
    this.partners = new Map();
    this.requests = new Map();

    // Initialize with sample partner data
    const samplePartners: Partner[] = [
      {
        id: "1234",
        fullName: "Sarah Johnson",
        email: "sarah.johnson@example.com",
        phone: "(555) 123-4567"
      },
      {
        id: "5678",
        fullName: "Michael Chen",
        email: "michael.chen@example.com",
        phone: "(555) 987-6543"
      },
      {
        id: "9876",
        fullName: "Emma Rodriguez",
        email: "emma.rodriguez@example.com",
        phone: "(555) 456-7890"
      }
    ];

    samplePartners.forEach(partner => {
      this.partners.set(partner.id, partner);
    });
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
    const user: any = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getPartner(id: string): Promise<Partner | undefined> {
    return this.partners.get(id);
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const id = randomUUID();
    const request: Request = {
      ...insertRequest,
      id,
      createdAt: new Date(),
    };
    this.requests.set(id, request);
    return request;
  }
}

export const storage = new MemStorage();
