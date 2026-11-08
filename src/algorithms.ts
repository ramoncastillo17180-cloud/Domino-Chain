export type Board = boolean[][];
export type Cell = { row: number; col: number };
export type Visit = Cell & { depth: number };
export type SearchResult = { order: Visit[]; levels: Visit[][]; maxDepth: number; milliseconds: number };
export const SIZE = 10;
export const key = ({ row, col }: Cell) => `${row},${col}`;
export const emptyBoard = (): Board => Array.from({ length: SIZE }, () => Array<boolean>(SIZE).fill(false));

// El orden de vecinos hace reproducibles los recorridos: arriba, derecha, abajo, izquierda.
function neighbors(board: Board, { row, col }: Cell): Cell[] {
  return [{ row: row - 1, col }, { row, col: col + 1 }, { row: row + 1, col }, { row, col: col - 1 }]
    .filter(p => board[p.row]?.[p.col]);
}

// BFS usa una cola FIFO con índice de lectura (sin el costo de Array.shift).
// Se marca al encolar: cada nodo entra una sola vez y su nivel es la distancia mínima.
export function bfs(board: Board, start: Cell): SearchResult {
  const began = performance.now();
  const order: Visit[] = [];
  const levels: Visit[][] = [];
  if (board[start.row]?.[start.col]) {
    const queue: Visit[] = [{ ...start, depth: 0 }];
    const visited = new Set([key(start)]);
    for (let head = 0; head < queue.length; head++) {
      const current = queue[head];
      order.push(current);
      (levels[current.depth] ??= []).push(current);
      for (const next of neighbors(board, current)) {
        if (visited.has(key(next))) continue;
        visited.add(key(next));
        queue.push({ ...next, depth: current.depth + 1 });
      }
    }
  }
  return { order, levels, maxDepth: Math.max(0, levels.length - 1), milliseconds: performance.now() - began };
}

// DFS desciende por una rama antes de retroceder. La profundidad pertenece
// al árbol DFS; no garantiza distancia mínima. No altera la matriz ni la animación.
export function dfs(board: Board, start: Cell): SearchResult {
  const began = performance.now();
  const visited = new Set<string>();
  const order: Visit[] = [];
  const levels: Visit[][] = [];
  function visit(cell: Cell, depth: number) {
    visited.add(key(cell));
    const current = { ...cell, depth };
    order.push(current);
    (levels[depth] ??= []).push(current);
    for (const next of neighbors(board, cell)) if (!visited.has(key(next))) visit(next, depth + 1);
  }
  if (board[start.row]?.[start.col]) visit(start, 0);
  return { order, levels, maxDepth: Math.max(0, levels.length - 1), milliseconds: performance.now() - began };
}
