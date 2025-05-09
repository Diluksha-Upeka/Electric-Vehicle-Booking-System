import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import App from '../../App';

// Mock the API calls
jest.mock('../../services/api', () => ({
  getStations: jest.fn(),
  createStation: jest.fn(),
  updateStation: jest.fn(),
  deleteStation: jest.fn(),
  uploadImage: jest.fn()
}));

// Mock the auth context with admin user
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '123', name: 'Admin User', role: 'admin' },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn()
  })
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

const mockStations = [
  {
    _id: 'station1',
    name: 'Test Station 1',
    address: '123 Test St',
    location: {
      type: 'Point',
      coordinates: [0, 0]
    },
    chargingPoints: [
      {
        type: 'Type 2',
        power: 22,
        status: 'available'
      }
    ],
    operatingHours: {
      open: '08:00',
      close: '20:00'
    }
  }
];

describe('Station Management Integration', () => {
  beforeEach(() => {
    // Setup API mocks
    const api = require('../../services/api');
    api.getStations.mockResolvedValue({ data: mockStations });
    api.createStation.mockResolvedValue({ data: { _id: 'newStation' } });
    api.updateStation.mockResolvedValue({ data: { ...mockStations[0], name: 'Updated Station' } });
    api.deleteStation.mockResolvedValue({ data: { success: true } });
    api.uploadImage.mockResolvedValue({ url: 'https://example.com/image.jpg' });
  });

  it('completes full station creation flow', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );

    // Navigate to admin dashboard
    const dashboardLink = screen.getByText(/dashboard/i);
    fireEvent.click(dashboardLink);

    // Wait for stations to load
    await waitFor(() => {
      expect(screen.getByText('Test Station 1')).toBeInTheDocument();
    });

    // Click add station button
    const addButton = screen.getByText(/add station/i);
    fireEvent.click(addButton);

    // Fill in station details
    await userEvent.type(screen.getByLabelText(/station name/i), 'New Station');
    await userEvent.type(screen.getByLabelText(/address/i), '456 New St');

    // Add charging point
    const addChargingPointButton = screen.getByText(/add charging point/i);
    fireEvent.click(addChargingPointButton);
    await userEvent.type(screen.getByLabelText(/charging point type/i), 'Type 2');
    await userEvent.type(screen.getByLabelText(/power rating/i), '22');

    // Upload image
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const imageInput = screen.getByLabelText(/station image/i);
    await userEvent.upload(imageInput, file);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /add station/i });
    fireEvent.click(submitButton);

    // Verify station was created
    await waitFor(() => {
      expect(require('../../services/api').createStation).toHaveBeenCalled();
    });

    // Verify new station appears in list
    await waitFor(() => {
      expect(screen.getByText('New Station')).toBeInTheDocument();
    });
  });

  it('completes station update flow', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );

    // Navigate to admin dashboard
    const dashboardLink = screen.getByText(/dashboard/i);
    fireEvent.click(dashboardLink);

    // Wait for stations to load
    await waitFor(() => {
      expect(screen.getByText('Test Station 1')).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    // Update station name
    const nameInput = screen.getByLabelText(/station name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Station');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /update/i });
    fireEvent.click(submitButton);

    // Verify station was updated
    await waitFor(() => {
      expect(require('../../services/api').updateStation).toHaveBeenCalled();
    });

    // Verify updated name appears
    await waitFor(() => {
      expect(screen.getByText('Updated Station')).toBeInTheDocument();
    });
  });

  it('completes station deletion flow', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );

    // Navigate to admin dashboard
    const dashboardLink = screen.getByText(/dashboard/i);
    fireEvent.click(dashboardLink);

    // Wait for stations to load
    await waitFor(() => {
      expect(screen.getByText('Test Station 1')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    // Verify station was deleted
    await waitFor(() => {
      expect(require('../../services/api').deleteStation).toHaveBeenCalled();
    });

    // Verify station is removed from list
    await waitFor(() => {
      expect(screen.queryByText('Test Station 1')).not.toBeInTheDocument();
    });
  });

  it('handles station management errors gracefully', async () => {
    // Mock API error
    const api = require('../../services/api');
    api.createStation.mockRejectedValueOnce(new Error('Failed to create station'));

    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );

    // Navigate to admin dashboard
    const dashboardLink = screen.getByText(/dashboard/i);
    fireEvent.click(dashboardLink);

    // Click add station button
    const addButton = screen.getByText(/add station/i);
    fireEvent.click(addButton);

    // Fill in required fields
    await userEvent.type(screen.getByLabelText(/station name/i), 'New Station');
    await userEvent.type(screen.getByLabelText(/address/i), '456 New St');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /add station/i });
    fireEvent.click(submitButton);

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/failed to create station/i)).toBeInTheDocument();
    });
  });
}); 