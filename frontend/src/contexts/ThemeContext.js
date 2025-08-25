import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('blue');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-settings');
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme);
        setIsDarkMode(theme.isDarkMode || false);
        setPrimaryColor(theme.primaryColor || 'blue');
        setSidebarCollapsed(theme.sidebarCollapsed || false);
      } catch (error) {
        console.error('Error loading theme settings:', error);
      }
    }
  }, []);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    const themeSettings = {
      isDarkMode,
      primaryColor,
      sidebarCollapsed
    };
    localStorage.setItem('theme-settings', JSON.stringify(themeSettings));
  }, [isDarkMode, primaryColor, sidebarCollapsed]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const changePrimaryColor = (color) => {
    setPrimaryColor(color);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Generate theme classes based on current settings
  const getThemeClasses = () => {
    const baseClasses = {
      // Background classes
      bg: {
        primary: isDarkMode ? 'bg-gray-900' : 'bg-white',
        secondary: isDarkMode ? 'bg-gray-800' : 'bg-gray-50',
        card: isDarkMode ? 'bg-gray-800' : 'bg-white',
        hover: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
      },
      
      // Text classes
      text: {
        primary: isDarkMode ? 'text-white' : 'text-gray-900',
        secondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
        tertiary: isDarkMode ? 'text-gray-400' : 'text-gray-500',
        muted: isDarkMode ? 'text-gray-500' : 'text-gray-400'
      },
      
      // Border classes
      border: {
        primary: isDarkMode ? 'border-gray-700' : 'border-gray-200',
        secondary: isDarkMode ? 'border-gray-600' : 'border-gray-300'
      },
      
      // Input classes
      input: {
        base: isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'
      },
      
      // Button classes
      button: {
        primary: `bg-${primaryColor}-600 text-white hover:bg-${primaryColor}-700`,
        secondary: isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50',
        danger: 'bg-red-600 text-white hover:bg-red-700'
      }
    };

    return baseClasses;
  };

  const classes = getThemeClasses();

  const value = {
    isDarkMode,
    primaryColor,
    sidebarCollapsed,
    toggleDarkMode,
    changePrimaryColor,
    toggleSidebar,
    classes
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className={isDarkMode ? 'dark' : ''}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
