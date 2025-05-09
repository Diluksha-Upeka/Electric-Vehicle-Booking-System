import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../Navbar';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    logout: jest.fn(),
    isAuthenticated: false
  })
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Navbar Component', () => {
  it('renders without crashing', () => {
    renderWithRouter(<Navbar />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('shows login/register links when user is not authenticated', () => {
    renderWithRouter(<Navbar />);
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.getByText(/register/i)).toBeInTheDocument();
  });

  it('shows user menu when user is authenticated', () => {
    // Mock authenticated user
    jest.spyOn(require('../../contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
      user: { name: 'Test User', role: 'user' },
      logout: jest.fn(),
      isAuthenticated: true
    }));

    renderWithRouter(<Navbar />);
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });

  it('shows admin menu items for admin users', () => {
    // Mock admin user
    jest.spyOn(require('../../contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
      user: { name: 'Admin User', role: 'admin' },
      logout: jest.fn(),
      isAuthenticated: true
    }));

    renderWithRouter(<Navbar />);
    expect(screen.getByText(/Admin User/i)).toBeInTheDocument();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  it('handles logout correctly', () => {
    const mockLogout = jest.fn();
    jest.spyOn(require('../../contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
      user: { name: 'Test User' },
      logout: mockLogout,
      isAuthenticated: true
    }));

    renderWithRouter(<Navbar />);
    const logoutButton = screen.getByText(/logout/i);
    fireEvent.click(logoutButton);
    expect(mockLogout).toHaveBeenCalled();
  });
}); 