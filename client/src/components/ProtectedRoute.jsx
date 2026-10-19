import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ModuleLocked from './ui/ModuleLocked';

/**
 * ProtectedRoute:
 *  - roles: restrict to specific roles
 *  - capability: restrict to a workflow capability
 *  - module: restrict based on developer module licensing (e.g. 'subsystem')
 */
const ProtectedRoute = ({ children, roles, capability, module: moduleProp }) => {
  const { user, loading, can, isModuleLicensed } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brass-400" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Module licensing gate: dev role always bypasses
  if (moduleProp && user.role !== 'dev' && !isModuleLicensed(moduleProp)) {
    return <ModuleLocked />;
  }

  if (capability && !can(capability)) {
    return <Navigate to="/" replace />;
  }

  if (roles && !capability && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

