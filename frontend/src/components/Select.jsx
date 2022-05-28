import { ReactComponent as Puzzle } from '../assets/puzzle.svg'

const Select = ({ contribution, setContribution, percentage, requested, totalPieces }) => (
  <>
    <button
      className='button minus'
      onClick={() => setContribution((c) => +c - 1)}
      disabled={contribution <= 0}
    >-</button>
    <input
      className='input'
      name='amount'
      inputMode='numeric'
      onChange={(e) => setContribution(e.target.value)}
      value={contribution}
      min={0}
    />
    <Puzzle width={16} height={16} />
    <button
      className='button plus'
      onClick={() => setContribution((c) => +c + 1)}
      disabled={contribution >= totalPieces - percentage}
    >+</button>
    <span>
      ({contribution > 0 ? `${((contribution * requested) / totalPieces).toFixed(2)} cUSD` : '0 cUSD'})
    </span>
  </>
)

export default Select