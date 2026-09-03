# 🛡️ Insurance Policy & Claim Management System

A **production-grade RESTful backend** built with **Spring Boot 3.3** for end-to-end insurance operations — covering policy lifecycle, claim adjudication, premium payments via Razorpay, and multi-role access control.

![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.5-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Default Users](#default-users)
- [API Endpoints](#api-endpoints)
- [Role-Based Access Matrix](#role-based-access-matrix)
- [Claim Workflow](#claim-workflow)
- [Policy Lifecycle](#policy-lifecycle)
- [Swagger / API Docs](#swagger--api-docs)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

This system digitalizes the complete insurance workflow — from customer registration with OTP verification, through policy purchase & premium payments, to multi-stage claim adjudication. It implements a **three-tier role hierarchy** (Admin → Officer → Customer) with granular method-level security.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (React / Postman)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API (JSON)
┌────────────────────────────▼────────────────────────────────────┐
│                   Spring Boot Application                       │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ Controllers │──│ Services     │──│ Repositories (JPA)      │ │
│  └────────────┘  └──────────────┘  └────────────┬────────────┘ │
│  ┌────────────┐  ┌──────────────┐               │              │
│  │ JWT Filter  │  │ Scheduler    │               │              │
│  └────────────┘  └──────────────┘               │              │
└────────────────────────────┬────────────────────┬───────────────┘
                             │                    │
           ┌─────────────────┤                    │
           │                 │                    │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌────────▼────────┐
    │    MySQL     │   │    Redis    │   │   Cloudinary    │
    │  (Primary)   │   │ (Blacklist) │   │  (Doc Storage)  │
    └─────────────┘   └─────────────┘   └─────────────────┘
           │
    ┌──────┴──────────────────────┐
    │  External Integrations     │
    │  • Razorpay (Payments)     │
    │  • Twilio (SMS OTP)        │
    │  • Gmail SMTP (Email OTP)  │
    └────────────────────────────┘
```

---

## Tech Stack

| Layer             | Technology                                  |
|-------------------|---------------------------------------------|
| **Language**      | Java 17                                     |
| **Framework**     | Spring Boot 3.3.5                           |
| **Security**      | Spring Security + JWT (jjwt 0.12.6)         |
| **Database**      | MySQL 8.x + Spring Data JPA / Hibernate     |
| **Caching**       | Redis (JWT token blacklisting)              |
| **Payments**      | Razorpay Java SDK 1.4.6                     |
| **File Storage**  | Cloudinary (claim document uploads)         |
| **SMS**           | Twilio SDK 10.1.0                           |
| **Email**         | Spring Boot Mail (Gmail SMTP)               |
| **API Docs**      | SpringDoc OpenAPI 2.6.0 (Swagger UI)        |
| **Build Tool**    | Maven                                       |
| **Utilities**     | Lombok, Bean Validation (Jakarta)           |

---

## Features

### 🔐 Authentication & Security
- **User Registration** with email/SMS OTP verification (Twilio + Gmail SMTP)
- **JWT-based stateless authentication** with configurable expiration
- **Secure logout** via Redis-backed token blacklisting
- **Forgot/Reset password** — 3-step OTP-based flow
- **BCrypt** password hashing
- **Role-based method-level security** (`@PreAuthorize`)
- **CORS** configured for frontend integration

### 👤 User & Customer Management
- **Three roles**: `ADMIN`, `OFFICER`, `CUSTOMER`
- Admin can create Officer accounts, activate/deactivate users
- Customer profile management (address, DOB, gender, Aadhaar, PAN)
- Officer workload tracking for smart claim assignment

### 📦 Insurance Products & Plans
- **Four product types**: `HEALTH`, `MOTOR`, `LIFE`, `TRAVEL`
- Admin creates products → attaches policy plans with coverage details
- Plans include: coverage amount, premium types (Monthly/Quarterly/Half-Yearly/Yearly/One-Time), duration
- Activate/deactivate products and plans

### 📄 Policy Management
- **Customer self-purchase** or **Officer-issued** policies
- **Product-specific fields**:
  - **Motor**: Vehicle registration, make/model, year, IDV amount
  - **Health**: Pre-existing diseases list
  - **Life**: Nominee name & relationship
- Policy statuses: `PENDING_PAYMENT` → `ACTIVE` → `EXPIRED` / `CANCELLED` / `LAPSED`
- **Auto-generated policy numbers** (e.g., `POL-XXXXXXXX`)
- Paginated listing with sort support

### 💳 Premium Payments (Razorpay Integration)
- **Create Razorpay order** → Customer pays on frontend → **Verify payment signature**
- Automatic policy activation upon successful first payment
- Installment tracking: `totalPremiumPaid`, `lastPaymentDate`, `nextPaymentDueDate`
- Payment statuses: `PENDING`, `SUCCESS`, `FAILED`
- Payment methods: `RAZORPAY`, `CASH`, `BANK_TRANSFER`

### 📝 Claim Lifecycle
- **Multi-stage adjudication workflow** with full audit trail
- Claim document upload via **Cloudinary** (pre-upload → attach to claim)
- Claim amount validation (cannot exceed policy coverage)
- Officer recommendation + Admin final decision
- **Complete claim status history** tracking

### ⏰ Scheduled Jobs
- **Daily auto-lapse cron job** (midnight): Scans active policies and marks overdue ones as `LAPSED`
  - 15-day grace for Monthly premiums
  - 30-day grace for all other frequencies

### 📊 Admin Dashboard
- Aggregated stats: total customers, active policies, pending claims, etc.

### 🧩 Other
- **Global exception handling** with structured error responses
- **Pagination & sorting** across all list endpoints
- **Input validation** (Jakarta Bean Validation)
- **Database indexing** for performance optimization
- **Swagger UI** with JWT bearer auth integration

---

## Project Structure

```
src/main/java/com/insurance/demo/
├── Application.java                 # Spring Boot entry point
├── config/
│   ├── CloudinaryConfig.java        # Cloudinary SDK setup
│   ├── DataInitializer.java         # Seeds default Admin & Officer
│   ├── RazorpayConfig.java          # Razorpay client bean
│   ├── SecurityConfig.java          # Security filter chain, CORS, JWT filter
│   └── SwaggerConfig.java           # OpenAPI 3.0 configuration
├── controller/
│   ├── AuthController.java          # Register, Login, OTP, Password Reset, Logout
│   ├── ClaimController.java         # Submit, Review, Recommend, Decide claims
│   ├── ClaimDocumentController.java # Upload & fetch claim documents
│   ├── ClaimHistoryController.java  # Claim status audit trail
│   ├── CustomerController.java      # Customer profile CRUD
│   ├── DashboardController.java     # Admin dashboard stats
│   ├── PaymentController.java       # Razorpay order + verification
│   ├── PolicyController.java        # Purchase, Issue, Cancel policies
│   ├── PolicyPlanController.java    # Plan CRUD + activate/deactivate
│   ├── ProductController.java       # Product CRUD + activate/deactivate
│   ├── UserController.java          # Admin user management
│   └── UserProfileController.java   # Logged-in user profile
├── dto/                             # 36 Request/Response DTOs
├── entity/                          # 11 JPA entities
├── enums/                           # 8 enums (Role, ClaimStatus, PolicyStatus, etc.)
├── exception/                       # 16 custom exceptions + GlobalExceptionHandler
├── repository/                      # 11 Spring Data JPA repositories
├── scheduler/
│   └── PolicyScheduler.java         # Cron job for auto-lapsing policies
├── security/
│   ├── CustomUserDetails.java       # UserDetails implementation
│   ├── CustomUserDetailsService.java
│   ├── JwtFilter.java               # OncePerRequestFilter for JWT
│   ├── JwtService.java              # Token generation & validation
│   └── TokenBlacklistService.java   # Redis-backed blacklist
├── service/                         # 16 service interfaces
├── serviceImpl/                     # 13 service implementations
└── util/
    ├── NumberGenerator.java         # Auto-generate policy/claim numbers
    └── PaginationValidator.java     # Validate sort fields & pagination
```

---

## Getting Started

### Prerequisites

- **Java 17** or higher
- **Maven 3.8+**
- **MySQL 8.x**
- **Redis** (for JWT blacklisting)
- Accounts for: **Razorpay**, **Cloudinary**, **Twilio** (optional, for SMS), **Gmail App Password** (for email OTP)

### 1. Clone the repository

```bash
git clone https://github.com/JaySingh9009/Insurance_application.git
cd Insurance_application
```

### 2. Create MySQL database

```sql
CREATE DATABASE insurance_db2;
```

### 3. Configure environment variables

Create a `.env` file or set the following system environment variables (see [Environment Variables](#environment-variables) section).

### 4. Build & Run

```bash
# Using Maven Wrapper
./mvnw spring-boot:run

# Or build the JAR
./mvnw clean package -DskipTests
java -jar target/insurance-policy-claim-0.0.1-SNAPSHOT.jar
```

The application starts on **`http://localhost:8080`** by default.

---

## Environment Variables

| Variable                | Description                           | Default                          |
|-------------------------|---------------------------------------|----------------------------------|
| `DB_URL`                | MySQL JDBC URL                        | `jdbc:mysql://localhost:3306/insurance_db2` |
| `DB_USERNAME`           | MySQL username                        | `root`                           |
| `DB_PASSWORD`           | MySQL password                        | *(empty)*                        |
| `SERVER_PORT`           | Application port                      | `8080`                           |
| `JWT_SECRET`            | HMAC secret key for JWT               | *(default dev key)*              |
| `JWT_EXPIRATION`        | Token expiry in milliseconds          | `86400000` (24 hours)            |
| `MAIL_USERNAME`         | Gmail address for sending OTPs        | —                                |
| `MAIL_PASSWORD`         | Gmail App Password                    | —                                |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                | —                                |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                    | —                                |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                 | —                                |
| `TWILIO_ACCOUNT_SID`   | Twilio Account SID                    | —                                |
| `TWILIO_AUTH_TOKEN`     | Twilio Auth Token                     | —                                |
| `TWILIO_FROM_PHONE`    | Twilio sender phone number            | —                                |
| `RAZORPAY_KEY_ID`      | Razorpay Key ID                       | —                                |
| `RAZORPAY_KEY_SECRET`  | Razorpay Key Secret                   | —                                |
| `REDIS_HOST`           | Redis server host                     | `localhost`                      |
| `REDIS_PORT`           | Redis server port                     | `6379`                           |

---

## Default Users

The application auto-seeds the following accounts on first startup:

| Role      | Email                | Password      | Status |
|-----------|----------------------|---------------|--------|
| **Admin** | `admin@gmail.com`    | `admin123`    | Active |
| **Officer** | `officer@gmail.com` | `officer123` | Active |

> **Note:** Customer accounts are created via the `/api/auth/register` endpoint with OTP verification.

---

## API Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint                | Description                          | Access  |
|--------|-------------------------|--------------------------------------|---------|
| POST   | `/register`             | Register new customer (sends OTP)    | Public  |
| POST   | `/verify-otp`           | Verify OTP to activate account       | Public  |
| POST   | `/login`                | Login and receive JWT token          | Public  |
| POST   | `/forgot-password`      | Send password reset OTP              | Public  |
| POST   | `/verify-reset-otp`     | Verify password reset OTP            | Public  |
| POST   | `/reset-password`       | Reset password with verified OTP     | Public  |
| POST   | `/logout`               | Logout (blacklists JWT in Redis)     | Auth    |

### 👤 User Management (`/api/admin/users`)
| Method | Endpoint                | Description                          | Access  |
|--------|-------------------------|--------------------------------------|---------|
| POST   | `/officers`             | Create new Insurance Officer         | Admin   |
| GET    | `/officers`             | List active officers                 | Admin   |
| GET    | `/officers-workload`    | Officers with active task count      | Admin   |
| GET    | `/`                     | List all users (paginated)           | Admin   |
| PATCH  | `/{id}/activate`        | Activate a user                      | Admin   |
| PATCH  | `/{id}/deactivate`      | Deactivate a user                    | Admin   |

### 🧑‍💼 Customer Profile (`/api/customers`)
| Method | Endpoint     | Description                             | Access         |
|--------|--------------|-----------------------------------------|----------------|
| POST   | `/profile`   | Create customer profile                 | Customer       |
| PUT    | `/profile`   | Update customer profile                 | Customer       |
| GET    | `/profile`   | Get my profile                          | Customer       |
| GET    | `/`          | Get all customers (paginated)           | Admin, Officer |

### 📦 Products (`/api/products`)
| Method | Endpoint              | Description                    | Access |
|--------|-----------------------|--------------------------------|--------|
| POST   | `/`                   | Create product                 | Admin  |
| PUT    | `/{id}`               | Update product                 | Admin  |
| GET    | `/`                   | List all products (paginated)  | Auth   |
| PATCH  | `/{id}/deactivate`    | Deactivate product             | Admin  |
| PATCH  | `/{id}/activate`      | Activate product               | Admin  |

### 📋 Policy Plans (`/api/plans`)
| Method | Endpoint              | Description                    | Access |
|--------|-----------------------|--------------------------------|--------|
| POST   | `/`                   | Create plan                    | Admin  |
| GET    | `/`                   | List all plans (paginated)     | Admin  |
| GET    | `/active`             | List active plans (paginated)  | Auth   |
| PATCH  | `/{id}/deactivate`    | Deactivate plan                | Admin  |
| PATCH  | `/{id}/activate`      | Activate plan                  | Admin  |

### 📄 Policies (`/api/policies`)
| Method | Endpoint             | Description                      | Access         |
|--------|----------------------|----------------------------------|----------------|
| POST   | `/purchase`          | Customer purchases a policy      | Customer       |
| POST   | `/issue`             | Officer issues policy to customer| Officer        |
| GET    | `/my`                | Get my policies (paginated)      | Customer       |
| GET    | `/`                  | Get all policies (paginated)     | Admin, Officer |
| PATCH  | `/{id}/cancel`       | Cancel a policy                  | Admin          |

### 💳 Payments (`/api/payments`)
| Method | Endpoint           | Description                         | Access         |
|--------|--------------------|-------------------------------------|----------------|
| POST   | `/create-order`    | Create Razorpay order               | Customer       |
| POST   | `/verify`          | Verify Razorpay payment signature   | Customer       |
| GET    | `/`                | Get all payments (paginated)        | Admin, Officer |
| GET    | `/my`              | Get my payments (paginated)         | Customer       |

### 📝 Claims (`/api/claims`)
| Method | Endpoint                  | Description                           | Access         |
|--------|---------------------------|---------------------------------------|----------------|
| POST   | `/`                       | Submit a new claim                    | Customer       |
| GET    | `/my`                     | Get my claims (paginated)             | Customer       |
| GET    | `/`                       | Get all claims (paginated)            | Admin, Officer |
| PATCH  | `/{id}/review`            | Move claim to UNDER_REVIEW            | Officer        |
| PATCH  | `/{id}/recommend`         | Recommend approval/rejection          | Officer        |
| PATCH  | `/{id}/decide`            | Final approve/reject decision         | Admin          |
| PATCH  | `/{id}/assign-officer`    | Assign officer to claim               | Admin          |

### 📎 Claim Documents (`/api/claim-documents`)
| Method | Endpoint           | Description                            | Access |
|--------|--------------------|----------------------------------------|--------|
| POST   | `/upload`          | Upload document to Cloudinary          | Auth   |
| GET    | `/{claimId}`       | Get all documents for a claim          | Auth   |

### 📜 Claim History (`/api/claim-history`)
| Method | Endpoint           | Description                            | Access |
|--------|--------------------|----------------------------------------|--------|
| GET    | `/{claimId}`       | Get claim status audit trail           | Auth   |

### 📊 Dashboard (`/api/dashboard`)
| Method | Endpoint     | Description                   | Access |
|--------|--------------|-------------------------------|--------|
| GET    | `/admin`     | Admin dashboard statistics    | Admin  |

### 👤 User Profile (`/api/users`)
| Method | Endpoint     | Description                       | Access |
|--------|--------------|-----------------------------------|--------|
| GET    | `/profile`   | Get current logged-in user info   | Auth   |

---

## Role-Based Access Matrix

| Feature                    | Admin | Officer | Customer |
|----------------------------|:-----:|:-------:|:--------:|
| Create Products & Plans    |  ✅   |   ❌    |    ❌    |
| Manage Users               |  ✅   |   ❌    |    ❌    |
| View All Policies/Claims   |  ✅   |   ✅    |    ❌    |
| Issue Policy to Customer   |  ❌   |   ✅    |    ❌    |
| Review & Recommend Claims  |  ❌   |   ✅    |    ❌    |
| Final Claim Decision       |  ✅   |   ❌    |    ❌    |
| Assign Officer to Claim    |  ✅   |   ❌    |    ❌    |
| Cancel Policy              |  ✅   |   ❌    |    ❌    |
| Purchase Policy            |  ❌   |   ❌    |    ✅    |
| Make Payments              |  ❌   |   ❌    |    ✅    |
| Submit Claims              |  ❌   |   ❌    |    ✅    |
| View Own Policies/Claims   |  ❌   |   ❌    |    ✅    |
| Dashboard Statistics       |  ✅   |   ❌    |    ❌    |

---

## Claim Workflow

```
Customer submits claim
        │
        ▼
   ┌──────────┐    Admin assigns    ┌──────────────┐
   │ SUBMITTED │ ──────────────────▶│  (Assigned to │
   └──────────┘    officer          │   Officer)    │
        │                           └──────┬───────┘
        │                                  │
        ▼                                  ▼
   ┌──────────────┐              Officer reviews
   │ UNDER_REVIEW │ ◀───────────────────────┘
   └──────────────┘
        │
        ▼ Officer recommends
   ┌─────────────────────────┐
   │ RECOMMENDED_APPROVAL    │
   │         or              │
   │ RECOMMENDED_REJECTION   │
   └─────────────────────────┘
        │
        ▼ Admin decides
   ┌──────────┐    ┌──────────┐
   │ APPROVED │    │ REJECTED │
   └──────────┘    └──────────┘
```

Each transition is recorded in the **Claim Status History** with timestamp, actor, and remarks.

---

## Policy Lifecycle

```
     ┌─────────────────┐
     │ PENDING_PAYMENT  │ ← Policy created (awaiting first premium)
     └────────┬────────┘
              │ Payment verified (Razorpay)
              ▼
     ┌─────────────────┐
     │     ACTIVE       │ ← Premiums up-to-date
     └────────┬────────┘
              │
    ┌─────────┼───────────┐
    │         │           │
    ▼         ▼           ▼
┌────────┐ ┌───────┐ ┌─────────┐
│EXPIRED │ │LAPSED │ │CANCELLED│
└────────┘ └───────┘ └─────────┘
  (end date   (missed    (admin
   reached)   payment    cancels)
              + grace)
```

---

## Swagger / API Docs

Once the application is running, access the interactive API documentation:

| Resource        | URL                                      |
|-----------------|------------------------------------------|
| **Swagger UI**  | `http://localhost:8080/swagger-ui.html`   |
| **OpenAPI JSON**| `http://localhost:8080/v3/api-docs`       |

> 🔑 Click **Authorize** in Swagger UI and paste your JWT token (obtained from `/api/auth/login`) to test protected endpoints.

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/JaySingh9009">JaySingh9009</a>
</p>
