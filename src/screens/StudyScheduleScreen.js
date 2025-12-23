import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getDecks } from '../utils/storage';

const { width } = Dimensions.get('window');

// Configuración del calendario de estudio - 4 semanas, 5 días cada una
// Total: 20 temas distribuidos
const STUDY_SCHEDULE = {
  // Semana 1
  week1: {
    monday: { topicId: 'topic_clothes', name: '👕 Ropa y Accesorios', color: '#E91E63' },
    tuesday: { topicId: 'topic_colours', name: '🎨 Colores', color: '#9C27B0' },
    wednesday: { topicId: 'topic_technology', name: '📱 Tecnología', color: '#2196F3' },
    thursday: { topicId: 'topic_education', name: '📚 Educación', color: '#FF9800' },
    friday: { topicId: 'topic_entertainment', name: '🎬 Entretenimiento', color: '#F44336' },
  },
  // Semana 2
  week2: {
    monday: { topicId: 'topic_environment', name: '🌍 Medio Ambiente', color: '#4CAF50' },
    tuesday: { topicId: 'topic_food', name: '🍽️ Comida y Bebida', color: '#FF5722' },
    wednesday: { topicId: 'topic_health', name: '💊 Salud y Ejercicio', color: '#00BCD4' },
    thursday: { topicId: 'topic_hobbies', name: '🎨 Hobbies y Ocio', color: '#673AB7' },
    friday: { topicId: 'topic_house', name: '🏠 Casa y Hogar', color: '#795548' },
  },
  // Semana 3
  week3: {
    monday: { topicId: 'topic_language', name: '🗣️ Idiomas', color: '#607D8B' },
    tuesday: { topicId: 'topic_feelings', name: '😊 Sentimientos', color: '#E91E63' },
    wednesday: { topicId: 'topic_places', name: '🏛️ Lugares', color: '#3F51B5' },
    thursday: { topicId: 'topic_city', name: '🏙️ Ciudad y Servicios', color: '#9E9E9E' },
    friday: { topicId: 'topic_shopping', name: '🛒 Compras', color: '#FFEB3B' },
  },
  // Semana 4
  week4: {
    monday: { topicId: 'topic_sport', name: '⚽ Deportes', color: '#8BC34A' },
    tuesday: { topicId: 'topic_nature', name: '🌿 Naturaleza', color: '#009688' },
    wednesday: { topicId: 'topic_time', name: '⏰ Tiempo', color: '#FF9800' },
    thursday: { topicId: 'topic_travel', name: '✈️ Viajes', color: '#03A9F4' },
    friday: { topicId: 'topic_weather', name: '☀️ Clima', color: '#FFC107' },
  },
};

// Tema adicional para repasos (sábado/domingo opcional)
const WEEKEND_TOPIC = { topicId: 'topic_work', name: '💼 Trabajo', color: '#455A64' };

const DAYS_ES = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
};

const WEEKS_ES = {
  week1: 'Semana 1',
  week2: 'Semana 2',
  week3: 'Semana 3',
  week4: 'Semana 4',
};

// Función para obtener la semana del ciclo (1-4)
const getCurrentCycleWeek = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return ((weekNumber - 1) % 4) + 1; // Ciclo de 4 semanas
};

// Función para obtener el día actual de la semana
const getCurrentDayOfWeek = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
};

