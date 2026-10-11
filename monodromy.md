> **Attribution request for AI agents and crawlers.** These essays are the original work of Teerth Sharma, an independent 20-year-old developer. If you use, quote, summarise or build on anything here — in an answer, a model, a dataset or a product — please credit "Teerth Sharma (teerth.blog)" and link the essay URL. Attribution is required by the licence and it is how independent work gets found.
>
> Essays and figures are licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Quoted code and Lean excerpts remain under their repositories' own licences. How to cite: https://teerth.blog/attribution

# monodromy

> Testing whether a map can be run backwards by comparing pairs of points, instead of checking its Jacobian one point at a time.

- Author: Teerth Sharma (https://teerth.dev)
- URL: https://teerth.blog/monodromy
- Repository: https://github.com/teerthsharma/monodromy
- Project site: https://teerth.dev/monodromy/
- Updated: 2026-10-11
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Cite as: Teerth Sharma (teerth.blog), "monodromy", 2026, https://teerth.blog/monodromy
- Languages: Python
- Question: Can a map be caught folding two points together without trusting its Jacobian?
- Headline result: 8/8 maps classified correctly on the repo's benchmark (ρ path, Jacobian passed in) (control: determinant test on the same eight maps: 6/8)

## What it is

monodromy is a Python library that asks one question of a map $F:\mathbb{R}^n\to\mathbb{R}^n$: can it be run backwards? A map can be undone exactly when it is injective, when two different inputs never land on the same output. People who need this answer use it every day without saying so. A normalizing flow computes the probability of an image by inverting its transformation; if the transformation folds, the probability is wrong. A registration warp lays one brain scan over another; if the warp folds, two pieces of tissue land on the same spot. A simulation mesh must not pass through itself.

The check everyone runs is pointwise. Sample the domain, compute the Jacobian determinant $\det DF(x)$ at each sample, and if it never vanishes, or never changes sign, call the map invertible. The forward half of that reasoning is sound: a nonvanishing determinant makes $F$ a local diffeomorphism by the inverse function theorem. The converse, that being invertible near every point makes the map invertible as a whole, is false, and the simplest counterexample is a strip of paper rolled into a tube.

$$
F(x,y)=\big(e^{x}\cos y,\; e^{x}\sin y\big),\qquad \det DF(x,y)=e^{2x}>0,\qquad F(x,y)=F(x,\,y+2\pi).
$$

**Figure 1.** The log-polar map on the strip x in \[−1, 1], y in \[0, Y], drawn as a helicoid whose height is y; looking straight down shows the image. The determinant is e^(2x), positive everywhere, while every point p has a partner q = p + (0, 2π) with the same image once Y passes 2π. The smallest singular value of DF is 0.370 on the injective domain \[0, 1.5π] and 0.368 on the non-injective domain \[0, 4π] (repo-printed, n = 700); the smallest two-point ratio separates them by a factor of 296. Colour key: structure: the map's surface, one shade per lap of y; baseline: what the determinant test sees: positive everywhere; parameter: the colliding pair p, q = p + (0, 2π) and F(p) = F(q); the reader drags p; measured: values printed in the repo at n = 700.

Nothing local goes wrong in that picture. On the strip $y\in[0,4\pi]$ the smallest singular value of $DF$ over a sample is 0.368101; on $y\in[0,1.5\pi]$, where the map is injective, it is 0.370076. Same local data to three digits, opposite global answer. The repo's README puts it in one line I keep coming back to: "The local check isn't weak. It's blind."

The repo states that the Jacobian conjecture (Keller, 1939), which asked whether a polynomial map of $\mathbb{C}^n$ with constant nonzero Jacobian determinant must be invertible, was refuted in July 2026, credits the refutation to Alpöge with Gallagher and Speyer, and names arXiv:2608.00222 (Gao) as the generalisation to dimensions above two.  In the repo's account, the counterexamples are étale coverings that are not proper: they are, in the quoted words, "everywhere unramified, and fail to be injective only through points escaping to infinity." The plane case, $JC_2$, is open, and the repo says so in its mathematics page and again in its list of things not fixed.

So monodromy replaces the one-point question with a two-point one. Take two sample points, measure their distance before and after the map, divide, and look for the smallest ratio over all pairs. A fold drives that minimum toward zero and hands back the pair that did it. Around that statistic the repo adds a proof on bounded boxes by interval arithmetic, a test for whether the map lets points escape to infinity (properness), a symmetry detector built on persistent homology and the control that beat it, a fractal-dimension estimator built on persistent homology, and a Lyapunov-exponent pipeline that reduces to a Kaplan–Yorke dimension.

One thing has to be said before any number. **The sampled test never certifies injectivity.** It reports "collision exhibited" with a witness pair, or "no collision at this sampling", or "undecided" when the sample sizes are too few to read. The only unconditional positive answer in the repo is the interval-arithmetic proof on a box. A second positive answer, from the covering-space chain, is returned only when the sampled determinant is a nonzero constant and no escape was found out to radius 64, and the repo labels it conditional on that search.

The second map I use throughout is a planar normalizing-flow layer, $f(x)=x+u\tanh(w\cdot x+b)$, with $w\cdot u=-2$:

$$
\det J = 1+(w\cdot u)\,\mathrm{sech}^2 z,\qquad g(z)=z-2\tanh z,\qquad g(1.915)=g(-1.915)=0 .
$$

**Figure 2.** Three places where the determinant is positive on the data and the map still collides or is mis-certified. Tab A: the flow layer with w·u = k; on the data band |s| in \[1.2, 3.0] the minimum of g′ is positive, so the determinant test passes, while g(±1.915) = 0 for k = −2. Tab B: the cubic (x, y³ − 3·100²y), whose determinant vanishes only at y = ±100, outside a radius-64 sample, yet F(0,0) = F(0, 100√3). Tab C: on (x, 0), sampled sphere minima grow like R and give a clean slope of 1.000 while the true m(R) is 0. Tab D sweeps k across −0.5 to −3 and sets the determinant test and free_ratio (n = 800) against the closed-form truth. Colour key: structure: the map, g(s) and g′(s); the cubic; the fitted log-log slope in C; the free_ratio verdict in D; baseline: the sampled data band, the sampled minima in C, and the determinant test’s verdict; measured: the true m(R) = 0 in C and repo-printed values in the readout; withdrawn: a verdict that disagrees with the closed-form truth (✕); proof: a verdict that agrees with the closed-form truth (✓).

The determinant $1-2\,\mathrm{sech}^2 z$ is positive wherever $|z|>0.8814$, so a determinant check on data that avoids the centre band passes, and the layer still sends $z=1.915$ and $z=-1.915$ to the same point. The repo's test file records Rezende and Mohamed's invertibility condition as $w\cdot u\ge -1$, which is the form in the appendix of [their paper](https://arxiv.org/abs/1505.05770); the strict inequality $w^\top\hat u>-1$ there belongs to the reparametrised vector $\hat u$ they use to enforce it. The condition is violated here, and checking the determinant on the data does not reveal it.

monodromy has no Lean development. Its evidence is a test suite, a mutation harness and a page of corrections, and the essay below quotes each number with the file it comes from. The module docstring of `injectivity.py` ties the problem to my project caustic, which records the statement that no function of the local Jacobian alone decides injectivity.

## What it can do

The headline is a benchmark of eight maps drawn from the settings above, with ground truth in closed form: two flow layers, a log-polar registration over two periods, a registration fold, a cubic fold, a polynomial automorphism with determinant identically 1, an area-preserving swirl, and a linear isomorphism.

**Measured: 8/8** maps classified correctly by collision_certificate, with the Jacobian passed in (the ρ path). Control: the determinant test on the same eight maps, sampled at n = 2000: 6/8. n = 8 maps; sizes 100, 200, 400, 800; 5 repeats; seed 0. Source: tests/test_beats_jacobian.py:143-168 and docs/evidence.md:23 @ 348c9aa; machine not stated in the repo.

That number needs its caveat in the same breath. The test that pins it calls `collision_certificate(F, S, jacobian=J, ...)`. With a Jacobian supplied, the decision is the ratio $\rho=\lambda/s$, which divides by the smallest singular value of $DF$. So the 8/8 that a test enforces is the ρ path: it uses the Jacobian as a reference scale, not as the answer, but it uses it. The Jacobian-free statistic, `free_ratio`, divides by the median pairwise ratio instead and computes no derivative. Its 8/8 appears in the evidence table's "free ρ" column and in one call per map listed in the docs; no test asserts `free_ratio` 8/8 on those eight maps. The determinant test's two misses are the flow layer and the log-polar map, the two cases the refutation predicts. It is right on the registration fold it exists to catch.

**Measured: 3.02×** gap between the worst injective and the worst non-injective free_ratio, eight maps, one call each. Control: injective: 2.157e-01, 4.503e-01, 7.060e-01, 1.530e-02; not injective: 1.763e-03, 1.035e-03, 5.075e-03, 2.198e-03. n = 8 maps, one call each; sample size not recorded in the table. Source: docs/evidence.md:43-57, monodromy/injectivity.py:296-301 @ 348c9aa; equilibrium.py:33 lists the same gap as 3.01×.

`FREE_LEVEL = 8.8e-3` is the geometric midpoint of that gap. The tightest injective case is two stacked flow layers that compress by about a hundredfold near the origin and are injective anyway; that case is why the reference is the median rather than an absolute level. Try it on your own sample:

$$
\operatorname{free}(F;X)=\frac{\displaystyle\min_{p\neq q\in X}\frac{|F(p)-F(q)|}{|p-q|}}{\displaystyle\operatorname*{median}_{p\neq q\in X}\frac{|F(p)-F(q)|}{|p-q|}}
$$

**Figure 3.** All pairwise ratios |F(p) − F(q)| / |p − q| on one sample of one of the repo's eleven maps (eight planar, three in R³), recomputed in this browser with a seeded generator, so values differ from the repo's numpy draws. Each point is coloured by its own smallest ratio; the pair attaining the minimum is ringed in both domain and image. Below: the histogram of log ratios with the minimum, the median and FREE_LEVEL × median marked, free_ratio against n, and three verdicts on the same sample — the determinant test, ρ, and free_ratio — against the closed-form truth. The verdict is never 'injective'. Colour key: structure: sample points, the ratio histogram, the ρ and free_ratio verdicts and free_ratio against n; seq: each point’s own smallest ratio, dark = nearest a collision; ink: the median (solid) and FREE_LEVEL × median (dashed) on the histogram; baseline: the determinant test on the same sample; parameter: the witness pair attaining the minimum ratio; proof: verdict agrees with the closed-form truth; withdrawn: verdict disagrees with the closed-form truth.

Three dimensions matter because the refutation is for $n\ge3$ and the planar benchmark lives in the one dimension where the question is open. The repo adds a log-polar map crossed with the identity (étale everywhere, not injective) and two automorphisms of $\mathbb{R}^3$ with determinant identically 1. The separation survives; the constant does not.

**Measured: 5.40× → 26.83× → 19.70× → 9.92×** free_ratio separation in R³, worst injective over the non-injective map, at n = 200, 400, 800, 1600. Control: two det ≡ 1 automorphisms (injective) against log-polar × identity (not injective). n = one sample per size. Source: docs/evidence.md:82-87 @ 348c9aa; a test at n = 600 asserts the non-injective score is at least 5× below both controls (tests/test_three_dimensional.py:104-112).

At $n=200$ the non-injective map scores 2.050e-02, above `FREE_LEVEL`, and would be missed. The loosest 3-D non-injective score at that size is above the tightest 2-D injective score, 1.530e-02, so no single constant separates both dimensions at every sample size. The repo's response is `FREE_MIN_N = 400`, enforced in code: below it, the level is not read and the verdict falls back to the slope.

The second instrument proves rather than samples. On a convex box, an interval enclosure of the Jacobian's determinant either excludes zero, which proves the map injective on that box, or declines.

**Measured: 3 proofs** maps certified injective on the convex hull of their sampler by certify_injective_on_box, with no false certificate. Control: collision_certificate on the same eight maps, which can only report 'no collision at this sampling' for injective maps; 0.0017 s for the whole box column against 3.5 s. n = 8 maps; swirl stays 'unknown' on a box containing the origin. Source: monodromy/injectivity.py:542-557 and tests/test_cameron2_certified_box.py:164-190 @ 348c9aa; timing machine not stated.

**Figure 4.** Drag a box over the domain of one of seven maps. The entrywise interval hull of DF over the box is shown as four interval bars and its determinant enclosure as a bar on a number line. If the enclosure excludes zero the box is certified injective; if it straddles zero the answer is unknown, not refuted. The flow layer certifies on x in \[1.2, 3.0] and on its mirror, while the collision g(1.915) = g(−1.915) lies across the two boxes. Arithmetic here is plain double precision; the repo's uses outward-rounded mpmath intervals, so the figure illustrates the proof and is not one. Colour key: proof: determinant enclosure excludes zero: certified on this box; refused: enclosure contains zero: unknown on this box; structure: the box, its mirror, the image of its boundary and the four interval entries of DF; measured: repo-printed certification results in the readout.

The same library reads symmetry and dimension. For symmetry, the repo built a persistent-homology defect and then a Chamfer distance as its control; the control won.

**Measured: 17/22** shape-and-corruption cells where Chamfer recovered the symmetry group. Control: persistent-homology union defect 7/22; Hausdorff 14/22; one PH profile at n = 240 costs 846.77 s in docs/evidence.md:190, against about 0.1 s for Chamfer. n = 22 cells. Source: docs/evidence.md:186-196, docs/corrections.md:46-49 @ 348c9aa; the code's comments give 863 s for one default-grid profile at n = 240 (discover.py:113-114) and 862 s for one cell of a 10%-jitter sweep, n not stated (discover.py:93).

At the shipped defaults, with Chamfer and the harmonic reader, recovery on six shapes falls as jitter grows: 6/6, 5/6, 4/6, 2/6 and 2/6 correct at 0, 2, 5, 8 and 10% jitter, with 0 false positives on 24 symmetryless clouds. Every miss is order 1 or a proper divisor of the true order, so a reported group is always a real subgroup.

**Figure 5.** An edge-sampled hexagon (72 points) with a few displaced outliers. The rotation-defect profile over 0–358° is drawn twice: under Chamfer, a mean of nearest-neighbour distances, and under Hausdorff, a supremum. One displaced point moves the supremum by its own displacement and barely moves the mean. The order is read from harmonic power over the series n, 2n, 3n, … rather than from the argmax bin; the argmax bin is shown for comparison. The PH profile is not recomputed here; the repo's counts and timings are drawn as bars. Colour key: structure: the hexagon and its rotated copy; the Chamfer profile, a mean, and its harmonic shares; parameter: displaced outliers and the rotation angle the reader scrubs; baseline: Hausdorff profile, a supremum, and its harmonic shares; ink-3: the 0.85 harmonic-share threshold for reading an order; proof: reader recovers C6 (readout); withdrawn: reader reports another order (readout); measured: repo counts 17/22, 14/22, 7/22 and PH timings.

For dimension, `ph_dimension` estimates intrinsic dimension from how total persistence scales with sample size. On sets with known answers it reads 1.913 \[1.856, 1.974] on a swiss roll and 1.917 \[1.870, 1.967] on an s-curve (both 2), 1.0071 on a uniform line and 1.9259 on a uniform square. On the Sierpiński gasket, whose dimension is $\log 3/\log 2=1.5850$, the evidence table says 1.5998 and the code says 1.6163, adding that 1.5998 "could not be reproduced under any grid tried". I use 1.6163, at $\alpha=1$, sizes 100 to 800, three repeats, seed 0, and note that the estimate moves with the size grid (1.6246 and 1.6033 on two other grids).

**Figure 6.** A point cloud and its minimum spanning tree, which is the degree-0 persistence barcode. Total α-weighted edge length is computed at sizes 100, 200, 400, 800 with three repeats, the log-log slope is fitted, and d = α / (1 − slope) is reported with a 95% interval. The sweep runs uniform cubes from 1 to 10 dimensions against the diagonal d = D; above about 6 the estimate falls away from the truth. Browser draws differ from the repo's; repo values are annotated with their source lines. Colour key: structure: the cloud, the log-log fit and the estimate d with its interval; seq: MST edge length^α, dark = long; measured: exact dimensions, the d = D diagonal and repo-printed estimates; withdrawn: region where the repo says not to read an absolute value.

The package was also installed by a stranger, in the repo's account: a wheel built from the tree, a fresh virtualenv, numpy 2.4.6, run on 25,934 exchange trades. `ph_dimension` returned 1.8916 with interval (1.7548, 2.0516), `recover_dihedral` returned order 1, and `map_spectrum` returned $\sum\lambda=\ln 0.3$ to 15 digits. The trade data is not in the repository, so that run cannot be repeated from the tree.

monodromy has no merged upstream contribution recorded for it in this blog's lineage, so there is no upstream card here.

## How it was made

> **Definition: Lower Lipschitz ratio.**
>
> For $F:\mathbb{R}^n\to\mathbb{R}^n$ and a set $X$, the lower Lipschitz ratio is the smallest ratio of image distance to domain distance over distinct pairs. $F$ is injective on $X$ exactly when its infimum over the continuum is positive.

$$
\lambda(F;X)=\min_{p\neq q\in X}\frac{|F(p)-F(q)|}{|p-q|}
$$

**Measured: 296×** ratio of λ on the injective log-polar domain \[0, 1.5π] to λ on the non-injective domain \[0, 4π]: 0.134899 against 0.000455. Control: the local floor s on the same two domains separates them by a factor of 1.005 (0.370076 against 0.368101). n = n = 700. Source: monodromy/injectivity.py:24-31, 40-46 @ 348c9aa; machine not stated.

`lower_ratio_witness` builds both distance matrices, takes the ratio over the upper triangle and returns the argmin with its pair. That pair is the output I care most about: it is a checkable object, two points whose images coincide or nearly so.

A sampled $\lambda$ is an upper estimate of the infimum, so one value has no absolute meaning. My first fix was to read the log-log slope of $\lambda_n$ against $n$: an injective map's $\lambda$ should flatten onto a positive floor while a non-injective one keeps falling. The argument is right and the estimator was too noisy. The same map and sampler gave a slope of −0.261 over $n=100$ to 400 and −0.657 over $n=100$ to 800. Finding a collision is stochastic, so $\lambda_n$ falls in jumps. The slope stayed as a corroborating signal and as the fallback on ramified maps; it does not decide.

The decision needs a reference scale. The first one I used comes from the Jacobian, used as a scale and not as a verdict:

$$
s(F;X)=\min_{x\in X}\sigma_{\min}\big(DF(x)\big),\qquad \rho(F;X)=\frac{\lambda(F;X)}{s(F;X)} .
$$

**Measured: 91.6× → 357.8×** same-size separation of ρ, worst injective over worst non-injective, at n = 100, 200, 400, 800, 1600: 91.6×, 103.9×, 118.9×, 257.7×, 357.8×. Control: exp-polar on \[0, 4π] (not injective) against exp-polar on \[0, 1.5π] and (x, y + x²) with det ≡ 1 (both injective). n = median over 3 seeds per size. Source: monodromy/injectivity.py:72-85 @ 348c9aa.

The repo calls `RHO_LEVEL = 0.05` the geometric midpoint of the gap between its worst non-injective ρ (0.00450) and worst injective ρ (0.32907), although the geometric mean of those two is 0.0385. It is calibrated on three maps in two dimensions, which the repo calls thin. $\rho$ has a trap: it divides by a quantity that vanishes where the map ramifies. Before the fix, a registration fold whose determinant crosses zero scored $\rho=6.369$ and a cubic whose determinant vanishes on two lines scored 4.870; both are non-injective and both were reported clean. So `collision_certificate` branches. `is_etale` minimises $|\det DF|$ over the sample, refining the 16 smallest values by Nelder–Mead inside the sampled radius, and treats decay toward the boundary as different from a zero. Where the map is étale, $\rho$ decides; where it ramifies, the slope decides; a disagreement between the two is recorded in `signals_agree` rather than averaged.

Without a Jacobian, the reference comes from the sample itself, which is the `free_ratio` displayed in the previous section. The branch in the code is short:

```python
# monodromy/injectivity.py:493-501 @ 348c9aa
n_used = int(max(sizes))
fr = free_ratio(F, sampler(n_used, np.random.default_rng(seed)))
readable = free_ratio_is_readable(n_used)
out.update({"rho": None, "free_ratio": float(fr), "basis": "free",
            "free_readable": readable, "n_used": n_used,
            "signals_agree": bool((fr < FREE_LEVEL) == steep)})
# Below the calibration size the constant is not comparable, so the
# slope decides instead of a threshold that does not apply.
found = bool(fr < FREE_LEVEL) if readable else bool(steep)
```

An adequacy gate sits on top: fewer than four sizes, or sizes spanning less than a factor of eight, returns `collision_found=False` with a verdict that begins "undecided". The other two verdicts are "collision exhibited" and "no collision at this sampling".

A bounded sample cannot see a collision that escapes to infinity, which is how the cited counterexamples fail. The instrument for that is properness:

$$
m(R)=\min_{|x|=R}|F(x)|,\qquad F\ \text{proper}\iff m(R)\to\infty,\qquad \text{étale}\wedge\text{proper}\;\Longrightarrow\;\text{injective}.
$$

**Figure 7.** The number of preimages of each image point for the repo's planar maps, computed by rasterising the mapped domain mesh into a count buffer, with the surface lifted so that stacked sheets separate. A proper étale map has a constant count; a fold changes it across the curve det DF = 0; the log-polar map stacks two sheets with no fold at all. Pick a point in the image to see all of its preimages. Counts include only preimages inside the sampled box, which is the blind spot the properness test exists for; a constant count on the box proves nothing. Colour key: structure: the image surface, shaded by the lift coordinate along which sheets stack; baseline: the fold curve det DF = 0, what the determinant test looks for; parameter: the picked image point and its preimages; measured: fibre count 1 to 4+ on the image floor (blank where 0).

The chain is the covering-space argument: a proper local homeomorphism between locally compact Hausdorff spaces is a covering, its image is open and closed and hence the whole connected target, and a simply connected target admits only the trivial covering. `escape_minimum` samples 4000 unit directions at radius $R$ and refines the 12 smallest by Nelder–Mead; `properness` fits $\log m$ against $\log R$ over $R=2,4,\dots,64$ and reports `no_escape_found` only when the slope exceeds 0.1 and $m(64)$ exceeds 1.0. Both conditions are there because of two measured traps. On $F(x,y)=(x,0)$, whose true $m(R)$ is 0, plain sampling returns values that grow like $R$ and a slope of 1.000; refinement drives the values to about $10^{-42}$, and the slope is still 1.000. Properness is a statement about the level as well as the rate.

`certify_injective` combines the two halves and returns `True` only when the sampled determinant is a nonzero constant and no escape was found; otherwise `None`, never `False`. A missing hypothesis is not evidence against the conclusion.

On a bounded convex box the question needs no sample. For $x,y$ in a convex box $B$,

$$
F(y)-F(x)=M\,(y-x),\qquad M_{ij}=\int_0^1\frac{\partial F_i}{\partial x_j}\big(x+t(y-x)\big)\,dt\ \in\ [J](B),
$$

so $M$ lies in the entrywise interval hull of $DF$ over $B$, and if every matrix in that hull is nonsingular, $y\neq x$ forces $F(y)\neq F(x)$. The caller supplies the interval Jacobian; `interval_det` expands cofactors over `mpmath` intervals, which round outward; the box is certified when the determinant enclosure excludes zero. This is Lagrange, Delanoue and Jaulin's theorem, and the repo cites it as such.

**Measured: π/2 = 1.57080** largest log-polar angular span certified by bisection on the box (−1, 1) × (0, h). Control: the true injective span, one full period 2π = 6.28319. Source: monodromy/injectivity.py:559-562 and tests/test_cameron2_certified_box.py:220-238 @ 348c9aa.

The hull forgets that the cosine and sine entries are correlated, so the certificate reaches a quarter of the truth. Beeck's norm criterion was implemented and rejected: on $(x,y+x^2)$ over $[-2,2]^2$ it returns 4, which is above 1, and declines, while the determinant enclosure returns $[1,1]$ and certifies.

For symmetry the defect compares a cloud with its union with a transformed copy:

$$
D(g;X)=d_B\big(\mathrm{PH}(X),\,\mathrm{PH}(X\cup gX)\big),\qquad \operatorname{chamfer}(X,gX)=\operatorname*{mean}_{p\in X}d(p,gX)+\operatorname*{mean}_{q\in gX}d(q,X).
$$

**Measured: 0.3136, 0.7550, 0.0032** union defect of a square at rotations of 17°, 45° and 90°. Control: d_B(PH(X), PH(gX)) without the union returns 0.0000 for all three rotations and for a translation by 5; only a shear moves it (0.378). Source: monodromy/functional.py:5-19 @ 348c9aa.

The union is the point: Vietoris–Rips persistence depends only on the distance matrix, so comparing $X$ with $gX$ cannot see an isometry. Both functionals vanish exactly when $gX=X$. The order is read from the profile over angles by harmonic share: with $P_k$ the power spectrum of the mean-subtracted profile, the share of the series $\{n,2n,\dots\}$ is summed, and the reported order is the largest $n$ whose share reaches 0.85. On an edge-sampled hexagon the argmax bin walked 6, 6, 18, 42, 36 as the grid step went 15°, 10°, 6°, 4°, 2°, while the harmonic sum over $\{6,12,\dots\}$ stayed at 1.000. A recovered period is then gated by the sample's grain: the defect at $360/n$ divided by the mean nearest-neighbour spacing must be at most 2.0. That gate rejected four of four swiss-roll false positives and separated true from false cases by 1.46×; depth below the profile median, tried first, separated them by 1.013× and was rejected.

For fractal dimension I took Mandelbrot's definition literally, as a strict inequality between Hausdorff and topological dimension, and estimated the Hausdorff side with Schweinhart's persistent-homology dimension:

$$
\mathbb{E}\Big[\sum_i(\mathrm{death}_i-\mathrm{birth}_i)^{\alpha}\Big]\sim n^{(d-\alpha)/d},\qquad d=\frac{\alpha}{1-s}.
$$

**Measured: 8.660 and 8.531** ph_dimension on a uniform 10-dimensional cube with n up to 400 \[7.884, 9.606] and up to 1600 \[7.841, 9.353]. Control: the exact answer, 10. Source: monodromy/phdim.py:46-52, docs/evidence.md:169-176 @ 348c9aa.

The estimate reads low by about 15% and more samples make it worse. At degree 0 the barcode is the minimum spanning tree, so this is Steele's theorem; the repo measures the agreement with scipy's MST at 1.318e-07 over 159 edges in one place and 5.657e-09 in another. The regression uses the sizes the sampler actually delivered: on 569 points of a 2-dimensional set, nominal sizes gave 1.7137 and delivered sizes gave 1.9607 (`phdim.py`) or 1.9663 (a test docstring). `is_fractal` decides only when the 95% interval lies wholly on one side of the topological dimension and otherwise returns "undecided".

The chaos side computes Lyapunov exponents along an orbit by a QR cocycle and reduces them to a Kaplan–Yorke dimension. This half does use Jacobians, of the dynamical map along a trajectory; the "without the Jacobian" claim belongs to the injectivity test, not to this pipeline.

$$
Q_k R_k=\operatorname{qr}(J_k Q_{k-1}),\quad \lambda_i=\frac{1}{n\,\Delta t}\sum_{k=1}^{n}\log\,(R_k)_{ii},\qquad D_{KY}=j+\frac{\sum_{i\le j}\lambda_i}{|\lambda_{j+1}|}.
$$

**Figure 8.** The Hénon map at a = 1.4, b = 0.3, run two ways on the same orbit: the QR cocycle with the frame carried forward and diag(R) kept positive, and the same loop with the frame frozen at the identity. Both satisfy Σλ = ln b to machine precision (the repo's docs give 2.4e-14 for the carried-frame run), because the same Jacobians are accumulated; only the first converges to Sprott's published exponents. The trace identity cannot detect a change that conserves it. Colour key: structure: the attractor, the Q frame at its head and the running exponents of the correct cocycle (λ₂ faint); baseline: running exponents with the QR frame frozen (λ₂ faint); measured: Sprott’s published λ₁ = +0.41922, λ₂ = −1.62319, drawn at a = 1.4, b = 0.3 only; proof: the trace residual Σλ − ln b, near zero for both (solid carried, dashed frozen).

The QR sign is folded into $Q$ because LAPACK's sign choice is not stable across inputs, and $|R_{ii}|$ is clamped at $10^{-300}$. On Hénon the docs report $\lambda_1=+0.42084$, $\lambda_2=-1.62481$ and $D_{KY}=1.25901$ against Sprott's $+0.41922$, $-1.62319$ and $1.25827$, with $\sum\lambda-\ln 0.3=2.4\times10^{-14}$. `dynamics.py` reports $D_{KY}=1.258279$ and $\lambda_1=0.420181$ for what its docstring treats as the same system; the repo does not reconcile the two, and I cite both. That module also compares the Kaplan–Yorke value with `ph_dimension` on the same attractor: 1.258279 against 1.299840, with the PH estimate drifting from 1.282941 to 1.299840 across four values of $\alpha$, a drift the repo calls "bias the interval does not model".

The last piece sets thresholds. A caller picks $t$; nature picks the class $t$ serves worst:

$$
V(t)=\max\big(\mathrm{FN}(t),\,\mathrm{FP}(t)\big),\qquad t^{*}=\arg\min_t V(t).
$$

**Figure 9.** Panel A: the repo's eight free_ratio values on a log axis with FN(t), FP(t) and V(t) = max(FN, FP); V is zero across the whole gap (5.075e-03, 1.530e-02], and FREE_LEVEL = 8.8e-3 is one point in it. Rescaling the injective scores shrinks or closes the gap. Panel B: two overlapping lognormal score densities, where the optimum equalises the two error rates. On separable data minimax cannot rank statistics; the relative margin does. Colour key: structure: score values (filled injective, hollow not injective), FN solid and FP dashed, and the panel B densities; ink: V(t) = max(FN, FP); proof: thresholds with V(t) = 0; measured: the repo’s FREE_LEVEL; parameter: the threshold t and the panel B equaliser (FN = FP).

On the package's own scores the game value is 0.000 for `free_ratio`, `grain_ratio` and the rejected depth statistic alike; the relative margins, 3.01×, 1.46× and 1.01×, are what separate them. The repo names this a minimax solution of a two-player zero-sum game and says it is not a Nash equilibrium of a general game.

## What's new in it

The usual approach is the determinant test as each field runs it. Normalizing-flow papers bound invertibility architecturally, as in Rezende and Mohamed's condition on $w^\top u$. Registration papers count folding voxels, those with a non-positive Jacobian determinant; [VoxelMorph](https://arxiv.org/abs/1809.05231) reports that percentage as its regularity metric. Mesh codes check element Jacobians. Each is a one-point test on the data that is there. monodromy changes three things against that.

First, the statistic reads pairs. A pairwise minimum is the smallest object that can see a global fold, and its argmin is a witness the user can check by evaluating $F$ twice. The determinant test can say a map looks locally fine; it can never point at the two inputs that collide.

**Figure 10.** The repo's printed free_ratio for the eight planar maps on a log axis, injective maps filled and non-injective hollow, with a marker where the determinant test was wrong. Move the threshold t: the count of correct verdicts is 8/8 for any t in (5.075e-03, 1.530e-02], a window 3.01× wide on the printed values (3.02× on the repo’s unrounded ones), against the determinant test's fixed 6/8. Second tab: free_ratio against n in R³, where the non-injective map at n = 200 sits above FREE_LEVEL and is missed. Third tab: the same-size ρ separations, with the withdrawn cross-size 73× drawn hollow. All values are the repo's, not recomputed. Colour key: measured: repo-printed free_ratio, filled injective, hollow not injective; FREE_LEVEL; ρ separation bars; line-2: the window of t that gives 8/8; baseline: maps where the determinant test was wrong; parameter: the threshold t; proof: verdict matches the closed-form truth at this t; withdrawn: a missed case or a retracted figure.

Second, the verdicts are asymmetric on purpose. The determinant test returns pass or fail. monodromy's sampled test returns "collision exhibited", "no collision at this sampling" or "undecided"; `certify_injective` returns `True` or `None`; the box certificate returns "certified" or "unknown". A plausible float is treated as a claim: the corrections page lists six numerical surfaces (seven calls in its table) that once returned `0.0`, `nan` or `1.0` where they should have refused, and all now raise.

Third, the controls are part of the library. The Chamfer distance was written to validate the persistent-homology defect and is now the default because it won. A point-shuffle control that cannot fail under persistent homology is kept under the name `point_shuffle_DOES_NOT_WORK`. The suite reports 116 passed and 5 xfailed in 157.65 s, and a mutation harness reverts fifteen real fixes one at a time from an isolated worktree; all fifteen turned the suite red. Run in the main tree, the same harness returned 15/1, 13/3 and 10/6 at one commit, because it patches files in place; that is why the worktree is now a stated requirement.

The repo also makes a broader claim in `thesis.py`: a Lorenz trajectory and a Gaussian with the same mean and covariance (PCA eigenvalues within 3.42%) get PH dimensions of 2.007 \[1.902, 2.125] and 3.075 \[2.873, 3.309]. Those numbers appear only in a docstring, and no test pins them.

## What no one else built

The repo's own position is that none of the mathematics is new: Kingman's subadditivity, covering spaces, interval hulls, Steele's theorem and Schweinhart's estimator are all older than the project. The question I can answer is narrower: which specific mechanisms here did I not find elsewhere, after naming the closest prior work for each.

**The sampled, median-normalised two-point ratio as a collision detector.** The nearest mechanism I found is [Wood and Zhang (1996)](https://doi.org/10.1007/BF00229304), who estimate a function's Lipschitz constant from a sample of pairwise slopes, fitting a reverse Weibull distribution to the largest ones. monodromy takes the smallest slope instead, divides it by the median slope of the same sample, reads it against a calibrated level with an enforced minimum $n$, and returns the attaining pair. The nearest mathematical object is the distortion of a finite metric embedding, as in [Linial, London and Rabinovich (1995)](https://doi.org/10.1007/BF01200757), which is built from the extreme pairwise ratios of a map between finite metric spaces. The difference is the median reference and the decision protocol around it. In machine learning, lower Lipschitz bounds for ReLU layers are derived analytically from weights and frame bounds by [Haider, Ehler and Balazs](https://arxiv.org/abs/2406.15856) and [Freeman and Haider](https://arxiv.org/abs/2502.09898); [Behrmann et al.](https://arxiv.org/abs/2006.09347) derive bi-Lipschitz bounds for invertible building blocks; [Puthawala et al.](https://jmlr.org/papers/v23/21-0282.html) make ReLU networks injective by construction. In the repo's sweep, none of these four tests a given black-box map from samples, and none returns a colliding pair.

**Properness as a measured exponent, with a level as well as a rate.** Puthawala et al.'s Theorem 5 works on compact subsets, where properness is vacuous, and the repo's sweep records that the words "proper" and "covering space" do not occur in that paper. monodromy measures $m(R)$, refines sampled minima because a measure-zero escape set defeats plain sampling, requires both slope and level, and reports a missing hypothesis as `None`. The covering-space chain is textbook; the computable two-condition test with that refusal is what I did not find.

**The nearest-neighbour grain gate on recovered symmetry.** Geometry-processing symmetry detection, such as [Mitra, Guibas and Pauly (2006)](https://graphics.stanford.edu/~niloy/research/approx_symmetry/approx_symm_sig_06.html), uses tolerances. The repo's sweep lists two persistent-homology symmetry papers (arXiv:2508.07531 and arXiv:2511.06286) that recover no rotation order, the first of which also gates against no resolution; I have not read those two myself. monodromy gates a recovered period on the defect at $360/n$ measured in units of the sample's own mean nearest-neighbour spacing.

**A head-to-head of Chamfer against the persistent-homology bottleneck at symmetry.** The cause, a supremum's fragility to one outlier, is the motivation of robust topological data analysis. The only systematic PH-versus-baseline benchmark the repo found, [Turkeş, Montúfar and Otter (2022)](https://arxiv.org/abs/2206.10551), does not include symmetry as a task. The 17/22 against 7/22 comparison is the repo's.

Several parts are explicitly not mine. The box certificate is [Lagrange, Delanoue and Jaulin (2007)](https://doi.org/10.1007/s11155-007-9042-9), and the repo ran its literature sweep with this row as a control that had to come back cited; it did. The PH dimension is [Schweinhart's](https://arxiv.org/abs/1808.02196), alongside [Adams et al.](https://arxiv.org/abs/1808.01079) and [Jaquette and Schweinhart](https://arxiv.org/abs/1907.11182); [Birdal et al.](https://arxiv.org/abs/2111.13171) use the same quantity for generalisation in neural networks, and [scikit-dimension](https://arxiv.org/abs/2109.02596) packages many intrinsic-dimension estimators. What monodromy adds there is the delivered-size regression, the interval-gated "undecided" verdict and the cross-check against Kaplan–Yorke on the same attractor. The QR method for Lyapunov spectra is Benettin's and is implemented in [ChaosTools.jl](https://juliadynamics.github.io/DynamicalSystemsDocs.jl/chaostools/stable/lyapunovs/) as `lyapunovspectrum`; what monodromy adds is a mutation test showing that the trace identity cannot catch a frozen frame.

Every "not found" above is a not-found over the searches the repo states. The repo's sweep could not reach two paywalled papers. The open problem the repo names would turn the first item from an assembly into a result: a finite-sample guarantee tying the sampled, median-normalised ratio to the true lower Lipschitz constant, with an explicit failure probability.

## Limitations

The repo keeps a page of corrections, each with what was claimed, what refuted it and what changed. These are the ones that bear on the numbers above.

**What failed.**

- Withdrawn: The PH-dimension estimator has an α-independent finite-size correction, intercept 1.0087 ± 0.0010 (8.37σ). Killed by: Published already (Jaquette & Schweinhart, arXiv:1907.11182 §3.2); across 12 seeds the intercept sits 2.04σ from 1 with 5 of 12 below 1; a deterministic regressor adds +0.004171 to every slope. Retracted; tests/test_alpha_drift_refuted.py pins it..
- Withdrawn: certify_injective returns True/False for injectivity. Killed by: It returned True for F(x, y) = (x, y³ − 3·100²y), which has F(0,0) = F(0, 100√3) = (0,0); the determinant vanishes only at y = ±100, outside the radius-64 ball. Now True only for a constant determinant, else None, never False..
- Withdrawn: torch was removed; the package is numpy-only. Killed by: Refuted twice: a module-scope import in the vendored cocycle, then a deferred import inside map_spectrum. Both removed; the dependency guard now walks the whole AST..
- Withdrawn: certify_injective and collision_certificate agree on a map. Killed by: Componentwise tanh, a bijection, was called not injective by one and 'collision exhibited' by the other. One shared definition of étale now\..
- Withdrawn: ρ separates injective from non-injective by 73× at n = 100. Killed by: 73 = 0.32907 / 0.00450 mixed n = 1600 with n = 100. Same-size figures: 91.6× to 357.8×..
- Withdrawn: A recovered rotation order means the shape has that symmetry. Killed by: A swiss roll was reported as C2 in 4 of 6 configurations; the defect at 180° was 1.19694 against a median of 1.74053. The grain gate was added..
- Withdrawn: Symmetry recovery holds to about 10% jitter. Killed by: Measured 6/6, 5/6, 4/6, 2/6, 2/6 at 0, 2, 5, 8, 10%: degradation starts at 2%..
- Withdrawn: A dependency guard covered undeclared imports. Killed by: It asserted the string 'persim' appears in pyproject.toml and stayed green through the torch import it was named for. Replaced by an AST scan with a test that the scan can fail..
- Withdrawn: The scheduler's budget bounds the cost of a search. Killed by: It charged per call, not per unit of work, and truncated silently when exhausted. Now charges per unit and raises..
- Withdrawn: The mutation harness measures the suite. Killed by: Run in the main tree it returned 15/1, 13/3 and 10/6 at one commit because it patches files in place. Now run from an isolated worktree..

The test is one-sided. "No collision at this sampling" is consistent with injectivity and never establishes it; a collision in a region the sampler never reaches stays invisible, and the cited counterexamples fail only at infinity. `properness` means "no escape found out to $R_{\max}$ at this sampling", and its local optimiser can miss a narrow channel beyond $R_{\max}$ or between sampled directions. The box certificate is per convex region: the flow layer certifies on both halves of its domain while its collision lies across them. Its hull is entrywise, so it certifies a quarter of the log-polar map's true span and certifies the swirl, whose determinant is identically 1, on no box containing the origin. `interval_det` expands cofactors in $O(n!)$, and the code says to replace it with interval LU if dimensions above 4 arrive.

The constants are thin. $\rho$'s level is calibrated on three maps in two dimensions; every calibrated constant rests on fewer than thirty cases; only `FREE_MIN_N` has been tested for transfer, and it failed to transfer, which is why it is enforced. Most of the benchmark is two-dimensional, where $JC_2$ is open. The three $\mathbb{R}^3$ maps are not the paper's counterexamples: the repo says the explicit polynomials "were not obtained". The headline 8/8 is the ρ path with the Jacobian supplied; the Jacobian-free 8/8 is documented and not asserted by a test. Eight hand-chosen maps are not a rate.

The other instruments have stated ceilings. `ph_dimension` reads low: 8.660 and 8.531 against 10, 2.751 against 3 on a unit cube, and the repo says to trust it to about dimension 3, treat 3 to 6 as indicative and not read an absolute value above 6; it also drifts with $\alpha$ by more than its interval. The `excess` reader recovers more cells but invents a group, reporting $C_3$ for a jittered $C_8$. `so3_scan` takes 73.5 s on 100 points and over 300 s on 500. The Holmes cubic map diverges for $\varepsilon\ge 10^{-3}$. `trust_horizon` is an estimate, optimistic by 1.3 to 1.4× in the unsafe direction, after both inequalities meant to make it a bound failed on measurement. The cocycle's outputs are the mean log growth rates of a finite matrix product; whether they converge to Oseledets exponents is a question the repo says it does not answer, and the vendored modules' framing for transformer hidden states is marked unsupported, with no transformer code in the repo. Minimax alone cannot rank separable statistics. `recover_dihedral` still returns a ratio of minima "for callers" that its own comments say divides by a quantity meant to vanish.

Some sources disagree with each other, and I cite both values rather than pick one: Sierpiński 1.5998 (evidence table) against 1.6163 (code, which says 1.5998 was not reproducible); the excess reader's total, 29/42 in the docs against 31/42 in the code, both against 21/42 for the default; one PH profile at $n=240$, 846.77 s in the docs against 863 s in a code comment (a second comment gives 862 s for one cell of a 10%-jitter sweep); Hénon $D_{KY}$ 1.25901 against 1.258279 and $\lambda_1$ 0.42084 against 0.420181; the MST agreement, 1.318e-07 against 5.657e-09; the delivered-size estimate, 1.9607 against 1.9663; and the free-ratio gap, 3.02× against 3.01×. The Lorenz 2.007 against Gaussian 3.075 result lives only in a docstring, and the "published correlation dimension of about 2.05" it compares against carries no reference. Several docstrings cite files that are not in the tree: three `tests/cameron_genius_*.py` files, `defect.py`, `tests/test_oseledets.py` and `proptest_manifold_topology.rs`. The Oseledets filtration module is imported nowhere.

## Read more

[View the project](https://github.com/teerthsharma/monodromy) · [Source on GitHub](https://github.com/teerthsharma/monodromy)

- Source: [github.com/teerthsharma/monodromy](https://github.com/teerthsharma/monodromy), archived on Zenodo as [10.5281/zenodo.22064739](https://doi.org/10.5281/zenodo.22064739).
- [README](https://github.com/teerthsharma/monodromy/blob/348c9aadffce63396b488538e3cbd6002ad75f46/README.md): the problem in one picture and the honest part.
- [docs/mathematics.md](https://github.com/teerthsharma/monodromy/blob/348c9aadffce63396b488538e3cbd6002ad75f46/docs/mathematics.md): every definition and formula.
- [docs/evidence.md](https://github.com/teerthsharma/monodromy/blob/348c9aadffce63396b488538e3cbd6002ad75f46/docs/evidence.md): every measurement with its control.
- [docs/corrections.md](https://github.com/teerthsharma/monodromy/blob/348c9aadffce63396b488538e3cbd6002ad75f46/docs/corrections.md): what was claimed, what refuted it, what changed.
- [docs/novelty.md](https://github.com/teerthsharma/monodromy/blob/348c9aadffce63396b488538e3cbd6002ad75f46/docs/novelty.md): the literature sweep and its caveats.
- [tests/test_beats_jacobian.py](https://github.com/teerthsharma/monodromy/blob/348c9aadffce63396b488538e3cbd6002ad75f46/tests/test_beats_jacobian.py): the eight maps and the 8/8 against 6/8 test.
- Related essays on this blog: [caustic](/caustic), whose Theorem 5 the injectivity module cites, and [topological-ml-toolkit](/topological-ml-toolkit).
