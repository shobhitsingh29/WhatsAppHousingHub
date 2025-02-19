import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { storage } from './storage';
import { insertListingSchema } from '@shared/schema';
import { whatsAppGroupSchema } from '@shared/whatsapp';

export async function registerRoutes(app: Express): Promise<Server> {
  app.get('/api/listings', async (_req, res) => {
    const listings = await storage.getListings();
    res.json(listings);
  });

  app.get('/api/listings/:id', async (req, res) => {
    const listing = await storage.getListing(Number(req.params.id));
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json(listing);
  });

  app.post('/api/listings', async (req, res) => {
    try {
      const data = insertListingSchema.parse(req.body);
      const listing = await storage.createListing(data);
      res.status(201).json(listing);
    } catch (error) {
      res.status(400).json({ message: 'Invalid listing data' });
    }
  });

  app.patch('/api/listings/:id', async (req, res) => {
    try {
      const updates = insertListingSchema.partial().parse(req.body);
      const listing = await storage.updateListing(
        Number(req.params.id),
        updates,
      );
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      res.json(listing);
    } catch (error) {
      res.status(400).json({ message: 'Invalid update data' });
    }
  });

  app.delete('/api/listings/:id', async (req, res) => {
    const success = await storage.deleteListing(Number(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.status(204).send();
  });

  // WhatsApp Group Management Routes
  app.get('/api/whatsapp-groups', async (_req, res) => {
    const groups = await storage.getWhatsAppGroups();
    res.json(groups);
  });

  app.post('/api/whatsapp-groups', async (req, res) => {
    try {
      const { name, inviteLink, isActive = true } = req.body;
      const group = await storage.addWhatsAppGroup({
        name,
        inviteLink,
        isActive,
      });
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to add WhatsApp group',
      });
    }
  });

  app.delete('/api/whatsapp-groups/:id', async (req, res) => {
    const success = await storage.removeWhatsAppGroup(Number(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'WhatsApp group not found' });
    }
    res.status(204).send();
  });

  app.patch('/api/whatsapp-groups/:id/status', async (req, res) => {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    const group = await storage.updateGroupStatus(
      Number(req.params.id),
      isActive,
    );
    if (!group) {
      return res.status(404).json({ message: 'WhatsApp group not found' });
    }
    res.json(group);
  });

  app.post('/api/whatsapp-groups/:id/scrape', async (req, res) => {
    try {
      const newListings = await storage.scrapeGroupMessages(
        Number(req.params.id),
      );
      res.json({
        message: `Successfully scraped messages and created ${newListings} new listings`,
      });
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error ? error.message : 'Failed to scrape messages',
      });
    }
  });

  app.post('/api/whatsapp-groups/:id/send', async (req, res) => {
    const { message } = req.body;
    console.log('Received send message request:', {
      groupId: req.params.id,
      message,
    });

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Message is required' });
    }

    try {
      const groups = await storage.getWhatsAppGroups();
      console.log('Found groups:', groups);

      const targetGroup = groups.find((g) => g.id === Number(req.params.id));
      console.log('Target group:', targetGroup);

      if (!targetGroup) {
        return res.status(404).json({ message: 'WhatsApp group not found' });
      }

      if (!targetGroup.isActive) {
        return res
          .status(400)
          .json({ message: 'WhatsApp group is not active' });
      }

      await whatsAppClient.sendMessage(targetGroup.inviteLink, message);
      res.json({ message: 'Message sent successfully' });
    } catch (error) {
      console.error('Error in send message endpoint:', error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : 'Failed to send message',
        details: error instanceof Error ? error.stack : undefined,
      });
    }
  });

  app.post('/api/process-message', async (req, res) => {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Invalid message format' });
    }

    const listing = await storage.processWhatsAppMessage(message);
    if (!listing) {
      return res.status(400).json({
        message: 'Could not extract valid listing information from the message',
      });
    }

    res.status(201).json(listing);
  });

  // Webhook endpoint for WhatsApp messages
  app.post('/api/webhook/whatsapp', async (req, res) => {
    const { body } = req;
    console.log('Received webhook payload:', JSON.stringify(body, null, 2));

    // Verify webhook
    if (body.object === 'whatsapp_business_account') {
      if (body.entry?.[0]?.changes?.[0]?.value?.messages) {
        const messages = body.entry[0].changes[0].value.messages;
        console.log(`Processing ${messages.length} messages from webhook`);

        for (const message of messages) {
          if (message.type === 'text') {
            console.log('Processing text message:', message.text.body);
            const listing = await storage.processWhatsAppMessage(
              message.text.body,
            );
            if (listing) {
              console.log('Created new listing from message:', listing.id);
            }
          } else {
            console.log('Skipping non-text message of type:', message.type);
          }
        }
      } else {
        console.log('No messages found in webhook payload');
      }
      res.status(200).send('OK');
    } else {
      console.log('Invalid webhook object type:', body.object);
      res.status(404).send('Not Found');
    }
  });

  // Webhook verification endpoint
  app.get('/api/webhook/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('Webhook verification request:', {
      mode,
      token,
      challenge,
      expectedToken: process.env.WHATSAPP_VERIFY_TOKEN,
    });

    // Verify webhook configuration
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      console.log('Webhook verification failed');
      res.status(403).send('Forbidden');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
