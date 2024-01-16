---
author: "Jason Duong"
title: "A Parallel Decision Tree Classifier"
date: "2023-05-16"
description: "A Parallel Decision Tree Classifier implementation using MPI (Message Passing Interface)"
math: true
tags: [
    "Python",
    "LaTeX",
    "Black",
    "Git",
]
categories: [
    "Machine Learning",
    "Distributed Algorithms",
]
---

[Source Code](https://github.com/ben-my-to/mpitree)

## Try it Out![^1]

<script type="text/javascript" src="https://code.jquery.com/jquery-1.7.1.min.js"></script>

<input type="range" id="range" min="0" max="10" value="10" oninput="update_max_depth(this.value);">
max_depth = <output id="slider1-value"></output>

<input type="range" id="range2" min="1" max="50" value="40" oninput="update_n_samples(this.value);">
n_samples = <output id="slider2-value"></output>

<input type="range" id="range3" min="1" max="4" value="3" oninput="update_n_classes(this.value);">
n_classes = <output id="slider3-value"></output>

$\text{Train/Test Accuracy}$ = <output id="accuracy"></output>

<button type="button" onclick="gen_points(); redraw()" style="height: 40px; width: 200px;">Generate New Training Data</button>

<!-- <script type="text/javascript" src="dt.js"></script> -->

<figure>
    <canvas width="800" height="400" id="boundary"></canvas><br>
    <figurecaption>Fig. 1: Decision Tree Classifier Demo</figurecaption>
</figure>

<script type="text/javascript">
// MODIFIED FROM: http://vision.stanford.edu/teaching/cs231n-demos/knn/knn.js

document.getElementById("slider1-value").innerHTML = document.getElementById("range").value;
document.getElementById("slider2-value").innerHTML = document.getElementById("range2").value;
document.getElementById("slider3-value").innerHTML = document.getElementById("range3").value;

Array.prototype.max = function () {
    return Math.max.apply(null, this);
};
Array.prototype.min = function () {
    return Math.min.apply(null, this);
};

const argFact = (compareFn) => (array) =>
    array.map((el, idx) => [el, idx]).reduce(compareFn)[1];
const argMax = argFact((min, el) => (el[0] > min[0] ? el : min));
const argMin = argFact((max, el) => (el[0] < max[0] ? el : max));

function getCol(arr, n) {
    return arr.map((x) => x[n]);
}

function findMode(array) {
    let object = {};

    for (let i = 0; i < array.length; i++) {
        if (object[array[i]]) {
            object[array[i]] += 1;
        } else {
            object[array[i]] = 1;
        }
    }

    let biggestValue = -1;
    let biggestValuesKey = -1;

    Object.keys(object).forEach((key) => {
        let value = object[key];
        if (value > biggestValue) {
            biggestValue = value;
            biggestValuesKey = key;
        }
    });

    return biggestValuesKey;
}

class Node {
    constructor(value, threshold = null) {
        this.value = value;
        this.threshold = threshold;
        this.left = null;
        this.right = null;
    }

    is_leaf() {
        return this.left === null && this.right === null;
    }
}

class DecisionTreeClassifier {
    constructor(max_depth = null) {
        this.tree = null;
        this.max_depth = max_depth;
    }

    unique(value, index, array) {
        return array.indexOf(value) === index;
    }

    entropy(x) {
        var counts = {};
        x.forEach(function (x) {
            counts[x] = (counts[x] || 0) + 1;
        });

        var n_unique_classes = [];
        for (var key in counts) {
            n_unique_classes.push(counts[key]);
        }

        var proba = [];
        for (var i = 0; i < n_unique_classes.length; i++) {
            proba.push(n_unique_classes[i] / x.length);
        }

        var result = 0;
        for (var i = 0; i < n_unique_classes.length; i++) {
            result += proba[i] * Math.log2(proba[i]);
        }

        return -result;
    }

    cond_entropy(X, y, t, feature_idx) {
        var X_left = X.filter((x) => x[feature_idx] <= t);
        var X_right = X.filter((x) => x[feature_idx] > t);

        var left_indices = [];
        var right_indices = [];
        for (var i = 0; i < X.length; i++) {
            if (X[i][feature_idx] <= t) left_indices.push(i);
            else right_indices.push(i);
        }

        var y_left = left_indices.map((x) => y[x]);
        var y_right = right_indices.map((x) => y[x]);

        var weight_left = X_left.length / X.length;
        var weight_right = X_right.length / X.length;

        var impurity_left = this.entropy(y_left);
        var impurity_right = this.entropy(y_right);

        return weight_left * impurity_left + weight_right * impurity_right;
    }

    information_gain(X, y, feature_idx) {
        var possible_thresholds = getCol(X, feature_idx).filter(this.unique);

        var costs = [];
        for (const t of possible_thresholds) {
            costs.push(this.cond_entropy(X, y, t, feature_idx));
        }

        return {
            gain: this.entropy(y) - costs.min(),
            threshold: possible_thresholds[argMin(costs)],
        };
    }

    fit(X, y) {
        this.n_features = X[0].length;
        this.tree = this.make_tree(X, y);
        return this;
    }

    make_tree(X, y, depth = 0) {
        var n_classes = y.filter(this.unique).length;

        if (
            n_classes == 1 ||
            (this.max_depth !== null && this.max_depth == depth)
        ) {
            return new Node(findMode(y));
        }

        var info_gains = [];
        var thresholds = [];

        for (var i = 0; i < this.n_features; i++) {
            var result = this.information_gain(X, y, i);
            info_gains.push(result["gain"]);
            thresholds.push(result["threshold"]);
        }

        var split_feature_idx = argMax(info_gains);
        var split_threshold = thresholds[split_feature_idx];

        var split_node = new Node(split_feature_idx, split_threshold);

        var left_indices = [];
        var right_indices = [];
        for (var i = 0; i < X.length; i++) {
            if (X[i][split_feature_idx] <= split_threshold) left_indices.push(i);
            else right_indices.push(i);
        }

        var X_left = X.filter((x) => x[split_feature_idx] <= split_threshold);
        var X_right = X.filter((x) => x[split_feature_idx] > split_threshold);

        split_node.left = this.make_tree(
            X_left,
            left_indices.map((x) => y[x]),
            depth + 1,
        );

        split_node.right = this.make_tree(
            X_right,
            right_indices.map((x) => y[x]),
            depth + 1,
        );

        return split_node;
    }

    predict(x) {
        var node = this.tree;
        while (!node.is_leaf()) {
            if (x[node.value] <= node.threshold) {
                node = node.left;
            } else {
                node = node.right;
            }
        }
        return node.value;
    }
}

var RADIUS = 6;
var WIDTH = 800;
var HEIGHT = 400;
var canvas = document.getElementById("boundary");
canvas.width = WIDTH;
canvas.height = HEIGHT;

var ctx = canvas.getContext("2d");
ctx.height = HEIGHT;
ctx.width = WIDTH;

var state = {
    num_classes: 3,
    num_points: 40,
    max_depth: null,
    cluster_std: 50,
    colors: ["red", "blue", "green", "orange"],
    small_step: 3,
    big_step: 10,
};

function update_max_depth(depth) {
    var slider_name = document.getElementById("slider1-value");
    slider_name.innerHTML = depth;
    state.max_depth = depth;
    redraw();
}

function update_n_samples(n_samples) {
    var slider2_name = document.getElementById("slider2-value");
    slider2_name.innerHTML = n_samples;
    state.num_points = n_samples;
    gen_points();
    redraw();
}

function update_n_classes(n_classes) {
    var slider3_name = document.getElementById("slider3-value");
    slider3_name.innerHTML = n_classes;
    state.num_classes = n_classes;
    gen_points();
    redraw();
}

function gen_points() {
    state.points = generate_cluster_points(
        ctx,
        state.num_classes,
        state.num_points,
        state.cluster_std,
    );
}
gen_points();

function redraw(speed) {
    var step = state.small_step;
    if (speed === "fast") step = state.big_step;
    ctx.clearRect(0, 0, ctx.width, ctx.height);
    draw_boundaries(ctx, state, step);
    draw_points(ctx, state.points, state.colors);
}
redraw();

var dragging_point = null;
$(canvas).mousedown(function (e) {
    var p = get_click_coords(canvas, e);
    var thresh = 10;
    var idx = null;
    var min_dist = 100000;
    for (var i = 0; i < state.num_points; i++) {
        var dx = p[0] - state.points[i][0];
        var dy = p[1] - state.points[i][1];
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < thresh && d < min_dist) {
            min_dist = d;
            idx = i;
        }
    }
    dragging_point = idx;
});

