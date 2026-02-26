import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";

// User Pages
import UserLogin from './pages/User/UserLogin';
import UserRegistration from './pages/User/UserRegistration';
import UserDashboard from './pages/User/UserDashboard';
import QuizForm from './pages/User/QuizForm';

// HR Pages
import HRLogin from "./pages/Admin/HRLogin";
import HRDashboard from "./pages/Admin/HRDashboard";
import HRHome from "./pages/Admin/HRHome";
import ExamList from "./pages/Admin/ExamList";
import ExamBuilder from "./pages/Admin/ExamBuilder";
import Round from "./pages/Admin/Round";
import DriveManager from "./pages/Admin/DriveManager";
import HRLayout from "./layout/HRLayout";

// Admin
import AdminPanel from "./pages/Admin/AdminPanel";
import SchedulePage from "./pages/Admin/SchedulePage";

// Utility Components
import LocationGate from "./components/Admin/LocationGate";

// Redirect Component to preserve query params
function RedirectWithParams({ to }) {
  const searchParams = window.location.search;
  return <Navigate to={`${to}${searchParams}`} replace />;
}

// Protected Route Component
function ProtectedRoute({ children, requiredUserType }) {
  const authToken = localStorage.getItem("authToken");
  const userType = localStorage.getItem("userType");

  if (!authToken) {
    // Redirect to appropriate login based on required user type
    if (requiredUserType === "hr") {
      return <Navigate to="/hr-login" replace />;
    }
    return <Navigate to="/user-login" replace />;
  }

  if (requiredUserType && userType !== requiredUserType) {
    // Redirect to appropriate login based on required user type
    if (requiredUserType === "hr") {
      return <Navigate to="/hr-login" replace />;
    }
    return <Navigate to="/user-login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        {/* =========================================== 
            User Routes 
            =========================================== */}
        {/* Public Routes - Protected by Location */}
        <Route path="/" element={<RedirectWithParams to="/user-login" />} />
        {/* <Route
          path="/user-login"
          element={
            <LocationGate>
              <UserLogin />
            </LocationGate>
          }
        /> */}
        <Route path="/user-login" element={<UserLogin />} />
        <Route path="/user-register" element={<UserRegistration />} />
        {/* Protected User Routes */}
        <Route
          path="/user-dashboard"
          element={
            <ProtectedRoute requiredUserType="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute requiredUserType="user">
              <QuizForm />
            </ProtectedRoute>
          }
        />
 
        {/* Protected HR Routes */}
        <Route path="/hr-login" element={<HRLogin />} />
        <Route
          path="/hr-home"
          element={
            <ProtectedRoute requiredUserType="hr">
              <HRLayout>
                <HRHome />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/candidate-dashboard"
          element={
            <ProtectedRoute requiredUserType="hr">
              <HRLayout>
                <HRDashboard />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/exam"
          element={
            <ProtectedRoute requiredUserType="hr">
              <HRLayout>
                <ExamList />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/exams/create"
          element={
            <ProtectedRoute requiredUserType="hr">
              <HRLayout>
                <ExamBuilder />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/rounds"
          element={
            <ProtectedRoute requiredUserType="hr">
              <HRLayout>
                <Round />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/drives"
          element={
            <ProtectedRoute requiredUserType="hr">
              <HRLayout>
                <DriveManager />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-settings"
          element={
            <ProtectedRoute requiredUserType="hr">
              <HRLayout>
                <AdminPanel />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/schedule"
          element={
            <ProtectedRoute requiredUserType="hr">
              <HRLayout>
                <SchedulePage />
              </HRLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/hr/exams/:id/builder"
          element={
            <ProtectedRoute requiredUserType="hr">
              <HRLayout>
                <ExamBuilder />
              </HRLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/user-login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
