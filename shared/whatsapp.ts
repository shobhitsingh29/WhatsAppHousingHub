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

// Error types for better error handling
export class WhatsAppError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "WhatsAppError";
  }
}

export class WhatsAppIntegration {
  private apiKey: string;
  private baseUrl = "https://graph.facebook.com/v19.0";
  private retryCount = 3;
  private retryDelay = 1000; // ms

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
          const error = await response.json();
          throw new WhatsAppError(
            error.message || "WhatsApp API request failed",
            error.error?.code || "UNKNOWN_ERROR"
          );
        }

        return await response.json();
      } catch (error) {
        if (attempt === this.retryCount) throw error;
        console.log(`Retry attempt ${attempt} for ${endpoint}`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }

  // Join a WhatsApp group using invite link
  async joinGroup(inviteLink: string): Promise<{ success: boolean; message: string }> {
    try {
      // Note: This would use the actual WhatsApp Business API endpoint
      // Currently returning mock success as the API doesn't directly support group joining
      console.log(`Attempting to join WhatsApp group: ${inviteLink}`);

      // In reality, this would make an API call like:
      // await this.makeRequest("/groups/join", {
      //   method: "POST",
      //   body: JSON.stringify({ inviteLink })
      // });

      return {
        success: true,
        message: "Successfully joined group",
      };
    } catch (error) {
      console.error("Failed to join WhatsApp group:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Leave a WhatsApp group
  async leaveGroup(groupId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Note: This would use the actual WhatsApp Business API endpoint
      console.log(`Attempting to leave WhatsApp group: ${groupId}`);

      // In reality, this would make an API call like:
      // await this.makeRequest(`/groups/${groupId}/leave`, {
      //   method: "POST"
      // });

      return {
        success: true,
        message: "Successfully left group",
      };
    } catch (error) {
      console.error("Failed to leave WhatsApp group:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Fetch messages from a group
  async fetchMessages(groupId: string, since?: Date): Promise<string[]> {
    try {
      console.log(`Fetching messages from group ${groupId}${since ? ` since ${since.toISOString()}` : ''}`);

      // This would make an actual API call like:
      // const response = await this.makeRequest(`/groups/${groupId}/messages`, {
      //   method: "GET",
      //   query: since ? { since: since.toISOString() } : undefined
      // });

      // For now, return mock messages that match our expected format
      return [
        "2 BHK apartment in Kreuzberg, 1200€/month, furnished, contact: +49123456789",
        "Studio flat available in Mitte, 800€, unfurnished, WhatsApp: +49987654321",
      ];
    } catch (error) {
      console.error("Failed to fetch WhatsApp messages:", error);
      return [];
    }
  }
}

// Create a singleton instance using the API key from environment
const apiKey = process.env.WHATSAPP_API_KEY;
if (!apiKey) {
  throw new Error("WHATSAPP_API_KEY environment variable is required");
}

export const whatsAppClient = new WhatsAppIntegration(apiKey);