

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Represents a pair of spooky, blinking eyes that appear in bushes and watch the player.
 */
export class BlinkingEyes {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;

        this.eyeRadiusX = 5;
        this.eyeRadiusY = 6;
        this.eyeSpacing = 15;
        this.eyeColor = '#FFFF00';
        this.glowColor = 'rgba(255, 255, 0, 0.6)';
        
        this.pupilRadius = 2.5;
        this.pupilColor = '#000';
        this.maxPupilOffset = this.eyeRadiusX - this.pupilRadius;
        this.currentPupilOffset = 0;

        this.blinkState = 'open';
        this.blinkTimer = 0;
        this.currentLidPosition = 1;

        this.timeUntilNextBlink = this.getRandomBlinkInterval();
        this.closingDuration = 60;
        this.closedDuration = 120;
        this.openingDuration = 80;

        this.isScared = false;
        this.scaredState = 'none';
        this.scaredTimer = 0;
        this.fadeOutDuration = 1000;
        this.hiddenDuration = 5000;
        this.fadeInDuration = 1000;
        this.baseAlpha = 0.85;
        this.alpha = this.baseAlpha;
    }

    getRandomBlinkInterval() {
        return Math.random() * 4000 + 2000;
    }

    scareAway() {
        if (this.isScared) return;
        this.isScared = true;
        this.scaredState = 'fadingOut';
        this.scaredTimer = 0;
        this.blinkState = 'open';
        this.currentLidPosition = 1;
    }

    update(timestep) {
        if (this.isScared) {
            this.scaredTimer += timestep;
            switch (this.scaredState) {
                case 'fadingOut':
                    this.alpha = this.baseAlpha * (1 - Math.min(1, this.scaredTimer / this.fadeOutDuration));
                    if (this.scaredTimer >= this.fadeOutDuration) {
                        this.scaredState = 'hidden';
                        this.scaredTimer = 0;
                    }
                    break;
                case 'hidden':
                    this.alpha = 0;
                    if (this.scaredTimer >= this.hiddenDuration) {
                        this.scaredState = 'fadingIn';
                        this.scaredTimer = 0;
                    }
                    break;
                case 'fadingIn':
                    this.alpha = this.baseAlpha * Math.min(1, this.scaredTimer / this.fadeInDuration);
                    if (this.scaredTimer >= this.fadeInDuration) {
                        this.isScared = false;
                        this.scaredState = 'none';
                        this.alpha = this.baseAlpha;
                    }
                    break;
            }
            return;
        }

        const player = this.game.entityManager.player;
        if (player) {
            const playerCenterX = player.x + player.width / 2;
            const direction = playerCenterX - this.x;
            const targetPupilOffset = Math.max(-this.maxPupilOffset, Math.min(this.maxPupilOffset, direction / 50));
            this.currentPupilOffset += (targetPupilOffset - this.currentPupilOffset) * 0.08;
        }

        this.blinkTimer += timestep;
        switch (this.blinkState) {
            case 'open':
                if (this.blinkTimer >= this.timeUntilNextBlink) { this.blinkState = 'closing'; this.blinkTimer = 0; }
                break;
            case 'closing':
                this.currentLidPosition = Math.max(0, 1 - (this.blinkTimer / this.closingDuration));
                if (this.blinkTimer >= this.closingDuration) { this.blinkState = 'closed'; this.blinkTimer = 0; }
                break;
            case 'closed':
                this.currentLidPosition = 0;
                if (this.blinkTimer >= this.closedDuration) { this.blinkState = 'opening'; this.blinkTimer = 0; }
                break;
            case 'opening':
                this.currentLidPosition = Math.min(1, this.blinkTimer / this.openingDuration);
                if (this.blinkTimer >= this.openingDuration) {
                    this.blinkState = 'open';
                    this.blinkTimer = 0;
                    this.timeUntilNextBlink = this.getRandomBlinkInterval();
                }
                break;
        }
    }

    draw(context) {
        if (this.alpha <= 0.01 || (!this.isScared && this.currentLidPosition <= 0.05)) {
            return;
        }

        const animatedRadiusY = this.eyeRadiusY * this.currentLidPosition;
        context.save();
        context.globalAlpha = this.alpha;
        context.shadowColor = this.glowColor;
        context.shadowBlur = 10;
        context.fillStyle = this.eyeColor;
        
        context.beginPath();
        context.ellipse(this.x - this.eyeSpacing / 2, this.y, this.eyeRadiusX, animatedRadiusY, 0, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.ellipse(this.x + this.eyeSpacing / 2, this.y, this.eyeRadiusX, animatedRadiusY, 0, 0, Math.PI * 2);
        context.fill();

        context.shadowBlur = 0;
        context.shadowColor = 'transparent';
        context.fillStyle = this.pupilColor;
        const pupilRadiusY = this.pupilRadius * this.currentLidPosition;

        context.beginPath();
        context.ellipse(this.x - this.eyeSpacing / 2 + this.currentPupilOffset, this.y, this.pupilRadius, pupilRadiusY, 0, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.ellipse(this.x + this.eyeSpacing / 2 + this.currentPupilOffset, this.y, this.pupilRadius, pupilRadiusY, 0, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }
}