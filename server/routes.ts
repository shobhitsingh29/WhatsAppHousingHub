import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertListingSchema } from "@shared/schema";

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

  const httpServer = createServer(app);
  return httpServer;
}
