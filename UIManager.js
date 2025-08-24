

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { DIALOGUE_DATA } from './DialogueData.js';
import { RESUME_SCROLL_DATA } from './ResumeScrollData.js';
import { CONFIG } from './Config.js';
import { UITextData } from './UITextData.js';

/**
 * Manages all UI elements, both DOM and canvas-based.
 */
export class UIManager {
    constructor(game) {
        this.game = game;
        this.selectedLanguage = 'en';

        // --- DOM Elements ---
        this.startMenu = document.getElementById('start-menu');
        this.startButton = document.getElementById('start-button');
        this.controlsGuide = document.getElementById('controls-guide');
        this.muteButton = document.getElementById('mute-button');
        this.touchControls = document.getElementById('touch-controls');
        this.touchToggleCheckbox = document.getElementById('touch-toggle-checkbox');
        // New elements for translation
        this.touchToggleLabel = document.getElementById('touch-toggle-label');
        this.meleeButton = document.getElementById('melee-touch-button');
        this.shootButton = document.getElementById('shoot-touch-button');
        
        // --- State ---
        this.dialogueQueue = [];
        this.currentDialogue = null;
        this.isEnding = false;
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        this.touchControlsVisible = false;

        // --- Icons ---
        this.soundOnIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>`;
        this.soundOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path></svg>`;
    }

    /**
     * Initializes UI elements and sets up event listeners.
     */
    init() {
        if (!this.startMenu || !this.startButton || !this.controlsGuide || !this.muteButton || !this.touchControls || !this.touchToggleCheckbox) {
            console.error('A required UI element was not found in the DOM!');
            return;
        }
        this.setupLanguageSelector();
        this.setupStartButton();
        this.setupMuteButton();
        this.setupTouchControls();
        this.setupCanvasClickListener();
        this.updateUIText();
    }
    
    /**
     * Displays an error message on the start button if assets fail to load.
     */
    showLoadError() {
        this.startButton.textContent = 'Load Error';
        this.startButton.disabled = true;
    }

    /**
     * Updates all UI text based on the selected language.
     */
    updateUIText() {
        const texts = UITextData[this.selectedLanguage];

        this.startButton.textContent = texts.startButton;
        this.touchToggleLabel.textContent = texts.touchControlLabel;
        this.meleeButton.textContent = texts.knifeButton;
        this.shootButton.textContent = texts.fireButton;

        const controls = texts.controlsGuide;
        this.controlsGuide.innerHTML = `
            <div class="controls-title">${controls.title}</div>
            <div class="control-item"><span>${controls.moveRight}</span><span class="key">D</span></div>
            <div class="control-item"><span>${controls.moveLeft}</span><span class="key">A</span></div>
            <div class="control-item"><span>${controls.jump}</span><span class="key">SPACE</span></div>
            <div class="control-item"><span>${controls.fire}</span><span class="key">Q</span></div>
            <div class="control-item"><span>${controls.knife}</span><span class="key">W</span></div>
            <div class="control-item"><span>${controls.openChest}</span><span class="key">E</span></div>
        `.trim().replace(/^\s+/gm, '');
    }
    
    setupLanguageSelector() {
        const languageOptions = document.querySelectorAll('.language-option');
        languageOptions.forEach(option => {
            option.addEventListener('click', () => {
                languageOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.selectedLanguage = option.dataset.lang;
                this.updateUIText();
            });
        });
    }

    setupStartButton() {
        this.startButton.addEventListener('click', async () => {
            this.startButton.disabled = true;
            this.startButton.textContent = 'Loading...';
            
            this.game.audioManager.initAudioContext();
            await this.game.audioManager.loadSounds();

            this.startMenu.style.opacity = '0';
            this.game.audioManager.playBackgroundMusic();
            this.game.audioManager.startRandomScreams();
            this.showControlsGuide();

            setTimeout(() => {
                this.startMenu.classList.add('hidden');
                this.startDialogue([{ 
                    text: DIALOGUE_DATA[this.selectedLanguage].intro, 
                    target: this.game.entityManager.player 
                }]);
            }, 500);
        });
    }

    setupMuteButton() {
        this.muteButton.innerHTML = this.soundOnIcon;
        this.muteButton.addEventListener('click', () => {
            this.game.audioManager.initAudioContext();
            this.game.audioManager.toggleMute();
            this.muteButton.innerHTML = this.game.audioManager.isMuted ? this.soundOffIcon : this.soundOnIcon;
            this.muteButton.blur();
        });
    }

