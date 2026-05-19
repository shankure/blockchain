import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuditLedger from './pages/AuditLedger';
import Dashboard from './pages/Dashboard';
import Evidence from './pages/Evidence';
import Login from './pages/Login';

// ProtectedRoute redirects to login if user is not authenticated
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          <Route path="/evidence/:caseId" element={
            <ProtectedRoute><Evidence /></ProtectedRoute>
          } />

          <Route path="/audit" element={
            <ProtectedRoute><AuditLedger /></ProtectedRoute>
          } />

          {/* Catch-all → redirect to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
