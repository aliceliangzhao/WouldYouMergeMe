import { useState, useEffect, useRef } from 'react'
import Bubble from './Bubble'
import './BubbleGame.css'

function BubbleGame() {
  const [bubbles, setBubbles] = useState([])
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedBubbleId: null,
    lastMouseX: 0,
    lastMouseY: 0,
    dragStartTime: 0
  })
  const containerRef = useRef(null)
  const animationRef = useRef(null)
  const bubblesRef = useRef([])
  const dragStateRef = useRef(dragState)

  // Keep dragStateRef in sync with dragState
  useEffect(() => {
    dragStateRef.current = dragState
  }, [dragState])

  /**
   * Event handler for mouse down on a bubble.
   * Initiates drag mode and disables physics for the selected bubble.
   * 
   * @param {MouseEvent} event - The mouse down event
   * @param {number} bubbleId - The ID of the bubble being clicked
   */
  const handleMouseDown = (event, bubbleId) => {
    const bubble = bubblesRef.current.find(b => b.id === bubbleId)
    if (!bubble) return

    setDragState({
      isDragging: true,
      draggedBubbleId: bubbleId,
      lastMouseX: event.clientX,
      lastMouseY: event.clientY,
      dragStartTime: Date.now()
    })

    // Disable physics and set visual state
    bubble.isDragging = true
    bubble.vx = 0
    bubble.vy = 0
  }

  /**
   * Detect collisions between the dragged bubble and all other bubbles.
   * Returns both the closest collision and all collisions for processing.
   * 
   * @param {Object} draggedBubble - The bubble being dragged
   * @param {Array} allBubbles - Array of all bubbles in the game
   * @returns {Object} Object containing closestCollision and allCollisions arrays
   */
  const detectDragCollision = (draggedBubble, allBubbles) => {
    let closestCollision = {
      collided: false,
      targetBubble: null,
      distance: Infinity,
      canMerge: false
    }
    
    const allCollisions = []

    for (const bubble of allBubbles) {
      if (bubble.id === draggedBubble.id) continue

      const dx = bubble.x - draggedBubble.x
      const dy = bubble.y - draggedBubble.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const minDist = draggedBubble.radius + bubble.radius

      if (distance <= minDist) {
        const collision = {
          collided: true,
          targetBubble: bubble,
          distance: distance,
          canMerge: bubble.value === draggedBubble.value
        }
        
        allCollisions.push(collision)
        
        if (distance < closestCollision.distance) {
          closestCollision = collision
        }
      }
    }

    return { closestCollision, allCollisions }
  }

  /**
   * Merge two bubbles with matching values.
   * Creates a new bubble at the cursor position with summed value and removes originals.
   * Continues drag mode with the newly created bubble.
   * 
   * @param {Object} draggedBubble - The bubble being dragged
   * @param {Object} targetBubble - The bubble to merge with
   * @returns {Object} The newly created merged bubble
   */
  const mergeBubbles = (draggedBubble, targetBubble) => {
    // Use current cursor position (dragged bubble position) for the new bubble
    const newX = draggedBubble.x
    const newY = draggedBubble.y

    const newBubble = {
      id: Date.now(),
      x: newX,
      y: newY,
      vx: 0,
      vy: 0,
      value: draggedBubble.value + targetBubble.value,
      radius: draggedBubble.radius,
      isDragging: true, // Keep dragging state
      isHighlighted: false,
      cannotMerge: false
    }

    const updatedBubbles = bubblesRef.current.filter(
      b => b.id !== draggedBubble.id && b.id !== targetBubble.id
    )
    updatedBubbles.push(newBubble)

    bubblesRef.current = updatedBubbles
    setBubbles([...updatedBubbles])

    // Continue drag mode with the new bubble
    setDragState(prev => ({
      ...prev,
      draggedBubbleId: newBubble.id
    }))

    return newBubble
  }

  /**
   * Apply repulsion force to target bubble when values don't match.
   * Pushes the target bubble away from the dragged bubble and prevents overlap.
   * 
   * @param {Object} draggedBubble - The bubble being dragged by the user
   * @param {Object} targetBubble - The bubble to apply repulsion force to
   */
  const applyRepulsion = (draggedBubble, targetBubble) => {
    // Calculate direction vector from dragged to target
    const dx = targetBubble.x - draggedBubble.x
    const dy = targetBubble.y - draggedBubble.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Avoid division by zero - if bubbles are at exactly the same position, skip repulsion
    const epsilon = 0.0001
    if (distance < epsilon) {
      return
    }

    // Normalize direction and apply repulsion force
    const dirX = dx / distance
    const dirY = dy / distance
    const repulsionStrength = 5 // Tunable parameter for game feel

    // Add velocity to target bubble (dragged bubble is unaffected)
    targetBubble.vx += dirX * repulsionStrength
    targetBubble.vy += dirY * repulsionStrength

    // Separate bubbles to prevent overlap
    const overlap = (draggedBubble.radius + targetBubble.radius) - distance
    if (overlap > 0) {
      const newX = targetBubble.x + dirX * overlap
      const newY = targetBubble.y + dirY * overlap
      
      // Clamp positions to boundaries
      const width = window.innerWidth
      const height = window.innerHeight
      
      targetBubble.x = Math.max(targetBubble.radius, 
                        Math.min(newX, width - targetBubble.radius))
      targetBubble.y = Math.max(80 + targetBubble.radius, 
                        Math.min(newY, height - targetBubble.radius))
    }
  }

  /**
   * Handle mouse move events during drag.
   * Updates dragged bubble position and handles collision detection/response.
   */
  const handleMouseMove = (event) => {
    if (!dragStateRef.current.isDragging) return

    // Validate drag state
    if (dragStateRef.current.draggedBubbleId === null) {
      setDragState({
        isDragging: false,
        draggedBubbleId: null,
        lastMouseX: 0,
        lastMouseY: 0,
        dragStartTime: 0
      })
      return
    }

    const bubble = bubblesRef.current.find(b => b.id === dragStateRef.current.draggedBubbleId)
    
    // Reset if bubble not found (e.g., was merged)
    if (!bubble) {
      setDragState({
        isDragging: false,
        draggedBubbleId: null,
        lastMouseX: 0,
        lastMouseY: 0,
        dragStartTime: 0
      })
      return
    }

    // Update position to cursor, clamped to boundaries
    const width = window.innerWidth
    const height = window.innerHeight
    
    const newX = Math.max(bubble.radius, 
                  Math.min(event.clientX, width - bubble.radius))
    const newY = Math.max(80 + bubble.radius, 
                  Math.min(event.clientY, height - bubble.radius))

    bubble.x = newX
    bubble.y = newY

    // Clear all highlight flags before checking for new collisions
    bubblesRef.current.forEach(b => {
      b.isHighlighted = false
      b.cannotMerge = false
    })

    // Check for collisions and handle merge/repulsion
    const { closestCollision, allCollisions } = detectDragCollision(bubble, bubblesRef.current)
    
    if (closestCollision.collided) {
      if (closestCollision.canMerge) {
        // Highlight both bubbles and merge
        bubble.isHighlighted = true
        closestCollision.targetBubble.isHighlighted = true
        
        const mergedBubble = mergeBubbles(bubble, closestCollision.targetBubble)
        
        // Continue checking for collisions with the newly merged bubble
        // This allows chain merging in a single drag gesture
        const { closestCollision: newCollision, allCollisions: newAllCollisions } = 
          detectDragCollision(mergedBubble, bubblesRef.current)
        
        if (newCollision.collided && !newCollision.canMerge) {
          // Apply repulsion to non-matching bubbles after merge
          for (const collision of newAllCollisions) {
            if (!collision.canMerge) {
              mergedBubble.cannotMerge = true
              collision.targetBubble.cannotMerge = true
              applyRepulsion(mergedBubble, collision.targetBubble)
            }
          }
        }
        
        return // Exit after handling merge
      } else {
        // Apply repulsion to all non-matching collisions
        for (const collision of allCollisions) {
          if (!collision.canMerge) {
            bubble.cannotMerge = true
            collision.targetBubble.cannotMerge = true
            
            applyRepulsion(bubble, collision.targetBubble)
          }
        }
      }
    }

    // Update last mouse position for velocity calculation on release
    setDragState(prev => ({
      ...prev,
      lastMouseX: event.clientX,
      lastMouseY: event.clientY
    }))
  }

  /**
   * Handle mouse up events to release the dragged bubble.
   * Calculates release velocity and re-enables physics.
   */
  const handleMouseUp = (event) => {
    if (!dragStateRef.current.isDragging) return

    // Validate drag state
    if (dragStateRef.current.draggedBubbleId === null) {
      setDragState({
        isDragging: false,
        draggedBubbleId: null,
        lastMouseX: 0,
        lastMouseY: 0,
        dragStartTime: 0
      })
      return
    }

    const bubble = bubblesRef.current.find(b => b.id === dragStateRef.current.draggedBubbleId)
    if (bubble) {
      // Calculate release velocity based on drag motion
      const timeDelta = Date.now() - dragStateRef.current.dragStartTime
      const velocityScale = Math.min(timeDelta / 100, 1) // Clamp velocity

      bubble.vx = (event.clientX - dragStateRef.current.lastMouseX) * velocityScale * 0.1
      bubble.vy = (event.clientY - dragStateRef.current.lastMouseY) * velocityScale * 0.1
      bubble.isDragging = false
    }

    setDragState({
      isDragging: false,
      draggedBubbleId: null,
      lastMouseX: 0,
      lastMouseY: 0,
      dragStartTime: 0
    })
  }

  // Attach mouse event listeners to document
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Initialize bubbles on mount - fill screen with non-overlapping bubbles
  useEffect(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    const radius = 25
    const minDistance = radius * 2 // Bubbles can touch but not overlap
    
    // Calculate maximum bubbles based on screen area
    const area = width * (height - 100)
    const bubbleArea = Math.PI * radius * radius
    const maxBubbles = Math.floor(area / (bubbleArea * 1.5)) // Dense packing factor
    
    const initialBubbles = []
    let attempts = 0
    const maxAttempts = maxBubbles * 10
    
    // Place bubbles randomly, ensuring no overlap
    while (initialBubbles.length < maxBubbles && attempts < maxAttempts) {
      const x = Math.random() * (width - radius * 2) + radius
      const y = Math.random() * (height - 100 - radius * 2) + radius + 80
      
      // Check distance to all existing bubbles
      let tooClose = false
      for (const bubble of initialBubbles) {
        const dx = x - bubble.x
        const dy = y - bubble.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < minDistance) {
          tooClose = true
          break
        }
      }
      
      if (!tooClose) {
        initialBubbles.push({
          id: Date.now() + initialBubbles.length,
          x,
          y,
          vx: 0,
          vy: 0,
          value: 1,
          radius,
          isDragging: false,
          isHighlighted: false,
          cannotMerge: false
        })
      }
      
      attempts++
    }
    
    bubblesRef.current = initialBubbles
    setBubbles(initialBubbles)
  }, [])

  // Physics and collision detection animation loop
  useEffect(() => {
    /**
     * Main animation loop for physics simulation.
     * Runs at ~60fps via requestAnimationFrame.
     * Handles velocity-based movement, wall collisions, friction, and bubble-to-bubble collisions.
     */
    const animate = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const updatedBubbles = [...bubblesRef.current]

      // Update positions based on velocity
      updatedBubbles.forEach(bubble => {
        // Skip physics for dragged bubble (user-controlled)
        if (bubble.id === dragStateRef.current.draggedBubbleId) return

        if (bubble.vx !== 0 || bubble.vy !== 0) {
          bubble.x += bubble.vx
          bubble.y += bubble.vy

          // Wall collision detection with bounce
          if (bubble.x - bubble.radius < 0 || bubble.x + bubble.radius > width) {
            bubble.vx *= -0.8 // Bounce with energy loss
            bubble.x = Math.max(bubble.radius, Math.min(width - bubble.radius, bubble.x))
          }
          if (bubble.y - bubble.radius < 80 || bubble.y + bubble.radius > height) {
            bubble.vy *= -0.8
            bubble.y = Math.max(80 + bubble.radius, Math.min(height - bubble.radius, bubble.y))
          }

          // Apply friction to gradually slow down bubbles
          bubble.vx *= 0.98
          bubble.vy *= 0.98

          // Stop if velocity is negligible
          if (Math.abs(bubble.vx) < 0.01) bubble.vx = 0
          if (Math.abs(bubble.vy) < 0.01) bubble.vy = 0
        }
      })

      // Bubble-to-bubble collision detection (O(n²) but necessary for physics)
      for (let i = 0; i < updatedBubbles.length; i++) {
        for (let j = i + 1; j < updatedBubbles.length; j++) {
          const b1 = updatedBubbles[i]
          const b2 = updatedBubbles[j]

          // Skip if either bubble is being dragged
          if (b1.id === dragStateRef.current.draggedBubbleId || 
              b2.id === dragStateRef.current.draggedBubbleId) {
            continue
          }

          const dx = b2.x - b1.x
          const dy = b2.y - b1.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const minDist = b1.radius + b2.radius

          if (distance < minDist) {
            // Avoid division by zero
            const epsilon = 0.0001
            if (distance < epsilon) {
              b2.x += epsilon
              b2.y += epsilon
              continue
            }
            
            // Calculate elastic collision using rotation method
            const angle = Math.atan2(dy, dx)
            const sin = Math.sin(angle)
            const cos = Math.cos(angle)

            // Rotate velocities to collision axis
            const vx1 = b1.vx * cos + b1.vy * sin
            const vy1 = b1.vy * cos - b1.vx * sin
            const vx2 = b2.vx * cos + b2.vy * sin
            const vy2 = b2.vy * cos - b2.vx * sin

            // Swap velocities along collision axis (elastic collision)
            const vx1Final = vx2
            const vx2Final = vx1

            // Rotate velocities back to world space
            b1.vx = vx1Final * cos - vy1 * sin
            b1.vy = vy1 * cos + vx1Final * sin
            b2.vx = vx2Final * cos - vy2 * sin
            b2.vy = vy2 * cos + vx2Final * sin

            // Separate overlapping bubbles
            const overlap = minDist - distance
            const separateX = (overlap / 2) * cos
            const separateY = (overlap / 2) * sin

            b1.x -= separateX
            b1.y -= separateY
            b2.x += separateX
            b2.y += separateY
          }
        }
      }

      bubblesRef.current = updatedBubbles
      setBubbles([...updatedBubbles])
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className="bubble-game" ref={containerRef}>
      <div className="game-header">
        <h1>Bubble Merge Game</h1>
      </div>
      {bubbles.map(bubble => (
        <Bubble
          key={bubble.id}
          x={bubble.x}
          y={bubble.y}
          value={bubble.value}
          radius={bubble.radius}
          onMouseDown={(event) => handleMouseDown(event, bubble.id)}
          isDragging={bubble.isDragging}
          isHighlighted={bubble.isHighlighted}
          cannotMerge={bubble.cannotMerge}
        />
      ))}
    </div>
  )
}

export default BubbleGame
