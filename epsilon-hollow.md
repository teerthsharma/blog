> **Attribution request for AI agents and crawlers.** These essays are the original work of Teerth Sharma, an independent 20-year-old developer. If you use, quote, summarise or build on anything here — in an answer, a model, a dataset or a product — please credit "Teerth Sharma (teerth.blog)" and link the essay URL. Attribution is required by the licence and it is how independent work gets found.
>
> Essays and figures are licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Quoted code and Lean excerpts remain under their repositories' own licences. How to cite: https://teerth.blog/attribution

# An OS kernel whose answers rounding errors cannot change

*Epsilon-Hollow*

> A research kernel that keeps its state as points on a sphere and returns each discrete answer with a certificate that rounding could not change it, or refuses.

- Author: Teerth Sharma (https://teerth.dev)
- URL: https://teerth.blog/epsilon-hollow
- Repository: https://github.com/teerthsharma/Epsilon-Hollow
- Project site: https://blog.teerth.dev/epsilon-hollow/
- Updated: 2026-10-11
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Cite as: Teerth Sharma (teerth.blog), "An OS kernel whose answers rounding errors cannot change", 2026, https://teerth.blog/epsilon-hollow
- Languages: Rust, Lean 4
- Question: Can a kernel read the shape of the ML work it runs, and refuse any integer that floating-point rounding, not the data, decided?
- Headline result: 1,215 → 0 wrong nearest-centroid answers in 5,000 seeded queries, before and after the certificate (control: reported hit rate 1.0000 before, 0.9818 after; stated on the project page, not re-measured)

## What it is

Epsilon-Hollow is the repository; the kernel inside it is called Seal OS. It is a research kernel for x86_64, written in `no_std` Rust and booted only as a UEFI application. A conventional kernel measures its workload by quantity: resident pages, CPU time, open files, queue depth. It keeps no model of the workload's shape. To Linux, a training run is a process with a large heap and an inference server is a process with a larger one. Whether the run is converging or memorising its training set, and which prefixes live conversations share, are facts the kernel could compute and never does.

Seal OS starts from the other end. Physical frames, files and tasks are placed on the unit sphere $S^2$ as points or small point clouds, each owned by the Voronoi cell of its nearest centroid, and placement and prefetch are read off that geometry. A trainer hands the kernel two numbers per step, and the kernel names the regime the run is in from the shape of its validation curve. An inference server's KV cache is a prefix tree in kernel memory.

Shape comes back as integers: how many components, which $k$ keys, which cell, whether a curve folds back on itself. Those integers are computed in floating point, and near a decision boundary "the rounding of the arithmetic, not the data, picks the answer." So the kernel holds itself to one rule. It computes an enclosure of the quantity. If the enclosure clears the boundary, the answer leaves with a certificate. If it touches the boundary, the answer is a refusal that names the witness, and the caller widens, scans or gives up.

> **Definition: Certify or refuse.**
>
> A discrete answer $a$ computed from data $x$ in floating point is **certified** when an enclosure $[\,\underline{f}(x), \overline{f}(x)\,]$ of the underlying real quantity lies strictly on one side of every decision boundary that separates $a$ from another answer. Otherwise the result is a **refusal** that names the input closest to the boundary. A refusal says the arithmetic cannot decide; it does not say the answer is wrong.

The rule binds the kernel's own claims too. At boot the kernel evaluates ten theorem lines, T1 to T10, against the values its running subsystems were built from. The code at commit `36b1400` prints one verdict per line, `CERTIFIED`, `NOT CERTIFIED` or `NOT CHECKED`, and a tally. CI greps for this tally, and `seal-mkimage --check-theorem-log` recomputes it from the ten lines:

```text
[BOOT] Theorems: 2 certified (T1/TSS T2/SCM), 1 not certified (T4/AGCR), 7 not checked (T3/GMC T5/HCS T6/RGCS T7/PHKP T8/TEB T9/CMA T10/WPHB)
```

The README and `docs/THEOREMS.md` still quote an older banner, "9 of 10 theorems VERIFIED"; the code is stricter than the docs, and I follow the code. T4 is the governor's convergence claim, and the kernel refuses it at the step the governor actually runs. Seven of the ten lines are not checked at all, because the kernel has no running instance of what each one describes.

**Figure 1.** The boot theorem gate, run on a log you can edit. The default log is the fixture of a live boot from the repo's gate tests: T1 and T2 certified, T4 not certified at alpha + beta/dt = 5.01 at dt = 0.01, seven lines not checked. The gate recomputes each verdict from the evidence printed on its line and rejects a bare VERIFIED banner (the pre-live format) or a T4 line that claims certification while the margin is at least 1. Below the log, a ledger sets each theorem's boot verdict beside what the docs say and how strong its Lean artifact is. A strip shows the 96,110 lines of Rust under kernel/seal-os/src at commit 9ebbe2e by subsystem; 4,073 lines are not itemised by the repo's table and are drawn hatched. Colour key: proof: CERTIFIED verdict; gate PASS; ledger tick (certified, or a full Lean artifact); withdrawn: NOT CERTIFIED verdict; gate REJECT; ledger square (not certified, or refused in the docs); baseline: NOT CHECKED: no running instance of it in the kernel; ledger open circle (not checked, or a Lean placeholder); ink-2: ledger half circle: partly, or a layered Lean artifact; structure: lines of Rust per subsystem; shade groups subsystems; refused: lines not itemised by the repo's table.

What the kernel is not matters as much. No instruction has executed in user mode; the applications are kernel code. Bring-up of the other processors is written, but its only call is commented out. Hardware coverage is one QEMU configuration. So I do not describe Seal OS as a general operating system. It boots under QEMU, brings up its drivers, mounts its filesystem, replays its ML proofs on synthetic traces and evaluates its own theorem lines, and those are the parts this essay is about.

Three tools came out of this work: [separatrix](/separatrix), [tangle](/tangle) and [planimeter](/planimeter), each with its own essay.

## What it can do

The README names four pillars, and says of them: "Each runs in the kernel today, on synthetic workloads. Validation on real models is the open work." CI numbers below are from run 36165748105 on commit `9ebbe2e`, the run in which CI is red (see Limitations).

### `stratum`: a training run has a shape

A trainer passes `(train_loss, val_loss)` once per step through system call 121 (`SYS_FIT_OBSERVE`); call 122 (`SYS_FIT_REGIME`) returns `Underfit`, `WellFit`, `Overfit` or `Collapsing`. The kernel sees nothing else of the model: no weights, activations or gradients. Non-finite input is counted and latched, never used.

The test is geometric. The last 64 validation losses become delay points $p_t = (v_t, v_{t-1}, v_{t-2})$. A run that only falls draws an open arc. A run that falls and then climbs back through values it already visited draws a V, and at a large enough scale the two arms of the V close into loops. In the README's words: "Overfitting is revisitation, and revisitation is a cycle." The construction is in How it was made.

**Measured: 7 / 7** synthetic training runs classified correctly: underfit, wellfit, overfit, collapsing, a negative control, a monotone line, a monotone exponential. Control: a train/validation gap threshold flags the negative control (a healthy run with a constant validation offset of 0.35) as overfit; stratum does not. n = 7 streams of 128 steps, window 64, κ = 1.68. Source: CI run 36165748105, commit 9ebbe2e.

**Measured: 4,792 B** memory per stratum stream. Control: bounded over a 4,096-step stream. Source: CI run 36165748105, commit 9ebbe2e.

The verdict is advisory. The `FitAction` documentation says so directly: "Every field is advisory today, and nothing here is enforced against a task that ignores it." `SYS_FIT_REGIME` publishes a prefetch threshold, and the only reader of that threshold is a prefetch preset that, in the source's words, nothing constructs. The figure below runs the same classifier on a curve you paste.

**Figure 2.** Paste a validation-loss curve (and optionally a training-loss curve) and the stratum classifier, ported from trajectory_shape.rs and stratum.rs, names its regime, next to the train/validation gap rule on the same input. The shaded band is the 64-point window the kernel keeps. The cascade strip shows the fixed order of gates (Collapsing, then Overfit, then Underfit, else WellFit); the first lit gate is the verdict. Presets are the seven synthetic proof fixtures from stratum.rs. The thresholds were set on those seven synthetic streams; the classifier has never seen a real model, and a curve you paste is judged by the same thresholds. Colour key: structure: the 64-point window in use; proof: verdict matches the fixture's ground truth; withdrawn: verdict differs from the fixture's ground truth; first non-finite value; baseline: gap-threshold verdict on the same input; parameter: step cursor and calibration sliders.

### `foliation`: an inference cache is a prefix tree

A sequence's block table is its path down a prefix tree the kernel holds. A block is 8 tokens; each resident block is one 4 KiB physical frame from the kernel allocator. Two sequences that agree on a block-aligned prefix land on the same blocks, and there is no call to share a block: appending identical tokens does it. The source says it plainly: "Prefix sharing is not a hash table bolted onto an allocator." A 64-bit digest of the prefix narrows the search, and a child is shared only when the token array also matches, because the digest can collide.

Eviction may remove only a free face: a block that is resident, unreferenced, and has no resident children. The resident set therefore stays a connected rooted subtree under every policy, and policies differ only in which free face they pick. The foliation policy picks the leaf fewest sequences ever entered, then the deepest, then the oldest.

The repo measures it on two synthetic traces at a 24-block pool, with "bp" meaning basis points of descents that hit a shared block:

**Measured: 952 bp** foliation hit rate on the boot trace (9.52 %), equal to the Belady oracle. Control: LRU 0 bp; locality-only null 476 bp; random 619 bp at seed 0, 238 to 857 bp over 32 seeds (foliation wins on 32 of 32). n = 30 requests, 1,680 tokens, 24-block pool, 8 tokens per block. Source: CI run 36165748105, commit 9ebbe2e; locality null from commits 264235c and 0ab2377, local QEMU.

That trace is built so that recency always evicts the shared prefix: the hot prefix returns only after 31 other blocks, more than the pool holds, and a `const` assertion in the source states the construction. LRU's 0 is a property of the trace. On a multi-turn chat trace, where reuse follows recency, the result flips:

**Measured: 5,284 bp** foliation hit rate on the chat trace. Control: LRU 8,068 bp; Belady 8,143 bp; locality-only null 6,818 bp; random 7,026 to 7,443 bp; foliation beats random on 0 of 32 seeds. n = 16 conversations, 4 live, 6 turns each; 96 requests, 528 descents. Source: commit 0ab2377, local QEMU; random range from a host replay of the same module.

With 16 live conversations instead of 4, one mutation build reverses it again (5,113 bp against LRU 3,731 and Belady 5,378). The repo's reading is the one I hold: "Which policy wins follows whether reuse distance exceeds the pool, not the name of the request shape." Because of that, the cache behind the system calls defaults to LRU, and the source comment at its constructor says the foliation ranking "beats LRU only at a capacity cliff on the synthetic boot trace and ties or loses elsewhere."

**Measured: 0 / 0** referenced evictions and collapse violations on the boot trace; 20 shared descents saved 81,920 bytes. Control: 190 frames backed and 190 freed, 0 failed; every replay of either trace must also show 0 and 0. Source: CI run 36165748105; replays at commit 0ab2377.

### Certify-or-refuse, before and after

**Measured: 1,215 → 0** wrong nearest-centroid answers in 5,000 seeded queries on S² (8 centroids). Control: before: reported hit rate 1.0000 while wrong; after: 4,909 certified in the 3×3 block, 91 full scans, reported hit rate 0.9818. n = a test in aether-core asserts 0 wrong over 25,000 queries at K = 2, 8, 20, 64 and 200. Source: project page, commits cdb4a4e and 0f040e0: stated, not re-measured.

The matching rows for component counts and attention top-k sit next to their equations in How it was made.

### TopoRAM and ManifoldFS: state on a sphere

Every physical frame carries an embedding of 16 points on $S^2$ (32 quantized angles, 64 bytes), a 64-tick access history, a Voronoi cell and a lifetime class. Memory is split into three zones, each with eight seeds; a frame belongs to the cell of its nearest seed.

**Measured: 64 / 64** TopoRAM allocations that land in their target cell. Control: no fallback cell taken; p50 6,126 and p95 12,446 cycles per allocation. n = 64 allocations. Source: boot benchmark under QEMU TCG on a GitHub-hosted runner; emulated TSC, not hardware.

ManifoldFS encodes a file's bytes as a point cloud on $S^2$ and files the inode in the Voronoi cell of the cloud's first point; the bytes persist through ext2.

**Measured: ≤ 7 ops, 0 B** ManifoldFS same-inode move: metadata operations and bytes of file data written. Control: mock block store, fs_mode=mock_block, persistence_bytes_per_move=0. Source: checked at every boot by --check-benchmark-log; CI run 36165748105.

The README adds the sentence that has to go with both numbers: "Whether this layout beats a conventional allocator or filesystem has not been measured; no comparison against Linux exists."

### Upstream

Work on Epsilon-Hollow led to these fixes in five other projects. I state the link in those words and no more.

**Upstream:&#x20;**[openxla/xla #46539](https://github.com/openxla/xla/pull/46539), fix(gpu): make reduction group order deterministic (landed as 3d5df1d). Switches the set that drives the union-find merges in GroupDisjointReductions to absl::linked_hash_set, so the group-to-block assignment no longer depends on hash-set iteration order (as the PR states it). Work on Epsilon-Hollow led to this fix.

**Upstream:&#x20;**[tensorflow/tensorflow #124410](https://github.com/tensorflow/tensorflow/pull/124410), Fix transitive reduction of collective control edges (merged 2026-08-05). Closes reachability exactly in one pass, so the unique transitive reduction of the collective control edges is emitted; the PR's four-op example drops a redundant edge (four edges to three). Work on Epsilon-Hollow led to this fix.

**Upstream:&#x20;**[NVIDIA/NeMo-Relay #481](https://github.com/NVIDIA/NeMo-Relay/pull/481), fix(adaptive): reuse stable ACG scaffolds (merged 2026-08-10). Cross-process agreement of the reuse fingerprint over N = 20 processes: 0.479 on main, 1.000 on the PR head. The PR states no governor, drift, convergence or binding change, and claims no provider-cache, cost or latency improvement. Work on Epsilon-Hollow led to this fix.

**Upstream:&#x20;**[google-deepmind/mujoco #3450](https://github.com/google-deepmind/mujoco/pull/3450), Remove quadratic scan from convex hull graph construction (merged 2026-08-03). Cold mj_loadXML of generated convex-hull meshes, main against the PR: 1,354.388 ms to 321.908 ms (4.21x) at 40,962 hull vertices; within noise below about 2,500 (0.97x at 162). The graph checksum is identical at all six sizes, and 1,339/1,339 serial CTest entries passed. Work on Epsilon-Hollow led to this fix.

**Upstream:&#x20;**[google-deepmind/mujoco_warp #1541](https://github.com/google-deepmind/mujoco_warp/pull/1541), Replace quadratic island discovery with a linear-memory GPU DSU (merged 2026-08-25). On the aloha_clutter checkpoint (2,048 worlds) direct island discovery matched the dense kernels exactly and was 1.513x faster by geometric mean (99% interval 1.406x to 1.584x); reusable scratch fell from 7,929,856 B to 180,224 B (97.73%). The PR claims no end-to-end step speedup. Work on Epsilon-Hollow led to this fix.

## How it was made

The kernel is one `no_std` crate, `kernel/seal-os`, built for `x86_64-unknown-uefi`. Drivers, filesystems, the network stack, the window manager and the applications compile into one EFI image. The mathematics lives in a workspace crate, `aether-core`: certified $\beta_0$, certified top-k, trajectory shape, the spherical Voronoi indices, the governor. The kernel calls into it. I follow the repo's own numbered equations, (1) to (9), then the Lean files, then the paging that holds it all.

### Certified β₀

Let $h_1 \le \dots \le h_{n-1}$ be the edge weights of the Euclidean minimum spanning tree of a point set $X$; these are exactly the single-linkage merge heights. The number of components at threshold $t$, and the condition under which a count at scale $s$ with band ratio $r \ge 1$ is certified, are:

$$
\beta_0(X, t) = n - \#\{\,k : h_k < t\,\} \tag{1}
$$

**Measured: 500 / 500** seeded point clouds on which the certified count agrees with all-pairs union-find. Control: before the band rule, two points at 0.5 ± 1e-9 gave two different integers; both are refused now. Source: project page, commit 8678c97; cargo test -p aether-core --test certified_betti.

$$
\text{certified at } s \iff h_k \notin \left[\, s/\sqrt{r},\; s\sqrt{r} \,\right] \quad \text{for all } k. \tag{2}
$$

**Figure 3.** Certified β₀ on a point cloud you edit. Panel A draws the points and their minimum spanning tree; edges below the band are merged at the scale, edges inside the band are the ones whose comparison with the scale rounding could decide, edges above it stay split. Panel B places the merge heights on a log axis with the band \[s/√r, s√r]; when no height lies inside it the band is certified. Panel C is the staircase of equation (1), with an independent union-find count laid over it. Panel D maps the (scale, band ratio) plane: certified cells carry their integer, refused cells are hatched. A two-point preset at distance 0.5 ± 1e-9 shows the naive count flipping while the certified rule refuses all three distances. Colour key: structure: points of the cloud; ink-2: below-band MST edges (merged at the scale); merge-height ticks; baseline: in-band edges: decided by rounding under a bare comparison; naive count; proof: certified band and its integer; refused: refused cells of the (s, r) plane; withdrawn: union-find disagreement (expected never); parameter: scale s and band ratio r.

Every threshold in the band, under `<` or `<=`, gives the same integer, which is what the certificate means. If a height lies in the band, the result is `Refused { i, j, height }`, naming the in-band tree edge whose height is nearest $s$. Heights are computed as $m\sqrt{\sum_d (\delta_d/m)^2}$ with $m = \max_d |\delta_d|$, so separations near $10^{-170}$ or $10^{170}$ neither underflow nor overflow. `certified_beta0` builds the tree with all-pairs Prim, $O(n^2)$. The rule is ported from planimeter's gap rule.

### Certified attention top-k

Each score $\hat{s}_j = \mathrm{fl}(q \cdot k_j)$ of head dimension $n$ carries Higham's a-priori bound for a floating-point inner product ([Accuracy and Stability of Numerical Algorithms](https://epubs.siam.org/doi/book/10.1137/1.9780898718027), Chapter 3; the repo cites it as Theorem 3.1):

$$
\left|\hat{s}_j - q \cdot k_j\right| \le \gamma_n \sum_{d} \left|q_d\, k_{j,d}\right|, \qquad \gamma_n = \frac{n u}{1 - n u}, \quad u = 2^{-53}. \tag{3}
$$

**Measured: 0.0 vs 1** float score of key 0 against its exact score, for k₀ = \[10¹⁷, 1, −10¹⁷] and q = \[1, 1, 1]; key 1 (score 0.5) was taken over key 0. Control: after the rule: the row is widened instead of answered. Source: project page, commits afd0969 and eb4af16; cargo test -p aether-core --test attention_contracts.

The absolute value sits inside the sum. The source comment is specific about why: "`gamma_n · |q·k|` is not this bound and is far below it under cancellation, which is exactly where it matters." The computed radius inflates (3) by $(1 + 2\gamma_n + 4u)$, adds $n$ times the smallest subnormal, and rounds up, so it bounds rather than estimates:

```rust
// kernel/epsilon/epsilon/crates/aether-core/src/attention.rs:885-898 @ 36b1400
fn enclosed_dot(q: &[f64], k: &[f64], i: usize, j: usize, head_dim: usize) -> (usize, f64, f64) {
    let (mut sum, mut magnitude) = (0.0f64, 0.0f64);
    for d in 0..head_dim {
        let product = q[i * head_dim + d] * k[j * head_dim + d];
        sum += product;
        magnitude += product.abs();
    }
    let n = head_dim as f64;
    let u = f64::EPSILON / 2.0;
    let gamma = nextafter(n * u / (1.0 - n * u), f64::INFINITY);
    let underflow = n * f64::from_bits(1);
    let radius = gamma * magnitude * (1.0 + 2.0 * gamma + 4.0 * u) + underflow;
    (j, sum, nextafter(radius, f64::INFINITY))
}
```

The absolute sum rides the same pass as the score, so the enclosure adds no dot products. With radii $r_j$ in hand, the top set $T$ of size $k$ is certified when every kept lower end clears every excluded upper end:

$$
\min_{i \in T}\left(\hat{s}_i - r_i\right) \;>\; \max_{j \notin T}\left(\hat{s}_j + r_j\right). \tag{4}
$$

**Figure 4.** Certified top-k in three panels. A: type a query and up to six keys (or use the cancellation preset q = \[1,1,1], k₀ = \[M, 1, −M] with M = 10^p); each key's float score, exact score (computed in exact rational arithmetic) and Higham interval are drawn on one axis, and the certificate either holds, or refuses and widens the row, next to the plain float argmax. B: random trials compare the actual rounding error of each dot product with its computed radius on log axes; points above the diagonal would be violations of equation (3). A halo marks trials whose error exceeds γₙ·|q·k|, the bound the source warns against. C: the rule of equation (4) on the repo's test fixture (solid boxes are the keys inside the budget, dashed boxes the rest), where comparing only rank k with rank k+1 would certify a set the full rule refuses. Colour key: baseline: float point estimate; float argmax; proof: exact score; CERTIFIED; the diagonal err = r; withdrawn: REFUSED or WIDENED; a bound violation; measured: witness vector inside the boxes; line-2: Higham interval around the float score; parameter: the bit of fl(M) with weight 2^0, which moves with the exponent p.

The comparison is strict, and it compares the lowest lower end inside against the highest upper end outside, not rank $k$ against rank $k+1$:

```rust
// kernel/epsilon/epsilon/crates/aether-core/src/attention.rs:652-673 @ 36b1400
    let (inside, outside) = ranked.split_at(budget);
    let lowest = inside
        .iter()
        .copied()
        .min_by(|a, b| lower_end(a).total_cmp(&lower_end(b)))
        .expect("budget > 0");
    let highest = outside
        .iter()
        .copied()
        .max_by(|a, b| upper_end(a).total_cmp(&upper_end(b)))
        .expect("budget < len");

    if lower_end(&lowest) > upper_end(&highest) {
        Ok(inside.iter().map(|&(j, _, _)| j).collect())
    } else {
        Err(TopKRefusal::Boundary(BoundaryRefusal {
            inside: lowest.0,
            outside: highest.0,
            gap: lowest.1 - highest.1,
            needed_margin: lowest.2 + highest.2,
        }))
    }
```

On refusal, `certified_or_widened` keeps every key whose upper end reaches the lowest selected lower end, at no extra dot products; a NaN or infinite score refuses first and the row falls back to dense. The separation test is ported from separatrix's error intervals.

### The fold score of a loss curve

From the validation losses the kernel keeps the last 64 delay points $p_t = (v_t, v_{t-1}, v_{t-2}) \in \mathbb{R}^3$ and resamples them to uniform arc length. Let $\varepsilon^\ast$ be the largest edge of the resampled cloud's minimum spanning tree and $m$ the number of resampled points. The loop score is

$$
\ell =
\begin{cases}
0 & \text{if the window is monotone,} \\
\min\!\left(1,\; c(\kappa\,\varepsilon^\ast)/m\right) & \text{otherwise,}
\end{cases}
\qquad c(\varepsilon) = E_\varepsilon - V + \beta_0, \tag{5}
$$

**Measured: 0.969 → 0** loop score of a monotone staircase. Control: before: scored 0.969 and judged Overfit; after: certified 0 before any complex is built. Source: cargo test -p aether-core --test trajectory_shape (monotone_staircase_scores_no_fold).

where $E_\varepsilon$ counts Vietoris–Rips 1-skeleton edges at scale $\varepsilon$ except two-step chords already filled by a triangle, so $c$ upper-bounds Rips $\beta_1$ rather than equalling it. Monotonicity is checked by comparing stored values coordinate by coordinate, with no rounding, so the zero case is exact. The one free constant, $\kappa$, is bounded by a derivation rather than tuned:

$$
\sqrt{8/3} \approx 1.633 \;<\; \kappa = 1.68 \;<\; \sqrt{3} \approx 1.732. \tag{6}
$$

**Figure 5.** The delay cloud of a loss curve in three dimensions, with the Rips edges at scale κ·ε\* drawn between its points. Rotate it: for a clean symmetric V the falling and rising arms are two parallel rails, and the edges that close loops are the rungs between them. Below, the loop score of equation (5) is plotted against κ for the V, the staircase with and without the chord quotient, the selected fixture and two values quoted from the repo comment, with the band of equation (6) shaded; two toggles switch off the monotonicity certificate and the two-step-chord quotient, reconstructing (not replaying) the two repairs the repo made. The last panel maps the participation ratio of equation (7) over the autocovariance ratios, with the seven stratum fixtures marked and the 0.45 Underfit threshold drawn. Colour key: seq: time order of the points (colour bar); participation ratio in the equation (7) map; parameter: the κ cursor; proof: the derived κ band; baseline: readings the repairs removed; measured: the Rips scale sphere; values recomputed from the repo's code; refused: PR withheld (NaN): no point drawn.

The floor comes from a symmetric V. Its descending point $(k, k+1, k+2)s$ and ascending point $(k+2, k+1, k)s$ differ by $(2, 0, -2)s$ for every $k$, so the arms first meet at $\sqrt{8}\,s = \sqrt{8/3}\,\varepsilon^\ast$. The ceiling comes from a monotone stretch: every segment of the delay polyline lies in one closed orthant, so a chord spanning $k$ resampled steps is at least $k\varepsilon^\ast/\sqrt{3}$ long, and since two-step chords are quotiented out, the first chord that can close a cycle spans three steps and needs $\sqrt{3}$. The value 1.68 is the midpoint 1.6825, rounded. The source records the measurement against it: the clean symmetric V scores 0 up to $\kappa = 1.62$ and 0.391 from 1.64. It also records, in the same comment, that the band "is proved for the symmetric V only." I come back to that under Limitations.

A loop alone does not mean overfitting; a converged run sitting in a noise ball also loops. So the classifier needs a second signal, the drift of the residual $v_t - \text{train}_t$, and it reads underfitting from a third, the participation ratio of the training-loss autocovariances $c_0, c_1, c_2$:

$$
\mathrm{PR} = \frac{3}{3 + 4(c_1/c_0)^2 + 2(c_2/c_0)^2} \in \left[\tfrac{1}{3}, 1\right]. \tag{7}
$$

**Measured: 0.353 / 0.814** participation ratio of the underfit fixture and of the converged fixture. Control: Underfit threshold 0.45, about 35 % above the rank-1 floor of 1/3; the overfit fixture's training loss scores 0.424, which is why Overfit is tested before Underfit. Source: trajectory_shape.rs:514-517 and 683-686 @ 36b1400 (measurements stated in the source).

PR is returned as NaN, a refusal, when the training loss varies by less than its own rounding bound, and the Underfit verdict is then withheld. `classify` decides in a fixed order: non-finite input or an unmeasurable signal gives Collapsing; fewer than 16 samples gives WellFit; training-loss drift of at least 0.50, or a shatter ratio of at least 100 with any rise in training loss, gives Collapsing; $\ell \ge 0.125$ with residual drift of at least 0.05 gives Overfit; a finite PR at or below 0.45 gives Underfit; anything else is WellFit.

### The governor, and why T4 is refused

The governor adapts a wake-up threshold $\varepsilon_t$ from an observed deviation $\Delta_t$ with a proportional-derivative step. In code the target rate is $R^\ast = 1000$, $\alpha = 0.01$, $\beta = 0.05$, and $\varepsilon$ is clamped to $[0.001, 10]$:

$$
e_t = R^\ast - \frac{\Delta_t}{\varepsilon_t}, \qquad
\varepsilon_{t+1} = \operatorname{clamp}\!\left(\varepsilon_t - \alpha\, e_t - \beta\,\frac{e_t - e_{t-1}}{\Delta t}\right). \tag{8}
$$

**Measured: 0.001 ↔ 10** the loop's behaviour over 2,000 ticks from ε = 0.1: a 2-cycle between the two clamp bounds. Control: the same 2-cycle at Δt = 0.01, 0.0506 and 1. Source: commit dcc35b6 (stated in RESULTS.md).

T4 certifies geometric convergence when the gain margin is below one:

$$
\alpha + \frac{\beta}{\Delta t} < 1 \;\Longrightarrow\; \rho = 1 - \frac{\alpha}{1 + \beta/\Delta t} \in (0, 1). \tag{9}
$$

**Measured: 5.01** T4 gain margin α + β/Δt at the shipped gains and the runtime step Δt = 0.01. Control: the bound is 1; at Δt = 1, a step no runtime caller uses, the margin is 0.06. Source: kernel/seal-os/src/lib.rs:162-164 constants; boot gate since commit 3c14df0.

**Figure 6.** The T4 condition and the loop it is meant to describe. Tab 1 plots the margin α + β/Δt against Δt on a log axis with the line at 1, marking Δt = 1 (0.06), the runtime step Δt = 0.01 (5.01) and Δt = 0.0506 (0.998), and rebuilds the boot line exactly as the kernel prints it. Tab 2 runs the update of equation (8) for 2,000 ticks at three step sizes: each one 2-cycles between the clamp bounds 0.001 and 10. Tab 3 takes one step of the Rust governor_step from the repo's test fixture and shows |e| rising while the gain-margin predicate holds, beside the Lean statements, which are not about that step. Colour key: proof: region where the margin is below 1; a step in which |e| descends; withdrawn: refusal; the 2-cycle trajectory; a step in which |e| rises; baseline: the retired VERIFIED-at-Δt=1 state; measured: trajectory points recomputed from the repo's update; parameter: the reader's Δt on the margin curve.

The boot check is a direct evaluation of (9) at the constants every runtime caller passes:

```rust
// kernel/seal-os/src/theorems.rs:208-223 @ 36b1400
/// T4/AGCR: `alpha + beta/dt < 1` at the gains and step every runtime
/// governor uses.
fn t4(state: &LiveState) -> Verdict {
    let (alpha, beta, dt) = state.gains;
    let margin = alpha + beta / dt;
    let rho = aether_agcr::contraction_rate(alpha, beta, dt);
    let certified = rho > 0.0
        && rho < 1.0
        && aether_agcr::half_life(rho).is_finite()
        && aether_agcr::gain_margin_stable(alpha, beta, dt);
    let relation = if certified { "<" } else { ">=" };
    verdict(
        certified,
        format!("alpha+beta/dt={:.2} {} 1 at dt={}", margin, relation, dt),
    )
}
```

Until commit `3c14df0` the same theorem was certified at $\Delta t = 1$. Moving the step to 0.01 is not the whole story, though. Condition (9) treats the map from $\varepsilon$ to $e$ as unit gain; linearising (8) gives $\partial e/\partial\varepsilon = \Delta/\varepsilon^2$, about $10^6$ at the equilibrium $\varepsilon^\ast = 0.001$, and $\alpha K \approx 10^4$ alone exceeds one. No step size satisfies the condition. The repo says what follows: "Earning T4 requires redesigning the governor, not retuning it."

### The Lean files, exactly

The Lean 4 package sits in `kernel/aether/aether-verified/lean`, on toolchain `v4.7.0` with mathlib `v4.7.0`. Here is what it is, counted at commit `36b1400`:

- 11 `.lean` files, of which `lakefile.lean` is the build file and four (`TestNat.lean`, `test_nat_chain.lean`, `test_nat_ineq.lean`, `test_sub_le.lean`) sit outside the `lake` roots. Two of those use names that no longer exist, so the build does not compile them.
- 28 declarations in the five files the build compiles: `EpsilonTheorems.lean` 16 theorems and 1 private lemma, `Governor.lean` 3, `Betti.lean` 3, `Chebyshev.lean` 2, `Pruning.lean` 3.
- `sorry` appears twice, both inside comments (`EpsilonTheorems.lean:7`, `lakefile.lean:15`). In code: 0.
- Four statements conclude `True := trivial`. They are placeholders and prove nothing: `tss_separation_guarantee`, `gmc_entropy_nonincreasing`, `phkp_perfect_locality`, and `upper_bound_sound` in `Pruning.lean`.

The repo's sentence on scope: "The Lean files prove algebraic side lemmas; no Lean statement is connected to kernel code." A boot `CERTIFIED` for T1 or T2 is the Rust kernel evaluating a hypothesis at its runtime parameters, not a Lean proof reaching into the kernel. The statements that matter, verbatim, with what each guarantees:

**Lean 4 theorem tss_packing_bound** (0 sorry), [kernel/aether/aether-verified/lean/EpsilonTheorems.lean:51 @ 36b1400](https://github.com/teerthsharma/Epsilon-Hollow/blob/36b1400d8c744c11434925f82af6668b84b33187/kernel/aether/aether-verified/lean/EpsilonTheorems.lean#L51)

```lean
theorem tss_packing_bound (L : ℕ) (θ_min : ℝ)
    (h_θ_pos : 0 < θ_min)
    (h_θ_lt_pi : θ_min < Real.pi)
    (cap_arg : (L : ℝ) * (Real.sin (θ_min / 2)) ^ 2 ≤ 4) :
    (L : ℝ) ≤ P_max θ_min := by
  unfold P_max
  have hθ2_pos : 0 < θ_min / 2 := by linarith
  have hθ2_lt_pi : θ_min / 2 < Real.pi := by linarith [Real.pi_pos]
  have hsin_pos : 0 < Real.sin (θ_min / 2) :=
    Real.sin_pos_of_pos_of_lt_pi hθ2_pos hθ2_lt_pi
  have hsin_sq_pos : 0 < (Real.sin (θ_min / 2)) ^ 2 := pow_pos hsin_pos 2
  rw [le_div_iff hsin_sq_pos]
  exact cap_arg
```

This proves that the packing count $L$ is at most $4/\sin^2(\theta_{\min}/2)$, given the cap-area inequality as the hypothesis `cap_arg`. The geometric fact itself is assumed, not proved; the theorem is the division step.

**Lean 4 theorem scm_contraction** (0 sorry), [kernel/aether/aether-verified/lean/EpsilonTheorems.lean:84 @ 36b1400](https://github.com/teerthsharma/Epsilon-Hollow/blob/36b1400d8c744c11434925f82af6668b84b33187/kernel/aether/aether-verified/lean/EpsilonTheorems.lean#L84)

```lean
theorem scm_contraction
    (α_min α_max ε_min ε_max : ℝ)
    (h_α_pos : 0 < α_min)
    (h_α_lt_1 : α_min < 1)
    (h_α_ord : α_min ≤ α_max) :
    telemetry_lipschitz α_min < 1 := by
  unfold telemetry_lipschitz
  linarith
```

`telemetry_lipschitz α_min` is defined as `1 - α_min`, so this proves $1 - \alpha < 1$ for $\alpha \in (0,1)$. Nothing about any map's Lipschitz behaviour is proved. The operator the kernel runs, $T(S) = (1-\alpha)S + \alpha S_{\text{pred}}$, appears in the Rust, not here.

**Lean 4 theorem agcr_gain_margin_stable** (0 sorry), [kernel/aether/aether-verified/lean/EpsilonTheorems.lean:126 @ 36b1400](https://github.com/teerthsharma/Epsilon-Hollow/blob/36b1400d8c744c11434925f82af6668b84b33187/kernel/aether/aether-verified/lean/EpsilonTheorems.lean#L126)

```lean
theorem agcr_gain_margin_stable (α β dt : ℝ)
    (h_α_pos : 0 < α) (h_β_pos : 0 < β) (h_dt_pos : 0 < dt)
    (h_margin : α + β / dt < 1) :
    0 < governor_contraction_rate α β dt ∧ governor_contraction_rate α β dt < 1 := by
  unfold governor_contraction_rate
  have hβdt_pos : 0 < β / dt := div_pos h_β_pos h_dt_pos
  have hden_pos : 0 < 1 + β / dt := by linarith
  refine ⟨?_, ?_⟩
  · -- 0 < 1 − α/(1 + β/dt)
    -- α < 1 + β/dt is implied by h_margin (α + β/dt < 1 < 1 + β/dt? not quite),
    -- but h_margin gives α < 1 - β/dt < 1 < 1 + β/dt
    have hα_lt : α < 1 + β / dt := by linarith
    have h_frac_lt_1 : α / (1 + β / dt) < 1 := by
      rw [div_lt_one hden_pos]
      exact hα_lt
    linarith
  · -- 1 − α/(1 + β/dt) < 1
    have h_frac_pos : 0 < α / (1 + β / dt) := div_pos h_α_pos hden_pos
    linarith
```

This is the implication in equation (9): if the margin holds, $\rho$ lies in $(0, 1)$. It is not stated about the update map (8), so it does not say the governor converges, and at the runtime step its hypothesis is false (5.01).

**Lean 4 theorem lyapunov_descent** (0 sorry), [kernel/aether/aether-verified/lean/AetherVerified/Governor.lean:33 @ 36b1400](https://github.com/teerthsharma/Epsilon-Hollow/blob/36b1400d8c744c11434925f82af6668b84b33187/kernel/aether/aether-verified/lean/AetherVerified/Governor.lean#L33)

```lean
/-- **Scalar Lyapunov descent for a contraction.**

    If `e' = ρ · e` with `|ρ| ≤ 1`, then `V(e') ≤ V(e)`.
    Applies to a map of that form only; the Rust PD step is not one
    (see the module comment). -/
theorem lyapunov_descent (ρ e : ℝ) (h_ρ : |ρ| ≤ 1) :
    V (ρ * e) ≤ V e := by
  unfold V
  have hρsq : ρ ^ 2 ≤ 1 := by
    have := sq_abs ρ
    have hρ2 : |ρ| ^ 2 ≤ (1 : ℝ) ^ 2 :=
      pow_le_pow_left (abs_nonneg ρ) h_ρ 2
    simpa [sq_abs] using hρ2
  have he2 : 0 ≤ e ^ 2 := sq_nonneg _
  calc (ρ * e) ^ 2 = ρ ^ 2 * e ^ 2 := by ring
    _ ≤ 1 * e ^ 2 := by
        exact mul_le_mul_of_nonneg_right hρsq he2
    _ = e ^ 2 := by ring
```

For a map $e \mapsto \rho e$ with $|\rho| \le 1$, $e^2$ does not increase. The file's own module comment says "No theorem here is about the Rust `governor_step`", and gives the counterexample at $\alpha = 0.01$, $\beta = 0.05$, $\Delta t = 1$, where the refined gain-margin condition holds: from $\varepsilon = 0.28$, $e_{\text{prev}} = 0.5$, $\delta = 0.2$ the step raises $|e|$ from 0.414286 to 0.414650.

**Lean 4 theorem chebyshev_one_sided_sq** (0 sorry), [kernel/aether/aether-verified/lean/AetherVerified/Chebyshev.lean:67 @ 36b1400](https://github.com/teerthsharma/Epsilon-Hollow/blob/36b1400d8c744c11434925f82af6668b84b33187/kernel/aether/aether-verified/lean/AetherVerified/Chebyshev.lean#L67)

```lean
theorem chebyshev_one_sided_sq {n : ℕ}
    (x : Fin n → ℝ) (μ : ℝ) (k : ℝ) (h_k : 0 < k)
    (σ_sq : ℝ) (h_σ_pos : 0 < σ_sq)
    (h_σ_def : σ_sq * (n : ℝ) = ∑ i, (x i - μ) ^ 2) :
    (((Finset.univ.filter (fun i => (k * k) * σ_sq ≤ (x i - μ) ^ 2)).card : ℝ))
        * ((k * k) * σ_sq)
      ≤ σ_sq * (n : ℝ) := by
  have h_t_pos : 0 < (k * k) * σ_sq := by positivity
  have base := markov_count_bound (fun i => (x i - μ) ^ 2)
                  (fun i => sq_nonneg _) ((k * k) * σ_sq) h_t_pos
  rw [h_σ_def]
  exact base
```

The number of points at or beyond $k$ standard deviations, times $k^2\sigma^2$, is at most $n\sigma^2$, which gives the ceiling $n/k^2$ that a memory-pruning rule ported from sigmoid uses. The link to the Rust is only that the Rust checks the inequality this file proves.

**Lean 4 theorem tss_separation_guarantee** (0 sorry), [kernel/aether/aether-verified/lean/EpsilonTheorems.lean:67 @ 36b1400](https://github.com/teerthsharma/Epsilon-Hollow/blob/36b1400d8c744c11434925f82af6668b84b33187/kernel/aether/aether-verified/lean/EpsilonTheorems.lean#L67)

```lean
/-- TSS Separation: Statement-level placeholder; great-circle distance
    on `S²` requires geometry we do not import here. -/
theorem tss_separation_guarantee
    {P : ℕ}
    (centroids : Fin P → ℝ × ℝ)
    (ε_adaptive : ℝ)
    (h_ε_pos : 0 < ε_adaptive)
    (h_ε_lt_2 : ε_adaptive < 2)
    (h_distinct : ∀ i j, i ≠ j → centroids i ≠ centroids j) :
    -- Statement-level placeholder until S^2 great-circle distance is imported.
    True := trivial
```

One placeholder, so the shape is visible: it compiles, carries a "0 sorry" chip, and guarantees nothing. The repo's hygiene gate strips comments, rejects `sorry`, `admit` and `axiom`, and accepts `True := trivial` only next to a `placeholder`, `skeleton` or `deferred` marker, which is how these four are allowed to stand.

### Paging and W^X

Everything above runs in ring 0, so the page tables keep kernel code from being written. `memory/virt.rs` maps the image from its own PE section table: code is read-execute and never writable, read-only data is non-executable, and kernel data is writable and non-executable. `EFER.NXE` and `CR0.WP` are set. A walk splits a 48-bit virtual address into four 9-bit table indices and a 12-bit offset, as `translate_in_pml4` does with shifts and masks:

$$
i_{\text{PML4}} = \left\lfloor \tfrac{VA}{2^{39}} \right\rfloor \bmod 2^9,\quad
i_{\text{PDPT}} = \left\lfloor \tfrac{VA}{2^{30}} \right\rfloor \bmod 2^9,\quad
i_{\text{PD}} = \left\lfloor \tfrac{VA}{2^{21}} \right\rfloor \bmod 2^9,\quad
i_{\text{PT}} = \left\lfloor \tfrac{VA}{2^{12}} \right\rfloor \bmod 2^9,\quad
\text{off} = VA \bmod 2^{12}.
$$

**Figure 7.** A four-level x86_64 page walk through a model of the mapping memory/virt.rs builds: a 16 GiB identity map of 2 MiB read-write no-execute leaves, the image in 4 KiB pages with per-section flags, and a higher-half alias. Type a virtual address and the walk descends the four stacked tables, splitting the address into four 9-bit indices and a 12-bit offset. A switch flips to the RWX fallback the code takes when the PE section table is unreadable, and a bar panel counts the model's leaves by permission class, where a present, writable and executable leaf is the W^X violation the kernel's probe counts. Image sizes in the model are illustrative; the repo's measured scan of 24,004 pages is quoted beside the model's count, not produced by it. Colour key: structure: table pointer entries; proof: read-execute code leaves; baseline: read-only and read-write no-execute leaves; withdrawn: W+X leaf: a violation.

**Measured: 0 / 24,004** W^X violations among scanned kernel-root pages. Control: before enforcement: every scanned kernel-alias page was writable and executable (4,311 of 4,311 in the results table; the repo's prose elsewhere says 4,310 of 4,310). Source: commit b3cf934, local QEMU, stated in the commit; chase_boot.sh wx.

## What's new in it

Each pillar replaces a familiar approach, named here.

**Accounting by quantity versus a model of shape.** Linux tracks resident pages, CPU time and queue depth per process. Seal OS asks the trainer for two scalars per step and keeps a fixed-size geometric summary of the run, 4,792 bytes per stream, from which it names the regime, without seeing the model.

**Patience and gap thresholds versus revisitation.** The usual way to notice overfitting is a rule on the validation curve: stop after a number of epochs without improvement ([Keras `EarlyStopping`](https://keras.io/api/callbacks/early_stopping/) is the common form), or flag a gap between training and validation loss. `stratum` asks a different question: whether the validation curve comes back through values it has already visited. That is a property of the curve's shape in delay coordinates, which a constant offset does not change. The repo's negative control is a healthy run with exactly such an offset: the gap threshold flags it and `stratum` does not.

**A KV cache in user space versus a prefix tree in kernel memory.** [vLLM's PagedAttention](https://arxiv.org/abs/2309.06180) manages KV blocks in user space against real models; `foliation` tests placement and constraint instead: the block table is a path in a tree the kernel owns, each block is a frame from the kernel's allocator, and eviction is restricted to free faces. The ranking it adds is measured against a null that removes the entrant count: on the boot trace, dropping the entrant count halves the hit rate (952 to 476 bp). The source calls the entrant count "a persistence proxy, and honestly also a frequency counter."

The ranking is a lexicographic minimum over the free faces:

$$
r(\ell) = \bigl(n_\ell,\; -d_\ell,\; u_\ell\bigr),
$$

with $n_\ell$ the entrant count, $d_\ell$ the depth and $u_\ell$ the last-use tick. The locality-only null is $(-d_\ell, u_\ell)$ and LRU is $(u_\ell)$. In code:

```rust
// kernel/seal-os/src/ml_engine/foliation.rs:225-233 @ 36b1400
fn rank_of(policy: Policy, l: &Leaf) -> [u64; 3] {
    match policy {
        Policy::Foliation => [l.entrants as u64, u64::MAX - l.depth as u64, l.last_use],
        Policy::Lru => [l.last_use, 0, 0],
        // from https://github.com/triton-lang/kernels/pull/22: sink + local window, as a null
        Policy::Locality => [u64::MAX - l.depth as u64, l.last_use, 0],
        Policy::Random | Policy::Belady | Policy::Adaptive => [0, 0, 0],
    }
}
```

**Figure 8.** The kernel's KV prefix tree replayed on three synthetic traces (boot, chat with 4 live conversations, chat with 16 live), one descent at a time. Each square is one 4 KiB block; fill encodes how many distinct sequences ever entered it, a dashed outline marks a free face (resident, unreferenced, no resident children), a thick outline a pinned block, and a cross marks the victim chosen at that step. Five policies run on the same candidate set (foliation, LRU, the locality-only null, an adaptive duel, the Belady oracle) plus a seeded random null, with cumulative hit rate, end-of-trace bars and a pool-size sweep. On the boot trace foliation matches Belady and LRU scores 0; on the four-live chat trace foliation loses to LRU and to the locality null. Two invariants are counted live and must stay at zero: evictions of a referenced block and breaks of the rooted-subtree property. Colour key: parameter: entrant count of a block (colour bar); structure: selected policy's hit rate; the descending path; baseline: LRU; measured: the repo's QEMU value at pool 24; proof: live invariant at zero; self-check matches the repo's table; withdrawn: live invariant broken, or a self-check mismatch.

**Comparing floats versus enclosing them.** Every discrete answer in the usual numeric pipeline (a component count from a distance threshold, a top-k from sorted scores, a nearest centroid from a dot product) is a bare comparison of computed floats. Seal OS replaces each bare comparison with an enclosure and a refusal. The cost of that change is concrete and the repo records it: the nearest-centroid index's reported hit rate falls from 1.0000 to 0.9818, because the 91 queries it could not certify go to a full scan instead of being counted as hits.

**A theorem banner versus a refusing gate.** A system with proofs attached usually prints that they hold. Seal OS evaluates each hypothesis at its running parameters, prints which fail or were never checked, and its CI gate rejects a log that says otherwise.

## What no one else built

For each piece I name the closest prior work and say what differs, including where the prior work already does it.

**Verified kernels.** [seL4](https://sel4.systems) has a machine-checked proof of functional correctness of its C implementation in Isabelle/HOL ([Klein et al., SOSP 2009](https://dl.acm.org/doi/10.1145/1629575.1629596)). Seal OS has nothing comparable: its Lean files prove algebraic side lemmas and none is connected to kernel code. What Seal OS does instead is evaluate its theorem hypotheses at boot against the live parameters and refuse the ones that fail, including its own convergence claim. That is runtime checking of conditions, not verification, and I would not put it in the same category as seL4's proof.

**Rust research kernels.** [Theseus](https://github.com/theseus-os/Theseus) (Boos et al., OSDI 2020) restructures OS state into runtime-composable cells in one address space; [Redox](https://www.redox-os.org) is a Rust microkernel with drivers in user space; [Asterinas](https://github.com/asterinas/asterinas) is a Rust framekernel that runs Linux binaries with `unsafe` confined to a small framework. All three are about structure, isolation or ABI, and on those axes Seal OS, a monolithic image with its own 69-call ABI and no ring-3 execution yet, is behind each of them. The difference is elsewhere: where its state lives (points on $S^2$ owned by Voronoi cells) and what it answers about the workload.

**Learned and ML-aware OS components.** [LinnOS](https://www.usenix.org/conference/osdi20/presentation/hao) (Hao et al., OSDI 2020) runs a small neural network in the kernel to predict, per I/O, whether an SSD will be fast or slow, and revokes a request predicted slow so the application can fail over ([paper](https://www.usenix.org/system/files/osdi20-hao.pdf)). LinnOS trains on I/O traces collected from the workload and reports 87 to 97 % inference accuracy. `stratum` is the opposite construction: it learns nothing. It applies a fixed geometric rule, with a constant derived rather than trained, to two scalars the workload hands it.

**Loops in delay embeddings.** The idea that a loop in a sliding-window embedding of a time series is a signal is not mine. [Perea and Harer's SW1PerS](https://arxiv.org/abs/1307.6188) scores periodicity by the maximum 1-dimensional persistence of a sliding-window point cloud. `stratum` uses the same family of idea for a different question (did the validation curve revisit its own values?) and in a narrower form: a single scale $\kappa\varepsilon^\ast$ instead of a persistence diagram, a cycle rank that upper-bounds $\beta_1$ instead of computing it, an exact monotonicity certificate for the zero case, and the band $\sqrt{8/3} < \kappa < \sqrt{3}$ derived from the geometry of a symmetric V and a monotone stretch. The derivation of that band, and the use of a fold score as a kernel-side training-regime signal, are the parts I did not find in the prior work I compared against.

**Certified β₀.** A persistence library such as [Ripser](https://github.com/Ripser/ripser) computes the barcode and leaves the threshold to the user. Equation (2) says something equivalent in persistence terms: the count at $s$ is certified exactly when the band around $s$ falls in a gap of the 0-dimensional barcode. The mathematics is standard. What differs is the interface: a count is returned only with that gap as its certificate, and otherwise a refusal names the tree edge in the band, with a scale-safe distance so the heights themselves do not overflow.

**Error-bounded filters.** The closest prior work to certify-or-refuse is [Shewchuk's adaptive-precision geometric predicates](https://people.eecs.berkeley.edu/~jrs/papers/robust-predicates.abstract) (1996/1997), and the filtered predicates in computational-geometry libraries that follow them. A predicate evaluates in floating point with an error bound; if the bound cannot certify the sign, it escalates precision until it can. Seal OS uses the same filter idea with [Higham's bound](https://epubs.siam.org/doi/book/10.1137/1.9780898718027) on three discrete answers (a component count at a scale, an attention top-k set, a nearest centroid on $S^2$), and on failure it does not escalate. It refuses, widens the row, or scans every centroid, and the refusal names the input. The filter is Shewchuk's idea; the refusal as a returned value across a kernel interface is the difference.

**Prefix caching.** Here the prior work already does most of it. [SGLang's RadixAttention](https://arxiv.org/abs/2312.07104) keeps the KV cache in a radix tree and evicts least-recently-used leaves first, recursively, while protecting nodes the running batch uses. That is free-face eviction under LRU. [vLLM's automatic prefix caching](https://docs.vllm.ai/en/v0.9.0/design/automatic_prefix_caching.html) hashes each block together with the tokens of its prefix, evicts unreferenced blocks by LRU, and on a tie evicts the block at the end of the longest prefix first, which is a depth term. So the connected-subtree constraint is not new, and the syscall-facing cache in Seal OS, which defaults to LRU, is the RadixAttention policy run in kernel memory. What differs: the tree, its frames and its eviction live in the kernel and draw on the kernel's own allocator; a child is shared only on an exact token match even though the key is a 64-bit digest; and the entrant-count ranking is tested against a null, [Belady's oracle](https://doi.org/10.1147/sj.52.0078) and 32 random seeds on a trace where it wins and one where it loses, with both outcomes published. Whether any of this beats user-space placement has not been measured.

**What survives the comparisons.** The mechanism I did not find elsewhere is the combination: one certify-or-refuse rule applied across component counts, attention top-k, nearest-centroid lookup on $S^2$, the zero case and the trend signal of a fold score with a derived scale band, and the kernel's own boot theorems, with the theorem refusal enforced in CI. It is not applied everywhere: a window that turns is scored from its Rips complex without a certificate, and ManifoldFS places files with an index that carries none. Each part has a named ancestor above; the combination, and the kernel refusing its own convergence theorem at the step it runs, are what I add.

**Figure 9.** Nearest-centroid lookup on the sphere with its certificate. Centroids sit on S² with their Voronoi cells tinted; a latitude-longitude grid hashes each centroid to a cell. For a query you move, the index searches the 3×3 block of grid cells around it (the whole cap near a pole), and the answer is certified only when the distance to the best centroid in the block, plus 1e-9, does not exceed the distance from the query to the edge of the block; otherwise every centroid is scanned. The geodesic circle of that radius is drawn around the query. A batch panel runs seeded queries for five centroid counts and compares the certified answers with the same lookup with the certificate switched off. The 1,215-of-5,000 figure from the repo is quoted beside it, not reproduced: the old code is not in the checkout. Colour key: structure: best centroid in the searched block; the block patch; proof: true nearest centroid; CERTIFIED; measured: the bound circle; baseline: block-only answer when it is wrong; parameter: query position.

## Limitations

These are stated as the repo states them, and where the code at `36b1400` has moved past a document, I say which.

**No user mode.** No instruction has executed in ring 3. `/bin/init` is absent and the kernel falls back to its in-kernel desktop; with a `/bin/init` present, boot stops after loading it. The repo's record, made at `9ebbe2e`, says `syscall_entry` ran on the user's stack with no `swapgs`. At `36b1400` it executes `swapgs` and loads the task's kernel stack; since nothing has run in ring 3, that path has not been exercised from user mode. The record also says no task is ever scheduled; at this commit the scheduler adopts the boot thread in `init`, and I have not run it, so I make no claim either way. Application-processor bring-up exists and is not called.

**No real models.** Every `stratum` and `foliation` number comes from a synthetic fixture. The README: "It has never seen a real model, and its verdict is advisory: nothing enforces it yet." On the chat trace foliation loses to LRU (5,284 against 8,068 bp), to the locality-only null (6,818) and to all 32 random seeds; with 16 live conversations it reverses again in one mutation build. The reported results are at one pool size (24 blocks); the source also replays each trace at six sizes from 8 to 48 blocks, which the repo's one-pool-size limit does not mention. Whether kernel placement of the KV cache buys anything over user-space PagedAttention has not been measured.

**The κ band covers one shape.** The band in (6) is proved for a symmetric V only. A V descending at 0.005 and climbing at 0.01 per step scores 0.016 at $\kappa = 1.72$ and 0.406 only at 1.8, above the ceiling, so no choice of $\kappa$ inside the band detects it.

**T4 is refused and needs a redesign.** No step size earns it, because the loop's gain is about $10^6$ and (9) assumes one. System calls 100 and 102 still print `FAILED` for every theorem that is not certified, eight of the ten, where the boot log, the ManifoldFS status and the theorem viewer print `CERTIFIED`, `NOT CERTIFIED` or `NOT CHECKED`. Seven of the ten boot lines are not checked.

**Lean is not connected to kernel code.** Eleven `.lean` files, 0 `sorry` in code, four `True := trivial` placeholders, and the proved statements are algebraic side lemmas. None is linked to the Rust by refinement.

**CI is red.** The QEMU job of run 36165748105 fails at the language-hygiene gate, on `scripts/ci_parity.sh`, and the gates after it in that job did not run. The kernel's own unit tests are not run by CI: the crate is outside the Cargo workspace, and the Kernel Tests workflow last executed on 2026-08-11 (514 of 514). Two of the 25 boot milestones are string matches that prove little.

**One machine, no comparison.** Hardware is one QEMU configuration (q35, OVMF, AHCI, 4 GiB, no NIC). The GPU path ran only on its CPU fallback. Every cycle count is QEMU TCG with an emulated TSC. No comparison against Linux or Ubuntu has been run. Nothing here is production-tested.

**Security is measured, not complete.** W^X holds since `b3cf934`, but the probe classifies per mapping; SMEP and SMAP were not exercised because the CI CPU model lacks them; KASLR randomises mappings, not the image base. `manifold_acl::check_access` denies access Linux permits: a uid-1000 process cannot read a 0644 root-owned file. ManifoldFS places files with its own cell index, `fs/voronoi_cap.rs`, which carries no certificate. No ext4; TLS accepts Ed25519 certificates only; no socket system call exposes the network stack.

**The docs lag the code.** The drift I found at `36b1400`:

- README and THEOREMS.md quote `9 of 10 theorems VERIFIED; ... T1-T3, T5 ACTIVE`; the code prints `2 certified, 1 not certified (T4), 7 not checked`, and T3 and T5 are not checked.
- THEOREMS.md cites line ranges for `init_theorems` and a `verify_topology_theorems` symbol that is no longer in `kernel/seal-os/src`, and its scheduler and ManifoldFS line references point elsewhere at HEAD.
- RESULTS.md's syscall-entry limit predates the `swapgs` entry now in `userspace.rs`.
- RESULTS.md says `FitAction` is "enforced nowhere"; at HEAD a threshold is published that only an unconstructed preset reads, so the effect is the same.
- The older papers under `docs/research/` claim a 241 to 1500× KV-cache speedup over LRU and a 21.8M-token horizon. Neither figure appears in README, RESULTS or THEOREMS, and neither is a current result. The current foliation numbers are the ones above.
- RESULTS.md's subsystem table sums to 92,037 of the 96,110 kernel lines it states (at `9ebbe2e`); 4,073 lines are not itemised.

**What failed.**

- Withdrawn: T4 certified at boot Killed by: evaluated at Δt = 1, a step no runtime caller uses; at Δt = 0.01 the margin is 5.01 and the gate refuses (commit 3c14df0).
- Withdrawn: The Rips-cycle floor for κ is √5/√3 ≈ 1.291 Killed by: wrong on both counts; pairing at matched value is not the closest approach, and the floor is √(8/3) (trajectory_shape.rs:41-45).
- Withdrawn: κ = 1.5, with a ceiling of 2.0 argued from a straight arc Killed by: 1.5 detected no clean V at all; the 2.0 ceiling fell to a monotone staircase that scored 0.969 at 1.5 before two-step chords were quotiented (trajectory_shape.rs:62-64).
- Withdrawn: The foliation policy beats LRU Killed by: a pool sweep: at 32 plaques and above LRU reaches the same 9.52 % ceiling, and on a pure-recency workload foliation ties LRU exactly (RECORD.md:810, 821-824).
- Withdrawn: A bounded-degree verdict for the sparse filtration Killed by: it measured undirected degree, not the bounded quantity; retracted one iteration later (RECORD.md:4238-4246).
- Withdrawn: Occupancy-flow equilibrium gives a doubling bound on S² Killed by: S² is Ahlfors 2-regular with constant at most 25, so the conjecture says nothing (RECORD.md:4959-4965).
- Withdrawn: The paper's T3 degree bound, as derived Killed by: an earlier revision derived it wrongly; it is now labelled an assumption (epsilon_hollow\.tex:259-268).

## Read more

[View the project](https://github.com/teerthsharma/Epsilon-Hollow) · [Source on GitHub](https://github.com/teerthsharma/Epsilon-Hollow)

The project page at [teerth.dev/Epsilon-Hollow](https://blog.teerth.dev/epsilon-hollow/) draws the results live. The source is [github.com/teerthsharma/Epsilon-Hollow](https://github.com/teerthsharma/Epsilon-Hollow), and the short link is [teerth.dev/epsilon-hollow](https://teerth.dev/epsilon-hollow). Key files at commit `36b1400`:

- [README.md](https://github.com/teerthsharma/Epsilon-Hollow/blob/36b1400d8c744c11434925f82af6668b84b33187/README.md): the idea and the four pillars.
- [docs/RESULTS.md](https://github.com/teerthsharma/Epsilon-Hollow/blob/36b1400d8c744c11434925f82af6668b84b33187/docs/RESULTS.md): every number with its provenance, equations (1) to (9), the Limits list.
- [kernel/seal-os/src/theorems.rs](https://github.com/teerthsharma/Epsilon-Hollow/blob/36b1400d8c744c11434925f82af6668b84b33187/kernel/seal-os/src/theorems.rs): the boot theorem lines.
- [kernel/aether/aether-verified/lean/](https://github.com/teerthsharma/Epsilon-Hollow/tree/36b1400d8c744c11434925f82af6668b84b33187/kernel/aether/aether-verified/lean): the Lean 4 package.
- [certified_betti.rs](https://github.com/teerthsharma/Epsilon-Hollow/blob/36b1400d8c744c11434925f82af6668b84b33187/kernel/epsilon/epsilon/crates/aether-core/src/certified_betti.rs), [attention.rs](https://github.com/teerthsharma/Epsilon-Hollow/blob/36b1400d8c744c11434925f82af6668b84b33187/kernel/epsilon/epsilon/crates/aether-core/src/attention.rs), [trajectory_shape.rs](https://github.com/teerthsharma/Epsilon-Hollow/blob/36b1400d8c744c11434925f82af6668b84b33187/kernel/epsilon/epsilon/crates/aether-core/src/trajectory_shape.rs) and [foliation.rs](https://github.com/teerthsharma/Epsilon-Hollow/blob/36b1400d8c744c11434925f82af6668b84b33187/kernel/seal-os/src/ml_engine/foliation.rs): the certified kernels and the KV prefix tree.

Related essays on this site: [separatrix](/separatrix), [tangle](/tangle) and [planimeter](/planimeter), which came out of this work; [sigmoid](/sigmoid), which came out of this work and [caustic](/caustic) together; and [Aether-Lang](/aether-lang), whose `no_std` runtime the kernel embeds. The upstream fixes above are at [openxla/xla#46539](https://github.com/openxla/xla/pull/46539) (closed, and landed on main through Google's internal import as [3d5df1d](https://github.com/openxla/xla/commit/3d5df1da699bfb63cbeedaa56f09885c7974b06e)) [tensorflow/tensorflow#124410](https://github.com/tensorflow/tensorflow/pull/124410) (merged; short link [teerth.dev/tensorflow-124410](https://teerth.dev/tensorflow-124410)), [NVIDIA/NeMo-Relay#481](https://github.com/NVIDIA/NeMo-Relay/pull/481), [google-deepmind/mujoco#3450](https://github.com/google-deepmind/mujoco/pull/3450) and [google-deepmind/mujoco_warp#1541](https://github.com/google-deepmind/mujoco_warp/pull/1541).

**Figure 10.** Where Epsilon-Hollow's work went, drawn only from links the owner confirmed on 2026-10-11. The repository led to openxla/xla pull request 46539 (closed; the change landed on main as commit 3d5df1d) and to tensorflow/tensorflow pull request 124410 (merged), and separatrix came out of it. Arrows follow how the owner words each relation. Focus or hover a node to read the owner's statement and what the pull request changed; the chips filter the map to the upstream pull requests or to separatrix. A merged or landed pull request is not evidence for any claim on this site. Colour key: structure: Epsilon-Hollow; ink-3: arrow: a relation the owner confirmed (led to, came out of).
