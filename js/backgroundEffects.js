class BackgroundEffects {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = 35;
        this.lastTimestamp = 0;
        
        // Soft pastel colors that match our new UI
        this.colors = [
            '#a1c4fd', '#c2e9fb', '#ffecd2', '#4834d4', 
            '#0984e3', '#48dbfb', '#6c5ce7', '#74b9ff',
            '#81ecec', '#a29bfe', '#dfe6e9', '#b2bec3',
            '#00cec9', '#0fb9b1', '#2bcbba'
        ];
        
        this.generateParticles();
    }
    
    generateParticles() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.createParticle());
        }
    }
    
    createParticle() {
        const shapes = ['circle', 'square', 'triangle', 'diamond', 'star'];
        
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * 15 + 5,
            speedX: (Math.random() - 0.5) * 1.2, // Reduced for smoother movement
            speedY: (Math.random() - 0.5) * 1.2,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            shape: shapes[Math.floor(Math.random() * shapes.length)],
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 1,
            opacity: Math.random() * 0.4 + 0.1  // More subtle opacity
        };
    }
    
    update(timestamp) {
        if (!this.lastTimestamp) {
            this.lastTimestamp = timestamp;
            return;
        }
        
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        
        for (const particle of this.particles) {
            // Move particle
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // Rotate particle
            particle.rotation += particle.rotationSpeed;
            
            // Check boundaries
            if (particle.x < -particle.size || 
                particle.x > this.canvas.width + particle.size || 
                particle.y < -particle.size || 
                particle.y > this.canvas.height + particle.size) {
                
                // Reset particle to a random edge
                if (Math.random() < 0.5) {
                    // Left or right edge
                    particle.x = Math.random() < 0.5 ? -particle.size : this.canvas.width + particle.size;
                    particle.y = Math.random() * this.canvas.height;
                } else {
                    // Top or bottom edge
                    particle.x = Math.random() * this.canvas.width;
                    particle.y = Math.random() < 0.5 ? -particle.size : this.canvas.height + particle.size;
                }
                
                // Adjust velocity toward a random point, slightly biased toward center
                const targetX = this.canvas.width * (0.3 + Math.random() * 0.4);
                const targetY = this.canvas.height * (0.3 + Math.random() * 0.4);
                const dx = targetX - particle.x;
                const dy = targetY - particle.y;
                const angle = Math.atan2(dy, dx);
                
                const randomSpeed = Math.random() * 1.5 + 0.3; // Reduced speed for gentler movement
                particle.speedX = Math.cos(angle) * randomSpeed;
                particle.speedY = Math.sin(angle) * randomSpeed;
                
                // Randomly change size and opacity when respawning
                particle.size = Math.random() * 15 + 5;
                particle.opacity = Math.random() * 0.4 + 0.1;
                
                // Occasionally change shape and color
                if (Math.random() < 0.3) {
                    const shapes = ['circle', 'square', 'triangle', 'diamond', 'star'];
                    particle.shape = shapes[Math.floor(Math.random() * shapes.length)];
                    particle.color = this.colors[Math.floor(Math.random() * this.colors.length)];
                }
            }
        }
    }
    
    draw() {
        this.ctx.save();
        
        for (const particle of this.particles) {
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = particle.color;
            
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            
            switch (particle.shape) {
                case 'circle':
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                    
                case 'square':
                    this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
                    break;
                    
                case 'triangle':
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -particle.size / 2);
                    this.ctx.lineTo(particle.size / 2, particle.size / 2);
                    this.ctx.lineTo(-particle.size / 2, particle.size / 2);
                    this.ctx.closePath();
                    this.ctx.fill();
                    break;
                    
                case 'diamond':
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -particle.size / 2);
                    this.ctx.lineTo(particle.size / 2, 0);
                    this.ctx.lineTo(0, particle.size / 2);
                    this.ctx.lineTo(-particle.size / 2, 0);
                    this.ctx.closePath();
                    this.ctx.fill();
                    break;
                    
                case 'star':
                    this.drawStar(0, 0, 5, particle.size / 2, particle.size / 4);
                    break;
            }
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;
        
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }
} 