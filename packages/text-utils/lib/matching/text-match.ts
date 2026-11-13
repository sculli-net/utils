import * as stopword from 'stopword';
import type { LanguageCode } from 'stopword';

import { levenshteinDistance } from './levenshtein-distance.js';

export type { LanguageCode };

/**
 * How many units (words or characters) may differ for two values to still count as a match.
 *
 * - A number, or `{ type: 'absolute', threshold }`: a fixed count.
 * - `{ type: 'percentage', threshold }`: a fraction of the length (`0.2` is 20%), rounded to
 *   the nearest whole number.
 * - `{ type: 'min' | 'max', percentage, absolute }`: the smaller or larger of
 *   `percentage × length` and `absolute`. This one isn't rounded: differences are whole
 *   numbers, so a limit of `0.6` allows none.
 */
export type Threshold =
    | number
    | { type: 'percentage' | 'absolute'; threshold: number }
    | { type: 'min' | 'max'; percentage: number; absolute: number };

export type TextMatchConfig = {
    /**
     * How many of the target's words may be missing from the current text. Counted on the
     * normalised target, after stopwords are removed.
     * Default: `{ type: 'percentage', threshold: 0.2 }` (20% of the words, rounded).
     */
    wordThreshold?: Threshold;
    /**
     * How many edits (Levenshtein distance) a word may be from a target word and still count as
     * that word. Worked out separately for each target word, from that word's length.
     * Default: `{ type: 'min', percentage: 0.2, absolute: 2 }` (20% of the word, at most 2).
     */
    charThreshold?: Threshold;
    /**
     * Drop stopwords ("the", "and", "of"…) before matching. Text made only of stopwords keeps
     * them, so it still has something to match. Default: `true`.
     */
    ignoreStopwords?: boolean;
    /** Stopword list to use: an ISO 639-3 code from the `stopword` package. Default: `'eng'`. */
    language?: LanguageCode;
    /** Join the words and match the whole text as one word. Default: `false`. */
    ignoreSpaces?: boolean;
    /**
     * Match words in any order. When `false`, matched words must come in the same order as in the
     * target, though other words can sit between them. Either way, each word of the current text
     * can match only one target word. Default: `true`.
     */
    ignoreWordOrder?: boolean;
    /**
     * Remove every character that isn't an ASCII letter or digit, after accents are removed. This
     * also removes non-Latin scripts entirely. When `false`, only case and accents are
     * normalised. Default: `true`.
     */
    stripNonAlphanumeric?: boolean;
    /**
     * `'match'` returns a boolean, and stops comparing as soon as the answer is known.
     * `'distance'` returns a {@link TextMatchResult} with a score to sort by. Default: `'match'`.
     */
    returnType?: 'match' | 'distance';
};

export type TextMatchResult = {
    isMatch: boolean;
    /**
     * How far the current text is from the target: the edits for each matched word, plus the
     * length of each target word that wasn't matched. `0` is an exact match; lower is closer.
     */
    distance: number;
    /** How many target words were matched. */
    matchedWords: number;
    /** How many words the normalised target has. */
    targetWords: number;
};

export type NormalizeConfig = Pick<TextMatchConfig, 'ignoreStopwords' | 'language' | 'ignoreSpaces' | 'stripNonAlphanumeric'>;

type MatchConfig = TextMatchConfig & { returnType?: 'match' };
type DistanceConfig = TextMatchConfig & { returnType: 'distance' };

const defaultConfig: Required<TextMatchConfig> = {
    wordThreshold: { type: 'percentage', threshold: 0.2 },
    charThreshold: { type: 'min', percentage: 0.2, absolute: 2 },
    ignoreStopwords: true,
    language: 'eng',
    ignoreSpaces: false,
    ignoreWordOrder: true,
    stripNonAlphanumeric: true,
    returnType: 'match',
};

/** Fills in defaults key by key, so an option passed as `undefined` still gets its default. */
const resolveConfig = (config: TextMatchConfig = {}): Required<TextMatchConfig> => ({
    wordThreshold: config.wordThreshold ?? defaultConfig.wordThreshold,
    charThreshold: config.charThreshold ?? defaultConfig.charThreshold,
    ignoreStopwords: config.ignoreStopwords ?? defaultConfig.ignoreStopwords,
    language: config.language ?? defaultConfig.language,
    ignoreSpaces: config.ignoreSpaces ?? defaultConfig.ignoreSpaces,
    ignoreWordOrder: config.ignoreWordOrder ?? defaultConfig.ignoreWordOrder,
    stripNonAlphanumeric: config.stripNonAlphanumeric ?? defaultConfig.stripNonAlphanumeric,
    returnType: config.returnType ?? defaultConfig.returnType,
});

