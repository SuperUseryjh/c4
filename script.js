document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const gameContainer = document.getElementById('game-container');
    const usernameInput = document.getElementById('username-input');
    const loginButton = document.getElementById('login-button');
    const scoreDisplay = document.getElementById('score-display');
    const guessInput = document.getElementById('guess-input');
    const guessButton = document.getElementById('guess-button');
    const messageElement = document.getElementById('message');

    let sessionId = null;

    loginButton.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        if (username) {
            try {
                const response = await fetch('YOUR_WORKER_URL/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                });
                const data = await response.json();
                if (response.ok) {
                    sessionId = data.sessionId;
                    loginContainer.style.display = 'none';
                    gameContainer.style.display = 'block';
                    messageElement.textContent = `Welcome, ${username}!`;
                    // In a real app, you'd fetch the initial score here
                } else {
                    messageElement.textContent = `Login failed: ${data.error || response.statusText}`;
                }
            } catch (error) {
                messageElement.textContent = `Error during login: ${error.message}`;
            }
        } else {
            messageElement.textContent = 'Please enter a username.';
        }
    });

    guessButton.addEventListener('click', async () => {
        const guess = parseInt(guessInput.value);
        if (isNaN(guess) || guess < 1 || guess > 100) {
            messageElement.textContent = 'Please enter a valid number between 1 and 100.';
            return;
        }

        if (!sessionId) {
            messageElement.textContent = 'Please log in first.';
            return;
        }

        try {
            const response = await fetch('YOUR_WORKER_URL/guess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, guess })
            });
            const data = await response.json();

            if (response.ok) {
                if (data.correct) {
                    messageElement.textContent = `Correct! The number was ${data.targetNumber}. Your score is now ${data.newScore}.`;
                    scoreDisplay.textContent = data.newScore;
                } else {
                    messageElement.textContent = `Wrong! The number was ${data.targetNumber}. Try again.`;
                }
            } else {
                messageElement.textContent = `Guess failed: ${data.error || response.statusText}`;
            }
        } catch (error) {
            messageElement.textContent = `Error during guess: ${error.message}`;
        }
        guessInput.value = '';
    });
});