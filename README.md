# Fly PvP Clicker

A browser-based HTML5/JavaScript game where players control a fly (represented by the cursor) and try to click other players while avoiding a central "Don't Touch Me" button.

## Game Overview

- Players control their fly using the mouse cursor.
- Clicking on another player's fly will eliminate that player.
- If the player clicks the central "Don't Touch Me" button, they die immediately.
- Upon death, the player sees a "You Died" banner for 5 seconds before respawning.
- The game includes a real-time scoreboard showing players' scores.

## Technical Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5 Canvas API, CSS3
- **Communication**: WebSockets (prepared for backend integration)

## Features

- **Solo Play**: Play with AI-controlled flies when no WebSocket connection is available.
- **Responsive Design**: Works across different screen sizes.
- **Death & Respawn**: Players respawn after 5 seconds at a random location.
- **AI Simulation**: 7 AI flies move randomly and avoid the central button.

## How to Run

1. Clone or download this repository.
2. Open `index.html` in a modern web browser.
3. Click on other flies to increase your score, but avoid the central button!

## Future Development

- Integration with a Python FastAPI backend for real multiplayer experience.
- Player customization options.
- Different game modes.
- Global leaderboard.

## License

MIT 