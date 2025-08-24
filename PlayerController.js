
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { CONFIG } from './Config.js';

/**
 * Handles keyboard, touch, and mouse inputs, translating them into unified game actions.
 */
class InputHandler {
    constructor() {
        // Keyboard state
        this.keys = new Set();
        // Unified action state for the game to read
        this.actions = {
            moveLeft: false,
            moveRight: false,
            jump: false,
            shoot: false,
            melee: false,
            openChest: false
        };
        // Touch/Mouse button elements
        this.touchButtons = document.querySelectorAll('.touch-button');

        // Bind methods to ensure 'this' is correct
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        
        // Add event listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('mouseup', this.handleMouseUp); // Listen globally for mouse release

        this.touchButtons.forEach(button => {
            button.addEventListener('touchstart', this.handleTouchStart, { passive: true });
            button.addEventListener('touchend', this.handleTouchEnd, { passive: true });
            button.addEventListener('mousedown', this.handleMouseDown);
            button.addEventListener('contextmenu', (e) => e.preventDefault()); // Prevent right-click menu
        });
    }

    handleKeyDown(e) {
        this.keys.add(e.code.toLowerCase());
        this.updateActionsFromKeyboard();
    }
    
    handleKeyUp(e) {
        this.keys.delete(e.code.toLowerCase());
        this.updateActionsFromKeyboard();
    }
    
    handleTouchStart(e) {
        const action = e.currentTarget.dataset.action;
        if (action && this.actions.hasOwnProperty(action)) {
            this.actions[action] = true;
            e.currentTarget.classList.add('pressed');
        }
    }

    handleTouchEnd(e) {
        // When any touch ends, we'll assume all are released for simplicity in a non-multitouch game
        this.clearAllButtonActions();
    }

    handleMouseDown(e) {
        e.preventDefault(); // Prevent text selection on drag
        const action = e.currentTarget.dataset.action;
        if (action && this.actions.hasOwnProperty(action)) {
            this.actions[action] = true;
            e.currentTarget.classList.add('pressed');
        }
    }

    handleMouseUp(e) {
        // A global mouseup listener ensures we clear actions even if mouse is released outside a button
        this.clearAllButtonActions();
    }

    clearAllButtonActions() {
        this.touchButtons.forEach(btn => {
            const action = btn.dataset.action;
            if (action && this.actions.hasOwnProperty(action)) {
                this.actions[action] = false;
                btn.classList.remove('pressed');
            }
        });
    }

    updateActionsFromKeyboard() {
        this.actions.moveLeft = this.keys.has('keya');
        this.actions.moveRight = this.keys.has('keyd');
        this.actions.jump = this.keys.has('space');
        this.actions.shoot = this.keys.has('keyq');
        this.actions.melee = this.keys.has('keyw');
        this.actions.openChest = this.keys.has('keye');
    }

    detach() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('mouseup', this.handleMouseUp);
        this.touchButtons.forEach(button => {
            button.removeEventListener('touchstart', this.handleTouchStart);
            button.removeEventListener('touchend', this.handleTouchEnd);
            button.removeEventListener('mousedown', this.handleMouseDown);
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