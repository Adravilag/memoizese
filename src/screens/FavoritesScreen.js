import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import {
  getFavoriteCards,
  getDeckById,
  toggleCardFavorite,
} from '../utils/storage';
import {
  StarIcon,
  StarOutlineIcon,
  TrashIcon,
  CardsIcon,
} from '../components/Icons';

export default function FavoritesScreen({ navigation }) {
  const { theme } = useTheme();
  const [favorites, setFavorites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deckNames, setDeckNames] = useState({});

  const loadFavorites = async () => {
    try {
      const favCards = await getFavoriteCards();
      setFavorites(favCards);

      // Cargar nombres de mazos
      const names = {};
      for (const card of favCards) {
        if (!names[card.deckId]) {
          const deck = await getDeckById(card.deckId);
          names[card.deckId] = deck?.name || 'Mazo eliminado';
        }
      }
      setDeckNames(names);
    } catch (error) {
      console.error('Error cargando favoritos:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleRemoveFavorite = async (cardId) => {
    Alert.alert(
      'Quitar de favoritos',
      '¿Seguro que quieres quitar esta palabra de tus favoritos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            try {
              await toggleCardFavorite(cardId);
              loadFavorites();
            } catch (error) {
              console.error('Error quitando favorito:', error);
            }
          },
        },
      ]
    );
  };

  const renderCard = ({ item }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <StarIcon size={20} color="#FFD700" />
          <Text style={[styles.deckName, { color: theme.colors.textSecondary }]}>
            {deckNames[item.deckId]}
          </Text>
        </View>
        
        <View style={styles.wordContainer}>
          <Text style={[styles.frontText, { color: theme.colors.text }]}>
            {item.front}
          </Text>
          <Text style={[styles.separator, { color: theme.colors.textSecondary }]}>
            →
          </Text>
          <Text style={[styles.backText, { color: theme.colors.primary }]}>
            {item.back}
          </Text>
        </View>
        
        {item.example && (
          <Text style={[styles.exampleText, { color: theme.colors.textSecondary }]}>
            "{item.example}"
          </Text>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFavorite(item.id)}
      >
        <StarIcon size={24} color="#FFD700" />
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <StarOutlineIcon size={80} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Sin favoritos
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Marca palabras interesantes con la ⭐ mientras estudias
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Stats */}
      <View style={[styles.statsHeader, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.statItem}>
          <CardsIcon size={24} color={theme.colors.primary} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {favorites.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            palabras guardadas
          </Text>
        </View>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={favorites.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deckName: {
    fontSize: 12,
    marginLeft: 6,
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  frontText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  separator: {
    fontSize: 18,
    marginHorizontal: 8,
  },
  backText: {
    fontSize: 18,
    fontWeight: '600',
  },
  exampleText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
  },
  removeButton: {
    justifyContent: 'center',
    paddingLeft: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
