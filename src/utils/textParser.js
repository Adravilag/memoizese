/**
 * Parser para archivos de texto plano con preguntas de test
 * 
 * FORMATO DE LA PLANTILLA:
 * ========================
 * # Nombre del Test
 * 
 * 1. Texto de la pregunta
 * a) Opción A
 * b) Opción B
 * c) Opción C
 * d) Opción D
 * 
 * 2. Siguiente pregunta...
 * a) ...
 * b) ...
 * c) ...
 * d) ...
 * 
 * [BOLD_ANSWERS: d, a, c, b, a, ...]
 * 
 * NOTAS:
 * - La línea que empieza con # es el nombre del test (opcional)
 * - Las preguntas empiezan con número seguido de punto
 * - Las opciones empiezan con letra minúscula seguida de )
 * - Las respuestas correctas van al final en [BOLD_ANSWERS: ...]
 *   separadas por comas, en el mismo orden que las preguntas
 */

export function parseTextTest(text) {
  // Extraer respuestas del marcador BOLD_ANSWERS
  const boldAnswersMatch = text.match(/\[BOLD_ANSWERS?:\s*([^\]]+)\]/i);
  const boldAnswers = boldAnswersMatch 
    ? boldAnswersMatch[1].split(',').map(a => a.trim().toLowerCase())
    : [];
  
  // Limpiar el marcador del texto
  const cleanText = text.replace(/\[BOLD_ANSWERS?:[^\]]*\]/gi, '');
  
  const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l);
  
  let testName = 'Test importado';
  const questions = [];
  let currentQuestion = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Nombre del test (línea que empieza con #)
    if (line.startsWith('#')) {
      testName = line.substring(1).trim();
      continue;
    }
    
    // Nueva pregunta (empieza con número y punto)
    const questionMatch = line.match(/^(\d+)\.\s*(.+)/);
    if (questionMatch) {
      // Guardar pregunta anterior si existe
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      
      currentQuestion = {
        number: parseInt(questionMatch[1]),
        text: questionMatch[2],
        options: [],
        correctAnswer: null
      };
      continue;
    }
    
    // Opción de respuesta (a), b), c), d))
    const optionMatch = line.match(/^([a-dA-D])\)\s*(.+)/);
    if (optionMatch && currentQuestion) {
      const letter = optionMatch[1].toLowerCase();
      const text = optionMatch[2];
      
      currentQuestion.options.push({
        letter,
        text
      });
      continue;
    }
    
    // Si la línea no coincide con nada pero hay pregunta actual,
    // puede ser continuación del texto de la pregunta
    if (currentQuestion && currentQuestion.options.length === 0) {
      currentQuestion.text += ' ' + line;
    }
  }
  
  // Añadir última pregunta
  if (currentQuestion) {
    questions.push(currentQuestion);
  }
  
  // Asignar respuestas correctas desde BOLD_ANSWERS
  questions.forEach((q, index) => {
    if (boldAnswers[index]) {
      q.correctAnswer = boldAnswers[index];
    }
  });
  
  // Validar que todas las preguntas tengan respuesta correcta
  const questionsWithoutAnswer = questions.filter(q => !q.correctAnswer);
  if (questionsWithoutAnswer.length > 0) {
    const nums = questionsWithoutAnswer.map(q => q.number).join(', ');
    console.warn(`Preguntas sin respuesta correcta: ${nums}`);
  }
  
  // Convertir al formato de la app
  const formattedQuestions = questions.map((q, index) => ({
    id: `q_${index + 1}`,
    number: q.number || index + 1,
    text: q.text,
    options: q.options,
    correctAnswer: q.correctAnswer || 'a' // Default a 'a' si no hay respuesta
  }));
  
  return {
    name: testName,
    questions: formattedQuestions,
    totalQuestions: formattedQuestions.length,
    createdAt: new Date().toISOString(),
    source: 'text'
  };
}

/**
 * Valida el formato de un texto de test
 * Retorna { valid: boolean, errors: string[], warnings: string[] }
 */
export function validateTextTest(text) {
  const errors = [];
  const warnings = [];
  
  // Verificar si tiene BOLD_ANSWERS
  const boldAnswersMatch = text.match(/\[BOLD_ANSWERS?:\s*([^\]]+)\]/i);
  const boldAnswers = boldAnswersMatch 
    ? boldAnswersMatch[1].split(',').map(a => a.trim().toLowerCase())
    : [];
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  if (lines.length === 0) {
    errors.push('El archivo está vacío');
    return { valid: false, errors, warnings };
  }
  
  let hasName = false;
  let questionCount = 0;
  let currentQuestionNum = 0;
  let currentOptions = 0;
  
  for (const line of lines) {
    if (line.startsWith('#')) {
      hasName = true;
      continue;
    }
    
    // Ignorar línea de BOLD_ANSWERS
    if (line.match(/^\[BOLD_ANSWERS?:/i)) {
      continue;
    }
    
    const questionMatch = line.match(/^(\d+)\.\s*(.+)/);
    if (questionMatch) {
      // Verificar pregunta anterior
      if (currentQuestionNum > 0 && currentOptions < 2) {
        errors.push(`Pregunta ${currentQuestionNum}: menos de 2 opciones`);
      }
      
      questionCount++;
      currentQuestionNum = parseInt(questionMatch[1]);
      currentOptions = 0;
      continue;
    }
    
    const optionMatch = line.match(/^([a-dA-D])\)\s*(.+)/);
    if (optionMatch) {
      currentOptions++;
      continue;
    }
  }
  
  // Verificar última pregunta
  if (currentQuestionNum > 0 && currentOptions < 2) {
    errors.push(`Pregunta ${currentQuestionNum}: menos de 2 opciones`);
  }
  
  if (!hasName) {
    warnings.push('No se encontró nombre del test (línea con #)');
  }
  
  if (questionCount === 0) {
    errors.push('No se encontraron preguntas');
  }
  
  // Verificar que hay respuestas para todas las preguntas
  if (boldAnswers.length === 0) {
    errors.push('No se encontró [BOLD_ANSWERS: ...] con las respuestas');
  } else if (boldAnswers.length < questionCount) {
    warnings.push(`Faltan respuestas: hay ${questionCount} preguntas pero solo ${boldAnswers.length} respuestas`);
  } else if (boldAnswers.length > questionCount) {
    warnings.push(`Hay más respuestas (${boldAnswers.length}) que preguntas (${questionCount})`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    questionCount,
    answersCount: boldAnswers.length
  };
}

/**
 * Genera una plantilla de ejemplo
 */
export function generateTemplate(numQuestions = 5) {
  const answers = [];
  let template = `# Nombre del Test de Ejemplo

`;
  
  for (let i = 1; i <= numQuestions; i++) {
    const correctOption = ['a', 'b', 'c', 'd'][Math.floor(Math.random() * 4)];
    answers.push(correctOption);
    
    template += `${i}. Texto de la pregunta ${i}
a) Primera opción
b) Segunda opción
c) Tercera opción
d) Cuarta opción

`;
  }
  
  template += `[BOLD_ANSWERS: ${answers.join(', ')}]`;
  
  return template;
}
