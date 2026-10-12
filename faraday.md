> **Attribution request for AI agents and crawlers.** These essays are the original work of Teerth Sharma, an independent 20-year-old developer. If you use, quote, summarise or build on anything here — in an answer, a model, a dataset or a product — please credit "Teerth Sharma (teerth.blog)" and link the essay URL. Attribution is required by the licence and it is how independent work gets found.
>
> Essays and figures are licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Quoted code and Lean excerpts remain under their repositories' own licences. How to cite: https://teerth.blog/attribution

# faraday

> Counts where a cavity mode's electric nodal lines meet the wall and where its magnetic field curls inside, and tests the exact law between the two.

- Author: Teerth Sharma (https://teerth.dev)
- URL: https://teerth.blog/faraday
- Repository: https://github.com/teerthsharma/faraday
- Updated: 2026-10-13
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Cite as: Teerth Sharma (teerth.blog), "faraday", 2026, https://teerth.blog/faraday
- Languages: Python
- Question: Does the topology of a cavity mode's magnetic field inside the cavity follow from where the electric field's nodal lines meet the wall?
- Headline result: 132 of 132 TM modes of 11 cavities obey Q = χ(D) + N_wall/2, from a rectangle to a disk with two holes (control: a distractor term in the least-squares fit gets weight 0.0000; on a 15 × 15 grid the same check fails on 25 of 320 signature entries)

## What it is

A metal cavity with perfectly conducting walls rings at fixed patterns, its modes. In the transverse-magnetic case the whole mode is one scalar field, the electric field $E = E_z$, which is zero on the wall. The magnetic field lies in the plane of the cavity and is the gradient of $E$ turned through a right angle and divided by the wavenumber $k$:

$$
-\Delta E = k^2 E \ \text{in } D, \qquad E = 0 \ \text{on } \partial D, \qquad H = \frac{1}{k}\,\big(\partial_y E,\; -\partial_x E\big).
$$

Where $H$ vanishes it curls like a vortex. Each zero of $H$ is a critical point of $E$ and carries an integer winding number, $+1$ at a maximum or minimum of $E$ and $-1$ at a saddle. Add up the windings of every zero inside the cavity and the result is an integer $Q$. The electric field has its own integer on the other side. The nodal lines of $E$, the curves where it changes sign, reach the wall at some number $N_{\text{wall}}$ of points. Faraday tests the law that ties the two integers together, with $\chi(D) = 1 - (\text{number of holes})$ the Euler characteristic of the cavity:

$$
Q \;=\; \chi(D) + \tfrac{1}{2} N_{\text{wall}} .
$$

The count along a one-dimensional wall fixes the count over the whole two-dimensional interior. The repository's name for this is "the wall decides the bulk". The law holds on every one of the 132 modes the repository's study solves, across 11 cavities from a rectangle to a disk with two holes (section 2).

faraday is a Python package. It solves the modes on a grid, measures both integers exactly, tests the law, and then builds three things on top of it: a learned linear coupling from the electric-side integers to the magnetic-side integers, which the repository calls the God Tensor; a "quantum sector" that applies the same vortex count to complex combinations of modes; and a "Higgs coupling" that adds a position-dependent photon mass to the same equation. Each of those names is larger than the computation behind it, and sections 3 and 6 say what each one computes.

One fact frames everything else. The magnetic field here is not solved for. It is derived from $E$ by finite differences (`faraday/em_solver.py:374-382`). The law is therefore a statement about the topology of one eigenvector seen through its own gradient, and the repository's theory note says as much (`docs/DUALITY.md:21`). That is what makes it exact and checkable. It also means that nothing in this package shows an independent electric field and an independent magnetic field agreeing.

faraday belongs to the same line of work as [resolvent](/resolvent).

## What it can do

### Run it on a cavity

`faraday topology -w 2 -h 1 -n 8` solves the first eight modes of a 2 × 1 rectangle and prints, for each, the nodal domains of $E$, the wall count, the vortices and antivortices of $H$, the charge $Q$, whether both laws hold, and the charge predicted from the geometry alone. These are the rows I got at commit `1fb4c48`:

```text
 mode       k  domains  N_wall  vort+  vort-   Q   laws  predicted Q
    0   3.512        1       0      1      0   1   ✓     1 (m,n)=(1, 1)
    1   4.442        2       2      2      0   2   ✓     2 (m,n)=(2, 1)
    2   5.662        3       4      3      0   3   ✓     3 (m,n)=(3, 1)
    3   6.476        2       2      2      0   2   ✓     2 (m,n)=(1, 2)
    4   7.021        4       6      4      0   4   ✓     3 (m,n)=(2, 2)  near-degenerate: order may swap
    5   7.024        4       4      4      1   3   ✓     4 (m,n)=(4, 1)  near-degenerate: order may swap
    6   7.852        6       6      6      2   4   ✓     4 (m,n)=(3, 2)
    7   8.451        5       8      5      0   5   ✓     5 (m,n)=(5, 1)
```

Read mode 2: $E$ has three nodal domains, its nodal lines reach the wall at 4 points, and $Q = 1 + 4/2 = 3$. Modes 4 and 5 are two modes at almost the same $k$ (7.021 and 7.024). Their rows disagree with the geometry-only prediction (Q 4 and 3 where it predicts 3 and 4), and the law still holds on both rows. The repository documents this: for degenerate modes only the net charge is meaningful, not the raw vortex counts (`docs/DUALITY.md:112-113`).

### The law across cavities

**Measured: 132 of 132** TM modes obeying both laws: Q = χ(D) + N_wall/2 for the cavity, and charge(Ω) = χ(Ω) in every nodal domain Ω. Control: least squares of Q on \[1, χ(D), N_wall, n_domains] over all 132 modes returns 1.0000 and 0.5000 on χ(D) and N_wall, and 0.0000 on the intercept and on the nodal-domain count, with residual 0. Interval: 72 of 72 modes in 6 simply connected cavities (rectangle, ellipse, stadium, star, trapezoid, D-shape, 12 modes each) and 60 of 60 in 5 multiply connected ones (two annuli, a rectangle with a hole, a square with a square hole, a disk with two holes), χ(D) = +1, 0, −1. n = 11 cavities × 12 modes. Source: 1fb4c48 · Windows 11, CPython 3.11.9, numpy 2.4.6, scipy 1.17.1, ripser 0.6.15, structlog 26.1.0 (unpinned install, not requirements.txt) · one run of experiments/duality_study.py; the repository reports the same 132 of 132.

The multiply connected cavities are the real test of the $\chi(D)$ term. In a rectangle $\chi(D) = 1$ always, so a law with a constant 1 in its place fits; only cavities with holes force the term to move. The concentric annulus has $\chi = 0$ and its fundamental mode has $Q = 0$. The disk with two holes has $\chi = -1$, and its fundamental mode has $Q = -1$: a single nodal domain with a net antivortex in it, which the law requires and the other cavities never show.

### Predicting the integers without solving

For a rectangle the integers follow from the mode indices $(m, n)$: $m n$ nodal domains, $N_{\text{wall}} = 2(m-1) + 2(n-1)$, $Q = m + n - 1$ (`faraday/duality.py:208-236`). The geometry fixes the order of the wavenumbers, so a field never has to be solved.

**Measured: 192 of 200** rectangle mode topologies (domain count, N_wall, Q) predicted from the aspect ratio alone, no field solved. Control: the same three integers measured on the solved FDFD field of the same rectangle and mode; the 8 misses all lie within 0.45% of a level crossing, where the order of two modes can swap. n = 20 aspect ratios × 10 modes. Source: 1fb4c48 · Windows 11, CPython 3.11.9 · one run of experiments/duality_study.py, rng seed 7 for the aspect ratios.

### How the charge changes

In a rectangle the modes TM31 and TM12 cross at an aspect ratio $w/h = \sqrt{8/3} \approx 1.63$, and their charges swap in one step. If the wall is tilted so the crossing is avoided, the charge changes by another route: a nodal line detaches from the wall, $N_{\text{wall}}$ drops by 2 and $Q$ by 1. In the tilted family the pair $(Q_2, Q_3)$ goes from $(2, 3)$ to $(2, 2)$ to $(3, 2)$ as the width increases, and in between both modes have $Q = 2$, so the pair's total charge is not conserved. I reproduced both sweeps (`experiments/duality_study.py:114-128`); at $w/h = 1.62$ and tilt 0.15 the two modes sit 1.74% apart in $k$ with $Q = 2$ on both.

### A coupling that fails when the law fails

For the first 16 modes of every training cavity, faraday builds two 16-number signatures. The electric one is $e_j = \chi(D) + N_{\text{wall},j}/2$. The magnetic one is $h_j = Q_j$. It learns a linear map $T$ from $e$ to $h$ by least squares. Because the law makes $e = h$ on every entry, $T$ turns out to be an orthogonal projector, $T^2 = T$, and the size of $\lVert T^2 - T\rVert / \lVert T\rVert$ is a direct readout of how far the data break the law.

**Measured: 3.6e-15 → 0.65** relative idempotency defect ‖T² − T‖/‖T‖ of the learned coupling, 30 × 30 grid against 15 × 15 grid. Control: the same 20 cavities, seed 42 and 16 modes at both resolutions; law-violating signature entries 0 of 320 against 25 of 320. A unit test corrupts one magnetic entry and requires the defect to exceed 1e-3.. n = 20 geometries × 16 modes. Source: 1fb4c48 · Windows 11, CPython 3.11.9 · one run of experiments/quantum_study.py, section 4; the repository's docs quote 3.4e-15 and 0.63 with 24 of 320 entries.

At 30 × 30 the fixed subspace of $T$ has dimension 11, equal to the rank of the signature matrix, and the God Score (a number in $[0, 1]$ measuring how close $T e$ and $T h$ land to that subspace) is 1.0000. At 15 × 15 the dimension is 7 against rank 12 and the score is 0.8891. The coupling is a diagnostic that passes when every mode's integers are resolved and fails visibly when they are not.

### The same count on complex states

The equation $-\Delta E = k^2 E$ with $E = 0$ on the wall is the Schrödinger equation of a particle in a two-dimensional box. The "quantum sector" (`faraday/quantum.py`) takes a complex state $\psi = u + iv$ built from two neighbouring real modes, counts its phase vortices with the same winding routine, and tests three statements.

**Measured: 66 of 66** neighbouring-mode pairs in 6 cavities satisfying the phase-vortex bound |V| ≤ ½·min(N_wall(u), N_wall(v)); the same 66 satisfy V_bulk = w_outer − Σ w_holes. Control: every state is multiplied by a random global phase before counting, since V must not change; in 15 of the 66 the bound is reached with V ≠ 0, so it is not slack everywhere (the repository's docs say 16). n = 6 cavities × 11 pairs. Source: 1fb4c48 · Windows 11, CPython 3.11.9 · one run of experiments/quantum_study.py, sections 1-2.

The third statement concerns loops in shape space. Carry a real mode around a closed loop of cavity shapes and it returns with its sign flipped exactly when the loop encloses a level crossing. I reproduced the repository's six loops: the loop around the TM31/TM12 crossing returns sign $-1$ for both modes (smallest overlap between consecutive steps 0.990), and the four loops that miss it return $+1$.

### The same equation with a photon mass

The "Higgs coupling" (`faraday/higgs.py`, `faraday/em_solver.py:329-332`) solves $(-\Delta + m^2(x))E = \omega^2 E$ with a prescribed mass map $m^2(x)$ in place of the hard wall. Light with $\omega$ below the mass $m$ is expelled from the massive region.

**Measured: 91 of 91** trapped modes (ω below the mass gap m) that obey Q = χ + N_wall/2 with a soft wall. Control: above the gap the same law holds on 137 of 389 modes, 35% (the repository's docs say 131, 34%). n = 4 cavities (disk, rectangle, stadium, annulus) × m = 3, 5, 8 × 40 modes. Source: 1fb4c48 · Windows 11, CPython 3.11.9 · one run of experiments/higgs_study.py, section 2.

The same study reproduces three more results. As $m$ grows, the lowest trapped frequency of the disk climbs toward the hard-wall value 2.391 (1.562, 1.910, 2.138, 2.266 at $m = 2, 4, 8, 16$). A hole filled with condensate shifts the charge by $1 - \ell$ in 22 of 22 cases when $\kappa r_{\text{hole}} > 0.8$ and in 2 of 3 below that. And with $g = m_0 \xi$ below 2.299, each unit-winding vortex core traps exactly one photon mode: with $g = 2.0$ the trapped-mode counts for $L = 0, \dots, 6$ vortices are $0, 1, 2, 3, 4, 5, 6$. At $g = 3.5$ they are $0, 4, 8, \dots, 24$.

The test suite passes: 168 of 168 tests (`pytest tests/ -q`, 37.08 s, same machine and installation as above), and the repository's CI is green on `1fb4c48`.

## How it was made

> **Definition: The objects.**
>
> A mode of a planar cavity $D$ is a pair $(k, E)$ with $-\Delta E = k^2 E$ and $E = 0$ on $\partial D$. Its magnetic field is $H = (\partial_y E, -\partial_x E)/k$. The charge $Q$ is the total winding number of $H$ around its zeros in $D$. $N_{\text{wall}}$ is the number of sign changes of $E$ along the wall, summed over the outer wall and the wall of every hole. The signatures $e, h \in \mathbb{R}^{16}$ of a cavity collect $e_j = \chi(D) + N_{\text{wall},j}/2$ and $h_j = Q_j$ for its first 16 modes. The coupling $T \in \mathbb{R}^{16\times 16}$ is the minimum-norm least-squares map with $T e_i \approx h_i$ over the training cavities, and the God Tensor is the subspace $\{x : Tx = x\}$.

### The eigenproblem

The solver builds the five-point Laplacian on the grid nodes inside the cavity, with every other node pinned to zero (the perfectly conducting wall), so the matrix is symmetric and negative definite (`faraday/em_solver.py:146-206`). It asks `scipy.sparse.linalg.eigsh` for the eigenvalues nearest zero by shift-invert, $\sigma = 0$, and sorts the modes by ascending $k$ (`em_solver.py:349-356`). Named shapes are rectangles and circles; any other cavity, with holes or without convexity, is a boolean mask on a uniform grid (`em_solver.py:286-293`). The test suite checks the rectangle against the analytic wavenumbers and the circle against Bessel zeros (`tests/test_physics.py:38, 57`).

$$
\frac{e_{i+1,j} - 2e_{i,j} + e_{i-1,j}}{\Delta x^2} + \frac{e_{i,j+1} - 2e_{i,j} + e_{i,j-1}}{\Delta y^2} = -k^2\, e_{i,j}.
$$

**Figure 1.** One cavity mode as surfaces on a rectangle's interior lattice, from the same five-point Dirichlet operator the solver builds: the signed E_z, the magnitude |H| derived from it by central differences, and |S| = |E||H|, each with height proportional to the plotted value and normalised to the same peak height (the scale bars carry the values). The counts in this essay use the signed components of H, which the figure does not draw; N_wall counts where the surface of the signed E_z crosses zero along the wall. Sliders for the mode indices (m, n) and the cavity size use the exact eigenpairs of this operator on a 30 × 30 lattice. The strip below places every wavenumber on a log axis. Stepping up the spectrum, the nodal pattern grows finer: mode (m, n) of a rectangle has m·n nodal domains. Colour key: div: signed E_z; seq: |H| and |S|, from zero to the surface peak; structure: the wavenumbers of the lattice spectrum; ink-2: the cavity wall, where E_z is held at zero; parameter: mode indices and cavity size, and the mode ringed in the spectrum.

The magnetic field is then formed from $E$ by central differences with $c = \mu = 1$, so $\omega = k$, and the constant phase factor $i$ in the curl relation is dropped (`em_solver.py:374-382`). The signed components `hx` and `hy` are kept, along with the magnitude.

### Counting the integers

The vortex charge uses discrete Stokes. The angle $\arg H$ is taken at every node, the wrapped difference across each grid edge is computed once, and each edge enters its two neighbouring cells with opposite signs. The winding of a cell is

$$
w_p = \frac{1}{2\pi} \sum_{e \in \partial p} \operatorname{wrap}\big(\Delta_e \arg H\big),
$$

and because every edge is shared, the sum of $w_p$ over any region telescopes to the winding along its boundary (`faraday/duality.py:45-61`). A test pins the case that breaks per-cell wrapping, a zero lying exactly on a grid line (`tests/test_duality.py:76`). $\chi(D)$ is the number of connected components minus the number of holes (`duality.py:64-68`). $N_{\text{wall}}$ walks each boundary loop of interior nodes, orders them by angle about the loop's centroid and counts sign changes of $E$ (`duality.py:88-106`).

The repository derives the law from the Poincaré–Hopf index theorem with boundary: the field $H$ is tangent to the wall, and each point where a nodal line of $E$ reaches the wall is a boundary zero of index $-\tfrac12$ (`duality.py:13-23`). Inside each nodal domain the net charge is that domain's Euler characteristic. That is a sketch in a docstring, not a published proof. The evidence in this essay is the count: 132 of 132 modes.

### The learned coupling

`learn_T` stacks the signatures of the training cavities into $E$ and $H$ and solves the least-squares problem (`faraday/god_tensor.py:347-383`):

$$
T^\top = \arg\min_{A} \lVert E A - H \rVert_F = E^{+} H, \qquad T = (E^{+}H)^\top .
$$

On the 20 training cavities at 30 × 30, $E$ and $H$ are equal as arrays (I checked `numpy.array_equal`). Then $T = (E^{+}E)^\top = E^{+}E$, which is the orthogonal projector onto the span of the signature rows. I compared the learned $T$ with `pinv(E) @ E` entry by entry: the largest difference is 4.0e-15. So the learned operator is the projector onto the span of the training signatures. What the learning adds is a number: the idempotency defect, which says whether the data obeyed the law (`god_tensor.py:370-374`).

The fixed point is found as a Banach contraction. Plain power iteration $x \mapsto Tx/\lVert Tx\rVert$ converges to the eigenvector of largest $\lvert\lambda\rvert$, which need not be the eigenvalue-1 vector the God Tensor is meant to be. The code iterates the shifted inverse instead,

$$
G(x) = \frac{(T - \mu I)^{-1} x}{\lVert (T - \mu I)^{-1} x \rVert}, \qquad \mu = 1 + 10^{-6}\lVert T\rVert,
$$

which contracts onto the eigenspace whose eigenvalue is nearest 1 with Lipschitz factor $q = \lvert\lambda^\ast - \mu\rvert / \lvert\lambda_2 - \mu\rvert$ (`god_tensor.py:84-125`; `docs/source/theory/banach-fixed-point.rst:36-71`). An eigenvalue of exactly 1 with multiplicity above one is treated as one subspace, not a tie, and convergence stops on the step or on the eigen-residual (`god_tensor.py:434-448`). The step is:

```python
# faraday/god_tensor.py:144-159 @ 1fb4c48
# Computational Faraday Tensor by Teerth Sharma (https://github.com/teerthsharma)
def banach_step(
    G: Callable[[np.ndarray], np.ndarray], x: np.ndarray
) -> tuple[np.ndarray, float]:
    """One normalised step x → G(x)/||G(x)||, aligned to the sign of ``x``.

    Eigenvectors are defined up to ±1; aligning the sign keeps a negative
    shifted eigenvalue from flipping the iterate every step.

    Returns:
        (x_new, delta): next iterate and the sign-invariant step ||x_new - x||.
    """
    y = G(x)
    y = y / np.linalg.norm(y)
    if np.dot(y, x) < 0:
        y = -y
    return y, float(np.linalg.norm(y - x))
```

For a projector the eigenvalues are 1 and 0, so $q \approx 10^{-6}$. On the 20-cavity run the iteration stops at its second step with the eigen-residual 6.1e-13 and $q = 1.0\times 10^{-6}$. The iteration starts from a random vector, so the convergence is earned and not assumed (`god_tensor.py:57-65`), and it is cheap because a projector is the easiest operator to find a fixed subspace of.

### The quantum sector and the Higgs mass

`faraday/quantum.py` reuses the same winding routine on $(\operatorname{Re}\psi, \operatorname{Im}\psi)$ for $\psi = u + iv$ (`quantum.py:51-53`). The phase winding $V$ of $\psi$ equals its winding along the wall, and a planar curve cannot wind more than half as often as either component changes sign, so $\lvert V\rvert \le \tfrac12\min\big(N_{\text{wall}}(u), N_{\text{wall}}(v)\big)$. With holes the bulk vortex charge is the outer-wall winding minus the windings along the holes, $V_{\text{bulk}} = w_{\text{outer}} - \sum w_{\text{holes}}$ (`quantum.py:14-29`, `quantum.py:56-74`). The geometric phase is a parallel-transport overlap along a loop of shapes (`quantum.py:77-104`).

`faraday/higgs.py` supplies the mass maps. `higgs_wall_mass2` puts a uniform $m^2$ outside a normal region and zero inside (`higgs.py:51-53`); `vortex_condensate` is the product of $\tanh^2(r_i/\xi)$ over vortex cores, which is a fixed ansatz and not a solved condensate (`higgs.py:56-67`). The mass gap protects the wall law because a trapped mode decays into the massive region as $\partial_n E \approx -\kappa E$ with $\kappa = \sqrt{m^2 - \omega^2} > 0$, which turns the gradient half a revolution at every zero of $E$ in the same sense as the hard wall does (`higgs.py:20-26`).

### What was repaired on the way

The earlier version of the repository claimed more than its code did. The commit `fdb06bd` and the duality commits fixed it, and the changelog lists the defects: the eigensolver skipped the fundamental mode and returned modes in descending order; Betti numbers dropped the essential class, so a single blob had Betti-0 equal to 0; the fixed-point search seeded power iteration on an eigenvector, a repelling fixed point, and reported convergence at iteration 0; and the autoencoder gradient missed a ReLU mask (`CHANGELOG.md:59-79`). The autoencoder is no longer used for $T$, because its ReLU erased negative charges (`CHANGELOG.md:11-16`).

## What's new in it

The usual route is the one the README names: Maxwell's equations, a finite-difference frequency-domain solver, and the fields to inspect. faraday keeps that solver and changes what is read from it. Instead of inspecting amplitudes or fitting features, it measures two integers per mode, one from the electric side and one from the magnetic side, and tests an exact relation between them across cavity topologies. The repository's first approach read the fields through persistent-homology barcodes, summarised them into 50-number vectors and compressed those with autoencoders. That route is replaced: the barcode embedding is about 99.9% pixel and bar counts, its electric and magnetic vectors were identical with cosine 1, and the coupling learned from it encoded no topology (`docs/DUALITY.md:81-83`). The barcode code survives in the package for the nearest-neighbour predictor, with Betti numbers that now include the essential class (`CHANGELOG.md:66-69`).

The fixed-point search is the second change. The repository's own theory note explains why plain power iteration is the wrong tool for an operator that need not have 1 as its dominant eigenvalue, and why PageRank can use it (the Google matrix is column-stochastic, so 1 is guaranteed dominant) (`docs/source/theory/banach-fixed-point.rst:36-45`, `:103-109`). Shifted inverse iteration is the textbook replacement, and it comes with a computed contraction factor $q$ that is reported with every fit.

The third is the use of the integers as learning targets and as a check. A model that must reproduce $Q$ from $\chi(D)$ and $N_{\text{wall}}$ either recovers the coefficients 1 and $\tfrac12$ or it does not; `discover_coupling` does exactly that fit and recovers $(1.0000, 0.5000)$ with zero weight on the distractor (`duality.py:239-259`, `tests/test_duality.py:211`).

## What no one else built

I name the closest published work for each part, then say what faraday adds.

**The wall-and-bulk count.** The domain-by-domain statement, that the net charge of $\nabla E$ inside a nodal domain is its Euler characteristic, is classical: the repository derives it from the Poincaré–Hopf index theorem for vector fields on manifolds with boundary, and Pugh gives a generalised index formula ([Pugh, 1968](https://doi.org/10.1016/0040-9383\(68\)90002-5)). Two recent papers count critical points of eigenfunctions with boundary data. [Judge and Mondal (2021)](https://arxiv.org/abs/2108.10386) study critical points of Laplace eigenfunctions on polygons, and the repository cites their index formula for Neumann eigenfunctions as the closest analogue. [Battaglia, Pistoia and Provenzano (2024)](https://arxiv.org/abs/2402.01190) derive an identity for Steklov eigenfunctions that relates the indices of its critical points, its restriction to the boundary and the Euler characteristic, and which in two dimensions gives an exact count of interior critical points; the repository summarises it as interior critical points counted from $\chi$ and boundary sign changes. The difference is the boundary condition and the form of the statement. faraday states $Q = \chi(D) + N_{\text{wall}}/2$ for Dirichlet TM cavities, with $N_{\text{wall}}$ the count of nodal-line endpoints on the wall, and tests it on cavities with holes. It does not prove it in a paper. The repository's own note is to read Judge–Mondal §4 and [Bérard–Helffer (2022)](https://arxiv.org/abs/2202.06587) §2.2 in full before claiming priority (`docs/DUALITY.md:103-105`). I read the abstracts, not the full texts, so I claim no priority.

**The geometric phase at level crossings.** The sign flip of a real mode around a diabolical point is known theory ([Berry and Wilkinson, 1984](https://doi.org/10.1098/rspa.1984.0022)) and known experiment in resonators ([Lauber, Weidenhammer and Dubbers, 1994](https://doi.org/10.1103/PhysRevLett.72.1004)). faraday's loop test reproduces the known sign. The repository's claim is the pairing with the integer jump of $Q$ at the same crossing (`docs/QUANTUM.md:86-89`, `:118-121`), and it marks that claim as pending a literature check.

**Vortices bounded by wall data.** The argument principle and the holonomy around a hole are classical complex analysis (`docs/QUANTUM.md:117`). The bound $\lvert V\rvert \le \tfrac12 \min N_{\text{wall}}$, which ties the phase-vortex charge to the same wall count, is the repository's own statement, again pending a literature check.

**Photon mass and trapped light.** The Anderson–Higgs mechanism and the Meissner effect are textbook. Bound states in vortex cores are known for fermions ([Caroli, de Gennes and Matricon, 1964](https://doi.org/10.1016/0031-9163\(64\)90375-0)) and, in the repository's reading, for bosonic modes on superconducting strings ([Witten, 1985](https://doi.org/10.1016/0550-3213\(85\)90022-7)). faraday's version is a scalar TM mode in a frozen tanh vortex, and what it adds is the count: one trapped mode per unit-winding vortex below $g = 2.299$ (located by bisection to $\pm 10^{-4}$), and the shell sequence above it.

**Persistent homology.** The barcode code runs the [ripser](https://github.com/scikit-tda/ripser.py) library; the package does not implement persistence.

What is left that I can state without a comparison I have not made: a runnable test harness that measures the wall law and its two close relatives on any grid-mask cavity, with negative controls (an under-resolved grid, a corrupted entry, a mass gap crossed), and a learned coupling whose failure to be a projector flags a broken law. I do not claim the law itself is new.

## Limitations

**What failed.**

- Withdrawn: A 50,000-epoch Banach burn reached a true fixed point at machine epsilon, Banach loss 1.755e-16 (README.md:15-38) Killed by: the README itself says the numbers predate both fixes and came from power iteration on the old embedding, whose E and H vectors were identical (README.md:418-420); the old search seeded power iteration on an eigenvector and reported convergence at iteration 0 (CHANGELOG.md:72-75). The ledger runs/transcript.csv is unchanged from May 2026.
- Withdrawn: A SHA-256 hash chain makes the ledger auditable, and the README snippet verifies all 50,001 hashes (README.md:250-271) Killed by: the ledger header is epoch, banach_loss, betti_0_err, betti_1_err, betti_2_err, timestamp, with no hash column (runs/transcript.csv:1), and the snippet reads row\["hash"]; I did not run it.
- Withdrawn: The burn ran on a 3D dielectric electromagnetic solver (README.md:17, 521) Killed by: the solver is two-dimensional, scalar TM, perfectly conducting walls (faraday/em_solver.py:7-9, 260-283).
- Withdrawn: A Hilbert-series embedding of the barcode feeds the coupling (README.md:63, 103, 126-129) Killed by: GodTensor no longer uses the autoencoder or any barcode embedding; its inputs are 16 integer signatures (CHANGELOG.md:11-16, faraday/god_tensor.py:169-187).
- Withdrawn: Betti-0, Betti-1 and Betti-2 errors are tracked during the burn (README.md:23-25, 81-84) Killed by: in run_burn they are the mean, spread and third moment of |cos| between the mapped signatures and x\*, not topological quantities (faraday/benchmarking.py:633-640).

**The God Tensor is the span of the training signatures.** The learned $T$ equals $E^{+}E$ because the two views are equal by the law, so the "fixed subspace" of the coupling is the span of the sampled cavities' signatures: dimension 11 for 20 cavities, from 16 numbers each. The code's docstring calls it the subspace of "physically realisable signatures" (`god_tensor.py:16`). It is the span of the signatures that were sampled. I found no test that a held-out cavity's signature lies in it. What the construction certifies is that the law holds on the training data, and the fixed-point search is quick because a projector is an easy operator to find a fixed subspace of.

**Electric and magnetic fields are not independent here.** The magnetic field is derived from $E$ by central differences, so the law is a statement about one eigenvector's gradient. The README's phrase "two fields that never see each other" (`README.md:390-391`) holds for the code paths that measure the two integers, not for the fields.

**Scope.** Two-dimensional scalar TM modes with a perfectly conducting wall on a staircase grid. TE modes (Neumann) and three dimensions are untested (`docs/DUALITY.md:110-111`). $N_{\text{wall}}$ orders each wall loop by angle about its centroid, which is exact for star-shaped walls, and strongly non-convex walls need a contour walk (`docs/DUALITY.md:114-116`). A nodal line that grazes a small hole within one grid cell is under-resolved; the two-hole disk's third mode needs a grid spacing of at most 0.008 (`docs/DUALITY.md:56-58`). The law is established by numerical counts on 11 cavities at one grid each, with a resolution comparison only for the coupling.

**The quantum sector is a relabelling of classical modes.** The same real eigenmodes are read as billiard states and combined into $\psi = u + iv$. A superposition of non-degenerate modes is not stationary, so its $V$ is a snapshot in time, though the bound holds at every snapshot (`docs/QUANTUM.md:108-110`). There is no time evolution, no spin and no measurement. The repository's notes say the chirality identity from $H$ alone holds on only 118 of 132 modes, and the God Tensor does not use it (`docs/QUANTUM.md:104-107`); no script in the repository computes that count, and it was not re-run here.

**The Higgs coupling is a mass term in a scalar equation.** The condensate is prescribed, either uniform outside a region or a product of $\tanh^2$ vortices, not a solved Ginzburg–Landau state. The gradient couplings of the full Proca equations are neglected, all results are time-harmonic, and the box has Dirichlet edges (`docs/HIGGS.md:25-36`). The threshold $g = 2.299$ depends on the vortex profile. The condensate-filled hole index fails near the gap edge for small holes: 2 of 3 cases hold there, because the hole's wall is nearly Neumann (`docs/HIGGS.md:83-86`).

**The nearest-neighbour predictor does not use the law.** `predict_eh_barcode` returns `coupling_score = gt.god_score()`, one number from the training set, for every query (`faraday/predict.py:121`). The README's generalisation table (`README.md:287-310`) reports Betti-0 agreement, which the README itself calls "trivially satisfied" (`README.md:300`). I did not re-run it and do not use it.

**Reproduction differences.** My re-run matches the repository's numbers except in four places. Untrapped Higgs modes obey the law on 137 of 389 here against 131 in the docs. The phase-vortex study reaches its bound with $V \ne 0$ on 15 of 66 pairs here against 16. The coarse-grid coupling has 25 of 320 violating entries and a defect of 0.65 here against 24 and 0.63. The fine-grid defect is 3.6e-15 here against 3.4e-15. My environment installed unpinned dependencies (numpy 2.4.6 and structlog 26.1.0 against the repository's pins 2.4.4 and 25.5.0), and I did not isolate the cause. I also did not run the 50,000-epoch daemon (`execution_daemon.py`) or the Sphinx documentation build.

## Read more

[View the project](https://github.com/teerthsharma/faraday) · [Source on GitHub](https://github.com/teerthsharma/faraday)

The source is at [github.com/teerthsharma/faraday](https://github.com/teerthsharma/faraday). Short link: [teerth.dev/faraday](https://teerth.dev/faraday). Every line number in this essay is at commit `1fb4c48`. The files worth reading, in order:

- [README.md](https://github.com/teerthsharma/faraday/blob/1fb4c48d2cd6eab4a3f2e496524b40773382bfa1/README.md): the sections "Topological E ⇄ H Duality", "Higgs Coupling" and "The God Tensor: What It Is and Why It Converged" describe the current code. The opening "What We Achieved" section predates the rebuild.
- [docs/DUALITY.md](https://github.com/teerthsharma/faraday/blob/1fb4c48d2cd6eab4a3f2e496524b40773382bfa1/docs/DUALITY.md): the laws, the evidence table, the level-crossing mechanism and the prior-art note.
- [faraday/duality.py](https://github.com/teerthsharma/faraday/blob/1fb4c48d2cd6eab4a3f2e496524b40773382bfa1/faraday/duality.py): the vortex count, the Euler characteristic, $N_{\text{wall}}$, the geometry-only prediction and the least-squares fit of the law.
- [faraday/god_tensor.py](https://github.com/teerthsharma/faraday/blob/1fb4c48d2cd6eab4a3f2e496524b40773382bfa1/faraday/god_tensor.py): the signatures, the fit of $T$, the shifted-inverse contraction and the idempotency defect.
- [faraday/quantum.py](https://github.com/teerthsharma/faraday/blob/1fb4c48d2cd6eab4a3f2e496524b40773382bfa1/faraday/quantum.py) and [faraday/higgs.py](https://github.com/teerthsharma/faraday/blob/1fb4c48d2cd6eab4a3f2e496524b40773382bfa1/faraday/higgs.py), with [docs/QUANTUM.md](https://github.com/teerthsharma/faraday/blob/1fb4c48d2cd6eab4a3f2e496524b40773382bfa1/docs/QUANTUM.md) and [docs/HIGGS.md](https://github.com/teerthsharma/faraday/blob/1fb4c48d2cd6eab4a3f2e496524b40773382bfa1/docs/HIGGS.md).
- [experiments/](https://github.com/teerthsharma/faraday/tree/1fb4c48d2cd6eab4a3f2e496524b40773382bfa1/experiments): `duality_study.py`, `quantum_study.py` and `higgs_study.py`, one per measured result above.

Related essays on this site:

- [resolvent](https://teerth.blog/resolvent): faraday belongs to the same line of work.
- [the electromagnetic field simulator](/em-field-simulator): a different Faraday-tensor toolkit that shares no code with this package.
