import React, { useState, useEffect, useCallback } from 'react';
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
  getDeckById,
  getCardsByDeck,
  saveCard,
  deleteCard,
  updateCard,
  getDeckStats,
  CAMBRIDGE_LEVELS,
  LEVEL_OPTIONS,
  toggleCardDiscarded,
  getDiscardedCards,
  restoreAllDiscardedCards,
} from '../utils/storage';
import {
  PlusIcon,
  CardsIcon,
  TrashIcon,
  EditIcon,
  PlayIcon,
  SearchIcon,
  ArchiveIcon,
  RefreshIcon,
} from '../components/Icons';

export default function DeckDetailScreen({ route, navigation }) {
  const { deckId } = route.params;
  const { theme } = useTheme();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [example, setExample] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [editingCard, setEditingCard] = useState(null);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFlipped, setShowFlipped] = useState({});
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [levelFilter, setLevelFilter] = useState(null);
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [discardedCards, setDiscardedCards] = useState([]);

  const loadData = async () => {
    try {
      const loadedDeck = await getDeckById(deckId);
      setDeck(loadedDeck);
      
      const loadedCards = await getCardsByDeck(deckId, false);
      setCards(loadedCards);
      setFilteredCards(loadedCards);
      
      // Cargar también las descartadas
      const loadedDiscarded = await getDiscardedCards(deckId);
      setDiscardedCards(loadedDiscarded);
      
      const loadedStats = await getDeckStats(deckId);
      setStats(loadedStats);
      
      navigation.setOptions({
        title: loadedDeck?.name || 'Mazo',
        headerStyle: {
          backgroundColor: loadedDeck?.color || theme.colors.primary,
        },
      });
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [deckId])
  );

  useEffect(() => {
    let filtered = cards;
    
    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (card) =>
          card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.back.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filtrar por nivel
    if (levelFilter) {
      filtered = filtered.filter((card) => card.level === levelFilter);
    }
    
    setFilteredCards(filtered);
  }, [searchQuery, cards, levelFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddCard = async () => {
    if (!front.trim() || !back.trim()) {
      Alert.alert('Error', 'El frente y el reverso de la tarjeta son requeridos');
      return;
    }

    try {
      await saveCard({
        deckId,
        front: front.trim(),
        back: back.trim(),
        example: example.trim(),
        pronunciation: pronunciation.trim(),
        level: selectedLevel,
      });
      setModalVisible(false);
      setFront('');
      setBack('');
      setExample('');
      setPronunciation('');
      setSelectedLevel(null);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la tarjeta');
    }
  };

  const handleEditCard = (card) => {
    setEditingCard(card);
    setFront(card.front);
    setBack(card.back);
    setExample(card.example || '');
    setPronunciation(card.pronunciation || '');
    setSelectedLevel(card.level || null);
    setEditModalVisible(true);
  };

  const handleUpdateCard = async () => {
    if (!front.trim() || !back.trim()) {
      Alert.alert('Error', 'El frente y el reverso de la tarjeta son requeridos');
      return;
    }

    try {
      await updateCard(editingCard.id, {
        front: front.trim(),
        back: back.trim(),
        example: example.trim(),
        pronunciation: pronunciation.trim(),
        level: selectedLevel,
      });
      setEditModalVisible(false);
      setEditingCard(null);
      setFront('');
      setBack('');
      setExample('');
      setPronunciation('');
      setSelectedLevel(null);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la tarjeta');
    }
  };

  const handleDeleteCard = (card) => {
    Alert.alert(
      'Eliminar Tarjeta',
      '¿Estás seguro de que quieres eliminar esta tarjeta permanentemente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCard(card.id);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la tarjeta');
            }
          },
        },
      ]
    );
  };

  const handleDiscardCard = async (card) => {
    try {
      await toggleCardDiscarded(card.id);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'No se pudo descartar la tarjeta');
    }
  };

  const handleRestoreAllDiscarded = () => {
    Alert.alert(
      'Restaurar Tarjetas',
      `¿Restaurar las ${discardedCards.length} tarjetas descartadas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          onPress: async () => {
            try {
              await restoreAllDiscardedCards(deckId);
              setShowDiscarded(false);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'No se pudieron restaurar las tarjetas');
            }
          },
        },
      ]
    );
  };

  const toggleCardFlip = (cardId) => {
    setShowFlipped((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const getCardStatus = (card) => {
    if (card.repetitions === 0) return { label: 'Nueva', color: '#4ADE80' };
    if (card.interval < 21) return { label: 'Aprendiendo', color: '#FBBF24' };
    return { label: 'Madura', color: '#60A5FA' };
  };

  const renderCardItem = ({ item }) => {
    const isFlipped = showFlipped[item.id];
    const status = getCardStatus(item);
    const nextReview = new Date(item.nextReview);
    const isdue = nextReview <= new Date();
    const levelInfo = item.level ? CAMBRIDGE_LEVELS[item.level] : null;

    return (
      <TouchableOpacity
        style={[styles.cardItem, { backgroundColor: theme.colors.card }]}
        onPress={() => toggleCardFlip(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardBadges}>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
            {levelInfo && (
              <View style={[styles.levelBadge, { backgroundColor: levelInfo.color + '20' }]}>
                <Text style={[styles.levelText, { color: levelInfo.color }]}>{levelInfo.label}</Text>
              </View>
            )}
          </View>
          {isdue && (
            <View style={[styles.dueBadge, { backgroundColor: theme.colors.error + '20' }]}>
              <Text style={[styles.dueText, { color: theme.colors.error }]}>Pendiente</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.cardLabel, { color: theme.colors.textMuted }]}>
            {isFlipped ? 'Reverso' : 'Frente'}
          </Text>
          <Text style={[styles.cardText, { color: theme.colors.text }]}>
            {isFlipped ? item.back : item.front}
          </Text>
          {!isFlipped && item.pronunciation && (
            <Text style={[styles.pronunciationText, { color: theme.colors.primary }]}>
              {item.pronunciation}
            </Text>
          )}
          {isFlipped && item.example && (
            <View style={[styles.exampleContainer, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.exampleLabel, { color: theme.colors.textMuted }]}>Ejemplo:</Text>
              <Text style={[styles.exampleText, { color: theme.colors.textSecondary }]}>
                {item.example}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <Text style={[styles.tapHint, { color: theme.colors.textMuted }]}>
            Toca para {isFlipped ? 'ver frente' : 'voltear'}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
              onPress={() => handleEditCard(item)}
            >
              <EditIcon size={18} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
              onPress={() => handleDiscardCard(item)}
            >
              <ArchiveIcon size={18} color="#F59E0B" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
              onPress={() => handleDeleteCard(item)}
            >
              <TrashIcon size={18} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Renderizar tarjeta descartada (con opción de restaurar)
  const renderDiscardedCard = ({ item }) => {
    const levelInfo = item.level ? CAMBRIDGE_LEVELS[item.level] : null;

    return (
      <View style={[styles.cardItem, styles.discardedCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardBadges}>
            <View style={[styles.statusBadge, { backgroundColor: '#F59E0B20' }]}>
              <Text style={[styles.statusText, { color: '#F59E0B' }]}>Descartada</Text>
            </View>
            {levelInfo && (
              <View style={[styles.levelBadge, { backgroundColor: levelInfo.color + '20' }]}>
                <Text style={[styles.levelText, { color: levelInfo.color }]}>{levelInfo.label}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.cardText, { color: theme.colors.textSecondary }]}>
            {item.front}
          </Text>
          <Text style={[styles.cardTextSmall, { color: theme.colors.textMuted }]}>
            → {item.back}
          </Text>
        </View>

        <View style={styles.cardActions}>
          <Text style={[styles.tapHint, { color: theme.colors.textMuted }]}>
            
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4ADE8020' }]}
              onPress={() => handleDiscardCard(item)}
            >
              <RefreshIcon size={18} color="#4ADE80" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
              onPress={() => handleDeleteCard(item)}
            >
              <TrashIcon size={18} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <CardsIcon size={60} color={theme.colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No hay tarjetas todavía
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Añade tarjetas para comenzar a estudiar este mazo
      </Text>
    </View>
  );

  const CardFormModal = ({ visible, onClose, onSubmit, title, submitText }) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={styles.modalScrollContent}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{title}</Text>

            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              Frente (palabra/pregunta)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Ej: Hello"
              placeholderTextColor={theme.colors.placeholder}
              value={front}
              onChangeText={setFront}
            />

            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              Reverso (significado/respuesta)
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Ej: Hola"
              placeholderTextColor={theme.colors.placeholder}
              value={back}
              onChangeText={setBack}
              multiline
            />

            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              Ejemplo de uso (opcional)
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Ej: Hello, how are you?"
              placeholderTextColor={theme.colors.placeholder}
              value={example}
              onChangeText={setExample}
              multiline
            />

            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              Pronunciación IPA (opcional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Ej: /həˈloʊ/"
              placeholderTextColor={theme.colors.placeholder}
              value={pronunciation}
              onChangeText={setPronunciation}
            />

            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              Nivel Cambridge (opcional)
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.levelSelector}
            >
              {LEVEL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value || 'none'}
                  style={[
                    styles.levelOption,
                    {
                      backgroundColor: selectedLevel === option.value 
                        ? (option.value ? CAMBRIDGE_LEVELS[option.value]?.color : theme.colors.primary) + '20'
                        : theme.colors.inputBackground,
                      borderColor: selectedLevel === option.value 
                        ? (option.value ? CAMBRIDGE_LEVELS[option.value]?.color : theme.colors.primary)
                        : theme.colors.border,
                    },
                  ]}
                  onPress={() => setSelectedLevel(option.value)}
                >
                  <Text
                    style={[
                      styles.levelOptionText,
                      {
                        color: selectedLevel === option.value 
                          ? (option.value ? CAMBRIDGE_LEVELS[option.value]?.color : theme.colors.primary)
                          : theme.colors.text,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={onClose}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, { backgroundColor: deck?.color || theme.colors.primary }]}
                onPress={onSubmit}
              >
                <Text style={styles.submitButtonText}>{submitText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (!deck) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Stats Header */}
      <View style={[styles.statsHeader, { backgroundColor: deck.color }]}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.totalCards || 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.newCards || 0}</Text>
            <Text style={styles.statLabel}>Nuevas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.learningCards || 0}</Text>
            <Text style={styles.statLabel}>Aprendiendo</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.dueCards || 0}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.studyButton, stats.dueCards === 0 && styles.studyButtonDisabled]}
          onPress={() => stats.dueCards > 0 && navigation.navigate('Study', { deckId })}
          disabled={stats.dueCards === 0}
        >
          <PlayIcon size={20} color={stats.dueCards > 0 ? deck.color : '#999'} />
          <Text style={[styles.studyButtonText, { color: stats.dueCards > 0 ? deck.color : '#999' }]}>
            Estudiar ({stats.dueCards})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <SearchIcon size={20} color={theme.colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Buscar tarjetas..."
          placeholderTextColor={theme.colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filtro de nivel */}
      <View style={styles.levelFilterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.levelFilterContainer}
          contentContainerStyle={styles.levelFilterContent}
        >
          <TouchableOpacity
            style={[
              styles.levelFilterChip,
              {
                backgroundColor: levelFilter === null ? theme.colors.primary : 'transparent',
                borderColor: levelFilter === null ? theme.colors.primary : theme.colors.textMuted,
              },
            ]}
            onPress={() => setLevelFilter(null)}
          >
            <Text style={[
              styles.levelFilterText, 
              { color: levelFilter === null ? '#FFFFFF' : theme.colors.text }
            ]}>
              Todos
            </Text>
          </TouchableOpacity>
          {Object.entries(CAMBRIDGE_LEVELS).map(([key, level]) => {
            const count = cards.filter(c => c.level === key).length;
            const isSelected = levelFilter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.levelFilterChip,
                  {
                    backgroundColor: isSelected ? level.color : 'transparent',
                    borderColor: level.color,
                  },
                ]}
                onPress={() => setLevelFilter(key)}
              >
                <Text style={[
                  styles.levelFilterText, 
                  { color: isSelected ? '#FFFFFF' : level.color }
                ]}>
                  {level.label}{count > 0 ? ` (${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Toggle ver descartadas */}
      {discardedCards.length > 0 && (
        <View style={styles.discardedToggleContainer}>
          <TouchableOpacity
            style={[
              styles.discardedToggle,
              {
                backgroundColor: showDiscarded ? '#F59E0B' : theme.colors.surface,
                borderColor: '#F59E0B',
              },
            ]}
            onPress={() => setShowDiscarded(!showDiscarded)}
          >
            <ArchiveIcon size={16} color={showDiscarded ? '#FFFFFF' : '#F59E0B'} />
            <Text style={[
              styles.discardedToggleText,
              { color: showDiscarded ? '#FFFFFF' : '#F59E0B' }
            ]}>
              {showDiscarded ? 'Ocultar' : 'Ver'} descartadas ({discardedCards.length})
            </Text>
          </TouchableOpacity>
          {showDiscarded && (
            <TouchableOpacity
              style={[styles.restoreAllButton, { backgroundColor: '#4ADE8020' }]}
              onPress={handleRestoreAllDiscarded}
            >
              <RefreshIcon size={16} color="#4ADE80" />
              <Text style={[styles.restoreAllText, { color: '#4ADE80' }]}>
                Restaurar todas
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Lista de tarjetas */}
      {showDiscarded ? (
        <FlatList
          data={discardedCards}
          renderItem={renderDiscardedCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={discardedCards.length === 0 ? styles.emptyList : styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                No hay tarjetas descartadas
              </Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[deck.color]}
              tintColor={deck.color}
            />
          }
        />
      ) : (
        <FlatList
          data={filteredCards}
          renderItem={renderCardItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={filteredCards.length === 0 ? styles.emptyList : styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[deck.color]}
              tintColor={deck.color}
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: deck.color }]}
        onPress={() => setModalVisible(true)}
      >
        <PlusIcon size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal Añadir */}
      <CardFormModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setFront('');
          setBack('');
          setExample('');
          setSelectedLevel(null);
        }}
        onSubmit={handleAddCard}
        title="Nueva Tarjeta"
        submitText="Crear"
      />

      {/* Modal Editar */}
      <CardFormModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setEditingCard(null);
          setFront('');
          setBack('');
          setExample('');
          setSelectedLevel(null);
        }}
        onSubmit={handleUpdateCard}
        title="Editar Tarjeta"
        submitText="Guardar"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsHeader: {
    padding: 16,
    paddingTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  studyButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  studyButtonDisabled: {
    opacity: 0.6,
  },
  studyButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  levelFilterWrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  levelFilterContainer: {
    flexGrow: 0,
  },
  levelFilterContent: {
    paddingRight: 16,
    alignItems: 'center',
    gap: 8,
  },
  levelFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 2,
    minWidth: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelFilterText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
  },
  cardItem: {
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dueText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 18,
    fontWeight: '500',
  },
  cardTextSmall: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
  },
  pronunciationText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
    fontWeight: '500',
  },
  exampleContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  exampleLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  tapHint: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
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
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  levelSelector: {
    marginBottom: 16,
    maxHeight: 44,
  },
  levelOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1.5,
  },
  levelOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 8,
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
  submitButton: {
    marginLeft: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  discardedToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  discardedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  discardedToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  restoreAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  restoreAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  discardedCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  discardedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  discardedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F59E0B20',
    gap: 4,
  },
  discardedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  restoreButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#4ADE8020',
  },
});
