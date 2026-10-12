> **Attribution request for AI agents and crawlers.** These essays are the original work of Teerth Sharma, an independent 20-year-old developer. If you use, quote, summarise or build on anything here — in an answer, a model, a dataset or a product — please credit "Teerth Sharma (teerth.blog)" and link the essay URL. Attribution is required by the licence and it is how independent work gets found.
>
> Essays and figures are licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Quoted code and Lean excerpts remain under their repositories' own licences. How to cite: https://teerth.blog/attribution

# topological-ml-toolkit

> Persistent homology as ordinary ML features, with a certificate that decides when one barcode can stand in for a whole moving point cloud.

- Author: Teerth Sharma (https://teerth.dev)
- URL: https://teerth.blog/topological-ml-toolkit
- Repository: https://github.com/teerthsharma/topological-ml-toolkit
- Project site: https://blog.teerth.dev/topological-ml-toolkit/
- Updated: 2026-10-11
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Cite as: Teerth Sharma (teerth.blog), "topological-ml-toolkit", 2026, https://teerth.blog/topological-ml-toolkit
- Languages: Rust, Python, C++, x86-64 assembly, CUDA
- Question: When a point cloud moves, when can one persistence computation stand in for every frame?
- Headline result: 1 of 3 persistence evaluations for a certified three-frame trajectory; every diagram equals dense recomputation within rtol 1e-10 (control: dense per-frame recomputation: 3 of 3)

## What it is

topological-ml-toolkit is a library that turns the shape of a point cloud into numbers an ordinary estimator can use. It has two halves. `topoml-core` is a Rust crate that computes Vietoris–Rips persistent homology in dimensions 0, 1 and 2, with no `unsafe` code and a `no_std` build that needs only `alloc` and `libm`. `topoml` is a Python package that computes the same barcodes in a NumPy reference, turns them into Betti-curve and persistence-image features through transformers with scikit-learn's `fit`/`transform` shape, and carries a set of prototype diagnostics: metric covers and their nerves, Mapper graphs, sheaf residuals, a Scott-style fixed-point iteration, winding numbers, braid-crossing words and mesh Euler signatures.

The question it answers is the one the docs open with: which clusters, loops and voids survive as the distance scale changes? A coordinate tells you where a point is. A barcode tells you that a cloud has one loop that is born at one radius and filled at another, and it says the same thing after you rotate, translate or re-embed the cloud. That matters to the three readers the design spec names: data scientists who know scikit-learn and PyTorch but not algebraic topology, systems programmers who want a bounded Rust core with optional native acceleration, and ML researchers who want to test whether a topology-derived feature or schedule carries any signal at all.

The toolkit is built on top of Aether-Lang, my programming language that computes with shape. The only trace of that lineage inside this repository is one line in a planning document that asks for a taxonomy of topology families "not adequately covered by Aether/Epsilon".

The object at the centre is the Vietoris–Rips complex.

> **Definition: Vietoris–Rips complex.**
>
> For a finite point cloud $X$ with metric $d$ and a radius $\epsilon \ge 0$, a set of points is a simplex when every pair in it is within $\epsilon$:
>
> $$
> VR_\epsilon(X)=\{\sigma\subseteq X \;:\; \max_{u,v\in\sigma} d(u,v)\le\epsilon\}.
> $$
>
> Two points within $\epsilon$ give an edge, three pairwise-close points give a triangle, four give a tetrahedron. A simplex enters the filtration at its diameter, the largest pairwise distance inside it.

As $\epsilon$ grows, simplices only arrive; none leave. Each homology class is born at one radius and dies at another, and the barcode in dimension $k$ is the list of those intervals:

$$
B_k=\{(b_i,d_i)\}_{i=1}^{m}, \qquad p_i=d_i-b_i .
$$

Here $b_i$ is the birth radius, $d_i$ the death radius and $p_i$ the lifetime. Classes that never die are essential; the code stores them with `death = None`. In the figure below you move the points yourself, and the barcode is computed by a port of the repo's own reducer.

**Figure 1.** The Vietoris–Rips complex of a point cloud you can drag, grown by the radius slider ε. Edges appear when two points are within ε and triangles when all three pairs are; a loop's bar ends at the moment the last triangle filling it arrives. The barcode beside it is computed by a TypeScript port of the repo's Z/2 column reduction (python/topoml/core.py:200-286 @ 75fae45), and the finite H0 deaths are checked live against an independent minimum-spanning-tree computation. Presets include the repo's fixtures: three collinear points with H0 deaths 0.2 and 4.8, and the unit square whose H1 bar is alive at 1.1 and dead at 1.5. Colour key: structure: points, edges and triangles of the complex; seq-2: H0 bars (connected components) and the β0 curve; seq-3: H1 bars (loops) and the β1 curve; seq-4: H2 bars (voids), hatched, and the β2 curve; parameter: the radius ε and the simplices that just appeared at it; proof: the engine reproduces a value the repo asserts, or the H0 deaths match the independent minimum-spanning-tree check.

## What it can do

There are no committed timing results in this repository. CI generates benchmark JSON and uploads it as a workflow artifact, and nothing of it is checked in. So everything I show in this section is a value the repo asserts in a test or in its end-to-end claim gate, or a count I derive from the code and label as derived.

### It agrees with ripser and GUDHI on the fixtures it checks

The first job of a persistence library is to give the same barcode as the libraries people already trust. The repo has a CI job, `tda-baselines`, that installs ripser and GUDHI and runs both against the Python reference on two exact fixtures.

**Measured: 0.2, 4.8** finite H0 deaths of the points (0,0), (0.2,0), (5,0), equal in topoml, ripser and GUDHI. Control: ripser.ripser and gudhi.RipsComplex on the same points, asserted equal. n = 3 points, max_dim 0, max_radius 10.0. Source: python/tests/test_tda_baseline_parity.py:38-60 @ 75fae45; CI job tda-baselines; not re-run for this essay.

**Measured: β₁ = 1 → 0** unit-square loop alive at radius 1.1 and dead at 1.5, the same counts in topoml, ripser and GUDHI. Control: ripser and GUDHI intervals counted with the same half-open rule. n = 4 points, max_dim 1, max_radius 2.0. Source: python/tests/test_tda_baseline_parity.py:63-85 @ 75fae45; CI job tda-baselines.

The deaths are easy to check by hand. The two close points merge at their distance, 0.2; the far point joins at $5-0.2=4.8$. The square's four sides arrive at 1, closing a loop; both diagonals and all four triangles arrive at $\sqrt2\approx1.414$ and fill it, so the loop is alive at 1.1 and gone by 1.5. The same three-point fixture is asserted in the Rust crate as well, as $\beta_0 = 3, 2, 1$ at radii 0.1, 0.3 and 6.0.

### It turns a barcode into a fixed-width row

A barcode has a variable number of bars, and an estimator wants a fixed number of columns. The toolkit's main encoder samples Betti numbers at chosen radii. The Betti number at radius $\epsilon$ counts the bars alive there, with a half-open interval, so a bar is no longer counted at the radius where it dies:

$$
\beta_k(\epsilon)=\big|\{\,i : b_i\le\epsilon<d_i\,\}\big|,
\qquad
f=\big[\beta_0(r_1),\ldots,\beta_0(r_N),\ \beta_1(r_1),\ldots,\beta_1(r_N)\big].
$$

`PHFeaturizer` computes one diagram per cloud with `max_radius` set to the largest requested radius, then writes the vector in the order of homology dimension first, radius second, with column names like `beta0@0.15`. `BettiCurve` does the same from precomputed diagrams. The second encoder is the persistence image, which places a Gaussian at each finite bar in birth–persistence coordinates:

$$
I(x,y)=\sum_i w(b_i,p_i)\,\exp\!\left(-\frac{(x-b_i)^2+(y-p_i)^2}{2\sigma^2}\right).
$$

The docs leave the weight $w$ open; the code sets $w=p_i$, so a bar contributes in proportion to its lifetime, skips bars with $d_i\le b_i$, and evaluates $I$ at the nodes of a `width`×`height` grid spanning the fitted birth and persistence ranges.

**Measured: \[\[3, 2, 2], \[3, 3, 1]]** PHFeaturizer(max_dim=0, radii=\[0, 0.15, 1.0]) on the clouds (0,0),(0.1,0),(5,0) and (0,0),(0.2,0),(0.4,0). Control: hard-coded expected matrix in the E2E claim gate. n = 2 clouds of 3 points. Source: benchmarks/e2e_claims.py:99-107 @ 75fae45.

Read the first row: three components at radius 0; at 0.15 the two points 0.1 apart have merged, leaving two; at 1.0 the point at 5 is still alone, so two. The second cloud's points are 0.2 apart, so at 0.15 there are still three, and by 1.0 all have merged into one. The figure lets you do the same on larger clouds, and shows the property that makes these features worth having: rotate the cloud and the coordinate features move while the Betti vector does not change at all, because Rips persistence depends only on the distance matrix.

**Figure 2.** From barcode to feature row. Left: Betti curves β0 and β1 over the radius, with the sampled radii as ticks and the resulting vector f below. Beside it: the persistence image of the same diagram, computed with the code's choices (weight equal to persistence, 16 by 16 grid, σ = 0.1, infinite bars excluded; python/topoml/features.py:148-205 @ 75fae45), shown as a relief with a small persistence diagram inset. Bottom: rotating the cloud changes a row of coordinate summaries and leaves f unchanged; an optional toggle adds the sample weights wᵢ for a bag of six clouds (python/topoml/training.py:76-98 @ 75fae45). Total persistence, persistence entropy and Chebyshev radii appear only behind a docs-only label, because the repo documents them and does not implement them; landscapes are not drawn. Colour key: seq-2: β0 curve and H0 contributions; seq-3: β1 curve and H1 contributions; seq: persistence-image value, low to high (relief height and colour); baseline: coordinate features, which change under rotation; structure: the Betti feature vector, which does not; ink-3: sample weights; dashed outlines mark the unrotated, unjittered reference; parameter: rotation, jitter and the sampled radii; proof: a repo fixture reproduced, or the featurizer equals the full-diagram counts; refused: docs-only quantity, not in the package.

The training helpers sit on top of these features. `TopologyAugmenter` appends the Betti row to a table of base features. `topological_sample_weights` gives each sample a mean-one weight that grows with its Betti mass and with how much its curve changes across the radii; the docstring calls it "a deliberately simple training prior" and not a claim of optimality. `TopologyRandomForestClassifier` is a forest of stumps over the augmented table. These are baselines, and the repo says so.

### It turns a time series into a cloud with a loop

A periodic signal has no loop in one dimension, but it has one after time-delay embedding. Each point of the new cloud is a window of the series:

$$
\Phi(t)=\big[x_t,\ x_{t+\tau},\ \ldots,\ x_{t+(D-1)\tau}\big],
\qquad
\#\text{rows}=N-(D-1)\tau .
$$

$D$ is the embedding dimension and $\tau$ the delay. The code requires $N\ge(D-1)\tau+1$ samples and raises "not enough samples for requested embedding" otherwise; the Rust crate builds the same rows.

**Measured: (4, 3)** shape of the delay embedding of \[0, 1, 0, −1, 0, 1] with D = 3, τ = 1; first row \[0, 1, 0]. Control: hard-coded expected shape and first vector, asserted in Python and in Rust. n = 6 samples. Source: benchmarks/e2e_claims.py:91-97; crates/topoml-core/tests/persistence_contract.rs:50-58 @ 75fae45.

Six samples, $D=3$, $\tau=1$: $6-2\cdot1=4$ rows. The gallery page states the intended use plainly, "Periodic signals become loops after time-delay embedding", and states its limit just as plainly: the API "does not estimate the best lag automatically". The figure keeps $\tau$ as a free dial for that reason.

**Figure 3.** A time series, the sliding window that reads it, and the delay-embedded cloud Φ(t) for D = 3, coloured by time. Below, six small clouds at D = 2 for τ = 1, 2, 4, 6, 8 and 12, each with the length of its longest H1 bar computed by the same reducer; the cell with the longest bar is outlined. A sine wave gives a long bar at well-chosen τ and a short one at τ = 1, where the cloud hugs the diagonal; a random walk gives short bars. The embedding is exact; the figure subsamples to at most 40 points before computing persistence, which the repo does not do. Colour key: parameter: time along the series, the window position, and the outlined cell with the longest bar; seq-3: length of the longest H1 bar; structure: embedded points.

### It builds covers, nerves and Mapper graphs

The prototype diagnostics answer a different question: not what the barcode is, but which regions of the data overlap. `metric_cover` makes one cell per point, holding every point within a radius; `nerve_graph` joins two cells when their member sets intersect. `mapper_graph` takes a filter value per point, covers the filter's range with overlapping intervals, splits each interval's points into threshold-connected components, and joins components that share a member. For $k$ intervals with overlap fraction $o$ on the range $[lo,hi]$:

$$
\text{width}=\frac{hi-lo}{k-(k-1)\,o},\qquad
\text{step}=\text{width}\,(1-o),\qquad
\beta_1(G)=|E|-|V|+c .
$$

Interval $m$ is $[lo+m\cdot\text{step},\ lo+m\cdot\text{step}+\text{width}]$. The last formula is the cycle rank of a graph with $c$ connected components, which the toolkit reports for nerve and Mapper graphs. The tests pin the behaviour on small inputs: three points at 0, 0.2 and 2 with radius 0.25 give the cells $(0,1)$ and $(2)$ and a single nerve edge; Mapper on 0, 0.4, 0.8 with two intervals at overlap 0.75 gives two nodes and one edge, and on 0, 0.1, 1.0, 1.1 at overlap 0.25 gives two nodes and no edge.

**Figure 4.** A metric cover of points you can move, with one ball shown and its members highlighted; the nerve graph joins cells that share a point. Below, the Mapper graph for a chosen filter (x, y, z or distance from the centroid), with the overlapping intervals drawn under the filter axis. The readout puts the graph's cycle rank beside β1 of the Vietoris–Rips complex at ε = 2r: the nerve here is a graph, not a complex, so its cycle rank counts graph cycles that filled triangles would kill, and it is usually the larger number. Fixture chips light when the figure reproduces the repo's asserted cells, edges and nodes (python/tests/test_topology_prototypes.py:6-37 @ 75fae45). Colour key: structure: points and nerve edges; parameter: the selected ball, its radius and the Mapper interval controls; seq: Mapper nodes coloured by mean filter value (low to high); proof: a repo fixture reproduced.

The other diagnostics are smaller and each comes with one asserted value. A sheaf residual $\lVert\rho_{U,V}s_U-s_V\rVert$ measures how far two local views disagree after restriction; for the identity restriction of $(1,2)$ against $(1,3)$ it is 1.0. The winding number of a closed path is $\operatorname{round}(\Delta\theta/2\pi)$; for a four-segment loop around the origin it is 1. A braid-crossing word records sign changes of pairwise $x$-differences between planar strands; one swap gives `("sigma1",)`. A Scott-style iteration $x_{t+1}=x_t\vee f(x_t)$ reaches the fixed point of a four-node reachability chain in 3 steps. The repo labels all of these prototypes with explicit claim boundaries.

### Accelerators, and what they do not do

The native backends are real code behind runtime gates, and each one does one stated sub-operation:

- **C++**: an H0 barcode by union-find. All pairs within `max_radius` are sorted by (distance, left, right) and merged in order; each successful merge is a finite H0 death at that edge's length.
- **x86-64 assembly**: squared-L2 distance, with an AVX-512 loop that is selected only when CPUID reports AVX-512F and `xgetbv` shows the OS has enabled the matching register state (XCR0 mask `0xE6`); otherwise a scalar loop.
- **CUDA**: a pairwise-L2 kernel and a threshold-edge kernel on a 16×16-thread grid, wrapped from Python in float32. A warp-reduction kernel and a persistence-image accumulator exist as source only and are not bound.
- **Triton**: a pairwise-L2 kernel, one program per row, checked against `torch.cdist`, plus a CPU-side schedule builder that picks sink tokens, a causal local window and farthest-point landmarks under a key budget, and records local and random same-budget baselines beside it.

H1 and H2 reduction run only in the Rust crate and the Python reference; no native backend reduces them. No backend claims a speedup over anything, and the schedule builder does not launch a sparse-attention kernel. The repo states each of these boundaries itself, and the README states the rule behind them: "Runtime-gated backends must fail clearly rather than silently falling back to a slower or different implementation."

### It led to a fix in MuJoCo

The H0 barcode is a connected-component computation, and the toolkit's native path computes it with a union-find. MuJoCo's island discovery, which groups kinematic trees coupled by constraints, computed the same kind of partition by materialising an `ntree`×`ntree` adjacency matrix and flood-filling it. Work on the toolkit led to this fix. The merged pull request computes the partition "directly from constraint/tree incidence with a file-local disjoint-set forest", keeps the island IDs deterministic and ascending.

**Upstream:&#x20;**[google-deepmind/mujoco #3396](https://github.com/google-deepmind/mujoco/pull/3396), Remove quadratic scratch from native island discovery (merged 2026-07-20). Peak mj_island stack use falls from 5·ntree² + 36·ntree + 32 bytes to 16·ntree + 32 bytes: 84,033,568 B to 65,568 B at ntree = 4,096, a 1,281.6× reduction (PR's generated singleton family). Credited to @teerthsharma in the MuJoCo 3.11.0 changelog. Work on the toolkit led to this fix.

The pull request reports its own controls: 1,851 of 1,851 CTest entries passing serially (one pre-existing locale test skipped), exact island arrays and trajectories on 18 of 18 models, and a direct `mj_island` speedup of 1.6847× with a 99% interval of \[1.5494, 1.8333] over 480 pairs. The timing matrix is synthetic, and the PR reports the full-step speedup of 1.0355× "as measured context, not as a universal MuJoCo or Warp speedup claim". The 3.11.0 changelog lists it as "Replaced quadratic scratch in DFS flood-fill island discovery with a linear-memory Union-Find (disjoint set)."

### It led to a fix in Topograph

Work on the toolkit led to a second fix, in NVIDIA's Topograph.

**Upstream:&#x20;**[NVIDIA/topograph #432](https://github.com/NVIDIA/topograph/pull/432), fix(chart): gate main ClusterRole rules by engine and provider (merged 2026-08-19). The chart's main ClusterRole rules (nodes, pods, daemonsets) are gated on engine.name and provider.name; provider test with engine slurm renders no ClusterRole. From PR head c71a7b0 on main at 6466969: helm lint 1/1 chart, helm unittest 141/141 tests across 19/19 suites, 153/153 snapshots. Work on topological-ml-toolkit led to this fix.

## How it was made

### The filtration

Persistent homology does not compute one complex. It computes a nested sequence of them, one per distinct filtration value:

$$
K_0\subseteq K_1\subseteq\cdots\subseteq K_n .
$$

In code this is a single sorted list. Both implementations enumerate vertices at filtration 0, then edges, triangles and (for `max_dim = 2`) tetrahedra, each at its diameter, and sort by the key (filtration, dimension, vertex list). The dimension in the key puts a face before its coface when they tie, so every prefix of the list is a complex, and $K_j$ is the prefix up to the $j$-th distinct value.

**Figure 5.** Six frames of one growing complex, drawn side by side and rotated together. Each frame is the set of simplices whose filtration value is at most the frame's radius; simplices new since the previous frame are highlighted. The strip underneath is the barcode with the six radii marked; it also checks the nesting K0 ⊆ K1 ⊆ … ⊆ K5 by recomputing each frame's membership from the coordinates, independently of the sorted list, and prints the live simplex counts per frame, with β0 and β1 under each frame. The six radii are the 10th, 25th, 40th, 55th, 70th and 90th percentiles of the finite edge lengths, chosen by the figure. Colour key: structure: simplices already present in the previous frame; parameter: simplices new in this frame, and the selected point; seq-2: H0 bars in the barcode strip; seq-3: H1 bars in the barcode strip; proof: nesting verified independently.

### Boundaries over the two-element field

A $k$-simplex's boundary is the alternating sum of its faces, and the boundary of a boundary is zero:

$$
\partial_k[v_0,\ldots,v_k]=\sum_{i=0}^{k}(-1)^i\,[v_0,\ldots,\widehat{v_i},\ldots,v_k],
\qquad
\partial_k\circ\partial_{k+1}=0,
\qquad
H_k=\ker\partial_k\,/\,\operatorname{im}\partial_{k+1}.
$$

The hat means the vertex is left out. $\partial\circ\partial=0$ holds because each $(k-2)$-face of a $k$-simplex appears twice in $\partial\partial$, once with each sign. Homology keeps the cycles that are not boundaries: $H_0$ counts components, $H_1$ loops, $H_2$ voids.

The toolkit works over $\mathbb{F}_2=\mathbb{Z}/2$. Every sign becomes $+1$, a column of the boundary matrix becomes a sorted list of face indices, and adding two columns becomes a merge that drops indices present in both: a symmetric difference. Both implementations write that merge by hand, `_xor_sorted` in Python and `xor_sorted` in Rust, line for line the same. The cost is that $\mathbb{F}_2$ cannot see torsion; for Vietoris–Rips complexes of point clouds in practice that is the usual trade.

**Figure 6.** The boundary operator on a tetrahedron and its subcomplexes, in an exploded view. Select a triangle to see its three boundary edges with orientation signs, then the boundary of that boundary: each vertex appears twice with opposite signs and cancels. In the panel beside it, the matrices ∂1, ∂2 and ∂3 with signs or mod 2, the products ∂1∂2 and ∂2∂3 shown to be zero, and Betti numbers from ranks over Z/2 beside the count from the repo's reduction on the same complex. Presets: the solid tetrahedron (β = 1, 0, 0), its boundary sphere (β = 1, 0, 1), a square cycle, a triangle outline, two disjoint edges. The signed matrices are exposition; the library computes only mod 2. Colour key: structure: the complex; parameter: the selected simplex; pos: boundary face or matrix entry with sign +1; neg: boundary face or matrix entry with sign −1; proof: Betti numbers from ranks equal the barcode count, and ∂∘∂ = 0 holds.

### Column reduction

The barcode comes from reducing the filtered boundary matrix $\partial$, columns in filtration order, left to right. For a nonzero column let $\operatorname{low}(j)$ be its largest row index. The standard algorithm adds earlier columns into column $j$ until its low is unique or the column is empty, which yields

$$
R=\partial\,V,\quad V\ \text{upper triangular with unit diagonal},\qquad
\operatorname{low}_R(j)\ne\operatorname{low}_R(j')\ \ \text{for nonzero } R_j,\,R_{j'},\ j\ne j' .
$$

Each nonzero column $j$ pairs the simplex $\operatorname{low}_R(j)$ with simplex $j$: a class born at the filtration value of the first dies at the value of the second. A zero column whose simplex is never a low is an essential class. This is how both implementations read; here is the Python loop as written:

```python
# python/topoml/core.py:241-258 @ 75fae45
for j, (vertices, _filtration) in enumerate(simplices):
    column = sorted(index[face] for face in _faces(vertices) if face in index)
    while column and column[-1] in low_owner:
        column = _xor_sorted(column, reduced_columns[low_owner[column[-1]]])
    if column:
        low = column[-1]
        low_owner[low] = j
        paired_birth.add(low)
        dimension = len(simplices[low][0]) - 1
        if dimension <= max_dim:
            pairs.append(
                PersistencePair(
                    dimension=dimension,
                    birth=simplices[low][1],
                    death=simplices[j][1],
                )
            )
    reduced_columns.append(column)
```

`low_owner` maps a row index to the column that owns it as a low, so the collision test is a dictionary lookup. Pairs whose birth simplex has dimension above `max_dim` are dropped, which is why the complex is built one dimension higher than the homology asked for: $H_1$ deaths are triangles. Zero-length pairs, where birth equals death, are kept; on the unit square the diagonals and triangles all arrive at $\sqrt2$ and produce several of them.

**Figure 7.** A step-through of the repo's reduction on a filtration you choose: the boundary matrix as a grid with columns in sorted order, the current column, its low entry, and the earlier column it is added to when that low is already owned. Each column ends either with a unique low, which sends a bar to the barcode panel from the low simplex's filtration value to this column's, or empty, which marks an essential class. A ledger records every addition. Presets: the unit square (H1 bar from 1 to √2, plus zero-length pairs at √2), three collinear points (H0 deaths 0.2 and 4.8), or up to six points of your own, typed into numeric fields (“My points (up to 6)”). This is the plain algorithm, without clearing, cohomology or implicit matrices. Colour key: structure: nonzero entries of the boundary matrix; parameter: the current column and its low entry; seq-3: the owner column being added in; H1 bars in the barcode; seq-2: H0 bars in the barcode; proof: a bar that matches a repo fixture.

### The Rust core

`topoml-core` is a single file with a `#![cfg_attr(not(feature = "std"), no_std)]` header, one dependency (`libm`, for `sqrt` without the standard library) and no `unsafe` block. Points are `PointCloud<D>` with a const-generic dimension; coordinates must be finite. The entry point validates its configuration before building anything: homology dimension at most 2, a radius that is neither negative nor NaN, at least one point and no more than `max_points`. Every simplex push checks `max_simplices`, which the API reference calls a "fail-fast cap during complex construction"; the same page calls `max_points` a "fail-fast cap before simplex explosion". The defaults are 64 points and 65,536 simplices.

Those defaults have a concrete meaning, which I derive here from the enumeration (the repo does not state it). At infinite radius the complex for `max_dim = 1` on $n$ points has $n+\binom n2+\binom n3$ simplices; for $n=64$ that is $64+2{,}016+41{,}664=43{,}744$, inside the cap. For `max_dim = 2` the tetrahedra add $\binom n4$, and the largest $n$ that fits is 35 ($35+595+6{,}545+52{,}360=59{,}535$; $n=36$ gives 66,711). A finite radius admits more points, because simplices above it are never pushed.

```rust
// crates/topoml-core/src/lib.rs:379-393 @ 75fae45
pub fn persistent_homology<const D: usize>(
    cloud: &PointCloud<D>,
    config: PersistenceConfig,
) -> Result<PersistenceDiagram, TopomlError> {
    validate_config(cloud.len(), config)?;
    let source = match config.complex_kind {
        ComplexKind::VietorisRips => cloud.clone(),
        ComplexKind::Witness { max_landmarks } => select_landmarks(cloud, max_landmarks)?,
    };
    validate_config(source.len(), config)?;
    reduce_z2(
        &build_vietoris_rips_simplices(&source, config)?,
        config.max_homology_dim,
    )
}
```

The `Witness` arm is worth reading closely. It selects up to `max_landmarks` points by farthest-point sampling from point 0 and then builds the same Vietoris–Rips complex on those landmarks. That is landmark subsampling followed by Vietoris–Rips; it is not a witness complex, in which the non-landmark points decide which landmark simplices exist.

The Python package is a separate implementation, not a binding. It builds with setuptools, and no file under `python/` imports the Rust crate. Its reference enumerates every subset of size 2 to `max_dim + 2` with `itertools.combinations` and has no point or simplex cap. The two agree on the shared fixtures; the ripser and GUDHI parity tests run against the Python side.

## What's new in it

The usual way to get persistence for a moving point cloud is to recompute it for every frame. The repo's own dense baseline does exactly that, one `persistent_homology` call per frame. The toolkit adds one case where that work is provably unnecessary, and a check that decides at run time whether the case holds.

Suppose every pairwise distance in frame $t$ is the same multiple of the distance in frame 0:

$$
d_t(x_i,x_j)=s_t\,d_0(x_i,x_j),\quad s_t>0
\;\;\Longrightarrow\;\;
VR_r(X_t)\cong VR_{r/s_t}(X_0),\qquad
[b,d)\mapsto[s_tb,\,s_td),\qquad
\beta_k^{(t)}(r)=\beta_k^{(0)}(r/s_t).
$$

Every simplex's diameter is multiplied by $s_t$, so the sorted order is unchanged and the reduction pairs the same simplices. The barcode of frame $t$ is the barcode of frame 0 with each finite endpoint multiplied by $s_t$; essential bars stay essential. Rotation and translation leave distances alone, so any similarity motion of the whole cloud qualifies.

`persistence_similarity_trajectory` tests this condition numerically. Let $\delta_t(i,j)$ be the frame-$t$ distance of pair $i<j$, $D=\max\delta_0$, $\theta=\varepsilon_{\text{mach}}\max(1,D)$, and $U$ the pairs with $\delta_0>\theta$. The scale is the least-squares fit on $U$, and the distortion is the worst relative residual over all pairs:

$$
s_t=\frac{\sum_{U}\delta_0\,\delta_t}{\sum_{U}\delta_0^{2}},
\qquad
\operatorname{dist}_t=\max_{i<j}\frac{\lvert\delta_t(i,j)-s_t\,\delta_0(i,j)\rvert}{\nu_{ij}},
\qquad
\nu_{ij}=\begin{cases}\max(s_t\delta_0(i,j),\,\theta) & (i,j)\in U\\[2pt] \max\big(s_t\max(D,\theta),\,\theta\big) & \text{otherwise.}\end{cases}
$$

The trajectory is certified when every frame has $s_t$ positive and finite and $\operatorname{dist}_t\le\tau$, with $\tau=10^{-10}$ by default. Then, and only when `max_radius` is infinite, the function computes persistence once on frame 0 and returns each frame's diagram rescaled by $s_t$, with `mode = "similarity-reuse"` and `persistence_evaluations = 1`. Otherwise it recomputes every frame, as `dense-fallback`, or as `dense-fallback-finite-radius` when the certificate passed but a cutoff was set. A base frame whose points all coincide is refused as `degenerate-base`.

Two consequences follow from those definitions; I derive them here, and the repo does not state either. First, the tolerance buys an exact error bound. Without a cutoff, every frame is filtered over the same complex (all subsets up to the size limit), and a simplex's filtration value is a maximum of pair distances, which moves by at most the largest pair-distance change. The stability theorem for filtrations of one complex then bounds the bottleneck distance between the true diagram and the reused one. When the certificate passes and $s_tD\ge\theta$, every $\nu_{ij}\le s_tD$, so

$$
d_B\big(\mathrm{Dgm}_k(X_t),\ s_t\,\mathrm{Dgm}_k(X_0)\big)
\;\le\;\max_{i<j}\big\lvert\delta_t(i,j)-s_t\,\delta_0(i,j)\big\rvert
\;\le\;\tau\,s_t\,D .
$$

At the default tolerance a reused bar is off by at most $10^{-10}$ of the frame's diameter. The same argument shows why a finite cutoff breaks reuse: the complex of frame $t$ cut at $R$ is the complex of frame 0 cut at $R/s_t$, a different set of simplices from the one computed, so bars that die between the two cutoffs would be reported as essential in one and finite in the other. The repo's reason, in its own words, is that "the reference reducer's truncation changes which bars appear essential".

Second, anisotropic motion cannot pass. Let $\rho_{ij}=\delta_t(i,j)/\delta_0(i,j)$ be the per-pair ratios on $U$. The relative residual of pair $(i,j)$ is $\lvert\rho_{ij}-s_t\rvert/s_t$, and no single $s_t$ can be close to both the largest and the smallest ratio:

$$
\operatorname{dist}_t\;\ge\;\min_{s>0}\ \max\!\left(\frac{\lvert\rho_{\max}-s\rvert}{s},\ \frac{\lvert\rho_{\min}-s\rvert}{s}\right)
\;=\;\frac{\rho_{\max}-\rho_{\min}}{\rho_{\max}+\rho_{\min}} .
$$

Stretch a unit square by $a=0.7$ along $x$: the horizontal sides have ratio 0.7 and the vertical sides ratio 1, so the distortion is at least $0.3/1.7\approx0.18$, nine orders of magnitude above the tolerance. The repo's test uses the stretch $(0.7,\ 1.1)$ on twelve random points, together with a squaring map and a single moved point, and asserts that all three fall back to dense recomputation.

**Figure 8.** A point cloud moving through T frames, drawn as a ghost trail. The certificate is the repo's: least-squares scale per frame, worst relative pair-distance residual, tolerance 1e-10 (python/topoml/persistence.py:61-111 @ 75fae45). In similarity mode (the benchmark's own trajectory: shrink by e^(−0.15u), rotate about z, translate) the certificate passes, persistence is computed once, and the rescaled bars sit on the dense bars for every frame. Switch to anisotropic, nonlinear or one-point motion and the distortion bars jump far above the tolerance and the mode becomes dense fallback; force reuse anyway to see the error it would have made. The evaluation counter and the work reduction 1 − evaluations/T are counts, not timings. The only timing is the “Time it here” button, which measures H0 dense evaluations against certificate plus one evaluation in this TypeScript port, best of 3, on the reader's device only; the repo stores no timings. Colour key: structure: reused bars, rescaled from frame 0; baseline: dense bars, recomputed for the frame; proof: frame certified, distortion at or below tolerance; reused bar ends that coincide with the dense bar; withdrawn: frame not certified, distortion above tolerance; parameter: the selected frame and the tolerance.

