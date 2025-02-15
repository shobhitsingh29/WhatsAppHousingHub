import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertListingSchema } from "@shared/schema";
import { whatsAppGroupSchema } from "@shared/whatsapp";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/listings", async (_req, res) => {
    const listings = await storage.getListings();
    res.json(listings);
  });

  app.get("/api/listings/:id", async (req, res) => {
    const listing = await storage.getListing(Number(req.params.id));
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    res.json(listing);
  });

  app.post("/api/listings", async (req, res) => {
    try {
      const data = insertListingSchema.parse(req.body);
      const listing = await storage.createListing(data);
      res.status(201).json(listing);
    } catch (error) {
      res.status(400).json({ message: "Invalid listing data" });
    }
  });

  app.patch("/api/listings/:id", async (req, res) => {
    try {
      const updates = insertListingSchema.partial().parse(req.body);
      const listing = await storage.updateListing(Number(req.params.id), updates);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      res.json(listing);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  app.delete("/api/listings/:id", async (req, res) => {
    const success = await storage.deleteListing(Number(req.params.id));
    if (!success) {
      return res.status(404).json({ message: "Listing not found" });
    }
    res.status(204).send();
  });

  // WhatsApp Group Management Routes
  app.get("/api/whatsapp-groups", async (_req, res) => {
    const groups = await storage.getWhatsAppGroups();
    res.json(groups);
  });

  app.post("/api/whatsapp-groups", async (req, res) => {
    try {
      const { name, inviteLink, isActive = true } = req.body;
      const group = await storage.addWhatsAppGroup({ name, inviteLink, isActive });
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to add WhatsApp group" 
      });
    }
  });

  app.delete("/api/whatsapp-groups/:id", async (req, res) => {
    const success = await storage.removeWhatsAppGroup(Number(req.params.id));
    if (!success) {
      return res.status(404).json({ message: "WhatsApp group not found" });
    }
    res.status(204).send();
  });

  app.patch("/api/whatsapp-groups/:id/status", async (req, res) => {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be a boolean" });
    }

    const group = await storage.updateGroupStatus(Number(req.params.id), isActive);
    if (!group) {
      return res.status(404).json({ message: "WhatsApp group not found" });
    }
    res.json(group);
  });

  app.post("/api/whatsapp-groups/:id/scrape", async (req, res) => {
    try {
      const newListings = await storage.scrapeGroupMessages(Number(req.params.id));
      res.json({ 
        message: `Successfully scraped messages and created ${newListings} new listings`
      });
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to scrape messages" 
      });
    }
  });

  app.post("/api/process-message", async (req, res) => {
    const { message } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "Invalid message format" });
    }

    const listing = await storage.processWhatsAppMessage(message);
    if (!listing) {
      return res.status(400).json({ 
        message: "Could not extract valid listing information from the message" 
      });
    }

    res.status(201).json(listing);
  });

  const httpServer = createServer(app);
  return httpServer;
}