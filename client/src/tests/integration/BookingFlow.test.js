import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import App from '../../App';

// Mock the API calls
jest.mock('../../services/api', () => ({
  getStations: jest.fn(),
  createBooking: jest.fn(),
  getStationDetails: jest.fn(),
  getUserBookings: jest.fn()
}));

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '123', name: 'Test User' },
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

describe('Booking Flow Integration', () => {
  beforeEach(() => {
    // Setup API mocks
    const api = require('../../services/api');
    api.getStations.mockResolvedValue({ data: mockStations });
    api.getStationDetails.mockResolvedValue({ data: mockStations[0] });
    api.createBooking.mockResolvedValue({ data: { _id: 'booking1' } });
    api.getUserBookings.mockResolvedValue({ data: [] });
  });

  it('completes full booking flow', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );

    // Wait for stations to load
    await waitFor(() => {
      expect(screen.getByText('Test Station 1')).toBeInTheDocument();
    });

    // Click on station to open booking dialog
    const stationCard = screen.getByText('Test Station 1');
    fireEvent.click(stationCard);

    // Wait for booking dialog
    await waitFor(() => {
      expect(screen.getByText(/select date and time/i)).toBeInTheDocument();
    });

    // Select date
    const dateInput = screen.getByLabelText(/date/i);
    fireEvent.click(dateInput);
    const dateButton = screen.getByRole('button', { name: /15/i });
    fireEvent.click(dateButton);

    // Select time slots
    const startTimeButton = screen.getByRole('button', { name: /09:00/i });
    const endTimeButton = screen.getByRole('button', { name: /10:00/i });
    fireEvent.click(startTimeButton);
    fireEvent.click(endTimeButton);

    // Submit booking
    const bookButton = screen.getByRole('button', { name: /book/i });
    fireEvent.click(bookButton);

    // Verify booking was created
    await waitFor(() => {
      expect(require('../../services/api').createBooking).toHaveBeenCalled();
    });

    // Navigate to bookings page
    const bookingsLink = screen.getByText(/my bookings/i);
    fireEvent.click(bookingsLink);

    // Verify bookings page shows the new booking
    await waitFor(() => {
      expect(screen.getByText(/Test Station 1/i)).toBeInTheDocument();
    });
  });

  it('handles booking errors gracefully', async () => {
    // Mock API error
    const api = require('../../services/api');
    api.createBooking.mockRejectedValueOnce(new Error('Booking failed'));

    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );

    // Wait for stations to load
    await waitFor(() => {
      expect(screen.getByText('Test Station 1')).toBeInTheDocument();
    });

    // Open booking dialog
    const stationCard = screen.getByText('Test Station 1');
    fireEvent.click(stationCard);

    // Select date and time
    await waitFor(() => {
      expect(screen.getByText(/select date and time/i)).toBeInTheDocument();
    });

    const dateInput = screen.getByLabelText(/date/i);
    fireEvent.click(dateInput);
    const dateButton = screen.getByRole('button', { name: /15/i });
    fireEvent.click(dateButton);

    const startTimeButton = screen.getByRole('button', { name: /09:00/i });
    const endTimeButton = screen.getByRole('button', { name: /10:00/i });
    fireEvent.click(startTimeButton);
    fireEvent.click(endTimeButton);

    // Submit booking
    const bookButton = screen.getByRole('button', { name: /book/i });
    fireEvent.click(bookButton);

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/booking failed/i)).toBeInTheDocument();
    });
  });

  it('handles station unavailability', async () => {
    // Mock station as unavailable
    const api = require('../../services/api');
    api.getStationDetails.mockResolvedValueOnce({
      data: {
        ...mockStations[0],
        chargingPoints: [
          {
            type: 'Type 2',
            power: 22,
            status: 'unavailable'
          }
        ]
      }
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );

    // Wait for stations to load
    await waitFor(() => {
      expect(screen.getByText('Test Station 1')).toBeInTheDocument();
    });

    // Open booking dialog
    const stationCard = screen.getByText('Test Station 1');
    fireEvent.click(stationCard);

    // Verify unavailability message
    await waitFor(() => {
      expect(screen.getByText(/station is currently unavailable/i)).toBeInTheDocument();
    });
  });
}); 