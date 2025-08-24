/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { CONFIG } from './Config.js';

/**
 * Handles keyboard, touch, and mouse inputs, translating them into unified game actions.
 * This version correctly handles multiple simultaneous inputs (e.g., multi-touch)
 * by tracking input sources separately and combining their states.
 */
class InputHandler {
    constructor() {
        // State for keyboard inputs
        this.keyboardState = {
            moveLeft: false, moveRight: false, jump: false,
            shoot: false, melee: false, openChest: false,
        };
        // State for touch/mouse button inputs
        this.buttonState = {
            moveLeft: false, moveRight: false, jump: false,
            shoot: false, melee: false, openChest: false,
        };
        // The final, unified action state for the game to read
        this.actions = { ...this.keyboardState };

        this.touchButtons = document.querySelectorAll('.touch-button');

        // Bind methods to ensure 'this' is correct
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleButtonDown = this.handleButtonDown.bind(this);
        this.handleButtonUp = this.handleButtonUp.bind(this);
        
        // Add event listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);

        this.touchButtons.forEach(button => {
            button.addEventListener('touchstart', this.handleButtonDown, { passive: false });
            button.addEventListener('touchend', this.handleButtonUp, { passive: false });
            button.addEventListener('mousedown', this.handleButtonDown);
            button.addEventListener('mouseup', this.handleButtonUp);
            button.addEventListener('mouseleave', this.handleButtonUp); // Handle mouse dragging off
            button.addEventListener('contextmenu', (e) => e.preventDefault());
        });
    }

    /**
     * Combines keyboard and button states into the final actions object.
     * An action is true if it's triggered by either keyboard OR button press.
     */
    updateCombinedActions() {
        for (const key in this.actions) {
            this.actions[key] = this.keyboardState[key] || this.buttonState[key];
        }
    }

    handleKeyDown(e) {
        const keyMap = {
            'keya': 'moveLeft', 'keyd': 'moveRight', 'space': 'jump',
            'keyq': 'shoot', 'keyw': 'melee', 'keye': 'openChest'
        };
        const action = keyMap[e.code.toLowerCase()];
        if (action && this.keyboardState.hasOwnProperty(action)) {
            this.keyboardState[action] = true;
            this.updateCombinedActions();
        }
    }
    
    handleKeyUp(e) {
        const keyMap = {
            'keya': 'moveLeft', 'keyd': 'moveRight', 'space': 'jump',
            'keyq': 'shoot', 'keyw': 'melee', 'keye': 'openChest'
        };
        const action = keyMap[e.code.toLowerCase()];
        if (action && this.keyboardState.hasOwnProperty(action)) {
            this.keyboardState[action] = false;
            this.updateCombinedActions();
        }
    }
    
    // Handles mousedown and touchstart
    handleButtonDown(e) {
        e.preventDefault();
        const action = e.currentTarget.dataset.action;
        if (action && this.buttonState.hasOwnProperty(action)) {
            this.buttonState[action] = true;
            e.currentTarget.classList.add('pressed');
            this.updateCombinedActions();
        }
    }

    // Handles mouseup, touchend, and mouseleave
    handleButtonUp(e) {
        e.preventDefault();
        const action = e.currentTarget.dataset.action;
        if (action && this.buttonState.hasOwnProperty(action)) {
            // Only update if the button was actually pressed
            if (this.buttonState[action]) {
                this.buttonState[action] = false;
                e.currentTarget.classList.remove('pressed');
                this.updateCombinedActions();
            }
        }
    }

    detach() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.touchButtons.forEach(button => {
            button.removeEventListener('touchstart', this.handleButtonDown);
            button.removeEventListener('touchend', this.handleButtonUp);
            button.removeEventListener('mousedown', this.handleButtonDown);
            button.removeEventListener('mouseup', this.handleButtonUp);
            button.removeEventListener('mouseleave', this.handleButtonUp);
        });
    }
}

/**
 * Controls the player character's state based on abstract game actions.
 */
export class PlayerController {
    constructor(player, game) {
        this.player = player;
        this.game = game;
        this.inputHandler = new InputHandler();
        // Tracks the previous state of one-shot actions to detect the rising edge
        this.actionState = {
            jump: false,
            shoot: false,
            melee: false,
        };

        this.confusedTimer = 0;
        this.confusedSoundPlayed = false;
    }

