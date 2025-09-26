# mittvibes

CLI tool to generate boilerplate for Mittwald extensions.

*Powered by weissaufschwarz*

## Installation

```bash
npm install -g mittvibes-cli
# or
pnpm add -g mittvibes-cli
```

Or run directly with npx:
```bash
npx mittvibes-cli
```

## Usage

### First Time Setup

Before creating extension projects, you need to authenticate:

```bash
# Authenticate with mittwald
mittvibes auth:login
```

This will:
- Open your browser for OAuth authentication
- Use port 52847 for the callback (ensure it's available)
- Store authentication tokens securely

### Creating Extensions

Once authenticated, run the CLI in your desired directory:

```bash
mittvibes
```

The CLI will guide you through the complete setup process:

1. **Organization Selection**: Choose which mittwald organization to use
2. **Contributor Check**: Automatically verify contributor status
3. **Interest Submission**: Submit contributor interest if needed (via API)
4. **Extension Context Selection**: Choose between customer-level or project-level extensions
5. **Project Selection**: Select specific project for project-level extensions
6. **Project Configuration**: Choose project name and directory
7. **Dependency Installation**: Automatically install dependencies with pnpm
8. **Database Setup**: Configure PostgreSQL connection and run migrations
9. **Extension Configuration**: Set up mittwald extension credentials with auto-generated secrets

## Features

### 🚀 Complete Boilerplate
- TanStack Start framework setup
- Prisma ORM with PostgreSQL and field encryption
- Mittwald Extension Bridge integration
- Webhook handling with mitthooks
- Sentry error tracking
- Biome linting and formatting

### 🛠️ Developer Experience
- **OAuth Authentication**: Secure PKCE-based authentication with mittwald
- **Organization Management**: Select and manage mittwald organizations
- **Contributor Status**: Automatic contributor verification and interest submission
- **Extension Context Management**: Choose between customer-level and project-level extensions
- **Project Integration**: Automatic project selection and configuration for project-level extensions
- **Interactive CLI**: Step-by-step guided setup with visual indicators
- **Automatic Secret Generation**: Auto-generated extension secrets using secure key generation
- **Automatic dependency installation**: Seamless dependency management
- **Database migration handling**: Automated database setup with encryption keys
- **Environment configuration**: Pre-configured with organization details, extension context, and anchor URLs
- **Pre-configured development scripts**: Ready-to-run development environment

### 📦 Generated Project Structure
```
my-extension/
├── src/
│   ├── components/
│   ├── middlewares/
│   ├── routes/
│   │   └── api/webhooks.mittwald.ts
│   ├── server/functions/
│   ├── env.ts
│   └── db.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── package.json
├── vite.config.ts
├── .env                 # Pre-configured with organization ID, extension context, and auto-generated credentials
└── .env.example
```

## Requirements

### For Running the CLI Tool
- Node.js v18.0.0 or higher

### For Developing the CLI Tool
- Node.js v18.0.0 or higher
- pnpm v10.4.1 or higher

### For Using the CLI
- **mittwald Account**: Account with access to organizations
- **Internet Access**: Required for OAuth authentication and API communication
- **Available Port**: Port 52847 must be available for OAuth callback

### For Generated Extensions
- **Node.js & pnpm**: Required for running the generated extension projects
- **Database**: PostgreSQL database with non-pooling connection
- **Hosting**: A place to run the generated boilerplate (localhost for development, or hosting service for production)
- **Contributor Status**: Organization must have contributor access for extension development

## Development

To develop the CLI tool itself:

```bash
git clone <repository>
cd mittvibes
cd cli
pnpm install
pnpm start
```

## CLI Commands

The CLI provides several commands for managing authentication and projects:

```bash
# Authentication
mittvibes auth:login    # Authenticate with mittwald OAuth
mittvibes auth:logout   # Clear authentication tokens
mittvibes auth:status   # Check authentication status

# Project Creation
mittvibes              # Create new extension project (default)
mittvibes init         # Explicit project initialization

# Help
mittvibes help         # Show available commands
```

### Authentication Details

- **OAuth Flow**: Uses PKCE (Proof Key for Code Exchange) for secure authentication
- **Callback Port**: Fixed port 52847 (high user range to avoid conflicts)
- **Token Storage**: Encrypted storage in `~/.mittvibes/config.json`
- **API Integration**: Uses official `@mittwald/api-client` for all API calls

## Technology Stack

The CLI generates extensions using modern web technologies:

### **Framework & Runtime**
- **TanStack Start** - Full-stack React framework with SSR/SSG support
- **React 19** - Latest React with modern patterns
- **TypeScript** - Strict type safety throughout
- **Vite** - Fast build tool and dev server

### **Database & Backend**
- **Prisma ORM** - Type-safe database access with field encryption
- **PostgreSQL** - Production-ready relational database
- **Server Functions** - TanStack Start server-side functions

### **mittwald Integration**
- **mittwald Extension Bridge** - Authentication and configuration
- **mittwald API Client** - Official API client for mittwald services
- **mitthooks** - Webhook handling library
- **mittwald Flow Components** - Official UI component library

### **Development Tools**
- **Biome** - Fast linting and formatting
- **Vitest** - Modern testing framework
- **TanStack Router** - Type-safe routing
- **TanStack Query** - Server state management
- **Environment Validation** - Runtime environment validation with envalid

### **Additional Features**
- **Field Encryption** - Automatic database field encryption
- **Middleware System** - Authentication and request handling
- **Hot Reload** - Fast development with Vite HMR
- **Development Tools** - Built-in dev tools for debugging

## Local Development & Testing

The CLI is built with TypeScript for better development experience and type safety.

### Development Setup

```bash
# Navigate to the CLI directory
cd cli

# Install dependencies
pnpm install

# Development (TypeScript with hot reload)
pnpm dev

# Build TypeScript to JavaScript
pnpm build

# Run built version
pnpm start
```

### Testing Options

```bash
# Option 1: Direct development execution (TypeScript)
pnpm dev

# Option 2: Build and test production version
pnpm build && node dist/index.js

# Option 3: Create global symlink for testing
pnpm link --global
# Now you can run 'mittvibes' from anywhere

# Option 4: Test in a separate directory
mkdir /tmp/test-extension
cd /tmp/test-extension
node /path/to/mittvibes/cli/dist/index.js

# Option 5: Package and install locally
npm pack
npm install -g ./mittvibes-cli-1.0.0.tgz
mittvibes
```

## Organization & Contributor Management

### Automatic Organization Detection
The CLI automatically:
1. **Fetches Organizations**: Lists all mittwald organizations you have access to
2. **Checks Contributor Status**: Verifies contributor status for each organization
3. **Visual Indicators**: Shows which organizations are contributors (✓) and which are not

### Contributor Flow

#### For Contributors
When you select an organization with contributor status:
1. **Extension Configuration**: Set up extension credentials and webhooks
2. **Development Environment**: Configure local development settings
3. **API Integration**: Set up mittwald API access and extensions

#### For Non-Contributors
When you select an organization without contributor status:
1. **Interest Submission**: Submit contributor interest via API automatically
2. **Application Tracking**: Get updates on your contributor application
3. **Alternative Options**: Switch to a different organization with contributor access

### Manual Contributor Application
For detailed contributor setup, see the official guide:
- [Become a Contributor Guide](https://developer.mittwald.de/de/docs/v2/contribution/how-to/become-contributor/)
- [Extension Development Documentation](https://developer.mittwald.de/docs/v2/contribution/)
- [API Documentation](https://api.mittwald.de/v2/docs/)

## Troubleshooting

### Authentication Issues

**Port 52847 already in use:**
```bash
# Check what's using the port
lsof -i :52847
# Kill the process if needed, then retry authentication
```

**Browser doesn't open automatically:**
- The CLI will display the OAuth URL to copy manually
- Ensure your system allows opening browser links

**Authentication fails:**
```bash
# Clear stored tokens and retry
mittvibes auth:logout
mittvibes auth:login
```

### API Issues

**"Not authenticated" errors:**
```bash
# Check authentication status
mittvibes auth:status
# Re-authenticate if needed
mittvibes auth:login
```

**Organization not found:**
- Ensure you have access to the mittwald organization
- Check that your account has the necessary permissions

## Support

- CLI Issues: Report in this repository
- Mittwald Extension Development: [Developer Documentation](https://developer.mittwald.de/docs/v2/contribution/)
- API Reference: [Mittwald API Docs](https://api.mittwald.de/v2/docs/)

---

*Made with ⚡ by weissaufschwarz*