// Mock de expo-document-picker
module.exports = {
  getDocumentAsync: jest.fn(() => Promise.resolve({
    type: 'cancel',
  })),
  DocumentPickerResult: {},
};
