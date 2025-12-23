/**
 * Parser de PDF para extraer preguntas y respuestas de tests de oposiciones
 * Formato esperado:
 * - Preguntas: 1. 2. 3. etc. (pueden ocupar varias líneas)
 * - Respuestas: a) b) c) d) etc.
 * 
 * Ejemplo:
 * 18. El desarrollo de los derechos fundamentales y libertades públicas contenidas en el Título I, Capítulo II, Sección 1a,
 * de la Constitución Española:
 * a) Se llevará a cabo por Ley Ordinaria.
 * b) Se hará por Ley Orgánica.
 * c) Solo algunos derechos fundamentales se regularán por Ley Orgánica.
 * d) Ninguna respuesta es correcta
 */

export const parsePDFContent = (text) => {
  console.log('=== INICIO PARSEO ===');
  console.log('Texto recibido (primeros 1000 chars):', text.substring(0, 1000));
  
  // Extraer respuestas en negrita si las hay (formato: [BOLD_ANSWERS:a,b,c,d])
  let boldAnswers = [];
  const boldMatch = text.match(/\[BOLD_ANSWERS:([a-d,]+)\]/i);
  if (boldMatch) {
    boldAnswers = boldMatch[1].split(',');
    console.log('Respuestas en negrita detectadas:', boldAnswers);
    // Remover el marcador del texto
    text = text.replace(/\[BOLD_ANSWERS:[a-d,]+\]/gi, '');
  }
  
  // Pre-procesar: intentar reconstruir saltos de línea si el PDF vino muy junto
  let normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Limpiar caracteres de control extraños de PDFs
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, '')
    // Normalizar guiones y caracteres similares
    .replace(/[–—]/g, '-');
  
  // IMPORTANTE: Insertar saltos de línea antes de patrones de pregunta y opción
  // Esto ayuda cuando el PDF viene muy junto
  normalizedText = normalizedText
    // Salto antes de número de pregunta (ej: "...texto 18. El desarrollo" -> "...texto\n18. El desarrollo")
    .replace(/([^\n\d])\s*(\d+)\.\s+([A-ZÁÉÍÓÚÑ¿])/g, '$1\n$2. $3')
    // Salto antes de opciones a) b) c) d) - formato con paréntesis
    .replace(/([^\n])\s+([a-dA-D])\)\s+/g, '$1\n$2) ');
  
  console.log('Texto normalizado (primeros 1000 chars):', normalizedText.substring(0, 1000));
  
  const questions = [];
  
  // Dividir el texto por números de pregunta (1. 2. 3. etc.)
  // Este regex busca el inicio de cada pregunta
  const questionStarts = [];
  const questionStartRegex = /(?:^|\n)\s*(\d+)\.\s/g;
  
  let match;
  while ((match = questionStartRegex.exec(normalizedText)) !== null) {
    questionStarts.push({
      index: match.index,
      number: parseInt(match[1]),
      matchLength: match[0].length
    });
  }
  
  console.log('Preguntas encontradas:', questionStarts.length);
  console.log('Números de pregunta:', questionStarts.map(q => q.number));
  
  // Extraer cada bloque de pregunta
  for (let i = 0; i < questionStarts.length; i++) {
    const start = questionStarts[i];
    const endIndex = i < questionStarts.length - 1 
      ? questionStarts[i + 1].index 
      : normalizedText.length;
    
    // Extraer el contenido completo de esta pregunta
    let questionBlock = normalizedText.substring(start.index, endIndex).trim();
    
    // Remover el número de pregunta del inicio
    questionBlock = questionBlock.replace(/^\s*\d+\.\s*/, '');
    
    console.log(`\n--- Pregunta ${start.number} ---`);
    console.log('Bloque:', questionBlock.substring(0, 300));
    
    // Parsear el contenido de la pregunta
    const parsedQuestion = parseQuestionBlock(questionBlock, start.number);
    
    if (parsedQuestion && parsedQuestion.options.length >= 2) {
      // Usar índice único para evitar duplicados de key en React
      parsedQuestion.id = i + 1;  // ID único basado en el índice
      
      // Asignar respuesta correcta si tenemos la info de negrita
      if (boldAnswers.length > i) {
        parsedQuestion.correctAnswer = boldAnswers[i];
        console.log(`Respuesta correcta auto-detectada: ${boldAnswers[i]}`);
      }
      
      questions.push(parsedQuestion);
      console.log(`Pregunta ${start.number} parseada OK con ${parsedQuestion.options.length} opciones`);
    } else {
      console.log(`Pregunta ${start.number} descartada - opciones insuficientes`);
    }
  }
  
  console.log('=== FIN PARSEO ===');
  console.log('Total preguntas válidas:', questions.length);
  console.log('Preguntas con respuesta auto-detectada:', questions.filter(q => q.correctAnswer).length);
  
  // Si no encontró preguntas con el patrón estándar, intentar método alternativo
  if (questions.length === 0) {
    console.log('Intentando formato alternativo...');
    return parseAlternativeFormat(normalizedText);
  }
  
  return questions;
};

/**
 * Parsea un bloque de pregunta individual
 */
