class DeathEffects {
    constructor(canvas) {
        this.canvas = canvas;
        this.effects = [];
        this.textBubbles = [];
        
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
    }
    
    addDeathEffect(x, y, color, emoji, customPhrase = null) {
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            const speed = Math.random() * 5 + 2;
            const angle = Math.random() * Math.PI * 2;
            const size = Math.random() * 8 + 4;
            
            this.effects.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: size,
                type: 'particle',
                life: 100,
                maxLife: 100
            });
        }
        
        // Add emoji particle that flies upward
        this.effects.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: -5 - Math.random() * 3,
            emoji: emoji,
            size: 30,
            type: 'emoji',
            life: 80,
            maxLife: 80,
            angle: Math.random() * 0.4 - 0.2, // Small initial rotation
            vAngle: (Math.random() - 0.5) * 0.1, // Rotation speed
        });
        
        // Add death phrase text bubble
        const phrase = customPhrase || this.deathPhrases[Math.floor(Math.random() * this.deathPhrases.length)];
        this.textBubbles.push({
            x: x,
            y: y - 30, // Position above the death location
            text: phrase,
            life: 2000, // Match the 2 second visibility of player
            maxLife: 2000,
            opacity: 1
        });
    }
    
    update(deltaTime) {
        // Update particles
        for (let i = 0; i < this.effects.length; i++) {
            const effect = this.effects[i];
            
            // Apply gravity to particles
            effect.vy += 0.1;
            
            // Update position
            effect.x += effect.vx;
            effect.y += effect.vy;
            
            // Update rotation for emoji
            if (effect.type === 'emoji' && effect.angle !== undefined) {
                effect.angle += effect.vAngle;
            }
            
            // Reduce life
            effect.life -= 1;
            
            // Remove dead effects
            if (effect.life <= 0) {
                this.effects.splice(i, 1);
                i--;
            }
        }
        
        // Update text bubbles
        for (let i = 0; i < this.textBubbles.length; i++) {
            const bubble = this.textBubbles[i];
            
            // Float upward slowly
            bubble.y -= 0.5;
            
            // Reduce life
            bubble.life -= deltaTime;
            
            // Make bubble fade out in the last 500ms
            if (bubble.life < 500) {
                bubble.opacity = bubble.life / 500;
            }
            
            // Remove dead bubbles
            if (bubble.life <= 0) {
                this.textBubbles.splice(i, 1);
                i--;
            }
        }
    }
    
    draw() {
        const ctx = this.canvas.getContext('2d');
        
        // Draw particles
        for (const effect of this.effects) {
            ctx.save();
            
            // Set opacity based on life
            ctx.globalAlpha = effect.life / effect.maxLife;
            
            if (effect.type === 'particle') {
                // Draw particle
                ctx.fillStyle = effect.color;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (effect.type === 'emoji') {
                // Draw emoji with rotation
                ctx.translate(effect.x, effect.y);
                ctx.rotate(effect.angle || 0);
                ctx.font = `${effect.size}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(effect.emoji, 0, 0);
            }
            
            ctx.restore();
        }
        
        // Draw text bubbles
        for (const bubble of this.textBubbles) {
            ctx.save();
            
            // Draw bubble
            ctx.globalAlpha = bubble.opacity;
            
            // Text bubble background
            const textWidth = ctx.measureText(bubble.text).width;
            const padding = 10;
            const bubbleWidth = textWidth + padding * 2;
            const bubbleHeight = 30;
            
            // Draw rounded rectangle for bubble
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.roundRect(
                ctx, 
                bubble.x - bubbleWidth / 2, 
                bubble.y - bubbleHeight / 2, 
                bubbleWidth, 
                bubbleHeight, 
                8
            );
            
            // Add small triangle pointer at bottom of bubble
            ctx.beginPath();
            ctx.moveTo(bubble.x - 8, bubble.y + bubbleHeight / 2);
            ctx.lineTo(bubble.x, bubble.y + bubbleHeight / 2 + 8);
            ctx.lineTo(bubble.x + 8, bubble.y + bubbleHeight / 2);
            ctx.closePath();
            ctx.fill();
            
            // Draw text
            ctx.fillStyle = 'white';
            ctx.font = '14px "Comic Sans MS", cursive, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bubble.text, bubble.x, bubble.y);
            
            ctx.restore();
        }
    }
    
    // Helper function to draw rounded rectangles
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }
} 