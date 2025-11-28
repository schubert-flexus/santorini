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

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GodPower, NoGod };
}
