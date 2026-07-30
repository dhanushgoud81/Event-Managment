# Event Management System

A production-ready, full-stack event management platform built with modern technologies.

## Tech Stack

### Frontend
- React 19 + TypeScript
- Tailwind CSS v3
- Vite
- TanStack Query (React Query)
- Zustand (State Management)
- React Hook Form + Zod
- Framer Motion (Animations)
- Recharts (Dashboard Charts)
- Lucide React (Icons)

### Backend
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT Authentication (Access + Refresh tokens)
- Razorpay Payment Gateway
- Redis (Sessions, Caching) with in-memory fallback
- Nodemailer (Emails) with console fallback
- Pino (Logging)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional for development)

### Installation

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Database Setup

```bash
cd server

# Copy env file and configure
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio
npx prisma studio
```

### Running the Application

```bash
# Terminal 1: Start the backend
cd server
npm run dev

# Terminal 2: Start the frontend
cd client
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/api/health

### Default Super Admin
- Email: admin@eventmanagement.com
- Password: Admin@123456

## Project Structure

```
event-management/
├── client/           # React Frontend
│   ├── src/
│   │   ├── api/      # API functions (Axios)
│   │   ├── components/  # Reusable components
│   │   ├── hooks/    # TanStack Query hooks
│   │   ├── layouts/  # Page layouts
│   │   ├── pages/    # Page components
│   │   ├── store/    # Zustand stores
│   │   ├── styles/   # Global CSS
│   │   └── types/    # TypeScript types
│   └── ...
├── server/           # Express Backend
│   ├── prisma/       # Database schema
│   ├── src/
│   │   ├── auth/     # Authentication module
│   │   ├── users/    # User management
│   │   ├── events/   # Event management
│   │   ├── tickets/  # Ticket management
│   │   ├── forms/    # Dynamic forms
│   │   ├── registrations/  # Registration
│   │   ├── payments/ # Payment processing
│   │   ├── referrals/# Referral system
│   │   ├── wallet/   # Wallet
│   │   ├── notifications/  # Notifications
│   │   ├── dashboard/ # Dashboard
│   │   ├── reports/  # Reports
│   │   ├── settings/ # System settings
│   │   ├── middleware/ # Express middleware
│   │   ├── config/   # Configuration
│   │   └── utils/    # Utilities
│   └── ...
└── README.md
```

## License

MIT
