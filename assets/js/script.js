// Global variables
let scenarioData;
let currentSceneIndex = 0;
let score = 0;
let timeRemaining = 60;
let timerInterval;
let isPaused = false;
let errorScenes = [];
let isErrorMode = false;

// Function to populate the UI with a scene from the JSON data
function populateScene(sceneIndex) {
    // Get the current scene data
    const scene = scenarioData.scenarioScenes[sceneIndex];
    
    if (!scene) {
        console.error("Scene not found at index:", sceneIndex);
        return;
    }
    
    // Update pot and blind info
    document.getElementById('bb-amount').textContent = scene.bigBlind.toLocaleString();
    document.getElementById('pot-amount').textContent = scene.pot.toLocaleString();
    document.getElementById('to-call').textContent = scene.toGo.toLocaleString();
    
    // Update hero info
    document.getElementById('hero-stack').textContent = scene.heroStack.toLocaleString();
    document.getElementById('hero-commit').textContent = scene.heroCommit.toLocaleString();
    
    // Clear existing cards
    const boardArea = document.getElementById('board-area');
    const heroCardsArea = document.getElementById('hero-cards');
    
    boardArea.innerHTML = '';
    heroCardsArea.innerHTML = '';
    
    // Display hero cards
    const heroCards = scene.hand.holeCards;
    createCard(heroCards.HoleCard1, heroCardsArea);
    createCard(heroCards.HoleCard2, heroCardsArea);
    
    // Display board cards based on street
    const board = scene.hand.handBoard;
    const street = scene.street.toLowerCase();
    
    // Add flop cards
    if (street !== 'preflop' && board["flop 1"]) createCard(board["flop 1"], boardArea);
    if (street !== 'preflop' && board["flop 2"]) createCard(board["flop 2"], boardArea);
    if (street !== 'preflop' && board["flop 3"]) createCard(board["flop 3"], boardArea);
    
    // Add turn card
    if (street === 'turn' || street === 'river') {
        if (board.turn) createCard(board.turn, boardArea);
    }
    
    // Add river card
    if (street === 'river') {
        if (board.river) createCard(board.river, boardArea);
    }
    
    // Update players
    updatePlayers(scene);
    
    // Position dealer button and blinds
    positionDealerAndBlinds(scene.button);
    
    // Update timer duration if specified
    if (scene.duration) {
        timeRemaining = scene.duration;
        document.getElementById('timer').textContent = timeRemaining;
        // Update timer dropdown
        const timerDropdown = document.getElementById('timer-duration');
        if (timerDropdown) {
            const optionExists = Array.from(timerDropdown.options).some(option => parseInt(option.value) === scene.duration);
            if (!optionExists) {
                const newOption = document.createElement('option');
                newOption.value = scene.duration;
                newOption.textContent = `${scene.duration} seconds`;
                timerDropdown.appendChild(newOption);
            }
            timerDropdown.value = scene.duration;
        }
    }
    
    // Highlight the correct action button
    highlightCorrectAction(scene.answer, scene.answerAmount);
}

// Function to highlight the correct action button (for visual feedback)
function highlightCorrectAction(answer, answerAmount) {
    // Remove any previous highlights
    document.querySelectorAll('.action-button').forEach(btn => {
        btn.classList.remove('correct-action');
    });
    
    // Find the button corresponding to the correct answer
    const actionButton = document.querySelector(`.action-button[data-action="${answer}"]`);
    if (actionButton) {
        actionButton.classList.add('correct-action');
    }
    
    // Update the tooltip or hint text if needed
    const resultMessage = document.getElementById('result-message');
    if (resultMessage) {
        resultMessage.setAttribute('data-correct-amount', answerAmount);
    }
}

