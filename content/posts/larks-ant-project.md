---
author: "Jason Duong"
title: "Larks Ant"
date: "2021-09-25"
description: "A 2D Cellular Automaton expanded from Turks and Prop Ants [1944]."
math: true
tags: [
    "HTML·CSS·JS"
]
categories: [
  "Theoretical Computer Science",
  "Web Development",
]
---

[Source Code](https://github.com/ben-my-to/CPSC-335/tree/main/Project%201)

## Online Demo[^1]

$q_t$ = <output id="qt"></output><br>
$T_{ij}$ = <output id="tij"></output><br>
$\theta$ = <output id="theta"></output><br>
$\text{counter}$ = <output id="counter"></output>

<figure>
    <canvas width="800" height="400" id="game"></canvas><br>
    <figurecaption>Fig. 1: Larks Ant Demo</figurecaption>
</figure>

<!-- <script type="text/javascript" src="/js/ant.js"></script> -->

<script type="text/javascript">
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
</script>

[^1]: Figure 1 provides an online demonstration of the computations performed by the Larks Ant starting from $i,j=(400,200)$ on $T\in\mathbb{Z}^{800\times 400}$. Press the `[h]` to stop/run the demo. Press `[a/d]` to increase/decrease the speed by a factor of 10. Note that since $T$ is finite, the Larks Ant will wrap around when necessary to prevent overflow. The script is a modified version from [CS231n-demos](http://vision.stanford.edu/teaching/cs231n-demos/linear-classify/).

## Introduction

<div class="definition">

__Definition 1__: Larks Ant is a 2D cellular automaton $\mathcal{A}$ that consists of a set of states $\mathbf{Q}$, a quadruple of colors $\Sigma$, an initial state $q_t\in\mathbf{Q}$, a local variable $\text{counter}$, and a transition function $\delta_\mathcal{A}:\mathbf{Q}\times\Sigma\to\mathbf{Q}\times\Sigma\times\theta$ where

$$\mathbf{Q}\in\lbrace\text{Normal, Countdown}\rbrace.$$
$$\Sigma\in(\text{Black, Blue, Yellow, Red}).$$
$$-\frac{\pi}{2}\le\theta\le\frac{\pi}{2}.$$

Let $T=\mathbb{Z}^2$ represent a two-dimensional grid. Initially at time $t=0$, $\mathcal{A}(0)$ has an initial state $q_0=\text{Normal}$, is located at color cell $T_{ij}$ for some initial $i,j\in\mathbb{Z}$ and is oriented at $\mathbf{v}=\begin{bmatrix}0 & 1\end{bmatrix}$, the north direction. Then, at every time step $t>0$, the cellular automaton $\mathcal{A}(t)$ computes as follows:

  1. Sets $(q_t,c,\theta) \leftarrow \delta_\mathcal{A}(q_{t-1},T_{ij})$ and $\text{counter}\leftarrow c$.
  2. Changes orientation $\mathbf{v}\leftarrow R\mathbf{v}=\begin{bmatrix}\cos\theta & -\sin\theta \\\ \sin\theta & \cos\theta\end{bmatrix}\begin{bmatrix}v_0 \\\ v_1\end{bmatrix}$.

  3. Increments the cell color $c\leftarrow(c+1)\bmod|\Sigma|$.
  4. Moves to coordinate $\begin{bmatrix}i&j\end{bmatrix}\leftarrow\begin{bmatrix}i&j\end{bmatrix}+\alpha\mathbf{v}$.

where $\alpha\in\mathbb{N}_+$ is the grid scale.

</div >

---

Let $\text{Left}=\frac{\pi}{2},\ \text{Right}=-\frac{\pi}{2},\ \text{and}\ \text{Straight}=0$ and assume _without loss of generality_, every cell color $T_{ij}=\text{Black}$. Then, the function $\delta_\mathcal{A}$ can be represented as

```mermaid
flowchart LR
    A(Normal) -->|Yellow/2/Straight| B(Countdown)
    A --> |Black/0/Left<br>Blue,Red/1/Right| A
    B --> |☐/☐/Straight<br>counter = counter - 1| C{Decision}
    C -->|if counter > 0| B
    C -->|if counter <= 0| A
```

## Examples

<div class="example">

__Example 1__: We now provide a worked example for the first iteration computed by the Larks Ant. Let $\alpha=10$ and $i,j=(400,200)$. Then at time step $t=1$, $\mathcal{A}(1)$ computes as follows:

1. Sets ($\text{Normal}$, $0$, $\text{Left})\leftarrow\delta_{\mathcal{A}}(\text{Normal},\text{Black})$ and $\text{counter}\leftarrow 0$.
2. Changes orientation:
$$
\mathbf{v}\leftarrow\begin{bmatrix}\cos\left(\frac{\pi}{2}\right) & -\sin\left(\frac{\pi}{2}\right) \\\ \sin\left(\frac{\pi}{2}\right) & \cos\left(\frac{\pi}{2}\right)\end{bmatrix}\begin{bmatrix}0 \\\ 1\end{bmatrix}=\begin{bmatrix}0 & -1 \\\ 1 & 0\end{bmatrix}\begin{bmatrix}0 \\\ 1\end{bmatrix}=\begin{bmatrix}(0)\cdot(0)+(-1)\cdot(1) \\\ (1)\cdot(0)+(0)\cdot(1)\end{bmatrix}=\begin{bmatrix}-1 \\\ 0\end{bmatrix}.
$$

3. Increments the cell color $c\leftarrow((0)+1)\bmod (4)=1$.
4. Moves to coordinate $\begin{bmatrix}i&j\end{bmatrix}\leftarrow\begin{bmatrix}i&j\end{bmatrix}+\alpha\mathbf{v}=\begin{bmatrix}400&200\end{bmatrix}+(10)\cdot\begin{bmatrix}-1&0\end{bmatrix}=\begin{bmatrix}390&200\end{bmatrix}$.

</div >