const iBlock = [
    [[], [1, 1, 1, 1]],
    [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]],
    [[], [], [1, 1, 1, 1]],
    [[0, 1], [0, 1], [0, 1], [0, 1]]
]
const jBlock = [
    [[2], [2, 2, 2]],
    [[0, 2, 2], [0, 2], [0, 2]],
    [[], [2, 2, 2], [0, 0, 2]],
    [[0, 2], [0, 2], [2, 2]]
]
const lBlock = [
    [[0, 0, 3], [3, 3, 3]],
    [[0, 3], [0, 3], [0, 3, 3]],
    [[], [3, 3, 3], [3]],
    [[3, 3], [0, 3], [0, 3]]
]
const oBlock = [
    [[0, 4, 4], [0, 4, 4]],
    [[0, 4, 4], [0, 4, 4]],
    [[0, 4, 4], [0, 4, 4]],
    [[0, 4, 4], [0, 4, 4]]
]
const sBlock = [
    [[0, 5, 5], [5, 5]],
    [[0, 5], [0, 5, 5], [0, 0, 5]],
    [[], [0, 5, 5], [5, 5]],
    [[5], [5, 5], [0, 5]]
]
const tBlock = [
    [[0, 6], [6, 6, 6]],
    [[0, 6], [0, 6, 6], [0, 6]],
    [[], [6, 6, 6], [0, 6]],
    [[0, 6], [6, 6], [0, 6]]
]
const zBlock = [
    [[7, 7], [0, 7, 7]],
    [[0, 0, 7], [0, 7, 7], [0, 7]],
    [[], [7, 7], [0, 7, 7]],
    [[0, 7], [7, 7], [7]]
]
const blocks = [iBlock, jBlock, lBlock, oBlock, sBlock, tBlock, zBlock];
const row = Array.from({ length: 10 }, () => 0);
let board = Array.from({length: 23}, () => Array.from(row));
let currentBlock = 0;
let nextBlocks = [];
let holdBlock = 0;
let canHold = true;
let blockCoord = [0, 0]; // row, col
let blockRotation = 0;
let level = 1;
let score = 0;
let lines = 0;
let lockDown = false;
let lockDownCount = 0;
let gameOver = false;
let lastAction = null;
let exceptionKick = false;
let comboCount = -1;
let backToBack = -1;
let perfectClearBackToBack = false;
let messages = [];
let drawnMessages = [];
let moveDelay = 0;
let fpsTime = 0;
let dropTime = 0;
let lockDownTime = 0;
let lastMoveTime = 0;
const fps = 60;
const interval = 1000 / fps;
let dropRate = 1000;
const keys = {
    'moveLeft': false,
    'moveRight': false,
    'moveDown': false,
    'rotateLeft': false,
    'rotateRight': false,
    'fullDrop' : false,
    'hold' : false,
}

startGame();

requestAnimationFrame(gameLoop);

function gameLoop(timestamp) {
    const deltaTime = timestamp - fpsTime;
    dropTime += deltaTime;
    lastMoveTime += deltaTime;

    if (deltaTime >= interval) {
        fpsTime = timestamp - (deltaTime % interval);
        if (canBlockDrop()) {
            if (lockDown) {
                lockDown = false;
                dropTime = 0;
            }
        } else {
            if (!lockDown) {
                lockDown = true;
                lockDownTime = 0;
            }
        }
        
        if (lockDownCount >= 15) {
            if (canBlockDrop()) {
                dropBlock();
            } else {
                lockDown = false;
                lockDownCount = 0;
                dropTime = 0;
                clearLines();
                spawnBlock();
            }
        }
        drawGame();
    }

    if (dropTime >= dropRate) {
        dropTime -= dropRate;
        if (!lockDown) {
            dropBlock();
        }
    }

    if (keys.moveDown && dropTime >= 50) {
        dropTime -= 50;
        if (!lockDown) {
            dropBlock();
            score += 1;
        }
    }


    if (lockDown) {
        lockDownTime += deltaTime;
    }

    if (lockDownTime >= 500) {
        lockDownTime = 0;
        lockDown = false;
        lockDownCount = 0;
        clearLines();
        spawnBlock();
    }

    if (keys.moveLeft && lastMoveTime > 100) {
        if (moveDelay !== 1) {
            move('left');
            // console.log(getDropPreview());
        }
        lastMoveTime = 0;
        moveDelay++;
    }
    if (keys.moveRight && lastMoveTime > 100) {
        if (moveDelay !== 1) {
            move('right');
            // console.log(getDropPreview());
        }
        lastMoveTime = 0;
        moveDelay++;
    }

    if (keys.hold && canHold) {
        const oldHoldBlock = holdBlock;
        if (holdBlock === 0) {
            clearBlock();
            holdBlock = currentBlock;
            currentBlock = nextBlocks[0];
            nextBlocks.splice(0, 1);
            blockCoord = [3, 3];
            dropTime = 0;
        } else {
            clearBlock();
            holdBlock = currentBlock;
            currentBlock = oldHoldBlock;
            blockCoord = [3, 3];
            dropTime = 0;
        }
        canHold = false;
    }

    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    pickNextBlocks();
    // board[4][4] = 9;
    // board[3][4] = 9;
    // board[3][8] = 9;
    // board[3][1] = 9;
    spawnBlock();
}