// Function to position dealer button and blinds based on button position
function positionDealerAndBlinds(buttonPosition) {
    const dealerButton = document.querySelector('.dealer-button');
    const smallBlind = document.querySelector('.small-blind');
    const bigBlind = document.querySelector('.big-blind');
    
    // Basic positioning based on button position
    // This is a simplified approach - in a real implementation, 
    // you'd calculate exact positions based on the table layout
    
    // Set dealer button position class
    dealerButton.className = 'dealer-button';
    dealerButton.classList.add(`dealer-pos-${buttonPosition}`);
    
    // Calculate small blind and big blind positions
    const sbPosition = (buttonPosition % 9) + 1;
    const bbPosition = ((buttonPosition + 1) % 9) + 1;
    
    smallBlind.className = 'blinds small-blind';
    smallBlind.classList.add(`blind-pos-${sbPosition}`);
    
    bigBlind.className = 'blinds big-blind';
    bigBlind.classList.add(`blind-pos-${bbPosition}`);
}

// Function to get position class based on position number
function getPositionClass(position) {
    // Map position numbers to position classes
    const positionMap = {
        1: 'player-bottom',
        2: 'player-bottom-left',
        3: 'player-left',
        4: 'player-top-left',
        5: 'player-top',
        6: 'player-top-right',
        7: 'player-right',
        8: 'player-bottom-right',
        9: 'player-bottom'
    };
    
    return positionMap[position] || 'player-top'; // Default to top if position not found
}

// Enhanced function to update players with better positioning
function updatePlayers(scene) {
    // Clear existing players
    const playersContainer = document.getElementById('players-container');
    playersContainer.innerHTML = '';
    
    // Add villains based on their positions
    scene.villains.forEach((villain, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player';
        
        // Determine position class based on position number
        const positionClass = getPositionClass(villain.position);
        playerDiv.classList.add(positionClass);
        
        // Create player info HTML
        playerDiv.innerHTML = `
            <div>Type ${villain.playerType}</div>
            <div>Stack: ${villain.villainStack.toLocaleString()}</div>
            <img src="assets/images/player.jpg" alt="player avatar" class="player-avatar">
        `;
        
        // If the villain has taken an action, display it
        if (villain.action) {
            const actionDiv = document.createElement('div');
            actionDiv.className = 'player-action';
            actionDiv.textContent = `${villain.action.toUpperCase()}${villain.amount > 0 ? ' ' + villain.amount.toLocaleString() : ''}`;
            playerDiv.appendChild(actionDiv);
        }
        
        playersContainer.appendChild(playerDiv);
    });
    
    // Call responsive layout handler
    handleResponsiveLayout();
}

// Function to handle responsive layout
function handleResponsiveLayout() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = height > width;
    
    // Get table element
    const pokerTable = document.querySelector('.poker-table');
    
    // Apply square table for mobile in portrait mode
    if (width <= 480 && isPortrait) {
        pokerTable.style.height = `${width}px`;
        pokerTable.style.maxHeight = '560px';
        pokerTable.style.borderRadius = '20px';
    } else {
        pokerTable.style.height = '';
        pokerTable.style.borderRadius = '';
    }
    
    // Adjust card sizes based on screen width
    adjustCardSizes(width);
    
    // Adjust player positions
    adjustPlayerPositions(width, isPortrait);
}

// Function to adjust card sizes
function adjustCardSizes(width) {
    const cards = document.querySelectorAll('.card');
    let cardWidth, cardHeight;
    
    if (width <= 360) {
        cardWidth = 30;
        cardHeight = 42;
    } else if (width <= 480) {
        cardWidth = 45;
        cardHeight = 55;
    } else if (width <= 576) {
        cardWidth = 45;
        cardHeight = 63;
    } else if (width <= 768) {
        cardWidth = 50;
        cardHeight = 70;
    } else {
        cardWidth = 60;
        cardHeight = 85;
    }
    
    cards.forEach(card => {
        card.style.width = `${cardWidth}px`;
        card.style.height = `${cardHeight}px`;
    });
}

