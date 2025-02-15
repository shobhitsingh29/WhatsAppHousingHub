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
    console.log("Processing incoming WhatsApp message:", message);

    if (!isValidListingMessage(message)) {
      console.log("Message rejected: Does not contain valid listing information");
      return undefined;
    }

    const parsedListing = parseWhatsAppMessage(message);
    if (!this.isValidParsedListing(parsedListing)) {
      console.log("Message rejected: Could not extract all required listing fields");
      console.log("Parsed fields:", JSON.stringify(parsedListing, null, 2));
      return undefined;
    }

    console.log("Creating new listing from parsed message:", JSON.stringify(parsedListing, null, 2));
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
    console.log("New listing created:", JSON.stringify(listing, null, 2));
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
    console.log("Registering new WhatsApp group for monitoring:", group.name);
    const id = this.currentGroupId++;
    const newGroup: WhatsAppGroup = {
      ...group,
      id,
      lastScraped: new Date().toISOString(),
    };

    this.whatsAppGroups.set(id, newGroup);
    console.log("WhatsApp group registered successfully:", JSON.stringify(newGroup, null, 2));
    return newGroup;
  }

  async removeWhatsAppGroup(id: number): Promise<boolean> {
    console.log("Unregistering WhatsApp group:", id);
    return this.whatsAppGroups.delete(id);
  }

  async updateGroupStatus(id: number, isActive: boolean): Promise<WhatsAppGroup | undefined> {
    const group = this.whatsAppGroups.get(id);
    if (!group) return undefined;

    const updated: WhatsAppGroup = { ...group, isActive };
    this.whatsAppGroups.set(id, updated);
    console.log(`WhatsApp group ${id} status updated to: ${isActive}`);
    return updated;
  }

  async scrapeGroupMessages(groupId: number): Promise<number> {
    const group = this.whatsAppGroups.get(groupId);
    if (!group) {
      console.log(`Group ${groupId} not found`);
      return 0;
    }

    if (!group.isActive) {
      console.log(`Group ${groupId} is not active, skipping message scrape`);
      return 0;
    }

    try {
      const messages = await whatsAppClient.getGroupMessages(group.inviteLink);
      let newListings = 0;

      for (const message of messages) {
        const listing = await this.processWhatsAppMessage(message);
        if (listing) {
          newListings++;
        }
      }

      // Update last scraped timestamp
      const updated: WhatsAppGroup = {
        ...group,
        lastScraped: new Date().toISOString(),
      };
      this.whatsAppGroups.set(groupId, updated);
      console.log(`Created ${newListings} new listings from group ${groupId}`);

      return newListings;
    } catch (error) {
      console.error(`Failed to scrape messages from group ${groupId}:`, error);
      return 0;
    }
  }

  async sendMessageToGroup(groupId: number, message: string): Promise<boolean> {
    const group = this.whatsAppGroups.get(groupId);
    if (!group) {
      console.log(`Group ${groupId} not found`);
      return false;
    }

    try {
      await whatsAppClient.sendMessage(group.inviteLink, message);
      console.log(`Message sent to group ${groupId}`);
      return true;
    } catch (error) {
      console.error(`Failed to send message to group ${groupId}:`, error);
      return false;
    }
  }
}

export const storage = new MemStorage();