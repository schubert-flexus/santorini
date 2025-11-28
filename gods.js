// Base class for god powers
class GodPower {
    constructor(playerNumber) {
        this.playerNumber = playerNumber;
        this.name = 'None';
        this.description = 'Standard Santorini rules';
    }

    // Modify valid moves for a worker
    // Returns modified array of valid moves
    modifyValidMoves(game, fromRow, fromCol, validMoves) {
        return validMoves;
    }

    // Modify valid builds after a move
    // Returns modified array of valid build locations
    modifyValidBuilds(game, fromRow, fromCol, validBuilds) {
        return validBuilds;
    }

    // Check for alternative win conditions
    // Returns true if player wins, false otherwise
    checkWinCondition(game, move) {
        return false;
    }

    // Called at the start of a turn (before move selection)
    onTurnStart(game) {
        // Override in subclasses
    }

    // Called after a move is made but before building
    onAfterMove(game, fromRow, fromCol, toRow, toCol) {
        // Override in subclasses
    }

    // Called after a build is made
    onAfterBuild(game, buildRow, buildCol) {
        // Override in subclasses
    }

    // Called at the end of a turn (after build)
    onTurnEnd(game) {
        // Override in subclasses
    }

    // Check if the standard move validation should be modified
    // Return null to use standard rules, or return boolean to override
    overrideIsValidMove(game, fromRow, fromCol, toRow, toCol) {
        return null; // null means use standard rules
    }

    // Check if the standard build validation should be modified
    // Return null to use standard rules, or return boolean to override
    overrideIsValidBuild(game, fromRow, fromCol, toRow, toCol) {
        return null; // null means use standard rules
    }

    // Execute a move (can be overridden for special move mechanics like Apollo's swap)
    // Default implementation is standard move
    executeMove(game, fromRow, fromCol, toRow, toCol) {
        // Standard move: move worker to new position, clear old position
        game.board[toRow][toCol].worker = this.playerNumber;
        game.board[fromRow][fromCol].worker = null;
    }

    // Returns true if turn should continue after build (e.g., Demeter's second build)
    shouldContinueTurn(game) {
        return false;
    }

    // Modify turn structure (e.g., build before move, build twice)
    // Returns custom turn phases or null for standard
    getCustomTurnPhases() {
        return null; // null means standard: move -> build
    }
}

// No god power (standard rules)
class NoGod extends GodPower {
    constructor(playerNumber) {
        super(playerNumber);
        this.name = 'None';
        this.description = 'Standard Santorini rules';
    }
}

// Pan - Win by moving down 2+ levels
class Pan extends GodPower {
    constructor(playerNumber) {
        super(playerNumber);
        this.name = 'Pan';
        this.description = 'Win: You also win if your Worker moves down two or more levels.';
    }

    checkWinCondition(game, move) {
        // Check if worker moved down 2+ levels
        const fromHeight = game.board[move.worker.row][move.worker.col].height || 0;
        const toHeight = game.board[move.moveTo.row][move.moveTo.col].height;

        if (fromHeight - toHeight >= 2) {
            return true; // Win by dropping 2+ levels
        }

        return false;
    }
}

// Apollo - Swap places with opponent workers
class Apollo extends GodPower {
    constructor(playerNumber) {
        super(playerNumber);
        this.name = 'Apollo';
        this.description = 'Your Move: Your Worker may move into an opponent Worker\'s space by forcing their Worker to the space yours just vacated.';
    }

    overrideIsValidMove(game, fromRow, fromCol, toRow, toCol) {
        // Check if target has an opponent worker
        const toCell = game.board[toRow][toCol];
        const opponentPlayer = this.playerNumber === 1 ? 2 : 1;

        if (toCell.worker === opponentPlayer) {
            // Allow moving to opponent space if it's adjacent and not too high
            const rowDiff = Math.abs(toRow - fromRow);
            const colDiff = Math.abs(toCol - fromCol);
            if (rowDiff > 1 || colDiff > 1) return false; // Not adjacent

            if (toCell.dome) return false; // Can't move to dome

            const fromCell = game.board[fromRow][fromCol];
            if (toCell.height > fromCell.height + 1) return false; // Too high

            return true; // Valid swap move
        }

        return null; // Use standard rules for non-opponent spaces
    }

    executeMove(game, fromRow, fromCol, toRow, toCol) {
        // Check if we're swapping with an opponent
        const opponentPlayer = this.playerNumber === 1 ? 2 : 1;
        const targetWorker = game.board[toRow][toCol].worker;

        if (targetWorker === opponentPlayer) {
            // Swap the workers
            game.board[toRow][toCol].worker = this.playerNumber;
            game.board[fromRow][fromCol].worker = opponentPlayer;
        } else {
            // Standard move
            game.board[toRow][toCol].worker = this.playerNumber;
            game.board[fromRow][fromCol].worker = null;
        }
    }
}

// Athena - Block opponent from climbing if you climbed
class Athena extends GodPower {
    constructor(playerNumber) {
        super(playerNumber);
        this.name = 'Athena';
        this.description = 'Opponent\'s Turn: If one of your Workers moved up on your last turn, opponent Workers cannot move up this turn.';
        this.movedUpLastTurn = false;
    }

    onAfterMove(game, fromRow, fromCol, toRow, toCol) {
        // Check if we moved up
        const fromHeight = game.board[fromRow][fromCol].height || 0;
        const toHeight = game.board[toRow][toCol].height;
        this.movedUpLastTurn = toHeight > fromHeight;
    }

    onTurnStart(game) {
        // Reset at start of our turn
        this.movedUpLastTurn = false;
    }
}

// Demeter - Build twice (not same space)
class Demeter extends GodPower {
    constructor(playerNumber) {
        super(playerNumber);
        this.name = 'Demeter';
        this.description = 'Your Build: Your Worker may build one additional time, but not on the same space.';
        this.buildCount = 0;
        this.firstBuildLocation = null;
    }

    onTurnStart(game) {
        // Reset build count at start of turn
        this.buildCount = 0;
        this.firstBuildLocation = null;
    }

    onAfterBuild(game, buildRow, buildCol) {
        this.buildCount++;
        if (this.buildCount === 1) {
            this.firstBuildLocation = { row: buildRow, col: buildCol };
        }
    }

    modifyValidBuilds(game, fromRow, fromCol, validBuilds) {
        // If this is the second build, exclude the first build location
        if (this.buildCount === 1 && this.firstBuildLocation) {
            return validBuilds.filter(build =>
                build.row !== this.firstBuildLocation.row ||
                build.col !== this.firstBuildLocation.col
            );
        }
        return validBuilds;
    }

    shouldContinueTurn(game) {
        // Continue for second build if we've only built once
        return this.buildCount === 1;
    }
}

// Helper function to get opponent's god power (for checking Athena's effect)
function getOpponentGodPower(game, playerNumber) {
    const opponentPlayer = playerNumber === 1 ? 2 : 1;
    return game.godPowers[opponentPlayer];
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GodPower, NoGod, Pan, Apollo, Athena, Demeter };
}
