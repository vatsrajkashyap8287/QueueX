# QueueX — Smart Virtual Queue Management System

<div align="center">

### Less Waiting. More Living.

**A modern, real-time virtual queue management platform built with the MERN stack, Redis and Socket.IO.**

QueueX helps customers join queues remotely, track their positions in real time and receive notifications when their turn arrives. Administrators can manage queues, serve customers and monitor performance through an interactive dashboard.

![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-FIFO_Queue-DC382D?logo=redis&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real_Time-010101?logo=socketdotio&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Styling-06B6D4?logo=tailwindcss&logoColor=white)

</div>

---

## 🌐 Live Application

**QueueX Live Website**

[https://queue-x-nine.vercel.app](https://queue-x-nine.vercel.app)

> Note: The backend may take additional time to respond after inactivity, depending on the hosting plan.

---

## 📖 About QueueX

Traditional queue systems require customers to physically wait in lines, often leading to overcrowding, uncertainty and wasted time.

**QueueX** provides a digital alternative.

Customers can join queues online, receive unique tokens and monitor their waiting positions without continuously standing in line.

Administrators can create and manage queues, call the next customer and analyze queue activity through a centralized dashboard.

The platform uses **Redis for FIFO queue management**, **MongoDB for persistent data storage** and **Socket.IO for real-time updates**.

---

## ✨ Features

### 👤 User Features

- Secure user registration and login
- JWT-based authentication
- Browse available queues
- Join active queues remotely
- Receive automatically generated queue tokens
- Track live queue positions
- View currently serving tokens
- Smart estimated waiting times
- Live waiting countdown
- Real-time dashboard updates
- Browser notifications when called
- Optional notification sounds
- Animated "Your Turn" alerts
- Leave queues with confirmation
- View completed and cancelled queue history
- Personal queue statistics
- Responsive mobile dashboard

### 🛠️ Admin Features

- Secure role-based admin dashboard
- Create and manage queues
- Configure average service time
- Monitor waiting customers
- Call the next customer using FIFO ordering
- Complete customer services
- Pause and resume queues
- Close and reopen queues
- View currently serving customers
- Track queue activity in real time
- Monitor queue performance
- View analytics charts and statistics

### ⚡ Real-Time Features

- Socket.IO-based live updates
- Automatic dashboard refresh on queue changes
- Connection status indicator
- Automatic reconnection handling
- Real-time token status updates
- Live estimated waiting countdown

### 🔐 Security Features

- JWT authentication
- Role-based access control
- Password hashing with bcrypt
- Backend input validation
- Protected REST API routes
- Authenticated Socket.IO connections
- Helmet security headers
- Configurable CORS
- API rate limiting
- Centralized error handling

### 🧩 Reliability Features

- Redis-backed FIFO waiting queues
- Sequential token generation
- Queue-specific distributed locking
- Lock renewal during queue operations
- MongoDB uniqueness constraints
- MongoDB-to-Redis FIFO recovery logic
- Partial-failure recovery handling

> Note: Advanced automatic recovery and concurrency scenarios require further production-scale testing.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| HTTP Client | Axios |
| Icons | Lucide React |
| Charts | Recharts |
| Notifications | React Hot Toast, Browser Notifications API |
| Real-Time Communication | Socket.IO |
| Backend | Node.js, Express |
| Authentication | JWT, bcryptjs |
| Database | MongoDB Atlas, Mongoose |
| Queue Storage | Redis Cloud |
| Validation | express-validator |
| Security | Helmet, CORS, express-rate-limit |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

---

## 🏗️ System Architecture

```text
                     ┌─────────────────────┐
                     │   React Frontend    │
                     │       Vercel        │
                     └──────────┬──────────┘
                                │
                         HTTPS / Socket.IO
                                │
                     ┌──────────▼──────────┐
                     │  Node.js + Express  │
                     │       Render        │
                     └──────────┬──────────┘
                                │
                  ┌─────────────┴─────────────┐
                  │                           │
         ┌────────▼────────┐         ┌────────▼────────┐
         │  MongoDB Atlas  │         │   Redis Cloud   │
         │ Persistent Data │         │   FIFO Queues   │
         └─────────────────┘         └─────────────────┘
```

### How It Works

1. A user registers or logs in.
2. The user selects an available queue.
3. The backend generates a sequential token.
4. The queue entry is stored in MongoDB.
5. Redis maintains the FIFO waiting order.
6. The admin calls the next customer.
7. Socket.IO broadcasts a queue update event.
8. The user's dashboard updates automatically.
9. The customer receives a "Your Turn" alert.
10. The admin completes the service.
11. The completed entry becomes available in queue history.

---

## 📂 Project Structure

```text
QueueX/
│
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── redis.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── queueController.js
│   │   └── analyticsController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── validateRequest.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Queue.js
│   │   └── QueueEntry.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── queueRoutes.js
│   │   └── analyticsRoutes.js
│   │
│   ├── services/
│   │   ├── queueService.js
│   │   ├── queueLockService.js
│   │   ├── queueRecoveryService.js
│   │   └── queueConsistencyService.js
│   │
│   ├── sockets/
│   │   ├── socketHandler.js
│   │   └── socketEvents.js
│   │
│   ├── validators/
│   │   ├── authValidators.js
│   │   └── queueValidators.js
│   │
│   ├── utils/
│   │   └── generateToken.js
│   │
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── dashboard/
│   │   │   └── layout/
│   │   │
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ⚙️ Local Installation

### Prerequisites

Before running QueueX, install or configure:

- Node.js and npm
- Git
- MongoDB Atlas or a compatible MongoDB instance
- Redis Cloud or a compatible Redis server

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/QueueX.git
```

```bash
cd QueueX
```

Replace `YOUR_USERNAME` with the repository owner's GitHub username.

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory.

Example configuration:

```env
NODE_ENV=development
PORT=5000

MONGO_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string

JWT_SECRET=replace_with_a_long_random_secret

CLIENT_URL=http://localhost:5173
```

**Important:** Replace the placeholder values with your own credentials.

Never commit the `.env` file to GitHub.

Start the backend:

```bash
npm run dev
```

Default backend URL:

```text
http://localhost:5000
```

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend` directory.

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## 🔑 Authentication and Roles

QueueX supports two application roles:

| Role | Access |
|---|---|
| User | Join queues, track tokens, receive alerts, view personal history |
| Admin | Create queues, manage queue operations, access analytics |

Authentication uses JWT tokens.

Passwords are hashed before storage.

Administrative API operations require authorization.

**Security note:** Public registration must not allow arbitrary creation of admin accounts. Administrative access should be provisioned through a trusted process.

---

## 🔄 Queue Lifecycle

QueueX supports the following queue states:

| Status | Description |
|---|---|
| Active | Users can join, and admins can process tokens |
| Paused | New joins and queue processing are temporarily restricted |
| Closed | Queue is unavailable to users but remains accessible to its administrator |

Supported transitions:

```text
Active ─────► Paused
   ▲            │
   └────────────┘

Active ─────► Closed
Paused ─────► Closed

Closed ─────► Active
```

A queue cannot be closed while it has waiting or currently serving customers.

Reopening preserves existing queue history and token numbering.

---

## 📡 API Overview

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Authenticate a user |

### Queue Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/queues` | List accessible queues |
| POST | `/api/queues` | Create a queue (Admin) |
| GET | `/api/queues/my` | Get current user's active entries |
| GET | `/api/queues/history` | Get personal queue history |
| GET | `/api/queues/:queueId` | Get queue details |
| POST | `/api/queues/:queueId/join` | Join a queue |
| DELETE | `/api/queues/entries/:entryId` | Leave a queue |
| POST | `/api/queues/:queueId/next` | Call next customer (Admin) |
| PATCH | `/api/queues/entries/:entryId/complete` | Complete service (Admin) |
| PATCH | `/api/queues/:queueId/status` | Update queue status (Admin) |

### Analytics

Administrative analytics endpoints include:

```text
GET /api/analytics/admin
GET /api/analytics/admin/charts
```

Protected endpoints require a valid JWT bearer token.

---

## 📱 Responsive Design

QueueX includes responsive layouts for:

- Desktop computers
- Laptops
- Tablets
- Smartphones

The application uses a modern dark UI with Indigo, Violet and Cyan accents.

Key interface components include:

- Responsive sidebar
- Profile dropdown
- Dashboard statistics cards
- Digital token tickets
- Real-time status indicators
- Queue management panels
- Confirmation modals
- Analytics charts
- Mobile-friendly queue history

---

## 🚀 Deployment

The application is designed for deployment using:

**Frontend:** Vercel  
**Backend:** Render  
**Database:** MongoDB Atlas  
**Queue Storage:** Redis Cloud

### Frontend Environment Variables

```env
VITE_API_URL=https://your-backend.example.com/api
VITE_SOCKET_URL=https://your-backend.example.com
```

### Backend Environment Variables

```env
NODE_ENV=production
MONGO_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string
JWT_SECRET=your_secure_jwt_secret
CLIENT_URL=https://your-frontend.example.com
```

Configure the frontend URL in the backend CORS settings.

For reliable real-time operation, use hosting that supports persistent Socket.IO connections.

---

## 🧪 Testing

QueueX has been tested locally for major application flows, including:

- User registration and login
- Role-based dashboard access
- Queue creation
- Joining and leaving queues
- Sequential token generation
- Calling the next customer
- Completing services
- Pause, resume, close and reopen operations
- Queue history
- Browser notifications
- Socket.IO updates and reconnection
- Responsive dashboard layouts

Additional testing is recommended for production-scale concurrency, Redis failure recovery and long-running network disruptions.

---

## 🔒 Security Considerations

Before using QueueX in a production environment:

1. Keep all credentials in environment variables.
2. Never commit database passwords or JWT secrets.
3. Use HTTPS for deployed services.
4. Configure trusted frontend origins.
5. Restrict database access where possible.
6. Review rate limits for expected traffic.
7. Use strong secrets and database credentials.
8. Review logs for unexpected authentication failures.
9. Avoid exposing development-only endpoints.
10. Regularly update dependencies.

---

## 🔮 Future Improvements

Potential future enhancements include:

- AI-powered waiting time predictions
- Queue traffic forecasting
- Smart administrator recommendations
- Multi-branch organization management
- Email and SMS notifications
- Advanced performance reports
- Automated integration and load testing

These are planned ideas, not currently implemented features.

---

## 🎯 Project Objective

The primary goal of QueueX is to provide a smarter, more accessible and efficient queue management experience.

By combining persistent data storage, Redis FIFO queues and real-time communication, QueueX aims to reduce uncertainty and improve the experience of waiting for services.

---

## 📄 License

No open-source license has been specified for this repository.

All rights remain with the project owner unless a license is added.

---

<div align="center">

### QueueX — Less Waiting. More Living.

Built with React, Node.js, Express, MongoDB, Redis and Socket.IO.

[Visit QueueX](https://queue-x-nine.vercel.app)

</div>
