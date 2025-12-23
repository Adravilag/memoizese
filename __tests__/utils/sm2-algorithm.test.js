/**
 * Tests para el algoritmo de repetición espaciada SM-2
 * Verifica el comportamiento matemático del algoritmo
 */

import { calculateNextReview } from '../../src/utils/storage';

describe('Algoritmo SM-2 - Casos Detallados', () => {
  describe('Calidad de respuesta 0 - Olvido total', () => {
    it('debe reiniciar completamente el progreso', () => {
      const card = {
        easeFactor: 2.8,
        interval: 30,
        repetitions: 10,
      };

      const result = calculateNextReview(card, 0);

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(0);
    });
  });

  describe('Calidad de respuesta 1 - Incorrecta pero recordada', () => {
    it('debe reiniciar el progreso', () => {
      const card = {
        easeFactor: 2.5,
        interval: 15,
        repetitions: 3,
      };

      const result = calculateNextReview(card, 1);

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(0);
    });
  });

  describe('Calidad de respuesta 2 - Incorrecta fácil de recordar', () => {
    it('debe reiniciar el progreso', () => {
      const card = {
        easeFactor: 2.5,
        interval: 10,
        repetitions: 2,
      };

      const result = calculateNextReview(card, 2);

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(0);
    });
  });

  describe('Calidad de respuesta 3 - Correcta con dificultad', () => {
    it('debe avanzar pero reducir easeFactor', () => {
      const card = {
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      };

      const result = calculateNextReview(card, 3);

      expect(result.repetitions).toBe(1);
      expect(result.easeFactor).toBeLessThan(2.5);
    });
  });

  describe('Calidad de respuesta 4 - Correcta con algo de duda', () => {
    it('debe avanzar con easeFactor similar', () => {
      const card = {
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      };

      const result = calculateNextReview(card, 4);

      expect(result.repetitions).toBe(1);
      // EaseFactor debería mantenerse cerca de 2.5
      expect(result.easeFactor).toBeCloseTo(2.5, 1);
    });
  });

  describe('Calidad de respuesta 5 - Perfecta', () => {
    it('debe avanzar y aumentar easeFactor', () => {
      const card = {
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      };

      const result = calculateNextReview(card, 5);

      expect(result.repetitions).toBe(1);
      expect(result.easeFactor).toBeGreaterThan(2.5);
    });
  });

  describe('Progresión de intervalos', () => {
    it('debe seguir la secuencia correcta: 0 -> 1 -> 6 -> n*EF', () => {
      let card = {
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      };

      // Primera revisión: intervalo = 1
      let result = calculateNextReview(card, 4);
      expect(result.interval).toBe(1);

      // Segunda revisión: intervalo = 6
      card = { ...card, ...result };
      result = calculateNextReview(card, 4);
      expect(result.interval).toBe(6);

      // Tercera revisión: intervalo = 6 * EF ≈ 15
      card = { ...card, ...result };
      result = calculateNextReview(card, 4);
      expect(result.interval).toBe(Math.round(6 * card.easeFactor));
    });

    it('debe crecer exponencialmente con respuestas perfectas', () => {
      let card = {
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      };

      const intervals = [];

      // Simular 5 respuestas perfectas
      for (let i = 0; i < 5; i++) {
        const result = calculateNextReview(card, 5);
        intervals.push(result.interval);
        card = { ...card, ...result };
      }

      // Verificar que los intervalos crecen
      for (let i = 1; i < intervals.length; i++) {
        expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
      }
    });
  });

  describe('Límites del easeFactor', () => {
    it('nunca debe bajar de 1.3', () => {
      let card = {
        easeFactor: 1.35,
        interval: 1,
        repetitions: 1,
      };

      // Múltiples respuestas difíciles
      for (let i = 0; i < 10; i++) {
        const result = calculateNextReview(card, 3);
        expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
        card = { ...card, ...result };
      }
    });

    it('debe crecer con respuestas consistentemente fáciles', () => {
      let card = {
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      };

      // Múltiples respuestas perfectas
      for (let i = 0; i < 5; i++) {
        const result = calculateNextReview(card, 5);
        card = { ...card, ...result };
      }

      expect(card.easeFactor).toBeGreaterThan(2.5);
    });
  });

  describe('Fechas de revisión', () => {
    it('debe establecer nextReview correctamente basado en intervalo', () => {
      const card = {
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      };

      const result = calculateNextReview(card, 4);
      const nextReview = new Date(result.nextReview);
      const today = new Date();

      // Calcular días de diferencia
      const diffTime = nextReview.getTime() - today.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Debería ser aproximadamente igual al intervalo calculado
      expect(diffDays).toBeGreaterThanOrEqual(result.interval - 1);
      expect(diffDays).toBeLessThanOrEqual(result.interval + 1);
    });

    it('debe establecer nextReview como hoy si intervalo es 0', () => {
      const card = {
        easeFactor: 2.5,
        interval: 10,
        repetitions: 5,
      };

      const result = calculateNextReview(card, 1); // Respuesta incorrecta
      const nextReview = new Date(result.nextReview);
      const today = new Date();

      // Deberían ser el mismo día
      expect(nextReview.toDateString()).toBe(today.toDateString());
    });
  });

  describe('Simulación de estudio realista', () => {
    it('debe simular una semana de estudio con rendimiento mixto', () => {
      let card = {
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      };

      // Día 1: Primera vez, respuesta correcta
      let result = calculateNextReview(card, 4);
      expect(result.interval).toBe(1);
      card = { ...card, ...result };

      // Día 2: Revisión, respuesta fácil
      result = calculateNextReview(card, 5);
      expect(result.interval).toBe(6);
      card = { ...card, ...result };

      // Día 8: Revisión, respuesta con dificultad
      result = calculateNextReview(card, 3);
      // Intervalo debería crecer pero menos
      expect(result.interval).toBeGreaterThan(6);
      card = { ...card, ...result };

      // Verificar que el easeFactor bajó por la dificultad
      expect(card.easeFactor).toBeLessThan(2.5);
    });

    it('debe manejar una tarjeta difícil que se olvida repetidamente', () => {
      let card = {
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      };

      // Progreso normal
      card = { ...card, ...calculateNextReview(card, 4) };
      card = { ...card, ...calculateNextReview(card, 4) };
      
      const beforeForget = { ...card };

      // Olvido total
      card = { ...card, ...calculateNextReview(card, 0) };

      // Debe reiniciarse
      expect(card.repetitions).toBe(0);
      expect(card.interval).toBe(0);

      // Pero el easeFactor no cambia con respuesta < 3
      // (según implementación actual)
    });
  });
});
