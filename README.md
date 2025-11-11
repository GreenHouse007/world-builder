Enfield World Builder - Complete Tech Stack
Frontend:

Vite - Build tool and dev server
React 18 - UI library
TypeScript 5 - Type safety
Tailwind CSS 3.4 - Utility-first styling
@tailwindcss/typography - Prose styling for rich text
React Router 6 - Client-side routing
Tiptap 2 - Rich text editor (Notion-like)
Zustand - State management (though not heavily used yet)
TanStack Query v5 - Server state/data fetching
React Hook Form + Zod - Form handling and validation (installed but not used yet)

Backend:

Fastify 5 - Fast Node.js web framework
MongoDB 6 (Atlas) - NoSQL database (cloud-hosted)
MongoDB Native Driver - Direct database access
Firebase Auth - User authentication (installed but not implemented yet)
Puppeteer - PDF generation
Sharp - Image processing (installed but not used yet)
dotenv - Environment variables

Monorepo Setup:

Turborepo - Monorepo build system
pnpm workspaces (or npm workspaces) - Package management
Shared TypeScript types - Via packages/types

Development Tools:

ESLint + Prettier - Code quality (configured)
GitHub - Version control
VS Code - IDE

Deployment (Planned):

Frontend: Vercel or Netlify
Backend: Railway or Render

Key Features Built:
✅ Infinitely nestable document structure
✅ Drag-and-drop with visual indicators
✅ Multi-workspace support
✅ Rich text editing with Tiptap
✅ Multi-document PDF export
✅ Auto-save with debouncing
✅ Search and favorites
✅ Notion-like UI/UX
Still To Implement:

Firebase Authentication (user accounts)
Image uploads to S3/Cloudflare R2
Collaborative editing (optional)
More Tiptap extensions (tables, embeds, etc.)