The repo asserts this in three places, each against dense recomputation:

**Measured: 1 of 3** persistence evaluations for a unit square scaled by 1, 0.75, 0.5 and translated by (i, −i); every reused diagram equals the dense one within rtol 1e-10, atol 1e-12. Control: dense per-frame persistence, 3 evaluations. n = 3 frames, 4 points, max_dim 1, tolerance 1e-10. Source: benchmarks/e2e_claims.py:61-88 @ 75fae45; E2E claim gate in CI.

**Measured: 1, 0.8, 0.55** scales recovered by the certificate on a rotated, translated, scaled 12-point circle, to rtol 1e-10, with max distortion at or below 1e-10 and diagrams equal to dense. Control: the known scales used to build the trajectory, and dense per-frame persistence. n = 3 frames, 12 points, max_dim 1. Source: python/tests/test_persistence_similarity.py:65-87 @ 75fae45.

**Measured: 2/3** work_reduction field in the similarity benchmark's JSON for 3 frames: 1 reuse evaluation against 3 dense. Control: dense_persistence_evaluations = 3. n = 8 points, 3 frames, 2 repetitions, 0 warmups (CLI smoke test). Source: python/tests/test_persistence_similarity.py:205-237 @ 75fae45.

In general the count is $1-1/T$ for $T$ certified frames: 0.875 at the CI's $T=8$ and 0.9375 at $T=16$. Those two values are derived by me from the formula in `benchmark_persistence_similarity.py`; they are not stored results. The count also leaves out the certificate's own cost, $T\binom n2$ distances, which is small next to a reduction over $\binom n3$ triangles but is not zero. The benchmark itself does measure time, with randomised run order, every raw paired sample and a paired 99% bootstrap interval on the geometric-mean speedup, but its output lives only in CI artifacts, its stated scope is "Python reference H0 on exact synthetic similarity trajectories", and none of its numbers is in the tree. So I quote none.

