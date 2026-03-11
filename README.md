# RouteSet

A modern web application for creating, managing, and sharing climbing routes. RouteSet allows climbing gyms and crags to digitize their routes with an intuitive interface for marking holds on wall photos.

## Features

- **Site-Based Access**: Enter a site ID to access routes for a specific climbing location
- **Route Creation**: Upload wall photos and mark holds with an interactive canvas
- **Hold Types**: Mark start, middle, and finish holds with color-coded markers
- **Zoom & Pan**: Pinch to zoom, drag to pan on mobile; scroll wheel and drag on desktop
- **Transparent Holds**: Semi-transparent hold markers let you see the wall image underneath
- **Route Details**: Add route name, grade, style, setter name, and beta/description
- **Publish System**: Save as draft or publish routes for public viewing
- **Route Discovery**: Browse published routes with search functionality
- **My Routes**: View and manage your own routes (drafts and published)
- **Route Sharing**: Share routes via URL
- **Responsive Design**: Mobile-first design that works great on phones and desktops

## Tech Stack

- **Frontend**: React, React Router, TanStack Query
- **Styling**: Tailwind CSS
- **Backend**: Cloudflare Workers (worker.js)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 for image uploads

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your configuration
# (For local development, the default values work)
```

### Development

```bash
# Start development server
npm run dev

# Deploy to production (Cloudflare Workers)
npx wrangler deploy
```

### Database Migrations

Migrations are located in the `migrations/` folder. They run automatically on first deploy or can be run manually:

```bash
# Apply migrations
npx wrangler d1 execute DB --file=migrations/0001_create_routes.sql
npx wrangler d1 execute DB --file=migrations/0002_alter_routes_add_missing_columns.sql
npx wrangler d1 execute DB --file=migrations/0003_add_site_id.sql
```

## How to Use

1. **Enter Site ID**: On first launch, enter a site ID (e.g., your gym name or crag area)
2. **Browse Routes**: View published routes on the home page
3. **Create Route**: Click the + button to create a new route
   - Upload a wall photo
   - Tap to place holds (start, middle, finish)
   - Pinch to zoom, drag with two fingers to pan
   - Add route details (name, grade, style, etc.)
   - Save as draft or publish
4. **My Routes**: View your routes (drafts and published) in the "My Routes" section
5. **View Route**: Tap a route card to see full details, including the marked holds on the wall image
6. **Delete Route**: Delete routes from the view page or from the route card

## Project Structure

```
src/
├── api/              # API client (base44client.js)
├── components/       # Reusable UI components
│   ├── routes/       # Route-specific components
│   │   ├── HoldMarker.jsx    # Individual hold marker
│   │   ├── WallCanvas.jsx    # Interactive canvas with zoom/pan
│   │   ├── PhotoUploader.jsx # Image upload component
│   │   ├── GradeSelector.jsx # Grade selection
│   │   ├── HoldTypePicker.jsx # Hold type selector
│   │   └── RouteCard.jsx     # Route preview card
│   └── ui/           # Shadcn/ui components
├── lib/              # Utilities and contexts
│   ├── SiteIdContext.jsx    # Site ID state management
│   ├── AuthContext.jsx      # Authentication
│   └── utils.js             # Helper functions
├── pages/            # Page components
│   ├── SiteIdEntry.jsx      # Site ID entry screen
│   ├── Home.jsx             # Browse published routes
│   ├── MyRoutes.jsx         # User's routes
│   ├── CreateRoute.jsx      # Create/edit route
│   └── ViewRoute.jsx        # View route details
└── App.jsx           # Main app component

worker.js             # Cloudflare Worker backend
migrations/           # Database migrations
```

## API Endpoints

- `GET /api/routes` - List routes (supports filters: `site_id`, `published`, `created_by`, `id`)
- `POST /api/routes` - Create a new route
- `PUT /api/routes/:id` - Update a route
- `DELETE /api/routes/:id` - Delete a route
- `POST /api/upload` - Upload image (to R2)
- `GET /api/images/:key` - Retrieve image from R2

## License

MIT
