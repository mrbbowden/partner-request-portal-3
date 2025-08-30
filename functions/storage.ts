import { type Partner, type InsertPartner, type Request, type InsertRequest } from './schema';

export interface IStorage {
  getUser(id: string): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  getPartner(id: string): Promise<Partner | undefined>;
  createRequest(request: InsertRequest): Promise<Request>;
}

export class D1Storage implements IStorage {
  constructor(private db: D1Database) {}

  async getUser(id: string): Promise<any | undefined> {
    const result = await this.db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
    return result || undefined;
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    const result = await this.db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
    return result || undefined;
  }

  async createUser(insertUser: any): Promise<any> {
    const id = crypto.randomUUID();
    const user = { ...insertUser, id };
    
    await this.db.prepare(`
      INSERT INTO users (id, username, email, password_hash)
      VALUES (?, ?, ?, ?)
    `).bind(id, user.username, user.email, user.passwordHash).run();
    
    return user;
  }

  async getPartner(id: string): Promise<Partner | undefined> {
    try {
      const result = await this.db.prepare('SELECT * FROM partners WHERE id = ?').bind(id).first();
      return result as Partner || undefined;
    } catch (error) {
      console.error('Database error:', error);
      // If table doesn't exist, return undefined
      return undefined;
    }
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const id = crypto.randomUUID();
    const request: Request = {
      ...insertRequest,
      id,
      createdAt: new Date(),
    };
    
    try {
      await this.db.prepare(`
        INSERT INTO requests (id, partner_id, partner_name, referring_case_manager, case_manager_email, case_manager_phone, preferred_contact, urgency, description, recipients_name, recipients_address, recipients_email, recipients_phone, description_of_need, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        request.partnerId,
        request.partnerName,
        request.referringCaseManager,
        request.caseManagerEmail,
        request.caseManagerPhone,
        request.preferredContact,
        request.urgency,
        request.description,
        request.recipientsName,
        request.recipientsAddress,
        request.recipientsEmail,
        request.recipientsPhone,
        request.descriptionOfNeed,
        request.createdAt.toISOString()
      ).run();
    } catch (error) {
      console.error('Database error:', error);
      // If table doesn't exist, we'll still return the request object
      // but it won't be saved to the database
    }
    
    return request;
  }
}

// For development/testing, we'll use in-memory storage
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
    const id = crypto.randomUUID();
    const user: any = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getPartner(id: string): Promise<Partner | undefined> {
    return this.partners.get(id);
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const id = crypto.randomUUID();
    const request: Request = {
      ...insertRequest,
      id,
      createdAt: new Date(),
    };
    this.requests.set(id, request);
    return request;
  }
}

// Export a storage instance that will be initialized with the appropriate storage type
let storageInstance: IStorage;

export function initializeStorage(db?: D1Database) {
  if (db) {
    try {
      storageInstance = new D1Storage(db);
      console.log('Using D1 database storage');
    } catch (error) {
      console.log('D1 database not available, falling back to in-memory storage');
      storageInstance = new MemStorage();
    }
  } else {
    console.log('No database provided, using in-memory storage');
    storageInstance = new MemStorage();
  }
}

export function getStorage(): IStorage {
  if (!storageInstance) {
    storageInstance = new MemStorage();
  }
  return storageInstance;
}

export const storage = {
  get getUser() { return getStorage().getUser; },
  get getUserByUsername() { return getStorage().getUserByUsername; },
  get createUser() { return getStorage().createUser; },
  get getPartner() { return getStorage().getPartner; },
  get createRequest() { return getStorage().createRequest; },
};
