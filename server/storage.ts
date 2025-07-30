import { type Contact, type InsertContact, type Interaction, type InsertInteraction, type Edge, type InsertEdge, type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Contacts
  getContacts(userId: string, limit?: number, offset?: number): Promise<Contact[]>;
  getContact(id: string, userId: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, userId: string, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  findContactsByName(userId: string, name: string): Promise<Contact[]>;
  
  // Interactions
  getInteractionsByContact(contactId: string): Promise<Interaction[]>;
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;
  
  // Edges
  getEdgesByContact(contactId: string): Promise<Edge[]>;
  createEdge(edge: InsertEdge): Promise<Edge>;
  
  // Analytics
  getContactCount(userId: string): Promise<number>;
  getInteractionCount(userId: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private contacts: Map<string, Contact>;
  private interactions: Map<string, Interaction>;
  private edges: Map<string, Edge>;

  constructor() {
    this.users = new Map();
    this.contacts = new Map();
    this.interactions = new Map();
    this.edges = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { 
      ...insertUser, 
      createdAt: new Date().toISOString() 
    };
    this.users.set(user.id, user);
    return user;
  }

  async getContacts(userId: string, limit = 50, offset = 0): Promise<Contact[]> {
    const userContacts = Array.from(this.contacts.values())
      .filter(contact => contact.userId === userId)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || '').getTime() - new Date(a.updatedAt || a.createdAt || '').getTime())
      .slice(offset, offset + limit);
    return userContacts;
  }

  async getContact(id: string, userId: string): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    return contact && contact.userId === userId ? contact : undefined;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const contact: Contact = { 
      ...insertContact, 
      id, 
      hebrewName: insertContact.hebrewName || null,
      englishName: insertContact.englishName || null,
      company: insertContact.company || null,
      jobTitle: insertContact.jobTitle || null,
      howMet: insertContact.howMet || null,
      tags: insertContact.tags || null,
      createdAt: now,
      updatedAt: now
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async updateContact(id: string, userId: string, updateData: Partial<InsertContact>): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (!contact || contact.userId !== userId) return undefined;
    
    const updatedContact: Contact = {
      ...contact,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async findContactsByName(userId: string, name: string): Promise<Contact[]> {
    const nameLower = name.toLowerCase();
    return Array.from(this.contacts.values()).filter(contact => 
      contact.userId === userId && (
        contact.englishName?.toLowerCase().includes(nameLower) ||
        contact.hebrewName?.toLowerCase().includes(nameLower)
      )
    );
  }

  async getInteractionsByContact(contactId: string): Promise<Interaction[]> {
    return Array.from(this.interactions.values())
      .filter(interaction => interaction.contactId === contactId)
      .sort((a, b) => new Date(b.occurredAt || b.createdAt || '').getTime() - new Date(a.occurredAt || a.createdAt || '').getTime());
  }

  async createInteraction(insertInteraction: InsertInteraction): Promise<Interaction> {
    const id = randomUUID();
    const interaction: Interaction = { 
      ...insertInteraction, 
      id,
      occurredAt: insertInteraction.occurredAt || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    this.interactions.set(id, interaction);
    return interaction;
  }

  async getEdgesByContact(contactId: string): Promise<Edge[]> {
    return Array.from(this.edges.values()).filter(edge => 
      edge.sourceContactId === contactId || edge.targetContactId === contactId
    );
  }

  async createEdge(insertEdge: InsertEdge): Promise<Edge> {
    const id = randomUUID();
    const edge: Edge = { ...insertEdge, id };
    this.edges.set(id, edge);
    return edge;
  }

  async getContactCount(userId: string): Promise<number> {
    return Array.from(this.contacts.values()).filter(contact => contact.userId === userId).length;
  }

  async getInteractionCount(userId: string): Promise<number> {
    const userContactIds = new Set(
      Array.from(this.contacts.values())
        .filter(contact => contact.userId === userId)
        .map(contact => contact.id)
    );
    return Array.from(this.interactions.values()).filter(interaction => 
      userContactIds.has(interaction.contactId)
    ).length;
  }
}

export const storage = new MemStorage();