function dropBlock() {
    lockDownCount = 0;
    clearBlock();
    blockCoord[0]++;
    addBlock();
    lastAction = 'drop';
}

function canBlockDrop() {
    clearBlock();
    blockDrop = true;
    const block = blocks[currentBlock - 1][blockRotation]
    for (let i = 0; i < block.length; i ++) {
        for (let k = 0; k < block[i].length; k++) {
            // If block won't be able to fall any lower next drop
            if (block[i][k] !== 0 && (blockCoord[0] + i > 21 || board[blockCoord[0] + i + 1][blockCoord[1] + k] !== 0)) {
                blockDrop = false;
            }
        }
    }
    addBlock();
    return blockDrop;
}

function pickNextBlocks() {
    const arr = [1, 2, 3, 4, 5, 6, 7];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    nextBlocks.push(...arr)
}

function isBlockClear(block, row, col) {
    for (let i = 0; i < block.length; i ++) {
        for (let k = 0; k < block[i].length; k++) {
            if (block[i][k] !== 0) {
                if (board[i + row][k + col] !== 0) {
                    return false;
                }
            }
        }
    }
    return true;
}

function spawnBlock() {
    canHold = true;
    const block = blocks[nextBlocks[0] - 1][0];
    let spawnRow = 0;
    if (!isBlockClear(block, 3, 3)) {
        if (isBlockClear(block, 2, 3)) {
            spawnRow = 2;
        } else {
            console.log('Game Over');
            gameOver = true;
        }
    } else {
        spawnRow = 3;
    }
    for (let i = 0; i < block.length; i++) {
        for (let k = 0; k < block[i].length; k++) {
            if (block[i][k] !== 0) {
                board[i + spawnRow][k + 3] = block[i][k];
            }
        }
    }
    blockCoord = [spawnRow, 3];
    blockRotation = 0;
    currentBlock = nextBlocks[0];
    nextBlocks.splice(0, 1);
    if (nextBlocks.length < 7) {
        pickNextBlocks();
    }
    // console.log(getDropPreview());
}

function rotate(direction) {
    clearBlock();
    if (direction === 'left') {
        change = -1;
    } else if (direction === 'right') {
        change = 1;
    }
    let newRotation = blockRotation + change;
    if (newRotation < 0) {
        newRotation = 3;
    }
    if (newRotation > 3) {
        newRotation = 0;
    }

    let kick = [];
    if (currentBlock !== 1) {
        if (blockRotation === 0) {
            if (newRotation === 1) {
                kick = [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]];
            } else if (newRotation === 3) {
                kick = [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]];
            }
        } else if (blockRotation === 1) {
            if (newRotation === 0) {
                kick = [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]];
            } else if (newRotation === 2) {
                kick = [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]];
            }
        } else if (blockRotation === 2) {
            if (newRotation === 1) {
                kick = [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]];
            } else if (newRotation === 3) {
                kick = [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]];
            }
        } else if (blockRotation === 3) {
            kick = [[0, 0], [-1, 0], [-1, -1], [0, 2], [1, 2]]
        }
    } else {
        if (blockRotation === 0) {
            if (newRotation === 1) {
                kick = [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]];
            } else if (newRotation === 3) {
                kick = [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]];
            }
        } else if (blockRotation === 1) {
            if (newRotation === 0) {
                kick = [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]];
            } else if (newRotation === 2) {
                kick = [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]];
            }
        } else if (blockRotation === 2) {
            if (newRotation === 1) {
                kick = [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]];
            } else if (newRotation === 3) {
                kick = [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]];
            }
        } else if (blockRotation === 3) {
            if (newRotation === 2) {
                kick = [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]];
            } else if (newRotation === 0) {
                kick = [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]];
            }
        }
    }

    exceptionKick = true;
    const oldRotation = blockRotation;
    blockRotation = newRotation;
    for (let i = 0; i < kick.length; i++) {
        blockCoord[0] = blockCoord[0] - kick[i][1];
        blockCoord[1] = blockCoord[1] + kick[i][0];
        if (getOffBoardAdjustment() !== 0 || isBelowBoard() || isOverLapping()) {
            blockCoord[0] = blockCoord[0] + kick[i][1];
            blockCoord[1] = blockCoord[1] - kick[i][0];
        } else {
            if (lockDown) {
                lockDownCount++;
                lockDownTime = 0;
            }
            if (i !== 4) {
                exceptionKick = false;
            }
            lastAction = 'rotate';
            return;
        }
    }
    exceptionKick = false;
    blockRotation = oldRotation;
    addBlock();
}

