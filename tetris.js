const readline = require('readline');
const keypress = require('keypress');

const width = 10;
const height = 20;
const board = Array.from({ length: height }, () => Array(width).fill('-'));
const pieces = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1]], // T
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]], // Z
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
];
let pieceQueue = shuffle(pieces.slice());
let currentPiece = pieceQueue.pop();
let currentX = 0;
let currentY = 0;
let score = 0;
let holdPiece = null;
let holdUsed = false; // Indicates if hold has been used for the current piece

// Set up keypress module
keypress(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();

let nextPiece = [];
for (let i = 0; i < 3; i++) {
    if (pieceQueue.length === 0) {
        pieceQueue = shuffle(pieces.slice());
    }
    nextPiece.push(pieceQueue.pop());
}

function drawBoard() {
    console.clear();
    const displayBoard = board.map(row => row.slice());
    for (let y = 0; y < currentPiece.length; y++) {
        for (let x = 0; x < currentPiece[y].length; x++) {
            if (currentPiece[y][x]) {
                displayBoard[currentY + y][currentX + x] = '□';
            }
        }
    }

    console.log(displayBoard.map(row => row.join('')).join('\n'));
    console.log(`Score: ${score}`);

    console.log('Next           Hold');
    const maxNextHeight = Math.max(...nextPiece.map(piece => piece.length), holdPiece ? holdPiece.length : 0);
    let displayStrings = [];

    for (let i = 0; i < maxNextHeight; i++) {
        let line = '';

        // Append next pieces
        nextPiece.forEach(piece => {
            if (piece[i]) {
                line += piece[i].map(cell => (cell ? '□' : '-')).join('') + ' ';
            } else {
                line += '    '; // Add spaces to keep alignment
            }
        });

        // Append hold piece
        line += '    ';
        if (holdPiece) {
            if (holdPiece[i]) {
                line += holdPiece[i].map(cell => (cell ? '□' : '-')).join('');
            } else {
                line += '    '; // Add spaces to keep alignment
            }
        }

        displayStrings.push(line);
    }

    displayStrings.forEach(str => console.log(str));
}

function movePiece() {
    if (canMove(0, 1)) {
        currentY++;
    } else {
        placePiece();
        const linesCleared = clearLines();
        if (pieceQueue.length === 0) {
            pieceQueue = shuffle(pieces.slice());
        }
        currentPiece = nextPiece.shift();
        if (pieceQueue.length === 0) {
            pieceQueue = shuffle(pieces.slice());
        }
        nextPiece.push(pieceQueue.pop());
        currentX = 0;
        currentY = 0;
        holdUsed = false; // Reset hold usage for new piece
        if (!canMove(0, 0)) {
            console.log('Game Over');
            resetBoard();
            score = 0;
            pieceQueue = shuffle(pieces.slice());
            currentPiece = pieceQueue.pop();
            nextPiece = [];
            for (let i = 0; i < 3; i++) {
                if (pieceQueue.length === 0) {
                    pieceQueue = shuffle(pieces.slice());
                }
                nextPiece.push(pieceQueue.pop());
            }
            holdPiece = null;
        }
    }
    drawBoard();
}

function rotatePiece() {
    const newPiece = currentPiece[0].map((_, index) => currentPiece.map(row => row[index]).reverse());
    if (canMove(0, 0, newPiece)) {
        currentPiece = newPiece;
    }
}

function rotatePieceCounterClockwise() {
    const newPiece = currentPiece[0].map((_, index) => currentPiece.map(row => row[index])).reverse();
    if (canMove(0, 0, newPiece)) {
        currentPiece = newPiece;
    }
}

function holdCurrentPiece() {
    if (holdUsed) return; // Prevent multiple holds for the current piece
    if (holdPiece) {
        [holdPiece, currentPiece] = [currentPiece, holdPiece];
        currentX = 0;
        currentY = 0;
    } else {
        holdPiece = currentPiece;
        currentPiece = nextPiece.shift();
        nextPiece.push(pieceQueue.pop());
    }
    holdUsed = true;
    drawBoard();
}

function canMove(offsetX, offsetY, piece = currentPiece) {
    for (let y = 0; y < piece.length; y++) {
        for (let x = 0; x < piece[y].length; x++) {
            if (piece[y][x]) {
                const newX = currentX + x + offsetX;
                const newY = currentY + y + offsetY;
                if (newX < 0 || newX >= width || newY >= height || board[newY][newX] !== '-') {
                    return false;
                }
            }
        }
    }
    return true;
}

function placePiece() {
    for (let y = 0; y < currentPiece.length; y++) {
        for (let x = 0; x < currentPiece[y].length; x++) {
            if (currentPiece[y][x]) {
                board[currentY + y][currentX + x] = '□';
            }
        }
    }
}

function clearLines() {
    let linesCleared = 0;
    for (let y = 0; y < height; y++) {
        if (board[y].every(cell => cell === '□')) {
            for (let row = y; row > 0; row--) {
                board[row] = board[row - 1].slice();
            }
            board[0] = Array(width).fill('-');
            linesCleared++;
        }
    }
    if (linesCleared === 4) {
        score += 100; // 4ライン同時に消すと100点
    }
    return linesCleared;
}

function resetBoard() {
    for (let y = 0; y < height; y++) {
        board[y].fill('-');
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

setInterval(movePiece, 1000);
drawBoard();

// Listen for keypress events
process.stdin.on('keypress', (ch, key) => {
    if (key) {
        if (key.name === 'q') {
            console.log('Exiting game...');
            process.exit(); // Exit the process
        } else {
            switch (key.name) {
                case 'left':
                    if (canMove(-1, 0)) currentX--;
                    break;
                case 'right':
                    if (canMove(1, 0)) currentX++;
                    break;
                case 'down':
                    movePiece();
                    break;
                case 'up':
                    rotatePiece();
                    break;
                case 'space':
                    holdCurrentPiece();
                    break;
                case 'a': // Add new key for counterclockwise rotation
                    rotatePieceCounterClockwise();
                    break;
                default:
                    break;
            }
        }
    }
    drawBoard();
});

process.stdin.on('end', () => {
    process.exit();
});
