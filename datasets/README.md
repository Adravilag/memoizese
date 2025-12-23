# 📚 Memoizese Datasets

Este directorio contiene los datasets de vocabulario y tests para la app Memoizese.

## 📁 Estructura

```
datasets/
├── catalog.json          # Índice de todos los datasets disponibles
├── vocabulary/           # Tests de vocabulario
│   ├── 01_clothes_and_accessories.txt
│   ├── 02_colours.txt
│   └── ...
├── grammar/              # Tests de gramática (próximamente)
└── idioms/               # Expresiones idiomáticas (próximamente)
```

## 📋 Formato del Catálogo (catalog.json)

```json
{
  "version": "1.0.0",
  "lastUpdated": "2024-12-23",
  "categories": [...],
  "datasets": [
    {
      "id": "vocab_01_clothes",
      "name": "👕 Clothes and Accessories",
      "description": "Vocabulario de ropa y accesorios",
      "category": "vocabulary",
      "level": "B1-B2",
      "questionCount": 50,
      "file": "vocabulary/01_clothes_and_accessories.txt",
      "version": "1.0.0",
      "size": 8500
    }
  ]
}
```

## 📝 Formato de los Tests (.txt)

```
# Vocabulary: Topic Name (Level)

1. What is a "word"?
a) Wrong answer
b) Correct answer
c) Wrong answer
d) Wrong answer

2. What does "word" mean?
a) Wrong answer
b) Correct answer
c) Wrong answer
d) Wrong answer
```

**Importante:** La respuesta correcta siempre debe ser la opción **b)**.

## 🔄 Cómo Actualizar

1. Edita o añade archivos en la carpeta correspondiente
2. Actualiza `catalog.json` con la información del nuevo dataset
3. Incrementa la versión si modificas un dataset existente
4. Haz commit y push

## 🔗 URLs de Acceso

Los archivos se pueden acceder via:

- **Raw GitHub:** `https://raw.githubusercontent.com/USUARIO/memoizese/main/datasets/...`
- **jsDelivr CDN:** `https://cdn.jsdelivr.net/gh/USUARIO/memoizese@main/datasets/...`

Se recomienda usar jsDelivr para mejor rendimiento (incluye caché global).

## 📊 Estadísticas

| Categoría | Datasets | Preguntas Total |
|-----------|----------|-----------------|
| Vocabulary | 20 | ~1000 |
| Grammar | 0 | 0 |
| Idioms | 0 | 0 |

---

**Memoizese** - Aprende vocabulario con repetición espaciada 🧠
