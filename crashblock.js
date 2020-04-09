// ---------------------------------------------- Constants ----------------------------------------------
FRAME_PER_SECOND = 60;
GAME_WIDTH = 600;
GAME_HEIGHT = 800;
GRID_SIZE = 50;
BALL_SPEED = 500;
BLOCK_SHAPE = ["square", "circle"];

// ---------------------------------------------- Global Utility ---------------------------------------------- 

randInt = function(a, b) {
    return a + Math.floor(Math.random() * (b+1-a));
}

randChoice = function(arr) {
    return arr[randInt(0, arr.length - 1)]
}

// ---------------------------------------------- MODEL 模型 ---------------------------------------------- 
class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    move(speed, deltat) {
        this.x += speed.x * deltat;
        this.y += speed.y * deltat;
    }

    getVector(target){
        return new Vector(target.x - this.x, target.y - this.y);
    }
}

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    copy() {
        return new Vector(this.x, this.y);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    unify(length) {
        let ratio = length / this.length();
        this.x *= ratio;
        this.y *= ratio;
        return this;
    }
}

class Particle {
    constructor(x, y) {
        this.pos = new Position(x, y);
    }
}

class Block extends Particle {
    constructor(x, y, life = 5) {
        super(x, y);
        this.life = life;
    }
}

class Circle extends Block {
    constructor(x, y, life = 5) {
        super(x, y, life);
        this.type = "circle";
        this.radius = 20;
    }
}

class Square extends Block {
    constructor(x, y, life = 5) {
        super(x, y, life);
        this.type = "square";
        this.size = 40;
    }
}

class Ball extends Particle {
    constructor(position, speed, delay) {
        super(position.x, position.y);
        this.radius = 5;
        this.speed = speed.copy();
        this.valid = true;
        this.delay = delay;
    }

    update(deltat) {
        if (this.valid){
            if (this.delay <= 0) {
                this.pos.move(this.speed, deltat);
                if (this.pos.x - this.radius <= 0) {
                    this.pos.x - this.radius;
                    this.speed.x *= -1;
                } else if (this.pos.x + this.radius >= GAME_WIDTH) {
                    this.pos.x = GAME_WIDTH - this.radius;
                    this.speed.x *= -1;
                }
                if (this.pos.y > GAME_HEIGHT) {
                    this.valid = false;
                }
            } else {
                this.delay -= deltat;
            }
        }
    }
}

class Grid {
    constructor(width, height, size) {
        this.width = width;
        this.height = height;
        this.gridSize = size;
        this.gridWidth = width / size;
        this.gridHeight = height / size;
        this.data = [];
    }

    gridToPosition(gridX, gridY) {
        let x = gridX * this.gridSize + this.gridSize / 2;
        let y = gridY * this.gridSize + this.gridSize / 2;
        return new Position(x, y);
    }

    initializeData() {
        this.data = [];
        for (let i = 0; i < this.gridHeight; i++) {
            let tmp = [];
            for (let j = 0; j < this.gridWidth; j++) {
                tmp.push(null);
            }
            this.data.push(tmp);
        }
    }

    generateRandomBlock() {
        let gridX = randInt(0, this.gridWidth - 1);
        let gridY = this.gridHeight - 1;
        let position = this.gridToPosition(gridX, gridY);
        let choice = randChoice(BLOCK_SHAPE);

        let block = null;
        if (choice == "square") {
            block = new Square(position.x, position.y);
        } else if (choice == "circle") {
            block = new Circle(position.x, position.y);
        }

        this.data[gridY][gridX] = block;
    }

    // return true if game is over
    // else return false
    growUp() {
        for (let j = 0; j < this.gridWidth; j++) {
            if (this.data[0][j] != null) {
                return true;
            }
        }
        this.data.shift();

        let tmp = [];
        for (let j = 0; j < this.gridWidth; j++) {
            tmp.push(null);
        }

        this.data.push(tmp);

        let blocks = this.getBlocks();
        for (let i =0; i < blocks.length; i++) {
            let block = blocks[i];
            block.pos.y -= this.gridSize;
        }
    }

