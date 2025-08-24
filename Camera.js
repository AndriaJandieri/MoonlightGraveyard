/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Manages the game's camera, creating a side-scrolling viewport.
 */
export class Camera {
    /**
     * @param {number} gameWidth The width of the visible canvas.
     * @param {number} gameHeight The height of the visible canvas.
     * @param {number} worldWidth The total width of the game world.
     */
    constructor(gameWidth, gameHeight, worldWidth) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.worldWidth = worldWidth;
        
        this.x = 0;
        this.y = 0; // Camera y-position, can be used for vertical scrolling in the future.
        this.previousX = 0; // Store the last frame's position for interpolation.
    }

    /**
     * Updates the camera's position to follow a target (the player).
     * @param {object} target An object with x and width properties (e.g., the player).
     */
    update(target) {
        // Store the current position as the previous one before calculating the new position.
        this.previousX = this.x;

        // Center the camera on the target's horizontal position.
        let targetX = target.x + target.width / 2 - this.gameWidth / 2;
        
        // Clamp the camera's x-position to stay within the world boundaries.
        this.x = Math.max(0, Math.min(targetX, this.worldWidth - this.gameWidth));
    }

    /**
     * Calculates the interpolated X position for smooth rendering between fixed updates.
     * @param {number} interpolation The fraction of time between the last and next update (0 to 1).
     * @returns {number} The interpolated X position for rendering.
     */
    getInterpolatedX(interpolation) {
        return this.previousX + (this.x - this.previousX) * interpolation;
    }
}