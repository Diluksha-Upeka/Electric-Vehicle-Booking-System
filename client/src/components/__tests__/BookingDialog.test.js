import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingDialog from '../BookingDialog';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '123', name: 'Test User' },
    isAuthenticated: true
  })
}));

// Mock the API calls
jest.mock('../../services/api', () => ({
  createBooking: jest.fn(),
  getStationDetails: jest.fn()
}));

const mockStation = {
  _id: 'station123',
  name: 'Test Station',
  address: '123 Test St',
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
};

const renderBookingDialog = (props = {}) => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    station: mockStation,
    ...props
  };

  return render(
    <AuthProvider>
      <BookingDialog {...defaultProps} />
    </AuthProvider>
  );
};

describe('BookingDialog Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders booking dialog with station information', () => {
    renderBookingDialog();
    expect(screen.getByText(mockStation.name)).toBeInTheDocument();
    expect(screen.getByText(mockStation.address)).toBeInTheDocument();
  });

  it('shows charging point information', () => {
    renderBookingDialog();
    expect(screen.getByText(/Type 2/i)).toBeInTheDocument();
    expect(screen.getByText(/22 kW/i)).toBeInTheDocument();
  });

  it('allows date and time selection', async () => {
    renderBookingDialog();
    
    // Open date picker
    const dateInput = screen.getByLabelText(/date/i);
    fireEvent.click(dateInput);
    
    // Select a date
    const dateButton = screen.getByRole('button', { name: /15/i });
    fireEvent.click(dateButton);
    
    // Select time slots
    const startTimeButton = screen.getByRole('button', { name: /09:00/i });
    const endTimeButton = screen.getByRole('button', { name: /10:00/i });
    
    fireEvent.click(startTimeButton);
    fireEvent.click(endTimeButton);
    
    expect(startTimeButton).toHaveClass('selected');
    expect(endTimeButton).toHaveClass('selected');
  });

  it('validates booking duration', async () => {
    renderBookingDialog();
    
    // Select invalid time slots (less than 30 minutes)
    const startTimeButton = screen.getByRole('button', { name: /09:00/i });
    const endTimeButton = screen.getByRole('button', { name: /09:15/i });
    
    fireEvent.click(startTimeButton);
    fireEvent.click(endTimeButton);
    
    const bookButton = screen.getByRole('button', { name: /book/i });
    fireEvent.click(bookButton);
    
    expect(screen.getByText(/minimum duration/i)).toBeInTheDocument();
  });

  it('handles successful booking submission', async () => {
    const mockOnClose = jest.fn();
    renderBookingDialog({ onClose: mockOnClose });
    
    // Select valid time slots
    const startTimeButton = screen.getByRole('button', { name: /09:00/i });
    const endTimeButton = screen.getByRole('button', { name: /10:00/i });
    
    fireEvent.click(startTimeButton);
    fireEvent.click(endTimeButton);
    
    // Submit booking
    const bookButton = screen.getByRole('button', { name: /book/i });
    fireEvent.click(bookButton);
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles booking errors', async () => {
    // Mock API error
    const mockError = new Error('Booking failed');
    require('../../services/api').createBooking.mockRejectedValueOnce(mockError);
    
    renderBookingDialog();
    
    // Select time slots and submit
    const startTimeButton = screen.getByRole('button', { name: /09:00/i });
    const endTimeButton = screen.getByRole('button', { name: /10:00/i });
    
    fireEvent.click(startTimeButton);
    fireEvent.click(endTimeButton);
    
    const bookButton = screen.getByRole('button', { name: /book/i });
    fireEvent.click(bookButton);
    
    await waitFor(() => {
      expect(screen.getByText(/booking failed/i)).toBeInTheDocument();
    });
  });
}); 