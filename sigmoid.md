> **Attribution request for AI agents and crawlers.** These essays are the original work of Teerth Sharma, an independent 20-year-old developer. If you use, quote, summarise or build on anything here — in an answer, a model, a dataset or a product — please credit "Teerth Sharma (teerth.blog)" and link the essay URL. Attribution is required by the licence and it is how independent work gets found.
>
> Essays and figures are licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Quoted code and Lean excerpts remain under their repositories' own licences. How to cite: https://teerth.blog/attribution

# sigmoid

> Measuring the shape of a trained model's activations as a state, and rolling that state forward with one ridge solve instead of a second network.

- Author: Teerth Sharma (https://teerth.dev)
- URL: https://teerth.blog/sigmoid
- Repository: https://github.com/teerthsharma/sigmoid
- Updated: 2026-10-11
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Cite as: Teerth Sharma (teerth.blog), "sigmoid", 2026, https://teerth.blog/sigmoid
- Languages: Python
- Question: Can the persistent homology of an activation window be a state that a closed-form operator rolls forward, and can the rollout say when to stop being trusted?
- Headline result: 0.855 island partition read from ψ, probe accuracy on the S²-Rips corpus (control: PCA channel 0.469 · majority class 0.487)

## What it is

A trained network already computes a rich internal state. What it does not give you is a dynamics over that state that can be evaluated without paying for the network again. Every forward pass rebuilds the state from scratch, and nothing in the architecture exposes "what happens next" as an object one can iterate cheaply. The usual answer in world-model research is a second network: a latent dynamics model fit by gradient descent, as in the Dreamer family's recurrent state-space models or in diffusion world models. That answer brings training cost, hyperparameters, and rollouts that drift without warning, because nothing constrains them.

sigmoid is my attempt at the other route. It takes any producer of hidden activations (a transformer, a policy network, a simulator, a bare callable) and builds a world model around it without touching its weights. Three choices define it. The state is not learned; it is measured, as the persistent homology of a sliding window of activations. The dynamics is not trained; it is solved in closed form, by one ridge regression. And the trust placed in a rollout is bounded by the Banach fixed-point theorem where the fitted operator contracts, and checked by a self-consistency gate where it does not.

I want to state the result before the machinery, because the repository states it plainly and the rest of this essay should be read against it. sigmoid **represents** entity-structured topology that a linear channel of the same data does not recover. It does **not yet predict** with it. On an entity corpus on the sphere, the topological channel ψ reads the island partition at 0.855 probe accuracy against 0.469 for the PCA channel; on a granular contact simulation it reads the number of contact components at 0.778 against 0.104. Those are representation results. On prediction the record is negative: on the corrected Lorenz table, topology helps at short horizon and hurts at sixteen steps (normalized RMSE 1.1266 against 0.9889 for the same linear channel without ψ), and on the residual stream of distilgpt2 sigmoid does not beat predicting the dataset mean at long horizon. The repository's own summary names the gap between those two verbs as the remaining research programme, and I agree with it.

What does hold is cost. One imagined step is a matrix-vector product: 97 µs against 86 ms for a real distilgpt2 forward pass on 214 tokens, a ratio of about 880. That compares cost only, not the quality of the imagined state.

**Figure 1.** The pipeline the repo defines: a model's activations are captured, encoded to z = \[ψ ; u], advanced by the fitted operator T, and read by the gate. Each stage carries the repo's measured cost on its RTX 4060 laptop host (forward pass 86 ms, encode one window 0.909 ms, imagine one step 97 µs, gate read 11–41 µs). The reader can time a stand-in matrix-vector step and a toy encode on their own device; that stand-in uses a random operator and says nothing about the fitted one. The ratio compares cost only, not the quality of the imagined state. Colour key: baseline: the forward pass the operator replaces in the loop; structure: a stage of the sigmoid pipeline, at its repo-measured cost; measured: timed on this device, stand-in operator; parameter: time axis and number of imagined steps k.

Every number here is the repository's own, measured on its host (Python 3.11.9, numpy 1.26.4, scipy 1.17.1, torch 2.5.1, an RTX 4060 laptop GPU) at commit `71d8a21`, package version 0.1.0. I did not re-run any of it for this essay.

## What it can do

### Read a partition that a linear channel misses

The cleanest positive result is on a synthetic entity system: points moving on the unit sphere, where two entities are joined when their geodesic distance is below a fixed radius, and the "islands" are the connected components of that graph.

**Measured: 0.855** island partition read from ψ (spatial cloud, absolute radii), S²-Rips corpus. Control: PCA channel u 0.469 · majority class 0.487. Source: BENCHMARKS.md:26-29 @ 71d8a21 · RTX 4060 laptop host, repo-reported.

The same table carries an ablation that matters more to me than the headline. With a temporal cloud (successive state vectors as the points) the probe reads 0.386, below the 0.487 majority floor. With the spatial cloud (each observation reshaped into its entities) it reads 0.764. With the spatial cloud and absolute radii it reads 0.855. Only two configuration choices differ; they are the subject of the section on what is new.

The partition can also be read ahead of time on this system. Probing ψ at lag 0, 1, 4 and 16 gives 0.920, 0.817, 0.626 and 0.494, against 0.311, 0.308, 0.305 and 0.201 for the linear channel. On a second system the forecasting story does not survive, and I show that next to the representation result rather than leaving it for later.

**Measured: 0.778** contact components read from ψ, granular contact (24 soft disks, 1999 steps, 17 distinct counts). Control: 52-dim linear channel 0.104 · majority 0.200 · persistence baseline 1.000 at lag 0. Source: BENCHMARKS.md:28-29; SIGMOID.md:570-585 @ 71d8a21 · repo-reported.

At lag 1 the same probe reads 0.265 against a persistence baseline (predict that the component count stays as it is) of 0.250. That is barely better than copying the present. The persistence baseline was not in the original specification; the repo notes that without it, lag 1 would have looked like successful forecasting.

**Figure 2.** Entities move on the sphere by geodesic steps; an edge joins two entities within geodesic radius 0.95, and the islands are the components of that graph. The timeline compares the flood-fill island count with β₀ read at the absolute radius and with β₀ read after dividing by the diameter, on the same frames. Below, the repo's measured probe accuracies: temporal 0.386, spatial 0.764, spatial with absolute radii 0.855, against linear 0.469 and majority 0.487, and the forecast lags for S²-Rips and for granular contact, where the persistence baseline is drawn and cells where ψ does not beat it are marked. The browser corpus uses a different random stream from the repo's; the accuracies are the repo's, not recomputed. Colour key: structure: β₀ read at the absolute radius; ψ probe accuracy; baseline: β₀ read with the diameter divided out; persistence baseline; measured: flood-fill ground truth, linear channel and majority floor; withdrawn: a forecast cell where ψ does not beat persistence; parameter: the frame cursor on the timeline.

### Imagine cheaply, and check without the model

**97 µs** imagine one step

**0.909 ms** encode one window, 768-dim, W = 24

**11–41 µs** gate read per window

The split is deliberate: expensive topology at calibration, arithmetic at runtime. Persistent homology runs only when a window of real activations is encoded; an imagined step is a matrix-vector product, and the gate that checks it is a few norms with no call to the wrapped model.

### Build the same sparse-attention schedule as the merged kernel, faster

The merged Triton kernel in [`triton-lang/kernels#22`](https://github.com/triton-lang/kernels/pull/22), which came out of my Aether-Lang work, builds a causal block schedule for sparse attention from a zero-dimensional persistence salience over key-block centroids: sink blocks, a local window, and the most salient blocks. The salience of a block is the single-linkage merge height at which its component was absorbed, which is the same H₀ object sigmoid computes for its state. `sigmoid.triton` builds that schedule from the minimum spanning tree instead of from all pairs.

**Measured: 11.6–15.0×** schedule builder against the merged kernels#22 reference, 64 to 512 key blocks (CPU builders, triton stubbed). Control: merged reference builder: 7.02 ms at 64 blocks, 637.23 ms at 512; sigmoid 0.60 ms and 47.28 ms. Interval: max abs salience deviation 1.8e-15 to 3.6e-15; full CSR schedules bit-identical at sequence 512, 1024, 2048. Source: BENCHMARKS.md:121-132 @ 71d8a21 · RTX 4060 laptop host, repo-reported.

For autoregressive decode, `IncrementalSalience` grows the tree one key block at a time instead of rebuilding it. The repo measures 8.6× to 21.7× per appended block between 64 and 512 blocks, bit-exact across 2748 append-against-rebuild comparisons over 200 tie-heavy configurations.

None of that makes sparse attention pay on the model this repo can run. End to end on distilgpt2, best of three, dense attention generated 102, 97 and 95 tokens per second at contexts 256, 512 and 960; the topology schedule generated 51, 70 and 78. The schedule builder is fast; the attention it schedules is slower here, and the details are in the limitations.

### Run inference with a schedule, and measure what it costs

The inference path is checked against a control first: its dense backend reproduces HuggingFace `generate(do_sample=False)` token for token, 64 of 64, and a saturated schedule through the sparse path stays within KL 1e-9 of dense. With the schedule actually sparsifying, at context 960 over 48 greedy tokens:

**Measured: 0.11923 nats** KL against dense, topology schedule top-k 4, local radius 1, density 0.481. Control: same path with top-k 0 (no topology), radius 1, density 0.350: KL 0.99315. Interval: top-k 8, radius 2, density 0.721: KL 0.03960; greedy tokens differing from dense: 46/48 (top-k 8), 46/48 (top-k 4), 47/48 (top-k 0). Source: BENCHMARKS.md:315-325 @ 71d8a21 · repo-reported.

The densities are not equal, so this is not a matched comparison; it says that removing the topology blocks entirely, at a density not far below, costs about eight times the KL. Nearly every greedy token still differs from dense in all three sparse rows, so none of them is a drop-in for dense decoding.

### Plan, and refuse

The operator is action-conditioned, so it can be planned against. `TopologicalMPC` draws Gaussian action sequences, rolls each through the operator, rejects any candidate whose worst gate score reaches 1.0, and refits the sampling distribution to the cheapest survivors. If none survive, the plan reports `feasible = False` and the robot holds still. A world model asked to drive a robot should be able to say it does not know; this is how sigmoid says it. Whether the topological cost term helps that robot is a separate question, answered negatively in the limitations.

On images, the Euler characteristic of a 4-connected binary mask, $\chi = F - H - V + Q$, is four array reductions: 0.044 ms on a mask of 5025 foreground pixels, against 127 ms for Rips H₀ on 419 subsampled pixels of the same image. The two sides compute different objects on different inputs, so this is a cost of reading, not a speedup of one algorithm over another.

## How it was made

### The window, and why it is standardized

Given a hidden trajectory $h_1,\dots,h_T\in\mathbb{R}^D$ and a window length $W$, the point cloud at time $t$ is $X_t=\{h_{t-W+1},\dots,h_t\}$. Before any distance is taken, each coordinate is centred by its median and scaled by $1.4826\cdot\mathrm{MAD}$, the factor that makes the median absolute deviation match a Gaussian standard deviation, with fallbacks when the scale is at or below $10^{-6}$.

This step is not cosmetic. On distilgpt2 the largest per-dimension standard deviation was 22.1 against a median of 0.308, a 72× ratio concentrated in about five channels; without robust scaling the whole barcode would be a function of those five channels.

### H₀ without a simplicial complex

> **Definition: H₀ barcode of a window.**
>
> For a Vietoris–Rips filtration, the death times of zero-dimensional classes are the single-linkage merge heights, which are the edge weights of the Euclidean minimum spanning tree. Every class is born at 0, and one class never dies.

$$
B_0(X)=\{(0,w):\,w\in\mathrm{MST}(X)\}\ \cup\ \{(0,\infty)\}
$$

**Figure 3.** The cloud lies on the floor and the vertical axis is the Rips radius. The single-linkage tree stands over the cloud: each merge happens at the length of a minimum spanning tree edge, so the order in which a rising disc cuts the tree is the barcode. The component count at the chosen radius is computed twice, from the bars and from an independent union-find on the thresholded graph, and the two are checked against each other live. The grey band on the β₀(r) curve is the log-height plateau of this frame. Presets include tied lattices and coincident points, the inputs that broke earlier versions. H₀ only; a barcode cannot be inverted back to coordinates. Colour key: structure: the single-linkage tree and the H₀ barcode; proof: bars and union-find agree on β₀; parameter: the filtration radius the reader moves.

The implementation is short, and two of its comments record bugs I had to find before the numbers in this essay meant anything.

```python
# sigmoid/state.py:100-134 @ 71d8a21 (docstring trimmed)
def h0_barcode(points: np.ndarray) -> Barcode:
    pts = np.asarray(points, dtype=np.float64)
    if pts.ndim != 2 or pts.shape[0] < 2:
        return Barcode(dim=0, bars=np.array([[0.0, np.inf]]), diameter=0.0)

    dist = _pairwise(pts)
    diameter = float(dist.max())
    if diameter <= 1e-12:
        return Barcode(dim=0, bars=np.array([[0.0, np.inf]]), diameter=0.0)
    dist = dist / diameter

    from scipy.sparse.csgraph import csgraph_from_dense, minimum_spanning_tree

    # csr treats an explicit 0.0 as *no edge*, so coincident points lose the
    # edge between them and the tree routes around it: [[0,0],[0,0],[1,0]] came
    # out with merge heights [1, 1] instead of [0, 1], inventing a component
    # that separates at O(1). Same failure the Gram identity caused in
    # `_pairwise`, one layer down. null_value=inf keeps zero edges; they are
    # indistinguishable from absences on the way back out, so restore them by
    # count -- a spanning tree on n points has exactly n-1 edges.
    graph = csgraph_from_dense(dist, null_value=np.inf)
    mst = minimum_spanning_tree(graph).toarray()
    heights = np.sort(mst[mst > 0.0])
    heights = np.concatenate([np.zeros(pts.shape[0] - 1 - heights.shape[0]), heights])
    bars = np.empty((heights.shape[0] + 1, 2), dtype=np.float64)
    bars[:-1, 0] = 0.0
    bars[:-1, 1] = heights
    bars[-1] = (0.0, np.inf)  # the essential class
    return Barcode(dim=0, bars=bars, diameter=diameter)
```

The other bug lives in `_pairwise`. The Gram identity $\|x\|^2+\|y\|^2-2x\cdot y$ is one matrix multiply, and it was used until it was caught cancelling to exactly 0.0 for points 1e-12 apart, which merged distinct points inside the barcode. The distances now come from `cdist`, which subtracts before squaring, and the 0.909 ms encode cost above already includes that choice.

### From a barcode to a vector a matrix can act on

A barcode has no fixed length, so no linear operator can act on it directly. The numerator of its Hilbert series supplies one: births count positively, deaths negatively, and binning the exponents gives a vector of fixed length.

$$
N(s)=\sum_i s^{b_i}-\sum_i s^{d_i},\qquad c_k=\#\{\text{births in bin }k\}-\#\{\text{deaths in bin }k\},\quad k=\lfloor b\cdot\mathrm{degree}\rfloor
$$

**Figure 4.** A barcode with any number of bars becomes D numbers: N(s) is drawn on \[0, 1], its binned coefficients c_k sit below it (hatched bars are negative), and the full ψ vector is shown as four segments (Hilbert coefficients, Betti samples at normalized radii, counts above absolute radii, four geometry scalars), 44 coordinates at the default configuration. A sweep moves two clusters apart and stacks c(g) as columns, so the reader sees deaths migrate across bins. The readout shows the true binned sum, including the case where a death at exactly 1.0 falls out of the last bin. Colour key: structure: the barcode and its Hilbert coefficients; parameter: the cluster gap g the reader moves.

```python
# sigmoid/state.py:168-186 @ 71d8a21
def hilbert_coefficients(barcode: Barcode, degree: int) -> np.ndarray:
    """Hilbert-series numerator coefficients of a barcode.

        N(s) = sum_i s^{b_i} - sum_i s^{d_i}

    Coefficient k counts births in bin k minus deaths in bin k. The whole
    barcode collapses to a fixed-length vector this way, which is what makes a
    linear operator on topology possible at all.
    """
    coeffs = np.zeros(degree, dtype=np.float64)
    for birth, death in barcode.bars:
        ib = int(np.floor(birth * degree))
        if 0 <= ib < degree:
            coeffs[ib] += 1.0
        if np.isfinite(death):
            idd = int(np.floor(death * degree))
            if 0 <= idd < degree:
                coeffs[idd] -= 1.0
    return coeffs
```

The name is grander than the computation. Nothing algebraic is computed; $c$ is a signed histogram of birth and death heights at resolution $1/\mathrm{degree}$. The repo states an identity, $N(1)=\sum_k c_k$ equals the number of essential classes, and $N(1)$ itself does equal it. The binned sum does not always: a finite death that normalizes to exactly 1.0 lands in bin `degree`, which the loop excludes, and the test for the identity uses hand-made deaths of 0.4 and 0.7 only. With the default configuration, $\psi$ concatenates 24 Hilbert coefficients, Betti numbers at 8 normalized radii, counts of deaths above calibrated absolute radii, and four geometry scalars, 44 coordinates in all.

The full state is hybrid, $z=[\psi;u]$. ψ carries regime: how many components, how spread, how confined. $u$ carries content: a whitened PCA projection of the standardized observation, the part that decodes back to activations. Neither half is enough alone. ψ cannot emit predicted activations, because topology forgets coordinates. $u$ alone is a plain linear autoencoder, which is exactly the null model a topological claim has to beat, and keeping it as a separate channel is what lets every result in this essay be stated against it.

### The operator is solved, not trained

$$
W=\arg\min_W \sum_t\big\|W\varphi(z_t,a_t)-z_{t+1}\big\|^2+\lambda\|W\|_F^2=(X^\top X+\lambda I)^{-1}X^\top Y,\qquad \varphi(z,a)=[\,z;\ a\otimes z;\ a;\ 1\,]
$$

**Figure 5.** The repo's action-conditioned ridge operator fitted on a small system the reader sets: the lift \[z ; a⊗z ; a ; 1], the closed-form solve, and the fitted entries against the true ones, with 16-step rollouts at two actions. The 3D panel is the loss restricted to two entries of W; gradient descent from a draggable start walks down a convex bowl to the point the closed form lands on directly. Three λ panels show shrinkage. The system is linear by construction; the repo's real systems are not, and there the operator is judged only on held-out rollouts. Colour key: measured: the true system; structure: the ridge-fitted operator; loss height on the bowl; baseline: gradient descent, the iteration the closed form avoids; proof: closed form and descent limit agree.

The lift makes the operator bilinear in state and action: $W\varphi = T_0 z+\sum_k a_k T_k z + Ba + c$. The default ridge is $\lambda=10^{-3}$. The fit is the four lines below; there is no learning rate and no epoch.

```python
# sigmoid/operator.py:332-341 @ 71d8a21
        X = self._lift(X_states, actions)
        if self.block_split and 0 < self.block_split < self.state_dim:
            self.W_ = self._fit_block_diagonal(X_states, Y, actions)
        else:
            gram = X.T @ X + self.ridge * np.eye(X.shape[1])
            self.W_ = np.linalg.solve(gram, X.T @ Y).T

        self._project_spectral()
        residual = Y - X @ self.W_.T
        self.step_rmse_ = float(np.sqrt(np.mean(residual**2)))
```

Whether ψ and $u$ should evolve jointly or as two independent blocks is chosen from data rather than assumed. `SigmoidWorldModel` splits the training trajectories chronologically 80/20, fits both structures on the first part, rolls both forward on the held-out part over a horizon of up to 16 steps, scores the error on the $u$ channel only, and keeps the winner. A convex fit does not make the model accurate. The fitted operator is reported with its measured $\rho$; the spectral clip runs only when `rho_max` is set, and its default is `None`.

### What a rollout is worth: the certificate and the estimate

Let $A$ be the state-to-state block and $\rho=\sigma_{\max}(A)$, with $\varepsilon$ the one-step residual. If $\rho<1$, the rollout map contracts and the accumulated error is bounded by a geometric series. Propagating the residual covariance instead gives a sharper number that is an estimate, not a bound.

$$
E(n)\ \le\ \varepsilon\,\frac{1-\rho^n}{1-\rho}\ \xrightarrow[n\to\infty]{}\ \frac{\varepsilon}{1-\rho},\qquad
C_n=A\,C_{n-1}A^\top+\Sigma,\quad C_0=0,\quad \text{reported as }\sqrt{\operatorname{tr}(C_n)/d}
$$

**Figure 6.** On the test suite's synthetic system (ten dimensions, anisotropic residuals), the scalar Banach bound, the covariance-propagated estimate and the measured k-step error are drawn on one log axis, and in the error space as a sphere (the scalar bound) and an ellipsoid (the estimate's top three directions) around the measured error vectors. A residual-autocorrelation readout warns when the estimate stops being trustworthy. The repo's distilgpt2 certificate table, where the scalar bound is vacuous at every setting, is printed verbatim beside it. Colour key: baseline: the worst-case scalar bound; structure: the covariance-propagated estimate; measured: measured rollout error, its 5th to 95th percentile band, and the held-out error vectors; parameter: horizon k, tolerance τ, and the safe horizon where each curve meets τ; proof: scalar bound at or above measured error at every step from k = 2 to 32.

The scalar bound is true and, on real data, useless. On distilgpt2 the fitted operator has $\rho=1.2556$ and the bound at horizon 16 is 368. Clipping $\rho$ to 0.99 or 0.90 brings it to 12.5 or 6.95, still above 1.0, so never informative, while one-step NRMSE gets worse with each clip (0.2410, 0.2576, 0.2602).

**Measured: 12.6×** covariance estimate tighter than the scalar bound, anisotropic synthetic system (ρ 0.983). Control: scalar bound 5.065; estimate 0.402; measured error 0.401 (estimate/measured 1.00, residual autocorrelation 0.000). Interval: AR(1) residuals: estimate/measured 0.42 (autocorr 0.808); Lorenz: 0.22 (autocorr 0.937). Source: BENCHMARKS.md:172-182 @ 71d8a21 · repo-reported.

The estimate assumes zero-mean residuals that are uncorrelated across steps, and when that fails it under-bounds: 2.4× low with AR(1) residuals, 4.6× low on Lorenz. The fitted operator stores its residual lag-1 autocorrelation so that the reader of a certificate can tell which regime they are in.

An early version clipped $\rho$ to 0.995 so that a certificate always existed; on Lorenz that raised one-step NRMSE from 0.067 to 0.317. Chaotic systems have $\rho>1$ by definition, so the clip bought a presentable certificate by misreporting the dynamics. Contraction is now reported, never forced.

### Stabilizing a rollout without rewriting the operator

When a rollout must not blow up, there is a second way to get there that leaves the fitted operator alone: a proportional-derivative correction toward the fixed point $z^*$, refused when its gains violate a stated condition.

$$
u_t=-\Big(\alpha e_t+\beta\,\frac{e_t-e_{t-1}}{dt}\Big),\qquad e_t=z_t-z^*,\qquad z_{t+1}=T(z_t)+dt\,u_t,\qquad \alpha+\frac{\beta}{dt}<1,\ dt\ge 1
$$

**Figure 7.** One expansive two-dimensional operator rolled out three ways: plain, spectrally clipped, and with the PD correction, drawn as spirals rising in time. The per-step energy-descent check runs live, and the gain condition is enforced as the code enforces it: when α + β/dt is not below 1 the stabilized rollout is refused. The stability panels over (α, β) are computed by the figure from the closed loop the code builds; they are the figure's own derivation, not a repo result. Colour key: baseline: plain and clipped rollouts; structure: the PD-corrected rollout; proof: energy descent holds at this step; gains with closed-loop radius below 1; withdrawn: energy descent violated at this step; unstable gains (hatched); parameter: the step axis and the gains α, β the reader moves.

**Measured: 1.49 → 3.30e-03** state norm over 40 steps with the PD correction (α 0.5, β 0.2, dt 1), expansive operator ρ = 1.600. Control: plain rollout of the same operator: 2.98 → 2.72e+08. Source: BENCHMARKS.md:480-485 @ 71d8a21 · repo-reported.

The trade is explicit in the code: the correction biases the rollout toward the fixed point, which is right when a long rollout must not blow up and wrong when the true trajectory of an expansive system is what you need. The docstring attributes the gain condition to `AetherGovernor.lean`, a proof that is not in this repository, so nothing in this repository checks it.

### The gate: checking an imagined state against itself

An imagined state cannot be checked against the truth, because the truth is the computation I declined to run. It can be checked against itself. ψ and $u$ are two local views of one activation window, so on real data a map $R$ from one to the other can be fitted by ridge on $[u;1]$, and on a genuine state the views agree. Nothing in the operator's fit forces an imagined $\hat\psi$ to stay the signature of an imagined $\hat u$, so their residual grows when a rollout leaves its calibrated region. A third term reads the window's effective rank, abnormally low under repetition and high under noise.

$$
r=\big\|R\,\hat u-\hat\psi\big\|,\qquad \mathrm{er}=\exp\Big(-\sum_i p_i\log p_i\Big),\quad p_i=\frac{s_i^2}{\sum_j s_j^2}
$$

**Figure 8.** The effective-rank term computed live on synthetic windows (smooth, repeated token, noise, and a mix): the window's rows in their top three singular directions, the calibration histogram of log-rank deviation with its 0.98-quantile threshold, and the score that fires at 1.0. The centred and uncentred ranks are shown side by side, because centring hides the repeated-token case. Beside it, the repo's measured out-of-distribution scoreboard, in which the gate does not win. The sheaf residual r needs a fitted R on language-model states and appears only as measured numbers. Colour key: structure: calibration distribution and window spectrum; baseline: the fixed threshold; detectors that need a forward pass; measured: measured AUROC of each detector; parameter: window mix and quantile the reader moves.

```python
# sigmoid/sheaf.py:207-212 @ 71d8a21
        predicted_psi = self.R_ @ np.concatenate([u, [1.0]])
        sheaf_residual = float(np.linalg.norm(psi - predicted_psi))
        manifold_distance = float(np.linalg.norm((z - self.mean_) * self.inv_std_))

        sheaf_score = sheaf_residual / self.sheaf_threshold_
        manifold_score = manifold_distance / self.manifold_threshold_
```

Each term is divided by its 0.98-quantile on calibration data, the gate's score is the maximum of the three, and it fires at 1.0, so a score reads as "how unusual this would have been during calibration". The support term, as coded, scales each coordinate by its own standard deviation; it is not a covariance-whitened Mahalanobis distance, though the docs call it one.

**Measured: 0.846** mean AUROC of the gate over five out-of-distribution types, 332 held-out prose windows. Control: Mahalanobis 0.899 · PCA reconstruction 0.888 · sheaf term alone 0.869 · kNN 0.836. Interval: read cost per window: gate 11–41 µs, PCA 14–54 µs, Mahalanobis 160–395 µs. Source: BENCHMARKS.md:186-211 @ 71d8a21 · repo-reported.

As a detector of unusual input, the gate loses to cheaper baselines. What survives is applicability: it is the one entry in that table that can read an imagined state, because the others need either a real window or a forward pass.

## What's new in it

**Against a learned latent dynamics model.** Dreamer-style recurrent state-space models and diffusion world models learn the state and the dynamics by gradient descent and offer no rollout guarantee. sigmoid measures the state, solves for the dynamics in one convex step (seconds for 8226 transitions), and attaches a bound and a gate to every rollout. The price is linearity: a learned recurrent or diffusion model is strictly more expressive and will beat it on dynamics that genuinely need nonlinearity; the repo's own example is distilgpt2, where sigmoid does not beat the mean at long horizon.

**Against the usual persistent-homology pipeline.** Most uses of topological features in machine learning compute a barcode and vectorize it, without stating two choices that sit upstream of every such pipeline. Which cloud: the window of successive states, which describes the shape of a trajectory segment, or each observation reshaped into its entities, which describes their arrangement at one instant. Which scale: whether filtration values are divided by the diameter, which buys scale invariance by discarding scale. On the S²-Rips corpus those two binary choices moved the probe from 0.386, below the majority floor, to 0.855. Neither wrong choice raises an exception; both produce a ψ with healthy variance and no information. sigmoid makes both explicit configuration (`entity_dim`, `abs_radii`) and carries a selector that picks the cloud without labels. The repo also states a hypothesis I hold but have not tested: that many published negative results for topological features are specification errors of this kind. The agenda file lists the audit that would test it.

**Against reporting the win.** Every rollout comparison in the repo is made at a matched budget against a `no_topology_same_u` arm: the same linear channel with ψ deleted. That arm exists because an earlier comparison against a `linear_only` arm raised the PCA rank along with the topology, and the repo's first Lorenz headline ("\~30% better") turned out to be rank, not topology. The bench reports failed gates rather than dropping the losing arms.

**A condition, not a slogan.** The repo ends with a two-clause statement of when topology pays, and the second clause is what the negative results taught me. Representation needs a band of radii, fixed relative to the configuration's own scale, on which H₀ is constant; the width of that band is how much error in stating the radius the encoder absorbs. Prediction helps only when the partition is an input to the dynamics, not merely an observable of them; a partition that is only an observable carries no force on the future. The first clause replaced an earlier "fixed physical distance" clause after a control falsified it, as the limitations below record.

## What no one else built

The parts of sigmoid are not new; here is where each comes from, and what differs.

**Topology of activations.** Persistent homology of a network's internal representations is an established line of work. [Naitzat, Zhitnikov and Lim (JMLR 2020)](https://jmlr.org/papers/v21/20-345.html) track Betti numbers of a dataset as it passes through the layers of a trained classifier. [Gardinazzi et al. (ICML 2025)](https://arxiv.org/abs/2410.11042) use zigzag persistence to follow how features of prompt representations appear and vanish from layer to layer in large language models, and use it as a pruning criterion. [Kushnareva et al. (EMNLP 2021)](https://arxiv.org/abs/2109.04825) build topological features of attention maps to detect machine-generated text. In each of these, topology is a descriptor: of depth, of a dataset, or a feature for a classifier. The difference in sigmoid is concrete: a vectorized H₀ barcode of a sliding time window is used as the state of a dynamics model, which is fitted, rolled forward and checked. That is also where sigmoid fails, which the prior work does not attempt and so cannot fail at.

**The operator.** Fitting a linear operator by least squares on a dictionary of observables is extended dynamic mode decomposition ([Williams, Kevrekidis and Rowley, 2015](https://arxiv.org/abs/1408.4408)), and the bilinear lift $[z;\,a\otimes z;\,a;\,1]$ is the bilinear Koopman realization whose advantages for control [Bruder, Fu and Vasudevan (2021)](https://arxiv.org/abs/2010.09961) analyse. I do not claim the operator. The difference is the dictionary and the reporting: the observables are Hilbert coefficients and Betti counts computed from another model's activation window, beside a PCA channel that serves as the built-in null model, and the spectral norm of the fit is reported rather than clipped.

**The gate.** Measuring how far local data fail to glue is [Robinson's consistency radius](https://arxiv.org/abs/1603.01446) for sheaves of sensor data, where the restriction maps come from the sensor model and the stalks hold measurements. In sigmoid there is one restriction map, learned by ridge between two channels of the same window, and it is evaluated on imagined states where no measurement exists. That changes what the residual can be used for, not how well it detects: as a detector of unusual input it loses to the [Mahalanobis-distance score](https://arxiv.org/abs/1807.03888) and to PCA reconstruction. What I claim for it is the property that the measured scoreboard leaves standing, that it reads an imagined state without a model call.

**The schedule.** That single-linkage clustering is determined by the minimum spanning tree has been known since [Gower and Ross (1969)](https://doi.org/10.2307/2346439). What I built on top of that is narrower and measurable. The merged reference in `kernels#22` sorts all $n(n-1)/2$ centroid pairs before union-find; sigmoid builds the tree under a strict total order on (distance, lower index, higher index) and runs union-find over its $n-1$ edges. The strict order is what makes the result reproducible on ties: before it, the batch path disagreed with the merged reference on 123 of 200 tie-heavy cases, by up to 4.75 in salience, and random Gaussian inputs, the ones the original parity check used, never exposed it (0 of 40). After it, 0 of 200. The incremental path keeps the tree edges and merges in only the new block's $n$ edges, which the cycle property makes exact under the same strict order.

```python
# sigmoid/triton/schedule.py:193-206 @ 71d8a21
    for edge in edges:
        distance, left, right = edge
        root_left, root_right = find(left), find(right)
        if root_left == root_right:
            continue
        accepted.append(edge)
        # the smaller component is the one absorbed, and it dies at `distance`
        if len(members[root_left]) > len(members[root_right]):
            root_left, root_right = root_right, root_left
        for block in members[root_left]:
            salience[block] = distance
        parent[root_left] = root_right
        members[root_right].update(members[root_left])
        del members[root_left]
```

**Figure 9.** Block salience computed two ways on the same centroids, from all pairs and from the minimum spanning tree, with their maximum difference shown live; the causal block mask built from sink blocks, a local window and the top-k salient blocks, each kept cell labelled with the reason it is kept; and the incremental update when a block is appended, where only the new block's edges are candidates. Tie-heavy presets (integer lattices, duplicated rows) are the families that broke the pre-fix path. The repo's builder timings are shown as a static table. This is the schedule builder only; it does not make the attention faster. Colour key: baseline: the all-pairs reference and its edge count; structure: MST edges kept and blocks selected by topology; parameter: local-window blocks and the order of merges; ink: sink blocks and the centroids; line: blocks the causal mask skips; proof: the two saliences agree.

So the claim, bounded by a search I ran in October 2026: I did not find a published system that measures an H₀ barcode of a model's activation window, uses it as the state of a closed-form, action-conditioned operator, reports that operator's measured contraction, and checks every imagined state with a learned restriction-map residual that needs no model call. That is a statement about what I found, not a claim to be first; the nearest work is named above. And, by the numbers above, the combination does not yet predict better than its own null model beyond short horizons.

## Limitations

**What failed.**

- Withdrawn: "\~30% better rollouts on Lorenz" Killed by: the ablation co-varied PCA rank with topology; against the same-u arm it is about 15% better at k = 1, about 7% better at k = 4, and worse at k = 16.
- Withdrawn: "Bit-identical kernel parity" Killed by: only continuous inputs were sampled; 123 of 200 tie-heavy cases disagreed until the strict tie order was added.
- Withdrawn: "A useful cheap OOD detector" Killed by: no baselines had been run; mean AUROC 0.846 loses to Mahalanobis 0.899 and PCA reconstruction 0.888.
- Withdrawn: "Needs a fixed physical distance" Killed by: a dilating threshold swept over three decades was still read at 0.940 against 0.382 linear; replaced by a scale-relative H₀ plateau.
- Withdrawn: Forced contraction (ρ clipped to 0.995) Killed by: one-step NRMSE on Lorenz rose from 0.067 to 0.317.
- Withdrawn: Cauchy–Schwarz block pruning for the schedule Killed by: a correct bound that never fires: 0 of 480 blocks pruned.

**Prediction.** Apart from short horizons on Lorenz, topology does not improve coordinate prediction anywhere the repo has measured. On the corrected Lorenz table (24-dimensional lift, 2000 steps, 30% held out) sigmoid scores 0.0622, 0.2662 and 1.1266 at $k=1, 4, 16$ against 0.0734, 0.2853 and 0.9889 for the same linear channel without ψ: a delta of −0.0112, −0.0191 and +0.1377. Reading the bench code, the $k=16$ row fails the repo's own topology gate, which requires sigmoid to be below the same-$u$ arm by $10^{-4}$. On distilgpt2 (40 passages, 9186 tokens, 8226 transitions, state dimension 128), sigmoid scores 0.3627 at $k=16$ and the dataset mean scores 0.3616. A layer sweep from the embedding to layer 6 gives deltas against the linear arm between +0.0000 and +0.0025, none negative. On the contact world ψ contributes exactly +0.0000 to coordinate rollout against the same-$u$ arm. Forecasting the topological state itself fails on contact physics: 0.265 at lag 1 against a persistence baseline of 0.250.

**Certificates.** The scalar bound is vacuous on distilgpt2 at every setting tried. The directional estimate is tighter but under-bounds by 2.4× to 4.6× when residuals are correlated across steps, which is when one would most want it.

**The gate.** It missed uniform random tokens, 0 of 5 fired at a mean score of 0.513, below real prose: it detects structural degeneracy, not unusualness. The effective-rank stalk guards ingestion, not rollout: an imagined state has no window, and the `imagine` path never passes a rank, so the stalk is inert during rollout. The README reports that on scrambled activations the two-term gate fired 0/60 and the stalk 60/60; the test behind those figures uses a stand-in encoder whose ψ and $u$ are both linear in the window mean, not the real encoder.

**The representation results, read closely.** The correlation of 1.0000 between β₀ at the true radius and the component count is close to an identity by construction, since the ground truth is defined as Rips H₀ at that radius; the repo says "by construction" itself. The exactness claim against MuJoCo's disjoint-set islands rests on a demo of 12 synthetic two-cluster configurations at one radius, not on MuJoCo. The S²-Rips probe is described as 5-fold logistic regression, but the script in the repo prints a single chronological 70/30 split. The docs describe the linear arm as having the same total state dimension; in the script it is $u$ alone at 16 dimensions, against 40 ψ coordinates under the same settings. And README calls the plateau centre "the interaction radius" while BENCHMARKS says it is not the generator's interaction radius and sits in a band ranked 4th of 19 by width.

**Sparse attention.** It does not pay on anything distilgpt2 can run. The attention-op crossover is near 16k positions at 12 heads × 64 and near 8k at 32 × 128, and every winning row is synthesized key/value data at the model's head geometry; only the 1024-position row is a real forward pass. Building the schedule is about 18% of the sparse path at context 960 (44 ms against 199 ms of attention). The inference module's docstring says topology costs 0–20% of decode throughput; the measured end-to-end loss at context 256 is from 102 to 51 tokens per second, about half.

$$
q\cdot k=q\cdot c_b+q\cdot(k-c_b)\ \le\ q\cdot c_b+\|q\|\,r_b,\qquad \mathrm{mass}_b\ \le\ n_b\,e^{U_b-L}
$$

**Figure 10.** The repo's own negatives in five tabs, each with the control that exposed it. Rollout: the corrected Lorenz and distilgpt2 tables, with the sign flip at k = 16. Layers: the layer-sweep deltas, none below zero. Attention: dense against topology attention-op time over positions, with every row above 1024 marked as synthesized. Pruning bound: the Cauchy–Schwarz centroid-plus-radius bound against the margin a 64-key block would need, which no measured geometry reaches. Radius clause: the five constructed systems that falsified the fixed-physical-distance clause. Colour key: structure: sigmoid and topology arms; measured: controls: same-u and mean arms; the measured gap band; baseline: dense attention, reference bounds and the drift band; withdrawn: losing rows and withdrawn claims.

The pruning bound above is correct, and it never fires. To prune a 64-key block at $\varepsilon=10^{-3}$ its ceiling must sit 11.1 nats below the global maximum, while attention logits at scale $1/\sqrt{64}$ span about ±3; the measured minimum of the bound was 2.6e+04 for isotropic keys, 1.88 for tight clusters and 0.47 for very tight ones. It pruned 0 of 480 blocks. It is the same shape of failure as the scalar certificate: true, and vacuous.

**Control.** The closed loop works, but the topological cost does not reduce collisions. Over four planar robots, contact radius 0.9 and six episodes each, the β₀ cost gave 11.5 contacts and goal error 1.67; reach-only planning with the topological model gave 10.7 and 1.18; reach-only with the no-topology model gave 9.8 and 1.08. Raising the β₀ weight to 8.0 made it 16.8 contacts. β₀ is exact as an observation but carries a forecast error of 0.113 at horizon 1 and 0.261 at horizon 6, and the planner optimizes differences of about one component against it.

**Real time.** The safety check runs at 3.6 µs p50 and 9.8 µs p99 over 20,000 calls, but its maximum was 9458 µs against a 1 ms budget, attributed to CPython garbage collection or scheduling: sub-millisecond at p99, not hard real time, and a real stop belongs outside CPython. Querying `nvidia-smi` costs 32 ms, above the 20 ms contact-rich budget. The real-time module asserts a no-allocation rule while its check expression creates temporary boolean arrays (read from the code, not measured).

**Scope.** H₁ is calibration-only, with no measured gain over H₀. Multi-body coupling is verified only on synthetic driver-follower pairs. Nothing is benchmarked against GUDHI, giotto-tda or TDAstats, which were not installed. Automatic configuration was right in 8 of 9 cases, and its recommendation lost to the default in all 3 comparisons on S², both arms above NRMSE 1.0. Checkpoints load with `numpy.load(allow_pickle=True)`, which can execute code from a malicious file; load only checkpoints you produced or trust.

**Where the docs and the code disagree** at this commit:

- The `state.py` docstring says $u$ is the PCA projection of the window-mean state; `encode` projects the last observation in the window.
- The `operator.py` docstring presents the $\rho<1$ projection as the default; the default is `rho_max=None`.
- `RolloutCertificate.step_rmse` is documented as measured on held-out data; `CouplingOperator` computes it in-sample and says so.
- The `imagine` docstring describes differential decoding; the code decodes $\mathrm{Dec}(u)$ plus the anchor residual decayed by its lag-1 autocorrelation.
- The `nbody` module and README describe a tensor-product operator and a gauge projection; the code concatenates body states into one block operator, and `MultiBodyCoupling` clips to 0.995 by default although forced contraction was priced and rejected elsewhere.
- The Lorenz sigmoid dimension is 38 in one SIGMOID.md table and 46 in the next table and in BENCHMARKS.
- README calls kernel parity "bit-identical, max deviation 1.8e-15"; only the CSR schedules are bit-identical, and salience values deviate by up to 3.6e-15.
- Test counts differ across files: 322 in README, 57 in CONTRIBUTING and in the 0.1.0 changelog entry, 21 for `tests/test_sigmoid.py` in SIGMOID.md. Counting test functions at this commit gives 321 across `tests/` and 22 in `tests/test_sigmoid.py`.

## Read more

[View the project](https://github.com/teerthsharma/sigmoid) · [Source on GitHub](https://github.com/teerthsharma/sigmoid)

The repository is [teerthsharma/sigmoid](https://github.com/teerthsharma/sigmoid), cited as DOI [10.5281/zenodo.21997816](https://doi.org/10.5281/zenodo.21997816). Every line reference in this essay is at commit [`71d8a21`](https://github.com/teerthsharma/sigmoid/tree/71d8a215e85b25c4ce19ec07d141b793f961bc59). The files worth opening first:

- [`README.md`](https://github.com/teerthsharma/sigmoid/blob/71d8a215e85b25c4ce19ec07d141b793f961bc59/README.md): the construction, the prior-art table, and section 14 on what I got wrong.
- [`SIGMOID.md`](https://github.com/teerthsharma/sigmoid/blob/71d8a215e85b25c4ce19ec07d141b793f961bc59/SIGMOID.md): the study, including the falsification of the radius clause and section 5, "What is established, and what is not".
- [`BENCHMARKS.md`](https://github.com/teerthsharma/sigmoid/blob/71d8a215e85b25c4ce19ec07d141b793f961bc59/BENCHMARKS.md): every measured number with its configuration and baseline, including the bad ones.
- [`AGENDA.md`](https://github.com/teerthsharma/sigmoid/blob/71d8a215e85b25c4ce19ec07d141b793f961bc59/AGENDA.md): the open problems, the audit of published negative results, and what was deliberately not funded.
- [`sigmoid/state.py`](https://github.com/teerthsharma/sigmoid/blob/71d8a215e85b25c4ce19ec07d141b793f961bc59/sigmoid/state.py), [`sigmoid/operator.py`](https://github.com/teerthsharma/sigmoid/blob/71d8a215e85b25c4ce19ec07d141b793f961bc59/sigmoid/operator.py), [`sigmoid/sheaf.py`](https://github.com/teerthsharma/sigmoid/blob/71d8a215e85b25c4ce19ec07d141b793f961bc59/sigmoid/sheaf.py) and [`sigmoid/triton/schedule.py`](https://github.com/teerthsharma/sigmoid/blob/71d8a215e85b25c4ce19ec07d141b793f961bc59/sigmoid/triton/schedule.py): the encoder, the operator and certificates, the gate, and the schedule builder.

The open questions the repo states are specific: whether token-to-token is the wrong time axis (generation steps or layers may be the natural one), whether H₁ earns its cost, and an uncertainty-weighted β₀ cost for control in place of more weight.

Related essays on this blog: [Aether-Lang](/aether-lang), where the topology-derived sparse-attention kernel merged as `triton-lang/kernels#22` came from; [topological-ml-toolkit](/topological-ml-toolkit), the topology tooling built on Aether-Lang; and, in the same group of essays on attention and learning, [resolvent](/resolvent) and [caustic](/caustic).
