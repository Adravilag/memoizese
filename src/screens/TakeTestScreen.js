import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTestById, saveResult } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import { BooksIcon, ClipboardEditIcon, CheckCircleIcon, XCircleIcon } from '../components/Icons';

export default function TakeTestScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { testId, mode } = route.params;
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [startTime] = useState(Date.now());
  const [isFinishing, setIsFinishing] = useState(false);
  const questionScrollViewRef = useRef(null);
  const statusScrollViewRef = useRef(null);

  useEffect(() => {
    loadTest();
  }, []);

  // Actualizar el título del header cuando cambie la pregunta actual
  useEffect(() => {
    if (test && test.questions[currentIndex]) {
      const currentQuestion = test.questions[currentIndex];
      const modeText = mode === 'practice' ? 'Práctica' : 'Examen';
      navigation.setOptions({
        title: `${modeText} - Pregunta ${currentQuestion.number}`
      });
    }
  }, [currentIndex, test, navigation, mode]);

  // Auto-scroll horizontal de indicadores de estado cuando cambia la pregunta
  useEffect(() => {
    if (statusScrollViewRef.current && test) {
      // Pequeño delay para asegurar que el layout esté completo
      const timer = setTimeout(() => {
        const DOT_WIDTH = 28; // ancho del dot
        const GAP = 6; // gap entre dots
        const ITEM_WIDTH = DOT_WIDTH + GAP;
        const CONTAINER_WIDTH = 280; // ancho aproximado visible del contenedor
        
        // Centrar el elemento actual en el scroll
        const targetX = Math.max(0, (currentIndex * ITEM_WIDTH) - (CONTAINER_WIDTH / 2) + (DOT_WIDTH / 2));
        statusScrollViewRef.current.scrollTo({ x: targetX, animated: true });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, test]);

  // Auto-scroll al inicio de la pregunta cuando cambia el índice
  useEffect(() => {
    // Pequeño delay para asegurar que el render esté completo
    const timer = setTimeout(() => {
      if (questionScrollViewRef.current) {
        questionScrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  useEffect(() => {
    // Prevenir salir sin confirmar (solo si no está finalizando intencionalmente)
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Si está finalizando el test, permitir navegación
      if (isFinishing) {
        return;
      }
      
      if (Object.keys(userAnswers).length === 0) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        '¿Abandonar el test?',
        'Si sales ahora, perderás tu progreso y el test no se guardará.',
        [
          { text: 'Continuar', style: 'cancel' },
          {
            text: 'Abandonar',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, userAnswers, isFinishing]);

  // Función para barajar un array (Fisher-Yates shuffle)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadTest = async () => {
    try {
      const loadedTest = await getTestById(testId);
      
      // Barajar preguntas
      const shuffledQuestions = shuffleArray(loadedTest.questions);
      
      // Barajar opciones de cada pregunta (manteniendo el tracking de la correcta)
      const questionsWithShuffledOptions = shuffledQuestions.map(question => {
        const options = [...question.options];
        const correctLetter = question.correctAnswer;
        const correctOption = options.find(o => o.letter === correctLetter);
        
        // Barajar opciones
        const shuffledOptions = shuffleArray(options);
        
        // Reasignar letras a, b, c, d en nuevo orden
        const newOptions = shuffledOptions.map((opt, idx) => ({
          ...opt,
          letter: String.fromCharCode(97 + idx) // a, b, c, d
        }));
        
        // Encontrar la nueva letra de la respuesta correcta
        const newCorrectIndex = shuffledOptions.findIndex(o => o === correctOption);
        const newCorrectLetter = String.fromCharCode(97 + newCorrectIndex);
        
        return {
          ...question,
          options: newOptions,
          correctAnswer: newCorrectLetter
        };
      });
      
      setTest({
        ...loadedTest,
        questions: questionsWithShuffledOptions
      });
    } catch (error) {
      console.error('Error cargando test:', error);
      Alert.alert('Error', 'No se pudo cargar el test');
    }
    setLoading(false);
  };

  const scrollToTop = () => {
    if (questionScrollViewRef.current) {
      questionScrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const handleSelectAnswer = (letter) => {
    if (mode === 'practice' && showFeedback) {
      return; // No permitir cambiar respuesta después de ver feedback
    }

    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: letter
    }));

    if (mode === 'practice') {
      setShowFeedback(true);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    
    if (currentIndex < test.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      scrollToTop();
    } else {
      confirmFinishTest();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setShowFeedback(false);
      setCurrentIndex(currentIndex - 1);
      scrollToTop();
    }
  };

  const confirmFinishTest = () => {
    // Verificar preguntas sin responder
    const unansweredQuestions = test.questions.filter(q => !userAnswers[q.id]);
    
    if (unansweredQuestions.length > 0) {
      const questionNumbers = unansweredQuestions.map(q => q.number).join(', ');
      Alert.alert(
        'Preguntas sin responder',
        `Tienes ${unansweredQuestions.length} pregunta${unansweredQuestions.length > 1 ? 's' : ''} sin responder:\n\nPreguntas: ${questionNumbers}\n\n¿Quieres finalizar de todas formas?`,
        [
          { text: 'Seguir respondiendo', style: 'cancel' },
          {
            text: 'Finalizar',
            style: 'destructive',
            onPress: () => finishTest(),
          },
        ]
      );
    } else {
      Alert.alert(
        'Finalizar test',
        '¿Estás seguro de que quieres terminar el test?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Finalizar',
            onPress: () => finishTest(),
          },
        ]
      );
    }
  };

  const finishTest = async () => {
    const endTime = Date.now();
    const timeSpent = Math.round((endTime - startTime) / 1000);

    // Calcular resultados
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    const detailedResults = test.questions.map(q => {
      const userAnswer = userAnswers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;
      
      if (!userAnswer) {
        unanswered++;
      } else if (isCorrect) {
        correct++;
      } else {
        incorrect++;
      }

      return {
        questionId: q.id,
        questionNumber: q.number,
        questionText: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        userAnswer: userAnswer || null,
        isCorrect: userAnswer ? isCorrect : null
      };
    });

    const score = (correct / test.questions.length) * 100;

    const result = {
      testId,
      testName: test.name,
      score,
      correct,
      incorrect,
      unanswered,
      totalQuestions: test.questions.length,
      correctAnswers: correct, // Para estadísticas
      duration: timeSpent, // Para estadísticas (en segundos)
      timeSpent,
      mode,
      details: detailedResults
    };

    // Marcar que estamos finalizando para evitar el alert de abandonar
    setIsFinishing(true);

    try {
      await saveResult(result);
      navigation.replace('Results', { result });
    } catch (error) {
      console.error('Error guardando resultado:', error);
      navigation.replace('Results', { result });
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!test) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>Test no encontrado</Text>
      </View>
    );
  }

  const currentQuestion = test.questions[currentIndex];
  const userAnswer = userAnswers[currentQuestion.id];
  const answeredCount = Object.keys(userAnswers).length;

  // Función para obtener el estado de cada pregunta
  const getQuestionStatus = (questionIndex) => {
    const question = test.questions[questionIndex];
    const answer = userAnswers[question.id];
    
    if (!answer) {
      return 'unanswered'; // Gris - sin responder
    }
    
    if (mode === 'exam') {
      return 'answered'; // Azul - respondida en modo examen (sin saber si es correcta)
    }
    
    // Modo práctica - sabemos si es correcta o no
    if (answer === question.correctAnswer) {
      return 'correct'; // Verde
    } else {
      return 'incorrect'; // Rojo
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      {/* Header con progreso */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, { color: theme.colors.text }]}>
            Pregunta {currentIndex + 1} de {test.questions.length}
          </Text>
          <Text style={[styles.answeredText, { color: theme.colors.textSecondary, backgroundColor: theme.colors.cardHighlight }]}>
            Respondidas: {answeredCount}/{test.questions.length}
          </Text>
        </View>
        
        {/* Indicadores de estado por pregunta */}
        <ScrollView 
          ref={statusScrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statusIndicators}
          contentContainerStyle={styles.statusIndicatorsContent}
          testID="status-indicators-scroll"
        >
          {test.questions.map((_, index) => {
            const status = getQuestionStatus(index);
            const isCurrent = index === currentIndex;
            
            return (
              <TouchableOpacity
                key={index}
                testID={`status-dot-${index}`}
                style={[
                  styles.statusDot,
                  { backgroundColor: theme.colors.badge, borderColor: 'transparent' },
                  status === 'answered' && { backgroundColor: theme.colors.primary },
                  status === 'correct' && { backgroundColor: theme.colors.success },
                  status === 'incorrect' && { backgroundColor: theme.colors.error },
                  isCurrent && [styles.statusDotCurrent, { borderColor: theme.colors.text }],
                ]}
                onPress={() => {
                  setShowFeedback(false);
                  setCurrentIndex(index);
                }}
              >
                <Text style={[
                  styles.statusDotText,
                  { color: theme.colors.textSecondary },
                  status !== 'unanswered' && styles.statusDotTextLight
                ]}>
                  {index + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        <View style={[styles.progressBar, { backgroundColor: theme.colors.badge }]}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentIndex + 1) / test.questions.length) * 100}%`, backgroundColor: theme.colors.primary }
            ]} 
          />
        </View>
      </View>

      {/* Pregunta */}
      <ScrollView 
        ref={questionScrollViewRef}
        style={styles.questionContainer} 
        nestedScrollEnabled={true}
        contentContainerStyle={styles.questionContentContainer}
      >
        {/* Número de pregunta destacado */}
        <View style={styles.questionHeader}>
          <View style={[styles.questionNumberBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.questionNumberText}>{currentIndex + 1}</Text>
          </View>
          <View style={styles.questionMeta}>
            <View style={styles.modeIndicator}>
              {mode === 'practice' ? <BooksIcon size={16} color={theme.colors.textSecondary} /> : <ClipboardEditIcon size={16} color={theme.colors.textSecondary} />}
              <Text style={[styles.questionMetaText, { color: theme.colors.textSecondary }]}>
                {mode === 'practice' ? ' Modo Práctica' : ' Modo Examen'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Texto de la pregunta */}
        <View style={[styles.questionCard, { backgroundColor: theme.colors.card, borderLeftColor: theme.colors.primary }]}>
          <Text style={[styles.questionText, { color: theme.colors.text }]}>{currentQuestion.text}</Text>
        </View>

        {/* Opciones */}
        {currentQuestion.options.map((option) => {
          const isSelected = userAnswer === option.letter;
          const isCorrectAnswer = option.letter === currentQuestion.correctAnswer;
          
          let optionStyle = [styles.optionButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }];
          let letterStyle = [styles.optionLetter, { backgroundColor: theme.colors.badge }];
          let textStyle = [styles.optionText, { color: theme.colors.text }];

          if (mode === 'practice' && showFeedback) {
            if (isCorrectAnswer) {
              optionStyle = [styles.optionButton, styles.optionCorrect, { backgroundColor: theme.colors.successLight, borderColor: theme.colors.success }];
              letterStyle = [styles.optionLetter, { backgroundColor: theme.colors.success }];
              textStyle = [styles.optionText, { color: theme.colors.success, fontWeight: '500' }];
            } else if (isSelected && !isCorrectAnswer) {
              optionStyle = [styles.optionButton, styles.optionIncorrect, { backgroundColor: theme.colors.errorLight, borderColor: theme.colors.error }];
              letterStyle = [styles.optionLetter, { backgroundColor: theme.colors.error }];
              textStyle = [styles.optionText, { color: theme.colors.error }];
            }
          } else if (isSelected) {
            optionStyle = [styles.optionButton, styles.optionSelected, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }];
            letterStyle = [styles.optionLetter, { backgroundColor: theme.colors.primary }];
            textStyle = [styles.optionText, { color: theme.colors.primary }];
          }

          return (
            <TouchableOpacity
              key={option.letter}
              style={optionStyle}
              onPress={() => handleSelectAnswer(option.letter)}
              disabled={mode === 'practice' && showFeedback}
            >
              <View style={letterStyle}>
                <Text style={[
                  styles.optionLetterText,
                  { color: theme.colors.textSecondary },
                  (isSelected || (showFeedback && isCorrectAnswer)) && styles.optionLetterTextSelected
                ]}>
                  {option.letter.toUpperCase()}
                </Text>
              </View>
              <Text style={textStyle}>{option.text}</Text>
            </TouchableOpacity>
          );
        })}

        {/* Feedback en modo práctica */}
        {mode === 'practice' && showFeedback && (
          <View style={[
            styles.feedbackContainer,
            userAnswer === currentQuestion.correctAnswer 
              ? [styles.feedbackCorrect, { backgroundColor: theme.colors.successLight, borderLeftColor: theme.colors.success }]
              : [styles.feedbackIncorrect, { backgroundColor: theme.colors.errorLight, borderLeftColor: theme.colors.error }]
          ]}>
            <View style={styles.feedbackIcon}>
              {userAnswer === currentQuestion.correctAnswer 
                ? <CheckCircleIcon size={32} color={theme.colors.success} />
                : <XCircleIcon size={32} color={theme.colors.error} />}
            </View>
            <View style={styles.feedbackTextContainer}>
              <Text style={[
                styles.feedbackText,
                { color: userAnswer === currentQuestion.correctAnswer ? theme.colors.success : theme.colors.error }
              ]}>
                {userAnswer === currentQuestion.correctAnswer
                  ? '¡Respuesta Correcta!'
                  : 'Respuesta Incorrecta'
                }
              </Text>
              {userAnswer !== currentQuestion.correctAnswer && currentQuestion.correctAnswer && (
                <Text style={[styles.feedbackSubtext, { color: theme.colors.textSecondary }]}>
                  La respuesta correcta es: {currentQuestion.correctAnswer.toUpperCase()}
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navegación */}
      <View style={[styles.navigationContainer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          testID="prev-button"
          style={[styles.navButton, { backgroundColor: theme.colors.cardHighlight }, currentIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Text style={[styles.navButtonText, { color: theme.colors.text }]}>← Anterior</Text>
        </TouchableOpacity>

        {mode === 'exam' && currentIndex === test.questions.length - 1 ? (
          <TouchableOpacity
            testID="finish-button"
            style={[styles.navButton, styles.finishButton, { backgroundColor: theme.colors.success }]}
            onPress={confirmFinishTest}
          >
            <Text style={[styles.navButtonText, styles.finishButtonText]}>
              Finalizar Test
            </Text>
          </TouchableOpacity>
        ) : mode === 'practice' ? (
          <TouchableOpacity
            testID="next-button"
            style={[
              styles.navButton, 
              styles.nextButton,
              { backgroundColor: theme.colors.primary },
              !showFeedback && !userAnswer && styles.navButtonDisabled
            ]}
            onPress={handleNext}
            disabled={!showFeedback && !userAnswer}
          >
            <Text style={[styles.navButtonText, styles.nextButtonText]}>
              {currentIndex === test.questions.length - 1 ? 'Finalizar' : 'Siguiente →'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            testID="next-button"
            style={[styles.navButton, styles.nextButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleNext}
          >
            <Text style={[styles.navButtonText, styles.nextButtonText]}>
              Siguiente →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressText: {
    fontSize: 15,
    fontWeight: '700',
  },
  answeredText: {
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIndicators: {
    marginVertical: 12,
    maxHeight: 36,
  },
  statusIndicatorsContent: {
    paddingHorizontal: 4,
    gap: 6,
  },
  statusDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusDotUnanswered: {
  },
  statusDotAnswered: {
  },
  statusDotCorrect: {
  },
  statusDotIncorrect: {
  },
  statusDotCurrent: {
    transform: [{ scale: 1.15 }],
  },
  statusDotText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusDotTextLight: {
    color: '#fff',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  questionContainer: {
    flex: 1,
    padding: 16,
  },
  questionContentContainer: {
    paddingBottom: 40,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionNumberBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  questionNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  questionMeta: {
    flex: 1,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionMetaText: {
    fontSize: 14,
  },
  questionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
  },
  questionText: {
    fontSize: 17,
    lineHeight: 26,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  optionSelected: {
    shadowOpacity: 0.15,
    elevation: 2,
  },
  optionCorrect: {
  },
  optionIncorrect: {
  },
  optionLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  optionLetterSelected: {
  },
  optionLetterCorrect: {
  },
  optionLetterIncorrect: {
  },
  optionLetterText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionLetterTextSelected: {
    color: '#fff',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  optionTextSelected: {
  },
  optionTextCorrect: {
    fontWeight: '500',
  },
  optionTextIncorrect: {
  },
  feedbackContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackCorrect: {
    borderLeftWidth: 4,
  },
  feedbackIncorrect: {
    borderLeftWidth: 4,
  },
  feedbackIcon: {
    marginRight: 12,
  },
  feedbackTextContainer: {
    flex: 1,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackSubtext: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.8,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  navButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  navButtonDisabled: {
    opacity: 0.4,
    elevation: 0,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    shadowOpacity: 0.3,
  },
  nextButtonText: {
    color: '#fff',
  },
  finishButton: {
    shadowOpacity: 0.3,
  },
  finishButtonText: {
    color: '#fff',
  },
});
