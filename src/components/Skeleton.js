import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * Componente Skeleton base con animación de pulso
 */
export function Skeleton({ width, height, borderRadius = 4, style }) {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton para tarjetas de test en HomeScreen
 */
export function TestCardSkeleton() {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.testCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.testCardHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.testCardContent}>
          <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={14} />
        </View>
      </View>
      <View style={styles.testCardStats}>
        <Skeleton width={60} height={24} borderRadius={12} />
        <Skeleton width={80} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

/**
 * Skeleton para items del historial
 */
export function HistoryItemSkeleton() {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.historyCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.historyHeader}>
        <Skeleton width={36} height={36} borderRadius={18} />
        <View style={styles.historyContent}>
          <Skeleton width="60%" height={16} style={{ marginBottom: 6 }} />
          <Skeleton width="35%" height={12} />
        </View>
        <Skeleton width={50} height={28} borderRadius={14} />
      </View>
      <View style={[styles.historyStats, { borderTopColor: theme.colors.border }]}>
        <Skeleton width={70} height={14} />
        <Skeleton width={70} height={14} />
        <Skeleton width={70} height={14} />
      </View>
    </View>
  );
}

/**
 * Skeleton para las estadísticas
 */
export function StatsCardSkeleton() {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.statsSection, { backgroundColor: theme.colors.card }]}>
      <View style={styles.statsSectionHeader}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width={100} height={20} style={{ marginLeft: 8 }} />
      </View>
      <View style={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
            <Skeleton width={50} height={28} style={{ marginBottom: 4 }} />
            <Skeleton width={60} height={14} />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Skeleton para gráfico de barras
 */
export function ChartSkeleton() {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.chartSection, { backgroundColor: theme.colors.card }]}>
      <View style={styles.statsSectionHeader}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width={140} height={20} style={{ marginLeft: 8 }} />
      </View>
      <View style={styles.chartBars}>
        {[40, 70, 55, 85, 60, 90, 45].map((height, i) => (
          <View key={i} style={styles.chartBarContainer}>
            <Skeleton width={28} height={height} borderRadius={4} />
            <Skeleton width={20} height={12} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Skeleton para detalles del test
 */
export function TestDetailsSkeleton() {
  const { theme } = useTheme();
  
  return (
    <View style={styles.testDetails}>
      {/* Header */}
      <View style={[styles.detailsHeader, { backgroundColor: theme.colors.card }]}>
        <Skeleton width="80%" height={24} style={{ marginBottom: 12 }} />
        <View style={styles.detailsRow}>
          <Skeleton width={100} height={16} />
          <Skeleton width={80} height={16} />
        </View>
      </View>
      
      {/* Stats */}
      <View style={[styles.detailsStats, { backgroundColor: theme.colors.card }]}>
        <Skeleton width={120} height={18} style={{ marginBottom: 16 }} />
        <View style={styles.detailsStatsGrid}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.detailsStatItem}>
              <Skeleton width={40} height={32} style={{ marginBottom: 4 }} />
              <Skeleton width={60} height={14} />
            </View>
          ))}
        </View>
      </View>
      
      {/* Buttons */}
      <View style={styles.detailsButtons}>
        <Skeleton width="100%" height={50} borderRadius={12} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={50} borderRadius={12} />
      </View>
    </View>
  );
}

/**
 * Lista de skeletons para HomeScreen
 */
export function HomeScreenSkeleton() {
  return (
    <View style={styles.listContainer}>
      {[1, 2, 3, 4].map((i) => (
        <TestCardSkeleton key={i} />
      ))}
    </View>
  );
}

/**
 * Lista de skeletons para HistoryScreen
 */
export function HistoryScreenSkeleton() {
  return (
    <View style={styles.listContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <HistoryItemSkeleton key={i} />
      ))}
    </View>
  );
}

/**
 * Skeletons para StatsScreen
 */
export function StatsScreenSkeleton() {
  return (
    <View style={styles.listContainer}>
      <StatsCardSkeleton />
      <StatsCardSkeleton />
      <ChartSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  listContainer: {
    padding: 16,
  },
  // Test Card
  testCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  testCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  testCardContent: {
    flex: 1,
    marginLeft: 12,
  },
  testCardStats: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  // History Card
  historyCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyContent: {
    flex: 1,
    marginLeft: 12,
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  // Stats Section
  statsSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  statsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  // Chart
  chartSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    marginTop: 16,
  },
  chartBarContainer: {
    alignItems: 'center',
  },
  // Test Details
  testDetails: {
    padding: 16,
  },
  detailsHeader: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailsStats: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailsStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailsStatItem: {
    alignItems: 'center',
  },
  detailsButtons: {
    marginTop: 8,
  },
});