function isBelowBoard() {
    const block = blocks[currentBlock - 1][blockRotation];
    for (let i = 0; i < block.length; i++) {
        for (let k = 0; k < block[i].length; k++) {
            if (block[i][k] !== 0) {
                if (blockCoord[0] + i > 22) {
                    return true;
                }
            }
        }
    }
    return false;
}

function getOffBoardAdjustment() {
    const block = blocks[currentBlock - 1][blockRotation];
    let coordAdjustment = 0;
    for (let i = 0; i < block.length; i++) {
        for (let k = 0; k < block[i].length; k++) {
            if (block[i][k] !== 0) {
                if (k + blockCoord[1] < 0) {
                    if (coordAdjustment < 0 - (k + blockCoord[1]))
                        coordAdjustment = 0 - (k + blockCoord[1]);
                } else if (k + blockCoord[1] > 9) {
                    if (coordAdjustment > 0 - (k + blockCoord[1] - 9)) {
                        coordAdjustment = 0 - (k + blockCoord[1] - 9);
                    }
                }
            }
        }
    }
    return coordAdjustment;
}

function clearBlock() {
    const block = blocks[currentBlock - 1][blockRotation];
    for (let i = 0; i < block.length; i++) {
        for (let k = 0; k < block[i].length; k++) {
            if (block[i][k] !== 0) {
                board[i + blockCoord[0]][k + blockCoord[1]] = 0;
            }
        }
    }
}

function addBlock() {
    const block = blocks[currentBlock - 1][blockRotation];
    for (let i = 0; i < block.length; i++) {
        for (let k = 0; k < block[i].length; k++) {
            if (block[i][k] !== 0) {
                board[i + blockCoord[0]][k + blockCoord[1]] = block[i][k];
            }
        }
    }
}

function move(direction) {
    if (direction === 'left') {
        change = -1;
    } else if (direction === 'right') {
        change = 1;
    }
    blockCoord[1] += change;
    if (getOffBoardAdjustment() !== 0) {
        blockCoord[1] -= change;
        return;
    }
    blockCoord[1] -= change;
    clearBlock();
    blockCoord[1] += change;
    if (isOverLapping()) {
        blockCoord[1] -= change;
    } else {
        if (lockDown) {
            lockDownCount++;
            lockDownTime = 0;
        }
        lastAction = 'move';
    }
    addBlock();
}

function isOverLapping() {
    const block = blocks[currentBlock - 1][blockRotation];
    for (let i = 0; i < block.length; i++) {
        for (let k = 0; k < block[i].length; k++) {
            if (block[i][k] !== 0 && board[blockCoord[0] + i][blockCoord[1] + k] !== 0) {
                return true;
            }
        }
    }
    return false;
}

function fullDrop() {
    while(canBlockDrop()) {
        dropBlock();
        score += 2;
    }
    lockDown = true;
    lockDownTime = 9999;
}

