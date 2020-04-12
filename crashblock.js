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

    add(other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    scalar(number) {
        return new Vector(this.x * number, this.y * number);
    }

    dotProduct(other) {
        return this.x * other.x + this.y * other.y;
    }

    project(other) {
        let ratio = this.dotProduct(other) / other.dotProduct(other);
        let ret = other.copy();
        return ret.scalar(ratio);
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

    checkCollide(ball) {
        if (this.pos.getVector(ball.pos).length() <= this.radius + ball.radius) {
            ball.collide(ball.pos.getVector(this.pos));
            this.life -= 1;
            return true;
        } else {
            return false;
        }
    }
}

class Square extends Block {
    constructor(x, y, life = 5) {
        super(x, y, life);
        this.type = "square";
        this.size = 40;
    }

    checkCollide(ball) {
        let xDistance = Math.abs(ball.pos.x - this.pos.x);
        let yDistance = Math.abs(ball.pos.y - this.pos.y);
        let tolerance = ball.radius + this.size / 2;

        if (xDistance <= tolerance && yDistance <= tolerance) {
            if (xDistance < yDistance) {
                // collide from Y direction
                ball.collide(new Vector(0, this.pos.y - ball.pos.y));
            } else {
                // collide from X direction
                ball.collide(new Vector(this.pos.x - ball.pos.x, 0));
            }
            this.life -= 1;
            return true;
        } else {
            return false;
        }
    }
}

class Ball extends Particle {
    constructor(position, speed, delay) {
        super(position.x, position.y);
        this.radius = 5;
        this.speed = speed.copy();
        this.acceleration = new Vector(0, 50);
        this.valid = true;
        this.delay = delay;
    }

    // normal direction
    // which is perpendicular to the surface
    collide(direction) {
        let projection = this.speed.project(direction);
        if (projection.dotProduct(direction) > 0) {
            this.speed.add(projection.scalar(-2));
        }
    }

    update(deltat) {
        if (this.valid){
            if (this.delay <= 0) {
                this.pos.move(this.speed, deltat);
                this.speed.add(this.acceleration.scalar(deltat));
                // check X coordinate
                if (this.pos.x - this.radius <= 0) {
                    this.pos.x = this.radius;
                    this.speed.x *= -1;
                } else if (this.pos.x + this.radius >= GAME_WIDTH) {
                    this.pos.x = GAME_WIDTH - this.radius;
                    this.speed.x *= -1;
                }
                // check Y coordinate
                if (this.pos.y - this.radius <= 0) {
                    this.pos.y = this.radius;
                    this.speed.y = -this.speed.y ;
                } else if (this.pos.y > GAME_HEIGHT) {
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

    positionToBlock(pos) {
        let gridX = Math.floor(pos.x / this.gridSize);
        let gridY = Math.floor(pos.y / this.gridSize);
        if ( 0 <= gridY && gridY < this.gridHeight && 0 <= gridX && this.gridWidth) {
            return this.data[gridY][gridX];
        } else {
            return null;
        }
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

    generateRandomGridXList(){
        var xSet = new Set();
        // do not generate blocks more than 1/3 of the total blocks in a row
        for (let i = 0; i < Math.floor(this.gridWidth * (1/3) ) ; i++) {
            let gridX = randInt(0, this.gridWidth - 1);
            xSet.add(gridX);
        }
        return Array.from(xSet)
    }

    generateRandomBlock(totalBallNumber) {
        let gridXList = this.generateRandomGridXList();
        let gridY = this.gridHeight - 1;

        for (let gridX of gridXList) {
            let position = this.gridToPosition(gridX, gridY);
            let choice = randChoice(BLOCK_SHAPE);
            let block_life = randInt(Math.floor(totalBallNumber * 0.5), Math.floor(totalBallNumber * 1.5))

            let block = null;
            if (choice == "square") {
                block = new Square(position.x, position.y, block_life);
            } else if (choice == "circle") {
                block = new Circle(position.x, position.y, block_life);
            }

            this.data[gridY][gridX] = block;
        }
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

    checkCollide(ball) {
        let block = this.positionToBlock(ball.pos);
        if (block && block.checkCollide(ball) && block.life == 0) {
            this.removeBlock(block);
        }
    }

    removeBlock(block) {
        let gridX = Math.floor(block.pos.x / this.gridSize);
        let gridY = Math.floor(block.pos.y / this.gridSize);
        this.data[gridY][gridX] = null;
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
        this.grid.generateRandomBlock(this.totalBallNumber);
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
            this.grid.generateRandomBlock(this.totalBallNumber);
        }
    }

    update(deltat) {
        for (let i = 0; i < this.balls.length; i++) {
            this.balls[i].update(deltat);
        }

        // collision detection
        for (let i = 0; i < this.balls.length; i++) {
            let ball = this.balls[i];
            this.grid.checkCollide(ball);
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