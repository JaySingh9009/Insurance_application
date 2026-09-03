# 🛡️ Insurance Policy & Claim Management System — Frontend

## 🌟 Key Features

### 🔐 Authentication & Security
* **JWT-Based Authentication**: Secure login, registration, and session state management.
* **OTP Verification**: Multi-channel (Email / SMS) OTP validation during account registration and password resets.
* **Role-Based Access Control (RBAC)**: Route protection and dynamic sidebar navigation tailored specifically for `ADMIN`, `OFFICER`, and `CUSTOMER` roles.
* **Automatic Token Injection & Handling**: Axios interceptors automatically attach JWT `Bearer` tokens to protected requests and handle session expiration (`401 Unauthorized`).
* **Blacklist Token Logout**: Notifies the Spring Boot backend to invalidate JWT tokens in Redis upon user logout.

---

### 👤 Customer Portal
* **Browse Insurance Plans**: Search and compare insurance products and specialized coverage plans.
* **Policy Management**: View active policies, coverage details, premium schedules, and status tracking.
* **Claims Management**: File new insurance claims, attach claim details, and monitor approval workflows in real time.
* **Payment History & Gateways**: Track premium payments, transaction IDs, and seamlessly integrate with payment gateways like Razorpay.
* **Profile Management**: View and update contact details and personal profile settings.

---

### 🛡️ Officer (Agent) Portal
* **Officer Dashboard**: Overview of assigned claims, pending approvals, and active customer policies.
* **Claims Processing**: Review submitted customer claims, verify documentation, and approve or reject claims with comments.
* **Customer Directory**: Access customer records, policy details, and claim histories.
* **Payment Tracking**: Monitor incoming customer premium payments and transaction logs.

---

### 👑 Admin Portal
* **Comprehensive Executive Dashboard**: Real-time platform metrics, total revenue, claim statistics, and user counts.
* **Product & Plan Management**: Create, update, toggle, or delete insurance products and coverage plans.
* **User Management**: Manage system users, assign roles (`ADMIN`, `OFFICER`, `CUSTOMER`), and handle user activations/deactivations.
* **System-Wide Oversight**: Full visibility into all policies, claims, and payment records across the enterprise.

---

## 🏗️ Tech Stack & Architecture

* **Frontend Library**: [React 19](https://react.dev/)
* **Build Tool & Dev Server**: [Vite 8](https://vitejs.dev/)
* **Routing**: [React Router v7](https://reactrouter.com/)
* **HTTP Client**: [Axios](https://axios-http.com/)
* **Icons & Styling**: Custom Responsive CSS Design Tokens with Theme Support & Glassmorphism.
* **Linting & Quality**: ESLint v10 with React Hooks & React Refresh rules.

---

## 📁 Project Directory Structure

```text
frontend/
├── public/                  # Static public assets
├── src/
│   ├── api/                 # API client & endpoint modules
│   │   ├── axiosInstance.js # Centralized Axios instance with interceptors
│   │   ├── authApi.js       # Login, Register, OTP, Logout APIs
│   │   ├── claimApi.js      # Claims management endpoints
│   │   ├── customerApi.js   # Customer profile & policy APIs
│   │   ├── paymentApi.js    # Payment & Razorpay integration APIs
│   │   ├── planApi.js       # Policy plans APIs
│   │   ├── policyApi.js     # User policies APIs
│   │   ├── productApi.js    # Insurance products APIs
│   │   └── userApi.js       # Admin user management APIs
│   ├── components/          # Reusable UI components & layouts
│   │   ├── layout/          # Navbar, Sidebar, ProtectedRoute, Shell
│   │   └── ui/              # Modal, Cards, Buttons, Tables, Badges
│   ├── context/             # Global React State (AuthContext, ThemeContext)
│   ├── hooks/               # Custom React hooks (useAuth, useTheme, etc.)
│   ├── pages/               # Page components grouped by domain/role
│   │   ├── admin/           # Admin Dashboard, Products, Plans, Users, Claims
│   │   ├── auth/            # Login, Register, ForgotPassword pages
│   │   ├── customer/        # Customer Dashboard, BrowsePlans, MyClaims, MyPolicies
│   │   └── officer/         # Officer Dashboard, Claims Processing, Customers
│   ├── styles/              # Global CSS, App styles, design system tokens
│   ├── utils/               # Helper functions & formatters
│   ├── App.jsx              # Main App routing & ProtectedRoutes definition
│   └── main.jsx             # React entrypoint
├── index.html               # Main HTML entry file
├── package.json             # Dependencies and scripts
└── vite.config.js           # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites

* **Node.js**: `v18.x` or higher
* **npm**: `v9.x` or higher
* **Backend Service**: Ensure the Spring Boot backend service is running locally on `http://localhost:8080`.

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/insurance-claim-management-frontend.git
   cd insurance-claim-management-frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The application will be running at `http://localhost:5173`.

---

## 📜 Available NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches the Vite local development server with HMR (Hot Module Replacement). |
| `npm run build` | Compiles and builds production-ready bundle into the `dist/` directory. |
| `npm run preview` | Previews the production build locally. |
| `npm run lint` | Runs ESLint to check for code quality and formatting issues. |

---

## 🔗 Backend API Integration

The frontend connects to the Spring Boot REST API server. The API base URL is configured in [`src/api/axiosInstance.js`](file:///c:/Users/singh/Desktop/Insurance_claim_management_final/frontend/src/api/axiosInstance.js):

```javascript
const api = axios.create({
  baseURL: "http://localhost:8080",
});
```

* **Authentication Interceptor**: Automatically attaches `Authorization: Bearer <token>` from `localStorage` to all HTTP requests.
* **401 Response Interceptor**: Clears stored tokens and redirects to `/login` when token expires or becomes invalid.

