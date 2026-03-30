/**
 * Utility functions for loan classification and formatting
 */

const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100

export const getLoanTermLabel = (loan) => {
    if (!loan || loan.type !== 'Préstamo') return ''
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

/**
 * Calcula la segregación de una deuda según su vencimiento (Corto, Mediano, Largo Plazo)
 * Corto Plazo: Lo que vence en los próximos 12 meses
 * Mediano Plazo: Lo que vence entre el mes 13 y el 60 (1 a 5 años)
 * Largo Plazo: Lo que vence después del mes 60 (> 5 años)
 */
export const calculateDebtBreakdown = (loan) => {
    if (!loan.loanDetails || loan.type !== 'Préstamo') {
        return { short: loan.balance || 0, medium: 0, long: 0 }
    }

    const { loanAmount, interestRate, term } = loan.loanDetails
    const monthlyRate = (interestRate / 100) / 12
    const monthlyPayment = monthlyRate === 0
        ? loanAmount / term
        : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1)

    const paidInstallmentsCount = loan.paidInstallments?.length || 0
    let breakdown = { short: 0, medium: 0, long: 0 }

    let currentBalance = loanAmount

    // Recorremos toda la tabla de amortización original
    for (let i = 1; i <= term; i++) {
        const interest = round2(currentBalance * monthlyRate)
        const principal = round2(monthlyPayment - interest)

        // Solo nos interesan las cuotas que NO han sido pagadas
        if (i > paidInstallmentsCount) {
            // Determinar en qué "canasta" cae esta cuota relativa al momento actual
            const relativeMonth = i - paidInstallmentsCount

            if (relativeMonth <= 12) {
                breakdown.short += principal
            } else if (relativeMonth <= 60) {
                breakdown.medium += principal
            } else {
                breakdown.long += principal
            }
        }

        currentBalance = round2(currentBalance - principal)
    }

    // Ajustar por pagos manuales extras (proporcionalmente del final hacia atrás o simplemente reducir el total)
    const manualPaymentsTotal = (loan.manualPayments || []).reduce((sum, p) => sum + p.amount, 0)
    if (manualPaymentsTotal > 0) {
        // Reducir primero del largo plazo, luego mediano, luego corto
        let remainingReduction = manualPaymentsTotal

        if (breakdown.long >= remainingReduction) {
            breakdown.long -= remainingReduction
            remainingReduction = 0
        } else {
            remainingReduction -= breakdown.long
            breakdown.long = 0

            if (breakdown.medium >= remainingReduction) {
                breakdown.medium -= remainingReduction
                remainingReduction = 0
            } else {
                remainingReduction -= breakdown.medium
                breakdown.medium = 0
                breakdown.short = Math.max(0, breakdown.short - remainingReduction)
            }
        }
    }

    return {
        short: round2(breakdown.short),
        medium: round2(breakdown.medium),
        long: round2(breakdown.long)
    }
}