$(canvas).mousemove(function (e) {
    if (dragging_point === null) return;
    var p = get_click_coords(canvas, e);
    state.points[dragging_point][0] = p[0];
    state.points[dragging_point][1] = p[1];
    redraw("fast");
});

$(canvas).mouseup(function () {
    dragging_point = null;
    redraw();
});

function get_click_coords(obj, e) {
    var offset = $(obj).offset();
    var cx =
        e.clientX +
        document.body.scrollLeft +
        document.documentElement.scrollLeft -
        Math.floor(offset.left);
    var cy =
        e.clientY +
        document.body.scrollTop +
        document.documentElement.scrollTop -
        Math.floor(offset.top) +
        1;
    return [cx, cy];
}

function randn() {
    // Using Box-Muller transform
    var u = 1 - Math.random();
    var v = 1 - Math.random();
    var r = Math.sqrt(-2 * Math.log(u));
    var t = Math.cos(2 * Math.PI * v);
    return r * t;
}

function dist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function collision(x1, y1, x2, y2) {
    eps = 2.5;
    return dist(x1, y1, x2, y2) <= 2 * RADIUS + eps;
}

function generate_cluster_points(ctx, num_classes, num_points, std) {
    // First generate random cluster centers
    var centers = [];
    for (var c = 0; c < num_classes; c++) {
        var x = ctx.width * Math.random();
        var y = ctx.height * Math.random();
        centers.push([x, y]);
    }

    let xmin = 25,
        xmax = 775;
    let ymin = 25,
        ymax = 375;

    // Now generate points near cluster centers
    var points = [];
    state.test = [];

    for (var i = 0; i < num_points * 2; i++) {
        var c = Math.floor(num_classes * Math.random());
        while (true) {
            var x = centers[c][0] + std * randn();
            var y = centers[c][1] + std * randn();

            x = Math.min(xmax, Math.max(xmin, x));
            y = Math.min(ymax, Math.max(ymin, y));

            var bad = false;
            for (const p of state.test) {
                if (collision(p[0], p[1], x, y)) bad = true;
            }

            if (!bad) break;
        }

        state.test.push([x, y, c]);
    }

    for (var i = 0; i < num_points; i++) {
        var c = Math.floor(num_classes * Math.random());
        while (true) {
            var x = centers[c][0] + std * randn();
            var y = centers[c][1] + std * randn();

            x = Math.min(xmax, Math.max(xmin, x));
            y = Math.min(ymax, Math.max(ymin, y));

            var bad = false;
            for (const p of points) {
                if (collision(p[0], p[1], x, y)) bad = true;
            }

            if (!bad) break;
        }
        points.push([x, y, c]);
    }
    return points;
}