const getThresholdValue = (threshold: Threshold, length: number): number => {
    if (typeof threshold === 'number') return threshold;
    switch (threshold.type) {
        case 'absolute': return threshold.threshold;
        case 'percentage': return Math.round(threshold.threshold * length);
        case 'min': return Math.min(threshold.percentage * length, threshold.absolute);
        case 'max': return Math.max(threshold.percentage * length, threshold.absolute);
        default: {
            const unknown: never = threshold;
            throw new Error(`Unknown threshold type: ${JSON.stringify(unknown)}`);
        }
    }
};

export const removeAccents = (str: string) =>
    str.normalize('NFKD').replace(/[̀-ͯ]/g, '');

const HAS_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
const EDGE_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

/** Case and accents first (NFKD can produce capitals, e.g. `Ⅸ` → `IX`), then the optional strip. */
const normalizeWord = (word: string, strip: boolean) => {
    const plain = removeAccents(word).toLowerCase();
    return strip ? plain.replace(/[^a-z0-9]/g, '') : plain;
};

/** Without stripping, `"the,"` should still be found in the stopword list. */
const stopwordKey = (word: string, strip: boolean) =>
    strip ? word : word.replace(EDGE_PUNCTUATION, '');

const stopwordCache = new Map<string, Set<string>>();

/** The stopword list for a language, normalised the same way as the text it's checked against. */
const getStopwords = (language: LanguageCode, strip: boolean) => {
    const key = `${language}:${strip}`;
    let set = stopwordCache.get(key);
    if (!set) {
        const list: string[] | undefined = stopword[language];
        if (!Array.isArray(list)) throw new Error(`Unknown stopword language: ${language}`);
        set = new Set(list.map((word) => stopwordKey(normalizeWord(word, strip), strip)).filter(Boolean));
        stopwordCache.set(key, set);
    }
    return set;
};

/**
 * Splits text into normalised words: accents removed, lowercased and (by default) stripped to
 * ASCII letters and digits. Any whitespace, including tabs and line breaks, separates words.
 */
export const normalizeText = (text: string, config?: NormalizeConfig): string[] => {
    const { ignoreStopwords, language, ignoreSpaces, stripNonAlphanumeric } = resolveConfig(config);

    let words = text
        .split(/\s+/)
        .map((word) => normalizeWord(word, stripNonAlphanumeric))
        .filter((word) => HAS_LETTER_OR_DIGIT.test(word));

    if (ignoreStopwords) {
        const stopwords = getStopwords(language, stripNonAlphanumeric);
        const withoutStopwords = words.filter((word) => !stopwords.has(stopwordKey(word, stripNonAlphanumeric)));
        // Text made only of stopwords ("The Who") would otherwise have nothing left to match
        if (withoutStopwords.length > 0) words = withoutStopwords;
    }

    if (ignoreSpaces) return words.length > 0 ? [words.join('')] : [];
    return words;
};

type PreparedTarget = {
    words: string[];
    lengths: number[];
    /** The most edits each target word allows. */
    limits: number[];
    /** How many target words must be matched. */
    required: number;
};

const prepareTarget = (target: string, config: Required<TextMatchConfig>): PreparedTarget => {
    const words = normalizeText(target, config);
    const lengths = words.map((word) => Array.from(word).length);
    return {
        words,
        lengths,
        limits: lengths.map((length) => getThresholdValue(config.charThreshold, length)),
        required: words.length - getThresholdValue(config.wordThreshold, words.length),
    };
};

type Score = { matched: number; distance: number };

/**
 * Any order: a maximum one-to-one pairing of target words and current words (augmenting paths),
 * trying the closest current words first. In `'match'` mode it stops once the result is settled.
 */
