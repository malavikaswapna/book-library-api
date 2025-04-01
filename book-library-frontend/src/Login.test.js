import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import axios from 'axios';

jest.mock('axios');
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate  
}));

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

delete window.location;
window.location = { href: jest.fn() };

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear.mockImplementation(() => {});
    window.alert = jest.fn();  
  });
  
  test('renders login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter> 
    );
    
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('submits credentials and navigates on successful login', async () => {
    axios.post.mockResolvedValue({
      data: {
        token: 'fake-token',
        user: { id: 1, username: 'testuser' }  
      }  
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    userEvent.type(screen.getByPlaceholderText('Username'), 'testuser');
    userEvent.type(screen.getByPlaceholderText('Password'), 'password123');

    userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic ')  
          })  
        })  
      );  
    });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'fake-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('username', 'testuser');  
    });
  });

  test('displays error on failed login', async () => {
    axios.post.mockRejectedValue({
      response: { status: 401 }  
    });
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    userEvent.type(screen.getByPlaceholderText('Username'), 'wronguser');
    userEvent.type(screen.getByPlaceholderText('Password'), 'wrongpass');

    userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();  
    });
  });
});