import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  TextInput,
  Keyboard,
  Modal,
  ScrollView,
} from 'react-native';
import * as Speech from 'expo-speech';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import {
  getCardsToReview,
  getProblematicWords,
  getReviewWords,
  getDeckById,
  updateCardAfterStudy,
  saveStudySession,
  toggleCardFavorite,
  toggleCardDiscarded,
  CAMBRIDGE_LEVELS,
} from '../utils/storage';
import {
  CheckCircleIcon,
  XCircleIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  FireIcon,
  StarIcon,
  StarOutlineIcon,
  VolumeIcon,
  EditIcon,
  RefreshIcon,
  ArchiveIcon,
} from '../components/Icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function StudyScreen({ route, navigation }) {
  // studyMode: 'normal' | 'problematic' | 'review' - tipo de tarjetas a cargar
  const { deckId, masteryMode: initialMasteryMode = false, studyMode = 'normal' } = route.params || {};
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [originalCards, setOriginalCards] = useState([]); // Tarjetas originales para modo maestría
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    startTime: Date.now(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  
  // Estados para modo escritura
  const [showWriteMode, setShowWriteMode] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [answerResult, setAnswerResult] = useState(null); // null, 'correct', 'partial', 'incorrect'
  
  // Estados para palabras falladas y modo maestría
  const [failedCards, setFailedCards] = useState([]); // Tarjetas falladas en esta sesión
  const [masteryMode, setMasteryMode] = useState(initialMasteryMode); // Modo hasta acertar todas
  const [showModeModal, setShowModeModal] = useState(false); // Modal para seleccionar modo
  const [showFailedCardsModal, setShowFailedCardsModal] = useState(false); // Modal para repasar falladas
  const [masteryRound, setMasteryRound] = useState(1); // Ronda actual en modo maestría
  const [totalMasteredCards, setTotalMasteredCards] = useState(0); // Total de tarjetas dominadas
  const [selectedCardCount, setSelectedCardCount] = useState(null); // Cantidad de tarjetas seleccionadas
  const [reverseMode, setReverseMode] = useState(false); // Modo inverso: ES→EN
  const [showHint, setShowHint] = useState(false); // Mostrar pistas para tarjetas difíciles
  const [sessionFailCounts, setSessionFailCounts] = useState({}); // Conteo de fallos por tarjeta en esta sesión

  useEffect(() => {
    loadStudyData();
  }, [deckId]);

  const loadStudyData = async () => {
    try {
      setIsLoading(true);
      
      if (deckId) {
        const loadedDeck = await getDeckById(deckId);
        setDeck(loadedDeck);
        navigation.setOptions({ title: loadedDeck?.name || 'Estudiar' });
      } else {
        // Título según el modo de estudio
        const titles = {
          'problematic': '🔴 Problemáticas',
          'review': '🔄 Repaso',
          'normal': 'Estudiar Todo',
        };
        navigation.setOptions({ title: titles[studyMode] || 'Estudiar Todo' });
      }
      
      // Cargar tarjetas según el modo de estudio
      let cardsToStudy = [];
      
      if (studyMode === 'problematic') {
        // Cargar solo palabras problemáticas
        cardsToStudy = await getProblematicWords(deckId);
      } else if (studyMode === 'review') {
        // Cargar palabras para repasar
        cardsToStudy = await getReviewWords(deckId);
      } else {
        // Modo normal: tarjetas pendientes de revisión
        cardsToStudy = await getCardsToReview(deckId);
      }
      
      // Mezclar las tarjetas
      const shuffled = cardsToStudy.sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setOriginalCards(shuffled);
      setIsLoading(false);
      
      if (shuffled.length === 0) {
        const messages = {
          'problematic': '¡No tienes palabras problemáticas! Sigue así.',
          'review': 'No tienes palabras pendientes de repaso.',
          'normal': 'No tienes tarjetas pendientes para revisar.',
        };
        Alert.alert(
          '¡Genial!',
          messages[studyMode] || 'No hay tarjetas disponibles.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else if (!initialMasteryMode) {
        // Mostrar modal de selección de modo si hay tarjetas
        setSelectedCardCount(shuffled.length); // Por defecto todas
        setShowModeModal(true);
      }
    } catch (error) {
      console.error('Error cargando datos de estudio:', error);
      setIsLoading(false);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const speakWord = async (text, language = 'en-US') => {
    try {
      // Detener cualquier reproducción anterior
      await Speech.stop();
      // Reproducir el texto
      await Speech.speak(text, {
        language: language,
        pitch: 1.0,
        rate: 0.85, // Un poco más lento para aprender
      });
    } catch (error) {
      console.error('Error reproduciendo audio:', error);
    }
  };

  // Función para comparar respuesta escrita
  const compareAnswer = (answer, target) => {
    const normalize = (text) => 
      text.toLowerCase()
        .trim()
        .replace(/[.,!?;:'"¿¡()]/g, '')
        .replace(/\s+/g, ' ');
    
    const answerNorm = normalize(answer);
    const targetNorm = normalize(target);
    
    if (answerNorm === targetNorm) {
      return 'correct';
    }
    
    // Verificar si contiene la respuesta principal (para traducciones con varias opciones)
    const targetParts = targetNorm.split(/[,\/]/);
    for (const part of targetParts) {
      if (answerNorm === normalize(part)) {
        return 'correct';
      }
    }
    
    // Calcular similitud
    const longer = answerNorm.length > targetNorm.length ? answerNorm : targetNorm;
    const shorter = answerNorm.length > targetNorm.length ? targetNorm : answerNorm;
    
    if (longer.includes(shorter) && shorter.length >= longer.length * 0.6) {
      return 'correct';
    }
    
    // Comparar caracteres
    let matches = 0;
    for (let i = 0; i < Math.min(answerNorm.length, targetNorm.length); i++) {
      if (answerNorm[i] === targetNorm[i]) matches++;
    }
    const similarity = matches / Math.max(answerNorm.length, targetNorm.length);
    
    if (similarity >= 0.8) return 'correct';
    if (similarity >= 0.5) return 'partial';
    return 'incorrect';
  };

  // Generar pistas para una tarjeta difícil
  const generateHints = (card) => {
    const hints = [];
    const answer = reverseMode ? card.front : card.back;
    
    // 1. Primera letra
    if (answer && answer.length > 0) {
      hints.push({
        type: 'firstLetter',
        icon: '🔤',
        label: 'Primera letra',
        value: answer.charAt(0).toUpperCase() + '...',
      });
    }
    
    // 2. Número de palabras/caracteres
    const wordCount = answer.split(' ').length;
    const charCount = answer.length;
    hints.push({
      type: 'length',
      icon: '📏',
      label: 'Longitud',
      value: wordCount > 1 ? `${wordCount} palabras (${charCount} letras)` : `${charCount} letras`,
    });
    
    // 3. Si tiene ejemplo, mostrar parte del contexto
    if (card.example) {
      // Ocultar la palabra en el ejemplo
      const hiddenExample = card.example.replace(
        new RegExp(card.front, 'gi'),
        '_____'
      );
      hints.push({
        type: 'context',
        icon: '📖',
        label: 'Ejemplo',
        value: hiddenExample,
      });
    }
    
    // 4. Categoría o nivel si está disponible
    if (card.level) {
      hints.push({
        type: 'level',
        icon: '📊',
        label: 'Nivel',
        value: `Cambridge ${card.level}`,
      });
    }
    
    // 5. Pista fonética (primeras sílabas de la pronunciación)
    if (card.pronunciation && !reverseMode) {
      const pronPart = card.pronunciation.slice(0, Math.min(card.pronunciation.length, 6)) + '...';
      hints.push({
        type: 'sound',
        icon: '🔊',
        label: 'Suena como',
        value: pronPart,
      });
    }
    
    return hints;
  };

  // Verificar si la tarjeta necesita pistas (problemática o fallada varias veces)
  const cardNeedsHints = (card) => {
    if (!card) return false;
    const sessionFails = sessionFailCounts[card.id] || 0;
    return card.isProblematic || card.consecutiveFailures >= 2 || sessionFails >= 1;
  };

  // Abrir modo escritura
  const openWriteMode = () => {
    setShowWriteMode(true);
    setUserAnswer('');
    setAnswerResult(null);
  };

  // Verificar respuesta
  const checkAnswer = () => {
    if (!userAnswer.trim()) return;
    
    const currentCard = cards[currentIndex];
    // En modo inverso, la respuesta correcta es el front (inglés)
    const correctAnswer = reverseMode ? currentCard.front : currentCard.back;
    const result = compareAnswer(userAnswer, correctAnswer);
    setAnswerResult(result);
    Keyboard.dismiss();
    
    // Mostrar la respuesta correcta después de verificar
    setTimeout(() => {
      setIsFlipped(true);
    }, 800);
  };

  // Cerrar modo escritura
  const closeWriteMode = () => {
    setShowWriteMode(false);
    setUserAnswer('');
    setAnswerResult(null);
  };

  const handleToggleFavorite = async () => {
    const currentCard = cards[currentIndex];
    try {
      const updatedCard = await toggleCardFavorite(currentCard.id);
      // Actualizar la tarjeta en el array local
      const newCards = [...cards];
      newCards[currentIndex] = updatedCard;
      setCards(newCards);
    } catch (error) {
      console.error('Error alternando favorito:', error);
    }
  };

  const handleResponse = async (quality) => {
    const currentCard = cards[currentIndex];
    
    try {
      // Actualizar tarjeta con el algoritmo SM-2
      await updateCardAfterStudy(currentCard.id, quality);
      
      // Actualizar estadísticas de sesión
      const isCorrect = quality >= 3;
      setSessionStats(prev => ({
        ...prev,
        correct: prev.correct + (isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (isCorrect ? 0 : 1),
      }));
      
      // Lista actualizada de falladas
      let updatedFailedCards = [...failedCards];
      
      // Registrar tarjeta fallada y actualizar conteo de sesión
      if (!isCorrect) {
        // Incrementar contador de fallos en esta sesión
        setSessionFailCounts(prev => ({
          ...prev,
          [currentCard.id]: (prev[currentCard.id] || 0) + 1,
        }));
        
        // Solo añadir si no está ya en la lista
        const exists = failedCards.some(card => card.id === currentCard.id);
        if (!exists) {
          updatedFailedCards = [...failedCards, currentCard];
          setFailedCards(updatedFailedCards);
        }
      } else if (masteryMode) {
        // En modo maestría, contar tarjetas dominadas
        setTotalMasteredCards(prev => prev + 1);
      }
      
      // Mover a la siguiente tarjeta
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
        // Resetear estados de modo escritura y pistas
        setShowWriteMode(false);
        setShowHint(false);
        setUserAnswer('');
        setAnswerResult(null);
      } else {
        // Fin de la ronda
        if (masteryMode && updatedFailedCards.length > 0) {
          // En modo maestría, si hay falladas, empezar nueva ronda con ellas
          handleMasteryRound(updatedFailedCards);
        } else {
          // Sesión completada
          finishSession();
        }
      }
    } catch (error) {
      console.error('Error procesando respuesta:', error);
    }
  };

  // Manejar nueva ronda en modo maestría
  const handleMasteryRound = (cardsToRetry) => {
    if (!cardsToRetry || cardsToRetry.length === 0) {
      finishSession();
      return;
    }
    
    // Mezclar las tarjetas falladas para la nueva ronda
    const shuffled = [...cardsToRetry].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setFailedCards([]);
    setMasteryRound(prev => prev + 1);
    setShowWriteMode(false);
    setUserAnswer('');
    setAnswerResult(null);
    
    // Mostrar mensaje de nueva ronda
    Alert.alert(
      `🔄 Ronda ${masteryRound + 1}`,
      `${shuffled.length} tarjeta${shuffled.length > 1 ? 's' : ''} para repasar.\n\n¡Vamos a dominarlas todas!`,
      [{ text: '¡Adelante!' }]
    );
  };

  // Función para repasar palabras falladas manualmente
  const startFailedCardsReview = () => {
    if (failedCards.length === 0) return;
    
    setShowFailedCardsModal(false);
    // Mezclar las tarjetas falladas
    const shuffled = [...failedCards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setFailedCards([]);
    setSessionComplete(false);
    setShowWriteMode(false);
    setUserAnswer('');
    setAnswerResult(null);
  };

  const finishSession = async () => {
    const endTime = Date.now();
    const timeMinutes = Math.round((endTime - sessionStats.startTime) / 60000);
    
    try {
      await saveStudySession({
        deckId: deckId || 'all',
        cardsStudied: cards.length,
        correct: sessionStats.correct,
        incorrect: sessionStats.incorrect,
        timeMinutes: Math.max(1, timeMinutes),
      });
    } catch (error) {
      console.error('Error guardando sesión:', error);
    }
    
    setSessionComplete(true);
  };

  // Descartar tarjeta actual durante el estudio
  const handleDiscardCard = async () => {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    Alert.alert(
      '📦 Descartar Tarjeta',
      '¿Descartar esta tarjeta? No aparecerá más en las sesiones de estudio.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: async () => {
            try {
              await toggleCardDiscarded(currentCard.id);
              
              // Remover la tarjeta de la sesión actual
              const newCards = cards.filter((_, idx) => idx !== currentIndex);
              
              if (newCards.length === 0) {
                // No quedan tarjetas
                finishSession();
              } else {
                setCards(newCards);
                // Ajustar el índice si es necesario
                if (currentIndex >= newCards.length) {
                  setCurrentIndex(newCards.length - 1);
                }
                setIsFlipped(false);
                setShowWriteMode(false);
                setUserAnswer('');
                setAnswerResult(null);
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo descartar la tarjeta');
            }
          },
        },
      ]
    );
  };

  const renderSessionComplete = () => {
    const totalCards = masteryMode ? totalMasteredCards : originalCards.length;
    const accuracy = totalCards > 0 
      ? Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.incorrect)) * 100) 
      : 0;

    return (
      <View style={[styles.completeContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.completeCard, { backgroundColor: theme.colors.surface }]}>
          <FireIcon size={60} color="#FF6B6B" />
          <Text style={[styles.completeTitle, { color: theme.colors.text }]}>
            ¡Sesión Completada!
          </Text>
          
          {masteryMode && masteryRound > 1 && (
            <View style={[styles.masteryBadge, { backgroundColor: '#FFD700' + '30' }]}>
              <Text style={[styles.masteryBadgeText, { color: '#FFD700' }]}>
                🏆 ¡Dominaste todo en {masteryRound} rondas!
              </Text>
            </View>
          )}
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.statCardValue, { color: theme.colors.primary }]}>
                {totalCards}
              </Text>
              <Text style={[styles.statCardLabel, { color: theme.colors.textSecondary }]}>
                Tarjetas
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.statCardValue, { color: '#4ADE80' }]}>
                {sessionStats.correct}
              </Text>
              <Text style={[styles.statCardLabel, { color: theme.colors.textSecondary }]}>
                Correctas
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.statCardValue, { color: '#F87171' }]}>
                {sessionStats.incorrect}
              </Text>
              <Text style={[styles.statCardLabel, { color: theme.colors.textSecondary }]}>
                Incorrectas
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.statCardValue, { color: '#FBBF24' }]}>
                {accuracy}%
              </Text>
              <Text style={[styles.statCardLabel, { color: theme.colors.textSecondary }]}>
                Precisión
              </Text>
            </View>
          </View>
          
          {/* Botón para repasar falladas */}
          {failedCards.length > 0 && (
            <TouchableOpacity
              style={[styles.reviewFailedButton, { backgroundColor: '#F87171' }]}
              onPress={() => setShowFailedCardsModal(true)}
            >
              <RefreshIcon size={20} color="#FFFFFF" />
              <Text style={styles.reviewFailedButtonText}>
                Repasar {failedCards.length} fallada{failedCards.length > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
        
        {/* Modal de tarjetas falladas */}
        {renderFailedCardsModal()}
      </View>
    );
  };
  
  // Modal para mostrar y repasar tarjetas falladas
  const renderFailedCardsModal = () => (
    <Modal
      visible={showFailedCardsModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowFailedCardsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            📝 Tarjetas Falladas
          </Text>
          <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
            {failedCards.length} tarjeta{failedCards.length > 1 ? 's' : ''} para repasar
          </Text>
          
          <ScrollView style={styles.failedCardsList} showsVerticalScrollIndicator={false}>
            {failedCards.map((card, index) => (
              <View 
                key={card.id} 
                style={[styles.failedCardItem, { backgroundColor: theme.colors.background }]}
              >
                <Text style={[styles.failedCardNumber, { color: theme.colors.textSecondary }]}>
                  {index + 1}.
                </Text>
                <View style={styles.failedCardContent}>
                  <Text style={[styles.failedCardFront, { color: theme.colors.text }]}>
                    {card.front}
                  </Text>
                  <Text style={[styles.failedCardBack, { color: theme.colors.primary }]}>
                    → {card.back}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelModalButton, { borderColor: theme.colors.border }]}
              onPress={() => setShowFailedCardsModal(false)}
            >
              <Text style={[styles.cancelModalButtonText, { color: theme.colors.text }]}>
                Cerrar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.primaryModalButton, { backgroundColor: theme.colors.primary }]}
              onPress={startFailedCardsReview}
            >
              <RefreshIcon size={18} color="#FFFFFF" />
              <Text style={styles.primaryModalButtonText}>
                Estudiar Ahora
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  // Función para iniciar el estudio con las opciones seleccionadas
  const startStudy = (isMasteryMode) => {
    // Limitar las tarjetas según la selección
    const cardsToStudy = cards.slice(0, selectedCardCount);
    setCards(cardsToStudy);
    setOriginalCards(cardsToStudy);
    setMasteryMode(isMasteryMode);
    setShowModeModal(false);
  };

  // Modal para seleccionar modo de estudio
  const renderModeModal = () => {
    const cardCountOptions = [5, 10, 15, 20, 30, 50].filter(n => n <= originalCards.length);
    if (!cardCountOptions.includes(originalCards.length)) {
      cardCountOptions.push(originalCards.length);
    }
    cardCountOptions.sort((a, b) => a - b);
    
    return (
      <Modal
        visible={showModeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              🎯 Modo de Estudio
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              {selectedCardCount} tarjeta{selectedCardCount > 1 ? 's' : ''} para estudiar
            </Text>
            
            {/* Toggle modo inverso */}
            <View style={[styles.reverseModeContainer, { backgroundColor: theme.colors.background }]}>
              <View style={styles.reverseModeInfo}>
                <Text style={[styles.reverseModeLabel, { color: theme.colors.text }]}>
                  Dirección del estudio
                </Text>
                <Text style={[styles.reverseModeDesc, { color: theme.colors.textSecondary }]}>
                  {reverseMode ? 'Español → Inglés' : 'Inglés → Español'}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.reverseModeToggle,
                  { backgroundColor: reverseMode ? '#9333EA' : theme.colors.primary }
                ]}
                onPress={() => setReverseMode(!reverseMode)}
              >
                <Text style={styles.reverseModeToggleText}>
                  {reverseMode ? '🇪🇸→🇬🇧' : '🇬🇧→🇪🇸'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Selector de cantidad de tarjetas */}
            <View style={styles.cardCountSelector}>
              <Text style={[styles.cardCountLabel, { color: theme.colors.textSecondary }]}>
                ¿Cuántas tarjetas quieres estudiar?
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardCountOptions}
              >
                {cardCountOptions.map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.cardCountOption,
                      {
                        backgroundColor: selectedCardCount === count 
                          ? (deck?.color || theme.colors.primary) 
                          : theme.colors.background,
                        borderColor: selectedCardCount === count 
                          ? (deck?.color || theme.colors.primary)
                          : theme.colors.border,
                      },
                    ]}
                    onPress={() => setSelectedCardCount(count)}
                  >
                    <Text style={[
                      styles.cardCountOptionText,
                      { color: selectedCardCount === count ? '#FFFFFF' : theme.colors.text }
                    ]}>
                      {count === originalCards.length ? `Todas (${count})` : count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Opción Normal */}
            <TouchableOpacity
              style={[styles.modeOption, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
              onPress={() => startStudy(false)}
            >
              <View style={styles.modeOptionHeader}>
                <View style={[styles.modeOptionIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Text style={styles.modeOptionEmoji}>📖</Text>
                </View>
                <View style={styles.modeOptionText}>
                  <Text style={[styles.modeOptionTitle, { color: theme.colors.text }]}>
                    Modo Normal
                  </Text>
                  <Text style={[styles.modeOptionDesc, { color: theme.colors.textSecondary }]}>
                    Repasa todas las tarjetas una vez. Las falladas se registran para repasar después.
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            
            {/* Opción Maestría */}
            <TouchableOpacity
              style={[styles.modeOption, { backgroundColor: '#FFD700' + '10', borderColor: '#FFD700' }]}
              onPress={() => startStudy(true)}
            >
              <View style={styles.modeOptionHeader}>
                <View style={[styles.modeOptionIcon, { backgroundColor: '#FFD700' + '30' }]}>
                  <Text style={styles.modeOptionEmoji}>🏆</Text>
                </View>
                <View style={styles.modeOptionText}>
                  <Text style={[styles.modeOptionTitle, { color: theme.colors.text }]}>
                    Modo Maestría
                  </Text>
                  <Text style={[styles.modeOptionDesc, { color: theme.colors.textSecondary }]}>
                    No termina hasta que aciertes todas. Las falladas se repiten automáticamente.
                  </Text>
                </View>
              </View>
              <View style={[styles.recommendedBadge, { backgroundColor: '#FFD700' }]}>
                <Text style={styles.recommendedBadgeText}>Recomendado</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Preparando tarjetas...
        </Text>
      </View>
    );
  }

  if (sessionComplete) {
    return renderSessionComplete();
  }

  if (cards.length === 0) {
    return null;
  }

  const currentCard = cards[currentIndex];
  
  // Determinar contenido según modo (normal o inverso)
  const cardFront = reverseMode ? currentCard.back : currentCard.front;
  const cardBack = reverseMode ? currentCard.front : currentCard.back;
  const cardPronunciation = reverseMode ? null : currentCard.pronunciation;
  const cardPronunciationEs = reverseMode ? null : currentCard.pronunciationEs;
  const frontLabel = reverseMode ? 'ESPAÑOL' : 'INGLÉS';
  const backLabel = reverseMode ? 'INGLÉS' : 'ESPAÑOL';
  const frontFlag = reverseMode ? '🇪🇸' : '🇬🇧';
  const backFlag = reverseMode ? '🇬🇧' : '🇪🇸';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Modal de selección de modo */}
      {renderModeModal()}
      
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        {/* Indicador de modo */}
        {masteryMode && (
          <View style={[styles.masteryModeIndicator, { backgroundColor: '#FFD700' + '20' }]}>
            <Text style={styles.masteryModeText}>🏆 Modo Maestría</Text>
            {masteryRound > 1 && (
              <Text style={styles.masteryRoundText}>Ronda {masteryRound}</Text>
            )}
          </View>
        )}
        
        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <CheckCircleIcon size={18} color="#4ADE80" />
            <Text style={[styles.progressText, { color: '#4ADE80' }]}>
              {sessionStats.correct}
            </Text>
          </View>
          <View style={styles.progressStat}>
            <XCircleIcon size={18} color="#F87171" />
            <Text style={[styles.progressText, { color: '#F87171' }]}>
              {sessionStats.incorrect}
            </Text>
          </View>
          {/* Indicador de falladas pendientes */}
          {failedCards.length > 0 && !masteryMode && (
            <View style={styles.progressStat}>
              <RefreshIcon size={18} color="#FBBF24" />
              <Text style={[styles.progressText, { color: '#FBBF24' }]}>
                {failedCards.length}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={[styles.progressCounter, { color: theme.colors.text }]}>
          {currentIndex + 1} / {cards.length}
        </Text>
        
        {/* Progress Bar */}
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: deck?.color || theme.colors.primary,
                width: `${((currentIndex + 1) / cards.length) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Card Container */}
      <View style={styles.cardContainer}>
        <View style={styles.cardWrapper}>
          {/* Action Buttons - Favorite and Discard */}
          <View style={styles.cardActionButtons}>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleToggleFavorite}
            >
              {currentCard.isFavorite ? (
                <StarIcon size={28} color="#FFD700" />
              ) : (
                <StarOutlineIcon size={28} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.discardButton}
              onPress={handleDiscardCard}
            >
              <ArchiveIcon size={24} color="#F59E0B" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={flipCard}
            style={styles.cardTouchable}
          >
            {/* Front of Card */}
            {!isFlipped && (
              <View
                style={[
                  styles.card,
                  { 
                    backgroundColor: theme.colors.surface,
                    borderColor: deck?.color || theme.colors.primary,
                  },
                ]}
              >
                <View style={styles.cardTopRow}>
                  <Text style={[styles.cardLabel, { color: theme.colors.textSecondary }]}>
                    {frontFlag} {frontLabel}
                  </Text>
                  {currentCard.level && CAMBRIDGE_LEVELS[currentCard.level] && (
                    <View style={[styles.levelBadge, { backgroundColor: CAMBRIDGE_LEVELS[currentCard.level].color + '20' }]}>
                      <Text style={[styles.levelBadgeText, { color: CAMBRIDGE_LEVELS[currentCard.level].color }]}>
                        {currentCard.level}
                      </Text>
                    </View>
                  )}
                </View>
                {currentCard.isFavorite && (
                  <View style={styles.favoriteIndicator}>
                    <StarIcon size={16} color="#FFD700" />
                  </View>
                )}
                <Text style={[styles.cardMainText, { color: theme.colors.text }]}>
                  {cardFront}
                </Text>
                {cardPronunciation && (
                  <View style={styles.pronunciationRow}>
                    <Text style={[styles.pronunciationText, { color: theme.colors.primary }]}>
                      {cardPronunciation}
                    </Text>
                    <TouchableOpacity
                      style={[styles.speakButton, { backgroundColor: theme.colors.primary + '20' }]}
                      onPress={() => speakWord(currentCard.front)}
                    >
                      <VolumeIcon size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
                
                {cardPronunciationEs && (
                  <Text style={[styles.pronunciationEsText, { color: theme.colors.textSecondary }]}>
                    🇪🇸 {cardPronunciationEs}
                  </Text>
                )}
                
                {/* Indicador de tarjeta difícil */}
                {cardNeedsHints(currentCard) && (
                  <View style={[styles.difficultBadge, { backgroundColor: '#FF980020' }]}>
                    <Text style={styles.difficultBadgeText}>
                      ⚠️ Tarjeta difícil
                    </Text>
                  </View>
                )}
                
                {/* Botón de pista para tarjetas difíciles */}
                {cardNeedsHints(currentCard) && !showHint && !showWriteMode && (
                  <TouchableOpacity
                    style={[styles.hintButton, { backgroundColor: '#FBBF2420', borderColor: '#FBBF24' }]}
                    onPress={() => setShowHint(true)}
                  >
                    <Text style={styles.hintButtonText}>💡 Ver pista</Text>
                  </TouchableOpacity>
                )}
                
                {/* Mostrar pistas */}
                {showHint && !showWriteMode && (
                  <View style={[styles.hintsContainer, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.hintsHeader}>
                      <Text style={[styles.hintsTitle, { color: '#FBBF24' }]}>💡 Pistas</Text>
                      <TouchableOpacity onPress={() => setShowHint(false)}>
                        <Text style={[styles.hintsClose, { color: theme.colors.textSecondary }]}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    {generateHints(currentCard).map((hint, index) => (
                      <View key={index} style={styles.hintItem}>
                        <Text style={styles.hintIcon}>{hint.icon}</Text>
                        <View style={styles.hintContent}>
                          <Text style={[styles.hintLabel, { color: theme.colors.textSecondary }]}>
                            {hint.label}
                          </Text>
                          <Text style={[styles.hintValue, { color: theme.colors.text }]}>
                            {hint.value}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                
                {/* Botón para modo escritura */}
                {!showWriteMode && (
                  <TouchableOpacity
                    style={[styles.writeButton, { backgroundColor: theme.colors.primary + '15' }]}
                    onPress={openWriteMode}
                  >
                    <EditIcon size={18} color={theme.colors.primary} />
                    <Text style={[styles.writeButtonText, { color: theme.colors.primary }]}>
                      Escribir respuesta
                    </Text>
                  </TouchableOpacity>
                )}
                
                {/* Input de respuesta escrita */}
                {showWriteMode && (
                  <View style={[styles.writeInputContainer, { backgroundColor: theme.colors.background }]}>
                    <Text style={[styles.writeInputLabel, { color: theme.colors.textSecondary }]}>
                      ✏️ Escribe la traducción:
                    </Text>
                    <View style={styles.writeInputRow}>
                      <TextInput
                        style={[
                          styles.writeInput,
                          { 
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.text,
                            borderColor: answerResult === 'correct' ? '#4ADE80' :
                                        answerResult === 'partial' ? '#FBBF24' :
                                        answerResult === 'incorrect' ? '#F87171' :
                                        theme.colors.border,
                          }
                        ]}
                        value={userAnswer}
                        onChangeText={setUserAnswer}
                        placeholder="Tu respuesta..."
                        placeholderTextColor={theme.colors.textSecondary}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={checkAnswer}
                        autoFocus
                      />
                      <TouchableOpacity
                        style={[styles.checkButton, { backgroundColor: theme.colors.primary }]}
                        onPress={checkAnswer}
                      >
                        <CheckCircleIcon size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Resultado */}
                    {answerResult && (
                      <View style={[
                        styles.answerFeedback,
                        { 
                          backgroundColor: answerResult === 'correct' ? '#4ADE8020' :
                                          answerResult === 'partial' ? '#FBBF2420' : '#F8717120',
                        }
                      ]}>
                        <Text style={[
                          styles.answerResultText,
                          {
                            color: answerResult === 'correct' ? '#4ADE80' :
                                   answerResult === 'partial' ? '#FBBF24' : '#F87171',
                          }
                        ]}>
                          {answerResult === 'correct' ? '✓ ¡Correcto!' :
                           answerResult === 'partial' ? '◐ ¡Casi!' : 
                           '✗ Incorrecto'}
                        </Text>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      style={styles.cancelWriteButton}
                      onPress={closeWriteMode}
                    >
                      <Text style={[styles.cancelWriteText, { color: theme.colors.textSecondary }]}>
                        Cancelar
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {!showWriteMode && (
                  <Text style={[styles.tapHint, { color: theme.colors.textSecondary }]}>
                    Toca para voltear
                  </Text>
                )}
              </View>
            )}

            {/* Back of Card */}
            {isFlipped && (
              <View
                style={[
                  styles.card,
                  { 
                    backgroundColor: theme.colors.surface,
                    borderColor: deck?.color || theme.colors.primary,
                  },
                ]}
              >
                <View style={styles.cardTopRow}>
                  <Text style={[styles.cardLabel, { color: theme.colors.textSecondary }]}>
                    {backFlag} {backLabel}
                  </Text>
                  {currentCard.level && CAMBRIDGE_LEVELS[currentCard.level] && (
                    <View style={[styles.levelBadge, { backgroundColor: CAMBRIDGE_LEVELS[currentCard.level].color + '20' }]}>
                      <Text style={[styles.levelBadgeText, { color: CAMBRIDGE_LEVELS[currentCard.level].color }]}>
                        {currentCard.level}
                      </Text>
                    </View>
                  )}
                </View>
                {currentCard.isFavorite && (
                  <View style={styles.favoriteIndicator}>
                    <StarIcon size={16} color="#FFD700" />
                  </View>
                )}
                <Text style={[styles.cardMainText, { color: theme.colors.text }]}>
                  {cardBack}
                </Text>
                {/* En modo inverso, mostrar pronunciación en el reverso */}
                {reverseMode && currentCard.pronunciation && (
                  <View style={styles.pronunciationRow}>
                    <Text style={[styles.pronunciationText, { color: theme.colors.primary }]}>
                      {currentCard.pronunciation}
                    </Text>
                    <TouchableOpacity
                      style={[styles.speakButton, { backgroundColor: theme.colors.primary + '20' }]}
                      onPress={() => speakWord(currentCard.front)}
                    >
                      <VolumeIcon size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
                {currentCard.example && (
                  <View style={[styles.exampleBox, { backgroundColor: theme.colors.background }]}>
                    <Text style={[styles.exampleLabel, { color: theme.colors.textSecondary }]}>
                      Ejemplo:
                    </Text>
                    <Text style={[styles.exampleText, { color: theme.colors.textSecondary }]}>
                      {currentCard.example}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Response Buttons - Disabled when not flipped */}
      {!isFlipped && !showWriteMode && (
        <View style={[styles.responseContainer, { opacity: 0.4, paddingBottom: 30 + insets.bottom }]}>
          <Text style={[styles.responsePrompt, { color: theme.colors.textSecondary }]}>
            ¿Qué tan bien lo recordaste?
          </Text>
          
          <View style={styles.responseButtons}>
            <View style={[styles.responseButton, styles.buttonAgain]}>
              <XCircleIcon size={24} color="#FFFFFF" />
              <Text style={styles.responseButtonText}>Otra vez</Text>
              <Text style={styles.responseSubtext}>&lt;1 min</Text>
            </View>
            
            <View style={[styles.responseButton, styles.buttonHard]}>
              <ThumbsDownIcon size={24} color="#FFFFFF" />
              <Text style={styles.responseButtonText}>Difícil</Text>
              <Text style={styles.responseSubtext}>1 día</Text>
            </View>
            
            <View style={[styles.responseButton, styles.buttonGood]}>
              <ThumbsUpIcon size={24} color="#FFFFFF" />
              <Text style={styles.responseButtonText}>Bien</Text>
              <Text style={styles.responseSubtext}>~6 días</Text>
            </View>
            
            <View style={[styles.responseButton, styles.buttonEasy]}>
              <CheckCircleIcon size={24} color="#FFFFFF" />
              <Text style={styles.responseButtonText}>Fácil</Text>
              <Text style={styles.responseSubtext}>~15 días</Text>
            </View>
          </View>
        </View>
      )}

      {/* Response Buttons - Active when flipped */}
      {isFlipped && (
        <View style={[styles.responseContainer, { paddingBottom: 30 + insets.bottom }]}>
          <Text style={[styles.responsePrompt, { color: theme.colors.textSecondary }]}>
            ¿Qué tan bien lo recordaste?
          </Text>
          
          <View style={styles.responseButtons}>
            <TouchableOpacity
              style={[styles.responseButton, styles.buttonAgain]}
              onPress={() => handleResponse(1)}
            >
              <XCircleIcon size={24} color="#FFFFFF" />
              <Text style={styles.responseButtonText}>Otra vez</Text>
              <Text style={styles.responseSubtext}>&lt;1 min</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.responseButton, styles.buttonHard]}
              onPress={() => handleResponse(3)}
            >
              <ThumbsDownIcon size={24} color="#FFFFFF" />
              <Text style={styles.responseButtonText}>Difícil</Text>
              <Text style={styles.responseSubtext}>1 día</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.responseButton, styles.buttonGood]}
              onPress={() => handleResponse(4)}
            >
              <ThumbsUpIcon size={24} color="#FFFFFF" />
              <Text style={styles.responseButtonText}>Bien</Text>
              <Text style={styles.responseSubtext}>~6 días</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.responseButton, styles.buttonEasy]}
              onPress={() => handleResponse(5)}
            >
              <CheckCircleIcon size={24} color="#FFFFFF" />
              <Text style={styles.responseButtonText}>Fácil</Text>
              <Text style={styles.responseSubtext}>~15 días</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },
  progressHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  progressCounter: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  cardActionButtons: {
    position: 'absolute',
    top: -40,
    right: 10,
    left: 10,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  favoriteButton: {
    padding: 8,
  },
  discardButton: {
    padding: 8,
  },
  favoriteIndicator: {
    position: 'absolute',
    top: 18,
    right: 20,
  },
  cardTouchable: {
    width: '100%',
  },
  card: {
    width: '100%',
    minHeight: SCREEN_HEIGHT * 0.35,
    borderRadius: 20,
    padding: 24,
    paddingTop: 50,
    paddingBottom: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardTopRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardMainText: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 42,
    paddingHorizontal: 10,
  },
  tapHint: {
    position: 'absolute',
    bottom: 20,
    fontSize: 14,
    opacity: 0.7,
  },
  exampleBox: {
    marginTop: 20,
    padding: 12,
    borderRadius: 10,
    width: '100%',
  },
  exampleLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  pronunciationText: {
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: '500',
  },
  pronunciationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 10,
  },
  speakButton: {
    padding: 8,
    borderRadius: 20,
  },
  writeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  writeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  writeInputContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    width: '100%',
  },
  writeInputLabel: {
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  writeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  writeInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    borderWidth: 2,
  },
  checkButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerFeedback: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  answerResultText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelWriteButton: {
    marginTop: 10,
    alignItems: 'center',
    padding: 8,
  },
  cancelWriteText: {
    fontSize: 13,
  },
  pronunciationEsText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 6,
  },
  // Estilos para tarjetas difíciles y pistas
  difficultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'center',
  },
  difficultBadgeText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
    alignSelf: 'center',
  },
  hintButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FBBF24',
  },
  hintsContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    width: '100%',
  },
  hintsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  hintsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  hintsClose: {
    fontSize: 18,
    padding: 4,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingVertical: 4,
  },
  hintIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 24,
  },
  hintContent: {
    flex: 1,
  },
  hintLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hintValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  responseContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  responsePrompt: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
  responseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  responseButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  buttonAgain: {
    backgroundColor: '#EF4444',
  },
  buttonHard: {
    backgroundColor: '#F97316',
  },
  buttonGood: {
    backgroundColor: '#22C55E',
  },
  buttonEasy: {
    backgroundColor: '#3B82F6',
  },
  responseButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 4,
  },
  responseSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 2,
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completeCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statCard: {
    width: '42%',
    margin: '2%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statCardLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  doneButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  // Estilos para modo maestría
  masteryModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 10,
    alignSelf: 'center',
    gap: 8,
  },
  masteryModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B8860B',
  },
  masteryRoundText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B8860B',
    backgroundColor: '#FFD700' + '40',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  masteryBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  masteryBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewFailedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  reviewFailedButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Estilos para modales
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  // Estilos para lista de falladas
  failedCardsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  failedCardItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  failedCardNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 10,
    minWidth: 20,
  },
  failedCardContent: {
    flex: 1,
  },
  failedCardFront: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  failedCardBack: {
    fontSize: 14,
  },
  // Estilos para botones de modal
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  cancelModalButton: {
    borderWidth: 1,
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryModalButton: {
  },
  primaryModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos para opciones de modo
  modeOption: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
    position: 'relative',
  },
  modeOptionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  modeOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modeOptionEmoji: {
    fontSize: 24,
  },
  modeOptionText: {
    flex: 1,
  },
  modeOptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modeOptionDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  recommendedBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  // Estilos para modo inverso
  reverseModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  reverseModeInfo: {
    flex: 1,
  },
  reverseModeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  reverseModeDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  reverseModeToggle: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 12,
  },
  reverseModeToggleText: {
    fontSize: 16,
  },
  // Estilos para selector de cantidad de tarjetas
  cardCountSelector: {
    marginBottom: 20,
  },
  cardCountLabel: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  cardCountOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cardCountOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    marginHorizontal: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  cardCountOptionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
