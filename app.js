// Main Application Logic
class MillionaireApp {
    constructor() {
        this.selectedCategories = new Set();
        this.init();
    }

    init() {
        // Initialize game
        game = new MillionaireGame();
        
        // Load categories
        this.loadCategories();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Show home screen
        this.showScreen('home-screen');
    }

    async loadCategories() {
        const categoryGrid = document.getElementById('category-selection');
        
        // Use fallback categories for this simple implementation
        const categories = CONFIG.FALLBACK_CATEGORIES;
        
        categoryGrid.innerHTML = '';
        
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-btn';
            button.textContent = category;
            button.addEventListener('click', () => this.toggleCategory(category, button));
            categoryGrid.appendChild(button);
        });
    }

    toggleCategory(category, button) {
        if (this.selectedCategories.has(category)) {
            this.selectedCategories.delete(category);
            button.classList.remove('selected');
        } else {
            this.selectedCategories.add(category);
            button.classList.add('selected');
        }
        
        // Update start button state
        const startBtn = document.getElementById('start-game');
        startBtn.disabled = this.selectedCategories.size === 0;
    }

    setupEventListeners() {
        // Home screen
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('close-error').addEventListener('click', () => this.hideError());
        
        // Game screen
        document.getElementById('lock-in').addEventListener('click', () => this.lockIn());
        document.getElementById('walk-away').addEventListener('click', () => this.walkAway());
        
        // Choices
        document.querySelectorAll('.choice').forEach((choice, index) => {
            choice.addEventListener('click', () => this.selectChoice(index));
        });
        
        // Lifelines
        document.getElementById('fifty-fifty').addEventListener('click', () => this.useFiftyFifty());
        document.getElementById('audience-poll').addEventListener('click', () => this.useAudiencePoll());
        document.getElementById('switch-question').addEventListener('click', () => this.useSwitchQuestion());
        
        // Results screen
        document.getElementById('play-again').addEventListener('click', () => this.playAgain());
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    async startGame() {
        if (this.selectedCategories.size === 0) return;
        
        const startBtn = document.getElementById('start-game');
        const loadingOverlay = document.getElementById('loading-overlay');
        
        startBtn.disabled = true;
        loadingOverlay.classList.remove('hidden');
        
        try {
            const categories = Array.from(this.selectedCategories);
            game.state.selectedCategories = categories;
            
            const questions = await game.generateQuestions(categories, 15);
            game.loadQuestions(questions);
            
            // Initialize game UI
            this.setupGameUI();
            this.showScreen('game-screen');
            
            // Start timer
            game.startTimer();
            
        } catch (error) {
            this.showError(error.message || 'Failed to start game. Please try again.');
        } finally {
            startBtn.disabled = false;
            loadingOverlay.classList.add('hidden');
        }
    }

    setupGameUI() {
        this.updateMoneyLadder();
        if (window.updateGameUI) {
            window.updateGameUI(game.state, null);
        }
    }

    updateMoneyLadder() {
        const ladderList = document.getElementById('ladder-list');
        ladderList.innerHTML = '';
        
        CONFIG.LADDER.forEach(item => {
            const ladderItem = document.createElement('div');
            ladderItem.className = 'ladder-item';
            ladderItem.textContent = `${item.level}. ${formatMoney(item.amount)}`;
            
            if (isCheckpoint(item.level)) {
                ladderItem.classList.add('checkpoint');
            }
            
            ladderList.appendChild(ladderItem);
        });
    }

    selectChoice(index) {
        game.selectChoice(index);
    }

    lockIn() {
        game.lockIn();
    }

    walkAway() {
        game.walkAway();
    }

    useFiftyFifty() {
        game.useFiftyFifty();
    }

    useAudiencePoll() {
        game.useAudiencePoll();
    }

    useSwitchQuestion() {
        game.useSwitchQuestion();
    }

    playAgain() {
        game.reset();
        this.selectedCategories.clear();
        
        // Reset category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Reset start button
        document.getElementById('start-game').disabled = true;
        
        this.showScreen('home-screen');
    }

    showError(message) {
        document.getElementById('error-message').textContent = message;
        document.getElementById('error-modal').classList.remove('hidden');
    }

    hideError() {
        document.getElementById('error-modal').classList.add('hidden');
    }
}

