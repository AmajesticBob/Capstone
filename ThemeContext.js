import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [syncWithSystem, setSyncWithSystem] = useState(true);
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    if (syncWithSystem) {
      setIsDark(systemColorScheme === 'dark');
    }
  }, [systemColorScheme, syncWithSystem]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const toggleSyncWithSystem = () => {
    setSyncWithSystem(!syncWithSystem);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, syncWithSystem, toggleSyncWithSystem }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
