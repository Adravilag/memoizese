import AsyncStorage from '@react-native-async-storage/async-storage';

const DECKS_KEY = '@memoizese_decks';
const CARDS_KEY = '@memoizese_cards';
const STUDY_STATS_KEY = '@memoizese_study_stats';
const TESTS_KEY = '@memoizese_tests';
const TEST_RESULTS_KEY = '@memoizese_test_results';
const SETTINGS_KEY = '@memoizese_settings';

// ==================== CONFIGURACIÓN DE LÍMITES ====================

export const DEFAULT_SETTINGS = {
  newCardsPerDay: 20,      // Tarjetas nuevas por día
  reviewsPerDay: 100,      // Repasos máximos por día
  autoPlayAudio: false,    // Reproducir audio automáticamente
  showProgress: true,      // Mostrar progreso en home
};

/**
 * Obtiene la configuración del usuario
 */
export const getSettings = async () => {
  try {
    const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
    if (settingsJson) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Guarda la configuración del usuario
 */
export const saveSettings = async (settings) => {
  try {
    const currentSettings = await getSettings();
    const newSettings = { ...currentSettings, ...settings };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    return newSettings;
  } catch (error) {
    console.error('Error guardando configuración:', error);
    throw error;
  }
};

// ==================== NIVELES CAMBRIDGE ====================

export const CAMBRIDGE_LEVELS = {
  A1: { label: 'A1', name: 'Beginner', color: '#4ADE80', description: 'Principiante' },
  A2: { label: 'A2', name: 'Elementary', color: '#86EFAC', description: 'Elemental' },
  B1: { label: 'B1', name: 'Intermediate', color: '#FBBF24', description: 'Intermedio' },
  B2: { label: 'B2', name: 'Upper Intermediate', color: '#F59E0B', description: 'Intermedio Alto' },
  C1: { label: 'C1', name: 'Advanced', color: '#60A5FA', description: 'Avanzado' },
  C2: { label: 'C2', name: 'Proficiency', color: '#A78BFA', description: 'Dominio' },
};

export const LEVEL_OPTIONS = [
  { value: null, label: 'Sin nivel' },
  { value: 'A1', label: 'A1 - Beginner' },
  { value: 'A2', label: 'A2 - Elementary' },
  { value: 'B1', label: 'B1 - Intermediate' },
  { value: 'B2', label: 'B2 - Upper Intermediate' },
  { value: 'C1', label: 'C1 - Advanced' },
  { value: 'C2', label: 'C2 - Proficiency' },
];

// ==================== MAZOS (DECKS) ====================

/**
 * Guarda un nuevo mazo
 */
export const saveDeck = async (deck) => {
  try {
    const decks = await getDecks();
    const newDeck = {
      ...deck,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cardCount: 0,
      color: deck.color || '#4A90D9',
      icon: deck.icon || 'cards',
    };
    decks.push(newDeck);
    await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(decks));
    return newDeck;
  } catch (error) {
    console.error('Error guardando mazo:', error);
    throw error;
  }
};

/**
 * Obtiene todos los mazos
 */
export const getDecks = async () => {
  try {
    const decksJson = await AsyncStorage.getItem(DECKS_KEY);
    return decksJson ? JSON.parse(decksJson) : [];
  } catch (error) {
    console.error('Error obteniendo mazos:', error);
    return [];
  }
};

/**
 * Obtiene un mazo por ID
 */
export const getDeckById = async (deckId) => {
  try {
    const decks = await getDecks();
    return decks.find(d => d.id === deckId) || null;
  } catch (error) {
    console.error('Error obteniendo mazo:', error);
    return null;
  }
};

/**
 * Actualiza un mazo existente
 */
export const updateDeck = async (deckId, updates) => {
  try {
    const decks = await getDecks();
    const index = decks.findIndex(d => d.id === deckId);
    if (index !== -1) {
      decks[index] = {
        ...decks[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(decks));
      return decks[index];
    }
    return null;
  } catch (error) {
    console.error('Error actualizando mazo:', error);
    throw error;
  }
};

/**
 * Elimina un mazo y todas sus tarjetas
 */
export const deleteDeck = async (deckId) => {
  try {
    const decks = await getDecks();
    const filteredDecks = decks.filter(d => d.id !== deckId);
    await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(filteredDecks));
    
    // También eliminar tarjetas asociadas
    const cards = await getCards();
    const filteredCards = cards.filter(c => c.deckId !== deckId);
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(filteredCards));
    
    return true;
  } catch (error) {
    console.error('Error eliminando mazo:', error);
    throw error;
  }
};

/**
 * Actualiza el contador de tarjetas de un mazo
 */
export const updateDeckCardCount = async (deckId) => {
  try {
    const cards = await getCardsByDeck(deckId);
    await updateDeck(deckId, { cardCount: cards.length });
  } catch (error) {
    console.error('Error actualizando contador:', error);
  }
};

// ==================== TARJETAS (CARDS) ====================

/**
 * Guarda una nueva tarjeta
 */
export const saveCard = async (card) => {
  try {
    const cards = await getCards();
    const newCard = {
      ...card,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Algoritmo de repetición espaciada (SM-2 simplificado)
      easeFactor: 2.5, // Factor de facilidad inicial
      interval: 0, // Días hasta próxima revisión
      repetitions: 0, // Número de repeticiones exitosas
      nextReview: new Date().toISOString(), // Próxima fecha de revisión
      lastReview: null,
    };
    cards.push(newCard);
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));
    
    // Actualizar contador del mazo
    await updateDeckCardCount(card.deckId);
    
    return newCard;
  } catch (error) {
    console.error('Error guardando tarjeta:', error);
    throw error;
  }
};

/**
 * Guarda múltiples tarjetas de una vez
 */
