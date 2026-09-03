import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ProtectedRoute from "./components/layout/ProtectedRoute";

import AdminDashboard from "./pages/admin/AdminDashboard";
import Policies from "./pages/admin/Policies";
import Claims from "./pages/admin/Claims";
import Payments from "./pages/admin/Payments";
import Products from "./pages/admin/Products";
import Plans from "./pages/admin/Plans";
import Users from "./pages/admin/Users";
import AdminCustomers from "./pages/admin/AdminCustomers";

import OfficerDashboard from "./pages/officer/OfficerDashboard";
import OfficerClaims from "./pages/officer/OfficerClaims";
import OfficerPolicies from "./pages/officer/OfficerPolicies";
import OfficerCustomers from "./pages/officer/OfficerCustomers";
import OfficerPayments from "./pages/officer/OfficerPayments";
import OfficerProfile from "./pages/officer/OfficerProfile";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import MyPolicies from "./pages/customer/MyPolicies";
import MyClaims from "./pages/customer/MyClaims";
import MyPayments from "./pages/customer/MyPayments";
import BrowsePlans from "./pages/customer/BrowsePlans";
import Profile from "./pages/customer/Profile";

import "./styles/App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminCustomers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/policies"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Policies />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/claims"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Claims />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/plans"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Plans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Users />
            </ProtectedRoute>
          }
        />

        {/* Officer Routes */}
        <Route
          path="/officer"
          element={
            <ProtectedRoute allowedRoles={["OFFICER"]}>
              <OfficerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/claims"
          element={
            <ProtectedRoute allowedRoles={["OFFICER"]}>
              <OfficerClaims />
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/policies"
          element={
            <ProtectedRoute allowedRoles={["OFFICER"]}>
              <OfficerPolicies />
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/customers"
          element={
            <ProtectedRoute allowedRoles={["OFFICER"]}>
              <OfficerCustomers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/payments"
          element={
            <ProtectedRoute allowedRoles={["OFFICER"]}>
              <OfficerPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/profile"
          element={
            <ProtectedRoute allowedRoles={["OFFICER"]}>
              <OfficerProfile />
            </ProtectedRoute>
          }
        />

        {/* Customer Routes */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/policies"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <MyPolicies />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/claims"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <MyClaims />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/payments"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <MyPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/plans"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <BrowsePlans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/profile"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Catch-all: Redirect any unknown / 404 URL directly to /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
