import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTestById, updateTest } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import { 
  TrashIcon, 
  ChevronUpIcon, 
  ChevronDownIcon, 
  ShuffleIcon,
  SaveIcon,
  ChevronRightIcon 
} from '../components/Icons';

export default function ManageQuestionsScreen({ route, navigation }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { testId } = route.params;
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  useEffect(() => {
    loadTest();
  }, []);

  useEffect(() => {
    // Prevenir salir sin guardar
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasChanges) return;

      e.preventDefault();
      Alert.alert(
        'Cambios sin guardar',
        '¿Deseas guardar los cambios antes de salir?',
        [
          { text: 'No guardar', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Guardar', onPress: async () => {
            await handleSave();
            navigation.dispatch(e.data.action);
          }},
        ]
      );
    });

    return unsubscribe;
  }, [navigation, hasChanges]);

  const loadTest = async () => {
    try {
      const loadedTest = await getTestById(testId);
      setTest(loadedTest);
      setQuestions([...loadedTest.questions]);
    } catch (error) {
      console.error('Error cargando test:', error);
      Alert.alert('Error', 'No se pudo cargar el test');
    }
    setLoading(false);
  };

  const handleDeleteQuestion = (questionId) => {
    Alert.alert(
      'Eliminar pregunta',
      '¿Estás seguro de que quieres eliminar esta pregunta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            const newQuestions = questions.filter(q => q.id !== questionId);
            // Renumerar preguntas
            const renumbered = newQuestions.map((q, idx) => ({
              ...q,
              number: idx + 1
            }));
            setQuestions(renumbered);
            setHasChanges(true);
          }
        },
      ]
    );
  };

  const handleMoveQuestion = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const newQuestions = [...questions];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[newIndex];
    newQuestions[newIndex] = temp;

    // Renumerar
    const renumbered = newQuestions.map((q, idx) => ({
      ...q,
      number: idx + 1
    }));

    setQuestions(renumbered);
    setHasChanges(true);
  };

  const handleShuffleAnswers = (questionIndex) => {
    const newQuestions = [...questions];
    const question = { ...newQuestions[questionIndex] };
    
    // Guardar la respuesta correcta antes de mezclar
    const correctAnswerText = question.correctAnswer !== null 
      ? question.options[question.correctAnswer] 
      : null;
    
    // Fisher-Yates shuffle
    const shuffledOptions = [...question.options];
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }
    
    question.options = shuffledOptions;
    
    // Actualizar el índice de la respuesta correcta
    if (correctAnswerText !== null) {
      question.correctAnswer = shuffledOptions.findIndex(opt => opt === correctAnswerText);
    }
    
    newQuestions[questionIndex] = question;
    setQuestions(newQuestions);
    setHasChanges(true);
    
    Alert.alert('', '✓ Respuestas mezcladas aleatoriamente');
  };

  const handleShuffleAllAnswers = () => {
    Alert.alert(
      'Mezclar todas las respuestas',
      '¿Deseas mezclar aleatoriamente las respuestas de TODAS las preguntas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Mezclar todas', 
          onPress: () => {
            const newQuestions = questions.map(question => {
              const correctAnswerText = question.correctAnswer !== null 
                ? question.options[question.correctAnswer] 
                : null;
              
              const shuffledOptions = [...question.options];
              for (let i = shuffledOptions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
              }
              
              let newCorrectAnswer = question.correctAnswer;
              if (correctAnswerText !== null) {
                newCorrectAnswer = shuffledOptions.findIndex(opt => opt === correctAnswerText);
              }
              
              return {
                ...question,
                options: shuffledOptions,
                correctAnswer: newCorrectAnswer
              };
            });
            
            setQuestions(newQuestions);
            setHasChanges(true);
            Alert.alert('', '✓ Se mezclaron las respuestas de todas las preguntas');
          }
        },
      ]
    );
  };

  const handleShuffleQuestionOrder = () => {
    Alert.alert(
      'Reordenar preguntas',
      '¿Deseas cambiar aleatoriamente el orden de las preguntas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Reordenar', 
          onPress: () => {
            const shuffled = [...questions];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            
            // Renumerar
            const renumbered = shuffled.map((q, idx) => ({
              ...q,
              number: idx + 1
            }));
            
            setQuestions(renumbered);
            setHasChanges(true);
            Alert.alert('', '✓ Preguntas reordenadas aleatoriamente');
          }
        },
      ]
    );
  };

  const handleSave = async () => {
    try {
      await updateTest(testId, { questions });
      setHasChanges(false);
      Alert.alert('', '✓ Cambios guardados correctamente');
    } catch (error) {
      console.error('Error guardando:', error);
      Alert.alert('Error', 'No se pudieron guardar los cambios');
    }
  };

  const toggleExpand = (questionId) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Cargando...</Text>
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header con acciones globales */}
      <View style={[styles.actionsHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.questionCount, { color: theme.colors.textSecondary }]}>
          {questions.length} preguntas
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.primaryLight }]}
            onPress={handleShuffleQuestionOrder}
          >
            <ShuffleIcon size={18} color={theme.colors.primary} />
            <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>Reordenar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.warningLight }]}
            onPress={handleShuffleAllAnswers}
          >
            <ShuffleIcon size={18} color={theme.colors.warning} />
            <Text style={[styles.headerButtonText, { color: theme.colors.warning }]}>Mezclar resp.</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}>
        {questions.map((question, index) => (
          <View 
            key={question.id} 
            style={[styles.questionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            {/* Cabecera de la pregunta */}
            <TouchableOpacity 
              style={styles.questionHeader}
              onPress={() => toggleExpand(question.id)}
            >
              <View style={styles.questionTitleContainer}>
                <Text style={[styles.questionNumber, { color: theme.colors.primary }]}>
                  {question.number}.
                </Text>
                <Text 
                  style={[styles.questionText, { color: theme.colors.text }]} 
                  numberOfLines={expandedQuestion === question.id ? undefined : 2}
                >
                  {question.text}
                </Text>
              </View>
              <ChevronRightIcon 
                size={20} 
                color={theme.colors.textMuted} 
                style={{ transform: [{ rotate: expandedQuestion === question.id ? '90deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {/* Contenido expandido */}
            {expandedQuestion === question.id && (
              <View style={styles.expandedContent}>
                {/* Opciones de respuesta */}
                <View style={[styles.optionsContainer, { borderTopColor: theme.colors.border }]}>
                  <Text style={[styles.optionsLabel, { color: theme.colors.textSecondary }]}>Respuestas:</Text>
                  {question.options.map((option, optIndex) => (
                    <View 
                      key={optIndex} 
                      style={[
                        styles.optionItem,
                        question.correctAnswer === optIndex && { backgroundColor: theme.colors.successLight }
                      ]}
                    >
                      <Text style={[styles.optionLetter, { color: theme.colors.textSecondary }]}>
                        {String.fromCharCode(65 + optIndex)})
                      </Text>
                      <Text 
                        style={[
                          styles.optionText, 
                          { color: question.correctAnswer === optIndex ? theme.colors.success : theme.colors.text }
                        ]}
                      >
                        {typeof option === 'object' ? option.text : option}
                        {question.correctAnswer === optIndex && ' ✓'}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Botones de acción */}
                <View style={styles.actionButtonsContainer}>
                  {/* Primera fila: Subir y Bajar */}
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
                      onPress={() => handleMoveQuestion(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUpIcon size={20} color={index === 0 ? theme.colors.textMuted : theme.colors.primary} />
                      <Text style={[styles.actionButtonText, { color: index === 0 ? theme.colors.textMuted : theme.colors.primary }]}>
                        Subir
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
                      onPress={() => handleMoveQuestion(index, 'down')}
                      disabled={index === questions.length - 1}
                    >
                      <ChevronDownIcon size={20} color={index === questions.length - 1 ? theme.colors.textMuted : theme.colors.primary} />
                      <Text style={[styles.actionButtonText, { color: index === questions.length - 1 ? theme.colors.textMuted : theme.colors.primary }]}>
                        Bajar
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Segunda fila: Eliminar y Mezclar */}
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.colors.errorLight }]}
                      onPress={() => handleDeleteQuestion(question.id)}
                    >
                      <TrashIcon size={20} color={theme.colors.error} />
                      <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>Eliminar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.colors.warningLight }]}
                      onPress={() => handleShuffleAnswers(index)}
                    >
                      <ShuffleIcon size={20} color={theme.colors.warning} />
                      <Text style={[styles.actionButtonText, { color: theme.colors.warning }]}>Mezclar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}

        {questions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              No hay preguntas en este test
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Botón guardar flotante */}
      {hasChanges && (
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSave}
        >
          <SaveIcon size={24} color="#fff" />
          <Text style={styles.saveButtonText}>Guardar cambios</Text>
        </TouchableOpacity>
      )}
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
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
  actionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  questionCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  headerButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    // paddingBottom se aplica dinámicamente con insets
  },
  questionCard: {
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  questionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    width: 30,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  expandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  optionsContainer: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 12,
  },
  optionsLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionItem: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '600',
    width: 24,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
  },
  actionButtonsContainer: {
    gap: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  saveButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
