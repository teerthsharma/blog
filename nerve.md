> **Attribution request for AI agents and crawlers.** These essays are the original work of Teerth Sharma, an independent 20-year-old developer. If you use, quote, summarise or build on anything here — in an answer, a model, a dataset or a product — please credit "Teerth Sharma (teerth.blog)" and link the essay URL. Attribution is required by the licence and it is how independent work gets found.
>
> Essays and figures are licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Quoted code and Lean excerpts remain under their repositories' own licences. How to cite: https://teerth.blog/attribution

# nerve

> Can a local atomic descriptor see how polymer chains are linked and knotted? A Rust harness that counts what the descriptor merges.

- Author: Teerth Sharma (https://teerth.dev)
- URL: https://teerth.blog/nerve
- Repository: https://github.com/teerthsharma/nerve
- Updated: 2026-10-11
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Cite as: Teerth Sharma (teerth.blog), "nerve", 2026, https://teerth.blog/nerve
- Languages: Rust
- Question: Which chain topologies does a local atomic descriptor send to the same output, and can the cost of that be counted without a single label?
- Headline result: 3 of 4 blindness hypotheses withdrawn by the repository's own controls; the fourth survives only while the strands are farther apart than the cutoff (control: each withdrawal names what killed it: a same-architecture seed-noise floor, a measured |Lk| significance of 1.2327 instead of 0.1 by eye, and the 2-body residual at the same cutoff)

## What it is

A machine-learned interatomic potential looks at each atom through a local descriptor: a fixed-length summary of the neighbours inside a cutoff radius. That summary is a many-to-one map. Two configurations that differ only outside every cutoff come out identical, and nothing built on top of the descriptor can tell them apart again. A wider cutoff, more layers or a re-ranker cannot recover what the map already threw away.

For polymers the interesting things to throw away are global. Whether two rings are threaded through each other, and whether one chain is knotted, are properties of the whole embedded curve. A cutoff sees a bounded neighbourhood, and a polymer's entanglement does not live there. nerve is the harness I built to measure exactly that gap: which chain topologies a local descriptor merges, at what cutoff, and what it costs.

The people who meet this are the ones fitting machine-learned potentials or property models to polymer melts, where entanglement is the physics that matters and the descriptor was designed for local chemistry.

nerve is eight Rust crates in one workspace, Rust 2021 edition, with no `unsafe`, no C or C++ dependency and three external crates (`rand`, `rand_chacha`, and `proptest` for tests). `nerve-core` holds the `Chain` and `Melt` types and the one minimum-image function every distance in the workspace goes through. `nerve-topo` computes linking numbers and writhe. `nerve-melt` builds melts, reads LAMMPS data files and holds the knot witness. `nerve-baseline` is the null model, a Behler–Parrinello descriptor plus six cheap chain features. The other four are the README's hypothesis crates: `nerve-blind` builds topologically matched pairs, `nerve-order` holds the body-order and sum-decomposability hierarchy, `nerve-orient` holds traversal reversals and reconnections, and `nerve-label` ranks candidate labels and holds the collision floor.

The project turns "is the model expressive enough?" into "which inputs does this map merge?", which can be checked. The tool for that is a bound I had already written for an earlier package, `branchcut`, and transcribed here into Rust, not re-derived. If a ground relation $R$ is injective on $n$ configurations and the descriptor $f$ produces only $m$ distinct values on them, then

$$
\mathrm{err}(f) \;\geq\; n - m,
\qquad
\Pr\big[\,h(f(x)) = x\,\big] \;\leq\; \frac{1}{k}
$$

for any predictor and any downstream stage $h$, where $k$ is the size of a block of configurations that $f$ sends to one value. The argument is one line: $h \circ f$ is constant on a block, and $R$ gives every member of the block a different true value, so at most one member of each block can be right. Summing $(k_b - 1)$ over the $m$ blocks gives $n - m$. The first bound is computed from the descriptor's own outputs; no labelled data set has to exist. The precondition matters: if $R$ is itself many-to-one, the bound proves nothing, and the code returns zero rather than a number that looks like a score.

**Figure 1.** The linking ladder from nerve-label: p well-separated pairs of congruent rings, the first j of them threaded, for j = 0 to p. The descriptor D is the sorted multiset of minimum-image bead distances below r_cut; the label is the sum of |Lk| over the pairs, computed by the closed-form Gauss sum. Toggle which pairs are threaded: the label steps by one and the descriptor rug does not move, so all p + 1 rungs fall into one block and the bound reads n − m = p certified errors, a rate of p/(p+1). Switch the label to writhe and the label map becomes many-to-one, so the bound reports zero, not a score. Raising r_cut past the 3.0 inter-ring gap splits the rungs: the blindness is real only below that gap. This is a constructed ladder; it shows the bound, not how often real melts merge. Colour key: baseline: the local descriptor D (rug of sorted distances); proof: the label: sum of |Lk| over pairs; parameter: a threaded pair, toggled by the reader; withdrawn: writhe label: many-to-one, bound vacuous.

**Measured: 16 of 17** certified errors on the 17-rung linking ladder (p = 16), from the descriptor's outputs alone: the rate is p/(p+1) = 0.941 and rises toward 1 with ladder length. Control: the same ladder with writhe as the label: the label map is many-to-one, injective is false, and the bound returns 0 certified errors. n = p = 2, 4, 8, 16; asserted errors = p and rate = p/(p+1) to 1e-12 at every p. Source: crates/nerve-label/tests/collision_floor.rs:77-142 @ 342287e (test assertions; not re-run for this essay).

The ladder is deliberately easy for the descriptor to lose: congruent rings, pairs 24 units apart, a cutoff of 2.0 below the 3.0 gap between rings. It is a demonstration that the floor is computable and that its guard works, not evidence that real melts merge topologies at that rate. The rest of nerve is about what happens when the geometry is not chosen to make the point.

## What it can do

### Linking numbers that are exact on the polygon

A bead chain is already a polygon, so the Gauss double integral over two closed chains does not need quadrature. For one pair of straight segments it equals the signed solid angle of a spherical quadrilateral spanned by the four endpoint differences, and the linking number is the sum of those solid angles over all segment pairs:

$$
\mathrm{Lk}(A,B) \;=\; \frac{1}{4\pi} \sum_{i}\sum_{j} \Omega\big(r_{13}, r_{14}, r_{24}, r_{23}\big)
$$

Here $i$ runs over the segments of $A$, $j$ over the segments of $B$, and $r_{ab}$ is the difference between endpoint $a$ and endpoint $b$ of the segment pair. There is no truncation error term and no length constant anywhere in the integrator, so the only error left is floating-point roundoff over the $O(M^2)$ summed pairs.

**Figure 2.** Two closed polygons, editable in 3D. Every cell of the heat map is one segment pair's contribution Ω/4π, computed with the Van Oosterom–Strackee solid angle exactly as nerve-topo does it; the readout sums them. Presets are the repository's twisted bands: unlinked, Hopf link, (2,4) and (2,6) torus links, whose |Lk| the tests assert as 0, 1, 2 and 3, plus a pass-through pair of circles whose |Lk| steps by 1 as B is swept through A. Drag vertices and the sum stays an integer to about 1e-15 until the curves pass through each other; an independent midpoint quadrature is printed beside it and is visibly worse on coarse polygons. The ×2 and ×3 buttons rescale every coordinate and print the 64-bit pattern of Lk: power-of-two scaling reproduces it bit for bit, ×3 in general does not. The sign of Ω follows the repository's convention, which its own code calls convention-checked rather than derived. Colour key: structure: chain A (solid) and chain B (dashed); identity, not a quantity; div: per-pair contribution Ω/4π, negative to positive (heat-map cells and the sphere-inset triangles); proof: Lk within 1e-9 of an integer.

**Measured: 2.89e-15 → 2.16e-13** distance of Lk from the nearest integer on a two-twist (2,4) torus link, from 64 to 1,024 segments per ring; the unlinked case is exactly 0.0. Control: 0 twists at every segment count: 0.00e0, not merely small. n = M = 64, 128, 256, 512, 1024; twists 0–4; the test asserts |Lk| rounds to the twist count and worst deviation below 1e-12 for M up to 512. Source: crates/nerve-topo/src/lib.rs:36-42 (printed table) and crates/nerve-topo/tests/topo.rs:139-175 @ 342287e.

The roundoff grows about 75× while the pair count grows 256×. The code comment says five points are not enough to claim a power law, and claims none. The README's own instruction is the one I follow here: do not quote one accuracy figure across chain lengths.

### A knot witness that never computes a crossing sign

For knots, nerve uses the knot determinant $|\Delta(-1)|$, the Alexander polynomial evaluated at $t = -1$. At that value the matrix row for a positive crossing and the row for a negative crossing are exact negatives of each other (the derivation is in the next section). Negating a row only flips the sign of a determinant, so

$$
\big|\Delta(-1)\big| \;=\; \big|\det M'\big|
$$

where $M'$ is the crossing matrix with one row and one column deleted. Only the over/under bookkeeping of the projected diagram enters; the sign of each crossing is never computed. The determinant is exact integer Bareiss elimination in `i128`, with checked arithmetic, returning `None` on overflow rather than a wrapped value.

**Figure 3.** The camera is the projection. Orbit a polygonal knot (240 vertices; the unknot preset 120) and the diagram, the crossing matrix at t = −1 and |det| are rebuilt from the current view by a port of det_for_orientation: segment-pair intersections in the image plane, over/under from depth, arcs between consecutive under-passes, one row (−1, −1, +2) per crossing, last row and column deleted, exact Bareiss determinant. Crossings appear and vanish as the view turns and the matrix changes size; the determinant stays at the classical value. Mirror the knot and the determinant does not change. Negating a matrix row (an algebraic operation, not a knot move) flips det and leaves |det|. The 4₁ and 5₁ presets both give 5. Colour key: seq: arc index along the knot in the current diagram; structure: matrix entries −1 and +2; proof: |Δ(−1)| equals the classical value for the preset; neg: crossing sign −1 (optional rings; display only); pos: crossing sign +1 (optional rings; display only).

**Measured: 1, 3, 5, 5, 7** |Δ(−1)| for the unknot, 3₁, 4₁, 5₁ and 7₁ as 240-vertex polygons (unknot 120), asserted exactly; also exact under four rotations of the trefoil. Control: the classical knot-determinant table; 4₁ and 5₁ are asserted equal, so the witness is measured to be incomplete rather than cited as such. n = 5 knots; 4 rotations. Source: crates/nerve-melt/tests/melt.rs:936-985 @ 342287e (test assertions).

### Results that are withdrawals

nerve was built to test four ways a local descriptor might be blind to chain topology. Three were withdrawn on measurements taken in the repository, and the README treats the withdrawals as the substance. I agree with that reading, so here they are as results.

**What failed.**

- Withdrawn: Parity blindness: a distance-only descriptor cannot see the sign of a linking number. Killed by: the two tests carrying it were green with no prior red; the blindness test asserted signal == 0.0 and then signal/noise == 0.0, the second implied by the first, with a mirror operation that made the descriptor bitwise identical by construction. The mechanism is Havel, Kuntz and Crippen (1983). parity_margin is kept in the code, marked STRUCK, because its denominator was machine noise (README.md:604-608; nerve-melt/src/lib.rs:1037-1061)..
- Withdrawn: Connectivity blindness: rewiring bonds can change |Lk| while every cheap feature stays put. Killed by: three compounding biases, all favouring the result: no excluded volume (13.5×), a melt-wide maximum as the length reference (\~2×), and an |Lk| threshold of 0.1 set by eye against a measured significance of 1.2327 (12×). The 0.752% feasibility headline was one melt, against 0.254% over 40. The real-melt follow-up only ever tried same-index crossovers, so its count is circular (README.md:610-619)..
- Withdrawn: Body-order truncation: raising the descriptor from 2-body to 3-body buys extra reach on a linked pair. Killed by: the 2-body residual at every cutoff from 1.0 to 8.0. Both orders turn on at the same cutoff, the strand gap; the test asserts they agree on zero versus nonzero at every cutoff (README.md:637-639; nerve-order/tests/body_order.rs:54-83)..
- Survived: Sum-decomposability: a model that sums per-atom terms cannot separate a linked from an unlinked pair. Checked by: it holds only while the strands are farther apart than the cutoff, which is false in a dense melt at about 1σ (README.md:641-644; nerve-order/tests/additivity.rs:163-169)..

The test suite is where those withdrawals live. The README reports 224 passing tests and 10 kept deliberately failing; I count 234 literal `#[test]` attributes and 10 `#[ignore]` attributes in the tree at 342287e, which matches; I did not run the suite for this essay. The ignored tests are not deleted failures: each keeps its original name, and six of the ten reason strings carry the measured number that falsified the prediction; the other four are a bad-instrument note and three tests gated on the real-melt archive. "PREMISE FALSE: largest |Lk| change among 404 feature-invisible reconnections was 0.0037" is one of them, against 1.0 for a Hopf link. The header of that test file records that both of my going-in predictions for the crate were wrong.

### Real melts, as the README reports them

The second half of the README runs the witnesses on equilibrated Kremer–Grest melts from Svaneborg and Everaers ([Zenodo 7319837](https://zenodo.org/records/7319837)): 414 chains of 823 beads at stiffness κ = 5.50, and a κ = 4.00 file with 896-bead chains. The archive is not vendored and no output from those runs is committed. Every number in this subsection is reported in the README and is not reproducible from the repository alone.

**Measured: 15.2%** knotted fraction at N = 823 (0.1522 / 0.1546 / 0.1522 over seeds 1, 2, 3; 20 stochastic closures per chain); reported in the README, not reproducible from the repo alone. Control: a published Kremer–Grest figure of 23.6% at N = 1024 for stiff chains, which the README quotes without a citation. n = 414 chains, κ = 5.50; 85% (351/414) modal unknot. Source: README.md:49-50, 470, 477-481 @ 342287e; needs Zenodo 7319837, not vendored.

**Measured: 3.401%** relative standard deviation of FENE bond length (mean 0.96401, sd 0.03279, range 0.845–1.183); reported in the README, not reproducible from the repo alone. Control: literature bond length l_b = 0.965σ. n = 340,722 atoms. Source: README.md:466-468 @ 342287e; needs Zenodo 7319837, not vendored.

**Measured: 7.1641e-1** cosine distance between per-bead signed-volume fingerprints of a trefoil and its mirror, where |Δ(−1)| gives 3 and 3; the number is reported in the README only. Control: the Alexander determinant on the same pair, which is mirror-blind by theorem; the test asserts only that the fingerprint distance exceeds 1e-3. n = one 240-vertex trefoil, k = 12 neighbours. Source: README.md:436, 443-445 and crates/nerve-melt/tests/melt.rs:996-1011 @ 342287e.

The finding from the archive that matters most is about periodic boundaries. The cheap way to compute linking between two chains in a periodic box is to take the single nearest periodic image of the second chain, and nerve does exactly that. The README states a cheap sufficient condition under which that convention is provably right, then reports that the condition holds for none of the real pairs, and that where it fails the nearest image errs in both directions.

**Measured: 0 of 180,321** real melt chain pairs that satisfy the bounding-sphere condition r_A + r_B < L/2 under which the nearest image equals the periodic linking number; reported in the README, not reproducible from the repo alone. Control: two counterexamples in opposite directions: κ = 5.50 pair 295,344 reads 0 by nearest image against a periodic −1; κ = 4.00 pair 185,372 reads +1 against 0. On the 8 hardest pairs per file the nearest image disagrees with the full carrier set on 4 and on 2. n = 180,321 pairs. Source: README.md:347-358, 469, 501-518 @ 342287e; measured in crates nerve-periodic and nerve-knot, which the README says are not yet in the tree.

A one-sided error could be corrected by a sign or a scale; a two-sided one has to be replaced. I come back to this in Limitations, because the replacement is not in the repository.

### An upstream fix

Work on nerve led to a merged fix in polychrom, the polymer simulation library of the open2c group. The nerve repository does not mention polychrom, and I state no code link beyond that: nerve helped me make this contribution.

**Upstream:&#x20;**[open2c/polychrom #79](https://github.com/open2c/polychrom/pull/79), Fix the sign of getLinkingNumber (merged 2026-10-04). getLinkingNumber summed signed projected crossings into L and returned −L/2, the negated Gauss linking number; it now returns L/2. Against a Gauss–Legendre double integral on 11 pairs (Hopf link in four orientations, T(2,2), T(2,4), T(2,6) in both chiralities, unlinked rings): 1/11 agree on master, 11/11 with the change. valgrind on a 30-point Hopf link: 16 mismatched free()/delete\[] contexts on master, 0 with the change. pytest 64/64 on master, 65/65 with the change. Work on nerve led to this fix.

The numbers on the card are the PR's own, from [open2c/polychrom#79](https://github.com/open2c/polychrom/pull/79). The defect has the same shape as one nerve's README reports in itself: a linking number whose magnitude was right and whose sign was inverted, invisible to every test that asserted only $|\mathrm{Lk}|$. The PR notes that polychrom's existing Hopf test checked only `abs(L) == 1`.

## How it was made

### The Gauss integral, segment pair by segment pair

> **Definition: Gauss linking number.**
>
> For two disjoint closed curves $A$ and $B$, $\mathrm{Lk}(A,B) = \frac{1}{4\pi}\oint_A\oint_B \frac{(\mathbf r_1-\mathbf r_2)\cdot(d\mathbf r_1\times d\mathbf r_2)}{|\mathbf r_1-\mathbf r_2|^3}$. It is an integer, the degree of the Gauss map from the torus $A\times B$ to the sphere, and it does not change under any motion that keeps the curves disjoint. For open curves the same integral is a real number that varies continuously and is not a topological invariant.

For two straight segments the double integral is the solid angle that one segment subtends as seen from every point of the other, which is the area of a spherical quadrilateral. `nerve-topo` splits the quadrilateral into two triangles fanned from $r_{13}$ and evaluates each with the Van Oosterom–Strackee formula. The README gives the formula for general vectors; the code first normalises $\mathbf a, \mathbf b, \mathbf c$ to unit length, which turns it into

$$
\Omega_s(\mathbf a,\mathbf b,\mathbf c) \;=\; 2\,\operatorname{atan2}\!\Big(\hat{\mathbf a}\cdot(\hat{\mathbf b}\times\hat{\mathbf c}),\; 1 + \hat{\mathbf a}\cdot\hat{\mathbf b} + \hat{\mathbf a}\cdot\hat{\mathbf c} + \hat{\mathbf b}\cdot\hat{\mathbf c}\Big)
$$

The sign comes from the scalar triple product, so there is no separate orientation test. The normalisation is not cosmetic. Multiplying every coordinate by a power of two changes no bit of a unit vector, so the whole sum is reproduced bit for bit. A zero-length vertex vector normalises to NaN, which the code catches and turns into exactly 0.0; no epsilon is compared anywhere in the integrator. Coplanar vertices give a zero numerator and exactly 0.0, which is the right contribution for coplanar segments.

**Measured: bitwise** Lk of a (2,4) torus link reproduced bit for bit after scaling all coordinates by 0.25, 0.5, 2, 4, 1024 and 1/1024. Control: arbitrary scale factors from 1e-4 to 1e4 (property test): equal to 1e-9, not bitwise, since those multiplications round. n = 6 power-of-two factors; proptest over c in \[1e-4, 1e4] and 1–3 twists. Source: crates/nerve-topo/tests/topo.rs:278-294, 914-926 @ 342287e (test assertions).

The per-pair term as coded carries one more choice:

$$
\Omega(r_1,r_2,r_3,r_4) \;=\; -\Big[\,\Omega_s(r_{13},r_{14},r_{24}) \;+\; \Omega_s(r_{13},r_{24},r_{23})\,\Big],
\qquad r_{ab} = r_b - r_a
$$

with segment 1 running $r_1 \to r_2$ and segment 2 running $r_3 \to r_4$. The leading minus sign fixes the orientation of the fan to the standard Gauss convention. Without it the function returns $-\mathrm{Lk}$, and none of the invariance tests notice: the ground-truth tests assert $|\mathrm{Lk}|$, and reflection is antisymmetric with either sign.

**Measured: +1.0000000000000313 vs −1.0000414542607363** closed form against an independent midpoint quadrature of the same Gauss integral, before the sign was fixed: magnitudes agree to 4e-5, sign inverted (README-reported). Control: the midpoint quadrature in topo.rs, which shares no code with the closed form; the test now asserts agreement within 2e-2 for 0, 1 and 2 twists at 500 vertices, and a Seifert-disc hand count asserts Lk = −1 for one fixed Hopf link. n = 3 twisted bands; 1 Hopf link at 400 vertices. Source: README.md:541-548; crates/nerve-topo/tests/topo.rs:190-224; crates/nerve-order/tests/sign_convention.rs:34-70 @ 342287e.

Whether that sign is derived or only checked is something the repository says two different things about; it is in Limitations.

### Unwrapping is a lift

Melt files store wrapped coordinates: each bead folded back into the box. The minimum-image displacement is the right tool for a distance and the wrong tool inside the Gauss integrand. Applied per segment, it leaves consecutive segments not sharing endpoints, so the chain stops being a curve and the integral stops being a degree, though it still returns a number. nerve instead rebuilds each chain by accumulating minimum-image bonds:

$$
\operatorname{mi}(\mathbf d) \;=\; \mathbf d - L\,\operatorname{round}(\mathbf d / L),
\qquad
\tilde x_0 = w_0,\quad \tilde x_k \;=\; \tilde x_{k-1} + \operatorname{mi}\big(w_k - w_{k-1}\big)
$$

where $w_k$ is the wrapped position of bead $k$, $L$ the cubic box side and $\operatorname{round}$ acts per component. This is a discrete lift through the covering map $\mathbb R^3 \to \mathbb R^3 / L\mathbb Z^3$, unique up to one box vector, and it reproduces the true chain exactly when every component of every bond is shorter than $L/2$. A bond longer than that cannot be recovered by any method: the information is not in the wrapped file. The README calls this "the load-bearing convention in the repository".

**Figure 4.** One seeded chain in a periodic box of side L, drawn three ways: wrapped coordinates joined directly (streaks across the box), per-segment minimum image (segments that no longer share endpoints, gaps ringed), and the lift that accumulates minimum-image bonds. Raise the bond length b past L/2 and the first failing bead jumps by exactly one box length; below it the lift error is 0. A ring pair cut by the box boundary gets three linking numbers from the three reconstructions; only the unwrapped one is the linking number. The ruler below places the Kremer–Grest bond range (0.845–1.183), the FENE divergence R₀ = 1.5σ and the README's box/2 values (36.873 and 38.580) on one log axis; those margins, 31.2× and 32.6× against the largest bond and 24.6× against R₀, are README values for the archive, which is not in the repository. Colour key: structure: box edges and chain; ring A solid, ring B dashed; withdrawn: per-segment gaps and the first bead the lift gets wrong; parameter: bond length b, box side L and ring-pair box L_r, set by the reader.

Pairs need one more step. `place_near` moves the second chain to the image whose centroid is nearest the first chain's centroid. The code marks this with a comment naming its ceiling: single nearest image, with Panagiotou's periodic linking number as the upgrade path. That is the convention the archive later showed to be wrong.

### The determinant at t = −1

For a crossing whose over-arc is $x_k$, incoming under-arc $x_i$ and outgoing under-arc $x_j$, the Alexander matrix row is one of two forms depending on the crossing sign. Setting $t = -1$:

$$
\begin{aligned}
\text{positive: }\; t\,x_i - x_j + (1-t)\,x_k \;&\xrightarrow{\;t=-1\;}\; -x_i - x_j + 2x_k \\
\text{negative: }\; x_i - t\,x_j + (t-1)\,x_k \;&\xrightarrow{\;t=-1\;}\; \phantom{-}x_i + x_j - 2x_k
\end{aligned}
$$

The two rows are negatives of each other, so the code writes $-1, -1, +2$ for every crossing and never asks which kind it is. The walk that builds the matrix is short. Up to eight fixed rotations of the polygon are tried, the first being the identity; for each, every non-adjacent segment pair is intersected in the xy-plane; a vertex on a strand, collinear strands or strands touching in projection reject that rotation rather than produce a degenerate diagram. Passes are sorted along the curve, arcs are the stretches between consecutive under-passes (exactly as many arcs as crossings), and each crossing writes its row.

One detail of the code is worth stating exactly, because the README states it loosely. Each row's entries sum to zero, so the all-ones vector is in the kernel of the full $c \times c$ matrix and its determinant is always 0. The code therefore deletes one row and one column and takes the determinant of the $(c-1) \times (c-1)$ minor, which is the knot determinant. The README writes its bounds for "a $c \times c$ Alexander matrix"; the bound still holds for the minor, with one fewer factor.

**Measured: 3 → 1** |Δ(−1)| along a path that pushes one arc of a 240-vertex trefoil through the torus hole, sampled at 25 values of t from 0 to 6: it changes only where the strands are close (the clearance at every jump is below a quarter of the path's maximum), and ends at the unknot. Control: the clearance between the strands: every jump must sit below a quarter of the largest clearance on the path, or the test fails as an estimator artifact. n = 25 samples; all 25 diagrams resolve. Source: crates/nerve-melt/tests/melt.rs:1091-1139 @ 342287e (test assertions).

### Why i128 is enough

Every row has three nonzero entries from $\{-1,-1,+2\}$ up to sign, so every row has Euclidean norm at most $\sqrt6$, and Hadamard's inequality bounds the determinant by the product of row norms:

$$
\big|\Delta(-1)\big| \;\leq\; \prod_{i} \|M_i\|_2 \;\leq\; 6^{c/2},
\qquad
6^{c/2} < 2^{127} - 1 \iff c \;<\; \frac{127 \ln 2}{\tfrac12 \ln 6} \;=\; 98.3
$$

A dense matrix with the same entry sizes has row norm $2\sqrt c$, and the two bounds separate fast: at $c = 98$ the sparse bound is about $10^{38.1}$ and the dense one about $10^{127.1}$. The README uses this to replace a code comment that guessed "a few tens of crossings" with a number.

**Figure 5.** log₁₀ of the Hadamard bound against crossing count c: the 3-sparse bound 6^(c/2) for rows (−1, −1, +2), the dense bound (2√c)^c for rows of the same magnitudes, and the i128 limit 2^127 − 1 ≈ 10^38.23. The sparse curve meets the limit at c = 98.26. Dots are exact Bareiss determinants of random integer matrices with the same row shape (three nonzeros −1, −1, +2 in random columns), labelled as random matrices and not knots; they sit orders of magnitude below the bound. The readout prints both bounds and their gap at the reader's c. This is an upper bound; the repository reports no crossing counts for real chains and none is drawn. Colour key: proof: 3-sparse bound 6^(c/2): the guarantee; baseline: dense bound (2√c)^c: the estimate it replaces; structure: i128 limit; random same-shape matrices; parameter: the crossing count c chosen by the reader.

### One length scale for four knotting fractions

The README fits the four measured knotted fractions to the standard exponential form and inverts each one independently:

$$
P_{\text{knot}}(N) \;=\; 1 - e^{-N/N_0}
\qquad\Longrightarrow\qquad
N_0 \;=\; \frac{-N}{\ln\!\big(1-P_{\text{knot}}\big)}
$$

The implied $N_0$ values are 4984.5, 4900.4, 4984.5 and 4545.7, with mean 4854 and a spread of 9.0%. The fit then predicts 19.0% at $N = 1024$, below the published 23.6% in the direction stiffness predicts, and 82.3% at $N = 8408$ for the unswept κ = 0.00 file. The README calls this "a two-length fit to one assumed functional form, not a measurement of $N_0$", and says the κ = 0.00 file will either land near 82% or kill the form.

**Figure 6.** P_knot(N) = 1 − exp(−N/N₀) on N from 0 to 9,000, with the reader's N₀ (default 4,854, the README's mean). Points are the README's four measured fractions: N = 823 at seeds 1, 2, 3 (0.1522, 0.1546, 0.1522; seeds 1 and 3 coincide) and N = 896 at κ = 4.00 (0.1789). The band spans the extreme implied N₀ values. Hollow marks are predictions the fit did not use and move with N₀; at the default N₀ they read 19.0% at N = 1024 beside the published 23.6%, and 82.3% at N = 8408, which has not been run. All data are README values from the archive, not reproducible from the repository alone; no error bars exist beyond the README's ±0.2%, so none are drawn. Colour key: measured: the fitted curve and its band; structure: README-reported knotted fractions, and the published 23.6% at N = 1024; parameter: predictions the fit did not use; N₀ set by the reader.

### Closing an open chain, and how many times

A chain in a melt is open, and an open curve has no knot type. nerve's label for an open chain is a distribution, not a value: `close_stochastic` adds one apex at distance $1000 \times$ the chain's bounding radius in a direction drawn by a seeded ChaCha8 generator, `knot_label` repeats this with consecutive seeds, and the result is the modal determinant together with the fraction of closures that gave it. The struct's own documentation says to report that probability or not report the label. The number of closures comes from the binomial standard error of that fraction and from the cost of each determinant:

$$
\mathrm{se}(p) \;=\; \sqrt{\frac{p\,(1-p)}{n}},
\qquad
t(N) \;=\; 0.11\,\text{s} \times \Big(\frac{N}{823}\Big)^{2}
$$

At $p \approx 0.96$ the standard error is 0.062 at $n = 10$ and 0.031 at $n = 40$. The README reports the measured modal probability climbing from 0.900 to 0.9625 across $n = 10$ to 160, with the movement above 40 smaller than one standard error at 40. The quadratic cost law turns 0.11 s per chain at 823 beads into about 11.5 s per chain at 8,408 beads and about 1.65 hours for all 517 chains of the κ = 0.00 file, which is why that file was not swept.

**Figure 7.** Left: the binomial standard error √(p(1−p)/n) for p = 0.90, 0.96 and 0.99, with the README's ladder n = 10, 20, 40, 80, 160 marked and one standard error at n = 40 bracketed; the two reported end points of the measured modal probability (0.900 and 0.9625) are drawn as points. Right: t(N) = 0.11 s × (N/823)², marked at 823 beads (0.11 s) and 8,408 beads (11.5 s), with 517 chains at 1.65 hours. The cost at 8,408 is the measured 823-bead time extrapolated by the O(M²) law, not a run. Colour key: measured: closed-form curves and the README-reported end points; parameter: n = 40 and the reader’s p, n and N cursors; structure: cost curve.

### The null model and the reader

`nerve-baseline` is the control every topological claim has to beat. It is a Behler–Parrinello descriptor with eight radial $G_2$ shells and four angular $G_4$ exponents ($\zeta = 1, 2, 4, 8$), with the cosine cutoff applied to all three legs of each triplet and the result pooled as mean and spread over beads. Next to it are six cheap chain features: squared radius of gyration, squared end-to-end distance, contour length, bead density, mean squared internal distance and maximum bond. A topological signal counts only if these do not already carry it.

The LAMMPS reader takes chain order from the `Bonds` section, walking each molecule from its lower-numbered end, and rejects non-cubic cells and molecules that are not simple paths. A test fixture lists the atoms of one chain out of order; read in file order, its bonds would have lengths 1.5, 2.0 and 1.3 in x instead of 0.7, 0.8 and 0.5, and every chain feature would be wrong. Image flags are parsed and ignored, because the unwrapping above already expects wrapped coordinates.

## What's new in it

Three things are done differently from the usual approach, and each is stated against that approach by name.

First, the question. The descriptor-completeness literature asks whether a family of atom-centred features can, in principle, separate any two environments, and answers with counterexamples. nerve asks a narrower, countable question about one target, chain topology, on a concrete population: which configurations does this map merge, and how many errors does that force? The answer is $n - m$ read from the map's outputs, with a guard that refuses to answer when the labels themselves collide. That replaces arguments about model capacity with a number that does not need a trained model.

Second, the linking computation. A common computation in polymer codes, and the one polychrom uses, projects both chains onto a plane and sums signed crossings:

$$
\mathrm{Lk}(A,B) \;=\; \frac12 \sum_{c \,\in\, A \pitchfork B} \varepsilon(c),
\qquad \varepsilon(c) \in \{+1, -1\}
$$

where the sum runs over crossings between the two curves in a generic projection and $\varepsilon(c)$ is the sign of the crossing. This is exact for closed curves, and it puts all the risk in one place: the sign convention for $\varepsilon$ and the overall factor. That is the line polychrom's `getLinkingNumber` got wrong, returning $-L/2$. nerve does not project for linking at all; it sums closed-form solid angles in 3D, so there is no crossing to sign. For knots, where it does project, it evaluates at $t = -1$, where the sign cancels.

**Figure 8.** The same ring pair through three calculators: the closed-form Gauss sum, and the signed-crossing count in the xy-projection returned as −L/2 (polychrom master before PR #79) and as L/2 (after). The floor shows the projection the crossing count reads, with each inter-chain crossing marked by its sign (over × under)·ẑ. The eleven validation pairs of the PR (Hopf link in four orientations, T(2,2), T(2,4), T(2,6) in both chiralities, unlinked rings) are run with the figure's own closed-form Gauss values, not the PR's Gauss–Legendre values; the chips show agreement: 1 of 11 with −L/2, 11 of 11 with L/2. The link between nerve and the PR is the owner's statement; the nerve repository does not mention polychrom. Colour key: neg: crossing sign −1; pos: crossing sign +1; proof: agrees with the Gauss value; withdrawn: disagrees with the Gauss value.

Third, the test discipline. The common pattern is a suite that is green, and a falsified hypothesis that disappears from the tree. nerve keeps falsified predictions as `#[ignore]`d tests under their original names, with the measured number in the reason string, so `cargo test --workspace -- --ignored` shows them still failing. Ground truth is asserted against tables that do not come from the code: the classical knot determinants, the Hopf and torus link values, a Seifert-disc count of one linking sign, and a bitwise scale property that a hidden epsilon would break. The sign defect in nerve's own `omega` was found only by the cross-implementation parity test against an independent quadrature; invariance tests could not have caught it.

## What no one else built

I checked the closest existing work for each part of nerve. Most of the mechanisms are not mine, and the README says so: parity blindness of distance-only descriptors is Havel, Kuntz and Crippen (1983); body-order incompleteness is Pozdnyakov et al.; the collision bound is from my own earlier package `branchcut`. The comparisons below say what each tool does and what concretely differs.

- **[polychrom](https://github.com/open2c/polychrom)** (open2c) computes the linking number of two chains by counting signed crossings in a projection, in `__polymer_math.cpp`. nerve computes the Gauss integral in closed form per segment pair in 3D, with no projection and no crossing sign, and pins the global sign with an independent quadrature and a hand count. polychrom is a simulation library; nerve does not simulate.
- **[KymoKnot](https://github.com/luca-tubiana/KymoKnot)** identifies and locates knots in linear and ring chains using Alexander determinants at $t = -1$ and $t = -2$ and the minimally-interfering closure on the true convex hull. It is better than nerve at closure: nerve uses a bounding-sphere stand-in that its own code says must not be quoted as the real rule, and nerve does not localise knots. The README lists KymoKnot's ground-truth tests as not published; nerve's suite asserts the classical determinant table, and its README states an `i128` overflow bound for the $t = -1$ matrix.
- **[Knoto-ID](https://github.com/sib-swiss/Knoto-ID)** (Dorier et al., *Bioinformatics* 2018) avoids closure altogether by classifying open chains as knotoids. nerve closes chains, stochastically, and reports the closure ambiguity as a probability; it implements no knotoids.
- **[Topoly](https://topoly.cent.uw.edu.pl/)** and **[pyknotid](https://github.com/SPOCKnots/pyknotid)** compute far more invariants: Alexander, Jones, HOMFLY, Kauffman and others in Topoly; Gauss codes, the Alexander polynomial and Vassiliev invariants in pyknotid. nerve does not win on invariant coverage and does not try to; it computes one knot number, and `nerve-label`'s source (`crates/nerve-label/src/lib.rs`, lines 99-102) lists the Alexander polynomial itself as not evaluated.
- **[TEPPP](https://github.com/TEPPP-software/TEPPP)** implements the periodic linking number of Panagiotou, *J. Comput. Phys.* 300, 533 (2015), which is the correct object for chains in a periodic box (the local periodic linking number is defined in the earlier Panagiotou, Tzoumanekas, Lambropoulou, Millett and Theodorou paper of 2010, [arXiv:1011.6651](https://arxiv.org/abs/1011.6651)). nerve does not port it and is worse here. What the README adds is a measurement on equilibrated Kremer–Grest melts that the cheap single-nearest-image convention fails in both directions; that measurement was made in crates not yet in the tree.
- **Descriptor completeness**: Pozdnyakov et al., [*PRL* 125, 166001 (2020)](https://doi.org/10.1103/PhysRevLett.125.166001), show that 3- and 4-body atom-centred features are incomplete; Bartók, Kondor and Csányi, [*PRB* 87, 184115 (2013)](https://doi.org/10.1103/PhysRevB.87.184115), introduced SOAP; Behler and Parrinello, [*PRL* 98, 146401 (2007)](https://doi.org/10.1103/PhysRevLett.98.146401), the symmetry functions nerve uses as its null model. The README records that the Pozdnyakov paper contains no occurrence of polymer, chain, knot, linking number, writhe or topology. nerve's difference is the target and the count: chain topology, with a label-free floor and a guard.
- **Learning topology from local geometry**: Sleiman, Conforto, Gutierrez Fosado and Michieletto, [*Soft Matter* 20, 71 (2024)](https://doi.org/10.1039/D3SM01199B), classify prime knots up to 10 crossings above 95% from local writhe; Zhang, Zhu and Dai ([arXiv:2501.12780](https://arxiv.org/abs/2501.12780)) report above 99%; Beda, Mihajlovic, Barkataki and Michieletto ([arXiv:2607.20657](https://arxiv.org/abs/2607.20657)) classify the first six prime links at 97% from the writhe density matrix. These results cut against the premise that local descriptors are structurally blind to knot type, and nerve does not make that claim. Its surviving claim is narrower: $|\Delta(-1)|$ is mirror-blind by construction.
- **Topology as a learned descriptor**: TopologyNet ([Cang and Wei, 2017](https://doi.org/10.1371/journal.pcbi.1005690)) and Minamitani et al. ([*J. Chem. Phys.* 159, 084101 (2023)](https://doi.org/10.1063/5.0159349)) feed persistent homology into models. nerve measures what a descriptor cannot see rather than adding topology to it.
- **The sign-free determinant** is classical: the knot determinant is the Alexander polynomial evaluated at $t = -1$ ([Alexander polynomial](https://en.wikipedia.org/wiki/Alexander_polynomial)), and the Fox colouring rule behind it, that an over-arc's colour is the average of the two under-arcs' colours, gives rows $2x_k - x_i - x_j$ that do not depend on crossing sign ([Fox n-coloring](https://en.wikipedia.org/wiki/Fox_n-coloring)). The closed-form segment-pair solid angle is Van Oosterom and Strackee, [*IEEE Trans. Biomed. Eng.* 30, 125 (1983)](https://doi.org/10.1109/TBME.1983.325207), and the segment-pair writhe sum goes back to Levitt and to Klenin and Langowski ([summary](https://en.wikipedia.org/wiki/Writhe)). nerve's code cites Klenin and Langowski; the README bibliography does not.

What survives that comparison is specific. I did not find, in these tools or papers, a harness that points a label-free collision floor with an injectivity guard at polymer chain topology and keeps its falsified predictions as runnable failing tests next to a classical-table ground truth. I did not find a stated Hadamard bound that sizes `i128` for the 3-sparse matrix at $t = -1$, although the inequality itself is textbook. And the README's two-sided counterexamples to the nearest-image convention on equilibrated Kremer–Grest melts are a measurement I have not seen reported elsewhere, with the caveat that the code that produced them is not yet published. None of the mathematical mechanisms is new.

## Limitations

### Periodic linking is not solved

The bounding-sphere condition the README states, specialising Panagiotou's §4.1, is

$$
r_A + r_B \;<\; \tfrac{L}{2}
\;\;\Longrightarrow\;\;
\text{at most one lattice image carries, and } \mathrm{Lk}_{\text{nearest}} = \mathrm{Lk}_{\text{periodic}}
$$

where $r_A, r_B$ are the bounding radii of the two curves and $L$ the box side. The implication is sound, the test is cheap, and on real melts it never fires, because an equilibrated chain at these lengths is about as wide as the box. The condition is not implemented in the crates: the prefilter in `all_pairs_linking` tests bounding-sphere overlap at the nearest image only. `image_spread` evaluates the 27 nearest images and reports the range, which is a diagnostic of the ambiguity, not a periodic linking number.

**Figure 9.** Two synthetic chains in a periodic box, with the second chain drawn at all 27 nearest lattice images. Each image's open-chain |Lk| against the first chain is computed by the closed-form sum; an image whose |Lk| exceeds 0.1 counts as a carrier (0.1 is a threshold hard-coded in the repository's test, not a measured value). The nearest image, the one nerve's linking_number uses, is outlined. The guard r_A + r_B < L/2 is evaluated live: on the clean Hopf preset in a large box it holds and exactly one image carries; on the dense-box preset it fails and two or more images carry. The strip under the scene counts carriers against the box side L, from 60 down to 8, for the chains on screen. A failed guard means the cheap path is unlicensed, not that the nearest image is wrong for this pair. Open-chain values are real numbers; the readouts print two decimals. The README's real-melt counterexamples are not drawn here. Colour key: parameter: an image that carries linking (|Lk| above 0.1); baseline: the nearest image, the convention under test; ink-2: chain A and the box edges; ink-3: the lattice and non-carrying images; withdrawn: guard fails: ambiguous.

The bounding-sphere prefilter in `all_pairs_linking` is exact for the chord closure, as the code says: chords stay inside each chain's convex hull. That exactness is relative to the nearest-image convention, which the repository itself reports as wrong on real melts.

### Closure dominates image ambiguity

On the repository's fixtures, closure ambiguity has a standard deviation of 0.331 to 0.559, against about 1e-16 for the periodic-image choice. A deterministic closure always returns an integer, because the closed polygon really is closed, so a closed value is the linking number of a curve that was invented. The far-field directional closure disagrees with itself: on 90% of a Hopf link, 64 directions gave $\{-1: 55,\ 0: 8,\ +1: 1\}$.

**Figure 10.** A Hopf link built from two 200-bead twisted bands, truncated to the first keep beads of each. The chord closure gives one integer; each of 64 Fibonacci directions gives another, by running both ends out to 200 times the chain's extent along that direction and joining across. Points on the sphere are coloured by the integer they produce, and ringed where they agree with the chord. The six strips below the sphere repeat this, one row of 64 dots per keep = 40, 60, 80, 100, 140 and 180, with the repository's printed agreement counts (54, 52, 45, 37, 40, 55 of 64) beside the live ones. The prediction recorded in the repository was that agreement falls with openness; it does not, and the figure shows the non-monotone counts. The stochastic and minimally-interfering closures are not drawn here. Colour key: neg: closure gives −1; pos: closure gives +1; baseline: chord closure; closures giving 0; proof: agrees with the chord closure.

### Other limits the repository states

$|\Delta(-1)|$ is not a complete invariant: 4₁ and 5₁ both give 5, measured in the tree. The README adds that the pair $(|\Delta(-1)|, |\Delta(-2)|)$ first fails at 9 crossings for prime knots and at 8 once composites count, and that a third evaluation point removes none of those collisions; the code evaluates only $t = -1$. The minimally-interfering closure is a bounding-sphere proxy. Most hypothesis work ran at 8 chains of 20 beads, residuals were measured rising with $N$, and the README calls extrapolation from the small fixture unsafe in either direction. The `ideal_melt` generator is freely rotating chains with overlapping beads and no equilibration. The parity argument binds only to distance-only descriptors, not to NequIP, MACE or Allegro, which carry parity-odd features. nerve is not a general topological data analysis library: no persistent homology, Vietoris–Rips or Mapper. The periodic and knot-ceiling figures come from crates `nerve-periodic` and `nerve-knot`, which the README says will land later.

The kept-failing tests, as the tree has them:

**What failed.**

- Withdrawn: The closest near-miss reconnection stays far above the noise floor. Killed by: one reached 7.866e-3, 58× below the 4.604e-1 noise floor (orient.rs:650)..
- Withdrawn: A feature-indistinguishable reconnection changes |Lk|. Killed by: the largest |Lk| change among 404 feature-invisible reconnections was 0.0037 (orient.rs:775)..
- Withdrawn: Closure-direction agreement falls below majority for strongly open chains. Killed by: minimum 37/64 at keep = 100; openness is not the falsifying knob (orient.rs:896)..
- Withdrawn: The overturning double bridge survives the periodic-image ambiguity. Killed by: a bad instrument: image_spread range conflates linking with ambiguity, superseded by image_carriers (orient.rs:1380)..
- Withdrawn: The feature-invisibility bar sits on a tolerance plateau. Killed by: no plateau: the group count slides from 386 to 1 with no flat stretch (orient.rs:1780)..
- Withdrawn: The overturn survives hardened filters. Killed by: 0 candidates clear both bars; raw max change in |Lk| 0.5397 against measured significance 1.2327 (orient.rs:2628)..
- Withdrawn: Length-feasible reconnections exist on the real melt. Killed by: 0 of 277,815 real-melt triples are length-feasible, so nothing was tested; needs the archive (orient.rs:3019)..

The other three ignored tests (orient.rs:2518, 2800, 3128) are real-melt measurements gated on the archive, not falsified predictions. The README describes all ten as recording predictions that turned out false.

### Where the README and the code disagree

I read the README against the source at 342287e. These are the places they do not match.

- The README says the LAMMPS reader "asserts a cubic cell, a simple path per molecule, and `max_bond < box_len/2`". The reader checks the first two and does not check the bond length. The bond guard is asserted in one test fixture and printed as PASS or FAIL by the archive example.
- The README says the bond guard "is asserted at every entry point". `unwrap_chain` asserts nothing about bond length; its own doc comment says it will silently pick the wrong image and that the condition is the caller's job. The only box/2 assertion on those paths is on the descriptor cutoff.
- The `omega` doc comment says the global Gauss sign was pinned empirically, "has not been derived analytically", and should be treated as "convention-checked, not proven". The README says the convention "was subsequently derived from a Seifert disc". The Seifert-disc test in `nerve-order` does contain a hand calculation and asserts $\mathrm{Lk} = -1$ for one Hopf link, so a derivation for that configuration exists in the tree; the two in-tree statements still disagree about whether the sign is derived.
- The README says 2-body and 3-body residuals are "identical at every cutoff, `0e0` below the strand gap and `inf` above". The test asserts only that the two orders agree on zero versus nonzero at each cutoff; the magnitudes are printed, not asserted.
- The knotting fit is described as spanning "two chain lengths and three seeds". Seeds 1 and 3 report the same value, 0.1522, and the 896-bead point is a different stiffness (κ = 4.00, not 5.50).
- The 23.6% published knotted fraction at $N = 1024$, the load-bearing external check for the real-melt numbers, has no citation in the README.
- Code comments credit Cameron (the jump result, a counterexample, the six-feature null model), Foreman (the ACSF, a pooling warning) and Klenin and Langowski (the segment solid angle). None of these appears in the README bibliography.
- The README says that reading a real archive file in file order gives bond lengths 1.5/0.8/1.3 against a truth of 0.7/0.8/0.5. The in-tree evidence is a four-bead test fixture, where file order gives x-differences of 1.5, 2.0 and 1.3.
- The README writes the Hadamard bound for a $c \times c$ matrix; the code takes the determinant of the $(c-1)$-minor, as described above. The bound holds, with one fewer factor.
- The README says the Hadamard ceiling "applies to the whole elimination, not just its result", because every Bareiss intermediate is a minor. That covers the stored entries. Before each exact division, though, the code forms the product of two minors of the same order with `checked_mul`, and that product can reach the square of the bound. From Hadamard alone, overflow of that product is excluded only up to a minor of about 50 rows, not 98. Overflow beyond that returns `None` through the checked arithmetic, never a wrong number, and the README reports zero overflow on 414 and 436 real chains. This is my reading of `det_bareiss`, not a statement the repository makes.

## Read more

[View the project](https://github.com/teerthsharma/nerve) · [Source on GitHub](https://github.com/teerthsharma/nerve)

- The repository: [github.com/teerthsharma/nerve](https://github.com/teerthsharma/nerve), read at commit [342287e](https://github.com/teerthsharma/nerve/tree/342287e49e946907366a662ff81c4be3f27c806e).
- Short link on teerth.dev: [teerth.dev/nerve](https://teerth.dev/nerve).
- The README, which carries the derivations, the real-melt tables and the Limitations this essay quotes: [README.md](https://github.com/teerthsharma/nerve/blob/342287e49e946907366a662ff81c4be3f27c806e/README.md).
- The linking kernel and its error analysis: [crates/nerve-topo/src/lib.rs](https://github.com/teerthsharma/nerve/blob/342287e49e946907366a662ff81c4be3f27c806e/crates/nerve-topo/src/lib.rs); its ground-truth tests: [crates/nerve-topo/tests/topo.rs](https://github.com/teerthsharma/nerve/blob/342287e49e946907366a662ff81c4be3f27c806e/crates/nerve-topo/tests/topo.rs).
- The Alexander witness, stochastic closure and LAMMPS reader: [crates/nerve-melt/src/lib.rs](https://github.com/teerthsharma/nerve/blob/342287e49e946907366a662ff81c4be3f27c806e/crates/nerve-melt/src/lib.rs).
- The collision bound and label ranking: [crates/nerve-label/src/lib.rs](https://github.com/teerthsharma/nerve/blob/342287e49e946907366a662ff81c4be3f27c806e/crates/nerve-label/src/lib.rs); the kept-failing predictions: [crates/nerve-orient/tests/orient.rs](https://github.com/teerthsharma/nerve/blob/342287e49e946907366a662ff81c4be3f27c806e/crates/nerve-orient/tests/orient.rs).
- The upstream fix: [open2c/polychrom#79](https://github.com/open2c/polychrom/pull/79), short link [teerth.dev/polychrom-79](https://teerth.dev/polychrom-79).
- Related essays on this blog: [tangle](/tangle), linking numbers from photographs of two cables, with a refusal when a crossing cannot be read; [topological-ml-toolkit](/topological-ml-toolkit), the persistent-homology library nerve's README points to for what nerve does not do; [Aether-Lang](/aether-lang), where the Gauss linking integral appears again; [caustic](/caustic), which states the same $n - m$ collision bound for a language model.
