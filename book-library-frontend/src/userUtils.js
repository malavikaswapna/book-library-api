export const getTokenData = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {

    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));

    return payload;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export const getUserRole = () => {
  const tokenData = getTokenData();
  return tokenData?.role || 'user';
};

export const checkUserRole = (requiredRole) => {
  const userRole = getUserRole();
  return userRole === requiredRole || userRole === 'admin';
}