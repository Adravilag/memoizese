import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { DownloadIcon, CheckCircleIcon, CloudIcon, RefreshIcon } from '../components/Icons';
import { 
  fetchCatalog, 
  downloadAndParseDataset, 
  checkConnection 
} from '../utils/datasetService';
import { saveTest, getTests } from '../utils/storage';

export default function DownloadDatasetsScreen({ navigation }) {
  const { theme } = useTheme();
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [downloadedIds, setDownloadedIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const loadCatalog = useCallback(async () => {
    try {
      setError(null);
      const isConnected = await checkConnection();
      
      if (!isConnected) {
        setError('Sin conexión a internet. Verifica tu conexión e intenta de nuevo.');
        setLoading(false);
        return;
      }
      
      const data = await fetchCatalog();
      setCatalog(data);
      
      // Cargar tests ya descargados (solo los que tienen isDownloaded: true)
      const existingTests = await getTests();
      const downloadedTests = existingTests.filter(t => t.isDownloaded === true);
      const existingIds = new Set(downloadedTests.map(t => t.id));
      setDownloadedIds(existingIds);
      
    } catch (err) {
      setError(err.message || 'Error al cargar el catálogo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCatalog();
  }, [loadCatalog]);

  const handleDownload = async (dataset) => {
    if (downloading) return;
    
    try {
      setDownloading(dataset.id);
      
      const parsedTest = await downloadAndParseDataset(dataset);
      
      // Guardar como test
      await saveTest(parsedTest);
      
      // Actualizar lista de descargados
      setDownloadedIds(prev => new Set([...prev, dataset.id]));
      
      Alert.alert(
        '✅ Descargado',
        `"${dataset.name}" se ha añadido a tus tests.`,
        [{ text: 'OK' }]
      );
      
    } catch (err) {
      Alert.alert(
        'Error',
        `No se pudo descargar "${dataset.name}". ${err.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAll = async (categoryId) => {
    const datasetsToDownload = catalog.datasets.filter(d => 
      (categoryId === 'all' || d.category === categoryId) && 
      !downloadedIds.has(d.id)
    );
    
    if (datasetsToDownload.length === 0) {
      Alert.alert('Info', 'Ya tienes todos los datasets de esta categoría.');
      return;
    }
    
    Alert.alert(
      'Descargar todos',
      `¿Descargar ${datasetsToDownload.length} datasets?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Descargar',
          onPress: async () => {
            for (const dataset of datasetsToDownload) {
              try {
                setDownloading(dataset.id);
                const parsedTest = await downloadAndParseDataset(dataset);
                await saveTest(parsedTest);
                setDownloadedIds(prev => new Set([...prev, dataset.id]));
              } catch (err) {
                console.error(`Error downloading ${dataset.id}:`, err);
              }
            }
            setDownloading(null);
            Alert.alert('✅ Completado', `Se han descargado ${datasetsToDownload.length} datasets.`);
          },
        },
      ]
    );
  };

  const filteredDatasets = catalog?.datasets?.filter(d => 
    selectedCategory === 'all' || d.category === selectedCategory
  ) || [];

  const styles = createStyles(theme.colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando catálogo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerContent}>
          <CloudIcon size={64} color={theme.colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCatalog}>
            <RefreshIcon size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header con info */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 Datasets Disponibles</Text>
        <Text style={styles.headerSubtitle}>
          {catalog?.datasets?.length || 0} datasets • 
          Actualizado: {catalog?.lastUpdated || 'N/A'}
        </Text>
      </View>

      {/* Filtros de categoría */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === 'all' && styles.categoryChipActive
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[
            styles.categoryChipText,
            selectedCategory === 'all' && styles.categoryChipTextActive
          ]}>
            Todos
          </Text>
        </TouchableOpacity>
        
        {catalog?.categories?.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === cat.id && styles.categoryChipTextActive
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Botón descargar todos */}
      <TouchableOpacity 
        style={styles.downloadAllButton}
        onPress={() => handleDownloadAll(selectedCategory)}
        disabled={downloading !== null}
      >
        <DownloadIcon size={18} color="#fff" />
        <Text style={styles.downloadAllText}>
          Descargar todos ({filteredDatasets.filter(d => !downloadedIds.has(d.id)).length})
        </Text>
      </TouchableOpacity>

      {/* Lista de datasets */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {filteredDatasets.map(dataset => {
          const isDownloaded = downloadedIds.has(dataset.id);
          const isDownloading = downloading === dataset.id;
          
          return (
            <View key={dataset.id} style={styles.datasetCard}>
              <View style={styles.datasetInfo}>
                <Text style={styles.datasetName}>{dataset.name}</Text>
                <Text style={styles.datasetDescription}>{dataset.description}</Text>
                <View style={styles.datasetMeta}>
                  <Text style={styles.datasetMetaText}>
                    📝 {dataset.questionCount} preguntas
                  </Text>
                  <Text style={styles.datasetMetaText}>
                    📊 {dataset.level}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.downloadButton,
                  isDownloaded && styles.downloadedButton,
                  isDownloading && styles.downloadingButton,
                ]}
                onPress={() => !isDownloaded && handleDownload(dataset)}
                disabled={isDownloaded || isDownloading}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : isDownloaded ? (
                  <CheckCircleIcon size={24} color="#fff" />
                ) : (
                  <DownloadIcon size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textSecondary,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  categoryScroll: {
    maxHeight: 50,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  categoryChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: theme.text,
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  downloadAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.success,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  downloadAllText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  datasetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  datasetInfo: {
    flex: 1,
  },
  datasetName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  datasetDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  datasetMeta: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  datasetMetaText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  downloadButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  downloadedButton: {
    backgroundColor: theme.success,
  },
  downloadingButton: {
    backgroundColor: theme.warning,
  },
});
