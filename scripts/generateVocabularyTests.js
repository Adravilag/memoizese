/**
 * Script para generar vocabularyTests.js a partir de los archivos .txt
 * 
 * Uso: node scripts/generateVocabularyTests.js
 */

const fs = require('fs');
const path = require('path');

// Directorio de vocabulario
const VOCABULARY_DIR = path.join(__dirname, '..', 'assets', 'vocabulary');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'utils', 'vocabularyTests.js');

// Mapeo de archivos a emojis y nombres
const FILE_CONFIG = {
  '01_clothes_and_accessories.txt': { emoji: '👕', name: 'Clothes and Accessories', id: 'vocab_01_clothes' },
  '02_colours.txt': { emoji: '🎨', name: 'Colours', id: 'vocab_02_colours' },
  '03_communications_and_technology.txt': { emoji: '📱', name: 'Communications & Technology', id: 'vocab_03_tech' },
  '04_education.txt': { emoji: '📚', name: 'Education', id: 'vocab_04_education' },
  '05_entertainment_and_media.txt': { emoji: '🎬', name: 'Entertainment & Media', id: 'vocab_05_entertainment' },
  '06_environment.txt': { emoji: '🌍', name: 'Environment', id: 'vocab_06_environment' },
  '07_food_and_drink.txt': { emoji: '🍽️', name: 'Food and Drink', id: 'vocab_07_food' },
  '08_health_medicine_exercise.txt': { emoji: '🏥', name: 'Health, Medicine & Exercise', id: 'vocab_08_health' },
  '09_hobbies_and_leisure.txt': { emoji: '🎮', name: 'Hobbies and Leisure', id: 'vocab_09_hobbies' },
  '10_house_and_home.txt': { emoji: '🏠', name: 'House and Home', id: 'vocab_10_house' },
  '11_language.txt': { emoji: '💬', name: 'Language', id: 'vocab_11_language' },
  '12_personal_feelings_opinions_experiences.txt': { emoji: '💭', name: 'Personal Feelings & Opinions', id: 'vocab_12_feelings' },
  '13_places_buildings_countryside.txt': { emoji: '🏛️', name: 'Places, Buildings & Countryside', id: 'vocab_13_places' },
  '14_town_and_city_services.txt': { emoji: '🏙️', name: 'Town and City Services', id: 'vocab_14_city' },
  '15_shopping.txt': { emoji: '🛒', name: 'Shopping', id: 'vocab_15_shopping' },
  '16_sport.txt': { emoji: '⚽', name: 'Sport', id: 'vocab_16_sport' },
  '17_the_natural_world.txt': { emoji: '🌿', name: 'The Natural World', id: 'vocab_17_nature' },
  '18_time_travel_transport.txt': { emoji: '✈️', name: 'Time, Travel & Transport', id: 'vocab_18_travel' },
  '19_weather.txt': { emoji: '🌤️', name: 'Weather', id: 'vocab_19_weather' },
  '20_work_and_jobs.txt': { emoji: '💼', name: 'Work and Jobs', id: 'vocab_20_work' },
};

/**
 * Parsea un archivo .txt de vocabulario
 */
function parseVocabularyFile(content) {
  const questions = [];
  
  // Regex para encontrar preguntas numeradas
  const questionRegex = /(\d+)\.\s+(.+?)(?=\n[a-d]\))/gs;
  const optionsRegex = /([a-d])\)\s*(.+?)(?=\n[a-d]\)|$)/gs;
  
  // Dividir por preguntas (buscar patrón: número. pregunta + opciones)
  const blocks = content.split(/(?=\n\d+\.)/);
  
  for (const block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock || trimmedBlock.startsWith('#')) continue;
    
    // Extraer número de pregunta
    const numMatch = trimmedBlock.match(/^(\d+)\.\s*/);
    if (!numMatch) continue;
    
    const number = parseInt(numMatch[1]);
    
    // Extraer texto de la pregunta (hasta la primera opción)
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
        correctAnswer: 'b', // Por defecto, la respuesta correcta es 'b' en estos tests
      });
    }
  }
  
  return questions;
}

/**
 * Genera el código JavaScript para un test
 */
function generateTestCode(config, questions) {
  const questionsCode = questions.map(q => {
    const optionsCode = q.options.map(o => 
      `{ letter: '${o.letter}', text: ${JSON.stringify(o.text)} }`
    ).join(', ');
    
    return `      { id: '${q.id}', number: ${q.number}, text: ${JSON.stringify(q.text)}, options: [${optionsCode}], correctAnswer: '${q.correctAnswer}' }`;
  }).join(',\n');
  
  return `  {
    id: '${config.id}',
    name: '${config.emoji} ${config.name}',
    description: 'Vocabulario: ${config.name} (B1-B2)',
    category: 'Vocabulary',
    level: 'B1-B2',
    isDefault: true,
    questions: [
${questionsCode}
    ],
  }`;
}

/**
 * Main
 */
async function main() {
  console.log('📚 Generando tests de vocabulario...\n');
  
  const tests = [];
  const files = fs.readdirSync(VOCABULARY_DIR).filter(f => f.endsWith('.txt'));
  
  for (const file of files) {
    const config = FILE_CONFIG[file];
    if (!config) {
      console.log(`⚠️  Archivo sin configuración: ${file}`);
      continue;
    }
    
    const filePath = path.join(VOCABULARY_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const questions = parseVocabularyFile(content);
    
    if (questions.length > 0) {
      tests.push({ config, questions });
      console.log(`✅ ${config.emoji} ${config.name}: ${questions.length} preguntas`);
    } else {
      console.log(`❌ ${file}: No se encontraron preguntas`);
    }
  }
  
  // Generar código
  const testsCode = tests.map(t => generateTestCode(t.config, t.questions)).join(',\n');
  
  const outputCode = `/**
 * Tests de vocabulario predeterminados
 * Generado automáticamente por scripts/generateVocabularyTests.js
 * 
 * Basados en los archivos .txt de assets/vocabulary/
 * Cada test contiene preguntas de nivel B1-B2
 */

export const DEFAULT_VOCABULARY_TESTS = [
${testsCode}
];

/**
 * Lista de archivos de vocabulario
 */
export const VOCABULARY_FILES = [
${files.filter(f => FILE_CONFIG[f]).map(f => `  '${f}'`).join(',\n')}
];

/**
 * Obtiene los tests de vocabulario predeterminados
 */
export const getDefaultVocabularyTests = () => {
  return DEFAULT_VOCABULARY_TESTS.map(test => ({
    ...test,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questionCount: test.questions.length,
  }));
};
`;

  // Escribir archivo
  fs.writeFileSync(OUTPUT_FILE, outputCode, 'utf-8');
  
  console.log(`\n✅ Generado: ${OUTPUT_FILE}`);
  console.log(`📊 Total: ${tests.length} tests, ${tests.reduce((acc, t) => acc + t.questions.length, 0)} preguntas`);
}

main().catch(console.error);
