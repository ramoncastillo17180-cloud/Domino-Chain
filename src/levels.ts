import { emptyBoard, type Board, type Cell } from './algorithms';
export type Level = { name: string; subtitle: string; board: Board; start: Cell | null };
function pattern(rows: string[]): Board { return rows.map(row => [...row].map(c => c === '#')); }
export function getLevels(): Level[] {
  return [
    { name: 'Primer impulso', subtitle: 'Una curva. Una reacción.', start: { row: 2, col: 2 }, board: pattern(['..........','..........','..######..','.......#..','.......#..','..######..','..#.......','..######..','..........','..........']) },
    { name: 'Encrucijada', subtitle: 'Una chispa, varios caminos.', start: { row: 4, col: 4 }, board: pattern(['..........','....#.....','..#####...','....#.....','.########.','..#.#..#..','..#.#..#..','..#####...','....#.....','..........']) },
    { name: 'Islas', subtitle: 'No todas las fichas están conectadas.', start: { row: 2, col: 1 }, board: pattern(['..........','.####..##.','.#..#..##.','.####.....','....#.....','..#####...','..#...#...','..#####...','........#.','........#.']) },
    { name: 'Modo libre', subtitle: 'Diseña tu propia reacción.', start: null, board: emptyBoard() },
  ];
}