    setupTouchControls() {
        if (this.isTouchDevice) {
            this.setTouchControlsVisibility(true);
        } else {
            this.setTouchControlsVisibility(false);
        }

        this.touchToggleCheckbox.addEventListener('change', (e) => {
            this.setTouchControlsVisibility(e.target.checked);
        });

        // Prevent spacebar from toggling the checkbox when it has focus
        this.touchToggleCheckbox.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });

        // Hide on keyboard use for hybrid devices
        window.addEventListener('keydown', (e) => {
            if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
            if (this.touchControlsVisible) {
                this.setTouchControlsVisibility(false);
            }
        });
    }

    setTouchControlsVisibility(visible) {
        this.touchControlsVisible = visible;
        this.touchControls.classList.toggle('hidden', !visible);
        this.touchToggleCheckbox.checked = visible;
    
        const isGameRunning = this.game.gameStateManager.getState() !== 'MENU';
        if (isGameRunning) {
            if (visible) {
                // If touch controls are ON, hide the keyboard guide.
                this.controlsGuide.classList.remove('visible');
            } else {
                // If touch controls are OFF, show the keyboard guide.
                this.controlsGuide.classList.remove('hidden');
                setTimeout(() => this.controlsGuide.classList.add('visible'), 10);
            }
        }
    }

    showControlsGuide() {
        // If touch controls are active when the game starts, don't show the guide.
        if (this.touchControlsVisible) {
            this.controlsGuide.classList.add('hidden');
            return;
        }
        this.controlsGuide.classList.remove('hidden');
        setTimeout(() => this.controlsGuide.classList.add('visible'), 10);
    }

    setupCanvasClickListener() {
        const handleInteraction = (event) => {
            // Don't interact with canvas UI if the game is paused or over
            const state = this.game.gameStateManager.getState();
            if (state === 'MENU' || state === 'GAME_OVER') return;

            event.preventDefault();
            
            const rect = this.game.canvas.getBoundingClientRect();
            let clientX, clientY;

            if (event.touches) {
                if (event.touches.length === 0) return;
                clientX = event.touches[0].clientX;
                clientY = event.touches[0].clientY;
            } else {
                clientX = event.clientX;
                clientY = event.clientY;
            }
            
            // Unscale the coordinates from screen space (relative to the scaled canvas)
            // to the game's native resolution space.
            const scale = this.game.scale || 1;
            const clickX = (clientX - rect.left) / scale;
            const clickY = (clientY - rect.top) / scale;

            const camera = this.game.camera;
            const worldX = clickX + camera.x;
            const worldY = clickY + camera.y;

            for (const chest of this.game.entityManager.treasureChests) {
                if (chest.checkClick(worldX, worldY)) {
                    break;
                }
            }
        };

        this.game.canvas.addEventListener('click', handleInteraction);
        this.game.canvas.addEventListener('touchstart', handleInteraction, { passive: false });
    }
    
    startDialogue(sequence) {
        this.dialogueQueue = sequence;
        if (this.game.gameStateManager.getState() !== 'GAME_OVER') {
            this.game.gameStateManager.setState('DIALOGUE');
        }
        this.advanceDialogueQueue();
    }
    
    advanceDialogueQueue() {
        if (this.dialogueQueue.length > 0) {
            this.currentDialogue = { ...this.dialogueQueue.shift(), displayedText: '', typingTimer: 0, isTypingComplete: false, endTimer: 0 };
        } else {
            this.currentDialogue = null;
            if (this.isEnding) {
                this.game.gameStateManager.setState('GAME_OVER');
            } else if (this.game.gameStateManager.getState() !== 'GAME_OVER') {
                this.game.gameStateManager.setState('PLAYING');
            }
        }
    }
    
    /**
     * Initiates the end-of-game sequence.
     */
    endGameSequence() {
        if (this.isEnding) return;
        this.isEnding = true;
        
        this.startDialogue([{
            text: DIALOGUE_DATA[this.selectedLanguage].outro,
            target: this.game.entityManager.player,
        }]);

        setTimeout(() => {
            const link = document.createElement('a');
            link.href = RESUME_SCROLL_DATA.downloadUrl;
            link.download = 'AndriaJandieri_Resume.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, RESUME_SCROLL_DATA.downloadDelay || 500);
    }
    
    update(timestep) {
        if (!this.currentDialogue) return;
        
        const dialogue = this.currentDialogue;
        if (!dialogue.isTypingComplete) {
            dialogue.typingTimer += timestep;
            if (dialogue.typingTimer >= CONFIG.UI.DIALOGUE_TYPING_SPEED) {
                dialogue.typingTimer = 0;
                if (dialogue.displayedText.length < dialogue.text.length) {
                    dialogue.displayedText += dialogue.text[dialogue.displayedText.length];
                } else {
                    dialogue.isTypingComplete = true;
                }
            }
        } else {
            dialogue.endTimer += timestep;
            if (dialogue.endTimer >= CONFIG.UI.DIALOGUE_END_WAIT) {
                this.advanceDialogueQueue();
            }
        }
    }
    
    /**
     * Draws all canvas-based UI elements.
     * @param {CanvasRenderingContext2D} context 
     */
    drawCanvasUI(context) {
        if (this.game.gameStateManager.getState() === 'GAME_OVER') {
            this.drawGameOver(context);
        }
        if ((this.game.gameStateManager.getState() === 'DIALOGUE' || this.isEnding) && this.currentDialogue) {
            this.drawDialogueBox(context);
        }
    }
    
    drawGameOver(context) {
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, this.game.width, this.game.height);

        const text = UITextData[this.selectedLanguage].gameOver;
        const x = this.game.width / 2;
        const y = this.game.height / 2;
        
        context.save();
        context.font = '90px "Jolly Lodger", cursive';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        if (context.letterSpacing) context.letterSpacing = '3px';
        
        context.shadowColor = 'rgba(0,0,0,0.8)';
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        context.shadowBlur = 2;
        context.fillStyle = '#e0e0e0';
        context.fillText(text, x, y);

        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.shadowColor = 'rgba(255, 80, 80, 0.7)';
        context.shadowBlur = 10;
        context.fillText(text, x, y);
        
        context.shadowColor = 'transparent';
        context.fillStyle = '#e0e0e0';
        context.fillText(text, x, y);
        context.restore();
    }

    drawDialogueBox(context) {
        const dialogue = this.currentDialogue;
        if (!dialogue || !dialogue.target) return;
        
        const target = dialogue.target;
        const camera = this.game.camera;
        
        context.font = '20px "Georgia", serif';
        const boxPadding = 20;
        const boxWidth = Math.min(this.game.width - 40, context.measureText(dialogue.text).width + boxPadding * 2);
        const boxHeight = 50;
        const borderRadius = 10;
        const calloutHeight = 15;
        const calloutWidth = 30;

        const targetScreenX = target.x - camera.x + target.width / 2;
        const targetScreenY = target.y - camera.y;
        
        let boxX = targetScreenX - boxWidth / 2;
        let boxY = targetScreenY - boxHeight - calloutHeight - 5;
        
        boxX = Math.max(20, Math.min(boxX, this.game.width - boxWidth - 20));
        
        context.save();
        context.fillStyle = 'rgba(0, 0, 0, 0.75)';
        context.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        context.lineWidth = 2;
        
        context.beginPath();
        context.moveTo(boxX + borderRadius, boxY);
        context.lineTo(boxX + boxWidth - borderRadius, boxY);
        context.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + borderRadius);
        context.lineTo(boxX + boxWidth, boxY + boxHeight - borderRadius);
        context.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - borderRadius, boxY + boxHeight);
        
        const calloutBaseX = Math.max(boxX + calloutWidth / 2 + 5, Math.min(targetScreenX, boxX + boxWidth - calloutWidth / 2 - 5));
        
        context.lineTo(calloutBaseX + calloutWidth / 2, boxY + boxHeight);
        context.lineTo(calloutBaseX, boxY + boxHeight + calloutHeight);
        context.lineTo(calloutBaseX - calloutWidth / 2, boxY + boxHeight);
        
        context.lineTo(boxX + borderRadius, boxY + boxHeight);
        context.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - borderRadius);
        context.lineTo(boxX, boxY + borderRadius);
        context.quadraticCurveTo(boxX, boxY, boxX + borderRadius, boxY);
        context.closePath();
        
        context.fill();
        context.stroke();
        
        context.fillStyle = '#fff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(dialogue.displayedText, boxX + boxWidth / 2, boxY + boxHeight / 2);
        
        context.restore();
    }
}
