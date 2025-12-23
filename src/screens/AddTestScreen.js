import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { parseTextContent, validateTestFormat } from '../utils/pdfParser';
import { parseTextTest, validateTextTest } from '../utils/textParser';
import { saveTest } from '../utils/storage';
import PDFTextExtractor from '../components/PDFTextExtractor';
import { useTheme } from '../context/ThemeContext';
import { 
  CheckCircleIcon, FileTextIcon, FolderIcon, SaveIcon, BookOpenIcon 
} from '../components/Icons';

export default function AddTestScreen({ navigation }) {
  const { theme } = useTheme();
  const [testName, setTestName] = useState('');
  const [manualText, setManualText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState(null);
  const [showPDFExtractor, setShowPDFExtractor] = useState(false);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');

  const handlePDFTextExtracted = (text, pages) => {
    setShowPDFExtractor(false);
    setPdfBase64(null);
    
    Alert.alert(
      'PDF procesado',
      `Se extrajeron ${pages} página(s). Procesando preguntas...`,
      [{ text: 'OK' }]
    );
    
    setManualText(text);
    processContent(text, pdfFileName);
  };

  const handlePDFError = (error) => {
    setShowPDFExtractor(false);
    setPdfBase64(null);
    setLoading(false);
    
    Alert.alert(
      'Error al procesar PDF',
      `${error}\n\nPuedes copiar el texto del PDF manualmente y pegarlo en el área de texto.`,
      [{ text: 'Entendido' }]
    );
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setLoading(true);

      if (file.mimeType === 'text/plain' || file.name.endsWith('.txt')) {
        const content = await FileSystem.readAsStringAsync(file.uri);
        
        // Detectar si es formato plantilla (tiene BOLD_ANSWERS)
        const isTemplateFormat = content.match(/\[BOLD_ANSWERS?:/i);
        
        if (isTemplateFormat) {
          processTemplateContent(content, file.name);
        } else {
          processContent(content, file.name);
        }
      } else if (file.mimeType === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Archivo PDF - extraer texto con PDF.js
        setPdfFileName(file.name);
        
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: 'base64',
        });
        
        setPdfBase64(base64);
        setShowPDFExtractor(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'No se pudo leer el archivo');
      setLoading(false);
    }
  };

  // Procesar archivo con formato de plantilla (R: o *a))
  const processTemplateContent = (content, fileName = 'Test') => {
    try {
      const validation = validateTextTest(content);
      
      if (!validation.valid) {
        Alert.alert('Formato inválido', validation.errors.join('\n'));
        setLoading(false);
        return;
      }
      
      const testData = parseTextTest(content);
      
      setParsedQuestions(testData.questions);
      setTestName(testData.name || fileName.replace(/\.[^/.]+$/, ''));
      setManualText(content);
      
      let message = `✅ ${testData.questions.length} preguntas detectadas con respuestas.`;
      
      if (validation.warnings.length > 0) {
        message += `\n\n⚠️ Avisos:\n${validation.warnings.join('\n')}`;
      }
      
      Alert.alert('Plantilla procesada', message);
      setLoading(false);
    } catch (error) {
      console.error('Error parsing template:', error);
      Alert.alert('Error', 'No se pudo procesar la plantilla');
      setLoading(false);
    }
  };

  const processContent = (content, fileName = 'Test') => {
    try {
      // Extraer info de debug de fuentes si existe
      const debugFontsMatch = content.match(/\[DEBUG_FONTS:([^\]]*)\]/);
      const detectedFonts = debugFontsMatch ? debugFontsMatch[1] : '';
      
      // Extraer preguntas sin respuesta detectada
      const missingMatch = content.match(/\[MISSING_ANSWERS:([^\]]*)\]/);
      const missingAnswers = missingMatch ? missingMatch[1] : '';
      
      // Limpiar marcadores de debug del contenido
      const cleanContent = content
        .replace(/\[DEBUG_FONTS:[^\]]*\]/g, '')
        .replace(/\[MISSING_ANSWERS:[^\]]*\]/g, '');
      
      const questions = parseTextContent(cleanContent);
      const validation = validateTestFormat(questions);

      if (!validation.valid) {
        Alert.alert('Formato inválido', validation.message);
        setLoading(false);
        return;
      }

      setParsedQuestions(questions);
      if (!testName) {
        setTestName(fileName.replace(/\.[^/.]+$/, ''));
      }
      
      // Contar respuestas auto-detectadas
      const autoDetected = questions.filter(q => q.correctAnswer).length;
      let message = validation.message;
      if (autoDetected > 0) {
        message += `\n\n✨ ${autoDetected} respuestas correctas detectadas automáticamente (en negrita)`;
      }
      if (missingAnswers) {
        message += `\n\n⚠️ Preguntas sin respuesta detectada: ${missingAnswers}`;
      }
      if (detectedFonts && autoDetected === 0) {
        message += `\n\n📝 Fuentes en PDF: ${detectedFonts.substring(0, 100)}${detectedFonts.length > 100 ? '...' : ''}`;
      }
      
      Alert.alert('Éxito', message);
    } catch (error) {
      console.error('Error processing content:', error);
      Alert.alert('Error', 'No se pudo procesar el contenido');
    }
    setLoading(false);
  };

  const handleParseManualText = () => {
    if (!manualText.trim()) {
      Alert.alert('Error', 'Por favor ingresa el texto del test');
      return;
    }
    setLoading(true);
    processContent(manualText);
  };

  const handleSaveTest = async () => {
    if (!testName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el test');
      return;
    }

    if (!parsedQuestions || parsedQuestions.length === 0) {
      Alert.alert('Error', 'No hay preguntas para guardar');
      return;
    }

    try {
      setLoading(true);
      const newTest = await saveTest({
        name: testName.trim(),
        questions: parsedQuestions
      });
      
      Alert.alert(
        'Test guardado',
        '¿Deseas configurar las respuestas correctas ahora?',
        [
          {
            text: 'Más tarde',
            onPress: () => navigation.goBack()
          },
          {
            text: 'Configurar ahora',
            onPress: () => {
              navigation.replace('ConfigureAnswers', { testId: newTest.id });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving test:', error);
      Alert.alert('Error', 'No se pudo guardar el test');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]} 
        contentContainerStyle={styles.content}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Nombre del Test</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.inputBackground, 
            borderColor: theme.colors.inputBorder,
            color: theme.colors.text 
          }]}
          placeholder="Ej: Test Administrativo 2024"
          placeholderTextColor={theme.colors.placeholder}
          value={testName}
          onChangeText={setTestName}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FileTextIcon size={18} color={theme.colors.text} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}> Importar desde archivo</Text>
        </View>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={handlePickDocument}>
          <View style={styles.buttonContent}>
            <FolderIcon size={18} color={theme.colors.textInverse} />
            <Text style={[styles.buttonText, { color: theme.colors.textInverse }]}> Seleccionar PDF o TXT</Text>
          </View>
        </TouchableOpacity>
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
          Soporta archivos PDF y de texto (.txt) con preguntas de test
        </Text>
      </View>

      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        <Text style={[styles.dividerText, { color: theme.colors.textMuted }]}>O</Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Pegar texto manualmente</Text>
        <TextInput
          style={[styles.textArea, { 
            backgroundColor: theme.colors.inputBackground, 
            borderColor: theme.colors.inputBorder,
            color: theme.colors.text 
          }]}
          placeholder="Pega aquí el contenido del test..."
          placeholderTextColor={theme.colors.placeholder}
          value={manualText}
          onChangeText={setManualText}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
        />
        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary, { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface }]} 
          onPress={handleParseManualText}
        >
          <Text style={[styles.buttonText, { color: theme.colors.primary }]}>
            Procesar texto
          </Text>
        </TouchableOpacity>
      </View>

      {parsedQuestions && (
        <View style={styles.previewSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Vista previa</Text>
          <View style={[styles.previewCard, { backgroundColor: theme.colors.successLight, borderLeftColor: theme.colors.success }]}>
            <View style={styles.previewHeader}>
              <CheckCircleIcon size={18} color={theme.colors.success} />
              <Text style={[styles.previewText, { color: theme.colors.success }]}>
                {parsedQuestions.length} preguntas encontradas
              </Text>
            </View>
            {parsedQuestions.slice(0, 3).map((q, index) => (
              <Text key={`preview-${q.id}-${index}`} style={[styles.previewQuestion, { color: theme.colors.text }]} numberOfLines={2}>
                {q.number}. {q.text}
              </Text>
            ))}
            {parsedQuestions.length > 3 && (
              <Text style={[styles.previewMore, { color: theme.colors.textSecondary }]}>
                ... y {parsedQuestions.length - 3} preguntas más
              </Text>
            )}
          </View>
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Procesando...</Text>
        </View>
      )}

      {parsedQuestions && parsedQuestions.length > 0 && (
        <TouchableOpacity 
          style={[styles.button, styles.buttonPrimary, { backgroundColor: theme.colors.success }]} 
          onPress={handleSaveTest}
        >
          <View style={styles.buttonContent}>
            <SaveIcon size={18} color={theme.colors.textInverse} />
            <Text style={[styles.buttonText, { color: theme.colors.textInverse }]}> Guardar Test</Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={[styles.helpSection, { backgroundColor: theme.colors.warningLight }]}>
        <View style={styles.helpHeader}>
          <BookOpenIcon size={18} color={theme.colors.warning} />
          <Text style={[styles.helpTitle, { color: theme.colors.warning }]}> Formato esperado:</Text>
        </View>
        <Text style={[styles.helpText, { color: theme.colors.warning }]}>
          • Las preguntas deben empezar con número y punto: 1. 2. 3.{'\n'}
          • Las opciones con letra y paréntesis o punto: a) b) c) d) ó a. b. c. d.{'\n'}
          • Cada pregunta debe tener al menos 2 opciones
        </Text>
      </View>

      {/* Modal para extracción de PDF */}
      <Modal
        visible={showPDFExtractor}
        animationType="slide"
        onRequestClose={() => {
          setShowPDFExtractor(false);
          setPdfBase64(null);
        }}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.modalTitle}>Procesando PDF</Text>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => {
                setShowPDFExtractor(false);
                setPdfBase64(null);
              }}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.modalSubtitle, { backgroundColor: theme.colors.primary }]}>{pdfFileName}</Text>
          
          {pdfBase64 && (
            <PDFTextExtractor
              pdfBase64={pdfBase64}
              onTextExtracted={handlePDFTextExtracted}
              onError={handlePDFError}
            />
          )}
        </View>
      </Modal>
    </ScrollView>
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
  content: {
    padding: 16,
    paddingBottom: 50,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    minHeight: 200,
  },
  button: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonSecondary: {
    borderWidth: 2,
  },
  buttonPrimary: {
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextSecondary: {
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontWeight: 'bold',
  },
  previewSection: {
    marginTop: 20,
  },
  previewCard: {
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  previewQuestion: {
    fontSize: 14,
    marginBottom: 4,
  },
  previewMore: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
  },
  helpSection: {
    marginTop: 30,
    borderRadius: 8,
    padding: 16,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 13,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalClose: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 14,
  },
});
