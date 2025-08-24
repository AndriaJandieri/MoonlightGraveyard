

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Camera } from './Camera.js';
import { Environment } from './Environment.js';
import { AudioManager } from './AudioManager.js';
import { PlayerController } from './PlayerController.js';
import { AUDIO_DATA } from './AudioData.js';
import { EntityManager } from './EntityManager.js';
import { UIManager } from './UIManager.js';
import { CollisionManager } from './CollisionManager.js';
import { GameStateManager } from './GameStateManager.js';
import { CONFIG } from './Config.js';

/**
 * The main game class to orchestrate everything.
 */
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.gameContainer = document.getElementById('game-container');
        this.width = CONFIG.GAME.WIDTH;
        this.height = CONFIG.GAME.HEIGHT;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.worldWidth = this.width * CONFIG.GAME.WORLD_WIDTH_MULTIPLIER;
        
        // --- Fixed Timestep Game Loop Properties ---
        this.lastTime = 0;
        this.accumulator = 0;
        this.timestep = 1000 / 60; // Run the simulation at 60 updates per second.
        
        this.config = CONFIG; // Make config accessible to managers

        // --- Responsiveness Properties ---
        this.scale = 1;

        // --- Initialize Core Systems & Managers ---
        this.gameStateManager = new GameStateManager(this);
        this.camera = new Camera(this.width, this.height, this.worldWidth);
        this.audioManager = new AudioManager(AUDIO_DATA);
        this.environment = new Environment(this);
        this.entityManager = new EntityManager(this);
        this.uiManager = new UIManager(this);
        this.collisionManager = new CollisionManager(this);
        this.playerController = null; // Will be created after player is added
        
        this.animate = this.animate.bind(this);
        this.resize = this.resize.bind(this);
    }
    
    /**
     * Resizes and scales the game container to fit the window.
     */
    resize() {
        // Calculate the best scale to fit the game in the window
        this.scale = Math.min(window.innerWidth / this.width, window.innerHeight / this.height);
        
        // Apply the scale transform to the game container, which will be centered by CSS flexbox
        if (this.gameContainer) {
            this.gameContainer.style.transform = `scale(${this.scale})`;
        }
    }

    /**
     * Initializes the game by loading assets and setting up game objects.
     */
    async init() {
        // Setup resize listener
        window.addEventListener('resize', this.resize);
        this.resize(); // Initial resize

        try {
            await this.environment.loadAssets();
            await this.entityManager.loadAssets();
            console.log("All critical visual assets have been preloaded.");
        } catch (error) {
            console.error("A critical asset failed to load, cannot start the game.", error);
            this.uiManager.showLoadError();
            return;
        }

        // --- Create Game World ---
        this.entityManager.createPlayer();
        this.entityManager.createEnemies();
        this.entityManager.createTreasureChest();
        
        // Player controller needs a reference to the created player
        this.playerController = new PlayerController(this.entityManager.player, this);

        this.uiManager.init();
        this.gameStateManager.setState('MENU');
        
        // Start the game loop
        this.animate(0);
    }
    
    /**
     * The fixed-step update function. This contains all game logic, physics, and state changes.
     * It will be called a fixed number of times per second.
     * @param {number} timestep - The fixed amount of time to advance the game simulation.
     */
    update(timestep) {
        const state = this.gameStateManager.getState();
        const isPlaying = state === 'PLAYING';
        const isPaused = state === 'MENU';

        // 1. Handle Input (updates player velocity, etc.)
        if (isPlaying) {
            this.playerController.update(timestep);
        }

        // 2. Update Game Logic/Physics
        if (!isPaused) {
            this.entityManager.update(timestep, isPlaying);
            if (isPlaying) {
                this.collisionManager.checkAllCollisions();
            }
        }
        
        // 3. Update Camera and Environment state
        if (!isPaused && this.entityManager.player) {
            this.camera.update(this.entityManager.player);
            this.environment.update(timestep);
        }

        // 4. Update UI state (dialogue typing, etc.)
        this.uiManager.update(timestep);
    }

    /**
     * The main game loop, driven by requestAnimationFrame. This loop handles the timing
     * and calls the update and draw functions appropriately.
     * @param {number} timestamp - The current time provided by requestAnimationFrame.
     */
    animate(timestamp) {
        // Calculate the time elapsed since the last frame.
        // We cap the frame time to prevent a "spiral of death" if the game hangs or is tabbed out.
        const frameTime = Math.min(timestamp - this.lastTime, 250);
        this.lastTime = timestamp;
        
        // Add the elapsed time to our accumulator. The accumulator stores unprocessed time.
        this.accumulator += frameTime;
        
        // The fixed-step loop.
        // It runs the update logic a fixed number of times to 'catch up' with the accumulated time.
        // This ensures the game simulation advances at a consistent rate.
        while (this.accumulator >= this.timestep) {
            this.update(this.timestep);
            this.accumulator -= this.timestep;
        }
        
        // Calculate the interpolation factor. This is how far we are into the *next* frame.
        // It's a value between 0 and 1, used to smooth rendering between fixed updates.
        const interpolation = this.accumulator / this.timestep;

        // 5. Render the current state with interpolation.
        this.draw(interpolation);
        
        requestAnimationFrame(this.animate);
    }


    /**
     * Draws all game objects and UI elements.
     * @param {number} interpolation - The alpha value (0 to 1) to blend between the previous
     * and current state for smooth rendering.
     */
    draw(interpolation) {
        this.context.clearRect(0, 0, this.width, this.height);
        
        // Get the camera's interpolated position for this specific render frame.
        const renderCameraX = this.camera.getInterpolatedX(interpolation);

        // Layer 1: Parallax Background - Pass a temporary object with the interpolated position.
        this.environment.drawBackground(this.context, { x: renderCameraX, y: this.camera.y });
        
        this.context.save();
        this.context.translate(-renderCameraX, -this.camera.y);

        // Layer 2: Static Environment (ground, decorations)
        // Culling can use the logical camera position, so we pass the main camera object.
        this.environment.drawForeground(this.context, this.camera);
        // Layer 3: Background Environment Effects (blinking eyes) - drawn behind characters
        this.environment.drawEyes(this.context, this.camera);
        // Layer 4: Dynamic Game Objects (player, enemies, particles, etc.) - drawn on top of eyes
        // These entities need the interpolation factor to draw smoothly.
        this.entityManager.draw(this.context, this.camera, interpolation);
        
        this.context.restore();

        // Layer 5: Canvas-based UI (dialogue, game over)
        this.uiManager.drawCanvasUI(this.context);
    }
}

window.addEventListener('load', function() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error('A required canvas element was not found in the DOM!');
        return;
    }
    const game = new Game(canvas);
    game.init();
});