function draw_points(ctx, points, colors) {
    for (var i = 0; i < points.length; i++) {
        var x = points[i][0];
        var y = points[i][1];
        var c = points[i][2];

        ctx.beginPath();
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = colors[c];
        ctx.arc(x, y, RADIUS, 0, 2 * Math.PI);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fill();
    }
}

function fn(array, firstIndex, secondIndex) {
    return array.map((a) =>
        a.filter((b, i) => i == firstIndex || i == secondIndex),
    );
}

function accuracy_score(clf, D) {
    var zip = rows => rows[0].map((_, c) => rows.map(row => row[c]));
    var n_correct = 0;

    X = fn(D, 0, 1);
    y = getCol(D, 2);

    X.forEach((x, idx) => {
        if (clf.predict(x) == y[idx])
            n_correct++;
    });

    return (n_correct / D.length).toFixed(2);
}

function draw_boundaries(ctx, state, step) {
    var eps = 0;
    var clf = new DecisionTreeClassifier(state.max_depth).fit(
        fn(state.points, 0, 1),
        getCol(state.points, 2),
    );

    for (var x = step / 2; x < ctx.width; x += step) {
        for (var y = step / 2; y < ctx.height; y += step) {
            var c = clf.predict([x, y]);

            if (c !== null) {
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = state.colors[c];
                ctx.fillRect(
                    x - step / 2 - eps,
                    y - step / 2 - eps,
                    step + 2 * eps,
                    step + 2 * eps,
                );
            }
        }
    }
    document.getElementById("accuracy").innerHTML = accuracy_score(clf, state.points).toString() + "/" + accuracy_score(clf, state.test);
}
</script>

