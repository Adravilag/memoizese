import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTestById } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import { BookOpenIcon, ClipboardEditIcon, SettingsIcon, EditIcon } from '../components/Icons';
import { TestDetailsSkeleton } from '../components/Skeleton';

export default function TestDetailsScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { testId } = route.params;
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTest();
  }, []);

  // Recargar test cuando se vuelve de otra pantalla (ej: ManageQuestions)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTest();
    });
    return unsubscribe;
  }, [navigation]);

  const loadTest = async () => {
    try {
      const loadedTest = await getTestById(testId);
      setTest(loadedTest);
    } catch (error) {
      console.error('Error cargando test:', error);
      Alert.alert('Error', 'No se pudo cargar el test');
    }
    setLoading(false);
  };

  const handleStartTest = (mode) => {
    navigation.navigate('TakeTest', { 
      testId, 
      mode // 'practice' o 'exam'
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <TestDetailsSkeleton />
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']} mode="padding">
      <ScrollView 
        style={styles.scrollView} 
        nestedScrollEnabled={true}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.testName}>{test.name}</Text>
        <Text style={styles.testInfo}>
          {test.questions.length} preguntas
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Modo de estudio</Text>
        
        <TouchableOpacity
          style={[styles.modeCard, { backgroundColor: theme.colors.card, borderLeftColor: theme.colors.success }]}
          onPress={() => handleStartTest('practice')}
        >
          <View style={[styles.modeIcon, { backgroundColor: theme.colors.primaryLight }]}>
            <BookOpenIcon size={28} color={theme.colors.primary} />
          </View>
          <View style={styles.modeContent}>
            <Text style={[styles.modeTitle, { color: theme.colors.text }]}>Modo Práctica</Text>
            <Text style={[styles.modeDescription, { color: theme.colors.textSecondary }]}>
              Ve la respuesta correcta después de cada pregunta. Ideal para aprender.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeCard, { backgroundColor: theme.colors.card, borderLeftColor: theme.colors.warning }]}
          onPress={() => handleStartTest('exam')}
        >
          <View style={[styles.modeIcon, { backgroundColor: theme.colors.warningLight }]}>
            <ClipboardEditIcon size={28} color={theme.colors.warning} />
          </View>
          <View style={styles.modeContent}>
            <Text style={[styles.modeTitle, { color: theme.colors.text }]}>Modo Examen</Text>
            <Text style={[styles.modeDescription, { color: theme.colors.textSecondary }]}>
              Responde todas las preguntas y ve los resultados al final.
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Opciones</Text>
        
        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => navigation.navigate('ConfigureAnswers', { testId })}
        >
          <SettingsIcon size={20} color={theme.colors.textSecondary} />
          <Text style={[styles.optionText, { color: theme.colors.text }]}> Editar respuestas correctas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, marginTop: 10 }]}
          onPress={() => navigation.navigate('ManageQuestions', { testId })}
        >
          <EditIcon size={20} color={theme.colors.textSecondary} />
          <Text style={[styles.optionText, { color: theme.colors.text }]}> Gestionar preguntas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Vista previa de preguntas</Text>
        {test.questions.slice(0, 5).map((q, index) => (
          <View key={`q-${q.id}-${index}`} style={[styles.previewQuestion, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.previewNumber, { color: theme.colors.primary }]}>{q.number}.</Text>
            <Text style={[styles.previewText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              {q.text}
            </Text>
          </View>
        ))}
        {test.questions.length > 5 && (
          <Text style={[styles.moreText, { color: theme.colors.textMuted }]}>
            ... y {test.questions.length - 5} preguntas más
          </Text>
        )}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
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
    padding: 20,
    paddingTop: 10,
  },
  testName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  testInfo: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modeCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
  },
  practiceCard: {
  },
  examCard: {
  },
  modeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modeIconText: {
    fontSize: 24,
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
  },
  previewSection: {
    padding: 16,
    paddingTop: 0,
  },
  previewQuestion: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  previewNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    width: 30,
  },
  previewText: {
    flex: 1,
    fontSize: 14,
  },
  moreText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
});
