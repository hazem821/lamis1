import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string, pass: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('lamis_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation (Accept any valid email format for demo, strictly check if created previously in a real app)
    // Here we check if it matches the "stored" registered user for simulation
    const registeredUsers = JSON.parse(localStorage.getItem('lamis_registered_users') || '[]');
    const foundUser = registeredUsers.find((u: any) => u.email === email && u.pass === pass);

    if (foundUser) {
      const userData: User = { email: foundUser.email, name: foundUser.name, avatar: foundUser.avatar };
      setUser(userData);
      localStorage.setItem('lamis_user', JSON.stringify(userData));
      return true;
    } 
    
    // Fallback for demo: Allow admin/admin
    if (email === 'admin@lamis.com' && pass === '123456') {
        const adminUser: User = { email, name: 'مدير النظام', avatar: '' };
        setUser(adminUser);
        localStorage.setItem('lamis_user', JSON.stringify(adminUser));
        return true;
    }

    return false;
  };

  const register = async (name: string, email: string, pass: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser = { name, email, pass, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D9488&color=fff` };
    
    // Save to "DB"
    const registeredUsers = JSON.parse(localStorage.getItem('lamis_registered_users') || '[]');
    if (registeredUsers.find((u: any) => u.email === email)) {
        return false; // User exists
    }
    
    registeredUsers.push(newUser);
    localStorage.setItem('lamis_registered_users', JSON.stringify(registeredUsers));

    // Auto login
    const userData: User = { email, name, avatar: newUser.avatar };
    setUser(userData);
    localStorage.setItem('lamis_user', JSON.stringify(userData));
    return true;
  };

  const loginWithGoogle = async () => {
    // Simulate Google Login Popup and processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    const googleUser: User = {
      email: 'user@gmail.com',
      name: 'مستخدم جوجل',
      avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
    };
    setUser(googleUser);
    localStorage.setItem('lamis_user', JSON.stringify(googleUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lamis_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, isLoading }}>
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