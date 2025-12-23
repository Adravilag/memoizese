/**
 * Dataset Service
 * Servicio para descargar mazos/tests desde GitHub
 */

// Configuración del repositorio
const GITHUB_CONFIG = {
  owner: 'Adravilag',
  repo: 'memoizese',
  branch: 'main',
  datasetsPath: 'datasets',
};

// URLs base
const RAW_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.datasetsPath}`;
const CDN_BASE_URL = `https://cdn.jsdelivr.net/gh/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}@${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.datasetsPath}`;

// Usar RAW para evitar caché del CDN (cambiar a CDN_BASE_URL para producción)
const BASE_URL = RAW_BASE_URL;

/**
 * Obtiene el catálogo de datasets disponibles
 */
export const fetchCatalog = async () => {
  try {
    const response = await fetch(`${BASE_URL}/catalog.json`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const catalog = await response.json();
    return catalog;
  } catch (error) {
    console.error('Error fetching catalog:', error);
    throw new Error('No se pudo obtener el catálogo de datasets. Verifica tu conexión a internet.');
  }
};

/**
 * Descarga un dataset específico
 * @param {string} filePath - Ruta relativa del archivo en el repo
 */
export const fetchDataset = async (filePath) => {
  try {
    const response = await fetch(`${BASE_URL}/${filePath}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const content = await response.text();
    return content;
  } catch (error) {
    console.error('Error fetching dataset:', error);
    throw new Error('No se pudo descargar el dataset. Verifica tu conexión a internet.');
  }
};

/**
 * Parsea un archivo de vocabulario .txt a formato de preguntas
 */
export const parseVocabularyFile = (content) => {
  const questions = [];
  const blocks = content.split(/(?=\n\d+\.)/);
  
  for (const block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock || trimmedBlock.startsWith('#')) continue;
    
    // Extraer número de pregunta
    const numMatch = trimmedBlock.match(/^(\d+)\.\s*/);
    if (!numMatch) continue;
    
    const number = parseInt(numMatch[1]);
    
    // Extraer texto de la pregunta
    const questionTextMatch = trimmedBlock.match(/^\d+\.\s*(.+?)(?=\n[a-d]\))/s);
    if (!questionTextMatch) continue;
    
    const questionText = questionTextMatch[1].trim();
    
    // Extraer opciones
    const options = [];
    const optionMatches = [...trimmedBlock.matchAll(/([a-d])\)\s*(.+?)(?=\n[a-d]\)|$)/gs)];
    
    for (const match of optionMatches) {
      const letter = match[1];
      const text = match[2].trim();
      if (text) {
        options.push({ letter, text });
      }
    }
    
    // Verificar que hay al menos 2 opciones
    if (options.length >= 2 && questionText) {
      questions.push({
        id: `q${number}`,
        number,
        text: questionText,
        options,
        correctAnswer: 'b', // La respuesta correcta siempre es 'b' en estos tests
      });
    }
  }
  
  return questions;
};

/**
 * Descarga y parsea un dataset completo, listo para usar como test
 * @param {Object} datasetInfo - Info del dataset del catálogo
 */
export const downloadAndParseDataset = async (datasetInfo) => {
  try {
    const content = await fetchDataset(datasetInfo.file);
    const questions = parseVocabularyFile(content);
    
    return {
      id: datasetInfo.id,
      name: datasetInfo.name,
      description: datasetInfo.description,
      category: datasetInfo.category,
      level: datasetInfo.level,
      isDownloaded: true,
      downloadedAt: new Date().toISOString(),
      version: datasetInfo.version,
      questions,
    };
  } catch (error) {
    console.error('Error downloading and parsing dataset:', error);
    throw error;
  }
};

/**
 * Descarga y parsea un mazo (deck) de flashcards
 * @param {Object} datasetInfo - Info del deck del catálogo
 */
export const downloadAndParseDeck = async (datasetInfo) => {
  try {
    const content = await fetchDataset(datasetInfo.file);
    const deckData = JSON.parse(content);
    
    return {
      id: datasetInfo.id,
      name: deckData.name || datasetInfo.name,
      description: deckData.description || datasetInfo.description,
      category: datasetInfo.category,
      level: datasetInfo.level,
      isDownloaded: true,
      downloadedAt: new Date().toISOString(),
      version: datasetInfo.version,
      cards: deckData.cards.map((card, index) => ({
        id: `card_${index + 1}`,
        front: card.front,
        back: card.back,
        // Campos para el algoritmo SM-2
        repetitions: 0,
        easeFactor: 2.5,
        interval: 0,
        nextReview: null,
      })),
    };
  } catch (error) {
    console.error('Error downloading and parsing deck:', error);
    throw error;
  }
};

/**
 * Descarga cualquier tipo de contenido (test o deck)
 * @param {Object} datasetInfo - Info del dataset del catálogo
 */
export const downloadContent = async (datasetInfo) => {
  if (datasetInfo.type === 'deck') {
    return downloadAndParseDeck(datasetInfo);
  } else {
    return downloadAndParseDataset(datasetInfo);
  }
};

/**
 * Verifica si hay conexión a internet probando el catálogo
 */
export const checkConnection = async () => {
  try {
    const response = await fetch(`${BASE_URL}/catalog.json`, {
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Obtiene la URL de un archivo específico (útil para debug)
 */
export const getFileUrl = (filePath) => {
  return `${BASE_URL}/${filePath}`;
};

export default {
  fetchCatalog,
  fetchDataset,
  parseVocabularyFile,
  downloadAndParseDataset,
  downloadAndParseDeck,
  downloadContent,
  checkConnection,
  getFileUrl,
  GITHUB_CONFIG,
};
