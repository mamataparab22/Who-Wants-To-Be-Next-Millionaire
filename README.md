# Who Wants To Be A Millionaire - Single Page Application

A simplified single-page version of the classic "Who Wants to Be a Millionaire" game with LLM integration for dynamic question generation.

## Features

- **Complete Game Experience**: All 15 levels from $100 to $1,000,000
- **Money Ladder**: Visual progression with checkpoints at levels 5 ($1,000) and 10 ($32,000)
- **Three Lifelines**:
  - 50:50 (eliminates two wrong answers)
  - Ask the Audience (shows poll results)
  - Switch Question (gets a new question)
- **Timer System**: 30/45/60 seconds based on difficulty level
- **Category Selection**: Choose from various knowledge categories
- **LLM Integration**: Dynamic question generation using OpenAI or Anthropic
- **Responsive Design**: Works on desktop and mobile devices
- **Fallback Questions**: Built-in questions when LLM is unavailable

## Setup

### Basic Setup (No LLM)
1. Open `index.html` in a web browser
2. The game will use built-in fallback questions

### LLM Integration Setup

#### Option 1: OpenAI
1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Edit `config.js` and set:
   ```javascript
   CONFIG.LLM.OPENAI_API_KEY = 'your-api-key-here';
   CONFIG.LLM.DEFAULT_PROVIDER = 'openai';
   ```

#### Option 2: Anthropic (Claude)
1. Get an API key from [Anthropic](https://console.anthropic.com/)
2. Edit `config.js` and set:
   ```javascript
   CONFIG.LLM.ANTHROPIC_API_KEY = 'your-api-key-here';
   CONFIG.LLM.DEFAULT_PROVIDER = 'anthropic';
   ```

### Local Server (Recommended for LLM)
Due to CORS restrictions, LLM integration works best when served from a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Game Rules

1. **Objective**: Answer 15 questions correctly to win $1,000,000
2. **Money Ladder**: Each correct answer increases your winnings
3. **Safe Levels**: 
   - Level 5 ($1,000) - guaranteed minimum
   - Level 10 ($32,000) - guaranteed minimum
4. **Timer**: Limited time per question based on difficulty
5. **Lifelines**: Each can only be used once per game
6. **Walk Away**: Leave with current guaranteed amount at any time

## Customization

### Adding Questions
Edit the `FALLBACK_QUESTIONS` array in `config.js` to add your own questions:

```javascript
{
    id: 'unique-id',
    category: 'Your Category',
    difficulty: 'easy', // easy, medium, or hard
    prompt: 'Your question text?',
    choices: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex: 0 // 0-3 for A-D
}
```

### Modifying Game Settings
Edit the `CONFIG` object in `config.js`:
- `TIMER`: Adjust time limits per difficulty
- `LADDER`: Modify prize amounts
- `CHECKPOINTS`: Change safe levels

### Styling
Modify `styles.css` to customize the appearance:
- Colors and gradients
- Fonts and sizes
- Layout and spacing
- Animations and effects

## Files Structure

- `index.html` - Main HTML structure
- `styles.css` - All styling and animations
- `config.js` - Game configuration and settings
- `game.js` - Core game logic and LLM integration
- `app.js` - UI management and event handling

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome 60+, Firefox 55+, Safari 12+, Edge 79+

## Troubleshooting

### LLM Not Working
- Check API keys are correctly set
- Verify you're serving from a local server (not file://)
- Check browser console for error messages
- Game will fall back to built-in questions

### Performance Issues
- Reduce timer duration in `CONFIG.TIMER`
- Minimize browser extensions
- Close other tabs/applications

### Mobile Issues
- Use landscape orientation for best experience
- Ensure touch targets are accessible
- Check viewport meta tag is present

## License

This is a demonstration project. Actual "Who Wants to Be a Millionaire" trademark is owned by Sony Pictures Television.

## Contributing

Feel free to submit issues and enhancement requests!
