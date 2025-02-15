import { listings, type Listing, type InsertListing } from "@shared/schema";
import { parseWhatsAppMessage, isValidListingMessage } from "@shared/messageParser";
import { type WhatsAppGroup, type InsertWhatsAppGroup, whatsAppClient } from "@shared/whatsapp";

export interface IStorage {
  getListings(): Promise<Listing[]>;
  getListing(id: number): Promise<Listing | undefined>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: number, listing: Partial<InsertListing>): Promise<Listing | undefined>;
  deleteListing(id: number): Promise<boolean>;
  processWhatsAppMessage(message: string): Promise<Listing | undefined>;

  getWhatsAppGroups(): Promise<WhatsAppGroup[]>;
  addWhatsAppGroup(group: InsertWhatsAppGroup): Promise<WhatsAppGroup>;
  removeWhatsAppGroup(id: number): Promise<boolean>;
  updateGroupStatus(id: number, isActive: boolean): Promise<WhatsAppGroup | undefined>;
  scrapeGroupMessages(groupId: number): Promise<number>; 
}

export class MemStorage implements IStorage {
  private listings: Map<number, Listing>;
  private whatsAppGroups: Map<number, WhatsAppGroup>;
  private currentListingId: number;
  private currentGroupId: number;

  constructor() {
    this.listings = new Map();
    this.whatsAppGroups = new Map();
    this.currentListingId = 1;
    this.currentGroupId = 1;
    this.initializeMockData();
  }

  private initializeMockData() {
    const mockMessages = [
      "2 BHK apartment available in Kreuzberg, 1200€/month, fully furnished with modern amenities, contact: +49 123 456789",
      "Studio flat in Mitte, perfect for students, 800€, furnished, WhatsApp: +49 987 654321, close to transport",
      "Beautiful 3 bedroom house in Prenzlauer Berg, 2000€, unfurnished, large garden, contact via WhatsApp: +49 555 666777"
    ];

    mockMessages.forEach(msg => {
      if (isValidListingMessage(msg)) {
        const parsedListing = parseWhatsAppMessage(msg);
        if (this.isValidParsedListing(parsedListing)) {
          this.createListing(parsedListing as InsertListing);
        }
      }
    });
  }

  private isValidParsedListing(listing: Partial<InsertListing>): listing is InsertListing {
    return !!(
      listing.title &&
      listing.description &&
      listing.price &&
      listing.location &&
      listing.propertyType &&
      listing.bedrooms &&
      listing.bathrooms &&
      listing.imageUrl !== undefined &&
      listing.furnished !== undefined &&
      listing.contactInfo
    );
  }

  async processWhatsAppMessage(message: string): Promise<Listing | undefined> {
    console.log("Processing WhatsApp message:", message);

    if (!isValidListingMessage(message)) {
      console.log("Message does not contain valid listing information");
      return undefined;
    }

    const parsedListing = parseWhatsAppMessage(message);
    if (!this.isValidParsedListing(parsedListing)) {
      console.log("Could not parse valid listing from message");
      return undefined;
    }

    console.log("Creating new listing from message");
    return this.createListing(parsedListing);
  }

  async getListings(): Promise<Listing[]> {
    return Array.from(this.listings.values());
  }

  async getListing(id: number): Promise<Listing | undefined> {
    return this.listings.get(id);
  }

  async createListing(insertListing: InsertListing): Promise<Listing> {
    const id = this.currentListingId++;
    const listing: Listing = { ...insertListing, id };
    this.listings.set(id, listing);
    return listing;
  }

  async updateListing(id: number, updates: Partial<InsertListing>): Promise<Listing | undefined> {
    const existing = this.listings.get(id);
    if (!existing) return undefined;

    const updated: Listing = { ...existing, ...updates };
    this.listings.set(id, updated);
    return updated;
  }

  async deleteListing(id: number): Promise<boolean> {
    return this.listings.delete(id);
  }

  async getWhatsAppGroups(): Promise<WhatsAppGroup[]> {
    return Array.from(this.whatsAppGroups.values());
  }

  async addWhatsAppGroup(group: InsertWhatsAppGroup): Promise<WhatsAppGroup> {
    // Register the group without trying to join it through API
    const id = this.currentGroupId++;
    const newGroup: WhatsAppGroup = {
      ...group,
      id,
      lastScraped: new Date().toISOString(),
    };

    this.whatsAppGroups.set(id, newGroup);
    return newGroup;
  }

  async removeWhatsAppGroup(id: number): Promise<boolean> {
    return this.whatsAppGroups.delete(id);
  }

  async updateGroupStatus(id: number, isActive: boolean): Promise<WhatsAppGroup | undefined> {
    const group = this.whatsAppGroups.get(id);
    if (!group) return undefined;

    const updated: WhatsAppGroup = { ...group, isActive };
    this.whatsAppGroups.set(id, updated);
    return updated;
  }

  async scrapeGroupMessages(groupId: number): Promise<number> {
    const group = this.whatsAppGroups.get(groupId);
    if (!group) return 0;

    // Update last scraped timestamp
    const updated: WhatsAppGroup = {
      ...group,
      lastScraped: new Date().toISOString(),
    };
    this.whatsAppGroups.set(groupId, updated);

    // Messages will come through webhooks, so just acknowledge the scrape request
    return 0;
  }
}

export const storage = new MemStorage();