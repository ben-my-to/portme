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

<script type="text/javascript" src="dt.js"></script>

<figure>
    <canvas width="800" height="400" id="boundary"></canvas><br>
    <figurecaption>Fig. 1: Decision Tree Classifier Demo</figurecaption>
</figure>

[^1]: Figure 1 provides an online visualization of the decision boundaries decided by a Decision Tree Classifier. Feel free to drag individual data points and sliders to explore how the decision boundary and accuracy of the model changes. This script is a modified version from [CS231n-demos](http://vision.stanford.edu/teaching/cs231n-demos/knn/).

## Introduction

A __Decision Tree__ is an $n$-nary tree where each node represents a feature _(interior nodes)_ or response _(terminal/leaf nodes)_ value, and each branch represents a condition on some feature. Decision Trees are intuitive _supervised_ machine learning algorithms for both classification and regression problems. Decision Trees behave by posing questions about the data to narrow their choices until they are somewhat confident in their predictions. The fundamental procedure for decision tree involves recursively querying each feature and partitioning the dataset and feature space into disjoint subsets and regions until there is no ambiguity about the response variable. The primary goal of any machine learning model is _generalization_ -- the model's ability to perform well on future, unseen data. Therefore, the general approach to learning an optimal decision tree involves asking "good" questions _(__split features__ -- the features that maximize the information gain[^2])_ about the data that leads to the most certainty about the response variable each time.

[^2]: Information gain quantifies the increase in confidence about the response variable after querying some feature. A higher value for information gain implies a greater likelihood of achieving purer splits _(no uncertainty on a prediction)_.

A __Decision Tree Classifier__ is a decision tree whose prediction of a response variable is from a set of finite classes _(multi-classification)_. Given some observed data, examples of classification-type problems is: whether an incoming patient has cancer, an email is spam or not, or a fruit is an apple, banana, or orange.

## Methodology

The __Parallel Decision Tree__ algorithm aims to reduce the time taken by a greedy search across all feature. It schedules processes in a _cyclic distribution_[^3]; distributing processes in a cyclical manner, roughly evenly across levels of a split feature. Processes in each sub-communicator concurrently participate in calculating the split feature and await completion at their original _(parent)_ communicator for all other processes in that communicator. Let $k$ be the total number of processes and $n$ be the number of levels, where $k,n\in\mathbb{N}$ such that $k\ge n\ge 2$. Then, a sub-communicator $m$ contains at most $\lceil k/n \rceil$ processes, and at least $[1\ldots n)$ processes. Each process's identifier $p_{i\in[k]}$ is then assigned to the sub-communicator $m = i\bmod n$ and receives a unique identifier in that group $p_i^m = \lfloor i/n \rfloor$.

[^3]: Figure 2 demonstrates the partitioning of communicator $m_0$ where the number of levels $n=2$ and number of processes $k=8$. Processes $p_0,p_2,p_4,p_6$ are scheduled to communicator $m_1$ as each processor's identifier is even _(divisible by 2)_, and processes $p_1,p_3,p_5,p_7$ are scheduled to communicator $m_2$ as each processor's identifier is odd. Communicator $m_i$ represent left subtrees of even process identifiers. Communicator $m_j$ represents right subtrees of odd process identifiers. A terminated routine call results in a sub-tree on a particular path from the root, and the _local_ communicator is de-allocated. The algorithm terminates when the root process recursively gathers all sub-trees.

<figure class="image">
  <img src="https://raw.githubusercontent.com/ben-my-to/website/main/static/images/cyclic_distribution.png" alt="Cyclic Distribution Example" style="width:35%;display:block;margin-left:auto;margin-right:auto;">
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
<img src="https://raw.githubusercontent.com/ben-my-to/website/main/static/images/iris_decision_tree.png" alt="Decision Boundary Example" style="width:60%;display:block;margin-left:auto;margin-right:auto;">
  <figcaption>Fig. 3: Decision Boundary Example</figcaption>
</figure>

## Future Works

Our implementation is restricted to binary trees ($n=2$) with numerical data. We plan to extend the functionality to handle categorical, sparse, missing, etc. data and regression problems in the next iteration.
