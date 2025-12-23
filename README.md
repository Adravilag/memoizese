# 🧠 Memoizese

Una aplicación de tarjetas de memoria (flashcards) estilo **Anki** para aprender palabras nuevas de manera efectiva usando repetición espaciada.

## ✨ Características

### 📚 Mazos Personalizados
- Crea mazos con nombres, descripciones y colores personalizados
- Organiza tu vocabulario por temas, idiomas o categorías
- Visualiza el progreso de cada mazo

### 🃏 Tarjetas de Memoria
- Añade tarjetas con frente (palabra) y reverso (significado)
- Incluye ejemplos de uso opcionales
- Edita y elimina tarjetas fácilmente
- Búsqueda rápida dentro de los mazos

### 🔄 Algoritmo de Repetición Espaciada (SM-2)
- Sistema inteligente que optimiza tus sesiones de estudio
- Las tarjetas fáciles se muestran menos frecuentemente
- Las tarjetas difíciles se repiten más a menudo
- Intervalos adaptativos basados en tu desempeño

### 📊 Estadísticas Detalladas
- **Racha de días**: Mantén tu motivación con rachas diarias
- **Tarjetas estudiadas**: Total y por sesión
- **Precisión**: Porcentaje de respuestas correctas
- **Gráfico semanal**: Visualiza tu actividad
- **Estadísticas por mazo**: Seguimiento individual

### 🎨 Interfaz Moderna
- Diseño limpio e intuitivo
- Modo oscuro/claro automático
- Animaciones fluidas al voltear tarjetas
- Experiencia de estudio sin distracciones

## 🎯 Sistema de Respuestas

Durante el estudio, evalúa qué tan bien recordaste cada tarjeta:

| Botón | Significado | Intervalo |
|-------|-------------|-----------|
| 🔴 **Otra vez** | No la recordé | < 1 min |
| 🟠 **Difícil** | Correcta con dificultad | ~1 día |
| 🟢 **Bien** | Correcta con algo de duda | ~6 días |
| 🔵 **Fácil** | Respuesta perfecta | ~15+ días |

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/memoizese.git

# Instalar dependencias
cd memoizese
npm install

# Iniciar la aplicación
npm start
```

## 📱 Uso

1. **Crear un Mazo**: Toca el botón + para crear tu primer mazo
2. **Añadir Tarjetas**: Dentro del mazo, añade tarjetas con palabra y significado
3. **Estudiar**: Cuando tengas tarjetas pendientes, toca "Estudiar"
4. **Evaluar**: Voltea la tarjeta y evalúa tu respuesta
5. **Repetir**: El sistema calculará cuándo mostrar cada tarjeta

## 🛠️ Tecnologías

- **React Native** con Expo
- **React Navigation** para navegación
- **AsyncStorage** para persistencia local
- **Algoritmo SM-2** para repetición espaciada
- **React Native SVG** para iconos

## 📂 Estructura del Proyecto

```
src/
├── components/     # Componentes reutilizables
│   └── Icons.js    # Iconos SVG
├── context/        # Contextos de React
│   └── ThemeContext.js
├── screens/        # Pantallas de la app
│   ├── DecksScreen.js      # Lista de mazos
│   ├── DeckDetailScreen.js # Detalle de mazo
│   ├── StudyScreen.js      # Sesión de estudio
│   └── StatsScreen.js      # Estadísticas
└── utils/
    └── storage.js  # Almacenamiento y lógica
```

## 🎮 Características Futuras

- [ ] Importar/exportar mazos
- [ ] Compartir mazos con otros usuarios
- [ ] Estadísticas avanzadas con gráficos
- [ ] Sincronización en la nube
- [ ] Notificaciones de repaso
- [ ] Modo de práctica inversa

## 📄 Licencia

MIT License - Usa el código como desees.

---

**¡Aprende cualquier cosa con Memoizese!** 🚀
