// Mock de AsyncStorage
const mockStorage = {};

const AsyncStorage = {
  getItem: jest.fn((key) => {
    return Promise.resolve(mockStorage[key] || null);
  }),
  setItem: jest.fn((key, value) => {
    mockStorage[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key) => {
    delete mockStorage[key];
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach(key => delete mockStorage[key]);
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    return Promise.resolve();
  }),
  // Helper para tests
  __getMockStorage: () => mockStorage,
  __clearMockStorage: () => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  },
};

module.exports = AsyncStorage;
