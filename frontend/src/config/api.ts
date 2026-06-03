const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiConfig = {
  baseURL: API_URL,
  endpoints: {
    auth: {
      register: `${API_URL}/auth/register`,
      login: `${API_URL}/auth/login`,
    },
    users: {
      profile: (userId: string) => `${API_URL}/users/${userId}`,
      updateProfile: (userId: string) => `${API_URL}/users/${userId}`,
    },
    providers: {
      list: `${API_URL}/providers`,
      details: (providerId: string) => `${API_URL}/providers/${providerId}`,
      register: `${API_URL}/providers/register`,
    },
    services: {
      list: `${API_URL}/services`,
      byCategory: (category: string) => `${API_URL}/services/category/${category}`,
      details: (serviceId: string) => `${API_URL}/services/${serviceId}`,
    },
    bookings: {
      create: `${API_URL}/bookings`,
      userBookings: (userId: string) => `${API_URL}/bookings/user/${userId}`,
      providerBookings: (providerId: string) => `${API_URL}/bookings/provider/${providerId}`,
      update: (bookingId: string) => `${API_URL}/bookings/${bookingId}`,
    },
    reviews: {
      create: `${API_URL}/reviews`,
      providerReviews: (providerId: string) => `${API_URL}/reviews/provider/${providerId}`,
    },
    health: `${API_URL}/health`,
  },
};

export default apiConfig;
