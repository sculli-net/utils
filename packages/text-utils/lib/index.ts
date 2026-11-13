export {
    createMatcher,
    normalizeText,
    removeAccents,
    textMatch,
    type LanguageCode,
    type NormalizeConfig,
    type TextMatchConfig,
    type TextMatchResult,
    type Threshold,
} from './matching/text-match.js';
export { findClosestMatch, findMatches } from './matching/group.js';
export { levenshteinDistance } from './matching/levenshtein-distance.js';
