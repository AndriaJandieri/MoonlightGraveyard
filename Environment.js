

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { ENVIRONMENT_DATA } from './EnvironmentData.js';
import { BlinkingEyes } from './BlinkingEyes.js';
import { LEVEL_DATA } from './EnvironmentConfig.js';

/**
 * Manages loading and drawing all environment assets, including backgrounds and tile-based terrain.
 */
export class Environment {
    constructor(game) {
        this.game = game;
        this.gameWidth = game.width;
        this.gameHeight = game.height;
        this.worldWidth = game.worldWidth;
        this.assets = {};
        this.isLoaded = false;
        this.groundLevel = 0;
        
        // This will hold collision data, built from LEVEL_DATA.
        this.platforms = [];
        this.blinkingEyes = [];
    }

    update(timestep) {
        this.blinkingEyes.forEach(eyes => eyes.update(timestep));
    }

    async loadAssets() {
        // This creates an array of promises. Each promise in the array represents the complete
        // loading process for one category of assets (e.g., 'groundTiles', 'leviTiles').
        const assetCategoryPromises = Object.entries(ENVIRONMENT_DATA).map(async ([key, urls]) => {
            // For each category, create another array of promises, one for each image URL.
            const imageLoadPromises = urls.map(url => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(`Failed to load image: ${url}`);
                    img.src = url;
                });
            });
            
            // 'await Promise.all' will wait for all images in this category to load.
            // Crucially, it preserves the original order of the URLs, solving the issue.
            const loadedImages = await Promise.all(imageLoadPromises);
            
            // Assign the correctly ordered array of images to our assets object.
            this.assets[key] = loadedImages;
        });

        try {
            // 'await Promise.all' on the category promises waits for all categories to be fully loaded.
            await Promise.all(assetCategoryPromises);
            
            this.isLoaded = true;
            this.calculateDimensions();
            this.createBlinkingEyes();
            console.log("All environment assets preloaded successfully.");
        } catch (error) {
            console.error("Error preloading environment assets:", error);
            this.isLoaded = false;
            // Propagate the error so the main Game class can catch it and display an error message.
            throw error;
        }
    }

    createBlinkingEyes() {
        // Read decoration data from the centralized config file
        LEVEL_DATA.decorations.forEach(deco => {
            if (deco.assetKey === 'bushes') {
                const image = this.assets.bushes?.[deco.index || 0];
                if (image) {
                    const scale = deco.scale || 1;
                    const bushWidth = image.width * scale;
                    const bushHeight = image.height * scale;
                    const bushY = this.groundLevel - bushHeight;
                    const eyeX = deco.x + (Math.random() * 0.4 + 0.3) * bushWidth;
                    const eyeY = bushY + (Math.random() * 0.3 + 0.4) * bushHeight;
                    this.blinkingEyes.push(new BlinkingEyes(this.game, eyeX, eyeY));
                }
            }
        });
    }

    calculateDimensions() {
        this.groundLevel = this.gameHeight * 0.875;
        const [leftTile, midTile, rightTile] = this.assets.leviTiles || [];
        if (!leftTile || !midTile || !rightTile) return;

        // All platforms are now a standard size of one left, one middle, and one right tile.
        const standardPlatformWidth = leftTile.width + midTile.width + rightTile.width;
        
        this.platforms = []; // Clear and rebuild collision data
        for (const layout of LEVEL_DATA.platforms) {
            this.platforms.push({ 
                x: layout.x, 
                y: layout.y, 
                width: standardPlatformWidth, 
                height: midTile.height 
            });
        }
    }

    drawBackground(context, camera) {
        if (!this.isLoaded) return;
        const bgImage = this.assets.background?.[0];
        if (bgImage) {
            const parallaxX = camera.x * 0.03;
            const bgWidth = bgImage.naturalWidth || this.gameWidth;
            // Removed Math.floor to allow for smooth, sub-pixel rendering of the background.
            const startX = -(parallaxX % bgWidth);
            
            // Use a small overlap when drawing repeating backgrounds to prevent seams.
            const overlap = 2;

            // Draw the first instance of the background.
            context.drawImage(bgImage, startX, 0, bgWidth, this.gameHeight);
            
            // Draw the second instance that follows it, overlapping slightly.
            context.drawImage(bgImage, startX + bgWidth - overlap, 0, bgWidth, this.gameHeight);

            // The fog effect remains the same, drawn over the entire canvas
            const fogGradient = context.createLinearGradient(0, this.gameHeight, 0, this.gameHeight - 350);
            fogGradient.addColorStop(0, 'rgba(26, 26, 26, 0.8)');
            fogGradient.addColorStop(1, 'rgba(26, 26, 26, 0)');
            context.fillStyle = fogGradient;
            context.fillRect(0, 0, this.gameWidth, this.gameHeight);
        }
    }

    drawForeground(context, camera) {
        if (!this.isLoaded) return;
        const cameraLeft = camera.x;
        const cameraRight = camera.x + this.gameWidth;
        const overlap = 1; // The amount in pixels to overlap tiles to prevent seams.

        const groundTile = this.assets.groundTiles?.[0];
        if (groundTile) {
            const tileWidth = groundTile.width;
            // The effective width is the tile's width minus the overlap.
            const effectiveTileWidth = tileWidth - overlap;
            const startTileIndex = Math.floor(cameraLeft / effectiveTileWidth);
            const endTileIndex = Math.ceil(cameraRight / effectiveTileWidth);

            for (let i = startTileIndex; i < endTileIndex; i++) {
                // Position each tile based on the effective width.
                const xPos = i * effectiveTileWidth;
                if (xPos < this.worldWidth) {
                    // Draw the tile at its full original width, which creates the overlap.
                    context.drawImage(groundTile, xPos, this.groundLevel);
                }
            }
        }
        
        // Draw Platforms
        const [leftTile, midTile, rightTile] = this.assets.leviTiles || [];
        if (leftTile && midTile && rightTile) {
            const standardPlatformWidth = leftTile.width + midTile.width + rightTile.width;
            for (const platform of LEVEL_DATA.platforms) {
                // Use original width for culling to be safe
                if (platform.x + standardPlatformWidth >= cameraLeft && platform.x <= cameraRight) {
                    let currentX = platform.x;
                    // Draw left tile
                    context.drawImage(leftTile, currentX, platform.y);
                    // Position the next tile to overlap with this one
                    currentX += leftTile.width - overlap;

                    // Draw ONE middle tile
                    context.drawImage(midTile, currentX, platform.y);
                    // Position the next tile to overlap
                    currentX += midTile.width - overlap;

                    // Draw right tile
                    context.drawImage(rightTile, currentX, platform.y);
                }
            }
        }

        // Draw Decorations from the centralized config file
        for(const decoration of LEVEL_DATA.decorations) {
            const image = this.assets[decoration.assetKey]?.[decoration.index || 0];
            const scale = decoration.scale || 1;
            if (image) {
                const scaledWidth = image.width * scale;
                if (decoration.x + scaledWidth >= cameraLeft && decoration.x <= cameraRight) {
                    const yPos = this.groundLevel - (image.height * scale);
                    context.drawImage(image, decoration.x, yPos, scaledWidth, image.height * scale);
                }
            }
        }
    }

    drawEyes(context, camera) {
        const cameraLeft = camera.x;
        const cameraRight = camera.x + this.gameWidth;

        this.blinkingEyes.forEach(eyes => {
            if (eyes.x > cameraLeft && eyes.x < cameraRight) {
                eyes.draw(context);
            }
        });
    }
}