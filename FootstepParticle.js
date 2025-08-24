

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Represents a dust/footstep particle for effects like landing or running.
 */
export class FootstepParticle {
    constructor(game, x, y, direction = null) {
        this.x = x;
        this.y = y;
        this.previousX = x;
        this.previousY = y;

        this.size = Math.random() * 4 + 2;
        this.width = this.size * 2;
        this.height = this.size * 2;

        if (direction) {
            const horizontalVelocity = direction === 'right' ? -1.5 : 1.5;
            this.speedX = (Math.random() - 0.5) * 1 + horizontalVelocity;
        } else {
            this.speedX = (Math.random() - 0.5) * 3;
        }
        
        this.speedY = Math.random() * -1.5 - 0.5;
        this.gravity = 0.08;

        this.maxLife = Math.random() * 40 + 20;
        this.life = this.maxLife;
        this.color = `rgba(150, 120, 90, ${Math.random() * 0.3 + 0.2})`;

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
        context.globalAlpha = Math.max(0, (this.life / this.maxLife) * 0.8);
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