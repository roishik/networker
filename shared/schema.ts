import { sql } from "drizzle-orm";
import { pgTable, text, varchar, uuid, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const relationTypeEnum = pgEnum('relation_type', ['introduced_by', 'same_company']);

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  hebrewName: text("hebrew_name"),
  englishName: text("english_name"),
  company: text("company"),
  jobTitle: text("job_title"),
  howMet: text("how_met"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const interactions = pgTable("interactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  contactId: uuid("contact_id").references(() => contacts.id).notNull(),
  body: text("body").notNull(),
  occurredAt: date("occurred_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const edges = pgTable("edges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceContactId: uuid("source_contact_id").references(() => contacts.id).notNull(),
  targetContactId: uuid("target_contact_id").references(() => contacts.id).notNull(),
  relationType: relationTypeEnum("relation_type").notNull(),
});

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: timestamp("expire").notNull(),
  }
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  createdAt: true,
});

export const insertEdgeSchema = createInsertSchema(edges).omit({
  id: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Edge = typeof edges.$inferSelect;
export type InsertEdge = z.infer<typeof insertEdgeSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
