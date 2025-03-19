class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ui = new GameUI();
        this.localPlayer = null;
        this.players = [];
        this.isGameRunning = false;
        
        // Initialize start screen
        this.startScreen = new StartScreen();
        this.playerCustomInfo = null;
        
        // Set canvas size to full window
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Initialize effects
        this.backgroundEffects = new BackgroundEffects(this.canvas);
        this.deathEffects = new DeathEffects(this.canvas);
        
        // Initialize WebSocket connection
        this.websocket = new WebSocketManager("wss://edd9-77-46-247-227.ngrok-free.app");
        this.useMultiplayer = true;
        
        // Performance tracking
        this.lastTimestamp = 0;
        this.lastPositionUpdate = 0;
        this.positionUpdateInterval = 25; // 40 updates per second
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        // Show start screen and wait for player customization
        this.startScreen.setOnPlayerReady((playerInfo) => {
            this.playerCustomInfo = playerInfo;
            this.initialize();
        });
        
        // Start background effects while on start screen
        this.updateBackgroundOnly(0);
    }
    
    updateBackgroundOnly(timestamp) {
        if (this.isGameRunning) return;
        
        // Update and draw only background effects
        this.backgroundEffects.update(timestamp);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.backgroundEffects.draw();
        
        // Continue animation loop until game starts
        requestAnimationFrame((ts) => this.updateBackgroundOnly(ts));
    }

    initialize() {
        // Initialize WebSocket callbacks before connecting
        this.setupWebSocketHandlers();
        
        if (this.useMultiplayer) {
            // Connect to WebSocket server
            console.log("Connecting to game server...");
            this.websocket.connect();
        } else {
            // Initialize local player at random position directly (offline mode)
            this.initializeOfflineMode();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Add silly audio effects
            this.setupAudio();
            
            // Setup settings panel
            this.setupSettingsPanel();
            
            // Start game loop
            this.isGameRunning = true;
            this.gameLoop(0);
        }
    }
    
    setupWebSocketHandlers() {
        // Handle initial connection response
        this.websocket.onInit((data) => {
            // Initialize local player with server-provided coordinates
            this.localPlayer = new Player(
                data.playerId, 
                data.x, 
                data.y, 
                true, // This must be true for the local player
                this.playerCustomInfo
            );
            
            // Add local player to players array
            this.players.push(this.localPlayer);
            
            // Set cursor emoji to match player selection
            this.ui.updateCursorEmoji(this.localPlayer.emoji);
            
            // Send player customization info
            this.websocket.sendPlayerInfo(
                this.playerCustomInfo.name,
                this.playerCustomInfo.emoji,
                this.playerCustomInfo.deathPhrase
            );
            
            // IMPORTANT: Only add other players from initial data
            if (data.players && Array.isArray(data.players)) {
                // Filter out any players that have the same ID as our local player
                const otherPlayers = data.players.filter(p => p.id !== this.localPlayer.id);
                this.addPlayersFromServer(otherPlayers);
            }
            
            // Rest of initialization
            this.setupEventListeners();
            this.setupAudio();
            this.setupSettingsPanel();
            
            // Initial scoreboard update if leaderboard was provided
            if (data.leaderboard && Array.isArray(data.leaderboard)) {
                this.updatePlayerScoresFromLeaderboard(data.leaderboard);
                this.ui.updateScoreboard(this.players);
            }
            
            // Start game loop
            this.isGameRunning = true;
            this.gameLoop(0);
        });
        
        // Handle player joining
        this.websocket.onPlayerJoined((data) => {
            // Only add if it's not our local player
            if (this.localPlayer && data.playerId !== this.localPlayer.id) {
                console.log(`Adding new player from player_joined event: ${data.name || 'Unknown'} (${data.playerId})`);
                // Check if player already exists before adding
                const existingPlayer = this.getPlayerById(data.playerId);
                if (!existingPlayer) {
                    this.addPlayerFromServer(data);
                    console.log("Players after adding:", this.players.map(p => `${p.name} (${p.id.substring(0, 6)})`));
                    // Refresh the scoreboard immediately
                    this.ui.updateScoreboard(this.players);
                } else {
                    console.log(`Player ${data.playerId} already exists, not adding again`);
                }
            } else {
                console.log(`Ignoring player_joined for local player ${this.localPlayer?.id}`);
            }
        });
        
        // Handle players leaving
        this.websocket.onPlayerLeft((data) => {
            this.removePlayerById(data.playerId);
            // Refresh the scoreboard
            this.ui.updateScoreboard(this.players);
        });
        
        // Handle position updates
        this.websocket.onPositionUpdate((data) => {
            // Update other players' positions
            if (this.localPlayer && data.playerId !== this.localPlayer.id) {
                console.log(`Position update for ${data.playerId}: (${data.x}, ${data.y})`);
                
                // Make sure the player exists before updating position
                let player = this.getPlayerById(data.playerId);
                
                // If player doesn't exist, add them
                if (!player) {
                    console.log(`Player ${data.playerId} not found for position update - adding them`);
                    this.addPlayerFromServer({
                        id: data.playerId,
                        x: data.x,
                        y: data.y,
                        name: `Player_${data.playerId.substring(0, 6)}`,  // Default name until we get an update
                        emoji: "🪰"
                    });
                    player = this.getPlayerById(data.playerId);
                }
                
                if (player) {
                    this.updatePlayerPosition(data.playerId, data.x, data.y);
                } else {
                    console.error(`Could not create or find player ${data.playerId} for position update`);
                }
            }
        });
        
        // Handle player info updates
        this.websocket.onPlayerUpdated((data) => {
            console.log(`Updating player info for ${data.playerId}: name=${data.name}, emoji=${data.emoji}`);
            
            // Find the player
            let player = this.getPlayerById(data.playerId);
            
            // If player doesn't exist but we're getting an update for them, add them
            if (!player && data.playerId !== this.localPlayer?.id) {
                console.log(`Player ${data.playerId} not found for info update - adding them`);
                this.addPlayerFromServer({
                    id: data.playerId,
                    x: Math.random() * this.canvas.width,  // Random position until we get a position update
                    y: Math.random() * this.canvas.height,
                    name: data.name || `Player_${data.playerId.substring(0, 6)}`,
                    emoji: data.emoji || "🪰",
                    deathPhrase: data.deathPhrase || "SPLAT!"
                });
                player = this.getPlayerById(data.playerId);
            }
            
            if (player && !player.isLocalPlayer) {
                // Update player's customization
                player.name = data.name || player.name;
                player.emoji = data.emoji || player.emoji;
                player.deathPhrase = data.deathPhrase || player.deathPhrase;
                console.log(`Updated player ${player.id.substring(0, 8)}: ${player.name} (${player.emoji})`);
                
                // Update scoreboard to reflect changes
                this.ui.updateScoreboard(this.players);
            } else if (!player) {
                console.log(`Player ${data.playerId} not found and couldn't be created, can't update info`);
            }
        });
        
        // Handle player deaths
        this.websocket.onPlayerDied((data) => {
            console.log(`Processing player death for ${data.playerId}`);
            const player = this.getPlayerById(data.playerId);
            if (player) {
                this.handlePlayerDeath(player);
                console.log(`Handled death for player: ${player.name} (${player.id})`);
            } else {
                console.error(`Could not find player with ID ${data.playerId} for death event`);
            }
        });
        
        // Handle player respawning
        this.websocket.onPlayerRespawned((data) => {
            console.log(`Processing respawn for ${data.playerId} at (${data.x}, ${data.y})`);
            let player = this.getPlayerById(data.playerId);
            
            // If player doesn't exist, add them
            if (!player && data.playerId !== this.localPlayer?.id) {
                console.log(`Player ${data.playerId} not found for respawn - adding them`);
                this.addPlayerFromServer({
                    id: data.playerId,
                    x: data.x,
                    y: data.y,
                    name: `Player_${data.playerId.substring(0, 6)}`,  // Default name until we get an update
                    emoji: "🪰"
                });
                player = this.getPlayerById(data.playerId);
            }
            
            if (player) {
                player.respawn(data.x, data.y);
                
                // If it's the local player, hide death banner
                if (player.isLocalPlayer) {
                    this.ui.hideDeathBanner();
                    // Play respawn sound for local player
                    this.sounds.respawn.play();
                }
            } else {
                console.error(`Could not find player with ID ${data.playerId} for respawn event and could not create them`);
            }
        });
        
        // Handle leaderboard updates
        this.websocket.onLeaderboardUpdate((data) => {
            console.log("Processing leaderboard update:", data.leaderboard);
            // Update player scores from leaderboard
            if (data.leaderboard && Array.isArray(data.leaderboard)) {
                this.updatePlayerScoresFromLeaderboard(data.leaderboard);
                
                // Update UI scoreboard
                this.ui.updateScoreboard(this.players);
            } else {
                console.error("Invalid leaderboard data received:", data);
            }
        });
        
        // Handle successful hits
        this.websocket.onHitSuccess((data) => {
            console.log(`Processing hit success: ${data.targetId}`);
            // Update local player score
            if (this.localPlayer) {
                this.localPlayer.score = data.newScore;
            }
            
            // Play sound effects for successful hit
            this.sounds.click.play();
            this.sounds.splat.play();
        });
    }
    
    addPlayersFromServer(serverPlayers) {
        if (!Array.isArray(serverPlayers)) {
            console.error("addPlayersFromServer received non-array data:", serverPlayers);
            return;
        }
        
        serverPlayers.forEach(playerData => {
            if (!playerData || !playerData.id) {
                console.error("Invalid player data:", playerData);
                return;
            }
            
            if (this.localPlayer && playerData.id === this.localPlayer.id) {
                console.log(`Skipping local player ${playerData.id} in addPlayersFromServer`);
                return;
            }
            
            this.addPlayerFromServer(playerData);
        });
    }
    
    addPlayerFromServer(playerData) {
        // Check if this player already exists
        if (this.getPlayerById(playerData.id)) return;
        
        // Never create a duplicate of our local player
        if (this.localPlayer && playerData.id === this.localPlayer.id) return;
        
        // Create a new player object from server data
        const player = new Player(
            playerData.id,
            playerData.x,
            playerData.y,
            false, // not local player - this must always be false for server-added players
            {
                name: playerData.name || `Player_${playerData.id.substring(0, 6)}`,
                emoji: playerData.emoji || "🪰",
                deathPhrase: playerData.deathPhrase || "SPLAT!"
            }
        );
        
        // Set score if provided
        if (playerData.score !== undefined) {
            player.score = playerData.score;
        }
        
        // Add to players array
        this.players.push(player);
    }
    
    removePlayerById(playerId) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            const player = this.players[index];
            console.log(`Removing player ${player.name} (${playerId.substring(0, 8)})`);
            this.players.splice(index, 1);
        }
    }
    
    getPlayerById(playerId) {
        return this.players.find(p => p.id === playerId);
    }
    
    updatePlayerPosition(playerId, x, y) {
        const player = this.getPlayerById(playerId);
        if (player && !player.isLocalPlayer) {
            // Use player's update method to ensure smooth movement
            player.update(x, y);
        }
    }
    
    updatePlayerScoresFromLeaderboard(leaderboard) {
        if (!Array.isArray(leaderboard)) return;
        
        leaderboard.forEach(entry => {
            // Skip if this is our local player 
            if (this.localPlayer && entry.id === this.localPlayer.id) {
                this.localPlayer.score = entry.score; // Just update local player score
                return;
            }
            
            let player = this.getPlayerById(entry.id);
            
            // Add new player if not found and not our local player
            if (!player) {
                this.addPlayerFromServer({
                    id: entry.id,
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    name: entry.name,
                    emoji: entry.emoji,
                    score: entry.score
                });
                player = this.getPlayerById(entry.id);
            }
            
            // Update score if player exists
            if (player) {
                player.score = entry.score;
            }
        });
    }
    
    initializeOfflineMode() {
        // Initialize local player at random position
        const randomX = Math.random() * this.canvas.width;
        const randomY = Math.random() * this.canvas.height;
        this.localPlayer = new Player(0, randomX, randomY, true, this.playerCustomInfo);
        this.players.push(this.localPlayer);
        
        // Set cursor emoji to match player selection
        this.ui.updateCursorEmoji(this.localPlayer.emoji);
    }
    
    setupAudio() {
        // Create audio context for sound effects
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Try loading the AudioWorklet, but provide a fallback
        this.useAudioWorklet = false;
        
        // Try to load the audio worklet
        try {
            // Only attempt to load audio worklet if we're on http/https
            if (window.location.protocol.includes('http')) {
                this.audioContext.audioWorklet.addModule('js/audioWorklets.js')
                    .then(() => {
                        this.useAudioWorklet = true;
                        console.log('AudioWorklet loaded successfully');
                    })
                    .catch(err => {
                        console.error('Error loading audio worklet, using fallback:', err);
                    });
            } else {
                console.log('Not using AudioWorklet: file:// protocol detected. Use a web server for AudioWorklet support.');
            }
        } catch (err) {
            console.log('AudioWorklet not supported in this browser, using fallback');
        }
        
        // Create sound effects
        this.sounds = {
            click: {
                oscillator: null,
                gain: null,
                play: () => this.playTone(800, 0.1, 'square')
            },
            death: {
                oscillator: null,
                gain: null,
                play: () => this.playSlideDown(600, 100, 0.3)
            },
            respawn: {
                oscillator: null,
                gain: null,
                play: () => this.playSlideUp(100, 600, 0.2)
            },
            splat: {
                oscillator: null,
                gain: null,
                play: () => this.playSplat()
            }
        };
    }
    
    setupEventListeners() {
        // Track mouse movement for local player
        document.addEventListener('mousemove', (e) => {
            if (!this.localPlayer) return;
            
            if (this.localPlayer.isAlive) {
                this.localPlayer.update(e.clientX, e.clientY);
                
                // Send position updates to server, but throttle them
                if (this.useMultiplayer) {
                    const now = Date.now();
                    if (now - this.lastPositionUpdate > this.positionUpdateInterval) {
                        this.lastPositionUpdate = now;
                        this.websocket.sendPositionUpdate(e.clientX, e.clientY);
                    }
                }
            }
        });
        
        // Set up click handling with debounce to prevent multiple clicks
        let lastClickTime = 0;
        const clickCooldown = 100; // 100ms cooldown between clicks
        
        // Handle clicks
        document.addEventListener('click', (e) => {
            if (!this.localPlayer) return;
            
            // Prevent click spamming
            const now = Date.now();
            if (now - lastClickTime < clickCooldown) return;
            lastClickTime = now;
            
            if (!this.localPlayer.isAlive) return;
            
            // Check if clicked on central button
            if (this.ui.isClickOnCentralButton(e.clientX, e.clientY)) {
                console.log("Clicked central button!");
                if (this.useMultiplayer) {
                    // Send button click to server
                    this.websocket.sendButtonClick();
                } else {
                    this.handlePlayerDeath(this.localPlayer);
                }
                return;
            }
            
            // Check if clicked on another player
            if (this.useMultiplayer) {
                // Send click to server for hit detection
                console.log(`Sending click to server: (${e.clientX}, ${e.clientY})`);
                this.websocket.sendPlayerClick(e.clientX, e.clientY);
            } else {
                // Local hit detection
                this.handlePlayerClick(e.clientX, e.clientY);
            }
        });
    }
    
    handlePlayerClick(x, y) {
        // Sort players by distance from click to prioritize the closest one
        const clickablePlayers = this.players
            .filter(player => player !== this.localPlayer && player.isAlive)
            .map(player => {
                const dx = player.x - x;
                const dy = player.y - y;
                return {
                    player,
                    distance: Math.sqrt(dx * dx + dy * dy)
                };
            })
            .sort((a, b) => a.distance - b.distance);
        
        // Check the closest player first
        for (const {player, distance} of clickablePlayers) {
            if (player.isPointInside(x, y)) {
                // Kill player and increase score
                this.handlePlayerDeath(player);
                this.localPlayer.increaseScore();
                
                // Play sound effects
                this.sounds.click.play();
                this.sounds.splat.play();
                
                // Stop checking other players
                break;
            }
        }
    }

    handlePlayerDeath(player) {
        // Add death visual effects before killing player
        if (this.deathEffects) {
            this.deathEffects.addDeathEffect(player.x, player.y, player.colors[0], player.emoji, player.getDeathPhrase());
        }
        
        // Kill player - this will keep them visible for 2 seconds then hide them
        player.kill();
        
        // Play death sound
        this.sounds.death.play();
        
        // Respawn time in milliseconds
        const respawnTime = 5000;
        
        if (player.isLocalPlayer) {
            // Show death banner with player's custom death phrase and respawn time
            this.ui.showDeathBanner(player, respawnTime);
            
            // In multiplayer mode, server will send respawn message
            if (!this.useMultiplayer) {
                // Respawn local player after respawn time
                setTimeout(() => {
                    const randomX = Math.random() * this.canvas.width;
                    const randomY = Math.random() * this.canvas.height;
                    player.respawn(randomX, randomY);
                    this.ui.hideDeathBanner();
                    
                    // Play respawn sound
                    this.sounds.respawn.play();
                }, respawnTime);
            }
        } else if (!this.useMultiplayer) {
            // Only handle AI respawns in offline mode
            // Respawn AI player after respawn time
            setTimeout(() => {
                const randomX = Math.random() * this.canvas.width;
                const randomY = Math.random() * this.canvas.height;
                player.respawn(randomX, randomY);
            }, respawnTime);
        }
    }

    update(timestamp) {
        // Calculate delta time for animations
        const deltaTime = this.lastTimestamp ? timestamp - this.lastTimestamp : 0;
        this.lastTimestamp = timestamp;
        
        // Update background effects
        this.backgroundEffects.update(timestamp);
        
        // Update death effects
        this.deathEffects.update(deltaTime);
        
        // Update scoreboard
        this.ui.updateScoreboard(this.players);
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background effects
        this.backgroundEffects.draw();
        
        // Draw all players
        for (const player of this.players) {
            player.draw(this.ctx);
        }
        
        // Draw death effects on top
        this.deathEffects.draw();
    }

    gameLoop(timestamp) {
        if (!this.isGameRunning) return;
        
        // Calculate delta time for smooth animations
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        
        // Update game state
        this.update(deltaTime);
        
        // Draw frame
        this.draw();
        
        // Continue game loop
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    setupSettingsPanel() {
        // Get DOM elements
        const settingsButton = document.getElementById('settings-button');
        const settingsPanel = document.getElementById('settings-panel');
        const closeSettings = document.getElementById('close-settings');
        const saveSettingsBtn = document.getElementById('save-settings-btn');
        const emojiOptions = settingsPanel.querySelectorAll('.emoji-options .emoji-option');
        const phraseOptions = settingsPanel.querySelectorAll('.phrase-options .phrase-option');
        
        // Current selection state
        let selectedEmoji = this.localPlayer.emoji;
        let selectedDeathPhrase = this.localPlayer.deathPhrase;
        
        // Update initial selected state
        this.updateSelectedOptions(emojiOptions, selectedEmoji);
        this.updateSelectedOptions(phraseOptions, selectedDeathPhrase);
        
        // Toggle settings panel visibility
        settingsButton.addEventListener('click', () => {
            // Update selected options based on current player settings
            selectedEmoji = this.localPlayer.emoji;
            selectedDeathPhrase = this.localPlayer.deathPhrase;
            
            this.updateSelectedOptions(emojiOptions, selectedEmoji);
            this.updateSelectedOptions(phraseOptions, selectedDeathPhrase);
            
            settingsPanel.classList.toggle('hidden');
        });
        
        // Close settings panel
        closeSettings.addEventListener('click', () => {
            settingsPanel.classList.add('hidden');
        });
        
        // Emoji selection
        emojiOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                emojiOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Update selected emoji
                selectedEmoji = option.getAttribute('data-emoji');
            });
        });
        
        // Death phrase selection
        phraseOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                phraseOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Update selected death phrase
                selectedDeathPhrase = option.getAttribute('data-phrase');
            });
        });
        
        // Save settings
        saveSettingsBtn.addEventListener('click', () => {
            // Update player settings
            this.localPlayer.emoji = selectedEmoji;
            this.localPlayer.deathPhrase = selectedDeathPhrase;
            
            // Update cursor emoji
            this.ui.updateCursorEmoji(selectedEmoji);
            
            // Hide settings panel
            settingsPanel.classList.add('hidden');
            
            // Play a success sound
            this.playTone(500, 0.1, 'sine');
            
            // Send updated player info to server
            if (this.useMultiplayer && this.websocket.isPlayerConnected()) {
                this.websocket.sendPlayerInfo(
                    this.localPlayer.name,
                    this.localPlayer.emoji, 
                    this.localPlayer.deathPhrase
                );
            }
        });
    }
    
    updateSelectedOptions(options, selectedValue) {
        // Clear all selected classes first
        options.forEach(opt => opt.classList.remove('selected'));
        
        // Find and select the matching option
        for (const option of options) {
            const value = option.getAttribute('data-emoji') || option.getAttribute('data-phrase');
            if (value === selectedValue) {
                option.classList.add('selected');
                break;
            }
        }
    }
    
    // Audio methods from here on remain unchanged...
    playTone(frequency, duration, type = 'sine') {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playSlideDown(startFreq, endFreq, duration) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playSlideUp(startFreq, endFreq, duration) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
        
        gainNode.gain.setValueAtTime(0.01, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.2, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playSplat() {
        // Create more complex "splat" sound using oscillator and noise
        const duration = 0.3;
        
        // Check if AudioWorklet is available
        if (!this.useAudioWorklet) {
            // Fallback using audio buffer for noise
            this.playSplatFallback(duration);
            return;
        }
        
        // Noise component using AudioWorkletNode
        const noiseNode = new AudioWorkletNode(this.audioContext, 'noise-processor');
        const noiseGain = this.audioContext.createGain();
        
        noiseGain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        noiseNode.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        
        // Pitched component
        const osc = this.audioContext.createOscillator();
        const oscGain = this.audioContext.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + duration);
        
        oscGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        osc.connect(oscGain);
        oscGain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
        
        // Disconnect noise node after the sound completes
        setTimeout(() => {
            noiseNode.disconnect();
        }, duration * 1000 + 100);
    }
    
    playSplatFallback(duration) {
        // Create a simpler "splat" sound effect without using AudioWorkletNode
        
        // Create buffer for white noise
        const bufferSize = this.audioContext.sampleRate * duration;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        // Fill buffer with white noise
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        // Create noise source
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        // Create gain node for noise
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        // Connect noise
        noiseSource.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        
        // Create oscillator for pitched component
        const osc = this.audioContext.createOscillator();
        const oscGain = this.audioContext.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + duration);
        
        oscGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        // Connect oscillator
        osc.connect(oscGain);
        oscGain.connect(this.audioContext.destination);
        
        // Start and stop the sounds
        noiseSource.start();
        osc.start();
        noiseSource.stop(this.audioContext.currentTime + duration);
        osc.stop(this.audioContext.currentTime + duration);
    }
}

// Start the game when the page is loaded
window.addEventListener('load', () => {
    const game = new Game();
    game.start();
}); 