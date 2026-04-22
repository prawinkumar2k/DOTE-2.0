import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ role }) => {
  const raw = localStorage.getItem('user');
  if (!raw) return <Navigate to="/login" replace />;

  let user;
  try { user = JSON.parse(raw); } catch { return <Navigate to="/login" replace />; }

  if (role && user.role !== role) return <Navigate to={`/${user.role}/dashboard`} replace />;

  return <Outlet />;
};

export default ProtectedRoute;
