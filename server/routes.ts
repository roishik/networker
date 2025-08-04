import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema, insertInteractionSchema, insertEdgeSchema, type Contact } from "@shared/schema";
import { parseNoteText } from "../client/src/lib/text-parser";
import { setupAuth, isAuthenticated } from "./replitAuth";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Contacts routes
  app.get("/api/contacts", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const contacts = await storage.getContacts(userId, limit, offset);
    res.json(contacts);
  });

  app.get("/api/contacts/:id", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const contact = await storage.getContact(req.params.id, userId);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    
    res.json(contact);
  });

  app.post("/api/contacts", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;

    try {
      const contactData = insertContactSchema.parse({ ...req.body, userId });
      const contact = await storage.createContact(contactData);
      res.json(contact);
    } catch (error) {
      res.status(400).json({ message: "Invalid contact data" });
    }
  });

  app.patch("/api/contacts/:id", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;

    try {
      const updateData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(req.params.id, userId, updateData);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.json(contact);
    } catch (error) {
      res.status(400).json({ message: "Invalid contact data" });
    }
  });

  // Smart note parsing and contact creation
  app.post("/api/notes", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;

    try {
      const { body } = req.body;
      if (!body || typeof body !== 'string') {
        return res.status(400).json({ message: "Note body is required" });
      }

      const parsed = parseNoteText(body);
      
      // Check for duplicates if we have a name
      let duplicates: Contact[] = [];
      if (parsed.englishName || parsed.hebrewName) {
        const searchName = parsed.englishName || parsed.hebrewName || '';
        duplicates = await storage.findContactsByName(userId, searchName);
      }

      if (duplicates.length > 0) {
        return res.json({ 
          duplicates, 
          parsed,
          requiresConfirmation: true 
        });
      }

      // Create new contact
      const contactData = insertContactSchema.parse({
        userId,
        englishName: parsed.englishName,
        hebrewName: parsed.hebrewName,
        company: parsed.company,
        jobTitle: parsed.jobTitle,
        howMet: parsed.howMet || (parsed.introducedBy ? `Introduced by ${parsed.introducedBy}` : undefined),
        tags: parsed.tags
      });

      const contact = await storage.createContact(contactData);

      // Create interaction
      const interactionData = insertInteractionSchema.parse({
        contactId: contact.id,
        body: parsed.remainingText || body
      });

      await storage.createInteraction(interactionData);

      // Create edge if introduction detected
      if (parsed.introducedBy) {
        const introducerContacts = await storage.findContactsByName(userId, parsed.introducedBy);
        if (introducerContacts.length > 0) {
          const edgeData = insertEdgeSchema.parse({
            sourceContactId: introducerContacts[0].id,
            targetContactId: contact.id,
            relationType: 'introduced_by' as const
          });
          await storage.createEdge(edgeData);
        }
      }

      res.json({ contact, created: true });
    } catch (error) {
      console.error('Note parsing error:', error);
      res.status(400).json({ message: "Failed to process note" });
    }
  });

  // Confirm contact creation after duplicate check
  app.post("/api/notes/confirm", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;

    try {
      const { action, contactId, parsed, body } = req.body;
      
      if (action === 'merge' && contactId) {
        // Add interaction to existing contact
        const interactionData = insertInteractionSchema.parse({
          contactId,
          body: parsed.remainingText || body
        });
        await storage.createInteraction(interactionData);
        
        const contact = await storage.getContact(contactId, userId);
        res.json({ contact, merged: true });
      } else {
        // Create new contact
        const contactData = insertContactSchema.parse({
          userId,
          englishName: parsed.englishName,
          hebrewName: parsed.hebrewName,
          company: parsed.company,
          jobTitle: parsed.jobTitle,
          howMet: parsed.howMet || (parsed.introducedBy ? `Introduced by ${parsed.introducedBy}` : undefined),
          tags: parsed.tags
        });

        const contact = await storage.createContact(contactData);

        const interactionData = insertInteractionSchema.parse({
          contactId: contact.id,
          body: parsed.remainingText || body
        });

        await storage.createInteraction(interactionData);

        res.json({ contact, created: true });
      }
    } catch (error) {
      res.status(400).json({ message: "Failed to confirm contact" });
    }
  });

  // AI extraction endpoint
  app.post("/api/notes/extract-ai", isAuthenticated, async (req: any, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ message: "Text is required" });
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert at extracting contact information from networking notes. Extract all relevant information from the text and return it as JSON with these fields:
            - englishName: Person's name in English
            - hebrewName: Person's name in Hebrew (if mentioned)
            - company: Company name
            - jobTitle: Job title or position
            - howMet: Where/how they met (event, introduction, etc.)
            - introducedBy: Name of person who introduced them
            - followUpDate: Any follow-up dates mentioned (ISO format)
            - family: Family information mentioned (spouse, children, etc.)
            - notes: Additional notes or observations
            - tags: Array of relevant tags based on context (max 3)
            
            Only include fields that have clear values in the text. Return empty strings for missing fields, except tags which should be an array.`
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const extractedData = JSON.parse(response.choices[0].message.content || '{}');
      
      // Clean up empty fields
      const cleanedData = Object.fromEntries(
        Object.entries(extractedData).filter(([_, value]) => {
          if (Array.isArray(value)) return value.length > 0;
          return value && value !== '';
        })
      );

      res.json(cleanedData);
    } catch (error) {
      console.error('AI extraction error:', error);
      res.status(500).json({ message: "AI extraction failed" });
    }
  });

  // Interactions routes
  app.get("/api/contacts/:id/interactions", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;

    // Verify contact belongs to user
    const contact = await storage.getContact(req.params.id, userId);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    const interactions = await storage.getInteractionsByContact(req.params.id);
    res.json(interactions);
  });

  app.post("/api/contacts/:id/interactions", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;

    // Verify contact belongs to user
    const contact = await storage.getContact(req.params.id, userId);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    try {
      const interactionData = insertInteractionSchema.parse({
        ...req.body,
        contactId: req.params.id
      });
      
      const interaction = await storage.createInteraction(interactionData);
      res.json(interaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid interaction data" });
    }
  });

  // Edges/relationships routes
  app.get("/api/contacts/:id/edges", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;

    // Verify contact belongs to user
    const contact = await storage.getContact(req.params.id, userId);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    const edges = await storage.getEdgesByContact(req.params.id);
    res.json(edges);
  });

  // CSV Export
  app.get("/api/export/csv", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;

    try {
      const contacts = await storage.getContacts(userId, 1000, 0);
      const allInteractions = [];
      
      for (const contact of contacts) {
        const interactions = await storage.getInteractionsByContact(contact.id);
        allInteractions.push(...interactions.map(i => ({ ...i, contact })));
      }

      // Generate CSV
      const csvHeaders = [
        'Contact ID', 'English Name', 'Hebrew Name', 'Company', 'Job Title', 
        'How Met', 'Tags', 'Contact Created', 'Interaction ID', 'Interaction Body', 
        'Interaction Date'
      ];

      const csvRows = allInteractions.map(({ contact, ...interaction }) => [
        contact.id,
        contact.englishName || '',
        contact.hebrewName || '',
        contact.company || '',
        contact.jobTitle || '',
        contact.howMet || '',
        (contact.tags || []).join(';'),
        contact.createdAt,
        interaction.id,
        interaction.body,
        interaction.occurredAt
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="networker-export.csv"');
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ message: "Export failed" });
    }
  });

  // Stats
  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;

    const contactCount = await storage.getContactCount(userId);
    const interactionCount = await storage.getInteractionCount(userId);
    
    res.json({
      totalContacts: contactCount,
      totalInteractions: interactionCount
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
