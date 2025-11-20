# Enfield World Builder

A powerful, Notion-like documentation and world-building application with infinite nesting, rich text editing, and collaborative features. Build complex hierarchical documents for creative writing, game design, world-building, or knowledge management.

## Overview

Enfield is a modern full-stack document management system that combines the flexibility of Notion with specialized features for organizing complex, interconnected content. Whether you're building fictional worlds, managing project documentation, or organizing research, Enfield provides an intuitive interface for creating and navigating deeply nested document structures.

## Key Features

- **Infinitely Nestable Documents** - Create unlimited document hierarchies with drag-and-drop organization
- **Rich Text Editing** - Powerful Tiptap editor with Notion-like formatting and slash commands
- **Multi-Workspace Support** - Organize different projects in separate workspaces
- **Visual Drag-and-Drop** - Intuitive document reordering with real-time visual indicators
- **Multi-Document PDF Export** - Export entire document trees to professionally formatted PDFs
- **Auto-Save** - Never lose your work with debounced automatic saving
- **Search & Favorites** - Quickly find and bookmark important documents
- **Light & Dark Modes** - Comfortable editing in any lighting condition

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+ (recommended) or npm
- MongoDB Atlas account (or local MongoDB instance)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/enfield.git
cd enfield
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:

Create `.env` files in both `apps/api` and `apps/web`:

**apps/api/.env:**
```
MONGODB_URI=your_mongodb_connection_string
PORT=3001
```

**apps/web/.env:**
```
VITE_API_URL=http://localhost:3001
```

4. Start the development servers:
```bash
pnpm dev
```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:3001`.

### Running Individual Services

```bash
# Run only the web frontend
pnpm web

# Run only the API backend
pnpm api
```

## Tech Stack

### Frontend
- **React 18** with TypeScript 5
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Tiptap 2** - Extensible rich text editor
- **React Router 6** - Client-side routing
- **TanStack Query v5** - Server state management
- **Zustand** - Lightweight state management

### Backend
- **Fastify 5** - High-performance Node.js framework
- **MongoDB 6** - Document database with Atlas cloud hosting
- **Puppeteer** - PDF generation engine
- **dotenv** - Environment configuration

### Monorepo Architecture
- **Turborepo** - Intelligent build system with caching
- **pnpm workspaces** - Efficient package management
- **Shared TypeScript types** - Type safety across frontend and backend

## Project Structure

```
enfield/
├── apps/
│   ├── web/          # React frontend application
│   └── api/          # Fastify backend API
├── packages/
│   └── types/        # Shared TypeScript definitions
└── turbo.json        # Turborepo configuration
```

## Development

### Building for Production

```bash
pnpm build
```

### Code Quality

The project uses ESLint and Prettier for code quality and consistency. Configuration files are included in the repository.

## Roadmap

Planned features and improvements:

- [ ] User authentication with Firebase Auth
- [ ] Image uploads with cloud storage (S3/Cloudflare R2)
- [ ] Real-time collaborative editing
- [ ] Additional Tiptap extensions (tables, embeds, code blocks)
- [ ] Advanced search with filters
- [ ] Document templates
- [ ] Version history
- [ ] Mobile-responsive design improvements

## Deployment

### Recommended Platforms

- **Frontend**: Vercel or Netlify
- **Backend**: Railway or Render
- **Database**: MongoDB Atlas (cloud)

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is licensed under the MIT License.