function clearLines() {
    let linesCleared = 0;
    let points = 0;
    let tSpin = false;
    let mini = true;
    let cornerCount = 0;
    let filledCorners = [false, false, false, false];
    const corners = [[0, 0], [0, 2], [2, 0], [2, 2]];
    let lineClearY = 0;
    if (currentBlock === 6 && lastAction === 'rotate') {
        for (i = 0; i < corners.length; i++) {
            if (blockCoord[0] + corners[i][0] >= board.length || blockCoord[1] + corners[i][1] < 0 || blockCoord[1] + corners[i][1] > 9 || board[blockCoord[0] + corners[i][0]][blockCoord[1] + corners[i][1]] !== 0) {
                cornerCount++;
                filledCorners[i] = true;
            }
        }
    }
    if (cornerCount >= 3) {
        tSpin = true;
        if (blockRotation === 0 && filledCorners[0] && filledCorners[1]) {
            mini = false;
        } else if (blockRotation === 1 && filledCorners[1] && filledCorners[3]) {
            mini = false;
        } else if (blockRotation === 2 && filledCorners[2] && filledCorners[3]) {
            mini = false;
        } else if (blockRotation === 3 && filledCorners[0] && filledCorners[2]) {
            mini = false;
        }
    }
    for (let i = 0; i < board.length; i++) {
        let lineFull = true;
        for (let k = 0; k < board[i].length; k++) {
            if (board[i][k] === 0) {
                lineFull = false;
            }
        }
        if (lineFull) {
            lineClearY = i - 3;
            linesCleared++;
            board.splice(i, 1);
            board.splice(0, 0, Array.from({ length: 10 }, () => 0));
        }
    }
    if (exceptionKick && linesCleared > 0) {
        mini = false;
    }
    comboCount++;
    if (tSpin) {
        backToBack++;
        if (mini) {
            if (linesCleared === 0) {
                points = 100 * level;
                messages = ['Mini T-Spin'];
                comboCount = -1;
            } else if (linesCleared === 1) {
                points = 200 * level;
                messages = ['Mini T-Spin Single'];
            } else if (linesCleared === 2) {
                points = 400 * level;
                messages = ['Mini T-Spin Double'];
            }
        } else {
            if (linesCleared === 0) {
                points = 400 * level;
                messages = ['T-Spin'];
                comboCount = -1;
            } else if (linesCleared === 1) {
                points = 800 * level;
                messages = ['T-Spin Single'];
            } else if (linesCleared === 2) {
                points = 1200 * level;
                messages = ['T-Spin Double'];
            } else if (linesCleared === 3) {
                points = 1600 * level;
                messages = ['T-Spin Triple'];
            }
        }
    } else {
        if (linesCleared === 0) {
            comboCount = -1;
        } else if (linesCleared === 1) {
            points = 100 * level;
            messages = ['Single'];
            backToBack = -1;
        } else if (linesCleared === 2) {
            points = 300 * level;
            messages = ['Double'];
            backToBack = -1;
        } else if (linesCleared === 3) {
            points = 500 * level;
            messages = ['Triple'];
            backToBack = -1;
        } else if (linesCleared === 4) {
            points = 800 * level;
            messages = ['Tetris'];
            backToBack++;
        }
    }
    if (linesCleared > 0 && backToBack > 0) {
        points *= 1.5;
        messages.push('Back-to-Back');
    }
    if (comboCount > 0) {
        points += 50 * comboCount * level;
        messages.push('Combo ' + comboCount);
    }
    if (linesCleared > 0) {
        perfectClear = true;
        for (let i = 0; i < board.length; i++) {
            for (let k = 0; k < board[i].length; k++) {
                if (board[i][k] !== 0) {
                    perfectClear = false;
                }
            }
        }
        if (perfectClear) {
            messages.push('Perfect Clear');
            if (linesCleared === 1) {
                points += 800 * level;
            } else if (linesCleared === 2) {
                points += 1200 * level;
            } else if (linesCleared === 3) {
                points += 1800 * level;
            }  else if (linesCleared === 4) {
                if (perfectClearBackToBack) {
                    points += 3200 * level;
                } else {
                    points += 2000 * level;
                }
            }
            perfectClearBackToBack = true;
        } else {
            perfectClearBackToBack = false;
        }
    }
    if (points > 0) {
        messages.push('+' + points);
    }
    if (linesCleared > 0) {
        messages.push(lineClearY);
    }
    lines += linesCleared;
    score += points;
    level = Math.trunc(lines / 10) + 1;
    dropRate = Math.pow((0.8 - ((level - 1) * 0.007)), (level - 1)) * 1000;
}

