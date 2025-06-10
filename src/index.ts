#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Database } from './database.js';
import { z } from 'zod';

// Validation schemas
const AddPageSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  description: z.string().optional(),
  tags: z.string().optional(),
});

const UpdatePageSchema = z.object({
  id: z.number().int().positive(),
  url: z.string().url().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(['active', 'inactive', 'error']).optional(),
});

const SearchPagesSchema = z.object({
  query: z.string().min(1),
});

const AskPageSchema = z.object({
  url: z.string().url(),
  query: z.string().min(1),
  prev: z.string().optional(),
  mode: z.enum(['summarize', 'generate']).optional()
});

class NlwebMcpServer {
  private server: Server;
  private database: Database;

  constructor() {
    this.server = new Server(
      {
        name: 'nlweb-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.database = new Database();
    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'add_nlweb_page',
            description: 'Add a new nlweb page to the database',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', format: 'uri', description: 'URL of the nlweb page' },
                title: { type: 'string', description: 'Title of the page' },
                description: { type: 'string', description: 'Optional description of the page' },
                tags: { type: 'string', description: 'Optional comma-separated tags' },
              },
              required: ['url', 'title'],
            },
          },
          {
            name: 'update_nlweb_page',
            description: 'Update an existing nlweb page',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'ID of the page to update' },
                url: { type: 'string', format: 'uri', description: 'New URL' },
                title: { type: 'string', description: 'New title' },
                description: { type: 'string', description: 'New description' },
                tags: { type: 'string', description: 'New tags' },
                status: { type: 'string', enum: ['active', 'inactive', 'error'], description: 'Page status' },
              },
              required: ['id'],
            },
          },
          {
            name: 'get_nlweb_page',
            description: 'Get a specific nlweb page by ID',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'ID of the page to retrieve' },
              },
              required: ['id'],
            },
          },
          {
            name: 'list_nlweb_pages',
            description: 'List all nlweb pages',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'search_nlweb_pages',
            description: 'Search nlweb pages by title, description, tags, or URL',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
              },
              required: ['query'],
            },
          },
          {
            name: 'delete_nlweb_page',
            description: 'Delete a nlweb page by ID',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'ID of the page to delete' },
              },
              required: ['id'],
            },
          },
          {
            name: 'ask_nlweb_page',
            description: 'Ask a nlweb page a question',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', format: 'uri', description: 'URL of the nlweb page to ask' },
                query: { type: 'string', description: 'Question to ask' },
              },
              required: ['url', 'query'],
            },
          }
        ],
      };
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const pages = await this.database.getAllPages();
      return {
        resources: pages.map(page => ({
          uri: `nlweb://page/${page.id}`,
          name: page.title,
          description: page.description || `Page: ${page.url}`,
          mimeType: 'application/json',
        })),
      };
    });

    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      const match = uri.match(/^nlweb:\/\/page\/(\d+)$/);
      
      if (!match) {
        throw new Error(`Invalid resource URI: ${uri}`);
      }

      const pageId = parseInt(match[1]);
      const page = await this.database.getPage(pageId);
      
      if (!page) {
        throw new Error(`Page not found: ${pageId}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(page, null, 2),
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'add_nlweb_page': {
            const validated = AddPageSchema.parse(args);
            
            // Check if URL already exists
            const existing = await this.database.getPageByUrl(validated.url);
            if (existing) {
              throw new Error(`Page with URL ${validated.url} already exists`);
            }

            const id = await this.database.addPage({
              ...validated,
              status: 'active',
            });

            return {
              content: [
                {
                  type: 'text',
                  text: `Successfully added nlweb page with ID: ${id}`,
                },
              ],
            };
          }

          case 'update_nlweb_page': {
            const validated = UpdatePageSchema.parse(args);
            const { id, ...updates } = validated;

            const existing = await this.database.getPage(id);
            if (!existing) {
              throw new Error(`Page with ID ${id} not found`);
            }

            await this.database.updatePage(id, updates);

            return {
              content: [
                {
                  type: 'text',
                  text: `Successfully updated nlweb page with ID: ${id}`,
                },
              ],
            };
          }

          case 'get_nlweb_page': {
            const { id } = args as { id: number };
            const page = await this.database.getPage(id);
            
            if (!page) {
              throw new Error(`Page with ID ${id} not found`);
            }

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(page, null, 2),
                },
              ],
            };
          }

          case 'list_nlweb_pages': {
            const pages = await this.database.getAllPages();
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(pages, null, 2),
                },
              ],
            };
          }

          case 'search_nlweb_pages': {
            const validated = SearchPagesSchema.parse(args);
            const pages = await this.database.searchPages(validated.query);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(pages, null, 2),
                },
              ],
            };
          }

          case 'delete_nlweb_page': {
            const { id } = args as { id: number };
            const existing = await this.database.getPage(id);
            
            if (!existing) {
              throw new Error(`Page with ID ${id} not found`);
            }

            await this.database.deletePage(id);

            return {
              content: [
                {
                  type: 'text',
                  text: `Successfully deleted nlweb page with ID: ${id}`,
                },
              ],
            };
          }

          case 'ask_nlweb_page': {
            const validated = AskPageSchema.parse(args);
            const url = validated.url
            const payload = {
              query: validated.query,
              prev: validated.prev,
              mode: validated.mode,
            }
            const result = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });

            const json = await result.json();

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(json, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    // Initialize database
    await this.database.initialize();

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('Nlweb MCP Server running on stdio');
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('Shutting down...');
  process.exit(0);
});

// Start the server
const server = new NlwebMcpServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
