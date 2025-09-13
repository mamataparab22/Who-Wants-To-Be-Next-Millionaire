// Game State Management
class MillionaireGame {
    constructor() {
        this.state = this.getInitialState();
        this.timer = null;
        this.selectedChoice = null;
    }

    getInitialState() {
        return {
            level: 1,
            usedLifelines: {
                fiftyFifty: false,
                audience: false,
                switch: false
            },
            currentQuestionIndex: 0,
            questions: [],
            seenQuestionIds: [],
            eliminatedChoices: [],
            lockedChoice: null,
            answered: false,
            correct: null,
            pollResults: null,
            remainingTime: getTimeForLevel(1),
            infoMessage: null,
            winnings: 0,
            lastSafeLevel: 0,
            gameOver: false,
            selectedCategories: []
        };
    }

    // LLM Integration for Question Generation
    async generateQuestions(categories, count = 15) {
        // Try to use LLM first, fall back to predefined questions
        try {
            const questions = await this.callLLM(categories, count);
            if (questions && questions.length >= count) {
                return questions;
            }
        } catch (error) {
            console.warn('LLM failed, using fallback questions:', error.message);
        }

        // Fallback to predefined questions
        return this.getFallbackQuestions(categories, count);
    }

    async callLLM(categories, count) {
        const provider = CONFIG.LLM.DEFAULT_PROVIDER;
        
        if (provider === 'openai') {
            return await this.callOpenAI(categories, count);
        } else if (provider === 'anthropic') {
            return await this.callAnthropic(categories, count);
        }
        
        throw new Error('No LLM provider configured');
    }

    async callOpenAI(categories, count) {
        const apiKey = CONFIG.LLM.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const prompt = this.createQuestionPrompt(categories, count);
        
        const response = await fetch(`${CONFIG.LLM.OPENAI_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: CONFIG.LLM.OPENAI_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a quiz question generator for "Who Wants to Be a Millionaire". Generate questions in the exact JSON format requested.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.8
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const result = JSON.parse(content);
        
        return this.validateAndFormatQuestions(result.questions);
    }

    async callAnthropic(categories, count) {
        const apiKey = CONFIG.LLM.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('Anthropic API key not configured');
        }

        const prompt = this.createQuestionPrompt(categories, count);
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: CONFIG.LLM.ANTHROPIC_MODEL,
                max_tokens: 4000,
                messages: [
                    {
                        role: 'user',
                        content: `You are a quiz question generator for "Who Wants to Be a Millionaire". Generate questions in the exact JSON format requested.\n\n${prompt}`
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.content[0].text;
        
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in Anthropic response');
        }
        
        const result = JSON.parse(jsonMatch[0]);
        return this.validateAndFormatQuestions(result.questions);
    }

    createQuestionPrompt(categories, count) {
        const difficulties = ['easy', 'easy', 'easy', 'easy', 'easy', 'medium', 'medium', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard', 'hard', 'hard'];
        
        return `Generate ${count} unique "Who Wants to Be a Millionaire" style questions. 

Categories to choose from: ${categories.join(', ')}

Difficulty distribution:
- Questions 1-5: easy
- Questions 6-10: medium  
- Questions 11-15: hard

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": "unique-id-1",
      "category": "chosen category",
      "difficulty": "easy|medium|hard",
      "prompt": "Clear, concise question text?",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0
    }
  ]
}

