# Insurance Policy & Claim Management System

A production-grade Spring Boot 3.x RESTful backend for managing insurance policies, premium payments, and claims with role-based access control.

## Tech Stack
- **Spring Boot 3.3.5** · Spring Security 6 · Spring Data JPA
- **JWT** (jjwt 0.12.6) · MySQL · Lombok · Springdoc OpenAPI 2.8.8
- **Java 17** (required)

## ⚠️ Important: Java Version
Spring Boot 3.x requires **Java 17+**. If your `JAVA_HOME` still points to JDK 8, set it before running Maven:

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
.\mvnw.cmd spring-boot:run
```

Or set it permanently in Windows environment variables.

## Quick Start

### 1. Create MySQL Database
```sql
CREATE DATABASE insurance_db1;
```

### 2. Configure credentials
Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/insurance_db1
spring.datasource.username=root
spring.datasource.password=<your-password>
```

### 3. Run the application
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
.\mvnw.cmd spring-boot:run
```

### 4. Access Swagger UI
Open: http://localhost:8080/swagger-ui.html

## Default Seeded Users (on first start)
| Role  | Email             | Password   |
|-------|-------------------|------------|
| ADMIN | admin@gmail.com   | admin123   |
| AGENT | agent@gmail.com   | agent123   |

## API Overview

### Authentication (Public)
| Method | Endpoint            | Description          |
|--------|---------------------|----------------------|
| POST   | /api/auth/register  | Register as customer |
| POST   | /api/auth/login     | Login, get JWT token |

### Policies
| Method | Endpoint                  | Access         |
|--------|---------------------------|----------------|
| POST   | /api/policies/purchase    | Customer       |
| POST   | /api/policies/issue       | Admin/Agent    |
| GET    | /api/policies/my          | Customer       |
| GET    | /api/policies             | Admin/Agent    |
| PATCH  | /api/policies/{id}/cancel | All (own only) |

### Claims
| Method | Endpoint                    | Access   |
|--------|-----------------------------|----------|
| POST   | /api/claims                 | Customer |
| PATCH  | /api/claims/{id}/review     | Agent    |
| PATCH  | /api/claims/{id}/recommend  | Agent    |
| PATCH  | /api/claims/{id}/decision   | Admin    |
| GET    | /api/claims/my              | Customer |
| GET    | /api/claims                 | Admin/Agent |
| GET    | /api/claims/{id}/history    | All      |

## Claim Status Transitions (Strictly Enforced)
```
SUBMITTED → UNDER_REVIEW           (Agent)
UNDER_REVIEW → RECOMMENDED_APPROVAL  (Agent)
UNDER_REVIEW → RECOMMENDED_REJECTION (Agent)
RECOMMENDED_APPROVAL → APPROVED    (Admin)
RECOMMENDED_APPROVAL → REJECTED    (Admin)
RECOMMENDED_REJECTION → APPROVED   (Admin)
RECOMMENDED_REJECTION → REJECTED   (Admin)
```
APPROVED and REJECTED are **terminal** — no further changes allowed.

## Pagination
All list endpoints support:
```
?page=0&size=10&sortBy=createdAt&sortDir=desc
```
- Max page size: 100
- Default page: 0, default size: 10
