# Golf Trip Manager

A Next.js application for tracking and managing golf trip results over the years.

## Features

- Add and manage golf players
- Track years played and average scores
- View statistics including total players, years tracked, and best average
- **Crown a champion golfer for each trip** - Select the winner of each golf trip
- Export and import player data
- Responsive design with modern UI
- Local storage persistence

## Prerequisites

Before running this application, you need to have Node.js installed on your system. You can download it from [nodejs.org](https://nodejs.org/).

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run export` - Build and export static files
- `npm run deploy:build` - Build for deployment
- `npm run deploy:clean` - Clean build artifacts
- `npm run deploy:full` - Clean and build for deployment

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout component
│   └── page.tsx        # Main page component
├── components/         # React components
│   ├── AddPlayerModal.tsx
│   ├── PlayerCard.tsx
│   ├── PlayerDetailsModal.tsx
│   └── StatsGrid.tsx
└── lib/               # Utilities and types
    ├── types.ts       # TypeScript type definitions
    └── utils.ts       # Utility functions
```

## Usage

1. **Add Players**: Click "Add New Player" to add golf players with their name, years played, and average score.

2. **Add Trips**: Create golf trips with dates, location, and optional champion selection.

3. **Crown Champions**: For each trip, you can select a champion golfer from the dropdown menu when creating or editing trips.

4. **View Statistics**: The dashboard shows total players, years tracked, and the best average score.

5. **Manage Players**: Click on player cards to view details or use the action buttons to view details or delete players.

6. **Export/Import**: Use the export and import buttons to backup and restore your player data.

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **CSS** - Custom styling with modern design
- **Font Awesome** - Icons
- **Local Storage** - Data persistence

## Data Storage

Player data is stored in the browser's local storage, so your data will persist between sessions. You can also export your data as a JSON file for backup purposes.

## Deployment

This application can be deployed to Vercel (recommended) or Siteground hosting. The admin panel is password-protected in production to prevent public access.

### Vercel Deployment (Recommended)

1. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

2. **Deploy using the script**:
   ```bash
   ./deploy-vercel.sh
   ```

3. **Or deploy manually**:
   - Push your code to GitHub/GitLab/Bitbucket
   - Go to [vercel.com](https://vercel.com) and create a new project
   - Import your repository
   - Set environment variables in Vercel dashboard:
     - `ADMIN_PASSWORD=your_secure_password`
     - `NODE_ENV=production`

For detailed Vercel deployment instructions, see [VERCEL-DEPLOYMENT.md](VERCEL-DEPLOYMENT.md).

### Siteground Deployment

1. **Set up environment variables**:
   ```bash
   cp env.example .env.local
   # Edit .env.local with your admin password
   ```

2. **Run deployment script**:
   ```bash
   ./deploy.sh
   ```

3. **Upload to server**: Upload the entire project to your web server and set up a reverse proxy.

For detailed Siteground deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Security Features

- ✅ Admin panel password-protected in production
- ✅ Admin link hidden from public dashboard
- ✅ Server-side rendering for optimal performance
- ✅ Security headers configured
- ✅ HTTPS ready

## Contributing

Feel free to submit issues and enhancement requests!


