
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { CONFIG } from './Config.js';

/**
 * Handles all collision detection logic for the game.
 */
export class CollisionManager {
    constructor(game) {
        this.game = game;
        this.entityManager = game.entityManager;
    }

    /**
     * Checks for collisions between two rectangular hitboxes.
     * @param {object} rect1 An object with x, y, width, height properties.
     * @param {object} rect2 An object with x, y, width, height properties.
     * @returns {boolean} True if the rectangles are colliding.
     */
    checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }
    
    /**
     * Runs all collision checks for the current frame.
     */
    checkAllCollisions() {
        this.checkBulletCollisions();
        this.checkMeleeCollisions();
    }

    /**
     * Checks for collisions between bullets and other entities.
     */
    checkBulletCollisions() {
        const bullets = this.entityManager.bullets;
        const enemies = this.entityManager.enemies;
        const eyes = this.game.environment.blinkingEyes;

        bullets.forEach(bullet => {
            if (bullet.markedForDeletion) return;
            
            // --- Check against enemies ---
            for (const enemy of enemies) {
                const enemyHitbox = {
                    x: enemy.x + enemy.hitboxOffsetX,
                    y: enemy.y,
                    width: enemy.hitboxWidth,
                    height: enemy.height
                };
                if (!enemy.isDead && this.checkCollision(bullet, enemyHitbox)) {
                    enemy.takeDamage(bullet.damage);
                    bullet.markedForDeletion = true;
                    this.entityManager.createBloodEffect(bullet.x, bullet.y + bullet.height / 2);
                    break; // A bullet can only hit one enemy
                }
            }

            // --- Check against blinking eyes (to scare them) ---
            if (!bullet.markedForDeletion) {
                for (const eye of eyes) {
                    const eyeScareZone = { x: eye.x - 20, y: eye.y - 40, width: 40, height: 80 };
                    if (!eye.isScared && this.checkCollision(bullet, eyeScareZone)) {
                        eye.scareAway();
                    }
                }
            }
        });
    }

    /**
     * Checks for collisions between the player's melee attack and other entities.
     */
    checkMeleeCollisions() {
        const player = this.entityManager.player;
        if (!player || player.animationManager.currentAnimationName !== 'melee') {
            return;
        }

        const enemies = this.entityManager.enemies;
        const eyes = this.game.environment.blinkingEyes;
        
        // Define the melee attack hitbox based on player's position and direction
        const attackRange = CONFIG.MELEE.RANGE;
        const attackHitbox = {
            x: player.direction === 'right' 
                ? player.x + player.hitboxOffsetX + player.hitboxWidth - 10 
                : player.x + player.hitboxOffsetX + 10 - attackRange,
            y: player.y,
            width: attackRange,
            height: player.height
        };

        // --- Check against enemies ---
        enemies.forEach(enemy => {
            const enemyHitbox = {
                x: enemy.x + enemy.hitboxOffsetX,
                y: enemy.y,
                width: enemy.hitboxWidth,
                height: enemy.height
            };
            if (!enemy.isDead && !player.enemiesHitThisSwing.includes(enemy) && this.checkCollision(attackHitbox, enemyHitbox)) {
                enemy.takeDamage(CONFIG.MELEE.DAMAGE);
                player.enemiesHitThisSwing.push(enemy);
                this.entityManager.createBloodEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            }
        });

        // --- Check against blinking eyes (to scare them) ---
        eyes.forEach(eye => {
            const eyeScareZone = { x: eye.x - 20, y: eye.y - 40, width: 40, height: 80 };
            if (!eye.isScared && this.checkCollision(attackHitbox, eyeScareZone)) {
                eye.scareAway();
            }
        });
    }
}
