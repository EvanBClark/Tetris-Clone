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
let level = 0;
let score = 0;
let lines = 0;
let lockDown = false;
let lockDownCount = 0;
let gameOver = false;

const keys = {
    'moveLeft': false,
    'moveRight': false,
    'moveDown': false,
    'rotateLeft': false,
    'rotateRight': false,
    'fullDrop' : false,
    'hold' : false,
}
let moveDelay = 0;

let fpsTime = 0;
let dropTime = 0;
let lockDownTime = 0;
let lastMoveTime = 0;
const fps = 60;
const interval = 1000 / fps;
let dropRate = 1000;

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

    if (lockDownTime >= 1000) {
        lockDownTime = 0;
        lockDown = false;
        lockDownCount = 0;
        clearLines();
        spawnBlock();
    }

    if (keys.moveLeft && lastMoveTime > 100) {
        if (moveDelay !== 1) {
            move('left');
        }
        lastMoveTime = 0;
        moveDelay++;
    }
    if (keys.moveRight && lastMoveTime > 100) {
        if (moveDelay !== 1) {
            move('right');
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

requestAnimationFrame(gameLoop);

startGame();

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
            return;
        }
    }
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
    for (let i = 0; i < board.length; i++) {
        let lineFull = true;
        for (let k = 0; k < board[i].length; k++) {
            if (board[i][k] === 0) {
                lineFull = false;
            }
        }
        if (lineFull) {
            linesCleared++;
            board.splice(i, 1);
            board.splice(0, 0, Array.from({ length: 10 }, () => 0));
        }
    }
    if (linesCleared === 1) {
        points = 100;
    } else if (linesCleared === 2) {
        points = 300;
    } else if (linesCleared === 3) {
        points = 500;
    } else if (linesCleared === 4) {
        points = 800;
    }
    lines += linesCleared;
    score += points;
    level = Math.trunc(lines / 10) + 1;
    dropRate = Math.pow((0.8 - ((level - 1) * 0.007)), (level - 1)) * 1000;
}

















document.addEventListener('keydown', (event) => {
    if (event.key === 'z' && !keys.rotateLeft) {
        keys.rotateLeft = true;
        rotate('left');
    } else if (event.key === 'x' && !keys.rotateRight) {
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
    } else if (event.key === 'c') {
        keys.hold = true;
    }
})

document.addEventListener('keyup', (event) => {
    if (event.key === 'z') {
        keys.rotateLeft = false;
    } else if (event.key === 'x') {
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
    } else if (event.key === 'c') {
        keys.hold = false;
    }
})

document.addEventListener('DOMContentLoaded', function () {
    // drawGame();
});

function drawGame() {
    const game = document.getElementById('game');
    game.innerHTML = '';
    const levelP = document.createElement('p');
    levelP.innerHTML = 'Level: ' + level;
    game.append(levelP);
    const scoreP = document.createElement('p');
    scoreP.innerHTML = 'Score: ' + score;
    game.append(scoreP);
    const linesP = document.createElement('p');
    linesP.innerHTML = 'Lines: ' + lines;
    game.append(linesP);
    const holdP = document.createElement('p');
    holdP.innerHTML = 'Hold: ' + convert(holdBlock);
    game.append(holdP);
    const p = document.createElement('p');
    p.innerHTML = 'Next Blocks: '
    for (let i = 0; i < nextBlocks.length; i++) {
        p.innerHTML += convert(nextBlocks[i]) + ' ';
    }
    game.append(p);
    const boardDiv = document.createElement('div');
    const top = document.createElement('div');
    const viewable = document.createElement('div');
    const topTable = document.createElement('table');
    const viewableTable = document.createElement('table');
    for (let i = 3; i < board.length; i++) {
        const tr = document.createElement('tr');
        for (let k = 0; k < board[i].length; k++) {
            const td = document.createElement('td');
            td.classList.add('block' + board[i][k])
            if (i < 3) {
                td.style.backgroundColor = 'grey'
            }
            tr.append(td);
        }
        if (i < 3) {
            topTable.append(tr);
        } else {
            viewableTable.append(tr);
        }
    }
    top.append(topTable);
    viewable.append(viewableTable);
    boardDiv.append(top);
    boardDiv.append(viewable);
    game.append(boardDiv);
}

function convert(b) {
    if (b === 1) {
        return 'I ';
    } else if (b === 2) {
        return 'J ';
    } else if (b === 3) {
        return 'L ';
    } else if (b === 4) {
        return 'O ';
    } else if (b === 5) {
        return 'S ';
    } else if (b === 6) {
        return 'T ';
    } else if (b === 7) {
        return 'Z ';
    } else {
        return b;
    }
}