//alert('hello world')
//console.log("hello world")

// Constants
FRAME_PER_SECOND = 60;


// Model
class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Particle {
    constructor(x, y) {
        this.pos = new Position(x, y);
    }

}

class Ball extends Particle {
    constructor(position) {
        super(position.x, position.y);
        this.radius = 5;
        this.speed = 100;
    }
}

class Game {
    constructor() {
        this.ball = new Ball(new Position(100, 200));
    }

    update(deltat) {
        this.ball.pos.x = (this.ball.pos.x + this.ball.speed * deltat) % 600;
    }
}


// View
class View {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.context = this.canvas.getContext('2d');
    }

    drawGame() {
        this.context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        this.drawBall(this.game.ball);
    }

    drawCircle() {
        // start drawing
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

// Controller
var canvas = document.getElementById('main-canvas');
var game = new Game();
var view = new View(canvas, game);

gameUpdate = function() {
    game.update(1/FRAME_PER_SECOND);      // model level
    view.drawGame();    // view level
}

// run gameUpdate() every 1/FRAME_PER_SECOND second
setInterval(gameUpdate, 1/FRAME_PER_SECOND * 1000);