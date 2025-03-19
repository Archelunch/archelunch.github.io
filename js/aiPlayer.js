class AIPlayer extends Player {
    constructor(id, x, y, canvasWidth, canvasHeight) {
        super(id, x, y);
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Movement parameters
        this.isSlowFly = Math.random() < 0.3;
        this.speedMultiplier = this.isSlowFly ? 0.5 : 1.0;
        this.speedX = (Math.random() * 3.5 - 1.25) * this.speedMultiplier;
        this.speedY = (Math.random() * 3.5 - 1.25) * this.speedMultiplier;
        
        // Behavior timers
        this.directionChangeTimer = 0;
        this.directionChangeInterval = Math.random() * 2000 + 1000;
        this.crazyMode = false;
        this.crazyModeTimer = 0;
        this.crazyModeInterval = Math.random() * 12000 + 10000;
        
        // Appearance
        const flyTypes = ['🪰', '🦟', '🐝', '🦗', '🪳'];
        this.emoji = flyTypes[Math.floor(Math.random() * flyTypes.length)];
        this.size = 28 + Math.floor(Math.random() * 12);
        
        // AI players are NEVER local players
        this.isLocalPlayer = false;
    }

    updatePosition(deltaTime, centralButtonBounds) {
        if (!this.isAlive) return;

        // Update timers and behaviors
        this.updateTimers(deltaTime);
        
        // Calculate current speed multiplier
        const speedMultiplier = this.crazyMode ? 1.5 : 0.7;

        // Move the AI player
        this.x += this.speedX * speedMultiplier;
        this.y += this.speedY * speedMultiplier;
        
        // Handle random pauses
        this.handleRandomPause(deltaTime);
        
        // Update rotation
        this.rotation = Math.sin(Date.now() / 200) * (this.crazyMode ? 25 : 10);

        // Handle boundaries
        this.handleBoundaryCollision();

        // Avoid central button
        this.avoidCentralButton(centralButtonBounds);
    }
    
    updateTimers(deltaTime) {
        // Direction change timer
        this.directionChangeTimer += deltaTime;
        if (this.directionChangeTimer >= this.directionChangeInterval) {
            this.changeDirection();
            this.directionChangeTimer = 0;
        }
        
        // Crazy mode timer
        this.crazyModeTimer += deltaTime;
        if (this.crazyModeTimer >= this.crazyModeInterval) {
            this.crazyMode = !this.crazyMode;
            this.crazyModeTimer = this.crazyMode ? 0 : this.crazyModeInterval * 0.8;
        }
    }
    
    handleRandomPause(deltaTime) {
        // Occasionally pause movement (10% chance every 3 seconds)
        if (!this.crazyMode && Math.random() < 0.1 * (deltaTime / 3000)) {
            this.pauseMovement(500 + Math.random() * 1000);
        }
    }
    
    handleBoundaryCollision() {
        // X-axis boundary collision
        if (this.x < 0 || this.x > this.canvasWidth) {
            this.speedX *= -1.05; // Slightly increase speed on bounce
            this.speedX = Math.max(-5, Math.min(this.speedX, 5)); // Cap max speed
            this.x = Math.max(0, Math.min(this.x, this.canvasWidth));
            
            if (this.crazyMode) {
                this.speedY += (Math.random() * 2 - 1);
            }
        }
        
        // Y-axis boundary collision
        if (this.y < 0 || this.y > this.canvasHeight) {
            this.speedY *= -1.05;
            this.speedY = Math.max(-5, Math.min(this.speedY, 5));
            this.y = Math.max(0, Math.min(this.y, this.canvasHeight));
            
            if (this.crazyMode) {
                this.speedX += (Math.random() * 2 - 1);
            }
        }
    }

    pauseMovement(duration) {
        // Store original speeds
        const originalSpeedX = this.speedX;
        const originalSpeedY = this.speedY;
        
        // Set speeds to 0
        this.speedX = 0;
        this.speedY = 0;
        
        // Restore speeds after duration
        setTimeout(() => {
            if (this.isAlive) {
                this.speedX = originalSpeedX;
                this.speedY = originalSpeedY;
            }
        }, duration);
    }

    avoidCentralButton(buttonBounds) {
        const margin = this.crazyMode ? 40 : 20;
        const expandedBounds = {
            centerX: buttonBounds.centerX,
            centerY: buttonBounds.centerY,
            radius: buttonBounds.radius + margin
        };

        // Check if AI is near the button
        const dx = this.x - expandedBounds.centerX;
        const dy = this.y - expandedBounds.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < expandedBounds.radius) {
            // Set speed away from button
            const angle = Math.atan2(dy, dx);
            const escapeSpeed = this.crazyMode ? 3.5 : 2;
            
            this.speedX = Math.cos(angle) * escapeSpeed;
            this.speedY = Math.sin(angle) * escapeSpeed;
            
            // Add a bit of randomness to the escape direction
            if (this.crazyMode) {
                this.speedX += (Math.random() - 0.5) * 0.5;
                this.speedY += (Math.random() - 0.5) * 0.5;
            }
        }
    }

    changeDirection() {
        if (this.crazyMode) {
            // More dramatic direction changes in crazy mode
            this.speedX = (Math.random() * 5 - 2.5);
            this.speedY = (Math.random() * 5 - 2.5);
        } else {
            // Normal direction changes
            this.speedX = Math.random() * 2.5 - 1.25;
            this.speedY = Math.random() * 2.5 - 1.25;
        }
        
        // Apply slow fly modifier if applicable
        if (this.isSlowFly) {
            this.speedX *= 0.5;
            this.speedY *= 0.5;
        }
    }
    
    draw(ctx) {
        if (!this.isAlive) return;
        
        // Calculate the wobble effect for AI flies
        this.rotationAngle = Math.sin(Date.now() / 200) * (this.crazyMode ? 0.4 : 0.2);
        
        // Call the parent class's draw method for consistent drawing
        super.draw(ctx);
        
        // Add "CRAZY" indicator only for AI players in crazy mode
        if (this.crazyMode) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.font = '12px "Comic Sans MS", cursive, sans-serif';
            ctx.fillStyle = '#ff0000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('CRAZY!!!', 0, -this.radius * 1.5);
            ctx.restore();
        }
    }
}