    detach() {
        this.inputHandler.detach();
    }
    
    update(timestep) {
        if (!this.player || this.player.isFrozen) return;

        const actions = this.inputHandler.actions;
        const animManager = this.player.animationManager;

        // Check for the rising edge of actions (a fresh press)
        const jumpPressed = actions.jump && !this.actionState.jump;
        const shootPressed = actions.shoot && !this.actionState.shoot;
        const meleePressed = actions.melee && !this.actionState.melee;
        
        // Update the state for the next frame
        this.actionState.jump = actions.jump;
        this.actionState.shoot = actions.shoot;
        this.actionState.melee = actions.melee;
        
        const isAttacking = ['melee', 'shoot'].includes(animManager.currentAnimationName);
        if (!isAttacking) {
            this.player.attackStartedOnGround = false;
        }

        const isMovingLeft = actions.moveLeft;
        const isMovingRight = actions.moveRight;
        const bothMoveKeysPressed = isMovingLeft && isMovingRight;

        if (bothMoveKeysPressed) {
            this.confusedTimer += timestep;
            if (this.confusedTimer > 500 && !this.confusedSoundPlayed) {
                this.game.audioManager.playSound('WhereToGo');
                this.confusedSoundPlayed = true;
            }
        } else {
            this.confusedTimer = 0;
            this.confusedSoundPlayed = false;
        }

        // Animation State Machine
        if (this.player.justLanded) {
            if (!isAttacking) {
                animManager.PlayerIdleAnim();
            }
        } else if (!isAttacking) {
            if (this.player.isOnGround()) {
                if (jumpPressed) this.player.jump();
                else if (shootPressed) this.player.shoot();
                else if (meleePressed) this.player.meleeAttack();
                else if (bothMoveKeysPressed) animManager.PlayerIdleAnim();
                else if (isMovingLeft || isMovingRight) animManager.PlayerRunAnim();
                else animManager.PlayerIdleAnim();
            } else { // In the air
                if (shootPressed) this.player.shoot();
                else if (meleePressed) this.player.meleeAttack();
                else if (animManager.currentAnimationName !== 'jump') animManager.PlayerJumpAnim();
            }
        }

        // Handle bullet firing logic
        if (animManager.currentAnimationName === 'shoot' && animManager.currentFrame === 1 && !this.player.hasFiredThisShot) {
            const bulletYOffset = this.player.height * 0.55;
            const bulletXOffset = this.player.direction === 'right' ? this.player.width - 10 : -10;
            this.game.entityManager.addBullet(this.player.x + bulletXOffset, this.player.y + bulletYOffset - 5, this.player.direction);
            this.player.hasFiredThisShot = true;
        }
        
        // Handle chest opening
        if (actions.openChest) {
            this.game.entityManager.treasureChests.forEach(chest => {
                if (chest.state === 'closed' && chest.isPlayerInRange && this.player.isOnGround()) {
                    chest.open();
                }
            });
        }
        
        // Horizontal Movement
        const isActionLocked = isAttacking && this.player.attackStartedOnGround;
        if (isActionLocked) {
            this.player.speedX = 0;
        } else {
            const isSlowedOnLanding = this.player.isOnGround() && isAttacking && !this.player.attackStartedOnGround;
            const currentSpeed = isSlowedOnLanding ? CONFIG.PLAYER.SPEED * CONFIG.PLAYER.ATTACK_SLOWDOWN_MULTIPLIER : CONFIG.PLAYER.SPEED;

            if (isSlowedOnLanding && (isMovingLeft || isMovingRight) && !bothMoveKeysPressed) {
                const footX = this.player.x + this.player.width / 2;
                const footY = this.player.y + this.player.height;
                this.game.entityManager.createDustEffect(footX + 5, footY - 10, this.player.direction);
            }

            if (isMovingRight && !isMovingLeft) {
                this.player.speedX = currentSpeed;
                this.player.direction = 'right';
            } else if (isMovingLeft && !isMovingRight) {
                this.player.speedX = -currentSpeed;
                this.player.direction = 'left';
            } else {
                this.player.speedX = 0;
            }
        }
    }
}