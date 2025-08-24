

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Represents a single particle for visual effects like blood splatters.
 */
export class Particle {
    constructor(game, x, y) {
        this.x = x;
        this.y = y;
        this.previousX = x;
        this.previousY = y;
        this.width = 5; // For culling
        this.height = 5;
        
        this.size = Math.random() * 5 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * -10 - 2;
        this.gravity = 0.5;
        this.lifespan = 100;
        this.color = `rgba(150, 0, 0, ${Math.random() * 0.5 + 0.5})`;
        
        this.markedForDeletion = false;
    }

    update(deltaTime) {
        this.previousX = this.x;
        this.previousY = this.y;
        
        this.lifespan -= deltaTime / 10;
        if (this.lifespan < 0) {
            this.markedForDeletion = true;
        }
        
        this.speedY += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY;
    }

    draw(context, interpolation) {
        const renderX = this.previousX + (this.x - this.previousX) * interpolation;
        const renderY = this.previousY + (this.y - this.previousY) * interpolation;

        context.save();
        // Defensive coding: ensure shadows from other objects don't leak
        context.shadowBlur = 0;
        context.shadowColor = 'transparent';
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(renderX, renderY, this.size, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }
}