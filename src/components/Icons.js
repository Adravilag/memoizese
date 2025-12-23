import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline, G } from 'react-native-svg';

// Iconos basados en Iconify (Lucide, Material Design, etc.)
// Cada icono acepta props: size (default 24), color (default currentColor), style

// ⭐ Star - mdi:star (filled)
export const StarIcon = ({ size = 24, color = '#FFD700', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
    />
  </Svg>
);

// ☆ Star Outline - mdi:star-outline
export const StarOutlineIcon = ({ size = 24, color = '#FFD700', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 15.39l-3.76 2.27.99-4.28-3.32-2.88 4.38-.37L12 6.09l1.71 4.04 4.38.37-3.32 2.88.99 4.28M22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24z"
    />
  </Svg>
);

// ✅ Check Circle - mdi:check-circle
export const CheckCircleIcon = ({ size = 24, color = '#28A745', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
    />
  </Svg>
);

// ❌ X Circle - mdi:close-circle
export const XCircleIcon = ({ size = 24, color = '#DC3545', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"
    />
  </Svg>
);

// 📚 Books Stack - mdi:bookshelf
export const BooksIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M9 3v15h3V3H9m3 15V3h3v15h-3M6 3v15h3V3H6M4 3c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h2V3H4m12 0v16h2c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1h-2m-1 0v15h3V3h-3"
    />
  </Svg>
);

// 📖 Book Open - lucide:book-open
export const BookOpenIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 📝 Clipboard Edit / Notes - lucide:clipboard-edit
export const ClipboardEditIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Rect x={8} y={2} width={8} height={4} rx={1} ry={1} stroke={color} strokeWidth={2} />
    <Path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L8 21l-4 1 1-4 5.42-5.39z" stroke={color} strokeWidth={2} />
  </Svg>
);

// 📊 Chart Bar - lucide:bar-chart-3
export const ChartBarIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path d="M18 20V10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 20V4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6 20v-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// 🏆 Trophy - lucide:trophy
export const TrophyIcon = ({ size = 24, color = '#FFD700', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4 22h16"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18 2H6v7a6 6 0 0 0 12 0V2Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 💪 Muscle / Strong - mdi:arm-flex
export const MuscleIcon = ({ size = 24, color = '#FF6B6B', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M7 14c-1.66 0-3-1.34-3-3 0-1.31.84-2.41 2-2.83V5a1 1 0 0 1 2 0v3.17c1.16.42 2 1.52 2 2.83 0 1.66-1.34 3-3 3zm10.42-1.83a2.95 2.95 0 0 0-.24-.72l-.21-.42c-.27-.53-.76-.89-1.33-1.01l-.72-.14c-.66-.13-1.27-.44-1.77-.89l-.48-.44c-.52-.48-1.19-.74-1.87-.74H9v2h1.8c.22 0 .43.08.59.24l.48.44c.26.24.55.44.86.6v.01h-.01c.32.16.66.28 1.02.35l.72.14c.18.04.34.16.43.33l.21.42c.04.09.07.18.08.28 0 .1 0 .2-.04.29l-.59 1.77c-.18.52-.2 1.08-.07 1.61l.27 1.08c.06.24.22.44.44.56l1.53.76c.26.14.55.21.86.21H19v-2h-1.42l-1.07-.53.39-1.17.26-1.04c.04-.17.04-.35 0-.52l-.74.23z"
    />
  </Svg>
);

// 📋 Clipboard List - lucide:clipboard-list
export const ClipboardListIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Rect x={8} y={2} width={8} height={4} rx={1} ry={1} stroke={color} strokeWidth={2} />
    <Path d="M12 11h4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M12 16h4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M8 11h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M8 16h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// 💾 Save - lucide:save
export const SaveIcon = ({ size = 24, color = '#FFFFFF', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline points="17,21 17,13 7,13 7,21" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="7,3 7,8 15,8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// 📄 File Text - lucide:file-text
export const FileTextIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline points="14,2 14,8 20,8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1={16} y1={13} x2={8} y2={13} stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1={16} y1={17} x2={8} y2={17} stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Polyline points="10,9 9,9 8,9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// 📁 Folder - lucide:folder
export const FolderIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ✨ Sparkles - lucide:sparkles
export const SparklesIcon = ({ size = 24, color = '#FFD700', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M5 3v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M19 17v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M3 5h4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M17 19h4" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// ⚠️ Alert Triangle - lucide:alert-triangle
export const AlertTriangleIcon = ({ size = 24, color = '#FFA500', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 9v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M12 17h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// ⚠️ Alert Circle - lucide:alert-circle
export const AlertCircleIcon = ({ size = 24, color = '#FF9800', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
    <Path d="M12 8v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M12 16h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// � Archive - lucide:archive
export const ArchiveIcon = ({ size = 24, color = '#F59E0B', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Rect x={2} y={3} width={20} height={5} rx={1} stroke={color} strokeWidth={2} />
    <Path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" stroke={color} strokeWidth={2} />
    <Path d="M10 12h4" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// �🔄 Refresh - lucide:refresh-cw
export const RefreshIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M21 3v5h-5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 16H3v5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// 📅 Calendar - lucide:calendar
export const CalendarIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Rect x={3} y={4} width={18} height={18} rx={2} ry={2} stroke={color} strokeWidth={2} />
    <Line x1={16} y1={2} x2={16} y2={6} stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1={8} y1={2} x2={8} y2={6} stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1={3} y1={10} x2={21} y2={10} stroke={color} strokeWidth={2} />
    <Path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// 🏠 Home - lucide:home
export const HomeIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="9,22 9,12 15,12 15,22" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ⚙️ Settings - lucide:settings
export const SettingsIcon = ({ size = 24, color = '#666', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2} />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ☀️ Sun - lucide:sun
export const SunIcon = ({ size = 24, color = '#FFD700', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={2} />
    <Path d="M12 2v2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M12 20v2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="m4.93 4.93 1.41 1.41" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="m17.66 17.66 1.41 1.41" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M2 12h2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M20 12h2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="m6.34 17.66-1.41 1.41" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="m19.07 4.93-1.41 1.41" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// 🌙 Moon - lucide:moon
export const MoonIcon = ({ size = 24, color = '#6C757D', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ▼ Chevron Down - lucide:chevron-down
export const ChevronDownIcon = ({ size = 24, color = '#666', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path d="m6 9 6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ▲ Chevron Up - lucide:chevron-up
export const ChevronUpIcon = ({ size = 24, color = '#666', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path d="m18 15-6-6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ▶ Chevron Right - lucide:chevron-right
export const ChevronRightIcon = ({ size = 24, color = '#666', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path d="m9 18 6-6-6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// 🗑️ Trash - lucide:trash-2
export const TrashIcon = ({ size = 24, color = '#DC3545', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path d="M3 6h18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1={10} y1={11} x2={10} y2={17} stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1={14} y1={11} x2={14} y2={17} stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// 🔀 Shuffle - lucide:shuffle
export const ShuffleIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="m18 2 4 4-4 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="m18 14 4 4-4 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// 📝 Edit Pencil - lucide:pencil
export const EditIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="m15 5 4 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ⏱️ Timer / Clock - lucide:clock
export const TimerIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
    <Polyline points="12,6 12,12 16,14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// 📤 Share - lucide:share
export const ShareIcon = ({ size = 24, color = '#FFFFFF', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="16,6 12,2 8,6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1={12} y1={2} x2={12} y2={15} stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// 🎯 Speedometer/Score Result - Material Symbols
export const ScoreResultIcon = ({ size = 24, color = '#321D71', style }) => (
  <Svg width={size} height={size} viewBox="0 -960 960 960" style={style}>
    <Path
      fill={color}
      d="M610-760q-21 0-35.5-14.5T560-810q0-21 14.5-35.5T610-860q21 0 35.5 14.5T660-810q0 21-14.5 35.5T610-760Zm0 660q-21 0-35.5-14.5T560-150q0-21 14.5-35.5T610-200q21 0 35.5 14.5T660-150q0 21-14.5 35.5T610-100Zm160-520q-21 0-35.5-14.5T720-670q0-21 14.5-35.5T770-720q21 0 35.5 14.5T820-670q0 21-14.5 35.5T770-620Zm0 380q-21 0-35.5-14.5T720-290q0-21 14.5-35.5T770-340q21 0 35.5 14.5T820-290q0 21-14.5 35.5T770-240Zm60-190q-21 0-35.5-14.5T780-480q0-21 14.5-35.5T830-530q21 0 35.5 14.5T880-480q0 21-14.5 35.5T830-430ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880v80q-134 0-227 93t-93 227q0 134 93 227t227 93v80Zm0-320q-33 0-56.5-23.5T400-480q0-5 .5-10.5T403-501l-83-83 56-56 83 83q4-1 21-3 33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Z"
    />
  </Svg>
);

// Función helper para obtener icono de score con colores del tema
export const getScoreIcon = (score, size = 32, theme = null) => {
  // Colores por defecto si no hay tema
  const colors = theme?.colors || {
    iconTrophy: '#D4A200',
    iconSuccess: '#1B8A3E', 
    iconPrimary: '#2E78C7',
    iconError: '#FF6B6B'
  };
  
  if (score >= 90) return <TrophyIcon size={size} color={colors.iconTrophy || '#FFD700'} />;
  if (score >= 70) return <CheckCircleIcon size={size} color={colors.iconSuccess || colors.success} />;
  if (score >= 50) return <BooksIcon size={size} color={colors.iconPrimary || colors.primary} />;
  return <MuscleIcon size={size} color={colors.iconError || '#FF6B6B'} />;
};

// ➕ Plus - lucide:plus
export const PlusIcon = ({ size = 24, color = '#FFFFFF', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// 🃏 Cards - lucide:layers
export const CardsIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ▶️ Play - lucide:play
export const PlayIcon = ({ size = 24, color = '#FFFFFF', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="m5 3 14 9-14 9V3z"
      fill={color}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 🔥 Fire - lucide:flame
export const FireIcon = ({ size = 24, color = '#FF6B6B', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
      fillOpacity={0.2}
    />
  </Svg>
);

// 🔍 Search - lucide:search
export const SearchIcon = ({ size = 24, color = '#666', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Circle cx={11} cy={11} r={8} stroke={color} strokeWidth={2} />
    <Path d="m21 21-4.35-4.35" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// ⬅️ Arrow Left - lucide:arrow-left
export const ArrowLeftIcon = ({ size = 24, color = '#666', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path d="m12 19-7-7 7-7M19 12H5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// 👍 Thumbs Up - lucide:thumbs-up
export const ThumbsUpIcon = ({ size = 24, color = '#22C55E', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="M7 22V11M2 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 1.7-.9l3.7-5.5a1 1 0 0 0-.2-1.3 1 1 0 0 0-.6-.3H15V5a3 3 0 0 0-3-3l-4 9v11"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 👎 Thumbs Down - lucide:thumbs-down
export const ThumbsDownIcon = ({ size = 24, color = '#EF4444', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="M17 2v11M22 11V5a2 2 0 0 0-2-2H8a2 2 0 0 0-1.7.9l-3.7 5.5a1 1 0 0 0 .2 1.3 1 1 0 0 0 .6.3H9v5a3 3 0 0 0 3 3l4-9V2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ⏰ Clock - lucide:clock
export const ClockIcon = ({ size = 24, color = '#F59E0B', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
    <Polyline points="12,6 12,12 16,14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// 🔊 Volume - lucide:volume-2
export const VolumeIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="M11 5L6 9H2v6h4l5 4V5z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15.54 8.46a5 5 0 0 1 0 7.07"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19.07 4.93a10 10 0 0 1 0 14.14"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 🎤 Microphone - lucide:mic
export const MicIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 10v2a7 7 0 0 1-14 0v-2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1="12"
      y1="19"
      x2="12"
      y2="23"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1="8"
      y1="23"
      x2="16"
      y2="23"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ⬇️ Download - lucide:download
export const DownloadIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline
      points="7 10 12 15 17 10"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1="12"
      y1="15"
      x2="12"
      y2="3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ☁️ Cloud - lucide:cloud
export const CloudIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ☁️⬇️ Cloud Download - lucide:cloud-download
export const CloudDownloadIcon = ({ size = 24, color = '#4A90D9', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 12v9"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="m8 17 4 4 4-4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Export all icons
export default {
  CheckCircleIcon,
  XCircleIcon,
  BooksIcon,
  BookOpenIcon,
  ClipboardEditIcon,
  ChartBarIcon,
  TrophyIcon,
  MuscleIcon,
  ClipboardListIcon,
  SaveIcon,
  FileTextIcon,
  FolderIcon,
  SparklesIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  RefreshIcon,
  HomeIcon,
  SettingsIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  TimerIcon,
  ShareIcon,
  CalendarIcon,
  TrashIcon,
  ShuffleIcon,
  EditIcon,
  ScoreResultIcon,
  getScoreIcon,
  PlusIcon,
  CardsIcon,
  PlayIcon,
  FireIcon,
  SearchIcon,
  ArrowLeftIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  ClockIcon,
  StarIcon,
  StarOutlineIcon,
  VolumeIcon,
  MicIcon,
  DownloadIcon,
  CloudIcon,
  CloudDownloadIcon,
};
