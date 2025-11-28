class AIBattleArena {
    constructor() {
        this.player1Wins = 0;
        this.player2Wins = 0;
        this.gamesCompleted = 0;
        this.totalGames = 0;
        this.running = false;
        this.shouldStop = false;

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startBattle();
        });

        document.getElementById('stop-btn').addEventListener('click', () => {
            this.stopBattle();
        });
    }

    async startBattle() {
        this.player1Wins = 0;
        this.player2Wins = 0;
        this.gamesCompleted = 0;
        this.totalGames = parseInt(document.getElementById('num-games').value);
        this.shouldStop = false;
        this.running = true;

        const ai1Difficulty = document.getElementById('ai1-difficulty').value;
        const ai2Difficulty = document.getElementById('ai2-difficulty').value;

        document.getElementById('start-btn').disabled = true;
        document.getElementById('stop-btn').disabled = false;
        document.getElementById('game-log').innerHTML = '';

        this.log(`Starting battle: ${ai1Difficulty} vs ${ai2Difficulty} (${this.totalGames} games)`);

        for (let i = 0; i < this.totalGames; i++) {
            if (this.shouldStop) {
                this.log('Battle stopped by user');
                break;
            }

            const winner = await this.playGame(ai1Difficulty, ai2Difficulty);

            if (winner === 1) {
                this.player1Wins++;
            } else if (winner === 2) {
                this.player2Wins++;
            }

            this.gamesCompleted++;
            this.updateStats();

            // Small delay to prevent UI freezing
            await this.delay(10);
        }

        this.running = false;
        document.getElementById('start-btn').disabled = false;
        document.getElementById('stop-btn').disabled = true;

        this.showFinalResults(ai1Difficulty, ai2Difficulty);
    }

    stopBattle() {
        this.shouldStop = true;
        document.getElementById('stop-btn').disabled = true;
    }

    async playGame(ai1Difficulty, ai2Difficulty) {
        const game = this.createMockGame();
        const ai1 = new SantoriniAI(1);
        const ai2 = new SantoriniAI(2);

        // Place workers randomly for both players
        this.placeWorkersRandomly(game, 1);
        this.placeWorkersRandomly(game, 2);

        game.phase = 'move';
        game.currentPlayer = 1;

        const maxTurns = 200; // Prevent infinite games
        let turnCount = 0;

        while (game.phase !== 'gameover' && turnCount < maxTurns) {
            const currentAI = game.currentPlayer === 1 ? ai1 : ai2;
            const difficulty = game.currentPlayer === 1 ? ai1Difficulty : ai2Difficulty;

            const move = currentAI.selectMove(game, difficulty);

            if (!move) {
                // Current player has no valid moves, they lose
                const winner = game.currentPlayer === 1 ? 2 : 1;
                return winner;
            }

            // Execute move
            const fromHeight = game.board[move.worker.row][move.worker.col].height;
            game.board[move.moveTo.row][move.moveTo.col].worker = game.currentPlayer;
            game.board[move.worker.row][move.worker.col].worker = null;

            const toHeight = game.board[move.moveTo.row][move.moveTo.col].height;

            // Check win condition
            if (fromHeight === 2 && toHeight === 3) {
                return game.currentPlayer;
            }

            // Execute build
            const buildCell = game.board[move.buildAt.row][move.buildAt.col];
            if (buildCell.height < 3) {
                buildCell.height++;
            } else if (buildCell.height === 3) {
                buildCell.dome = true;
            }

            // Switch player
            game.currentPlayer = game.currentPlayer === 1 ? 2 : 1;
            turnCount++;
        }

        // If we hit max turns, it's a draw (no winner)
        if (turnCount >= maxTurns) {
            this.log(`Game ${this.gamesCompleted + 1}: Draw (max turns reached)`);
            return null;
        }

        return null;
    }

    createMockGame() {
        const board = Array(5).fill(null).map(() =>
            Array(5).fill(null).map(() => ({ height: 0, dome: false, worker: null }))
        );

        return {
            board: board,
            currentPlayer: 1,
            phase: 'placement',
            workersPlaced: { 1: 0, 2: 0 },
            getValidMoves: function(row, col) {
                const validMoves = [];
                for (let r = Math.max(0, row - 1); r <= Math.min(4, row + 1); r++) {
                    for (let c = Math.max(0, col - 1); c <= Math.min(4, col + 1); c++) {
                        if (this.isValidMove(row, col, r, c)) {
                            validMoves.push({ row: r, col: c });
                        }
                    }
                }
                return validMoves;
            },
            getValidBuilds: function(row, col) {
                const validBuilds = [];
                for (let r = Math.max(0, row - 1); r <= Math.min(4, row + 1); r++) {
                    for (let c = Math.max(0, col - 1); c <= Math.min(4, col + 1); c++) {
                        if (this.isValidBuild(row, col, r, c)) {
                            validBuilds.push({ row: r, col: c });
                        }
                    }
                }
                return validBuilds;
            },
            isValidMove: function(fromRow, fromCol, toRow, toCol) {
                if (fromRow === toRow && fromCol === toCol) return false;
                const rowDiff = Math.abs(toRow - fromRow);
                const colDiff = Math.abs(toCol - fromCol);
                if (rowDiff > 1 || colDiff > 1) return false;
                const toCell = this.board[toRow][toCol];
                if (toCell.worker !== null) return false;
                if (toCell.dome) return false;
                const fromCell = this.board[fromRow][fromCol];
                if (toCell.height > fromCell.height + 1) return false;
                return true;
            },
            isValidBuild: function(fromRow, fromCol, toRow, toCol) {
                if (fromRow === toRow && fromCol === toCol) return false;
                const rowDiff = Math.abs(toRow - fromRow);
                const colDiff = Math.abs(toCol - fromCol);
                if (rowDiff > 1 || colDiff > 1) return false;
                const toCell = this.board[toRow][toCol];
                if (toCell.worker !== null) return false;
                if (toCell.dome) return false;
                return true;
            }
        };
    }

    placeWorkersRandomly(game, player) {
        const emptyCells = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                if (game.board[row][col].worker === null) {
                    emptyCells.push({ row, col });
                }
            }
        }

        // Place 2 workers
        for (let i = 0; i < 2; i++) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            const cell = emptyCells[randomIndex];
            game.board[cell.row][cell.col].worker = player;
            emptyCells.splice(randomIndex, 1);
        }
    }

    updateStats() {
        document.getElementById('player1-wins').textContent = this.player1Wins;
        document.getElementById('player2-wins').textContent = this.player2Wins;
        document.getElementById('total-games').textContent = this.gamesCompleted;

        const progress = (this.gamesCompleted / this.totalGames) * 100;
        const progressFill = document.getElementById('progress-fill');
        progressFill.style.width = `${progress}%`;
        progressFill.textContent = `${Math.round(progress)}%`;
    }

    log(message) {
        const logDiv = document.getElementById('game-log');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = message;
        logDiv.appendChild(entry);
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    showFinalResults(ai1Difficulty, ai2Difficulty) {
        const winRate1 = ((this.player1Wins / this.gamesCompleted) * 100).toFixed(1);
        const winRate2 = ((this.player2Wins / this.gamesCompleted) * 100).toFixed(1);

        const logDiv = document.getElementById('game-log');
        const finalEntry = document.createElement('div');
        finalEntry.className = 'log-entry win';
        finalEntry.textContent = `\nFinal Results: Player 1 (${ai1Difficulty}): ${this.player1Wins} wins (${winRate1}%) | Player 2 (${ai2Difficulty}): ${this.player2Wins} wins (${winRate2}%)`;
        logDiv.appendChild(finalEntry);
        logDiv.scrollTop = logDiv.scrollHeight;

        if (this.player1Wins > this.player2Wins) {
            this.log(`Winner: Player 1 (${ai1Difficulty}) by ${this.player1Wins - this.player2Wins} games`);
        } else if (this.player2Wins > this.player1Wins) {
            this.log(`Winner: Player 2 (${ai2Difficulty}) by ${this.player2Wins - this.player1Wins} games`);
        } else {
            this.log('Result: Tie!');
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize battle arena
const arena = new AIBattleArena();
