# Nlweb MCP Server

MCP (Model Context Protocol) server for managing nlweb pages with SQLite database storage. This server can be integrated with Claude Desktop application to manage and test web pages.

## Features

- **Page Management**: Add, update, delete, and search nlweb pages
- **SQLite Storage**: Persistent storage in user's home directory (`~/.nlweb-mcp/nlweb.db`)
- **Page Testing**: Test page accessibility, performance, and extract content
- **Health Monitoring**: Bulk health checks for all stored pages
- **Resource Access**: Access page data through MCP resources

## Installation

1. Clone or download this repository
2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Running the Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

### Integration with Claude Desktop

Add this configuration to your Claude Desktop config file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "nlweb": {
      "command": "node",
      "args": ["D:\\path\\to\\nlweb-mcp\\dist\\index.js"],
      "env": {}
    }
  }
}
```

Replace `D:\\path\\to\\nlweb-mcp` with the actual path to your project.

## Available Tools

### Page Management

- **add_nlweb_page**: Add a new page to the database
- **update_nlweb_page**: Update an existing page
- **get_nlweb_page**: Get a specific page by ID
- **list_nlweb_pages**: List all stored pages
- **search_nlweb_pages**: Search pages by title, description, tags, or URL
- **delete_nlweb_page**: Delete a page by ID

### Testing & Monitoring

- **test_nlweb_page**: Test a specific page for accessibility and performance
- **health_check_all_pages**: Perform health check on all stored pages

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

Once integrated with Claude Desktop, you can use natural language commands like:

- "Add a new nlweb page for https://example.com with title 'Example Site'"
- "Test the page https://example.com"
- "Show me all pages with 'blog' in the title"
- "Run a health check on all my pages"
- "Update page 1 to mark it as inactive"

## Development

### Project Structure

```
src/
├── index.ts          # Main MCP server implementation
├── database.ts       # SQLite database operations
└── nlweb-tester.ts   # Page testing functionality
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
