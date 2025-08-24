
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { AnimationManager } from './AnimationManager.js';
import { TREASURE_CHEST_ANIMATIONS } from './TreasureChestAnimationData.js';
import { SparkleParticle } from './SparkleParticle.js';
import { CONFIG } from './Config.js';
import { UITextData } from './UITextData.js';

/**
 * Represents an interactive treasure chest.
 */
export class TreasureChest {
    constructor(game, x) {
        this.game = game;
        this.width = 128;
        this.height = 128;
        this.x = x;
        this.y = this.game.environment.groundLevel - this.height;
        
        this.state = 'closed'; // 'closed', 'opening', 'open'
        this.animationManager = new AnimationManager(this, TREASURE_CHEST_ANIMATIONS, 'TreasureChest');
        this.animationManager.setAnimation('idle_closed');

        this.sparkles = [];
        this.sparkleTimer = 0;
        this.sparkleInterval = 100;
        
        this.interactionRange = CONFIG.CHEST.INTERACTION_RANGE;
        this.isPlayerInRange = false;
    }

    open() {
        if (this.state === 'closed') {
            this.game.entityManager.player.forceIdleAndFreeze();
            this.state = 'opening';
            this.animationManager.setAnimation('opening');
            this.game.audioManager.playSound('chestOpen');
            this.game.entityManager.createSmokeEffect(this.x + this.width / 2, this.y + this.height / 2);
            this.game.entityManager.spawnResumeScroll(this.x, this.y);
        }
    }

    update(deltaTime) {
        this.animationManager.update(deltaTime);

        if (this.state === 'opening' && this.animationManager.currentAnimationName !== 'opening') {
            this.state = 'open';
            this.animationManager.setAnimation('idle_open');
        }

        const player = this.game.entityManager.player;
        if (this.state === 'closed' && player) {
            const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
            const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
            this.isPlayerInRange = Math.sqrt(dx * dx + dy * dy) < this.interactionRange;
        } else {
            this.isPlayerInRange = false;
        }

        if (this.state === 'closed') {
            this.sparkleTimer += deltaTime;
            if (this.sparkleTimer > this.sparkleInterval) {
                this.sparkleTimer = 0;
                for (let i = 0; i < 2; i++) {
                    this.sparkles.push(new SparkleParticle(this));
                }
            }
        }
        
        this.sparkles.forEach(sparkle => sparkle.update());
        this.sparkles = this.sparkles.filter(s => !s.markedForDeletion);
    }
    
    /**
     * Calculates the layout for the interaction hint and its button.
     * This is a private helper to ensure draw and click detection use the same logic.
     * @param {CanvasRenderingContext2D} context
     * @returns {object} An object containing layout metrics.
     */
    _getButtonLayout(context) {
        const lang = this.game.uiManager.selectedLanguage;
        const hintTexts = UITextData[lang].chestHint;

        // Text parts and styling
        const textPart1 = hintTexts.press;
        const textPartE = "E";
        const textPart2 = hintTexts.orClick;
        const buttonText = hintTexts.open;
        const textButtonSpacing = 8;
        const buttonPadding = { x: 10, y: 8 };

        // Measure text parts
        context.save();
        context.font = '22px "Georgia", serif';
        const metrics1 = context.measureText(textPart1);
        const metrics2 = context.measureText(textPart2);
        
        context.font = 'bold 22px "Georgia", serif'; // E and button text are bold
        const metricsE = context.measureText(textPartE);
        const metricsButton = context.measureText(buttonText);
        context.restore();

        // Calculate total width for centering
        const textWidth = metrics1.width + metricsE.width + metrics2.width;
        const buttonWidth = metricsButton.width + (buttonPadding.x * 2);
        const totalWidth = textWidth + textButtonSpacing + buttonWidth;
        
        const hintCenterX = this.x + this.width / 2;
        const hintY = this.y - 20;

        // Calculate X positions for each part
        let currentX = hintCenterX - totalWidth / 2;
        const x1 = currentX;
        currentX += metrics1.width;
        const xE = currentX;
        currentX += metricsE.width;
        const x2 = currentX;
        
        // Button positions
        const buttonRectX = x2 + metrics2.width + textButtonSpacing;
        const buttonTextX = buttonRectX + buttonPadding.x;
        
        const fontHeight = 22; // Approx font height
        const buttonRect = {
            x: buttonRectX,
            y: hintY - fontHeight / 2 - buttonPadding.y - 4, // a bit of vertical adjustment
            width: buttonWidth,
            height: fontHeight + (buttonPadding.y * 2)
        };
        
        return {
            texts: {
                part1: { text: textPart1, x: x1 },
                partE: { text: textPartE, x: xE },
                part2: { text: textPart2, x: x2 },
                button: { text: buttonText, x: buttonTextX }
            },
            buttonRect,
            hintY
        };
    }
    
    /**
     * Checks if a click/touch in world coordinates hits the "OPEN" button.
     * @param {number} worldX The x-coordinate of the click in the game world.
     * @param {number} worldY The y-coordinate of the click in the game world.
     * @returns {boolean} True if the click was handled.
     */
    checkClick(worldX, worldY) {
        if (this.state !== 'closed' || !this.isPlayerInRange) return false;
        
        const layout = this._getButtonLayout(this.game.context);
        const bounds = layout.buttonRect;
        
        if (worldX > bounds.x && worldX < bounds.x + bounds.width &&
            worldY > bounds.y && worldY < bounds.y + bounds.height) {
            this.open();
            return true;
        }
        return false;
    }

    drawHint(context) {
        const layout = this._getButtonLayout(context);

        context.save();
        context.shadowColor = 'rgba(0, 0, 0, 0.9)';
        context.shadowBlur = 6;
        
        // Draw button background
        context.fillStyle = '#5a0a0a';
        context.strokeStyle = '#2e0505';
        context.lineWidth = 2;
        context.beginPath();
        context.roundRect(layout.buttonRect.x, layout.buttonRect.y, layout.buttonRect.width, layout.buttonRect.height, 5);
        context.fill();
        context.stroke();
        
        // Setup text drawing
        context.textAlign = 'left';
        context.textBaseline = 'middle';
        
        // Draw text part 1 ("Press ")
        context.font = '22px "Georgia", serif';
        context.fillStyle = '#f0e6d2';
        context.fillText(layout.texts.part1.text, layout.texts.part1.x, layout.hintY);
        
        // Draw text part E ("E") in red
        context.font = 'bold 22px "Georgia", serif';
        context.fillStyle = '#ff4d4d'; // Red color for the key
        context.fillText(layout.texts.partE.text, layout.texts.partE.x, layout.hintY);

        // Draw text part 2 (" or click")
        context.font = '22px "Georgia", serif';
        context.fillStyle = '#f0e6d2';
        context.fillText(layout.texts.part2.text, layout.texts.part2.x, layout.hintY);
        
        // Draw button text ("OPEN")
        context.font = 'bold 22px "Georgia", serif';
        context.fillStyle = '#fff';
        context.fillText(layout.texts.button.text, layout.texts.button.x, layout.hintY);
        
        context.restore();
    }

    draw(context) {
        if (!this.animationManager.isLoaded) {
             context.fillStyle = 'rgba(255, 215, 0, 0.5)';
             context.fillRect(this.x, this.y, this.width, this.height);
             return;
        }
        this.animationManager.draw(context, this.x, this.y, this.width, this.height);
        
        if (this.isPlayerInRange && this.state === 'closed') {
            this.drawHint(context);
        }
        this.sparkles.forEach(sparkle => sparkle.draw(context));
    }
}