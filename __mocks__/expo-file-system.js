// Mock de expo-file-system
module.exports = {
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  documentDirectory: '/mock/directory/',
  cacheDirectory: '/mock/cache/',
  EncodingType: { 
    UTF8: 'utf8',
    Base64: 'base64',
  },
  FileSystemSessionType: {},
};
