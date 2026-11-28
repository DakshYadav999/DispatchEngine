// Nearest-rank percentile: the smallest value such that at least p% of values are <= it.
export function percentile(values: number[], p: number): number | null {
    if (values.length === 0) return null;
    if (!(p > 0 && p <= 100)) {
        throw new RangeError(`p must be in (0, 100], got ${p}`);
    }
    const sorted = [...values].sort((a, b) => a - b); // copy: never reorder the caller's array
    const rank = Math.ceil((p * sorted.length) / 100); // 1-based position
    return sorted[rank - 1]!;
}

// Spread of the whole population (all drivers), so divide by n.
export function populationStdDev(values: number[]): number | null {
    if (values.length === 0) return null;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
        values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
}

// Jain's fairness index: 1 means everyone did the same amount, 1/n means one did everything.
export function jainIndex(values: number[]): number | null {
    if (values.length === 0) return null;
    const sum = values.reduce((a, v) => a + v, 0);
    const sumSquares = values.reduce((a, v) => a + v * v, 0);
    if (sumSquares === 0) return null; // nobody worked: fairness is undefined
    return (sum * sum) / (values.length * sumSquares);
}