

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Represents a single smoke particle for visual effects, like from an opening chest.
 */
export class SmokeParticle {
    constructor(game, x, y) {
        this.x = x;
        this.y = y;
        this.previousX = x;
        this.previousY = y;
        
        this.size = Math.random() * 15 + 10;
        this.width = this.size * 2; // For culling
        this.height = this.size * 2;
        this.speedX = Math.random() * 2.5 - 1.25;
        this.speedY = Math.random() * -2.0 - 0.8;
        this.gravity = 0.01;
        
        this.maxLife = Math.random() * 100 + 80;
        this.life = this.maxLife;
        this.color = `rgba(220, 220, 220, ${Math.random() * 0.3 + 0.3})`;
        
        this.markedForDeletion = false;
    }

    update() {
        this.previousX = this.x;
        this.previousY = this.y;
        
        this.life--;
        if (this.life <= 0) {
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
        context.globalAlpha = Math.max(0, (this.life / this.maxLife) * 0.7);
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