Requirements:
- Each question must have exactly 4 choices
- correctIndex must be 0, 1, 2, or 3
- Questions should be factual and have one clear correct answer
- Avoid ambiguous or opinion-based questions
- Make questions challenging but fair for the difficulty level
- Ensure good variety across the selected categories`;
    }

    validateAndFormatQuestions(questions) {
        if (!Array.isArray(questions)) {
            throw new Error('Questions must be an array');
        }

        return questions.map((q, index) => {
            if (!q.prompt || !Array.isArray(q.choices) || q.choices.length !== 4) {
                throw new Error(`Invalid question format at index ${index}`);
            }
            
            if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) {
                throw new Error(`Invalid correctIndex at index ${index}`);
            }

            return {
                id: q.id || `generated-${Date.now()}-${index}`,
                category: q.category || 'General Knowledge',
                difficulty: q.difficulty || 'easy',
                prompt: q.prompt.trim(),
                choices: q.choices.map(c => c.trim()),
                correctIndex: q.correctIndex
            };
        });
    }

    getFallbackQuestions(categories, count) {
        // Filter fallback questions by categories and shuffle
        let availableQuestions = CONFIG.LLM.FALLBACK_QUESTIONS.filter(q => 
            categories.includes(q.category)
        );

        // If not enough questions in selected categories, use all fallback questions
        if (availableQuestions.length < count) {
            availableQuestions = [...CONFIG.LLM.FALLBACK_QUESTIONS];
        }

        // Shuffle and take required count
        const shuffled = this.shuffleArray([...availableQuestions]);
        return shuffled.slice(0, count);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Game Actions
    loadQuestions(questions) {
        this.state.questions = questions;
        this.state.seenQuestionIds = questions[0] ? [questions[0].id] : [];
    }

    selectChoice(index) {
        if (this.state.answered || this.state.gameOver) return;
        
        this.selectedChoice = index;
        this.updateUI();
    }

    lockIn() {
        if (this.selectedChoice === null || this.state.answered) return;
        
        this.state.lockedChoice = this.selectedChoice;
        this.state.answered = true;
        
        const currentQuestion = this.getCurrentQuestion();
        this.state.correct = this.selectedChoice === currentQuestion.correctIndex;
        
        this.stopTimer();
        this.showAnswer();
    }

    nextQuestion() {
        if (this.state.correct) {
            this.state.winnings = getPrizeForLevel(this.state.level);
            this.state.lastSafeLevel = getLastSafeLevel(this.state.level);
            
            if (this.state.level >= CONFIG.MAX_LEVEL) {
                this.state.gameOver = true;
                this.showResults('Congratulations! You\'re a MILLIONAIRE!');
                return;
            }
            
            this.state.level++;
        } else {
            this.state.gameOver = true;
            const safeAmount = getPrizeForLevel(getLastSafeLevel(this.state.level - 1));
            this.state.winnings = safeAmount;
            this.showResults('Game Over!');
            return;
        }

        // Reset for next question
        this.resetQuestionState();
        this.state.remainingTime = getTimeForLevel(this.state.level);
        this.updateUI();
        this.startTimer();
    }

    resetQuestionState() {
        this.state.answered = false;
        this.state.correct = null;
        this.state.lockedChoice = null;
        this.state.eliminatedChoices = [];
        this.state.pollResults = null;
        this.selectedChoice = null;
        this.state.currentQuestionIndex++;
    }

    // Lifelines
    useFiftyFifty() {
        if (this.state.usedLifelines.fiftyFifty || this.state.answered) return;
        
        this.state.usedLifelines.fiftyFifty = true;
        
        const currentQuestion = this.getCurrentQuestion();
        const correctIndex = currentQuestion.correctIndex;
        
        // Get indices of incorrect answers
        const incorrectIndices = [0, 1, 2, 3].filter(i => i !== correctIndex);
        
        // Randomly eliminate 2 incorrect answers
        const toEliminate = this.shuffleArray(incorrectIndices).slice(0, 2);
        this.state.eliminatedChoices = toEliminate;
        
        this.updateUI();
    }

    useAudiencePoll() {
        if (this.state.usedLifelines.audience || this.state.answered) return;
        
        this.state.usedLifelines.audience = true;
        
        const currentQuestion = this.getCurrentQuestion();
        const correctIndex = currentQuestion.correctIndex;
        
        // Generate realistic audience poll results
        // Correct answer gets higher percentage, but not always majority
        const results = [0, 0, 0, 0];
        
        // Base percentage for correct answer (40-70%)
        const correctPercentage = 40 + Math.random() * 30;
        results[correctIndex] = correctPercentage;
        
        // Distribute remaining percentage among other options
        let remaining = 100 - correctPercentage;
        for (let i = 0; i < 4; i++) {
            if (i !== correctIndex && remaining > 0) {
                if (this.state.eliminatedChoices.includes(i)) {
                    results[i] = 0;
                } else {
                    const portion = Math.random() * remaining * 0.6; // Don't use all remaining
                    results[i] = Math.max(5, portion); // Minimum 5%
                    remaining -= results[i];
                }
            }
        }
        
        // Distribute any remaining percentage
        if (remaining > 0) {
            const nonEliminatedIndices = [0, 1, 2, 3].filter(i => 
                i !== correctIndex && !this.state.eliminatedChoices.includes(i)
            );
            if (nonEliminatedIndices.length > 0) {
                const randomIndex = nonEliminatedIndices[Math.floor(Math.random() * nonEliminatedIndices.length)];
                results[randomIndex] += remaining;
            } else {
                results[correctIndex] += remaining;
            }
        }
        
        // Round to integers
        this.state.pollResults = results.map(r => Math.round(r));
        
        this.updateUI();
        this.showPollResults();
    }

    async useSwitchQuestion() {
        if (this.state.usedLifelines.switch || this.state.answered) return;
        
        this.state.usedLifelines.switch = true;
        
        try {
            // Try to get a new question from LLM
            const newQuestions = await this.generateQuestions(this.state.selectedCategories, 1);
            
            if (newQuestions.length > 0 && !this.state.seenQuestionIds.includes(newQuestions[0].id)) {
                // Replace current question
                this.state.questions[this.state.currentQuestionIndex] = newQuestions[0];
                this.state.seenQuestionIds.push(newQuestions[0].id);
                
                // Reset question state
                this.state.eliminatedChoices = [];
                this.selectedChoice = null;
                
                this.updateUI();
                return;
            }
        } catch (error) {
            console.warn('Failed to get new question for switch lifeline:', error);
        }
        
        // Fallback: show info message that switch isn't available
        this.state.infoMessage = 'No alternative question available';
        this.updateUI();
        
        setTimeout(() => {
            this.state.infoMessage = null;
            this.updateUI();
        }, 3000);
    }

    walkAway() {
        this.state.gameOver = true;
        this.state.winnings = getPrizeForLevel(getLastSafeLevel(this.state.level - 1));
        this.stopTimer();
        this.showResults('You walked away with:');
    }

    // Timer Management
    startTimer() {
        this.stopTimer();
        
        this.timer = setInterval(() => {
            this.state.remainingTime--;
            
            if (this.state.remainingTime <= 0) {
                this.timeUp();
            } else {
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    timeUp() {
        this.stopTimer();
        this.state.answered = true;
        this.state.correct = false;
        this.state.gameOver = true;
        this.state.winnings = getPrizeForLevel(getLastSafeLevel(this.state.level - 1));
        this.showResults('Time\'s up! Game Over!');
    }

    // Helper Methods
    getCurrentQuestion() {
        return this.state.questions[this.state.currentQuestionIndex];
    }

    reset() {
        this.stopTimer();
        this.state = this.getInitialState();
        this.selectedChoice = null;
    }

    // UI Update Methods (to be implemented in app.js)
    updateUI() {
        if (typeof window !== 'undefined' && window.updateGameUI) {
            window.updateGameUI(this.state, this.selectedChoice);
        }
    }

    updateTimerDisplay() {
        if (typeof window !== 'undefined' && window.updateTimer) {
            window.updateTimer(this.state.remainingTime, getTimeForLevel(this.state.level));
        }
    }

    showAnswer() {
        if (typeof window !== 'undefined' && window.showAnswer) {
            window.showAnswer(this.state.correct, this.state.lockedChoice, this.getCurrentQuestion().correctIndex);
        }
    }

    showResults(title) {
        if (typeof window !== 'undefined' && window.showResults) {
            window.showResults(title, this.state.winnings);
        }
    }

    showPollResults() {
        if (typeof window !== 'undefined' && window.showPollResults) {
            window.showPollResults(this.state.pollResults);
        }
    }
}

// Global game instance
let game;