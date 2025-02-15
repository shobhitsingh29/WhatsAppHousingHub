import { z } from "zod";

// Schema for WhatsApp group configuration
export const whatsAppGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  inviteLink: z.string().url(),
  isActive: z.boolean(),
  lastScraped: z.string().datetime(),
});

export type WhatsAppGroup = z.infer<typeof whatsAppGroupSchema>;
export type InsertWhatsAppGroup = Omit<WhatsAppGroup, "id" | "lastScraped">;

export class WhatsAppError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "WhatsAppError";
  }
}

export class WhatsAppIntegration {
  private apiKey: string;
  private baseUrl = "https://graph.facebook.com/v19.0";
  private phoneNumberId: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.phoneNumberId = "544501202086565";
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    console.log(`Making WhatsApp API request to: ${url}`);
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`WhatsApp API error: ${response.status} - ${errorText}`);
      throw new WhatsAppError(
        `WhatsApp API request failed: ${response.statusText}`,
        response.status.toString()
      );
    }

    return await response.json();
  }

  async joinGroup(inviteLink: string): Promise<{ success: boolean; message: string }> {
    // Simply store the group information locally without API validation
    // The group should already be joined manually through WhatsApp
    return {
      success: true,
      message: "Group registered for monitoring",
    };
  }

  async leaveGroup(groupId: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: "Group unregistered from monitoring",
    };
  }

  async fetchMessages(groupId: string): Promise<string[]> {
    try {
      // Messages will be received through webhooks instead of direct fetching
      // For now, return empty array until webhook data starts flowing
      console.log(`Group ${groupId}: Messages will be received through webhooks`);
      return [];
    } catch (error) {
      console.error("Failed to fetch WhatsApp messages:", error);
      return [];
    }
  }
}

// Initialize the WhatsApp client with the API key from environment
const apiKey = process.env.WHATSAPP_API_KEY;
if (!apiKey) {
  throw new Error("WHATSAPP_API_KEY environment variable is required");
}

export const whatsAppClient = new WhatsAppIntegration(apiKey);