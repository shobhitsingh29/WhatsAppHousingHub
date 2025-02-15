import { InsertListing } from "./schema";

/**
 * Extracts structured listing data from WhatsApp messages using common patterns
 * Example message formats:
 * "2 BHK apartment in Kreuzberg, 1200€/month, furnished, contact: +49123456789"
 * "Studio flat available in Mitte, 800€, unfurnished, WhatsApp: +49987654321"
 */
export function parseWhatsAppMessage(message: string): Partial<InsertListing> {
  const listing: Partial<InsertListing> = {
    furnished: false,
    bedrooms: 1,
    bathrooms: 1,
  };

  // Extract location
  const locationMatch = message.match(/in\s+([^,]+)/i);
  if (locationMatch) {
    listing.location = locationMatch[1].trim();
  }

  // Extract price
  const priceMatch = message.match(/(\d+)\s*€/);
  if (priceMatch) {
    listing.price = parseInt(priceMatch[1]);
  }

  // Extract property type
  if (message.toLowerCase().includes("studio")) {
    listing.propertyType = "studio";
  } else if (message.toLowerCase().includes("apartment")) {
    listing.propertyType = "apartment";
  } else if (message.toLowerCase().includes("house")) {
    listing.propertyType = "house";
  }

  // Extract bedrooms (e.g., "2 BHK" or "3 bedroom")
  const bedroomMatch = message.match(/(\d+)\s*(?:bhk|bedroom)/i);
  if (bedroomMatch) {
    listing.bedrooms = parseInt(bedroomMatch[1]);
  }

  // Extract furnished status
  listing.furnished = message.toLowerCase().includes("furnished");

  // Extract contact information
  const contactMatch = message.match(/(?:contact|whatsapp|tel|phone):\s*([+\d\s-]+)/i);
  if (contactMatch) {
    listing.contactInfo = contactMatch[1].trim();
  }

  // Generate a title based on the extracted information
  const titleParts = [
    listing.bedrooms ? `${listing.bedrooms} Bedroom` : "",
    listing.propertyType || "Property",
    listing.location ? `in ${listing.location}` : "",
  ].filter(Boolean);
  
  listing.title = titleParts.join(" ");
  
  // Add a generic description
  listing.description = message.trim();

  // Use a default image based on property type
  listing.imageUrl = `https://images.unsplash.com/photo-${
    listing.propertyType === "studio" 
      ? "1502672260266-1c1ef2d93688" 
      : "1522708323590-d24dbb6b0267"
  }`;

  return listing;
}

// Function to validate if a message contains minimum required information
export function isValidListingMessage(message: string): boolean {
  const parsed = parseWhatsAppMessage(message);
  return !!(
    parsed.location &&
    parsed.price &&
    parsed.contactInfo &&
    parsed.propertyType
  );
}
