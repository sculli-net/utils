import { describe, expect, it } from 'vitest';

import { createMatcher, findClosestMatch, findMatches, levenshteinDistance, normalizeText, textMatch } from '../../index.js';

describe('levenshteinDistance', () => {
    it('computes exact distances', () => {
        expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
        expect(levenshteinDistance('', 'abc')).toBe(3);
        expect(levenshteinDistance('abc', '')).toBe(3);
        expect(levenshteinDistance('same', 'same')).toBe(0);
    });

    it('stops early past max and returns max + 1', () => {
        expect(levenshteinDistance('kitten', 'sitting', 1)).toBe(2);
        expect(levenshteinDistance('a', 'abcdef', 2)).toBe(3);
        expect(levenshteinDistance('kitten', 'sitting', 3)).toBe(3);
    });

    it('counts code points, not UTF-16 units', () => {
        expect(levenshteinDistance('a😀', 'a')).toBe(1);
    });
});

describe('normalizeText', () => {
    it('lowercases, removes accents and strips punctuation by default', () => {
        expect(normalizeText('Crème Brûlée!')).toEqual(['creme', 'brulee']);
    });

    it('treats line breaks, tabs and repeated spaces as word breaks', () => {
        expect(normalizeText('hello\nworld\tagain  moon')).toEqual(['hello', 'world', 'again', 'moon']);
    });

    it('drops words left empty by stripping', () => {
        expect(normalizeText('well-known - thing')).toEqual(['wellknown', 'thing']);
        expect(normalizeText('мир')).toEqual([]);
    });

    it('keeps other characters when stripNonAlphanumeric is false', () => {
        expect(normalizeText('Привет, мир', { stripNonAlphanumeric: false })).toEqual(['привет,', 'мир']);
        expect(normalizeText('well-known', { stripNonAlphanumeric: false })).toEqual(['well-known']);
    });

    it('finds stopwords next to punctuation without stripping', () => {
        expect(normalizeText('the, cat', { stripNonAlphanumeric: false })).toEqual(['cat']);
    });

    it('removes stopwords, but keeps them when nothing else is left', () => {
        expect(normalizeText('The cat and the hat')).toEqual(['cat', 'hat']);
        expect(normalizeText('The Who')).toEqual(['the', 'who']);
        expect(normalizeText('The cat', { ignoreStopwords: false })).toEqual(['the', 'cat']);
    });

    it('uses the stopword list for the chosen language', () => {
        expect(normalizeText('le chat et la souris', { language: 'fra' })).toEqual(['chat', 'souris']);
        expect(normalizeText('le chat et la souris')).toEqual(['le', 'chat', 'et', 'la', 'souris']);
    });

    it('joins words with ignoreSpaces', () => {
        expect(normalizeText('ice cream', { ignoreSpaces: true })).toEqual(['icecream']);
        expect(normalizeText('', { ignoreSpaces: true })).toEqual([]);
    });
});

describe('textMatch', () => {
    it('matches empty against empty', () => {
        expect(textMatch('', '')).toBe(true);
        expect(textMatch('something', '')).toBe(false);
    });

    it('works out the typo allowance per target word', () => {
        // 3 letters: 20% is 0.6, so no edits allowed
        expect(textMatch('car', 'cat')).toBe(false);
        expect(textMatch('toe banana', 'tea banana')).toBe(false);
        // 5 letters: one edit
        expect(textMatch('aple', 'apple')).toBe(true);
        // 10+ letters: two edits, the absolute cap
        expect(textMatch('strawbery jam', 'strawberries jam')).toBe(false);
        expect(textMatch('strawberis', 'strawberries')).toBe(true);
    });

    it('lets 20% of the target words be missing', () => {
        expect(textMatch('quick brown fox jumps', 'quick brown fox jumps high')).toBe(true);
        expect(textMatch('quick brown fox', 'quick brown fox jumps high')).toBe(false);
    });

    it('counts each current word once', () => {
        expect(textMatch('red red', 'red apple')).toBe(false);
        expect(textMatch('apple red', 'red apple')).toBe(true);
    });

    it('pairs words so each target word gets its own match', () => {
        // "cart" fits only "carts"; "cars" fits either, so it must leave "carts" free
        expect(textMatch('cars carts', 'cart cars', { charThreshold: 1 })).toBe(true);
    });

    it('ignores word order by default, and checks it when asked', () => {
        expect(textMatch('man bites dog', 'dog bites man')).toBe(true);
        expect(textMatch('man bites dog', 'dog bites man', { ignoreWordOrder: false })).toBe(false);
        expect(textMatch('the big dog bites a man', 'dog bites man', { ignoreWordOrder: false })).toBe(true);
    });

    it('uses ignoreStopwords for both values', () => {
        expect(textMatch('who', 'The Who', { wordThreshold: 0 })).toBe(false);
        expect(textMatch('the who', 'The Who', { wordThreshold: 0 })).toBe(true);
        expect(textMatch('a cat', 'the cat', { ignoreStopwords: false, wordThreshold: 0 })).toBe(false);
    });

    it('falls back to defaults for options passed as undefined', () => {
        expect(textMatch('apple', 'apple', { wordThreshold: undefined, charThreshold: undefined })).toBe(true);
    });

    it('returns a score with returnType distance', () => {
        expect(textMatch('red apple', 'red apple', { returnType: 'distance' })).toEqual({
            isMatch: true,
            distance: 0,
            matchedWords: 2,
            targetWords: 2,
        });
        // "aple" is one edit away; "pie" (3 letters) is unmatched and costs its length
        expect(textMatch('aple', 'apple pie', { returnType: 'distance' })).toEqual({
            isMatch: false,
            distance: 4,
            matchedWords: 1,
            targetWords: 2,
        });
    });

    it('gives the same result in order as out of order when words line up', () => {
        const options = { returnType: 'distance', ignoreWordOrder: false } as const;
        expect(textMatch('quick brwn fox', 'quick brown fox', options)).toEqual({
            isMatch: true,
            distance: 1,
            matchedWords: 3,
            targetWords: 3,
        });
    });
});

describe('createMatcher', () => {
    it('reuses one target across many texts', () => {
        const matches = createMatcher('brown fox');
        expect(matches('the brown fox')).toBe(true);
        expect(matches('grey wolf')).toBe(false);
    });
});

describe('findMatches / findClosestMatch', () => {
    const candidates = ['Apple pie', 'Aple pie', 'Banana bread', 'apple pies'];

    it('finds every match, in order', () => {
        expect(findMatches(candidates, 'apple pie')).toEqual(['Apple pie', 'Aple pie']);
    });

    it('finds the closest match', () => {
        expect(findClosestMatch(candidates, 'aple pie')).toBe('Aple pie');
        expect(findClosestMatch(candidates, 'apple pie')).toBe('Apple pie');
        expect(findClosestMatch(candidates, 'chocolate cake')).toBeNull();
    });
});
