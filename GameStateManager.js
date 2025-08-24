
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Manages the overall state of the game.
 */
export class GameStateManager {
    constructor(game) {
        this.game = game;
        this.currentState = 'LOADING'; // Initial state
    }
    
    /**
     * Sets the new game state and performs any necessary transition logic.
     * @param {string} newState - The state to transition to ('MENU', 'DIALOGUE', 'PLAYING', 'GAME_OVER').
     */
    setState(newState) {
        if (this.currentState === newState) return;
        
        console.log(`Game state changing from ${this.currentState} to ${newState}`);
        this.currentState = newState;

        // You can add state-specific entry logic here if needed.
        // For example, detaching controls when entering GAME_OVER.
        if (newState === 'GAME_OVER' && this.game.playerController) {
            this.game.playerController.detach();
        }
    }

    /**
     * Returns the current game state.
     * @returns {string} The current state.
     */
    getState() {
        return this.currentState;
    }
}
