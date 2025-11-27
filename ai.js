class SantoriniAI {
    constructor(playerNumber) {
        this.playerNumber = playerNumber;
    }

    selectMove(game, difficulty = 'easy') {
        if (difficulty === 'easy') {
            return this.selectRandomMove(game);
        }
        return null;
    }

    selectRandomMove(game) {
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

        if (possibleMoves.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * possibleMoves.length);
        return possibleMoves[randomIndex];
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
