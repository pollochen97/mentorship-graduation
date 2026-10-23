// Lays photos out in rows without cropping any of them (#7). Pure, so it is unit tested.

export type PhotoRow = {
  /** Indexes into the photos, in order. */
  items: number[];
  /** Photo height in px; each photo is then `ratio * height` wide. */
  height: number;
};

/**
 * Splits photos (given as width / height ratios, in order) into rows that fit a `width` × `height`
 * box with `gap` px between photos and rows. Every photo in a row gets the same height, and each row
 * fills the width unless that would make the whole too tall, in which case all rows shrink alike and
 * sit centred. Of all the ways to split them, picks the one where the photos cover the most area,
 * scaled down by how uneven the rows are (shortest / tallest), so one big photo over five thumbnails
 * loses to three even rows of two, while three photos still go one big above two.
 */
export function photoRows(ratios: number[], width: number, height: number, gap: number) {
  let best: PhotoRow[] = [];
  let bestScore = -1;
  for (const sizes of splits(ratios.length)) {
    let start = 0;
    const rows = sizes.map((size) => {
      const items = Array.from({ length: size }, (_, i) => start + i);
      start += size;
      const sum = items.reduce((total, i) => total + ratios[i], 0);
      return { items, height: (width - gap * (size - 1)) / sum };
    });
    const free = height - gap * (rows.length - 1);
    const tall = rows.reduce((total, row) => total + row.height, 0);
    const scale = Math.min(1, free / tall);
    for (const row of rows) row.height *= scale;
    const area = rows.reduce(
      (total, row) => total + row.items.reduce((a, i) => a + ratios[i] * row.height ** 2, 0),
      0,
    );
    const heights = rows.map((row) => row.height);
    const score = area * (Math.min(...heights) / Math.max(...heights) || 1);
    // Strictly greater, so on a tie the split found first wins: fewer rows, then the shortest first
    // row, which gives the opening photo the most room.
    if (score > bestScore + 0.5) {
      best = rows;
      bestScore = score;
    }
  }
  return best;
}

/** Every way to cut n photos into rows, keeping their order; fewest rows first, then shortest first row. */
function splits(n: number): number[][] {
  if (n === 0) return [[]];
  const all: number[][] = [];
  const walk = (left: number, sizes: number[]) => {
    if (left === 0) return all.push(sizes);
    for (let size = 1; size <= left; size++) walk(left - size, [...sizes, size]);
  };
  walk(n, []);
  return all.sort((a, b) => a.length - b.length);
}
