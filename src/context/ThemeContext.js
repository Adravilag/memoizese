import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@testeate_theme';

// Colores para modo claro
const lightTheme = {
  mode: 'light',
  colors: {
    // Fondos
    background: '#F5F7FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    
    // Primarios
    primary: '#2E78C7',
    primaryLight: '#E3F2FD',
    
    // Texto
    text: '#1A1A1A',
    textSecondary: '#4A4A4A',
    textMuted: '#6B6B6B',
    textInverse: '#FFFFFF',
    
    // Estados
    success: '#1B8A3E',
    successLight: '#E8F5E9',
    error: '#C62828',
    errorLight: '#FFEBEE',
    warning: '#E65100',
    warningLight: '#FFF3E0',
    
    // Bordes
    border: '#D0D0D0',
    borderLight: '#E8E8E8',
    
    // Header
    headerBackground: '#2E78C7',
    headerText: '#FFFFFF',
    
    // Inputs
    inputBackground: '#FFFFFF',
    inputBorder: '#C0C0C0',
    placeholder: '#808080',
    
    // Sombras
    shadow: '#000',
    
    // Especiales
    overlay: 'rgba(0,0,0,0.5)',
    statusBar: 'light-content',
    
    // Colores adicionales para UI
    cardHighlight: '#F0F4F8',
    buttonSecondary: '#E0E4E8',
    divider: '#D0D0D0',
    badge: '#E0E4E8',
    
    // Iconos específicos
    iconPrimary: '#2E78C7',
    iconSuccess: '#1B8A3E',
    iconError: '#C62828',
    iconWarning: '#E65100',
    iconMuted: '#6B6B6B',
    iconTrophy: '#D4A200',
    
    // FABs y botones de acción
    fabPrimary: '#2E78C7',
    fabStats: '#27AE60',
    fabHistory: '#9B59B6',
    fabThemeLight: '#2C3E50',
    fabThemeDark: '#FFD93D',
    fabThemeIcon: '#F5F5F5',
    
    // Colores específicos para estados de opciones
    optionDefault: '#E0E0E0',
    optionBorder: '#E0E0E0',
    optionSelected: '#EBF5FF',
    optionCorrect: '#E8F5E9',
    optionIncorrect: '#FFF5F5',
    
    // Navegación
    navBackground: '#FAFAFA',
    navButton: '#E8E8E8',
    navButtonText: '#555555',
    
    // Gráficos y estadísticas
    chartBar: '#2E78C7',
    infoBackground: '#E8F4FD',
    
    // Alertas y ayuda
    helpBackground: '#FFF3CD',
    helpText: '#856404',
  }
};

// Colores para modo oscuro - Alto contraste
const darkTheme = {
  mode: 'dark',
  colors: {
    // Fondos - más oscuros para mejor contraste
    background: '#0A0A0A',
    surface: '#151515',
    card: '#1E1E1E',
    
    // Primarios - más brillantes para alto contraste
    primary: '#6CB4FF',
    primaryLight: '#1A3550',
    
    // Texto - máximo contraste
    text: '#F5F5F5',
    textSecondary: '#C8C8C8',
    textMuted: '#9A9A9A',
    textInverse: '#0A0A0A',
    
    // Estados - colores más vivos para visibilidad
    success: '#4ADE80',
    successLight: '#14532D',
    error: '#F87171',
    errorLight: '#7F1D1D',
    warning: '#FBBF24',
    warningLight: '#78350F',
    
    // Bordes - más visibles
    border: '#404040',
    borderLight: '#2A2A2A',
    
    // Header
    headerBackground: '#151515',
    headerText: '#F5F5F5',
    
    // Inputs - mejor contraste
    inputBackground: '#252525',
    inputBorder: '#454545',
    placeholder: '#7A7A7A',
    
    // Sombras
    shadow: '#000',
    
    // Especiales
    overlay: 'rgba(0,0,0,0.85)',
    statusBar: 'light-content',
    
    // Colores adicionales para UI
    cardHighlight: '#282828',
    buttonSecondary: '#333333',
    divider: '#353535',
    badge: '#353535',
    
    // Iconos específicos - brillantes para modo oscuro
    iconPrimary: '#6CB4FF',
    iconSuccess: '#4ADE80',
    iconError: '#F87171',
    iconWarning: '#FBBF24',
    iconMuted: '#9A9A9A',
    iconTrophy: '#FFD93D',
    
    // FABs y botones de acción
    fabPrimary: '#6CB4FF',
    fabStats: '#4ADE80',
    fabHistory: '#C084FC',
    fabThemeLight: '#2C3E50',
    fabThemeDark: '#FFD93D',
    fabThemeIcon: '#1A1A1A',
    
    // Colores específicos para estados de opciones
    optionDefault: '#333333',
    optionBorder: '#404040',
    optionSelected: '#1A3550',
    optionCorrect: '#14532D',
    optionIncorrect: '#450A0A',
    
    // Navegación
    navBackground: '#151515',
    navButton: '#252525',
    navButtonText: '#C8C8C8',
    
    // Gráficos y estadísticas
    chartBar: '#6CB4FF',
    infoBackground: '#1A3550',
    
    // Alertas y ayuda
    helpBackground: '#422006',
    helpText: '#FDE68A',
  }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Usar el tema del sistema como valor inicial para evitar destellos
  const systemColorScheme = Appearance.getColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
    setIsLoading(false);
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem(THEME_KEY, newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { lightTheme, darkTheme };
