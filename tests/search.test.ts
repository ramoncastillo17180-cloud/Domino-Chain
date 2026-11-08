import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bfs, dfs, emptyBoard, key } from '../src/algorithms.ts';

test('BFS encuentra distancias mínimas en ciclos, sin diagonales ni duplicados', () => {
  const board = emptyBoard();
  for (const [r, c] of [[1,1],[1,2],[2,1],[2,2],[3,3],[8,8]]) board[r][c] = true;
  const original = JSON.stringify(board);
  const result = bfs(board, { row: 1, col: 1 });
  assert.deepEqual(result.levels.map(level => level.length), [1,2,1]);
  assert.equal(result.maxDepth, 2);
  assert.equal(new Set(result.order.map(key)).size, 4);
  const depth = dfs(board, { row: 1, col: 1 });
  assert.equal(depth.maxDepth, 3);
  assert.deepEqual(new Set(depth.order.map(key)), new Set(result.order.map(key)));
  assert.equal(JSON.stringify(board), original);
  assert.ok(result.milliseconds >= 0 && depth.milliseconds >= 0);
});

test('Tablero vacío y ficha aislada', () => {
  const board = emptyBoard();
  for (const algorithm of [bfs, dfs]) {
    assert.equal(algorithm(board, { row: 0, col: 0 }).order.length, 0);
    board[9][9] = true;
    const result = algorithm(board, { row: 9, col: 9 });
    assert.equal(result.order.length, 1);
    assert.equal(result.maxDepth, 0);
  }
});

test('Matriz completa: 100 nodos, 19 niveles y profundidad BFS 18', () => {
  const board = emptyBoard().map(row => row.map(() => true));
  const result = bfs(board, { row: 0, col: 0 });
  assert.equal(result.order.length, 100);
  assert.equal(result.levels.length, 19);
  assert.equal(result.maxDepth, 18);
  for (const node of result.order) assert.equal(node.depth, node.row + node.col);
  const comparison = dfs(board, { row: 0, col: 0 });
  assert.equal(new Set(comparison.order.map(key)).size, 100);
});
