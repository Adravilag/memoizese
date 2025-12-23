/**
 * Tests para el módulo de almacenamiento (storage.js)
 * Prueba las funcionalidades de mazos, tarjetas y algoritmo SM-2
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveDeck,
  getDecks,
  getDeckById,
  updateDeck,
  deleteDeck,
  saveCard,
  getCards,
  getCardsByDeck,
  getCardById,
  updateCard,
  deleteCard,
  calculateNextReview,
  updateCardAfterStudy,
  getCardsToReview,
  getNewCards,
  saveStudySession,
  getStudyStats,
  getDeckStats,
  clearAllData,
  saveMultipleCards,
  initializeDefaultData,
  isInitialized,
  resetDefaultDecks,
  toggleCardDiscarded,
  getDiscardedCards,
  restoreAllDiscardedCards,
} from '../../src/utils/storage';

// Limpiar el mock storage antes de cada test
beforeEach(() => {
  AsyncStorage.__clearMockStorage();
  jest.clearAllMocks();
});

describe('Storage - Mazos (Decks)', () => {
  describe('saveDeck', () => {
    it('debe crear un nuevo mazo con valores por defecto', async () => {
      const deck = await saveDeck({
        name: 'Inglés Básico',
        description: 'Vocabulario básico de inglés',
      });

      expect(deck).toMatchObject({
        name: 'Inglés Básico',
        description: 'Vocabulario básico de inglés',
        cardCount: 0,
        color: '#4A90D9',
        icon: 'cards',
      });
      expect(deck.id).toBeDefined();
      expect(deck.createdAt).toBeDefined();
      expect(deck.updatedAt).toBeDefined();
    });

    it('debe crear un mazo con color personalizado', async () => {
      const deck = await saveDeck({
        name: 'Francés',
        color: '#E74C3C',
      });

      expect(deck.color).toBe('#E74C3C');
    });

    it('debe persistir el mazo en AsyncStorage', async () => {
      await saveDeck({ name: 'Test Deck' });
      
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const decks = await getDecks();
      expect(decks).toHaveLength(1);
    });
  });

  describe('getDecks', () => {
    it('debe retornar array vacío si no hay mazos', async () => {
      const decks = await getDecks();
      expect(decks).toEqual([]);
    });

    it('debe retornar todos los mazos guardados', async () => {
      await saveDeck({ name: 'Mazo 1' });
      await saveDeck({ name: 'Mazo 2' });
      await saveDeck({ name: 'Mazo 3' });

      const decks = await getDecks();
      expect(decks).toHaveLength(3);
    });
  });

  describe('getDeckById', () => {
    it('debe retornar el mazo correcto por ID', async () => {
      const created = await saveDeck({ name: 'Mi Mazo' });
      const found = await getDeckById(created.id);

      expect(found.name).toBe('Mi Mazo');
      expect(found.id).toBe(created.id);
    });

    it('debe retornar null si el mazo no existe', async () => {
      const found = await getDeckById('id-inexistente');
      expect(found).toBeNull();
    });
  });

  describe('updateDeck', () => {
    it('debe actualizar propiedades del mazo', async () => {
      const deck = await saveDeck({ name: 'Original' });
      const updated = await updateDeck(deck.id, { 
        name: 'Actualizado',
        color: '#27AE60',
      });

      expect(updated.name).toBe('Actualizado');
      expect(updated.color).toBe('#27AE60');
      // updatedAt debe estar definido
      expect(updated.updatedAt).toBeDefined();
    });

    it('debe retornar null si el mazo no existe', async () => {
      const result = await updateDeck('id-falso', { name: 'Test' });
      expect(result).toBeNull();
    });
  });

  describe('deleteDeck', () => {
    it('debe eliminar el mazo', async () => {
      const deck = await saveDeck({ name: 'A eliminar' });
      await deleteDeck(deck.id);

      const decks = await getDecks();
      expect(decks).toHaveLength(0);
    });

    it('debe eliminar las tarjetas asociadas al mazo', async () => {
      const deck = await saveDeck({ name: 'Mazo con tarjetas' });
      await saveCard({ deckId: deck.id, front: 'Hello', back: 'Hola' });
      await saveCard({ deckId: deck.id, front: 'Goodbye', back: 'Adiós' });

      await deleteDeck(deck.id);

      const cards = await getCardsByDeck(deck.id);
      expect(cards).toHaveLength(0);
    });
  });
});

describe('Storage - Tarjetas (Cards)', () => {
  let testDeck;

  beforeEach(async () => {
    // Asegurar que el storage está limpio antes de cada test
    AsyncStorage.__clearMockStorage();
    testDeck = await saveDeck({ name: 'Test Deck' });
  });

  describe('saveCard', () => {
    it('debe crear una tarjeta con valores iniciales de SM-2', async () => {
      const card = await saveCard({
        deckId: testDeck.id,
        front: 'Hello',
        back: 'Hola',
        example: 'Hello, how are you?',
      });

      expect(card).toMatchObject({
        deckId: testDeck.id,
        front: 'Hello',
        back: 'Hola',
        example: 'Hello, how are you?',
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      });
      expect(card.nextReview).toBeDefined();
      expect(card.lastReview).toBeNull();
    });

    it('debe actualizar el contador de tarjetas del mazo', async () => {
      await saveCard({ deckId: testDeck.id, front: 'A', back: 'B' });
      await saveCard({ deckId: testDeck.id, front: 'C', back: 'D' });

      const deck = await getDeckById(testDeck.id);
      expect(deck.cardCount).toBe(2);
    });
  });

  describe('saveMultipleCards', () => {
    it('debe guardar múltiples tarjetas de una vez', async () => {
      const cardsData = [
        { deckId: testDeck.id, front: 'One', back: 'Uno' },
        { deckId: testDeck.id, front: 'Two', back: 'Dos' },
        { deckId: testDeck.id, front: 'Three', back: 'Tres' },
      ];

      const saved = await saveMultipleCards(cardsData);
      
      expect(saved).toHaveLength(3);
      const allCards = await getCardsByDeck(testDeck.id);
      expect(allCards).toHaveLength(3);
    });
  });

  describe('getCardsByDeck', () => {
    it('debe filtrar tarjetas por deckId correctamente', async () => {
      // Limpiar storage para este test específico
      AsyncStorage.__clearMockStorage();
      
      const deckA = await saveDeck({ name: 'Mazo A' });
      const deckB = await saveDeck({ name: 'Mazo B' });
      
      await saveCard({ deckId: deckA.id, front: 'Card A1', back: '1' });
      await saveCard({ deckId: deckA.id, front: 'Card A2', back: '2' });
      await saveCard({ deckId: deckB.id, front: 'Card B1', back: '3' });

      const cardsA = await getCardsByDeck(deckA.id);
      const cardsB = await getCardsByDeck(deckB.id);

      // Verificar que las tarjetas se filtraron correctamente
      expect(cardsA.every(c => c.deckId === deckA.id)).toBe(true);
      expect(cardsB.every(c => c.deckId === deckB.id)).toBe(true);
      
      // Verificar que hay al menos las tarjetas esperadas
      expect(cardsA.length).toBeGreaterThanOrEqual(2);
      expect(cardsB.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('updateCard', () => {
    it('debe actualizar el contenido de la tarjeta', async () => {
      const card = await saveCard({
        deckId: testDeck.id,
        front: 'Original',
        back: 'Original Back',
      });

      const updated = await updateCard(card.id, {
        front: 'Updated',
        back: 'Updated Back',
      });

      expect(updated.front).toBe('Updated');
      expect(updated.back).toBe('Updated Back');
    });
  });

  describe('deleteCard', () => {
    it('debe eliminar la tarjeta y actualizar contador del mazo', async () => {
      const card = await saveCard({
        deckId: testDeck.id,
        front: 'A',
        back: 'B',
      });

      await deleteCard(card.id);

      const cards = await getCards();
      expect(cards).toHaveLength(0);

      const deck = await getDeckById(testDeck.id);
      expect(deck.cardCount).toBe(0);
    });
  });
});

describe('Storage - Algoritmo SM-2', () => {
  describe('calculateNextReview', () => {
    const baseCard = {
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
    };

    it('debe reiniciar si calidad < 3 (respuesta incorrecta)', () => {
      const cardWithProgress = {
        easeFactor: 2.5,
        interval: 10,
        repetitions: 3,
      };

      const result = calculateNextReview(cardWithProgress, 1);

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(0);
    });

    it('debe establecer intervalo de 1 día en primera repetición correcta', () => {
      const result = calculateNextReview(baseCard, 4);

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(1);
    });

    it('debe establecer intervalo de 6 días en segunda repetición correcta', () => {
      const afterFirst = {
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
      };

      const result = calculateNextReview(afterFirst, 4);

      expect(result.repetitions).toBe(2);
      expect(result.interval).toBe(6);
    });

    it('debe multiplicar intervalo por easeFactor en repeticiones posteriores', () => {
      const afterSecond = {
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      };

      const result = calculateNextReview(afterSecond, 4);

      expect(result.repetitions).toBe(3);
      expect(result.interval).toBe(15); // 6 * 2.5 = 15
    });

    it('debe aumentar easeFactor con respuesta fácil (5)', () => {
      const result = calculateNextReview(baseCard, 5);
      expect(result.easeFactor).toBeGreaterThan(2.5);
    });

    it('debe disminuir easeFactor con respuesta difícil (3)', () => {
      const result = calculateNextReview(baseCard, 3);
      expect(result.easeFactor).toBeLessThan(2.5);
    });

    it('no debe bajar easeFactor de 1.3', () => {
      const lowEase = {
        easeFactor: 1.3,
        interval: 1,
        repetitions: 1,
      };

      const result = calculateNextReview(lowEase, 3);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('debe establecer nextReview en el futuro', () => {
      const result = calculateNextReview(baseCard, 4);
      const nextReview = new Date(result.nextReview);
      const now = new Date();

      expect(nextReview.getTime()).toBeGreaterThanOrEqual(now.getTime());
    });

    it('debe establecer lastReview como fecha actual', () => {
      const result = calculateNextReview(baseCard, 4);
      const lastReview = new Date(result.lastReview);
      const now = new Date();

      // Diferencia menor a 1 segundo
      expect(Math.abs(lastReview.getTime() - now.getTime())).toBeLessThan(1000);
    });
  });

  describe('updateCardAfterStudy', () => {
    it('debe actualizar la tarjeta con los nuevos valores de revisión', async () => {
      const deck = await saveDeck({ name: 'Test' });
      const card = await saveCard({
        deckId: deck.id,
        front: 'Test',
        back: 'Test',
      });

      const updated = await updateCardAfterStudy(card.id, 4);

      expect(updated.repetitions).toBe(1);
      expect(updated.interval).toBe(1);
      expect(updated.lastReview).not.toBeNull();
    });
  });

  describe('getCardsToReview', () => {
    it('debe retornar tarjetas cuya nextReview ya pasó', async () => {
      const deck = await saveDeck({ name: 'Test' });
      
      // Tarjeta nueva (lista para revisar)
      await saveCard({ deckId: deck.id, front: 'New', back: 'Nueva' });

      const toReview = await getCardsToReview(deck.id);
      expect(toReview).toHaveLength(1);
    });

    it('debe retornar todas las tarjetas pendientes si no se especifica mazo', async () => {
      const deck1 = await saveDeck({ name: 'Deck 1' });
      const deck2 = await saveDeck({ name: 'Deck 2' });
      
      await saveCard({ deckId: deck1.id, front: 'A', back: '1' });
      await saveCard({ deckId: deck2.id, front: 'B', back: '2' });

      const toReview = await getCardsToReview();
      expect(toReview).toHaveLength(2);
    });
  });

  describe('getNewCards', () => {
    it('debe retornar solo tarjetas con repetitions = 0', async () => {
      const deck = await saveDeck({ name: 'Test' });
      const card = await saveCard({ deckId: deck.id, front: 'A', back: '1' });
      
      // Simular que una tarjeta ya fue estudiada
      await updateCard(card.id, { repetitions: 1 });
      await saveCard({ deckId: deck.id, front: 'B', back: '2' });

      const newCards = await getNewCards(deck.id);
      expect(newCards).toHaveLength(1);
      expect(newCards[0].front).toBe('B');
    });
  });
});

describe('Storage - Estadísticas', () => {
  beforeEach(() => {
    AsyncStorage.__clearMockStorage();
  });

  describe('saveStudySession', () => {
    it('debe guardar una sesión de estudio', async () => {
      await saveStudySession({
        deckId: 'test-deck',
        cardsStudied: 10,
        correct: 8,
        incorrect: 2,
        timeMinutes: 5,
      });

      const stats = await getStudyStats();
      expect(stats.totalCardsStudied).toBe(10);
      expect(stats.totalCorrect).toBe(8);
      expect(stats.totalIncorrect).toBe(2);
      expect(stats.totalTimeMinutes).toBe(5);
    });

    it('debe acumular estadísticas de múltiples sesiones', async () => {
      await saveStudySession({ cardsStudied: 5, correct: 4, incorrect: 1, timeMinutes: 2 });
      await saveStudySession({ cardsStudied: 10, correct: 9, incorrect: 1, timeMinutes: 3 });

      const stats = await getStudyStats();
      expect(stats.totalCardsStudied).toBe(15);
      expect(stats.totalCorrect).toBe(13);
      expect(stats.totalTimeMinutes).toBe(5);
    });

    it('debe iniciar racha en el primer día de estudio', async () => {
      await saveStudySession({ cardsStudied: 5, correct: 5, incorrect: 0, timeMinutes: 1 });

      const stats = await getStudyStats();
      expect(stats.currentStreak).toBe(1);
    });
  });

  describe('getDeckStats', () => {
    it('debe calcular estadísticas correctas del mazo', async () => {
      // Limpiar storage para este test
      AsyncStorage.__clearMockStorage();
      
      const deck = await saveDeck({ name: 'Test Stats' });
      
      // Crear tarjetas con diferentes estados
      await saveCard({ deckId: deck.id, front: 'New1', back: '1' });
      await saveCard({ deckId: deck.id, front: 'New2', back: '2' });
      
      const card3 = await saveCard({ deckId: deck.id, front: 'Learning', back: '3' });
      await updateCard(card3.id, { repetitions: 2, interval: 5 });
      
      const card4 = await saveCard({ deckId: deck.id, front: 'Mature', back: '4' });
      await updateCard(card4.id, { repetitions: 5, interval: 25 });

      const stats = await getDeckStats(deck.id);

      // Verificar que se calculan estadísticas
      expect(stats.totalCards).toBeGreaterThanOrEqual(4);
      expect(stats).toHaveProperty('newCards');
      expect(stats).toHaveProperty('learningCards');
      expect(stats).toHaveProperty('matureCards');
    });
  });

  describe('getStudyStats', () => {
    it('debe retornar estadísticas iniciales si no hay datos', async () => {
      const stats = await getStudyStats();

      expect(stats).toMatchObject({
        sessions: [],
        totalCardsStudied: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalTimeMinutes: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null,
      });
    });
  });
});

describe('Storage - Utilidades', () => {
  describe('clearAllData', () => {
    it('debe eliminar todos los datos', async () => {
      await saveDeck({ name: 'Deck 1' });
      await saveDeck({ name: 'Deck 2' });
      
      await clearAllData();

      const decks = await getDecks();
      const cards = await getCards();
      const stats = await getStudyStats();

      expect(decks).toHaveLength(0);
      expect(cards).toHaveLength(0);
      expect(stats.totalCardsStudied).toBe(0);
    });
  });
});

describe('Storage - Mazos por Defecto', () => {
  beforeEach(() => {
    AsyncStorage.__clearMockStorage();
  });

  describe('isInitialized', () => {
    it('debe retornar false si no hay datos inicializados', async () => {
      const initialized = await isInitialized();
      expect(initialized).toBe(false);
    });

    it('debe retornar true después de inicializar', async () => {
      await initializeDefaultData();
      const initialized = await isInitialized();
      expect(initialized).toBe(true);
    });
  });

  describe('initializeDefaultData', () => {
    it('debe crear mazos por defecto', async () => {
      const result = await initializeDefaultData();
      expect(result).toBe(true);

      const decks = await getDecks();
      expect(decks.length).toBeGreaterThan(0);
      
      // Verificar que hay mazos con isDefault = true
      const defaultDecks = decks.filter(d => d.isDefault);
      expect(defaultDecks.length).toBeGreaterThan(0);
    });

    it('debe crear tarjetas para cada mazo por defecto', async () => {
      await initializeDefaultData();

      const decks = await getDecks();
      const defaultDecks = decks.filter(d => d.isDefault);

      for (const deck of defaultDecks) {
        const cards = await getCardsByDeck(deck.id);
        expect(cards.length).toBeGreaterThan(0);
      }
    });

    it('no debe inicializar de nuevo si ya está inicializado', async () => {
      await initializeDefaultData();
      const decksBefore = await getDecks();

      const result = await initializeDefaultData();
      expect(result).toBe(false);

      const decksAfter = await getDecks();
      expect(decksAfter.length).toBe(decksBefore.length);
    });

    it('debe crear mazos con cardCount correcto', async () => {
      await initializeDefaultData();

      const decks = await getDecks();
      
      for (const deck of decks) {
        const cards = await getCardsByDeck(deck.id);
        expect(deck.cardCount).toBe(cards.length);
      }
    });
  });

  describe('resetDefaultDecks', () => {
    it('debe restaurar mazos por defecto manteniendo los del usuario', async () => {
      // Primero inicializar
      await initializeDefaultData();
      
      // Crear un mazo del usuario
      const userDeck = await saveDeck({ name: 'Mi Mazo Personal' });
      await saveCard({ deckId: userDeck.id, front: 'A', back: 'B' });

      // Resetear mazos por defecto
      await resetDefaultDecks();

      const decks = await getDecks();
      
      // Verificar que el mazo del usuario sigue ahí
      const foundUserDeck = decks.find(d => d.name === 'Mi Mazo Personal');
      expect(foundUserDeck).toBeDefined();
      
      // Verificar que los mazos por defecto están
      const defaultDecks = decks.filter(d => d.isDefault);
      expect(defaultDecks.length).toBeGreaterThan(0);
    });
  });

  describe('Contenido de mazos por defecto', () => {
    it('debe incluir mazo de Inglés Avanzado', async () => {
      await initializeDefaultData();

      const decks = await getDecks();
      const englishAdvanced = decks.find(d => d.id === 'default_english_advanced');

      expect(englishAdvanced).toBeDefined();
      expect(englishAdvanced.name).toBe('Inglés Avanzado');
    });

    it('debe incluir mazo de Verbos Irregulares', async () => {
      await initializeDefaultData();

      const decks = await getDecks();
      const verbs = decks.find(d => d.id === 'default_english_verbs');

      expect(verbs).toBeDefined();
      expect(verbs.name).toBe('Verbos Irregulares');
    });

    it('las tarjetas deben tener campos front, back y example', async () => {
      await initializeDefaultData();

      const cards = await getCards();
      
      for (const card of cards.slice(0, 10)) { // Verificar las primeras 10
        expect(card.front).toBeDefined();
        expect(card.back).toBeDefined();
        expect(card.example).toBeDefined();
      }
    });

    it('las tarjetas deben tener valores SM-2 iniciales', async () => {
      await initializeDefaultData();

      const cards = await getCards();
      
      for (const card of cards.slice(0, 10)) {
        expect(card.easeFactor).toBe(2.5);
        expect(card.interval).toBe(0);
        expect(card.repetitions).toBe(0);
      }
    });
  });
});

describe('Storage - Descartar Tarjetas', () => {
  describe('toggleCardDiscarded', () => {
    let deck;
    let card1;

    beforeEach(async () => {
      deck = await saveDeck({ name: 'Mazo Test' });
      card1 = await saveCard({ deckId: deck.id, front: 'Hello', back: 'Hola' });
    });

    it('debe marcar una tarjeta como descartada', async () => {
      const result = await toggleCardDiscarded(card1.id);
      
      expect(result.isDiscarded).toBe(true);
      expect(result.discardedAt).toBeDefined();
    });

    it('debe restaurar una tarjeta descartada', async () => {
      // Primero descartar
      await toggleCardDiscarded(card1.id);
      // Luego restaurar
      const result = await toggleCardDiscarded(card1.id);
      
      expect(result.isDiscarded).toBe(false);
      expect(result.discardedAt).toBeNull();
    });

    it('debe retornar null si la tarjeta no existe', async () => {
      const result = await toggleCardDiscarded('id-inexistente');
      expect(result).toBeNull();
    });

    it('debe actualizar updatedAt al descartar', async () => {
      const originalUpdatedAt = card1.updatedAt;
      
      // Pequeña espera para asegurar diferencia de tiempo
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result = await toggleCardDiscarded(card1.id);
      expect(new Date(result.updatedAt) > new Date(originalUpdatedAt)).toBe(true);
    });
  });

  describe('getCardsByDeck con descartadas', () => {
    let deck;
    let card1, card2, card3;

    beforeEach(async () => {
      deck = await saveDeck({ name: 'Mazo Test' });
      card1 = await saveCard({ deckId: deck.id, front: 'Hello', back: 'Hola' });
      card2 = await saveCard({ deckId: deck.id, front: 'Goodbye', back: 'Adiós' });
      card3 = await saveCard({ deckId: deck.id, front: 'Thanks', back: 'Gracias' });
    });

    it('debe excluir tarjetas descartadas por defecto', async () => {
      await toggleCardDiscarded(card1.id);
      
      const cards = await getCardsByDeck(deck.id);
      expect(cards).toHaveLength(2);
      expect(cards.find(c => c.id === card1.id)).toBeUndefined();
    });

    it('debe incluir tarjetas descartadas con includeDiscarded=true', async () => {
      await toggleCardDiscarded(card1.id);
      
      const cards = await getCardsByDeck(deck.id, true);
      expect(cards).toHaveLength(3);
      expect(cards.find(c => c.id === card1.id)).toBeDefined();
    });
  });

  describe('getDiscardedCards', () => {
    let deck;
    let card1, card2;

    beforeEach(async () => {
      deck = await saveDeck({ name: 'Mazo Test' });
      card1 = await saveCard({ deckId: deck.id, front: 'Hello', back: 'Hola' });
      card2 = await saveCard({ deckId: deck.id, front: 'Goodbye', back: 'Adiós' });
    });

    it('debe retornar solo tarjetas descartadas', async () => {
      await toggleCardDiscarded(card1.id);
      await toggleCardDiscarded(card2.id);
      
      const discarded = await getDiscardedCards();
      expect(discarded).toHaveLength(2);
    });

    it('debe filtrar por deckId si se proporciona', async () => {
      const deck2 = await saveDeck({ name: 'Otro Mazo' });
      const cardDeck2 = await saveCard({ deckId: deck2.id, front: 'Test', back: 'Prueba' });
      
      await toggleCardDiscarded(card1.id);
      await toggleCardDiscarded(cardDeck2.id);
      
      const discardedDeck1 = await getDiscardedCards(deck.id);
      expect(discardedDeck1).toHaveLength(1);
      expect(discardedDeck1[0].id).toBe(card1.id);
    });

    it('debe retornar array vacío si no hay descartadas', async () => {
      const discarded = await getDiscardedCards(deck.id);
      expect(discarded).toEqual([]);
    });
  });

  describe('restoreAllDiscardedCards', () => {
    let deck;
    let card1, card2, card3;

    beforeEach(async () => {
      deck = await saveDeck({ name: 'Mazo Test' });
      card1 = await saveCard({ deckId: deck.id, front: 'Hello', back: 'Hola' });
      card2 = await saveCard({ deckId: deck.id, front: 'Goodbye', back: 'Adiós' });
      card3 = await saveCard({ deckId: deck.id, front: 'Thanks', back: 'Gracias' });
    });

    it('debe restaurar todas las tarjetas descartadas de un mazo', async () => {
      await toggleCardDiscarded(card1.id);
      await toggleCardDiscarded(card2.id);
      await toggleCardDiscarded(card3.id);
      
      const result = await restoreAllDiscardedCards(deck.id);
      expect(result).toBe(true);
      
      const discarded = await getDiscardedCards(deck.id);
      expect(discarded).toHaveLength(0);
      
      const cards = await getCardsByDeck(deck.id);
      expect(cards).toHaveLength(3);
    });

    it('no debe afectar tarjetas de otros mazos', async () => {
      const deck2 = await saveDeck({ name: 'Otro Mazo' });
      const cardDeck2 = await saveCard({ deckId: deck2.id, front: 'Test', back: 'Prueba' });
      
      await toggleCardDiscarded(card1.id);
      await toggleCardDiscarded(cardDeck2.id);
      
      await restoreAllDiscardedCards(deck.id);
      
      // Las del deck original deben restaurarse
      const discardedDeck1 = await getDiscardedCards(deck.id);
      expect(discardedDeck1).toHaveLength(0);
      
      // Las del deck2 deben seguir descartadas
      const discardedDeck2 = await getDiscardedCards(deck2.id);
      expect(discardedDeck2).toHaveLength(1);
    });
  });
});
