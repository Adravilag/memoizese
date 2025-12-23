import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getResults } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import { TrophyIcon, CheckCircleIcon, BooksIcon, MuscleIcon, ClipboardListIcon, ClipboardEditIcon, TimerIcon, XCircleIcon, ScoreResultIcon } from '../components/Icons';
import { HistoryScreenSkeleton } from '../components/Skeleton';

// Función auxiliar para obtener el color según la puntuación
const getScoreColor = (score, theme) => {
  if (score >= 70) return theme.colors.success;
  if (score >= 50) return theme.colors.warning;
  return theme.colors.error;
};

export default function HistoryScreen({ navigation }) {
  const { theme } = useTheme();
  const [results, setResults] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadResults = async () => {
    try {
      const allResults = await getResults();
      // Ordenar por fecha, más recientes primero
      const sorted = allResults.sort((a, b) => 
        new Date(b.completedAt) - new Date(a.completedAt)
      );
      setResults(sorted);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadResults();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResults();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Hoy, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleResultPress = (result) => {
    navigation.navigate('Results', { result });
  };

  const renderResultItem = ({ item, index }) => (
    <TouchableOpacity 
      style={[styles.resultCard, { backgroundColor: theme.colors.card }]}
      onPress={() => handleResultPress(item)}
    >
      <View style={styles.resultHeader}>
        <View style={styles.resultEmoji}>
          <ScoreResultIcon size={28} color={getScoreColor(item.score, theme)} />
        </View>
        <View style={styles.resultInfo}>
          <Text style={[styles.testName, { color: theme.colors.text }]} numberOfLines={1}>{item.testName}</Text>
          <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>{formatDate(item.completedAt)}</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: theme.colors.success }]}>
          <Text style={[styles.scoreText, { color: theme.colors.textInverse }]}>{item.score.toFixed(0)}%</Text>
        </View>
      </View>
      
      <View style={[styles.resultStats, { borderTopColor: theme.colors.borderLight }]}>
        <View style={styles.statItem}>
          <View style={styles.statIconRow}>
            <CheckCircleIcon size={14} color={theme.colors.success} />
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}> Correctas</Text>
          </View>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>{item.correct}</Text>
        </View>
        <View style={styles.statItem}>
          <View style={styles.statIconRow}>
            <XCircleIcon size={14} color={theme.colors.error} />
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}> Incorrectas</Text>
          </View>
          <Text style={[styles.statValue, { color: theme.colors.error }]}>{item.incorrect}</Text>
        </View>
        <View style={styles.statItem}>
          <View style={styles.statIconRow}>
            <TimerIcon size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}> Tiempo</Text>
          </View>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{formatTime(item.timeSpent)}</Text>
        </View>
        <View style={styles.statItem}>
          <View style={styles.statIconRow}>
            <ClipboardEditIcon size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}> Modo</Text>
          </View>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {item.mode === 'practice' ? 'Práctica' : 'Examen'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <ClipboardListIcon size={64} color={theme.colors.primary} style={styles.emptyIcon} />
      <Text style={[styles.emptyText, { color: theme.colors.text }]}>No hay resultados</Text>
      <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
        Completa tu primer test para ver el historial aquí
      </Text>
    </View>
  );

  // Agrupar por fecha
  const groupedResults = results.reduce((groups, result) => {
    const date = new Date(result.completedAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(result);
    return groups;
  }, {});

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HistoryScreenSkeleton />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Resumen rápido */}
      {results.length > 0 && (
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.colors.textInverse }]}>{results.length}</Text>
            <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.8)' }]}>Tests</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.colors.textInverse }]}>
              {(results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(0)}%
            </Text>
            <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.8)' }]}>Media</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
              {Math.max(...results.map(r => r.score)).toFixed(0)}%
            </Text>
            <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.8)' }]}>Mejor</Text>
          </View>
        </View>
      )}

      <FlatList
        data={results}
        renderItem={renderResultItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={results.length === 0 ? styles.emptyList : [styles.listContainer, { paddingBottom: 40 }]}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
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
  summaryCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  resultCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultEmoji: {
    marginRight: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    marginTop: 2,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
