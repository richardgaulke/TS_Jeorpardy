type Question = {
    category: string;
    value: number;
    text: string;
    answer: string;
};

class Game {
    numTeams: number;
    questions: Question[];

    constructor() {
        this.numTeams = 0;
        this.questions = [];
        this.initializeEventListeners();
    }

    async initializeGame() {
        try {
            this.questions = await this.fetchAndParseCSV('https://raw.githubusercontent.com/richardgaulke/TS_jeopardy/main/questions.csv');
            console.log('Questions:', this.questions);
			this.startGame();
        } catch (error) {
            console.error('Error initializing game:', error);
        }
    }

	async fetchAndParseCSV(url: string): Promise<Question[]> {
		const response = await fetch(url);
		const csvText = await response.text();
		// Split the CSV text into rows
		const rows = csvText.split('\n');
		// Filter out rows with empty categories
		const nonEmptyRows = rows.filter(row => {
			const [category] = row.split(',');
			return category.trim() !== ''; // Check if the category is not empty or only whitespace
		});
		// Parse the non-empty rows into Question objects
		return nonEmptyRows.map(row => {
			const [category, value, text, answer] = row.split(',');
			return { category, value: parseInt(value, 10), text, answer };
		});
	}

    private initializeEventListeners() {
        const startGameButton = document.getElementById('startGame');
        if (startGameButton) {
            startGameButton.addEventListener('click', () => {
                this.startGame();
                this.playBackgroundMusic();
            });
        } else {
            console.error('Start Game button not found');
        }

        const createTeamsButton = document.getElementById('createTeams');
        if (createTeamsButton) {
            createTeamsButton.addEventListener('click', () => this.createTeams());
        } else {
            console.error('Create Teams button not found');
        }
		
        // Add event listeners for the new buttons
        const changeMusicButton = document.getElementById('changeMusic');
        if (changeMusicButton) {
            changeMusicButton.addEventListener('click', () => this.changeMusic());
        }

        const playMusicButton = document.getElementById('playMusic');
        if (playMusicButton) {
            playMusicButton.addEventListener('click', () => this.playMusic());
        }

        const stopMusicButton = document.getElementById('stopMusic');
        if (stopMusicButton) {
            stopMusicButton.addEventListener('click', () => this.stopMusic());
        }
    }

    startGame() {
        this.createCategories();
    }

    playBackgroundMusic() {
        const audio = document.getElementById('backgroundMusic') as HTMLAudioElement;
        if (audio) {
			audio.loop = true;
            audio.play().catch(e => {
                console.error("Failed to play audio:", e);
            });
        } else {
            console.error('Background music element not found');
        }
    }

    createCategories() {
        const categoriesContainer = document.querySelector('.categories');
        if (categoriesContainer) {
            // Get unique categories
            const uniqueCategories = this.questions
                .map(q => q.category)
                .filter((category, index, self) => self.indexOf(category) === index);

            console.log('Unique Categories:', uniqueCategories); // Debugging log

            categoriesContainer.innerHTML = '';
            uniqueCategories.forEach((category: string) => {
                // Check if there are questions for this category
                const hasQuestions = this.questions.some(question => question.category === category);

                if (hasQuestions) {
                    const button = document.createElement('button');
                    button.className = 'btn btn-primary category';
                    button.textContent = category;
                    button.addEventListener('click', () => this.selectCategory(category));
                    categoriesContainer.appendChild(button);
                }
            });
        } else {
            console.error('Categories container not found');
        }
    }

    createTeams() {
        const numTeamsInput = document.getElementById('numTeams') as HTMLInputElement;
        this.numTeams = parseInt(numTeamsInput.value, 10);

        if (isNaN(this.numTeams) || this.numTeams < 1) {
            alert('Please enter a valid number of teams (at least 1).');
            return;
        }

    const teamScoresContainer = document.querySelector('.team-scores');
    if (teamScoresContainer) {
        teamScoresContainer.innerHTML = '';

        for (let i = 1; i <= this.numTeams; i++) {
            const teamScore = document.createElement('div');
            teamScore.className = 'team-score';
            teamScore.innerHTML = `Team ${i}: <span id="team-score-value-${i}" class="team-score-value">0</span>`;
            teamScoresContainer.appendChild(teamScore);
        }
    } else {
        console.error('Team scores container not found');
    }
}


    resetGame() {
		const teamScoreElements = document.querySelectorAll('.team-score-value');
		teamScoreElements.forEach((element) => {
			element.textContent = '0';
		});

		const questionsContainer = document.querySelector('.questions');
		if (questionsContainer) {
			questionsContainer.innerHTML = '';
		}
    }

