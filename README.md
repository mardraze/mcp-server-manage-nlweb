# Nlweb MCP Server

MCP (Model Context Protocol) server for managing nlweb pages with SQLite database storage. This server can be integrated with Claude Desktop application to manage and test web pages.

## Features

- **Page Management**: Add, update, delete, and search nlweb pages
- **SQLite Storage**: Persistent storage in user's home directory (`~/.nlweb-mcp/nlweb.db`)
- **Resource Access**: Access page data through MCP resources


### Integration with Claude Desktop

Add this configuration to your Claude Desktop config file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "nlweb": {
      "command": "npx",
      "args": [
        "-y", "mcp-server-manage-nlweb"
      ]
    }
  }
}
```

This will automatically use the published `mcp-server-manage-nlweb` package via NPX, so you do not need to specify a local path.

## Available Tools

### Page Management

- **add_nlweb_page**: Add a new page to the database
- **update_nlweb_page**: Update an existing page
- **get_nlweb_page**: Get a page by ID
- **list_nlweb_pages**: List all saved pages
- **search_nlweb_pages**: Search pages by title, description, tags, or URL
- **delete_nlweb_page**: Delete a page by ID

### Page Queries

- **ask_nlweb_page**: Send a query to a selected page (e.g., summarize or generate text based on the page content)

## Database Schema

The SQLite database stores pages with the following structure:

```sql
CREATE TABLE nlweb_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT,
  content TEXT,
  status TEXT DEFAULT 'active',
  lastChecked TEXT,
  responseTime INTEGER,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

## Example Usage

Once integrated with Claude Desktop, you can use commands like:

- "Add page https://example.com with title 'Example Site'"
- "Search for pages containing 'blog' in the title"
- "Update page 1, set status to 'inactive'"
- "Delete page with ID 2"
- "Ask the page https://example.com: Summarize the article"
- "The previous answer was incomplete, continue for the same page"

## Development

### Project Structure

```
src/
├── index.ts          # Main MCP server implementation
└── database.ts       # SQLite database operations
```

### Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm run dev`: Run in development mode with tsx
- `npm start`: Run the compiled server
- `npm test`: Run tests (when implemented)

## Error Handling

The server includes comprehensive error handling for:
- Invalid URLs
- Database connection issues
- Network timeouts
- Page access errors
- Validation errors

## Security Considerations

- Database is stored in user's home directory with appropriate permissions
- HTTP requests include a custom User-Agent header
- URL validation prevents malicious inputs
- Timeouts prevent hanging requests

## License

MIT License
