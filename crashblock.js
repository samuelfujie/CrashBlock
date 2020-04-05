// ---------------------------------------------- Constants ----------------------------------------------
FRAME_PER_SECOND = 60;
GAME_WIDTH = 600;
GAME_HEIGHT = 800;

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

class Ball extends Particle {
    constructor(position, speed, delay) {
        super(position.x, position.y);
        this.radius = 5;
        this.speed = speed;
        this.valid = true;
        this.delay = delay;
    }

    update(deltat) {
        if (this.valid){
            if (this.delay <= 0) {
                this.pos.move(this.speed, deltat);
                if (this.pos.x < 0 || this.pos.x > GAME_WIDTH) {
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

class Game {
    constructor() {
        this.state = "ready";
        this.startPosition = new Position(GAME_WIDTH/2, 0);
        this.ballSpeed = 500;
        this.totalBallNumber = 10;
        this.balls = [];
    }
    
    shoot(targetPosition) {
        this.balls = [];
        for (let i = 0; i < this.totalBallNumber; i++) {
            let speed = this.startPosition.getVector(targetPosition).unify(this.ballSpeed); 
            this.balls.push(new Ball(this.startPosition, speed, 0.2 * i));
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
        this.context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        for (let i = 0; i < this.game.balls.length; i++) {
            let ball = this.game.balls[i]
            if (ball.valid){
                this.drawBall(ball);
            }
        }
    }

    drawCircle() {
        this.context.beginPath();
        this.context.arc(100, 100, 30, 0, 2 * Math.PI);
        this.context.stroke();
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
            game.state = "ready";
        }
        game.update(1/FRAME_PER_SECOND);
        view.drawGame();
    }
}

// run gameUpdate() every 1/FRAME_PER_SECOND second
setInterval(gameUpdate, 1/FRAME_PER_SECOND * 1000);