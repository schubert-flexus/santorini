class SantoriniAI {
    constructor(playerNumber) {
        this.playerNumber = playerNumber;
    }

    selectMove(game, difficulty = 'easy') {
        if (difficulty === 'easy') {
            return this.selectRandomMove(game);
        } else if (difficulty === 'medium') {
            return this.selectGreedyMove(game);
        } else if (difficulty === 'hard') {
            return this.selectMinimaxMove(game);
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

    selectMinimaxMove(game) {
        const possibleMoves = this.getAllPossibleMoves(game);

        if (possibleMoves.length === 0) {
            return null;
        }

        const SEARCH_DEPTH = 2;
        let bestMove = null;
        let bestScore = -Infinity;
        const alpha = -Infinity;
        const beta = Infinity;

        for (const move of possibleMoves) {
            const clonedGame = this.cloneGameState(game);
            this.applyMove(clonedGame, move);

            // Check if this move wins immediately
            const fromHeight = game.board[move.worker.row][move.worker.col].height;
            const toHeight = game.board[move.moveTo.row][move.moveTo.col].height;
            if (fromHeight === 2 && toHeight === 3) {
                return move; // Take the win immediately
            }

            const score = this.minimax(clonedGame, SEARCH_DEPTH - 1, alpha, beta, false);

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove || possibleMoves[0];
    }

    minimax(game, depth, alpha, beta, isMaximizing) {
        const opponentPlayer = this.playerNumber === 1 ? 2 : 1;
        const currentPlayer = isMaximizing ? this.playerNumber : opponentPlayer;

        // Check terminal conditions
        if (depth === 0) {
            return this.evaluatePosition(game);
        }

        // Get all possible moves for current player
        const moves = this.getAllPossibleMovesForPlayer(game, currentPlayer);

        if (moves.length === 0) {
            // No valid moves - player loses
            return isMaximizing ? -10000 : 10000;
        }

        if (isMaximizing) {
            let maxScore = -Infinity;

            for (const move of moves) {
                const clonedGame = this.cloneGameState(game);
                this.applyMove(clonedGame, move);

                // Check for immediate win
                const fromHeight = game.board[move.worker.row][move.worker.col].height;
                const toHeight = game.board[move.moveTo.row][move.moveTo.col].height;
                if (fromHeight === 2 && toHeight === 3) {
                    return 10000; // Winning move
                }

                const score = this.minimax(clonedGame, depth - 1, alpha, beta, false);
                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);

                if (beta <= alpha) {
                    break; // Beta cutoff
                }
            }

            return maxScore;
        } else {
            let minScore = Infinity;

            for (const move of moves) {
                const clonedGame = this.cloneGameState(game);
                this.applyMove(clonedGame, move);

                // Check if opponent wins
                const fromHeight = game.board[move.worker.row][move.worker.col].height;
                const toHeight = game.board[move.moveTo.row][move.moveTo.col].height;
                if (fromHeight === 2 && toHeight === 3) {
                    return -10000; // Opponent wins
                }

                const score = this.minimax(clonedGame, depth - 1, alpha, beta, true);
                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);

                if (beta <= alpha) {
                    break; // Alpha cutoff
                }
            }

            return minScore;
        }
    }

    evaluatePosition(game) {
        const WEIGHTS = {
            HEIGHT: 100,
            MOBILITY: 10,
            THREAT_LEVEL_2: 500,
            OPPONENT_MOBILITY: -8,
            CENTER_CONTROL: 20
        };

        let score = 0;
        const opponentPlayer = this.playerNumber === 1 ? 2 : 1;

        // Evaluate for our workers
        const myWorkers = this.getMyWorkers(game);
        for (const worker of myWorkers) {
            const height = game.board[worker.row][worker.col].height;
            score += height * WEIGHTS.HEIGHT;

            // Mobility
            const validMoves = game.getValidMoves(worker.row, worker.col);
            score += validMoves.length * WEIGHTS.MOBILITY;

            // Threat detection (level 2 near level 3)
            if (height === 2) {
                const adjacentCells = this.getAdjacentCells(worker.row, worker.col);
                for (const cell of adjacentCells) {
                    if (game.board[cell.row][cell.col].height === 3 &&
                        !game.board[cell.row][cell.col].dome &&
                        game.board[cell.row][cell.col].worker === null) {
                        score += WEIGHTS.THREAT_LEVEL_2;
                    }
                }
            }

            // Center control (distance from center)
            const centerDist = Math.abs(worker.row - 2) + Math.abs(worker.col - 2);
            score += (4 - centerDist) * WEIGHTS.CENTER_CONTROL;
        }

        // Evaluate opponent workers
        const opponentWorkers = this.getOpponentWorkers(game, opponentPlayer);
        for (const worker of opponentWorkers) {
            const height = game.board[worker.row][worker.col].height;
            score -= height * WEIGHTS.HEIGHT;

            // Opponent mobility
            const validMoves = game.getValidMoves(worker.row, worker.col);
            score += validMoves.length * WEIGHTS.OPPONENT_MOBILITY;

            // Opponent threats
            if (height === 2) {
                const adjacentCells = this.getAdjacentCells(worker.row, worker.col);
                for (const cell of adjacentCells) {
                    if (game.board[cell.row][cell.col].height === 3 &&
                        !game.board[cell.row][cell.col].dome &&
                        game.board[cell.row][cell.col].worker === null) {
                        score -= WEIGHTS.THREAT_LEVEL_2;
                    }
                }
            }
        }

        return score;
    }

    cloneGameState(game) {
        const cloned = {
            board: game.board.map(row =>
                row.map(cell => ({ ...cell }))
            ),
            currentPlayer: game.currentPlayer,
            phase: game.phase,
            getValidMoves: game.getValidMoves.bind({ board: null, isValidMove: game.isValidMove }),
            getValidBuilds: game.getValidBuilds.bind({ board: null, isValidBuild: game.isValidBuild }),
            isValidMove: game.isValidMove,
            isValidBuild: game.isValidBuild
        };

        // Bind methods to use cloned board
        cloned.getValidMoves = function(row, col) {
            const validMoves = [];
            for (let r = Math.max(0, row - 1); r <= Math.min(4, row + 1); r++) {
                for (let c = Math.max(0, col - 1); c <= Math.min(4, col + 1); c++) {
                    if (cloned.isValidMove.call({ board: cloned.board }, row, col, r, c)) {
                        validMoves.push({ row: r, col: c });
                    }
                }
            }
            return validMoves;
        };

        cloned.getValidBuilds = function(row, col) {
            const validBuilds = [];
            for (let r = Math.max(0, row - 1); r <= Math.min(4, row + 1); r++) {
                for (let c = Math.max(0, col - 1); c <= Math.min(4, col + 1); c++) {
                    if (cloned.isValidBuild.call({ board: cloned.board }, row, col, r, c)) {
                        validBuilds.push({ row: r, col: c });
                    }
                }
            }
            return validBuilds;
        };

        return cloned;
    }

    applyMove(game, move) {
        // Move worker
        game.board[move.moveTo.row][move.moveTo.col].worker = game.board[move.worker.row][move.worker.col].worker;
        game.board[move.worker.row][move.worker.col].worker = null;

        // Build
        const buildCell = game.board[move.buildAt.row][move.buildAt.col];
        if (buildCell.height < 3) {
            buildCell.height++;
        } else if (buildCell.height === 3) {
            buildCell.dome = true;
        }

        // Switch player
        game.currentPlayer = game.currentPlayer === 1 ? 2 : 1;
    }

    getAllPossibleMovesForPlayer(game, player) {
        const workers = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                if (game.board[row][col].worker === player) {
                    workers.push({ row, col });
                }
            }
        }

        const possibleMoves = [];
        for (const worker of workers) {
            const validMoves = game.getValidMoves(worker.row, worker.col);

            for (const moveTo of validMoves) {
                const validBuilds = this.getValidBuildsAfterMoveCloned(game, worker, moveTo, player);

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

    getValidBuildsAfterMoveCloned(game, worker, moveTo, player) {
        const originalCell = game.board[worker.row][worker.col];
        const targetCell = game.board[moveTo.row][moveTo.col];

        const originalWorker = originalCell.worker;
        const targetWorker = targetCell.worker;

        originalCell.worker = null;
        targetCell.worker = player;

        const validBuilds = game.getValidBuilds(moveTo.row, moveTo.col);

        originalCell.worker = originalWorker;
        targetCell.worker = targetWorker;

        return validBuilds;
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
