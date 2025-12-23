/**
 * Tests para el módulo de tests de vocabulario predeterminados
 */

import { DEFAULT_VOCABULARY_TESTS, getDefaultVocabularyTests, VOCABULARY_FILES } from '../../src/utils/vocabularyTests';

describe('vocabularyTests', () => {
  describe('DEFAULT_VOCABULARY_TESTS', () => {
    it('debe estar definido y ser un array', () => {
      expect(DEFAULT_VOCABULARY_TESTS).toBeDefined();
      expect(Array.isArray(DEFAULT_VOCABULARY_TESTS)).toBe(true);
    });

    it('debe contener al menos un test', () => {
      expect(DEFAULT_VOCABULARY_TESTS.length).toBeGreaterThan(0);
    });

    it('cada test debe tener estructura correcta', () => {
      DEFAULT_VOCABULARY_TESTS.forEach(test => {
        expect(test).toHaveProperty('id');
        expect(test).toHaveProperty('name');
        expect(test).toHaveProperty('description');
        expect(test).toHaveProperty('category');
        expect(test).toHaveProperty('level');
        expect(test).toHaveProperty('isDefault', true);
        expect(test).toHaveProperty('questions');
        expect(Array.isArray(test.questions)).toBe(true);
      });
    });

    it('cada pregunta debe tener estructura correcta', () => {
      DEFAULT_VOCABULARY_TESTS.forEach(test => {
        test.questions.forEach(question => {
          expect(question).toHaveProperty('id');
          expect(question).toHaveProperty('number');
          expect(question).toHaveProperty('text');
          expect(question).toHaveProperty('options');
          expect(question).toHaveProperty('correctAnswer');
          expect(Array.isArray(question.options)).toBe(true);
        });
      });
    });

    it('cada opción debe tener letra y texto', () => {
      DEFAULT_VOCABULARY_TESTS.forEach(test => {
        test.questions.forEach(question => {
          question.options.forEach(option => {
            expect(option).toHaveProperty('letter');
            expect(option).toHaveProperty('text');
            expect(['a', 'b', 'c', 'd']).toContain(option.letter);
          });
        });
      });
    });

    it('correctAnswer debe ser una letra válida', () => {
      DEFAULT_VOCABULARY_TESTS.forEach(test => {
        test.questions.forEach(question => {
          expect(['a', 'b', 'c', 'd']).toContain(question.correctAnswer);
        });
      });
    });

    it('debe incluir test de Clothes and Accessories', () => {
      const clothesTest = DEFAULT_VOCABULARY_TESTS.find(t => t.id === 'vocab_01_clothes');
      expect(clothesTest).toBeDefined();
      expect(clothesTest.name).toContain('Clothes');
    });

    it('debe incluir test de Colours', () => {
      const coloursTest = DEFAULT_VOCABULARY_TESTS.find(t => t.id === 'vocab_02_colours');
      expect(coloursTest).toBeDefined();
      expect(coloursTest.name).toContain('Colours');
    });

    it('debe incluir test de Food and Drink', () => {
      const foodTest = DEFAULT_VOCABULARY_TESTS.find(t => t.id === 'vocab_07_food');
      expect(foodTest).toBeDefined();
      expect(foodTest.name).toContain('Food');
    });
  });

  describe('getDefaultVocabularyTests', () => {
    it('debe retornar un array', () => {
      const result = getDefaultVocabularyTests();
      expect(Array.isArray(result)).toBe(true);
    });

    it('debe añadir campos adicionales a cada test', () => {
      const result = getDefaultVocabularyTests();
      
      result.forEach(test => {
        expect(test).toHaveProperty('createdAt');
        expect(test).toHaveProperty('updatedAt');
        expect(test).toHaveProperty('questionCount');
      });
    });

    it('questionCount debe coincidir con el número de preguntas', () => {
      const result = getDefaultVocabularyTests();
      
      result.forEach(test => {
        expect(test.questionCount).toBe(test.questions.length);
      });
    });

    it('createdAt y updatedAt deben ser fechas ISO válidas', () => {
      const result = getDefaultVocabularyTests();
      
      result.forEach(test => {
        const createdDate = new Date(test.createdAt);
        const updatedDate = new Date(test.updatedAt);
        
        expect(createdDate.toISOString()).toBe(test.createdAt);
        expect(updatedDate.toISOString()).toBe(test.updatedAt);
      });
    });

    it('debe preservar todas las propiedades originales', () => {
      const result = getDefaultVocabularyTests();
      
      result.forEach(test => {
        expect(test.isDefault).toBe(true);
        expect(test.category).toBe('Vocabulary');
      });
    });
  });

  describe('VOCABULARY_FILES', () => {
    it('debe estar definido y ser un array', () => {
      expect(VOCABULARY_FILES).toBeDefined();
      expect(Array.isArray(VOCABULARY_FILES)).toBe(true);
    });

    it('debe contener 20 archivos de vocabulario', () => {
      expect(VOCABULARY_FILES).toHaveLength(20);
    });

    it('cada archivo debe ser un string con extensión .txt', () => {
      VOCABULARY_FILES.forEach(vocab => {
        expect(typeof vocab).toBe('string');
        expect(vocab).toMatch(/\.txt$/);
      });
    });

    it('los archivos deben estar en orden del 01 al 20', () => {
      for (let i = 0; i < 20; i++) {
        const expectedPrefix = String(i + 1).padStart(2, '0');
        expect(VOCABULARY_FILES[i]).toMatch(new RegExp(`^${expectedPrefix}_`));
      }
    });

    it('debe incluir archivos de categorías principales', () => {
      expect(VOCABULARY_FILES).toContain('01_clothes_and_accessories.txt');
      expect(VOCABULARY_FILES).toContain('02_colours.txt');
      expect(VOCABULARY_FILES).toContain('07_food_and_drink.txt');
      expect(VOCABULARY_FILES).toContain('04_education.txt');
      expect(VOCABULARY_FILES).toContain('20_work_and_jobs.txt');
    });
  });

  describe('Calidad del contenido', () => {
    it('las preguntas no deben tener texto vacío', () => {
      DEFAULT_VOCABULARY_TESTS.forEach(test => {
        test.questions.forEach(question => {
          expect(question.text.trim().length).toBeGreaterThan(0);
        });
      });
    });

    it('las opciones no deben tener texto vacío', () => {
      DEFAULT_VOCABULARY_TESTS.forEach(test => {
        test.questions.forEach(question => {
          question.options.forEach(option => {
            expect(option.text.trim().length).toBeGreaterThan(0);
          });
        });
      });
    });

    it('cada pregunta debe tener al menos 2 opciones', () => {
      DEFAULT_VOCABULARY_TESTS.forEach(test => {
        test.questions.forEach(question => {
          expect(question.options.length).toBeGreaterThanOrEqual(2);
        });
      });
    });

    it('los niveles deben ser válidos (B1-B2)', () => {
      DEFAULT_VOCABULARY_TESTS.forEach(test => {
        expect(test.level).toMatch(/^[ABC][12](-[ABC][12])?$/);
      });
    });
  });
});
