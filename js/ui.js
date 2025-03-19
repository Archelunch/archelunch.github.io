class GameUI {
    constructor() {
        // Cache DOM elements
        this.centralButton = document.getElementById('central-button');
        this.deathBanner = document.getElementById('death-banner');
        this.scoresList = document.getElementById('scores');
        this.scoreboard = document.getElementById('scoreboard');
        this.toggleScoreboardBtn = document.getElementById('toggle-scoreboard');
        this.compactScore = document.getElementById('compact-score');
        this.playerRank = document.getElementById('player-rank');
        this.playerEmoji = document.getElementById('player-emoji');
        this.playerScore = document.getElementById('player-score');
        this.cursorElement = null;
        
        // UI state
        this.isScoreboardVisible = true;
        
        // Initialize UI elements
        this.initializeUI();
        
        // Set up window resize handler
        window.addEventListener('resize', () => {
            this.centralButtonBounds = this.getCentralButtonBounds();
        });
    }
    
    initializeUI() {
        // Initialize scoreboard visibility
        if (this.compactScore) this.compactScore.classList.add('hidden');
        if (this.scoreboard) this.scoreboard.classList.remove('hidden');
        
        // Setup custom cursor and button bounds
        this.setupCustomCursor();
        this.centralButtonBounds = this.getCentralButtonBounds();
        this.setupScoreboardToggle();
    }

    setupCustomCursor() {
        // Create a custom cursor element
        this.cursorElement = document.createElement('div');
        this.cursorElement.className = 'custom-cursor';
        this.cursorElement.textContent = '🪰'; // Default fly emoji
        document.body.appendChild(this.cursorElement);
        
        // Position cursor on mouse move
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }
    
    handleMouseMove(e) {
        if (this.cursorElement) {
            this.cursorElement.style.left = `${e.clientX}px`;
            this.cursorElement.style.top = `${e.clientY}px`;
        }
    }

    updateCursorEmoji(emoji) {
        if (this.cursorElement && emoji) {
            this.cursorElement.textContent = emoji;
        }
    }

    getCentralButtonBounds() {
        const rect = this.centralButton.getBoundingClientRect();
        return {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            centerX: (rect.left + rect.right) / 2,
            centerY: (rect.top + rect.bottom) / 2,
            radius: rect.width / 2
        };
    }

    hideCursor() {
        if (this.cursorElement) {
            this.cursorElement.style.display = 'none';
        }
    }

    showCursor() {
        if (this.cursorElement) {
            this.cursorElement.style.display = 'block';
        }
    }

    showDeathBanner(player, respawnTime = 5000) {
        this.deathBanner.classList.remove('hidden');
        this.hideCursor();
        
        // Get appropriate death message
        const deathMessage = this.getDeathMessage(player);
        
        // Clear the death banner
        this.deathBanner.innerHTML = '';
        
        // Create text container and elements
        const textContainer = document.createElement('div');
        textContainer.className = 'resurrection-text-container';
        
        const textElement = document.createElement('div');
        textElement.className = 'resurrection-text';
        textElement.textContent = deathMessage;
        
        // Add text to container and container to banner
        textContainer.appendChild(textElement);
        this.deathBanner.appendChild(textContainer);
        
        // Create resurrection progress effects
        this.setupResurrectionProgress(respawnTime, textElement);
    }
    
    getDeathMessage(player) {
        if (player && player.getDeathPhrase) {
            return player.getDeathPhrase();
        }
        
        // Default death phrases as fallback
        const sillyMessages = [
            "You Died! SPLAT!",
            "SQUISHED!",
            "Oh No! You're toast!",
            "GAME OVER, little fly!",
            "BZZZZT! You're done!",
            "Fly Heaven Awaits!",
            "That's all, folks!",
            "SWATTED!",
            "Fly No More!",
            "Buzz-ted!"
        ];
        return sillyMessages[Math.floor(Math.random() * sillyMessages.length)];
    }
    
    setupResurrectionProgress(duration, textElement) {
        // Clear any existing progress elements
        const existingProgress = document.getElementById('resurrection-progress');
        if (existingProgress) {
            existingProgress.remove();
        }
        
        // Create the progress element
        const progressElement = document.createElement('div');
        progressElement.id = 'resurrection-progress';
        this.deathBanner.appendChild(progressElement);
        
        // Create particles container
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'resurrection-particles';
        this.deathBanner.appendChild(particlesContainer);
        
        // Create resurrection particles
        this.createResurrectionParticles(particlesContainer, duration);
        
        // Set the animation duration to match the respawn time
        progressElement.style.animationDuration = `${duration}ms`;
        
        // Animate text from left to right
        if (textElement) {
            textElement.style.animationDuration = `${duration}ms`;
        }
        
        // Add color shifting aura class for cool effect
        this.deathBanner.classList.add('resurrection-active');
        
        // Start the animations
        progressElement.classList.add('active');
        if (textElement) {
            textElement.classList.add('active');
        }
        
        // Change the animation speed of the wobble based on progress
        let startTime = Date.now();
        const animateWobble = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Increase wobble speed as we get closer to resurrection
            const wobbleSpeed = 0.5 + (progress * 1.5); // 0.5s to 2s
            this.deathBanner.style.animationDuration = `${wobbleSpeed}s`;
            
            // Increase glow as we get closer
            const glowIntensity = Math.floor(progress * 12); // Increased for better visibility
            this.deathBanner.style.boxShadow = `0 0 ${glowIntensity}px ${glowIntensity * 3}px rgba(255, 107, 107, 0.8)`;
            
            if (progress < 1) {
                requestAnimationFrame(animateWobble);
            }
        };
        
        animateWobble();
        
        // Remove the effects when done
        setTimeout(() => {
            this.deathBanner.classList.remove('resurrection-active');
            if (progressElement.parentNode) {
                progressElement.remove();
            }
            if (particlesContainer.parentNode) {
                particlesContainer.remove();
            }
        }, duration);
    }
    
    createResurrectionParticles(container, duration) {
        // Create more particles for a silly effect
        const particleCount = 20;
        const sillyEmojis = ['✨', '💥', '🌟', '⚡', '🔥', '🦠', '🧬'];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'resurrection-particle';
            
            // Random position within the banner
            const delay = Math.random() * duration * 0.8;
            const size = Math.floor(Math.random() * 15) + 5;
            
            // Sometimes use emojis instead of circles
            if (Math.random() > 0.7) {
                const emoji = sillyEmojis[Math.floor(Math.random() * sillyEmojis.length)];
                particle.textContent = emoji;
                particle.style.background = 'none';
                particle.style.fontSize = `${size}px`;
            } else {
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
            }
            
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${delay}ms`;
            particle.style.animationDuration = `${(duration * 0.8) - delay}ms`;
            
            container.appendChild(particle);
        }
    }

    hideDeathBanner() {
        this.deathBanner.classList.add('hidden');
        this.showCursor();
    }

    setupScoreboardToggle() {
        if (this.toggleScoreboardBtn) {
            this.toggleScoreboardBtn.addEventListener('click', () => {
                this.toggleScoreboard();
            });
        }
        
        // Make compact score display clickable to expand back to full scoreboard
        if (this.compactScore) {
            this.compactScore.addEventListener('click', () => {
                this.showFullScoreboard();
            });
        }
    }
    
    toggleScoreboard() {
        if (this.isScoreboardVisible) {
            this.hideFullScoreboard();
        } else {
            this.showFullScoreboard();
        }
    }
    
    hideFullScoreboard() {
        // First ensure we're in a known state
        this.isScoreboardVisible = false;
        
        // Hide the full scoreboard
        if (this.scoreboard) {
            this.scoreboard.classList.add('hidden');
        }
        
        // Show the compact scoreboard
        if (this.compactScore) {
            this.compactScore.classList.remove('hidden');
        }
    }
    
    showFullScoreboard() {
        // First ensure we're in a known state
        this.isScoreboardVisible = true;
        
        // Show the full scoreboard
        if (this.scoreboard) {
            this.scoreboard.classList.remove('hidden');
        }
        
        // Hide the compact scoreboard
        if (this.compactScore) {
            this.compactScore.classList.add('hidden');
        }
    }

    updateScoreboard(players) {
        if (!this.scoresList) return;
        
        // Clear current scores
        this.scoresList.innerHTML = '';
        
        // Sort players by score (descending)
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        
        // Find local player's rank
        let localPlayerRank = -1;
        const localPlayer = players.find(p => p.isLocalPlayer === true);
        
        // Create list items for each player
        sortedPlayers.forEach((player, index) => {
            // Update local player rank if found
            if (player.isLocalPlayer) {
                localPlayerRank = index + 1;
            }
            
            const listItem = this.createPlayerScoreItem(player, index + 1);
            this.scoresList.appendChild(listItem);
        });
        
        // Update compact score display with local player info and rank
        if (localPlayer && localPlayerRank > 0) {
            this.updateCompactScoreDisplay(localPlayer, localPlayerRank);
        }
    }
    
    createPlayerScoreItem(player, rank) {
        const listItem = document.createElement('li');
        
        // Highlight local player with silly CSS class
        if (player.isLocalPlayer) {
            listItem.style.fontWeight = 'bold';
            listItem.style.color = '#0984e3';
            listItem.style.backgroundColor = 'rgba(9, 132, 227, 0.15)';
            listItem.style.border = '1px solid rgba(9, 132, 227, 0.3)';
        }
        
        // Create emoji element (most important part of a silly fly!)
        const emojiElement = document.createElement('span');
        emojiElement.className = 'emoji';
        emojiElement.textContent = player.emoji || '🪰';
        
        // Create player name and score
        const playerInfo = document.createElement('span');
        playerInfo.textContent = `${player.name}: ${player.score}`;
        
        // Add status indicator for dead players
        if (!player.isAlive) {
            listItem.style.opacity = '0.6';
            
            const deadSpan = document.createElement('span');
            deadSpan.textContent = ' ✝️';
            deadSpan.style.marginLeft = '5px';
            listItem.appendChild(deadSpan);
        }
        
        // Add rank badge for top 3 players (fun medals)
        if (rank <= 3 && player.score > 0) {
            const rankEmojis = ['🥇', '🥈', '🥉'];
            const rankSpan = document.createElement('span');
            rankSpan.textContent = rankEmojis[rank - 1];
            rankSpan.style.marginLeft = '5px';
            playerInfo.appendChild(rankSpan);
        }
        
        // Append all elements to list item
        listItem.appendChild(emojiElement);
        listItem.appendChild(playerInfo);
        
        return listItem;
    }

    updateCompactScoreDisplay(localPlayer, rank) {
        if (!localPlayer) return;
        
        // Update compact display content
        let rankDisplay = `#${rank}`;
        if (rank === 1) rankDisplay = '🥇';
        else if (rank === 2) rankDisplay = '🥈';
        else if (rank === 3) rankDisplay = '🥉';
        
        this.playerRank.textContent = rankDisplay;
        this.playerEmoji.textContent = localPlayer.emoji;
        this.playerScore.textContent = localPlayer.score;
    }

    isClickOnCentralButton(x, y) {
        // For a circle, we check if the point is within the radius
        const dx = x - this.centralButtonBounds.centerX;
        const dy = y - this.centralButtonBounds.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= this.centralButtonBounds.radius;
    }
} 