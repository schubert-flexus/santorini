class SantoriniGame {
    constructor() {
        this.board = Array(5).fill(null).map(() =>
            Array(5).fill(null).map(() => ({ height: 0, dome: false, worker: null }))
        );
        this.currentPlayer = 1;
        this.phase = 'placement'; // placement, move, build
        this.workersPlaced = { 1: 0, 2: 0 };
        this.selectedWorker = null;
        this.selectedCell = null;
        this.workerToMove = null;
        this.moveFrom = null;
        this.gameMode = 'pvp';
        this.aiDifficulty = 'easy';
        this.ai = null;

        this.initBoard();
        this.attachEventListeners();
        this.updateStatus();
    }

    initBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';

        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                boardElement.appendChild(cell);
            }
        }
    }

    attachEventListeners() {
        const boardElement = document.getElementById('board');
        if (boardElement) {
            boardElement.addEventListener('click', (e) => {
                const cell = e.target.closest('.cell');
                if (cell) {
                    const row = parseInt(cell.dataset.row);
                    const col = parseInt(cell.dataset.col);
                    this.handleCellClick(row, col);
                }
            });
        }

        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.reset();
            });
        }

        const gameModeElement = document.getElementById('game-mode');
        if (gameModeElement) {
            gameModeElement.addEventListener('change', (e) => {
                this.gameMode = e.target.value;
                const difficultyGroup = document.getElementById('difficulty-group');
                if (this.gameMode === 'pve') {
                    difficultyGroup.style.display = 'flex';
                    this.ai = new SantoriniAI(2);
                } else {
                    difficultyGroup.style.display = 'none';
                    this.ai = null;
                }
                this.reset();
            });
        }

        const aiDifficultyElement = document.getElementById('ai-difficulty');
        if (aiDifficultyElement) {
            aiDifficultyElement.addEventListener('change', (e) => {
                this.aiDifficulty = e.target.value;
            });
        }
    }

    handleCellClick(row, col) {
        if (this.gameMode === 'pve' && this.currentPlayer === 2) {
            return;
        }

        if (this.phase === 'placement') {
            this.handlePlacement(row, col);
        } else if (this.phase === 'move') {
            this.handleMove(row, col);
        } else if (this.phase === 'build') {
            this.handleBuild(row, col);
        }
    }

    handlePlacement(row, col) {
        const cell = this.board[row][col];

        if (cell.worker !== null) {
            return;
        }

        cell.worker = this.currentPlayer;
        this.workersPlaced[this.currentPlayer]++;

        if (this.workersPlaced[this.currentPlayer] === 2) {
            if (this.currentPlayer === 1) {
                this.currentPlayer = 2;
            } else {
                this.phase = 'move';
                this.currentPlayer = 1;
            }
        }

        this.render();
        this.updateStatus();

        if (this.gameMode === 'pve' && this.currentPlayer === 2 && this.phase === 'placement') {
            setTimeout(() => this.aiPlaceWorkers(), 500);
        }
    }

    aiPlaceWorkers() {
        const emptyCells = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                if (this.board[row][col].worker === null) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            const cell = emptyCells[randomIndex];
            this.handlePlacement(cell.row, cell.col);
        }
    }

    handleMove(row, col) {
        const cell = this.board[row][col];

        if (this.selectedWorker === null) {
            if (cell.worker === this.currentPlayer) {
                this.selectedWorker = { row, col };
                this.selectedCell = { row, col };
                this.render();
                this.highlightValidMoves(row, col);
                this.updateStatus();
            }
        } else {
            if (this.isValidMove(this.selectedWorker.row, this.selectedWorker.col, row, col)) {
                const fromHeight = this.board[this.selectedWorker.row][this.selectedWorker.col].height;

                this.board[row][col].worker = this.currentPlayer;
                this.board[this.selectedWorker.row][this.selectedWorker.col].worker = null;

                this.moveFrom = { row: this.selectedWorker.row, col: this.selectedWorker.col };
                this.workerToMove = { row, col };

                const toHeight = this.board[row][col].height;
                if (fromHeight === 2 && toHeight === 3) {
                    this.render();
                    this.updateStatus(`Player ${this.currentPlayer} wins!`);
                    this.phase = 'gameover';
                    return;
                }

                this.selectedWorker = null;
                this.selectedCell = { row, col };
                this.phase = 'build';
                this.render();
                this.highlightValidBuilds(row, col);
                this.updateStatus();
            }
        }
    }

    handleBuild(row, col) {
        if (this.isValidBuild(this.workerToMove.row, this.workerToMove.col, row, col)) {
            const cell = this.board[row][col];

            if (cell.height < 3) {
                cell.height++;
            } else if (cell.height === 3) {
                cell.dome = true;
            }

            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.phase = 'move';
            this.selectedCell = null;
            this.workerToMove = null;
            this.moveFrom = null;

            this.render();
            this.updateStatus();

            if (this.gameMode === 'pve' && this.currentPlayer === 2 && this.phase === 'move') {
                setTimeout(() => this.aiTakeTurn(), 500);
            }
        }
    }

    aiTakeTurn() {
        if (this.phase !== 'move' || this.currentPlayer !== 2 || !this.ai) {
            return;
        }

        const move = this.ai.selectMove(this, this.aiDifficulty);

        if (!move) {
            this.updateStatus('AI has no valid moves. Player 1 wins!');
            this.phase = 'gameover';
            return;
        }

        this.handleMove(move.worker.row, move.worker.col);

        setTimeout(() => {
            this.handleMove(move.moveTo.row, move.moveTo.col);

            setTimeout(() => {
                this.handleBuild(move.buildAt.row, move.buildAt.col);
            }, 500);
        }, 500);
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
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
    }

    isValidBuild(fromRow, fromCol, toRow, toCol) {
        if (fromRow === toRow && fromCol === toCol) return false;

        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        if (rowDiff > 1 || colDiff > 1) return false;

        const toCell = this.board[toRow][toCol];
        if (toCell.worker !== null) return false;

        if (toCell.dome) return false;

        return true;
    }

    getValidMoves(row, col) {
        const validMoves = [];
        for (let r = Math.max(0, row - 1); r <= Math.min(4, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(4, col + 1); c++) {
                if (this.isValidMove(row, col, r, c)) {
                    validMoves.push({ row: r, col: c });
                }
            }
        }
        return validMoves;
    }

    getValidBuilds(row, col) {
        const validBuilds = [];
        for (let r = Math.max(0, row - 1); r <= Math.min(4, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(4, col + 1); c++) {
                if (this.isValidBuild(row, col, r, c)) {
                    validBuilds.push({ row: r, col: c });
                }
            }
        }
        return validBuilds;
    }

    highlightValidMoves(row, col) {
        const validMoves = this.getValidMoves(row, col);
        validMoves.forEach(move => {
            const cell = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
            cell.classList.add('selectable');
        });
    }

    highlightValidBuilds(row, col) {
        const validBuilds = this.getValidBuilds(row, col);
        validBuilds.forEach(build => {
            const cell = document.querySelector(`[data-row="${build.row}"][data-col="${build.col}"]`);
            cell.classList.add('selectable');
        });
    }

    render() {
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cell.innerHTML = '';
                cell.className = 'cell';

                if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
                    cell.classList.add('selected');
                }

                const cellData = this.board[row][col];

                if (cellData.height > 0 || cellData.dome) {
                    const building = document.createElement('div');
                    building.className = 'building';

                    for (let i = 1; i <= cellData.height; i++) {
                        const level = document.createElement('div');
                        level.className = `level level-${i}`;
                        building.appendChild(level);
                    }

                    if (cellData.dome) {
                        const dome = document.createElement('div');
                        dome.className = 'dome';
                        building.appendChild(dome);
                    }

                    cell.appendChild(building);
                }

                if (cellData.worker !== null) {
                    const worker = document.createElement('div');
                    worker.className = `worker player${cellData.worker}`;
                    worker.textContent = cellData.worker;
                    cell.appendChild(worker);
                }
            }
        }
    }

    updateStatus(message = null) {
        const statusElement = document.getElementById('status');

        if (message) {
            statusElement.textContent = message;
            return;
        }

        const playerName = (this.gameMode === 'pve' && this.currentPlayer === 2) ? 'AI' : `Player ${this.currentPlayer}`;

        if (this.phase === 'placement') {
            const remaining = 2 - this.workersPlaced[this.currentPlayer];
            statusElement.textContent = `${playerName}: Place ${remaining} worker(s)`;
        } else if (this.phase === 'move') {
            if (this.selectedWorker) {
                statusElement.textContent = `${playerName}: Select where to move`;
            } else {
                statusElement.textContent = `${playerName}: Select a worker to move`;
            }
        } else if (this.phase === 'build') {
            statusElement.textContent = `${playerName}: Select where to build`;
        }
    }

    reset() {
        this.board = Array(5).fill(null).map(() =>
            Array(5).fill(null).map(() => ({ height: 0, dome: false, worker: null }))
        );
        this.currentPlayer = 1;
        this.phase = 'placement';
        this.workersPlaced = { 1: 0, 2: 0 };
        this.selectedWorker = null;
        this.selectedCell = null;
        this.workerToMove = null;
        this.moveFrom = null;

        this.render();
        this.updateStatus();
    }
}

// Only instantiate the game if we're in the actual game environment (not tests)
if (typeof window !== 'undefined' && document.getElementById('board')) {
    const game = new SantoriniGame();
}
