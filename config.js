// Game Configuration
const CONFIG = {
    // Money ladder configuration
    LADDER: [
        { level: 1, amount: 100 },
        { level: 2, amount: 200 },
        { level: 3, amount: 300 },
        { level: 4, amount: 500 },
        { level: 5, amount: 1000 }, // checkpoint
        { level: 6, amount: 2000 },
        { level: 7, amount: 4000 },
        { level: 8, amount: 8000 },
        { level: 9, amount: 16000 },
        { level: 10, amount: 32000 }, // checkpoint
        { level: 11, amount: 64000 },
        { level: 12, amount: 125000 },
        { level: 13, amount: 250000 },
        { level: 14, amount: 500000 },
        { level: 15, amount: 1000000 },
    ],

    // Checkpoint levels (safe money levels)
    CHECKPOINTS: new Set([5, 10]),

    // Maximum level
    MAX_LEVEL: 15,

    // Timer settings (seconds)
    TIMER: {
        easy: 30,    // levels 1-5
        medium: 45,  // levels 6-10
        hard: 60     // levels 11-15
    },

    // Default categories (fallback when API is unavailable)
    FALLBACK_CATEGORIES: [
        'General Knowledge',
        'Science',
        'Geography',
        'Movies',
        'Sports',
        'History',
        'Music',
        'Technology',
        'Physics',
        'Literature',
        'Mathematics',
        'Chemistry',
        'World History',
    ],

    // LLM Configuration
    LLM: {
        // Set these in your environment or modify directly
        // For local development, you can set them here temporarily
        // In production, use environment variables
        
        // OpenAI Configuration
        OPENAI_API_KEY: '', // Set your OpenAI API key
        OPENAI_MODEL: 'gpt-4o-mini',
        OPENAI_BASE_URL: 'https://api.openai.com/v1',
        
        // Anthropic Configuration  
        ANTHROPIC_API_KEY: '', // Set your Anthropic API key
        ANTHROPIC_MODEL: 'claude-3-5-sonnet-latest',
        
        // Default provider: 'openai' or 'anthropic'
        DEFAULT_PROVIDER: 'openai',
        
        // Fallback questions when LLM is not available
        FALLBACK_QUESTIONS: [
            {
                id: 'fallback-1',
                category: 'General Knowledge',
                difficulty: 'easy',
                prompt: 'What is the capital of France?',
                choices: ['London', 'Berlin', 'Paris', 'Madrid'],
                correctIndex: 2
            },
            {
                id: 'fallback-2',
                category: 'Science',
                difficulty: 'easy',
                prompt: 'What is H2O commonly known as?',
                choices: ['Oxygen', 'Hydrogen', 'Water', 'Carbon Dioxide'],
                correctIndex: 2
            },
            {
                id: 'fallback-3',
                category: 'Geography',
                difficulty: 'easy',
                prompt: 'Which continent is Egypt in?',
                choices: ['Asia', 'Africa', 'Europe', 'South America'],
                correctIndex: 1
            },
            {
                id: 'fallback-4',
                category: 'Movies',
                difficulty: 'easy',
                prompt: 'Who directed the movie "Jaws"?',
                choices: ['George Lucas', 'Steven Spielberg', 'Martin Scorsese', 'Francis Ford Coppola'],
                correctIndex: 1
            },
            {
                id: 'fallback-5',
                category: 'Sports',
                difficulty: 'medium',
                prompt: 'In which sport would you perform a slam dunk?',
                choices: ['Tennis', 'Basketball', 'Football', 'Baseball'],
                correctIndex: 1
            },
            {
                id: 'fallback-6',
                category: 'History',
                difficulty: 'medium',
                prompt: 'In which year did World War II end?',
                choices: ['1944', '1945', '1946', '1947'],
                correctIndex: 1
            },
            {
                id: 'fallback-7',
                category: 'Science',
                difficulty: 'medium',
                prompt: 'What is the chemical symbol for gold?',
                choices: ['Go', 'Gd', 'Au', 'Ag'],
                correctIndex: 2
            },
            {
                id: 'fallback-8',
                category: 'Technology',
                difficulty: 'medium',
                prompt: 'Who co-founded Microsoft along with Bill Gates?',
                choices: ['Steve Jobs', 'Paul Allen', 'Larry Page', 'Mark Zuckerberg'],
                correctIndex: 1
            },
            {
                id: 'fallback-9',
                category: 'Literature',
                difficulty: 'hard',
                prompt: 'Who wrote the novel "1984"?',
                choices: ['Aldous Huxley', 'Ray Bradbury', 'George Orwell', 'Kurt Vonnegut'],
                correctIndex: 2
            },
            {
                id: 'fallback-10',
                category: 'Science',
                difficulty: 'hard',
                prompt: 'What is the speed of light in a vacuum?',
                choices: ['299,792,458 m/s', '300,000,000 m/s', '299,800,000 m/s', '298,000,000 m/s'],
                correctIndex: 0
            },
            {
                id: 'fallback-11',
                category: 'Geography',
                difficulty: 'hard',
                prompt: 'What is the smallest country in the world?',
                choices: ['Monaco', 'San Marino', 'Vatican City', 'Liechtenstein'],
                correctIndex: 2
            },
            {
                id: 'fallback-12',
                category: 'History',
                difficulty: 'hard',
                prompt: 'Which ancient wonder of the world was located in Alexandria?',
                choices: ['Hanging Gardens', 'Lighthouse of Alexandria', 'Colossus of Rhodes', 'Temple of Artemis'],
                correctIndex: 1
            },
            {
                id: 'fallback-13',
                category: 'Mathematics',
                difficulty: 'hard',
                prompt: 'What is the value of π (pi) to the first 4 decimal places?',
                choices: ['3.1415', '3.1416', '3.1417', '3.1414'],
                correctIndex: 1
            },
            {
                id: 'fallback-14',
                category: 'Physics',
                difficulty: 'hard',
                prompt: 'What is the name of the theoretical boundary around a black hole?',
                choices: ['Event Horizon', 'Photon Sphere', 'Ergosphere', 'Singularity'],
                correctIndex: 0
            },
            {
                id: 'fallback-15',
                category: 'World History',
                difficulty: 'hard',
                prompt: 'Which empire was ruled by Cyrus the Great?',
                choices: ['Roman Empire', 'Persian Empire', 'Ottoman Empire', 'Byzantine Empire'],
                correctIndex: 1
            }
        ]
    }
};

// Utility functions
function getLevelDifficulty(level) {
    if (level <= 5) return 'easy';
    if (level <= 10) return 'medium';
    return 'hard';
}

function getTimeForLevel(level) {
    const difficulty = getLevelDifficulty(level);
    return CONFIG.TIMER[difficulty];
}

function getPrizeForLevel(level) {
    const found = CONFIG.LADDER.find(l => l.level === level);
    return found ? found.amount : 0;
}

function isCheckpoint(level) {
    return CONFIG.CHECKPOINTS.has(level);
}

function getLastSafeLevel(level) {
    if (level >= 10) return 10;
    if (level >= 5) return 5;
    return 0;
}

function formatMoney(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}