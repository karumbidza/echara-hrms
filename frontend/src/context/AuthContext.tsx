import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
  tenant?: {
    id: string;
    name: string;
    subscriptionStatus?: string;
    features?: string[];
  };
}

interface TenantFeatures {
  employees: boolean;
  departments: boolean;
  contracts: boolean;
  payroll: boolean;
  leave: boolean;
  leaveApprovals: boolean;
  payrollApprovals: boolean;
  reports: boolean;
  timesheets: boolean;
  documents: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  features: TenantFeatures;
  hasFeature: (feature: keyof TenantFeatures) => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  currency: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<TenantFeatures>({
    employees: true,
    departments: true,
    contracts: true,
    payroll: true,
    leave: true,
    leaveApprovals: true,
    payrollApprovals: true,
    reports: true,
    timesheets: true,
    documents: true
  });

  // Check if tenant has a specific feature
  const hasFeature = (feature: keyof TenantFeatures): boolean => {
    return features[feature] || false;
  };

  // Load features based on tenant subscription
  const loadTenantFeatures = (userData: User) => {
    const tenantFeatures = userData.tenant?.features || [];
    
    // Default ALL features to TRUE for now (will be controlled via super-admin later)
    const defaultFeatures: TenantFeatures = {
      employees: true,
      departments: true,
      contracts: true,
      payroll: true,
      leave: true,
      leaveApprovals: true,
      payrollApprovals: true,
      reports: true,
      timesheets: true,
      documents: true
    };

    // If tenant has features array, use it (when super-admin feature control is implemented)
    if (tenantFeatures.length > 0) {
      // Reset all to false first
      Object.keys(defaultFeatures).forEach(key => {
        defaultFeatures[key as keyof TenantFeatures] = false;
      });
      
      // Enable only features in the tenant's plan
      tenantFeatures.forEach((feature: string) => {
        if (feature in defaultFeatures) {
          defaultFeatures[feature as keyof TenantFeatures] = true;
        }
      });
    }

    setFeatures(defaultFeatures);
  };

  // Set auth token for axios
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/auth/profile`);
          setUser(response.data.user);
          loadTenantFeatures(response.data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      const { user, token } = response.data;
      setUser(user);
      setToken(token);
      loadTenantFeatures(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      const { user, token } = response.data;
      setUser(user);
      setToken(token);
      loadTenantFeatures(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, features, hasFeature, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
