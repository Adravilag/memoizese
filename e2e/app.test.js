/**
 * E2E Tests para Testeate
 * 
 * Tests end-to-end para garantizar la consistencia de la app
 */

describe('Testeate E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Home Screen', () => {
    it('should show the home screen with title', async () => {
      await expect(element(by.text('Mis Tests'))).toBeVisible();
    });

    it('should show empty state when no tests', async () => {
      await expect(element(by.text('No tienes tests guardados'))).toBeVisible();
    });

    it('should have add test button', async () => {
      await expect(element(by.id('add-test-button'))).toBeVisible();
    });

    it('should have stats button', async () => {
      await expect(element(by.id('stats-button'))).toBeVisible();
    });

    it('should have history button', async () => {
      await expect(element(by.id('history-button'))).toBeVisible();
    });
  });

  describe('Add Test Screen', () => {
    beforeEach(async () => {
      await element(by.id('add-test-button')).tap();
    });

    it('should navigate to add test screen', async () => {
      await expect(element(by.text('Añadir Test'))).toBeVisible();
    });

    it('should have file picker button', async () => {
      await expect(element(by.text('Seleccionar archivo'))).toBeVisible();
    });

    it('should have manual text input', async () => {
      await expect(element(by.id('manual-text-input'))).toBeVisible();
    });

    it('should show test name input', async () => {
      await expect(element(by.id('test-name-input'))).toBeVisible();
    });
  });

  describe('Stats Screen', () => {
    beforeEach(async () => {
      await element(by.id('stats-button')).tap();
    });

    it('should navigate to stats screen', async () => {
      await expect(element(by.text('Estadísticas'))).toBeVisible();
    });

    it('should show total stats section', async () => {
      await expect(element(by.text('Total'))).toBeVisible();
    });
  });

  describe('History Screen', () => {
    beforeEach(async () => {
      await element(by.id('history-button')).tap();
    });

    it('should navigate to history screen', async () => {
      await expect(element(by.text('Historial'))).toBeVisible();
    });

    it('should show empty state when no results', async () => {
      await expect(element(by.text('No hay resultados'))).toBeVisible();
    });
  });
});
