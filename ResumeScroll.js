

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { RESUME_SCROLL_DATA } from './ResumeScrollData.js';
import { CONFIG } from './Config.js';

/**
 * Represents a paper scroll that appears from a treasure chest.
 */
export class ResumeScroll {
    constructor(game, chestX, chestY, image) {
        this.game = game;

        this.finalWidth = 100;
        this.finalHeight = 100;
        // Properties needed for EntityManager culling
        this.width = this.finalWidth;
        this.height = this.finalHeight;
        this.animationDuration = CONFIG.RESUME_SCROLL.ANIMATION_DURATION;
        this.rotation = -Math.PI / 8;
        
        this.x = chestX + (128 - this.finalWidth) / 2;
        this.y = chestY - this.finalHeight / 2;
        
        this.image = image;
        this.isLoaded = !!this.image;
        
        this.state = 'appearing';
        this.animationTimer = 0;
        this.currentScale = 0;
    }

    update(deltaTime, isPlaying) {
        if (this.state === 'appearing') {
            this.animationTimer += deltaTime;
            let progress = Math.min(1, this.animationTimer / this.animationDuration);
            progress = 1 - Math.pow(1 - progress, 3); // Ease-out
            
            this.currentScale = progress;
            
            if (this.animationTimer >= this.animationDuration) {
                this.state = 'idle';
                // Use a timer to trigger the end sequence via the UIManager
                setTimeout(() => {
                    this.game.uiManager.endGameSequence();
                }, RESUME_SCROLL_DATA.dialogueStartDelay || 0);
            }
        }
    }

    draw(context) {
        if (!this.isLoaded) return;

        context.save();
        
        const centerX = this.x + this.finalWidth / 2;
        const centerY = this.y + this.finalHeight / 2;
        
        context.translate(centerX, centerY);
        context.rotate(this.rotation);
        context.scale(this.currentScale, this.currentScale);
        
        context.drawImage(this.image, -this.finalWidth / 2, -this.finalHeight / 2, this.finalWidth, this.finalHeight);
        
        context.restore();
    }
}