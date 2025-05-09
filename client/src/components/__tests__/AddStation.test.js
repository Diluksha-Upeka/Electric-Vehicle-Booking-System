import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddStation from '../AddStation';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '123', name: 'Admin User', role: 'admin' },
    isAuthenticated: true
  })
}));

// Mock the API calls
jest.mock('../../services/api', () => ({
  createStation: jest.fn(),
  uploadImage: jest.fn()
}));

// Mock the Google Maps component
jest.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }) => <div data-testid="google-map">{children}</div>,
  Marker: () => <div data-testid="marker" />,
  useJsApiLoader: () => ({
    isLoaded: true,
    loadError: null
  })
}));

const renderAddStation = (props = {}) => {
  const defaultProps = {
    onClose: jest.fn(),
    ...props
  };

  return render(
    <AuthProvider>
      <AddStation {...defaultProps} />
    </AuthProvider>
  );
};

describe('AddStation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with all required fields', () => {
    renderAddStation();
    
    expect(screen.getByLabelText(/station name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/operating hours/i)).toBeInTheDocument();
    expect(screen.getByText(/add charging point/i)).toBeInTheDocument();
  });

  it('allows adding charging points', () => {
    renderAddStation();
    
    const addButton = screen.getByText(/add charging point/i);
    fireEvent.click(addButton);
    
    expect(screen.getByLabelText(/charging point type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/power rating/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderAddStation();
    
    const submitButton = screen.getByRole('button', { name: /add station/i });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/address is required/i)).toBeInTheDocument();
  });

  it('handles successful station creation', async () => {
    const mockOnClose = jest.fn();
    const mockCreateStation = require('../../services/api').createStation;
    mockCreateStation.mockResolvedValueOnce({ data: { _id: '123' } });
    
    renderAddStation({ onClose: mockOnClose });
    
    // Fill in required fields
    await userEvent.type(screen.getByLabelText(/station name/i), 'Test Station');
    await userEvent.type(screen.getByLabelText(/address/i), '123 Test St');
    
    // Add a charging point
    fireEvent.click(screen.getByText(/add charging point/i));
    await userEvent.type(screen.getByLabelText(/charging point type/i), 'Type 2');
    await userEvent.type(screen.getByLabelText(/power rating/i), '22');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /add station/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateStation).toHaveBeenCalled();
    });
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles image upload', async () => {
    const mockUploadImage = require('../../services/api').uploadImage;
    mockUploadImage.mockResolvedValueOnce({ url: 'https://example.com/image.jpg' });
    
    renderAddStation();
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/station image/i);
    
    await userEvent.upload(input, file);
    
    await waitFor(() => {
      expect(mockUploadImage).toHaveBeenCalledWith(file);
    });
  });

  it('handles form submission errors', async () => {
    const mockCreateStation = require('../../services/api').createStation;
    mockCreateStation.mockRejectedValueOnce(new Error('Failed to create station'));
    
    renderAddStation();
    
    // Fill in required fields
    await userEvent.type(screen.getByLabelText(/station name/i), 'Test Station');
    await userEvent.type(screen.getByLabelText(/address/i), '123 Test St');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /add station/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to create station/i)).toBeInTheDocument();
    });
  });
}); 