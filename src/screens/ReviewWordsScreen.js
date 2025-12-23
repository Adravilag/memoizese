import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import {
  getReviewWords,
  getProblematicWords,
  getDeckById,
  toggleCardNeedsReview,
  toggleCardFavorite,
  markCardAsProblematic,
  getCardTag,
  getTagStats,
  CAMBRIDGE_LEVELS,
  WORD_TAGS,
} from '../utils/storage';
import {
  PlayIcon,
  StarIcon,
  StarOutlineIcon,
  VolumeIcon,
  CheckCircleIcon,
  FireIcon,
} from '../components/Icons';
import * as Speech from 'expo-speech';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReviewWordsScreen({ navigation }) {
  const { theme } = useTheme();
  const [reviewWords, setReviewWords] = useState([]);
  const [problematicWords, setProblematicWords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deckNames, setDeckNames] = useState({});
  const [expandedCards, setExpandedCards] = useState({});
  const [activeTab, setActiveTab] = useState('problematic'); // 'problematic' | 'all'
  const [tagStats, setTagStats] = useState(null);

  const loadReviewWords = async () => {
    try {
      const words = await getReviewWords();
      const problematic = await getProblematicWords();
      const stats = await getTagStats();
      
      setReviewWords(words);
      setProblematicWords(problematic);
      setTagStats(stats);

      // Cargar nombres de mazos
      const names = {};
      const allCards = [...words, ...problematic];
      for (const card of allCards) {
        if (!names[card.deckId]) {
          const deck = await getDeckById(card.deckId);
          names[card.deckId] = deck?.name || 'Mazo eliminado';
        }
      }
      setDeckNames(names);
    } catch (error) {
      console.error('Error cargando palabras para repaso:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReviewWords();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviewWords();
    setRefreshing(false);
  };

  const speakWord = async (text, language = 'en-US') => {
    try {
      await Speech.stop();
      Speech.speak(text, {
        language: language,
        pitch: 1,
        rate: 0.85,
      });
    } catch (error) {
      console.error('Error reproduciendo audio:', error);
    }
  };

  const handleToggleFavorite = async (cardId) => {
    try {
      await toggleCardFavorite(cardId);
      loadReviewWords();
    } catch (error) {
      console.error('Error alternando favorito:', error);
    }
  };

  const handleRemoveFromReview = async (cardId) => {
    Alert.alert(
      'Quitar de repaso',
      '¿Marcar esta palabra como dominada y quitarla de la lista de repaso?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'default',
          onPress: async () => {
            try {
              await toggleCardNeedsReview(cardId);
              await markCardAsProblematic(cardId, false);
              loadReviewWords();
            } catch (error) {
              console.error('Error quitando de repaso:', error);
            }
          },
        },
      ]
    );
  };

  const handleMarkProblematic = async (cardId, isProblematic) => {
    try {
      await markCardAsProblematic(cardId, isProblematic);
      loadReviewWords();
    } catch (error) {
      console.error('Error marcando como problemática:', error);
    }
  };

  const toggleCardExpanded = (cardId) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Obtener tag de la palabra
  const getWordTag = (card) => {
    return getCardTag(card);
  };

  const renderCard = ({ item }) => {
    const isExpanded = expandedCards[item.id];
    const tag = getWordTag(item);
    const levelInfo = item.level ? CAMBRIDGE_LEVELS[item.level] : null;

    return (
      <TouchableOpacity
        style={[
          styles.card, 
          { backgroundColor: theme.colors.surface },
          item.isProblematic && styles.problematicCard,
        ]}
        onPress={() => toggleCardExpanded(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            {/* Tag de estado */}
            {tag && (
              <View style={[styles.tagBadge, { backgroundColor: tag.color }]}>
                <Text style={styles.tagText}>{tag.label}</Text>
              </View>
            )}
            {levelInfo && (
              <View style={[styles.levelBadge, { backgroundColor: levelInfo.color }]}>
                <Text style={styles.levelText}>{levelInfo.label}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.deckName, { color: theme.colors.textSecondary }]}>
            {deckNames[item.deckId]}
          </Text>
        </View>

        {/* Indicadores de fallos */}
        {(item.consecutiveFailures > 0 || item.totalFailures > 0) && (
          <View style={styles.failureIndicator}>
            {item.consecutiveFailures >= 2 && (
              <View style={styles.failureBadge}>
                <Text style={styles.failureText}>
                  🔥 {item.consecutiveFailures} fallos seguidos
                </Text>
              </View>
            )}
            {item.totalFailures >= 3 && (
              <Text style={[styles.totalFailures, { color: theme.colors.textMuted }]}>
                Total fallos: {item.totalFailures}
              </Text>
            )}
          </View>
        )}

        <View style={styles.wordContainer}>
          <View style={styles.wordRow}>
            <Text style={[styles.frontText, { color: theme.colors.text }]}>
              {item.front}
            </Text>
            <TouchableOpacity
              onPress={() => speakWord(item.front, 'en-US')}
              style={styles.speakButton}
            >
              <VolumeIcon size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.separator, { color: theme.colors.textSecondary }]}>
            ↓
          </Text>
          
          <Text style={[styles.backText, { color: theme.colors.primary }]}>
            {item.back}
          </Text>
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {item.pronunciation && (
              <Text style={[styles.pronunciation, { color: theme.colors.textSecondary }]}>
                🔊 {item.pronunciation}
              </Text>
            )}
            {item.example && (
              <Text style={[styles.example, { color: theme.colors.textSecondary }]}>
                📝 {item.example}
              </Text>
            )}
            <View style={styles.statsRow}>
              <Text style={[styles.statsText, { color: theme.colors.textMuted }]}>
                📊 Repeticiones: {item.repetitions || 0}
              </Text>
              <Text style={[styles.statsText, { color: theme.colors.textMuted }]}>
                ⚡ Factor: {(item.easeFactor || 2.5).toFixed(2)}
              </Text>
            </View>
            {item.lastFailureDate && (
              <Text style={[styles.statsText, { color: theme.colors.textMuted, marginTop: 4 }]}>
                📅 Último fallo: {new Date(item.lastFailureDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        <View style={styles.cardActions}>
          {/* Botón para marcar/desmarcar como problemática */}
          <TouchableOpacity
            onPress={() => handleMarkProblematic(item.id, !item.isProblematic)}
            style={styles.actionButton}
          >
            <FireIcon size={22} color={item.isProblematic ? '#DC3545' : theme.colors.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => handleToggleFavorite(item.id)}
            style={styles.actionButton}
          >
            {item.isFavorite ? (
              <StarIcon size={22} color="#FFD700" />
            ) : (
              <StarOutlineIcon size={22} color={theme.colors.textMuted} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => handleRemoveFromReview(item.id)}
            style={styles.actionButton}
          >
            <CheckCircleIcon size={22} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <CheckCircleIcon size={80} color={theme.colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        ¡Excelente trabajo!
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {activeTab === 'problematic' 
          ? 'No tienes palabras problemáticas.\nSigue así, ¡vas muy bien!'
          : 'No tienes palabras pendientes de repaso.\nSigue estudiando para mantener tu progreso.'}
      </Text>
    </View>
  );

  // Agrupar palabras por tipo de tag
  const groupWordsByTag = (words) => {
    const groups = {
      problematic: [],
      struggling: [],
      needsPractice: [],
      improving: [],
      other: [],
    };
    
    words.forEach(card => {
      const tag = getWordTag(card);
      if (!tag) {
        groups.other.push(card);
      } else if (tag.id === 'problematic') {
        groups.problematic.push(card);
      } else if (tag.id === 'struggling') {
        groups.struggling.push(card);
      } else if (tag.id === 'needs_practice') {
        groups.needsPractice.push(card);
      } else if (tag.id === 'improving') {
        groups.improving.push(card);
      } else {
        groups.other.push(card);
      }
    });
    
    return groups;
  };

  const renderSectionHeader = (title, emoji, color, count, onPractice) => (
    <View style={[styles.sectionHeader, { borderLeftColor: color }]}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionEmoji}>{emoji}</Text>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.sectionCount, { color: theme.colors.textMuted }]}>
            {count} {count === 1 ? 'palabra' : 'palabras'}
          </Text>
        </View>
      </View>
      {count > 0 && onPractice && (
        <TouchableOpacity
          style={[styles.sectionPracticeButton, { backgroundColor: color }]}
          onPress={onPractice}
        >
          <PlayIcon size={14} color="#FFFFFF" />
          <Text style={styles.sectionPracticeText}>Practicar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTagStats = () => {
    if (!tagStats) return null;
    
    return (
      <View style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.statsTitle, { color: theme.colors.text }]}>📊 Resumen General</Text>
        <View style={styles.tagStatsContainer}>
          <View style={[styles.tagStatItem, { backgroundColor: WORD_TAGS.PROBLEMATIC.color + '15' }]}>
            <Text style={styles.tagStatEmoji}>{WORD_TAGS.PROBLEMATIC.shortLabel}</Text>
            <Text style={[styles.tagStatNumber, { color: WORD_TAGS.PROBLEMATIC.color }]}>{tagStats.problematic}</Text>
            <Text style={[styles.tagStatLabel, { color: theme.colors.textMuted }]}>Problemáticas</Text>
          </View>
          <View style={[styles.tagStatItem, { backgroundColor: WORD_TAGS.STRUGGLING.color + '15' }]}>
            <Text style={styles.tagStatEmoji}>{WORD_TAGS.STRUGGLING.shortLabel}</Text>
            <Text style={[styles.tagStatNumber, { color: WORD_TAGS.STRUGGLING.color }]}>{tagStats.struggling}</Text>
            <Text style={[styles.tagStatLabel, { color: theme.colors.textMuted }]}>Cuesta</Text>
          </View>
          <View style={[styles.tagStatItem, { backgroundColor: WORD_TAGS.NEEDS_PRACTICE.color + '15' }]}>
            <Text style={styles.tagStatEmoji}>{WORD_TAGS.NEEDS_PRACTICE.shortLabel}</Text>
            <Text style={[styles.tagStatNumber, { color: WORD_TAGS.NEEDS_PRACTICE.color }]}>{tagStats.needsPractice}</Text>
            <Text style={[styles.tagStatLabel, { color: theme.colors.textMuted }]}>Practicar</Text>
          </View>
          <View style={[styles.tagStatItem, { backgroundColor: WORD_TAGS.IMPROVING.color + '15' }]}>
            <Text style={styles.tagStatEmoji}>{WORD_TAGS.IMPROVING.shortLabel}</Text>
            <Text style={[styles.tagStatNumber, { color: WORD_TAGS.IMPROVING.color }]}>{tagStats.improving}</Text>
            <Text style={[styles.tagStatLabel, { color: theme.colors.textMuted }]}>Mejorando</Text>
          </View>
          <View style={[styles.tagStatItem, { backgroundColor: WORD_TAGS.MASTERED.color + '15' }]}>
            <Text style={styles.tagStatEmoji}>{WORD_TAGS.MASTERED.shortLabel}</Text>
            <Text style={[styles.tagStatNumber, { color: WORD_TAGS.MASTERED.color }]}>{tagStats.mastered}</Text>
            <Text style={[styles.tagStatLabel, { color: theme.colors.textMuted }]}>Dominadas</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTabs = () => (
    <View style={[styles.tabsCard, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.tabsLabel, { color: theme.colors.textMuted }]}>Filtrar por:</Text>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'problematic' && styles.tabActive,
            activeTab === 'problematic' && { backgroundColor: WORD_TAGS.PROBLEMATIC.color },
          ]}
          onPress={() => setActiveTab('problematic')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'problematic' ? '#FFFFFF' : theme.colors.text }
          ]}>
            🔴 Problemáticas ({problematicWords.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'all' && styles.tabActive,
            activeTab === 'all' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'all' ? '#FFFFFF' : theme.colors.text }
          ]}>
            📋 Todas ({reviewWords.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Renderizar contenido agrupado por secciones
  const renderGroupedContent = () => {
    const currentList = activeTab === 'problematic' ? problematicWords : reviewWords;
    
    if (currentList.length === 0) {
      return renderEmptyState();
    }
    
    const groups = groupWordsByTag(currentList);
    
    return (
      <View style={styles.sectionsContainer}>
        {/* Sección: Problemáticas */}
        {groups.problematic.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader(
              'Problemáticas',
              '🔴',
              WORD_TAGS.PROBLEMATIC.color,
              groups.problematic.length,
              () => navigation.navigate('Study', { studyMode: 'problematic', masteryMode: true })
            )}
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              Palabras que has fallado 3+ veces seguidas. Necesitan atención urgente.
            </Text>
            {groups.problematic.map(item => (
              <View key={item.id}>{renderCard({ item })}</View>
            ))}
          </View>
        )}
        
        {/* Sección: Te cuestan */}
        {groups.struggling.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader(
              'Te cuestan',
              '🟠',
              WORD_TAGS.STRUGGLING.color,
              groups.struggling.length,
              null
            )}
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              Palabras con muchos fallos acumulados. Requieren práctica adicional.
            </Text>
            {groups.struggling.map(item => (
              <View key={item.id}>{renderCard({ item })}</View>
            ))}
          </View>
        )}
        
        {/* Sección: Necesitan práctica */}
        {groups.needsPractice.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader(
              'Necesitan práctica',
              '🟡',
              WORD_TAGS.NEEDS_PRACTICE.color,
              groups.needsPractice.length,
              null
            )}
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              Palabras que aún no dominas del todo. Un poco más de repaso ayudará.
            </Text>
            {groups.needsPractice.map(item => (
              <View key={item.id}>{renderCard({ item })}</View>
            ))}
          </View>
        )}
        
        {/* Sección: Mejorando */}
        {groups.improving.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader(
              'Mejorando',
              '🟢',
              WORD_TAGS.IMPROVING.color,
              groups.improving.length,
              null
            )}
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              Palabras en proceso de aprendizaje. ¡Vas por buen camino!
            </Text>
            {groups.improving.map(item => (
              <View key={item.id}>{renderCard({ item })}</View>
            ))}
          </View>
        )}
        
        {/* Sección: Otras */}
        {groups.other.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader(
              'Otras',
              '📝',
              theme.colors.textMuted,
              groups.other.length,
              null
            )}
            {groups.other.map(item => (
              <View key={item.id}>{renderCard({ item })}</View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => {
    const currentList = activeTab === 'problematic' ? problematicWords : reviewWords;
    
    return (
      <View>
        {/* Estadísticas de tags */}
        {renderTagStats()}
        
        {/* Tabs de filtro */}
        {renderTabs()}
        
        {/* Botón principal de práctica */}
        {currentList.length > 0 && (
          <View style={[styles.mainActionCard, { backgroundColor: activeTab === 'problematic' ? '#DC354515' : theme.colors.primary + '15' }]}>
            <View style={styles.mainActionContent}>
              <FireIcon size={28} color={activeTab === 'problematic' ? '#DC3545' : theme.colors.primary} />
              <View style={styles.mainActionTextContainer}>
                <Text style={[styles.mainActionTitle, { color: theme.colors.text }]}>
                  {activeTab === 'problematic' ? '¡Ataque a las problemáticas!' : 'Sesión de repaso'}
                </Text>
                <Text style={[styles.mainActionSubtitle, { color: theme.colors.textSecondary }]}>
                  {currentList.length} palabras esperando
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.mainPracticeButton, { backgroundColor: activeTab === 'problematic' ? '#DC3545' : theme.colors.primary }]}
              onPress={() => {
                const studyMode = activeTab === 'problematic' ? 'problematic' : 'review';
                const deckIds = [...new Set(currentList.map(c => c.deckId))];
                
                if (deckIds.length === 1) {
                  navigation.navigate('Study', { 
                    deckId: deckIds[0], 
                    masteryMode: true,
                    studyMode: studyMode,
                  });
                } else {
                  navigation.navigate('Study', { 
                    masteryMode: true,
                    studyMode: studyMode,
                  });
                }
              }}
            >
              <PlayIcon size={20} color="#FFFFFF" />
              <Text style={styles.mainPracticeButtonText}>
                Practicar {activeTab === 'problematic' ? 'Problemáticas' : 'Todas'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {renderHeader()}
        {renderGroupedContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // ===== CARD DE ESTADÍSTICAS =====
  statsCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tagStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagStatItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 60,
    flex: 1,
  },
  tagStatEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  tagStatNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tagStatLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  
  // ===== CARD DE TABS/FILTROS =====
  tabsCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  tabActive: {
    transform: [{ scale: 1.02 }],
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  // ===== CARD DE ACCIÓN PRINCIPAL =====
  mainActionCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  mainActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainActionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  mainActionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  mainActionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  mainPracticeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  mainPracticeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  
  // ===== SECCIONES AGRUPADAS =====
  sectionsContainer: {
    gap: 20,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionEmoji: {
    fontSize: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionCount: {
    fontSize: 12,
    marginTop: 1,
  },
  sectionDescription: {
    fontSize: 13,
    marginBottom: 12,
    paddingHorizontal: 4,
    fontStyle: 'italic',
  },
  sectionPracticeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  sectionPracticeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // ===== TARJETAS DE PALABRAS =====
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  deckName: {
    fontSize: 12,
  },
  wordContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  frontText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  speakButton: {
    padding: 4,
  },
  separator: {
    fontSize: 16,
    marginVertical: 4,
  },
  backText: {
    fontSize: 18,
    fontWeight: '600',
  },
  expandedContent: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: 12,
  },
  pronunciation: {
    fontSize: 14,
    marginBottom: 4,
  },
  example: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statsText: {
    fontSize: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    padding: 8,
  },
  
  // ===== ESTADO VACÍO =====
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  
  // ===== TAGS Y BADGES =====
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  problematicCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
  },
  failureIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(220, 53, 69, 0.2)',
  },
  failureBadge: {
    backgroundColor: 'rgba(220, 53, 69, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  failureText: {
    fontSize: 12,
    color: '#DC3545',
    fontWeight: '600',
  },
  totalFailures: {
    fontSize: 11,
  },
});
