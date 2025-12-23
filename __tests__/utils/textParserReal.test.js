/**
 * Tests para utilidades de parsing de texto - Implementación real
 * Estos tests verifican la lógica real sin mocks
 */

// Importar las funciones reales (no mockeadas)
const textParser = require('../../src/utils/textParser');

describe('textParser - Implementación real', () => {
  describe('parseTextTest', () => {
    it('debe retornar objeto con estructura correcta', () => {
      const text = `# Test de Ejemplo

1. ¿Cuál es la respuesta correcta?
a) Opción A
b) Opción B
c) Opción C
d) Opción D

[BOLD_ANSWERS: b]`;

      const result = textParser.parseTextTest(text);
      
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('questions');
      expect(result).toHaveProperty('totalQuestions');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('source', 'text');
    });

    it('debe extraer el nombre del test de línea con #', () => {
      const text = `# Mi Test Personalizado

1. Pregunta
a) A
b) B

[BOLD_ANSWERS: a]`;

      const result = textParser.parseTextTest(text);
      
      expect(result.name).toBe('Mi Test Personalizado');
    });

    it('debe usar nombre por defecto si no hay #', () => {
      const text = `1. Pregunta
a) A
b) B

[BOLD_ANSWERS: a]`;

      const result = textParser.parseTextTest(text);
      
      expect(result.name).toBe('Test importado');
    });

    it('debe parsear múltiples preguntas correctamente', () => {
      const text = `# Test

1. Primera pregunta
a) A1
b) B1
c) C1
d) D1

2. Segunda pregunta
a) A2
b) B2
c) C2
d) D2

3. Tercera pregunta
a) A3
b) B3
c) C3
d) D3

[BOLD_ANSWERS: a, b, c]`;

      const result = textParser.parseTextTest(text);
      
      expect(result.questions).toHaveLength(3);
      expect(result.totalQuestions).toBe(3);
    });

    it('debe asignar respuestas correctas desde BOLD_ANSWERS', () => {
      const text = `1. Pregunta 1
a) A
b) B

2. Pregunta 2
a) A
b) B

[BOLD_ANSWERS: b, a]`;

      const result = textParser.parseTextTest(text);
      
      expect(result.questions[0].correctAnswer).toBe('b');
      expect(result.questions[1].correctAnswer).toBe('a');
    });

    it('debe manejar BOLD_ANSWER sin S final', () => {
      const text = `1. Pregunta
a) A
b) B

[BOLD_ANSWER: a]`;

      const result = textParser.parseTextTest(text);
      
      expect(result.questions[0].correctAnswer).toBe('a');
    });

    it('debe generar IDs únicos para cada pregunta', () => {
      const text = `1. P1
a) A
b) B

2. P2
a) A
b) B

[BOLD_ANSWERS: a, b]`;

      const result = textParser.parseTextTest(text);
      
      const ids = result.questions.map(q => q.id);
      const uniqueIds = [...new Set(ids)];
      
      expect(ids.length).toBe(uniqueIds.length);
    });

    it('debe manejar continuación de texto de pregunta', () => {
      const text = `1. Esta es una pregunta muy larga
que continúa en la siguiente línea
a) Opción A
b) Opción B

[BOLD_ANSWERS: a]`;

      const result = textParser.parseTextTest(text);
      
      expect(result.questions[0].text).toContain('muy larga');
      expect(result.questions[0].text).toContain('siguiente línea');
    });

    it('debe usar "a" como respuesta por defecto si falta', () => {
      const text = `1. Pregunta sin respuesta definida
a) A
b) B`;

      const result = textParser.parseTextTest(text);
      
      expect(result.questions[0].correctAnswer).toBe('a');
    });
  });

  describe('validateTextTest', () => {
    it('debe retornar error para archivo vacío', () => {
      const result = textParser.validateTextTest('');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('El archivo está vacío');
    });

    it('debe retornar error si no hay preguntas', () => {
      const text = `# Solo un título`;

      const result = textParser.validateTextTest(text);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No se encontraron preguntas');
    });

    it('debe retornar error si falta BOLD_ANSWERS', () => {
      const text = `1. Pregunta
a) A
b) B`;

      const result = textParser.validateTextTest(text);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('BOLD_ANSWERS'))).toBe(true);
    });

    it('debe detectar preguntas con pocas opciones', () => {
      const text = `1. Pregunta con una sola opción
a) Solo A

[BOLD_ANSWERS: a]`;

      const result = textParser.validateTextTest(text);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('menos de 2 opciones'))).toBe(true);
    });

    it('debe retornar válido para test correcto', () => {
      const text = `# Test válido

1. Pregunta 1
a) A
b) B
c) C
d) D

2. Pregunta 2
a) A
b) B
c) C
d) D

[BOLD_ANSWERS: a, b]`;

      const result = textParser.validateTextTest(text);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe advertir si falta nombre del test', () => {
      const text = `1. Pregunta
a) A
b) B

[BOLD_ANSWERS: a]`;

      const result = textParser.validateTextTest(text);
      
      expect(result.warnings.some(w => w.includes('nombre'))).toBe(true);
    });

    it('debe advertir si faltan respuestas', () => {
      const text = `# Test

1. Pregunta 1
a) A
b) B

2. Pregunta 2
a) A
b) B

[BOLD_ANSWERS: a]`; // Solo 1 respuesta para 2 preguntas

      const result = textParser.validateTextTest(text);
      
      expect(result.warnings.some(w => w.includes('Faltan respuestas'))).toBe(true);
    });

    it('debe contar preguntas y respuestas correctamente', () => {
      const text = `1. P1
a) A
b) B

2. P2
a) A
b) B

3. P3
a) A
b) B

[BOLD_ANSWERS: a, b, c]`;

      const result = textParser.validateTextTest(text);
      
      expect(result.questionCount).toBe(3);
      expect(result.answersCount).toBe(3);
    });
  });

  describe('generateTemplate', () => {
    it('debe generar plantilla con número de preguntas especificado', () => {
      const template = textParser.generateTemplate(3);
      
      // Contar preguntas
      const questionMatches = template.match(/^\d+\./gm);
      expect(questionMatches).toHaveLength(3);
    });

    it('debe usar 5 preguntas por defecto', () => {
      const template = textParser.generateTemplate();
      
      const questionMatches = template.match(/^\d+\./gm);
      expect(questionMatches).toHaveLength(5);
    });

    it('debe incluir título con #', () => {
      const template = textParser.generateTemplate(1);
      
      expect(template).toMatch(/^#/);
    });

    it('debe incluir BOLD_ANSWERS al final', () => {
      const template = textParser.generateTemplate(2);
      
      expect(template).toMatch(/\[BOLD_ANSWERS:/);
    });

    it('debe incluir 4 opciones por pregunta', () => {
      const template = textParser.generateTemplate(1);
      
      expect(template).toContain('a)');
      expect(template).toContain('b)');
      expect(template).toContain('c)');
      expect(template).toContain('d)');
    });

    it('debe ser un test válido al parsearlo', () => {
      const template = textParser.generateTemplate(3);
      const validation = textParser.validateTextTest(template);
      
      expect(validation.valid).toBe(true);
    });

    it('BOLD_ANSWERS debe tener respuestas válidas', () => {
      const template = textParser.generateTemplate(5);
      const boldMatch = template.match(/\[BOLD_ANSWERS:\s*([^\]]+)\]/);
      
      expect(boldMatch).not.toBeNull();
      
      const answers = boldMatch[1].split(',').map(a => a.trim());
      answers.forEach(answer => {
        expect(['a', 'b', 'c', 'd']).toContain(answer);
      });
    });
  });
});
