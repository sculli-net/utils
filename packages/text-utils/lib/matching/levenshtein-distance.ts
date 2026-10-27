export function levenshteinDistance(value1: string, value2: string) {


    const rows = value1.length + 1;
    const cols = value2.length + 1;
    const dist = Array.from(Array(rows), () => new Array(cols));

    for (let i = 0; i < rows; i++) {
      dist[i][0] = i;
    }
    for (let i = 0; i < cols; i++) {
      dist[0][i] = i;
    }

    for (let i = 1; i < rows; i++) {
      for (let j = 1; j < cols; j++) {
          const cost = value1[i - 1] === value2[j - 1] ? 0 : 1;
          dist[i][j] = Math.min(dist[i - 1][j] + 1,       // Deletion
          dist[i][j - 1] + 1,       // Insertion
          dist[i - 1][j - 1] + cost // Substitution
          );
      }
    }

    // The distance is in the bottom-right corner of the matrix
    return dist[rows - 1][cols - 1];

}