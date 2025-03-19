class WebSocketManager {
    constructor(serverUrl = "ws://localhost:8000") {
        this.serverUrl = serverUrl;
        this.socket = null;
        this.isConnected = false;
        this.playerId = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 2000; // 2 seconds
        this.debug = false; // Disable debug logging by default
        
        // Callbacks for different message types
        this.callbacks = {
            init: null,
            playerJoined: null,
            playerLeft: null,
            positionUpdate: null,
            playerDied: null,
            playerRespawned: null,
            leaderboardUpdate: null,
            hitSuccess: null,
            hitMiss: null,
            error: null,
            playerUpdated: null
        };
        
        // Ping interval to keep connection alive
        this.pingInterval = null;
    }
    
    connect() {
        if (this.socket) {
            this.log("WebSocket already connected or connecting");
            return;
        }
        
        this.log(`Connecting to WebSocket server at ${this.serverUrl}`);
        
        try {
            // Create WebSocket connection
            this.socket = new WebSocket(this.serverUrl);
            
            // Set up event handlers
            this.socket.onopen = this.handleOpen.bind(this);
            this.socket.onmessage = this.handleMessage.bind(this);
            this.socket.onclose = this.handleClose.bind(this);
            this.socket.onerror = this.handleError.bind(this);
        } catch (error) {
            this.error("Failed to create WebSocket connection:", error);
            this.tryReconnect();
        }
    }
    
    handleOpen() {
        this.log("WebSocket connection established");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Start ping interval to keep connection alive
        this.pingInterval = setInterval(() => {
            if (this.isConnected && this.playerId) {
                this.send({
                    type: "ping",
                    player_id: this.playerId
                });
            }
        }, 15000); // Send ping every 15 seconds
    }
    
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            if (!data || !data.type) {
                this.error("Invalid message received:", data);
                return;
            }
            
            // Only log detailed information if debug mode is enabled
            if (this.debug && data.type !== "position_update") {
                this.log(`Received message type: ${data.type}`);
            }
            
            // Handle different message types
            switch (data.type) {
                case "init":
                    this.playerId = data.playerId;
                    this.log(`Initialized with player ID: ${this.playerId}`);
                    if (this.callbacks.init) this.callbacks.init(data);
                    break;
                    
                case "player_joined":
                    if (this.debug) {
                        this.log(`Player joined: ${data.name || 'Unknown'} (${data.playerId})`);
                    }
                    if (this.callbacks.playerJoined) this.callbacks.playerJoined(data);
                    break;
                    
                case "player_left":
                    if (this.debug) {
                        this.log(`Player left: ${data.playerId}`);
                    }
                    if (this.callbacks.playerLeft) this.callbacks.playerLeft(data);
                    break;
                    
                case "position_update":
                    if (this.callbacks.positionUpdate) this.callbacks.positionUpdate(data);
                    break;
                    
                case "player_died":
                    if (this.debug) {
                        this.log(`Player died: ${data.playerId}`);
                    }
                    if (this.callbacks.playerDied) this.callbacks.playerDied(data);
                    break;
                    
                case "player_respawned":
                    if (this.debug) {
                        this.log(`Player respawned: ${data.playerId} at (${data.x}, ${data.y})`);
                    }
                    if (this.callbacks.playerRespawned) this.callbacks.playerRespawned(data);
                    break;
                    
                case "player_updated":
                    if (this.debug) {
                        this.log(`Player updated: ${data.name || 'Unknown'} (${data.playerId})`);
                    }
                    if (this.callbacks.playerUpdated) this.callbacks.playerUpdated(data);
                    break;
                    
                case "leaderboard_update":
                    if (this.debug) {
                        this.log("Leaderboard update:", data.leaderboard?.length || 0, "entries");
                    }
                    if (this.callbacks.leaderboardUpdate) this.callbacks.leaderboardUpdate(data);
                    break;
                    
                case "hit_success":
                    if (this.debug) {
                        this.log(`Hit success! Target: ${data.targetId}, New score: ${data.newScore}`);
                    }
                    if (this.callbacks.hitSuccess) this.callbacks.hitSuccess(data);
                    break;
                    
                case "hit_miss":
                    if (this.debug) {
                        this.log(`Hit miss at (${data.x}, ${data.y})`);
                    }
                    if (this.callbacks.hitMiss) this.callbacks.hitMiss(data);
                    break;
                    
                case "error":
                    this.error(`Server error: ${data.message}`);
                    if (this.callbacks.error) this.callbacks.error(data);
                    break;
                    
                case "pong":
                    // Just a heartbeat response, no need to handle
                    break;
                    
                default:
                    this.log(`Unknown message type: ${data.type}`);
                    break;
            }
        } catch (error) {
            this.error("Error processing message:", error);
        }
    }
    
    handleClose(event) {
        this.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
        this.isConnected = false;
        this.socket = null;
        
        // Clear ping interval
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        
        // Attempt to reconnect if not closing intentionally
        if (event.code !== 1000) {
            this.tryReconnect();
        }
    }
    
    handleError(error) {
        this.error("WebSocket error:", error);
        // The close handler will be called automatically after an error
    }
    
    tryReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.log("Max reconnect attempts reached, giving up");
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
        
        this.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, delay);
    }
    
    disconnect() {
        if (this.socket && this.isConnected) {
            this.log("Closing WebSocket connection");
            this.socket.close(1000, "Disconnecting");
            
            // Clear ping interval
            if (this.pingInterval) {
                clearInterval(this.pingInterval);
                this.pingInterval = null;
            }
        }
    }
    
    send(data) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            this.error("Cannot send message - WebSocket is not open");
            return false;
        }
        
        try {
            // Add player ID to every message if available
            if (this.playerId && !data.player_id) {
                data.player_id = this.playerId;
            }
            
            const message = JSON.stringify(data);
            this.socket.send(message);
            return true;
        } catch (error) {
            this.error("Error sending message:", error);
            return false;
        }
    }
    
    // Utility logging methods
    log(...args) {
        console.log("[WebSocket]", ...args);
    }
    
    error(...args) {
        console.error("[WebSocket]", ...args);
    }
    
    sendPlayerInfo(name, emoji, deathPhrase) {
        this.log(`Sending player info: ${name} (${emoji})`);
        return this.send({
            type: "player_info",
            name: name,
            emoji: emoji,
            deathPhrase: deathPhrase
        });
    }
    
    sendPositionUpdate(x, y) {
        return this.send({
            type: "position_update",
            x: x,
            y: y
        });
    }
    
    sendPlayerClick(x, y) {
        this.log(`Sending player click at (${x}, ${y})`);
        return this.send({
            type: "player_click",
            x: x,
            y: y
        });
    }
    
    sendButtonClick() {
        this.log("Sending button click event");
        return this.send({
            type: "button_click"
        });
    }
    
    // Setup callback handlers
    onInit(callback) {
        this.callbacks.init = callback;
    }
    
    onPlayerJoined(callback) {
        this.callbacks.playerJoined = callback;
    }
    
    onPlayerLeft(callback) {
        this.callbacks.playerLeft = callback;
    }
    
    onPositionUpdate(callback) {
        this.callbacks.positionUpdate = callback;
    }
    
    onPlayerDied(callback) {
        this.callbacks.playerDied = callback;
    }
    
    onPlayerRespawned(callback) {
        this.callbacks.playerRespawned = callback;
    }
    
    onLeaderboardUpdate(callback) {
        this.callbacks.leaderboardUpdate = callback;
    }
    
    onHitSuccess(callback) {
        this.callbacks.hitSuccess = callback;
    }
    
    onHitMiss(callback) {
        this.callbacks.hitMiss = callback;
    }
    
    onError(callback) {
        this.callbacks.error = callback;
    }
    
    onPlayerUpdated(callback) {
        this.callbacks.playerUpdated = callback;
    }
    
    isPlayerConnected() {
        return this.isConnected && this.playerId !== null;
    }
} 