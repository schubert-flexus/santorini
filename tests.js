class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    assertEquals(actual, expected, message = '') {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
        }
    }

    assertTrue(value, message = '') {
        if (!value) {
            throw new Error(`${message}\nExpected true but got ${value}`);
        }
    }

    assertFalse(value, message = '') {
        if (value) {
            throw new Error(`${message}\nExpected false but got ${value}`);
        }
    }

    async run() {
        const resultsDiv = document.getElementById('test-results');
        resultsDiv.innerHTML = '';

        for (const test of this.tests) {
            const testDiv = document.createElement('div');
            testDiv.className = 'test';

            const testName = document.createElement('div');
            testName.className = 'test-name';
            testName.textContent = test.name;
            testDiv.appendChild(testName);

            try {
                await test.fn(this);
                testDiv.classList.add('pass');
                testName.textContent = '✓ ' + test.name;
                this.passed++;
            } catch (error) {
                testDiv.classList.add('fail');
                testName.textContent = '✗ ' + test.name;
                const errorDiv = document.createElement('div');
                errorDiv.className = 'test-error';
                errorDiv.textContent = error.message;
                testDiv.appendChild(errorDiv);
                this.failed++;
            }

            resultsDiv.appendChild(testDiv);
        }

        const summary = document.createElement('div');
        summary.className = 'summary';
        summary.textContent = `Tests: ${this.passed} passed, ${this.failed} failed, ${this.tests.length} total`;

        if (this.failed === 0) {
            summary.classList.add('all-pass');
        } else {
            summary.classList.add('some-fail');
        }

        resultsDiv.appendChild(summary);
    }
}

function createMockGame() {
    const mockBoard = document.createElement('div');
    mockBoard.id = 'board';
    const mockStatus = document.createElement('div');
    mockStatus.id = 'status';
    const mockResetBtn = document.createElement('button');
    mockResetBtn.id = 'reset-btn';

    const oldBoard = document.getElementById('board');
    const oldStatus = document.getElementById('status');
    const oldResetBtn = document.getElementById('reset-btn');

    if (oldBoard) oldBoard.remove();
    if (oldStatus) oldStatus.remove();
    if (oldResetBtn) oldResetBtn.remove();

    document.body.appendChild(mockBoard);
    document.body.appendChild(mockStatus);
    document.body.appendChild(mockResetBtn);

    return new SantoriniGame();
}

const runner = new TestRunner();

runner.test('Game initializes with empty 5x5 board', (assert) => {
    const game = createMockGame();
    assert.assertEquals(game.board.length, 5, 'Board should have 5 rows');
    assert.assertEquals(game.board[0].length, 5, 'Board should have 5 columns');

    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            assert.assertEquals(game.board[row][col].height, 0, `Cell [${row},${col}] should start with height 0`);
            assert.assertEquals(game.board[row][col].dome, false, `Cell [${row},${col}] should not have a dome`);
            assert.assertEquals(game.board[row][col].worker, null, `Cell [${row},${col}] should not have a worker`);
        }
    }
});

runner.test('Game starts in placement phase with player 1', (assert) => {
    const game = createMockGame();
    assert.assertEquals(game.phase, 'placement', 'Game should start in placement phase');
    assert.assertEquals(game.currentPlayer, 1, 'Player 1 should go first');
    assert.assertEquals(game.workersPlaced[1], 0, 'Player 1 should have 0 workers placed');
    assert.assertEquals(game.workersPlaced[2], 0, 'Player 2 should have 0 workers placed');
});

runner.test('Players can place workers during placement phase', (assert) => {
    const game = createMockGame();

    game.handlePlacement(0, 0);
    assert.assertEquals(game.board[0][0].worker, 1, 'Player 1 worker should be at [0,0]');
    assert.assertEquals(game.workersPlaced[1], 1, 'Player 1 should have 1 worker placed');
    assert.assertEquals(game.currentPlayer, 1, 'Should still be player 1 turn');

    game.handlePlacement(0, 1);
    assert.assertEquals(game.board[0][1].worker, 1, 'Player 1 worker should be at [0,1]');
    assert.assertEquals(game.workersPlaced[1], 2, 'Player 1 should have 2 workers placed');
    assert.assertEquals(game.currentPlayer, 2, 'Should switch to player 2');

    game.handlePlacement(4, 4);
    assert.assertEquals(game.board[4][4].worker, 2, 'Player 2 worker should be at [4,4]');
    assert.assertEquals(game.workersPlaced[2], 1, 'Player 2 should have 1 worker placed');

    game.handlePlacement(4, 3);
    assert.assertEquals(game.board[4][3].worker, 2, 'Player 2 worker should be at [4,3]');
    assert.assertEquals(game.workersPlaced[2], 2, 'Player 2 should have 2 workers placed');
    assert.assertEquals(game.phase, 'move', 'Should transition to move phase');
    assert.assertEquals(game.currentPlayer, 1, 'Should switch back to player 1');
});

