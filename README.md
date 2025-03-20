# NitroJS + React Application

This is a full-stack application that uses NitroJS for the backend API and React for the frontend. It's configured to provide a seamless development experience with hot module replacement while maintaining a simple deployment structure.

## Project Overview

- **Frontend**: React 19 with React Router for client-side navigation
- **Backend**: NitroJS server with API endpoints
- **Database**: PostgreSQL for data storage
- **ORM**: Kysely for type-safe SQL query building
- **Build Tool**: Vite for fast development and optimized production builds

## Installation

Clone the repository and install dependencies:

```bash
# Install dependencies
npm install
```

## Database Setup

This project uses PostgreSQL for data storage.

1. Install PostgreSQL if not already installed:
   ```bash
   # Ubuntu/Debian
   sudo apt install postgresql
   
   # macOS with Homebrew
   brew install postgresql
   ```

2. Create a database:
   ```bash
   createdb imagenet_demo
   ```

3. Configure your database connection in your environment variables or .env file:
   ```
   DATABASE_URL=postgres://username:password@localhost:5432/imagenet_demo
   ```

## Migrations and Seeds

The application uses a migration system to manage database schema and seeds to populate data.

### Running Migrations

Execute database migrations to set up your schema:

```bash
npx kysely migrate:latest
```

### Running Seeds

Load data from XML into the database:

```bash
npx kysely seed:run
```

The seed process parses the ImageNet hierarchical structure and loads it into the database. This operation may take some time for large XML files.

## Development

The project is set up with a development environment that runs both the client and server concurrently:

```bash
# Start the development servers
npm run dev
```

This runs:
- Vite dev server for the React application on port 5173
- NitroJS server that proxies frontend requests to the Vite dev server

Individual components can also be run separately:

```bash
# Run only the React development server
npm run dev:client

# Run only the NitroJS server
npm run dev:server
```

## Building for Production

To build the application for production:

```bash
# Build both client and server
npm run build

# Preview the production build
npm run preview
```

This process:
1. Builds the React application using Vite and outputs to the `public` directory
2. Builds the NitroJS server that will serve both the static files and API endpoints

## Project Structure

```
imagenet-demo/
├── client/                # React frontend application
│   ├── src/              # React source code
│   │   └── main.tsx      # Main entry point for React
│   ├── public/           # Static assets for client
│   ├── index.html        # HTML entry point
│   └── vite.config.ts    # Vite configuration
├── server/               # NitroJS server
│   └── api/              # API endpoints
│       └── records/      # Records API endpoints
│           └── index.get.ts  # GET handler for records
├── seeds/                # Database seed data
│   └── structure_released.xml  # XML data for ImageNet structure
├── generated/            # Auto-generated type definitions
│   └── db.d.ts          # Database type definitions
├── public/              # Production build output (generated)
├── biome.json           # Biome configuration
├── nitro.config.ts      # NitroJS configuration
├── .gitignore           # Git ignore configuration
└── package.json         # Project dependencies and scripts
```

## API Endpoints

- `/api` - Returns a simple JSON message
- `/api/records` - Retrieves hierarchical data records from the database


## How It Works

### Development Mode

In development mode:
1. Vite serves the React application with hot module replacement
2. NitroJS proxies all non-API requests to the Vite development server
3. NitroJS handles API requests directly

### Production Mode (TODO)

In production mode:
1. The React application is pre-built to static files in the `public` directory
2. NitroJS serves these static files and handles API requests
3. Client-side routing is supported through the NitroJS configuration

## Dependencies

- React 19
- React Router 7
- NitroJS (latest)
- Vite 6

## License

Private - All rights reserved.

