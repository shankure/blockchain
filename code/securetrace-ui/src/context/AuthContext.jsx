import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// AuthProvider wraps the entire app and provides:
//   - user: { fullName, email, role, token }
//   - login(userData): stores user in state + localStorage
//   - logout(): clears everything
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Restore user from localStorage on page refresh
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — any component can call useAuth() to get user/login/logout
export function useAuth() {
  return useContext(AuthContext);
}