    getBlocks() {
        let blocks = [];
        for (let i = 0; i < this.gridHeight; i++) {
            for (let j = 0; j < this.gridWidth; j++) {
                if (this.data[i][j] != null) {
                    blocks.push(this.data[i][j]);
                }
            }
        }
        return blocks;
    }
}

class Game {
    constructor() {
        this.state = "ready";
        this.startPosition = new Position(GAME_WIDTH/2, 0);
        this.ballSpeed = BALL_SPEED;
        this.totalBallNumber = 10;
        this.grid = new Grid(GAME_WIDTH, GAME_HEIGHT, GRID_SIZE);
        this.balls = [];
    }

    start() {
        this.grid.initializeData();
        this.grid.generateRandomBlock();
    }

    shoot(targetPosition) {
        this.balls = [];
        let speed = this.startPosition.getVector(targetPosition).unify(this.ballSpeed);
        for (let i = 0; i < this.totalBallNumber; i++) {
            this.balls.push(new Ball(this.startPosition, speed, 0.2 * i));
        }
    }

    nextRound() {
        let failure = this.grid.growUp();
        if (failure) {
            this.start();
        } else {
            this.grid.generateRandomBlock();
        }
    }

    update(deltat) {
        for (let i = 0; i < this.balls.length; i++) {
            this.balls[i].update(deltat);
        }
    }
}

// ---------------------------------------------- VIEW 视图 ----------------------------------------------
class View {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.context = this.canvas.getContext('2d');
    }

    drawGame() {
        let blocks = this.game.grid.getBlocks();

        this.context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        for (let i = 0; i < this.game.balls.length; i++) {
            let ball = this.game.balls[i]
            if (ball.valid){
                this.drawBall(ball);
            }
        }

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i];
            this.drawBlock(block);
        }
    }

    drawBlock(block) {
        if (block.type == "circle") {
            this.drawCircle(block);
        } else if (block.type == "square") {
            this.drawSquare(block);
        }

    }

    drawSquare(square) {
        this.context.beginPath();
        this.context.rect(square.pos.x - square.size/ 2, square.pos.y - square.size / 2, square.size, square.size);
        this.context.stroke();
        this.context.font = '24px serif';
        var text = this.context.measureText(square.life);
        this.context.fillText(square.life, square.pos.x - text.width / 2, square.pos.y + text.actualBoundingBoxAscent / 2);
    }

    drawCircle(circle) {
        this.context.beginPath();
        this.context.arc(circle.pos.x, circle.pos.y, circle.radius, 0, 2 * Math.PI);
        this.context.stroke();
        this.context.font = '24px serif';
        var text = this.context.measureText(circle.life);
        this.context.fillText(circle.life, circle.pos.x - text.width / 2, circle.pos.y + text.actualBoundingBoxAscent / 2);
    }

    drawBall(ball) {
        this.context.beginPath();
        this.context.arc(ball.pos.x, ball.pos.y, ball.radius, 0, 2 * Math.PI);
        this.context.stroke();
    }
}

// ---------------------------------------------- CONTROLLER 控制 ----------------------------------------------
var canvas = document.getElementById('main-canvas');
var game = new Game();
var view = new View(canvas, game);
var click = null;

game.start();

canvas.onclick = function(event) {
    if (game.state == "ready"){
        click = new Position(event.offsetX, event.offsetY);
    }
}

gameUpdate = function() {
    if (game.state == "ready") {
        if (click) {
            game.shoot(click);
            click = null;
            game.state = "shoot";
        }
        view.drawGame();
    } else if (game.state == "shoot") {
        let ballLeft = false;
        for (let i = 0; i < game.balls.length; i++) {
            let ball = game.balls[i];
            if (ball.valid){
                ballLeft = true;
                break;
            }
        }
        if (ballLeft == false) {
            game.nextRound();
            game.state = "ready";
        }
        game.update(1/FRAME_PER_SECOND);
        view.drawGame();
    }
}

// run gameUpdate() every 1/FRAME_PER_SECOND second
setInterval(gameUpdate, 1/FRAME_PER_SECOND * 1000);