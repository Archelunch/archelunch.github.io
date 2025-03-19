class DeathEffects {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.effects = [];
        
        // Corpse effects to handle removing dead players gracefully
        this.corpseEffects = [];
        
        // Funny death phrases
        this.deathPhrases = [
            "SPLAT!",
            "Buzz-ted!",
            "Bug off!",
            "Squished!",
            "Swatted!",
            "Fly no more!",
            "Ouch!",
            "Exterminated!",
            "Game Over!",
            "Smacked!"
        ];
    }
    
    addDeathEffect(x, y, color, emoji, customPhrase) {
        // Use custom phrase if provided, otherwise random from list
        const phrase = customPhrase || this.deathPhrases[Math.floor(Math.random() * this.deathPhrases.length)];
        
        // Create standard particle explosion
        const particleCount = 20 + Math.floor(Math.random() * 10);
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: x,
                y: y,
                size: 2 + Math.random() * 8,
                color: color,
                speedX: (Math.random() - 0.5) * 10,
                speedY: (Math.random() - 0.5) * 10,
                opacity: 1,
                gravity: 0.15 + Math.random() * 0.1
            });
        }
        
        // Create text effect for death phrase
        const textEffect = {
            x: x,
            y: y - 40,
            text: phrase,
            color: "#ff0000",
            opacity: 1,
            size: 24,
            speedY: -2
        };
        
        // Add to effects array
        this.effects.push({
            particles,
            textEffect,
            age: 0,
            maxAge: 1500 // Effect lasts 1.5 seconds
        });
        
        // Create corpse effect to handle the player's body fading out
        this.addCorpseEffect(x, y, emoji);
    }
    
    addCorpseEffect(x, y, emoji) {
        // Create a corpse effect that will make the dead player fade out and fall
        this.corpseEffects.push({
            x: x,
            y: y,
            emoji: emoji,
            opacity: 1,
            rotation: 0,
            scale: 1,
            speedY: 0.5, // Initial falling speed
            age: 0,
            maxAge: 2000 // Corpse effect lasts 2 seconds
        });
    }
    
    update(deltaTime) {
        // Update regular death effects
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.age += deltaTime;
            
            // Remove effect if it's too old
            if (effect.age >= effect.maxAge) {
                this.effects.splice(i, 1);
                continue;
            }
            
            // Update particles
            for (const particle of effect.particles) {
                // Apply gravity
                particle.speedY += particle.gravity;
                
                // Move particle
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                
                // Fade out particle
                particle.opacity = 1 - effect.age / effect.maxAge;
            }
            
            // Update text effect
            const textEffect = effect.textEffect;
            textEffect.y += textEffect.speedY;
            textEffect.speedY *= 0.98; // Slow down over time
            textEffect.opacity = 1 - effect.age / effect.maxAge;
        }
        
        // Update corpse effects
        for (let i = this.corpseEffects.length - 1; i >= 0; i--) {
            const corpse = this.corpseEffects[i];
            corpse.age += deltaTime;
            
            // Remove corpse if it's too old
            if (corpse.age >= corpse.maxAge) {
                this.corpseEffects.splice(i, 1);
                continue;
            }
            
            // Update corpse position - make it fall with increasing speed
            corpse.speedY += 0.05; // Gravity
            corpse.y += corpse.speedY;
            
            // Add some rotation to make it look like it's tumbling
            corpse.rotation += 0.1;
            
            // Fade out gradually
            corpse.opacity = 1 - (corpse.age / corpse.maxAge);
            
            // Shrink slightly as it falls
            corpse.scale = 1 - (0.5 * corpse.age / corpse.maxAge);
        }
    }
    
    draw() {
        // Draw text effects and particles
        for (const effect of this.effects) {
            // Draw particles
            for (const particle of effect.particles) {
                this.ctx.save();
                this.ctx.fillStyle = particle.color;
                this.ctx.globalAlpha = particle.opacity;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
            
            // Draw text effect
            const textEffect = effect.textEffect;
            this.ctx.save();
            this.ctx.font = `bold ${textEffect.size}px 'Comic Sans MS', cursive, sans-serif`;
            this.ctx.fillStyle = textEffect.color;
            this.ctx.globalAlpha = textEffect.opacity;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(textEffect.text, textEffect.x, textEffect.y);
            this.ctx.restore();
        }
        
        // Draw corpse effects
        for (const corpse of this.corpseEffects) {
            this.ctx.save();
            this.ctx.translate(corpse.x, corpse.y);
            this.ctx.rotate(corpse.rotation);
            this.ctx.scale(corpse.scale, corpse.scale);
            this.ctx.globalAlpha = corpse.opacity;
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(corpse.emoji, 0, 0);
            this.ctx.restore();
        }
    }
} 