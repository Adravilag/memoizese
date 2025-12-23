import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Path, Rect, G } from 'react-native-svg';

export default function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Después de 2 segundos, terminar
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onFinish && onFinish();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
        ]}
      >
        {/* Icono */}
        <View style={styles.iconContainer}>
          <Svg width={150} height={150} viewBox="0 0 200 200">
            {/* Círculo de fondo blanco */}
            <Circle cx="100" cy="100" r="90" fill="#FFFFFF" />
            
            {/* Libro */}
            <G transform="translate(100, 105)">
              {/* Página izquierda */}
              <Path
                d="M-8 -50 L-8 50 Q-45 45 -70 50 L-70 -45 Q-45 -50 -8 -50 Z"
                fill="#2E78C7"
              />
              {/* Página derecha */}
              <Path
                d="M8 -50 L8 50 Q45 45 70 50 L70 -45 Q45 -50 8 -50 Z"
                fill="#2E78C7"
              />
              {/* Lomo */}
              <Rect x="-8" y="-50" width="16" height="100" fill="#1B5A9E" />
            </G>
            
            {/* Badge de check */}
            <G transform="translate(145, 55)">
              <Circle cx="0" cy="0" r="30" fill="#22C55E" />
              <Path
                d="M-12 0 L-4 10 L14 -10"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </G>
          </Svg>
        </View>

        {/* Texto */}
        <Text style={styles.title}>Testeate</Text>
        <Text style={styles.subtitle}>Prepara tus oposiciones</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E78C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
