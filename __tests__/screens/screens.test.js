/**
 * Tests para los componentes de pantalla
 * Verifica que los módulos se exporten correctamente
 */

// Mock de AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

describe('DecksScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe exportarse como default', () => {
    const DecksScreen = require('../../src/screens/DecksScreen').default;
    expect(DecksScreen).toBeDefined();
    expect(typeof DecksScreen).toBe('function');
  });

  it('debe ser un componente de React válido', () => {
    const DecksScreen = require('../../src/screens/DecksScreen').default;
    expect(DecksScreen.name).toBeDefined();
  });
});

describe('DeckDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe exportarse como default', () => {
    const DeckDetailScreen = require('../../src/screens/DeckDetailScreen').default;
    expect(DeckDetailScreen).toBeDefined();
    expect(typeof DeckDetailScreen).toBe('function');
  });

  it('debe ser un componente de React válido', () => {
    const DeckDetailScreen = require('../../src/screens/DeckDetailScreen').default;
    expect(DeckDetailScreen.name).toBeDefined();
  });
});

describe('StudyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe exportarse como default', () => {
    const StudyScreen = require('../../src/screens/StudyScreen').default;
    expect(StudyScreen).toBeDefined();
    expect(typeof StudyScreen).toBe('function');
  });

  it('debe ser un componente de React válido', () => {
    const StudyScreen = require('../../src/screens/StudyScreen').default;
    expect(StudyScreen.name).toBeDefined();
  });
});

describe('StatsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe exportarse como default', () => {
    const StatsScreen = require('../../src/screens/StatsScreen').default;
    expect(StatsScreen).toBeDefined();
    expect(typeof StatsScreen).toBe('function');
  });

  it('debe ser un componente de React válido', () => {
    const StatsScreen = require('../../src/screens/StatsScreen').default;
    expect(StatsScreen.name).toBeDefined();
  });
});

describe('Navegación entre pantallas', () => {
  it('todas las pantallas deben existir para la navegación', () => {
    const screens = [
      require('../../src/screens/DecksScreen').default,
      require('../../src/screens/DeckDetailScreen').default,
      require('../../src/screens/StudyScreen').default,
      require('../../src/screens/StatsScreen').default,
    ];

    screens.forEach(screen => {
      expect(screen).toBeDefined();
      expect(typeof screen).toBe('function');
    });
  });
});
