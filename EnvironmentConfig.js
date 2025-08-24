/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// =================================================================
// == LEVEL DESIGN CONFIGURATION ==
// =================================================================
// This file centralizes all data for level layout, including platform
// and enemy placements. Edit the coordinates here to change the level.

export const LEVEL_DATA = {
    // Each platform is a standard size (left, one middle, right tile).
    // Just specify the top-left corner coordinates.
    platforms: [
        { x: 750,  y: 300 },
        //{ x: 1000, y: 380 },
        //{ x: 1250, y: 450 },
        { x: 1600, y: 350 },
        { x: 2900, y: 300 },
        { x: 3400, y: 150 },
        //{ x: 3500, y: 380 },
        //{ x: 3550,  y: 450 }, // 750 + 2800
        //{ x: 3800, y: 380 }, // 1000 + 2800
        { x: 4050, y: 200 }, // 1250 + 2800
        //{ x: 4400, y: 350 }, // 1600 + 2800 
        { x: 5500, y: 250 },       
    ],

    // Specify the spawn coordinates for each enemy.
    // The y-coordinate is typically 0, as they will fall to the ground.
    enemies: [
        { x: 1100, y: 0 },
        { x: 2200, y: 0 },
        { x: 2700, y: 0 },
        { x: 3900, y: 0 }, // 900 + 3000
        { x: 4800, y: 0 }, // 1800 + 3000
        { x: 5700, y: 0 }, // 2700 + 3000
    ],
    
    // All static decorations. 'assetKey' must match a key in EnvironmentData.js.
    // 'index' is optional for assets with multiple images (e.g., tombstones).
    // 'scale' is optional, defaults to 1.
    decorations: [
        { assetKey: 'tree', x: 220, scale: 1.0 },
        { assetKey: 'crate', x: 400, scale: 0.3 },
        { assetKey: 'tombstones', x: 550, scale: 0.45, index: 0 },
        { assetKey: 'sign', x: 850, scale: 0.3, index: 0 },
        { assetKey: 'bushes', x: 980, scale: 0.5, index: 1 },
        { assetKey: 'skeleton', x: 1250, scale: 0.3 },
        { assetKey: 'deadBush', x: 1450, scale: 0.3 },
        { assetKey: 'crate', x: 1750, scale: 0.3 },
        { assetKey: 'skeleton', x: 1800, scale: 0.3 },
        { assetKey: 'tombstones', x: 2000, scale: 0.45, index: 1 },
        { assetKey: 'arrowSign', x: 2250, scale: 0.3 },
        { assetKey: 'bushes', x: 2450, scale: 0.3, index: 0 },
        { assetKey: 'deadBush', x: 2600, scale: 0.3 },
        { assetKey: 'tree', x: 2750, scale: 0.7 },
        
        // Repeated section for world extension
        { assetKey: 'tree', x: 3220, scale: 1.0 },
        { assetKey: 'tombstones', x: 3550, scale: 0.45, index: 2 },
        { assetKey: 'sign', x: 3850, scale: 0.3, index: 0 },
        { assetKey: 'bushes', x: 3980, scale: 0.5, index: 1 },
        { assetKey: 'skeleton', x: 4250, scale: 0.3 },
        { assetKey: 'deadBush', x: 4450, scale: 0.3 },
        { assetKey: 'crate', x: 4750, scale: 0.3 },
        { assetKey: 'tombstones', x: 4500, scale: 0.45, index: 0 },
        { assetKey: 'arrowSign', x: 5250, scale: 0.3 },
        { assetKey: 'bushes', x: 5000, scale: 0.4, index: 0 },
        { assetKey: 'tree', x: 5750, scale: 0.7 },
    ]
};