/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { TreasureChest } from './TreasureChest.js';
import { ResumeScroll } from './ResumeScroll.js';
import { Bullet } from './Bullet.js';
import { Particle } from './Particle.js';
import { SmokeParticle } from './SmokeParticle.js';
import { DustParticle } from './DustParticle.js';
import { FootstepParticle } from './FootstepParticle.js';
import { PLAYER_ANIMATIONS } from './PlayerAnimationData.js';
import { RESUME_SCROLL_DATA } from './ResumeScrollData.js';
import { CONFIG } from './Config.js';
import { LEVEL_DATA } from './EnvironmentConfig.js';

/**
 * Manages all game entities (player, enemies, particles, etc.).
 * Handles their creation, updates, drawing, and removal.
 */
export class EntityManager {
    constructor(game) {
        this.game = game;
        this.player = null;
        this.enemies = [];
        this.treasureChests = [];
        this.resumeScrolls = [];
        this.bullets = [];
        this.particles = [];
        this.smokeParticles = [];
        this.dustParticles = [];
        this.footstepParticles = [];
        
        this.assets = {};
        
        this.entityArrays = [
            this.enemies, this.treasureChests, this.resumeScrolls, this.bullets,
            this.particles, this.smokeParticles, this.dustParticles, this.footstepParticles
        ];
    }
    
    /**
     * Loads assets required by entities managed here.
     */
    async loadAssets() {
        const img = new Image();
        img.src = RESUME_SCROLL_DATA.url;
        await new Promise(resolve => img.onload = resolve);
        this.assets.resumeScroll = img;
    }

    /**
     * Creates the player instance.
     */
    createPlayer() {
        this.player = new Player(this.game, PLAYER_ANIMATIONS);
    }
    
    /**
     * Creates all enemy instances for the level from the config file.
     */
    createEnemies() {
        for (const enemyData of LEVEL_DATA.enemies) {
            this.enemies.push(new Enemy(this.game, enemyData.x, enemyData.y));
        }
    }

    /**
     * Creates the treasure chest instance.
     */
    createTreasureChest() {
        this.treasureChests.push(new TreasureChest(this.game, 5500));
    }

    /**
     * Spawns a resume scroll.
     * @param {number} x The x-coordinate.
     * @param {number} y The y-coordinate.
     */
    spawnResumeScroll(x, y) {
        const scroll = new ResumeScroll(this.game, x, y, this.assets.resumeScroll);
        this.resumeScrolls.push(scroll);
    }
    
    /**
     * Adds a bullet to the game world.
     * @param {number} x The x-coordinate.
     * @param {number} y The y-coordinate.
     * @param {string} direction 'left' or 'right'.
     */
    addBullet(x, y, direction) {
        this.bullets.push(new Bullet(this.game, x, y, direction));
    }
    
    /**
     * Spawns a cluster of blood particles.
     * @param {number} x The x-coordinate.
     * @param {number} y The y-coordinate.
     */
    createBloodEffect(x, y) {
        for (let i = 0; i < CONFIG.PARTICLES.BLOOD_COUNT; i++) {
            this.particles.push(new Particle(this.game, x, y));
        }
    }
    
    /**
     * Spawns a cluster of smoke particles.
     * @param {number} x The x-coordinate.
     * @param {number} y The y-coordinate.
     */
    createSmokeEffect(x, y) {
        for (let i = 0; i < CONFIG.PARTICLES.SMOKE_COUNT; i++) {
            this.smokeParticles.push(new SmokeParticle(this.game, x, y));
        }
    }

    /**
     * Spawns a cluster of dust particles.
     * @param {number} x The x-coordinate.
     * @param {number} y The y-coordinate.
     * @param {string} direction 'left' or 'right'.
     */
    createDustEffect(x, y, direction) {
        for (let i = 0; i < CONFIG.PARTICLES.DUST_COUNT; i++) {
            this.dustParticles.push(new DustParticle(this.game, x, y, direction));
        }
    }

    /**
     * Spawns a cluster of footstep particles.
     * @param {number} x The x-coordinate.
     * @param {number} y The y-coordinate.
     * @param {number} count The number of particles.
     * @param {string|null} direction Optional direction for running.
     */
    createFootstepEffect(x, y, count, direction = null) {
        for (let i = 0; i < count; i++) {
            this.footstepParticles.push(new FootstepParticle(this.game, x, y, direction));
        }
    }

    /**
     * Removes entities marked for deletion from an array.
     * @param {Array<Object>} array The array to clean up.
     */
    cleanupArray(array) {
        for (let i = array.length - 1; i >= 0; i--) {
            if (array[i].markedForDeletion) {
                array.splice(i, 1);
            }
        }
    }

    /**
     * Updates all managed entities.
     * @param {number} deltaTime Time since the last frame.
     * @param {boolean} isPlaying Whether the game is in the 'PLAYING' state.
     */
    update(deltaTime, isPlaying) {
        if (this.player) this.player.update(deltaTime, isPlaying);
        
        this.entityArrays.forEach(array => {
            array.forEach(entity => entity.update(deltaTime, isPlaying));
            this.cleanupArray(array);
        });
    }

    /**
     * Draws all managed entities, culling those that are off-screen.
     * @param {CanvasRenderingContext2D} context The drawing context.
     * @param {Camera} camera The game camera.
     * @param {number} interpolation The factor for smoothing rendering.
     */
    draw(context, camera, interpolation) {
        const cameraLeft = camera.x;
        const cameraRight = camera.x + camera.gameWidth;
        
        const drawIfVisible = (entity) => {
            // Culling uses the logical position (entity.x)
            if (entity.x + entity.width >= cameraLeft && entity.x <= cameraRight) {
                // Pass the interpolation factor to each entity's draw method.
                entity.draw(context, interpolation);
            }
        };
        
        this.entityArrays.forEach(array => array.forEach(drawIfVisible));
        
        if (this.player) {
            // Player is almost always on screen, draw it with interpolation.
            this.player.draw(context, interpolation);
        }
    }
}