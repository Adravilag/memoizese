import React, { useMemo } from 'react';
import { LogBox, Platform, StatusBar as RNStatusBar, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import MainMenuScreen from './src/screens/MainMenuScreen';
import DecksScreen from './src/screens/DecksScreen';
import DeckDetailScreen from './src/screens/DeckDetailScreen';
import StudyScreen from './src/screens/StudyScreen';
import StatsScreen from './src/screens/StatsScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import StudyScheduleScreen from './src/screens/StudyScheduleScreen';
import ReviewWordsScreen from './src/screens/ReviewWordsScreen';
import TestsListScreen from './src/screens/TestsListScreen';
import AddTestScreen from './src/screens/AddTestScreen';
import ConfigureAnswersScreen from './src/screens/ConfigureAnswersScreen';
import TakeTestScreen from './src/screens/TakeTestScreen';
import TestDetailsScreen from './src/screens/TestDetailsScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DownloadDatasetsScreen from './src/screens/DownloadDatasetsScreen';

// Ignorar warnings de scroll anidado en Android (son warnings conocidos, no errores)
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'Each child in a list should have a unique',
]);

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { theme, isDark } = useTheme();
  
  const navigationTheme = useMemo(() => ({
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.primary,
    },
  }), [isDark, theme]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent backgroundColor="transparent" />
      <Stack.Navigator
        initialRouteName="MainMenu"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.headerBackground,
          },
          headerTintColor: theme.colors.headerText,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: true,
          headerBackTitleVisible: false,
          // Asegurar que el header respete el safe area en Android
          headerStatusBarHeight: Platform.OS === 'android' ? RNStatusBar.currentHeight : undefined,
          // Evitar destello blanco en transiciones
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
          animation: 'fade',
        }}
      >
        <Stack.Screen 
          name="MainMenu" 
          component={MainMenuScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Decks" 
          component={DecksScreen} 
          options={{ title: 'Mis Mazos' }}
        />
        <Stack.Screen 
          name="DeckDetail" 
          component={DeckDetailScreen} 
          options={{ title: 'Mazo' }}
        />
        <Stack.Screen 
          name="Study" 
          component={StudyScreen} 
          options={{ title: 'Estudiar' }}
        />
        <Stack.Screen 
          name="Stats" 
          component={StatsScreen} 
          options={{ title: 'Estadísticas' }}
        />
        <Stack.Screen 
          name="Favorites" 
          component={FavoritesScreen} 
          options={{ title: '⭐ Mis Favoritos' }}
        />
        <Stack.Screen 
          name="StudySchedule" 
          component={StudyScheduleScreen} 
          options={{ title: '📅 Calendario de Estudio' }}
        />
        <Stack.Screen 
          name="ReviewWords" 
          component={ReviewWordsScreen} 
          options={{ title: '🔄 Palabras para Repasar' }}
        />
        {/* Tests Screens */}
        <Stack.Screen 
          name="TestsList" 
          component={TestsListScreen} 
          options={{ title: 'Tests de Vocabulario' }}
        />
        <Stack.Screen 
          name="AddTest" 
          component={AddTestScreen} 
          options={{ title: 'Añadir Test' }}
        />
        <Stack.Screen 
          name="ConfigureAnswers" 
          component={ConfigureAnswersScreen} 
          options={{ title: 'Configurar Respuestas' }}
        />
        <Stack.Screen 
          name="TakeTest" 
          component={TakeTestScreen} 
          options={{ title: 'Hacer Test' }}
        />
        <Stack.Screen 
          name="TestDetails" 
          component={TestDetailsScreen} 
          options={{ title: 'Detalles del Test' }}
        />
        <Stack.Screen 
          name="Results" 
          component={ResultsScreen} 
          options={{ title: 'Resultados' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: '⚙️ Configuración' }}
        />
        <Stack.Screen 
          name="DownloadDatasets" 
          component={DownloadDatasetsScreen} 
          options={{ title: '📦 Descargar Datasets' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Wrapper que usa el tema cargado para el fondo
function ThemedApp() {
  const { theme, isLoading } = useTheme();
  
  // Mientras carga, mostrar pantalla con el color del tema actual
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {!isLoading && <AppNavigator />}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