runner.test('Cannot place worker on occupied cell', (assert) => {
    const game = createMockGame();

    game.handlePlacement(2, 2);
    assert.assertEquals(game.board[2][2].worker, 1, 'Player 1 worker should be at [2,2]');

    game.handlePlacement(2, 2);
    assert.assertEquals(game.board[2][2].worker, 1, 'Worker at [2,2] should still be player 1');
    assert.assertEquals(game.workersPlaced[1], 1, 'Player 1 should still have 1 worker placed');
});

runner.test('isValidMove returns false for non-adjacent cells', (assert) => {
    const game = createMockGame();
    game.board[2][2].worker = 1;

    assert.assertFalse(game.isValidMove(2, 2, 0, 0), 'Should not allow move to non-adjacent cell');
    assert.assertFalse(game.isValidMove(2, 2, 4, 4), 'Should not allow move to non-adjacent cell');
    assert.assertFalse(game.isValidMove(2, 2, 2, 4), 'Should not allow move to non-adjacent cell');
});

runner.test('isValidMove returns true for adjacent empty cells at same height', (assert) => {
    const game = createMockGame();
    game.board[2][2].worker = 1;

    assert.assertTrue(game.isValidMove(2, 2, 2, 3), 'Should allow move to adjacent cell (right)');
    assert.assertTrue(game.isValidMove(2, 2, 2, 1), 'Should allow move to adjacent cell (left)');
    assert.assertTrue(game.isValidMove(2, 2, 1, 2), 'Should allow move to adjacent cell (up)');
    assert.assertTrue(game.isValidMove(2, 2, 3, 2), 'Should allow move to adjacent cell (down)');
    assert.assertTrue(game.isValidMove(2, 2, 1, 1), 'Should allow move to adjacent cell (diagonal)');
    assert.assertTrue(game.isValidMove(2, 2, 3, 3), 'Should allow move to adjacent cell (diagonal)');
});

runner.test('isValidMove returns false for occupied cells', (assert) => {
    const game = createMockGame();
    game.board[2][2].worker = 1;
    game.board[2][3].worker = 2;

    assert.assertFalse(game.isValidMove(2, 2, 2, 3), 'Should not allow move to occupied cell');
});

runner.test('isValidMove returns false for cells with domes', (assert) => {
    const game = createMockGame();
    game.board[2][2].worker = 1;
    game.board[2][3].height = 3;
    game.board[2][3].dome = true;

    assert.assertFalse(game.isValidMove(2, 2, 2, 3), 'Should not allow move to domed cell');
});

runner.test('isValidMove returns false when height difference is more than 1', (assert) => {
    const game = createMockGame();
    game.board[2][2].worker = 1;
    game.board[2][2].height = 0;
    game.board[2][3].height = 2;

    assert.assertFalse(game.isValidMove(2, 2, 2, 3), 'Should not allow move up 2 levels');
});

runner.test('isValidMove returns true when moving up 1 level', (assert) => {
    const game = createMockGame();
    game.board[2][2].worker = 1;
    game.board[2][2].height = 1;
    game.board[2][3].height = 2;

    assert.assertTrue(game.isValidMove(2, 2, 2, 3), 'Should allow move up 1 level');
});

runner.test('isValidMove returns true when moving down any number of levels', (assert) => {
    const game = createMockGame();
    game.board[2][2].worker = 1;
    game.board[2][2].height = 3;
    game.board[2][3].height = 0;

    assert.assertTrue(game.isValidMove(2, 2, 2, 3), 'Should allow move down multiple levels');
});

runner.test('isValidBuild returns false for non-adjacent cells', (assert) => {
    const game = createMockGame();

    assert.assertFalse(game.isValidBuild(2, 2, 0, 0), 'Should not allow build on non-adjacent cell');
    assert.assertFalse(game.isValidBuild(2, 2, 4, 4), 'Should not allow build on non-adjacent cell');
});

runner.test('isValidBuild returns true for adjacent empty cells', (assert) => {
    const game = createMockGame();

    assert.assertTrue(game.isValidBuild(2, 2, 2, 3), 'Should allow build on adjacent empty cell');
    assert.assertTrue(game.isValidBuild(2, 2, 1, 1), 'Should allow build on adjacent empty cell (diagonal)');
});

runner.test('isValidBuild returns false for occupied cells', (assert) => {
    const game = createMockGame();
    game.board[2][3].worker = 2;

    assert.assertFalse(game.isValidBuild(2, 2, 2, 3), 'Should not allow build on occupied cell');
});

runner.test('isValidBuild returns false for domed cells', (assert) => {
    const game = createMockGame();
    game.board[2][3].height = 3;
    game.board[2][3].dome = true;

    assert.assertFalse(game.isValidBuild(2, 2, 2, 3), 'Should not allow build on domed cell');
});

