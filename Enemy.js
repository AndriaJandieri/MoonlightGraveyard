

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { AnimationManager } from './AnimationManager.js';
import { ENEMY_ANIMATIONS } from './EnemyAnimationData.js';
import { CONFIG } from './Config.js';

/**
 * Represents an enemy character.
 */
export class Enemy {
    constructor(game, x, y) {
        this.game = game;
        this.width = CONFIG.ENEMY.WIDTH;
        this.height = CONFIG.ENEMY.HEIGHT;

        this.hitboxWidth = CONFIG.ENEMY.HITBOX_WIDTH;
        this.hitboxOffsetX = (this.width - this.hitboxWidth) / 2;
        
        this.x = x;
        this.y = y;
        this.previousX = this.x; // For interpolation
        this.previousY = this.y; // For interpolation
        this.speedX = -CONFIG.ENEMY.SPEED;
        this.speedY = 0;
        this.direction = 'left';

        this.patrolStartX = x;
        this.patrolRange = CONFIG.ENEMY.PATROL_RANGE;

        this.gravity = CONFIG.GAME.GRAVITY;
        this.verticalOffset = 10;
        
        this.animationManager = new AnimationManager(this, ENEMY_ANIMATIONS, 'Enemy');

        this.health = CONFIG.ENEMY.HEALTH;
        this.maxHealth = CONFIG.ENEMY.HEALTH;
        this.isDead = false;
        this.markedForDeletion = false;
        this.deathTimer = 0;
        this.alpha = 1;
        this.yAtCorpseStart = 0;
    }

    takeDamage(damage) {
        if (this.isDead) return;
        this.health -= damage;

        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            this.speedX = 0;
            this.animationManager.EnemyDeadAnim();
            this.game.audioManager.playSound('enemyDeath', true);
        } else {
            this.game.audioManager.playSound('enemyHit', true);
        }
    }

    update(deltaTime, isPlaying) {
        // Store previous state for interpolation before updating.
        this.previousX = this.x;
        this.previousY = this.y;

        // If not actively playing, only update animation and handle death sequence.
        if (!isPlaying) {
            if (this.isDead) {
                this.handleDeath(deltaTime);
            } else {
                this.animationManager.EnemyIdleAnim();
            }
            this.animationManager.update(deltaTime);
            return;
        }
        
        if (!this.isDead) {
            this.x += this.speedX;

            if (this.direction === 'left' && this.x < this.patrolStartX - this.patrolRange) {
                this.direction = 'right';
                this.speedX = CONFIG.ENEMY.SPEED;
            } else if (this.direction === 'right' && this.x > this.patrolStartX) {
                this.direction = 'left';
                this.speedX = -CONFIG.ENEMY.SPEED;
            }
            
            if(this.speedX !== 0) this.animationManager.EnemyWalkAnim();
            else this.animationManager.EnemyIdleAnim();

            const previousY = this.y;
            this.speedY += this.gravity;
            this.y += this.speedY;

            let landedOnPlatform = false;
            const enemyHitboxX = this.x + this.hitboxOffsetX;
            
            if (this.speedY > 0) {
                for (const platform of this.game.environment.platforms) {
                    if (
                        enemyHitboxX < platform.x + platform.width &&
                        enemyHitboxX + this.hitboxWidth > platform.x &&
                        previousY + this.height <= platform.y + this.verticalOffset &&
                        this.y + this.height >= platform.y
                    ) {
                        this.y = platform.y - this.height + this.verticalOffset;
                        this.speedY = 0;
                        landedOnPlatform = true;
                        break;
                    }
                }
            }
            if (!landedOnPlatform && this.y + this.height > this.game.environment.groundLevel) {
                this.y = this.game.environment.groundLevel - this.height + this.verticalOffset;
                this.speedY = 0;
            }
        } else {
            this.handleDeath(deltaTime);
        }
        
        this.animationManager.update(deltaTime);
    }
    
    handleDeath(deltaTime) {
        const anim = this.animationManager.currentAnimation;
        if (anim && this.animationManager.currentFrame >= anim.frames - 1) {
            if (this.deathTimer === 0) this.yAtCorpseStart = this.y;
            
            this.deathTimer += deltaTime;
            const sinkDuration = CONFIG.ENEMY.DEATH_SINK_DURATION;
            const sinkProgress = Math.min(1, this.deathTimer / sinkDuration);

            this.alpha = 1 - sinkProgress;
            this.y = this.yAtCorpseStart + (CONFIG.ENEMY.DEATH_SINK_DEPTH * sinkProgress);

            if (this.deathTimer > sinkDuration) {
                this.markedForDeletion = true;
            }
        }
    }

    drawHealthBar(context, x, y, width, height) {
        const healthPercentage = this.health / this.maxHealth;
        
        // Background
        context.fillStyle = '#333';
        context.beginPath();
        context.roundRect(x, y, width, height, 5);
        context.fill();

        // Health Fill
        if (healthPercentage > 0) {
            let healthGradient;
            if (healthPercentage > 0.5) {
                healthGradient = context.createLinearGradient(x, y, x, y + height);
                healthGradient.addColorStop(0, '#5cff51');
                healthGradient.addColorStop(1, '#0a9c00');
            } else if (healthPercentage > 0.2) {
                healthGradient = context.createLinearGradient(x, y, x, y + height);
                healthGradient.addColorStop(0, '#ffde51');
                healthGradient.addColorStop(1, '#ffc300');
            } else {
                healthGradient = context.createLinearGradient(x, y, x, y + height);
                healthGradient.addColorStop(0, '#ff5151');
                healthGradient.addColorStop(1, '#c40000');
            }
            context.fillStyle = healthGradient;
            context.beginPath();
            context.roundRect(x, y, width * healthPercentage, height, 5);
            context.fill();
        }

        // Border
        context.strokeStyle = '#222';
        context.lineWidth = 1;
        context.beginPath();
        context.roundRect(x, y, width, height, 5);
        context.stroke();
    }

    draw(context, interpolation) {
        context.save();
        context.globalAlpha = this.alpha;

        // Interpolate position for smooth rendering
        const renderX = this.previousX + (this.x - this.previousX) * interpolation;
        const renderY = this.previousY + (this.y - this.previousY) * interpolation;

        if (this.health < this.maxHealth && !this.isDead) {
            const barWidth = this.width * 0.8;
            const barHeight = 10;
            const barX = renderX + (this.width - barWidth) / 2;
            const barY = renderY - barHeight - 10;
            this.drawHealthBar(context, barX, barY, barWidth, barHeight);
        }

        if (!this.animationManager.isLoaded) {
            context.fillStyle = 'rgba(255, 0, 0, 0.5)';
            context.fillRect(renderX, renderY, this.width, this.height);
            context.restore();
            return;
        }
        
        context.save();
        if (this.direction === 'left') {
            context.scale(-1, 1);
            this.animationManager.draw(context, -renderX - this.width, renderY, this.width, this.height);
        } else {
            this.animationManager.draw(context, renderX, renderY, this.width, this.height);
        }
        context.restore();
        context.restore();
    }
}