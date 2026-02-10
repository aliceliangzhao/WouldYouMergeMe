import './Bubble.css'

function Bubble({ x, y, value, radius, onMouseDown, isDragging, isHighlighted, cannotMerge }) {
  // Build className based on props
  let className = 'bubble'
  if (isDragging) className += ' dragging'
  if (isHighlighted) className += ' can-merge'
  if (cannotMerge) className += ' cannot-merge'

  return (
    <div
      className={className}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
      }}
      onMouseDown={onMouseDown}
    >
      <span className="bubble-value">{value}</span>
    </div>
  )
}

export default Bubble
