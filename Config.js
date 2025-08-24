
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// =================================================================
// == GAME CONFIGURATION ==
// =================================================================
// This file centralizes all adjustable game parameters for easy tweaking.

export const CONFIG = {
    GAME: {
        WIDTH: 1000,
        HEIGHT: 600,
        WORLD_WIDTH_MULTIPLIER: 6,
        GRAVITY: 1,
    },
    PLAYER: {
        WIDTH: 128,
        HEIGHT: 128,
        HITBOX_WIDTH: 40,
        JUMP_STRENGTH: -22,
        SPEED: 4,
        SHOOT_COOLDOWN: 500,
        ATTACK_SLOWDOWN_MULTIPLIER: 0.4,
    },
    ENEMY: {
        WIDTH: 128,
        HEIGHT: 128,
        HITBOX_WIDTH: 40,
        SPEED: 1,
        PATROL_RANGE: 150,
        HEALTH: 100,
        DEATH_SINK_DURATION: 500,
        DEATH_SINK_DEPTH: 40,
    },
    BULLET: {
        WIDTH: 15,
        HEIGHT: 5,
        SPEED: 15,
        DAMAGE: 20,
        MAX_DISTANCE: 700,
    },
    MELEE: {
        DAMAGE: 25,
        RANGE: 80,
    },
    PARTICLES: {
        BLOOD_COUNT: 15,
        SMOKE_COUNT: 70,
        DUST_COUNT: 3,
        LANDING_DUST_COUNT: 8,
        RUNNING_DUST_COUNT: 2,
    },
    UI: {
        DIALOGUE_TYPING_SPEED: 50,
        DIALOGUE_END_WAIT: 2000,
    },
    CHEST: {
        INTERACTION_RANGE: 200,
    },
    RESUME_SCROLL: {
        ANIMATION_DURATION: 800,
    },
    AUDIO: {
        MUSIC_VOLUME: 0.3, // For background music and ambient sounds
        SFX_VOLUME: 0.3,   // For player/enemy actions, UI sounds, etc.
    },
};