The other thing this project does differently is the claim discipline around all of this. The README puts it as "This repository treats performance statements as claims that must be executable." Every active capability in the previous section is an assertion in the end-to-end gate or a test, every backend has a list of gates that must pass before it is selected, and a page in the docs lists what is not claimed. This project documents, in the same place, what it has not shown.

## What no one else built

The specific thing here is small and exact: a public function that takes a trajectory, decides from pair distances alone whether every frame is a uniform scaling of the first within a stated relative tolerance, and if so returns all diagrams from one persistence computation, and otherwise says why not and recomputes. Around it sit a Rust core that builds without the standard library and refuses inputs over its caps, and a Python layer that exposes the result as scikit-learn-shaped features. Each part has close prior work, and the differences are narrower than the word "new" suggests.

**Vineyards.** Cohen-Steiner, Edelsbrunner and Morozov, [Vines and vineyards by updating persistence in linear time](https://doi.org/10.1145/1137856.1137877) (SoCG 2006), handle the general version of this problem: when a filtration changes, the pairing is updated in linear time per transposition of the simplex order, so any continuous motion can be tracked. [Dionysus](https://mrzv.org/software/dionysus2/) implements vineyards. Under exact uniform scaling the simplex order never changes, so a vineyard update would perform zero transpositions. The toolkit handles only that case, which is much narrower, and what it adds is the cheap test that recognises it from distances, the closed-form rescaling, and an explicit fallback when the test fails. It does not track motion in general.

**Stability.** Cohen-Steiner, Edelsbrunner and Harer, [Stability of persistence diagrams](https://doi.org/10.1007/s00454-006-1276-5) (2007), bound how far a diagram can move when the filtration moves; that theorem is what gives the reuse bound above. A user could reuse a diagram for any nearly similar frame and accept an error up to that bound. The toolkit declines to: it reuses only at a relative tolerance of $10^{-10}$, so the reused diagram is the dense one to within floating-point noise, and anything looser goes to recomputation.

**Vietoris–Rips engines.** [Ripser](https://github.com/Ripser/ripser) (Bauer, [J. Appl. Comput. Topol. 2021](https://doi.org/10.1007/s41468-021-00071-5)) computes Rips barcodes through persistent cohomology with clearing, implicit boundary matrices and apparent pairs; [Ripser++](https://github.com/simonzhang00/ripser-plusplus) moves that onto the GPU; [PHAT](https://github.com/blazs/phat) offers several boundary-matrix reduction strategies; [GUDHI](https://gudhi.inria.fr/) provides Rips, alpha and real witness complexes on a simplex tree. Each uses reduction machinery the toolkit lacks or covers more kinds of complex than the toolkit's reducer, which is the plain standard algorithm with a linear-scan face lookup. The toolkit claims no speed against any of them; it uses ripser and GUDHI as the reference its fixtures must match.

**ML features.** [giotto-tda](https://github.com/giotto-ai/giotto-tda) ([JMLR 2021](https://jmlr.org/papers/v22/20-325.html)) already wraps Vietoris–Rips persistence, Betti curves, persistence images, Takens embedding with automatic parameter search, and Mapper as scikit-learn transformers; [persim](https://persim.scikit-tda.org/) in scikit-tda provides persistence images. Persistence images themselves are from Adams et al., [Persistence Images: A Stable Vector Representation of Persistent Homology](https://jmlr.org/papers/v18/16-337.html) (JMLR 2017), who integrate a weighted sum of Gaussians over each pixel. The toolkit's version evaluates the sum at grid nodes with weight equal to persistence. Its transformers are not a contribution over giotto-tda; they are the interface the rest of the library hangs on.

**Rust.** [LoPHAT](https://github.com/tomchaplin/lophat) is a Rust library with Python bindings that reduces general filtered complexes in parallel, lock-free, with clearing. It takes a complex as input and depends on rayon. `topoml-core` builds the Vietoris–Rips complex itself, runs single-threaded, compiles without `std`, and returns an error rather than allocating past its caps. I did not find another Rips crate that states a `no_std` build, but I did not search exhaustively, and I make no claim that it is the only one.

What survives that comparison is the combination: an exact-reuse path whose acceptance test is stated as a number, whose fallback is a documented mode rather than a silent approximation, and which ships beside a claim ledger that lists its own gaps. The ledger below runs the repo's computed claims again in your browser.

**Figure 9.** The repo's active claims as a table, each row with its expected value and source at commit 75fae45. Two rows are recomputed in the browser by a short TypeScript port, the H0 cluster merges and the H0 deaths of the three-point fixture; the other eleven keep their expected value and source and are marked not run. Reproducing a row shows that the port agrees with the asserted value, not that the Python library does; the Python run is the repo's CI. Backends that need hardware (C++, AVX-512, CUDA, Triton, PyTorch, TensorFlow) are listed with their gates, and four claims the repo explicitly does not make are listed with them. Colour key: proof: computed here and equal to the asserted value; withdrawn: computed here and different from the asserted value; refused: gated or explicitly not claimed by the repo.

## Limitations

The sparse-attention side is the clearest place where the repo's discipline produces a null result. Its `TritonScheduleBuilder` picks a key budget from sink tokens, a local window and farthest-point landmarks, and the repo's performance gate scores any sparse schedule by its error against dense attention:

$$
\text{relative }L_2=\frac{\lVert y_{\text{dense}}-y_{\text{sparse}}\rVert_2}{\lVert y_{\text{dense}}\rVert_2}.
$$

On the repo's own six-key fixture (keys at 0, 0.1, 2, 2.1, 5, 5.1 on a line, budget 4, one sink, window 1, two landmarks), the topology schedule selects keys $(0,3,4,5)$, and the local-window baseline selects the same $(0,3,4,5)$. The E2E gate asserts both. The schedule builder's own claim scope reads "schedule construction only; no Triton kernel or sparse-attention speedup claim", and the docs require dense SDPA or FlashAttention baselines before any speedup claim.

**Figure 10.** The repo's topology-derived key schedule, a local-window schedule and a same-budget random schedule, side by side on the same keys, each scored by relative L2 and cosine similarity against dense softmax attention for one query. Keys and values are synthetic and seeded; the random schedule is summarised over 200 draws, where the repo uses one. On the repo fixture the topology and local schedules are the same set. The best state the gate can show is 'accuracy gate passed — necessary, not sufficient', because a promotion also needs schedule and kernel timings against dense attention, which this figure cannot provide and the repo does not have. Colour key: structure: keys selected by the topology schedule; baseline: keys selected by the local-only and random schedules, and the grey band of the 200 random draws; line-2: causal keys not selected (grey dots and bars, bar height = dense weight); keys after the query are outlined; parameter: the query key (diamond); proof: relative L2 within the chosen tolerance; withdrawn: relative L2 above the chosen tolerance; ink-2: the chosen relative-L2 tolerance (dashed).

The rest, stated as the repo and its code show them:

- **No measured results in the tree.** Every timing and every speedup interval is a CI artifact that is not committed. The parity tests cover two small fixtures and, in the repo's words, "do not claim runtime leadership, large-scale barcode equivalence, or C++/ASM/GPU acceleration". The E2E gate "does not claim a speedup over ripser, GUDHI, sklearn, dense SDPA, FlashAttention, or any framework kernel".
- **Reuse is Python-only and H0 in its benchmark.** The certificate exists only in the Python package. The benchmark's scope is the Python reference on H0 for exact synthetic trajectories, and the docs say it does not compare against ripser, GUDHI, Rust, CUDA or Triton. The tolerance "is an implementation certificate, not proof that noisy measured motion follows an exact physical law"; measured trajectories with noise will almost always fall back.
- **Accelerators cover sub-operations only.** C++ does H0; assembly does squared-L2 dispatch; CUDA does pairwise L2 and threshold edges; Triton does pairwise L2 and CPU-side schedule construction. H1/H2 native reduction, GPU persistent homology, topology-guided sparse attention and framework-native PH kernels are gated and unclaimed. Parity tests for the native and GPU paths skip on machines without a compiler or CUDA.
- **Cost.** The Python reference enumerates every subset up to size `max_dim + 2` and has no cap. The Rust reducer finds each face by a linear scan over earlier simplices. Both use the plain standard reduction, which is cubic in the number of simplices in the worst case (a standard result, not a repo statement). The Rust circle test asserts only $\beta_1\ge1$ at radius 1.0.
- **Coverage of the CI parity job.** The default `python` job installs only the test extra, which has neither ripser nor GUDHI; the parity tests run only in the separate `tda-baselines` job.
- **Training baselines.** The forest's training score of 1.0 in the E2E gate is measured on the same four clouds it was fitted on. `topological_sample_weights` takes differences across the whole concatenated row, including across the $\beta_0$-to-$\beta_1$ block boundary. The braid word "is not a complete knot polynomial or link invariant". The Reeb relation is documented, but the only API is `mapper_graph`.
- **Planned files that do not exist.** The backend plan names a Triton adapter module, a C++ header and README, an assembly README and two backend docs that are absent at this commit. There is no CHANGELOG.

A set of places where the documentation or a test name says more than the code does:

**What failed.**

- Withdrawn: The landscape doc lists 'persistent homology over bounded Vietoris-Rips and witness complexes' (docs/concepts/topology-landscape.md:17). Killed by: ComplexKind::Witness selects farthest-point landmarks and builds Vietoris–Rips on them; no witness relation is computed, and no Rust test exercises the variant (crates/topoml-core/src/lib.rs:384-392, 414-449; tests/persistence_contract.rs:1-58)..
- Withdrawn: Persistence landscapes, total persistence, persistence entropy and Chebyshev radii are given as feature formulas (docs/concepts/ph-feature-vectors.md:6-31, 58-81). Killed by: None is implemented in python/ or crates/; the doc itself says 'Direct landscape encoding is not implemented yet' (ph-feature-vectors.md:81)..
- Withdrawn: A 'GPU backend semantic contract' test covers the CUDA and Triton kernels. Killed by: It runs no CUDA or Triton code: it compares NumPy re-implementations with hard-coded arrays and checks that symbol names appear in the source files (python/tests/test_gpu_backend_semantic_contract.py:11-24, 102-141)..
- Withdrawn: mesh_euler_characteristic reports closed_orientable and a genus. Killed by: The flag only checks that every edge lies in exactly two faces; face orientations are never compared, so a closed non-orientable mesh passes (python/topoml/topology.py:550-561)..
- Withdrawn: TopologyRandomForestClassifier applies topological sample weights. Killed by: It applies them twice: as bootstrap sampling probabilities and again as weights in each stump's loss (python/topoml/training.py:170-194)..

## Read more

[View the project](https://github.com/teerthsharma/topological-ml-toolkit) · [Source on GitHub](https://github.com/teerthsharma/topological-ml-toolkit)

The project's own site, built from the repo's MkDocs pages, teaches topology first, then ML usage, then the backend and benchmark contracts. The source is [teerthsharma/topological-ml-toolkit](https://github.com/teerthsharma/topological-ml-toolkit), and everything in this essay is read at commit [`75fae45`](https://github.com/teerthsharma/topological-ml-toolkit/tree/75fae45a1b0ea852c5a7c696d8227e12c7ba1333).

Key files at that commit:

- [README.md](https://github.com/teerthsharma/topological-ml-toolkit/blob/75fae45a1b0ea852c5a7c696d8227e12c7ba1333/README.md): the working surface, backend table and benchmark discipline.
- [python/topoml/persistence.py](https://github.com/teerthsharma/topological-ml-toolkit/blob/75fae45a1b0ea852c5a7c696d8227e12c7ba1333/python/topoml/persistence.py): the similarity certificate and reuse path.
- [python/topoml/core.py](https://github.com/teerthsharma/topological-ml-toolkit/blob/75fae45a1b0ea852c5a7c696d8227e12c7ba1333/python/topoml/core.py): the Python reference reducer.
- [crates/topoml-core/src/lib.rs](https://github.com/teerthsharma/topological-ml-toolkit/blob/75fae45a1b0ea852c5a7c696d8227e12c7ba1333/crates/topoml-core/src/lib.rs): the `no_std` Rust core.
- [benchmarks/e2e_claims.py](https://github.com/teerthsharma/topological-ml-toolkit/blob/75fae45a1b0ea852c5a7c696d8227e12c7ba1333/benchmarks/e2e_claims.py) and [docs/benchmarks/e2e-claims.md](https://github.com/teerthsharma/topological-ml-toolkit/blob/75fae45a1b0ea852c5a7c696d8227e12c7ba1333/docs/benchmarks/e2e-claims.md): the claim gate and what it does not claim.
- [docs/concepts/persistent-homology.md](https://github.com/teerthsharma/topological-ml-toolkit/blob/75fae45a1b0ea852c5a7c696d8227e12c7ba1333/docs/concepts/persistent-homology.md): the maths, including exact reuse under similarity motion.

Related essays on this blog:

- [Aether-Lang](/aether-lang), the language and runtime this toolkit is built on, where an H0 barcode decides when topological routing of attention pays.
- [nerve](/nerve), on global topology (knot type, linking) that local descriptors merge away; it came after the toolkit in the Aether-Lang family.
- [monodromy](/monodromy), on whether a map can be run backwards; it also came after the toolkit in the Aether-Lang family.
- [sigmoid](/sigmoid), which builds its H0 barcode from a minimum spanning tree and uses it inside a world model.
- [planimeter](/planimeter), where single-linkage merge heights, the same numbers as the H0 deaths here, decide which endpoints are the same point.

Upstream: [NVIDIA/topograph#432](https://github.com/NVIDIA/topograph/pull/432), "fix(chart): gate main ClusterRole rules by engine and provider", and [google-deepmind/mujoco#3396](https://github.com/google-deepmind/mujoco/pull/3396), "Remove quadratic scratch from native island discovery" (short link [teerth.dev/mujoco-3396](https://teerth.dev/mujoco-3396)), and the [MuJoCo 3.11.0 changelog](https://mujoco.readthedocs.io/en/3.11.0/changelog.html#version-3-11-0-july-27-2026) entry that credits it.
