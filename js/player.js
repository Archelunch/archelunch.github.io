class Player {
    constructor(id, x, y, isLocalPlayer = false, customInfo = {}) {
        // Player unique ID - used for server identification
        this.id = id;
        
        // Position
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        
        // Player state
        this.isAlive = true;
        this.isLocalPlayer = isLocalPlayer;
        this.score = 0;
        this.deathTime = 0; // Track when player died
        this.isCorpseVisible = true; // Track if corpse should be visible
        
        // Custom player info
        this.name = customInfo.name || `Player_${id.substring(0, 6)}`;
        this.emoji = customInfo.emoji || "🪰";
        this.deathPhrase = customInfo.deathPhrase || "SPLAT!";
        
        // Appearance and animation properties
        this.radius = 20;
        this.borderWidth = 2;
        this.pulsePhase = Math.random() * Math.PI * 2; // Random starting phase
        this.pulseSpeed = 0.05;
        this.pulseAmount = 0.1;
        this.rotationAngle = 0;
        this.rotationSpeed = isLocalPlayer ? 0.01 : 0.03;
        this.movementSmoothing = isLocalPlayer ? 0.5 : 0.1; // Higher = more responsive
        
        // Default colors (gradient)
        this.colors = isLocalPlayer ? 
            ['#4834d4', '#686de0'] : // Local player is purple
            ['#eb4d4b', '#ff7979']; // Other players are red
    }
    
    update(targetX, targetY) {
        // Update target position
        this.targetX = targetX;
        this.targetY = targetY;
        
        // Handle remote player teleport for large movements
        if (!this.isLocalPlayer) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 100) {
                // For large movements, jump immediately to target
                this.x = this.targetX;
                this.y = this.targetY;
                return;
            }
            
            // Make remote players move faster to catch up with server updates
            this.movementSmoothing = 0.25;
        }
        
        // Apply movement with smoothing
        this.x += (this.targetX - this.x) * this.movementSmoothing;
        this.y += (this.targetY - this.y) * this.movementSmoothing;
        
        // Update animations
        this.pulsePhase += this.pulseSpeed;
        this.rotationAngle += this.rotationSpeed;
    }
    
    draw(ctx) {
        // Don't draw if player is dead and corpse should be hidden
        if (!this.isAlive && !this.isCorpseVisible) return;
        
        // Save context for transformations
        ctx.save();
        
        // Move to player position
        ctx.translate(this.x, this.y);
        
        // Apply rotation
        ctx.rotate(this.rotationAngle);
        
        // Calculate pulse size
        const pulseScale = 1 + Math.sin(this.pulsePhase) * this.pulseAmount;
        const scaledRadius = this.radius * pulseScale;
        
        // If player is dead, draw as corpse
        if (!this.isAlive) {
            this.drawCorpse(ctx, scaledRadius);
        } else {
            this.drawShadow(ctx, scaledRadius);
            this.drawBody(ctx, scaledRadius);
            this.drawEmoji(ctx, scaledRadius);
            this.drawName(ctx, scaledRadius);
        }
        
        // Restore context
        ctx.restore();
    }
    
    drawShadow(ctx, radius) {
        ctx.beginPath();
        ctx.arc(3, 3, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fill();
    }
    
    drawBody(ctx, radius) {
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        
        // Create gradient for player
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, this.colors[1]);
        gradient.addColorStop(0.7, this.colors[0]);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw border for local player
        if (this.isLocalPlayer) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = this.borderWidth;
            ctx.stroke();
        }
    }
    
    drawEmoji(ctx, radius) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${radius * 1.2}px Arial`;
        ctx.fillText(this.emoji, 0, 0);
    }
    
    drawName(ctx, radius) {
        ctx.font = '12px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText(this.name, 0, radius + 15);
    }
    
    drawCorpse(ctx, radius) {
        // Draw a "dead" version of the fly
        // Draw squished shadow
        ctx.beginPath();
        ctx.ellipse(3, 3, radius * 1.2, radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fill();
        
        // Draw squished body
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 1.2, radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(150, 150, 150, 0.7)';
        ctx.fill();
        
        // Draw X eyes
        ctx.font = `${radius * 0.8}px Arial`;
        ctx.fillStyle = '#ff0000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☠️', 0, 0);
    }
    
    isPointInside(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        const distanceSquared = dx * dx + dy * dy;
        const hitRadius = this.radius * 1.5; // Slightly larger than visual radius for easier clicks
        return distanceSquared <= hitRadius * hitRadius;
    }
    
    kill() {
        this.isAlive = false;
        this.deathTime = Date.now();
        this.isCorpseVisible = true;
    }
    
    removeCorpse() {
        this.isCorpseVisible = false;
    }
    
    respawn(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.isAlive = true;
        this.isCorpseVisible = true;
        this.deathTime = 0;
    }
    
    increaseScore() {
        this.score++;
        return this.score;
    }
    
    getDeathPhrase() {
        return this.deathPhrase;
    }
} 