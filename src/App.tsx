import { useEffect, useRef, useState } from 'react';
import { bfs, dfs, emptyBoard, key, SIZE, type Cell, type SearchResult } from './algorithms';
import { getLevels } from './levels';
import Domino from './Domino';

const levels = getLevels();
const tick = 500;
type Status = 'ready' | 'running' | 'paused' | 'done';
const labels: Record<Status, string> = { ready: 'Listo para comenzar', running: 'Reacción en marcha', paused: 'Reacción en pausa', done: 'Reacción completada' };
const formatTime = (ms: number) => ms === 0 ? '< 0.001' : ms.toFixed(3);

export default function App() {
  const [screen, setScreen] = useState<'home' | 'levels' | 'game'>('home');
  const [moves, setMoves] = useState(0);
  const [animationId, setAnimationId] = useState(0);
  const [level, setLevel] = useState(0);
  const [board, setBoard] = useState(levels[0].board);
  const [start, setStart] = useState<Cell | null>(levels[0].start);
  const [tool, setTool] = useState<'place' | 'start'>('place');
  const [status, setStatus] = useState<Status>('ready');
  const [results, setResults] = useState<{ bfs: SearchResult; dfs: SearchResult } | null>(null);
  const [visibleLevel, setVisibleLevel] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const stageRef = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const total = board.flat().filter(Boolean).length;
  const fallen = results?.bfs.levels.slice(0, visibleLevel + 1).flat() ?? [];
  const fallenMap = new Map(fallen.map(cell => [key(cell), cell.depth]));
  const locked = status === 'running' || status === 'paused';

  // La animación consume niveles ya calculados. El reloj acumula sólo tiempo activo,
  // conserva el avance al pausar y cancela su frame al cambiar de estado o desmontar.
  useEffect(() => {
    if (status !== 'running' || !results) return;
    let frame: number;
    let previous = performance.now();
    const animate = (now: number) => {
      const delta = now - previous;
      previous = now;
      elapsedRef.current += delta;
      stageRef.current += delta;
      setElapsed(elapsedRef.current);
      const index = Math.floor(stageRef.current / tick);
      setVisibleLevel(Math.min(index, results.bfs.maxDepth));
      if (index >= results.bfs.levels.length) { setStatus('done'); return; }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [status, results]);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [visibleLevel]);

  function reset() {
    setStatus('ready'); setResults(null); setVisibleLevel(-1); setElapsed(0);
    elapsedRef.current = 0; stageRef.current = 0;
  }
  function chooseLevel(index: number) {
    reset(); setMoves(0); setLevel(index); setBoard(levels[index].board.map(row => [...row]));
    setStart(levels[index].start); setTool('place');
  }
  function edit(cell: Cell) {
    if (locked) return;
    if (tool === 'start') {
      if (!board[cell.row][cell.col]) return;
      reset(); setMoves(value => value + 1); setStart(cell); return;
    }
    reset(); setMoves(value => value + 1);
    setBoard(old => old.map((row, r) => row.map((value, c) => r === cell.row && c === cell.col ? !value : value)));
    if (start && key(start) === key(cell)) setStart(null);
  }
  function run() {
    if (status === 'paused') { setStatus('running'); return; }
    if (!start) return;
    reset();
    // Remontar sólo al iniciar otra reacción permite repetir también la caída del origen.
    setAnimationId(value => value + 1);
    setResults({ bfs: bfs(board, start), dfs: dfs(board, start) });
    setVisibleLevel(0); setStatus('running');
  }

  function openHome() {
    if (status === 'running') setStatus('paused');
    setScreen('home');
  }
  function playLevel(index: number) {
    chooseLevel(index); setScreen('game');
  }

  const levelButtons = <div className="level-options">{levels.map((item, i) =>
    <button key={item.name} className={`level-option ${level === i ? 'selected' : ''}`} onClick={() => playLevel(i)}>
      <span className="level-number">{i < 3 ? `0${i + 1}` : '＋'}</span>
      <span><strong>{item.name}</strong><small>{item.subtitle}</small></span><span className="level-arrow" aria-hidden="true">↗</span>
    </button>
  )}</div>;

  return <div className={`app screen-${screen} state-${status}`}>
    <header className="masthead">
      <button className="brand" onClick={openHome} aria-label="Domino Chain, inicio"><span className="brand-mark"><Domino /></span><span>domino<span className="brand-second">chain</span></span></button>
      <span className="edition">UN IMPULSO LO CAMBIA TODO.</span>
      <span className="edition-number">VOL. 05 <i /></span>
    </header>

    {screen !== 'game' ? <main className="home">
      <div className="home-copy"><span className="eyebrow">PEQUEÑAS PIEZAS. GRANDES REACCIONES.</span><h1>El siguiente<br />paso lo das <em>tú.</em></h1><p>Traza el camino. Elige la primera ficha.<br />Y deja que todo encaje.</p>
        {screen === 'home' ? <div className="home-actions"><button className="primary play-button" onClick={() => setScreen('game')}>{status === 'paused' ? 'Volver al juego' : 'Jugar'}<span aria-hidden="true">↗</span></button><button className="secondary" onClick={() => setScreen('levels')}>Seleccionar nivel <span aria-hidden="true">→</span></button><button className="text-button" onClick={() => playLevel(3)}>Modo libre <span aria-hidden="true">＋</span></button></div> : <section className="level-menu" aria-label="Seleccionar nivel"><div className="menu-title"><h2>Elige tu camino</h2><button className="text-button" onClick={() => setScreen('home')}>Volver</button></div>{levelButtons}</section>}
        <div className="home-footnote"><span>01 — CONSTRUYE</span><span>02 — IMPULSA</span><span>03 — OBSERVA</span></div>
      </div>
      <div className="home-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><span className="art-spark spark-one" /><span className="art-spark spark-two" /><div className="art-platform"><div className="art-grid" />{Array.from({ length: 7 }, (_, i) => <div className={`art-piece art-piece-${i}`} key={i}><Domino /></div>)}<span className="platform-dot" /></div><div className="art-caption"><span className="caption-line" />UNA REACCIÓN EN CADENA<span>∞ posibilidades</span></div></div>
      <footer className="home-footer"><span>Un rompecabezas sobre conectar.</span><span>DOMINO CHAIN / EFECTO DOMINÓ</span></footer>
    </main> : <main className="game">
      <div className="game-hud">
        <button className="level-switch" onClick={() => { if (status === 'running') setStatus('paused'); setScreen('levels'); }} aria-label="Seleccionar nivel"><span className="level-number">{level < 3 ? `0${level + 1}` : '＋'}</span><span><small>{level < 3 ? 'NIVEL' : 'MODO LIBRE'}</small><strong>{levels[level].name}</strong></span><span aria-hidden="true">⌄</span></button>
        <div className="moves"><strong>{moves.toString().padStart(2, '0')}</strong><span>movimientos</span></div>
        <div className="controls"><button className="primary" disabled={!start || status === 'running'} onClick={run}><span className="play-icon" aria-hidden="true" />{status === 'paused' ? 'Continuar' : status === 'done' ? 'Repetir' : 'Iniciar'}</button><button className="icon-button" disabled={status !== 'running'} onClick={() => setStatus('paused')} aria-label="Pausar" title="Pausar"><span className="pause-icon" aria-hidden="true" /></button><button className="icon-button" onClick={reset} aria-label="Reiniciar" title="Reiniciar">↺</button><button className="icon-button" onClick={() => { reset(); setMoves(0); setBoard(emptyBoard()); setStart(null); setLevel(3); }} aria-label="Limpiar tablero" title="Limpiar tablero"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7m4-7v7" /></svg></button></div>
      </div>

      <section className={`arena ${status === 'done' ? 'celebrate' : ''}`} aria-label="Zona de juego">
        <div className="arena-topline"><span className="status" role="status"><i />{labels[status]}</span><span className="board-size">10 × 10</span></div>
        <div className="board-shell"><div className="column-labels">{Array.from({ length: SIZE }, (_, i) => <span key={i}>{String.fromCharCode(65 + i)}</span>)}</div><div className="board-with-rows"><div className="row-labels">{Array.from({ length: SIZE }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
          <div key={animationId} className="board" aria-label="Tablero de dominó de 10 por 10">{board.map((row, r) => row.map((occupied, c) => {
            const cell = { row: r, col: c }; const id = key(cell); const initial = !!start && key(start) === id; const depth = fallenMap.get(id);
            return <button key={id} disabled={locked} className={`cell ${occupied ? 'occupied' : ''} ${initial ? 'origin' : ''} ${depth !== undefined ? 'fallen' : ''}`} onClick={() => edit(cell)} aria-label={`${String.fromCharCode(65 + c)}${r + 1}: ${occupied ? initial ? 'ficha inicial' : 'ficha' : 'vacía'}${depth !== undefined ? `, caída en nivel ${depth}` : ''}`} title={depth !== undefined ? `Nivel BFS ${depth}` : undefined}>{occupied && <Domino />}{depth !== undefined && <span className="depth">{depth}</span>}{initial && depth === undefined && <span className="origin-dot" />}</button>;
          }))}</div></div></div>
        <div className="board-bottomline"><div className="legend"><span><i className="standing-key" />De pie</span><span><i className="origin-key" />Inicio</span><span><i className="fallen-key" />Derribada</span></div><span>{total} fichas</span></div>
        <div className="completion" aria-live="polite">{status === 'done' && <><span className="completion-spark" aria-hidden="true">✦</span><strong>{fallen.length === total ? '¡Reacción perfecta!' : '¡Cadena completada!'}</strong><span>{fallen.length} derribadas · {total - fallen.length} siguen de pie</span></>}</div>
      </section>

      <div className="board-toolbar"><div className="tools" aria-label="Herramientas del tablero"><button disabled={locked} aria-pressed={tool === 'place'} className={tool === 'place' ? 'active' : ''} onClick={() => setTool('place')}><span aria-hidden="true">＋</span> Colocar / quitar</button><button disabled={locked} aria-pressed={tool === 'start'} className={tool === 'start' ? 'active' : ''} onClick={() => setTool('start')}><span aria-hidden="true">◎</span> Elegir inicio</button></div><span className="tool-hint">Sólo vecinos ↑ → ↓ ←</span></div>
      <p className="board-tip">{!start ? 'Elige una ficha inicial para comenzar.' : locked ? 'Reinicia para volver a construir.' : tool === 'place' ? 'Toca una casilla. Construye tu próxima reacción.' : 'Toca la ficha que dará el primer impulso.'}</p>

      <section className="score-strip" aria-label="Estadísticas de la reacción"><div><strong>{fallen.length}<small> / {total}</small></strong><span>derribadas</span></div><div><strong>{Math.max(0, visibleLevel).toString().padStart(2, '0')}</strong><span>pasos</span></div><div><strong>{(elapsed / 1000).toFixed(1)}<small> s</small></strong><span>tiempo activo</span></div><div className="score-progress"><div className="progress"><span style={{ width: `${total ? fallen.length / total * 100 : 0}%` }} /></div><span>{status === 'done' ? `${total - fallen.length} fichas quedaron de pie` : 'Cada ola cuenta.'}</span></div></section>

      <details className="analysis-panel" open><summary>Dentro de la cadena <span>BFS / DFS <span aria-hidden="true">⌄</span></span></summary><div className="analysis-content"><div className="table-wrap"><table><caption className="sr-only">Comparación real de BFS y DFS</caption><thead><tr><th>Recorrido</th><th>Nodos</th><th>Cálculo (ms)</th><th>Prof. máx.</th></tr></thead><tbody>{(['bfs', 'dfs'] as const).map(algorithm => <tr key={algorithm}><th><span className={`algorithm ${algorithm}`}>{algorithm.toUpperCase()}</span><span className="algorithm-detail">{algorithm === 'bfs' ? 'Cola FIFO' : 'Pila'}</span></th><td>{results?.[algorithm].order.length ?? '—'}</td><td>{results ? formatTime(results[algorithm].milliseconds) : '—'}</td><td>{results?.[algorithm].maxDepth ?? '—'}</td></tr>)}</tbody></table><p>BFS obtiene la distancia mínima en pasos. Profundidad desde 0; niveles = profundidad + 1. Tiempo real de cálculo, separado de la animación; puede variar.</p></div><div className="trace"><h2>Olas de propagación <span>BFS</span></h2><div className="trace-log" ref={logRef}>{results ? results.bfs.levels.slice(0, visibleLevel + 1).map((nodes, i) => <div className="trace-row" key={i}><span className="step">{i.toString().padStart(2, '0')}</span><p>{nodes.map(n => `${String.fromCharCode(65 + n.col)}${n.row + 1}`).join(' · ')}</p></div>) : <p className="trace-empty">Un impulso, y el camino aparecerá aquí.</p>}</div></div></div></details>
      <footer className="game-footer"><span>CONSTRUYE. CONECTA. DERRIBA.</span><span>PROYECTO 05 · EFECTO DOMINÓ</span></footer>
    </main>}
  </div>;
}
