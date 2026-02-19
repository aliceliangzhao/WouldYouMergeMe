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
  const [theme, setTheme] = useState('dark') // 'light' or 'dark'
  const containerRef = useRef(null)
  const animationRef = useRef(null)
  const bubblesRef = useRef([])
  const dragStateRef = useRef(dragState)

  // Keep dragStateRef in sync with dragState
  useEffect(() => {
    dragStateRef.current = dragState
  }, [dragState])

  /**
   * Handle theme toggle between light and dark modes
   */
  const handleThemeToggle = (newTheme) => {
    setTheme(newTheme)
  }

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
   * Uses dynamic collision threshold based on movement speed:
   * - Slow movement (< 5px/frame): requires 60% overlap (softer, more precise)
   * - Medium movement (5-15px/frame): requires 75% overlap (balanced)
   * - Fast movement (> 15px/frame): requires 90% overlap (easier merging)
   * 
   * @param {Object} draggedBubble - The bubble being dragged
   * @param {Array} allBubbles - Array of all bubbles in the game
   * @param {number} moveSpeed - Current movement speed in pixels per frame
   * @returns {Object} Object containing closestCollision and allCollisions arrays
   */
  const detectDragCollision = (draggedBubble, allBubbles, moveSpeed = 0) => {
    let closestCollision = {
      collided: false,
      targetBubble: null,
      distance: Infinity,
      canMerge: false
    }
    
    const allCollisions = []
    
    // Dynamic collision threshold based on movement speed
    let overlapFactor
    if (moveSpeed < 5) {
      overlapFactor = 0.6 // Slow: requires more overlap (softer)
    } else if (moveSpeed < 15) {
      overlapFactor = 0.75 // Medium: balanced
    } else {
      overlapFactor = 0.9 // Fast: easier to merge
    }

    for (const bubble of allBubbles) {
      if (bubble.id === draggedBubble.id) continue

      const dx = bubble.x - draggedBubble.x
      const dy = bubble.y - draggedBubble.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // Apply dynamic collision threshold
      const minDist = (draggedBubble.radius + bubble.radius) * overlapFactor

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
   * Spawns at least 5 new bubbles after merge with random values from [1, 2, 4, 8].
   * 
   * @param {Object} draggedBubble - The bubble being dragged
   * @param {Object} targetBubble - The bubble to merge with
   * @returns {Object} The newly created merged bubble
   */
  const mergeBubbles = (draggedBubble, targetBubble) => {
    // Use current cursor position (dragged bubble position) for the new bubble
    const newX = draggedBubble.x
    const newY = draggedBubble.y

    const mergedValue = draggedBubble.value + targetBubble.value

    const mergedBubble = {
      id: Date.now(),
      x: newX,
      y: newY,
      vx: 0,
      vy: 0,
      value: mergedValue,
      radius: draggedBubble.radius,
      isDragging: true, // Keep dragging state
      isHighlighted: false,
      cannotMerge: false
    }

    const updatedBubbles = bubblesRef.current.filter(
      b => b.id !== draggedBubble.id && b.id !== targetBubble.id
    )
    updatedBubbles.push(mergedBubble)
    
    // Spawn at least 5 new bubbles after merge
    const numNewBubbles = Math.floor(Math.random() * 3) + 5 // 5-7 bubbles
    const width = window.innerWidth
    const height = window.innerHeight
    const radius = 40
    const minDistance = radius * 2.5
    const possibleValues = [1, 2, 4, 8]
    
    // Create new bubbles with random values from [1, 2, 4, 8]
    // First bubble always has the merged value
    for (let i = 0; i < numNewBubbles; i++) {
      // First bubble gets merged value, rest get random values
      const value = i === 0 ? mergedValue : possibleValues[Math.floor(Math.random() * possibleValues.length)]
      let attempts = 0
      const maxAttempts = 100
      let validPosition = false
      
      while (!validPosition && attempts < maxAttempts) {
        const x = Math.random() * (width - radius * 2) + radius
        const y = Math.random() * (height - 100 - radius * 2) + radius + 80
        
        // Check distance to all existing bubbles
        validPosition = true
        for (const bubble of updatedBubbles) {
          const dx = x - bubble.x
          const dy = y - bubble.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < minDistance) {
            validPosition = false
            break
          }
        }
        
        if (validPosition) {
          // Add random initial velocity for movement when spawning
          const speed = 0.2 + Math.random() * 1.1 // Random speed between 2-5
          const angle = Math.random() * Math.PI * 2 // Random direction
          
          updatedBubbles.push({
            id: Date.now() + i + Math.random(),
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            value,
            radius,
            isDragging: false,
            isHighlighted: false,
            cannotMerge: false
          })
        }
        
        attempts++
      }
    }

    bubblesRef.current = updatedBubbles
    setBubbles([...updatedBubbles])

    // Continue drag mode with the merged bubble
    setDragState(prev => ({
      ...prev,
      draggedBubbleId: mergedBubble.id
    }))

    return mergedBubble
  }

  /**
   * Apply repulsion force to target bubble when values don't match.
   * Pushes the target bubble away from the dragged bubble and prevents overlap.
   * Uses dynamic repulsion strength based on movement speed:
   * - Slow movement (< 5px/frame): gentle repulsion (2-3 px/frame)
   * - Medium movement (5-15px/frame): moderate repulsion (5-6 px/frame)
   * - Fast movement (> 15px/frame): strong repulsion (8-10 px/frame)
   * 
   * @param {Object} draggedBubble - The bubble being dragged by the user
   * @param {Object} targetBubble - The bubble to apply repulsion force to
   * @param {number} moveSpeed - Current movement speed in pixels per frame
   */
  const applyRepulsion = (draggedBubble, targetBubble, moveSpeed = 0) => {
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
    
    // Dynamic repulsion strength based on movement speed
    let repulsionStrength
    if (moveSpeed < 5) {
      repulsionStrength = 1 + Math.random() // Slow: gentle repulsion (2-3 px/frame)
    } else if (moveSpeed < 15) {
      repulsionStrength = 5 + Math.random() // Medium: moderate repulsion (5-6 px/frame)
    } else {
      repulsionStrength = 8 + Math.random() * 2 // Fast: strong repulsion (8-10 px/frame)
    }

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

    // Calculate movement speed for dynamic collision threshold
    const dx = event.clientX - dragStateRef.current.lastMouseX
    const dy = event.clientY - dragStateRef.current.lastMouseY
    // Calculate speed using Pythagorean theorem
    const moveSpeed = Math.sqrt(dx * dx + dy * dy)
    // Result: speed in pixels per frame (typically 60fps)
    //Example:
    //Mouse moved from (100, 100) to (110, 105)
    //dx = 10, dy = 5
    //moveSpeed = √(10² + 5²) = √125 ≈ 11.18 pixels/frame


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
    const { closestCollision, allCollisions } = detectDragCollision(bubble, bubblesRef.current, moveSpeed)
    
    if (closestCollision.collided) {
      if (closestCollision.canMerge) {
        // Highlight both bubbles and merge
        bubble.isHighlighted = true
        closestCollision.targetBubble.isHighlighted = true
        
        const mergedBubble = mergeBubbles(bubble, closestCollision.targetBubble)
        
        // Continue checking for collisions with the newly merged bubble
        // This allows chain merging in a single drag gesture
        const { closestCollision: newCollision, allCollisions: newAllCollisions } = 
          detectDragCollision(mergedBubble, bubblesRef.current, moveSpeed)
        
        if (newCollision.collided && !newCollision.canMerge) {
          // Apply repulsion to non-matching bubbles after merge
          for (const collision of newAllCollisions) {
            if (!collision.canMerge) {
              mergedBubble.cannotMerge = true
              collision.targetBubble.cannotMerge = true
              applyRepulsion(mergedBubble, collision.targetBubble, moveSpeed)
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
            
            applyRepulsion(bubble, collision.targetBubble, moveSpeed)
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

  // Initialize bubbles on mount - start with just 2 bubbles with value 1
  useEffect(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    const radius = 40
    
    // Create 2 initial bubbles with value 1 at random positions
    const initialBubbles = []
    
    // First bubble
    const x1 = Math.random() * (width - radius * 4) + radius * 2
    const y1 = Math.random() * (height - 180) + radius + 80
    
    initialBubbles.push({
      id: Date.now(),
      x: x1,
      y: y1,
      vx: 0,
      vy: 0,
      value: 1,
      radius,
      isDragging: false,
      isHighlighted: false,
      cannotMerge: false
    })
    
    // Second bubble - ensure it's not too close to the first
    let x2, y2, distance
    let attempts = 0
    const minDistance = radius * 4 // Ensure some spacing
    
    do {
      x2 = Math.random() * (width - radius * 4) + radius * 2
      y2 = Math.random() * (height - 180) + radius + 80
      
      const dx = x2 - x1
      const dy = y2 - y1
      distance = Math.sqrt(dx * dx + dy * dy)
      attempts++
    } while (distance < minDistance && attempts < 100)
    
    initialBubbles.push({
      id: Date.now() + 1,
      x: x2,
      y: y2,
      vx: 0,
      vy: 0,
      value: 1,
      radius,
      isDragging: false,
      isHighlighted: false,
      cannotMerge: false
    })
    
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
    <div className="bubble-game" ref={containerRef} data-theme={theme}>
      {/* <div className="background-blob"></div> */}
      <nav className="game-nav">
        <button className="nav-info-button" aria-label="Information">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M10 10V14M10 6V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        
        <div className="game-header">
          <div className="game-title">WOULD YOU MERGE ME?</div>
        </div>
        
        <div className="theme-toggle" data-theme={theme}>
          <button 
            className={`theme-option ${theme === 'light' ? 'active' : ''}`}
            aria-label="Light mode"
            onClick={() => handleThemeToggle('light')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="4" fill="currentColor"/>
              <path d="M10 2V4M10 16V18M18 10H16M4 10H2M15.66 4.34L14.24 5.76M5.76 14.24L4.34 15.66M15.66 15.66L14.24 14.24M5.76 5.76L4.34 4.34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button 
            className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
            aria-label="Dark mode"
            onClick={() => handleThemeToggle('dark')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 10.5C16.1 14.4 12.6 17 8.5 17C4.4 17 1 13.6 1 9.5C1 5.4 3.6 1.9 7.5 1C6.6 2.1 6 3.5 6 5C6 8.3 8.7 11 12 11C13.5 11 14.9 10.4 16 9.5C16.7 9.8 17 10.1 17 10.5Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </nav>
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
