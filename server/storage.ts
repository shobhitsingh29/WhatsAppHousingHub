import pg from 'pg';
import { listings, type Listing, type InsertListing } from '@shared/schema';
import {
  parseWhatsAppMessage,
  isValidListingMessage,
} from '@shared/messageParser';
import {
  type WhatsAppGroup,
  type InsertWhatsAppGroup,
  whatsAppClient,
} from '@shared/whatsapp';

const { Pool } = pg;

const pool = new Pool({
  host: 'ep-silent-band-a8v3nsul-pooler.eastus2.azure.neon.tech',
  port: parseInt('5432', 10),
  user: 'neondb_owner',
  password: 'npg_9ugXciq0edUn',
  database: 'neondb', // Ensure this is the correct database name
  ssl: {
    rejectUnauthorized: false,
    require: true,
  },
});

export interface IStorage {
  getListings(): Promise<Listing[]>;
  getListing(id: number): Promise<Listing | undefined>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(
    id: number,
    listing: Partial<InsertListing>,
  ): Promise<Listing | undefined>;
  deleteListing(id: number): Promise<boolean>;
  processWhatsAppMessage(message: string): Promise<Listing | undefined>;

  getWhatsAppGroups(): Promise<WhatsAppGroup[]>;
  addWhatsAppGroup(group: InsertWhatsAppGroup): Promise<WhatsAppGroup>;
  removeWhatsAppGroup(id: number): Promise<boolean>;
  updateGroupStatus(
    id: number,
    isActive: boolean,
  ): Promise<WhatsAppGroup | undefined>;
  scrapeGroupMessages(groupId: number): Promise<number>;
}

export class DBStorage implements IStorage {
  async processWhatsAppMessage(message: string): Promise<Listing | undefined> {
    console.log('Processing incoming WhatsApp message:', message);

    if (!isValidListingMessage(message)) {
      console.log(
        'Message rejected: Does not contain valid listing information',
      );
      return undefined;
    }

    const parsedListing = parseWhatsAppMessage(message);
    if (!this.isValidParsedListing(parsedListing)) {
      console.log(
        'Message rejected: Could not extract all required listing fields',
      );
      console.log('Parsed fields:', JSON.stringify(parsedListing, null, 2));
      return undefined;
    }

    console.log(
      'Creating new listing from parsed message:',
      JSON.stringify(parsedListing, null, 2),
    );
    return this.createListing(parsedListing);
  }

  private isValidParsedListing(
    listing: Partial<InsertListing>,
  ): listing is InsertListing {
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

  async getListings(): Promise<Listing[]> {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM listings');
      return res.rows;
    } finally {
      client.release();
    }
  }

  async getListing(id: number): Promise<Listing | undefined> {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM listings WHERE id = $1', [
        id,
      ]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async createListing(insertListing: InsertListing): Promise<Listing> {
    const client = await pool.connect();
    try {
      const res = await client.query(
        `INSERT INTO listings (title, description, price, location, propertyType, bedrooms, bathrooms, imageUrl, furnished, contactInfo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          insertListing.title,
          insertListing.description,
          insertListing.price,
          insertListing.location,
          insertListing.propertyType,
          insertListing.bedrooms,
          insertListing.bathrooms,
          insertListing.imageUrl,
          insertListing.furnished,
          insertListing.contactInfo,
        ],
      );
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async updateListing(
    id: number,
    updates: Partial<InsertListing>,
  ): Promise<Listing | undefined> {
    const client = await pool.connect();
    try {
      const fields = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');
      const values = Object.values(updates);
      const res = await client.query(
        `UPDATE listings SET ${fields} WHERE id = $${
          values.length + 1
        } RETURNING *`,
        [...values, id],
      );
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async deleteListing(id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      const res = await client.query('DELETE FROM listings WHERE id = $1', [
        id,
      ]);
      return res.rowCount > 0;
    } finally {
      client.release();
    }
  }

  // Implement other methods for WhatsApp groups similarly...
}

export const storage = new DBStorage();
