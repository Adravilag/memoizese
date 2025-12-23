import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTests, deleteTest, isTestConfigured, calculateTestStats, initializeDefaultTests } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import { BooksIcon, SunIcon, MoonIcon, ClipboardListIcon, ChartBarIcon } from '../components/Icons';
import { HomeScreenSkeleton } from '../components/Skeleton';

export default function HomeScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [tests, setTests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const loadTests = async () => {
    try {
      // Inicializar tests por defecto si es necesario
      await initializeDefaultTests();
      
      const loadedTests = await getTests();
      setTests(loadedTests);
      
      // Cargar estadísticas para cada test
      const statsObj = {};
      for (const test of loadedTests) {
        statsObj[test.id] = await calculateTestStats(test.id);
      }
      setStats(statsObj);
    } catch (error) {
      console.error('Error cargando tests:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTests();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTests();
    setRefreshing(false);
  };

  const handleDeleteTest = (testId, testName) => {
    Alert.alert(
      'Eliminar Test',
      `¿Estás seguro de que quieres eliminar "${testName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteTest(testId);
            loadTests();
          }
        }
      ]
    );
  };

  const handleTestPress = (test) => {
    const configured = isTestConfigured(test);
    
    if (!configured) {
      Alert.alert(
        'Test sin configurar',
        'Este test aún no tiene las respuestas correctas configuradas. ¿Qué deseas hacer?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Configurar',
            onPress: () => navigation.navigate('ConfigureAnswers', { testId: test.id })
          }
        ]
      );
    } else {
      navigation.navigate('TestDetails', { testId: test.id });
    }
  };

  const renderTestItem = ({ item }) => {
    const configured = isTestConfigured(item);
    const testStats = stats[item.id] || { attempts: 0, bestScore: 0 };
    
    return (
      <TouchableOpacity
        style={[
          styles.testCard, 
          { backgroundColor: theme.colors.card },
          !configured && [styles.testCardUnconfigured, { borderLeftColor: theme.colors.warning }]
        ]}
        onPress={() => handleTestPress(item)}
        onLongPress={() => handleDeleteTest(item.id, item.name)}
      >
        <View style={styles.testHeader}>
          <Text style={[styles.testName, { color: theme.colors.text }]}>{item.name}</Text>
          {!configured && (
            <View style={[styles.badge, { backgroundColor: theme.colors.warning }]}>
              <Text style={[styles.badgeText, { color: theme.colors.textInverse }]}>Sin configurar</Text>
            </View>
          )}
        </View>
        
        <Text style={[styles.testInfo, { color: theme.colors.textSecondary }]}>
          {item.questions?.length || 0} preguntas
        </Text>
        
        {configured && testStats.attempts > 0 && (
          <View style={[styles.statsRow, { borderTopColor: theme.colors.borderLight }]}>
            <Text style={[styles.statsText, { color: theme.colors.primary }]}>
              Intentos: {testStats.attempts} | Mejor: {testStats.bestScore.toFixed(1)}%
            </Text>
          </View>
        )}
        
        <Text style={[styles.testDate, { color: theme.colors.textMuted }]}>
          Creado: {new Date(item.createdAt).toLocaleDateString('es-ES')}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {loading ? (
        <HomeScreenSkeleton />
      ) : tests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BooksIcon size={64} color={theme.colors.primary} style={styles.emptyIcon} />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>No tienes tests guardados</Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
            Pulsa el botón + para añadir tu primer test de oposiciones
          </Text>
        </View>
      ) : (
        <FlatList
          data={tests}
          renderItem={renderTestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      
      {/* Botón de tema */}
      <TouchableOpacity
        style={[styles.fabTheme, { backgroundColor: isDark ? theme.colors.fabThemeDark : theme.colors.fabThemeLight, bottom: 210 + insets.bottom }]}
        onPress={toggleTheme}
      >
        {isDark ? <SunIcon size={24} color={theme.colors.fabThemeIcon} /> : <MoonIcon size={24} color={theme.colors.fabThemeIcon} />}
      </TouchableOpacity>
      
      {/* Botón de historial */}
      <TouchableOpacity
        style={[styles.fabHistory, { backgroundColor: theme.colors.primary, bottom: 150 + insets.bottom }]}
        onPress={() => navigation.navigate('History')}
      >
        <ClipboardListIcon size={24} color={theme.colors.textInverse} />
      </TouchableOpacity>
      
      {/* Botón de estadísticas */}
      <TouchableOpacity
        style={[styles.fabStats, { backgroundColor: theme.colors.success, bottom: 90 + insets.bottom }]}
        onPress={() => navigation.navigate('Stats')}
      >
        <ChartBarIcon size={24} color={theme.colors.textInverse} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: 20 + insets.bottom }]}
        onPress={() => navigation.navigate('AddTest')}
      >
        <Text style={[styles.fabText, { color: theme.colors.textInverse }]}>+</Text>
      </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 200,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
  },
  testCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testCardUnconfigured: {
    borderLeftWidth: 4,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  testInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
  statsRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  statsText: {
    fontSize: 13,
    fontWeight: '500',
  },
  testDate: {
    fontSize: 12,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
  fabStats: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabStatsText: {
    fontSize: 24,
  },
  fabHistory: {
    position: 'absolute',
    right: 20,
    bottom: 150,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabHistoryText: {
    fontSize: 24,
  },
  fabTheme: {
    position: 'absolute',
    right: 20,
    bottom: 210,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabThemeText: {
    fontSize: 24,
  },
});
