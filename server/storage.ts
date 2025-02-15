import { listings, type Listing, type InsertListing } from "@shared/schema";

export interface IStorage {
  getListings(): Promise<Listing[]>;
  getListing(id: number): Promise<Listing | undefined>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: number, listing: Partial<InsertListing>): Promise<Listing | undefined>;
  deleteListing(id: number): Promise<boolean>;
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
    const mockListings: InsertListing[] = [
      {
        title: "Modern City Apartment",
        description: "Beautiful apartment in the heart of the city",
        price: 1200,
        location: "Berlin Mitte",
        propertyType: "apartment",
        bedrooms: 2,
        bathrooms: 1,
        imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
        furnished: true,
        contactInfo: "+49 123 456789"
      },
      {
        title: "Cozy Studio",
        description: "Perfect for students and young professionals",
        price: 800,
        location: "Berlin Kreuzberg",
        propertyType: "studio",
        bedrooms: 1,
        bathrooms: 1,
        imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
        furnished: true,
        contactInfo: "+49 987 654321"
      }
    ];

    mockListings.forEach(listing => this.createListing(listing));
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
