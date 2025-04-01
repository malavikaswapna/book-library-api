export const getTokenData = jest.fn().mockReturnValue({
  id: 1,
  username: 'testuser',
  role: 'user'  
});

export const getUserRole = jest.fn().mockReturnValue('user');

export const checkUserRole = jest.fn().mockImplementation((role) => {
  return role === 'user' || role === 'admin';
});