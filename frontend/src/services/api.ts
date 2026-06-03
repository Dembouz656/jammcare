import apiConfig from '../config/api.js';

interface RequestOptions extends RequestInit {
  headers?: HeadersInit & { 'Authorization'?: string };
}

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = apiConfig.baseURL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'An error occurred');
    }

    return response.json();
  }

  // Auth
  async register(email: string, password: string, fullName: string, phoneNumber?: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName, phone_number: phoneNumber }),
    });
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Users
  async getUserProfile(userId: string) {
    return this.request(`/users/${userId}`);
  }

  async updateUserProfile(userId: string, profileData: any) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Services
  async getServices() {
    return this.request('/services');
  }

  async getServicesByCategory(category: string) {
    return this.request(`/services/category/${category}`);
  }

  async getServiceDetails(serviceId: string) {
    return this.request(`/services/${serviceId}`);
  }

  // Providers
  async getProviders() {
    return this.request('/providers');
  }

  async getProviderDetails(providerId: string) {
    return this.request(`/providers/${providerId}`);
  }

  async registerAsProvider(specialization: string, licenseNumber: string, licenseExpiry: string, bio: string) {
    return this.request('/providers/register', {
      method: 'POST',
      body: JSON.stringify({ specialization, license_number: licenseNumber, license_expiry: licenseExpiry, bio }),
    });
  }

  // Bookings
  async createBooking(providerId: string, serviceId: string, appointmentDate: string, location?: string, notes?: string) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify({ provider_id: providerId, service_id: serviceId, appointment_date: appointmentDate, location, notes }),
    });
  }

  async getUserBookings(userId: string) {
    return this.request(`/bookings/user/${userId}`);
  }

  async getProviderBookings(providerId: string) {
    return this.request(`/bookings/provider/${providerId}`);
  }

  async updateBookingStatus(bookingId: string, status: string) {
    return this.request(`/bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Reviews
  async createReview(bookingId: string, rating: number, comment?: string) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify({ booking_id: bookingId, rating, comment }),
    });
  }

  async getProviderReviews(providerId: string) {
    return this.request(`/reviews/provider/${providerId}`);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
