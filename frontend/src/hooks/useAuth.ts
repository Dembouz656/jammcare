import { useState, useCallback } from 'react';
import { apiClient } from '../services/api.js';

interface User {
  user_id: string;
  role: string;
  email?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.login(email, password);
      const userData = { user_id: response.user_id, role: response.role, email };
      setUser(userData);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(userData));
      return response;
    } catch (err: any) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string, phoneNumber?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.register(email, password, fullName, phoneNumber);
      return response;
    } catch (err: any) {
      const errorMsg = err.message || 'Registration failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const isAuthenticated = !!user;
  const isProvider = user?.role === 'provider';

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated,
    isProvider,
  };
};
