class DeathEffects {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.activeEffects = [];
        this.deadPlayerEffects = new Map(); // Track dead player animations by ID
        
        // Funny death phrases
        this.deathPhrases = [
            "SPLAT!",
            "Fly no more!",
            "Buzz-ted!",
            "Fly heaven awaits...",
            "Fly-nally got me!",
            "I'm ex-TERMIN-ated!",
            "That stings!",
            "Swatted!",
            "Bug off!",
            "Fly's up!",
            "What a way to go...",
            "I've been fly-leted!",
            "No more buzzing around!",
            "That really bugs me!",
            "Windshield effect!",
            "Insect-icide!",
            "My compound eyes!",
            "Fly me to the moon...",
            "Fly-nal destination!",
            "Bugzinga!",
            "I'm squashed!"
        ];
        
        // Silly splat sounds 
        this.splatSounds = ['splat1.mp3', 'splat2.mp3', 'splat3.mp3'];
    }
    
    addDeathEffect(x, y, color, emoji, customPhrase = null) {
        // Create a death effect with animation and speech bubble
        const phrase = customPhrase || this.deathPhrases[Math.floor(Math.random() * this.deathPhrases.length)];
        
        const effect = {
            x: x,
            y: y,
            emoji: emoji,
            color: color,
            phrase: phrase,
            age: 0,
            maxAge: 1500, // Effect lasts 1.5 seconds
            particles: this.generateDeathParticles(x, y, color),
            speechBubble: {
                x: x + 20,
                y: y - 30,
                width: 0, // Will be calculated based on text
                height: 0,
                phrase: phrase
            }
        };
        
        // Measure text for speech bubble
        this.ctx.font = '18px "Comic Sans MS", cursive, sans-serif';
        const metrics = this.ctx.measureText(phrase);
        effect.speechBubble.width = metrics.width + 20;
        effect.speechBubble.height = 40;
        
        this.activeEffects.push(effect);
        return effect;
    }
    
    // New method to create a player death animation that will track the player
    addPlayerDeathAnimation(player) {
        if (!player) return;
        
        // Create a specialized death effect for the player
        const deathEffect = {
            playerId: player.id,
            x: player.x,
            y: player.y,
            emoji: player.emoji,
            originalEmoji: player.emoji, // Store original emoji for reference
            colors: player.colors.slice(), // Clone the player's colors
            phrase: player.deathPhrase || "SPLAT!",
            name: player.name,
            stage: 0, // Animation stage: 0=initial, 1=splat, 2=ghost, 3=fade
            age: 0,
            maxAge: 2000, // Total animation length
            stageTime: 0,
            stageDurations: [300, 700, 1000], // Durations for each stage
            splatEmojis: ["💥", "💀", "🩸", "💢", "⚰️"], // Fun splat emojis
            ghostEmoji: "👻", // Ghost emoji for final stage
            deathAngle: Math.random() * 360, // Random angle for death animation
            scale: 1.0,
            opacity: 1.0,
            speechBubble: {
                x: player.x + 30,
                y: player.y - 40,
                width: 0, // Will be calculated
                height: 0,
                phrase: player.deathPhrase || "SPLAT!"
            },
            particles: this.generateDeathParticles(player.x, player.y, player.colors[0]),
            // Add more splatter particles with different behaviors
            splatter: this.generateSplatterParticles(player.x, player.y, player.colors[0]),
            // X marks the spot where they died
            deathMark: {
                x: player.x,
                y: player.y,
                size: 30,
                opacity: 0.7
            }
        };
        
        // Measure text for speech bubble
        this.ctx.font = '18px "Comic Sans MS", cursive, sans-serif';
        const metrics = this.ctx.measureText(deathEffect.phrase);
        deathEffect.speechBubble.width = metrics.width + 20;
        deathEffect.speechBubble.height = 40;
        
        // Store the death effect with player ID as key
        this.deadPlayerEffects.set(player.id, deathEffect);
        
        return deathEffect;
    }
    
    generateDeathParticles(x, y, color) {
        const particles = [];
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 3;
            
            particles.push({
                x: x,
                y: y,
                size: Math.random() * 10 + 5,
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                color: color,
                opacity: 1,
                gravity: 0.15,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 15
            });
        }
        
        return particles;
    }
    
    // New method for generating splatter particles that stick to screen
    generateSplatterParticles(x, y, color) {
        const particles = [];
        const particleCount = 12;
        
        // Generate some splatter particles that will stick to the "screen"
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 40 + 20;
            const size = Math.random() * 15 + 5;
            
            // Create random blob shapes for splatter
            const blobPoints = [];
            const pointCount = Math.floor(Math.random() * 3) + 5;
            const baseRadius = size / 2;
            
            for (let j = 0; j < pointCount; j++) {
                const pointAngle = (j / pointCount) * Math.PI * 2;
                const radius = baseRadius * (0.7 + Math.random() * 0.6);
                blobPoints.push({
                    x: Math.cos(pointAngle) * radius,
                    y: Math.sin(pointAngle) * radius
                });
            }
            
            particles.push({
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                size: size,
                blobPoints: blobPoints,
                color: this.randomizeColor(color),
                opacity: 0.9,
                fadeRate: 0.0002, // Slow fade
                rotation: Math.random() * 360
            });
        }
        
        return particles;
    }
    
    randomizeColor(baseColor) {
        // Add some variation to the color for more realistic splatter
        // This expects a hex color like '#ff0000'
        if (baseColor.startsWith('#')) {
            // Convert hex to RGB
            let r = parseInt(baseColor.substr(1, 2), 16);
            let g = parseInt(baseColor.substr(3, 2), 16);
            let b = parseInt(baseColor.substr(5, 2), 16);
            
            // Add some random variation
            r = Math.min(255, Math.max(0, r + (Math.random() * 40 - 20)));
            g = Math.min(255, Math.max(0, g + (Math.random() * 40 - 20)));
            b = Math.min(255, Math.max(0, b + (Math.random() * 40 - 20)));
            
            // Convert back to hex
            return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
        }
        
        return baseColor; // Return original if not a hex color
    }
    
    update(deltaTime) {
        // Update all active death effects
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            
            // Update effect age
            effect.age += deltaTime;
            if (effect.age >= effect.maxAge) {
                this.activeEffects.splice(i, 1);
                continue;
            }
            
            // Update particles
            for (const particle of effect.particles) {
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                particle.speedY += particle.gravity;
                particle.opacity = 1 - (effect.age / effect.maxAge);
                particle.rotation += particle.rotationSpeed;
            }
        }
        
        // Update player death animations
        for (const [playerId, effect] of this.deadPlayerEffects.entries()) {
            // Update effect age and stage
            effect.age += deltaTime;
            effect.stageTime += deltaTime;
            
            // Update current stage based on age
            if (effect.stage < 3) { // We have 3 stages (0, 1, 2)
                if (effect.stageTime > effect.stageDurations[effect.stage]) {
                    effect.stage++;
                    effect.stageTime = 0;
                    
                    // Special effects for stage transitions
                    if (effect.stage === 1) {
                        // Transition to splat stage
                        effect.emoji = effect.splatEmojis[Math.floor(Math.random() * effect.splatEmojis.length)];
                        effect.scale = 1.5; // Splat is bigger
                    } else if (effect.stage === 2) {
                        // Transition to ghost stage
                        effect.emoji = effect.ghostEmoji;
                        effect.speechBubble.phrase = "Boo!";
                        
                        // Recalculate speech bubble width
                        this.ctx.font = '18px "Comic Sans MS", cursive, sans-serif';
                        const metrics = this.ctx.measureText(effect.speechBubble.phrase);
                        effect.speechBubble.width = metrics.width + 20;
                    }
                }
            }
            
            // Stage-specific updates
            if (effect.stage === 0) {
                // Initial death - spinning and flashing
                effect.deathAngle += deltaTime * 0.2;
                effect.scale = 1.0 + Math.sin(effect.age * 0.01) * 0.2;
            } else if (effect.stage === 1) {
                // Splat stage - flatten and spread
                effect.scale = Math.max(1.5 - effect.stageTime * 0.001, 1.0);
            } else if (effect.stage === 2) {
                // Ghost stage - float upward and fade
                effect.y -= deltaTime * 0.05;
                effect.opacity = Math.max(0, 1.0 - (effect.stageTime / effect.stageDurations[2]));
            }
            
            // Update particles
            for (const particle of effect.particles) {
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                particle.speedY += particle.gravity;
                particle.opacity = Math.max(0, particle.opacity - 0.002 * deltaTime);
                particle.rotation += particle.rotationSpeed;
            }
            
            // Update splatter - these slowly fade away
            for (const splat of effect.splatter) {
                splat.opacity = Math.max(0, splat.opacity - splat.fadeRate * deltaTime);
            }
            
            // Update death mark
            effect.deathMark.opacity = Math.max(0, effect.deathMark.opacity - 0.0005 * deltaTime);
            
            // Remove effect when complete
            if (effect.age >= effect.maxAge) {
                this.deadPlayerEffects.delete(playerId);
            }
        }
    }
    
    draw() {
        this.ctx.save();
        
        // First draw any death marks (X marks the spot)
        for (const [playerId, effect] of this.deadPlayerEffects.entries()) {
            if (effect.deathMark.opacity > 0) {
                this.drawDeathMark(effect.deathMark);
            }
        }
        
        // Then draw splatter effects that stick to the "screen"
        for (const [playerId, effect] of this.deadPlayerEffects.entries()) {
            for (const splat of effect.splatter) {
                if (splat.opacity <= 0) continue;
                
                this.ctx.save();
                this.ctx.translate(splat.x, splat.y);
                this.ctx.rotate(splat.rotation * Math.PI / 180);
                this.ctx.globalAlpha = splat.opacity;
                
                // Draw custom blob shape
                this.ctx.beginPath();
                if (splat.blobPoints && splat.blobPoints.length > 0) {
                    this.ctx.moveTo(splat.blobPoints[0].x, splat.blobPoints[0].y);
                    for (let i = 1; i < splat.blobPoints.length; i++) {
                        this.ctx.lineTo(splat.blobPoints[i].x, splat.blobPoints[i].y);
                    }
                    this.ctx.closePath();
                } else {
                    // Fallback to circle if no blob points
                    this.ctx.arc(0, 0, splat.size / 2, 0, Math.PI * 2);
                }
                
                this.ctx.fillStyle = splat.color;
                this.ctx.fill();
                this.ctx.restore();
            }
        }
        
        // Draw standard effects
        for (const effect of this.activeEffects) {
            // Calculate fade factor
            const fadeFactor = 1 - (effect.age / effect.maxAge);
            
            // Draw particles
            for (const particle of effect.particles) {
                this.ctx.globalAlpha = particle.opacity;
                this.ctx.fillStyle = particle.color;
                
                this.ctx.save();
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate(particle.rotation * Math.PI / 180);
                
                this.ctx.beginPath();
                this.ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            }
            
            // Draw speech bubble
            this.drawSpeechBubble(
                effect.speechBubble.x, 
                effect.speechBubble.y, 
                effect.speechBubble.width, 
                effect.speechBubble.height, 
                effect.speechBubble.phrase,
                fadeFactor
            );
            
            // Draw fading emoji
            this.ctx.save();
            this.ctx.globalAlpha = fadeFactor * 0.8;
            this.ctx.font = '32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(effect.emoji, effect.x, effect.y);
            this.ctx.restore();
        }
        
        // Draw player death animations
        for (const [playerId, effect] of this.deadPlayerEffects.entries()) {
            // Draw particles first (behind everything)
            for (const particle of effect.particles) {
                if (particle.opacity <= 0) continue;
                
                this.ctx.globalAlpha = particle.opacity;
                this.ctx.fillStyle = particle.color;
                
                this.ctx.save();
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate(particle.rotation * Math.PI / 180);
                
                this.ctx.beginPath();
                this.ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            }
            
            // Draw the dying player with current stage effects
            this.ctx.save();
            this.ctx.globalAlpha = effect.opacity;
            
            // Translate to player position
            this.ctx.translate(effect.x, effect.y);
            
            // Different rotation based on stage
            if (effect.stage === 0) {
                this.ctx.rotate(effect.deathAngle * Math.PI / 180);
            }
            
            // Apply scale
            this.ctx.scale(effect.scale, effect.stage === 1 ? effect.scale * 0.5 : effect.scale);
            
            // Draw emoji
            this.ctx.font = '32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(effect.emoji, 0, 0);
            
            this.ctx.restore();
            
            // Only draw speech bubble in first two stages
            if (effect.stage < 2) {
                this.drawSpeechBubble(
                    effect.speechBubble.x, 
                    effect.speechBubble.y, 
                    effect.speechBubble.width, 
                    effect.speechBubble.height, 
                    effect.speechBubble.phrase,
                    effect.opacity
                );
            }
        }
        
        this.ctx.restore();
    }
    
    // Draw X marks the spot where player died
    drawDeathMark(mark) {
        this.ctx.save();
        this.ctx.globalAlpha = mark.opacity;
        
        // Draw X
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#ff0000';
        
        this.ctx.beginPath();
        this.ctx.moveTo(mark.x - mark.size/2, mark.y - mark.size/2);
        this.ctx.lineTo(mark.x + mark.size/2, mark.y + mark.size/2);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(mark.x + mark.size/2, mark.y - mark.size/2);
        this.ctx.lineTo(mark.x - mark.size/2, mark.y + mark.size/2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawSpeechBubble(x, y, width, height, text, opacity) {
        this.ctx.save();
        
        this.ctx.globalAlpha = opacity;
        
        // Draw bubble
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        
        // Bubble body
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, 10);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Bubble tail/pointer
        this.ctx.beginPath();
        this.ctx.moveTo(x + 10, y + height);
        this.ctx.lineTo(x - 5, y + height + 15);
        this.ctx.lineTo(x + 25, y + height);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Text
        this.ctx.fillStyle = '#333';
        this.ctx.font = '18px "Comic Sans MS", cursive, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + width/2, y + height/2);
        
        this.ctx.restore();
    }
} 