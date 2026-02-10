# Implementation Plan: Bubble Drag-and-Merge

## Overview

This implementation plan breaks down the bubble drag-and-merge feature into discrete coding tasks. Each task builds incrementally on previous work, with property-based tests integrated throughout to validate correctness early. The implementation uses React hooks for state management and integrates with the existing physics engine.

## Tasks

- [x] 1. Set up drag state management and event handlers
  - Add dragState to BubbleGame component (isDragging, draggedBubbleId, lastMouseX, lastMouseY, dragStartTime)
  - Create handleMouseDown, handleMouseMove, handleMouseUp event handlers
  - Attach mouseDown handler to Bubble components via props
  - Attach mouseMove and mouseUp handlers to document/container
  - _Requirements: 1.1, 1.4_

- [ ]* 1.1 Write property test for drag initiation
  - **Property 1: Drag initiation sets correct state**
  - **Validates: Requirements 1.1, 1.3, 7.1**

- [ ]* 1.2 Write property test for empty space clicks
  - **Property 2: Empty space clicks don't trigger drag**
  - **Validates: Requirements 1.4**

- [x] 2. Implement drag movement and cursor tracking
  - [x] 2.1 Update handleMouseMove to position dragged bubble at cursor
    - Calculate new position from event.clientX, event.clientY
    - Clamp position to game boundaries (respect radius)
    - Update bubble position in state
    - _Requirements: 2.1, 2.2_

  - [ ]* 2.2 Write property test for cursor following
    - **Property 4: Dragged bubble follows cursor**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 2.3 Write property test for property preservation
    - **Property 5: Drag preserves bubble properties**
    - **Validates: Requirements 2.4**

- [x] 3. Integrate drag state with physics engine
  - Modify animation loop to skip physics updates for dragged bubble
  - Check bubble.id !== dragState.draggedBubbleId before applying physics
  - Zero out velocity when entering drag mode
  - _Requirements: 1.2_

- [ ]* 3.1 Write property test for physics disabling
  - **Property 3: Physics disabled during drag**
  - **Validates: Requirements 1.2**

- [x] 4. Implement collision detection during drag
  - [x] 4.1 Create detectDragCollision function
    - Iterate through all bubbles (skip dragged bubble)
    - Calculate distance between centers
    - Return closest collision with metadata (distance, canMerge)
    - _Requirements: 3.1, 3.3, 3.4_

  - [x] 4.2 Call detectDragCollision in handleMouseMove
    - Pass dragged bubble and all bubbles
    - Store collision result for processing
    - _Requirements: 3.1_

  - [ ]* 4.3 Write property test for collision detection
    - **Property 6: Collision detection accuracy**
    - **Validates: Requirements 3.1, 3.3**

  - [ ]* 4.4 Write property test for value matching
    - **Property 7: Value matching detection**
    - **Validates: Requirements 3.4**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement bubble merging logic
  - [x] 6.1 Create mergeBubbles function
    - Calculate midpoint position for new bubble
    - Create new bubble with summed value
    - Remove both original bubbles from state
    - Exit drag mode (reset dragState)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.2 Call mergeBubbles when collision.canMerge is true
    - Check collision result in handleMouseMove
    - Trigger merge for matching values
    - _Requirements: 4.1_

  - [ ]* 6.3 Write property test for merge result
    - **Property 8: Merge creates correct result**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [x] 7. Implement bubble repulsion logic
  - [x] 7.1 Create applyRepulsion function
    - Calculate direction vector from dragged to target
    - Normalize direction and apply repulsion force
    - Add velocity to target bubble
    - Separate bubbles to prevent overlap
    - _Requirements: 5.1, 5.3, 5.5_

  - [x] 7.2 Call applyRepulsion when collision.canMerge is false
    - Check collision result in handleMouseMove
    - Trigger repulsion for non-matching values
    - _Requirements: 5.1_

  - [ ]* 7.3 Write property test for repulsion
    - **Property 9: Repulsion pushes target away**
    - **Validates: Requirements 5.1, 5.3, 5.5**

  - [ ]* 7.4 Write property test for dragged bubble immunity
    - **Property 10: Dragged bubble unaffected by repulsion**
    - **Validates: Requirements 5.4**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement drag release logic
  - [x] 9.1 Update handleMouseUp to exit drag mode
    - Calculate release velocity from drag motion
    - Apply velocity to released bubble
    - Clear isDragging flag on bubble
    - Reset dragState to idle
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 9.2 Write property test for drag release
    - **Property 11: Drag release exits drag mode**
    - **Validates: Requirements 6.1, 6.2, 6.4**

  - [ ]* 9.3 Write property test for release velocity
    - **Property 12: Release velocity calculation**
    - **Validates: Requirements 6.3**

