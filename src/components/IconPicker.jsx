// ============================================================================
// COMPONENTE: IconPicker
// PROPÓSITO: Selector de iconos para categorías personalizadas
// ============================================================================
import React, { useState } from 'react'

// Lista de iconos disponibles (emojis)
export const AVAILABLE_ICONS = [
    // Comida y bebida
    '🍕', '🍔', '🍟', '🌭', '🍿', '🥗', '🍝', '🍜', '🍲', '🍱',
    '🍛', '🍣', '🍤', '🍙', '🥘', '🍞', '🥐', '🥖', '🧀', '🥚',
    '🍳', '🥓', '🥩', '🍗', '🍖', '🌮', '🌯', '🥙', '🥪', '🍕',
    '☕', '🍵', '🧃', '🥤', '🍺', '🍻', '🍷', '🍸', '🍹', '🧉',

    // Transporte
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
    '🚚', '🚛', '🚜', '🛵', '🏍️', '🚲', '🛴', '✈️', '🚁', '🚂',
    '⛽', '🅿️', '🚦', '🚥', '🛣️',

    // Hogar y servicios
    '🏠', '🏡', '🏢', '🏬', '🏪', '🏨', '🏦', '🏥', '💡', '🔌',
    '🚿', '🛁', '🚽', '🧹', '🧺', '🧼', '🧽', '🧴', '🔧', '🔨',
    '🪛', '⚙️', '🔩', '⚡', '💧', '🌊', '🔥', '❄️',

    // Compras y retail
    '🛒', '🛍️', '💳', '💰', '💵', '💴', '💶', '💷', '🏷️', '🎁',
    '📦', '📫', '📪', '📬', '📭', '📮',

    // Salud y bienestar
    '💊', '💉', '🩺', '🩹', '🩼', '🦷', '🏥', '⚕️', '🧘', '🏋️',
    '🤸', '🧖', '💆', '💇', '🧴', '🧪', '🔬',

    // Educación y trabajo
    '📚', '📖', '📝', '✏️', '✒️', '🖊️', '🖍️', '📄', '📃', '📑',
    '📊', '📈', '📉', '💼', '👔', '🎓', '🏫', '🏢', '💻', '⌨️',
    '🖥️', '🖨️', '📱', '☎️', '📞',

    // Entretenimiento
    '🎮', '🎯', '🎲', '🎰', '🎳', '🎬', '🎭', '🎪', '🎨', '🎸',
    '🎹', '🎺', '🎻', '🥁', '🎧', '🎤', '🎵', '🎶', '📺', '📻',
    '📷', '📸', '🎥', '🎞️', '🎟️', '🎫',

    // Deportes
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
    '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '⛳', '🏹', '🎣', '🥊',
    '🥋', '⛷️', '🏂', '🏊', '🏄', '🚴', '🏇', '🤺',

    // Viajes
    '✈️', '🚁', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉',
    '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒',
    '🗺️', '🧳', '⛱️', '🏖️', '🏝️', '🗿', '🗽', '🗼', '🏰', '🏯',

    // Animales y naturaleza
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
    '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🌾', '🌺', '🌻',
    '🌹', '🌷', '🌸', '💐', '🌼', '🌈', '⭐', '✨', '⚡', '🔥',

    // Otros
    '📍', '📌', '📎', '🔗', '⛓️', '🔒', '🔓', '🔑', '🗝️', '🔔',
    '🔕', '📣', '📢', '💬', '💭', '🗯️', '♠️', '♥️', '♦️', '♣️',
    '🎯', '🎪', '🎨', '🎬', '🎭', '🎪', '🎡', '🎢', '🎠', '🎰'
]

const IconPicker = ({ selectedIcon, onSelectIcon }) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [showAll, setShowAll] = useState(false)

    // Filtrar iconos si hay búsqueda
    const filteredIcons = AVAILABLE_ICONS

    // Mostrar solo los primeros 40 iconos por defecto
    const displayedIcons = showAll ? filteredIcons : filteredIcons.slice(0, 40)

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Icono
                </label>
                {selectedIcon && (
                    <span className="text-2xl">{selectedIcon}</span>
                )}
            </div>

            {/* Grid de iconos */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-10 gap-2">
                    {displayedIcons.map((icon, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => onSelectIcon(icon)}
                            className={`
                                text-2xl p-2 rounded-lg transition-all hover:scale-110
                                ${selectedIcon === icon
                                    ? 'bg-blue-100 ring-2 ring-blue-500 shadow-md'
                                    : 'hover:bg-white hover:shadow-sm'
                                }
                            `}
                            title={icon}
                        >
                            {icon}
                        </button>
                    ))}
                </div>

                {!showAll && filteredIcons.length > 40 && (
                    <button
                        type="button"
                        onClick={() => setShowAll(true)}
                        className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Ver más iconos ({filteredIcons.length - 40} más)
                    </button>
                )}
            </div>

            {/* Iconos sugeridos por categoría */}
            <div className="text-xs text-slate-500">
                <p className="font-bold mb-1">Sugerencias:</p>
                <div className="flex gap-2 flex-wrap">
                    <span>🍕 Comida</span>
                    <span>🚗 Transporte</span>
                    <span>🏠 Hogar</span>
                    <span>💊 Salud</span>
                    <span>🎮 Entretenimiento</span>
                    <span>📚 Educación</span>
                </div>
            </div>
        </div>
    )
}

export default IconPicker
