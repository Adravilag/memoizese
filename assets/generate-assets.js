/**
 * Script para generar assets de Testeate
 * Ejecutar: node assets/generate-assets.js
 * 
 * Requiere: npm install sharp
 */

const fs = require('fs');
const path = require('path');

// SVG del icono de Testeate - Libro con check de aprobado
const iconSVG = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2E78C7"/>
      <stop offset="100%" style="stop-color:#1B5A9E"/>
    </linearGradient>
    <linearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF"/>
      <stop offset="100%" style="stop-color:#E8F0F8"/>
    </linearGradient>
  </defs>
  
  <!-- Fondo redondeado -->
  <rect x="0" y="0" width="1024" height="1024" rx="220" fill="url(#bgGrad)"/>
  
  <!-- Libro abierto -->
  <g transform="translate(512, 480)">
    <!-- Sombra del libro -->
    <ellipse cx="0" cy="280" rx="280" ry="40" fill="rgba(0,0,0,0.15)"/>
    
    <!-- Página izquierda -->
    <path d="M-40 -200 L-40 200 Q-180 180 -280 200 L-280 -180 Q-180 -200 -40 -200 Z" 
          fill="url(#bookGrad)" stroke="#C0D0E0" stroke-width="4"/>
    
    <!-- Página derecha -->
    <path d="M40 -200 L40 200 Q180 180 280 200 L280 -180 Q180 -200 40 -200 Z" 
          fill="url(#bookGrad)" stroke="#C0D0E0" stroke-width="4"/>
    
    <!-- Lomo del libro -->
    <path d="M-40 -200 L-40 200 L40 200 L40 -200 Z" fill="#D0E0F0"/>
    
    <!-- Líneas de texto izquierda -->
    <line x1="-220" y1="-120" x2="-80" y2="-120" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
    <line x1="-220" y1="-60" x2="-100" y2="-60" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
    <line x1="-220" y1="0" x2="-80" y2="0" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
    <line x1="-220" y1="60" x2="-120" y2="60" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
    <line x1="-220" y1="120" x2="-80" y2="120" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
    
    <!-- Líneas de texto derecha -->
    <line x1="80" y1="-120" x2="220" y2="-120" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
    <line x1="100" y1="-60" x2="220" y2="-60" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
    <line x1="80" y1="0" x2="220" y2="0" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
    <line x1="120" y1="60" x2="220" y2="60" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
    <line x1="80" y1="120" x2="220" y2="120" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
  </g>
  
  <!-- Círculo de check (aprobado) -->
  <g transform="translate(700, 280)">
    <circle cx="0" cy="0" r="120" fill="#22C55E" stroke="#FFFFFF" stroke-width="12"/>
    <path d="M-50 0 L-15 40 L55 -40" fill="none" stroke="#FFFFFF" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
`;

// SVG del splash screen
const splashSVG = `
<svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="splashBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2E78C7"/>
      <stop offset="100%" style="stop-color:#1B5A9E"/>
    </linearGradient>
  </defs>
  
  <!-- Fondo -->
  <rect width="1284" height="2778" fill="url(#splashBg)"/>
  
  <!-- Icono centrado -->
  <g transform="translate(642, 1100)">
    <!-- Libro abierto -->
    <g transform="scale(1.5)">
      <!-- Sombra del libro -->
      <ellipse cx="0" cy="280" rx="280" ry="40" fill="rgba(0,0,0,0.15)"/>
      
      <!-- Página izquierda -->
      <path d="M-40 -200 L-40 200 Q-180 180 -280 200 L-280 -180 Q-180 -200 -40 -200 Z" 
            fill="#FFFFFF" stroke="#E0E8F0" stroke-width="4"/>
      
      <!-- Página derecha -->
      <path d="M40 -200 L40 200 Q180 180 280 200 L280 -180 Q180 -200 40 -200 Z" 
            fill="#FFFFFF" stroke="#E0E8F0" stroke-width="4"/>
      
      <!-- Lomo del libro -->
      <path d="M-40 -200 L-40 200 L40 200 L40 -200 Z" fill="#E8F0F8"/>
      
      <!-- Líneas de texto -->
      <line x1="-220" y1="-120" x2="-80" y2="-120" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
      <line x1="-220" y1="-60" x2="-100" y2="-60" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
      <line x1="-220" y1="0" x2="-80" y2="0" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
      <line x1="-220" y1="60" x2="-120" y2="60" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
      <line x1="-220" y1="120" x2="-80" y2="120" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
      
      <line x1="80" y1="-120" x2="220" y2="-120" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
      <line x1="100" y1="-60" x2="220" y2="-60" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
      <line x1="80" y1="0" x2="220" y2="0" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
      <line x1="120" y1="60" x2="220" y2="60" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
      <line x1="80" y1="120" x2="220" y2="120" stroke="#B0C4DE" stroke-width="8" stroke-linecap="round"/>
    </g>
    
    <!-- Círculo de check -->
    <g transform="translate(280, -300)">
      <circle cx="0" cy="0" r="120" fill="#22C55E" stroke="#FFFFFF" stroke-width="12"/>
      <path d="M-50 0 L-15 40 L55 -40" fill="none" stroke="#FFFFFF" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  
  <!-- Texto Testeate -->
  <text x="642" y="1750" font-family="Arial, sans-serif" font-size="100" font-weight="bold" fill="#FFFFFF" text-anchor="middle">
    Testeate
  </text>
  
  <!-- Subtítulo -->
  <text x="642" y="1850" font-family="Arial, sans-serif" font-size="40" fill="rgba(255,255,255,0.8)" text-anchor="middle">
    Prepara tus oposiciones
  </text>