runner.test('Building increases height up to level 3, then adds dome', (assert) => {
    const game = createMockGame();

    game.board[2][2].worker = 1;
    game.board[4][4].worker = 2;

    assert.assertEquals(game.board[2][3].height, 0, 'Cell should start at height 0');

    game.phase = 'build';
    game.workerToMove = { row: 2, col: 2 };
    game.handleBuild(2, 3);
    assert.assertEquals(game.board[2][3].height, 1, 'Cell should be at height 1 after first build');

    game.phase = 'build';
    game.workerToMove = { row: 2, col: 2 };
    game.handleBuild(2, 3);
    assert.assertEquals(game.board[2][3].height, 2, 'Cell should be at height 2 after second build');

    game.phase = 'build';
    game.workerToMove = { row: 2, col: 2 };
    game.handleBuild(2, 3);
    assert.assertEquals(game.board[2][3].height, 3, 'Cell should be at height 3 after third build');
    assert.assertEquals(game.board[2][3].dome, false, 'Cell should not have dome yet');

    game.phase = 'build';
    game.workerToMove = { row: 2, col: 2 };
    game.handleBuild(2, 3);
    assert.assertEquals(game.board[2][3].dome, true, 'Cell should have dome after fourth build');
});

runner.test('Win condition: moving from level 2 to level 3', (assert) => {
    const game = createMockGame();

    game.board[2][2].worker = 1;
    game.board[2][2].height = 2;
    game.board[2][3].height = 3;
    game.board[4][4].worker = 2;

    game.phase = 'move';
    game.currentPlayer = 1;

    game.handleMove(2, 2);
    game.handleMove(2, 3);

    assert.assertEquals(game.phase, 'gameover', 'Game should be over');
    assert.assertEquals(game.board[2][3].worker, 1, 'Winner worker should be on level 3');
});

runner.test('Turn switches after move and build', (assert) => {
    const game = createMockGame();

    game.board[0][0].worker = 1;
    game.board[4][4].worker = 2;
    game.phase = 'move';
    game.currentPlayer = 1;

    game.handleMove(0, 0);
    assert.assertEquals(game.currentPlayer, 1, 'Should still be player 1 during move');

    game.handleMove(0, 1);
    assert.assertEquals(game.phase, 'build', 'Should transition to build phase');
    assert.assertEquals(game.currentPlayer, 1, 'Should still be player 1 during build');

    game.handleBuild(0, 2);
    assert.assertEquals(game.phase, 'move', 'Should transition back to move phase');
    assert.assertEquals(game.currentPlayer, 2, 'Should switch to player 2');
});

runner.test('getValidMoves returns all valid adjacent moves', (assert) => {
    const game = createMockGame();
    game.board[2][2].worker = 1;
    game.board[2][3].worker = 2;

    const validMoves = game.getValidMoves(2, 2);

    assert.assertEquals(validMoves.length, 7, 'Should have 7 valid moves (8 adjacent - 1 occupied)');

    const hasMove = (row, col) => validMoves.some(m => m.row === row && m.col === col);
    assert.assertTrue(hasMove(1, 1), 'Should include diagonal move');
    assert.assertTrue(hasMove(1, 2), 'Should include up move');
    assert.assertTrue(hasMove(2, 1), 'Should include left move');
    assert.assertFalse(hasMove(2, 3), 'Should not include occupied cell');
});

runner.test('getValidBuilds returns all valid adjacent build locations', (assert) => {
    const game = createMockGame();
    game.board[2][2].worker = 1;
    game.board[2][3].worker = 2;
    game.board[1][1].dome = true;

    const validBuilds = game.getValidBuilds(2, 2);

    assert.assertEquals(validBuilds.length, 6, 'Should have 6 valid builds (8 adjacent - 1 occupied - 1 domed)');

    const hasBuild = (row, col) => validBuilds.some(b => b.row === row && b.col === col);
    assert.assertTrue(hasBuild(1, 2), 'Should include up build');
    assert.assertTrue(hasBuild(2, 1), 'Should include left build');
    assert.assertFalse(hasBuild(2, 3), 'Should not include occupied cell');
    assert.assertFalse(hasBuild(1, 1), 'Should not include domed cell');
});

runner.test('Reset clears the game state', (assert) => {
    const game = createMockGame();

    game.board[0][0].worker = 1;
    game.board[0][1].height = 2;
    game.phase = 'move';
    game.currentPlayer = 2;

    game.reset();

    assert.assertEquals(game.phase, 'placement', 'Phase should reset to placement');
    assert.assertEquals(game.currentPlayer, 1, 'Current player should reset to 1');
    assert.assertEquals(game.board[0][0].worker, null, 'Board should be cleared');
    assert.assertEquals(game.board[0][1].height, 0, 'Building heights should be reset');
});

runner.run();
