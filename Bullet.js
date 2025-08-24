
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { CONFIG } from './Config.js';

/**
 * Represents a projectile fired by the player.
 */
export class Bullet {
    constructor(game, x, y, direction) {
        this.game = game;
        this.width = CONFIG.BULLET.WIDTH;
        this.height = CONFIG.BULLET.HEIGHT;
        this.x = x;
        this.y = y;
        this.previousX = x;
        this.previousY = y;
        this.direction = direction;
        
        this.speed = CONFIG.BULLET.SPEED;
        this.damage = CONFIG.BULLET.DAMAGE;
        this.maxDistance = CONFIG.BULLET.MAX_DISTANCE;
        
        this.speedX = this.direction === 'right' ? this.speed : -this.speed;
        this.markedForDeletion = false;
        this.startX = x;
        this.alpha = 1;
    }

    update() {
        this.previousX = this.x;
        this.previousY = this.y;

        this.x += this.speedX;
        const distanceTraveled = Math.abs(this.x - this.startX);

        const fadeStartDistance = this.maxDistance * 0.8;
        if (distanceTraveled > fadeStartDistance) {
            const fadeRange = this.maxDistance - fadeStartDistance;
            this.alpha = 1 - (distanceTraveled - fadeStartDistance) / fadeRange;
        }

        if (this.x < 0 || this.x > this.game.worldWidth || distanceTraveled >= this.maxDistance) {
            this.markedForDeletion = true;
        }
    }

    draw(context, interpolation) {
        const renderX = this.previousX + (this.x - this.previousX) * interpolation;
        const renderY = this.previousY + (this.y - this.previousY) * interpolation;
        
        context.save();
        context.globalAlpha = Math.max(0, this.alpha);
        
        context.fillStyle = '#fff';
        context.shadowColor = '#f0e68c';
        context.shadowBlur = 15;
        
        context.beginPath();
        context.roundRect(renderX, renderY, this.width, this.height, 4);
        context.fill();

        context.restore();
    }
}