// ============================================================================
// ARCHIVO: brandColors.js
// PROPÓSITO: Constantes de identidad de marca NegociosGarcia
// ============================================================================

// Paleta de colores corporativos
export const BRAND_COLORS = {
    // Colores principales
    navy: '#1e3a5f',      // Azul oscuro corporativo
    green: '#0d8b5f',     // Verde corporativo
    gold: '#d4af37',      // Dorado corporativo
    white: '#ffffff',     // Blanco

    // Variantes de navy
    navyLight: '#2d5a8f',
    navyDark: '#0f1f3f',

    // Variantes de verde
    greenLight: '#10a674',
    greenDark: '#096b47',

    // Variantes de dorado
    goldLight: '#e6c75f',
    goldDark: '#b8941f',

    // Colores de fondo
    bgLight: '#f9fafb',
    bgEmerald: '#f0fdf4',

    // Colores de estado
    success: '#10a674',
    error: '#dc2626',
    warning: '#f59e0b',
    info: '#3b82f6',
}

// Gradientes de marca
export const BRAND_GRADIENTS = {
    primary: `linear-gradient(135deg, ${BRAND_COLORS.navy} 0%, ${BRAND_COLORS.green} 100%)`,
    secondary: `linear-gradient(135deg, ${BRAND_COLORS.green} 0%, ${BRAND_COLORS.gold} 100%)`,
    accent: `linear-gradient(135deg, ${BRAND_COLORS.gold} 0%, ${BRAND_COLORS.navy} 100%)`,
}

// Tipografía de marca
export const BRAND_FONTS = {
    serif: 'Georgia, serif',
    sansSerif: 'system-ui, -apple-system, sans-serif',
}

// Nombre y tagline
export const BRAND_TEXT = {
    name: 'NegociosGarcia',
    tagline: 'Crecimiento y Confianza',
    initials: 'NG',
}

// Clases de Tailwind reutilizables
export const BRAND_CLASSES = {
    // Botones
    btnPrimary: 'bg-gradient-to-r from-[#1e3a5f] to-[#0d8b5f] hover:from-[#0d8b5f] hover:to-[#1e3a5f] text-white font-bold shadow-lg shadow-emerald-200 transition-all',
    btnSecondary: 'bg-gradient-to-r from-[#0d8b5f] to-[#d4af37] hover:from-[#d4af37] hover:to-[#0d8b5f] text-white font-bold shadow-lg shadow-emerald-200 transition-all',

    // Inputs
    input: 'border-2 border-slate-100 focus:border-[#0d8b5f] focus:ring-2 focus:ring-[#0d8b5f]/20 transition-all',

    // Cards
    card: 'bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all',
    cardAccent: 'bg-white rounded-2xl shadow-sm border-2 border-[#0d8b5f]/10 hover:shadow-md transition-all',

    // Texto
    textPrimary: 'text-[#1e3a5f]',
    textSecondary: 'text-[#0d8b5f]',
    textAccent: 'text-[#d4af37]',

    // Badges
    badgeNavy: 'bg-[#1e3a5f]/10 text-[#1e3a5f] border border-[#1e3a5f]/20',
    badgeGreen: 'bg-[#0d8b5f]/10 text-[#0d8b5f] border border-[#0d8b5f]/20',
    badgeGold: 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20',
}
