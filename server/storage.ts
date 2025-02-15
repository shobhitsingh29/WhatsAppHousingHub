import { listings, type Listing, type InsertListing } from "@shared/schema";
import { parseWhatsAppMessage, isValidListingMessage } from "@shared/messageParser";

export interface IStorage {
  getListings(): Promise<Listing[]>;
  getListing(id: number): Promise<Listing | undefined>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: number, listing: Partial<InsertListing>): Promise<Listing | undefined>;
  deleteListing(id: number): Promise<boolean>;
  processWhatsAppMessage(message: string): Promise<Listing | undefined>;
}

export class MemStorage implements IStorage {
  private listings: Map<number, Listing>;
  private currentId: number;

  constructor() {
    this.listings = new Map();
    this.currentId = 1;
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
    if (!isValidListingMessage(message)) {
      return undefined;
    }

    const parsedListing = parseWhatsAppMessage(message);
    if (!this.isValidParsedListing(parsedListing)) {
      return undefined;
    }

    return this.createListing(parsedListing);
  }

  async getListings(): Promise<Listing[]> {
    return Array.from(this.listings.values());
  }

  async getListing(id: number): Promise<Listing | undefined> {
    return this.listings.get(id);
  }

  async createListing(insertListing: InsertListing): Promise<Listing> {
    const id = this.currentId++;
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
}

export const storage = new MemStorage();