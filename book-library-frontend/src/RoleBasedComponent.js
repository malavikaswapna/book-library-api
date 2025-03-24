import React from 'react';
import { checkUserRole } from './userUtils';

const RoleBasedComponent = ({ requiredRole, children }) => {
  if (checkUserRole(requiredRole)) {
    return <>{children}</>;
  }
  return null;
};

export default RoleBasedComponent;