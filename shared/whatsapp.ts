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
  private retryCount = 3;
  private retryDelay = 1000;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Phone number ID should come from WhatsApp Business API setup
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

  async joinGroup(inviteLink: string): Promise<{ success: boolean; message: string }> {
    try {
      // Extract invite code from the link
      const inviteCode = inviteLink.split('/').pop();

      // Join group using WhatsApp Cloud API
      await this.makeRequest(`/${this.phoneNumberId}/groups`, {
        method: "POST",
        body: JSON.stringify({
          invite_code: inviteCode,
        }),
      });

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

  async leaveGroup(groupId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Leave group using WhatsApp Cloud API
      await this.makeRequest(`/${this.phoneNumberId}/groups/${groupId}`, {
        method: "DELETE",
      });

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

  async fetchMessages(groupId: string, since?: Date): Promise<string[]> {
    try {
      // Fetch messages using WhatsApp Cloud API
      const response = await this.makeRequest(
        `/${this.phoneNumberId}/groups/${groupId}/messages`,
        {
          method: "GET",
          headers: since ? {
            "After": since.toISOString()
          } : undefined
        }
      );

      // Extract text messages from the response
      return response.messages
        .filter((msg: any) => msg.type === 'text')
        .map((msg: any) => msg.text.body);
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