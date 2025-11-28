class SantoriniAI {
    constructor(playerNumber) {
        this.playerNumber = playerNumber;
    }

    selectMove(game, difficulty = 'easy') {
        if (difficulty === 'easy') {
            return this.selectRandomMove(game);
        } else if (difficulty === 'medium') {
            return this.selectGreedyMove(game);
        }
        return null;
    }

    selectRandomMove(game) {
        const possibleMoves = this.getAllPossibleMoves(game);

        if (possibleMoves.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * possibleMoves.length);
        return possibleMoves[randomIndex];
    }

    selectGreedyMove(game) {
        const possibleMoves = this.getAllPossibleMoves(game);

        if (possibleMoves.length === 0) {
            return null;
        }

        // 1. Win immediately - move from level 2 to level 3
        for (const move of possibleMoves) {
            const fromHeight = game.board[move.worker.row][move.worker.col].height;
            const toHeight = game.board[move.moveTo.row][move.moveTo.col].height;

            if (fromHeight === 2 && toHeight === 3) {
                return move;
            }
        }

        // 2. Block opponent win
        const opponentPlayer = this.playerNumber === 1 ? 2 : 1;
        const opponentWorkers = this.getOpponentWorkers(game, opponentPlayer);

        // Find opponent workers on level 2
        const threateningWorkers = opponentWorkers.filter(w =>
            game.board[w.row][w.col].height === 2
        );

        // Check if any threatening worker is adjacent to level 3
        for (const worker of threateningWorkers) {
            const adjacentCells = this.getAdjacentCells(worker.row, worker.col);

            for (const cell of adjacentCells) {
                if (game.board[cell.row][cell.col].height === 3 &&
                    !game.board[cell.row][cell.col].dome &&
                    game.board[cell.row][cell.col].worker === null) {

                    // First choice: Move our worker to that level 3 (if we're on level 2, we also win!)
                    for (const move of possibleMoves) {
                        if (move.moveTo.row === cell.row && move.moveTo.col === cell.col) {
                            const fromHeight = game.board[move.worker.row][move.worker.col].height;
                            if (fromHeight === 2) {
                                return move; // This also wins!
                            }
                        }
                    }

                    // Second choice: Build a dome on that level 3 to block
                    for (const move of possibleMoves) {
                        if (move.buildAt.row === cell.row && move.buildAt.col === cell.col) {
                            return move;
                        }
                    }
                }
            }
        }

        // 3. Create winning threat - move to level 2 adjacent to level 3
        for (const move of possibleMoves) {
            const toHeight = game.board[move.moveTo.row][move.moveTo.col].height;

            if (toHeight === 2) {
                const adjacentCells = this.getAdjacentCells(move.moveTo.row, move.moveTo.col);

                for (const cell of adjacentCells) {
                    if (game.board[cell.row][cell.col].height === 3 &&
                        !game.board[cell.row][cell.col].dome) {
                        return move;
                    }
                }
            }
        }

        // 4. Build upward strategically - prefer moves that climb higher
        for (const move of possibleMoves) {
            const fromHeight = game.board[move.worker.row][move.worker.col].height;
            const toHeight = game.board[move.moveTo.row][move.moveTo.col].height;

            if (toHeight > fromHeight) {
                return move;
            }
        }

        // 5. Fallback to random
        const randomIndex = Math.floor(Math.random() * possibleMoves.length);
        return possibleMoves[randomIndex];
    }

    getAllPossibleMoves(game) {
        const workers = this.getMyWorkers(game);
        const possibleMoves = [];

        for (const worker of workers) {
            const validMoves = game.getValidMoves(worker.row, worker.col);

            for (const moveTo of validMoves) {
                const validBuilds = this.getValidBuildsAfterMove(game, worker, moveTo);

                for (const buildAt of validBuilds) {
                    possibleMoves.push({
                        worker: { row: worker.row, col: worker.col },
                        moveTo: { row: moveTo.row, col: moveTo.col },
                        buildAt: { row: buildAt.row, col: buildAt.col }
                    });
                }
            }
        }

        return possibleMoves;
    }

    getOpponentWorkers(game, opponentPlayer) {
        const workers = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                if (game.board[row][col].worker === opponentPlayer) {
                    workers.push({ row, col });
                }
            }
        }
        return workers;
    }

    getAdjacentCells(row, col) {
        const adjacent = [];
        for (let r = Math.max(0, row - 1); r <= Math.min(4, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(4, col + 1); c++) {
                if (r !== row || c !== col) {
                    adjacent.push({ row: r, col: c });
                }
            }
        }
        return adjacent;
    }

    getMyWorkers(game) {
        const workers = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                if (game.board[row][col].worker === this.playerNumber) {
                    workers.push({ row, col });
                }
            }
        }
        return workers;
    }

    getValidBuildsAfterMove(game, worker, moveTo) {
        const originalCell = game.board[worker.row][worker.col];
        const targetCell = game.board[moveTo.row][moveTo.col];

        originalCell.worker = null;
        targetCell.worker = this.playerNumber;

        const validBuilds = game.getValidBuilds(moveTo.row, moveTo.col);

        originalCell.worker = this.playerNumber;
        targetCell.worker = null;

        return validBuilds;
    }

    executeMove(game, move) {
        if (!move) {
            console.error('No valid moves available for AI');
            return false;
        }

        game.handleMove(move.worker.row, move.worker.col);

        setTimeout(() => {
            game.handleMove(move.moveTo.row, move.moveTo.col);

            setTimeout(() => {
                game.handleBuild(move.buildAt.row, move.buildAt.col);
            }, 500);
        }, 500);

        return true;
    }
}
