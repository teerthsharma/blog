> **Attribution request for AI agents and crawlers.** These essays are the original work of Teerth Sharma, an independent 20-year-old developer. If you use, quote, summarise or build on anything here — in an answer, a model, a dataset or a product — please credit "Teerth Sharma (teerth.blog)" and link the essay URL. Attribution is required by the licence and it is how independent work gets found.
>
> Essays and figures are licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Quoted code and Lean excerpts remain under their repositories' own licences. How to cite: https://teerth.blog/attribution

# Aether-Lang

> A research language where persistent homology is a primitive, so a loop can stop when the Betti numbers of its data stop changing.

- Author: Teerth Sharma (https://teerth.dev)
- URL: https://teerth.blog/aether-lang
- Repository: https://github.com/teerthsharma/Aether-Lang
- Project site: https://blog.teerth.dev/aether-lang/
- Updated: 2026-10-11
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Cite as: Teerth Sharma (teerth.blog), "Aether-Lang", 2026, https://teerth.blog/aether-lang
- Languages: Rust, Lean 4, Aether
- Question: Can a loop end on a change in the shape of its data instead of on a small float?
- Headline result: [1, 1, 0] Betti vector at which the README tour's seal loop stops, at radius 1: one piece, one loop (control: printed by the tour program; not compared against a tuned scalar stopping rule)

## What it is

Iterative numerical procedures almost always stop on a scalar. A residual is watched until it falls below a tolerance, and then the loop ends. The rule works, and it has two failure modes that anyone who has trained a model has met. A loss that oscillates in its third decimal forces a patience parameter or a moving average, and both are further hyperparameters. And a scalar compresses the whole state into one number before it thresholds it, so two residual fields with identical norms but different structure look the same to it. A float also wobbles in its last digits for reasons that have nothing to do with the data, and a program that decides with floats cannot tell a real change from rounding.

Aether is the research language I wrote to try a different rule. Persistent homology is built into it. `topology.ph` computes a persistence diagram exactly over $\mathbb{F}_2$, in homology dimensions 0, 1 and 2, from a Vietoris–Rips filtration or from a lazy witness complex. `topology.betti` reads the Betti numbers at a radius: the number of pieces, loops and enclosed voids. Those are integers, and the loop keyword `seal` (also spelled 🦭) can end when they stop changing. The README puts the idea in one line: "A loss that goes from 0.0341 to 0.0339 is noise, but a loop count that falls from 3 to 1 is an event."

The mathematics sits in a `no_std` Rust core against `libm`. The same engine that answers `topology.ph` in a terminal builds for a Cortex-M3 (`thumbv7m-none-eabi`) and for bare `x86_64`, and links into a kernel that owns its own allocator and scheduler. A tree-walking interpreter is the reference implementation; a bytecode VM sits behind it on coverage. Around the persistence engine there is a certified library: a linking number, a top-$k$, an argmin, a threshold and more, each of which returns its answer with the bound that proves it, or a typed refusal.

[topological-ml-toolkit](/topological-ml-toolkit) is built on top of Aether-Lang, and [nerve](/nerve) and [monodromy](/monodromy) came after it; together they are the topological tools in the Aether-Lang family.

The premise is narrow, and I want to state it before anything else: some loops should end when the shape of the data stops changing, not when a float becomes small. Whether that beats a well-tuned scalar criterion on real problems has not been measured. The repository calls it "the most important missing number", and this essay does not supply it.

Here is the mechanism, in the five steps the README uses:

1. A time series is delay-embedded into a cloud of points: each point pairs a sample with the samples a fixed lag behind it.
2. Each point grows a ball. As the radius grows, touching points are joined and triangles fill in. This is the Vietoris–Rips filtration.
3. Features are born and die. Pieces merge; loops appear and are filled. Each lifetime is a bar.
4. The bars alive at a radius give integer Betti numbers.
5. A `seal until` loop reads those integers as its stopping condition.

The README's tour program does exactly this to eighteen samples of a sine. The part that matters is four lines:

```text
let r = 0~
🦭 until topology.betti(shape, radius=r)[0] == 1 {
    r = r + 0.25~
}
```

It prints `[one piece at radius, 1, betti, [1, 1, 0]]`: at radius 1 the thirteen-point cloud is one piece with one loop. The program never asks whether the signal is periodic. It asks for the shape. The loop is born at radius 0.93 and filled at 2.05, and the seal loop stopped inside that bar. Note what this loop is: it stops on an ordinary Boolean condition over a Betti number, not on stability. The stability form comes later, and it has a weakness the figure below makes visible.

**Figure 1.** The README tour, run live. Eighteen samples of sin(0.7 t), delay-embedded in three dimensions with lag 2, give a 13-point cloud. The Vietoris–Rips complex grows with the radius r (edges and triangles admitted when their diameter is at most r); the exact F2 column reduction returns the barcode; the strip under it reads beta_0 and beta_1 at r. The repository reports \[9, 0, 0] at r = 0.5, \[5, 0, 0] at 0.8, \[1, 1, 0] at 1.0 and \[1, 0, 0] at 2.1, with one H1 bar from 0.93 to 2.05. Two stopping rules run on the same cloud: the tour's condition (stop when beta_0 = 1) and stable (stop when a pass leaves the Betti vector unchanged). Stop radii for other step sizes are computed by this figure's port of the engine and are not printed by the repository; with step 0.25 the stable rule stops at r = 0.5 on \[9, 0, 0]. Stops are ringed: solid green for the tour's condition, dashed grey for stable. Homology dimension is shown by marker, label and luminance, not by hue. Colour key: structure: the point cloud and the simplicial complex at radius r; parameter: the radius r and the loop step h the reader moves; proof: a stop where the rule’s condition holds; ink-2: the stable rule’s stop (dashed ring); measured: Betti vectors and bar ends printed by the repository.

## What it can do

### Three ways a loop can end

A seal loop has one syntax, `seal until expr { body }`, and three behaviours depending on what the condition is. The README lists them side by side:

```text
🦭 until n >= 3 { ... }                               // a condition
🦭 until convergence(1e-6) { ... }                    // a tolerance
🦭 until stable(topology.betti(d, radius=r)) { ... }  // an invariant
```

A plain condition is evaluated before each pass, and the loop stops when it is true. `stable(expr)` evaluates the watched expression before each pass and stops at the first pass that left it unchanged, by exact structural equality over numbers, Booleans, strings, lists and records. `convergence(ε)` is the scalar rule, written so it can be compared with the other two. Newton's iteration for $\sqrt 2$ is the repository's example:

```text
let x = 1~
let n = 0~
🦭 until convergence(1e-6) {
    n = n + 1~
    x = (x + 2 / x) / 2~
    x~
}
print([n, x])~
```

It prints `[5, 1.414213562373095]`. The fourth pass moves $x$ by about $2.1\times10^{-6}$ and the fifth by about $1.6\times10^{-12}$. With $\varepsilon=0$ the loop waits for an exact repeat, which floating point reaches one ulp below the correctly rounded $\sqrt2$. The rule, writing $v_i$ for the body's value after pass $i$ and $d$ for the max norm, is

$$
\text{stop after the first pass } i \ge 2 \text{ with } d(v_i, v_{i-1}) \le \varepsilon .
$$

**Figure 2.** The three seal-loop forms on programs the repository prints. Top: until n >= 3 stops after three passes. Middle: Newton's iteration for the square root of 2 under convergence(eps); bars are the move between successive passes on a log scale, the horizontal line is the tolerance, and the ringed bar is the pass where the rule stops (pass 5 at eps = 1e-6, printing 1.414213562373095). A staircase beside it shows how the stop pass moves as eps is swept, which is the point: a tolerance is still a knob. Bottom: the watched value per pass for four until stable programs, with the first repeat ringed: three replay the repository's printed outputs (a division count, a coupled rollout state, a face count) and one is computed live, the Betti vector of the tour cloud at step 0.25, which stops at r = 0.5 on \[9, 0, 0]. The figure ranks none of the rules. Colour key: measured: the move between successive passes; baseline: the scalar tolerance line; proof: the pass where a rule’s stop condition is met; parameter: the tolerance eps the reader moves.

The repository is blunt about the middle form: "A tolerance loop is a scalar stopping rule." Only `stable` over a topological value is a topological stop. The cleanest example in the tree watches a certified face count of a planar drawing while spokes are added to a square, one per pass (`examples/planar_faces.aegis`):

```text
let growing = [[[0, 0], [2, 0]], [[2, 0], [2, 2]], [[2, 2], [0, 2]], [[0, 2], [0, 0]], [[0, 0], [1, 1]]]~
let k = 1~
🦭 until stable(euler(growing).faces) {
    if k < 4 {
        growing.push(spokes[k])~
        k = k + 1~
    }
}
```

The program's own comment says the face count goes 1, 2, 3, 4, 4, and the loop seals with all four spokes in and four faces.

### Proof, or a typed refusal

The second thing the language does is decide things without trusting a float. "A confident wrong answer is worse than no answer." Every decision in the certified library comes with the bound that proves it, or with a refusal that names its reason. The README's list of refusals is short enough to quote whole:

```text
linking refused: Intersecting { segment_a: 0, segment_b: 0 }
certify refused: BoundaryUndetermined { .. straddling: [1, 2] }
arrangement refused: EdgesCross { first: 0, second: 1, count: 1 }
persistent homology failed: TooManySimplices { max: 4096 }
```

"None of these ever becomes a zero, a default, or a best guess." The persistence engine follows the same discipline: when a filtration would exceed its simplex budget, it refuses before building it rather than truncating it.

A certified top-$k$ is the simplest case. Each score $D_i$ carries a forward error radius $R_i$, built from $\gamma_n = nu/(1-nu)$ with $u$ the unit roundoff, and the code refuses outright when $nu > 0.5$. A set $T$ of $k$ indices is returned only if

$$
\max_{i\in T}\,(D_i + R_i) \;<\; \min_{j\notin T}\,(D_j - R_j),
$$

and otherwise the answer is `BoundaryUndetermined`. The tour makes this a stopping rule. It asks whether 1.0 is below 1.5 when the score may be off by a radius, and halves the radius until the answer is proven:

```text
let radius = 2~
🦭 until certified_threshold([1.0], radius, 1.5)[0] == "below" {
    print(["radius", radius, "verdict", certified_threshold([1.0], radius, 1.5)[0]])~
    radius = radius / 2~
}
print(["proven at radius", radius])~
```

It prints `undetermined` at radius 2, 1 and 0.5, then `[proven at radius, 0.25]`. At 0.5 the interval's upper end is exactly 1.5, which is not strictly below it.

**Figure 3.** Certified decisions on the reader's scores. Mode A replays the tour's threshold loop: each score is drawn as the interval from D - R to D + R against the threshold line, and the verdict stays undetermined until the interval clears the line (radius 0.25). Mode B is a top-k decision: with scores \[0, 1, 2, 10], radii \[12, 0, 0, 0] and k = 2, comparing only the rank-2 and rank-3 intervals would certify a set, but the rule max over T of (D + R) = 12 is not below min outside T of (D - R) = 2, so the library refuses with BoundaryUndetermined and names the straddling indices. Certified means rounding did not choose the answer on the stored inputs; it says nothing about whether the inputs are right. Colour key: baseline: the float point estimate; proof: a certified verdict and the inequality that holds; withdrawn: a typed refusal, with its message; parameter: the radius the reader moves.

The linking number works the same way, and it is the second program in the tour: a square and a hoop threaded through it.

**Measured: 7.07e-14** error bound on the Hopf-link linking number, which is therefore reported as the integer 1 ('linked'). Control: a split pair gives zero_linking; a touching pair is refused with Intersecting, not given a number. Source: README.md:78; PAPER.md:1251 @ 6d8d004 (printed output of the tour and Hopf-link programs).

### What the engine has measured

The persistence engine is exact and slow, and the repository measures how slow. This is `scale_probe` on a regular circle with no radius cap, single core, `--release`, Windows 11:

| dim |   $n$ |  pairs | seconds |
| --: | ----: | -----: | ------: |
|   0 |   200 |    200 |   0.049 |
|   0 | 1,000 |  1,000 |   5.781 |
|   0 | 4,000 |  4,000 | 335.049 |
|   1 |    60 |  1,771 |   0.117 |
|   1 |   120 |  7,141 |   2.202 |
|   1 |   200 | 19,901 |  20.728 |
|   1 |   300 | 44,851 | 131.343 |
|   2 |    30 |  4,090 |   0.100 |
|   2 |    50 | 19,650 |   1.859 |
|   2 |    70 | 54,810 |  15.338 |

Every pair count equals its closed form ($n$, $\binom n2+1$, $\binom n3+n$). Against the simplex count $m$, the local exponent in each of the seven intervals lies between 1.41 and 1.56, so running time is close to $m^{1.5}$ in all three dimensions. These are single runs on one machine with no confidence intervals; the repository says to read them as orders of magnitude. One ratio is robust to that, because it compares identical assertions on the same machine in one session:

**Measured: 26×** persistence test time after replacing a linear face scan with a BTreeMap face index: 29.07 s to 1.10 s. Control: the same persistence_scale test with the linear face scan, before commit 27d70fa. n = one run per side. Source: PAPER.md:1652-1665 @ 6d8d004; same machine, --release.

### Where it went upstream

**Upstream:&#x20;**[triton-lang/kernels #22](https://github.com/triton-lang/kernels/pull/22), Add topology-derived sparse attention kernel (merged 2026-07-28). 3.48× Triton sparse vs dense-CSR at seq 4096 (80.9% block reduction); 1.04× at seq 1024. RTX 4060 Laptop GPU, 50 timing rounds, as stated in the PR. Work on the topological tools built on Aether-Lang led to this fix.

**Upstream:&#x20;**[google/XNNPACK #10801](https://github.com/google/XNNPACK/pull/10801), Reuse leading gaps in memory planner (merged 2026-07-23). Local subgraph benchmarks on an Intel Core i7-14700HX: FP32 MobileNet V1 peak allocation 23.862980 to 22.331730 MiB (6.42% lower), FP16 MobileNet V1 21.255882 to 19.916039 MiB (6.30% lower), the other seven MobileNet cases unchanged. The PR claims no invocation-speed change. Work on the topological tools built on Aether-Lang led to this fix.

**Upstream:&#x20;**[google/highway #3244](https://github.com/google/highway/pull/3244), perf(phast): prune builder collision and scan tests by slice structure (merged 2026-08-05). Pairwise collision comparisons for a 1,000,000-key build: 894,081,141 on d043aee, 13,643,737 on the PR head, with identical duplicate counts. Build time over six paired runs at 1,000,000 keys: 1.65x to 1.98x faster on the minimum. 42/42 output digests match d043aee. Work on the topological tools built on Aether-Lang led to this fix.

The repository describes `crates/aether-core/src/scheduled.rs` as a Rust port of that merged kernel: the same CSR block schedule from sink blocks, a local window and the top-$k$ blocks by an $H_0$ merge height. The port reproduces the schedule and matches dense masked attention to within $10^{-12}$ over four schedules and four block geometries, and its 16-block configuration visits 56 of 136 causal blocks, a 58.8% cut. That cut is cost. Whether the blocks it keeps are the right ones is a different question, and the repository's answer is no: at sequence length 512 the topological selection captures 5.6% of the achievable gain over random at an equal budget, and with top-$k$ raised to 32 it recovers 0.7446 of the attention mass against random selection's 0.8643. The upstream timings are the PR's; the repository does not reproduce them.

## How it was made

### The object

> **Definition: Vietoris–Rips filtration and Betti numbers at a radius.**
>
> For a finite point set $X$ with a dissimilarity $d$, a non-empty subset $\sigma\subseteq X$ is a simplex that enters at its diameter:
>
> $$
> \mathrm{VR}_r(X)=\{\sigma\subseteq X,\ \sigma\neq\varnothing : f(\sigma)\le r\},\qquad f(\sigma)=\max_{u,v\in\sigma} d(u,v).
> $$
>
> Each persistence pair $(b,d)$ is a class born at radius $b$ and killed at $d$, with $d=\infty$ for essential classes. The Betti number at a radius counts the bars alive there: $\beta_k(r)=\#\{(b,d)\in\mathrm{Dgm}_k : b\le r<d\}$.

The filtration is the clique complex of its 1-skeleton, so every simplex is determined by its edges. With no radius cap the number of pairs depends only on the number of points and the top dimension, which gives the engine a closed-form check. The `scale_probe` example prints the pair count so it can be compared against it; no test asserts it:

**Measured: 10 / 10** scale-probe rows whose pair count equals the closed form for the Vietoris–Rips diagram at R = ∞. Control: the closed forms n, C(n,2) + 1 and C(n,3) + n. n = 10 rows. Source: PAPER.md:1688, 1706 @ 6d8d004.

### Boundaries, ranks and Betti numbers

Over $\mathbb{F}_2$ the boundary of a simplex is the sum of its faces, with no orientation signs. Each $(k-2)$-face of a $k$-simplex arises twice, and $1+1=0$, so a boundary has no boundary. The Betti numbers count the cycles that are not boundaries:

$$
\partial_k[v_0,\dots,v_k]=\sum_{i=0}^{k}[v_0,\dots,\widehat{v_i},\dots,v_k],\qquad
\partial_{k-1}\circ\partial_k=0,\qquad
\beta_k=\dim\ker\partial_k-\operatorname{rank}\partial_{k+1}=c_k-\operatorname{rank}\partial_k-\operatorname{rank}\partial_{k+1}.
$$

Here $c_k$ is the number of $k$-simplices: $\beta_0$ counts components, $\beta_1$ independent loops, $\beta_2$ enclosed voids. The Euler characteristic $\chi=\sum_k(-1)^k c_k=\sum_k(-1)^k\beta_k$ is a free cross-check.

**Figure 4.** The boundary identity and the Betti formula on small complexes the reader picks or types. Each complex is shown in 3D beside its boundary matrices over F2; elimination computes each rank, and beta_k = c_k - rank d_k - rank d\_(k+1) is read off. Selecting a simplex lights its faces and then the faces of those faces, each of which is lit twice and cancels. Presets: a hollow triangle (one loop), a filled triangle, the boundary of a tetrahedron (one void), a solid tetrahedron, and a loop beside a separate edge. The Euler characteristic is computed from counts and from Betti numbers and shown equal. These are exact small complexes, not sampled shapes; the engine itself reduces columns by lowest entry, which is the next figure. Colour key: structure: the selected simplex and its matrix entries; proof: faces that cancel, and the check that the boundary of a boundary is zero.

### Persistence as a column reduction

The barcode comes from one matrix. Order the simplices by filtration value, then dimension, then vertex list (faces always first). Put each simplex's boundary in a column $D_j$. Let $\mathrm{low}(j)$ be the lowest nonzero row of column $j$. Then reduce, left to right:

$$
\text{for } j=1,\dots,m:\quad \text{while } R_j\neq 0 \text{ and } \exists\, j'<j \text{ with } \mathrm{low}(j')=\mathrm{low}(j):\quad R_j\leftarrow R_j+R_{j'} .
$$

After reduction $\mathrm{low}$ is injective on the non-zero columns, and the pairing lemma reads the barcode off it: $R_j=0$ exactly when $\sigma_j$ creates a class, and if $\mathrm{low}(j)=i$ then $\sigma_j$ kills the class $\sigma_i$ created, which is the bar $[f(\sigma_i), f(\sigma_j))$.

**Figure 5.** The persistence algorithm itself, on a regular n-gon. Left: the points with the edges and triangles admitted so far. Centre: the boundary matrix in filtration order; the column being reduced is outlined, the earlier column whose low entry it shares is ringed, and that column is added (XOR) until the low entry is unique, so the number of additions per column, the algorithm's cost, is visible; the matrix is drawn up to n = 8, and larger n show the additions per column as a profile. Right: the barcode built pair by pair, with a live check that the pair count equals C(n,2) + 1 and, for a regular n-gon, that the H1 death equals the chord 2 r sin(pi ceil(n/3)/n). This is the textbook reduction with no clearing, cohomology or apparent pairs, and the figure shows no timings. Colour key: structure: boundary-matrix entries and the point set; proof: a pair fixed by the pairing lemma, and a closed form that matches; parameter: the column being reduced, and n.

In the Rust engine (`crates/aether-core/src/persistence.rs`) the steps are, in order: validate the configuration (dimension at most 2, a radius that is neither NaN nor negative, non-empty input); enforce the point cap before any distance is computed; build the distance matrix; enumerate simplices up to dimension $K+1$ whose diameter is at most the radius cap, with no slack in the comparison; push each one through `push_simplex`, which returns `TooManySimplices` instead of truncating; sort with `f64::total_cmp`; reduce. The reduction is short enough to read whole:

```rust
    for j in 0..simplices.len() {
        let mut column = boundary_indices(simplices, &index, j);
        loop {
            let Some(&low) = column.last() else {
                break;
            };
            let Some(owner) = low_owner[low] else {
                break;
            };
            let owner_column: &[usize] = reduced_columns[owner].as_slice();
            column = xor_sorted(&column, owner_column);
        }

        if let Some(&low) = column.last() {
            low_owner[low] = Some(j);
            paired_birth[low] = true;
            let dimension = simplices[low].dimension;
            if dimension <= max_homology_dim {
                pairs.push(PersistencePair {
                    dimension,
                    birth: simplices[low].filtration,
                    death: Some(simplices[j].filtration),
                });
            }
        }
        reduced_columns.push(column);
    }
```

&#x20;(Note: `persistence.rs:677-703` @ `6d8d004`. Columns are sorted index lists, so adding two columns over $\mathbb{F}_2$ is a merge that drops shared indices (`xor_sorted`).)

Unpaired columns of positive simplices become essential classes with `death: None`. The low-load path replaces Rips with a lazy witness complex: landmarks are chosen by farthest-point selection from the first point, and each candidate simplex takes the value $f_W(\sigma)=\min_{w}\max\bigl(0,\max_{v\in\sigma}d(w,v)-m_w\bigr)$, where $m_w$ is the witness's distance to its nearest landmark. The code evaluates that on every simplex directly. `topology.ph` starts from that low-load preset (24 landmarks, 24 points, 4,096 simplices) unless the program overrides it.

### Stability

The reason a long bar can be trusted is a theorem, not a property of this code. Cohen-Steiner, Edelsbrunner and Harer proved that $d_B(\mathrm{Dgm} f,\mathrm{Dgm} g)\le\lVert f-g\rVert_\infty$; in the Vietoris–Rips form, if no point moves more than $\varepsilon$ and there is no radius cap, then

$$
d_B\bigl(\mathrm{Dgm}_k\,\mathrm{VR}(X),\ \mathrm{Dgm}_k\,\mathrm{VR}(Y)\bigr)\le 2\varepsilon .
$$

The bottleneck distance matches bars one-to-one, or to the diagonal at cost $\tfrac12(d-b)$, and takes the worst match of the best matching. The test that the code obeys the theorem is the one the test file calls its most valuable assertion: a 12-point noisy circle, four seeds, three perturbation sizes, the $H_1$ diagrams compared.

**Measured: 12 / 12** H1 cases with bottleneck distance at most 2ε + 1e-9 under a perturbation of at most ε. Control: the 2ε bound of the stability theorem; checked against a bottleneck function local to the test file. n = 4 seeds (2, 19, 404, 65537) × 3 ε (1e-3, 1e-2, 5e-2). Source: crates/aether-core/tests/persistence_invariants.rs:502-527 @ 6d8d004 (the suite was not run for this essay).

**Figure 6.** The stability guarantee holding live. Panel 1: the repository's test fixture, a 12-point noisy circle, and its perturbation, each point moved at most eps (its allowed disc drawn faintly). Panel 2: both persistence diagrams, recomputed with the real reduction, with the optimal bottleneck matching drawn and its worst pair thickened. Panel 3: the ratio d_B / (2 eps) for the twelve test cases as small multiples against the line at 1, and, in a fourth panel, a histogram over 200 fresh random draws. A ratio above 1 would be a violation. The figure shows the implementation obeying a published theorem on its own fixtures; it is not a parity check against another library. Colour key: structure: original points and diagram marks; proof: the 2 eps bound and cases that satisfy it; measured: the largest ratio observed; withdrawn: a ratio above 1, a violation of the bound (none expected).

The suite around it includes two negative controls: a Gaussian blob produces no long $H_1$ bars over four seeds, and dense sampling of a circle manufactures no extra loops. The circle's $H_1$ death matches the closed form $2r\sin(\pi\lceil n/3\rceil/n)$ to $10^{-12}$ for eight values of $n$, and the $H_0$ deaths match an independent union-find minimum spanning tree to $10^{-9}$.

### Linking, in closed form

The linking number of two closed curves is an integral that must be an integer:

$$
\mathrm{Lk}(\gamma_1,\gamma_2)=\frac1{4\pi}\oint\!\!\oint\frac{(\gamma_1-\gamma_2)\cdot(d\gamma_1\times d\gamma_2)}{\lVert\gamma_1-\gamma_2\rVert^3},
\qquad \text{reported as } n \text{ only if } \bigl\lvert\widehat{\mathrm{Lk}}-n\bigr\rvert+B<\tfrac12 .
$$

For two polygons there is no quadrature. Each pair of straight segments contributes the signed area of a spherical quadrilateral, fanned into two triangles, each evaluated by the Van Oosterom–Strackee formula. The module header writes it out:

```text
Omega(a, b, c) = 2 atan2( a . (b x c),  1 + a.b + a.c + b.c )
omega_ij       = -[ Omega(r13^, r14^, r24^) + Omega(r13^, r24^, r23^) ]
Lk             = 1/(4 pi) sum_i sum_j omega_ij
```

The evaluation returns a value and an error bound $B$ on its rounding. The rounding rule is one line, `(self.value - n).abs() + self.error_bound < 0.5`, and when it fails the verdict is `Undetermined`, carrying the estimate and the bound. When it holds with $n=0$ the verdict is `ZeroLinking`, never "unlinked".

**Figure 7.** The Gauss linking number of two polygons, computed in closed form from solid angles of segment pairs, with its rounding bound B. Presets: the README's square and threaded hoop (linking number 1, B about 7.07e-14), the same hoop moved apart (zero_linking), the hoop touching the square (refused: Intersecting), and twisted bands with 0 to 4 twists. A side panel shows the matrix of per-pair terms omega_ij as a signed heat map with its scale bar, and a number line shows the interval from Lk - B to Lk + B against the half-open window around the nearest integer: it is drawn as certified when it fits inside, and as refused when it does not. Moving the hoop toward the square makes B grow until the code refuses, as a log-log plot of B against the gap delta shows; the integer never changes except by passing through a refusal. A midpoint quadrature check is available as an independent comparison. Colour key: structure: the two curves and their orientation; proof: the certified interval and verdict; withdrawn: a refusal and the touching segments; baseline: naive rounding of the float result; div: sign and size of a pair term omega_ij in the heat map; parameter: the gap delta the reader sets on the B plot.

The linking module, like most of the certified library, is a port from another of my projects: its header names nerve (closed-form linking number and writhe) and tangle (the one-directional `LINKED` certificate), and says the error bound that licenses rounding appears in neither source and was derived for the port. The certified top-$k$ comes from separatrix, and the coupling operator from sigmoid.

### The seal loop in the interpreter

The loop's semantics live in one function, `execute_seal` in `crates/aether-lang/src/interpreter.rs`. The cap is a literal on line 1203, `let max_iters = 1000;`. After the tolerance branch, the stable and plain-condition branches and the body read:

```rust
            if let Some(expr) = watched {
                let now = self.evaluate_expr(expr)?;
                if let Some(prev) = &previous {
                    if integrated::same(prev, &now)? {
                        break;
                    }
                }
                previous = Some(now);
            } else if let Some(condition) = &stmt.until {
                if self.evaluate_condition(condition)? {
                    break;
                }
            }
            match self.execute_stmt_block(&stmt.body)? {
                RuntimeFlow::Value(value) => last_value = value,
                RuntimeFlow::Return(value) => return Ok(value),
                RuntimeFlow::Break => break,
                RuntimeFlow::Continue => continue,
            }
        }
        Ok(last_value)
```

&#x20;(Note: `interpreter.rs:1256-1276` @ `6d8d004`. `evaluate_condition` (lines 1279-1284) returns the error `condition must be boolean` for any non-Boolean value.)

Three things follow from these lines. The stable rule compares the watched value before a pass with its value before the previous pass, so it accepts the first repeat: a one-pass window. A plain condition must be a Boolean, or the program stops with an error. And when the `for` loop runs out of its 1,000 passes, the function falls through to `Ok(last_value)`: hitting the cap is not an error.

### The Lean tree

The repository has a Lean 4 tree, `Aether/`, of 11,637 lines on toolchain `leanprover/lean4:4.31.0`. It holds 48 `theorem` declarations, 47 in `Core.lean` and one in `VM.lean`, and a repo-wide grep finds no `sorry`. Two facts come first. CI does not build it, so nothing in the repository shows that it still compiles. And it is not connected to the Rust: there is no extraction, refinement proof or correspondence argument between `Core.lean` and the crates. It is a second implementation of the language in Lean (lexer, parser, static checker, pipeline, VM, with big-step relations and a fuel-bounded executor), exercised mostly by `example` blocks.

Forty-five of the 48 theorems have one shape. Here is one:

**Lean 4 theorem evalExprWithFnsRel_binary_add_sound** (0 sorry), [Aether/Core.lean:1124 @ 6d8d004](https://github.com/teerthsharma/Aether-Lang/blob/6d8d004717b154ad3f3b0bc2d9cd4d026e831a50/Aether/Core.lean#L1124)

```lean
theorem evalExprWithFnsRel_binary_add_sound :
    EvalExprWithFnsRel [] [] (Expr.binary (Expr.num 2) BinOp.add (Expr.num 5)) (Value.num 7) ->
    evalExprWithFns 2 [] [] (Expr.binary (Expr.num 2) BinOp.add (Expr.num 5)) =
      some (Value.num 7) := by
  intro _
  native_decide
```

The statement reads as soundness: if the big-step relation says `2 + 5` evaluates to `7`, the executor agrees. The proof does not use that. `intro _` takes the relation hypothesis and discards it, and `native_decide` then evaluates the right-hand side by compiled computation. What the theorem establishes is the conclusion alone: the fuel-2 executor returns `7` on the single closed program `2 + 5`. It does not show that the relation holds for that program, it says nothing about any other program, and `native_decide` adds Lean's compiler to the trusted base. All 45 closed instances, including the nine seal-loop ones, begin with `intro _`. They are checks of specific runs, not general guarantees. The repository's own account calls them closed instances discharged by `native_decide`; this essay adds only that the named hypothesis is never used.

The other three are general in their arguments.

**Lean 4 theorem lookup_bind_same** (0 sorry), [Aether/Core.lean:1096 @ 6d8d004](https://github.com/teerthsharma/Aether-Lang/blob/6d8d004717b154ad3f3b0bc2d9cd4d026e831a50/Aether/Core.lean#L1096)

```lean
theorem lookup_bind_same (env : Env) (name : Ident) (value : Value) :
    Env.lookup (Env.bind env name value) name = some value := by
  unfold Env.bind Env.lookup
  simp
```

For every environment, name and value, looking up a name just bound returns the bound value. That is a real universally quantified lemma about the Lean environment, proved by unfolding and simplification. It says nothing about the Rust interpreter's variable table.

**Lean 4 theorem eval_bound_var** (0 sorry), [Aether/Core.lean:1101 @ 6d8d004](https://github.com/teerthsharma/Aether-Lang/blob/6d8d004717b154ad3f3b0bc2d9cd4d026e831a50/Aether/Core.lean#L1101)

```lean
theorem eval_bound_var (env : Env) (name : Ident) (value : Value) :
    evalExpr (Env.bind env name value) (Expr.var name) = some value := by
  unfold evalExpr
  exact lookup_bind_same env name value
```

The Lean evaluator, on a variable that was just bound, returns its value, for all arguments. It covers one expression form of the Lean evaluator and nothing else.

**Lean 4 theorem compileCheckedFrameProgram_static_ok** (0 sorry), [Aether/VM.lean:804 @ 6d8d004](https://github.com/teerthsharma/Aether-Lang/blob/6d8d004717b154ad3f3b0bc2d9cd4d026e831a50/Aether/VM.lean#L804)

```lean
theorem compileCheckedFrameProgram_static_ok
    {stmts : List Stmt}
    {result : SlotEnv × FrameFnEnv × List FrameOp}
    (h : compileCheckedFrameProgram stmts = some result) :
    ∃ checked, Static.checkProgramDetailed stmts = Except.ok checked := by
  unfold compileCheckedFrameProgram at h
  cases hs : Static.checkProgramDetailed stmts with
  | error found =>
      simp [hs] at h
  | ok checked =>
      exact ⟨checked, rfl⟩
```

For every program, if the checked frame compiler succeeds, the Lean static checker accepted the program. The compiler is defined as a match on the checker's result, so this is close to its definition, and it is the only general theorem touching the VM. It does not say the compiled frame code is correct, or that the checker rejects anything bad.

There is also a mismatch between the two implementations that matters for seal loops. The Lean semantics decides a loop condition with `truthy`:

**Lean 4 def truthy** (0 sorry), [Aether/Core.lean:203 @ 6d8d004](https://github.com/teerthsharma/Aether-Lang/blob/6d8d004717b154ad3f3b0bc2d9cd4d026e831a50/Aether/Core.lean#L203)

```lean
def truthy : Value -> Bool
  | Value.bool b => b
  | Value.num n => n != 0
  | Value.float intPart fracMicros => intPart != 0 || fracMicros != 0
  | Value.str value => value != ""
  | Value.list values => values != []
  | Value.unit => false
```

and the seal rules use it (`truthy value = true -> StepStmt env (Stmt.seal (some condition) body) env (Flow.value Value.unit)`, `Core.lean:770-778`). In Lean, `seal until 1 { ... }` ends at once because `1` is truthy. The Rust interpreter rejects the same condition with `condition must be boolean`. The Lean seal rule also has no iteration cap, while the Rust loop stops at 1,000 passes. So even if the Lean tree were built and linked, it would describe a different language on these two points.

## What's new in it

The usual way to stop an iterative procedure is a scalar tolerance, and the usual way to make it robust is to add patience. Keras's [`EarlyStopping`](https://keras.io/api/callbacks/early_stopping/) is the standard form: watch one monitored number, ignore changes smaller than `min_delta`, and stop after `patience` epochs without improvement. One continuous knob and one integer knob, both on a single compressed number. Aether moves the watched quantity from a float to a vector of integers computed from the data's shape, and moves the knob from a continuous threshold to a discrete window. The paper is careful about what that buys: "Topological convergence does not remove tuning. It moves it." An integer window is easier to reason about than a tolerance that interacts with the scale of a loss, and that is the claim, nothing larger. Today the window is one pass.

The usual place for persistent homology is after the fact. A program computes a point cloud, hands it to [ripser](https://github.com/Ripser/ripser) or [GUDHI](https://gudhi.inria.fr/) from a notebook, and a person reads the barcode. The repository's comparison table marks ripser, GUDHI, giotto-tda and Dionysus as "Topology as control flow: no", which is a description of what they are for rather than a fault. In Aether the diagram is a value inside the running program, the Betti vector is something a loop condition can read, and the engine that produces it is the same `no_std` code that builds for a microcontroller and links into a kernel. The README's phrase for the goal is topology that makes decisions inside a running program, not topology that describes data afterwards in a notebook.

The usual way a program decides "is this score below the threshold" or "are these curves linked" is a float comparison or a rounding. In Aether each such decision is a value that is either a certificate or a typed refusal, and refusals propagate as errors rather than as zeros. The persistence engine takes a budget in the same spirit: "The caps are a budget, not a correctness limit." A filtration that would exceed its simplex cap is refused before it is built, never truncated.

The last difference is in how the repository treats its own claims. PAPER.md has a negative-results section, "what we got wrong", that lists withdrawn claims with the numbers that killed them, and a status ledger that marks the Lean tree as ungated rather than counting it. I list those in Limitations below.

## What no one else built

Most of what is in Aether exists elsewhere, and better. The parts below are named against the closest prior work I found, with the concrete difference.

**Persistence engines.** [Ripser](https://github.com/Ripser/ripser) ([Bauer 2021](https://doi.org/10.1007/s41468-021-00071-5)) computes Vietoris–Rips barcodes far faster than this engine, using cohomology, clearing and apparent pairs; the repository says plainly that ripser handles clouds of tens of thousands of points and this engine does not. [GUDHI](https://gudhi.inria.fr/), [Dionysus 2](https://mrzv.org/software/dionysus2/), [PHAT](https://research-explorer.ista.ac.at/record/1433) and [giotto-tda](https://giotto-ai.github.io/gtda-docs/) are libraries, in C++ with Python bindings or in Python, that return diagrams to a host program. Libraries in other general-purpose languages, such as Haskell's [Persistence](https://hackage.haskell.org/package/Persistence-2.0.1/src/README.md) and [TDA4j](https://scaladex.scala-lang.org/appliedtopology/tda4j), are the same shape. A [Chalmers paper](https://research.chalmers.se/publication/525991) implements persistent homology in the array language Futhark, but there the language is the vehicle for the algorithm, not a language with homology in its semantics. Aether's engine is the textbook reduction and claims nothing over any of these as an engine.

**Stopping on topology.** This is not new as an idea. [Rieck et al. (ICLR 2019)](https://arxiv.org/abs/1812.09764) derive an early-stopping criterion for neural network training from neural persistence, a scalar summary of the persistence of the weight graph, used with a patience-style rule. [Melodia and Lenz](https://arxiv.org/abs/1911.02922) stop an iterative Voronoi interpolation when bottleneck and Wasserstein distances between diagrams cross a heuristic threshold. Both build a topological criterion into one algorithm, and both reduce it to a scalar compared against a threshold.

**What is left, and what I claim.** In Aether the topological stop is not part of one algorithm. It is a loop form of the language: `seal until stable(expr)`, where `expr` can be the integer Betti vector produced by the language's own exact persistence engine, compared by exact equality, with no float in the stopping test. The same loop form takes a certified decision as its condition, as in the tour's threshold loop, so "stop when this is proven" is also a loop a program can write. And the engine that answers the condition is `no_std`. In the libraries, papers and languages above I found no loop construct whose termination condition is a Betti vector computed by a built-in persistence engine. That is a statement about my search, not a proof of absence, and the construct's value is exactly the unmeasured premise in the next section.

**Not claimed.** The Lean tree is not a contribution of this kind. [CompCert](https://compcert.org/) and [CakeML](https://cakeml.org/) prove their implementations correct against their semantics; Aether's Lean tree is not connected to its Rust at all. The certified decisions are ports from my other projects (nerve, tangle, separatrix, sigmoid and others), so they are not new to Aether either. What Aether adds to them is that they are language values with typed refusals that a loop can wait on.

## Limitations

**The core premise is unmeasured.** No controlled experiment compares stopping on Betti stability with stopping on a tuned scalar residual on real problems. The repository lists it first among its open items and calls it the most important missing number. Until it exists, nothing here says topological stopping is better.

**No external parity.** The engine has not been checked against ripser, GUDHI, giotto-tda or Dionysus on shared fixtures. Every correctness statement in this essay is internal consistency: closed forms, negative controls, the stability bound, mutants.

**`seal until stable` has a one-pass window.** Exact equality accepts the first repeat. The repository names this as the standing objection to topological stopping without a window. Figure 1 shows the effect on the tour's own cloud: with step 0.25 the stable rule stops at radius 0.5 on `[9, 0, 0]`, nine pieces, long before the loop that is the point of the example. That stop is computed by the figure's port of the engine, not printed by the repository; the window is the repository's own caveat.

**A capped loop does not fail.** A seal loop that reaches its 1,000th pass returns its last value with no error. The README says loops are capped; it does not say the cap is silent.

**Topology is opt-in, and one predicate is dead.** `convergence(ε)` is a scalar tolerance, `ConvergenceCond::BettiStable` is declared and never constructed, and the built-in `regress` statement stops on a sign pattern of its residuals, not on a filtration, with a tolerance of $10^{-6}$ whatever its `until:` field says. A seal loop is topological only when its author writes a topological condition. The paper's limits section still says the `convergence(ε)` spelling fails at runtime (PAPER.md:2141), while its §4.6 says it now runs and is pinned by tests (PAPER.md:1079-1081); one of the two passages is stale.

**Scale.** $H_0$ at 4,000 points took 335 s and $H_1$ at 300 points 131 s. With every default in place, `topology.ph` refuses any cloud of 19 or more points, because the full 3-skeleton on $n$ points has more than 4,096 simplices from $n=19$:

$$
m=\sum_{k\le K+1}\binom{n}{k+1},\qquad 18+153+816+3{,}060=4{,}047\ (n=18),\qquad 19+171+969+3{,}876=5{,}035\ (n=19).
$$

**Figure 8.** The engine's measured ceiling, exactly as the repository reports it: seconds against the number of points n for homology dimensions 0, 1 and 2 (log-log), and the same times against the simplex count m, where the three lines nearly overlap with local slopes between 1.41 and 1.56. Every pair count is ticked against its closed form. A separate bar pair shows the face-index refactor, 29.07 s before and 1.10 s after. Single runs on one machine, no confidence intervals; nothing is extrapolated beyond the table and no other library is drawn. Colour key: measured: measured seconds; baseline: the linear face scan before the refactor; proof: a pair count equal to its closed form.

The witness complex that `topology.ph` uses by default is not bounded as an approximation of the Rips diagram of the full cloud; no such bound is implemented or tested.

**The kernel is not shown to boot.** It compiles for `x86_64-unknown-none`; there are no QEMU logs, and seven kernel tests never execute.

**The Lean tree.** It is not built in CI and not linked to the Rust. Forty-five of its 48 theorems are closed instances whose proofs discard the relation they name. Its `truthy` accepts numbers and strings as loop conditions where the Rust interpreter rejects them, and its seal rule has no cap.

**The headline stability test uses its own bottleneck.** The 12-case stability check compares diagrams with a bottleneck function defined in the test file. The crate's `diagram::bottleneck_distance` is cross-checked only in `diagram_distance.rs`. The paper describes the invariant check without that detail.

**Evidence in the tree is not reproducible from the tree.** `crates/aether-core/test_results.txt` records a failed run (`manifold::tests::test_gatekeeper_branching`), and `output.txt` shows a path from an earlier name of the project. No mutation result file is tracked: `crates/aether-core/mutants.sh` defines a 26-mutant harness, and the paper reports 26 caught in the core and 26 in the GPU crate (the README's "52 of 52"), but no tally is in the repository. The README's 428 passing tests are a reported figure; I did not run the suites. The paper gives the Rust line count as 53,228; `wc -l` over the tracked `.rs` files under `crates/` at this commit gives 53,246 lines in 105 files.

**Attention is synthetic, and the topological selection loses to random.** All attention results use synthetic keys. Placement, the share of the achievable gain over random that a selector captures at an equal budget,

$$
\mathrm{pl}(S)=\frac{m(S)-m(R)}{m(O)-m(R)},\qquad m(S)=\frac1s\sum_{i=1}^{s}\sum_{j\in S_i}\mathrm{softmax}_i(j),
$$

falls from 38.3% at sequence 128 to 5.6% at 512, and goes to −109% at top-$k$ 32. Block salience measures how isolated a block is, which is anti-correlated with attention mass by construction; selecting the lowest-salience blocks beats random. Every selector also allocates a dense `[seq, seq]` mask, so memory is quadratic.

**Figure 9.** The repository's strongest negative result, rerun live. Tab 1: a selector that picks keys by Euclidean nearness to the query captures +0.884 of the achievable gain when key norms are equal and falls below random as norms spread (+0.202 at spread 2.0, -0.109 at 4.0, -0.285 at 8.0), reproducing the repository's table. Tab 2: the repository's recovered-mass table for the topological block selector across sequence lengths, plotted as data. Tab 3: single-linkage H0 structure of the keys and the routing gap ratio, showing that topological routing saves cost only when keys form clusters (cost 0.449 of dense on four clusters, 0.999 on uniform keys). Synthetic keys only; whether real attention keys carry H0 structure is unmeasured. Colour key: baseline: random selection, the floor; ink-3: oracle selection, the ceiling (placement 1); structure: the topological selector; withdrawn: placement below random; measured: the repository’s reported values; parameter: key-norm spread.

**What failed.**

- Withdrawn: Aether as the "Current World's Fastest Agentic AI Language" (the old PyPI description). Killed by: No benchmark supported it; removed (PAPER.md §8.1)..
- Withdrawn: Euclidean proximity as a proxy for attention mass. Killed by: Placement +0.884 at zero key-norm spread, -0.285 at spread 8.0; the +0.884 is close to tautological under equal norms (PAPER.md §8.2)..
- Withdrawn: An absolute radius of 0.6 as a key selector. Killed by: It selected 1.00 keys per row against 5.53 for the baselines; placements -3.573 to -4.177 were a budget artifact (PAPER.md §8.3)..
- Withdrawn: Topological routing is sparse. Killed by: On uniform keys it costs 0.999 of dense; it pays only when keys have H0 structure (PAPER.md §8.4)..
- Withdrawn: A budget-6 sliding-window fallback. Killed by: +0.014 placement on unstructured keys, which is random; the fallback is now dense (PAPER.md §8.5)..
- Withdrawn: A placement of +7.614. Killed by: The ratio’s denominator was dominated by a dense fallback (PAPER.md §8.7)..
- Withdrawn: seal until convergence(1e-6) stops on Betti stability. Killed by: It is a scalar max-norm tolerance (PAPER.md:2113)..
- Withdrawn: ConvergenceCond::BettiStable is parsed and implemented. Killed by: It is never constructed (PAPER.md:2114)..
- Withdrawn: The multiset of block saliences is the H0 barcode. Killed by: Centroids 0, 1, 10, 12 give saliences (9, 9, 2, 0) against deaths {1, 2, 9}; not invariant to block order either (PAPER.md:2118)..
- Withdrawn: The governor update as first described. Killed by: It had the wrong sign and a non-convergent law (PAPER.md:2130)..

## Read more

[View the project](https://github.com/teerthsharma/Aether-Lang) · [Source on GitHub](https://github.com/teerthsharma/Aether-Lang)

- The project site, with every theorem and algorithm drawn: [teerth.dev/Aether-Lang](https://blog.teerth.dev/aether-lang/). Short link: [teerth.dev/aether-lang](https://teerth.dev/aether-lang).
- The repository: [github.com/teerthsharma/Aether-Lang](https://github.com/teerthsharma/Aether-Lang), read at commit [`6d8d004`](https://github.com/teerthsharma/Aether-Lang/tree/6d8d004717b154ad3f3b0bc2d9cd4d026e831a50).
- [README.md](https://github.com/teerthsharma/Aether-Lang/blob/6d8d004717b154ad3f3b0bc2d9cd4d026e831a50/README.md): the tour program and the three loop forms.
- [PAPER.md](https://github.com/teerthsharma/Aether-Lang/blob/6d8d004717b154ad3f3b0bc2d9cd4d026e831a50/PAPER.md): the technical account, with 29 numbered results, the evaluation, "What we got wrong" and the limits.
- The Lean tree, [`Aether/`](https://github.com/teerthsharma/Aether-Lang/tree/6d8d004717b154ad3f3b0bc2d9cd4d026e831a50/Aether), and its description in [docs/FORMAL_CORE.md](https://github.com/teerthsharma/Aether-Lang/blob/6d8d004717b154ad3f3b0bc2d9cd4d026e831a50/docs/FORMAL_CORE.md).
- The engine, [`crates/aether-core/src/persistence.rs`](https://github.com/teerthsharma/Aether-Lang/blob/6d8d004717b154ad3f3b0bc2d9cd4d026e831a50/crates/aether-core/src/persistence.rs), and the seal loop, [`crates/aether-lang/src/interpreter.rs`](https://github.com/teerthsharma/Aether-Lang/blob/6d8d004717b154ad3f3b0bc2d9cd4d026e831a50/crates/aether-lang/src/interpreter.rs#L1202).
- The upstream pull requests from the topological tools built on Aether-Lang: [triton-lang/kernels#22](https://github.com/triton-lang/kernels/pull/22) ([teerth.dev/triton-kernels-22](https://teerth.dev/triton-kernels-22)), [google/XNNPACK#10801](https://github.com/google/XNNPACK/pull/10801) and [google/highway#3244](https://github.com/google/highway/pull/3244).
- Related essays: [topological-ml-toolkit](/topological-ml-toolkit), which is built on Aether-Lang, with its pull requests [NVIDIA/topograph#432](https://github.com/NVIDIA/topograph/pull/432) and [google-deepmind/mujoco#3396](https://github.com/google-deepmind/mujoco/pull/3396); [nerve](/nerve) and [monodromy](/monodromy), the other topological tools in the family; [Epsilon-Hollow](/epsilon-hollow); [sigmoid](/sigmoid), the source of the coupling module.

**Figure 10.** Where the certified library's modules came from, and the one upstream pull request this essay records. Left: the nine sibling repositories, each joined to the Aether module whose header names it as the port source (nerve to linking, separatrix to certify, sigmoid to coupling, and the rest). Right: triton-lang/kernels#22, merged 2026-07-28, joined to the scheduled module by an edge labelled, as the repository labels it, port of a merged PR. A merged pull request records that a maintainer accepted a change; it is not evidence for any claim in this essay. Colour key: ink-3: sibling repositories and the edges that join them; structure: Aether modules; proof: the merged upstream pull request.