// Function to adjust player positions
function adjustPlayerPositions(width, isPortrait) {
    const players = document.querySelectorAll('.player');
    
    players.forEach(player => {
        // Reset inline styles first
        player.style.top = '';
        player.style.right = '';
        player.style.bottom = '';
        player.style.left = '';
        
        // Apply specific adjustments based on screen size and orientation
        if (width <= 360) {
        if (player.classList.contains('player-top')) {
                player.style.top = '2%';
            } else if (player.classList.contains('player-right')) {
                player.style.right = '2%';
            } else if (player.classList.contains('player-left')) {
                player.style.left = '2%';
            }
        } else if (width <= 480) {
            if (player.classList.contains('player-top')) {
                player.style.top = '0%';
            } else if (player.classList.contains('player-right')) {
                player.style.right = '3%';
            } else if (player.classList.contains('player-left')) {
                player.style.left = '3%';
            }
        }
        
        // Special handling for portrait mode on mobile
        if (width <= 480 && isPortrait) {
            if (player.classList.contains('player-top')) {
                player.style.top = '0%';
            } else if (player.classList.contains('player-right')) {
                player.style.right = '2%';
                player.style.top = '40%';
            } else if (player.classList.contains('player-left')) {
                player.style.left = '2%';
                player.style.top = '40%';
            }
        }
    });
}

// Add event listeners for responsive layout
window.addEventListener('load', handleResponsiveLayout);
window.addEventListener('resize', handleResponsiveLayout);
window.addEventListener('orientationchange', function() {
    setTimeout(handleResponsiveLayout, 100);
});

// Function to initialize a new game
function initializeGame(scenarioData) {
    // Set up event listeners
    setupEventListeners();
    
    // Display first scene
    currentSceneIndex = 0;
    populateScene(currentSceneIndex);
    
    // Update total scenes count
    document.getElementById('total-scenes').textContent = scenarioData.scenarioScenes.length;
    
    // Start timer
    startTimer();
}

// Add CSS to show correct action button
const style = document.createElement('style');
style.textContent = `
.correct-action {
    /* Subtle highlighting for correct action - visible only to developer/teacher */
    border: 2px solid rgba(0, 255, 0, 0.1) !important;
}

/* Dealer button and blinds positioning classes */
.dealer-pos-1 { top: 70%; left: 20%; }
.dealer-pos-2 { top: 60%; left: 15%; }
.dealer-pos-3 { top: 40%; left: 15%; }
.dealer-pos-4 { top: 25%; left: 25%; }
.dealer-pos-5 { top: 20%; left: 40%; }
.dealer-pos-6 { top: 25%; left: 60%; }
.dealer-pos-7 { top: 40%; left: 70%; }
.dealer-pos-8 { top: 60%; left: 70%; }
.dealer-pos-9 { top: 70%; left: 60%; }

/* Blind positioning classes - approximate positions */
.blind-pos-1 { top: 70%; left: 22%; }
.blind-pos-2 { top: 60%; left: 17%; }
.blind-pos-3 { top: 40%; left: 17%; }
.blind-pos-4 { top: 25%; left: 27%; }
.blind-pos-5 { top: 20%; left: 42%; }
.blind-pos-6 { top: 25%; left: 62%; }
.blind-pos-7 { top: 40%; left: 72%; }
.blind-pos-8 { top: 60%; left: 72%; }
.blind-pos-9 { top: 70%; left: 62%; }
`;
document.head.appendChild(style);

// Load scenarios and initialize game when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load scenario data
    fetch('scenarios.json')
        .then(response => {
            // If we can't fetch the JSON, use the sample data
            if (!response.ok) {
                console.log('Using sample scenario data');
                return Promise.resolve(sampleScenarioData);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error loading scenarios:', error);
            return sampleScenarioData;
        })
        .then(data => {
            scenarioData = data;
            initializeGame(scenarioData);
        });
    
    // Initialize card style switcher
    initCardStyleSwitcher();

    const cardStyleSelect = document.getElementById('card-style');
    const container = document.querySelector('.container');

    cardStyleSelect.addEventListener('change', function(e) {
        if (e.target.value === 'four-color') {
            container.classList.add('four-color');
            container.classList.remove('two-color');
        } else {
            container.classList.add('two-color');
            container.classList.remove('four-color');
        }
    });
});