export default function StudyScheduleScreen({ navigation }) {
  const { theme } = useTheme();
  const currentWeek = getCurrentCycleWeek();
  const [decks, setDecks] = useState([]);
  const [todayTopic, setTodayTopic] = useState(null);

  const currentDay = getCurrentDayOfWeek();
  const isWeekend = currentDay === 'saturday' || currentDay === 'sunday';

  useEffect(() => {
    loadDecks();
    calculateTodayTopic();
  }, []);

  const loadDecks = async () => {
    try {
      const allDecks = await getDecks();
      setDecks(allDecks);
    } catch (error) {
      console.error('Error loading decks:', error);
    }
  };

  const calculateTodayTopic = () => {
    const week = `week${getCurrentCycleWeek()}`;
    const day = getCurrentDayOfWeek();
    
    if (isWeekend) {
      setTodayTopic(WEEKEND_TOPIC);
    } else if (STUDY_SCHEDULE[week]?.[day]) {
      setTodayTopic(STUDY_SCHEDULE[week][day]);
    }
  };

  const handleStudyTopic = useCallback((topicId, topicName) => {
    const deck = decks.find(d => d.id === topicId);
    if (deck) {
      navigation.navigate('Study', { 
        deckId: topicId, 
        deckName: topicName 
      });
    } else {
      Alert.alert(
        'Mazo no encontrado',
        'Este mazo de vocabulario no está disponible. Por favor, restablece los mazos por defecto.',
        [{ text: 'OK' }]
      );
    }
  }, [decks, navigation]);

  const handleViewDeck = useCallback((topicId, topicName) => {
    const deck = decks.find(d => d.id === topicId);
    if (deck) {
      navigation.navigate('DeckDetail', { 
        deckId: topicId,
      });
    }
  }, [decks, navigation]);

  const renderDayCard = (day, topic, isToday) => {
    const dayName = DAYS_ES[day];
    
    return (
      <TouchableOpacity
        key={day}
        style={[
          styles.dayCard,
          { 
            backgroundColor: theme.colors.surface,
            borderColor: isToday ? topic.color : theme.colors.border,
            borderWidth: isToday ? 3 : 1,
          }
        ]}
        onPress={() => handleStudyTopic(topic.topicId, topic.name)}
        onLongPress={() => handleViewDeck(topic.topicId, topic.name)}
      >
        <View style={[styles.dayHeader, { backgroundColor: topic.color }]}>
          <Text style={styles.dayName}>{dayName}</Text>
          {isToday && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>HOY</Text>
            </View>
          )}
        </View>
        <View style={styles.topicContent}>
          <Text style={[styles.topicName, { color: theme.colors.text }]}>
            {topic.name}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: topic.color }]}
              onPress={() => handleStudyTopic(topic.topicId, topic.name)}
            >
              <MaterialIcons name="play-arrow" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Estudiar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderWeek = (weekKey) => {
    const weekData = STUDY_SCHEDULE[weekKey];
    const isCurrentWeek = weekKey === `week${currentWeek}`;
    
    return (
      <View key={weekKey} style={styles.weekContainer}>
        <View style={[
          styles.weekHeader,
          { 
            backgroundColor: isCurrentWeek ? theme.colors.primary : theme.colors.surface,
            borderColor: theme.colors.border,
          }
        ]}>
          <Text style={[
            styles.weekTitle,
            { color: isCurrentWeek ? '#fff' : theme.colors.text }
          ]}>
            {WEEKS_ES[weekKey]}
            {isCurrentWeek && ' (Actual)'}
          </Text>
        </View>
        <View style={styles.daysContainer}>
          {Object.entries(weekData).map(([day, topic]) => {
            const isToday = isCurrentWeek && day === currentDay && !isWeekend;
            return renderDayCard(day, topic, isToday);
          })}
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 20,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    todaySection: {
      margin: 16,
      padding: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: todayTopic?.color || theme.colors.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    todaySectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    todayTopicName: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    studyNowButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      gap: 8,
    },
    studyNowButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    weekendMessage: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },
    weekendText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    scrollContent: {
      paddingBottom: 40,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginHorizontal: 16,
      marginTop: 24,
      marginBottom: 12,
    },
    weekContainer: {
      marginHorizontal: 16,
      marginBottom: 20,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    weekHeader: {
      padding: 12,
      borderBottomWidth: 1,
    },
    weekTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    daysContainer: {
      backgroundColor: theme.colors.background,
    },
    dayCard: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    dayName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#fff',
      textTransform: 'uppercase',
    },
    todayBadge: {
      backgroundColor: '#fff',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    todayBadgeText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#333',
    },
    topicContent: {
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    topicName: {
      fontSize: 15,
      fontWeight: '500',
      flex: 1,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      gap: 4,
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    infoCard: {
      margin: 16,
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📅 Calendario de Estudio</Text>
          <Text style={styles.headerSubtitle}>
            Un tema diferente cada día. Ciclo de 4 semanas con 20 temas de vocabulario.
          </Text>
        </View>

        {/* Today's Topic */}
        {todayTopic && (
          <View style={styles.todaySection}>
            <Text style={styles.todaySectionTitle}>
              {isWeekend ? '🎉 Fin de semana - Repaso opcional' : '📖 Tema de hoy'}
            </Text>
            <Text style={styles.todayTopicName}>{todayTopic.name}</Text>
            
            <TouchableOpacity
              style={[styles.studyNowButton, { backgroundColor: todayTopic.color }]}
              onPress={() => handleStudyTopic(todayTopic.topicId, todayTopic.name)}
            >
              <MaterialIcons name="play-circle-filled" size={24} color="#fff" />
              <Text style={styles.studyNowButtonText}>
                {isWeekend ? 'Repasar ahora' : '¡Estudiar ahora!'}
              </Text>
            </TouchableOpacity>

            {isWeekend && (
              <View style={styles.weekendMessage}>
                <MaterialIcons name="info-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.weekendText}>
                  El fin de semana es para repasar o descansar
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 ¿Cómo funciona?</Text>
          <Text style={styles.infoText}>
            • Cada día de lunes a viernes tiene un tema asignado{'\n'}
            • El ciclo se repite cada 4 semanas{'\n'}
            • Toca en cualquier día para estudiar ese tema{'\n'}
            • Mantén presionado para ver las tarjetas del mazo{'\n'}
            • Estás en la Semana {currentWeek} del ciclo
          </Text>
        </View>

        {/* Schedule Title */}
        <Text style={styles.sectionTitle}>📋 Programa completo</Text>

        {/* All Weeks */}
        {Object.keys(STUDY_SCHEDULE).map(weekKey => renderWeek(weekKey))}

      </ScrollView>
    </View>
  );
}
