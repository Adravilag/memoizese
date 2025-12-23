import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '../utils/storage';
import { CheckCircleIcon, RefreshIcon, CloudDownloadIcon, ChevronRightIcon } from '../components/Icons';

export default function SettingsScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = await getSettings();
      setSettings(currentSettings);
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validar valores
      if (settings.newCardsPerDay < 1 || settings.newCardsPerDay > 200) {
        Alert.alert('Error', 'Las tarjetas nuevas por día deben estar entre 1 y 200');
        return;
      }
      if (settings.reviewsPerDay < 1 || settings.reviewsPerDay > 500) {
        Alert.alert('Error', 'Los repasos por día deben estar entre 1 y 500');
        return;
      }

      await saveSettings(settings);
      setHasChanges(false);
      Alert.alert('✅ Guardado', 'La configuración se ha guardado correctamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Restablecer configuración',
      '¿Estás seguro de que quieres volver a los valores predeterminados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: () => {
            setSettings(DEFAULT_SETTINGS);
            setHasChanges(true);
          },
        },
      ]
    );
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleNumberChange = (key, text, min, max) => {
    const num = parseInt(text, 10);
    if (!isNaN(num)) {
      updateSetting(key, Math.min(max, Math.max(min, num)));
    } else if (text === '') {
      updateSetting(key, min);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Cargando configuración...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Sección: Límites diarios */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            📊 Límites Diarios
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Controla cuántas tarjetas estudias cada día para evitar sobrecarga
          </Text>

          {/* Tarjetas nuevas por día */}
          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingHeader}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                🆕 Tarjetas nuevas por día
              </Text>
              <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={String(settings.newCardsPerDay)}
                  onChangeText={(text) => handleNumberChange('newCardsPerDay', text, 1, 200)}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>
            <Text style={[styles.settingHint, { color: theme.colors.textSecondary }]}>
              Máximo de tarjetas que no has visto nunca (1-200). Recomendado: 20-30
            </Text>
            
            {/* Botones rápidos */}
            <View style={styles.quickButtons}>
              {[10, 20, 30, 50].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.quickButton,
                    { 
                      backgroundColor: settings.newCardsPerDay === val 
                        ? theme.colors.primary 
                        : theme.colors.background,
                      borderColor: theme.colors.border,
                    }
                  ]}
                  onPress={() => updateSetting('newCardsPerDay', val)}
                >
                  <Text style={[
                    styles.quickButtonText,
                    { color: settings.newCardsPerDay === val ? '#fff' : theme.colors.text }
                  ]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Repasos por día */}
          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingHeader}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                🔄 Repasos por día
              </Text>
              <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={String(settings.reviewsPerDay)}
                  onChangeText={(text) => handleNumberChange('reviewsPerDay', text, 1, 500)}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>
            <Text style={[styles.settingHint, { color: theme.colors.textSecondary }]}>
              Máximo de tarjetas a repasar (ya estudiadas). Recomendado: 100-150
            </Text>
            
            {/* Botones rápidos */}
            <View style={styles.quickButtons}>
              {[50, 100, 150, 200].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.quickButton,
                    { 
                      backgroundColor: settings.reviewsPerDay === val 
                        ? theme.colors.primary 
                        : theme.colors.background,
                      borderColor: theme.colors.border,
                    }
                  ]}
                  onPress={() => updateSetting('reviewsPerDay', val)}
                >
                  <Text style={[
                    styles.quickButtonText,
                    { color: settings.reviewsPerDay === val ? '#fff' : theme.colors.text }
                  ]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Info card */}
          <View style={[styles.infoCard, { backgroundColor: isDark ? '#1a2733' : '#E3F2FD' }]}>
            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
              💡 ¿Cómo funciona?
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              • <Text style={{ fontWeight: 'bold' }}>Tarjetas nuevas:</Text> Palabras que nunca has estudiado{'\n'}
              • <Text style={{ fontWeight: 'bold' }}>Repasos:</Text> Tarjetas que necesitan repaso según el algoritmo SM-2{'\n'}
              • El total máximo por día es: {settings.newCardsPerDay + settings.reviewsPerDay} tarjetas
            </Text>
          </View>
        </View>

        {/* Sección: Apariencia */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🎨 Apariencia
          </Text>

          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  {isDark ? '🌙' : '☀️'} Modo oscuro
                </Text>
                <Text style={[styles.settingHint, { color: theme.colors.textSecondary }]}>
                  {isDark ? 'Tema oscuro activado' : 'Tema claro activado'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#767577', true: theme.colors.primary }}
                thumbColor={isDark ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Sección: Estudio */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            📚 Estudio
          </Text>

          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  🔊 Mostrar pronunciación
                </Text>
                <Text style={[styles.settingHint, { color: theme.colors.textSecondary }]}>
                  Muestra la pronunciación en las tarjetas
                </Text>
              </View>
              <Switch
                value={settings.showPronunciation !== false}
                onValueChange={(val) => updateSetting('showPronunciation', val)}
                trackColor={{ false: '#767577', true: theme.colors.primary }}
                thumbColor={settings.showPronunciation !== false ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  ✨ Animación de tarjetas
                </Text>
                <Text style={[styles.settingHint, { color: theme.colors.textSecondary }]}>
                  Efecto de flip al revelar respuesta
                </Text>
              </View>
              <Switch
                value={settings.enableAnimations !== false}
                onValueChange={(val) => updateSetting('enableAnimations', val)}
                trackColor={{ false: '#767577', true: theme.colors.primary }}
                thumbColor={settings.enableAnimations !== false ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Sección: Contenido Online */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            📦 Contenido Online
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Descarga nuevos mazos y tests desde nuestro repositorio
          </Text>

          <TouchableOpacity
            style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('DownloadDatasets')}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CloudDownloadIcon size={24} color={theme.colors.primary} />
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                    Descargar Datasets
                  </Text>
                </View>
                <Text style={[styles.settingHint, { color: theme.colors.textSecondary }]}>
                  Vocabulario, gramática y más contenido actualizado
                </Text>
              </View>
              <ChevronRightIcon size={24} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Botón restablecer */}
        <TouchableOpacity
          style={[styles.resetButton, { borderColor: theme.colors.border }]}
          onPress={handleReset}
        >
          <RefreshIcon size={20} color={theme.colors.textSecondary} />
          <Text style={[styles.resetButtonText, { color: theme.colors.textSecondary }]}>
            Restablecer valores predeterminados
          </Text>
        </TouchableOpacity>

        {/* Espacio inferior */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón guardar flotante */}
      {hasChanges && (
        <View style={[styles.saveButtonContainer, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSave}
          >
            <CheckCircleIcon size={22} color="#fff" />
            <Text style={styles.saveButtonText}>Guardar cambios</Text>
          </TouchableOpacity>
        </View>
      )}
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
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  settingCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingHint: {
    fontSize: 13,
    marginTop: 4,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 70,
  },
  input: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  quickButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
