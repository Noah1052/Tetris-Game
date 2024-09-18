const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

const arena = createMatrix(15, 30);
const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
};

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ];
    } else if (type === 'O') {
        return [
            [2, 2],
            [2, 2],
        ];
    } else if (type === 'L') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3],
        ];
    } else if (type === 'J') {
        return [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0],
        ];
    } else if (type === 'I') {
        return [
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'Z') {
        return [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0],
        ];
    }
}

function drawMatrix(matrix, offset) {
    context.font = '1px Arial'; // Set the font size to 1px
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillText('🐷', x + offset.x, y + offset.y + 1);
            }
        });
    });
}

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgb(50,50,50)'; // Set the background color
    context.fillRect(0, 0, canvas.width, canvas.height); // Fill the canvas with the background color

    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    const pieces = 'TJLOSZI';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
        (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
        dropInterval = 1000; // Reset drop interval
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                    arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function arenaSweep() {
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += 15;
    }
}

function updateScore() {
    document.getElementById('score').innerText = `SCORE: ${player.score}`;
}

let lastTime = 0;
let dropCounter = 0;
let dropStart = false;
let dropInterval = 500;
let fastDropInterval = 15; // Adjusted for slower dropping

let moveLeftStart = false;
let moveRightStart = false;
let moveLeftInterval;
let moveRightInterval;
let moveInterval = 50; // Interval for continuous movement in milliseconds

function calculateDropInterval(score) {
    return 1000 / Math.pow(2, Math.floor(score / 30));
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        dropInterval = calculateDropInterval(player.score); // Update drop interval based on score
    }
    dropCounter = 0;
}

document.getElementById('left').addEventListener('mousedown', () => {
    moveLeftStart = true;
    moveLeftInterval = setInterval(() => {
        playerMove(-1);
    }, moveInterval);
});

document.getElementById('left').addEventListener('mouseup', () => {
    moveLeftStart = false;
    clearInterval(moveLeftInterval);
});

document.getElementById('left').addEventListener('touchstart', (event) => {
    event.preventDefault();
    moveLeftStart = true;
    moveLeftInterval = setInterval(() => {
        playerMove(-1);
    }, moveInterval);
}, {passive: false});

document.getElementById('left').addEventListener('touchend', (event) => {
    event.preventDefault();
    moveLeftStart = false;
    clearInterval(moveLeftInterval);
}, {passive: false});

document.getElementById('right').addEventListener('mousedown', () => {
    moveRightStart = true;
    moveRightInterval = setInterval(() => {
        playerMove(1);
    }, moveInterval);
});

document.getElementById('right').addEventListener('mouseup', () => {
    moveRightStart = false;
    clearInterval(moveRightInterval);
});

document.getElementById('right').addEventListener('touchstart', (event) => {
    event.preventDefault();
    moveRightStart = true;
    moveRightInterval = setInterval(() => {
        playerMove(1);
    }, moveInterval);
}, {passive: false});

document.getElementById('right').addEventListener('touchend', (event) => {
    event.preventDefault();
    moveRightStart = false;
    clearInterval(moveRightInterval);
}, {passive: false});

document.getElementById('up').addEventListener('click', () => {
    playerRotate(1);
});

document.getElementById('down').addEventListener('mousedown', () => {
    dropStart = true;
});

document.getElementById('down').addEventListener('mouseup', () => {
    dropStart = false;
});

document.getElementById('down').addEventListener('touchstart', (event) => {
    event.preventDefault();
    dropStart = true;
}, {passive: false});

document.getElementById('down').addEventListener('touchend', (event) => {
    event.preventDefault();
    dropStart = false;
}, {passive: false});

document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' && !moveLeftStart) {
        moveLeftStart = true;
        moveLeftInterval = setInterval(() => {
            playerMove(-1);
        }, moveInterval);
    } else if (event.key === 'ArrowRight' && !moveRightStart) {
        moveRightStart = true;
        moveRightInterval = setInterval(() => {
            playerMove(1);
        }, moveInterval);
    } else if (event.key === 'ArrowDown') {
        dropStart = true;
    } else if (event.key === 'q') {
        playerRotate(-1);
    } else if (event.key === 'w' || event.key === 'ArrowUp') {
        playerRotate(1);
    }
});

document.addEventListener('keyup', event => {
    if (event.key === 'ArrowLeft') {
        moveLeftStart = false;
        clearInterval(moveLeftInterval);
    } else if (event.key === 'ArrowRight') {
        moveRightStart = false;
        clearInterval(moveRightInterval);
    } else if (event.key === 'ArrowDown') {
        dropStart = false;
    }
});

document.addEventListener('touchstart', function (event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, {passive: false});

let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

function simulateClick(event) {
    event.preventDefault();
    const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });
    event.target.dispatchEvent(clickEvent);
}

const buttons = document.querySelectorAll('button');
buttons.forEach(button => {
    button.addEventListener('touchstart', simulateClick, {passive: false});
});

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropStart) {
        if (dropCounter > fastDropInterval) {
            playerDrop();
        }
    } else {
        if (dropCounter > dropInterval) {
            playerDrop();
        }
    }

    draw();
    requestAnimationFrame(update);
}

playerReset();
updateScore();
update();