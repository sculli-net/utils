import { createMatcher, type TextMatchConfig } from './text-match.js';

type GroupConfig = Omit<TextMatchConfig, 'returnType'>;

/**
 * Returns the candidates that match the target, in their original order.
 * @param candidates - Candidate values
 * @param target - The target to test against
 * @param config - Optional matching config
 */
export const findMatches = (candidates: string[], target: string, config?: GroupConfig): string[] => {
    const isMatch = createMatcher(target, { ...config, returnType: 'match' });
    return candidates.filter((candidate) => isMatch(candidate));
};

/**
 * Returns the matching candidate closest to the target (the lowest distance), or `null` if none
 * match. On a tie, the earlier candidate wins.
 * @param candidates - Candidate values
 * @param target - The target to test against
 * @param config - Optional matching config
 */
export const findClosestMatch = (candidates: string[], target: string, config?: GroupConfig): string | null => {
    const compare = createMatcher(target, { ...config, returnType: 'distance' });
    let closest: string | null = null;
    let closestDistance = Infinity;

    for (const candidate of candidates) {
        const { isMatch, distance } = compare(candidate);
        if (isMatch && distance < closestDistance) {
            closest = candidate;
            closestDistance = distance;
        }
    }

    return closest;
};
