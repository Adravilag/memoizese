import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Componente que usa PDF.js en un WebView para extraer texto de PDFs
 */
export default function PDFTextExtractor({ pdfBase64, onTextExtracted, onError }) {
  const webViewRef = useRef(null);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 20px;
          background: #f5f5f5;
        }
        #status {
          color: #666;
          text-align: center;
          padding: 20px;
        }
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #4A90D9;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="loading">
        <div class="spinner"></div>
        <div id="status">Extrayendo texto del PDF...</div>
      </div>
      
      <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        async function extractText(base64Data) {
          try {
            document.getElementById('status').innerText = 'Cargando PDF...';
            
            // Convertir base64 a array buffer
            const binaryString = atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            document.getElementById('status').innerText = 'Procesando páginas...';
            
            const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
            let fullText = '';
            let currentQuestionNum = 0;
            let questionAnswers = {}; // {questionNum: 'a'} mapeo de respuestas correctas
            let detectedFonts = new Set(); // Para debug
            
            // Estadísticas de fuentes por opción para detectar la "diferente"
            let fontUsageInOptions = {}; // {fontName: count}
            let optionsWithFonts = []; // [{questionNum, option, fontName, text}]
            
            for (let i = 1; i <= pdf.numPages; i++) {
              document.getElementById('status').innerText = 'Extrayendo página ' + i + ' de ' + pdf.numPages + '...';
              
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              
              // Procesar items manteniendo estructura de líneas y detectando negrita
              let lastY = null;
              let pageText = '';
              let currentLineText = '';
              let currentLineFonts = new Set(); // Fuentes usadas en la línea actual
              
              for (const item of textContent.items) {
                // Guardar nombre de fuente para debug
                if (item.fontName) {
                  detectedFonts.add(item.fontName);
                }
                
                // Si cambia la posición Y significativamente, es nueva línea
                if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                  // Procesar línea anterior
                  processLine(currentLineText, currentLineFonts);
                  pageText += currentLineText + '\\n';
                  currentLineText = '';
                  currentLineFonts = new Set();
                }
                
                currentLineText += item.str;
                if (item.fontName && item.str.trim()) {
                  currentLineFonts.add(item.fontName);
                }
                lastY = item.transform[5];
              }
              
              // No olvidar la última línea
              if (currentLineText) {
                processLine(currentLineText, currentLineFonts);
                pageText += currentLineText;
              }
              
              fullText += pageText + '\\n\\n';
            }
            
            function processLine(lineText, lineFonts) {
              // Detectar TODAS las opciones en la línea (a) b) c) d))
              // Usar exec en bucle para compatibilidad
              const regex = /([aAbBcCdD])\\)/g;
              let match;
              
              while ((match = regex.exec(lineText)) !== null) {
                if (lineFonts.size > 0) {
                  const option = match[1].toLowerCase();
                  
                  // Si es opción 'a', es una nueva pregunta
                  if (option === 'a') {
                    currentQuestionNum++;
                  }
                  
                  // Solo procesar si ya tenemos al menos pregunta 1
                  if (currentQuestionNum > 0) {
                    // Contar uso de cada fuente en esta opción
                    for (const fontName of lineFonts) {
                      fontUsageInOptions[fontName] = (fontUsageInOptions[fontName] || 0) + 1;
                    }
                    
                    // Guardar para análisis posterior (con TODAS las fuentes)
                    optionsWithFonts.push({
                      questionNum: currentQuestionNum,
                      option: option,
                      fonts: Array.from(lineFonts)
                    });
                  }
                }
              }
            }
            
            // ANÁLISIS: Determinar cuál es la fuente "especial" (menos usada = negrita/correcta)
            let fontCounts = Object.entries(fontUsageInOptions);
            console.log('Estadísticas de fuentes:', JSON.stringify(fontUsageInOptions));
            console.log('Total opciones detectadas:', optionsWithFonts.length);
            
            let specialFont = null;
            
            if (fontCounts.length >= 2) {
              // Ordenar por uso (menor primero)
              fontCounts.sort((a, b) => a[1] - b[1]);
              
              // La fuente menos usada es probablemente la de las respuestas correctas
              specialFont = fontCounts[0][0];
              const specialCount = fontCounts[0][1];
              const normalCount = fontCounts.slice(1).reduce((sum, f) => sum + f[1], 0);
              
              console.log('Fuente especial (menos usada):', specialFont, 'usada', specialCount, 'veces');
              console.log('Fuentes normales usadas', normalCount, 'veces');
              
              // Solo usar si la proporción tiene sentido (1 correcta por cada 3-4 opciones aprox)
              const ratio = specialCount / (specialCount + normalCount);
              console.log('Ratio:', ratio);
              
              if (ratio > 0.1 && ratio < 0.5) {
                // Marcar las opciones que contienen la fuente especial como correctas
                for (const opt of optionsWithFonts) {
                  if (opt.fonts.includes(specialFont)) {
                    questionAnswers[opt.questionNum] = opt.option;
                  }
                }
                
                // Debug: mostrar preguntas sin respuesta detectada
                for (let q = 1; q <= currentQuestionNum; q++) {
                  if (!questionAnswers[q]) {
                    const opts = optionsWithFonts.filter(o => o.questionNum === q);
                    console.log('Pregunta', q, 'sin respuesta. Opciones:', opts.length);
                    opts.forEach(o => console.log('  -', o.option, ':', o.fonts.join(', ')));
                  }
                }
              }
            }
            
            // Si aún quedan preguntas sin respuesta, intentar con la otra fuente
            const answeredCount = Object.keys(questionAnswers).length;
            if (answeredCount < currentQuestionNum && fontCounts.length >= 2) {
              console.log('Intentando detectar respuestas faltantes con fuente alternativa...');
              const altFont = fontCounts[1] ? fontCounts[1][0] : null;
              if (altFont) {
                for (let q = 1; q <= currentQuestionNum; q++) {
                  if (!questionAnswers[q]) {
                    const opts = optionsWithFonts.filter(o => o.questionNum === q && o.fonts.includes(altFont));
                    if (opts.length === 1) {
                      questionAnswers[q] = opts[0].option;
                      console.log('Detectada respuesta alternativa para pregunta', q, ':', opts[0].option);
                    }
                  }
                }
              }
            }
            
            document.getElementById('status').innerText = '¡Completado!';
            
            // Convertir el mapeo a array ordenado
            const sortedAnswers = [];
            const maxQ = Math.max(...Object.keys(questionAnswers).map(Number), 0);
            console.log('Max pregunta detectada:', maxQ);
            console.log('Preguntas con respuesta:', Object.keys(questionAnswers).length);
            console.log('Total preguntas (currentQuestionNum):', currentQuestionNum);
            
            // Usar currentQuestionNum como máximo, no maxQ
            const totalQuestions = Math.max(maxQ, currentQuestionNum);
            for (let q = 1; q <= totalQuestions; q++) {
              if (questionAnswers[q]) {
                sortedAnswers.push(questionAnswers[q]);
              }
            }
            
            // Añadir info de debug sobre fuentes detectadas
            const fontsFound = Array.from(detectedFonts).join(', ');
            console.log('Fuentes detectadas:', fontsFound);
            
            // Crear marcadores para opciones en negrita al final del texto
            if (sortedAnswers.length > 0) {
              fullText += '\\n[BOLD_ANSWERS:' + sortedAnswers.join(',') + ']';
              console.log('Respuestas detectadas:', sortedAnswers.length);
            }
            
            // Debug: preguntas sin respuesta
            const missing = [];
            for (let q = 1; q <= currentQuestionNum; q++) {
              if (!questionAnswers[q]) missing.push(q);
            }
            if (missing.length > 0) {
              fullText += '\\n[MISSING_ANSWERS:' + missing.join(',') + ']';
            }
            
            // Añadir debug info al texto
            fullText += '\\n[DEBUG_FONTS:' + fontsFound + ']';
            
            // Enviar texto extraído a React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'success',
              text: fullText,
              pages: pdf.numPages
            }));
            
          } catch (error) {
            console.error('Error:', error);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: error.message || 'Error al procesar el PDF'
            }));
          }
        }
        
        // Esperar a recibir el PDF
        window.addEventListener('message', function(event) {
          const data = JSON.parse(event.data);
          if (data.type === 'pdf') {
            extractText(data.base64);
          }
        });
        
        // Para Android
        document.addEventListener('message', function(event) {
          const data = JSON.parse(event.data);
          if (data.type === 'pdf') {
            extractText(data.base64);
          }
        });
        
        // Indicar que estamos listos
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'ready' && pdfBase64) {
        // WebView listo, enviar el PDF
        webViewRef.current?.postMessage(JSON.stringify({
          type: 'pdf',
          base64: pdfBase64
        }));
      } else if (data.type === 'success') {
        onTextExtracted(data.text, data.pages);
      } else if (data.type === 'error') {
        onError(data.message);
      }
    } catch (error) {
      onError('Error procesando respuesta');
    }
  };

  useEffect(() => {
    if (pdfBase64 && webViewRef.current) {
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'pdf',
        base64: pdfBase64
      }));
    }
  }, [pdfBase64]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  webview: {
    flex: 1,
  },
});
