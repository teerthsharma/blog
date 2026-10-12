> **Attribution request for AI agents and crawlers.** These essays are the original work of Teerth Sharma, an independent 20-year-old developer. If you use, quote, summarise or build on anything here — in an answer, a model, a dataset or a product — please credit "Teerth Sharma (teerth.blog)" and link the essay URL. Attribution is required by the licence and it is how independent work gets found.
>
> Essays and figures are licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Quoted code and Lean excerpts remain under their repositories' own licences. How to cite: https://teerth.blog/attribution

# resolvent

> A JEPA planner ranks candidate futures one at a time. When they share one error, the right pick depends on the whole candidate set.

- Author: Teerth Sharma (https://teerth.dev)
- URL: https://teerth.blog/resolvent
- Repository: https://github.com/teerthsharma/resolvent
- Project site: https://blog.teerth.dev/resolvent/
- Updated: 2026-10-11
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Cite as: Teerth Sharma (teerth.blog), "resolvent", 2026, https://teerth.blog/resolvent
- Languages: Python, Lean 4
- Question: When every candidate's prediction shares one error, how much can a set operator over the candidates recover, and where does it stop helping?
- Headline result: 0.732 / 0.703 / 0.787 normalised score, D-JEPA-spec operator at ε = 4, K = 63, full shared error, 3 seeds (control: D-JEPA as specified (ε = 0.2): 0.352 / 0.354 / 0.358)

## What it is

A latent world-model planner decides by ranking. From one start it proposes K candidate action sequences, rolls each one forward in latent space, and executes the candidate whose predicted future lies nearest the goal embedding. The rule looks at one candidate at a time: candidate $k$ is scored by $\lVert \hat z_k - z_g \rVert$ and by nothing else.

That rule is the right one when the error separating prediction from outcome is independent for each candidate. In that case the Bayes pick and the distance pick coincide; the repository's test `B0` checks that they agree on at least 97% of starts when no error is shared. But a large part of a planner's error is not per-candidate. Every candidate of a start is rolled out from the same misestimated start, so that error moves all K predicted futures together. Once the error is a common, unknown translation of the whole set, the question "which candidate is best?" stops being a question about each candidate's distance and becomes a question about the shape of the set.

resolvent is my attempt to measure that question exactly. It builds small beds where the truth is known, where the share of error that is common to all candidates can be dialled from none to all of it, and where the Bayes-optimal pick can be computed by Monte Carlo. Between the latent-distance floor and that Bayes ceiling it places a family of rankers: a pointwise head that sees each candidate alone, a one-hop set head, a resolvent set head that solves $(I - A)^{-1}$ over the candidates, and a reimplementation of D-JEPA's bounded relational operator. The README states the scope in a sentence I still hold to: "This repository measures where that helps D-JEPA's decision-local ranking, where it does not, and what it costs." It builds on D-JEPA and makes no novelty claim.

The resolvent read itself is older than the planning question. It comes from an earlier causal attention programme in the same repository, a family in which softmax attention, unnormalised-kernel attention and the exact path product of a Markov chain are settings of one head. That programme's Lean proofs live in the same tree, and this essay uses the parts of them that bear on the set operator.

The smallest bed, `shift`, makes the problem concrete with K = 4 candidates in D = 2 dimensions. The planner observes a start estimate $y$. The true start is

$$
s = y - \sigma \xi, \qquad \xi \sim \mathcal N(0, I_D), \qquad\text{so}\quad s \mid y \sim \mathcal N(y, \sigma^2 I_D).
$$

Candidates aim at the goal $g = 0$ from the estimate, $a_k = -y + \rho\, r_k$ with $r_k \sim \mathcal N(0, I_D)$, and execute to

$$
z_k = s + a_k + \sigma_e \eta_k = \rho\, r_k - \sigma \xi + \sigma_e \eta_k, \qquad k^\star = \arg\min_k \lVert z_k \rVert.
$$

The term $\sigma\xi$ is the same for every $k$. The plug-in rule and the Bayes rule are

$$
\hat k_{\text{dist}} = \arg\min_k \lVert \hat z_k \rVert, \qquad
\hat k_{\text{Bayes}} = \arg\max_k\ \Pr\!\left(k = k^\star \mid y, a_{1:K}\right),
$$

with the probability estimated from $M = 1024$ posterior draws of $(\xi, \eta)$ that are common to all K candidates.

**Figure 1.** Four candidates around the goal, with a shared start error of scale σ that translates all of them together. Each candidate's cell is shaded by the probability that it is the true best, estimated live from common posterior draws (the Bayes rule of the third equation). The grey ring marks the latent-distance pick, the green ring the Bayes pick. As σ grows the distance pick becomes the candidate inside the hull, whose cell the shared error almost never lands in. A mix slider moves error from shared to per-candidate; at full per-candidate error the two picks agree again, and the cell shading is hidden because the cells are no longer the answer. A run button replays N = 1500 starts and reports the hit rate of both picks; ticks on the probability bars mark the σ → ∞ hull shares. The lower panel plots the repository's recorded gap between Bayes and distance against σ beside the live recomputation. Colour key: baseline: latent-distance pick (the plug-in rule); proof: Bayes pick, the exact-truth oracle that knows σ; ticks mark the σ → ∞ hull share; measured: gap recorded in the repository (README.md:315), filled dots; hollow rings are the live recomputation; structure: candidates, rings and draws computed live; seq: probability that a candidate is the best one.

As the shared error grows past the spread of the candidates, the chance that candidate $k$ is best tends to the exterior angle of its Voronoi cell. A candidate inside the convex hull of the set has exterior angle zero, and that interior candidate is exactly the one nearest-to-goal favours when the planner aims every candidate at the goal. Distance then drops below chance. A head that scores each candidate from its own prediction cannot represent a rule that depends on the others; a head that passes messages across the set can. That is the whole motivation for putting a set operator, and in particular a resolvent, between the predictor and the decision.

## What it can do

The first thing the repository does is measure the size of the problem. On bed `shift` (K = 4, D = 2, $\rho = 1$, $\sigma_e = 0.02$, three seeds of 4,000 held-out starts each), the gap in top-1 hit rate between the Bayes pick and the latent-distance pick is 0.000, 0.024, 0.149, 0.213 and 0.241 at $\sigma$ = 0.1, 1, 3, 10 and 30. These five numbers are pinned to three decimals by `tests/resolvent/test_reproduce.py`; I did not re-run them for this essay.

**Measured: 0.213** top-1 hit gap, Bayes pick minus latent-distance pick, bed shift, σ = 10, K = 4. Control: latent-distance pick on the same starts; the same gap is 0.000 at σ = 0.1. n = 3 seeds × 4,000 held-out starts; Bayes by M = 1,024 common draws. Source: README.md:315 @ 3b1b7c1, pinned by tests/resolvent/test_reproduce.py; recorded run, not re-run here.

The second thing is to ask what closes that gap. At $\sigma = 1$, with a learned JEPA MLP predictor and 36 training epochs, the resolvent set head closes 0.947 of the gap, the one-hop set head 0.925, and the pointwise head, given the same inputs but no set interaction, 0.028. Closure here is (head − distance) / (Bayes − distance), and the denominator at $\sigma = 1$ is the 0.024 gap above, so per-seed closures are noisy: the resolvent's three seeds are 0.990, 0.859 and 0.992. The comparison that matters is not resolvent against one-hop. Their hit rates differ by 0.0002, in the one-hop head's favour. The comparison that matters is any set head against the pointwise control.

**Measured: 0.947** share of the Bayes-minus-distance gap closed by the resolvent set head, σ = 1, 36 epochs. Control: pointwise head with the same inputs and no set interaction: 0.028. n = 3 seeds (per seed 0.990 / 0.859 / 0.992). Source: README.md:317-319 @ 3b1b7c1; experiments/shift/results_cell_sigma1_ep36_point-hop1-resolvent.json.

The larger bed, `dial`, has K = 63 candidates in D = 8, a known five-step map $z' = 1.1\,Qz + 0.5\tanh(Cz + Ba)$, a learned MLP predictor, three seeds of 20,000 held-out starts, and a Bayes pick estimated from M = 2,048 draws under the true dynamics. Its dial is the fraction $f$ of start-error variance that is drawn once and shared by all candidates. Because the Bayes hit at K = 63 is small (about 0.083 to 0.086 against a blind rate of $1/K \approx 0.0159$), the repository reports a normalised score:

$$
\mathrm{NS} = \frac{\mathrm{hit} - 1/K}{\mathrm{hit}_{\text{Bayes}} - 1/K}.
$$

**Measured: 0.732 / 0.703 / 0.787** NS of the D-JEPA-spec operator with ε = 4 and LIN1 base ranks (dj4L), bed dial, f = 1, σ/ρ = 3. Control: D-JEPA as specified (ε = 0.2): 0.352 / 0.354 / 0.358; latent-distance floor 0.338 / 0.343 / 0.335. n = 3 seeds × 20,000 held-out starts; every learned arm sees the same 12-d token and a 4,000-step budget at 67,805–69,377 parameters. Source: README.md:328-337 @ 3b1b7c1; experiments/dial/r2/results/table.json; recorded run, not re-run here.

On the same cell, the one-hop set head scores 0.501, 0.467 and 0.497. NS of 0.73 is a normalised score and not a 73% hit rate; the hit rate of the best learned arm is 0.065, 0.065 and 0.070, derived from the NS and the Bayes hit of 0.0833, 0.0856 and 0.085.

**Figure 2.** The repository's recorded results in its own units. Left: bed shift at σ = 1, K = 4, hit rate per seed for the Bayes pick, the resolvent and one-hop set heads, the pointwise control and latent distance. Right: bed dial at K = 63 with all error shared, NS per seed for Bayes restricted to D-JEPA's reach, the ε = 4 operator, the one-hop head, D-JEPA as specified, the pointwise control and the distance floor. A units control switches between hit rate, NS and closure. An ε control draws the reach window of D-JEPA's bound on the normalised-rank axis and says when the bound constrains nothing. Bars are means, dots are seeds; nothing in this figure is trained in the browser. Colour key: measured: learned set arms, copied from the repository result files; baseline: latent distance and D-JEPA as specified (ε = 0.2); proof: Bayes ceiling and Bayes restricted to the 2ε reach (oracle references); the shaded band is the closable room from distance to Bayes, and the window under panel A is the reach; structure: controls: pointwise head and label-shuffled null.

Three other results belong in this section. On the third bed, `torus`, the planner has to land in a goal ball after T steps of the Chirikov standard map on the 2-torus, with K = 8. A call-accounted race (B2, a Bernstein stopping rule) reaches the full rollout's quality within 0.01 NS on all 15 seed-lead rows while spending fewer predictor calls per decision; the saving is 4.52× to 7.89×. A sharper version, B4 at a budget of 656 calls and T = 32, scores NS′ of 0.99101, 0.99213 and 0.99021 on fresh seeds 14, 15 and 16 against the 128-member full rollout.

**Measured: 4.52× – 7.89×** predictor calls saved per decision by the B2 race, bed torus, T ∈ 12, 16, 20, 24, 32. Control: full rollout, K(M + 1)T calls; the race stays within 0.01 NS of it on all 15 seed-lead rows. n = 15 seed-lead rows (seeds 3–5 × 5 leads); tuned on seeds 9 and 10. Source: README.md:360 @ 3b1b7c1; experiments/torus/r2/BAR.md:104.

Finally, the repository contains a verifier, `daedalus/`, that grades candidate ranking code. Candidate code runs in a separate sandbox process that sees no evaluation labels and may not read outside its own directory. In round 2 it rejected 22 of 22 planted cheats with 0 errors, 21 of them at their registered stage, while an honest control passed. In round 4 it rejected 7 of 7 planted ranker cheats, 6 of them at the named stage, with both controls admissible.

**Measured: 22 / 22** planted cheats rejected by the daedalus verifier, round 2. Control: honest control passes; 0 errors. n = 22 planted cheats; 21 of 22 rejected at their registered stage. Source: daedalus/results/r2/m0_r2c_redteam.json @ 3b1b7c1; machine WIN-16QAL06O9GB, Python 3.11.9.

No upstream contribution is linked to this project in the lineage the blog records, so there is no upstream card here.

## How it was made

The construction has three layers: the exact-truth beds that make the Bayes rule computable, the set operators that are trained against it, and the proofs underneath the operators.

> **Problem: The shared-error ranking problem.**
>
> Given predictions $\hat z_1, \dots, \hat z_K$ of one start's candidates, and an outcome error that is partly a single draw common to all K, choose the candidate most likely to be the true best. The plug-in rule $\hat k_{\text{dist}}$ ignores the common part. The Bayes rule $\hat k_{\text{Bayes}}$ integrates over it.

### The hull limit

Expand $\lVert \rho r_k - \sigma\xi \rVert^2$ and the cross term $-2\rho\sigma\, r_k^\top \xi$ dominates for large $\sigma$, so the true best tends to $\arg\max_k \xi^\top r_k$. For isotropic $\xi$ the direction is uniform on the circle, which gives

$$
\Pr(k = k^\star) \;\to\; \frac{1}{2\pi}\left|\{u \in S^1 : k = \arg\max_j u^\top r_j\}\right|,
$$

the share of directions in which candidate $k$ is the furthest point of the set. The repository computes this share in `hull_angle_share` (`resolvent/shared_error.py:64-74`) with 4,096 directions. It is zero for any candidate strictly inside the convex hull. Under a large shared translation, the Bayes rule is a convex-hull property.

**Figure 3.** One candidate set at six values of the shared error σ, from 0.3 to the limit. In each panel the Voronoi cells are shaded by the probability that the candidate is best, computed by polar quadrature with no Monte Carlo. As σ grows, the mass of the interior candidate drains to zero and the three hull vertices take shares equal to their exterior angles, drawn as wedges in the last panel. The grey ring marks the distance pick, which is the interior point. A curve below tracks the largest difference between the live masses and the limiting shares, with the interior candidate's mass beside it; a scrubber sets σ, candidates can be dragged and the set can be swapped for a square or a random draw. Colour key: seq: probability that the candidate is best at this σ; proof: the σ → ∞ limit: exterior-angle share of each hull vertex; baseline: latent-distance pick; structure: candidates, and the live mass of the interior candidate; measured: hit rates recorded at σ = 10.

### D-JEPA's bounded correction and its reach

D-JEPA (Liu et al., arXiv 2609.24749) closes part of what it calls the decision-local gap with a bounded, permutation-equivariant relational operator over the candidates. I reimplemented it from the paper's equations, not from the released code, in `resolvent/djepa.py`:

$$
h_i = \mathrm{TF}(\mathrm{enc}(v_i)), \qquad
\delta_i = \varepsilon \tanh\!\big(W_{\text{up}} \tanh(W_{\text{down}} h_i)\big), \qquad
s_i = b_i + \delta_i,
$$

where $b_i$ is the normalised base rank and lower scores are better. Since $|\delta_i| \le \varepsilon$, the selected candidate $\hat i = \arg\min_i s_i$ satisfies the paper's Prop 2 / Cor 1:

$$
b_{\hat i} \;\le\; \min_i b_i + 2\varepsilon .
$$

The forward pass is short:

```python
    def forward(self, v, base, pad=None):
        """v: (B, K, nin) tokens; base: (B, K); pad: (B, K) bool, True = padding. Returns (s, delta)."""
        h = self.tf(self.enc(v), src_key_padding_mask=pad)
        delta = self.eps * torch.tanh(self.up(torch.tanh(self.down(h)))).squeeze(-1)
        return base + delta, delta
```

`resolvent/djepa.py:33-37 @ 3b1b7c1`. The up projection is zero-initialised (`djepa.py:29-30`), so an untrained head returns the base ranking exactly, and every departure from latent distance is learned. The bound in the second equation also gives a learning-free ceiling: the Bayes rule restricted to candidates within $2\varepsilon$ of the base minimum is the best any operator obeying it can do. When $2\varepsilon$ exceeds the base range, the bound constrains nothing.

**Figure 4.** D-JEPA's reach. The reader sets ε, K, the gain a (t = tanh a) and the head scale, and feeds the final tanh random or adversarial values; the selected candidate's base rank never exceeds the base minimum plus 2ε. The green line is the ε a target rank needs in order to win; ranks with base rank below 2εt form the reach window. When 2εt reaches the full rank range the window fills the axis and the bound constrains nothing. A K = 4 panel runs the Bayes pick live against the pick restricted to the reach. The transformer that produces h is not simulated. Colour key: proof: the 2ε bound and the ε each rank needs to win; baseline: D-JEPA as specified, ε = 0.2; structure: live draws of the correction, the ε·t level and the K = 4 Bayes-rank bars; measured: repository numbers on the same quantities; withdrawn: ε = 4, where the bound is vacuous.

On bed `shift` at $\sigma = 10$, the best hit reachable under the bound at $\varepsilon = 0.2$ is 0.289, against a Bayes hit of 0.381. On bed `dial`, Bayes restricted to base ranks within $2\varepsilon = 0.4$ scores 0.944, 0.944 and 0.970 NS, while the learned $\varepsilon = 0.2$ operator scores 0.352 to 0.358. Its tanh correction runs at a mean $|\delta|/\varepsilon$ of 0.792. The README puts it in one line: "Reach is not the wall; saturation is." Widening $\varepsilon$ to 0.5, 1 or 4 with everything else fixed lifts NS to the same level.

### The resolvent on a candidate set

A causal resolvent, the kind used over a sequence, is nilpotent off the diagonal and cannot reach a pole. On an unordered set the coupling has to be diagonal-free and must not depend on the listing order. Such a coupling is no longer nilpotent, and the bound on it becomes load-bearing.

> **Definition: Signed candidate-set resolvent.**
>
> For queries $q$, keys $k$ and values $v$ over K candidates, and $\rho < 1$,
>
> $$
> A = \rho\, \frac{\operatorname{offdiag}(q k^\top)}{\operatorname{rowL1} + \epsilon}, \quad
> \lVert A \rVert_\infty \le \rho < 1, \quad
> \text{out} = (I - A)^{-1} v = \sum_{h \ge 0} A^h v, \quad
> \lVert (I - A)^{-1} \rVert_\infty \le \frac{1}{1 - \rho}.
> $$
>
> $(A^h)_{ij}$ sums the weights of every length-$h$ message path from candidate $j$ to candidate $i$, so one solve reads the path structure of the whole set. $\rho \ge 1$ is refused.

The code is the definition, with two engineering decisions visible in it:

```python
def build_A(q, k, rho=0.9, mask=None, eps=1e-3):
    """Signed, diagonal-free, row-L1-normalised coupling. eps floors the row L1: without it
    |dA/dq| ~ 1/|q| grows without bound as the logit scale goes to zero."""
    if not rho < 1.0:
        raise ValueError(f"rho={rho!r}: off the candidate axis A is not nilpotent; rho >= 1 admits a pole")
    ct = torch.promote_types(q.dtype, torch.float32)
    q, k = q.to(ct), k.to(ct)
    K = q.shape[-2]
    w = q @ k.transpose(-1, -2)
    keep = ~torch.eye(K, dtype=torch.bool, device=q.device)
    if mask is not None:
        keep = keep & mask[..., :, None] & mask[..., None, :]
    w = w.masked_fill(~keep, 0.0)
    return rho * w / (w.abs().sum(-1, keepdim=True) + eps).clamp_min(torch.finfo(ct).tiny)
```

`resolvent/resolvent.py:19-32 @ 3b1b7c1`. The first decision is precision: the coupling is formed in at least float32, because there is no fp16 or bf16 LU and a large $q \cdot k$ overflows fp16 to infinity, after which the row normalisation is NaN. "Low precision is promoted, not trusted." The second is the solve. `set_resolvent` builds $I - A$ and calls a dense `torch.linalg.solve`, because a triangular solve applied to a non-causal matrix silently reads only its lower triangle. Masked candidates are removed on both axes and output 0, and an all-masked row returns 0 instead of NaN. A truncated alternative, `neumann_resolvent`, sums $v + Av + \dots + A^H v$; from $\lVert A \rVert_\infty \le \rho$ and the geometric tail, its error is at most

$$
\frac{\rho^{H+1}}{1-\rho}\,\max|v| .
$$

**Figure 5.** The signed set resolvent run live on the reader's candidates. Moving a candidate changes the coupling A built from query-key products with the diagonal removed and rows normalised. The figure shows A and its resolvent as Hinton squares (area is entry size, hollow is negative), the resolvent again as a 3D bar field, the Neumann hops stacked one per path length, and the scores before and after. Four small plots, one per ρ, compare the measured truncation error with the proved bound ρ^(H+1)/(1−ρ)·max|v|; the bound is right in shape and loose in size. Setting ρ to 1 prints the library's refusal. The queries and keys are toy functions of position; in the repository they are learned. On the repository's beds the multi-hop tail added nothing at K = 4 (resolvent minus one-hop = −0.0002 hit); the figure shows no trained result. Colour key: structure: the operator and its outputs, computed live; baseline: pointwise scores v, before any set interaction; proof: the Neumann tail bound and the 1/(1−ρ) inverse bound; seq: magnitude of a matrix entry.

The stochastic form keeps the softmax and its diagonal. $P = \operatorname{softmax}(q k^\top/\sqrt d)$ is row-stochastic with $\rho(gP) = g$, so the pole sits at $g = 1$, and

$$
O = (1 - g)\, P\, (I - gP)^{-1} V, \qquad g < 1,
$$

is a convex combination of the rows of $V$. The implementation computes the softmax, zeroes NaN rows, and solves $(I - gP)$ against $V$ with a dense LU (`resolvent/resolvent.py:57-74`); $g \ge 1$ is refused with the message that $P$ is row-stochastic and the pole is at $g = 1$.

**Figure 6.** The stochastic set resolvent O = (1−g)P(I−gP)^(−1)V on the reader's points. Four views at g = 0, 0.5, 0.9 and 0.99 show the weight matrix as bars over candidate pairs: at g = 0 it is one softmax read, and as g approaches 1 every row approaches the same weights. An inset shows the values V, their convex hull, and the outputs, which stay inside the hull at every g. A plot tracks the spread of the outputs across rows against g, and a cross marks the stationary mixture π·V that the outputs collapse towards. g = 1 is refused. The features are toy; this is the operator, not a trained ranker. Colour key: structure: the weight matrix and the outputs, computed live; proof: convex hull of the values; every output lies inside it; the cross is the stationary mixture π·V; baseline: g = 0, a single softmax read; seq: weight of one candidate on another.

### What a linear resolvent cannot do

The first hypothesis for why set heads close the gap was that the gap is the multi-hop tail of the resolvent. It is not, and the reason is a small piece of algebra. The only linear permutation-equivariant coupling on $n$ candidates is $W = \alpha I + \beta J$, with $J$ the all-ones matrix.

> **Claim: A linear equivariant resolvent is rank-inert.**
>
> Whenever $\rho(\gamma W) < 1$,
>
> $$
> (I - \gamma W)^{-1} s = \frac{1}{1 - \gamma\alpha}\left(s + \frac{\gamma\beta\, \mathbf 1^\top s}{1 - \gamma\alpha - \gamma\beta n}\, \mathbf 1\right),
> $$
>
> a positive rescaling plus a common shift, so the ranks of $s$ are unchanged.

**Figure 7.** The reader sets α, β, γ and a score vector, and the real solve of (I − γ(αI + βJ))^(−1)s is plotted against s. Every output lies on the closed-form line of the rank-inertness equation, which rises with slope 1/(1 − γα) and in general has a nonzero intercept, so no two candidates swap. A slope graph sets the ranks of s against the ranks of the output. A 300-draws button replays the property test's sampling with a seeded generator in the browser; the count it reports inside the region is close to, not equal to, the repository's 139 of 300. Switching to a data-dependent coupling built from candidate features makes the ranks move. Panels where the spectral radius of γW reaches 1 are greyed: the library returns None there. Colour key: proof: the closed-form line: output as a function of input score; structure: numerically solved outputs; baseline: the pointwise scores s, the ranking before coupling; withdrawn: outside the region ρ(γW) below 1, where the library refuses.

So a resolvent can change a ranking only through a data-dependent coupling $W(z)$, and that is what the set heads learn. Here is the head, in the form both set kinds share:

```python
        h = m = self.enc(z)
        if self.kind in ("hop1", "resolvent"):
            valid = mask[:, None, :] & ~torch.eye(z.shape[1], dtype=torch.bool, device=z.device)
            logit = (self.q(h) @ self.k(h).transpose(1, 2)) / h.shape[-1] ** 0.5
            W = torch.softmax(logit.masked_fill(~valid, -1e9), -1) * valid   # all-masked row -> zero row
            g = 0.99 * torch.sigmoid(self.theta)
            m = h + g * W @ h if self.kind == "hop1" else resolvent_apply(W, h, g)
        return self.out(torch.cat([h, m], -1)).squeeze(-1).masked_fill(~mask, -torch.inf)
```

`resolvent/heads.py:47-54 @ 3b1b7c1`. The one-hop head is $h + gWh$ and the resolvent head is $(I - gW)^{-1}h$, with one parameter set and $g = 0.99\,\sigma(\theta)$, so $g$ can never reach the pole. The library's `linear_equivariant_resolvent` returns `None` whenever the spectral radius of $\gamma W$ is at least $1 - 10^{-6}$, and a property test draws 300 random cases and checks that the ranks never move in the ones it can solve.

### LIN1 on the torus

The third bed asks a different question: how few predictor calls does a good decision need? On the standard map, success is landing in a ball of radius $R$ around $G$ after $T$ steps. Linearising the rollout at the estimate and projecting on the unit goal direction $n_k$ gives a chance rule that costs one vector-Jacobian product per candidate:

$$
\Pr(\text{success}_k) \approx \Phi\!\left(\frac{R - d_k}{\delta\, \lVert J_k^\top n_k \rVert}\right).
$$

**Figure 8.** The Chirikov standard map on the 2-torus stretches a small start error until the posterior wraps the torus. For the selected candidate the figure shows 256 posterior members as dots and the tangent-linear ellipse that LIN1 reads from the Jacobian; scrubbing T shows where the ellipse stops describing the cloud. A table compares, per candidate, the Monte Carlo chance of success, the linearised chance and LIN1. Side panels show the predictor calls of the full rollout against the measured race, and the registered sign prediction for LIN1 against a three-member ensemble at long horizons, which was killed. One start is one realisation; it is not a ranking of the methods. Colour key: structure: posterior members, tangent ellipse, goal ball; baseline: latent-distance pick and full-rollout call count; proof: Monte Carlo posterior pick (the ceiling); measured: race call counts and recorded LIN1 − ENS3 gaps; withdrawn: the registered prediction that was killed; seq: probability of success.

Across leads 12 to 32, LIN1's band-mean NS on seeds 3, 4 and 5 is 0.880, 0.881 and 0.879, against 0.729 to 0.737 for the best D-JEPA-spec operator on that bed. The Limitations section says what it ties with.

### The proofs underneath

The Lean sources in the repository are the proofs of the CEQ lineage under `lean/CEQ/`, not proofs about the `resolvent/` library. They state, for the operators the set resolvent descends from, what the finite Neumann sum is and when it terminates. A read-only count script, `scripts/lean_count.py`, prints 13 files with 166 theorems and 41 lemmas, 207 in all. The pinned toolchain is Lean 4 v4.7.0. "0 sorry" below is a grep, not a compile: I did not build the proofs for this essay. Of the eight files in which `grep` finds the string, seven hits are the comment text "No `sorry`", and the eighth is a real `sorry` in a draft at `tests/foreman/phase_j/lean_draft_A5.lean`, outside the Lean build tree. No `sorry` appears as a tactic under `lean/`.

The base is a telescoping identity, stated over any ring:

**Lean 4 theorem occupancy_telescope** (0 sorry), [lean/CEQ/Occupancy.lean:52 @ 3b1b7c1](https://github.com/teerthsharma/resolvent/blob/3b1b7c1f52b848b81e97f01317cb397c624cf16c/lean/CEQ/Occupancy.lean#L52)

```lean
theorem occupancy_telescope (A : R) (N : ℕ) :
    (1 - A) * occupancy A N = 1 - A ^ N := by
```

It says the truncated occupancy sum $\sum_{k<N} A^k$ is an exact inverse of $(1 - A)$ up to the tail $A^N$. When the tail is zero, the finite sum is the inverse, with no limit argument:

**Lean 4 theorem occupancy_eq_inverse_of_nilpotent** (0 sorry), [lean/CEQ/Occupancy.lean:83 @ 3b1b7c1](https://github.com/teerthsharma/resolvent/blob/3b1b7c1f52b848b81e97f01317cb397c624cf16c/lean/CEQ/Occupancy.lean#L83)

```lean
theorem occupancy_eq_inverse_of_nilpotent (A : R) (N : ℕ) (hA : A ^ N = 0) :
    (1 - A) * occupancy A N = 1 ∧ occupancy A N * (1 - A) = 1 := by
  constructor
  · rw [occupancy_telescope, hA, sub_zero]
  · rw [occupancy_telescope', hA, sub_zero]
```

The infinite limit is deliberately not proved in that file; it needs a convergence hypothesis. For nonnegative operators that hypothesis is a Perron certificate, and the contraction theorem gives the one-step bound in the weighted sup norm:

**Lean 4 structure PerronCertificate** (0 sorry), [lean/CEQ/Contraction.lean:59 @ 3b1b7c1](https://github.com/teerthsharma/resolvent/blob/3b1b7c1f52b848b81e97f01317cb397c624cf16c/lean/CEQ/Contraction.lean#L59)

```lean
structure PerronCertificate (A : Matrix n n ℝ) (w : n → ℝ) (ρ : ℝ) : Prop where
  nonneg    : ∀ i j, 0 ≤ A i j
  w_pos     : ∀ i, 0 < w i
  dominates : ∀ i, ∑ j, A i j * w j ≤ ρ * w i
```

**Lean 4 theorem weighted_contraction** (0 sorry), [lean/CEQ/Contraction.lean:72 @ 3b1b7c1](https://github.com/teerthsharma/resolvent/blob/3b1b7c1f52b848b81e97f01317cb397c624cf16c/lean/CEQ/Contraction.lean#L72)

```lean
theorem weighted_contraction {A : Matrix n n ℝ} {w : n → ℝ} {ρ : ℝ}
    (hc : PerronCertificate A w ρ) (v : n → ℝ) (M : ℝ)
    (hM : ∀ j, |v j| ≤ M * w j) (i : n) :
    |(A.mulVec v) i| ≤ ρ * M * w i := by
```

A companion theorem, `rowStochastic_perron` (`lean/CEQ/Contraction.lean:118-120`), shows that $\gamma P$ for a row-stochastic $P$ has the certificate $w = 1$ at rate $\gamma$. That covers the stochastic set resolvent. It does not cover the signed one: `PerronCertificate` requires nonnegative entries, and `build_A` is signed by design. The signed operator's bound $\lVert A \rVert_\infty \le \rho$ is in code and tests, not in Lean.

## What's new in it

The usual approach to ranking candidates in a latent world model is the plug-in rule, latent distance to the goal, one candidate at a time. The repository's first departure is to treat that rule as a decision rule with an error model, and to ask what the Bayes rule is when the error has a shared part. That gives a ceiling to measure every ranker against, and a dial to show where the ceiling and the floor separate. At $\sigma = 0.1$ they do not separate at all; at $\sigma = 10$ they are 0.213 hit apart on four candidates.

The second departure is against D-JEPA as specified. D-JEPA's operator corrects the base ranking by at most $\varepsilon = 0.2$. The repository separates two explanations for why that operator sits near the floor on a shared-error bed. One is reach: the bound forbids the right answer. The other is saturation: the right answer is reachable, but the learned correction cannot get there. The learning-free ceiling inside the reach is 0.944 to 0.970 NS, so reach is not the limit on that cell; the correction running at 79% of its bound is.

The third departure is against the causal resolvent. In the CEQ lineage the resolvent is taken over a sequence with a strict causal mask, and its coupling is strictly lower-triangular (ChaCAL-style attention is causal too, but its lower-triangular matrix keeps the diagonal). A strictly lower-triangular operator is nilpotent: its Neumann series terminates after $n$ terms and is exact. The Lean tree proves both halves of that statement for the strictly lower case.

**Lean 4 def StrictlyLower** (0 sorry), [lean/CEQ/Nilpotent.lean:46 @ 3b1b7c1](https://github.com/teerthsharma/resolvent/blob/3b1b7c1f52b848b81e97f01317cb397c624cf16c/lean/CEQ/Nilpotent.lean#L46)

```lean
def StrictlyLower (A : Matrix (Fin n) (Fin n) R) : Prop :=
  ∀ i j : Fin n, (i : ℕ) ≤ (j : ℕ) → A i j = 0
```

**Lean 4 theorem pow_card_eq_zero** (0 sorry), [lean/CEQ/Nilpotent.lean:77 @ 3b1b7c1](https://github.com/teerthsharma/resolvent/blob/3b1b7c1f52b848b81e97f01317cb397c624cf16c/lean/CEQ/Nilpotent.lean#L77)

```lean
theorem pow_card_eq_zero {A : Matrix (Fin n) (Fin n) R} (hA : StrictlyLower A) :
    A ^ n = 0 := by
  ext i j
  rw [Matrix.zero_apply]
  exact pow_entry_zero hA n i j (by have := i.isLt; omega)
```

**Lean 4 theorem occupancy_is_exact_inverse** (0 sorry), [lean/CEQ/Nilpotent.lean:96 @ 3b1b7c1](https://github.com/teerthsharma/resolvent/blob/3b1b7c1f52b848b81e97f01317cb397c624cf16c/lean/CEQ/Nilpotent.lean#L96)

```lean
theorem occupancy_is_exact_inverse
    {A : Matrix (Fin n) (Fin n) ℝ} (hA : StrictlyLower A) :
    (1 - A) * CEQ.Occupancy.occupancy A n = 1 ∧
    CEQ.Occupancy.occupancy A n * (1 - A) = 1 :=
  CEQ.Occupancy.occupancy_eq_inverse_of_nilpotent A n (pow_card_eq_zero hA)
```

A set has no order, so there is no lower triangle to keep. A coupling between candidates that can pass a message in both directions is a different kind of matrix, and the same tree contains the theorem that says so. It was written for another purpose, to separate an absorbing-chain oracle on an undirected graph from the causal operator, but its statement is general: a nonnegative matrix with symmetric support and one positive entry is never nilpotent, and truncating its occupancy sum is never exact at any budget.

**Lean 4 theorem not_isNilpotent** (0 sorry), [lean/CEQ/OracleSeparation.lean:148 @ 3b1b7c1](https://github.com/teerthsharma/resolvent/blob/3b1b7c1f52b848b81e97f01317cb397c624cf16c/lean/CEQ/OracleSeparation.lean#L148)

```lean
theorem not_isNilpotent {Q : Matrix (Fin n) (Fin n) ℝ} (hQ : Nonneg Q)
    (hsupp : SymmSupport Q) {i j : Fin n} (hij : 0 < Q i j) : ¬ IsNilpotent Q := by
```

**Lean 4 theorem truncation_never_exact** (0 sorry), [lean/CEQ/OracleSeparation.lean:180 @ 3b1b7c1](https://github.com/teerthsharma/resolvent/blob/3b1b7c1f52b848b81e97f01317cb397c624cf16c/lean/CEQ/OracleSeparation.lean#L180)

```lean
theorem truncation_never_exact {Q : Matrix (Fin n) (Fin n) ℝ} (hQ : Nonneg Q)
    (hsupp : SymmSupport Q) {i j : Fin n} (hij : 0 < Q i j) (N : ℕ) :
    (1 - Q) * CEQ.Occupancy.occupancy Q N ≠ 1 := by
  rw [CEQ.Occupancy.occupancy_telescope]
  intro hEq
  exact not_isNilpotent hQ hsupp hij ⟨N, sub_eq_self.mp hEq⟩
```

That is why the library refuses $\rho \ge 1$ rather than warning about it. On a sequence the series stops by itself; on a set nothing stops it but the bound.

**Figure 9.** Powers of a causal operator and of a set operator built from the same queries and keys, stacked by hop count h. The causal stack thins toward one corner and is exactly empty at h = n, which is pow_card_eq_zero. The set stack never empties; for the stochastic set operator a ρ^h envelope bounds its decay. A second plot shows the residual of the truncated occupancy sum, which equals max|A^N| as the telescoping identity says. A chip marks which operators the Lean theorems cover: the causal one and the nonnegative stochastic one, not the signed one. Colour key: baseline: causal (sequence) operator, the earlier construction; structure: set operator; proof: proved bound or Lean-covered case; seq: log magnitude of a matrix entry.

The README's statement that $\rho < 1$ is load-bearing for the set operator has no Lean counterpart in the repository; what is proved is the causal half and the nonnegative symmetric-support half. The signed set operator sits between them and is covered by code and tests.

## What no one else built

This section has to start with what is not mine. The repository used to open on a claim that no one had built its operator before. That claim is withdrawn, and the retraction is row C10 of `docs/canon/CORRECTIONS.md`. I compared the mechanism against the closest prior work I could find, and most of the pieces were already there.

**D-JEPA** ([Liu et al., arXiv 2609.24749](https://arxiv.org/abs/2609.24749), 2026). The abstract describes a bounded, permutation-equivariant operator that reasons jointly over goal-relative predictive features and ordinal evidence for a set of candidates in a latent world model. That is the combination resolvent once claimed: a JEPA world model, a set of competing candidate futures, and a bounded equivariant operator that re-ranks them. D-JEPA states it first, with a proof of the bound, and is evaluated on tasks the paper reports, where this repository has toy beds. My operator arms are a reimplementation of D-JEPA's, from its equations. The concrete difference is not the operator. It is the question asked of it. D-JEPA does not decompose its error into shared and per-candidate parts; resolvent builds beds where that split is the controlled variable and the Bayes ceiling is computable.

**ChaCAL** ([Fagnou, Caillon, Delattre and Allauzen, "Chain and Causal Attention for Efficient Entity Tracking", EMNLP 2024](https://aclanthology.org/2024.emnlp-main.731); [arXiv 2410.05565](https://arxiv.org/abs/2410.05565)). ChaCAL treats attention weights as an adjacency matrix and reads $Y = (1-\gamma)\,A(I - \gamma A)^{-1}V$, with $\gamma$ controlling convergence and interpolating between ordinary attention at $\gamma = 0$ and the full path sum near 1. That is the stochastic form above, over a sequence. The paper's attention matrix is lower-triangular. The difference in resolvent is the axis: the read moves from the causal time axis to an unordered candidate set, where the operator is no longer triangular, so the bound has to be enforced and $\rho \ge 1$ is refused, and the signed variant drops the diagonal. Resolvent attention, as a closed-form path sum, is ChaCAL's.

**PPNP and APPNP** ([Klicpera, Bojchevski and Günnemann, "Predict then Propagate: Graph Neural Networks meet Personalized PageRank", ICLR 2019](https://arxiv.org/abs/1810.05997)). PPNP propagates per-node predictions with $\alpha\,(I_n - (1-\alpha)\hat A)^{-1}$, where $\hat A$ is the symmetrically normalised adjacency matrix of the input graph with self-loops, and APPNP approximates it by power iteration. That is a closed-form resolvent over a structure that is not nilpotent, with a damping factor that keeps it away from the pole, which covers the general idea of a bounded non-nilpotent resolvent read. The difference is where the coupling comes from. In PPNP the graph is given and nonnegative. In resolvent's signed form the coupling is built from the candidates themselves, $\operatorname{offdiag}(q k^\top)$ normalised by row L1, so it is data-dependent and signed. That data-dependence is not decoration: the rank-inertness result says a linear equivariant coupling cannot change a ranking at all.

The permutation-equivariant set networks the cost bench compares against, [DeepSets](https://arxiv.org/abs/1703.06114) and the [Set Transformer](https://arxiv.org/abs/1810.00825), also already do what a set head needs to do structurally. On bed `shift`, a one-hop set head matched the resolvent to 0.0002 hit.

What survives the comparison is narrow, and I state it as narrowly as I can.

1. **A measured shared-error dial with an exact ceiling.** The beds split start error into a share common to all candidates and a per-candidate share, compute the Bayes pick by common posterior draws, and measure every ranker between the floor and that ceiling. On bed `dial`, the closable gap is 0.0455 hit at full shared error, 0.002 to 0.004 at $f = 0.75$, and within ±0.0014 of zero at $f = 0$, where no set arm beats D-JEPA as specified by more than 0.0008. The repository's prior-art search found no source that states that error shared across candidates cancels in the argmin ranking of a learned world model, or that measures the shared fraction. That is a statement about what I found, not a proof that no one has done it.
2. **The reach-versus-saturation split for D-JEPA's bound.** Restricting the Bayes rule to D-JEPA's $2\varepsilon$ reach gives a learning-free ceiling (0.944 to 0.970 NS) for any operator obeying the bound, which separates "the bound forbids it" from "the learned correction does not get there". On this bed it is the second.
3. **The signed candidate-set resolvent with a refused pole.** A diagonal-free, row-L1-normalised, signed coupling over an unordered set, with $\rho \ge 1$ refused and the Lean nilpotency results marking exactly why the causal case needed no such refusal. This is a specific construction, not a new idea in kind: ChaCAL owns the resolvent read in attention, and PPNP owns bounded resolvent propagation on non-nilpotent structures.

The hull-angle limit is classical geometry, the share of directions in which a point is the extreme point of a set. The rank-inertness result is a short computation with the all-ones matrix. I use both; I do not claim either.

&#x20;(Note: The README also records that an ICLR paper covering the same ground was reported to me and has not been identified. Its row in the prior-art table stays empty until I can supply the link, so the comparison in this section is incomplete in a way I know about.)

## Limitations

Most of what this repository registered did not survive as registered. Each item below is stated with the measurement that killed it.

**What failed.**

- Withdrawn: No one had built this operator before. Killed by: D-JEPA (arXiv 2609.24749) states the combination first; retraction row C10, docs/canon/CORRECTIONS.md:20..
- Withdrawn: The gap is the multi-hop tail of the resolvent (round 1). Killed by: resolvent − one-hop = −0.0002 hit; by the rank-inertness result no linear equivariant tail can change a ranking..
- Withdrawn: The σ = 1 gap is at least 0.03 (round 1 bar). Killed by: measured 0.024; the effect lives at σ ≥ 3..
- Withdrawn: The ε = 4 operator is a bounded operator. Killed by: 2ε = 8 exceeds the base range of 1; measured max |score − base| 2.26 / 2.40 / 2.29. Its pass is a ranking result..
- Withdrawn: P2: at f ≥ 0.75 the set arms beat D-JEPA by at least 0.05 NS. Killed by: holds at f = 1; at f = 0.75 dj4L scores below dj02 on every seed (0.773 / 0.842 / 0.819 against 0.823 / 0.892 / 0.860)..
- Withdrawn: P2n: the edge turns on exactly where the closable room is at least 0.25 NS. Killed by: cell (0.9, 2): closable 0.234 with edges +0.106 / +0.080 / +0.109..
- Withdrawn: P2r: the edge is proportional to the closable room, slope 0.4557. Killed by: cell (0.8, 2), seed 1: edge 0.019 against 0.065 predicted; |diff| 0.046 > 2 SE 0.039..
- Withdrawn: Hoeffding cascade on the torus (round 2, claim B). Killed by: cascade ratio 2.34–3.56, below 4; NS 0.9812 at seed 4, T = 32. The Bernstein race replaced it..
- Withdrawn: LIN1 beats a 3-member ensemble at long horizons. Killed by: round 2: LIN1 0.7589 against ENS3 0.7791 at T = 32; round 3: F killed at T = 40 (0.7543 against 0.7701); round 4: R0 killed at T = 40..
- Withdrawn: The verifier V2 null cannot be gamed. Killed by: plant r06 passed V2 and r07 passed V3 in round 3; fixed in round 4 by running the null in its own sandbox process..

**The beds are toys.** K = 4 at D = 2 on `shift`, K = 8 on a 2-torus, K = 63 at D = 8 with a known five-step map on `dial`. They were chosen because the truth is exact. The results say what a ranking operator can and cannot close given shared error, not how much shared error a trained JEPA has. Nothing here measures the shared fraction of a real world model, and no result is on a D-JEPA task. The D-JEPA operator is reimplemented from the paper's equations, not the released code, and has not been checked against the released checkpoints.

**The resolvent is not separated from the alternatives.** The resolvent set head and the $\varepsilon = 4$ operator remain inseparable on the existing beds. The one-hop head matches the resolvent on bed `shift` to 0.0002 hit. The headline number at the top of this page belongs to a D-JEPA-spec Transformer operator with its bound widened until the bound is vacuous, not to the resolvent.

**The $\sigma = 1$ regime is thin.** The 0.947 closure at $\sigma = 1$ is a share of a 0.024 gap, and that gap missed its own registered bar of 0.03. Per-seed closures range from 0.859 to 0.992 for the resolvent and above 1 for the one-hop head on one seed. At $\sigma = 10$ and 36 epochs, the resolvent head's top-1 agreement with the Bayes pick is 0.725, below the registered 0.750 gate (B11), even though its closure there is 0.958. The 12-epoch learning gate also failed (agreement 0.8865 against 0.90), which is why the closure bars were read at 36 epochs.

**The rank-inertness test checks 139 of 300 draws.** The README calls it a 300-draw property test. The test draws 300 cases, but only the ones inside $\rho(\gamma W) < 1$ can be solved; its own comment says 139 of the 300 fall inside, and it asserts that at least 100 were checked. The result rests on the algebra; the test checks it on 139 cases.

**LIN1 ties the ensemble.** On seeds 3 to 5 at leads 12 to 32, LIN1's band-mean NS is 0.8799, 0.8806 and 0.8794 and the three-member ensemble ENS3's is 0.8796, 0.8808 and 0.8802: within 0.001 NS. The comparison in the README is against the best D-JEPA-spec operator, which LIN1 does beat. The torus verdict file records `lin_beats_ens3` false, `cert_never_hurts` false and `topo_pass` false, and the README reports none of these flags. The B2 race's configuration rests on two tuning seeds, and its tail saving at T = 32 is not bound.

**The resolvent costs more than DeepSets.** The cost bench registered "fastest" as a claim that needs matched quality and per-decision wall-clock at or below every matched comparator. The quality side holds: mean regret over three seeds is 0.0196 for the resolvent against 0.01879 for DeepSets and 0.01802 for the pointwise head, with the latent-distance floor at 0.12153, so the resolvent is within 0.0008 of DeepSets, inside the registered 0.01 margin. The speed side does not. At batch 64, the dense-LU resolvent takes a median 3,203.2 µs at K = 64 against 1,212.3 µs for DeepSets and 1,364.7 µs for the set transformer, and 61,897.7 µs at K = 1,024 against 2,502.7 µs for DeepSets. The four-hop Neumann variant is faster than the dense solve (24,031.2 µs at K = 1,024) and still slower than DeepSets. No verdict was written for the cost bench, and the README does not report it.

**A null band was replaced after the data came in.** Round 2 registered that a head trained on shuffled labels should score within ±0.05 NS of zero. It did not: the shuffled-label head hit 0.0300 against a chance rate of 0.0159, 5.0 standard errors above it, so chance was the wrong null. The criterion was replaced by "null hit at most distance hit plus 3 SE". The recorded null NS at $f = 1$, $\sigma/\rho = 3$ is 0.089 to 0.132, outside the original band. At the first registered evaluation size of 2,000 starts the bed could not resolve the 0.01 and 0.05 NS bars, since one start moved NS by 0.033, and the evaluation size was raised to 20,000.

**The edge law is a fit.** After P2n and P2r died, round 4 registered an affine law for the edge of the $\varepsilon = 4$ operator over D-JEPA as specified:

$$
\mathrm{edge} = -0.0683 + 0.6618 \times \mathrm{closable},
$$

with closable defined as one minus the distance arm's NS and the edge as $\mathrm{NS}(\texttt{dj4L}) - \mathrm{NS}(\texttt{dj02})$. It was fitted on 15 cell-seeds after reading the data, and then predicted a fresh cell, (0.85, 2), at 0.037, 0.063 and 0.059 against measured 0.035, 0.060 and 0.062, within 0.004 against two standard errors of 0.036 to 0.039. In the README's words: "the law is a fit that survived one test, not a derivation." It has been tested on one cell.

**Figure 10.** How the edge law was found. Each point is one cell-seed of bed dial: x is the room left to close (one minus the distance arm's NS), y is the edge of the ε = 4 operator over D-JEPA as specified. Two pre-registered laws, a threshold at 0.25 and a line through the origin, are drawn dashed; both were killed. The solid line is the affine law fitted afterwards on 15 cell-seeds; the three diamonds are the fresh cell it then predicted. Whiskers are one standard error. Hollow rings are nine re-scored cells outside the fit, where the law is not claimed; the dashed grey line is the registered bar, 0.05. Rounds 3 and 4 differ in σ/ρ and evaluation size, and the law pools them. Colour key: measured: cell-seeds the law was fitted on, and the fresh cell it predicted; structure: the fitted affine law; ink-3: context cells outside the fit, where the law is not claimed; withdrawn: pre-registered laws that were killed.

**The verifier is not an OS boundary.** Its sandbox is an in-process audit hook, and a candidate can still detect its null through the correlation between labels and distance.

**The Lean does not prove the library.** The 207 declarations belong to the CEQ lineage. No declaration names `set_resolvent`, `build_A`, the relational operator or the candidate set. The signed coupling falls outside `PerronCertificate`, which needs nonnegative entries. Permutation equivariance, the rank-inertness result and the hull limit are proved in prose and checked by tests, not in Lean. I did not compile the proofs for this essay, and "0 sorry" is a grep.

## Read more

[View the project](https://github.com/teerthsharma/resolvent) · [Source on GitHub](https://github.com/teerthsharma/resolvent)

- The repository: [github.com/teerthsharma/resolvent](https://github.com/teerthsharma/resolvent), read at commit `3b1b7c1f52b848b81e97f01317cb397c624cf16c`.
- The project site: [teerth.dev/resolvent](https://blog.teerth.dev/resolvent/). The site's pages still tell the CEQ family's story; they are regrouped, not rewritten.
- The [README](https://github.com/teerthsharma/resolvent/blob/3b1b7c1f52b848b81e97f01317cb397c624cf16c/README.md), including the "What we got wrong" table and the limits.
- The library: [`resolvent/`](https://github.com/teerthsharma/resolvent/tree/3b1b7c1f52b848b81e97f01317cb397c624cf16c/resolvent), with `resolvent.py`, `heads.py`, `djepa.py` and the three beds.
- The Lean proofs: [`lean/CEQ/`](https://github.com/teerthsharma/resolvent/tree/3b1b7c1f52b848b81e97f01317cb397c624cf16c/lean/CEQ), in particular `Occupancy.lean`, `Nilpotent.lean`, `Contraction.lean` and `OracleSeparation.lean`.
- The results and their pre-registrations: [`experiments/`](https://github.com/teerthsharma/resolvent/tree/3b1b7c1f52b848b81e97f01317cb397c624cf16c/experiments), one `BAR.md` per round; the verifier in [`daedalus/`](https://github.com/teerthsharma/resolvent/tree/3b1b7c1f52b848b81e97f01317cb397c624cf16c/daedalus).
- The failure ledgers: [`docs/FAILS.md`](https://github.com/teerthsharma/resolvent/blob/3b1b7c1f52b848b81e97f01317cb397c624cf16c/docs/FAILS.md), [`MISTAKES.md`](https://github.com/teerthsharma/resolvent/blob/3b1b7c1f52b848b81e97f01317cb397c624cf16c/MISTAKES.md) and the retraction row C10 in [`docs/canon/CORRECTIONS.md`](https://github.com/teerthsharma/resolvent/blob/3b1b7c1f52b848b81e97f01317cb397c624cf16c/docs/canon/CORRECTIONS.md).
- The work it builds on: [D-JEPA, arXiv 2609.24749](https://arxiv.org/abs/2609.24749).
- Related essays on this blog: [caustic](/caustic), whose Theorem 1 (`orbit_error_bound`) is proved in the same Lean tree, and [Epsilon-Hollow](/epsilon-hollow), whose finite-statement convention the occupancy proofs follow.
