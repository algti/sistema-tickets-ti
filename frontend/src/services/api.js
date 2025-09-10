import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Create axios instance
export const authAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
authAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't try to refresh if the request is already a refresh request
    if (originalRequest.url?.includes('/auth/refresh')) {
      localStorage.removeItem('token');
      delete authAPI.defaults.headers.common['Authorization'];
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const response = await authAPI.post('/auth/refresh');
        const { access_token } = response.data;
        
        localStorage.setItem('token', access_token);
        authAPI.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        
        return authAPI(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        delete authAPI.defaults.headers.common['Authorization'];
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authService = {
  login: (username, password) => 
    authAPI.post('/auth/login', { username, password }),
  
  getCurrentUser: () => 
    authAPI.get('/auth/me'),
  
  refreshToken: () => 
    authAPI.post('/auth/refresh'),
};

// Tickets API
export const ticketsService = {
  getTickets: (params = {}) => {
    console.log('🔍 DEBUG API: Chamando /tickets/ com params:', params);
    return authAPI.get('/tickets/', { params });
  },
  
  getTicket: (id) => 
    authAPI.get(`/tickets/${id}`),
  
  createTicket: (data) => 
    authAPI.post('/tickets/', data),
  
  updateTicket: (id, data) => 
    authAPI.put(`/tickets/${id}`, data),
  
  addComment: (id, data) => 
    authAPI.post(`/tickets/${id}/comments`, data),
  
  uploadAttachment: (id, formData) => 
    authAPI.post(`/tickets/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  deleteTicket: (id) =>
    authAPI.delete(`/tickets/${id}`),
  
  getTicketComments: (id) => 
    authAPI.get(`/tickets/${id}/comments`),
  
  getTechnicians: () => 
    authAPI.get('/users/technicians'),
};

// Users API
export const usersService = {
  getUsers: (params = {}) => 
    authAPI.get('/users/', { params }),
  
  getUser: (id) => 
    authAPI.get(`/users/${id}`),
  
  createUser: (data) => 
    authAPI.post('/users/', data),
  
  updateUser: (id, data) => 
    authAPI.put(`/users/${id}`, data),
  
  updateProfile: async (data) => {
    console.log('API: Sending updateProfile request with data:', data);
    console.log('API: Current token:', localStorage.getItem('token')?.substring(0, 20) + '...');
    console.log('API: Authorization header:', authAPI.defaults.headers.common['Authorization']?.substring(0, 30) + '...');
    try {
      const response = await authAPI.put('/users/profile', data);
      console.log('API: updateProfile response:', response);
      return response;
    } catch (error) {
      console.error('API: updateProfile error:', error);
      console.error('API: Error response data:', error.response?.data);
      console.error('API: Error response status:', error.response?.status);
      console.error('API: Error response headers:', error.response?.headers);
      throw error;
    }
  },
  
  deactivateUser: (id) => 
    authAPI.delete(`/users/${id}`),
  
  activateUser: (id) => 
    authAPI.put(`/users/${id}/activate`),
  
  deleteUser: (id) => 
    authAPI.delete(`/users/${id}/delete`),
  
  getTechnicians: () => 
    authAPI.get('/users/technicians'),
};

// Categories API
export const categoriesService = {
  getCategories: (params = {}) => 
    authAPI.get('/categories/', { params }),
  
  getCategory: (id) => 
    authAPI.get(`/categories/${id}`),
  
  createCategory: (data) => 
    authAPI.post('/categories/', data),
  
  updateCategory: (id, data) => 
    authAPI.put(`/categories/${id}`, data),
  
  deactivateCategory: (id) => 
    authAPI.delete(`/categories/${id}`),
  
  activateCategory: (id) => 
    authAPI.put(`/categories/${id}/activate`),
};

// Dashboard API
export const dashboardService = {
  getStats: (params = {}) => 
    authAPI.get('/dashboard/stats', { params }),
  
  getTicketsByMonth: (params = {}) => 
    authAPI.get('/dashboard/tickets-by-month', { params }),
  
  getTechnicianPerformance: (params = {}) => 
    authAPI.get('/dashboard/technician-performance', { params }),
  
  getPriorityTrends: (params = {}) => 
    authAPI.get('/dashboard/priority-trends', { params }),
};

// Settings API
export const settingsService = {
  getSettings: () => 
    authAPI.get('/settings'),
  updateSettings: (data) => 
    authAPI.put('/settings', data),
  saveSettings: (data) => 
    authAPI.put('/settings', data),
  resetSettings: () => 
    authAPI.post('/settings/reset'),
  testEmail: (data) => 
    authAPI.post('/settings/test-email', data)
};

// Knowledge Base API
export const knowledgeService = {
  getArticles: (params) => authAPI.get('/knowledge/articles', { params }),
  getArticle: (id) => authAPI.get(`/knowledge/articles/${id}`),
  createArticle: (data) => authAPI.post('/knowledge/articles', data),
  updateArticle: (id, data) => authAPI.put(`/knowledge/articles/${id}`, data),
  deleteArticle: (id) => authAPI.delete(`/knowledge/articles/${id}`),
  searchArticles: (query) => authAPI.get('/knowledge/search', { params: { q: query } }),
  getFAQ: () => authAPI.get('/knowledge/faq'),
  rateArticle: (id, rating) => authAPI.post(`/knowledge/articles/${id}/rate`, { rating })
};

// Assets API
export const assetsService = {
  // Asset Categories
  getCategories: () => authAPI.get('/assets/categories'),
  createCategory: (data) => authAPI.post('/assets/categories', data),
  updateCategory: (id, data) => authAPI.put(`/assets/categories/${id}`, data),
  deleteCategory: (id) => authAPI.delete(`/assets/categories/${id}`),
  
  // Assets
  getAssets: (params) => authAPI.get('/assets', { params }),
  getAsset: (id) => authAPI.get(`/assets/${id}`),
  createAsset: (data) => authAPI.post('/assets', data),
  updateAsset: (id, data) => authAPI.put(`/assets/${id}`, data),
  deleteAsset: (id) => authAPI.delete(`/assets/${id}`),
  
  // Maintenance
  getMaintenance: (assetId) => authAPI.get(`/assets/${assetId}/maintenance`),
  createMaintenance: (assetId, data) => authAPI.post(`/assets/${assetId}/maintenance`, data),
  updateMaintenance: (assetId, maintenanceId, data) => authAPI.put(`/assets/${assetId}/maintenance/${maintenanceId}`, data),
  deleteMaintenance: (assetId, maintenanceId) => authAPI.delete(`/assets/${assetId}/maintenance/${maintenanceId}`),
  
  // Reports
  getWarrantyReport: () => authAPI.get('/assets/reports/warranty'),
  getMaintenanceReport: () => authAPI.get('/assets/reports/maintenance')
};

// Export individual APIs for easier imports
export const usersAPI = usersService;
// Chat API - REMOVIDO (funcionalidade eliminada)

// Evaluations API
const evaluationsService = {
  // Ticket evaluations
  createEvaluation: (ticketId, evaluationData) => 
    authAPI.post(`/evaluations/tickets/${ticketId}/evaluation`, evaluationData),
  getEvaluation: (ticketId) => 
    authAPI.get(`/evaluations/tickets/${ticketId}/evaluation`),
  updateEvaluation: (ticketId, evaluationData) => 
    authAPI.put(`/evaluations/tickets/${ticketId}/evaluation`, evaluationData),
  deleteEvaluation: (ticketId) => 
    authAPI.delete(`/evaluations/tickets/${ticketId}/evaluation`),
  
  // Evaluations list
  getEvaluations: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });
    return authAPI.get(`/evaluations/evaluations?${queryParams}`);
  },
  
  // Metrics
  getSatisfactionMetrics: (days = 30, technicianId = null) => {
    const params = new URLSearchParams({ days: days.toString() });
    if (technicianId) params.append('technician_id', technicianId);
    return authAPI.get(`/evaluations/metrics/satisfaction?${params}`);
  },
  getTechnicianMetrics: (days = 30) => 
    authAPI.get(`/evaluations/metrics/technicians?days=${days}`)
};

export const ticketsAPI = ticketsService;
export const categoriesAPI = categoriesService;
export const settingsAPI = settingsService;
// Reports API
const reportsService = {
  // Performance reports
  getTechnicianPerformance: (days = 30, technicianId = null) => {
    const params = new URLSearchParams({ days: days.toString() });
    if (technicianId) params.append('technician_id', technicianId.toString());
    return authAPI.get(`/reports/performance/technicians?${params}`);
  },
  
  // Department metrics
  getDepartmentMetrics: (days = 30) => 
    authAPI.get(`/reports/metrics/department?days=${days}`),
  
  // Timeline metrics
  getTimelineMetrics: (days = 30, interval = 'daily') => 
    authAPI.get(`/reports/metrics/timeline?days=${days}&interval=${interval}`),
  
  // SLA analysis
  getSLAAnalysis: (days = 30) => 
    authAPI.get(`/reports/sla/analysis?days=${days}`),
  
  // Export data
  getExportData: (reportType, days = 30, format = 'json') => 
    authAPI.get(`/reports/export/data?report_type=${reportType}&days=${days}&format=${format}`)
};

export const evaluationsAPI = evaluationsService;
export const reportsAPI = reportsService;
