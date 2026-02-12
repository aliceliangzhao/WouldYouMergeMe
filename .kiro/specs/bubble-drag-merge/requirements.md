# Requirements Document

## Introduction

This document specifies the requirements for adding drag-and-merge functionality to the bubble game. The feature enables users to interact with bubbles through click-and-drag gestures, allowing bubbles with matching values to merge into higher-value bubbles, while bubbles with different values repel each other.

## Glossary

- **Bubble**: A circular game element with a numeric value, position, and radius
- **Dragged_Bubble**: The bubble currently being moved by the user via mouse/touch input
- **Target_Bubble**: Any bubble that the Dragged_Bubble comes into contact with during dragging
- **Bubble_Value**: The numeric value displayed on a bubble (starts at 1, increases through merging)
- **Merge**: The process of combining two bubbles with identical values into a single bubble with a combined value
- **Collision**: When the distance between two bubble centers is less than or equal to the sum of their radii
- **Drag_State**: The current interaction state (idle, dragging, or merging)
- **Physics_Engine**: The system that handles bubble movement, collisions, and velocity calculations

## Requirements

### Requirement 1: Drag Initiation

**User Story:** As a player, I want to click and hold on a bubble to start dragging it, so that I can move it around the game area.

#### Acceptance Criteria

1. WHEN a user presses the mouse button down on a bubble, THE System SHALL enter drag mode for that bubble
2. WHILE in drag mode, THE System SHALL disable physics simulation for the Dragged_Bubble
3. WHEN entering drag mode, THE System SHALL provide visual feedback indicating the bubble is being dragged
4. WHEN a user presses down on empty space, THE System SHALL not enter drag mode

### Requirement 2: Drag Movement

**User Story:** As a player, I want the bubble to follow my cursor while dragging, so that I can position it precisely.

#### Acceptance Criteria

1. WHILE dragging a bubble, THE System SHALL update the Dragged_Bubble position to match the cursor position
2. WHILE dragging, THE Dragged_Bubble SHALL remain within the game boundaries
3. WHEN the cursor moves outside game boundaries, THE Dragged_Bubble SHALL stop at the boundary edge
4. WHILE dragging, THE System SHALL maintain the bubble's radius and value unchanged

### Requirement 3: Collision Detection During Drag

**User Story:** As a player, I want to know when my dragged bubble touches another bubble, so that I can trigger merge or repel actions.

#### Acceptance Criteria

1. WHILE dragging a bubble, THE System SHALL continuously check for collisions with other bubbles
2. WHEN a collision is detected, THE System SHALL calculate the distance between bubble centers
3. WHEN the distance is less than or equal to the sum of the two radii, THE System SHALL register a collision
4. WHEN a collision occurs, THE System SHALL determine if the bubbles have matching values

### Requirement 4: Bubble Merging

**User Story:** As a player, I want bubbles with the same value to merge when I drag one into another, so that I can create higher-value bubbles.

#### Acceptance Criteria

1. WHEN the Dragged_Bubble collides with a Target_Bubble AND both bubbles have identical Bubble_Values, THE System SHALL merge the two bubbles
2. WHEN bubbles merge, THE System SHALL create a new bubble with a value equal to the sum of the two merged bubbles
3. WHEN bubbles merge, THE System SHALL position the new bubble at the current cursor position
4. WHEN bubbles merge, THE System SHALL remove both original bubbles from the game
5. WHEN bubbles merge, THE System SHALL continue drag mode with the newly created bubble as the Dragged_Bubble
6. WHEN bubbles merge, THE new bubble SHALL immediately follow the cursor and be available for further merging

### Requirement 5: Bubble Repulsion

**User Story:** As a player, I want bubbles with different values to push away from each other when they touch, so that I can only merge matching bubbles.

#### Acceptance Criteria

1. WHEN the Dragged_Bubble collides with a Target_Bubble AND the bubbles have different Bubble_Values, THE System SHALL apply a repulsive force
2. WHEN applying repulsion, THE System SHALL calculate the force direction away from the Dragged_Bubble
3. WHEN applying repulsion, THE Target_Bubble SHALL receive velocity in the direction away from the Dragged_Bubble
4. WHEN applying repulsion, THE Dragged_Bubble SHALL continue following the cursor without being affected by the repulsion
5. WHEN repulsion occurs, THE System SHALL prevent bubble overlap by separating the bubbles

### Requirement 6: Drag Release

**User Story:** As a player, I want to release the bubble by releasing the mouse button, so that it returns to normal physics behavior.

#### Acceptance Criteria

1. WHEN the user releases the mouse button, THE System SHALL exit drag mode
2. WHEN exiting drag mode, THE System SHALL re-enable physics simulation for the released bubble
3. WHEN exiting drag mode, THE System SHALL calculate initial velocity based on the drag motion
4. WHEN exiting drag mode, THE System SHALL remove visual feedback indicating dragging
5. WHEN the user releases the mouse button outside the game area, THE System SHALL still exit drag mode properly

### Requirement 7: Visual Feedback

**User Story:** As a player, I want clear visual indicators during dragging, so that I understand the current interaction state.

#### Acceptance Criteria

1. WHILE dragging a bubble, THE System SHALL apply a distinct visual style to the Dragged_Bubble
2. WHEN the Dragged_Bubble hovers over a Target_Bubble with matching value, THE System SHALL highlight both bubbles
3. WHEN the Dragged_Bubble hovers over a Target_Bubble with different value, THE System SHALL indicate incompatibility
4. WHEN a merge occurs, THE System SHALL display a merge animation
5. WHEN repulsion occurs, THE System SHALL provide visual feedback of the push effect

### Requirement 8: Multi-Bubble Interaction

**User Story:** As a player, I want consistent behavior when my dragged bubble touches multiple bubbles simultaneously, so that the game feels predictable.

#### Acceptance Criteria

1. WHEN the Dragged_Bubble collides with multiple bubbles simultaneously, THE System SHALL process collisions in order of proximity
2. WHEN multiple matching bubbles are touched, THE System SHALL merge with the closest matching bubble first
3. WHEN a merge occurs during multi-bubble collision, THE System SHALL continue drag mode with the newly merged bubble
4. WHEN multiple non-matching bubbles are touched, THE System SHALL apply repulsion to all of them
5. WHEN the Dragged_Bubble merges and continues dragging, THE System SHALL immediately check for new collisions with the merged bubble

#### To-do
1. ~~Merging bubbles should not release the dragged_bubble~~ (Updated in Requirement 4.5-4.6) (done)
2. Spacing among bubbles
3. Visual of the view, including the bubbles, collision indicator
4. Responsiveness
5. Respawn more bubbles after merging (kind of, needs fine-tuning)
6. The position of the bubble when clicked. The current animation is that the bubble shifts its position when clicked
7. The merging animation needs to be more subtle, the current one is too abrupt