</svg>
`;

// Adaptive icon foreground (solo el icono, sin fondo)
const adaptiveIconSVG = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Libro abierto centrado para adaptive icon -->
  <g transform="translate(512, 480)">
    <!-- Sombra del libro -->
    <ellipse cx="0" cy="250" rx="240" ry="35" fill="rgba(0,0,0,0.2)"/>
    
    <!-- Página izquierda -->
    <path d="M-35 -180 L-35 180 Q-160 160 -250 180 L-250 -160 Q-160 -180 -35 -180 Z" 
          fill="#FFFFFF" stroke="#C0D0E0" stroke-width="4"/>
    
    <!-- Página derecha -->
    <path d="M35 -180 L35 180 Q160 160 250 180 L250 -160 Q160 -180 35 -180 Z" 
          fill="#FFFFFF" stroke="#C0D0E0" stroke-width="4"/>
    
    <!-- Lomo del libro -->
    <path d="M-35 -180 L-35 180 L35 180 L35 -180 Z" fill="#D0E0F0"/>
    
    <!-- Líneas de texto -->
    <line x1="-200" y1="-100" x2="-70" y2="-100" stroke="#B0C4DE" stroke-width="7" stroke-linecap="round"/>
    <line x1="-200" y1="-45" x2="-90" y2="-45" stroke="#B0C4DE" stroke-width="7" stroke-linecap="round"/>
    <line x1="-200" y1="10" x2="-70" y2="10" stroke="#B0C4DE" stroke-width="7" stroke-linecap="round"/>
    <line x1="-200" y1="65" x2="-110" y2="65" stroke="#B0C4DE" stroke-width="7" stroke-linecap="round"/>
    <line x1="-200" y1="120" x2="-70" y2="120" stroke="#B0C4DE" stroke-width="7" stroke-linecap="round"/>
    
    <line x1="70" y1="-100" x2="200" y2="-100" stroke="#B0C4DE" stroke-width="7" stroke-linecap="round"/>
    <line x1="90" y1="-45" x2="200" y2="-45" stroke="#B0C4DE" stroke-width="7" stroke-linecap="round"/>
    <line x1="70" y1="10" x2="200" y2="10" stroke="#B0C4DE" stroke-width="7" stroke-linecap="round"/>
    <line x1="110" y1="65" x2="200" y2="65" stroke="#B0C4DE" stroke-width="7" stroke-linecap="round"/>
    <line x1="70" y1="120" x2="200" y2="120" stroke="#B0C4DE" stroke-width="7" stroke-linecap="round"/>
  </g>
  
  <!-- Círculo de check -->
  <g transform="translate(680, 280)">
    <circle cx="0" cy="0" r="100" fill="#22C55E" stroke="#FFFFFF" stroke-width="10"/>
    <path d="M-42 0 L-12 35 L46 -35" fill="none" stroke="#FFFFFF" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
`;

// Favicon
const faviconSVG = `
<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" rx="8" fill="#2E78C7"/>
  <g transform="translate(24, 26)">
    <path d="M-2 -10 L-2 10 Q-9 9 -14 10 L-14 -9 Q-9 -10 -2 -10 Z" fill="#FFFFFF"/>
    <path d="M2 -10 L2 10 Q9 9 14 10 L14 -9 Q9 -10 2 -10 Z" fill="#FFFFFF"/>
    <rect x="-2" y="-10" width="4" height="20" fill="#E8F0F8"/>
  </g>
  <g transform="translate(34, 14)">
    <circle cx="0" cy="0" r="7" fill="#22C55E"/>
    <path d="M-3 0 L-1 2.5 L4 -2.5" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
`;

// Guardar SVGs
fs.writeFileSync(path.join(__dirname, 'icon-source.svg'), iconSVG.trim());
fs.writeFileSync(path.join(__dirname, 'splash-source.svg'), splashSVG.trim());
fs.writeFileSync(path.join(__dirname, 'adaptive-icon-source.svg'), adaptiveIconSVG.trim());
fs.writeFileSync(path.join(__dirname, 'favicon-source.svg'), faviconSVG.trim());

console.log('✅ SVGs generados en la carpeta assets/');
console.log('');
console.log('Para convertir a PNG, usa una de estas opciones:');
console.log('');
console.log('1. Online: https://svgtopng.com/');
console.log('2. Con sharp (npm install sharp):');
console.log('');
console.log(`
const sharp = require('sharp');

// Icon 1024x1024
sharp('assets/icon-source.svg')
  .resize(1024, 1024)
  .png()
  .toFile('assets/icon.png');

// Adaptive icon 1024x1024  
sharp('assets/adaptive-icon-source.svg')
  .resize(1024, 1024)
  .png()
  .toFile('assets/adaptive-icon.png');

// Splash 1284x2778
sharp('assets/splash-source.svg')
  .resize(1284, 2778)
  .png()
  .toFile('assets/splash.png');

// Favicon 48x48
sharp('assets/favicon-source.svg')
  .resize(48, 48)
  .png()
  .toFile('assets/favicon.png');
`);
