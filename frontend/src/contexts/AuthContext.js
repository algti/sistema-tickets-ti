import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Set token in API headers
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Get user info
      getCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const getCurrentUser = async () => {
    try {
      const response = await authAPI.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error getting current user:', error);
      // Clear invalid token and redirect to login
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      delete authAPI.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      const response = await authAPI.post('/auth/login', {
        username,
        password
      });
      
      const { access_token } = response.data;
      
      // Store token
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      // Set token in API headers
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Get user info
      await getCurrentUser();
      
      toast.success('Login realizado com sucesso!');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.detail || 'Erro ao fazer login';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete authAPI.defaults.headers.common['Authorization'];
    toast.success('Logout realizado com sucesso!');
  };

  const refreshToken = async () => {
    try {
      const response = await authAPI.post('/auth/refresh');
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return false;
    }
  };

  const updateUser = (userData) => {
    console.log('AuthContext: Updating user data:', userData);
    setUser(userData);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    refreshToken,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role?.toLowerCase() === 'admin',
    isTechnician: user?.role?.toLowerCase() === 'technician' || user?.role?.toLowerCase() === 'admin',
    isUser: user?.role?.toLowerCase() === 'user'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