function getDropPreview() {
    const previewBoard = board.map(row => [...row]);
    const previewCoord = [...blockCoord];
    const block = blocks[currentBlock - 1][blockRotation];
    for (let h = 0; h < previewBoard.length; h++) {
        for (let i = 0; i < block.length; i++) {
            for (let k = 0; k < block[i].length; k++) {
                if (block[i][k] !== 0) {
                    previewBoard[i + previewCoord[0]][k + previewCoord[1]] = 0;
                }
            }
        }
        previewCoord[0]++;
        for (let i = 0; i < block.length; i++) {
            for (let k = 0; k < block[i].length; k++) {
                if (i + previewCoord[0] >= 23 || (block[i][k] !== 0 && previewBoard[i + previewCoord[0]][k + previewCoord[1]] !== 0)) {
                    previewCoord[0]--;
                }
            }
        }
    }
    for (let i = 0; i < block.length; i++) {
        for (let k = 0; k < block[i].length; k++) {
            if (block[i][k] !== 0) {
                previewBoard[i + previewCoord[0]][k + previewCoord[1]] = block[i][k] + 7;
            }
        }
    }
    for (let i = 0; i < block.length; i++) {
        for (let k = 0; k < block[i].length; k++) {
            if (block[i][k] !== 0) {
                previewBoard[i + blockCoord[0]][k + blockCoord[1]] = block[i][k];
            }
        }
    }
    return previewBoard;
}

document.addEventListener('keydown', (event) => {
    if ((event.key === 'z' || event.key === 'Z') && !keys.rotateLeft) {
        keys.rotateLeft = true;
        rotate('left');
    } else if ((event.key === 'x' || event.key === 'X') && !keys.rotateRight) {
        keys.rotateRight = true;
        rotate('right');
    } else if (event.key === 'ArrowLeft') {
        keys.moveLeft = true;
    } else if (event.key === 'ArrowRight') {
        keys.moveRight = true;
    } else if (event.key === 'ArrowDown') {
        keys.moveDown = true;
    } else if (event.key === ' ' && !keys.fullDrop) {
        keys.fullDrop = true;
        fullDrop();
    } else if (event.key === 'c' || event.key === 'C') {
        keys.hold = true;
    }
})

document.addEventListener('keyup', (event) => {
    if (event.key === 'z' || event.key === 'Z') {
        keys.rotateLeft = false;
    } else if (event.key === 'x' || event.key === 'X') {
        keys.rotateRight = false;
    } else if (event.key === 'ArrowLeft') {
        keys.moveLeft = false;
        moveDelay = 0;
    } else if (event.key === 'ArrowRight') {
        keys.moveRight = false;
        moveDelay = 0;
    } else if (event.key === 'ArrowDown') {
        keys.moveDown = false;
    } else if (event.key === ' ') {
        keys.fullDrop = false;
    } else if (event.key === 'c' || event.key === 'C') {
        keys.hold = false;
    }
})

