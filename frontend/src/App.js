import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import TicketDetail from './pages/TicketDetail';
import CreateTicket from './pages/CreateTicket';
import Users from './pages/Users';
import Categories from './pages/Categories';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Templates from './pages/Templates';
import KnowledgeBase from './pages/KnowledgeBase';
import Assets from './pages/Assets';
import AdvancedReports from './pages/AdvancedReports';
import WebSocketTest from './pages/WebSocketTest';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Admin Route component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Technician Route component
const TechnicianRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user || (user.role !== 'technician' && user.role !== 'admin')) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="tickets/new" element={<CreateTicket />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="websocket-test" element={<WebSocketTest />} />
        
        {/* Technician and Admin routes */}
        <Route 
          path="users" 
          element={
            <TechnicianRoute>
              <Users />
            </TechnicianRoute>
          } 
        />
        <Route 
          path="reports" 
          element={
            <TechnicianRoute>
              <Reports />
            </TechnicianRoute>
          } 
        />
        <Route 
          path="advanced-reports" 
          element={
            <TechnicianRoute>
              <AdvancedReports />
            </TechnicianRoute>
          } 
        />
        <Route 
          path="templates" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'technician']}>
              <Templates />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="knowledge-base" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'technician', 'user']}>
              <KnowledgeBase />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="assets" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'technician']}>
              <Assets />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin only routes */}
        <Route 
          path="categories" 
          element={
            <AdminRoute>
              <Categories />
            </AdminRoute>
          } 
        />
        <Route 
          path="settings" 
          element={
            <AdminRoute>
              <Settings />
            </AdminRoute>
          } 
        />
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
