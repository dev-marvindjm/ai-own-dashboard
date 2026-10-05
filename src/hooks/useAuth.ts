import { useState, useCallback, useEffect } from 'react';
import { login as apiLogin, getProfile } from '../services/rustApi';

interface User {
  id: string;
  username: string;
  email: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const profile = await getProfile();
      setUser(profile);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email: string, password: string) => {
    try {
      await apiLogin(email, password);
      await checkSession();
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    // Implement actual logout API call if needed
    setUser(null);
    setIsAuthenticated(false);
  };

  return { isAuthenticated, user, isLoading, login, logout, checkSession };
}