function drawGame() {
    const previewBoard = getDropPreview();
    const width = window.innerWidth;
    const height = window.innerHeight;
    let gameWidth;
    if (width > height) {
        gameWidth = height;
    } else {
        gameWidth = width;
    }
    const gameHeight = gameWidth;
    const tileHeight = gameWidth / 23;
    const borderWidth = gameHeight / 400;
    const game = document.getElementById('game');
    game.style.height = gameHeight + 'px';
    game.style.width = gameWidth + 'px';
    const table = document.getElementById('board-table');
    table.innerHTML = '';
    for (let i = 3; i < previewBoard.length; i++) {
        const tr = document.createElement('tr');
        for (let k = 0; k < previewBoard[i].length; k++) {
            const td = document.createElement('td');
            td.classList.add('block' + previewBoard[i][k])
            td.style.height = tileHeight + 'px';
            td.style.width = tileHeight + 'px';
            td.style.border = borderWidth  + 'px solid';
            td.style.borderColor = 'rgb(59, 59, 59)';
            tr.append(td);
        }
        table.append(tr);
    }
    const leftColumn = document.getElementById('left-column');
    leftColumn.style.height = gameHeight * .9 + 'px';
    leftColumn.style.width = gameWidth / 3.7 + 'px';
    const next = document.getElementById('next');
    next.style.height = gameHeight * .9 + 'px';
    next.style.width = gameWidth / 3.7 + 'px';
    const holdTable = document.getElementById('hold-table');
    holdTable.innerHTML = '';
    holdTable.style.transform = '';
    let block;
    let extraSpacing = 0;
    if (holdBlock === 0) {
        block = [[0], [0]];
        extraSpacing = gameHeight / 400 * 3;
    } else {
        block = blocks[holdBlock - 1][0];
    }

    if (holdBlock === 1) {
        block[0] = [0];
        extraSpacing = gameHeight / 400;
    }
    drawBlock(holdTable, block, gameHeight, tileHeight); 
    const nextTables = document.getElementById('next-tables');
    nextTables.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const nextTable = document.createElement('table');
        nextTable.classList.add('center');
        nextTable.style.marginBottom = tileHeight + 'px';
        nextTables.append(nextTable);
        block = blocks[nextBlocks[i] - 1][0];
        if (nextBlocks[i] === 1) {
            block[0] = [0];
        }
        drawBlock(nextTable, block, gameHeight, tileHeight)
    }
    const colors = ['cyan', 'blue', 'orange', '#FAFA33', 'green', 'purple', 'red'];
    const w = tileHeight / 12;
    for (let i = 0; i < 7; i++) {
        const outline = 'linear-gradient(to right, ' + colors[i] + ' ' + w + 'px, transparent ' + w + 'px) top,' +
        'linear-gradient(to left, ' + colors[i] + ' ' + w + 'px, transparent ' + w + 'px) bottom,' +
        'linear-gradient(to bottom, ' + colors[i] + ' ' + w + 'px, transparent ' + w + 'px) left,' +
        'linear-gradient(to top, ' + colors[i] + ' ' + w + 'px, transparent ' + w + 'px) right,' + 'black';
        document.querySelectorAll('.block' + (i + 8)).forEach(elem => elem.style.background = outline);
    }

    document.querySelectorAll('p').forEach(p => p.style.fontSize = gameHeight / 20 + 'px');
    document.getElementById('hold-label').style.marginBottom = gameHeight / 40 + 'px';
    document.getElementById('next-label').style.marginBottom = gameHeight / 40 + 'px';
    document.getElementById('hold-div').style.marginBottom = (gameHeight / 40 + extraSpacing) + 'px';
    document.getElementById('score-div').style.marginBottom = gameHeight / 40 + 'px';
    document.getElementById('level-div').style.marginBottom = gameHeight / 40 + 'px';
    document.getElementById('score').innerText = score.toLocaleString();
    document.getElementById('level').innerText = level;
    document.getElementById('lines').innerText = lines;

    if (messages.length > 0) {
        const drawnMessage = [0]
        for (let i = 0; i < messages.length; i++) {
            drawnMessage.push(messages[i]);
        }
        drawnMessages.push(drawnMessage)
        messages = [];
    }
    document.querySelectorAll('.message').forEach(elem => elem.remove());
    for (let i = 0; i < drawnMessages.length; i++) {
        const messagesDiv = document.createElement('div');
        messagesDiv.style.position = 'fixed';
        messagesDiv.classList.add('message');
        messageY = (10 - drawnMessages[i][drawnMessages[i].length - 1]) * (tileHeight + borderWidth);
        messagesDiv.style.bottom = (window.innerHeight / 2) + messageY + 'px';
        for (let k = 1; k < drawnMessages[i].length - 1; k++) {
            const p = document.createElement('p');
            p.innerText = drawnMessages[i][k];
            p.style.fontSize = gameHeight / 30 + 'px';
            if (drawnMessages[i][0] < 10) {
                p.style.opacity = drawnMessages[i][0] / 10;
                p.style.fontSize = (gameHeight / 30 * (drawnMessages[i][0] / 10)) + 'px';
            } else if (drawnMessages[i][0] > 20) {
                p.style.opacity = (30 - drawnMessages[i][0]) / 10;
            }
            p.style.transform = 'translateY(-' + (drawnMessages[i][0] * 4) + 'px)';
            messagesDiv.append(p);
        }
        document.getElementById('game').append(messagesDiv);
        drawnMessages[i][0]++;
        if (drawnMessages[i][0] > 30) {
            drawnMessages.splice(i, 1);
            i--;
        }
    }
}

function drawBlock(table, block, gameHeight, tileHeight) {
    for (let i = 0; i < block.length; i++) {
        const tr = document.createElement('tr');
        for (let k = 0; k < block[i].length; k++) {
            const td = document.createElement('td');
            td.style.height = tileHeight + 'px';
            td.style.width = tileHeight + 'px';
            if (block[i][k] !== 0) {
                td.classList.add('block' + block[i][k])
                td.style.border = gameHeight / 400  + 'px solid';
                td.style.borderColor = 'rgb(59, 59, 59)';
            }
            if (block[i][k] === 1) {
                table.style.transform = 'translateY(-' + (tileHeight / 2) + 'px)';
            }
            else if (block[i][k] === 4) {
                table.style.transform = 'translateX(-' + (tileHeight / 2) + 'px)';
            }
            tr.append(td);
        }
        table.append(tr);
    }
}