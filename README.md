# WebhookOrchestrator

**A multi-tenant webhook management and event delivery platform built with Node.js, TypeScript, Express and PostgreSQL.**

WebhookOrchestrator is a centralized platform that enables applications to register webhook endpoints, define event types, publish events and reliably deliver them to subscribed endpoints.

It provides the infrastructure required to manage webhook integrations, process events asynchronously, handle failures and maintain delivery history.

---

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [How It Works](#how-it-works)
- [Database Design](#database-design)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Getting Started](#getting-started)
- [Core Engineering Concepts](#core-engineering-concepts)

---

## Overview

WebhookOrchestrator simplifies webhook infrastructure by providing a centralized system for managing events and delivering them to external applications.

Consider an e-commerce application that needs to notify multiple services whenever an order is placed.

- An inventory service updates stock.
- A payment service processes payment information.
- A notification service sends an email.
- An analytics service records the order.

Instead of implementing separate webhook delivery mechanisms for every integration, the application publishes a single event to WebhookOrchestrator.

The platform identifies subscribed endpoints, creates delivery tasks and processes them through an asynchronous delivery system.

## The Problem

Building webhook functionality independently in every application introduces several challenges:

- Managing multiple webhook endpoints.
- Tracking endpoint subscriptions.
- Handling failed HTTP requests.
- Implementing retry mechanisms.
- Preventing duplicate event processing.
- Managing endpoint failures.
- Maintaining delivery history.
- Ensuring tenant-level data isolation.

WebhookOrchestrator addresses these challenges through a centralized, event-driven architecture.

## Key Features

### Multi-Tenant Architecture
- Multiple organizations can use the same platform.
- Tenant-level resource isolation.
- Tenant-scoped database queries and relationships.

### Authentication and Authorization
- User registration and login.
- Password hashing using Argon2.
- JWT-based authentication.
- Role-based access control.
- API key generation, listing and revocation.

### Webhook Endpoint Management
- Register webhook endpoints.
- Retrieve and list endpoints.
- Update endpoint configurations.
- Enable and disable endpoints.
- Soft-delete endpoints.
- Secure endpoint management.

### Event Management
- Create custom event types.
- Publish events with JSON payloads.
- Retrieve individual events.
- List events with pagination.
- Support idempotency keys.
- Maintain event history.

### Subscription Management
- Subscribe endpoints to event types.
- Manage endpoint subscriptions.
- Identify matching endpoints when events are published.

### Asynchronous Delivery
- Create individual delivery tasks for subscribed endpoints.
- Process webhook requests asynchronously.
- Track delivery status.
- Maintain delivery attempt history.

### Reliability and Fault Tolerance
- Automatic retries with exponential backoff.
- Failure handling.
- Endpoint failure detection.
- Circuit-breaker behavior.
- Idempotent event processing.

### Security
- API key hashing.
- HMAC-based webhook signatures.
- Request validation.
- Rate limiting.
- SSRF protection for webhook URLs.
- Tenant-level access isolation.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| TypeScript | Type safety |
| Express 5 | HTTP server and API routing |
| PostgreSQL | Relational database |
| Raw SQL | Database queries and transactions |
| `pg` | PostgreSQL client and connection pooling |
| JWT | User authentication |
| Argon2 | Password hashing |
| Node.js Crypto | Cryptographic operations |

**Database approach:** PostgreSQL is accessed through raw SQL queries using the `pg` package. No ORM is used.

---

## System Architecture

WebhookOrchestrator follows a modular backend architecture.

```text
                 CLIENT APPLICATIONS
                         |
                         v
                  REST API REQUESTS
                         |
                         v
                  EXPRESS 5 SERVER
                         |
                         v
                  AUTHENTICATION
                         |
                         v
                      ROUTES
                         |
                         v
                    CONTROLLERS
                         |
                         v
                      SERVICES
                         |
                         v
                    POSTGRESQL
                         |
          +--------------+--------------+
          |              |              |
          v              v              v
        TENANTS        EVENTS        ENDPOINTS
                         |              |
                         |              |
                         v              v
                    SUBSCRIPTIONS
                         |
                         v
                      DELIVERIES
                         |
                         v
                 BACKGROUND WORKER
                         |
                         v
                 EXTERNAL WEBHOOKS
```

The backend is organized into separate layers:

- **Routes:** Define API endpoints and middleware.
- **Controllers:** Handle HTTP requests, validate input and send responses.
- **Services:** Contain business logic and database operations.
- **Middleware:** Handle authentication and request-level processing.
- **Database:** Stores tenants, users, endpoints, events and delivery information.
- **Background Workers:** Process asynchronous delivery tasks.

---

## How It Works

Consider an e-commerce application publishing an `order.placed` event.

### 1. Tenant Registration

A user registers their organization, creating a tenant and its initial owner account.

### 2. API Key Generation

The tenant owner generates an API key to authenticate application requests.

### 3. Register Webhook Endpoints

The tenant registers external URLs that should receive webhook notifications.

```text
https://inventory.example.com/webhooks
https://notifications.example.com/webhooks
https://analytics.example.com/webhooks
```

### 4. Create Event Types

The tenant defines event categories.

```text
order.placed
order.cancelled
payment.completed
user.registered
```

### 5. Subscribe Endpoints

Endpoints subscribe to the event types they want to receive.

| Endpoint | Subscribed Event |
|---|---|
| Inventory Service | order.placed |
| Notification Service | order.placed |
| Analytics Service | order.placed, payment.completed |

### 6. Publish an Event

The application sends an event to WebhookOrchestrator.

Example request:

```json
{
  "eventTypeId": "1",
  "payload": {
    "orderId": "ORD-1001",
    "amount": 1500,
    "status": "placed"
  },
  "idempotencyKey": "order-1001-created"
}
```

### 7. Create Delivery Records

The platform identifies enabled endpoints subscribed to the event type and creates individual pending delivery records.

| Event ID | Endpoint | Status |
|---|---|---|
| 101 | Inventory Service | pending |
| 101 | Notification Service | pending |
| 101 | Analytics Service | pending |

### 8. Process Deliveries

A background worker fetches pending deliveries and sends HTTP POST requests to their respective endpoints.

The delivery system tracks responses, handles failures and schedules retries.

---

## Database Design

PostgreSQL is used as the primary database.

| Table | Responsibility |
|---|---|
| `tenants` | Stores organizations |
| `users` | Stores tenant users and roles |
| `api_keys` | Stores hashed API keys and metadata |
| `event_types` | Stores custom event categories |
| `endpoints` | Stores registered webhook endpoints |
| `endpoint_subscriptions` | Maps endpoints to event types |
| `events` | Stores published events and JSON payloads |
| `deliveries` | Tracks delivery tasks |
| `delivery_attempts` | Stores individual delivery attempts |

### Entity Relationships

```text
                    TENANTS
                       |
            +----------+----------+
            |          |          |
            v          v          v
          USERS     API_KEYS   ENDPOINTS
                                  |
                                  |
                                  v
                      ENDPOINT_SUBSCRIPTIONS
                                  |
                                  |
                                  v
                              EVENT_TYPES
                                  |
                                  |
                                  v
                                EVENTS
                                  |
                                  |
                                  v
                              DELIVERIES
                                  |
                                  |
                                  v
                         DELIVERY_ATTEMPTS
```

### Database Concepts

- **JSONB:** Stores flexible event payloads.
- **Unique constraints:** Prevent duplicate resource combinations.
- **Foreign keys:** Maintain relationships and data integrity.
- **Transactions:** Ensure atomic event and delivery creation.
- **Indexes:** Improve query performance.
- **Soft deletion:** Retains endpoint records and delivery history.

---

## Project Structure

```text
WebhookOrchestrator/
│
├── migrations/
│   └── 001_initial_schema.sql
│
├── src/
│   │
│   ├── config/
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── endpoint.controller.ts
│   │   ├── event.controller.ts
│   │   └── health.controller.ts
│   │
│   ├── db/
│   │   └── pool.ts
│   │
│   ├── middleware/
│   │   └── auth.middleware.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── endpoint.routes.ts
│   │   ├── event.routes.ts
│   │   └── index.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── endpoint.service.ts
│   │   └── event.service.ts
│   │
│   ├── types/
│   │   └── express.d.ts
│   │
│   ├── utils/
│   │   └── api-error.ts
│   │
│   └── server.ts
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── tsconfig.json
```

---

## API Reference

Base URL:

```text
/api/v1
```

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register tenant and owner |
| POST | `/auth/login` | Authenticate user |
| POST | `/auth/api-keys` | Generate API key |
| GET | `/auth/api-keys` | List API keys |
| DELETE | `/auth/api-keys/:id` | Revoke API key |

### Endpoint Management

| Method | Endpoint | Description |
|---|---|---|
| POST | `/endpoints` | Register endpoint |
| GET | `/endpoints` | List endpoints |
| GET | `/endpoints/:id` | Retrieve endpoint |
| PATCH | `/endpoints/:id` | Update endpoint |
| DELETE | `/endpoints/:id` | Delete endpoint |

### Event Management

| Method | Endpoint | Description |
|---|---|---|
| POST | `/event-types` | Create event type |
| GET | `/event-types` | List event types |
| POST | `/events` | Publish event |
| GET | `/events` | List events |
| GET | `/events/:id` | Retrieve event |

### Pagination

Event listing supports pagination.

```text
GET /api/v1/events?page=1&limit=10
```

---

## Authentication

The platform uses two authentication mechanisms.

### JWT Authentication

- Users register and log in.
- Passwords are hashed using Argon2.
- Successful login generates a signed JWT.
- Tokens contain user ID, tenant ID and role.
- Protected routes use authentication middleware.

### API Key Authentication

- Keys are generated using cryptographically secure random bytes.
- Only hashed API keys are stored in PostgreSQL.
- Original keys are returned only during generation.
- Keys can be listed and revoked.
- Last-used timestamps are maintained.

---

## Getting Started

### Prerequisites

- Node.js
- npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Suhas1010/WebhookOrchestrator.git
```

### 2. Navigate to the project

```bash
cd WebhookOrchestrator
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the project root.

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
```

Adjust the variable names to match the application configuration.

Never commit `.env` or expose database credentials and authentication secrets.

### 5. Set up the database

Create a PostgreSQL database and execute the migration:

```bash
psql -d your_database_name -f migrations/001_initial_schema.sql
```

### 6. Run the application

```bash
npm run dev
```

Use the development script configured in `package.json`.

---

## Core Engineering Concepts

WebhookOrchestrator explores practical backend engineering and distributed-systems concepts:

- Multi-tenancy and data isolation.
- REST API design.
- Authentication and authorization.
- Relational database design.
- Raw SQL and connection pooling.
- Database transactions and atomicity.
- Event-driven architecture.
- Asynchronous job processing.
- Idempotency and duplicate prevention.
- Retry strategies and exponential backoff.
- Fault tolerance and failure isolation.
- HMAC-based message verification.
- Concurrency control.
- API and endpoint security.

---

## Author

Developed as a backend engineering project focused on production-oriented API development, event-driven systems, database design and distributed-systems fundamentals.
