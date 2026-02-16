/**
 * Utility functions for loan classification and formatting
 */

export const getLoanTermLabel = (loan) => {
    if (!loan || loan.type !== 'Préstamo') return ''

    // Si no hay loanDetails, no podemos calcular el plazo remanente
    if (!loan.loanDetails) return 'Préstamo'

    const remainingMonths = loan.loanDetails.term - (loan.paidInstallments?.length || 0)

    if (remainingMonths <= 12) return 'Corto Plazo'
    if (remainingMonths <= 60) return 'Mediano Plazo'
    return 'Largo Plazo'
}

export const getTermColorClass = (label) => {
    switch (label) {
        case 'Corto Plazo': return 'text-rose-500 bg-rose-50 border-rose-100'
        case 'Mediano Plazo': return 'text-amber-500 bg-amber-50 border-amber-100'
        case 'Largo Plazo': return 'text-slate-500 bg-slate-50 border-slate-100'
        default: return 'text-slate-400 bg-slate-50 border-slate-100'
    }
}