- [x] 10. Add visual feedback for drag states
  - [x] 10.1 Pass isDragging and isHighlighted props to Bubble component
    - Update Bubble component to accept new props
    - Apply CSS classes based on props
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 10.2 Update collision detection to set highlight flags
    - Set isHighlighted on both bubbles for matching values
    - Set incompatibility flag for non-matching values
    - Clear flags when collision ends
    - _Requirements: 7.2, 7.3_

  - [x] 10.3 Add CSS styles for drag states
    - .bubble.dragging - scale, shadow, z-index
    - .bubble.can-merge - green border, pulse animation
    - .bubble.cannot-merge - red border
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 10.4 Write property test for collision highlighting
    - **Property 13: Collision highlighting**
    - **Validates: Requirements 7.2, 7.3**

- [x] 11. Handle multi-bubble collisions
  - [x] 11.1 Update detectDragCollision to return closest collision only
    - Track minimum distance during iteration
    - Return only the closest collision result
    - _Requirements: 8.1, 8.2_

  - [x] 11.2 Ensure merge exits drag mode immediately
    - Verify mergeBubbles resets dragState
    - Prevent processing additional collisions after merge
    - _Requirements: 8.3_

  - [x] 11.3 Apply repulsion to all non-matching collisions
    - Modify applyRepulsion to handle multiple targets
    - Iterate through all colliding bubbles for repulsion
    - _Requirements: 8.4_

  - [ ]* 11.4 Write property test for closest-first processing
    - **Property 14: Closest collision processed first**
    - **Validates: Requirements 8.1, 8.2**

  - [ ]* 11.5 Write property test for merge exit
    - **Property 15: Merge exits drag immediately**
    - **Validates: Requirements 8.3**

  - [ ]* 11.6 Write property test for multiple repulsions
    - **Property 16: Multiple repulsions applied**
    - **Validates: Requirements 8.4**

- [x] 12. Add error handling and edge cases
  - [x] 12.1 Add drag state validation
    - Check draggedBubbleId exists before operations
    - Reset to idle if bubble not found
    - Log warnings for debugging
    - _Error Handling: Invalid State Transitions, Bubble Not Found_

  - [x] 12.2 Add boundary validation
    - Ensure all position calculations respect boundaries
    - Clamp positions before applying to state
    - _Error Handling: Boundary Violations_

  - [x] 12.3 Add division-by-zero protection
    - Check for zero distance before normalization
    - Use epsilon comparison for floating point
    - _Error Handling: Division by Zero_

  - [ ]* 12.4 Write unit tests for error conditions
    - Test drag with non-existent bubble
    - Test invalid mouse coordinates
    - Test state inconsistencies
    - _Error Handling: All scenarios_

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Integration and cleanup
  - [x] 14.1 Test complete drag-merge-release cycles
    - Manually test various scenarios
    - Verify integration with existing physics
    - Check performance with many bubbles
    - _Requirements: All_

  - [ ]* 14.2 Write integration tests
    - Test full user workflows
    - Test multiple sequential drags
    - Test interaction with physics system
    - _Integration Testing_

  - [x] 14.3 Code cleanup and optimization
    - Remove debug logging
    - Optimize collision detection if needed
    - Add code comments for complex logic
    - _Code Quality_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- fast-check library will be used for property-based testing with minimum 100 iterations per test
