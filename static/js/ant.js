// MODIFIED FROM: http://vision.stanford.edu/teaching/cs231n-demos/linear-classify/

var canvas = document.getElementById("game");
var context = canvas.getContext("2d");
context.strokeStyle = "black";
var count = 0;

var qt = document.getElementById("qt");
var tij = document.getElementById("tij");
var theta = document.getElementById("theta");
var c = document.getElementById("counter");

const r_states = ["Normal", "Countdown"];
const r_colors = ["Black", "Blue", "Yellow", "Red"];
const colors = ["#000000", "#89CFF0", "#FFF300", "#FF6347"];
const nose = ["N", "W", "S", "E"];
const action = [0, 1, 2, 1];

class Board {
    constructor(cell, width, height) {
        this.cell = cell;
        this.width = width;
        this.height = height;
        this.pixel = new Map();
    }

    increment_color() {
        let pos = "@" + ant.x + ant.y;
        if (this.pixel.has(pos)) {
            this.pixel.set(pos, (board.pixel.get(pos) + 1) % 4);
        } else {
            this.pixel.set(pos, 1);
        }

        context.fillStyle = colors[board.pixel.get(pos)];
        context.strokeRect(ant.x, ant.y, this.cell, this.cell);
        context.fillRect(ant.x, ant.y, this.cell, this.cell);
    }

    get_color(pos) {
        return board.pixel.has(pos) ? board.pixel.get(pos) : 0;
    }
}

class Ant {
    constructor(x, y, state, nose, counter) {
        this.x = x;
        this.y = y;
        this.state = state;
        this.nose = nose;
        this.counter = counter;
    }

    fsm(action) {
        let transition;
        this.counter = board.get_color("@" + ant.x + ant.y);

        if (this.state == 0) {
            if (action == 0) {
                theta.innerHTML = "Left";
                ant.nose = ++ant.nose % 4;
            }
            else if (action == 1) {
                theta.innerHTML = "Right";
                if (ant.nose == 0)
                    ant.nose = 3;
                else
                    ant.nose--;
            }
            else {
                theta.innerHTML = "Straight";
                this.state = 1;
            }
        }
        else {
            if (this.counter <= 0) {
                this.state = 0;
            } else {
                this.counter--;
            }
        }
    }

    move() {
        let dx = this.x;
        let dy = this.y;
        let size = board.cell;
        let max_width = board.width * size;
        let max_height = board.height * size;

        switch (nose[ant.nose]) {
            case "N": {
                dy = (dy == 0 ? max_height : dy) - size;
                break;
            }
            case "W": {
                dx = (dx == 0 ? max_width : dx) - size;
                break;
            }
            case "S": {
                dy = (dy + size) % max_height;
                break;
            }
            case "E": {
                dx = (dx + size) % max_width;
            }
        }

        this.x = dx; // move ant in x-dir
        this.y = dy; // move ant in y-dir
    }
}

const board = new Board(10, 80, 40);
const ant = new Ant(400, 200, 0, 0, 0);

var halt = false;
var speed = 60;

function update() {
    qt.innerHTML = r_states[ant.state];
    tij.innerHTML = r_colors[board.get_color("@" + ant.x + ant.y)];
    c.innerHTML = ant.counter;
    ant.fsm(action[board.get_color("@" + ant.x + ant.y)]);
    board.increment_color();
    ant.move();
}

function loop() {
    requestAnimationFrame(loop);
    if (++count < speed) return;
    if (!halt) {
        update();
    }
    count = 0;
}

document.addEventListener("keydown", (e) => {
    switch (e.which) {
        case 72:
            halt = !halt;
            break;
        case 65:
            speed = Math.max(1, speed - 10);
            break;
        case 68:
            speed = Math.min(60, speed + 10);
            break;
    }
});

requestAnimationFrame(loop);