    showQuestion(category: string, value: number, text: string, answer: string) {
		const questionText = `Category: ${category}\n\nQuestion: ${text}\n\nEnter your answer:`;
		if (questionText !== null) {
			const teamDropdown = document.createElement('select');
			teamDropdown.className = 'team-dropdown';
        
			for (let i = 1; i <= this.numTeams; i++) {
				const option = document.createElement('option');
				option.value = `Team ${i}`;
				option.textContent = `Team ${i}`;
				teamDropdown.appendChild(option);
			}

			const confirmButton = document.createElement('button');
			confirmButton.className = 'btn btn-success';
			confirmButton.textContent = 'Award Points';
			confirmButton.addEventListener('click', () => this.awardPoints(teamDropdown.value, value));

			const cancelButton = document.createElement('button');
			cancelButton.className = 'btn btn-danger';
			cancelButton.textContent = 'Done';
			cancelButton.addEventListener('click', () => {
				teamDropdown.remove();
				confirmButton.remove();
				cancelButton.remove();
			});

			const buttonsDiv = document.createElement('div');
			buttonsDiv.appendChild(teamDropdown);
			buttonsDiv.appendChild(confirmButton);
			buttonsDiv.appendChild(cancelButton);

			const questionDiv = document.createElement('div');
			questionDiv.className = 'question';
			questionDiv.innerHTML = `<strong>Category:</strong> ${category}<br><br><strong>Value:</strong> $${value}<br><br><strong>Question:</strong> ${text}<br><br><strong>Show Answer:</strong> `;
			questionDiv.appendChild(buttonsDiv);
			
			const categoryButton = document.querySelector(`.category[data-category="${category}"]`) as HTMLButtonElement;
			if (categoryButton) {
				categoryButton.disabled = true;
				categoryButton.classList.add('disabled');
			}

			const questionsContainer = document.querySelector('.questions');
			if (questionsContainer) {
				questionsContainer.innerHTML = '';
				questionsContainer.appendChild(questionDiv);
			}
		}
    }

    awardPoints(selectedTeam: string, points: number) {
        const teamNumber = parseInt(selectedTeam.match(/\d+/)?.[0] || '0', 10);

        if (teamNumber === 0) {
            console.error('Invalid team number');
            return;
        }

        const teamScoreElement = document.querySelector(`#team-score-value-${teamNumber}`) as HTMLElement;

        if (teamScoreElement) {
            const currentScore = parseInt(teamScoreElement.textContent || '0', 10);
            const newScore = currentScore + points;
            teamScoreElement.textContent = newScore.toString();
            console.log(`Points awarded to Team ${teamNumber}. New score: ${newScore}`);
        } else {
            console.error(`Score element for Team ${teamNumber} not found.`);
        }
    }

    stopBackgroundMusic() {
		const audio = document.getElementById('backgroundMusic') as HTMLAudioElement;
		audio.pause();
    }

    initializeUI() {
        this.createTeams();
        this.createCategories();
    }

	selectCategory(category: string) {
        console.log('Category selected:', category);

        // Find questions for the selected category
        const filteredQuestions = this.questions.filter(q => q.category === category);

        // Get the questions container and clear its current content
        const questionsContainer = document.querySelector('.questions');
        if (questionsContainer) {
            questionsContainer.innerHTML = '';

            // Create and append elements for each question
            filteredQuestions.forEach(question => {
                const questionDiv = document.createElement('div');
                questionDiv.className = 'question';
                questionDiv.textContent = `${question.value}`;

                // Add an event listener for each question to handle selection/click
                questionDiv.addEventListener('click', () => this.showQuestion(question.category, question.value, question.text, question.answer));
                
                questionsContainer.appendChild(questionDiv);
            });
        } else {
            console.error('Questions container not found');
        }
    }
	
    // Add functions for handling the new button actions
    changeMusic() {
        const musicFileInput = document.getElementById('musicFileInput') as HTMLInputElement;
        if (musicFileInput) {
            musicFileInput.click(); // Trigger file input click
            musicFileInput.addEventListener('change', () => {
                const file = musicFileInput.files?.[0];
                if (file) {
                    this.setMusic(file);
                }
            });
        }
    }

    setMusic(file: File) {
        const audio = document.getElementById('backgroundMusic') as HTMLAudioElement;
        if (audio) {
            audio.src = URL.createObjectURL(file);
            audio.load();
        }
    }

    playMusic() {
        const audio = document.getElementById('backgroundMusic') as HTMLAudioElement;
        if (audio) {
            audio.loop = true;
            audio.play().catch(e => {
                console.error("Failed to play audio:", e);
            });
        }
    }

    stopMusic() {
        const audio = document.getElementById('backgroundMusic') as HTMLAudioElement;
        if (audio) {
            audio.pause();
        }
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.initializeGame();
});