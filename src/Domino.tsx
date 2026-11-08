/** Una sola geometría de ficha para el tablero, la marca y la portada. */
export default function Domino() {
  return <span className="domino" aria-hidden="true">
    <span className="half"><i /><i /><i /></span>
    <span className="half"><i /><i /><i /></span>
  </span>;
}
