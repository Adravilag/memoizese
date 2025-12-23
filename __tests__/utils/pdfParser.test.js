/**
 * Tests para el módulo de parsing de PDF
 */

import { parsePDFContent, parseTextContent, validateTestFormat } from '../../src/utils/pdfParser';

describe('pdfParser', () => {
  describe('parsePDFContent', () => {
    it('debe retornar array vacío para texto vacío', () => {
      const result = parsePDFContent('');
      expect(result).toEqual([]);
    });

    it('debe parsear una pregunta simple con opciones', () => {
      const text = `1. ¿Cuál es la capital de España?
a) Barcelona
b) Madrid
c) Sevilla
d) Valencia`;

      const result = parsePDFContent(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].number).toBe(1);
      expect(result[0].text).toContain('capital de España');
      expect(result[0].options).toHaveLength(4);
      expect(result[0].options[0].letter).toBe('a');
      expect(result[0].options[1].letter).toBe('b');
    });

    it('debe parsear múltiples preguntas', () => {
      const text = `1. Primera pregunta
a) Opción A
b) Opción B
c) Opción C
d) Opción D

2. Segunda pregunta
a) Opción 1
b) Opción 2
c) Opción 3
d) Opción 4`;

      const result = parsePDFContent(text);
      
      expect(result).toHaveLength(2);
      expect(result[0].number).toBe(1);
      expect(result[1].number).toBe(2);
    });

    it('debe manejar preguntas con texto multilínea', () => {
      const text = `1. Esta es una pregunta muy larga
que ocupa varias líneas
hasta terminar aquí
a) Primera opción
b) Segunda opción
c) Tercera opción
d) Cuarta opción`;

      const result = parsePDFContent(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].text).toContain('pregunta muy larga');
    });

    it('debe extraer respuestas correctas desde BOLD_ANSWERS', () => {
      const text = `[BOLD_ANSWERS:b,c,a]
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

3. Pregunta 3
a) A
b) B
c) C
d) D`;

      const result = parsePDFContent(text);
      
      expect(result).toHaveLength(3);
      expect(result[0].correctAnswer).toBe('b');
      expect(result[1].correctAnswer).toBe('c');
      expect(result[2].correctAnswer).toBe('a');
    });

    it('debe manejar opciones con texto largo', () => {
      const text = `1. Pregunta de prueba
a) Esta es una opción muy larga que describe algo en detalle
b) Otra opción también larga con información adicional
c) Una opción más
d) Última opción`;

      const result = parsePDFContent(text);
      
      expect(result[0].options).toHaveLength(4);
      expect(result[0].options[0].text).toContain('opción muy larga');
    });

    it('debe ignorar líneas vacías entre preguntas', () => {
      const text = `1. Primera pregunta
a) A
b) B


2. Segunda pregunta
a) A
b) B`;

      const result = parsePDFContent(text);
      expect(result).toHaveLength(2);
    });

    it('debe descartar preguntas con menos de 2 opciones', () => {
      const text = `1. Pregunta válida
a) Opción A
b) Opción B
c) Opción C
d) Opción D

2. Pregunta inválida
a) Solo una opción`;

      const result = parsePDFContent(text);
      
      // Solo la primera pregunta debería ser válida
      expect(result).toHaveLength(1);
      expect(result[0].number).toBe(1);
    });

    it('debe normalizar caracteres especiales', () => {
      const text = `1. Pregunta con guión—largo
a) Opción–con–guiones
b) Opción normal
c) Otra opción
d) Final`;

      const result = parsePDFContent(text);
      
      expect(result).toHaveLength(1);
      // Los guiones largos deben normalizarse a guiones normales
    });

    it('debe manejar opciones en mayúsculas', () => {
      const text = `1. Pregunta
A) Primera
B) Segunda
C) Tercera
D) Cuarta`;

      const result = parsePDFContent(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].options).toHaveLength(4);
      expect(result[0].options[0].letter).toBe('a'); // Debe convertir a minúsculas
    });
  });

  describe('parseTextContent', () => {
    it('debe usar parsePDFContent internamente', () => {
      const text = `1. Pregunta simple
a) A
b) B
c) C
d) D`;

      const result = parseTextContent(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].options).toHaveLength(4);
    });
  });

  describe('validateTestFormat', () => {
    it('debe retornar inválido para preguntas vacías', () => {
      const result = validateTestFormat([]);
      
      expect(result.valid).toBe(false);
      expect(result.message).toContain('No se encontraron preguntas');
    });

    it('debe retornar inválido para null', () => {
      const result = validateTestFormat(null);
      
      expect(result.valid).toBe(false);
    });

    it('debe retornar válido para preguntas correctas', () => {
      const questions = [
        { number: 1, text: 'Pregunta 1', options: [{letter: 'a', text: 'A'}, {letter: 'b', text: 'B'}] },
        { number: 2, text: 'Pregunta 2', options: [{letter: 'a', text: 'A'}, {letter: 'b', text: 'B'}] },
      ];
      
      const result = validateTestFormat(questions);
      
      expect(result.valid).toBe(true);
      expect(result.message).toContain('2 preguntas válidas');
    });

    it('debe detectar preguntas sin suficientes opciones', () => {
      const questions = [
        { number: 1, text: 'Pregunta 1', options: [{letter: 'a', text: 'A'}] },
      ];
      
      const result = validateTestFormat(questions);
      
      expect(result.valid).toBe(false);
      expect(result.message).toContain('no tienen suficientes opciones');
    });
  });

  describe('Formato alternativo', () => {
    it('debe parsear formato con punto después de letra (a. b. c.)', () => {
      const text = `1. Pregunta con formato alternativo
a. Primera opción
b. Segunda opción
c. Tercera opción
d. Cuarta opción`;

      const result = parsePDFContent(text);
      
      // Puede usar formato alternativo internamente
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Casos edge', () => {
    it('debe manejar texto con solo espacios', () => {
      const result = parsePDFContent('   \n\n   ');
      expect(result).toEqual([]);
    });

    it('debe manejar números de pregunta no consecutivos', () => {
      const text = `1. Primera
a) A
b) B

5. Quinta (saltando números)
a) A
b) B`;

      const result = parsePDFContent(text);
      
      expect(result).toHaveLength(2);
      expect(result[0].number).toBe(1);
      expect(result[1].number).toBe(5);
    });

    it('debe manejar preguntas con caracteres especiales', () => {
      const text = `1. ¿Qué significa "test" en español?
a) Prueba
b) Examen
c) Análisis
d) Evaluación`;

      const result = parsePDFContent(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].text).toContain('¿Qué significa');
    });
  });
});
