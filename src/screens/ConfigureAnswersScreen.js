import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTestById, updateTest } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import { SaveIcon } from '../components/Icons';

export default function ConfigureAnswersScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { testId } = route.params;
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const questionScrollViewRef = useRef(null);
  const tabsListRef = useRef(null);

  // Auto-scroll horizontal de tabs cuando cambia la pregunta
  useEffect(() => {
    if (tabsListRef.current && test) {
      // Pequeño delay para asegurar que el layout esté completo
      const timer = setTimeout(() => {
        const TAB_WIDTH = 44; // ancho del tab
        const MARGIN = 8; // marginHorizontal * 2
        const ITEM_WIDTH = TAB_WIDTH + MARGIN;
        const CONTAINER_WIDTH = 300; // ancho aproximado visible del contenedor
        
        // Centrar el elemento actual en el scroll
        const targetOffset = Math.max(0, (currentIndex * ITEM_WIDTH) - (CONTAINER_WIDTH / 2) + (TAB_WIDTH / 2));
        tabsListRef.current.scrollToOffset({
          offset: targetOffset,
          animated: true
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, test]);

  // Actualizar el título del header cuando cambie la pregunta actual
  useEffect(() => {
    if (test && test.questions[currentIndex]) {
      const currentQuestion = test.questions[currentIndex];
      navigation.setOptions({
        title: `Configurar - Pregunta ${currentQuestion.number}`
      });
    }
  }, [currentIndex, test, navigation]);

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
    loadTest();
  }, []);

  const loadTest = async () => {
    try {
      const loadedTest = await getTestById(testId);
      if (loadedTest) {
        setTest(loadedTest);
        // Inicializar respuestas con las ya configuradas
        const initialAnswers = {};
        loadedTest.questions.forEach(q => {
          if (q.correctAnswer) {
            initialAnswers[q.id] = q.correctAnswer;
          }
        });
        setAnswers(initialAnswers);
      }
    } catch (error) {
      console.error('Error cargando test:', error);
      Alert.alert('Error', 'No se pudo cargar el test');
    }
    setLoading(false);
  };

  const handleSelectAnswer = (questionId, letter) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: letter
    }));
  };

  const handleSave = async () => {
    const configuredCount = Object.keys(answers).length;
    const totalQuestions = test.questions.length;

    if (configuredCount < totalQuestions) {
      Alert.alert(
        'Configuración incompleta',
        `Has configurado ${configuredCount} de ${totalQuestions} preguntas. ¿Deseas guardar de todos modos?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Guardar', onPress: saveAnswers }
        ]
      );
    } else {
      saveAnswers();
    }
  };

  const saveAnswers = async () => {
    setSaving(true);
    try {
      const updatedQuestions = test.questions.map(q => ({
        ...q,
        correctAnswer: answers[q.id] || null
      }));

      await updateTest(testId, { questions: updatedQuestions });
      
      Alert.alert(
        'Guardado',
        'Las respuestas correctas han sido configuradas',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error guardando:', error);
      Alert.alert('Error', 'No se pudieron guardar las respuestas');
    }
    setSaving(false);
  };

  const scrollToTop = () => {
    if (questionScrollViewRef.current) {
      questionScrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const goToQuestion = (index) => {
    setCurrentIndex(index);
    scrollToTop();
  };

  const renderQuestionItem = ({ item, index }) => {
    const isSelected = currentIndex === index;
    const isConfigured = answers[item.id] !== undefined;

    return (
      <TouchableOpacity
        style={[
          styles.questionTab,
          { backgroundColor: theme.colors.badge },
          isSelected && [styles.questionTabSelected, { backgroundColor: theme.colors.primary }],
          isConfigured && !isSelected && [styles.questionTabConfigured, { backgroundColor: theme.colors.success }]
        ]}
        onPress={() => goToQuestion(index)}
      >
        <Text style={[
          styles.questionTabText,
          { color: theme.colors.textSecondary },
          (isSelected || isConfigured) && styles.questionTabTextSelected
        ]}>
          {item.number}
        </Text>
        {isConfigured && (
          <Text style={[styles.checkMark, { backgroundColor: theme.colors.success }]}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Cargando test...</Text>
      </View>
    );
  }

  if (!test) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>No se encontró el test</Text>
      </View>
    );
  }

  const currentQuestion = test.questions[currentIndex];
  const progress = Object.keys(answers).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      {/* Progress bar */}
      <View style={[styles.progressContainer, { backgroundColor: theme.colors.card }]}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.borderLight }]}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(progress / test.questions.length) * 100}%`, backgroundColor: theme.colors.primary }
            ]} 
          />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          {progress}/{test.questions.length} configuradas
        </Text>
      </View>

      {/* Question tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <FlatList
          ref={tabsListRef}
          data={test.questions}
          renderItem={renderQuestionItem}
          keyExtractor={(item, index) => `tab-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsList}
          testID="question-tabs-list"
        />
      </View>

      {/* Current question */}
      <ScrollView 
        ref={questionScrollViewRef}
        style={styles.questionContainer} 
        contentContainerStyle={styles.questionContent}
      >
        <Text style={[styles.questionNumber, { color: theme.colors.primary }]}>
          Pregunta {currentQuestion.number}
        </Text>
        <Text style={[styles.questionText, { color: theme.colors.text }]}>{currentQuestion.text}</Text>

        <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
          Selecciona la respuesta correcta:
        </Text>

        {currentQuestion.options.map((option, optIndex) => (
          <TouchableOpacity
            key={`opt-${currentIndex}-${option.letter}-${optIndex}`}
            style={[
              styles.optionButton,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              answers[currentQuestion.id] === option.letter && [styles.optionSelected, { borderColor: theme.colors.success, backgroundColor: theme.colors.successLight }]
            ]}
            onPress={() => handleSelectAnswer(currentQuestion.id, option.letter)}
          >
            <View style={[
              styles.optionLetter,
              { backgroundColor: theme.colors.badge },
              answers[currentQuestion.id] === option.letter && [styles.optionLetterSelected, { backgroundColor: theme.colors.success }]
            ]}>
              <Text style={[
                styles.optionLetterText,
                { color: theme.colors.textSecondary },
                answers[currentQuestion.id] === option.letter && styles.optionLetterTextSelected
              ]}>
                {option.letter.toUpperCase()}
              </Text>
            </View>
            <Text style={[
              styles.optionText,
              { color: theme.colors.text },
              answers[currentQuestion.id] === option.letter && [styles.optionTextSelected, { color: theme.colors.success }]
            ]}>
              {option.text}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={[styles.navigationContainer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          testID="config-prev-button"
          style={[styles.navButton, { backgroundColor: theme.colors.badge }, currentIndex === 0 && styles.navButtonDisabled]}
          onPress={() => currentIndex > 0 && goToQuestion(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          <Text style={[styles.navButtonText, { color: theme.colors.text }]}>← Anterior</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="config-save-button"
          style={[styles.navButton, styles.saveButton, { backgroundColor: theme.colors.success }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={theme.colors.textInverse} size="small" />
          ) : (
            <View style={styles.saveButtonContent}>
              <SaveIcon size={18} color={theme.colors.textInverse} />
              <Text style={[styles.navButtonText, styles.saveButtonText]}> Guardar</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          testID="config-next-button"
          style={[
            styles.navButton,
            { backgroundColor: theme.colors.badge },
            currentIndex === test.questions.length - 1 && styles.navButtonDisabled
          ]}
          onPress={() => currentIndex < test.questions.length - 1 && goToQuestion(currentIndex + 1)}
          disabled={currentIndex === test.questions.length - 1}
        >
          <Text style={[styles.navButtonText, { color: theme.colors.text }]}>Siguiente →</Text>
        </TouchableOpacity>
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
  loadingText: {
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  progressContainer: {
    padding: 12,
    borderBottomWidth: 1,
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
  progressText: {
    textAlign: 'center',
    marginTop: 6,
    fontSize: 13,
  },
  tabsContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tabsList: {
    paddingHorizontal: 12,
  },
  questionTab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  questionTabSelected: {
  },
  questionTabConfigured: {
  },
  questionTabText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  questionTabTextSelected: {
    color: '#fff',
  },
  checkMark: {
    position: 'absolute',
    top: -2,
    right: -2,
    fontSize: 12,
    color: '#fff',
    borderRadius: 10,
    width: 16,
    height: 16,
    textAlign: 'center',
    lineHeight: 16,
  },
  questionContainer: {
    flex: 1,
  },
  questionContent: {
    padding: 16,
    paddingBottom: 40,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    marginBottom: 20,
    lineHeight: 26,
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
  },
  optionSelected: {
  },
  optionLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetterSelected: {
  },
  optionLetterText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionLetterTextSelected: {
    color: '#fff',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
  },
  optionTextSelected: {
    fontWeight: '500',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveButton: {
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
  },
});
