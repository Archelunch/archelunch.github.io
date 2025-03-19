class DeathEffects {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.activeEffects = [];
        
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
    }
    
    draw() {
        this.ctx.save();
        
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
                effect.phrase,
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