/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { AnimationManager } from './AnimationManager.js';
import { CONFIG } from './Config.js';

/**
 * Represents the player character.
 */
export class Player {
    constructor(game, animationsConfig) {
        this.game = game;
        this.width = CONFIG.PLAYER.WIDTH;
        this.height = CONFIG.PLAYER.HEIGHT;
        
        this.hitboxWidth = CONFIG.PLAYER.HITBOX_WIDTH;
        this.hitboxOffsetX = (this.width - this.hitboxWidth) / 2;
        
        this.x = (this.game.width - this.width) / 2;
        this.y = this.game.environment.groundLevel - this.height + 10;
        
        // Store the previous state for interpolation to ensure smooth rendering.
        this.previousX = this.x;
        this.previousY = this.y;
        
        this.speedX = 0;
        this.speedY = 0;
        this.gravity = CONFIG.GAME.GRAVITY;
        this.jumpStrength = CONFIG.PLAYER.JUMP_STRENGTH;
        this.verticalOffset = 10;
        
        this.isGrounded = true;
        this.justLanded = false;
        this.direction = 'right';
        this.isFrozen = false;

        this.animationManager = new AnimationManager(this, animationsConfig, 'Player');
        this.enemiesHitThisSwing = [];
        this.hasFiredThisShot = false;
        this.attackStartedOnGround = false;

        this.lastShotTime = 0;

        this.isPlayingFootsteps = false;
        this.lastFrameForFootstep = -1;
    }

    forceIdleAndFreeze() {
        this.isFrozen = true;
        this.speedX = 0;
        this.speedY = 0;
        this.animationManager.PlayerIdleAnim();
        
        if (this.isPlayingFootsteps) {
            this.game.audioManager.stopLoopingSound('footsteps');
            this.isPlayingFootsteps = false;
        }
    }

    isOnGround() {
        return this.isGrounded;
    }

    jump() {
        if (this.isOnGround()) {
            this.speedY = this.jumpStrength;
            this.animationManager.PlayerJumpAnim();
            this.game.audioManager.playSound('jump', true);
        }
    }

    meleeAttack() {
        this.attackStartedOnGround = this.isOnGround();
        this.animationManager.PlayerMeleeAnim();
        this.enemiesHitThisSwing = [];
        this.game.audioManager.playSound('melee', true);
    }

    shoot() {
        const currentTime = Date.now();
        if (currentTime - this.lastShotTime < CONFIG.PLAYER.SHOOT_COOLDOWN) {
            return;
        }
        
        this.attackStartedOnGround = this.isOnGround();
        this.lastShotTime = currentTime;
        this.animationManager.PlayerShootAnim();
        this.game.audioManager.playSound('pistolShoot', true);
        this.hasFiredThisShot = false;
    }

    update(deltaTime, isPlaying) {
        // Store the state from the previous physics update. This is the starting point for our interpolation.
        this.previousX = this.x;
        this.previousY = this.y;

        this.justLanded = false;
        const wasGrounded = this.isGrounded;

        // If not actively playing, only update animation.
        if (!isPlaying || this.isFrozen) {
            if (this.isPlayingFootsteps) {
                this.game.audioManager.stopLoopingSound('footsteps');
                this.isPlayingFootsteps = false;
            }
            this.animationManager.update(deltaTime);
            return;
        }

        this.x += this.speedX;
        
        const previousY = this.y;
        this.speedY += this.gravity;
        this.y += this.speedY;

        let onSolidSurface = false;
        const playerHitboxX = this.x + this.hitboxOffsetX;

        if (this.speedY >= 0) {
            for (const platform of this.game.environment.platforms) {
                if (
                    playerHitboxX < platform.x + platform.width &&
                    playerHitboxX + this.hitboxWidth > platform.x &&
                    previousY + this.height <= platform.y + this.verticalOffset &&
                    this.y + this.height >= platform.y
                ) {
                    this.y = platform.y - this.height + this.verticalOffset;
                    this.speedY = 0;
                    onSolidSurface = true;
                    break;
                }
            }
        }

        if (!onSolidSurface && this.y + this.height > this.game.environment.groundLevel + this.verticalOffset) {
            this.y = this.game.environment.groundLevel - this.height + this.verticalOffset;
            this.speedY = 0;
            onSolidSurface = true;
        }
        
        this.isGrounded = onSolidSurface;

        if (!wasGrounded && this.isGrounded) {
            this.justLanded = true;
            const footX = this.x + this.width / 2;
            const footY = this.y + this.height - 5;
            this.game.entityManager.createFootstepEffect(footX, footY, CONFIG.PARTICLES.LANDING_DUST_COUNT, null);
        }
        
        const isRunning = this.isOnGround() && this.speedX !== 0;
        if (isRunning && !this.isPlayingFootsteps) {
            this.game.audioManager.startLoopingSound('footsteps');
            this.isPlayingFootsteps = true;
        } else if (!isRunning && this.isPlayingFootsteps) {
            this.game.audioManager.stopLoopingSound('footsteps');
            this.isPlayingFootsteps = false;
        }

        if (this.x < 0) this.x = 0;
        if (this.x > this.game.worldWidth - this.width) this.x = this.game.worldWidth - this.width;

        this.animationManager.update(deltaTime);

        if (this.animationManager.currentAnimationName === 'run' && this.isOnGround()) {
            const frame = this.animationManager.currentFrame;
            if ((frame === 2 || frame === 6) && frame !== this.lastFrameForFootstep) {
                const footX = this.x + this.width / 2;
                const footY = this.y + this.height - 5;
                this.game.entityManager.createFootstepEffect(footX, footY, CONFIG.PARTICLES.RUNNING_DUST_COUNT, this.direction);
            }
            this.lastFrameForFootstep = frame;
        } else {
            this.lastFrameForFootstep = -1;
        }
    }

    draw(context, interpolation) {
        if (!this.animationManager.isLoaded) {
            context.fillStyle = 'rgba(255, 255, 255, 0.5)';
            context.fillRect(this.x, this.y, this.width, this.height);
            return;
        }
        
        // Calculate the interpolated position for this render frame.
        // This blends the previous position with the current position based on the interpolation factor,
        // resulting in smooth movement even if the render rate is higher than the update rate.
        const renderX = this.previousX + (this.x - this.previousX) * interpolation;
        const renderY = this.previousY + (this.y - this.previousY) * interpolation;
        
        context.save();
        if (this.direction === 'left') {
            context.scale(-1, 1);
            this.animationManager.draw(context, -renderX - this.width, renderY, this.width, this.height);
        } else {
            this.animationManager.draw(context, renderX, renderY, this.width, this.height);
        }
        context.restore();
    }
}