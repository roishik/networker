import { users, contacts, interactions, edges, type User, type InsertUser, type Contact, type InsertContact, type Interaction, type InsertInteraction, type Edge, type InsertEdge } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: InsertUser): Promise<User>;

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

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Contact operations with proper user isolation
  async getContacts(userId: string, limit = 50, offset = 0): Promise<Contact[]> {
    return await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(desc(contacts.updatedAt))
      .limit(limit)
      .offset(offset);
  }

  async getContact(id: string, userId: string): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
    return contact || undefined;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values(insertContact)
      .returning();
    return contact;
  }

  async updateContact(id: string, userId: string, updateData: Partial<InsertContact>): Promise<Contact | undefined> {
    const [contact] = await db
      .update(contacts)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
      .returning();
    return contact || undefined;
  }

  async findContactsByName(userId: string, name: string): Promise<Contact[]> {
    return await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.userId, userId),
          or(
            ilike(contacts.englishName, `%${name}%`),
            ilike(contacts.hebrewName, `%${name}%`)
          )
        )
      );
  }

  // Interaction operations with proper access control
  async getInteractionsByContact(contactId: string): Promise<Interaction[]> {
    return await db
      .select()
      .from(interactions)
      .where(eq(interactions.contactId, contactId))
      .orderBy(desc(interactions.occurredAt));
  }

  async createInteraction(insertInteraction: InsertInteraction): Promise<Interaction> {
    const [interaction] = await db
      .insert(interactions)
      .values(insertInteraction)
      .returning();
    return interaction;
  }

  // Edge operations
  async getEdgesByContact(contactId: string): Promise<Edge[]> {
    return await db
      .select()
      .from(edges)
      .where(
        or(
          eq(edges.sourceContactId, contactId),
          eq(edges.targetContactId, contactId)
        )
      );
  }

  async createEdge(insertEdge: InsertEdge): Promise<Edge> {
    const [edge] = await db
      .insert(edges)
      .values(insertEdge)
      .returning();
    return edge;
  }

  // Analytics operations with user isolation
  async getContactCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(eq(contacts.userId, userId));
    return result[0]?.count || 0;
  }

  async getInteractionCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(interactions)
      .innerJoin(contacts, eq(interactions.contactId, contacts.id))
      .where(eq(contacts.userId, userId));
    return result[0]?.count || 0;
  }
}

export const storage = new DatabaseStorage();
