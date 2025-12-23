/**
 * Tests adicionales para pantallas
 * Verifica que todas las pantallas se exporten correctamente
 */

// Mock de AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe exportarse como default', () => {
    const HomeScreen = require('../../src/screens/HomeScreen').default;
    expect(HomeScreen).toBeDefined();
    expect(typeof HomeScreen).toBe('function');
  });
});

describe('MainMenuScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe exportarse como default', () => {
    const MainMenuScreen = require('../../src/screens/MainMenuScreen').default;
    expect(MainMenuScreen).toBeDefined();
    expect(typeof MainMenuScreen).toBe('function');
  });
});

describe('FavoritesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe exportarse como default', () => {
    const FavoritesScreen = require('../../src/screens/FavoritesScreen').default;
    expect(FavoritesScreen).toBeDefined();
    expect(typeof FavoritesScreen).toBe('function');
  });
});

describe('HistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe exportarse como default', () => {
    const HistoryScreen = require('../../src/screens/HistoryScreen').default;
    expect(HistoryScreen).toBeDefined();
    expect(typeof HistoryScreen).toBe('function');
  });
});

describe('ReviewWordsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe exportarse como default', () => {
    const ReviewWordsScreen = require('../../src/screens/ReviewWordsScreen').default;
    expect(ReviewWordsScreen).toBeDefined();
    expect(typeof ReviewWordsScreen).toBe('function');
  });
});

describe('StudyScheduleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe exportarse como default', () => {
    const StudyScheduleScreen = require('../../src/screens/StudyScheduleScreen').default;
    expect(StudyScheduleScreen).toBeDefined();
    expect(typeof StudyScheduleScreen).toBe('function');
  });
});

describe('ManageQuestionsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe exportarse como default', () => {
    const ManageQuestionsScreen = require('../../src/screens/ManageQuestionsScreen').default;
    expect(ManageQuestionsScreen).toBeDefined();
    expect(typeof ManageQuestionsScreen).toBe('function');
  });
});

describe('ResultsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe exportarse como default', () => {
    const ResultsScreen = require('../../src/screens/ResultsScreen').default;
    expect(ResultsScreen).toBeDefined();
    expect(typeof ResultsScreen).toBe('function');
  });
});

describe('TestsListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe exportarse como default', () => {
    const TestsListScreen = require('../../src/screens/TestsListScreen').default;
    expect(TestsListScreen).toBeDefined();
    expect(typeof TestsListScreen).toBe('function');
  });
});

describe('TestDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe exportarse como default', () => {
    const TestDetailsScreen = require('../../src/screens/TestDetailsScreen').default;
    expect(TestDetailsScreen).toBeDefined();
    expect(typeof TestDetailsScreen).toBe('function');
  });
});

describe('TakeTestScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe exportarse como default', () => {
    const TakeTestScreen = require('../../src/screens/TakeTestScreen').default;
    expect(TakeTestScreen).toBeDefined();
    expect(typeof TakeTestScreen).toBe('function');
  });
});

describe('AddTestScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe exportarse como default', () => {
    const AddTestScreen = require('../../src/screens/AddTestScreen').default;
    expect(AddTestScreen).toBeDefined();
    expect(typeof AddTestScreen).toBe('function');
  });
});

describe('ConfigureAnswersScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe exportarse como default', () => {
    const ConfigureAnswersScreen = require('../../src/screens/ConfigureAnswersScreen').default;
    expect(ConfigureAnswersScreen).toBeDefined();
    expect(typeof ConfigureAnswersScreen).toBe('function');
  });
});

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe exportarse como default', () => {
    const SettingsScreen = require('../../src/screens/SettingsScreen').default;
    expect(SettingsScreen).toBeDefined();
    expect(typeof SettingsScreen).toBe('function');
  });
});

describe('Todas las pantallas de navegación', () => {
  it('todas las pantallas deben ser componentes válidos', () => {
    const screens = [
      require('../../src/screens/HomeScreen').default,
      require('../../src/screens/MainMenuScreen').default,
      require('../../src/screens/DecksScreen').default,
      require('../../src/screens/DeckDetailScreen').default,
      require('../../src/screens/StudyScreen').default,
      require('../../src/screens/StatsScreen').default,
      require('../../src/screens/FavoritesScreen').default,
      require('../../src/screens/HistoryScreen').default,
      require('../../src/screens/ReviewWordsScreen').default,
      require('../../src/screens/StudyScheduleScreen').default,
      require('../../src/screens/ManageQuestionsScreen').default,
      require('../../src/screens/ResultsScreen').default,
      require('../../src/screens/TestsListScreen').default,
      require('../../src/screens/TestDetailsScreen').default,
      require('../../src/screens/TakeTestScreen').default,
      require('../../src/screens/AddTestScreen').default,
      require('../../src/screens/ConfigureAnswersScreen').default,
      require('../../src/screens/SettingsScreen').default,
    ];

    screens.forEach((screen, index) => {
      expect(screen).toBeDefined();
      expect(typeof screen).toBe('function');
    });
  });
});