// Function to handle button actions and show detailed feedback page
function handleAction(action) {
    const currentScene = getCurrentScene();
    let isCorrect = action === currentScene.answer;
    
    // Calculate new stack and prior based on action
    let stackChange = 0;
    let newPrior = currentScene.heroCommit;
    
    if (action === 'check' || action === 'fold') {
        // No change to stack or prior
    } else if (action === '3bb') {
        stackChange = currentScene.bigBlind * 3;
        newPrior = currentScene.heroCommit + stackChange;
    } else if (action === '5bb') {
        stackChange = currentScene.bigBlind * 5;
        newPrior = currentScene.heroCommit + stackChange;
    } else if (action === 'halfpot') {
        stackChange = Math.floor(currentScene.pot / 2);
        newPrior = currentScene.heroCommit + stackChange;
    } else if (action === 'pot') {
        stackChange = currentScene.pot;
        newPrior = currentScene.heroCommit + stackChange;
    } else if (action === 'doublepot') {
        stackChange = currentScene.pot * 2;
        newPrior = currentScene.heroCommit + stackChange;
    } else if (action === 'shove') {
        stackChange = currentScene.heroStack;
        newPrior = currentScene.heroCommit + stackChange;
    }

    // Update hero info with new values
    const newStack = currentScene.heroStack - stackChange;
    updateHeroInfo(newStack, newPrior);
    
    // Pause the timer
    clearInterval(timerInterval);
    isPaused = true;
    
    // Create detailed feedback page
    showDetailedFeedback(action, currentScene, isCorrect);
    
    // Update score
    if (isCorrect) {
        score++;
        document.getElementById('score').textContent = score;
    } else {
        // Add to error scenes for practice
        if (!isErrorMode && !errorScenes.includes(currentSceneIndex)) {
            errorScenes.push(currentSceneIndex);
        }
    }
    
    // Show practice errors button if we have errors
    if (errorScenes.length > 0) {
        document.getElementById('practice-errors-btn').classList.remove('hidden');
    }
}

// Function to get current scene
function getCurrentScene() {
    return scenarioData.scenarioScenes[currentSceneIndex];
}

