# JammCare - Healthcare Service Platform

## Project Structure

JammCare is now split into two separate applications:

### Backend (`/backend`)
- **Framework**: Express.js with TypeScript
- **Database**: MySQL
- **Authentication**: JWT
- **Port**: 3001

#### Key Features:
- User management and authentication
- Provider management
- Service catalog
- Booking system
- Review and rating system
- Payment integration (ready)

#### Database Tables:
- `users` - User accounts and authentication
- `user_profiles` - Extended user information
- `providers` - Healthcare service providers
- `services` - Available services
- `provider_services` - Provider-service relationships
- `bookings` - Appointment bookings
- `reviews` - Service reviews and ratings
- `locations` - User/provider locations with coordinates
- `payments` - Payment transactions
- `notifications` - User notifications

### Frontend (`/frontend`)
- **Framework**: React with TypeScript
- **UI Library**: Radix UI + Tailwind CSS
- **State Management**: React Query + React Router
- **Port**: 5173

#### Removed:
- ❌ Supabase integration
- ❌ Lovable.dev dependencies
- ✅ Replaced with MySQL backend
- ✅ Separated architecture

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
npm install
```

2. Create `.env` file:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=jammcare
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=24h
CORS_ORIGIN=http://localhost:5173
```

3. Create MySQL database:
```bash
mysql -u root -p
CREATE DATABASE jammcare;
USE jammcare;
SOURCE sql/schema.sql;
```

4. Start backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
npm install
```

2. Create `.env` file:
```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=JammCare
```

3. Start frontend development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Users
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/:userId` - Update user profile

### Services
- `GET /api/services` - Get all services
- `GET /api/services/category/:category` - Get services by category
- `GET /api/services/:serviceId` - Get service details

### Providers
- `GET /api/providers` - Get all verified providers
- `GET /api/providers/:providerId` - Get provider details
- `POST /api/providers/register` - Register as provider

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/user/:userId` - Get user bookings
- `GET /api/bookings/provider/:providerId` - Get provider bookings
- `PATCH /api/bookings/:bookingId` - Update booking status

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/provider/:providerId` - Get provider reviews

## Technology Stack

### Backend
- Express.js
- MySQL 8.0+
- TypeScript
- JWT for authentication
- Bcryptjs for password hashing
- UUID for unique identifiers

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Radix UI Components
- React Query (TanStack Query)
- React Router
- React Hook Form
- Zod for validation
- Leaflet for maps

## Project Status

✅ Backend structure created
✅ Database schema designed
✅ Core API routes implemented
✅ Frontend separated from backend
✅ API client service created
✅ Authentication hooks implemented

🔄 In Development:
- UI Components
- Frontend pages
- API integration
- Testing

## Next Steps

1. Set up MySQL database
2. Install dependencies for both backend and frontend
3. Configure environment variables
4. Start development servers
5. Build UI components
6. Integrate API endpoints with frontend

## License

MIT
