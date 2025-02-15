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
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    if (!this.phoneNumberId) {
      throw new Error("WHATSAPP_PHONE_NUMBER_ID environment variable is required");
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      console.error(`WhatsApp API error: ${response.status} - ${await response.text()}`);
      throw new WhatsAppError(
        `WhatsApp API request failed: ${response.statusText}`,
        response.status.toString()
      );
    }

    return await response.json();
  }

  // Instead of directly joining groups, we'll use the Cloud API's message receiving capability
  async joinGroup(inviteLink: string): Promise<{ success: boolean; message: string }> {
    // Store the group info but don't try to join programmatically
    // as this needs to be done manually through the WhatsApp app
    return {
      success: true,
      message: "Group registered for monitoring. Please join the group manually through WhatsApp.",
    };
  }

  async leaveGroup(groupId: string): Promise<{ success: boolean; message: string }> {
    // Simply mark the group as inactive in our system
    return {
      success: true,
      message: "Group unregistered from monitoring",
    };
  }

  async fetchMessages(groupId: string, since?: Date): Promise<string[]> {
    try {
      // Fetch messages from the registered webhook data instead of direct API calls
      // This is a mock implementation - real messages will come through webhooks
      console.log(`Group ${groupId}: Would fetch messages since ${since?.toISOString() || 'beginning'}`);
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