// Function to show detailed feedback page
function showDetailedFeedback(playerAction, scene, isCorrect) {
    // Create overlay for detailed feedback
    const overlay = document.createElement('div');
    overlay.className = 'feedback-overlay';
    
    // Create feedback content
    const feedbackContent = document.createElement('div');
    feedbackContent.className = 'feedback-content';
    
    // Add header with result
    const header = document.createElement('div');
    header.className = `feedback-header ${isCorrect ? 'correct' : 'incorrect'}`;
    header.innerHTML = isCorrect ? 
        '<h2>Correct Decision!</h2>' : 
        '<h2>Incorrect Decision</h2>';
    feedbackContent.appendChild(header);
    
    // Add hand information
    const handInfo = document.createElement('div');
    handInfo.className = 'feedback-hand-info';
    
    // Format hole cards
    const holeCards = `${scene.hand.holeCards.HoleCard1} ${scene.hand.holeCards.HoleCard2}`;
    
    // Format board cards based on street
    let boardCards = '';
    const board = scene.hand.handBoard;
    const street = scene.street.toLowerCase();
    
    if (street !== 'preflop') {
        boardCards = `${board["flop 1"] || ''} ${board["flop 2"] || ''} ${board["flop 3"] || ''}`;
        
        if (street === 'turn' || street === 'river') {
            boardCards += ` ${board.turn || ''}`;
        }
        
        if (street === 'river') {
            boardCards += ` ${board.river || ''}`;
        }
    }
    
    handInfo.innerHTML = `
        <div class="feedback-section">
            <h3>Your Hand</h3>
            <div class="feedback-cards">${holeCards}</div>
            ${boardCards ? `<h3>Board</h3><div class="feedback-cards">${boardCards}</div>` : ''}
            <h3>Position</h3>
            <div>Button: ${getPositionName(scene.button)}</div>
            <div>Hero: ${getPositionName(scene.heroPosition)}</div>
        </div>
    `;
    feedbackContent.appendChild(handInfo);
    
    // Add action information
    const actionInfo = document.createElement('div');
    actionInfo.className = 'feedback-action-info';
    
    actionInfo.innerHTML = `
        <div class="feedback-section">
            <h3>Your Action</h3>
            <div class="action-comparison ${isCorrect ? 'correct' : 'incorrect'}">
                <div>You chose: <strong>${playerAction.toUpperCase()}</strong></div>
                ${!isCorrect ? `<div>Correct action: <strong>${scene.answer.toUpperCase()}</strong></div>` : ''}
                ${scene.answerAmount > 0 ? `<div>Amount: ${scene.answerAmount.toLocaleString()}</div>` : ''}
            </div>
        </div>
    `;
    feedbackContent.appendChild(actionInfo);
    
    // Add explanation if available
    if (scene.explanation) {
        const explanation = document.createElement('div');
        explanation.className = 'feedback-explanation';
        explanation.innerHTML = `
            <div class="feedback-section">
                <h3>Explanation</h3>
                <p>${scene.explanation}</p>
            </div>
        `;
        feedbackContent.appendChild(explanation);
    }
    
    // Add statistics if available
    if (scene.stats) {
        const stats = document.createElement('div');
        stats.className = 'feedback-stats';
        stats.innerHTML = `
            <div class="feedback-section">
                <h3>Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">Equity</div>
                        <div class="stat-value">${scene.stats.equity || 'N/A'}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">EV</div>
                        <div class="stat-value">${scene.stats.ev || 'N/A'}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Fold Equity</div>
                        <div class="stat-value">${scene.stats.foldEquity || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;
        feedbackContent.appendChild(stats);
    }
    
    // Add navigation buttons
    const navButtons = document.createElement('div');
    navButtons.className = 'feedback-nav-buttons';
    navButtons.innerHTML = `
        <button id="prev-scene-btn" class="action-button" ${currentSceneIndex === 0 ? 'disabled' : ''}>Previous</button>
        <button id="next-scene-btn" class="action-button">Next</button>
    `;
    feedbackContent.appendChild(navButtons);
    
    // Add content to overlay
    overlay.appendChild(feedbackContent);
    
    // Add overlay to body
    document.body.appendChild(overlay);
    
    // Add event listeners to buttons
    document.getElementById('next-scene-btn').addEventListener('click', function() {
        document.body.removeChild(overlay);
        nextScene();
    });
    
    document.getElementById('prev-scene-btn').addEventListener('click', function() {
        if (currentSceneIndex > 0) {
            document.body.removeChild(overlay);
            currentSceneIndex--;
            populateScene(currentSceneIndex);
            startTimer();
        }
    });
}

// Function to get position name from position number
function getPositionName(position) {
    const positions = {
        1: 'Button (BTN)',
        2: 'Small Blind (SB)',
        3: 'Big Blind (BB)',
        4: 'Under the Gun (UTG)',
        5: 'UTG+1',
        6: 'Middle Position (MP)',
        7: 'Hijack (HJ)',
        8: 'Cutoff (CO)',
        9: 'Button (BTN)'
    };
    
    return positions[position] || `Position ${position}`;
}

// Function to move to next scene
function nextScene() {
    currentSceneIndex++;
    
    // Check if we've reached the end of the scenarios
    if (currentSceneIndex >= scenarioData.scenarioScenes.length) {
        showFinalResults();
        return;
    }
    
    // Load the next scene
        populateScene(currentSceneIndex);
        
    // Reset and start the timer
    timeRemaining = parseInt(document.getElementById('timer-duration').value);
    document.getElementById('timer').textContent = timeRemaining;
    startTimer();
}

// Function to show final results
function showFinalResults() {
    // Create overlay for results
    const overlay = document.createElement('div');
    overlay.className = 'feedback-overlay';
    
    // Create results content
    const resultsContent = document.createElement('div');
    resultsContent.className = 'feedback-content';
    
    // Calculate percentage
    const percentage = Math.round((score / scenarioData.scenarioScenes.length) * 100);
    
    // Add header with result
    resultsContent.innerHTML = `
        <div class="feedback-header">
            <h2>Training Complete!</h2>
        </div>
        <div class="feedback-section">
            <h3>Your Results</h3>
            <div class="results-summary">
                <div class="result-stat">
                    <div class="result-value">${score}/${scenarioData.scenarioScenes.length}</div>
                    <div class="result-label">Correct Decisions</div>
                </div>
                <div class="result-stat">
                    <div class="result-value">${percentage}%</div>
                    <div class="result-label">Accuracy</div>
                </div>
            </div>
            ${errorScenes.length > 0 ? 
                `<div class="error-summary">
                    <h3>Areas to Improve</h3>
                    <p>You made errors in ${errorScenes.length} scenarios. Practice these to improve!</p>
                </div>` : 
                '<div class="perfect-score">Perfect score! Great job!</div>'
            }
        </div>
        <div class="feedback-nav-buttons">
            <button id="restart-btn" class="action-button">Restart Training</button>
            ${errorScenes.length > 0 ? 
                '<button id="practice-errors-btn-final" class="action-button">Practice Errors</button>' : ''}
        </div>
    `;
    
    // Add content to overlay
    overlay.appendChild(resultsContent);
    
    // Add overlay to body
    document.body.appendChild(overlay);
    
    // Add event listeners to buttons
    document.getElementById('restart-btn').addEventListener('click', function() {
        document.body.removeChild(overlay);
        restartTraining();
    });
    
    if (errorScenes.length > 0) {
        document.getElementById('practice-errors-btn-final').addEventListener('click', function() {
            document.body.removeChild(overlay);
            startErrorPractice();
        });
    }
}

// Function to restart training
function restartTraining() {
    currentSceneIndex = 0;
        score = 0;
    errorScenes = [];
    isErrorMode = false;
    
    // Update score display
        document.getElementById('score').textContent = score;
        
    // Hide practice errors button
    document.getElementById('practice-errors-btn').classList.add('hidden');
    
    // Load first scene
    populateScene(currentSceneIndex);
    
    // Reset and start timer
        timeRemaining = parseInt(document.getElementById('timer-duration').value);
    document.getElementById('timer').textContent = timeRemaining;
        startTimer();
    }

// Function to start error practice mode
function startErrorPractice() {
    if (errorScenes.length === 0) return;
    
    isErrorMode = true;
    
    // Create a copy of error scenes to work through
    const practiceScenes = [...errorScenes];
    
    // Reset score for practice session
    score = 0;
    document.getElementById('score').textContent = score;
    document.getElementById('total-scenes').textContent = practiceScenes.length;
    
    // Load first error scene
    currentSceneIndex = practiceScenes[0];
    populateScene(currentSceneIndex);
    
    // Reset and start timer
    timeRemaining = parseInt(document.getElementById('timer-duration').value);
    document.getElementById('timer').textContent = timeRemaining;
    startTimer();
}

// Function to set up event listeners
function setupEventListeners() {
    // Add event listeners to action buttons
    document.querySelectorAll('.action-button[data-action]').forEach(button => {
        button.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            handleAction(action);
        });
    });
    
    // Add event listener for pause button
    document.getElementById('pause-btn').addEventListener('click', function() {
        if (isPaused) {
            // Resume
            this.textContent = 'Pause';
            startTimer();
        } else {
            // Pause
            this.textContent = 'Resume';
            clearInterval(timerInterval);
        }
        isPaused = !isPaused;
    });
    
    // Add event listener for practice errors button
    document.getElementById('practice-errors-btn').addEventListener('click', function() {
        startErrorPractice();
    });
    
    // Add event listener for card style changes
    document.getElementById('card-style').addEventListener('change', function(e) {
        const container = document.querySelector('.container');
        if (e.target.value === 'four-color') {
            container.classList.add('four-color');
        } else {
            container.classList.remove('four-color');
        }
    });
    
    // Add event listener for timer duration changes
    document.getElementById('timer-duration').addEventListener('change', function() {
        timeRemaining = parseInt(this.value);
        document.getElementById('timer').textContent = timeRemaining;
        
        // Restart timer if not paused
        if (!isPaused) {
            clearInterval(timerInterval);
            startTimer();
        }
    });
    
    // Add event listener for scenario pack changes
    document.getElementById('scenario-pack').addEventListener('change', function() {
        loadScenarioPack(this.value);
    });
    
    // Add orientation change handler
    window.addEventListener('orientationchange', function() {
        setTimeout(handleResponsiveLayout, 100);
    });
    
    // Add resize handler
    window.addEventListener('resize', handleResponsiveLayout);
}

// Function to start the timer
function startTimer() {
    clearInterval(timerInterval);
    
    timerInterval = setInterval(function() {
        if (timeRemaining > 0) {
            timeRemaining--;
            document.getElementById('timer').textContent = timeRemaining;
            
            // Add warning class when time is running low
            if (timeRemaining <= 10) {
                document.getElementById('timer').classList.add('timer-warning');
            } else {
                document.getElementById('timer').classList.remove('timer-warning');
            }
        } else {
            // Time's up - treat as incorrect answer
            clearInterval(timerInterval);
            handleAction('timeout');
        }
    }, 1000);
}

// Function to load a specific scenario pack
function loadScenarioPack(packName) {
    fetch(`scenarios/${packName}.json`)
        .then(response => {
            if (!response.ok) {
                console.log(`Could not load scenario pack: ${packName}`);
                return Promise.resolve(sampleScenarioData);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error loading scenario pack:', error);
            return sampleScenarioData;
        })
        .then(data => {
            scenarioData = data;
            restartTraining();
        });
}

// Sample scenario data in case JSON fetch fails
const sampleScenarioData = {
    "scenarioScenes": [
        {
            "id": 1,
            "hand": {
                "holeCards": {
                    "HoleCard1": "A♠",
                    "HoleCard2": "K♠"
                },
                "handBoard": {
                    "flop 1": "K♥",
                    "flop 2": "10♠",
                    "flop 3": "2♦",
                    "turn": "7♣",
                    "river": ""
                }
            },
            "street": "Turn",
            "pot": 9600,
            "bigBlind": 800,
            "toGo": 0,
            "heroStack": 17600,
            "heroCommit": 2400,
            "button": 5,
            "heroPosition": 7,
            "villains": [
                {
                    "position": 5,
                    "playerType": "TA",
                    "villainStack": 45600,
                    "action": "check",
                    "amount": 0
                }
            ],
            "answer": "pot",
            "answerAmount": 9600,
            "explanation": "With top pair top kicker and a flush draw, betting pot size on the turn is the optimal play. This builds the pot with your strong hand while giving draws incorrect odds to call.",
            "stats": {
                "equity": "67%",
                "ev": "+4800",
                "foldEquity": "35%"
            }
        },
        {
            "id": 2,
            "hand": {
                "holeCards": {
                    "HoleCard1": "J♥",
                    "HoleCard2": "J♦"
                },
                "handBoard": {
                    "flop 1": "A♠",
                    "flop 2": "K♠",
                    "flop 3": "2♦",
                    "turn": "",
                    "river": ""
                }
            },
            "street": "Flop",
            "pot": 6400,
            "bigBlind": 800,
            "toGo": 3200,
            "heroStack": 24000,
            "heroCommit": 1600,
            "button": 1,
            "heroPosition": 3,
            "villains": [
                {
                    "position": 1,
                    "playerType": "LP",
                    "villainStack": 32000,
                    "action": "bet",
                    "amount": 3200
                }
            ],
            "answer": "fold",
            "answerAmount": 0,
            "explanation": "Pocket jacks are significantly behind on this Ace-King high board. The button player's betting range contains many Ax and Kx hands that dominate you. Folding is the correct play to avoid losing more chips.",
            "stats": {
                "equity": "22%",
                "ev": "-1800",
                "foldEquity": "5%"
            }
        }
    ]
};

// Function to initialize card style switcher
function initCardStyleSwitcher() {
    // Initialize with two-color scheme by default
    document.querySelector('.poker-table').classList.add('two-color');
    
    // Add event listener for the toggle button
    const toggleBtn = document.getElementById('color-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleCardColors);
    }
    
    // Apply initial card styling
    updateExistingCards();
}

// Function to toggle between two-color and four-color schemes
function toggleCardColors() {
    const pokerTable = document.querySelector('.poker-table');
    const toggleBtn = document.getElementById('color-toggle-btn');
    
    if (pokerTable.classList.contains('two-color')) {
        // Switch to four-color
        pokerTable.classList.remove('two-color');
        pokerTable.classList.add('four-color');
        toggleBtn.textContent = '4 Color';

        const cardStyleSelect = document.getElementById('card-style');
        if (cardStyleSelect) {
            cardStyleSelect.value = 'four-color';
        }
    } else {
        // Switch to two-color
        pokerTable.classList.remove('four-color');
        pokerTable.classList.add('two-color');
        toggleBtn.textContent = '2 Color';

        const cardStyleSelect = document.getElementById('card-style');
        if (cardStyleSelect) {
            cardStyleSelect.value = 'two-color';
        }
    }
    
    // Update all existing cards
    updateExistingCards();
}

// Function to update existing cards with proper suit classes
function updateExistingCards() {
    // Get all cards
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        // Get the suit from the card
        const suitElement = card.querySelector('.card-suit');
        if (!suitElement) return;
        
        const suit = suitElement.textContent.trim();
        
        // Remove existing suit classes
        card.classList.remove('card-hearts', 'card-diamonds', 'card-spades', 'card-clubs');
        
        // Add appropriate suit class
        if (suit === '♥') {
            card.classList.add('card-hearts');
        } else if (suit === '♦') {
            card.classList.add('card-diamonds');
        } else if (suit === '♠') {
            card.classList.add('card-spades');
        } else if (suit === '♣') {
            card.classList.add('card-clubs');
        }
    });
}

// Enhanced function to create cards with proper suit classes
function createCard(cardInfo, container, delay = 0) {
    if (!cardInfo) return;
    
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${delay * 0.1}s`;
    card.classList.add('card-animation');
    
    // Extract value and suit
    const value = cardInfo.slice(0, -1);
    const suit = cardInfo.slice(-1);
    
    // Add suit-specific class
    if (suit === '♥') {
        card.classList.add('card-hearts');
    } else if (suit === '♦') {
        card.classList.add('card-diamonds');
    } else if (suit === '♠') {
        card.classList.add('card-spades');
    } else if (suit === '♣') {
        card.classList.add('card-clubs');
    }
    
    card.innerHTML = `
        <div class="card-value">${value}</div>
        <div class="card-suit">${suit}</div>
        <div class="card-center-suit">${suit}</div>
    `;
    
    container.appendChild(card);
    
    // Apply responsive sizing
    adjustCardSizes(window.innerWidth);
    
    return card;
}

// Add this function to update hero info
function updateHeroInfo(stack, prior) {
    const heroStack = document.getElementById('hero-stack');
    const heroCommit = document.getElementById('hero-commit');
    
    if (heroStack) {
        heroStack.textContent = stack.toLocaleString();
    }
    
    if (heroCommit) {
        heroCommit.textContent = prior.toLocaleString();
    }
}