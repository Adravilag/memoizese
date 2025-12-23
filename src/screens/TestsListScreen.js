import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTests, deleteTest, calculateTestStats, initializeDefaultTests } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import { ClipboardListIcon, TrashIcon, PlusIcon, CheckCircleIcon } from '../components/Icons';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// Icono de Play
const PlayIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M8 5v14l11-7z" />
  </Svg>
);

// Icono de Configurar
const SettingsIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

export default function TestsListScreen({ navigation }) {
  const { theme } = useTheme();
  const [tests, setTests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const loadTests = async () => {
    try {
      // Inicializar tests predeterminados si no existen
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
            try {
              await deleteTest(testId);
              loadTests();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el test');
            }
          },
        },
      ]
    );
  };

  const renderTestItem = ({ item }) => {
    const testStats = stats[item.id] || { attempts: 0, bestScore: 0 };
    const questionCount = item.questionCount || item.questions?.length || 0;
    const isConfigured = item.questions?.every(q => q.correctAnswer);
    
    return (
      <TouchableOpacity
        style={[styles.testCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => {
          if (isConfigured) {
            navigation.navigate('TakeTest', { testId: item.id });
          } else {
            navigation.navigate('ConfigureAnswers', { testId: item.id });
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: item.isDefault ? '#E91E63' : '#4A90D9' }]}>
            <ClipboardListIcon size={24} color="#fff" />
          </View>
          <View style={styles.titleContainer}>
            <Text style={[styles.testName, { color: theme.colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.testInfo, { color: theme.colors.textSecondary }]}>
              {questionCount} preguntas • {item.level || 'General'}
            </Text>
          </View>
          {!item.isDefault && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteTest(item.id, item.name)}
            >
              <TrashIcon size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        {item.description && (
          <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {testStats.attempts}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Intentos
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {testStats.bestScore}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Mejor
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FF9800' }]}>
              {Math.round(testStats.averageScore || 0)}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Promedio
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {isConfigured ? (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => navigation.navigate('TakeTest', { testId: item.id })}
            >
              <PlayIcon size={18} color="#fff" />
              <Text style={styles.buttonText}>Hacer Test</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: '#FF9800' }]}
              onPress={() => navigation.navigate('ConfigureAnswers', { testId: item.id })}
            >
              <SettingsIcon size={18} color="#fff" />
              <Text style={styles.buttonText}>Configurar</Text>
            </TouchableOpacity>
          )}
        </View>

        {isConfigured && (
          <View style={styles.configuredBadge}>
            <CheckCircleIcon size={14} color="#4CAF50" />
            <Text style={[styles.configuredText, { color: '#4CAF50' }]}>Listo</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <ClipboardListIcon size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No hay tests
      </Text>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        Añade tu primer test de vocabulario{'\n'}para evaluar tu nivel de inglés
      </Text>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddTest')}
      >
        <PlusIcon size={20} color="#fff" />
        <Text style={styles.addButtonText}>Añadir Test</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <FlatList
        data={tests}
        keyExtractor={(item) => item.id}
        renderItem={renderTestItem}
        contentContainerStyle={[
          styles.listContent,
          tests.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={!loading && renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
      
      {/* FAB para añadir test */}
      {tests.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('AddTest')}
        >
          <PlusIcon size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  testCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  testName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  testInfo: {
    fontSize: 13,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  description: {
    fontSize: 13,
    marginTop: 12,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    marginTop: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  configuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  configuredText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 24,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