export const saveMultipleCards = async (cardsToSave) => {
  try {
    const cards = await getCards();
    const now = new Date().toISOString();
    
    const newCards = cardsToSave.map((card, index) => ({
      ...card,
      id: `${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: now,
      lastReview: null,
    }));
    
    const allCards = [...cards, ...newCards];
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(allCards));
    
    // Actualizar contadores de mazos afectados
    const deckIds = [...new Set(cardsToSave.map(c => c.deckId))];
    for (const deckId of deckIds) {
      await updateDeckCardCount(deckId);
    }
    
    return newCards;
  } catch (error) {
    console.error('Error guardando tarjetas:', error);
    throw error;
  }
};

/**
 * Obtiene todas las tarjetas
 */
export const getCards = async () => {
  try {
    const cardsJson = await AsyncStorage.getItem(CARDS_KEY);
    return cardsJson ? JSON.parse(cardsJson) : [];
  } catch (error) {
    console.error('Error obteniendo tarjetas:', error);
    return [];
  }
};

/**
 * Obtiene tarjetas de un mazo específico (excluye descartadas por defecto)
 */
export const getCardsByDeck = async (deckId, includeDiscarded = false) => {
  try {
    const cards = await getCards();
    let filtered = cards.filter(c => c.deckId === deckId);
    if (!includeDiscarded) {
      filtered = filtered.filter(c => !c.isDiscarded);
    }
    return filtered;
  } catch (error) {
    console.error('Error obteniendo tarjetas del mazo:', error);
    return [];
  }
};

/**
 * Obtiene una tarjeta por ID
 */
export const getCardById = async (cardId) => {
  try {
    const cards = await getCards();
    return cards.find(c => c.id === cardId) || null;
  } catch (error) {
    console.error('Error obteniendo tarjeta:', error);
    return null;
  }
};

/**
 * Actualiza una tarjeta existente
 */
export const updateCard = async (cardId, updates) => {
  try {
    const cards = await getCards();
    const index = cards.findIndex(c => c.id === cardId);
    if (index !== -1) {
      cards[index] = {
        ...cards[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));
      return cards[index];
    }
    return null;
  } catch (error) {
    console.error('Error actualizando tarjeta:', error);
    throw error;
  }
};

/**
 * Marca o desmarca una tarjeta como favorita
 */
export const toggleCardFavorite = async (cardId) => {
  try {
    const cards = await getCards();
    const index = cards.findIndex(c => c.id === cardId);
    if (index !== -1) {
      cards[index] = {
        ...cards[index],
        isFavorite: !cards[index].isFavorite,
        updatedAt: new Date().toISOString()
      };
      await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));
      return cards[index];
    }
    return null;
  } catch (error) {
    console.error('Error alternando favorito:', error);
    throw error;
  }
};

/**
 * Descarta o restaura una tarjeta (la oculta sin eliminarla)
 */
export const toggleCardDiscarded = async (cardId) => {
  try {
    const cards = await getCards();
    const index = cards.findIndex(c => c.id === cardId);
    if (index !== -1) {
      cards[index] = {
        ...cards[index],
        isDiscarded: !cards[index].isDiscarded,
        discardedAt: !cards[index].isDiscarded ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      };
      await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));
      return cards[index];
    }
    return null;
  } catch (error) {
    console.error('Error descartando tarjeta:', error);
    throw error;
  }
};

/**
 * Obtiene todas las tarjetas descartadas
 */
export const getDiscardedCards = async (deckId = null) => {
  try {
    const cards = await getCards();
    let discarded = cards.filter(c => c.isDiscarded === true);
    if (deckId) {
      discarded = discarded.filter(c => c.deckId === deckId);
    }
    return discarded;
  } catch (error) {
    console.error('Error obteniendo descartadas:', error);
    return [];
  }
};

/**
 * Restaura todas las tarjetas descartadas de un mazo
 */
export const restoreAllDiscardedCards = async (deckId) => {
  try {
    const cards = await getCards();
    const updatedCards = cards.map(c => {
      if (c.deckId === deckId && c.isDiscarded) {
        return {
          ...c,
          isDiscarded: false,
          discardedAt: null,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(updatedCards));
    return true;
  } catch (error) {
    console.error('Error restaurando tarjetas:', error);
    throw error;
  }
};

/**
 * Obtiene todas las tarjetas favoritas
 */
export const getFavoriteCards = async () => {
  try {
    const cards = await getCards();
    return cards.filter(c => c.isFavorite === true);
  } catch (error) {
    console.error('Error obteniendo favoritos:', error);
    return [];
  }
};

/**
 * Elimina una tarjeta
 */
export const deleteCard = async (cardId) => {
  try {
    const cards = await getCards();
    const card = cards.find(c => c.id === cardId);
    const filteredCards = cards.filter(c => c.id !== cardId);
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(filteredCards));
    
    // Actualizar contador del mazo
    if (card) {
      await updateDeckCardCount(card.deckId);
    }
    
    return true;
  } catch (error) {
    console.error('Error eliminando tarjeta:', error);
    throw error;
  }
};

// ==================== ALGORITMO DE REPETICIÓN ESPACIADA ====================

/**
 * Calcula la próxima revisión basándose en la calidad de la respuesta
 * Usa una versión simplificada del algoritmo SM-2
 * @param {object} card - Tarjeta actual
 * @param {number} quality - Calidad de respuesta (0-5)
 *   0 - Olvidada completamente
 *   1 - Respuesta incorrecta pero recordada al ver
 *   2 - Respuesta incorrecta pero fácil de recordar
 *   3 - Respuesta correcta con dificultad
 *   4 - Respuesta correcta con alguna duda
 *   5 - Respuesta perfecta
 */
export const calculateNextReview = (card, quality) => {
  let { easeFactor, interval, repetitions } = card;
  
  // Si la calidad es menor a 3, reiniciamos
  if (quality < 3) {
    repetitions = 0;
    interval = 0;
  } else {
    // Actualizar el factor de facilidad
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    
    if (repetitions === 0) {
      interval = 1; // 1 día
    } else if (repetitions === 1) {
      interval = 6; // 6 días
    } else {
      interval = Math.round(interval * easeFactor);
    }
    
    repetitions += 1;
  }
  
  // Calcular próxima fecha de revisión
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  
  return {
    easeFactor,
    interval,
    repetitions,
    nextReview: nextReview.toISOString(),
    lastReview: new Date().toISOString(),
  };
};

/**
 * Actualiza una tarjeta después de estudiarla
 * Incluye tracking de fallos consecutivos y totales
 */
export const updateCardAfterStudy = async (cardId, quality) => {
  try {
    const card = await getCardById(cardId);
    if (!card) return null;
    
    const reviewData = calculateNextReview(card, quality);
    
    // Tracking de fallos para identificar palabras problemáticas
    let failureTracking = {};
    
    if (quality < 3) {
      // Fallo: incrementar contadores
      failureTracking = {
        consecutiveFailures: (card.consecutiveFailures || 0) + 1,
        totalFailures: (card.totalFailures || 0) + 1,
        lastFailureDate: new Date().toISOString(),
      };
      
      // Marcar como problemática si tiene 3+ fallos consecutivos
      if (failureTracking.consecutiveFailures >= 3) {
        failureTracking.isProblematic = true;
        failureTracking.needsReview = true;
      }
    } else {
      // Acierto: resetear fallos consecutivos pero mantener totales
      failureTracking = {
        consecutiveFailures: 0,
        totalFailures: card.totalFailures || 0,
        lastSuccessDate: new Date().toISOString(),
      };
      
      // Si acertó 2 veces seguidas, quitar marca de problemática
      const consecutiveSuccesses = (card.consecutiveSuccesses || 0) + 1;
      failureTracking.consecutiveSuccesses = consecutiveSuccesses;
      
      if (consecutiveSuccesses >= 2 && card.isProblematic) {
        failureTracking.isProblematic = false;
      }
    }
    
    return await updateCard(cardId, { ...reviewData, ...failureTracking });
  } catch (error) {
    console.error('Error actualizando tarjeta después de estudio:', error);
    throw error;
  }
};

/**
 * Obtiene las tarjetas que necesitan ser revisadas hoy
 */
export const getCardsToReview = async (deckId = null, applyLimits = true) => {
  try {
    let cards = deckId ? await getCardsByDeck(deckId) : await getCards();
    // Filtrar descartadas
    cards = cards.filter(c => !c.isDiscarded);
    
    const now = new Date();
    const settings = await getSettings();
    
    // Separar tarjetas nuevas de repasos
    const newCards = cards.filter(card => 
      card.repetitions === 0 && new Date(card.nextReview) <= now
    );
    
    const reviewCards = cards.filter(card => 
      card.repetitions > 0 && new Date(card.nextReview) <= now
    );
    
    if (!applyLimits) {
      // Retornar todo sin límites (para estadísticas)
      return [...newCards, ...reviewCards];
    }
    
    // Aplicar límites diarios
    const limitedNewCards = newCards.slice(0, settings.newCardsPerDay);
    const limitedReviewCards = reviewCards.slice(0, settings.reviewsPerDay);
    
    // Mezclar y retornar
    return [...limitedNewCards, ...limitedReviewCards].sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error('Error obteniendo tarjetas para revisar:', error);
    return [];
  }
};

/**
 * Obtiene el conteo de tarjetas pendientes (sin aplicar límites)
 */
export const getPendingCardsCount = async (deckId = null) => {
  try {
    let cards = deckId ? await getCardsByDeck(deckId) : await getCards();
    cards = cards.filter(c => !c.isDiscarded);
    
    const now = new Date();
    const settings = await getSettings();
    
    const newCards = cards.filter(card => 
      card.repetitions === 0 && new Date(card.nextReview) <= now
    );
    
    const reviewCards = cards.filter(card => 
      card.repetitions > 0 && new Date(card.nextReview) <= now
    );
    
    return {
      newCards: newCards.length,
      reviewCards: reviewCards.length,
      totalPending: newCards.length + reviewCards.length,
      // Lo que realmente estudiarás hoy con los límites
      todayNew: Math.min(newCards.length, settings.newCardsPerDay),
      todayReview: Math.min(reviewCards.length, settings.reviewsPerDay),
      todayTotal: Math.min(newCards.length, settings.newCardsPerDay) + 
                  Math.min(reviewCards.length, settings.reviewsPerDay),
      settings,
    };
  } catch (error) {
    console.error('Error obteniendo conteo:', error);
    return { newCards: 0, reviewCards: 0, totalPending: 0, todayNew: 0, todayReview: 0, todayTotal: 0 };
  }
};

/**
 * Obtiene tarjetas nuevas (nunca estudiadas)
 */
export const getNewCards = async (deckId = null) => {
  try {
    let cards = deckId ? await getCardsByDeck(deckId) : await getCards();
    return cards.filter(card => card.repetitions === 0);
  } catch (error) {
    console.error('Error obteniendo tarjetas nuevas:', error);
    return [];
  }
};

// ==================== PALABRAS PARA REPASAR ====================

/**
 * Obtiene tarjetas difíciles (easeFactor bajo o muchos errores)
 * Las tarjetas con easeFactor < 2.0 se consideran difíciles
 */
export const getDifficultCards = async (deckId = null) => {
  try {
    let cards = deckId ? await getCardsByDeck(deckId) : await getCards();
    return cards.filter(card => 
      card.repetitions > 0 && (card.easeFactor < 2 || card.needsReview)
    ).sort((a, b) => a.easeFactor - b.easeFactor);
  } catch (error) {
    console.error('Error obteniendo tarjetas difíciles:', error);
    return [];
  }
};

/**
 * Obtiene todas las tarjetas marcadas para repaso
 */
export const getCardsNeedingReview = async (deckId = null) => {
  try {
    let cards = deckId ? await getCardsByDeck(deckId) : await getCards();
    return cards.filter(card => card.needsReview === true);
  } catch (error) {
    console.error('Error obteniendo tarjetas para repaso:', error);
    return [];
  }
};

/**
 * Marca o desmarca una tarjeta para repaso
 */
export const toggleCardNeedsReview = async (cardId) => {
  try {
    const cards = await getCards();
    const index = cards.findIndex(c => c.id === cardId);
    if (index !== -1) {
      cards[index] = {
        ...cards[index],
        needsReview: !cards[index].needsReview,
        updatedAt: new Date().toISOString()
      };
      await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));
      return cards[index];
    }
    return null;
  } catch (error) {
    console.error('Error alternando repaso:', error);
    throw error;
  }
};

/**
 * Obtiene tarjetas para la sección "Palabras para Repasar"
 * Incluye: tarjetas difíciles, marcadas para repaso y con errores recientes
 */
export const getReviewWords = async (deckId = null) => {
  try {
    let cards = deckId ? await getCardsByDeck(deckId) : await getCards();
    
    // Filtrar tarjetas que necesitan repaso
    const reviewCards = cards.filter(card => {
      // Tarjetas marcadas explícitamente para repaso
      if (card.needsReview) return true;
      
      // Tarjetas con factor de facilidad bajo (difíciles)
      if (card.repetitions > 0 && card.easeFactor < 2) return true;
      
      // Tarjetas con muchos errores (bajo rendimiento)
      if (card.repetitions > 0 && card.interval < 3 && card.easeFactor < 2.3) return true;
      
      return false;
    });
    
    // Ordenar por dificultad (easeFactor más bajo primero)
    return reviewCards.sort((a, b) => {
      // Priorizar las marcadas para repaso
      if (a.needsReview && !b.needsReview) return -1;
      if (!a.needsReview && b.needsReview) return 1;
      // Luego por facilidad
      return a.easeFactor - b.easeFactor;
    });
  } catch (error) {
    console.error('Error obteniendo palabras para repasar:', error);
    return [];
  }
};

/**
 * Cuenta las tarjetas que necesitan repaso
 */
export const getReviewWordsCount = async () => {
  try {
    const reviewCards = await getReviewWords();
    return reviewCards.length;
  } catch (error) {
    console.error('Error contando palabras para repasar:', error);
    return 0;
  }
};

// ==================== PALABRAS PROBLEMÁTICAS (TAGS) ====================

/**
 * Tipos de tags para clasificar palabras
 */
export const WORD_TAGS = {
  PROBLEMATIC: {
    id: 'problematic',
    label: '🔴 Problemática',
    shortLabel: '🔴',
    color: '#DC3545',
    description: 'Fallada 3+ veces seguidas',
    priority: 1,
  },
  STRUGGLING: {
    id: 'struggling',
    label: '🟠 Cuesta',
    shortLabel: '🟠',
    color: '#FF9800',
    description: 'Dificultad para memorizar',
    priority: 2,
  },
  NEEDS_PRACTICE: {
    id: 'needs_practice',
    label: '🟡 Practicar',
    shortLabel: '🟡',
    color: '#FFC107',
    description: 'Necesita más práctica',
    priority: 3,
  },
  IMPROVING: {
    id: 'improving',
    label: '🟢 Mejorando',
    shortLabel: '🟢',
    color: '#4CAF50',
    description: 'En proceso de aprendizaje',
    priority: 4,
  },
  MASTERED: {
    id: 'mastered',
    label: '⭐ Dominada',
    shortLabel: '⭐',
    color: '#FFD700',
    description: 'Palabra dominada',
    priority: 5,
  },
};

/**
 * Calcula el tag apropiado para una tarjeta basándose en su historial
 */
export const getCardTag = (card) => {
  // Problemática: 3+ fallos consecutivos
  if (card.isProblematic || card.consecutiveFailures >= 3) {
    return WORD_TAGS.PROBLEMATIC;
  }
  
  // Cuesta: muchos fallos totales o factor muy bajo
  if (card.totalFailures >= 5 || card.easeFactor < 1.5) {
    return WORD_TAGS.STRUGGLING;
  }
  
  // Necesita práctica: algunos fallos o factor bajo
  if (card.totalFailures >= 2 || (card.easeFactor < 2 && card.repetitions > 0)) {
    return WORD_TAGS.NEEDS_PRACTICE;
  }
  
  // Dominada: factor alto y muchas repeticiones exitosas
  if (card.easeFactor >= 2.5 && card.repetitions >= 5 && card.interval >= 21) {
    return WORD_TAGS.MASTERED;
  }
  
  // Mejorando: en proceso de aprendizaje
  if (card.repetitions > 0) {
    return WORD_TAGS.IMPROVING;
  }
  
  // Sin tag para tarjetas nuevas
  return null;
};

/**
 * Obtiene palabras problemáticas (las que más cuestan)
 */
export const getProblematicWords = async (deckId = null) => {
  try {
    let cards = deckId ? await getCardsByDeck(deckId) : await getCards();
    
    return cards
      .filter(card => {
        const tag = getCardTag(card);
        return tag && (
          tag.id === 'problematic' || 
          tag.id === 'struggling' ||
          card.isProblematic
        );
      })
      .sort((a, b) => {
        // Ordenar por prioridad de tag y luego por fallos
        const tagA = getCardTag(a);
        const tagB = getCardTag(b);
        if (tagA?.priority !== tagB?.priority) {
          return (tagA?.priority || 99) - (tagB?.priority || 99);
        }
        return (b.totalFailures || 0) - (a.totalFailures || 0);
      });
  } catch (error) {
    console.error('Error obteniendo palabras problemáticas:', error);
    return [];
  }
};

/**
 * Cuenta las palabras problemáticas
 */
export const getProblematicWordsCount = async () => {
  try {
    const problematicCards = await getProblematicWords();
    return problematicCards.length;
  } catch (error) {
    console.error('Error contando palabras problemáticas:', error);
    return 0;
  }
};

/**
 * Marca manualmente una palabra como problemática
 */
export const markCardAsProblematic = async (cardId, isProblematic = true) => {
  try {
    return await updateCard(cardId, {
      isProblematic,
      needsReview: isProblematic,
    });
  } catch (error) {
    console.error('Error marcando tarjeta como problemática:', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de tags para un mazo o todos
 */
export const getTagStats = async (deckId = null) => {
  try {
    let cards = deckId ? await getCardsByDeck(deckId) : await getCards();
    
    const stats = {
      problematic: 0,
      struggling: 0,
      needsPractice: 0,
      improving: 0,
      mastered: 0,
      newCards: 0,
    };
    
    for (const card of cards) {
      const tag = getCardTag(card);
      if (!tag) {
        stats.newCards++;
      } else {
        switch (tag.id) {
          case 'problematic': stats.problematic++; break;
          case 'struggling': stats.struggling++; break;
          case 'needs_practice': stats.needsPractice++; break;
          case 'improving': stats.improving++; break;
          case 'mastered': stats.mastered++; break;
        }
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas de tags:', error);
    return null;
  }
};

// ==================== ESTADÍSTICAS ====================

/**
 * Guarda una sesión de estudio
 */
export const saveStudySession = async (session) => {
  try {
    const stats = await getStudyStats();
    const newSession = {
      ...session,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    stats.sessions = stats.sessions || [];
    stats.sessions.push(newSession);
    
    // Actualizar totales
    stats.totalCardsStudied = (stats.totalCardsStudied || 0) + session.cardsStudied;
    stats.totalCorrect = (stats.totalCorrect || 0) + session.correct;
    stats.totalIncorrect = (stats.totalIncorrect || 0) + session.incorrect;
    stats.totalTimeMinutes = (stats.totalTimeMinutes || 0) + session.timeMinutes;
    
    // Actualizar racha
    const today = new Date().toDateString();
    const lastStudyDate = stats.lastStudyDate ? new Date(stats.lastStudyDate).toDateString() : null;
    
    if (lastStudyDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastStudyDate === yesterday.toDateString()) {
        stats.currentStreak = (stats.currentStreak || 0) + 1;
      } else if (lastStudyDate !== today) {
        stats.currentStreak = 1;
      }
      
      stats.longestStreak = Math.max(stats.longestStreak || 0, stats.currentStreak);
      stats.lastStudyDate = new Date().toISOString();
    }
    
    await AsyncStorage.setItem(STUDY_STATS_KEY, JSON.stringify(stats));
    return stats;
  } catch (error) {
    console.error('Error guardando sesión de estudio:', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de estudio
 */
export const getStudyStats = async () => {
  try {
    const statsJson = await AsyncStorage.getItem(STUDY_STATS_KEY);
    return statsJson ? JSON.parse(statsJson) : {
      sessions: [],
      totalCardsStudied: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      totalTimeMinutes: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      sessions: [],
      totalCardsStudied: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      totalTimeMinutes: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
    };
  }
};

/**
 * Obtiene estadísticas de un mazo específico
 */
export const getDeckStats = async (deckId) => {
  try {
    const cards = await getCardsByDeck(deckId);
    const settings = await getSettings();
    const now = new Date();
    
    const newCards = cards.filter(c => c.repetitions === 0);
    const learningCards = cards.filter(c => c.repetitions > 0 && c.interval < 21);
    const matureCards = cards.filter(c => c.interval >= 21);
    
    // Tarjetas pendientes totales
    const dueNewCards = newCards.filter(c => new Date(c.nextReview) <= now);
    const dueReviewCards = cards.filter(c => c.repetitions > 0 && new Date(c.nextReview) <= now);
    
    // Aplicar límites para "hoy"
    const todayNew = Math.min(dueNewCards.length, settings.newCardsPerDay);
    const todayReview = Math.min(dueReviewCards.length, settings.reviewsPerDay);
    
    const totalEaseFactor = cards.reduce((sum, c) => sum + c.easeFactor, 0);
    const avgEaseFactor = cards.length > 0 ? totalEaseFactor / cards.length : 2.5;
    
    return {
      totalCards: cards.length,
      newCards: newCards.length,
      learningCards: learningCards.length,
      matureCards: matureCards.length,
      // Totales pendientes (sin límite)
      dueCards: dueNewCards.length + dueReviewCards.length,
      dueNewCards: dueNewCards.length,
      dueReviewCards: dueReviewCards.length,
      // Lo que estudiarás hoy (con límite)
      todayCards: todayNew + todayReview,
      todayNew,
      todayReview,
      avgEaseFactor: avgEaseFactor.toFixed(2),
      settings,
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas del mazo:', error);
    return null;
  }
};

/**
 * Limpia todos los datos (para desarrollo/reset)
 */
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([DECKS_KEY, CARDS_KEY, STUDY_STATS_KEY]);
    return true;
  } catch (error) {
    console.error('Error limpiando datos:', error);
    throw error;
  }
};

// ==================== IMPORTAR/EXPORTAR ====================

/**
 * Exporta todos los datos
 */
export const exportData = async () => {
  try {
    const decks = await getDecks();
    const cards = await getCards();
    const stats = await getStudyStats();
    
    return {
      version: 1,
      exportDate: new Date().toISOString(),
      decks,
      cards,
      stats,
    };
  } catch (error) {
    console.error('Error exportando datos:', error);
    throw error;
  }
};

/**
 * Importa datos
 */
export const importData = async (data) => {
  try {
    if (data.decks) {
      await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(data.decks));
    }
    if (data.cards) {
      await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(data.cards));
    }
    if (data.stats) {
      await AsyncStorage.setItem(STUDY_STATS_KEY, JSON.stringify(data.stats));
    }
    return true;
  } catch (error) {
    console.error('Error importando datos:', error);
    throw error;
  }
};

// ==================== MAZOS POR DEFECTO ====================

const DEFAULT_DECKS = [
  {
    id: 'default_english_advanced',
    name: 'Inglés Avanzado',
    description: 'Vocabulario nivel B1-B2-C1 para dominar el inglés',
    color: '#4A90D9',
    icon: 'language',
    isDefault: true,
  },
  {
    id: 'default_english_verbs',
    name: 'Verbos Irregulares',
    description: 'Los verbos irregulares más comunes en inglés',
    color: '#E74C3C',
    icon: 'book',
    isDefault: true,
  },
  {
    id: 'default_english_phrases',
    name: 'Frases Cotidianas',
    description: 'Expresiones útiles para el día a día en inglés',
    color: '#27AE60',
    icon: 'chat',
    isDefault: true,
  },
  {
    id: 'default_spanish_vocab',
    name: 'Spanish for English Speakers',
    description: 'Essential Spanish vocabulary for beginners',
    color: '#F39C12',
    icon: 'flag',
    isDefault: true,
  },
  // ========== VOCABULARIO POR TEMAS ==========
  {
    id: 'topic_clothes',
    name: '👕 Ropa y Accesorios',
    description: 'Clothes and Accessories - Vocabulario de vestimenta',
    color: '#E91E63',
    icon: 'checkroom',
    isDefault: true,
  },
  {
    id: 'topic_colours',
    name: '🎨 Colores',
    description: 'Colours - Todos los colores en inglés',
    color: '#9C27B0',
    icon: 'palette',
    isDefault: true,
  },
  {
    id: 'topic_technology',
    name: '📱 Tecnología',
    description: 'Communications and Technology - Vocabulario digital',
    color: '#2196F3',
    icon: 'devices',
    isDefault: true,
  },
  {
    id: 'topic_education',
    name: '📚 Educación',
    description: 'Education - Vocabulario académico',
    color: '#FF9800',
    icon: 'school',
    isDefault: true,
  },
  {
    id: 'topic_entertainment',
    name: '🎬 Entretenimiento',
    description: 'Entertainment and Media - Cine, TV, música',
    color: '#F44336',
    icon: 'movie',
    isDefault: true,
  },
  {
    id: 'topic_environment',
    name: '🌍 Medio Ambiente',
    description: 'Environment - Ecología y naturaleza',
    color: '#4CAF50',
    icon: 'eco',
    isDefault: true,
  },
  {
    id: 'topic_food',
    name: '🍽️ Comida y Bebida',
    description: 'Food and Drink - Gastronomía',
    color: '#FF5722',
    icon: 'restaurant',
    isDefault: true,
  },
  {
    id: 'topic_health',
    name: '💊 Salud y Ejercicio',
    description: 'Health, Medicine and Exercise',
    color: '#00BCD4',
    icon: 'healing',
    isDefault: true,
  },
  {
    id: 'topic_hobbies',
    name: '🎨 Hobbies y Ocio',
    description: 'Hobbies and Leisure - Tiempo libre',
    color: '#673AB7',
    icon: 'sports_esports',
    isDefault: true,
  },
  {
    id: 'topic_house',
    name: '🏠 Casa y Hogar',
    description: 'House and Home - El hogar',
    color: '#795548',
    icon: 'home',
    isDefault: true,
  },
  {
    id: 'topic_language',
    name: '🗣️ Idiomas',
    description: 'Language - Aprendizaje de idiomas',
    color: '#607D8B',
    icon: 'translate',
    isDefault: true,
  },
  {
    id: 'topic_feelings',
    name: '😊 Sentimientos',
    description: 'Personal Feelings and Opinions - Adjetivos emocionales',
    color: '#E91E63',
    icon: 'mood',
    isDefault: true,
  },
  {
    id: 'topic_places',
    name: '🏛️ Lugares',
    description: 'Places, Buildings, Countryside - Edificios y naturaleza',
    color: '#3F51B5',
    icon: 'place',
    isDefault: true,
  },
  {
    id: 'topic_city',
    name: '🏙️ Ciudad y Servicios',
    description: 'Town, City and Services - Vida urbana',
    color: '#9E9E9E',
    icon: 'location_city',
    isDefault: true,
  },
  {
    id: 'topic_shopping',
    name: '🛒 Compras',
    description: 'Shopping - Vocabulario de tiendas',
    color: '#FFEB3B',
    icon: 'shopping_cart',
    isDefault: true,
  },
  {
    id: 'topic_sport',
    name: '⚽ Deportes',
    description: 'Sport - Vocabulario deportivo',
    color: '#8BC34A',
    icon: 'sports_soccer',
    isDefault: true,
  },
  {
    id: 'topic_nature',
    name: '🌿 Naturaleza',
    description: 'The Natural World - Flora y fauna',
    color: '#009688',
    icon: 'nature',
    isDefault: true,
  },
  {
    id: 'topic_time',
    name: '⏰ Tiempo',
    description: 'Time - Expresiones temporales',
    color: '#FF9800',
    icon: 'schedule',
    isDefault: true,
  },
  {
    id: 'topic_travel',
    name: '✈️ Viajes',
    description: 'Travel and Transport - Vocabulario de viaje',
    color: '#03A9F4',
    icon: 'flight',
    isDefault: true,
  },
  {
    id: 'topic_weather',
    name: '☀️ Clima',
    description: 'Weather - El tiempo atmosférico',
    color: '#FFC107',
    icon: 'wb_sunny',
    isDefault: true,
  },
  {
    id: 'topic_work',
    name: '💼 Trabajo',
    description: 'Work and Jobs - Vocabulario laboral',
    color: '#455A64',
    icon: 'work',
    isDefault: true,
  },
];

const DEFAULT_CARDS = {
  default_english_advanced: [
    // B1 - Intermediate vocabulary
    { front: 'Achievement', back: 'Logro', pronunciation: '/əˈtʃiːvmənt/', pronunciationEs: 'a-CHIV-ment', example: 'Graduating was a great achievement.', level: 'B1' },
    { front: 'Advice', back: 'Consejo', pronunciation: '/ədˈvaɪs/', pronunciationEs: 'ad-VAIS', example: 'Can you give me some advice?', level: 'B1' },
    { front: 'Afford', back: 'Permitirse', pronunciation: '/əˈfɔːrd/', pronunciationEs: 'a-FORD', example: "I can't afford a new car.", level: 'B1' },
    { front: 'Although', back: 'Aunque', pronunciation: '/ɔːlˈðoʊ/', pronunciationEs: 'ol-DOU', example: 'Although it rained, we went out.', level: 'B1' },
    { front: 'Appointment', back: 'Cita', pronunciation: '/əˈpɔɪntmənt/', pronunciationEs: 'a-POINT-ment', example: 'I have a doctor appointment.', level: 'B1' },
    { front: 'Arrangement', back: 'Acuerdo/Arreglo', pronunciation: '/əˈreɪndʒmənt/', pronunciationEs: 'a-REINCH-ment', example: 'We made arrangements for the trip.', level: 'B1' },
    { front: 'Avoid', back: 'Evitar', pronunciation: '/əˈvɔɪd/', pronunciationEs: 'a-VOID', example: 'Avoid eating too much sugar.', level: 'B1' },
    { front: 'Behaviour', back: 'Comportamiento', pronunciation: '/bɪˈheɪvjər/', pronunciationEs: 'bi-JEI-vior', example: 'His behaviour was unacceptable.', level: 'B1' },
    { front: 'Benefit', back: 'Beneficio', pronunciation: '/ˈbenɪfɪt/', pronunciationEs: 'BE-ne-fit', example: 'Exercise has many benefits.', level: 'B1' },
    { front: 'Complain', back: 'Quejarse', pronunciation: '/kəmˈpleɪn/', pronunciationEs: 'com-PLEIN', example: 'Customers often complain about prices.', level: 'B1' },
    { front: 'Confirm', back: 'Confirmar', pronunciation: '/kənˈfɜːrm/', pronunciationEs: 'con-FERM', example: 'Please confirm your reservation.', level: 'B1' },
    { front: 'Demand', back: 'Exigir/Demanda', pronunciation: '/dɪˈmænd/', pronunciationEs: 'di-MAND', example: 'The workers demand better wages.', level: 'B1' },
    { front: 'Disappointed', back: 'Decepcionado', pronunciation: '/ˌdɪsəˈpɔɪntɪd/', pronunciationEs: 'dis-a-POIN-tid', example: "I'm disappointed with the results.", level: 'B1' },
    { front: 'Encourage', back: 'Animar', pronunciation: '/ɪnˈkɜːrɪdʒ/', pronunciationEs: 'in-KA-rich', example: 'Teachers encourage students to read.', level: 'B1' },
    { front: 'Envelope', back: 'Sobre', pronunciation: '/ˈenvəloʊp/', pronunciationEs: 'EN-ve-loup', example: 'Put the letter in an envelope.', level: 'B1' },
    
    // B2 - Upper Intermediate vocabulary
    { front: 'Acknowledge', back: 'Reconocer/Admitir', pronunciation: '/əkˈnɒlɪdʒ/', pronunciationEs: 'ak-NO-lich', example: 'He acknowledged his mistake.', level: 'B2' },
    { front: 'Adequate', back: 'Adecuado', pronunciation: '/ˈædɪkwət/', pronunciationEs: 'A-de-kuet', example: 'The salary is adequate for the job.', level: 'B2' },
    { front: 'Apparently', back: 'Aparentemente', pronunciation: '/əˈpærəntli/', pronunciationEs: 'a-PA-rent-li', example: 'Apparently, she quit her job.', level: 'B2' },
    { front: 'Approximately', back: 'Aproximadamente', pronunciation: '/əˈprɒksɪmətli/', pronunciationEs: 'a-PROX-i-met-li', example: 'It takes approximately two hours.', level: 'B2' },
    { front: 'Breakthrough', back: 'Avance importante', pronunciation: '/ˈbreɪkθruː/', pronunciationEs: 'BREIK-zru', example: 'Scientists made a breakthrough.', level: 'B2' },
    { front: 'Circumstances', back: 'Circunstancias', pronunciation: '/ˈsɜːrkəmstænsɪz/', pronunciationEs: 'SER-com-stansiz', example: 'Under the circumstances, we agreed.', level: 'B2' },
    { front: 'Consequence', back: 'Consecuencia', pronunciation: '/ˈkɒnsɪkwəns/', pronunciationEs: 'CON-si-kuens', example: 'Every action has consequences.', level: 'B2' },
    { front: 'Contemporary', back: 'Contemporáneo', pronunciation: '/kənˈtempəreri/', pronunciationEs: 'con-TEM-po-reri', example: 'Contemporary art is fascinating.', level: 'B2' },
    { front: 'Controversial', back: 'Controvertido', pronunciation: '/ˌkɒntrəˈvɜːrʃəl/', pronunciationEs: 'con-tro-VER-shal', example: 'It is a controversial topic.', level: 'B2' },
    { front: 'Deliberate', back: 'Deliberado', pronunciation: '/dɪˈlɪbərət/', pronunciationEs: 'di-LI-be-ret', example: 'It was a deliberate decision.', level: 'B2' },
    { front: 'Distinguish', back: 'Distinguir', pronunciation: '/dɪˈstɪŋɡwɪʃ/', pronunciationEs: 'dis-TIN-guish', example: "Can you distinguish between them?", level: 'B2' },
    { front: 'Dramatic', back: 'Drástico/Dramático', pronunciation: '/drəˈmætɪk/', pronunciationEs: 'dra-MA-tik', example: 'There was a dramatic change.', level: 'B2' },
    { front: 'Emphasis', back: 'Énfasis', pronunciation: '/ˈemfəsɪs/', pronunciationEs: 'EM-fa-sis', example: 'Put emphasis on pronunciation.', level: 'B2' },
    { front: 'Eventually', back: 'Finalmente', pronunciation: '/ɪˈventʃuəli/', pronunciationEs: 'i-VEN-chu-ali', example: 'Eventually, she found a job.', level: 'B2' },
    { front: 'Furthermore', back: 'Además', pronunciation: '/ˈfɜːrðərmɔːr/', pronunciationEs: 'FER-der-mor', example: 'Furthermore, the price is low.', level: 'B2' },
    { front: 'Genuine', back: 'Genuino/Auténtico', pronunciation: '/ˈdʒenjuɪn/', pronunciationEs: 'YE-niu-in', example: 'Is this a genuine product?', level: 'B2' },
    { front: 'Hesitate', back: 'Dudar/Vacilar', pronunciation: '/ˈhezɪteɪt/', pronunciationEs: 'JE-si-teit', example: "Don't hesitate to ask.", level: 'B2' },
    { front: 'Inevitable', back: 'Inevitable', pronunciation: '/ɪnˈevɪtəbl/', pronunciationEs: 'in-E-vi-tabol', example: 'Change is inevitable.', level: 'B2' },
    { front: 'Nevertheless', back: 'Sin embargo', pronunciation: '/ˌnevərðəˈles/', pronunciationEs: 'never-de-LES', example: 'Nevertheless, we continued.', level: 'B2' },
    { front: 'Overwhelming', back: 'Abrumador', pronunciation: '/ˌoʊvərˈwelmɪŋ/', pronunciationEs: 'ouver-UELM-in', example: 'The response was overwhelming.', level: 'B2' },
    
    // C1 - Advanced vocabulary
    { front: 'Abolish', back: 'Abolir', pronunciation: '/əˈbɒlɪʃ/', pronunciationEs: 'a-BO-lish', example: 'They want to abolish the law.', level: 'C1' },
    { front: 'Abundant', back: 'Abundante', pronunciation: '/əˈbʌndənt/', pronunciationEs: 'a-BAN-dant', example: 'The region has abundant resources.', level: 'C1' },
    { front: 'Acquisition', back: 'Adquisición', pronunciation: '/ˌækwɪˈzɪʃən/', pronunciationEs: 'akui-SI-shon', example: 'The acquisition was successful.', level: 'C1' },
    { front: 'Ambiguous', back: 'Ambiguo', pronunciation: '/æmˈbɪɡjuəs/', pronunciationEs: 'am-BI-guios', example: 'His answer was ambiguous.', level: 'C1' },
    { front: 'Apprehensive', back: 'Aprensivo', pronunciation: '/ˌæprɪˈhensɪv/', pronunciationEs: 'apri-JEN-siv', example: 'She felt apprehensive about the exam.', level: 'C1' },
    { front: 'Compelling', back: 'Convincente', pronunciation: '/kəmˈpelɪŋ/', pronunciationEs: 'com-PE-lin', example: 'He made a compelling argument.', level: 'C1' },
    { front: 'Comprise', back: 'Comprender/Consistir', pronunciation: '/kəmˈpraɪz/', pronunciationEs: 'com-PRAIZ', example: 'The team comprises ten members.', level: 'C1' },
    { front: 'Conceive', back: 'Concebir', pronunciation: '/kənˈsiːv/', pronunciationEs: 'con-SIV', example: 'I cannot conceive such an idea.', level: 'C1' },
    { front: 'Contemplate', back: 'Contemplar', pronunciation: '/ˈkɒntəmpleɪt/', pronunciationEs: 'CON-tem-pleit', example: 'He contemplated his options.', level: 'C1' },
    { front: 'Detrimental', back: 'Perjudicial', pronunciation: '/ˌdetrɪˈmentl/', pronunciationEs: 'detri-MEN-tal', example: 'Smoking is detrimental to health.', level: 'C1' },
    { front: 'Elicit', back: 'Provocar/Suscitar', pronunciation: '/ɪˈlɪsɪt/', pronunciationEs: 'i-LI-sit', example: 'The news elicited strong reactions.', level: 'C1' },
    { front: 'Endeavour', back: 'Esfuerzo/Empeño', pronunciation: '/ɪnˈdevər/', pronunciationEs: 'in-DE-vor', example: 'It is a worthy endeavour.', level: 'C1' },
    { front: 'Exacerbate', back: 'Exacerbar', pronunciation: '/ɪɡˈzæsərbeɪt/', pronunciationEs: 'ig-SA-ser-beit', example: 'The crisis exacerbated the problem.', level: 'C1' },
    { front: 'Feasible', back: 'Factible', pronunciation: '/ˈfiːzəbl/', pronunciationEs: 'FI-si-bol', example: 'Is this plan feasible?', level: 'C1' },
    { front: 'Implications', back: 'Implicaciones', pronunciation: '/ˌɪmplɪˈkeɪʃənz/', pronunciationEs: 'impli-KEI-shons', example: 'Consider the implications.', level: 'C1' },
    { front: 'Inherent', back: 'Inherente', pronunciation: '/ɪnˈhɪərənt/', pronunciationEs: 'in-JI-rent', example: 'There are inherent risks involved.', level: 'C1' },
    { front: 'Intricate', back: 'Intrincado', pronunciation: '/ˈɪntrɪkət/', pronunciationEs: 'IN-tri-ket', example: 'The design is intricate.', level: 'C1' },
    { front: 'Legitimate', back: 'Legítimo', pronunciation: '/lɪˈdʒɪtɪmət/', pronunciationEs: 'li-YI-ti-met', example: 'Is this a legitimate business?', level: 'C1' },
    { front: 'Meticulous', back: 'Meticuloso', pronunciation: '/məˈtɪkjələs/', pronunciationEs: 'me-TI-kiu-los', example: 'She is meticulous in her work.', level: 'C1' },
    { front: 'Nonetheless', back: 'No obstante', pronunciation: '/ˌnʌnðəˈles/', pronunciationEs: 'nan-de-LES', example: 'Nonetheless, he persevered.', level: 'C1' },
    { front: 'Paramount', back: 'Primordial', pronunciation: '/ˈpærəmaʊnt/', pronunciationEs: 'PA-ra-maunt', example: 'Safety is paramount.', level: 'C1' },
    { front: 'Perpetuate', back: 'Perpetuar', pronunciation: '/pərˈpetʃueɪt/', pronunciationEs: 'per-PE-chu-eit', example: 'We should not perpetuate stereotypes.', level: 'C1' },
    { front: 'Prevalent', back: 'Prevalente', pronunciation: '/ˈprevələnt/', pronunciationEs: 'PRE-va-lent', example: 'This disease is prevalent here.', level: 'C1' },
    { front: 'Profound', back: 'Profundo', pronunciation: '/prəˈfaʊnd/', pronunciationEs: 'pro-FAUND', example: 'It had a profound impact.', level: 'C1' },
    { front: 'Scrutinize', back: 'Escrutar', pronunciation: '/ˈskruːtənaɪz/', pronunciationEs: 'SCRU-ti-naiz', example: 'They will scrutinize your work.', level: 'C1' },
    { front: 'Subsequent', back: 'Subsiguiente', pronunciation: '/ˈsʌbsɪkwənt/', pronunciationEs: 'SAB-si-kuent', example: 'In subsequent years, things changed.', level: 'C1' },
    { front: 'Substantial', back: 'Sustancial', pronunciation: '/səbˈstænʃəl/', pronunciationEs: 'sob-STAN-shal', example: 'There was a substantial increase.', level: 'C1' },
    { front: 'Tangible', back: 'Tangible', pronunciation: '/ˈtændʒəbl/', pronunciationEs: 'TAN-yi-bol', example: 'We need tangible results.', level: 'C1' },
    { front: 'Underlying', back: 'Subyacente', pronunciation: '/ˌʌndərˈlaɪɪŋ/', pronunciationEs: 'ander-LAI-in', example: 'The underlying cause is unclear.', level: 'C1' },
    { front: 'Unprecedented', back: 'Sin precedentes', pronunciation: '/ʌnˈpresɪdentɪd/', pronunciationEs: 'an-PRE-si-dentid', example: 'This is an unprecedented situation.', level: 'C1' },
  ],
  default_english_verbs: [
    // Verbos irregulares más comunes - A2/B1/B2
    { front: 'be - was/were - been', back: 'ser/estar', pronunciation: '/biː - wɒz/wɜːr - biːn/', pronunciationEs: 'bi - uos/uer - bin', example: 'I have been here before.', level: 'A2' },
    { front: 'have - had - had', back: 'tener', pronunciation: '/hæv - hæd - hæd/', pronunciationEs: 'jav - jad - jad', example: 'I had a great time.', level: 'A2' },
    { front: 'do - did - done', back: 'hacer', pronunciation: '/duː - dɪd - dʌn/', pronunciationEs: 'du - did - dan', example: 'I have done my homework.', level: 'A2' },
    { front: 'say - said - said', back: 'decir', pronunciation: '/seɪ - sed - sed/', pronunciationEs: 'sei - sed - sed', example: 'She said hello.', level: 'A2' },
    { front: 'go - went - gone', back: 'ir', pronunciation: '/ɡoʊ - went - ɡɒn/', pronunciationEs: 'gou - uent - gon', example: 'He has gone home.', level: 'A2' },
    { front: 'get - got - gotten', back: 'obtener', pronunciation: '/ɡet - ɡɒt - ˈɡɒtn/', pronunciationEs: 'guet - got - gotn', example: "I've gotten better.", level: 'B1' },
    { front: 'make - made - made', back: 'hacer/fabricar', pronunciation: '/meɪk - meɪd - meɪd/', pronunciationEs: 'meik - meid - meid', example: 'She made a cake.', level: 'A2' },
    { front: 'know - knew - known', back: 'saber/conocer', pronunciation: '/noʊ - njuː - noʊn/', pronunciationEs: 'nou - niu - noun', example: "I've known him for years.", level: 'B1' },
    { front: 'think - thought - thought', back: 'pensar', pronunciation: '/θɪŋk - θɔːt - θɔːt/', pronunciationEs: 'zink - zot - zot', example: 'I thought about it.', level: 'A2' },
    { front: 'take - took - taken', back: 'tomar/llevar', pronunciation: '/teɪk - tʊk - ˈteɪkən/', pronunciationEs: 'teik - tuk - teiken', example: 'I took the bus.', level: 'A2' },
    { front: 'see - saw - seen', back: 'ver', pronunciation: '/siː - sɔː - siːn/', pronunciationEs: 'si - so - sin', example: 'I have seen that movie.', level: 'A2' },
    { front: 'come - came - come', back: 'venir', pronunciation: '/kʌm - keɪm - kʌm/', pronunciationEs: 'cam - keim - cam', example: 'He came yesterday.', level: 'A2' },
    { front: 'find - found - found', back: 'encontrar', pronunciation: '/faɪnd - faʊnd - faʊnd/', pronunciationEs: 'faind - faund - faund', example: 'I found my keys.', level: 'B1' },
    { front: 'give - gave - given', back: 'dar', pronunciation: '/ɡɪv - ɡeɪv - ˈɡɪvən/', pronunciationEs: 'giv - geiv - given', example: 'She gave me a gift.', level: 'A2' },
    { front: 'tell - told - told', back: 'contar/decir', pronunciation: '/tel - toʊld - toʊld/', pronunciationEs: 'tel - tould - tould', example: 'He told me the truth.', level: 'B1' },
    { front: 'feel - felt - felt', back: 'sentir', pronunciation: '/fiːl - felt - felt/', pronunciationEs: 'fil - felt - felt', example: 'I felt happy.', level: 'B1' },
    { front: 'become - became - become', back: 'convertirse', pronunciation: '/bɪˈkʌm - bɪˈkeɪm - bɪˈkʌm/', pronunciationEs: 'bi-CAM - bi-KEIM - bi-CAM', example: 'She became a doctor.', level: 'B1' },
    { front: 'leave - left - left', back: 'dejar/irse', pronunciation: '/liːv - left - left/', pronunciationEs: 'liv - left - left', example: 'I left early.', level: 'B1' },
    { front: 'put - put - put', back: 'poner', pronunciation: '/pʊt - pʊt - pʊt/', pronunciationEs: 'put - put - put', example: 'Put it on the table.', level: 'A2' },
    { front: 'bring - brought - brought', back: 'traer', pronunciation: '/brɪŋ - brɔːt - brɔːt/', pronunciationEs: 'bring - brot - brot', example: 'Bring your books.', level: 'B1' },
    { front: 'begin - began - begun', back: 'comenzar', pronunciation: '/bɪˈɡɪn - bɪˈɡæn - bɪˈɡʌn/', pronunciationEs: 'bi-GUIN - bi-GAN - bi-GAN', example: 'The show has begun.', level: 'B1' },
    { front: 'keep - kept - kept', back: 'mantener/guardar', pronunciation: '/kiːp - kept - kept/', pronunciationEs: 'kip - kept - kept', example: 'Keep the change.', level: 'B1' },
    { front: 'hold - held - held', back: 'sostener', pronunciation: '/hoʊld - held - held/', pronunciationEs: 'jould - jeld - jeld', example: 'Hold my hand.', level: 'B1' },
    { front: 'write - wrote - written', back: 'escribir', pronunciation: '/raɪt - roʊt - ˈrɪtn/', pronunciationEs: 'rait - rout - ritn', example: "I've written a letter.", level: 'B1' },
    { front: 'stand - stood - stood', back: 'estar de pie', pronunciation: '/stænd - stʊd - stʊd/', pronunciationEs: 'stand - stud - stud', example: 'Stand up, please.', level: 'B1' },
    { front: 'hear - heard - heard', back: 'oír', pronunciation: '/hɪər - hɜːrd - hɜːrd/', pronunciationEs: 'jier - jerd - jerd', example: 'I heard a noise.', level: 'A2' },
    { front: 'let - let - let', back: 'dejar/permitir', pronunciation: '/let - let - let/', pronunciationEs: 'let - let - let', example: 'Let me help you.', level: 'A2' },
    { front: 'mean - meant - meant', back: 'significar', pronunciation: '/miːn - ment - ment/', pronunciationEs: 'min - ment - ment', example: 'What does it mean?', level: 'B1' },
    { front: 'set - set - set', back: 'establecer/poner', pronunciation: '/set - set - set/', pronunciationEs: 'set - set - set', example: 'Set the table.', level: 'B1' },
    { front: 'meet - met - met', back: 'conocer/encontrar', pronunciation: '/miːt - met - met/', pronunciationEs: 'mit - met - met', example: 'Nice to meet you.', level: 'A2' },
    { front: 'run - ran - run', back: 'correr', pronunciation: '/rʌn - ræn - rʌn/', pronunciationEs: 'ran - ran - ran', example: 'I ran a marathon.', level: 'A2' },
    { front: 'pay - paid - paid', back: 'pagar', pronunciation: '/peɪ - peɪd - peɪd/', pronunciationEs: 'pei - peid - peid', example: 'I paid the bill.', level: 'A2' },
    { front: 'sit - sat - sat', back: 'sentarse', pronunciation: '/sɪt - sæt - sæt/', pronunciationEs: 'sit - sat - sat', example: 'Sit down, please.', level: 'A2' },
    { front: 'speak - spoke - spoken', back: 'hablar', pronunciation: '/spiːk - spoʊk - ˈspoʊkən/', pronunciationEs: 'spik - spouk - spoukn', example: 'I have spoken to him.', level: 'B1' },
    { front: 'read - read - read', back: 'leer', pronunciation: '/riːd - red - red/', pronunciationEs: 'rid - red - red', example: 'I read a book yesterday.', level: 'A2' },
    { front: 'grow - grew - grown', back: 'crecer', pronunciation: '/ɡroʊ - ɡruː - ɡroʊn/', pronunciationEs: 'grou - gru - groun', example: "She's grown so much!", level: 'B1' },
    { front: 'lose - lost - lost', back: 'perder', pronunciation: '/luːz - lɒst - lɒst/', pronunciationEs: 'luz - lost - lost', example: 'I lost my wallet.', level: 'B1' },
    { front: 'fall - fell - fallen', back: 'caer', pronunciation: '/fɔːl - fel - ˈfɔːlən/', pronunciationEs: 'fol - fel - folen', example: 'The leaves have fallen.', level: 'B1' },
    { front: 'send - sent - sent', back: 'enviar', pronunciation: '/send - sent - sent/', pronunciationEs: 'send - sent - sent', example: 'I sent an email.', level: 'A2' },
    { front: 'build - built - built', back: 'construir', pronunciation: '/bɪld - bɪlt - bɪlt/', pronunciationEs: 'bild - bilt - bilt', example: 'They built a house.', level: 'B1' },
    { front: 'buy - bought - bought', back: 'comprar', pronunciation: '/baɪ - bɔːt - bɔːt/', pronunciationEs: 'bai - bot - bot', example: 'I bought a new car.', level: 'A2' },
    { front: 'understand - understood - understood', back: 'entender', pronunciation: '/ˌʌndərˈstænd - ˌʌndərˈstʊd/', pronunciationEs: 'ander-STAND - ander-STUD', example: 'I understood everything.', level: 'B1' },
    { front: 'draw - drew - drawn', back: 'dibujar', pronunciation: '/drɔː - druː - drɔːn/', pronunciationEs: 'dro - dru - dron', example: 'She drew a picture.', level: 'B1' },
    { front: 'break - broke - broken', back: 'romper', pronunciation: '/breɪk - broʊk - ˈbroʊkən/', pronunciationEs: 'breik - brouk - brouken', example: 'The vase is broken.', level: 'B1' },
    { front: 'spend - spent - spent', back: 'gastar', pronunciation: '/spend - spent - spent/', pronunciationEs: 'spend - spent - spent', example: 'I spent too much.', level: 'B1' },
    { front: 'cut - cut - cut', back: 'cortar', pronunciation: '/kʌt - kʌt - kʌt/', pronunciationEs: 'cat - cat - cat', example: 'Cut the paper.', level: 'A2' },
    { front: 'catch - caught - caught', back: 'atrapar', pronunciation: '/kætʃ - kɔːt - kɔːt/', pronunciationEs: 'kach - kot - kot', example: 'I caught the ball.', level: 'B1' },
    { front: 'eat - ate - eaten', back: 'comer', pronunciation: '/iːt - eɪt - ˈiːtn/', pronunciationEs: 'it - eit - itn', example: 'I have eaten lunch.', level: 'A2' },
    { front: 'drive - drove - driven', back: 'conducir', pronunciation: '/draɪv - droʊv - ˈdrɪvən/', pronunciationEs: 'draiv - drouv - driven', example: 'I drove to work.', level: 'B1' },
    { front: 'teach - taught - taught', back: 'enseñar', pronunciation: '/tiːtʃ - tɔːt - tɔːt/', pronunciationEs: 'tich - tot - tot', example: 'She taught me Spanish.', level: 'B1' },
  ],
  default_english_phrases: [
    // Presentaciones - A1/A2
    { front: 'How are you?', back: '¿Cómo estás?', pronunciation: '/haʊ ɑːr juː/', pronunciationEs: 'jau ar yu', example: 'Hi John, how are you?', level: 'A1' },
    { front: "I'm fine, thank you", back: 'Estoy bien, gracias', pronunciation: '/aɪm faɪn θæŋk juː/', pronunciationEs: 'aim fain zenk yu', example: "I'm fine, thank you. And you?", level: 'A1' },
    { front: 'Nice to meet you', back: 'Encantado de conocerte', pronunciation: '/naɪs tuː miːt juː/', pronunciationEs: 'nais tu mit yu', example: 'Nice to meet you, Sarah.', level: 'A1' },
    { front: 'What do you do?', back: '¿A qué te dedicas?', pronunciation: '/wɒt duː juː duː/', pronunciationEs: 'uot du yu du', example: "What do you do for a living?", level: 'A2' },
    { front: "I'm from...", back: 'Soy de...', pronunciation: '/aɪm frɒm/', pronunciationEs: 'aim from', example: "I'm from Spain.", level: 'A1' },
    // Preguntas útiles - A1/A2
    { front: 'How much is this?', back: '¿Cuánto cuesta esto?', pronunciation: '/haʊ mʌtʃ ɪz ðɪs/', pronunciationEs: 'jau mach is dis', example: 'How much is this shirt?', level: 'A1' },
    { front: 'Where is the bathroom?', back: '¿Dónde está el baño?', pronunciation: '/weər ɪz ðə ˈbæθruːm/', pronunciationEs: 'uer is de baz-rum', example: 'Excuse me, where is the bathroom?', level: 'A1' },
    { front: 'What time is it?', back: '¿Qué hora es?', pronunciation: '/wɒt taɪm ɪz ɪt/', pronunciationEs: 'uot taim is it', example: 'What time is it, please?', level: 'A1' },
    { front: 'Can you help me?', back: '¿Puede ayudarme?', pronunciation: '/kæn juː help miː/', pronunciationEs: 'kan yu jelp mi', example: 'Excuse me, can you help me?', level: 'A1' },
    { front: 'Do you speak English?', back: '¿Habla inglés?', pronunciation: '/duː juː spiːk ˈɪŋɡlɪʃ/', pronunciationEs: 'du yu spik IN-glish', example: 'Do you speak English?', level: 'A1' },
    // Expresiones de opinión - B1
    { front: 'I think that...', back: 'Creo que...', pronunciation: '/aɪ θɪŋk ðæt/', pronunciationEs: 'ai zink dat', example: 'I think that is a great idea.', level: 'A2' },
    { front: 'In my opinion...', back: 'En mi opinión...', pronunciation: '/ɪn maɪ əˈpɪnjən/', pronunciationEs: 'in mai o-PI-nion', example: 'In my opinion, it is too expensive.', level: 'B1' },
    { front: 'I agree', back: 'Estoy de acuerdo', pronunciation: '/aɪ əˈɡriː/', pronunciationEs: 'ai a-GRI', example: 'Yes, I agree with you.', level: 'A2' },
    { front: 'I disagree', back: 'No estoy de acuerdo', pronunciation: '/aɪ dɪsəˈɡriː/', pronunciationEs: 'ai dis-a-GRI', example: "I'm sorry, but I disagree.", level: 'B1' },
    { front: "I'm not sure", back: 'No estoy seguro', pronunciation: '/aɪm nɒt ʃʊər/', pronunciationEs: 'aim not shur', example: "I'm not sure about that.", level: 'A2' },
    // Expresiones de tiempo - A2/B1
    { front: 'See you later', back: 'Hasta luego', pronunciation: '/siː juː ˈleɪtər/', pronunciationEs: 'si yu LEI-ter', example: 'Bye! See you later.', level: 'A1' },
    { front: 'Just a moment', back: 'Un momento', pronunciation: '/dʒʌst ə ˈmoʊmənt/', pronunciationEs: 'yast a MOU-ment', example: 'Just a moment, please.', level: 'A2' },
    { front: 'Right away', back: 'Enseguida', pronunciation: '/raɪt əˈweɪ/', pronunciationEs: 'rait a-UEI', example: "I'll be there right away.", level: 'B1' },
    { front: 'As soon as possible', back: 'Lo antes posible', pronunciation: '/æz suːn æz ˈpɒsəbl/', pronunciationEs: 'as sun as PO-sibol', example: 'Please reply as soon as possible.', level: 'B1' },
    { front: 'From time to time', back: 'De vez en cuando', pronunciation: '/frɒm taɪm tuː taɪm/', pronunciationEs: 'from taim tu taim', example: 'I visit them from time to time.', level: 'B1' },
    // Expresiones comunes - A2/B1
    { front: "It doesn't matter", back: 'No importa', pronunciation: '/ɪt ˈdʌznt ˈmætər/', pronunciationEs: 'it DASNT MA-ter', example: "It doesn't matter, don't worry.", level: 'A2' },
    { front: 'Never mind', back: 'No te preocupes', pronunciation: '/ˈnevər maɪnd/', pronunciationEs: 'NE-ver maind', example: 'Never mind, I found it.', level: 'B1' },
    { front: 'Of course', back: 'Por supuesto', pronunciation: '/ɒv kɔːrs/', pronunciationEs: 'of cors', example: 'Of course you can come!', level: 'A2' },
    { front: 'No problem', back: 'No hay problema', pronunciation: '/noʊ ˈprɒbləm/', pronunciationEs: 'nou PRO-blem', example: 'No problem, I can help you.', level: 'A1' },
    { front: 'Take your time', back: 'Tómate tu tiempo', pronunciation: '/teɪk jɔːr taɪm/', pronunciationEs: 'teik yor taim', example: 'Take your time, no rush.', level: 'B1' },
    { front: 'Good luck!', back: '¡Buena suerte!', pronunciation: '/ɡʊd lʌk/', pronunciationEs: 'gud lak', example: 'Good luck on your exam!', level: 'A1' },
    { front: 'Congratulations!', back: '¡Felicidades!', pronunciation: '/kənˌɡrætʃəˈleɪʃənz/', pronunciationEs: 'con-gratchu-LEI-shons', example: 'Congratulations on your promotion!', level: 'A2' },
    { front: "I'm sorry to hear that", back: 'Lamento escuchar eso', pronunciation: '/aɪm ˈsɒri tuː hɪər ðæt/', pronunciationEs: 'aim SO-ri tu jier dat', example: "I'm sorry to hear that you're sick.", level: 'B1' },
    { front: 'Have a nice day!', back: '¡Que tengas un buen día!', pronunciation: '/hæv ə naɪs deɪ/', pronunciationEs: 'jav a nais dei', example: 'Goodbye! Have a nice day!', level: 'A1' },
    { front: 'Take care!', back: '¡Cuídate!', pronunciation: '/teɪk keər/', pronunciationEs: 'teik ker', example: 'See you soon, take care!', level: 'A1' },
  ],
  default_spanish_vocab: [
    // Basic greetings - A1
    { front: 'Hola', back: 'Hello', example: '¡Hola! ¿Qué tal?', level: 'A1' },
    { front: 'Buenos días', back: 'Good morning', example: 'Buenos días, señor.', level: 'A1' },
    { front: 'Buenas tardes', back: 'Good afternoon', example: 'Buenas tardes a todos.', level: 'A1' },
    { front: 'Buenas noches', back: 'Good evening/night', example: 'Buenas noches, hasta mañana.', level: 'A1' },
    { front: 'Adiós', back: 'Goodbye', example: '¡Adiós, nos vemos!', level: 'A1' },
    // Common expressions - A1
    { front: 'Por favor', back: 'Please', example: 'Un café, por favor.', level: 'A1' },
    { front: 'Gracias', back: 'Thank you', example: 'Muchas gracias por tu ayuda.', level: 'A1' },
    { front: 'De nada', back: "You're welcome", example: 'De nada, fue un placer.', level: 'A1' },
    { front: 'Lo siento', back: "I'm sorry", example: 'Lo siento, llegué tarde.', level: 'A1' },
    { front: 'Perdón', back: 'Excuse me/Sorry', example: 'Perdón, ¿puede repetir?', level: 'A1' },
    // Questions - A1/A2
    { front: '¿Cómo estás?', back: 'How are you?', example: '¡Hola! ¿Cómo estás?', level: 'A1' },
    { front: '¿Qué tal?', back: "How's it going?", example: '¿Qué tal el trabajo?', level: 'A1' },
    { front: '¿Dónde está...?', back: 'Where is...?', example: '¿Dónde está el banco?', level: 'A1' },
    { front: '¿Cuánto cuesta?', back: 'How much does it cost?', example: '¿Cuánto cuesta este libro?', level: 'A1' },
    { front: '¿Habla inglés?', back: 'Do you speak English?', example: 'Perdón, ¿habla inglés?', level: 'A1' },
    // Numbers - A1
    { front: 'Uno', back: 'One', example: 'Solo necesito uno.', level: 'A1' },
    { front: 'Dos', back: 'Two', example: 'Tengo dos hermanos.', level: 'A1' },
    { front: 'Tres', back: 'Three', example: 'Son las tres de la tarde.', level: 'A1' },
    { front: 'Diez', back: 'Ten', example: 'Faltan diez minutos.', level: 'A1' },
    { front: 'Cien', back: 'One hundred', example: 'Cuesta cien euros.', level: 'A1' },
    // Food & drinks - A1
    { front: 'Agua', back: 'Water', example: 'Un vaso de agua, por favor.', level: 'A1' },
    { front: 'Café', back: 'Coffee', example: 'Me gusta el café con leche.', level: 'A1' },
    { front: 'Cerveza', back: 'Beer', example: 'Dos cervezas, por favor.', level: 'A1' },
    { front: 'Pan', back: 'Bread', example: 'El pan está caliente.', level: 'A1' },
    { front: 'Comida', back: 'Food', example: 'La comida está deliciosa.', level: 'A1' },
    // Days of the week - A1
    { front: 'Lunes', back: 'Monday', example: 'El lunes tengo una reunión.', level: 'A1' },
    { front: 'Martes', back: 'Tuesday', example: 'Nos vemos el martes.', level: 'A1' },
    { front: 'Miércoles', back: 'Wednesday', example: 'El miércoles es mi día libre.', level: 'A1' },
    { front: 'Jueves', back: 'Thursday', example: 'El jueves hay fiesta.', level: 'A1' },
    { front: 'Viernes', back: 'Friday', example: '¡Por fin es viernes!', level: 'A1' },
    { front: 'Sábado', back: 'Saturday', example: 'El sábado vamos a la playa.', level: 'A1' },
    { front: 'Domingo', back: 'Sunday', example: 'El domingo descanso en casa.', level: 'A1' },
    // Common verbs - A1/A2
    { front: 'Ser/Estar', back: 'To be', example: 'Soy estudiante. Estoy cansado.', level: 'A1' },
    { front: 'Tener', back: 'To have', example: 'Tengo una pregunta.', level: 'A1' },
    { front: 'Ir', back: 'To go', example: 'Voy al supermercado.', level: 'A1' },
    { front: 'Querer', back: 'To want', example: 'Quiero un helado.', level: 'A1' },
    { front: 'Poder', back: 'Can/To be able', example: '¿Puedo entrar?', level: 'A2' },
    { front: 'Hablar', back: 'To speak', example: 'Hablo español.', level: 'A1' },
    { front: 'Comer', back: 'To eat', example: '¿Dónde vamos a comer?', level: 'A1' },
    { front: 'Beber', back: 'To drink', example: '¿Qué quieres beber?', level: 'A1' },
  ],
  // ==================== TOPIC VOCABULARY CARDS ====================
  topic_clothes: [
    { front: 'Shirt', back: 'Camisa', pronunciation: '/ʃɜːrt/', pronunciationEs: 'shert', example: 'I need to iron my shirt.', level: 'A1' },
    { front: 'Trousers', back: 'Pantalones', pronunciation: '/ˈtraʊzərz/', pronunciationEs: 'TRAU-sers', example: 'These trousers are too tight.', level: 'A1' },
    { front: 'Dress', back: 'Vestido', pronunciation: '/dres/', pronunciationEs: 'dres', example: 'She wore a beautiful dress.', level: 'A1' },
    { front: 'Jacket', back: 'Chaqueta', pronunciation: '/ˈdʒækɪt/', pronunciationEs: 'YA-kit', example: 'Take your jacket, it\'s cold.', level: 'A1' },
    { front: 'Scarf', back: 'Bufanda', pronunciation: '/skɑːrf/', pronunciationEs: 'skarf', example: 'I wrapped a scarf around my neck.', level: 'A2' },
    { front: 'Earrings', back: 'Pendientes', pronunciation: '/ˈɪərɪŋz/', pronunciationEs: 'IR-ings', example: 'She lost one of her earrings.', level: 'A2' },
    { front: 'Bracelet', back: 'Pulsera', pronunciation: '/ˈbreɪslət/', pronunciationEs: 'BREIS-let', example: 'She wears a gold bracelet.', level: 'A2' },
    { front: 'Sleeve', back: 'Manga', pronunciation: '/sliːv/', pronunciationEs: 'sliv', example: 'Roll up your sleeves.', level: 'B1' },
    { front: 'Outfit', back: 'Conjunto/Atuendo', pronunciation: '/ˈaʊtfɪt/', pronunciationEs: 'AUT-fit', example: 'That\'s a nice outfit!', level: 'B1' },
    { front: 'Wardrobe', back: 'Armario/Guardarropa', pronunciation: '/ˈwɔːrdroʊb/', pronunciationEs: 'UORD-roub', example: 'My wardrobe needs organizing.', level: 'B1' },
    { front: 'Blouse', back: 'Blusa', pronunciation: '/blaʊz/', pronunciationEs: 'blaus', example: 'She wore a silk blouse.', level: 'A2' },
    { front: 'Cardigan', back: 'Cárdigan/Rebeca', pronunciation: '/ˈkɑːrdɪɡən/', pronunciationEs: 'KAR-di-gan', example: 'Put on your cardigan.', level: 'B1' },
    { front: 'Hoodie', back: 'Sudadera con capucha', pronunciation: '/ˈhʊdi/', pronunciationEs: 'JU-di', example: 'He always wears a hoodie.', level: 'A2' },
    { front: 'Trainers', back: 'Zapatillas deportivas', pronunciation: '/ˈtreɪnərz/', pronunciationEs: 'TREI-ners', example: 'I bought new trainers.', level: 'A2' },
    { front: 'High heels', back: 'Tacones altos', pronunciation: '/haɪ hiːlz/', pronunciationEs: 'jai jils', example: 'She can\'t walk in high heels.', level: 'A2' },
    { front: 'Necklace', back: 'Collar', pronunciation: '/ˈnekləs/', pronunciationEs: 'NEK-les', example: 'She wore a pearl necklace.', level: 'A2' },
    { front: 'Bow tie', back: 'Pajarita', pronunciation: '/boʊ taɪ/', pronunciationEs: 'bou tai', example: 'He wore a bow tie to the wedding.', level: 'B1' },
    { front: 'Denim', back: 'Tela vaquera', pronunciation: '/ˈdenɪm/', pronunciationEs: 'DE-nim', example: 'Denim jeans are classic.', level: 'B1' },
    { front: 'Buckle', back: 'Hebilla', pronunciation: '/ˈbʌkl/', pronunciationEs: 'BA-kol', example: 'The belt buckle is silver.', level: 'B1' },
    { front: 'Cufflinks', back: 'Gemelos', pronunciation: '/ˈkʌflɪŋks/', pronunciationEs: 'KAF-links', example: 'He wore gold cufflinks.', level: 'B2' },
    { front: 'Leather', back: 'Cuero', pronunciation: '/ˈleðər/', pronunciationEs: 'LE-der', example: 'This is real leather.', level: 'A2' },
    { front: 'Turtleneck', back: 'Cuello alto', pronunciation: '/ˈtɜːrtlnek/', pronunciationEs: 'TER-tol-nek', example: 'I love turtleneck sweaters.', level: 'B1' },
    { front: 'Flip-flops', back: 'Chanclas', pronunciation: '/ˈflɪp flɒps/', pronunciationEs: 'flip-flops', example: 'Wear flip-flops to the beach.', level: 'A2' },
    { front: 'Raincoat', back: 'Impermeable', pronunciation: '/ˈreɪnkoʊt/', pronunciationEs: 'REIN-cout', example: 'Take your raincoat, it might rain.', level: 'A2' },
    { front: 'Pendant', back: 'Colgante', pronunciation: '/ˈpendənt/', pronunciationEs: 'PEN-dant', example: 'She has a beautiful pendant.', level: 'B1' },
    { front: 'Slippers', back: 'Zapatillas de casa', pronunciation: '/ˈslɪpərz/', pronunciationEs: 'SLI-pers', example: 'Put on your slippers.', level: 'A2' },
    { front: 'Velvet', back: 'Terciopelo', pronunciation: '/ˈvelvɪt/', pronunciationEs: 'VEL-vit', example: 'The dress is made of velvet.', level: 'B1' },
    { front: 'Collar', back: 'Cuello (de camisa)', pronunciation: '/ˈkɒlər/', pronunciationEs: 'KO-lar', example: 'Iron the collar carefully.', level: 'A2' },
    { front: 'Mittens', back: 'Manoplas', pronunciation: '/ˈmɪtnz/', pronunciationEs: 'MI-tens', example: 'Children wear mittens in winter.', level: 'B1' },
    { front: 'Brooch', back: 'Broche', pronunciation: '/broʊtʃ/', pronunciationEs: 'brouch', example: 'She pinned a brooch to her coat.', level: 'B2' },
  ],
  topic_colours: [
    { front: 'Red', back: 'Rojo', pronunciation: '/red/', pronunciationEs: 'red', example: 'The traffic light is red.', level: 'A1' },
    { front: 'Blue', back: 'Azul', pronunciation: '/bluː/', pronunciationEs: 'blu', example: 'The sky is blue today.', level: 'A1' },
    { front: 'Green', back: 'Verde', pronunciation: '/ɡriːn/', pronunciationEs: 'grin', example: 'The grass is green.', level: 'A1' },
    { front: 'Yellow', back: 'Amarillo', pronunciation: '/ˈjeloʊ/', pronunciationEs: 'YE-lou', example: 'Bananas are yellow.', level: 'A1' },
    { front: 'Purple', back: 'Morado/Púrpura', pronunciation: '/ˈpɜːrpl/', pronunciationEs: 'PER-pol', example: 'Purple is my favorite color.', level: 'A2' },
    { front: 'Navy blue', back: 'Azul marino', pronunciation: '/ˈneɪvi bluː/', pronunciationEs: 'NEI-vi blu', example: 'He wore a navy blue suit.', level: 'B1' },
    { front: 'Turquoise', back: 'Turquesa', pronunciation: '/ˈtɜːrkwɔɪz/', pronunciationEs: 'TER-kuois', example: 'The water was turquoise.', level: 'B1' },
    { front: 'Pale', back: 'Pálido/Claro', pronunciation: '/peɪl/', pronunciationEs: 'peil', example: 'She wore a pale pink dress.', level: 'B1' },
    { front: 'Bright', back: 'Brillante/Vivo', pronunciation: '/braɪt/', pronunciationEs: 'brait', example: 'I love bright colors.', level: 'A2' },
    { front: 'Dark', back: 'Oscuro', pronunciation: '/dɑːrk/', pronunciationEs: 'dark', example: 'The room was dark.', level: 'A1' },
    { front: 'Orange', back: 'Naranja', pronunciation: '/ˈɒrɪndʒ/', pronunciationEs: 'O-rinch', example: 'Oranges are orange.', level: 'A1' },
    { front: 'Pink', back: 'Rosa', pronunciation: '/pɪŋk/', pronunciationEs: 'pink', example: 'She loves pink flowers.', level: 'A1' },
    { front: 'Brown', back: 'Marrón', pronunciation: '/braʊn/', pronunciationEs: 'braun', example: 'The chocolate is brown.', level: 'A1' },
    { front: 'Black', back: 'Negro', pronunciation: '/blæk/', pronunciationEs: 'blak', example: 'The cat is black.', level: 'A1' },
    { front: 'White', back: 'Blanco', pronunciation: '/waɪt/', pronunciationEs: 'uait', example: 'Snow is white.', level: 'A1' },
    { front: 'Grey/Gray', back: 'Gris', pronunciation: '/ɡreɪ/', pronunciationEs: 'grei', example: 'The sky is grey today.', level: 'A1' },
    { front: 'Beige', back: 'Beige', pronunciation: '/beɪʒ/', pronunciationEs: 'beish', example: 'The walls are beige.', level: 'A2' },
    { front: 'Cream', back: 'Crema', pronunciation: '/kriːm/', pronunciationEs: 'krim', example: 'She has cream-colored curtains.', level: 'A2' },
    { front: 'Maroon', back: 'Granate', pronunciation: '/məˈruːn/', pronunciationEs: 'ma-RUN', example: 'He wore a maroon tie.', level: 'B1' },
    { front: 'Scarlet', back: 'Escarlata', pronunciation: '/ˈskɑːrlət/', pronunciationEs: 'SKAR-let', example: 'The roses were scarlet.', level: 'B1' },
    { front: 'Crimson', back: 'Carmesí', pronunciation: '/ˈkrɪmzn/', pronunciationEs: 'KRIM-son', example: 'Crimson is a deep red.', level: 'B2' },
    { front: 'Violet', back: 'Violeta', pronunciation: '/ˈvaɪələt/', pronunciationEs: 'VAI-o-let', example: 'Violets are violet.', level: 'A2' },
    { front: 'Indigo', back: 'Añil/Índigo', pronunciation: '/ˈɪndɪɡoʊ/', pronunciationEs: 'IN-di-gou', example: 'Indigo is between blue and violet.', level: 'B1' },
    { front: 'Olive', back: 'Verde oliva', pronunciation: '/ˈɒlɪv/', pronunciationEs: 'O-liv', example: 'He wore an olive green jacket.', level: 'B1' },
    { front: 'Lime', back: 'Verde lima', pronunciation: '/laɪm/', pronunciationEs: 'laim', example: 'Lime green is very bright.', level: 'A2' },
    { front: 'Teal', back: 'Verde azulado', pronunciation: '/tiːl/', pronunciationEs: 'til', example: 'Teal is a mix of blue and green.', level: 'B1' },
    { front: 'Ivory', back: 'Marfil', pronunciation: '/ˈaɪvəri/', pronunciationEs: 'AI-vo-ri', example: 'The wedding dress was ivory.', level: 'B1' },
    { front: 'Faded', back: 'Descolorido', pronunciation: '/ˈfeɪdɪd/', pronunciationEs: 'FEI-did', example: 'The jeans look faded.', level: 'B1' },
    { front: 'Vivid', back: 'Vívido/Intenso', pronunciation: '/ˈvɪvɪd/', pronunciationEs: 'VI-vid', example: 'She painted with vivid colors.', level: 'B1' },
    { front: 'Dull', back: 'Apagado/Mate', pronunciation: '/dʌl/', pronunciationEs: 'dal', example: 'The colors look dull.', level: 'B1' },
  ],
  topic_technology: [
    { front: 'Smartphone', back: 'Teléfono inteligente', pronunciation: '/ˈsmɑːrtfoʊn/', pronunciationEs: 'SMART-foun', example: 'I check my smartphone constantly.', level: 'A2' },
    { front: 'Laptop', back: 'Portátil', pronunciation: '/ˈlæptɒp/', pronunciationEs: 'LAP-top', example: 'I work on my laptop.', level: 'A2' },
    { front: 'Password', back: 'Contraseña', pronunciation: '/ˈpæswɜːrd/', pronunciationEs: 'PAS-uerd', example: 'Don\'t share your password.', level: 'A2' },
    { front: 'Download', back: 'Descargar', pronunciation: '/ˌdaʊnˈloʊd/', pronunciationEs: 'daun-LOUD', example: 'Download the app first.', level: 'A2' },
    { front: 'Upload', back: 'Subir/Cargar', pronunciation: '/ˌʌpˈloʊd/', pronunciationEs: 'ap-LOUD', example: 'Upload your photos here.', level: 'A2' },
    { front: 'Wi-Fi', back: 'Wifi/Red inalámbrica', pronunciation: '/ˈwaɪfaɪ/', pronunciationEs: 'UAI-fai', example: 'What\'s the Wi-Fi password?', level: 'A2' },
    { front: 'Screenshot', back: 'Captura de pantalla', pronunciation: '/ˈskriːnʃɒt/', pronunciationEs: 'SKRIN-shot', example: 'Take a screenshot of it.', level: 'B1' },
    { front: 'App', back: 'Aplicación', pronunciation: '/æp/', pronunciationEs: 'ap', example: 'There\'s an app for that.', level: 'A2' },
    { front: 'Software', back: 'Software/Programa', pronunciation: '/ˈsɒftweər/', pronunciationEs: 'SOFT-uer', example: 'Install the latest software.', level: 'B1' },
    { front: 'Browser', back: 'Navegador', pronunciation: '/ˈbraʊzər/', pronunciationEs: 'BRAU-ser', example: 'Which browser do you use?', level: 'B1' },
    { front: 'Hardware', back: 'Hardware/Equipo', pronunciation: '/ˈhɑːrdweər/', pronunciationEs: 'JARD-uer', example: 'We need new hardware.', level: 'B1' },
    { front: 'Database', back: 'Base de datos', pronunciation: '/ˈdeɪtəbeɪs/', pronunciationEs: 'DEI-ta-beis', example: 'The database is updated daily.', level: 'B1' },
    { front: 'Upload', back: 'Subir/Cargar', pronunciation: '/ˌʌpˈloʊd/', pronunciationEs: 'ap-LOUD', example: 'Upload your photo here.', level: 'A2' },
    { front: 'Download', back: 'Descargar', pronunciation: '/ˈdaʊnloʊd/', pronunciationEs: 'DAUN-loud', example: 'Download the file first.', level: 'A2' },
    { front: 'Backup', back: 'Copia de seguridad', pronunciation: '/ˈbækʌp/', pronunciationEs: 'BAK-ap', example: 'Always make a backup.', level: 'B1' },
    { front: 'Cloud', back: 'Nube', pronunciation: '/klaʊd/', pronunciationEs: 'klaud', example: 'Save it to the cloud.', level: 'A2' },
    { front: 'Server', back: 'Servidor', pronunciation: '/ˈsɜːrvər/', pronunciationEs: 'SER-ver', example: 'The server is down.', level: 'B1' },
    { front: 'Network', back: 'Red', pronunciation: '/ˈnetwɜːrk/', pronunciationEs: 'NET-uerk', example: 'Connect to the network.', level: 'B1' },
    { front: 'Firewall', back: 'Cortafuegos', pronunciation: '/ˈfaɪərwɔːl/', pronunciationEs: 'FAIR-uol', example: 'The firewall blocked it.', level: 'B2' },
    { front: 'Cybersecurity', back: 'Ciberseguridad', pronunciation: '/ˌsaɪbərsɪˈkjʊərəti/', pronunciationEs: 'sai-ber-se-KIU-ri-ti', example: 'Cybersecurity is important.', level: 'B2' },
    { front: 'Algorithm', back: 'Algoritmo', pronunciation: '/ˈælɡərɪðəm/', pronunciationEs: 'AL-go-ri-dom', example: 'The algorithm suggests content.', level: 'B2' },
    { front: 'Encryption', back: 'Encriptación/Cifrado', pronunciation: '/ɪnˈkrɪpʃn/', pronunciationEs: 'in-KRIP-shon', example: 'Use encryption for safety.', level: 'B2' },
    { front: 'Username', back: 'Nombre de usuario', pronunciation: '/ˈjuːzərneɪm/', pronunciationEs: 'IU-ser-neim', example: 'Enter your username.', level: 'A1' },
    { front: 'Password', back: 'Contraseña', pronunciation: '/ˈpæswɜːrd/', pronunciationEs: 'PAS-uerd', example: 'Change your password.', level: 'A1' },
    { front: 'Log in', back: 'Iniciar sesión', pronunciation: '/lɒɡ ɪn/', pronunciationEs: 'log in', example: 'Log in to your account.', level: 'A2' },
    { front: 'Touchscreen', back: 'Pantalla táctil', pronunciation: '/ˈtʌtʃskriːn/', pronunciationEs: 'TACH-skrin', example: 'This has a touchscreen.', level: 'A2' },
    { front: 'Charger', back: 'Cargador', pronunciation: '/ˈtʃɑːrdʒər/', pronunciationEs: 'CHAR-yer', example: 'I forgot my charger.', level: 'A2' },
    { front: 'Headphones', back: 'Auriculares', pronunciation: '/ˈhedfoʊnz/', pronunciationEs: 'JED-fons', example: 'Put on your headphones.', level: 'A2' },
    { front: 'Bluetooth', back: 'Bluetooth', pronunciation: '/ˈbluːtuːθ/', pronunciationEs: 'BLU-tuz', example: 'Connect via Bluetooth.', level: 'A2' },
    { front: 'Storage', back: 'Almacenamiento', pronunciation: '/ˈstɔːrɪdʒ/', pronunciationEs: 'STO-riy', example: 'I need more storage.', level: 'B1' },
    { front: 'Update', back: 'Actualización', pronunciation: '/ˌʌpˈdeɪt/', pronunciationEs: 'ap-DEIT', example: 'Install the update.', level: 'A2' },
    { front: 'Bug', back: 'Error/Fallo', pronunciation: '/bʌɡ/', pronunciationEs: 'bag', example: 'There\'s a bug in the system.', level: 'B1' },
    { front: 'Wireless', back: 'Inalámbrico', pronunciation: '/ˈwaɪərləs/', pronunciationEs: 'UAI-er-les', example: 'I prefer wireless devices.', level: 'A2' },
    { front: 'Bandwidth', back: 'Ancho de banda', pronunciation: '/ˈbændwɪdθ/', pronunciationEs: 'BAND-uidz', example: 'We need more bandwidth.', level: 'B2' },
    { front: 'Interface', back: 'Interfaz', pronunciation: '/ˈɪntərfeɪs/', pronunciationEs: 'IN-ter-feis', example: 'The interface is user-friendly.', level: 'B1' },
  ],
  topic_education: [
    { front: 'Classroom', back: 'Aula', pronunciation: '/ˈklɑːsruːm/', pronunciationEs: 'KLAS-rum', example: 'The classroom was empty.', level: 'A1' },
    { front: 'Homework', back: 'Deberes/Tarea', pronunciation: '/ˈhoʊmwɜːrk/', pronunciationEs: 'JOUM-uerk', example: 'Did you finish your homework?', level: 'A1' },
    { front: 'Exam', back: 'Examen', pronunciation: '/ɪɡˈzæm/', pronunciationEs: 'ig-ZAM', example: 'I have an exam tomorrow.', level: 'A1' },
    { front: 'Grade', back: 'Nota/Calificación', pronunciation: '/ɡreɪd/', pronunciationEs: 'greid', example: 'I got a good grade.', level: 'A2' },
    { front: 'Subject', back: 'Asignatura', pronunciation: '/ˈsʌbdʒɪkt/', pronunciationEs: 'SAB-yekt', example: 'Math is my favorite subject.', level: 'A2' },
    { front: 'Degree', back: 'Título/Carrera', pronunciation: '/dɪˈɡriː/', pronunciationEs: 'di-GRI', example: 'She has a degree in law.', level: 'B1' },
    { front: 'Lecture', back: 'Conferencia/Clase magistral', pronunciation: '/ˈlektʃər/', pronunciationEs: 'LEK-cher', example: 'The lecture was interesting.', level: 'B1' },
    { front: 'Assignment', back: 'Tarea/Trabajo', pronunciation: '/əˈsaɪnmənt/', pronunciationEs: 'a-SAIN-ment', example: 'The assignment is due Monday.', level: 'B1' },
    { front: 'Scholarship', back: 'Beca', pronunciation: '/ˈskɒlərʃɪp/', pronunciationEs: 'SKO-lar-ship', example: 'He won a scholarship.', level: 'B2' },
    { front: 'Curriculum', back: 'Plan de estudios', pronunciation: '/kəˈrɪkjʊləm/', pronunciationEs: 'cu-RI-kiu-lom', example: 'The curriculum has changed.', level: 'B2' },
    { front: 'Tutor', back: 'Tutor/Profesor particular', pronunciation: '/ˈtuːtər/', pronunciationEs: 'TU-ter', example: 'I have a math tutor.', level: 'A2' },
    { front: 'Student', back: 'Estudiante', pronunciation: '/ˈstuːdnt/', pronunciationEs: 'STU-dent', example: 'She is a good student.', level: 'A1' },
    { front: 'Teacher', back: 'Profesor/a', pronunciation: '/ˈtiːtʃər/', pronunciationEs: 'TI-cher', example: 'My teacher is very kind.', level: 'A1' },
    { front: 'Principal', back: 'Director/a', pronunciation: '/ˈprɪnsəpl/', pronunciationEs: 'PRIN-si-pol', example: 'The principal gave a speech.', level: 'A2' },
    { front: 'Textbook', back: 'Libro de texto', pronunciation: '/ˈtekstbʊk/', pronunciationEs: 'TEKST-buk', example: 'Open your textbook to page 5.', level: 'A1' },
    { front: 'Notebook', back: 'Cuaderno', pronunciation: '/ˈnoʊtbʊk/', pronunciationEs: 'NOUT-buk', example: 'Write it in your notebook.', level: 'A1' },
    { front: 'Campus', back: 'Campus', pronunciation: '/ˈkæmpəs/', pronunciationEs: 'KAM-pos', example: 'The campus is very large.', level: 'B1' },
    { front: 'Semester', back: 'Semestre', pronunciation: '/sɪˈmestər/', pronunciationEs: 'si-MES-ter', example: 'The semester ends in June.', level: 'B1' },
    { front: 'Graduate', back: 'Graduarse/Graduado', pronunciation: '/ˈɡrædʒueɪt/', pronunciationEs: 'GRA-diu-eit', example: 'I will graduate next year.', level: 'B1' },
    { front: 'Enrollment', back: 'Matrícula/Inscripción', pronunciation: '/ɪnˈroʊlmənt/', pronunciationEs: 'in-ROUL-ment', example: 'Enrollment starts Monday.', level: 'B1' },
    { front: 'Attendance', back: 'Asistencia', pronunciation: '/əˈtendəns/', pronunciationEs: 'a-TEN-dens', example: 'Attendance is mandatory.', level: 'B1' },
    { front: 'Quiz', back: 'Prueba corta', pronunciation: '/kwɪz/', pronunciationEs: 'kuiz', example: 'We have a quiz tomorrow.', level: 'A2' },
    { front: 'Essay', back: 'Ensayo/Redacción', pronunciation: '/ˈeseɪ/', pronunciationEs: 'E-sei', example: 'Write a 500-word essay.', level: 'B1' },
    { front: 'Research', back: 'Investigación', pronunciation: '/rɪˈsɜːrtʃ/', pronunciationEs: 'ri-SERCH', example: 'I\'m doing research on it.', level: 'B1' },
    { front: 'Thesis', back: 'Tesis', pronunciation: '/ˈθiːsɪs/', pronunciationEs: 'ZI-sis', example: 'She\'s writing her thesis.', level: 'B2' },
    { front: 'Library', back: 'Biblioteca', pronunciation: '/ˈlaɪbreri/', pronunciationEs: 'LAI-bre-ri', example: 'I study in the library.', level: 'A1' },
    { front: 'Cafeteria', back: 'Cafetería', pronunciation: '/ˌkæfəˈtɪəriə/', pronunciationEs: 'ka-fe-TI-ria', example: 'Let\'s eat at the cafeteria.', level: 'A2' },
    { front: 'Diploma', back: 'Diploma', pronunciation: '/dɪˈploʊmə/', pronunciationEs: 'di-PLOU-ma', example: 'He received his diploma.', level: 'B1' },
    { front: 'Deadline', back: 'Fecha límite', pronunciation: '/ˈdedlaɪn/', pronunciationEs: 'DED-lain', example: 'The deadline is Friday.', level: 'B1' },
    { front: 'Syllabus', back: 'Programa de estudios', pronunciation: '/ˈsɪləbəs/', pronunciationEs: 'SI-la-bos', example: 'Check the syllabus.', level: 'B2' },
  ],
  topic_entertainment: [
    { front: 'Movie', back: 'Película', pronunciation: '/ˈmuːvi/', pronunciationEs: 'MU-vi', example: 'Let\'s watch a movie tonight.', level: 'A1' },
    { front: 'Concert', back: 'Concierto', pronunciation: '/ˈkɒnsərt/', pronunciationEs: 'KON-sert', example: 'The concert was amazing.', level: 'A2' },
    { front: 'Channel', back: 'Canal', pronunciation: '/ˈtʃænl/', pronunciationEs: 'CHA-nel', example: 'Change the channel, please.', level: 'A2' },
    { front: 'Headline', back: 'Titular', pronunciation: '/ˈhedlaɪn/', pronunciationEs: 'JED-lain', example: 'Did you see the headline?', level: 'B1' },
    { front: 'Audience', back: 'Público/Audiencia', pronunciation: '/ˈɔːdiəns/', pronunciationEs: 'O-diens', example: 'The audience applauded.', level: 'B1' },
    { front: 'Documentary', back: 'Documental', pronunciation: '/ˌdɒkjʊˈmentəri/', pronunciationEs: 'dokiu-MEN-ta-ri', example: 'I watched a documentary.', level: 'B1' },
    { front: 'Streaming', back: 'Transmisión en directo', pronunciation: '/ˈstriːmɪŋ/', pronunciationEs: 'STRI-ming', example: 'I prefer streaming services.', level: 'B1' },
    { front: 'Episode', back: 'Episodio', pronunciation: '/ˈepɪsoʊd/', pronunciationEs: 'E-pi-soud', example: 'The last episode was great.', level: 'A2' },
    { front: 'Celebrity', back: 'Celebridad', pronunciation: '/səˈlebrəti/', pronunciationEs: 'se-LE-bri-ti', example: 'She became a celebrity.', level: 'B1' },
    { front: 'Bestseller', back: 'Éxito de ventas', pronunciation: '/ˌbestˈselər/', pronunciationEs: 'best-SE-ler', example: 'The book became a bestseller.', level: 'B1' },
    { front: 'Theatre', back: 'Teatro', pronunciation: '/ˈθɪətər/', pronunciationEs: 'ZI-a-ter', example: 'We went to the theatre.', level: 'A2' },
    { front: 'Stage', back: 'Escenario', pronunciation: '/steɪdʒ/', pronunciationEs: 'steiy', example: 'The band is on stage.', level: 'A2' },
    { front: 'Actor', back: 'Actor', pronunciation: '/ˈæktər/', pronunciationEs: 'AK-ter', example: 'He is a famous actor.', level: 'A1' },
    { front: 'Actress', back: 'Actriz', pronunciation: '/ˈæktrəs/', pronunciationEs: 'AK-tres', example: 'She is a talented actress.', level: 'A1' },
    { front: 'Director', back: 'Director/a', pronunciation: '/dəˈrektər/', pronunciationEs: 'di-REK-ter', example: 'The director won an award.', level: 'A2' },
    { front: 'Soundtrack', back: 'Banda sonora', pronunciation: '/ˈsaʊndtræk/', pronunciationEs: 'SAUND-trak', example: 'I love the soundtrack.', level: 'B1' },
    { front: 'Subtitle', back: 'Subtítulo', pronunciation: '/ˈsʌbtaɪtl/', pronunciationEs: 'SAB-tai-tol', example: 'Turn on the subtitles.', level: 'B1' },
    { front: 'Trailer', back: 'Tráiler/Avance', pronunciation: '/ˈtreɪlər/', pronunciationEs: 'TREI-ler', example: 'Have you seen the trailer?', level: 'A2' },
    { front: 'Premiere', back: 'Estreno', pronunciation: '/prɪˈmɪər/', pronunciationEs: 'pri-MI-er', example: 'The premiere is tonight.', level: 'B1' },
    { front: 'Review', back: 'Reseña/Crítica', pronunciation: '/rɪˈvjuː/', pronunciationEs: 'ri-VIU', example: 'The review was positive.', level: 'B1' },
    { front: 'Genre', back: 'Género', pronunciation: '/ˈʒɒnrə/', pronunciationEs: 'ZHON-ra', example: 'What genre do you prefer?', level: 'B1' },
    { front: 'Comedy', back: 'Comedia', pronunciation: '/ˈkɒmədi/', pronunciationEs: 'KO-me-di', example: 'I love comedy films.', level: 'A2' },
    { front: 'Drama', back: 'Drama', pronunciation: '/ˈdrɑːmə/', pronunciationEs: 'DRA-ma', example: 'She prefers drama.', level: 'A2' },
    { front: 'Thriller', back: 'Thriller/Suspenso', pronunciation: '/ˈθrɪlər/', pronunciationEs: 'ZRI-ler', example: 'It\'s a psychological thriller.', level: 'B1' },
    { front: 'Plot', back: 'Trama/Argumento', pronunciation: '/plɒt/', pronunciationEs: 'plot', example: 'The plot was confusing.', level: 'B1' },
    { front: 'Script', back: 'Guion', pronunciation: '/skrɪpt/', pronunciationEs: 'skript', example: 'She wrote the script.', level: 'B1' },
    { front: 'Festival', back: 'Festival', pronunciation: '/ˈfestɪvl/', pronunciationEs: 'FES-ti-vol', example: 'The music festival was fun.', level: 'A2' },
    { front: 'Award', back: 'Premio', pronunciation: '/əˈwɔːrd/', pronunciationEs: 'a-UORD', example: 'She won an award.', level: 'B1' },
    { front: 'Sequel', back: 'Secuela', pronunciation: '/ˈsiːkwəl/', pronunciationEs: 'SI-kuel', example: 'The sequel was better.', level: 'B1' },
    { front: 'Blockbuster', back: 'Éxito de taquilla', pronunciation: '/ˈblɒkbʌstər/', pronunciationEs: 'BLOK-bas-ter', example: 'It became a blockbuster.', level: 'B2' },
  ],
  topic_environment: [
    { front: 'Pollution', back: 'Contaminación', pronunciation: '/pəˈluːʃn/', pronunciationEs: 'po-LU-shon', example: 'Air pollution is a problem.', level: 'B1' },
    { front: 'Recycle', back: 'Reciclar', pronunciation: '/riːˈsaɪkl/', pronunciationEs: 'ri-SAI-kol', example: 'We should recycle more.', level: 'A2' },
    { front: 'Climate change', back: 'Cambio climático', pronunciation: '/ˈklaɪmət tʃeɪndʒ/', pronunciationEs: 'KLAI-met cheiny', example: 'Climate change is real.', level: 'B1' },
    { front: 'Waste', back: 'Residuos/Desperdicio', pronunciation: '/weɪst/', pronunciationEs: 'ueist', example: 'Don\'t waste water.', level: 'B1' },
    { front: 'Renewable', back: 'Renovable', pronunciation: '/rɪˈnjuːəbl/', pronunciationEs: 'ri-NIU-a-bol', example: 'We need renewable energy.', level: 'B2' },
    { front: 'Endangered', back: 'En peligro', pronunciation: '/ɪnˈdeɪndʒərd/', pronunciationEs: 'in-DEIN-yerd', example: 'Many species are endangered.', level: 'B2' },
    { front: 'Sustainable', back: 'Sostenible', pronunciation: '/səˈsteɪnəbl/', pronunciationEs: 'sos-TEI-na-bol', example: 'We need sustainable solutions.', level: 'B2' },
    { front: 'Carbon footprint', back: 'Huella de carbono', pronunciation: '/ˈkɑːrbən ˈfʊtprɪnt/', pronunciationEs: 'KAR-bon FUT-print', example: 'Reduce your carbon footprint.', level: 'B2' },
    { front: 'Deforestation', back: 'Deforestación', pronunciation: '/diːˌfɒrɪˈsteɪʃn/', pronunciationEs: 'di-fo-res-TEI-shon', example: 'Deforestation is destroying habitats.', level: 'B2' },
    { front: 'Ecosystem', back: 'Ecosistema', pronunciation: '/ˈiːkoʊsɪstəm/', pronunciationEs: 'I-co-sis-tem', example: 'The ecosystem is fragile.', level: 'B2' },
    { front: 'Biodiversity', back: 'Biodiversidad', pronunciation: '/ˌbaɪoʊdaɪˈvɜːrsəti/', pronunciationEs: 'bai-o-dai-VER-si-ti', example: 'We must protect biodiversity.', level: 'B2' },
    { front: 'Wildlife', back: 'Vida silvestre', pronunciation: '/ˈwaɪldlaɪf/', pronunciationEs: 'UAILD-laif', example: 'Wildlife is under threat.', level: 'B1' },
    { front: 'Habitat', back: 'Hábitat', pronunciation: '/ˈhæbɪtæt/', pronunciationEs: 'JA-bi-tat', example: 'Their habitat is shrinking.', level: 'B1' },
    { front: 'Conservation', back: 'Conservación', pronunciation: '/ˌkɒnsərˈveɪʃn/', pronunciationEs: 'kon-ser-VEI-shon', example: 'Conservation efforts are important.', level: 'B2' },
    { front: 'Greenhouse effect', back: 'Efecto invernadero', pronunciation: '/ˈɡriːnhaʊs ɪˈfekt/', pronunciationEs: 'GRIN-jaus i-FEKT', example: 'The greenhouse effect warms Earth.', level: 'B2' },
    { front: 'Fossil fuel', back: 'Combustible fósil', pronunciation: '/ˈfɒsl fjuːəl/', pronunciationEs: 'FO-sol FIUL', example: 'We rely on fossil fuels.', level: 'B2' },
    { front: 'Solar energy', back: 'Energía solar', pronunciation: '/ˈsoʊlər ˈenərdʒi/', pronunciationEs: 'SOU-lar E-ner-yi', example: 'Solar energy is clean.', level: 'B1' },
    { front: 'Wind power', back: 'Energía eólica', pronunciation: '/wɪnd ˈpaʊər/', pronunciationEs: 'uind PAU-er', example: 'Wind power is renewable.', level: 'B1' },
    { front: 'Compost', back: 'Compost/Abono', pronunciation: '/ˈkɒmpɒst/', pronunciationEs: 'KOM-post', example: 'Make compost from food scraps.', level: 'B1' },
    { front: 'Landfill', back: 'Vertedero', pronunciation: '/ˈlændfɪl/', pronunciationEs: 'LAND-fil', example: 'Reduce waste to landfills.', level: 'B2' },
    { front: 'Ozone layer', back: 'Capa de ozono', pronunciation: '/ˈoʊzoʊn ˈleɪər/', pronunciationEs: 'OU-soun LEI-er', example: 'The ozone layer protects us.', level: 'B2' },
    { front: 'Global warming', back: 'Calentamiento global', pronunciation: '/ˈɡloʊbl ˈwɔːrmɪŋ/', pronunciationEs: 'GLOU-bol UOR-ming', example: 'Global warming is increasing.', level: 'B1' },
    { front: 'Drought', back: 'Sequía', pronunciation: '/draʊt/', pronunciationEs: 'draut', example: 'The drought lasted months.', level: 'B1' },
    { front: 'Flood', back: 'Inundación', pronunciation: '/flʌd/', pronunciationEs: 'flad', example: 'The flood damaged houses.', level: 'A2' },
    { front: 'Emission', back: 'Emisión', pronunciation: '/ɪˈmɪʃn/', pronunciationEs: 'i-MI-shon', example: 'Reduce carbon emissions.', level: 'B2' },
    { front: 'Reusable', back: 'Reutilizable', pronunciation: '/riːˈjuːzəbl/', pronunciationEs: 'ri-IU-sa-bol', example: 'Use reusable bags.', level: 'B1' },
    { front: 'Organic', back: 'Orgánico', pronunciation: '/ɔːrˈɡænɪk/', pronunciationEs: 'or-GA-nik', example: 'Buy organic vegetables.', level: 'B1' },
    { front: 'Extinction', back: 'Extinción', pronunciation: '/ɪkˈstɪŋkʃn/', pronunciationEs: 'ik-STINK-shon', example: 'Many species face extinction.', level: 'B2' },
    { front: 'Rainforest', back: 'Selva tropical', pronunciation: '/ˈreɪnfɒrɪst/', pronunciationEs: 'REIN-fo-rest', example: 'The rainforest is vital.', level: 'B1' },
    { front: 'Eco-friendly', back: 'Ecológico', pronunciation: '/ˌiːkoʊˈfrendli/', pronunciationEs: 'i-co-FREND-li', example: 'Choose eco-friendly products.', level: 'B1' },
  ],
  topic_food: [
    { front: 'Meal', back: 'Comida', pronunciation: '/miːl/', pronunciationEs: 'mil', example: 'Breakfast is the first meal.', level: 'A1' },
    { front: 'Recipe', back: 'Receta', pronunciation: '/ˈresəpi/', pronunciationEs: 'RE-se-pi', example: 'Can you share the recipe?', level: 'A2' },
    { front: 'Ingredient', back: 'Ingrediente', pronunciation: '/ɪnˈɡriːdiənt/', pronunciationEs: 'in-GRI-dient', example: 'What ingredients do we need?', level: 'A2' },
    { front: 'Dessert', back: 'Postre', pronunciation: '/dɪˈzɜːrt/', pronunciationEs: 'di-SERT', example: 'Would you like dessert?', level: 'A2' },
    { front: 'Snack', back: 'Aperitivo/Snack', pronunciation: '/snæk/', pronunciationEs: 'snak', example: 'I need a snack.', level: 'A2' },
    { front: 'Beverage', back: 'Bebida', pronunciation: '/ˈbevərɪdʒ/', pronunciationEs: 'BE-ve-rich', example: 'What beverage would you like?', level: 'B1' },
    { front: 'Dairy', back: 'Lácteos', pronunciation: '/ˈdeəri/', pronunciationEs: 'DE-ri', example: 'I avoid dairy products.', level: 'B1' },
    { front: 'Spicy', back: 'Picante', pronunciation: '/ˈspaɪsi/', pronunciationEs: 'SPAI-si', example: 'This food is too spicy.', level: 'A2' },
    { front: 'Appetizer', back: 'Entrante/Aperitivo', pronunciation: '/ˈæpɪtaɪzər/', pronunciationEs: 'A-pe-tai-ser', example: 'We ordered appetizers.', level: 'B1' },
    { front: 'Cuisine', back: 'Cocina/Gastronomía', pronunciation: '/kwɪˈziːn/', pronunciationEs: 'kui-SIN', example: 'I love Italian cuisine.', level: 'B1' },
    { front: 'Breakfast', back: 'Desayuno', pronunciation: '/ˈbrekfəst/', pronunciationEs: 'BREK-fast', example: 'I had eggs for breakfast.', level: 'A1' },
    { front: 'Lunch', back: 'Almuerzo', pronunciation: '/lʌntʃ/', pronunciationEs: 'lanch', example: 'What\'s for lunch?', level: 'A1' },
    { front: 'Dinner', back: 'Cena', pronunciation: '/ˈdɪnər/', pronunciationEs: 'DI-ner', example: 'Dinner is ready.', level: 'A1' },
    { front: 'Delicious', back: 'Delicioso', pronunciation: '/dɪˈlɪʃəs/', pronunciationEs: 'di-LI-shos', example: 'This is delicious!', level: 'A1' },
    { front: 'Tasty', back: 'Sabroso', pronunciation: '/ˈteɪsti/', pronunciationEs: 'TEIS-ti', example: 'The soup is very tasty.', level: 'A2' },
    { front: 'Bitter', back: 'Amargo', pronunciation: '/ˈbɪtər/', pronunciationEs: 'BI-ter', example: 'Coffee can be bitter.', level: 'A2' },
    { front: 'Sour', back: 'Agrio/Ácido', pronunciation: '/ˈsaʊər/', pronunciationEs: 'SAUR', example: 'Lemons are sour.', level: 'A2' },
    { front: 'Sweet', back: 'Dulce', pronunciation: '/swiːt/', pronunciationEs: 'suit', example: 'This cake is too sweet.', level: 'A1' },
    { front: 'Salty', back: 'Salado', pronunciation: '/ˈsɔːlti/', pronunciationEs: 'SOL-ti', example: 'The chips are salty.', level: 'A2' },
    { front: 'Bake', back: 'Hornear', pronunciation: '/beɪk/', pronunciationEs: 'beik', example: 'I love to bake cookies.', level: 'A2' },
    { front: 'Roast', back: 'Asar', pronunciation: '/roʊst/', pronunciationEs: 'roust', example: 'Roast the chicken.', level: 'B1' },
    { front: 'Fry', back: 'Freír', pronunciation: '/fraɪ/', pronunciationEs: 'frai', example: 'Fry the eggs.', level: 'A2' },
    { front: 'Boil', back: 'Hervir', pronunciation: '/bɔɪl/', pronunciationEs: 'boil', example: 'Boil the water first.', level: 'A2' },
    { front: 'Chop', back: 'Picar/Cortar', pronunciation: '/tʃɒp/', pronunciationEs: 'chop', example: 'Chop the vegetables.', level: 'A2' },
    { front: 'Stir', back: 'Remover', pronunciation: '/stɜːr/', pronunciationEs: 'ster', example: 'Stir the sauce.', level: 'A2' },
    { front: 'Portion', back: 'Porción', pronunciation: '/ˈpɔːrʃn/', pronunciationEs: 'POR-shon', example: 'The portions are large.', level: 'B1' },
    { front: 'Leftovers', back: 'Sobras', pronunciation: '/ˈleftˌoʊvərz/', pronunciationEs: 'LEFT-ou-vers', example: 'We ate the leftovers.', level: 'B1' },
    { front: 'Vegetarian', back: 'Vegetariano', pronunciation: '/ˌvedʒəˈteriən/', pronunciationEs: 've-ye-TE-rian', example: 'Is there a vegetarian option?', level: 'B1' },
    { front: 'Vegan', back: 'Vegano', pronunciation: '/ˈviːɡən/', pronunciationEs: 'VI-gan', example: 'She follows a vegan diet.', level: 'B1' },
    { front: 'Gluten-free', back: 'Sin gluten', pronunciation: '/ˈɡluːtn friː/', pronunciationEs: 'GLU-ten fri', example: 'Do you have gluten-free bread?', level: 'B1' },
  ],
  topic_health: [
    { front: 'Headache', back: 'Dolor de cabeza', pronunciation: '/ˈhedeɪk/', pronunciationEs: 'JED-eik', example: 'I have a terrible headache.', level: 'A2' },
    { front: 'Medicine', back: 'Medicina/Medicamento', pronunciation: '/ˈmedɪsn/', pronunciationEs: 'ME-di-sin', example: 'Take your medicine.', level: 'A2' },
    { front: 'Symptom', back: 'Síntoma', pronunciation: '/ˈsɪmptəm/', pronunciationEs: 'SIMP-tom', example: 'What are your symptoms?', level: 'B1' },
    { front: 'Treatment', back: 'Tratamiento', pronunciation: '/ˈtriːtmənt/', pronunciationEs: 'TRIT-ment', example: 'The treatment worked well.', level: 'B1' },
    { front: 'Prescription', back: 'Receta médica', pronunciation: '/prɪˈskrɪpʃn/', pronunciationEs: 'pres-KRIP-shon', example: 'You need a prescription.', level: 'B1' },
    { front: 'Workout', back: 'Entrenamiento', pronunciation: '/ˈwɜːrkaʊt/', pronunciationEs: 'UERK-aut', example: 'I had a good workout.', level: 'A2' },
    { front: 'Injury', back: 'Lesión', pronunciation: '/ˈɪndʒəri/', pronunciationEs: 'IN-yu-ri', example: 'He recovered from the injury.', level: 'B1' },
    { front: 'Diet', back: 'Dieta', pronunciation: '/ˈdaɪət/', pronunciationEs: 'DAI-et', example: 'I\'m on a healthy diet.', level: 'A2' },
    { front: 'Allergy', back: 'Alergia', pronunciation: '/ˈælərdʒi/', pronunciationEs: 'A-ler-yi', example: 'I have a peanut allergy.', level: 'B1' },
    { front: 'Recovery', back: 'Recuperación', pronunciation: '/rɪˈkʌvəri/', pronunciationEs: 'ri-KA-ve-ri', example: 'Recovery takes time.', level: 'B1' },
    { front: 'Fever', back: 'Fiebre', pronunciation: '/ˈfiːvər/', pronunciationEs: 'FI-ver', example: 'She has a high fever.', level: 'A2' },
    { front: 'Cough', back: 'Tos', pronunciation: '/kɒf/', pronunciationEs: 'kof', example: 'I can\'t stop coughing.', level: 'A2' },
    { front: 'Cold', back: 'Resfriado', pronunciation: '/koʊld/', pronunciationEs: 'kould', example: 'I caught a cold.', level: 'A1' },
    { front: 'Flu', back: 'Gripe', pronunciation: '/fluː/', pronunciationEs: 'flu', example: 'The flu is spreading.', level: 'A2' },
    { front: 'Doctor', back: 'Médico/Doctor', pronunciation: '/ˈdɒktər/', pronunciationEs: 'DOK-ter', example: 'See a doctor immediately.', level: 'A1' },
    { front: 'Nurse', back: 'Enfermero/a', pronunciation: '/nɜːrs/', pronunciationEs: 'ners', example: 'The nurse took my blood.', level: 'A1' },
    { front: 'Hospital', back: 'Hospital', pronunciation: '/ˈhɒspɪtl/', pronunciationEs: 'JOS-pi-tal', example: 'He\'s in the hospital.', level: 'A1' },
    { front: 'Pharmacy', back: 'Farmacia', pronunciation: '/ˈfɑːrməsi/', pronunciationEs: 'FAR-ma-si', example: 'Buy it at the pharmacy.', level: 'A2' },
    { front: 'Appointment', back: 'Cita', pronunciation: '/əˈpɔɪntmənt/', pronunciationEs: 'a-POINT-ment', example: 'I have a doctor\'s appointment.', level: 'A2' },
    { front: 'Checkup', back: 'Revisión médica', pronunciation: '/ˈtʃekʌp/', pronunciationEs: 'CHEK-ap', example: 'I need a checkup.', level: 'B1' },
    { front: 'Pain', back: 'Dolor', pronunciation: '/peɪn/', pronunciationEs: 'pein', example: 'I feel pain in my back.', level: 'A2' },
    { front: 'Healthy', back: 'Saludable', pronunciation: '/ˈhelθi/', pronunciationEs: 'JEL-zi', example: 'Eat healthy food.', level: 'A1' },
    { front: 'Sick', back: 'Enfermo', pronunciation: '/sɪk/', pronunciationEs: 'sik', example: 'I feel sick today.', level: 'A1' },
    { front: 'Exercise', back: 'Ejercicio', pronunciation: '/ˈeksərsaɪz/', pronunciationEs: 'EK-ser-sais', example: 'Exercise is important.', level: 'A2' },
    { front: 'Blood pressure', back: 'Presión arterial', pronunciation: '/blʌd ˈpreʃər/', pronunciationEs: 'blad PRE-sher', example: 'Check your blood pressure.', level: 'B1' },
    { front: 'Vaccine', back: 'Vacuna', pronunciation: '/vækˈsiːn/', pronunciationEs: 'vak-SIN', example: 'Get the vaccine.', level: 'B1' },
    { front: 'Surgery', back: 'Cirugía', pronunciation: '/ˈsɜːrdʒəri/', pronunciationEs: 'SER-ye-ri', example: 'She needs surgery.', level: 'B2' },
    { front: 'Bandage', back: 'Vendaje', pronunciation: '/ˈbændɪdʒ/', pronunciationEs: 'BAN-diy', example: 'Put a bandage on it.', level: 'A2' },
    { front: 'X-ray', back: 'Radiografía', pronunciation: '/ˈeksreɪ/', pronunciationEs: 'EKS-rei', example: 'The X-ray shows a fracture.', level: 'B1' },
    { front: 'Thermometer', back: 'Termómetro', pronunciation: '/θərˈmɒmɪtər/', pronunciationEs: 'zer-MO-mi-ter', example: 'Use a thermometer.', level: 'B1' },
  ],
  topic_hobbies: [
    { front: 'Hobby', back: 'Hobby/Afición', pronunciation: '/ˈhɒbi/', pronunciationEs: 'JO-bi', example: 'Reading is my hobby.', level: 'A1' },
    { front: 'Painting', back: 'Pintura', pronunciation: '/ˈpeɪntɪŋ/', pronunciationEs: 'PEIN-ting', example: 'She enjoys painting.', level: 'A2' },
    { front: 'Gardening', back: 'Jardinería', pronunciation: '/ˈɡɑːrdnɪŋ/', pronunciationEs: 'GAR-de-ning', example: 'Gardening is relaxing.', level: 'A2' },
    { front: 'Photography', back: 'Fotografía', pronunciation: '/fəˈtɒɡrəfi/', pronunciationEs: 'fo-TO-gra-fi', example: 'Photography is his passion.', level: 'B1' },
    { front: 'Hiking', back: 'Senderismo', pronunciation: '/ˈhaɪkɪŋ/', pronunciationEs: 'JAI-king', example: 'We went hiking yesterday.', level: 'A2' },
    { front: 'Collect', back: 'Coleccionar', pronunciation: '/kəˈlekt/', pronunciationEs: 'co-LEKT', example: 'I collect stamps.', level: 'A2' },
    { front: 'Craft', back: 'Manualidad', pronunciation: '/krɑːft/', pronunciationEs: 'kraft', example: 'She loves arts and crafts.', level: 'B1' },
    { front: 'Puzzle', back: 'Rompecabezas', pronunciation: '/ˈpʌzl/', pronunciationEs: 'PA-sol', example: 'I love doing puzzles.', level: 'A2' },
    { front: 'Board game', back: 'Juego de mesa', pronunciation: '/bɔːrd ɡeɪm/', pronunciationEs: 'bord geim', example: 'Let\'s play a board game.', level: 'A2' },
    { front: 'Leisure', back: 'Ocio/Tiempo libre', pronunciation: '/ˈleʒər/', pronunciationEs: 'LE-sher', example: 'I enjoy my leisure time.', level: 'B1' },
    { front: 'Cooking', back: 'Cocinar', pronunciation: '/ˈkʊkɪŋ/', pronunciationEs: 'KU-king', example: 'Cooking is my passion.', level: 'A1' },
    { front: 'Reading', back: 'Lectura', pronunciation: '/ˈriːdɪŋ/', pronunciationEs: 'RI-ding', example: 'Reading expands the mind.', level: 'A1' },
    { front: 'Swimming', back: 'Natación', pronunciation: '/ˈswɪmɪŋ/', pronunciationEs: 'SUI-ming', example: 'I go swimming weekly.', level: 'A1' },
    { front: 'Dancing', back: 'Bailar', pronunciation: '/ˈdænsɪŋ/', pronunciationEs: 'DAN-sing', example: 'She loves dancing.', level: 'A1' },
    { front: 'Singing', back: 'Cantar', pronunciation: '/ˈsɪŋɪŋ/', pronunciationEs: 'SIN-ging', example: 'Singing makes me happy.', level: 'A1' },
    { front: 'Drawing', back: 'Dibujo', pronunciation: '/ˈdrɔːɪŋ/', pronunciationEs: 'DRO-ing', example: 'I\'m learning drawing.', level: 'A1' },
    { front: 'Knitting', back: 'Tejer', pronunciation: '/ˈnɪtɪŋ/', pronunciationEs: 'NI-ting', example: 'Grandma loves knitting.', level: 'B1' },
    { front: 'Fishing', back: 'Pesca', pronunciation: '/ˈfɪʃɪŋ/', pronunciationEs: 'FI-shing', example: 'We went fishing at dawn.', level: 'A2' },
    { front: 'Camping', back: 'Acampada', pronunciation: '/ˈkæmpɪŋ/', pronunciationEs: 'KAM-ping', example: 'Let\'s go camping.', level: 'A2' },
    { front: 'Cycling', back: 'Ciclismo', pronunciation: '/ˈsaɪklɪŋ/', pronunciationEs: 'SAI-kling', example: 'Cycling is good exercise.', level: 'A2' },
    { front: 'Video games', back: 'Videojuegos', pronunciation: '/ˈvɪdioʊ ɡeɪmz/', pronunciationEs: 'VI-dio geims', example: 'I play video games.', level: 'A1' },
    { front: 'Chess', back: 'Ajedrez', pronunciation: '/tʃes/', pronunciationEs: 'ches', example: 'Do you play chess?', level: 'A2' },
    { front: 'Yoga', back: 'Yoga', pronunciation: '/ˈjoʊɡə/', pronunciationEs: 'IOU-ga', example: 'Yoga helps me relax.', level: 'A2' },
    { front: 'Meditation', back: 'Meditación', pronunciation: '/ˌmedɪˈteɪʃn/', pronunciationEs: 'me-di-TEI-shon', example: 'I practice meditation daily.', level: 'B1' },
    { front: 'Birdwatching', back: 'Observación de aves', pronunciation: '/ˈbɜːrdwɒtʃɪŋ/', pronunciationEs: 'BERD-uo-ching', example: 'Birdwatching is peaceful.', level: 'B1' },
    { front: 'Woodworking', back: 'Carpintería', pronunciation: '/ˈwʊdwɜːrkɪŋ/', pronunciationEs: 'UUD-uer-king', example: 'He does woodworking.', level: 'B1' },
    { front: 'Astronomy', back: 'Astronomía', pronunciation: '/əˈstrɒnəmi/', pronunciationEs: 'as-TRO-no-mi', example: 'Astronomy fascinates me.', level: 'B1' },
    { front: 'Scrapbooking', back: 'Álbum de recortes', pronunciation: '/ˈskræpbʊkɪŋ/', pronunciationEs: 'SKRAP-bu-king', example: 'She enjoys scrapbooking.', level: 'B1' },
    { front: 'Pottery', back: 'Cerámica', pronunciation: '/ˈpɒtəri/', pronunciationEs: 'PO-te-ri', example: 'I\'m taking pottery classes.', level: 'B1' },
    { front: 'Origami', back: 'Origami', pronunciation: '/ˌɒrɪˈɡɑːmi/', pronunciationEs: 'o-ri-GA-mi', example: 'Origami requires patience.', level: 'B1' },
  ],
  topic_house: [
    { front: 'Kitchen', back: 'Cocina', pronunciation: '/ˈkɪtʃɪn/', pronunciationEs: 'KI-chen', example: 'The kitchen is clean.', level: 'A1' },
    { front: 'Bathroom', back: 'Baño', pronunciation: '/ˈbæθruːm/', pronunciationEs: 'BAZ-rum', example: 'Where\'s the bathroom?', level: 'A1' },
    { front: 'Bedroom', back: 'Dormitorio', pronunciation: '/ˈbedruːm/', pronunciationEs: 'BED-rum', example: 'My bedroom is upstairs.', level: 'A1' },
    { front: 'Furniture', back: 'Muebles', pronunciation: '/ˈfɜːrnɪtʃər/', pronunciationEs: 'FER-ni-cher', example: 'We bought new furniture.', level: 'A2' },
    { front: 'Ceiling', back: 'Techo', pronunciation: '/ˈsiːlɪŋ/', pronunciationEs: 'SI-ling', example: 'The ceiling is very high.', level: 'A2' },
    { front: 'Basement', back: 'Sótano', pronunciation: '/ˈbeɪsmənt/', pronunciationEs: 'BEIS-ment', example: 'The basement is flooded.', level: 'B1' },
    { front: 'Attic', back: 'Ático/Desván', pronunciation: '/ˈætɪk/', pronunciationEs: 'A-tik', example: 'Old things are in the attic.', level: 'B1' },
    { front: 'Tenant', back: 'Inquilino', pronunciation: '/ˈtenənt/', pronunciationEs: 'TE-nant', example: 'The tenant pays rent monthly.', level: 'B1' },
    { front: 'Landlord', back: 'Propietario/Casero', pronunciation: '/ˈlændlɔːrd/', pronunciationEs: 'LAND-lord', example: 'The landlord raised the rent.', level: 'B1' },
    { front: 'Appliance', back: 'Electrodoméstico', pronunciation: '/əˈplaɪəns/', pronunciationEs: 'a-PLAI-ans', example: 'We need new appliances.', level: 'B1' },
    { front: 'Living room', back: 'Sala de estar', pronunciation: '/ˈlɪvɪŋ ruːm/', pronunciationEs: 'LI-ving rum', example: 'The living room is cozy.', level: 'A1' },
    { front: 'Dining room', back: 'Comedor', pronunciation: '/ˈdaɪnɪŋ ruːm/', pronunciationEs: 'DAI-ning rum', example: 'We eat in the dining room.', level: 'A1' },
    { front: 'Garage', back: 'Garaje', pronunciation: '/ɡəˈrɑːʒ/', pronunciationEs: 'ga-RAASH', example: 'Park in the garage.', level: 'A2' },
    { front: 'Garden', back: 'Jardín', pronunciation: '/ˈɡɑːrdn/', pronunciationEs: 'GAR-den', example: 'The garden is beautiful.', level: 'A1' },
    { front: 'Balcony', back: 'Balcón', pronunciation: '/ˈbælkəni/', pronunciationEs: 'BAL-ko-ni', example: 'Sit on the balcony.', level: 'A2' },
    { front: 'Stairs', back: 'Escaleras', pronunciation: '/steərz/', pronunciationEs: 'sters', example: 'Take the stairs.', level: 'A1' },
    { front: 'Door', back: 'Puerta', pronunciation: '/dɔːr/', pronunciationEs: 'dor', example: 'Close the door.', level: 'A1' },
    { front: 'Window', back: 'Ventana', pronunciation: '/ˈwɪndoʊ/', pronunciationEs: 'UIN-dou', example: 'Open the window.', level: 'A1' },
    { front: 'Wall', back: 'Pared', pronunciation: '/wɔːl/', pronunciationEs: 'uol', example: 'Hang it on the wall.', level: 'A1' },
    { front: 'Floor', back: 'Suelo', pronunciation: '/flɔːr/', pronunciationEs: 'flor', example: 'Clean the floor.', level: 'A1' },
    { front: 'Roof', back: 'Tejado', pronunciation: '/ruːf/', pronunciationEs: 'ruf', example: 'Fix the roof.', level: 'A2' },
    { front: 'Chimney', back: 'Chimenea', pronunciation: '/ˈtʃɪmni/', pronunciationEs: 'CHIM-ni', example: 'Smoke from the chimney.', level: 'B1' },
    { front: 'Fence', back: 'Valla', pronunciation: '/fens/', pronunciationEs: 'fens', example: 'Paint the fence.', level: 'A2' },
    { front: 'Driveway', back: 'Entrada de coches', pronunciation: '/ˈdraɪvweɪ/', pronunciationEs: 'DRAIV-uei', example: 'Park in the driveway.', level: 'B1' },
    { front: 'Hallway', back: 'Pasillo', pronunciation: '/ˈhɔːlweɪ/', pronunciationEs: 'JOL-uei', example: 'Walk down the hallway.', level: 'A2' },
    { front: 'Curtain', back: 'Cortina', pronunciation: '/ˈkɜːrtn/', pronunciationEs: 'KER-ten', example: 'Close the curtains.', level: 'A2' },
    { front: 'Carpet', back: 'Alfombra', pronunciation: '/ˈkɑːrpɪt/', pronunciationEs: 'KAR-pit', example: 'Vacuum the carpet.', level: 'A2' },
    { front: 'Fireplace', back: 'Chimenea (interior)', pronunciation: '/ˈfaɪərpleɪs/', pronunciationEs: 'FAIR-pleis', example: 'Sit by the fireplace.', level: 'B1' },
    { front: 'Drawer', back: 'Cajón', pronunciation: '/drɔːr/', pronunciationEs: 'dror', example: 'Check the drawer.', level: 'A2' },
    { front: 'Shelf', back: 'Estante', pronunciation: '/ʃelf/', pronunciationEs: 'shelf', example: 'Put it on the shelf.', level: 'A2' },
  ],
  topic_language: [
    { front: 'Fluent', back: 'Fluido/Con fluidez', pronunciation: '/ˈfluːənt/', pronunciationEs: 'FLU-ent', example: 'She\'s fluent in French.', level: 'B1' },
    { front: 'Native speaker', back: 'Hablante nativo', pronunciation: '/ˈneɪtɪv ˈspiːkər/', pronunciationEs: 'NEI-tiv SPI-ker', example: 'He\'s a native speaker.', level: 'B1' },
    { front: 'Accent', back: 'Acento', pronunciation: '/ˈæksent/', pronunciationEs: 'AK-sent', example: 'I love your accent.', level: 'A2' },
    { front: 'Slang', back: 'Jerga/Argot', pronunciation: '/slæŋ/', pronunciationEs: 'slang', example: 'Slang is hard to learn.', level: 'B1' },
    { front: 'Idiom', back: 'Modismo/Expresión', pronunciation: '/ˈɪdiəm/', pronunciationEs: 'I-diom', example: 'That\'s a common idiom.', level: 'B1' },
    { front: 'Pronunciation', back: 'Pronunciación', pronunciation: '/prəˌnʌnsiˈeɪʃn/', pronunciationEs: 'pro-nan-si-EI-shon', example: 'Work on your pronunciation.', level: 'A2' },
    { front: 'Vocabulary', back: 'Vocabulario', pronunciation: '/voʊˈkæbjəleri/', pronunciationEs: 'vo-KA-biu-le-ri', example: 'Expand your vocabulary.', level: 'A2' },
    { front: 'Grammar', back: 'Gramática', pronunciation: '/ˈɡræmər/', pronunciationEs: 'GRA-mer', example: 'Grammar is important.', level: 'A2' },
    { front: 'Bilingual', back: 'Bilingüe', pronunciation: '/baɪˈlɪŋɡwəl/', pronunciationEs: 'bai-LIN-gual', example: 'My children are bilingual.', level: 'B1' },
    { front: 'Translate', back: 'Traducir', pronunciation: '/trænsˈleɪt/', pronunciationEs: 'trans-LEIT', example: 'Can you translate this?', level: 'A2' },
    { front: 'Dictionary', back: 'Diccionario', pronunciation: '/ˈdɪkʃəneri/', pronunciationEs: 'DIK-sho-ne-ri', example: 'Look it up in the dictionary.', level: 'A1' },
    { front: 'Sentence', back: 'Oración', pronunciation: '/ˈsentəns/', pronunciationEs: 'SEN-tens', example: 'Write a complete sentence.', level: 'A1' },
    { front: 'Word', back: 'Palabra', pronunciation: '/wɜːrd/', pronunciationEs: 'uerd', example: 'What does this word mean?', level: 'A1' },
    { front: 'Spell', back: 'Deletrear', pronunciation: '/spel/', pronunciationEs: 'spel', example: 'How do you spell that?', level: 'A1' },
    { front: 'Meaning', back: 'Significado', pronunciation: '/ˈmiːnɪŋ/', pronunciationEs: 'MI-ning', example: 'What\'s the meaning of this?', level: 'A2' },
    { front: 'Mother tongue', back: 'Lengua materna', pronunciation: '/ˈmʌðər tʌŋ/', pronunciationEs: 'MA-zer tang', example: 'Spanish is my mother tongue.', level: 'B1' },
    { front: 'Dialect', back: 'Dialecto', pronunciation: '/ˈdaɪəlekt/', pronunciationEs: 'DAI-a-lekt', example: 'Each region has its dialect.', level: 'B2' },
    { front: 'Conversation', back: 'Conversación', pronunciation: '/ˌkɒnvərˈseɪʃn/', pronunciationEs: 'kon-ver-SEI-shon', example: 'We had a nice conversation.', level: 'A2' },
    { front: 'Expression', back: 'Expresión', pronunciation: '/ɪkˈspreʃn/', pronunciationEs: 'ik-SPRE-shon', example: 'Learn common expressions.', level: 'B1' },
    { front: 'Phrase', back: 'Frase', pronunciation: '/freɪz/', pronunciationEs: 'freiz', example: 'Repeat the phrase.', level: 'A2' },
    { front: 'Verb', back: 'Verbo', pronunciation: '/vɜːrb/', pronunciationEs: 'verb', example: 'Conjugate the verb.', level: 'A2' },
    { front: 'Noun', back: 'Sustantivo', pronunciation: '/naʊn/', pronunciationEs: 'naun', example: 'This is a noun.', level: 'A2' },
    { front: 'Adjective', back: 'Adjetivo', pronunciation: '/ˈædʒɪktɪv/', pronunciationEs: 'AD-yek-tiv', example: 'Use more adjectives.', level: 'A2' },
    { front: 'Adverb', back: 'Adverbio', pronunciation: '/ˈædvɜːrb/', pronunciationEs: 'AD-verb', example: 'Quickly is an adverb.', level: 'B1' },
    { front: 'Conjugate', back: 'Conjugar', pronunciation: '/ˈkɒndʒʊɡeɪt/', pronunciationEs: 'KON-yu-geit', example: 'Conjugate this verb.', level: 'B1' },
    { front: 'Syllable', back: 'Sílaba', pronunciation: '/ˈsɪləbl/', pronunciationEs: 'SI-la-bol', example: 'How many syllables?', level: 'B1' },
    { front: 'Synonym', back: 'Sinónimo', pronunciation: '/ˈsɪnənɪm/', pronunciationEs: 'SI-no-nim', example: 'Give me a synonym.', level: 'B1' },
    { front: 'Antonym', back: 'Antónimo', pronunciation: '/ˈæntənɪm/', pronunciationEs: 'AN-to-nim', example: 'Hot is the antonym of cold.', level: 'B1' },
    { front: 'Preposition', back: 'Preposición', pronunciation: '/ˌprepəˈzɪʃn/', pronunciationEs: 'pre-po-SI-shon', example: 'In is a preposition.', level: 'B1' },
    { front: 'Pronoun', back: 'Pronombre', pronunciation: '/ˈproʊnaʊn/', pronunciationEs: 'PROU-naun', example: 'He is a pronoun.', level: 'B1' },
    { front: 'Plural', back: 'Plural', pronunciation: '/ˈplʊrəl/', pronunciationEs: 'PLU-ral', example: 'What\'s the plural form?', level: 'A2' },
    { front: 'Singular', back: 'Singular', pronunciation: '/ˈsɪŋɡjələr/', pronunciationEs: 'SIN-giu-lar', example: 'Use the singular form.', level: 'A2' },
    { front: 'Tense', back: 'Tiempo verbal', pronunciation: '/tens/', pronunciationEs: 'tens', example: 'Use the past tense.', level: 'B1' },
    { front: 'Improve', back: 'Mejorar', pronunciation: '/ɪmˈpruːv/', pronunciationEs: 'im-PRUV', example: 'I want to improve my English.', level: 'A2' },
    { front: 'Practice', back: 'Practicar', pronunciation: '/ˈpræktɪs/', pronunciationEs: 'PRAK-tis', example: 'Practice every day.', level: 'A2' },
  ],
  topic_feelings: [
    { front: 'Excited', back: 'Emocionado', pronunciation: '/ɪkˈsaɪtɪd/', pronunciationEs: 'ik-SAI-ted', example: 'I\'m excited about the trip.', level: 'A2' },
    { front: 'Anxious', back: 'Ansioso', pronunciation: '/ˈæŋkʃəs/', pronunciationEs: 'ANK-shos', example: 'She feels anxious before exams.', level: 'B1' },
    { front: 'Confident', back: 'Seguro/Confiado', pronunciation: '/ˈkɒnfɪdənt/', pronunciationEs: 'KON-fi-dent', example: 'Be confident in yourself.', level: 'B1' },
    { front: 'Frustrated', back: 'Frustrado', pronunciation: '/frʌˈstreɪtɪd/', pronunciationEs: 'fras-TREI-ted', example: 'I feel frustrated.', level: 'B1' },
    { front: 'Grateful', back: 'Agradecido', pronunciation: '/ˈɡreɪtfl/', pronunciationEs: 'GREIT-ful', example: 'I\'m grateful for your help.', level: 'B1' },
    { front: 'Relieved', back: 'Aliviado', pronunciation: '/rɪˈliːvd/', pronunciationEs: 'ri-LIVD', example: 'I\'m relieved it\'s over.', level: 'B1' },
    { front: 'Overwhelmed', back: 'Abrumado', pronunciation: '/ˌoʊvərˈwelmd/', pronunciationEs: 'ou-ver-UELMD', example: 'I feel overwhelmed with work.', level: 'B2' },
    { front: 'Disappointed', back: 'Decepcionado', pronunciation: '/ˌdɪsəˈpɔɪntɪd/', pronunciationEs: 'dis-a-POIN-ted', example: 'I was disappointed by the result.', level: 'B1' },
    { front: 'Impressed', back: 'Impresionado', pronunciation: '/ɪmˈprest/', pronunciationEs: 'im-PREST', example: 'I\'m impressed by your work.', level: 'B1' },
    { front: 'Satisfied', back: 'Satisfecho', pronunciation: '/ˈsætɪsfaɪd/', pronunciationEs: 'SA-tis-faid', example: 'Are you satisfied with the service?', level: 'B1' },
    { front: 'Happy', back: 'Feliz', pronunciation: '/ˈhæpi/', pronunciationEs: 'JA-pi', example: 'I\'m so happy today.', level: 'A1' },
    { front: 'Sad', back: 'Triste', pronunciation: '/sæd/', pronunciationEs: 'sad', example: 'Why are you sad?', level: 'A1' },
    { front: 'Angry', back: 'Enfadado', pronunciation: '/ˈæŋɡri/', pronunciationEs: 'AN-gri', example: 'Don\'t be angry.', level: 'A1' },
    { front: 'Scared', back: 'Asustado', pronunciation: '/skerd/', pronunciationEs: 'skerd', example: 'I\'m scared of spiders.', level: 'A1' },
    { front: 'Tired', back: 'Cansado', pronunciation: '/taɪərd/', pronunciationEs: 'TAIERD', example: 'I\'m really tired.', level: 'A1' },
    { front: 'Bored', back: 'Aburrido', pronunciation: '/bɔːrd/', pronunciationEs: 'bord', example: 'I\'m so bored.', level: 'A1' },
    { front: 'Surprised', back: 'Sorprendido', pronunciation: '/sərˈpraɪzd/', pronunciationEs: 'ser-PRAIZD', example: 'I was surprised.', level: 'A2' },
    { front: 'Worried', back: 'Preocupado', pronunciation: '/ˈwʌrid/', pronunciationEs: 'UA-rid', example: 'I\'m worried about him.', level: 'A2' },
    { front: 'Nervous', back: 'Nervioso', pronunciation: '/ˈnɜːrvəs/', pronunciationEs: 'NER-vos', example: 'I feel nervous.', level: 'A2' },
    { front: 'Jealous', back: 'Celoso', pronunciation: '/ˈdʒeləs/', pronunciationEs: 'YE-los', example: 'Don\'t be jealous.', level: 'B1' },
    { front: 'Proud', back: 'Orgulloso', pronunciation: '/praʊd/', pronunciationEs: 'praud', example: 'I\'m proud of you.', level: 'A2' },
    { front: 'Embarrassed', back: 'Avergonzado', pronunciation: '/ɪmˈbærəst/', pronunciationEs: 'im-BA-rast', example: 'I felt embarrassed.', level: 'B1' },
    { front: 'Confused', back: 'Confundido', pronunciation: '/kənˈfjuːzd/', pronunciationEs: 'kon-FIUSD', example: 'I\'m confused.', level: 'A2' },
    { front: 'Lonely', back: 'Solo/Solitario', pronunciation: '/ˈloʊnli/', pronunciationEs: 'LOUN-li', example: 'She feels lonely.', level: 'A2' },
    { front: 'Curious', back: 'Curioso', pronunciation: '/ˈkjʊəriəs/', pronunciationEs: 'KIU-rios', example: 'I\'m curious about it.', level: 'B1' },
    { front: 'Hopeful', back: 'Esperanzado', pronunciation: '/ˈhoʊpfl/', pronunciationEs: 'JOUP-ful', example: 'I\'m hopeful.', level: 'B1' },
    { front: 'Upset', back: 'Disgustado', pronunciation: '/ʌpˈset/', pronunciationEs: 'ap-SET', example: 'She\'s very upset.', level: 'A2' },
    { front: 'Calm', back: 'Tranquilo', pronunciation: '/kɑːm/', pronunciationEs: 'kam', example: 'Stay calm.', level: 'A2' },
    { front: 'Delighted', back: 'Encantado', pronunciation: '/dɪˈlaɪtɪd/', pronunciationEs: 'di-LAI-ted', example: 'I\'m delighted to meet you.', level: 'B1' },
  ],
  topic_places: [
    { front: 'Hospital', back: 'Hospital', pronunciation: '/ˈhɒspɪtl/', pronunciationEs: 'JOS-pi-tol', example: 'He\'s in the hospital.', level: 'A1' },
    { front: 'Library', back: 'Biblioteca', pronunciation: '/ˈlaɪbrəri/', pronunciationEs: 'LAI-bra-ri', example: 'I study at the library.', level: 'A1' },
    { front: 'Museum', back: 'Museo', pronunciation: '/mjuˈziːəm/', pronunciationEs: 'miu-SI-om', example: 'The museum is closed today.', level: 'A2' },
    { front: 'Skyscraper', back: 'Rascacielos', pronunciation: '/ˈskaɪskreɪpər/', pronunciationEs: 'SKAI-skrei-per', example: 'The skyscraper has 50 floors.', level: 'B1' },
    { front: 'Cathedral', back: 'Catedral', pronunciation: '/kəˈθiːdrəl/', pronunciationEs: 'ka-ZI-dral', example: 'The cathedral is beautiful.', level: 'B1' },
    { front: 'Forest', back: 'Bosque', pronunciation: '/ˈfɒrɪst/', pronunciationEs: 'FO-rest', example: 'We walked through the forest.', level: 'A2' },
    { front: 'Lake', back: 'Lago', pronunciation: '/leɪk/', pronunciationEs: 'leik', example: 'The lake is frozen.', level: 'A1' },
    { front: 'Mountain', back: 'Montaña', pronunciation: '/ˈmaʊntən/', pronunciationEs: 'MAUN-ten', example: 'We climbed the mountain.', level: 'A1' },
    { front: 'Valley', back: 'Valle', pronunciation: '/ˈvæli/', pronunciationEs: 'VA-li', example: 'The valley was green.', level: 'A2' },
    { front: 'Meadow', back: 'Pradera', pronunciation: '/ˈmedoʊ/', pronunciationEs: 'ME-dou', example: 'Flowers grew in the meadow.', level: 'B1' },
    { front: 'Beach', back: 'Playa', pronunciation: '/biːtʃ/', pronunciationEs: 'bich', example: 'Let\'s go to the beach.', level: 'A1' },
    { front: 'Park', back: 'Parque', pronunciation: '/pɑːrk/', pronunciationEs: 'park', example: 'The park is beautiful.', level: 'A1' },
    { front: 'Bridge', back: 'Puente', pronunciation: '/brɪdʒ/', pronunciationEs: 'briy', example: 'Cross the bridge.', level: 'A2' },
    { front: 'Church', back: 'Iglesia', pronunciation: '/tʃɜːrtʃ/', pronunciationEs: 'cherch', example: 'The church is old.', level: 'A1' },
    { front: 'Castle', back: 'Castillo', pronunciation: '/ˈkæsl/', pronunciationEs: 'KA-sol', example: 'Visit the castle.', level: 'A2' },
    { front: 'Tower', back: 'Torre', pronunciation: '/ˈtaʊər/', pronunciationEs: 'TAU-er', example: 'The tower is tall.', level: 'A2' },
    { front: 'River', back: 'Río', pronunciation: '/ˈrɪvər/', pronunciationEs: 'RI-ver', example: 'The river flows east.', level: 'A1' },
    { front: 'Island', back: 'Isla', pronunciation: '/ˈaɪlənd/', pronunciationEs: 'AI-land', example: 'The island is beautiful.', level: 'A2' },
    { front: 'Desert', back: 'Desierto', pronunciation: '/ˈdezərt/', pronunciationEs: 'DE-sert', example: 'The desert is hot.', level: 'A2' },
    { front: 'Waterfall', back: 'Cascada', pronunciation: '/ˈwɔːtərfɔːl/', pronunciationEs: 'UO-ter-fol', example: 'The waterfall is stunning.', level: 'B1' },
    { front: 'Cave', back: 'Cueva', pronunciation: '/keɪv/', pronunciationEs: 'keiv', example: 'Explore the cave.', level: 'B1' },
    { front: 'Cliff', back: 'Acantilado', pronunciation: '/klɪf/', pronunciationEs: 'klif', example: 'Stand on the cliff.', level: 'B1' },
    { front: 'Hill', back: 'Colina', pronunciation: '/hɪl/', pronunciationEs: 'jil', example: 'Walk up the hill.', level: 'A2' },
    { front: 'Coast', back: 'Costa', pronunciation: '/koʊst/', pronunciationEs: 'koust', example: 'We drove along the coast.', level: 'A2' },
    { front: 'Harbour', back: 'Puerto', pronunciation: '/ˈhɑːrbər/', pronunciationEs: 'JAR-ber', example: 'Boats in the harbour.', level: 'B1' },
    { front: 'Fountain', back: 'Fuente', pronunciation: '/ˈfaʊntən/', pronunciationEs: 'FAUN-ten', example: 'The fountain is beautiful.', level: 'A2' },
    { front: 'Square', back: 'Plaza', pronunciation: '/skwer/', pronunciationEs: 'skuer', example: 'Meet me at the square.', level: 'A2' },
    { front: 'Ruins', back: 'Ruinas', pronunciation: '/ˈruːɪnz/', pronunciationEs: 'RU-ins', example: 'We visited ancient ruins.', level: 'B1' },
    { front: 'Monument', back: 'Monumento', pronunciation: '/ˈmɒnjʊmənt/', pronunciationEs: 'MO-niu-ment', example: 'The monument is famous.', level: 'A2' },
  ],
  topic_city: [
    { front: 'Traffic', back: 'Tráfico', pronunciation: '/ˈtræfɪk/', pronunciationEs: 'TRA-fik', example: 'The traffic is terrible.', level: 'A2' },
    { front: 'Pavement', back: 'Acera', pronunciation: '/ˈpeɪvmənt/', pronunciationEs: 'PEIV-ment', example: 'Walk on the pavement.', level: 'A2' },
    { front: 'Suburb', back: 'Suburbio/Afueras', pronunciation: '/ˈsʌbɜːrb/', pronunciationEs: 'SA-berb', example: 'They live in the suburbs.', level: 'B1' },
    { front: 'Downtown', back: 'Centro de la ciudad', pronunciation: '/ˌdaʊnˈtaʊn/', pronunciationEs: 'daun-TAUN', example: 'Let\'s go downtown.', level: 'A2' },
    { front: 'Pedestrian', back: 'Peatón', pronunciation: '/pəˈdestriən/', pronunciationEs: 'pe-DES-trian', example: 'Pedestrians have priority.', level: 'B1' },
    { front: 'Street', back: 'Calle', pronunciation: '/striːt/', pronunciationEs: 'strit', example: 'Cross the street carefully.', level: 'A1' },
    { front: 'Avenue', back: 'Avenida', pronunciation: '/ˈævənjuː/', pronunciationEs: 'A-ve-niu', example: 'It\'s on Fifth Avenue.', level: 'A2' },
    { front: 'Intersection', back: 'Cruce/Intersección', pronunciation: '/ˌɪntərˈsekʃn/', pronunciationEs: 'in-ter-SEK-shon', example: 'Turn at the intersection.', level: 'B1' },
    { front: 'Roundabout', back: 'Rotonda', pronunciation: '/ˈraʊndəbaʊt/', pronunciationEs: 'RAUN-da-baut', example: 'Take the second exit.', level: 'B1' },
    { front: 'Crosswalk', back: 'Paso de peatones', pronunciation: '/ˈkrɒswɔːk/', pronunciationEs: 'KROS-uok', example: 'Use the crosswalk.', level: 'A2' },
    { front: 'Traffic light', back: 'Semáforo', pronunciation: '/ˈtræfɪk laɪt/', pronunciationEs: 'TRA-fik lait', example: 'Wait for the traffic light.', level: 'A2' },
    { front: 'Bus stop', back: 'Parada de autobús', pronunciation: '/bʌs stɒp/', pronunciationEs: 'bas stop', example: 'Wait at the bus stop.', level: 'A1' },
    { front: 'Metro station', back: 'Estación de metro', pronunciation: '/ˈmetroʊ ˈsteɪʃn/', pronunciationEs: 'ME-tro STEI-shon', example: 'The metro station is near.', level: 'A2' },
    { front: 'Parking lot', back: 'Aparcamiento', pronunciation: '/ˈpɑːrkɪŋ lɒt/', pronunciationEs: 'PAR-king lot', example: 'The parking lot is full.', level: 'A2' },
    { front: 'Skyscraper', back: 'Rascacielos', pronunciation: '/ˈskaɪskreɪpər/', pronunciationEs: 'SKAI-skrei-per', example: 'Look at that skyscraper.', level: 'B1' },
    { front: 'Town hall', back: 'Ayuntamiento', pronunciation: '/taʊn hɔːl/', pronunciationEs: 'taun jol', example: 'Meet at town hall.', level: 'B1' },
    { front: 'Police station', back: 'Comisaría', pronunciation: '/pəˈliːs ˈsteɪʃn/', pronunciationEs: 'po-LIS STEI-shon', example: 'Report it to the police station.', level: 'A2' },
    { front: 'Fire station', back: 'Estación de bomberos', pronunciation: '/faɪər ˈsteɪʃn/', pronunciationEs: 'FAIR STEI-shon', example: 'The fire station is nearby.', level: 'A2' },
    { front: 'Post office', back: 'Oficina de correos', pronunciation: '/poʊst ˈɒfɪs/', pronunciationEs: 'poust O-fis', example: 'Go to the post office.', level: 'A2' },
    { front: 'Bank', back: 'Banco', pronunciation: '/bæŋk/', pronunciationEs: 'bank', example: 'The bank closes at 5.', level: 'A1' },
    { front: 'Shopping mall', back: 'Centro comercial', pronunciation: '/ˈʃɒpɪŋ mɔːl/', pronunciationEs: 'SHO-ping mol', example: 'Let\'s go to the mall.', level: 'A2' },
    { front: 'Sidewalk', back: 'Acera', pronunciation: '/ˈsaɪdwɔːk/', pronunciationEs: 'SAID-uok', example: 'Walk on the sidewalk.', level: 'A2' },
    { front: 'Alley', back: 'Callejón', pronunciation: '/ˈæli/', pronunciationEs: 'A-li', example: 'Don\'t go down that alley.', level: 'B1' },
    { front: 'Block', back: 'Manzana', pronunciation: '/blɒk/', pronunciationEs: 'blok', example: 'Walk two blocks.', level: 'A2' },
    { front: 'Neighbourhood', back: 'Barrio', pronunciation: '/ˈneɪbərˌhʊd/', pronunciationEs: 'NEI-ber-jud', example: 'It\'s a nice neighbourhood.', level: 'B1' },
  ],
  topic_shopping: [
    { front: 'Receipt', back: 'Recibo', pronunciation: '/rɪˈsiːt/', pronunciationEs: 'ri-SIT', example: 'Keep your receipt.', level: 'A2' },
    { front: 'Discount', back: 'Descuento', pronunciation: '/ˈdɪskaʊnt/', pronunciationEs: 'DIS-kaunt', example: 'There\'s a 20% discount.', level: 'A2' },
    { front: 'Bargain', back: 'Ganga/Oferta', pronunciation: '/ˈbɑːrɡən/', pronunciationEs: 'BAR-gen', example: 'That\'s a real bargain!', level: 'B1' },
    { front: 'Refund', back: 'Reembolso', pronunciation: '/ˈriːfʌnd/', pronunciationEs: 'RI-fand', example: 'Can I get a refund?', level: 'B1' },
    { front: 'Sale', back: 'Rebajas/Venta', pronunciation: '/seɪl/', pronunciationEs: 'seil', example: 'The sale starts tomorrow.', level: 'A2' },
    { front: 'Customer', back: 'Cliente', pronunciation: '/ˈkʌstəmər/', pronunciationEs: 'KAS-to-mer', example: 'The customer is always right.', level: 'A2' },
    { front: 'Cashier', back: 'Cajero/a', pronunciation: '/kæˈʃɪr/', pronunciationEs: 'ka-SHIR', example: 'Pay at the cashier.', level: 'A2' },
    { front: 'Shopping cart', back: 'Carrito de compras', pronunciation: '/ˈʃɒpɪŋ kɑːrt/', pronunciationEs: 'SHO-ping kart', example: 'The shopping cart is full.', level: 'A2' },
    { front: 'Try on', back: 'Probarse', pronunciation: '/traɪ ɒn/', pronunciationEs: 'trai on', example: 'Can I try this on?', level: 'A2' },
    { front: 'Queue', back: 'Cola/Fila', pronunciation: '/kjuː/', pronunciationEs: 'kiu', example: 'There\'s a long queue.', level: 'B1' },
    { front: 'Price', back: 'Precio', pronunciation: '/praɪs/', pronunciationEs: 'prais', example: 'What\'s the price?', level: 'A1' },
    { front: 'Cheap', back: 'Barato', pronunciation: '/tʃiːp/', pronunciationEs: 'chip', example: 'This is really cheap.', level: 'A1' },
    { front: 'Expensive', back: 'Caro', pronunciation: '/ɪkˈspensɪv/', pronunciationEs: 'ik-SPEN-siv', example: 'That bag is expensive.', level: 'A1' },
    { front: 'Shop', back: 'Tienda', pronunciation: '/ʃɒp/', pronunciationEs: 'shop', example: 'Let\'s go to the shop.', level: 'A1' },
    { front: 'Store', back: 'Tienda', pronunciation: '/stɔːr/', pronunciationEs: 'stor', example: 'The store is open.', level: 'A1' },
    { front: 'Market', back: 'Mercado', pronunciation: '/ˈmɑːrkɪt/', pronunciationEs: 'MAR-ket', example: 'Go to the market.', level: 'A1' },
    { front: 'Supermarket', back: 'Supermercado', pronunciation: '/ˈsuːpərmɑːrkɪt/', pronunciationEs: 'SU-per-mar-ket', example: 'Buy it at the supermarket.', level: 'A1' },
    { front: 'Checkout', back: 'Caja', pronunciation: '/ˈtʃekaʊt/', pronunciationEs: 'CHEK-aut', example: 'Go to the checkout.', level: 'A2' },
    { front: 'Fitting room', back: 'Probador', pronunciation: '/ˈfɪtɪŋ ruːm/', pronunciationEs: 'FI-ting rum', example: 'Where\'s the fitting room?', level: 'A2' },
    { front: 'Exchange', back: 'Cambiar', pronunciation: '/ɪksˈtʃeɪndʒ/', pronunciationEs: 'iks-CHEINCH', example: 'Can I exchange this?', level: 'B1' },
    { front: 'Cash', back: 'Efectivo', pronunciation: '/kæʃ/', pronunciationEs: 'kash', example: 'I\'ll pay cash.', level: 'A2' },
    { front: 'Credit card', back: 'Tarjeta de crédito', pronunciation: '/ˈkredɪt kɑːrd/', pronunciationEs: 'KRE-dit kard', example: 'Can I pay by credit card?', level: 'A2' },
    { front: 'Basket', back: 'Cesta', pronunciation: '/ˈbæskɪt/', pronunciationEs: 'BAS-ket', example: 'Take a basket.', level: 'A2' },
    { front: 'Aisle', back: 'Pasillo', pronunciation: '/aɪl/', pronunciationEs: 'ail', example: 'It\'s in aisle 3.', level: 'B1' },
    { front: 'Brand', back: 'Marca', pronunciation: '/brænd/', pronunciationEs: 'brand', example: 'Which brand do you prefer?', level: 'A2' },
    { front: 'Size', back: 'Talla', pronunciation: '/saɪz/', pronunciationEs: 'sais', example: 'What size do you wear?', level: 'A1' },
    { front: 'Out of stock', back: 'Agotado', pronunciation: '/aʊt əv stɒk/', pronunciationEs: 'aut ov stok', example: 'It\'s out of stock.', level: 'B1' },
    { front: 'In stock', back: 'Disponible', pronunciation: '/ɪn stɒk/', pronunciationEs: 'in stok', example: 'Is it in stock?', level: 'B1' },
    { front: 'Warranty', back: 'Garantía', pronunciation: '/ˈwɒrənti/', pronunciationEs: 'UO-ran-ti', example: 'It has a 2-year warranty.', level: 'B1' },
    { front: 'Coupon', back: 'Cupón', pronunciation: '/ˈkuːpɒn/', pronunciationEs: 'KU-pon', example: 'I have a coupon.', level: 'B1' },
  ],
  topic_sport: [
    { front: 'Team', back: 'Equipo', pronunciation: '/tiːm/', pronunciationEs: 'tim', example: 'Our team won the match.', level: 'A1' },
    { front: 'Score', back: 'Puntuación/Marcar', pronunciation: '/skɔːr/', pronunciationEs: 'skor', example: 'What\'s the score?', level: 'A2' },
    { front: 'Match', back: 'Partido', pronunciation: '/mætʃ/', pronunciationEs: 'match', example: 'The match starts at 8.', level: 'A1' },
    { front: 'Coach', back: 'Entrenador', pronunciation: '/koʊtʃ/', pronunciationEs: 'couch', example: 'The coach gave instructions.', level: 'A2' },
    { front: 'Championship', back: 'Campeonato', pronunciation: '/ˈtʃæmpiənʃɪp/', pronunciationEs: 'CHAM-pion-ship', example: 'They won the championship.', level: 'B1' },
    { front: 'Referee', back: 'Árbitro', pronunciation: '/ˌrefəˈriː/', pronunciationEs: 're-fe-RI', example: 'The referee made a decision.', level: 'B1' },
    { front: 'Stadium', back: 'Estadio', pronunciation: '/ˈsteɪdiəm/', pronunciationEs: 'STEI-diam', example: 'The stadium was full.', level: 'A2' },
    { front: 'Tournament', back: 'Torneo', pronunciation: '/ˈtʊrnəmənt/', pronunciationEs: 'TUR-na-ment', example: 'The tennis tournament starts Monday.', level: 'B1' },
    { front: 'Athlete', back: 'Atleta', pronunciation: '/ˈæθliːt/', pronunciationEs: 'AZ-lit', example: 'She\'s a professional athlete.', level: 'B1' },
    { front: 'Opponent', back: 'Oponente', pronunciation: '/əˈpoʊnənt/', pronunciationEs: 'o-POU-nent', example: 'He beat his opponent easily.', level: 'B1' },
    { front: 'Player', back: 'Jugador', pronunciation: '/ˈpleɪər/', pronunciationEs: 'PLEI-er', example: 'He\'s a great player.', level: 'A1' },
    { front: 'Win', back: 'Ganar', pronunciation: '/wɪn/', pronunciationEs: 'uin', example: 'We need to win.', level: 'A1' },
    { front: 'Lose', back: 'Perder', pronunciation: '/luːz/', pronunciationEs: 'lus', example: 'Don\'t lose hope.', level: 'A1' },
    { front: 'Draw', back: 'Empate', pronunciation: '/drɔː/', pronunciationEs: 'dro', example: 'The match ended in a draw.', level: 'A2' },
    { front: 'Goal', back: 'Gol', pronunciation: '/ɡoʊl/', pronunciationEs: 'goul', example: 'He scored a goal.', level: 'A1' },
    { front: 'Trophy', back: 'Trofeo', pronunciation: '/ˈtroʊfi/', pronunciationEs: 'TROU-fi', example: 'They won the trophy.', level: 'A2' },
    { front: 'Medal', back: 'Medalla', pronunciation: '/ˈmedl/', pronunciationEs: 'ME-dol', example: 'She won a gold medal.', level: 'A2' },
    { front: 'Fitness', back: 'Forma física', pronunciation: '/ˈfɪtnəs/', pronunciationEs: 'FIT-nes', example: 'Fitness is important.', level: 'A2' },
    { front: 'Training', back: 'Entrenamiento', pronunciation: '/ˈtreɪnɪŋ/', pronunciationEs: 'TREI-ning', example: 'Training starts at 6.', level: 'A2' },
    { front: 'Warm up', back: 'Calentar', pronunciation: '/wɔːrm ʌp/', pronunciationEs: 'uorm ap', example: 'Let\'s warm up first.', level: 'A2' },
    { front: 'Record', back: 'Récord', pronunciation: '/ˈrekɔːrd/', pronunciationEs: 'RE-kord', example: 'She broke the record.', level: 'B1' },
    { front: 'Pitch', back: 'Campo de juego', pronunciation: '/pɪtʃ/', pronunciationEs: 'pitch', example: 'The pitch was wet.', level: 'B1' },
    { front: 'Court', back: 'Cancha/Pista', pronunciation: '/kɔːrt/', pronunciationEs: 'kort', example: 'Meet me at the tennis court.', level: 'A2' },
    { front: 'Pool', back: 'Piscina', pronunciation: '/puːl/', pronunciationEs: 'pul', example: 'Let\'s go to the pool.', level: 'A1' },
    { front: 'Gym', back: 'Gimnasio', pronunciation: '/dʒɪm/', pronunciationEs: 'yim', example: 'I go to the gym.', level: 'A2' },
    { front: 'League', back: 'Liga', pronunciation: '/liːɡ/', pronunciationEs: 'lig', example: 'He plays in the premier league.', level: 'B1' },
    { front: 'Season', back: 'Temporada', pronunciation: '/ˈsiːzn/', pronunciationEs: 'SI-son', example: 'The season starts soon.', level: 'A2' },
    { front: 'Fan', back: 'Aficionado', pronunciation: '/fæn/', pronunciationEs: 'fan', example: 'I\'m a big fan.', level: 'A2' },
    { front: 'Champion', back: 'Campeón', pronunciation: '/ˈtʃæmpiən/', pronunciationEs: 'CHAM-pion', example: 'He\'s the world champion.', level: 'A2' },
    { front: 'Penalty', back: 'Penalti', pronunciation: '/ˈpenəlti/', pronunciationEs: 'PE-nal-ti', example: 'The referee gave a penalty.', level: 'B1' },
  ],
  topic_nature: [
    { front: 'Wildlife', back: 'Fauna silvestre', pronunciation: '/ˈwaɪldlaɪf/', pronunciationEs: 'UAILD-laif', example: 'Protect the wildlife.', level: 'B1' },
    { front: 'Species', back: 'Especie', pronunciation: '/ˈspiːʃiːz/', pronunciationEs: 'SPI-shis', example: 'Many species are endangered.', level: 'B1' },
    { front: 'Insect', back: 'Insecto', pronunciation: '/ˈɪnsekt/', pronunciationEs: 'IN-sekt', example: 'I hate insects.', level: 'A2' },
    { front: 'Mammal', back: 'Mamífero', pronunciation: '/ˈmæml/', pronunciationEs: 'MA-mol', example: 'Whales are mammals.', level: 'B1' },
    { front: 'Habitat', back: 'Hábitat', pronunciation: '/ˈhæbɪtæt/', pronunciationEs: 'JA-bi-tat', example: 'Their habitat is being destroyed.', level: 'B1' },
    { front: 'Cliff', back: 'Acantilado', pronunciation: '/klɪf/', pronunciationEs: 'klif', example: 'Be careful near the cliff.', level: 'B1' },
    { front: 'Waterfall', back: 'Cascada', pronunciation: '/ˈwɔːtərfɔːl/', pronunciationEs: 'UO-ter-fol', example: 'The waterfall was impressive.', level: 'A2' },
    { front: 'Beach', back: 'Playa', pronunciation: '/biːtʃ/', pronunciationEs: 'bich', example: 'Let\'s go to the beach.', level: 'A1' },
    { front: 'Ocean', back: 'Océano', pronunciation: '/ˈoʊʃn/', pronunciationEs: 'OU-shon', example: 'The ocean is deep.', level: 'A2' },
    { front: 'Desert', back: 'Desierto', pronunciation: '/ˈdezərt/', pronunciationEs: 'DE-sert', example: 'The Sahara is a desert.', level: 'A2' },
    { front: 'Tree', back: 'Árbol', pronunciation: '/triː/', pronunciationEs: 'tri', example: 'The tree is very old.', level: 'A1' },
    { front: 'Flower', back: 'Flor', pronunciation: '/ˈflaʊər/', pronunciationEs: 'FLAU-er', example: 'What a beautiful flower!', level: 'A1' },
    { front: 'Plant', back: 'Planta', pronunciation: '/plænt/', pronunciationEs: 'plant', example: 'Water the plants.', level: 'A1' },
    { front: 'Grass', back: 'Hierba', pronunciation: '/ɡræs/', pronunciationEs: 'gras', example: 'Don\'t walk on the grass.', level: 'A1' },
    { front: 'Leaf', back: 'Hoja', pronunciation: '/liːf/', pronunciationEs: 'lif', example: 'The leaf fell.', level: 'A1' },
    { front: 'Branch', back: 'Rama', pronunciation: '/bræntʃ/', pronunciationEs: 'branch', example: 'A branch fell down.', level: 'A2' },
    { front: 'Rock', back: 'Roca', pronunciation: '/rɒk/', pronunciationEs: 'rok', example: 'Sit on the rock.', level: 'A1' },
    { front: 'Stone', back: 'Piedra', pronunciation: '/stoʊn/', pronunciationEs: 'stoun', example: 'Don\'t throw stones.', level: 'A1' },
    { front: 'Sand', back: 'Arena', pronunciation: '/sænd/', pronunciationEs: 'sand', example: 'Play in the sand.', level: 'A1' },
    { front: 'Wave', back: 'Ola', pronunciation: '/weɪv/', pronunciationEs: 'ueiv', example: 'The waves are big.', level: 'A2' },
    { front: 'Stream', back: 'Arroyo', pronunciation: '/striːm/', pronunciationEs: 'strim', example: 'Cross the stream.', level: 'B1' },
    { front: 'Pond', back: 'Estanque', pronunciation: '/pɒnd/', pronunciationEs: 'pond', example: 'Ducks in the pond.', level: 'A2' },
    { front: 'Jungle', back: 'Jungla', pronunciation: '/ˈdʒʌŋɡl/', pronunciationEs: 'YANG-gol', example: 'The jungle is dense.', level: 'A2' },
    { front: 'Volcano', back: 'Volcán', pronunciation: '/vɒlˈkeɪnoʊ/', pronunciationEs: 'vol-KEI-nou', example: 'The volcano erupted.', level: 'B1' },
    { front: 'Earthquake', back: 'Terremoto', pronunciation: '/ˈɜːrθkweɪk/', pronunciationEs: 'ERZ-kueik', example: 'There was an earthquake.', level: 'B1' },
    { front: 'Rainbow', back: 'Arcoíris', pronunciation: '/ˈreɪnboʊ/', pronunciationEs: 'REIN-bou', example: 'Look at the rainbow!', level: 'A1' },
    { front: 'Sunrise', back: 'Amanecer', pronunciation: '/ˈsʌnraɪz/', pronunciationEs: 'SAN-rais', example: 'Watch the sunrise.', level: 'A2' },
    { front: 'Sunset', back: 'Atardecer', pronunciation: '/ˈsʌnset/', pronunciationEs: 'SAN-set', example: 'The sunset is beautiful.', level: 'A2' },
    { front: 'Horizon', back: 'Horizonte', pronunciation: '/həˈraɪzn/', pronunciationEs: 'jo-RAI-son', example: 'Look at the horizon.', level: 'B1' },
    { front: 'Landscape', back: 'Paisaje', pronunciation: '/ˈlændskeɪp/', pronunciationEs: 'LAND-skeip', example: 'What a lovely landscape!', level: 'B1' },
  ],
  topic_time: [
    { front: 'Century', back: 'Siglo', pronunciation: '/ˈsentʃəri/', pronunciationEs: 'SEN-chu-ri', example: 'The 21st century began in 2001.', level: 'A2' },
    { front: 'Decade', back: 'Década', pronunciation: '/ˈdekeɪd/', pronunciationEs: 'DE-keid', example: 'A decade is ten years.', level: 'B1' },
    { front: 'Midnight', back: 'Medianoche', pronunciation: '/ˈmɪdnaɪt/', pronunciationEs: 'MID-nait', example: 'The party ended at midnight.', level: 'A2' },
    { front: 'Nowadays', back: 'Hoy en día', pronunciation: '/ˈnaʊədeɪz/', pronunciationEs: 'NAU-a-deis', example: 'Nowadays, everyone has a phone.', level: 'B1' },
    { front: 'Meanwhile', back: 'Mientras tanto', pronunciation: '/ˈmiːnwaɪl/', pronunciationEs: 'MIN-uail', example: 'Meanwhile, I\'ll prepare dinner.', level: 'B1' },
    { front: 'Second', back: 'Segundo', pronunciation: '/ˈsekənd/', pronunciationEs: 'SE-kond', example: 'Wait a second.', level: 'A1' },
    { front: 'Minute', back: 'Minuto', pronunciation: '/ˈmɪnɪt/', pronunciationEs: 'MI-nit', example: 'Just a minute.', level: 'A1' },
    { front: 'Hour', back: 'Hora', pronunciation: '/ˈaʊər/', pronunciationEs: 'AU-er', example: 'It takes an hour.', level: 'A1' },
    { front: 'Week', back: 'Semana', pronunciation: '/wiːk/', pronunciationEs: 'uik', example: 'See you next week.', level: 'A1' },
    { front: 'Month', back: 'Mes', pronunciation: '/mʌnθ/', pronunciationEs: 'manz', example: 'This month is busy.', level: 'A1' },
    { front: 'Year', back: 'Año', pronunciation: '/jɪr/', pronunciationEs: 'yir', example: 'Happy New Year!', level: 'A1' },
    { front: 'Yesterday', back: 'Ayer', pronunciation: '/ˈjestərdeɪ/', pronunciationEs: 'YES-ter-dei', example: 'I saw him yesterday.', level: 'A1' },
    { front: 'Tomorrow', back: 'Mañana', pronunciation: '/təˈmɒroʊ/', pronunciationEs: 'to-MO-rou', example: 'See you tomorrow.', level: 'A1' },
    { front: 'Today', back: 'Hoy', pronunciation: '/təˈdeɪ/', pronunciationEs: 'to-DEI', example: 'What\'s the date today?', level: 'A1' },
    { front: 'Soon', back: 'Pronto', pronunciation: '/suːn/', pronunciationEs: 'sun', example: 'I\'ll be there soon.', level: 'A1' },
    { front: 'Later', back: 'Más tarde', pronunciation: '/ˈleɪtər/', pronunciationEs: 'LEI-ter', example: 'Call me later.', level: 'A1' },
    { front: 'Already', back: 'Ya', pronunciation: '/ɔːlˈredi/', pronunciationEs: 'ol-RE-di', example: 'I\'ve already eaten.', level: 'A2' },
    { front: 'Yet', back: 'Todavía', pronunciation: '/jet/', pronunciationEs: 'yet', example: 'Have you finished yet?', level: 'A2' },
    { front: 'Still', back: 'Aún/Todavía', pronunciation: '/stɪl/', pronunciationEs: 'stil', example: 'I\'m still working.', level: 'A2' },
    { front: 'Forever', back: 'Para siempre', pronunciation: '/fərˈevər/', pronunciationEs: 'for-E-ver', example: 'Friends forever.', level: 'A2' },
    { front: 'Never', back: 'Nunca', pronunciation: '/ˈnevər/', pronunciationEs: 'NE-ver', example: 'I\'ve never been there.', level: 'A1' },
    { front: 'Always', back: 'Siempre', pronunciation: '/ˈɔːlweɪz/', pronunciationEs: 'OL-ueis', example: 'I always wake up early.', level: 'A1' },
    { front: 'Often', back: 'A menudo', pronunciation: '/ˈɒfn/', pronunciationEs: 'O-fen', example: 'I often go there.', level: 'A2' },
    { front: 'Rarely', back: 'Raramente', pronunciation: '/ˈrerli/', pronunciationEs: 'RER-li', example: 'I rarely eat meat.', level: 'A2' },
    { front: 'Duration', back: 'Duración', pronunciation: '/djʊˈreɪʃn/', pronunciationEs: 'diu-REI-shon', example: 'What\'s the duration?', level: 'B1' },
    { front: 'Whenever', back: 'Cuando sea', pronunciation: '/wenˈevər/', pronunciationEs: 'uen-E-ver', example: 'Come whenever you want.', level: 'B1' },
    { front: 'Eventually', back: 'Finalmente', pronunciation: '/ɪˈventʃuəli/', pronunciationEs: 'i-VEN-chu-a-li', example: 'Eventually, it worked.', level: 'B1' },
    { front: 'Immediately', back: 'Inmediatamente', pronunciation: '/ɪˈmiːdiətli/', pronunciationEs: 'i-MI-di-at-li', example: 'Come here immediately.', level: 'B1' },
    { front: 'Recently', back: 'Recientemente', pronunciation: '/ˈriːsntli/', pronunciationEs: 'RI-sent-li', example: 'I saw her recently.', level: 'A2' },
    { front: 'Suddenly', back: 'De repente', pronunciation: '/ˈsʌdnli/', pronunciationEs: 'SA-den-li', example: 'Suddenly, it started raining.', level: 'B1' },
  ],
  topic_travel: [
    { front: 'Flight', back: 'Vuelo', pronunciation: '/flaɪt/', pronunciationEs: 'flait', example: 'The flight was delayed.', level: 'A2' },
    { front: 'Luggage', back: 'Equipaje', pronunciation: '/ˈlʌɡɪdʒ/', pronunciationEs: 'LA-gich', example: 'Where\'s the luggage?', level: 'A2' },
    { front: 'Departure', back: 'Salida', pronunciation: '/dɪˈpɑːrtʃər/', pronunciationEs: 'di-PAR-cher', example: 'Check the departure time.', level: 'B1' },
    { front: 'Arrival', back: 'Llegada', pronunciation: '/əˈraɪvl/', pronunciationEs: 'a-RAI-vol', example: 'The arrival is at 10am.', level: 'B1' },
    { front: 'Passport', back: 'Pasaporte', pronunciation: '/ˈpæspɔːrt/', pronunciationEs: 'PAS-port', example: 'Don\'t forget your passport.', level: 'A2' },
    { front: 'Destination', back: 'Destino', pronunciation: '/ˌdestɪˈneɪʃn/', pronunciationEs: 'des-ti-NEI-shon', example: 'We arrived at our destination.', level: 'B1' },
    { front: 'Boarding pass', back: 'Tarjeta de embarque', pronunciation: '/ˈbɔːrdɪŋ pæs/', pronunciationEs: 'BOR-ding pas', example: 'Show your boarding pass.', level: 'B1' },
    { front: 'Connection', back: 'Conexión/Transbordo', pronunciation: '/kəˈnekʃn/', pronunciationEs: 'co-NEK-shon', example: 'I missed my connection.', level: 'B1' },
    { front: 'Platform', back: 'Andén', pronunciation: '/ˈplætfɔːrm/', pronunciationEs: 'PLAT-form', example: 'The train leaves from platform 5.', level: 'A2' },
    { front: 'Commute', back: 'Desplazarse al trabajo', pronunciation: '/kəˈmjuːt/', pronunciationEs: 'co-MIUT', example: 'I commute by train.', level: 'B1' },
    { front: 'Airport', back: 'Aeropuerto', pronunciation: '/ˈerpɔːrt/', pronunciationEs: 'ER-port', example: 'Go to the airport.', level: 'A1' },
    { front: 'Hotel', back: 'Hotel', pronunciation: '/hoʊˈtel/', pronunciationEs: 'jo-TEL', example: 'Book a hotel.', level: 'A1' },
    { front: 'Reservation', back: 'Reserva', pronunciation: '/ˌrezərˈveɪʃn/', pronunciationEs: 're-ser-VEI-shon', example: 'I have a reservation.', level: 'A2' },
    { front: 'Ticket', back: 'Billete', pronunciation: '/ˈtɪkɪt/', pronunciationEs: 'TI-ket', example: 'Buy a ticket.', level: 'A1' },
    { front: 'Suitcase', back: 'Maleta', pronunciation: '/ˈsuːtkeɪs/', pronunciationEs: 'SUT-keis', example: 'Pack your suitcase.', level: 'A2' },
    { front: 'Backpack', back: 'Mochila', pronunciation: '/ˈbækpæk/', pronunciationEs: 'BAK-pak', example: 'Bring your backpack.', level: 'A1' },
    { front: 'Map', back: 'Mapa', pronunciation: '/mæp/', pronunciationEs: 'map', example: 'Look at the map.', level: 'A1' },
    { front: 'Guide', back: 'Guía', pronunciation: '/ɡaɪd/', pronunciationEs: 'gaid', example: 'Hire a guide.', level: 'A2' },
    { front: 'Tour', back: 'Tour/Excursión', pronunciation: '/tʊr/', pronunciationEs: 'tur', example: 'Take a city tour.', level: 'A2' },
    { front: 'Souvenir', back: 'Recuerdo', pronunciation: '/ˌsuːvəˈnɪr/', pronunciationEs: 'su-ve-NIR', example: 'Buy a souvenir.', level: 'A2' },
    { front: 'Customs', back: 'Aduana', pronunciation: '/ˈkʌstəmz/', pronunciationEs: 'KAS-toms', example: 'Go through customs.', level: 'B1' },
    { front: 'Visa', back: 'Visado', pronunciation: '/ˈviːzə/', pronunciationEs: 'VI-sa', example: 'Apply for a visa.', level: 'B1' },
    { front: 'Check-in', back: 'Facturación', pronunciation: '/ˈtʃekɪn/', pronunciationEs: 'CHEK-in', example: 'Check-in is at 2pm.', level: 'A2' },
    { front: 'Check-out', back: 'Salida', pronunciation: '/ˈtʃekaʊt/', pronunciationEs: 'CHEK-aut', example: 'Check-out is at 11am.', level: 'A2' },
    { front: 'Delayed', back: 'Retrasado', pronunciation: '/dɪˈleɪd/', pronunciationEs: 'di-LEID', example: 'The flight is delayed.', level: 'B1' },
    { front: 'Cancelled', back: 'Cancelado', pronunciation: '/ˈkænsld/', pronunciationEs: 'KAN-seld', example: 'The trip was cancelled.', level: 'B1' },
    { front: 'Terminal', back: 'Terminal', pronunciation: '/ˈtɜːrmɪnl/', pronunciationEs: 'TER-mi-nal', example: 'Go to terminal 2.', level: 'A2' },
    { front: 'Cruise', back: 'Crucero', pronunciation: '/kruːz/', pronunciationEs: 'krus', example: 'Take a cruise.', level: 'B1' },
    { front: 'Abroad', back: 'En el extranjero', pronunciation: '/əˈbrɔːd/', pronunciationEs: 'a-BROD', example: 'I studied abroad.', level: 'B1' },
    { front: 'Itinerary', back: 'Itinerario', pronunciation: '/aɪˈtɪnəreri/', pronunciationEs: 'ai-TI-ne-re-ri', example: 'Check the itinerary.', level: 'B2' },
  ],
  topic_weather: [
    { front: 'Sunny', back: 'Soleado', pronunciation: '/ˈsʌni/', pronunciationEs: 'SA-ni', example: 'It\'s sunny today.', level: 'A1' },
    { front: 'Cloudy', back: 'Nublado', pronunciation: '/ˈklaʊdi/', pronunciationEs: 'KLAU-di', example: 'The sky is cloudy.', level: 'A1' },
    { front: 'Rainy', back: 'Lluvioso', pronunciation: '/ˈreɪni/', pronunciationEs: 'REI-ni', example: 'It\'s a rainy day.', level: 'A1' },
    { front: 'Storm', back: 'Tormenta', pronunciation: '/stɔːrm/', pronunciationEs: 'storm', example: 'A storm is coming.', level: 'A2' },
    { front: 'Thunder', back: 'Trueno', pronunciation: '/ˈθʌndər/', pronunciationEs: 'ZAN-der', example: 'I heard thunder.', level: 'A2' },
    { front: 'Lightning', back: 'Relámpago', pronunciation: '/ˈlaɪtnɪŋ/', pronunciationEs: 'LAIT-ning', example: 'Lightning struck the tree.', level: 'A2' },
    { front: 'Forecast', back: 'Pronóstico', pronunciation: '/ˈfɔːrkæst/', pronunciationEs: 'FOR-kast', example: 'Check the weather forecast.', level: 'B1' },
    { front: 'Humid', back: 'Húmedo', pronunciation: '/ˈhjuːmɪd/', pronunciationEs: 'JIU-mid', example: 'It\'s very humid today.', level: 'B1' },
    { front: 'Freezing', back: 'Helado/Congelando', pronunciation: '/ˈfriːzɪŋ/', pronunciationEs: 'FRI-sing', example: 'It\'s freezing outside.', level: 'A2' },
    { front: 'Mild', back: 'Templado', pronunciation: '/maɪld/', pronunciationEs: 'maild', example: 'The weather is mild today.', level: 'B1' },
    { front: 'Hot', back: 'Caluroso', pronunciation: '/hɒt/', pronunciationEs: 'jot', example: 'It\'s so hot today.', level: 'A1' },
    { front: 'Cold', back: 'Frío', pronunciation: '/koʊld/', pronunciationEs: 'kould', example: 'It\'s very cold.', level: 'A1' },
    { front: 'Warm', back: 'Cálido', pronunciation: '/wɔːrm/', pronunciationEs: 'uorm', example: 'It\'s nice and warm.', level: 'A1' },
    { front: 'Cool', back: 'Fresco', pronunciation: '/kuːl/', pronunciationEs: 'kul', example: 'The breeze is cool.', level: 'A2' },
    { front: 'Windy', back: 'Ventoso', pronunciation: '/ˈwɪndi/', pronunciationEs: 'UIN-di', example: 'It\'s very windy.', level: 'A1' },
    { front: 'Snowy', back: 'Nevado', pronunciation: '/ˈsnoʊi/', pronunciationEs: 'SNOU-i', example: 'It\'s snowy outside.', level: 'A1' },
    { front: 'Foggy', back: 'Con niebla', pronunciation: '/ˈfɒɡi/', pronunciationEs: 'FO-gui', example: 'It\'s very foggy.', level: 'A2' },
    { front: 'Hail', back: 'Granizo', pronunciation: '/heɪl/', pronunciationEs: 'jeil', example: 'It started to hail.', level: 'B1' },
    { front: 'Drizzle', back: 'Llovizna', pronunciation: '/ˈdrɪzl/', pronunciationEs: 'DRI-sol', example: 'It\'s just a drizzle.', level: 'B1' },
    { front: 'Breeze', back: 'Brisa', pronunciation: '/briːz/', pronunciationEs: 'bris', example: 'Feel the breeze.', level: 'A2' },
    { front: 'Sunshine', back: 'Luz del sol', pronunciation: '/ˈsʌnʃaɪn/', pronunciationEs: 'SAN-shain', example: 'Enjoy the sunshine.', level: 'A2' },
    { front: 'Temperature', back: 'Temperatura', pronunciation: '/ˈtemprətʃər/', pronunciationEs: 'TEM-pra-cher', example: 'What\'s the temperature?', level: 'A2' },
    { front: 'Degree', back: 'Grado', pronunciation: '/dɪˈɡriː/', pronunciationEs: 'di-GRI', example: 'It\'s 25 degrees.', level: 'A2' },
    { front: 'Overcast', back: 'Cubierto', pronunciation: '/ˌoʊvərˈkæst/', pronunciationEs: 'ou-ver-KAST', example: 'The sky is overcast.', level: 'B1' },
    { front: 'Shower', back: 'Chubasco', pronunciation: '/ˈʃaʊər/', pronunciationEs: 'SHAU-er', example: 'Expect some showers.', level: 'B1' },
    { front: 'Heatwave', back: 'Ola de calor', pronunciation: '/ˈhiːtweɪv/', pronunciationEs: 'JIT-ueiv', example: 'There\'s a heatwave.', level: 'B1' },
    { front: 'Frost', back: 'Escarcha', pronunciation: '/frɒst/', pronunciationEs: 'frost', example: 'There\'s frost on the car.', level: 'B1' },
    { front: 'Slippery', back: 'Resbaladizo', pronunciation: '/ˈslɪpəri/', pronunciationEs: 'SLI-pe-ri', example: 'The road is slippery.', level: 'B1' },
    { front: 'Rainbow', back: 'Arcoíris', pronunciation: '/ˈreɪnboʊ/', pronunciationEs: 'REIN-bou', example: 'Look at the rainbow!', level: 'A1' },
    { front: 'Climate', back: 'Clima', pronunciation: '/ˈklaɪmət/', pronunciationEs: 'KLAI-mat', example: 'The climate is changing.', level: 'B1' },
  ],
  topic_work: [
    { front: 'Salary', back: 'Salario', pronunciation: '/ˈsæləri/', pronunciationEs: 'SA-la-ri', example: 'I got a salary increase.', level: 'B1' },
    { front: 'Interview', back: 'Entrevista', pronunciation: '/ˈɪntərvjuː/', pronunciationEs: 'IN-ter-viu', example: 'I have a job interview.', level: 'A2' },
    { front: 'Resume/CV', back: 'Currículum', pronunciation: '/ˈrezəmeɪ/', pronunciationEs: 'RE-su-mei', example: 'Send your resume.', level: 'B1' },
    { front: 'Colleague', back: 'Colega', pronunciation: '/ˈkɒliːɡ/', pronunciationEs: 'KO-lig', example: 'My colleague helped me.', level: 'B1' },
    { front: 'Deadline', back: 'Fecha límite', pronunciation: '/ˈdedlaɪn/', pronunciationEs: 'DED-lain', example: 'The deadline is Friday.', level: 'B1' },
    { front: 'Promotion', back: 'Ascenso', pronunciation: '/prəˈmoʊʃn/', pronunciationEs: 'pro-MOU-shon', example: 'She got a promotion.', level: 'B1' },
    { front: 'Unemployed', back: 'Desempleado', pronunciation: '/ˌʌnɪmˈplɔɪd/', pronunciationEs: 'an-im-PLOID', example: 'He\'s been unemployed for months.', level: 'B1' },
    { front: 'Overtime', back: 'Horas extra', pronunciation: '/ˈoʊvərtaɪm/', pronunciationEs: 'OU-ver-taim', example: 'I worked overtime yesterday.', level: 'B1' },
    { front: 'Part-time', back: 'A tiempo parcial', pronunciation: '/ˌpɑːrt ˈtaɪm/', pronunciationEs: 'part taim', example: 'I have a part-time job.', level: 'A2' },
    { front: 'Full-time', back: 'A tiempo completo', pronunciation: '/ˌfʊl ˈtaɪm/', pronunciationEs: 'ful taim', example: 'She works full-time.', level: 'A2' },
    { front: 'Job', back: 'Trabajo/Empleo', pronunciation: '/dʒɒb/', pronunciationEs: 'yob', example: 'I love my job.', level: 'A1' },
    { front: 'Career', back: 'Carrera', pronunciation: '/kəˈrɪr/', pronunciationEs: 'ka-RIR', example: 'Build your career.', level: 'B1' },
    { front: 'Boss', back: 'Jefe', pronunciation: '/bɒs/', pronunciationEs: 'bos', example: 'The boss is here.', level: 'A1' },
    { front: 'Employee', back: 'Empleado', pronunciation: '/ɪmˈplɔɪiː/', pronunciationEs: 'im-PLOI-i', example: 'The employee worked hard.', level: 'A2' },
    { front: 'Employer', back: 'Empleador', pronunciation: '/ɪmˈplɔɪər/', pronunciationEs: 'im-PLOI-er', example: 'The employer offers benefits.', level: 'B1' },
    { front: 'Meeting', back: 'Reunión', pronunciation: '/ˈmiːtɪŋ/', pronunciationEs: 'MI-ting', example: 'I have a meeting.', level: 'A2' },
    { front: 'Office', back: 'Oficina', pronunciation: '/ˈɒfɪs/', pronunciationEs: 'O-fis', example: 'Come to the office.', level: 'A1' },
    { front: 'Contract', back: 'Contrato', pronunciation: '/ˈkɒntrækt/', pronunciationEs: 'KON-trakt', example: 'Sign the contract.', level: 'B1' },
    { front: 'Holiday', back: 'Vacaciones', pronunciation: '/ˈhɒlɪdeɪ/', pronunciationEs: 'JO-li-dei', example: 'I need a holiday.', level: 'A1' },
    { front: 'Retire', back: 'Jubilarse', pronunciation: '/rɪˈtaɪər/', pronunciationEs: 'ri-TAIR', example: 'He retired last year.', level: 'B1' },
    { front: 'Experience', back: 'Experiencia', pronunciation: '/ɪkˈspɪəriəns/', pronunciationEs: 'ik-SPI-riens', example: 'I have experience.', level: 'A2' },
    { front: 'Skills', back: 'Habilidades', pronunciation: '/skɪlz/', pronunciationEs: 'skils', example: 'Develop new skills.', level: 'A2' },
    { front: 'Apply', back: 'Solicitar', pronunciation: '/əˈplaɪ/', pronunciationEs: 'a-PLAI', example: 'Apply for the job.', level: 'A2' },
    { front: 'Hire', back: 'Contratar', pronunciation: '/haɪər/', pronunciationEs: 'JAIR', example: 'We need to hire someone.', level: 'B1' },
    { front: 'Fire', back: 'Despedir', pronunciation: '/faɪər/', pronunciationEs: 'FAIR', example: 'They fired him.', level: 'B1' },
    { front: 'Wage', back: 'Sueldo/Jornal', pronunciation: '/weɪdʒ/', pronunciationEs: 'ueiy', example: 'The minimum wage.', level: 'B1' },
    { front: 'Shift', back: 'Turno', pronunciation: '/ʃɪft/', pronunciationEs: 'shift', example: 'I work the night shift.', level: 'B1' },
    { front: 'Department', back: 'Departamento', pronunciation: '/dɪˈpɑːrtmənt/', pronunciationEs: 'di-PART-ment', example: 'Which department?', level: 'A2' },
    { front: 'Manager', back: 'Gerente', pronunciation: '/ˈmænɪdʒər/', pronunciationEs: 'MA-ni-yer', example: 'Speak to the manager.', level: 'A2' },
    { front: 'Teamwork', back: 'Trabajo en equipo', pronunciation: '/ˈtiːmwɜːrk/', pronunciationEs: 'TIM-uerk', example: 'Teamwork is important.', level: 'B1' },
  ],
};

const INITIALIZED_KEY = '@memoizese_initialized';

/**
 * Verifica si los mazos por defecto ya fueron inicializados
 */
export const isInitialized = async () => {
  try {
    const initialized = await AsyncStorage.getItem(INITIALIZED_KEY);
    return initialized === 'true';
  } catch (error) {
    console.error('Error verificando inicialización:', error);
    return false;
  }
};

/**
 * Inicializa los mazos y tarjetas por defecto
 * Solo se ejecuta una vez
 */
export const initializeDefaultData = async () => {
  try {
    const alreadyInitialized = await isInitialized();
    if (alreadyInitialized) {
      return false;
    }

    const now = new Date().toISOString();
    
    // Crear mazos por defecto
    const decks = DEFAULT_DECKS.map(deck => ({
      ...deck,
      createdAt: now,
      updatedAt: now,
      cardCount: DEFAULT_CARDS[deck.id]?.length || 0,
    }));

    // Crear tarjetas por defecto
    const cards = [];
    for (const deckId of Object.keys(DEFAULT_CARDS)) {
      const deckCards = DEFAULT_CARDS[deckId].map((card, index) => ({
        ...card,
        id: `${deckId}_card_${index}`,
        deckId: deckId,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: now,
        lastReview: null,
        createdAt: now,
        updatedAt: now,
      }));
      cards.push(...deckCards);
    }

    // Guardar en AsyncStorage
    await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(decks));
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));
    await AsyncStorage.setItem(INITIALIZED_KEY, 'true');

    console.log(`✅ Inicializados ${decks.length} mazos con ${cards.length} tarjetas`);
    return true;
  } catch (error) {
    console.error('Error inicializando datos por defecto:', error);
    throw error;
  }
};

/**
 * Reinicia los mazos por defecto (útil si el usuario los elimina)
 */
export const resetDefaultDecks = async () => {
  try {
    const now = new Date().toISOString();
    const existingDecks = await getDecks();
    const existingCards = await getCards();

    // Filtrar mazos y tarjetas que no son por defecto
    const userDecks = existingDecks.filter(d => !d.isDefault);
    const userCards = existingCards.filter(c => !c.deckId.startsWith('default_') && !c.deckId.startsWith('topic_'));

    // Crear mazos por defecto
    const defaultDecks = DEFAULT_DECKS.map(deck => ({
      ...deck,
      createdAt: now,
      updatedAt: now,
      cardCount: DEFAULT_CARDS[deck.id]?.length || 0,
    }));

    // Crear tarjetas por defecto
    const defaultCards = [];
    for (const deckId of Object.keys(DEFAULT_CARDS)) {
      const deckCards = DEFAULT_CARDS[deckId].map((card, index) => ({
        ...card,
        id: `${deckId}_card_${index}`,
        deckId: deckId,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: now,
        lastReview: null,
        createdAt: now,
        updatedAt: now,
      }));
      defaultCards.push(...deckCards);
    }

    // Combinar datos del usuario con los por defecto
    const allDecks = [...userDecks, ...defaultDecks];
    const allCards = [...userCards, ...defaultCards];

    // Guardar
    await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(allDecks));
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(allCards));

    return true;
  } catch (error) {
    console.error('Error reiniciando mazos por defecto:', error);
    throw error;
  }
};
// ==================== TESTS (Preguntas de opción múltiple) ====================

/**
 * Guarda un nuevo test
 */
export const saveTest = async (test) => {
  try {
    const tests = await getTests();
    const newTest = {
      ...test,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questionCount: test.questions?.length || 0,
    };
    tests.push(newTest);
    await AsyncStorage.setItem(TESTS_KEY, JSON.stringify(tests));
    return newTest;
  } catch (error) {
    console.error('Error guardando test:', error);
    throw error;
  }
};

/**
 * Obtiene todos los tests
 */
export const getTests = async () => {
  try {
    const testsJson = await AsyncStorage.getItem(TESTS_KEY);
    return testsJson ? JSON.parse(testsJson) : [];
  } catch (error) {
    console.error('Error obteniendo tests:', error);
    return [];
  }
};

/**
 * Obtiene un test por ID
 */
export const getTestById = async (testId) => {
  try {
    const tests = await getTests();
    return tests.find(t => t.id === testId) || null;
  } catch (error) {
    console.error('Error obteniendo test:', error);
    return null;
  }
};

/**
 * Actualiza un test existente
 */
export const updateTest = async (testId, updates) => {
  try {
    const tests = await getTests();
    const index = tests.findIndex(t => t.id === testId);
    if (index !== -1) {
      tests[index] = {
        ...tests[index],
        ...updates,
        updatedAt: new Date().toISOString(),
        questionCount: updates.questions?.length || tests[index].questionCount,
      };
      await AsyncStorage.setItem(TESTS_KEY, JSON.stringify(tests));
      return tests[index];
    }
    return null;
  } catch (error) {
    console.error('Error actualizando test:', error);
    throw error;
  }
};

/**
 * Elimina un test
 */
export const deleteTest = async (testId) => {
  try {
    const tests = await getTests();
    const filteredTests = tests.filter(t => t.id !== testId);
    await AsyncStorage.setItem(TESTS_KEY, JSON.stringify(filteredTests));
    
    // También eliminar los resultados asociados
    const results = await getTestResults();
    const filteredResults = results.filter(r => r.testId !== testId);
    await AsyncStorage.setItem(TEST_RESULTS_KEY, JSON.stringify(filteredResults));
    
    return true;
  } catch (error) {
    console.error('Error eliminando test:', error);
    throw error;
  }
};

/**
 * Verifica si un test tiene respuestas configuradas
 */
export const isTestConfigured = async (testId) => {
  try {
    const test = await getTestById(testId);
    if (!test || !test.questions) return false;
    
    // Un test está configurado si todas las preguntas tienen respuesta correcta
    return test.questions.every(q => q.correctAnswer);
  } catch (error) {
    console.error('Error verificando configuración del test:', error);
    return false;
  }
};

/**
 * Guarda el resultado de un test
 */
export const saveTestResult = async (result) => {
  try {
    const results = await getTestResults();
    const newResult = {
      ...result,
      id: Date.now().toString(),
      completedAt: new Date().toISOString(),
    };
    results.push(newResult);
    await AsyncStorage.setItem(TEST_RESULTS_KEY, JSON.stringify(results));
    return newResult;
  } catch (error) {
    console.error('Error guardando resultado del test:', error);
    throw error;
  }
};

/**
 * Obtiene todos los resultados de tests
 */
export const getTestResults = async () => {
  try {
    const resultsJson = await AsyncStorage.getItem(TEST_RESULTS_KEY);
    return resultsJson ? JSON.parse(resultsJson) : [];
  } catch (error) {
    console.error('Error obteniendo resultados:', error);
    return [];
  }
};

/**
 * Obtiene resultados de un test específico
 */
export const getTestResultsById = async (testId) => {
  try {
    const results = await getTestResults();
    return results.filter(r => r.testId === testId);
  } catch (error) {
    console.error('Error obteniendo resultados del test:', error);
    return [];
  }
};

/**
 * Calcula estadísticas de un test
 */
export const calculateTestStats = async (testId) => {
  try {
    const results = await getTestResultsById(testId);
    
    if (results.length === 0) {
      return {
        attempts: 0,
        bestScore: 0,
        averageScore: 0,
        lastAttempt: null,
      };
    }
    
    const scores = results.map(r => r.score || 0);
    const bestScore = Math.max(...scores);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const lastAttempt = results[results.length - 1].completedAt;
    
    return {
      attempts: results.length,
      bestScore,
      averageScore: Math.round(averageScore * 100) / 100,
      lastAttempt,
    };
  } catch (error) {
    console.error('Error calculando estadísticas del test:', error);
    return {
      attempts: 0,
      bestScore: 0,
      averageScore: 0,
      lastAttempt: null,
    };
  }
};

/**
 * Inicializa los tests de vocabulario predeterminados
 */
export const initializeDefaultTests = async (forceReset = false) => {
  try {
    const { getDefaultVocabularyTests } = await import('./vocabularyTests');
    const existingTests = await getTests();
    
    // Filtrar tests que NO son predeterminados (los creados por el usuario)
    const userTests = existingTests.filter(t => !t.isDefault);
    const hasDefaultTests = existingTests.some(t => t.isDefault);
    
    // Solo inicializar si no hay tests predeterminados o si se fuerza el reset
    if (hasDefaultTests && !forceReset) {
      return false;
    }
    
    const defaultTests = getDefaultVocabularyTests();
    const allTests = [...userTests, ...defaultTests];
    
    await AsyncStorage.setItem(TESTS_KEY, JSON.stringify(allTests));
    console.log(`✅ Inicializados ${defaultTests.length} tests de vocabulario predeterminados`);
    return true;
  } catch (error) {
    console.error('Error inicializando tests predeterminados:', error);
    return false;
  }
};

/**
 * Fuerza la reinicialización de los tests predeterminados
 * Útil cuando se actualizan los archivos de vocabulario
 */
export const resetDefaultTests = async () => {
  return initializeDefaultTests(true);
};