class AIPlayerManager {
    constructor(canvasWidth, canvasHeight, centralButtonBounds) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.centralButtonBounds = centralButtonBounds;
        this.aiPlayers = [];
        this.lastUpdateTime = 0;
    }

    initialize(count = 5) {
        // Create AI players
        for (let i = 0; i < count; i++) {
            this.createAIPlayer();
        }
    }
    
    createAIPlayer() {
        // Generate random position that's not on the central button
        const position = this.getRandomValidPosition();
        
        // Create new AI player
        const id = `ai-${Math.random().toString(36).substring(2, 10)}`;
        const aiPlayer = new AIPlayer(id, position.x, position.y, this.canvasWidth, this.canvasHeight);
        this.aiPlayers.push(aiPlayer);
        
        return aiPlayer;
    }
    
    getRandomValidPosition() {
        const margin = 50;
        const buttonRadius = this.centralButtonBounds.radius + margin;
        
        let x, y, distance;
        
        // Keep generating positions until we find one that's not on the button
        do {
            x = margin + Math.random() * (this.canvasWidth - margin * 2);
            y = margin + Math.random() * (this.canvasHeight - margin * 2);
            
            const dx = x - this.centralButtonBounds.centerX;
            const dy = y - this.centralButtonBounds.centerY;
            distance = Math.sqrt(dx * dx + dy * dy);
        } while (distance < buttonRadius);
        
        return { x, y };
    }

    update(timestamp) {
        // Calculate delta time
        const deltaTime = this.lastUpdateTime ? timestamp - this.lastUpdateTime : 16;
        this.lastUpdateTime = timestamp;
        
        // Update all AI players
        for (const aiPlayer of this.aiPlayers) {
            if (aiPlayer.isAlive) {
                aiPlayer.updatePosition(deltaTime, this.centralButtonBounds);
            }
        }
        
        // Respawn dead AI players with low probability
        this.respawnDeadAI();
    }

    respawnDeadAI() {
        const respawnChance = 0.005; // 0.5% chance per frame
        
        for (const aiPlayer of this.aiPlayers) {
            if (!aiPlayer.isAlive && Math.random() < respawnChance) {
                const position = this.getRandomValidPosition();
                aiPlayer.respawn(position.x, position.y);
            }
        }
    }

    draw(ctx) {
        // Draw all AI players
        for (const aiPlayer of this.aiPlayers) {
            aiPlayer.draw(ctx);
        }
    }

    getAIPlayerAtPoint(x, y) {
        // Find the first AI player that contains the given point
        return this.aiPlayers.find(aiPlayer => 
            aiPlayer.isAlive && aiPlayer.isPointInside(x, y)
        );
    }
} 