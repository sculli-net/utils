
import { normalizeText, normalizeTargetValue } from "./matching/text-match.js"

const targetValue = '';
const currentValue = ''

const normalizedAnswer = normalizeText(currentValue)
const normalizedTargetValue = normalizeText(targetValue)

const normalizedTarget = normalizeTargetValue(targetValue)

const threshold = () => {
    const targetValueLength = normalizedTargetValue.join('').length
    const threshold = Math.min(2, Math.round(targetValueLength * 0.1))
    return threshold
}