import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import {
  getDecks,
  saveDeck,
  deleteDeck,
  getDeckStats,
  getStudyStats,
  initializeDefaultData,
  getFavoriteCards,
  resetDefaultDecks,
  getReviewWordsCount,
} from '../utils/storage';
import {
  PlusIcon,
  CardsIcon,
  ChartBarIcon,
  TrashIcon,
  PlayIcon,
  FireIcon,
  SettingsIcon,
  StarIcon,
  RefreshIcon,
  CalendarIcon,
  AlertCircleIcon,
} from '../components/Icons';

const DECK_COLORS = [
  '#4A90D9', '#E74C3C', '#27AE60', '#9B59B6', '#F39C12',
  '#1ABC9C', '#E91E63', '#3F51B5', '#FF5722', '#607D8B',
];

export default function DecksScreen({ navigation }) {
  const { theme, toggleTheme } = useTheme();
  const [decks, setDecks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(DECK_COLORS[0]);
  const [deckStats, setDeckStats] = useState({});
  const [globalStats, setGlobalStats] = useState({});
  const [totalDueCards, setTotalDueCards] = useState(0);
  const [todayCards, setTodayCards] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [reviewWordsCount, setReviewWordsCount] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);

  // Inicializar datos por defecto al cargar la app
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeDefaultData();
      } catch (error) {
        console.error('Error inicializando datos:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    initialize();
  }, []);

  const loadDecks = async () => {
    try {
      const loadedDecks = await getDecks();
      setDecks(loadedDecks);
      
      // Cargar estadísticas de cada mazo
      const stats = {};
      let totalDue = 0;
      let totalToday = 0;
      for (const deck of loadedDecks) {
        const deckStat = await getDeckStats(deck.id);
        stats[deck.id] = deckStat;
        totalDue += deckStat?.dueCards || 0;
        totalToday += deckStat?.todayCards || 0;
      }
      setDeckStats(stats);
      setTotalDueCards(totalDue);
      setTodayCards(totalToday);
      
      // Cargar estadísticas globales
      const gStats = await getStudyStats();
      setGlobalStats(gStats);

      // Cargar contador de favoritos
      const favs = await getFavoriteCards();
      setFavoritesCount(favs.length);

      // Cargar contador de palabras para repasar
      const reviewCount = await getReviewWordsCount();
      setReviewWordsCount(reviewCount);
    } catch (error) {
      console.error('Error cargando mazos:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!isInitializing) {
        loadDecks();
      }
    }, [isInitializing])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDecks();
    setRefreshing(false);
  };

  const handleResetDefaultDecks = () => {
    Alert.alert(
      'Actualizar Mazos',
      '¿Quieres restaurar/actualizar los mazos por defecto? Esto añadirá el nuevo contenido sin eliminar tus mazos personales.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Actualizar',
          onPress: async () => {
            try {
              await resetDefaultDecks();
              await loadDecks();
              Alert.alert('¡Listo!', 'Los mazos por defecto han sido actualizados.');
            } catch (error) {
              Alert.alert('Error', 'No se pudieron actualizar los mazos.');
            }
          },
        },
      ]
    );
  };

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) {
      Alert.alert('Error', 'El nombre del mazo es requerido');
      return;
    }

    try {
      await saveDeck({
        name: newDeckName.trim(),
        description: newDeckDescription.trim(),
        color: selectedColor,
      });
      setModalVisible(false);
      setNewDeckName('');
      setNewDeckDescription('');
      setSelectedColor(DECK_COLORS[0]);
      loadDecks();
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el mazo');
    }
  };

  const handleDeleteDeck = (deck) => {
    Alert.alert(
      'Eliminar Mazo',
      `¿Estás seguro de que quieres eliminar "${deck.name}"? Se eliminarán todas las tarjetas asociadas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDeck(deck.id);
              loadDecks();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el mazo');
            }
          },
        },
      ]
    );
  };

  const renderDeckItem = ({ item }) => {
    const stats = deckStats[item.id] || {};
    
    return (
      <TouchableOpacity
        style={[styles.deckCard, { backgroundColor: theme.colors.card }]}
        onPress={() => navigation.navigate('DeckDetail', { deckId: item.id })}
        activeOpacity={0.7}
      >
        <View style={[styles.deckColorBar, { backgroundColor: item.color }]} />
        <View style={styles.deckContent}>
          <View style={styles.deckHeader}>
            <Text style={[styles.deckName, { color: theme.colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <TouchableOpacity
              onPress={() => handleDeleteDeck(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <TrashIcon size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
          
          {item.description ? (
            <Text style={[styles.deckDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          
          <View style={styles.deckStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {stats.totalCards || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                Tarjetas
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#4ADE80' }]}>
                {stats.newCards || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                Nuevas
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#FBBF24' }]}>
                {stats.learningCards || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                Aprendiendo
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.error }]}>
                {stats.dueCards || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                Pendientes
              </Text>
            </View>
          </View>
          
          {stats.dueCards > 0 && (
            <TouchableOpacity
              style={[styles.studyButton, { backgroundColor: item.color }]}
              onPress={() => navigation.navigate('Study', { deckId: item.id })}
            >
              <PlayIcon size={16} color="#FFFFFF" />
              <Text style={styles.studyButtonText}>Estudiar ahora</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <CardsIcon size={80} color={theme.colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        ¡Bienvenido a Memoizese!
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Crea tu primer mazo de tarjetas para comenzar a aprender nuevas palabras
      </Text>
      <TouchableOpacity
        style={[styles.createFirstButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <PlusIcon size={20} color="#FFFFFF" />
        <Text style={styles.createFirstButtonText}>Crear mi primer mazo</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Stats */}
      <View style={[styles.headerStats, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerStatsRow}>
          <View style={styles.headerStatItem}>
            <FireIcon size={24} color="#FF6B6B" />
            <Text style={[styles.headerStatNumber, { color: theme.colors.text }]}>
              {globalStats.currentStreak || 0}
            </Text>
            <Text style={[styles.headerStatLabel, { color: theme.colors.textMuted }]}>
              Racha
            </Text>
          </View>
          <View style={styles.headerStatItem}>
            <CardsIcon size={24} color={theme.colors.primary} />
            <Text style={[styles.headerStatNumber, { color: theme.colors.text }]}>
              {todayCards}
            </Text>
            <Text style={[styles.headerStatLabel, { color: theme.colors.textMuted }]}>
              Para hoy
            </Text>
            {totalDueCards > todayCards && (
              <Text style={[styles.headerStatSub, { color: theme.colors.textMuted }]}>
                ({totalDueCards} total)
              </Text>
            )}
          </View>
          <View style={styles.headerStatItem}>
            <ChartBarIcon size={24} color="#27AE60" />
            <Text style={[styles.headerStatNumber, { color: theme.colors.text }]}>
              {globalStats.totalCardsStudied || 0}
            </Text>
            <Text style={[styles.headerStatLabel, { color: theme.colors.textMuted }]}>
              Total estudiadas
            </Text>
          </View>
        </View>
        
        {todayCards > 0 && (
          <TouchableOpacity
            style={[styles.studyAllButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Study', {})}
          >
            <PlayIcon size={20} color="#FFFFFF" />
            <Text style={styles.studyAllButtonText}>
              Estudiar hoy ({todayCards} tarjetas)
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de Mazos */}
      <FlatList
        data={decks}
        renderItem={renderDeckItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={decks.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />

      {/* Overlay para cerrar menú */}
      {fabMenuOpen && (
        <TouchableOpacity
          style={styles.fabOverlay}
          activeOpacity={1}
          onPress={() => setFabMenuOpen(false)}
        />
      )}

      {/* Botones FAB simplificados */}
      <View style={styles.fabContainer}>
        {/* Menú expandible */}
        {fabMenuOpen && (
          <View style={styles.fabMenu}>
            <TouchableOpacity
              style={[styles.fabMenuItem, { backgroundColor: theme.colors.surface }]}
              onPress={() => { navigation.navigate('ReviewWords'); setFabMenuOpen(false); }}
            >
              <AlertCircleIcon size={20} color="#FF9800" />
              <Text style={[styles.fabMenuText, { color: theme.colors.text }]}>Palabras difíciles</Text>
              {reviewWordsCount > 0 && (
                <View style={[styles.fabMenuBadge, { backgroundColor: '#FF9800' }]}>
                  <Text style={styles.fabMenuBadgeText}>{reviewWordsCount > 99 ? '99+' : reviewWordsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fabMenuItem, { backgroundColor: theme.colors.surface }]}
              onPress={() => { navigation.navigate('Favorites'); setFabMenuOpen(false); }}
            >
              <StarIcon size={20} color="#F1C40F" />
              <Text style={[styles.fabMenuText, { color: theme.colors.text }]}>Favoritos</Text>
              {favoritesCount > 0 && (
                <View style={[styles.fabMenuBadge, { backgroundColor: '#F1C40F' }]}>
                  <Text style={styles.fabMenuBadgeText}>{favoritesCount > 99 ? '99+' : favoritesCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fabMenuItem, { backgroundColor: theme.colors.surface }]}
              onPress={() => { navigation.navigate('StudySchedule'); setFabMenuOpen(false); }}
            >
              <CalendarIcon size={20} color="#E91E63" />
              <Text style={[styles.fabMenuText, { color: theme.colors.text }]}>Calendario</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fabMenuItem, { backgroundColor: theme.colors.surface }]}
              onPress={() => { navigation.navigate('Stats'); setFabMenuOpen(false); }}
            >
              <ChartBarIcon size={20} color={theme.colors.primary} />
              <Text style={[styles.fabMenuText, { color: theme.colors.text }]}>Estadísticas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fabMenuItem, { backgroundColor: theme.colors.surface }]}
              onPress={() => { toggleTheme(); setFabMenuOpen(false); }}
            >
              <SettingsIcon size={20} color="#9B59B6" />
              <Text style={[styles.fabMenuText, { color: theme.colors.text }]}>Cambiar tema</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fabMenuItem, { backgroundColor: theme.colors.surface }]}
              onPress={() => { handleResetDefaultDecks(); setFabMenuOpen(false); }}
            >
              <RefreshIcon size={20} color="#27AE60" />
              <Text style={[styles.fabMenuText, { color: theme.colors.text }]}>Restaurar mazos</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* FAB principal: Menú */}
        <TouchableOpacity
          style={[styles.fabSecondary, { backgroundColor: theme.colors.surface }]}
          onPress={() => setFabMenuOpen(!fabMenuOpen)}
        >
          <SettingsIcon size={22} color={theme.colors.primary} style={fabMenuOpen ? { transform: [{ rotate: '45deg' }] } : {}} />
        </TouchableOpacity>
        
        {/* FAB principal: Añadir */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <PlusIcon size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Modal para crear mazo */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Nuevo Mazo
            </Text>
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.inputBackground,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }]}
              placeholder="Nombre del mazo"
              placeholderTextColor={theme.colors.placeholder}
              value={newDeckName}
              onChangeText={setNewDeckName}
            />
            
            <TextInput
              style={[styles.input, styles.textArea, { 
                backgroundColor: theme.colors.inputBackground,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }]}
              placeholder="Descripción (opcional)"
              placeholderTextColor={theme.colors.placeholder}
              value={newDeckDescription}
              onChangeText={setNewDeckDescription}
              multiline
              numberOfLines={3}
            />
            
            <Text style={[styles.colorLabel, { color: theme.colors.textSecondary }]}>
              Color del mazo
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>
              {DECK_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleCreateDeck}
              >
                <Text style={styles.createButtonText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerStats: {
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  headerStatItem: {
    alignItems: 'center',
  },
  headerStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  headerStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  headerStatSub: {
    fontSize: 10,
    marginTop: 1,
    fontStyle: 'italic',
  },
  studyAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  studyAllButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
  },
  deckCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deckColorBar: {
    height: 6,
  },
  deckContent: {
    padding: 16,
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deckName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  deckDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  deckStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  studyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  studyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    alignItems: 'flex-end',
  },
  fabOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  fabMenu: {
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabMenuText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  fabMenuBadge: {
    marginLeft: 8,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  fabMenuBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  fabBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  colorLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  colorPicker: {
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  createButton: {
    marginLeft: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
