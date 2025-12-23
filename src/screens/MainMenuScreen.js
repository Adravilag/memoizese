import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { SunIcon, MoonIcon, BooksIcon, ClipboardListIcon, SettingsIcon } from '../components/Icons';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

// Icono de Flashcards/Mazos
const FlashcardsIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="6" width="15" height="12" rx="2" stroke={color} strokeWidth="2" fill="none" />
    <Rect x="6" y="3" width="15" height="12" rx="2" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.2" />
    <Path d="M9 10h6M9 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// Icono de Tests/Quiz
const QuizIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="2" fill="none" />
    <Circle cx="8" cy="8" r="1.5" fill={color} />
    <Circle cx="8" cy="12" r="1.5" fill={color} />
    <Circle cx="8" cy="16" r="1.5" fill={color} />
    <Path d="M12 8h5M12 12h5M12 16h5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export default function MainMenuScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();

  const menuItems = [
    {
      id: 'decks',
      title: 'Mazos',
      subtitle: 'Flashcards para memorización',
      description: 'Estudia vocabulario con tarjetas de repetición espaciada',
      icon: FlashcardsIcon,
      color: '#4A90D9',
      gradient: ['#4A90D9', '#357ABD'],
      screen: 'Decks',
    },
    {
      id: 'tests',
      title: 'Tests',
      subtitle: 'Preguntas de opción múltiple',
      description: 'Evalúa tu conocimiento con tests de vocabulario',
      icon: QuizIcon,
      color: '#E91E63',
      gradient: ['#E91E63', '#C2185B'],
      screen: 'TestsList',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Memoizese</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Aprende inglés de forma efectiva
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.themeButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <SettingsIcon size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.themeButton, { backgroundColor: theme.colors.surface }]}
            onPress={toggleTheme}
          >
            {isDark ? (
              <SunIcon size={22} color="#FFC107" />
            ) : (
              <MoonIcon size={22} color="#5C6BC0" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.menuContainer}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.menuCard, { backgroundColor: item.color }]}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.8}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <item.icon size={48} color="#fff" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
            </View>
            <View style={styles.arrowContainer}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path 
                  d="M9 18l6-6-6-6" 
                  stroke="#fff" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          </TouchableOpacity>
        ))}

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
          <BooksIcon size={24} color={theme.colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
              ¿Qué modo elegir?
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              • <Text style={{ fontWeight: 'bold' }}>Mazos:</Text> Para memorizar vocabulario con repetición espaciada (método más efectivo){'\n'}
              • <Text style={{ fontWeight: 'bold' }}>Tests:</Text> Para evaluar tu nivel con preguntas de opción múltiple
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  themeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  menuContainer: {
    padding: 20,
    gap: 16,
  },
  menuCard: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    minHeight: 140,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    lineHeight: 18,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