const scoreAnyOrder = (current: string[], target: PreparedTarget, stopEarly: boolean): Score => {
    const { words, lengths, limits, required } = target;
    /** owner[j]: the target word paired with current word j, or -1. */
    const owner = new Array<number>(current.length).fill(-1);
    const pairDistance = new Array<number>(current.length).fill(0);
    const candidates: { j: number; d: number }[][] = [];

    const augment = (i: number, visited: boolean[]): boolean => {
        for (const { j, d } of candidates[i]) {
            if (visited[j]) continue;
            visited[j] = true;
            if (owner[j] === -1 || augment(owner[j], visited)) {
                owner[j] = i;
                pairDistance[j] = d;
                return true;
            }
        }
        return false;
    };

    let matched = 0;
    for (let i = 0; i < words.length; i++) {
        candidates[i] = current
            .map((word, j) => ({ j, d: levenshteinDistance(words[i], word, limits[i]) }))
            .filter(({ d }) => d <= limits[i])
            .sort((a, b) => a.d - b.d);

        if (augment(i, new Array<boolean>(current.length).fill(false))) matched++;

        const remaining = words.length - i - 1;
        if (stopEarly && (matched >= required || matched + remaining < required)) break;
    }

    let distance = 0;
    const isPaired = new Array<boolean>(words.length).fill(false);
    owner.forEach((i, j) => {
        if (i === -1) return;
        isPaired[i] = true;
        distance += pairDistance[j];
    });
    lengths.forEach((length, i) => {
        if (!isPaired[i]) distance += length;
    });

    return { matched, distance };
};

const better = (a: Score, b: Score) =>
    a.matched !== b.matched ? (a.matched > b.matched ? a : b) : (a.distance <= b.distance ? a : b);

/**
 * In order: the longest run of target words found in the same order in the current text, with
 * words allowed in between (a fuzzy longest common subsequence). Ties go to the smaller distance.
 */
const scoreInOrder = (current: string[], target: PreparedTarget): Score => {
    const { words, lengths, limits } = target;
    // previous[j]: the best score for the target words so far against the first j current words
    let previous: Score[] = Array.from({ length: current.length + 1 }, () => ({ matched: 0, distance: 0 }));

    for (let i = 0; i < words.length; i++) {
        const row: Score[] = [{ matched: 0, distance: previous[0].distance + lengths[i] }];
        for (let j = 1; j <= current.length; j++) {
            const skipTarget = { matched: previous[j].matched, distance: previous[j].distance + lengths[i] };
            let best = better(skipTarget, row[j - 1]);
            const d = levenshteinDistance(words[i], current[j - 1], limits[i]);
            if (d <= limits[i]) {
                best = better(best, { matched: previous[j - 1].matched + 1, distance: previous[j - 1].distance + d });
            }
            row.push(best);
        }
        previous = row;
    }

    return previous[current.length];
};

const score = (current: string[], target: PreparedTarget, config: Required<TextMatchConfig>): TextMatchResult => {
    const targetWords = target.words.length;
    // A target with no words left after normalising only matches text that has none either
    if (targetWords === 0) {
        return { isMatch: current.length === 0, distance: 0, matchedWords: 0, targetWords };
    }

    const { matched, distance } = config.ignoreWordOrder
        ? scoreAnyOrder(current, target, config.returnType === 'match')
        : scoreInOrder(current, target);

    return { isMatch: matched >= target.required, distance, matchedWords: matched, targetWords };
};

/**
 * Normalises `target` once and returns a function that compares a text against it. Use it to
 * compare many texts against the same target.
 */
export function createMatcher(target: string, config?: MatchConfig): (current: string) => boolean;
export function createMatcher(target: string, config: DistanceConfig): (current: string) => TextMatchResult;
export function createMatcher(target: string, config?: TextMatchConfig): (current: string) => boolean | TextMatchResult;
export function createMatcher(target: string, config?: TextMatchConfig) {
    const resolved = resolveConfig(config);
    const prepared = prepareTarget(target, resolved);

    return (current: string) => {
        const result = score(normalizeText(current, resolved), prepared, resolved);
        return resolved.returnType === 'match' ? result.isMatch : result;
    };
}

/** Compares `current` against `target`. See {@link TextMatchConfig} for how. */
export function textMatch(current: string, target: string, config?: MatchConfig): boolean;
export function textMatch(current: string, target: string, config: DistanceConfig): TextMatchResult;
export function textMatch(current: string, target: string, config?: TextMatchConfig): boolean | TextMatchResult;
export function textMatch(current: string, target: string, config?: TextMatchConfig) {
    return createMatcher(target, config)(current);
}
