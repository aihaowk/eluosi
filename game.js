class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.blockSize = 30;
        this.cols = this.canvas.width / this.blockSize;
        this.rows = this.canvas.height / this.blockSize;
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;

        // 火影主题方块形状
        this.shapes = [
            [[1, 1, 1, 1]], // I - 苦无
            [[1, 1], [1, 1]], // O - 卷轴
            [[0, 1, 1], [1, 1, 0]], // S - 手里剑
            [[1, 1, 0], [0, 1, 1]], // Z - 查克拉
            [[1, 0, 0], [1, 1, 1]], // L - 火遁
            [[0, 0, 1], [1, 1, 1]], // J - 水遁
            [[0, 1, 0], [1, 1, 1]]  // T - 雷遁
        ];

        // 火影主题颜色
        this.colors = [
            '#FF4500', // 火遁 - 红色
            '#4169E1', // 水遁 - 蓝色
            '#FFD700', // 雷遁 - 黄色
            '#32CD32', // 风遁 - 绿色
            '#8B4513', // 土遁 - 褐色
            '#FF69B4', // 仙术 - 粉色
            '#9370DB'  // 幻术 - 紫色
        ];

        this.currentPiece = this.newPiece();
        this.nextPiece = this.newPiece();

        // 加载音效
        this.loadSounds();

        // 绑定控制器
        this.bindControls();
        this.bindButtons();
    }

    loadSounds() {
        this.sounds = {
            move: new Audio('assets/move.mp3'),
            rotate: new Audio('assets/rotate.mp3'),
            clear: new Audio('assets/clear.mp3'),
            drop: new Audio('assets/drop.mp3'),
            gameOver: new Audio('assets/gameover.mp3')
        };
    }

    newPiece() {
        const shapeIndex = Math.floor(Math.random() * this.shapes.length);
        return {
            shape: this.shapes[shapeIndex],
            color: this.colors[shapeIndex],
            x: Math.floor((this.cols - this.shapes[shapeIndex][0].length) / 2),
            y: 0
        };
    }

    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        // 绘制游戏板
        this.drawBoard();

        // 绘制当前方块
        this.drawPiece(this.currentPiece, this.ctx);

        // 绘制下一个方块
        this.drawNextPiece();

        // 更新分数和等级
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
    }

    drawBoard() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x], this.ctx);
                }
            }
        }
    }

    drawBlock(x, y, color, ctx) {
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;

        const blockX = x * this.blockSize;
        const blockY = y * this.blockSize;

        // 绘制方块主体
        ctx.fillRect(blockX, blockY, this.blockSize, this.blockSize);
        ctx.strokeRect(blockX, blockY, this.blockSize, this.blockSize);

        // 添加光效
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(blockX, blockY, this.blockSize / 2, this.blockSize / 2);
    }

    drawPiece(piece, ctx) {
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.drawBlock(piece.x + x, piece.y + y, piece.color, ctx);
                }
            });
        });
    }

    drawNextPiece() {
        const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * this.blockSize) / 2;
        const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * this.blockSize) / 2;

        this.nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const blockX = offsetX + x * this.blockSize;
                    const blockY = offsetY + y * this.blockSize;
                    this.drawBlock(blockX / this.blockSize, blockY / this.blockSize, this.nextPiece.color, this.nextCtx);
                }
            });
        });
    }

    moveDown() {
        if (this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
            this.placePiece();
            return;
        }
        this.currentPiece.y++;
        this.draw();
    }

    moveLeft() {
        if (!this.checkCollision(this.currentPiece.x - 1, this.currentPiece.y, this.currentPiece.shape)) {
            this.currentPiece.x--;
            this.sounds.move.play();
            this.draw();
        }
    }

    moveRight() {
        if (!this.checkCollision(this.currentPiece.x + 1, this.currentPiece.y, this.currentPiece.shape)) {
            this.currentPiece.x++;
            this.sounds.move.play();
            this.draw();
        }
    }

    rotate() {
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[row.length - 1 - i])
        );

        if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y, rotated)) {
            this.currentPiece.shape = rotated;
            this.sounds.rotate.play();
            this.draw();
        }
    }

    checkCollision(x, y, shape) {
        return shape.some((row, dy) =>
            row.some((value, dx) =>
                value && (
                    y + dy >= this.rows ||
                    x + dx < 0 ||
                    x + dx >= this.cols ||
                    this.board[y + dy]?.[x + dx]
                )
            )
        );
    }

    placePiece() {
        this.currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    if (this.currentPiece.y + y <= 0) {
                        this.gameOver = true;
                        this.sounds.gameOver.play();
                        return;
                    }
                    this.board[this.currentPiece.y + y][this.currentPiece.x + x] = this.currentPiece.color;
                }
            });
        });

        if (!this.gameOver) {
            this.clearLines();
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.newPiece();
            this.sounds.drop.play();
        }
    }

    clearLines() {
        let linesCleared = 0;

        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.cols).fill(0));
                linesCleared++;
                y++; // 重新检查当前行，因为上面的行已经下移
            }
        }

        if (linesCleared > 0) {
            this.sounds.clear.play();
            this.updateScore(linesCleared);
        }
    }

    updateScore(lines) {
        const points = [40, 100, 300, 1200]; // 1、2、3、4行的分数
        this.score += points[lines - 1] * this.level;
        this.level = Math.floor(this.score / 1000) + 1;
    }

    bindControls() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver || this.isPaused) return;

            switch (e.key) {
                case 'ArrowLeft':
                    this.moveLeft();
                    break;
                case 'ArrowRight':
                    this.moveRight();
                    break;
                case 'ArrowDown':
                    this.moveDown();
                    break;
                case 'ArrowUp':
                    this.rotate();
                    break;
                case ' ':
                    while (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
                        this.moveDown();
                    }
                    this.moveDown();
                    break;
            }
        });
    }

    bindButtons() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');

        startBtn.addEventListener('click', () => {
            if (this.gameOver) {
                this.reset();
            }
            this.start();
        });

        pauseBtn.addEventListener('click', () => {
            if (this.isPaused) {
                this.resume();
                pauseBtn.textContent = '暂停';
            } else {
                this.pause();
                pauseBtn.textContent = '继续';
            }
        });
    }

    reset() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.currentPiece = this.newPiece();
        this.nextPiece = this.newPiece();
    }

    start() {
        if (!this.gameLoop) {
            this.gameLoop = setInterval(() => {
                if (!this.isPaused && !this.gameOver) {
                    this.moveDown();
                }
            }, 1000 / this.level);
        }
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }
}

// 创建并启动游戏
window.addEventListener('load', () => {
    const game = new TetrisGame();
    game.draw();
});