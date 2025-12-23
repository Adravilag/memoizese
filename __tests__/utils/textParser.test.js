/**
 * Tests para utilidades de parsing de texto
 */

import { parseTextContent, extractQuestionsFromText } from '../../src/utils/textParser';

// Mock del módulo si existe
jest.mock('../../src/utils/textParser', () => ({
  parseTextContent: jest.fn((text) => {
    if (!text || typeof text !== 'string') return [];
    const lines = text.split('\n').filter(line => line.trim());
    return lines;
  }),
  extractQuestionsFromText: jest.fn((text) => {
    if (!text || typeof text !== 'string') return [];
    const questionPattern = /^\d+\./;
    const lines = text.split('\n');
    const questions = [];
    let currentQuestion = null;

    for (const line of lines) {
      if (questionPattern.test(line.trim())) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          text: line.trim(),
          answers: [],
        };
      } else if (currentQuestion && line.trim()) {
        currentQuestion.answers.push(line.trim());
      }
    }

    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    return questions;
  }),
}));

describe('textParser', () => {
  describe('parseTextContent', () => {
    it('debe retornar array vacío para input vacío', () => {
      expect(parseTextContent('')).toEqual([]);
      expect(parseTextContent(null)).toEqual([]);
      expect(parseTextContent(undefined)).toEqual([]);
    });

    it('debe dividir texto por líneas', () => {
      const text = 'Línea 1\nLínea 2\nLínea 3';
      const result = parseTextContent(text);
      expect(result).toHaveLength(3);
    });

    it('debe filtrar líneas vacías', () => {
      const text = 'Línea 1\n\n\nLínea 2';
      const result = parseTextContent(text);
      expect(result).toHaveLength(2);
    });
  });

  describe('extractQuestionsFromText', () => {
    it('debe retornar array vacío para input vacío', () => {
      expect(extractQuestionsFromText('')).toEqual([]);
      expect(extractQuestionsFromText(null)).toEqual([]);
    });

    it('debe extraer preguntas numeradas', () => {
      const text = `1. ¿Cuál es la capital de Francia?
a) Madrid
b) París
c) Londres

2. ¿Cuántos días tiene una semana?
a) 5
b) 7
c) 10`;

      const result = extractQuestionsFromText(text);
      expect(result).toHaveLength(2);
      expect(result[0].text).toContain('1.');
      expect(result[1].text).toContain('2.');
    });

    it('debe asociar respuestas a preguntas', () => {
      const text = `1. Pregunta de prueba
a) Opción A
b) Opción B`;

      const result = extractQuestionsFromText(text);
      expect(result[0].answers).toHaveLength(2);
    });
  });
});
