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
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "WhatsAppError";
  }
}

export class WhatsAppIntegration {
  private apiKey: string;
  private baseUrl = "https://graph.facebook.com/v19.0";
  private phoneNumberId: string;
  private businessAccountId: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error(
        "WhatsApp API key is required. Please set WHATSAPP_API_KEY in Secrets.",
      );
    }
    this.apiKey = apiKey;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_ID || "544501202086565";
    this.businessAccountId =
      process.env.WHATSAPP_BUSINESS_ID || "561557767042419";
    console.log(
      "WhatsApp integration initialized with phone ID:",
      this.phoneNumberId,
    );
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add default WhatsApp messaging parameters
    if (options.method === 'POST' && !options.body) {
      options.body = JSON.stringify({
        messaging_product: "whatsapp",
        ...JSON.parse(options.body as string || '{}')
      });
    }

    console.log(`Making WhatsApp API request to: ${url}`);
    console.log('Request options:', { headers, ...options });
    
    const response = await fetch(url, { ...options, headers });
    const responseText = await response.text();
    
    try {
      const responseData = JSON.parse(responseText);
      console.log('Response data:', responseData);
      
      if (!response.ok) {
        console.error(`WhatsApp API error: ${response.status} - ${responseText}`);
        throw new WhatsAppError(
          `WhatsApp API request failed: ${response.statusText}`,
          response.status.toString(),
        );
      }
      
      return responseData;
    } catch (e) {
      console.error('Failed to parse response:', responseText);
      throw e;
    }
  }

  async joinGroup(
    inviteLink: string,
  ): Promise<{ success: boolean; message: string }> {
    // Simply store the group information locally without API validation
    // The group should already be joined manually through WhatsApp
    return {
      success: true,
      message: "Group registered for monitoring",
    };
  }

  async leaveGroup(
    groupId: string,
  ): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: "Group unregistered from monitoring",
    };
  }

  async fetchMessages(groupId: string): Promise<string[]> {
    try {
      // Messages will be received through webhooks instead of direct fetching
      // For now, return empty array until webhook data starts flowing
      console.log(
        `Group ${groupId}: Messages will be received through webhooks`,
      );
      return [];
    } catch (error) {
      console.error("Failed to fetch WhatsApp messages:", error);
      return [];
    }
  }

  async getGroupMessages(inviteLink: string): Promise<string[]> {
    try {
      const groupId = inviteLink.split("/").pop();
      const response = await this.makeRequest(
        `/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            to: groupId,
            type: "text",
            text: { body: "Checking messages..." }
          })
        }
      );

      console.log("WhatsApp API response:", response);

      // For now return empty array since we need to implement webhooks
      // to properly receive group messages
      return [];
    } catch (error) {
      console.error("Failed to fetch group messages:", error);
      return [];
    }
  }

  async sendMessage(inviteLink: string, message: string): Promise<void> {
    try {
      console.log("Sending message:", { inviteLink, message });
      const groupId = inviteLink.split("/").pop();

      if (!groupId) {
        throw new WhatsAppError("Invalid group invite link", "INVALID_LINK");
      }

      const response = await this.makeRequest(
        `/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "group",
            to: groupId,
            type: "text",
            text: { body: message },
          }),
        },
      );

      console.log("WhatsApp API response:", response);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }
}

// Initialize the WhatsApp client with the API key from environment
const apiKey = process.env.WHATSAPP_API_KEY;
if (!apiKey) {
  throw new Error("WHATSAPP_API_KEY environment variable is required");
}

export const whatsAppClient = new WhatsAppIntegration(apiKey);