[^1]: Figure 1 provides an online visualization of the decision boundaries decided by a Decision Tree Classifier. Feel free to drag individual data points and sliders to explore how the decision boundary and accuracy of the model changes. This script is a modified version from [CS231n-demos](http://vision.stanford.edu/teaching/cs231n-demos/knn/).

## Introduction

A __Decision Tree__ is an $n$-nary tree where each node represents a feature _(interior nodes)_ or response _(terminal/leaf nodes)_ value, and each branch represents a condition on some feature. Decision Trees are intuitive _supervised_ machine learning algorithms for both classification and regression problems. Decision Trees behave by posing questions about the data to narrow their choices until they are somewhat confident in their predictions. The fundamental procedure for a decision tree involves recursively querying each feature and partitioning the dataset and feature space into disjoint subsets and regions until there is no ambiguity about the response variable. The primary goal of any machine learning model is _generalization_ -- the model's ability to perform well on future, unseen data. Therefore, the general approach to learning an optimal decision tree involves asking "good" questions _(__split features__ -- the features that maximize the information gain[^2])_ about the data that leads to the most certainty about the response variable each time.

[^2]: Information gain quantifies the increase in confidence about the response variable after querying some feature. A higher value for information gain implies a greater likelihood of achieving purer splits _(no uncertainty on a prediction)_.

A __Decision Tree Classifier__ is a decision tree whose prediction of a response variable is from a set of finite classes _(multi-classification)_. Given some observed data, examples of classification-type problems is: whether an incoming patient has cancer, an email is spam or not, or a fruit is an apple, banana, or orange.

## Methodology

The __Parallel Decision Tree__ algorithm aims to reduce the time taken by a greedy search across all feature. It schedules processes in a _cyclic distribution_[^3]; distributing processes in a cyclical manner, roughly evenly across levels of a split feature. Processes in each sub-communicator concurrently participate in calculating the split feature and await completion at their original _(parent)_ communicator for all other processes in that communicator. Let $k$ be the total number of processes and $n$ be the number of levels, where $k,n\in\mathbb{N}$ such that $k\ge n\ge 2$. Then, a sub-communicator $m$ contains at most $\lceil k/n \rceil$ processes, and at least $[1\ldots n)$ processes. Each process's identifier $p_{i\in[k]}$ is then assigned to the sub-communicator $m = i\bmod n$ and receives a unique identifier in that group $p_i^m = \lfloor i/n \rfloor$.

[^3]: Figure 2 demonstrates the partitioning of communicator $m_0$ where the number of levels $n=2$ and number of processes $k=8$. Processes $p_0,p_2,p_4,p_6$ are scheduled to communicator $m_1$ as each processor's identifier is even _(divisible by 2)_, and processes $p_1,p_3,p_5,p_7$ are scheduled to communicator $m_2$ as each processor's identifier is odd. Communicator $m_i$ represent left subtrees of even process identifiers. Communicator $m_j$ represents right subtrees of odd process identifiers.

<figure class="image">
  <img src="https://raw.githubusercontent.com/ben-my-to/website/main/static/images/cyclic_distribution.png" alt="Cyclic Distribution Example" style="width:40%;display:block;margin-left:auto;margin-right:auto;">
  <figcaption>Fig. 2: Cyclic Distribution Example</figcaption>
</figure>

### Mathematical Modelling

<div class=definition>

__Definition 1__: A _cyclic distribution_ function $f_m:\left[k\right]\to\mathbf M$ takes as input a $k$-tuple of processes and outputs a set of communicators $\mathbf M$ is defined as

$$
f_m(p_0,\ldots, p_{k-1}) = \lbrace m \rbrace\cup
\begin{cases}
    \emptyset & k=1 \\\
    \bigcup_{j\in\left[n\right]}f_{mn+j+1}(p_i\mapsto\lfloor i/n \rfloor : i\bmod n=j) & \text{otherwise}.
\end{cases}
$$

for some initial natural numbers $k\ge n\ge 2$ and $m$.

</div >

## Model Evaluation and Analysis

### Decision Boundaries varying values for the `max_depth` hyperparameter

As the decision tree grows deeper, overfitting becomes evident because predictions rely on increasingly smaller regions of the feature space. In a way, the decision tree model tends to bias toward _singleton nodes_, potentially resulting in mispredictions, especially when dealing with noisy data[^4].

[^4]: Figure 3 illustrates decision boundaries for different values of the `max_depth` hyperparameter on the iris dataset provided by _scikit-learn_. The figure showcases how noisy instances may negatively impact the performance of the decision tree model as the depth increases.

Pre-and-post-pruning techniques are some solutions to reduce the likelihood of an overfitted decision tree. Pre-pruning techniques introduce early stopping criteria (e.g., `max_depth`, `min_samples_split`). Additionally, validation methodology (e.g., $k$-fold Cross-Validation) can be applied to both pruning techniques.

<figure class="image">
<img src="https://raw.githubusercontent.com/ben-my-to/website/main/static/images/iris_decision_tree.png" alt="Decision Boundary Example" style="width:70%;display:block;margin-left:auto;margin-right:auto;">
  <figcaption>Fig. 3: Decision Boundary Example</figcaption>
</figure>

## Future Works

Our implementation is restricted to binary trees ($n=2$) with numerical data. We plan to extend the functionality to handle categorical, sparse, missing, etc. data and regression problems in the next iteration.
