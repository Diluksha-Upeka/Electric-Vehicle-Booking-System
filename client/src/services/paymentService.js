import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const paymentService = {
  createPaymentIntent: async (amount, currency, bookingData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/payments/create-intent`,
        {
          amount,
          currency,
          bookingData
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create payment intent');
    }
  },

  confirmPayment: async (paymentIntentId, paymentMethodId) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/payments/confirm`,
        {
          paymentIntentId,
          paymentMethodId
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to confirm payment');
    }
  },

  generateReceipt: async (bookingId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/payments/receipt/${bookingId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate receipt');
    }
  }
};

export default paymentService; 