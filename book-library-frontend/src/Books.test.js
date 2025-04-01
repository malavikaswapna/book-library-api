import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { act } from 'react';
import Books from './Books';
import axios from 'axios';

//Mock axios
jest.mock('axios');

jest.mock('./userUtils', () => ({
  getUserRole: jest.fn().mockReturnValue('user'),
  getTokenData: jest.fn().mockReturnValue({
    id: 1,
    username: 'testuser',
    role: 'user'
  }),
  checkUserRole: jest.fn().mockReturnValue(true)
}));

//Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Books Component', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'token') return 'fake-token';
        if (key === 'username') return 'testuser';
        return null;  
      });
      
      window.alert = jest.fn();

      axios.get.mockImplementation(() => {
        return Promise.resolve({
          status: 200,
          headers: { etag: 'W/"test-etag"' },
          data: { books: [], total_pages: 0, total_items: 0, _links: {} }
        });
      });
    });

    test('renders loading state initially', async () => {
      axios.get.mockImplementation(() => {
        return new Promise((reslove) => {
          setTimeout(() => {
             resolve({
               status: 200,
               headers: { etag: 'W/"test-etag"' },
               data: { books: [], total_pages: 0, total_items: 0, _links: {} } 
             });
          }, 1000);
        });
      });
      
    await act(async () => {
      render(
        <BrowserRouter>
          <Books />
        </BrowserRouter>  
      );
    });

      expect(screen.getByText('Loading books...')).toBeInTheDocument();
    });

    test('displays books when data is loaded', async () => {
      //Mock Data
      const mockBooks = [
        { 
           id: 1, 
           title: 'Test Book 1', 
           author: 'Author 1', 
           published_year: 2021,
           book_picture: 'https://i.imgur.com/1yjr3zv.jpeg',
           book_description: 'This is a test book desciption',
           average_rating: 4.5,
           genre: 'Fiction', 
           _links: {
              self: { href: '/book/1' },
              reviews: { href: '/book/1/reviews' }
           }
        },

        { 
           id: 2, 
           title: 'Test Book 2', 
           author: 'Author 2', 
           published_year: 2022, 
           book_picture: 'https://i.imgur.com/1yjr3zv.jpeg',
           book_description: 'Another test book desciption',
           average_rating: 3.8,
           genre: 'Non-Fiction', 
           _links: {
              self: { href: '/book/2' },
              reviews: { href: '/book/2/reviews' }
           }
        } 
      ];
      axios.get.mockClear();
      
      axios.get.mockImplementation((url) => {
        console.log("Mock axios GET called with:", url );
        return Promise.resolve({
          status: 200,
          headers: { etag: 'W/"test-etag"' },
          data: {
              books: mockBooks,
              total_pages: 1,
              total_items: 2,
              _links: {}  
        }
      });   
    });
    
      render(
        <BrowserRouter>
          <Books />
        </BrowserRouter>  
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading books...')).not.toBeInTheDocument();  
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(screen.getByText('Test Book 1')).toBeInTheDocument();
        expect(screen.getByText('Test Book 2')).toBeInTheDocument();  
      }, { timeout: 3000 });

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token'  
          })  
        })  
      );
    });

    test('displays "No books available" when no books are returned', async () => {
      axios.get.mockResolvedValue({
        data: { books: [], total_pages: 0, total_items: 0, _links: {} }  
      });
    
      render(
       <BrowserRouter>
         <Books />
       </BrowserRouter>   
      );

      await waitFor(() => {
        expect(screen.getByText('No books available.')).toBeInTheDocument();  
      });
    });

    test('filters can be shown and hidden', async () => {
      axios.get.mockResolvedValue({
        data: { books: [], total_pages: 0, total_items: 0, _links: {} }  
      });
      
      render(
       <BrowserRouter>
         <Books />
       </BrowserRouter>   
      );

      await waitFor(() => {
        expect(screen.queryByText('Filter by title...')).not.toBeInTheDocument();  
      });

      userEvent.click(screen.getByText('Show Filters'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Filter by title...')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Filter by author...')).toBeInTheDocument();  
      });

      userEvent.click(screen.getByText('Hide Filters'));

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Filter by title')).not.toBeInTheDocument();  
      });
    });

    test('applying filters calls API with filter parameters', async () => {
      axios.get.mockImplementation(() => {
        return Promise.resolve({
          status: 200,
          headers: { etag: 'W/"test-etag"'},
          data: { books: [], total_pages: 0, total_items: 0, _links: {} } 
        }); 
      });
      
      render(
       <BrowserRouter>
         <Books />
       </BrowserRouter>  
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading books...')).not.toBeInTheDocument();  
      }, { timeout: 3000 });

      axios.get.mockClear();

      axios.get.mockImplementation(() => {
        return Promise.resolve({
          status: 200,
          headers: { etag: 'W/"test-etag"' },
          data: { books: [], total_pages: 0, total_items: 0, _links: {} }  
        });  
      });

      fireEvent.click(screen.getByText('Show Filters'));

      await waitFor(() => {
        expect(screen.getByText('Apply Filters')).toBeInTheDocument(); 
      });

      fireEvent.change(screen.getByPlaceholderText('Filter by author...'), {
        target: { value: 'Tolkien', name: 'author'}
      });

      fireEvent.click(screen.getByText('Apply Filters'));

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('author=Tolkien'),
          expect.any(Object)  
        );  
      });
    });
});