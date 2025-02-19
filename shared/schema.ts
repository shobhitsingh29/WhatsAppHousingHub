import { pgTable, text, serial, integer, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const listings = pgTable('listings', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(),
  location: text('location').notNull(),
  propertyType: text('property_type').notNull(),
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: integer('bathrooms').notNull(),
  imageUrl: text('image_url').notNull(),
  furnished: boolean('furnished').notNull(),
  contactInfo: text('contact_info').notNull(),
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
});

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

// Extended schema for form validation
export const listingFormSchema = insertListingSchema.extend({
  price: z.number().min(0, 'Price must be positive'),
  bedrooms: z.number().min(0, 'Number of bedrooms must be positive'),
  bathrooms: z.number().min(0, 'Number of bathrooms must be positive'),
  contactInfo: z.string().min(5, 'Contact information is required'),
});