const parseQuestionBlock = (block, questionNumber) => {
  // Buscar donde empiezan las opciones: a) b) c) d)
  
  // Patrón para detectar el inicio de opciones - busca "a)" 
  const optionStartPatterns = [
    /(?:^|\n)\s*a\)\s/i,   // a) al inicio de línea
    /\s+a\)\s/i,           // a) después de espacio (por si viene junto)
  ];
  
  let optionStartIndex = -1;
  
  for (const pattern of optionStartPatterns) {
    const match = block.search(pattern);
    if (match !== -1 && (optionStartIndex === -1 || match < optionStartIndex)) {
      optionStartIndex = match;
    }
  }
  
  if (optionStartIndex === -1) {
    console.log('No se encontraron opciones en el bloque');
    return null;
  }
  
  // Separar texto de pregunta y opciones
  let questionText = block.substring(0, optionStartIndex).trim();
  let optionsText = block.substring(optionStartIndex).trim();
  
  // Limpiar el texto de la pregunta (unir líneas múltiples)
  questionText = questionText.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  
  console.log('Texto pregunta:', questionText);
  console.log('Texto opciones:', optionsText);
  
  // Extraer las opciones
  const options = extractOptions(optionsText);
  
  if (options.length === 0) {
    return null;
  }
  
  return {
    id: questionNumber,
    number: questionNumber,
    text: questionText,
    options: options,
    correctAnswer: null
  };
};

/**
 * Extrae las opciones de respuesta del texto
 */
const extractOptions = (optionsText) => {
  const options = [];
  
  // Patrón mejorado para extraer opciones: letra seguida de ) y luego el texto
  // Captura hasta la siguiente opción (letra + paréntesis) o fin de texto
  // Usa lookahead negativo para no capturar la siguiente letra de opción
  const optionRegex = /([a-dA-D])\)\s*([\s\S]*?)(?=\s*[a-dA-D]\)|$)/g;
  
  let match;
  const seenLetters = new Set();
  
  while ((match = optionRegex.exec(optionsText)) !== null) {
    const letter = match[1].toLowerCase();
    let optionText = match[2].trim();
    
    // Limpiar el texto de la opción
    optionText = optionText.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Evitar duplicados y opciones vacías
    if (optionText.length > 0 && !seenLetters.has(letter)) {
      seenLetters.add(letter);
      options.push({
        letter: letter,
        text: optionText
      });
      console.log(`  Opción ${letter}: ${optionText.substring(0, 50)}...`);
    }
  }
  
  return options;
};

/**
 * Método alternativo para PDFs con formato diferente
 * Procesa línea por línea
 */
const parseAlternativeFormat = (text) => {
  console.log('=== FORMATO ALTERNATIVO ===');
  const questions = [];
  const lines = text.split('\n');
  
  let currentQuestion = null;
  let questionNumber = 0;
  let lastOptionLetter = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Detectar inicio de pregunta (número seguido de punto al inicio de línea)
    const questionMatch = line.match(/^(\d+)\.\s*(.*)$/);
    if (questionMatch) {
      // Guardar pregunta anterior si existe y tiene suficientes opciones
      if (currentQuestion && currentQuestion.options.length >= 2) {
        questions.push(currentQuestion);
        console.log(`Guardada pregunta ${currentQuestion.number} con ${currentQuestion.options.length} opciones`);
      }
      
      questionNumber = parseInt(questionMatch[1]);
      const questionText = questionMatch[2].trim();
      
      currentQuestion = {
        id: questionNumber,
        number: questionNumber,
        text: questionText,
        options: [],
        correctAnswer: null
      };
      lastOptionLetter = null;
      console.log(`Nueva pregunta ${questionNumber}: ${questionText.substring(0, 50)}...`);
      continue;
    }
    
    // Detectar opciones: a) b) c) d) o a. b. c. d. (mayúsculas o minúsculas)
    const optionMatch = line.match(/^([a-dA-D])[\.\)]\s*(.*)$/);
    if (optionMatch && currentQuestion) {
      const letter = optionMatch[1].toLowerCase();
      const optionText = optionMatch[2].trim();
      
      // Evitar duplicados
      if (!currentQuestion.options.find(o => o.letter === letter)) {
        currentQuestion.options.push({
          letter: letter,
          text: optionText
        });
        lastOptionLetter = letter;
        console.log(`  Opción ${letter}: ${optionText.substring(0, 30)}...`);
      }
      continue;
    }
    
    // Si no es ni pregunta ni opción, es continuación de algo
    if (currentQuestion && line.length > 0) {
      if (currentQuestion.options.length === 0) {
        // Continuación del texto de la pregunta
        currentQuestion.text += ' ' + line;
      } else if (lastOptionLetter) {
        // Continuación de la última opción
        const lastOption = currentQuestion.options.find(o => o.letter === lastOptionLetter);
        if (lastOption) {
          lastOption.text += ' ' + line;
        }
      }
    }
  }
  
  // Guardar última pregunta
  if (currentQuestion && currentQuestion.options.length >= 2) {
    questions.push(currentQuestion);
    console.log(`Guardada última pregunta ${currentQuestion.number}`);
  }
  
  console.log(`Total preguntas (formato alternativo): ${questions.length}`);
  return questions;
};

/**
 * Parsea texto plano con formato de test
 */
export const parseTextContent = (text) => {
  return parsePDFContent(text);
};

/**
 * Valida si el contenido tiene el formato esperado
 */
export const validateTestFormat = (questions) => {
  if (!questions || questions.length === 0) {
    return {
      valid: false,
      message: 'No se encontraron preguntas en el documento. Asegúrate de que el formato sea:\n\n1. Texto de la pregunta\na) Opción A\nb) Opción B\nc) Opción C\nd) Opción D'
    };
  }
  
  const questionsWithoutOptions = questions.filter(q => q.options.length < 2);
  if (questionsWithoutOptions.length > 0) {
    return {
      valid: false,
      message: `${questionsWithoutOptions.length} preguntas no tienen suficientes opciones de respuesta (mínimo 2)`
    };
  }
  
  return {
    valid: true,
    message: `Se encontraron ${questions.length} preguntas válidas`
  };
};
