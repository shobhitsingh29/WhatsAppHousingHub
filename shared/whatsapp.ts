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
    this.phoneNumberId = "544501202086565"; // Using the provided phone number ID
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
    try {
      // Extract the group ID from the invite link
      const groupId = inviteLink.split('/').pop();
      console.log(`Attempting to access WhatsApp group with ID: ${groupId}`);

      // Try to fetch group info to verify access
      await this.makeRequest(`/${this.phoneNumberId}/groups/${groupId}/info`);

      return {
        success: true,
        message: "Successfully connected to group",
      };
    } catch (error) {
      console.error("Failed to access WhatsApp group:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async leaveGroup(groupId: string): Promise<{ success: boolean; message: string }> {
    // For now, just unregister the group from our monitoring
    return {
      success: true,
      message: "Group unregistered from monitoring",
    };
  }

  async fetchMessages(groupId: string, since?: Date): Promise<string[]> {
    try {
      console.log(`Attempting to fetch messages from group ${groupId}`);

      // Using the Cloud API to fetch messages
      const response = await this.makeRequest(
        `/${this.phoneNumberId}/messages`,
        {
          method: "GET",
          headers: {
            ...(since && { "After": since.toISOString() })
          }
        }
      );

      console.log('API Response:', JSON.stringify(response, null, 2));

      // Extract and return only text messages
      return response.messages
        ?.filter((msg: any) => msg.type === 'text')
        ?.map((msg: any) => msg.text.body) || [];
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