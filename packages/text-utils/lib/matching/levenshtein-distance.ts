/**
 * Levenshtein edit distance between two strings, counted in code points (not UTF-16 units).
 *
 * Pass `max` when you only need to know whether the distance is within a limit: the function
 * then stops as soon as the distance is known to be over it and returns `max + 1`. Any result
 * up to `max` is exact.
 */
export function levenshteinDistance(value1: string, value2: string, max = Infinity): number {
    if (value1 === value2) return 0;

    // Iterate the shorter string in the inner loop, so the rows stay small
    let a = Array.from(value1);
    let b = Array.from(value2);
    if (a.length < b.length) [a, b] = [b, a];

    // The distance is at least the difference in length
    if (a.length - b.length > max) return max + 1;
    if (b.length === 0) return a.length;

    let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
    let current = new Array<number>(b.length + 1);

    for (let i = 1; i <= a.length; i++) {
        current[0] = i;
        let rowMin = i;

        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            current[j] = Math.min(
                previous[j] + 1,          // Deletion
                current[j - 1] + 1,       // Insertion
                previous[j - 1] + cost,   // Substitution
            );
            if (current[j] < rowMin) rowMin = current[j];
        }

        // Every later row is at least this row's minimum
        if (rowMin > max) return max + 1;
        [previous, current] = [current, previous];
    }

    const distance = previous[b.length];
    return distance > max ? max + 1 : distance;
}
