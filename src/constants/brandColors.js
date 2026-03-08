// ============================================================================
// ARCHIVO: brandColors.js
// PROPÓSITO: Constantes de identidad de marca GarFinanzas (García Integrum)
// ============================================================================

// Paleta de colores corporativos
export const BRAND_COLORS = {
    // Colores principales
    navy: '#0f142b',      // Azul oscuro corporativo (fondo sidebar)
    green: '#009f4d',     // Verde corporativo (logos/acentos)
    gold: '#d4af37',      // Dorado corporativo (opcional)
    white: '#ffffff',     // Blanco

    // Variantes de navy
    navyLight: '#1b2245', // Para hover en el sidebar
    navyDark: '#080b1a',  // Para bordes en el sidebar

    // Variantes de verde
    greenLight: '#00c760',
    greenDark: '#007a3b',

    // Variantes de dorado
    goldLight: '#e6c75f',
    goldDark: '#b8941f',

    // Colores de fondo
    bgLight: '#f4f6fa',
    bgEmerald: '#f0fdf4',

    // Colores de estado
    success: '#009f4d',
    error: '#dc2626',
    warning: '#f59e0b',
    info: '#3b82f6',
}

// Gradientes de marca
export const BRAND_GRADIENTS = {
    primary: `linear-gradient(135deg, ${BRAND_COLORS.navy} 0%, ${BRAND_COLORS.navyLight} 100%)`,
    secondary: `linear-gradient(135deg, ${BRAND_COLORS.green} 0%, ${BRAND_COLORS.greenLight} 100%)`,
    accent: `linear-gradient(135deg, ${BRAND_COLORS.navy} 0%, ${BRAND_COLORS.green} 100%)`,
}

// Tipografía de marca
export const BRAND_FONTS = {
    sansSerif: 'Inter, system-ui, sans-serif', // Updated to a modern sans-serif
    serif: 'Georgia, serif',
}

// Nombre y tagline
export const BRAND_TEXT = {
    name: 'GarFinanzas',
    tagline: 'GARCÍA INTEGRUM',
    initials: 'GF',
}

// Clases de Tailwind reutilizables
export const BRAND_CLASSES = {
    // Botones
    btnPrimary: 'bg-[#0f142b] hover:bg-[#1b2245] text-white font-bold shadow-lg shadow-[#0f142b]/20 transition-all',
    btnSecondary: 'bg-[#009f4d] hover:bg-[#007a3b] text-white font-bold shadow-lg shadow-[#009f4d]/20 transition-all',

    // Inputs
    input: 'border-2 border-slate-100 focus:border-[#009f4d] focus:ring-2 focus:ring-[#009f4d]/20 transition-all',

    // Cards
    card: 'bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all',
    cardAccent: 'bg-white rounded-2xl shadow-sm border-2 border-[#009f4d]/20 hover:shadow-md transition-all',

    // Texto
    textPrimary: 'text-[#0f142b]',
    textSecondary: 'text-[#009f4d]',
    textAccent: 'text-slate-500',

    // Badges
    badgeNavy: 'bg-[#0f142b]/10 text-[#0f142b] border border-[#0f142b]/20',
    badgeGreen: 'bg-[#009f4d]/10 text-[#009f4d] border border-[#009f4d]/20',
    badgeGold: 'bg-slate-100 text-slate-700 border border-slate-200',
}
