class StartScreen {
    constructor() {
        // DOM elements
        this.startScreen = document.getElementById('start-screen');
        this.nameInput = document.getElementById('player-name');
        this.nameCharCount = document.getElementById('name-char-count');
        this.emojiOptions = document.querySelectorAll('.emoji-option');
        this.phraseOptions = document.querySelectorAll('.phrase-option');
        this.startButton = document.getElementById('start-game-btn');
        
        // Initialize player data from default values
        this.playerName = this.nameInput.value.trim();
        this.playerEmoji = '🪰';
        this.deathPhrase = 'SPLAT!';
        
        // Update character count for the default name
        this.nameCharCount.textContent = this.playerName.length;
        
        // Validate form on initialization
        this.validateForm();
        
        // Event to notify when player is ready to start
        this.onPlayerReady = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Name input event
        this.nameInput.addEventListener('input', (e) => {
            this.playerName = e.target.value.trim();
            this.nameCharCount.textContent = this.playerName.length;
            this.validateForm();
        });
        
        // Emoji selection
        this.emojiOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                this.emojiOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Update player emoji
                this.playerEmoji = option.getAttribute('data-emoji');
            });
        });
        
        // Death phrase selection
        this.phraseOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                this.phraseOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Update death phrase
                this.deathPhrase = option.getAttribute('data-phrase');
            });
        });
        
        // Start button
        this.startButton.addEventListener('click', () => {
            if (this.validateForm()) {
                this.hide();
                if (this.onPlayerReady) {
                    this.onPlayerReady({
                        name: this.playerName,
                        emoji: this.playerEmoji,
                        deathPhrase: this.deathPhrase
                    });
                }
            }
        });
    }
    
    validateForm() {
        const isValid = this.playerName.length > 0;
        this.startButton.disabled = !isValid;
        return isValid;
    }
    
    show() {
        this.startScreen.style.display = 'flex';
    }
    
    hide() {
        this.startScreen.style.display = 'none';
    }
    
    setOnPlayerReady(callback) {
        this.onPlayerReady = callback;
    }
    
    getDefaultPlayerInfo() {
        // Return default player info if the start screen is skipped
        return {
            name: 'Player',
            emoji: '🪰',
            deathPhrase: 'SPLAT!'
        };
    }
} 