import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("authUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const [lastSessionChange, setLastSessionChange] = useState(null);

  const login = (userData, jwtToken) => {
    localStorage.setItem("authUser", JSON.stringify(userData));
    localStorage.setItem("authToken", jwtToken);

    setUser(userData);
    setToken(jwtToken);

    const now = Date.now().toString();
    localStorage.setItem("sessionChange", now);
    setLastSessionChange(now);
  };

  const logout = () => {
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");

    setUser(null);
    setToken(null);

    const now = Date.now().toString();
    localStorage.setItem("sessionChange", now);
    setLastSessionChange(now);

    window.location.replace("/");// redirect to login
  };

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== "sessionChange") return;

      // Prevent self-trigger
      if (event.newValue === lastSessionChange) return;

      const storedUser = localStorage.getItem("authUser");
      const storedToken = localStorage.getItem("authToken");

      if (!storedUser || !storedToken) {
        // Someone logged out in another tab
        setUser(null);
        setToken(null);
        window.location.href = "/";
      } else {
        // Compare with current user
        const newUser = JSON.parse(storedUser);
        if (user && newUser.email !== user.email) {
          // Another account logged in — logout this one
          localStorage.removeItem("authUser");
          localStorage.removeItem("authToken");
          setUser(null);
          setToken(null);
          window.location.href = "/";
        } else {
          // Same user session continued, update token if needed
          setUser(newUser);
          setToken(storedToken);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user, lastSessionChange]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
