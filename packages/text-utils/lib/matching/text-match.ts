import { removeStopwords, eng,} from 'stopword'

import { levenshteinDistance } from "./levenshtein-distance.js";

const isDev = true;
if (isDev) console.warn("DEBUG is on. Change 'isDev' to false for production.");

const logResult = false;

export const normalizeText = (text: string): string[] => {

    // Remove non-alphanumeric characters and convert to lowercase
    const alphanumbericChars = text.replace(/[^a-zA-Z0-9 ]/g, '').trim().toLowerCase();
    // Remove stopwords ( i.e. "the", "and", "of", etc. )
    const strippedAnswer = removeStopwords(alphanumbericChars.split(' '), eng).map(word => word.trim());

    return strippedAnswer
}

export const normalizeTargetValue = (answer: string) => {
    return removeStopwords(answer.split(' '), eng).join(' ').trim()
}


export const textMatch = (current: string, target: string) => {   

    
    const normalizedCurrentValue = normalizeText(current);
    const normalizedTargetValue = normalizeText(target);

    const targetValueLength = normalizedTargetValue.join('').length;
    const threshold = Math.min(2, Math.round(targetValueLength * 0.10));

    if (isDev && logResult) {
        console.log('Normalized Answer:', normalizedCurrentValue);
        console.log('Normalized Correct Answer:', normalizedTargetValue);
        console.log('Threshold:', threshold);
    }

    // Check if all words in the correct answer are within 2 levenshtein distance of any word in the answer
    const isCorrect = normalizedTargetValue.every(word => normalizedCurrentValue.find(w => levenshteinDistance(w, word) <= threshold));
    
    return isCorrect;

}