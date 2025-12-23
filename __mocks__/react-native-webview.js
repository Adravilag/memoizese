// Mock de react-native-webview
const React = require('react');

const WebView = ({ children }) => children || null;

WebView.displayName = 'WebView';

module.exports = {
  WebView,
  default: WebView,
};
