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

// Function to create player elements
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
        
        // Add player info including player type and stack
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
}

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
});

// Enhanced handleAction function
function handleAction(action) {
    const currentScene = getCurrentScene();
    let isCorrect = action === currentScene.answer;
    
    // For bet/raise actions, check if the amount is also correct
    if (isCorrect && (action === 'bet' || action === 'raise' || action === 'call')) {
        // This is where you would implement the bet amount verification
        // In a complete implementation, you would have a bet slider or input
        // For now, we'll just show what the correct amount would be
        const correctAmount = currentScene.answerAmount;
        document.getElementById('result-message').innerHTML = `
            Correct! ${action.toUpperCase()} ${correctAmount > 0 ? correctAmount.toLocaleString() : ''}
        `;
    } else if (isCorrect) {
        // Simple correct action
        document.getElementById('result-message').textContent = `Correct! ${action.toUpperCase()}`;
    } else {
        // Incorrect action
        document.getElementById('result-message').innerHTML = `
            Incorrect! The correct answer was ${currentScene.answer.toUpperCase()}
            ${currentScene.answerAmount > 0 ? ' ' + currentScene.answerAmount.toLocaleString() : ''}
        `;
        
        // Add to error scenes for practice
        if (!isErrorMode && !errorScenes.includes(currentSceneIndex)) {
            errorScenes.push(currentSceneIndex);
        }
    }
    
    // Update score
    if (isCorrect) {
        score++;
        document.getElementById('score').textContent = score;
    }
    
    // Show result message
    const resultMessageElement = document.getElementById('result-message');
    resultMessageElement.className = 'result-message';
    resultMessageElement.classList.add(isCorrect ? 'result-correct' : 'result-wrong');
    resultMessageElement.classList.remove('hidden');
    
    // Move to next scene after delay
    setTimeout(() => {
        nextScene();
    }, 2000);
}

// Add this function to start with a specific scene from the JSON data
function setStartingScene(sceneIndex) {
    if (sceneIndex >= 0 && sceneIndex < scenarioData.scenarioScenes.length) {
        currentSceneIndex = sceneIndex;
        populateScene(currentSceneIndex);
        
        // Reset score and timer
        score = 0;
        document.getElementById('score').textContent = score;
        
        timeRemaining = parseInt(document.getElementById('timer-duration').value);
        startTimer();
    }
}

// Add a dropdown for scene selection for practice
function addSceneSelector() {
    const settingsPanel = document.querySelector('.settings-panel');
    
    const sceneGroup = document.createElement('div');
    sceneGroup.className = 'settings-group';
    
    const sceneTitle = document.createElement('div');
    sceneTitle.className = 'settings-title';
    sceneTitle.textContent = 'Practice Scene';
    
    const sceneSelect = document.createElement('select');
    sceneSelect.id = 'scene-selector';
    sceneSelect.className = 'select-option';
    
    // Add option for each scene
    scenarioData.scenarioScenes.forEach((scene, index) => {
        const option = document.createElement('option');
        option.value = index;
        // Create a descriptive name based on hole cards and board
        const holeCards = `${scene.hand.holeCards.HoleCard1}-${scene.hand.holeCards.HoleCard2}`;
        const street = scene.street.charAt(0).toUpperCase() + scene.street.slice(1);
        option.textContent = `Scene ${index+1}: ${holeCards} (${street})`;
        sceneSelect.appendChild(option);
    });
    
    sceneSelect.addEventListener('change', function() {
        setStartingScene(parseInt(this.value));
    });
    
    sceneGroup.appendChild(sceneTitle);
    sceneGroup.appendChild(sceneSelect);
    settingsPanel.appendChild(sceneGroup);
}