// Global UI update functions (called by game)
window.updateGameUI = function(state, selectedChoice) {
    // Update level and prize
    document.getElementById('current-level').textContent = `Level ${state.level}`;
    document.getElementById('current-prize').textContent = formatMoney(getPrizeForLevel(state.level));
    
    // Update money ladder highlighting
    document.querySelectorAll('.ladder-item').forEach((item, index) => {
        const level = CONFIG.LADDER[index].level;
        item.classList.remove('current', 'won');
        
        if (level === state.level && !state.gameOver) {
            item.classList.add('current');
        } else if (level < state.level || (state.gameOver && state.correct && level === state.level)) {
            item.classList.add('won');
        }
    });
    
    // Update question
    const currentQuestion = state.questions[state.currentQuestionIndex];
    if (currentQuestion) {
        document.getElementById('question-text').textContent = currentQuestion.prompt;
        
        // Update choices
        document.querySelectorAll('.choice').forEach((choice, index) => {
            const choiceText = choice.querySelector('.choice-text');
            choiceText.textContent = currentQuestion.choices[index];
            
            // Reset classes
            choice.classList.remove('selected', 'correct', 'incorrect', 'eliminated');
            choice.disabled = false;
            
            // Apply current state
            if (state.eliminatedChoices.includes(index)) {
                choice.classList.add('eliminated');
                choice.disabled = true;
            }
            
            if (selectedChoice === index) {
                choice.classList.add('selected');
            }
            
            if (state.answered) {
                choice.disabled = true;
                if (index === currentQuestion.correctIndex) {
                    choice.classList.add('correct');
                } else if (index === state.lockedChoice) {
                    choice.classList.add('incorrect');
                }
            }
        });
    }
    
    // Update controls
    const lockBtn = document.getElementById('lock-in');
    lockBtn.disabled = selectedChoice === null || state.answered;
    
    // Update lifelines
    document.getElementById('fifty-fifty').disabled = state.usedLifelines.fiftyFifty || state.answered;
    document.getElementById('audience-poll').disabled = state.usedLifelines.audience || state.answered;
    document.getElementById('switch-question').disabled = state.usedLifelines.switch || state.answered;
    
    // Show info message if any
    if (state.infoMessage) {
        // You could add a toast notification here
        console.log('Info:', state.infoMessage);
    }
};

window.updateTimer = function(remainingTime, totalTime) {
    document.getElementById('timer-text').textContent = remainingTime;
    
    const timerBar = document.getElementById('timer-bar');
    const percentage = (remainingTime / totalTime) * 100;
    timerBar.style.setProperty('--timer-width', `${percentage}%`);
    
    // Add the timer bar animation via CSS
    if (!document.querySelector('#timer-style')) {
        const style = document.createElement('style');
        style.id = 'timer-style';
        style.textContent = `
            .timer-bar::after { width: var(--timer-width, 100%); }
        `;
        document.head.appendChild(style);
    }
};

window.showAnswer = function(correct, lockedChoice, correctIndex) {
    setTimeout(() => {
        if (correct) {
            // Show celebration, then continue
            setTimeout(() => {
                if (game.state.level >= CONFIG.MAX_LEVEL) {
                    game.showResults('🎉 CONGRATULATIONS! YOU\'RE A MILLIONAIRE! 🎉');
                } else {
                    // Continue to next question
                    game.nextQuestion();
                }
            }, 3000);
        } else {
            // Show game over after a delay
            setTimeout(() => {
                game.showResults('Game Over!');
            }, 3000);
        }
    }, 2000);
};

window.showResults = function(title, winnings) {
    document.getElementById('results-title').textContent = title;
    document.getElementById('final-score').textContent = `You won: ${formatMoney(winnings)}`;
    
    setTimeout(() => {
        app.showScreen('results-screen');
    }, 1000);
};

window.showPollResults = function(results) {
    const pollDiv = document.getElementById('poll-results');
    
    results.forEach((percentage, index) => {
        const bar = pollDiv.querySelector(`[data-choice="${index}"] .poll-bar-fill`);
        const text = pollDiv.querySelector(`[data-choice="${index}"].poll-percentage`);
        
        if (bar && text) {
            bar.style.setProperty('--poll-width', `${percentage}%`);
            text.textContent = `${percentage}%`;
        }
    });
    
    // Add CSS for poll bar animation
    if (!document.querySelector('#poll-style')) {
        const style = document.createElement('style');
        style.id = 'poll-style';
        style.textContent = `
            .poll-bar-fill::after { width: var(--poll-width, 0%); }
        `;
        document.head.appendChild(style);
    }
    
    pollDiv.classList.remove('hidden');
    
    // Hide after 10 seconds
    setTimeout(() => {
        pollDiv.classList.add('hidden');
    }, 10000);
};

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MillionaireApp();
});