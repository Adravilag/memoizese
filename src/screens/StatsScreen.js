import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getStudyStats, getDecks, getDeckStats } from '../utils/storage';
import {
  FireIcon,
  TrophyIcon,
  ClockIcon,
  CardsIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '../components/Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StatsScreen({ navigation }) {
  const { theme } = useTheme();
  const [stats, setStats] = useState({});
  const [decks, setDecks] = useState([]);
  const [deckStats, setDeckStats] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyData, setWeeklyData] = useState([]);

  const loadStats = async () => {
    try {
      const globalStats = await getStudyStats();
      setStats(globalStats);
      
      const loadedDecks = await getDecks();
      setDecks(loadedDecks);
      
      const dStats = {};
      for (const deck of loadedDecks) {
        dStats[deck.id] = await getDeckStats(deck.id);
      }
      setDeckStats(dStats);
      
      // Calcular datos de la semana
      const sessions = globalStats.sessions || [];
      const weekData = calculateWeeklyData(sessions);
      setWeeklyData(weekData);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const calculateWeeklyData = (sessions) => {
    const today = new Date();
    const days = [];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      const daySession = sessions.filter(s => {
        const sessionDate = new Date(s.date).toDateString();
        return sessionDate === dateStr;
      });
      
      const cardsStudied = daySession.reduce((sum, s) => sum + (s.cardsStudied || 0), 0);
      
      days.push({
        day: dayNames[date.getDay()],
        cards: cardsStudied,
        isToday: i === 0,
      });
    }
    
    return days;
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const accuracy = stats.totalCardsStudied > 0
    ? Math.round((stats.totalCorrect / stats.totalCardsStudied) * 100)
    : 0;

  const maxWeeklyCards = Math.max(...weeklyData.map(d => d.cards), 1);

  const StatCard = ({ icon, value, label, color }) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.statIconBg, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Header con Racha */}
      <View style={[styles.streakCard, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.streakContent}>
          <FireIcon size={50} color="#FFFFFF" />
          <View style={styles.streakInfo}>
            <Text style={styles.streakNumber}>{stats.currentStreak || 0}</Text>
            <Text style={styles.streakLabel}>días de racha</Text>
          </View>
        </View>
        <View style={styles.streakDivider} />
        <View style={styles.streakSecondary}>
          <TrophyIcon size={24} color="rgba(255,255,255,0.9)" />
          <Text style={styles.streakSecondaryText}>
            Mejor racha: {stats.longestStreak || 0} días
          </Text>
        </View>
      </View>

      {/* Estadísticas Principales */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Resumen General
      </Text>
      <View style={styles.statsGrid}>
        <StatCard
          icon={<CardsIcon size={24} color={theme.colors.primary} />}
          value={stats.totalCardsStudied || 0}
          label="Tarjetas estudiadas"
          color={theme.colors.primary}
        />
        <StatCard
          icon={<CheckCircleIcon size={24} color="#22C55E" />}
          value={stats.totalCorrect || 0}
          label="Respuestas correctas"
          color="#22C55E"
        />
        <StatCard
          icon={<XCircleIcon size={24} color="#EF4444" />}
          value={stats.totalIncorrect || 0}
          label="Respuestas incorrectas"
          color="#EF4444"
        />
        <StatCard
          icon={<ClockIcon size={24} color="#F59E0B" />}
          value={`${stats.totalTimeMinutes || 0}m`}
          label="Tiempo de estudio"
          color="#F59E0B"
        />
      </View>

      {/* Precisión */}
      <View style={[styles.accuracyCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.accuracyTitle, { color: theme.colors.text }]}>
          Precisión General
        </Text>
        <View style={styles.accuracyContent}>
          <View style={[styles.accuracyCircle, { borderColor: theme.colors.primary }]}>
            <Text style={[styles.accuracyValue, { color: theme.colors.primary }]}>
              {accuracy}%
            </Text>
          </View>
          <View style={styles.accuracyBar}>
            <View
              style={[styles.accuracyFill, { 
                width: `${accuracy}%`,
                backgroundColor: accuracy >= 70 ? '#22C55E' : accuracy >= 50 ? '#F59E0B' : '#EF4444'
              }]}
            />
          </View>
        </View>
      </View>

      {/* Gráfico Semanal */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Actividad Semanal
      </Text>
      <View style={[styles.weeklyCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.weeklyChart}>
          {weeklyData.map((day, index) => (
            <View key={index} style={styles.weeklyBar}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${(day.cards / maxWeeklyCards) * 100}%`,
                      backgroundColor: day.isToday ? theme.colors.primary : theme.colors.primary + '60',
                      minHeight: day.cards > 0 ? 10 : 2,
                    },
                  ]}
                />
              </View>
              <Text style={[
                styles.barLabel,
                { 
                  color: day.isToday ? theme.colors.primary : theme.colors.textMuted,
                  fontWeight: day.isToday ? 'bold' : 'normal',
                }
              ]}>
                {day.day}
              </Text>
              <Text style={[styles.barValue, { color: theme.colors.textSecondary }]}>
                {day.cards}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Estadísticas por Mazo */}
      {decks.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Por Mazo
          </Text>
          {decks.map((deck) => {
            const ds = deckStats[deck.id] || {};
            return (
              <View
                key={deck.id}
                style={[styles.deckStatCard, { backgroundColor: theme.colors.surface }]}
              >
                <View style={[styles.deckColorBar, { backgroundColor: deck.color }]} />
                <View style={styles.deckStatContent}>
                  <Text style={[styles.deckName, { color: theme.colors.text }]}>
                    {deck.name}
                  </Text>
                  <View style={styles.deckStatRow}>
                    <View style={styles.deckStatItem}>
                      <Text style={[styles.deckStatValue, { color: theme.colors.primary }]}>
                        {ds.totalCards || 0}
                      </Text>
                      <Text style={[styles.deckStatLabel, { color: theme.colors.textMuted }]}>
                        Total
                      </Text>
                    </View>
                    <View style={styles.deckStatItem}>
                      <Text style={[styles.deckStatValue, { color: '#4ADE80' }]}>
                        {ds.newCards || 0}
                      </Text>
                      <Text style={[styles.deckStatLabel, { color: theme.colors.textMuted }]}>
                        Nuevas
                      </Text>
                    </View>
                    <View style={styles.deckStatItem}>
                      <Text style={[styles.deckStatValue, { color: '#FBBF24' }]}>
                        {ds.learningCards || 0}
                      </Text>
                      <Text style={[styles.deckStatLabel, { color: theme.colors.textMuted }]}>
                        Aprendiendo
                      </Text>
                    </View>
                    <View style={styles.deckStatItem}>
                      <Text style={[styles.deckStatValue, { color: '#60A5FA' }]}>
                        {ds.matureCards || 0}
                      </Text>
                      <Text style={[styles.deckStatLabel, { color: theme.colors.textMuted }]}>
                        Maduras
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  streakCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakInfo: {
    marginLeft: 16,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  streakDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 16,
  },
  streakSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakSecondaryText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    margin: 6,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  accuracyCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  accuracyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  accuracyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accuracyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  accuracyValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  accuracyBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  accuracyFill: {
    height: '100%',
    borderRadius: 6,
  },
  weeklyCard: {
    borderRadius: 16,
    padding: 20,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 150,
  },
  weeklyBar: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    width: 24,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 12,
  },
  barValue: {
    fontSize: 10,
    marginTop: 2,
  },
  deckStatCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  deckColorBar: {
    height: 4,
  },
  deckStatContent: {
    padding: 16,
  },
  deckName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  deckStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deckStatItem: {
    alignItems: 'center',
  },
  deckStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  deckStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  bottomPadding: {
    height: 40,
  },
});
