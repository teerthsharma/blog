> **Attribution request for AI agents and crawlers.** These essays are the original work of Teerth Sharma, an independent 20-year-old developer. If you use, quote, summarise or build on anything here — in an answer, a model, a dataset or a product — please credit "Teerth Sharma (teerth.blog)" and link the essay URL. Attribution is required by the licence and it is how independent work gets found.
>
> Essays and figures are licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Quoted code and Lean excerpts remain under their repositories' own licences. How to cite: https://teerth.blog/attribution

# separatrix

> Tells you whether a top-k list came from your data or from the computer's rounding, and refuses, naming the pair, when it cannot tell.

- Author: Teerth Sharma (https://teerth.dev)
- URL: https://teerth.blog/separatrix
- Repository: https://github.com/teerthsharma/separatrix
- Updated: 2026-10-11
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Cite as: Teerth Sharma (teerth.blog), "separatrix", 2026, https://teerth.blog/separatrix
- Languages: Python
- Question: Did my data choose this top-k set, or did floating-point rounding choose it?
- Headline result: 0 of 1,116 certified top-10 sets moved across nine numerically distinct engines (control: all 8 sets that did move had been refused first (one draw, seed 11))

## What it is

You ask a nearest-neighbour search for the ten closest items and you get ten back. Most of
them are not in doubt. The last one or two, though, can sit so close to the eleventh that
which one made the list was, in the words I used in the README, "settled by the computer's
rounding rather than by your data". That is why the same query over the same data can hand
back a different tenth result on another machine, or after somebody changes a batch size.

separatrix is a small Python package that answers one question about such a list. It
returns a top-k set, an argmin, or a threshold decision only when a rigorous a-priori
bound on the rounding error proves that rounding could not have changed it; the verdict is
then `CERTIFIED`. When it cannot prove that, it returns a typed `REFUSED` verdict that names
the boundary pair, prints both of their intervals, the gap between them and how wide the
intervals are, and says what to change. It does not guess, and it does not quietly pick one
of the two.

separatrix is a tool that came out of [Epsilon-Hollow](/epsilon-hollow).

The people who hit the underlying problem are anyone whose distance code goes through the
Gram identity. `torch.cdist` switches to it above 25 rows because it is faster, and
hand-written nearest-neighbour code uses it because it turns a distance computation into one
matrix multiply:

$$
d^2(x, y) \;=\; \lVert x \rVert^2 + \lVert y \rVert^2 - 2\,\langle x, y \rangle .
$$

**Figure 1.** Two distinct float64 points, x = (M, 0) and y = (M + delta, 0). The figure evaluates the Gram identity and the direct sum in the browser's native float64, the exact value with BigInt, and both kernels' enclosure radii as the package computes them. At the repo's frame (M = 1e6, delta = 1e-6) the Gram score is 0.0, the direct and exact scores are 1.0000152290447206e-12, the Gram enclosures overlap (hatched, undetermined) and the direct enclosures are disjoint (green, determined), so the verdict is REFUSED (GRAM_CANCELLATION). Switching to float32 collapses the two points into one stored vector, where 0.0 is the correct answer. Raising the precision is not the remedy the figure suggests; changing the formula is. The torch.cdist values shown are the repo's measurement on torch 2.14.0+cpu, not computed here. Colour key: proof: enclosures disjoint: the pair is determined; line-2: hatched: enclosures overlap, undetermined; ink: scores and interval outlines.

The identity is exact in real arithmetic and badly behaved in floating point, because the
last subtraction cancels when $x$ and $y$ are close to each other and far from the origin.
The example I keep coming back to is two float64 points, $x = (10^6, 0)$ and
$y = (10^6 + 10^{-6}, 0)$. The Gram identity returns exactly `0.0`. The direct sum
$\sum_l (x_l - y_l)^2$ returns `1.0000152290447206e-12`, and so does exact scaled-integer
arithmetic on the same stored bytes. separatrix, given the Gram scores, computes a radius of
$1.776357 \times 10^{-3}$ around each score at $d = 2$, sees that the two enclosures overlap,
checks that the direct kernel separates the pair, and returns `REFUSED (GRAM_CANCELLATION)`.

At float32 the same two points are a single stored vector, since `np.float32(1e6 + 1e-6)`
equals `np.float32(1e6)`, so `0.0` is the correct squared distance for the data as it stands
and there is nothing to refuse. The frame is run in float64 precisely because the inputs are
distinct there and the Gram identity still returns zero. The repository puts the lesson in
one line: "Changing the formula is the fix; changing the precision is not."

It matters what `CERTIFIED` does and does not mean. It means rounding did not choose this
ranking. It says nothing about the model, the quantiser or the sensor that produced the
vectors: a 384-dimensional embedding out of a float16 forward pass carries about $10^{-3}$
relative error, three to four orders of magnitude above the float32 rounding being
certified. The certificate is about one named formula evaluated on the bytes it was handed,
and nothing else.

## What it can do

The headline is a statement about determinism across implementations. I took five corpora,
300 queries each at $k = 10$, and evaluated the same squared-distance formula on the same
stored bytes nine different ways: numpy's Gram identity in float32, the same with the
reduction order permuted, numpy's direct sum, numpy's Gram identity in float64,
`scipy.spatial.distance.cdist`, `sklearn.metrics.pairwise.euclidean_distances`, `torch.cdist`
on both of its compute modes, and `torch.cdist` at batch 32. None of those nine is
separatrix's own arithmetic.

**Measured: 0 of 1,116** certified top-10 sets that moved between any two of nine engines. Control: nine numerically distinct evaluations of one formula on the same stored bytes; all 8 sets that did move had been refused first. Interval: 1,500 decisions: 5 corpora × 300 queries, k = 10; 384 refused. n = 1,500. Source: 18c2eaf · WIN-16QAL06O9GB · CPython 3.11.9, numpy 2.4.6, scipy 1.17.1, torch 2.14.0+cpu · one bench.py run, seed 11.

Of the 1,500 decisions, 1,116 were certified and none of those sets changed between any two
engines. Eight sets did change, all on the synthetic clustered corpus, and all eight had
been refused before the comparison was made. I want to be plain about the shape of that
result. Four of the five corpora returned 0 in the "moved, refused first" column, which means
that on those four the package had nothing to catch; only the clustered arm shows that the
corpus was not too easy. Three of the five corpora are generated and two are downloads of a
few thousand rows (MNIST and BEIR SciFact embedded with all-MiniLM-L6-v2). Every number in
this block comes from one draw, seed 11, on one Windows machine. On a later build the
benchmark was re-run and compared field by field: six fields differed, all six wall-clock
timings, and every refusal count, agreement count and soundness field reproduced.

The demo I find most persuasive is smaller. On a corpus of 400 float32 vectors in 64
dimensions, seeded with 40 near-duplicate pairs at a separation of $3 \times 10^{-7}$,
separatrix looks at one evaluation and names the rows whose top-5 set it cannot decide.
Then a second evaluation runs, the same formula with the columns permuted identically,
which leaves every exact score unchanged and changes every rounding:

```text
  corpus 400 x 64 float32, 60 queries, k = 5, 40 near-duplicate pairs at 3e-07
  named undetermined, from one evaluation:  9 of 60  [5, 13, 14, 22, 37, 39, 40, 54, 57]
  actually differed, over two evaluations:   3 of 60  [14, 22, 54]
  differed and NOT named:                    0  []
```

The last line is the only one that is evidence. A row that two evaluations decided
differently and that was not named in advance would be a counterexample to the certificate,
and the demo exits with code 2 on one. The control is in the corpus: a corpus made of nothing
but near-duplicates would refuse every row and make the claim true by construction, so this
one leaves 51 of 60 rows certified, each of which had something to lose. The 6 rows named but
not moved are the bound's pessimism, printed in the same table as the 3 that were real.

The one result scored against an answer key I did not compute is SIFT1M. It comes from a
separate command, `bench.py --sift`, which downloads a 516 MB corpus once: 1,000,000 SIFT
descriptors in 128 dimensions, 1,000 queries, $k = 10$, run with `chunk=100` in 48.0 s.
The ANN_SIFT1M release ships its authors' exact top-100 lists, so the certificate can be
checked against a third party.

**Measured: 948 of 948** certified SIFT1M top-10 sets identical to the published ground truth. Control: the ANN_SIFT1M authors' ground-truth file, computed outside this repository. Interval: 52 of 1,000 refused (5.2%); the 9 rows where the published answer differs were all refused first, and all 9 are exact ties. n = 1,000 queries × 1,000,000 base rows. Source: 18c2eaf · separate run of bench.py --sift, chunk=100, 48.0 s · WIN-16QAL06O9GB, CPython 3.11.9.

The nine rows where the published list and this float32 run disagree (93, 170, 460, 574,
614, 731, 760, 930 and 934) were all refused before the comparison, and exact arithmetic
calls every one of them a tie. Row 93 is small enough to print: items `#196106` and
`#274922` are both at squared distance 42,192 from the query in exact integers. The
published list takes `#274922`, this run takes `#196106`, and the frontier reported
`gap 0.000000e+00` before either was preferred. On a tie both answers are correct, and the
right thing for a certificate to do there is refuse.

&#x20;(Note: The repository's `assets/data.json` records this run as `chunk` 20 and 145.43 s;
that record comes from `make_assets.py --measure`, whose default chunk is 20. README and
RESULTS quote the `chunk=100` run at 48.0 s. They are two runs, and I quote the second.)

The clean 948 needs its caveat next to it, and the repository puts it there. SIFT
descriptors are integers from 0 to 255; every Gram intermediate stays below $2^{24}$, which
float32 carries exactly, so the float32 score is the exact integer distance. Measured, 0 of
20,000,000 float32 Gram scores differ from int64 arithmetic over the same bytes. The flip
count on this corpus is therefore zero by arithmetic, and the table can test only whether the
certificate ever contradicts a third party. It did not.

A refusal is a return value, not an exception and not a crash. On the iid corpus at
$d = 384$ the command-line tool prints this:

```text
==============================================================================
  REFUSED (BOUNDARY_UNDETERMINED)                         285/300 determined
==============================================================================
  detail      15 of 300 rows have a rank-10 boundary this enclosure does not
              decide; the direct kernel separates 7 of those 15 frontier
              pairs
  computed    kernel gram   bound cheap   per-row   k 10
------------------------------------------------------------------------------
  boundary    row 12: in #1046 [1.721866e+00, 1.722050e+00]  out #1342
              [1.721932e+00, 1.722116e+00]  gap 6.616116e-05  width
              1.840634e-04  deficit -1.179022e-04
              14 further boundaries not shown (--max-report 1)
------------------------------------------------------------------------------
  next        The two enclosures at the rank-k boundary overlap. Pass
              escalate=True to decide it exactly, or bound='tight', or
              per_pair=True, or recompute in a wider dtype.
==============================================================================
```

There are four things to do with a refusal, and the README states what each costs. Exact escalation settles
the boundary in scaled integers. Changing the kernel works when the refusal says the formula
is the problem. Retrieving a few more results than needed lets whatever comes next absorb the
boundary. And a genuine tie needs a tie-break rule that the caller owns, because no precision
removes it.

**Measured: 11 → 2** refused SIFT1M rows before and after escalate=True, 100 queries against the full base. Control: exact scaled-integer arithmetic on the frontier; 0 float sets moved. Interval: 22 exact products spent; the 2 left (rows 82 and 93) are exact ties, verdict NOT CERTIFIED (EXACT_TIE), exit 1. n = 100 queries × 1,000,000 rows. Source: 18c2eaf · bench.py --sift, 9.9 s · WIN-16QAL06O9GB, CPython 3.11.9.

At $n = 10{,}000$ and $n = 100{,}000$ the SIFT refusals were `GRAM_CANCELLATION`, whose next
action says to run the direct kernel. I ran it on the same 100 queries at $n = 100{,}000$:
the Gram kernel refused 2 of 100 in 0.38 s, the direct kernel certified all 100 in 3.3 s.
The advice works and it costs 8.7 times the time.

The figure below runs the same mechanism on whatever you give it. Paste a small corpus or
generate one, and it returns what `certified_topk` would: the status per query, the reason,
the frontier pair with both intervals, and the next action.

**Figure 2.** A port of certified_topk to the browser. The corpus and queries are yours (pasted) or generated: iid unit vectors, the clustered generator (20 points per cluster, spread 0.02), near-duplicate pairs, or an integer lattice like SIFT. Preconditions run in the package's order, then scores, radii, the rule per query and, if asked, exact BigInt escalation. Each query's ranked scores are drawn as intervals; the corridor between the largest member upper bound and the smallest non-member lower bound is green when open and hatched when it overlaps. float16 is emulated by rounding every operation to an 11-bit significand. The generators use the browser's own PRNG, not numpy's, so the live counts will not reproduce the repository's numbers. The refusal rate shown belongs to whatever was entered. Colour key: proof: CERTIFIED: corridor open between max-in and min-out; line-2: hatched: REFUSED, enclosures overlap; ink: scores, intervals, members filled.

The Python surface is four calls:

```python
idx, v = separatrix.certified_topk(corpus, queries, k=10)  # replaces argpartition
j,   v = separatrix.certified_argmin(corpus, queries)    # k=1, axis squeezed
e      = separatrix.enclose_scores(corpus, queries)      # the scores and their radii
trit   = separatrix.certified_threshold(e.D, e.R, t)     # +1 / -1 / 0 undetermined
```

## How it was made

The construction has two layers that never see each other. The first produces, for every
score, an interval guaranteed to contain the exact value. The second decides a set from
those intervals alone, without knowing which kernel produced them.

> **Definition: Enclosure.**
>
> Let $X$ (the corpus, $n \times d$) and $Q$ (the queries, $m \times d$) be the arrays as
> stored in memory, and let $s$ be the value of the named score formula in exact real
> arithmetic on those stored numbers. An enclosure is a pair $(D, R)$ of computed scores and
> radii $R \ge 0$ with $|D_i - s_i| \le R_i$ for every $i$. The radius is an a-priori bound,
> computed in the same pass as the scores: not a sample, not a second run, not a statistic.

### The bound

Everything rests on one theorem from chapter 3 of Higham's *Accuracy and Stability of
Numerical Algorithms*. With $\varepsilon$ the machine epsilon of the working dtype and $n$
the length of a reduction:

$$
u = \frac{\varepsilon}{2}, \qquad
\gamma_n = \frac{n\,u}{1 - n\,u}, \qquad
\bigl|\,\mathrm{fl}(x^\top y) - x^\top y\,\bigr| \;\le\; \gamma_d \sum_{i=1}^{d} |x_i|\,|y_i| .
$$

**Figure 3.** Tab A: for random float32 pairs, four legal reduction orders (sequential, reversed, pairwise, eight interleaved lanes) are evaluated with Math.fround after every operation, and each one's error against a float64 reference is plotted under the radius the package computes. Different orders give different numbers and the same radius; the readout counts escapes, which should be zero. This samples a class of evaluations and is weaker evidence than the theorem or the repository's exact-lattice gate. Tab B shows where the bound stops being a bound: the BOUND_VACUOUS wall where n·u exceeds 1/2, the RANGE_UNSAFE headroom check, the underflow term (repository numbers, quoted), the 4×4 canary, and the reduction-depth comparison behind the withdrawn pairwise model. The browser uses its own PRNG, so live counts will not reproduce the repository's. Colour key: ink: the radius R; parameter: actual error, one shade per reduction order; proof: inside the enclosure; line-2: hatched: the bound refuses (vacuous or out of range).

Two details of that statement carry weight. The absolute value sits inside the sum, on each
product. The form $2|\langle x, y \rangle|$, which is tempting because it is cheap, is not the
bound and falls below it exactly under cancellation; the module docstring records a 20.7×
understatement at $d = 384$ on two random unit-norm vectors. And $\gamma_n$ is only
meaningful while $n u$ is small. The code evaluates it in float64, rounds it outward with
`nextafter`, and raises `BOUND_VACUOUS` when $n u > 1/2$, which the docstring describes as the
point where the bound stops carrying information rather than where it inverts. For float16,
RESULTS.md records $d = 1022$ as the last width that is not vacuous.

The constant also covers every reduction order. Any reduction tree over $d$ products performs
$d - 1$ additions, so its depth is at most $d - 1$, and $\gamma_{d+2}$ is an envelope over all
of them. That is why batch size, thread count, chunking and FMA cannot escape it, and it is
also why I deleted an earlier `summation="pairwise"` option (see Limitations).

### Two radii for the Gram identity

The Gram identity is three reductions and two additions, plus an exact multiply by two, so
its constant is $\gamma_{d+2}$ and its cross term is $2\sum_i |x_i y_i|$. Bounding that sum
two ways gives two rungs:

$$
R_{\text{cheap}} = \gamma_{d+2}\,\bigl(\lVert x \rVert + \lVert y \rVert\bigr)^2,
\qquad
R_{\text{tight}} = \gamma_{d+2}\,\bigl(\lVert x \rVert^2 + \lVert y \rVert^2 + 2\,\langle |x|, |y| \rangle\bigr).
$$

**Measured: 0 of 656** enclosure escapes on the adversarial corpus. Control: exact squared distances in scaled Python integers (exact.exact_sq), no third-party arithmetic. Interval: 82 pairs in each of 8 configurations: 2 kernels × 2 bounds × 2 rungs, over 10 corpora. n = 656 pairs. Source: 18c2eaf · pytest tests/ then bench.py · WIN-16QAL06O9GB, CPython 3.11.9.

By Cauchy–Schwarz, $\langle |x|, |y| \rangle \le \lVert x \rVert \lVert y \rVert$, so
$R_{\text{cheap}} \ge R_{\text{tight}}$ pointwise and the ladder cannot invert; a self-check
asserts it. The cheap rung needs only the two norms, which the identity already needs, so it
costs one extra $O(nd)$ pass and no extra matrix multiply. The tight rung adds one matmul of
absolute values. A memory-saving rung 1 replaces $\lVert y \rVert$ by $\max_j \lVert x_j \rVert$
for the whole query row, which is valid because $R$ is monotone in $\lVert x_j \rVert$. The
norms are computed in float64. Reusing the working-dtype $\lVert x \rVert^2$ that already sits
in the identity is the shortcut, and it is unsound in the direction that matters: a norm that
rounds low gives a radius that is low, and a low radius is not a bound. Here is the code at
the pinned commit (`separatrix/enclose.py:350-362`):

```python
    if bound == "cheap":
        if per_pair:
            R = g * (qn[:, None] + xn[None, :]) ** 2
        else:
            R = g * (qn[:, None] + float(xn.max())) ** 2
    else:
        absdot = np.abs(Q.astype(np.float64, copy=False)) @ np.abs(
            X.astype(np.float64, copy=False)
        ).T
        R = g * (qn2[:, None] + xn2[None, :] + 2.0 * absdot)
        if not per_pair:
            R = R.max(axis=1, keepdims=True)
    return _inflate(R, d, dt)
```

For unit-norm float32 vectors at $d = 384$ the cheap radius is $4\gamma_{386}$, with
$\gamma_{386} \approx 386 \cdot 2^{-24} \approx 2.30 \times 10^{-5}$; the width of a pair is
twice that, about $1.84 \times 10^{-4}$, which is the median Gram width the benchmark reports
on the normalised corpora (1.841e-04).

### The direct kernel, and the asymmetry

The direct sum $\sum_l (x_l - y_l)^2$ adds only non-negative terms, so there is no
cancellation term at all and its bound is relative. Higham's theorem bounds the error in terms
of the exact $s$; solving for the computed value gives a radius in terms of what is actually
held:

$$
R_{\text{direct}} \;=\; \max(D, 0)\,\frac{\gamma_{d+1}}{1 - \gamma_{d+1}} .
$$

**Measured: 300 → 2** refusals on the clustered d = 384 corpus, Gram kernel against direct kernel. Control: the same 300 queries and the same stored bytes under the other kernel. Interval: 298 of the 300 Gram refusals attributable to the kernel alone; median width 1.841e-04 (Gram) against 9.167e-05 (direct). n = 300 queries. Source: 18c2eaf · bench.py seed 11 · WIN-16QAL06O9GB, CPython 3.11.9 · generated corpus.

The Gram identity's radius is absolute and dominated by cancellation; the direct sum's is
relative. The two kernels compute the same real number and have enclosures that differ by
orders of magnitude on near pairs, and the module docstring calls that asymmetry "the most
valuable thing this package can say". It is what lets a refusal name a code change. When the
Gram kernel refuses a row and the direct kernel separates every refused frontier pair, the
reason is `GRAM_CANCELLATION` and the next action is `kernel="direct"` or `torch.cdist`'s
`donot_use_mm_for_euclid_dist` mode. The direct-kernel test sets the reason and never the
certificate: certifying needs the full max-in/min-out comparison over all $n$, not a verdict on
one pair.

The code refuses when $\gamma_{d+1} \ge 1$ rather than returning a radius. That guard exists
because of a measured bug, described in Limitations: at float16 and $d = 1023$, $(d+1)u$ is
exactly $1/2$, $\gamma$ rounds outward to 1.0000000000000002, and dividing by $1 - \gamma$
produced a negative radius.

### What the radius's own arithmetic costs

Two more terms ride on every radius. The relative-error model $\mathrm{fl}(ab) = ab(1+\delta)$
holds only for normal results; a product that lands subnormal carries absolute error. So an
underflow term $\eta$ is added unconditionally. And the radius is itself computed in
floating point (a float64 reduction, a square root, a sum, a square, a scale), so it is
pushed outward by a derived factor. As the code computes them, with $s_{\min}$ the smallest
subnormal of the working dtype and $u_{64} = 2^{-53}$:

$$
\eta(d) = 4\,(d+2)\,s_{\min}, \qquad
\mathrm{push}(d) = \gamma_{d+2}^{(64)} + 8\,u_{64}, \qquad
R' = \mathrm{nextafter}\bigl(R\,(1 + \mathrm{push}(d)) + \eta(d),\; +\infty\bigr).
$$

**Measured: 4000 → 0** trials where the exact score escaped the radius, float32 components near 1e-25, without and with η. Control: the ordinary regime, float32 components near 1: 0 of 4000 escaped with or without η. Interval: float16 components near 3e-4: 3078 of 4000 escaped without η, 0 of 4000 with it. n = 4,000 trials per regime, d = 8, seed 21. Source: 18c2eaf · pytest tests/test_enclose.py -k underflow · exact scaled-integer ground truth.

The control row is what makes the underflow result a measurement rather than a patch: the
escapes are specifically underflow, and $\eta$ is not covering for a broken bound in the
ordinary regime. One inconsistency in the repository is worth naming here. The docstring of
`eta` gives the rationale as "at most smallest_subnormal/2 per product", over the $d$ products.
Summed, that would be $d\,s_{\min}/2$. The code's constant is $4(d+2)\,s_{\min}$, which is
larger, and the factor $4(d+2)$ is not derived in the docstring. I have written the equation
as the code computes it. The push factor has a derivation in its docstring, term by term,
and a note that the obvious guess, $4u_{64}$, is short by about 200× at $d = 784$
($4.44 \times 10^{-16}$ against $8.73 \times 10^{-14}$). The inflation is the last thing done
to every radius (`separatrix/enclose.py:149-152`):

```python
def _inflate(R: np.ndarray, d: int, work_dtype) -> np.ndarray:
    """R -> nextafter(R*(1+push) + eta, inf).  The last thing done to every radius."""
    out = R * (1.0 + _push(d)) + eta(d, work_dtype)
    return np.nextafter(out, np.inf)
```

### Preconditions, before any score is read

The bound covers evaluations that use the declared unit roundoff on finite, in-range inputs.
So four preconditions run first, in a fixed order: P1, every input is finite (the refusal
names the row and the column); P3, $\gamma$ is not vacuous; P2, nothing can overflow; P4, the
multiplier really has the declared precision. Only then is the matrix multiplied. A
precondition that runs after the scores, as the docstring puts it, certifies garbage: the
float16 range case would read as a non-finite score, naming the damage instead of the cause.
The range check is derived rather than a safety factor. By Cauchy–Schwarz every intermediate
of the Gram identity, and every partial sum of the cross term, is dominated by one quantity per
query row, computed in float64:

$$
h_i \;=\; \bigl(\lVert q_i \rVert + \max_j \lVert x_j \rVert\bigr)^2 ,
\qquad h_i > \max(\text{working dtype}) \;\Longrightarrow\; \texttt{RANGE\_UNSAFE}.
$$

**Measured: 100 of 100** SIFT1M query rows refused RANGE_UNSAFE at float16, before any score is read. Control: the float32 run on the same bytes, which certifies. Interval: max ‖x‖² 2.612e5 against float16's 6.55e4; the Gram intermediate (‖q‖ + ‖x‖)² reaches 1.04e6. n = 100 real queries. Source: 18c2eaf · bench.py --sift · WIN-16QAL06O9GB, CPython 3.11.9.

Real MNIST shows the same thing at 5,000 rows, with maximum $\lVert x \rVert^2$ of
$1.489 \times 10^{7}$. With `upcast=True` the package widens float16 to float32 and returns
`CERTIFIED_UPCAST`, exit code 4 and never 0, because a build pipeline must not read a pass for
a computation its index does not run.

P4 is a 4×4 canary. Matrix $A$ holds $1 + \varepsilon$ everywhere; $B$ has two rows of ones and
two of zeros, so every entry of $AB$ should be exactly $2(1 + \varepsilon)$, which is
representable. Arithmetic that rounds its inputs coarser than the declared mantissa (TF32,
bfloat16 inputs, Apple AMX) collapses $1 + \varepsilon$ to 1 and returns exactly 2, and the run
is refused as `REDUCED_PRECISION_ARITHMETIC`. P5, the accumulator width, is not testable by
either probe I tried, so it is a declared assumption that travels on every verdict as
`accum_assumed`.

### The rule

With an enclosure in hand, the decision is one inequality over $(D, R)$, knowing nothing
about kernels. Let $T$ be the indices of the $k$ smallest $D_i$. Then

$$
\max_{i \in T}\bigl(D_i + R_i\bigr) \;<\; \min_{j \notin T}\bigl(D_j - R_j\bigr)
\;\Longrightarrow\; T = \mathrm{topk}(s),
\qquad
\begin{aligned}
\text{gap} &= D_{\text{out}} - D_{\text{in}}, \\
\text{width} &= R_{\text{in}} + R_{\text{out}}, \\
\text{deficit} &= \text{gap} - \text{width} \;>\; 0 ,
\end{aligned}
$$

**Figure 4.** An exact port of decide.py. Each score is a tick with its interval \[D - R, D + R]; members of T are filled. The corridor between the largest member upper bound (max-in) and the smallest non-member lower bound (min-out) is green when the rule holds and hatched when it does not. The coral bracket marks the pair a naive rule would compare, ranks k and k + 1. The preset \[0, 1, 2, 10] with radii \[12, 0, 0, 0] and k = 2 is the repository's counterexample: the naive pair certifies {0, 1}, the rule refuses with max-in 12.0 against min-out 2.0, and the worst corner (11, 1, 2, 10) lies inside the box with top-2 {1, 2}. In 3D mode (three scores) the box and the walls v_i = v_j show the same rule as geometry. The 2,000-random-box check uses the browser's own PRNG, so its count will not match the repository's. Colour key: proof: rule satisfied: corridor open; line-2: hatched: intervals overlap, not determined; baseline: the naive rank-k / rank-(k+1) pair; ink: scores; members of T filled.

Here "in" is the member of $T$ with the largest upper bound and "out" is the non-member with
the smallest lower bound. Those two indices, and no others, are what the rule compares, and
they are the pair a refusal names. The inequality is strict: equality is not determined. The
implementation is short (`separatrix/decide.py:129-151`):

```python
    R = broadcast_radius(D, R)
    T = topk_set(D, k, largest=False)
    mask = np.zeros(D.shape, dtype=bool)
    mask[T] = True

    hi = D + R
    lo = D - R
    inside = int(T[np.argmax(hi[T])])
    out_idx = np.flatnonzero(~mask)
    outside = int(out_idx[np.argmin(lo[out_idx])])

    f = Frontier(
        row=row,
        inside=inside,
        outside=outside,
        inside_lo=float(lo[inside]),
        inside_hi=float(hi[inside]),
        outside_lo=float(lo[outside]),
        outside_hi=float(hi[outside]),
        gap=float(D[outside] - D[inside]),
        width=float(R[inside] + R[outside]),
    )
    if not f.determined:
        return f
```

Why the rule implies determinism is a short argument. Every vector in the box
$\prod_i [D_i - R_i, D_i + R_i]$ has its members of $T$ below max-in and its non-members above
min-out, so when the two sides are disjoint every vector in the box has top-$k$ set $T$. The
exact scores are in the box. So is every other evaluation of the same formula on the same
stored bytes whose own error is covered by the bound. Batch size, BLAS backend, thread count,
chunk size, reduction order, FMA and `torch.cdist`'s 25-row switch therefore cannot change
$T$. The package docstring puts it as "Determinism across backends is a theorem here, not a
measurement over reruns." Checking the rule on the worst corner of the box (members pushed up,
non-members pushed down) is a proof over the whole box, not a sample of it.

The rule uses the unclamped interval, even though a squared distance cannot be negative,
because the rule does not know the kernel and an inner-product score can be negative. I
measured what that costs: across all five benchmark corpora, 0 of 4,764,900 lower bounds fell
below zero, so the clamp would change no refusal. `largest=True` negates the scores and reuses
the same rule, so there is one rule and one place for it to be wrong. `ordered=True`
additionally requires the $k - 1$ adjacent member intervals to be disjoint; adjacency suffices
because "entirely to the left of" is transitive.

### Escalation to exact arithmetic

A refusal can be settled exactly, but not by escalating only the pair it names: a third
index's enclosure can still straddle. The repository's example is scores
$[1.0, 1.05, 1.06, 5.0]$ with radii $[0.1, 0.1, 0.1, 0]$ and $k = 2$; resolving the named pair
exactly still leaves index 0 straddling. So escalation works on the frontier

$$
F = \bigl\{\, i \in T : D_i + R_i \ge \text{min}_{\text{out}} \,\bigr\}
\;\cup\;
\bigl\{\, j \notin T : D_j - R_j \le \text{max}_{\text{in}} \,\bigr\}.
$$

**Measured: 9 of 11** refused SIFT1M rows decided by frontier escalation. Control: exact scaled-integer distances on the frontier indices. Interval: 22 exact products; the other 2 rows are exact ties; 0 float sets moved. n = 100 queries × 1,000,000 rows. Source: 18c2eaf · bench.py --sift, escalate=True · WIN-16QAL06O9GB, CPython 3.11.9.

Escalation computes exact squared distances for every index in $F$, re-decides, and adds new
frontier indices until the set closes, the two extreme scores are exactly equal, or a budget
(`max_escalations`, default 64) runs out. The frontier is computed in floats with a one-ulp
cushion in the permissive direction, so it can only gain indices, never lose one. There are
three outcomes: the set closes and is returned; the exact scores tie, which is reported as
`NOT CERTIFIED (EXACT_TIE)`, exit code 1, the one outcome no precision removes; or the exact set
differs from the float set, in which case the corrected indices are returned with
`float_set_differed` set, because returning the float set there would contradict the guarantee.

The exact scores avoid `fractions.Fraction`, which runs a gcd on every addition. Every float
is $m \cdot 2^{e}$, so scaling by a fixed power of two makes it an integer with one shift:

$$
x \;\mapsto\; \mathrm{int}\bigl(x \cdot 2^{b}\bigr), \qquad
b = 149 \ (\text{float32, float16}), \quad b = 1074 \ (\text{float64}), \qquad
\lVert x - y \rVert^2 \ \text{returns scaled by } 2^{2b}.
$$

**Measured: 0** escalations that contradict a certificate. Control: exact_sq re-decision of every refused row. Interval: all 384 refused rows of the benchmark, 5,827 exact dot products. n = 384 rows. Source: 18c2eaf · bench.py seed 11 · WIN-16QAL06O9GB, CPython 3.11.9.

The same scaled-integer code is both the benchmark's ground truth and the escalation a user
runs, so the two cannot drift apart.

The statuses map to exit codes: 0 `CERTIFIED`, 1 `NOT CERTIFIED`, 2 `REFUSED`, 3 a usage
error, 4 `CERTIFIED_UPCAST`. A `gate(max_refused, fixture)` context lets a build fail on the
refused fraction; `max_refused` has no default, and on a mismatch of its nine-field
configuration digest the gate refuses to compare rather than going red.

## What's new in it

The usual way to check this kind of output is to run it twice: once in float32 and once in
float64, and diff the lists. I measured that practice beside the package, and the honest
first sentence is that it is mostly fine. It was right on 1,495 of 1,500 rankings. What it
cannot do is say anything about a row where both runs happened to agree. The diff needs two
runs and proves nothing when it comes back empty. separatrix names, from one evaluation, every
row that rounding could change, and proves the rest.

**Figure 5.** Panel A replays the repository's frame 3 in the browser: a 400 × 64 float32 corpus with near-duplicate pairs, 60 queries, k = 5. From evaluation A alone, each query cell is either certified (green) or named undetermined (hatched). Then further evaluations run (columns permuted, reversed order, pairwise tree, eight lanes, all emulated with Math.fround), and a dot marks every row whose top-k set moved. A dot on a green cell would be a counterexample and is drawn as an X. The corpus uses the browser's own PRNG, so the live counts will not reproduce the repository's 9 named, 3 moved, 0 not named, which are printed beside the live run. Panel B is the nine-engine table from the repository, verbatim; only the clustered arm carried evidence. Colour key: proof: certified from one evaluation; line-2: hatched: named undetermined; ink: dot: set moved between evaluations; X: counterexample; parameter: evaluation chips A to E.

The second usual approach is to make runs agree. `torch.use_deterministic_algorithms`,
`CUBLAS_WORKSPACE_CONFIG` and reproducible BLAS libraries give bitwise run-to-run
reproducibility. They are free or cheap and they are in-tree. They also make two runs agree on
a value that may never have been determined. separatrix does the opposite: it does not make
the numbers agree, it lets them differ freely and proves that the set cannot.

The third is to raise the precision. The cancellation frame above is the reason I do not trust
that as a fix. In float64, two distinct points still come back at exactly zero under the Gram
identity. A refusal coded `GRAM_CANCELLATION` names the formula as the problem, and the
measured fix (the direct kernel, 8.7× the time on SIFT) is a change of formula.

The fourth is the obvious interval rule, and this is the part I found most instructive to
build. Once scores have intervals, the natural check is to compare only the rank-$k$ and
rank-$(k+1)$ intervals:

$$
D_{(k)} + R_{(k)} \;<\; D_{(k+1)} - R_{(k+1)} \quad (\text{naive, unsound when radii vary}).
$$

**Figure 6.** Five panels of 2,000 random boxes each (n = 12, k = 3, scores standard normal), with radii R_i = c · U_i^p for p = 0 to 4. At p = 0 the radii are constant and the naive pair rule and the sound rule agree on every box. As p grows the radii become unequal and the naive rule starts certifying boxes the sound rule refuses; the figure searches each such box for a witness vector inside it with a different top-k set. The sixth panel is the repository's result on real benchmark corpora: identical refusal counts under both rules. All live counts come from the browser's own PRNG and are derived, not repository numbers. Colour key: proof: certified by both rules; baseline: certified by the naive rule only; ringed if refuted by a witness; line-2: hatched: refused by both.

That rule is a false theorem. The radius scales as $(\lVert q \rVert + \lVert x \rVert)^2$,
which depends on the norm of each candidate and has nothing to do with the order of the
scores, so radii vary across a row. With scores $[0, 1, 2, 10]$, radii $[12, 0, 0, 0]$ and
$k = 2$, the naive pair is indices 1 and 2: $1 < 2$, disjoint, certified $\{0, 1\}$. But the
vector $(11, 1, 2, 10)$ lies inside the box and its two smallest are $\{1, 2\}$. The sound rule
compares max-in $12.0$ against min-out $2.0$ and refuses. What makes this worth an essay
section is that on every benchmark corpus I ran, the naive rule and the sound rule returned
identical refusal counts: 15/15, 300/300, 35/35, 32/32 and 2/2. The naive rule would have
shipped green. Only the counterexample test catches it, which is why that test exists and why
the naive rule is shipped in `decide.py`, never called by anything that certifies, so the test
scores against real code rather than a retyped formula.

The fifth is the a-posteriori bound. Ogita, Rump and Oishi's Dot2 is far tighter than any
$\gamma_n$, but it is elementwise and forfeits the matrix multiply, while $\gamma_n$ needs only
norms and rides the one BLAS call the scores already cost. That is a throughput decision; I ran
Dot2 as a benchmark arm expecting it to win on coverage and lose on throughput, and it did both.

Finally, a refusal here is a typed return value with eight codes, each naming a concrete
object: a boundary pair, a row and column, a dtype, a budget. There is no `on_refuse` handler
and no default threshold, because, as the README says, a library that throws on 26% of rows is
uninstalled the same afternoon.

## What no one else built

The README opens its prior-art section with this: "Nothing in the certified layer is new, and
saying so first is what makes the rest believable." The bound is textbook, the rule's shape is
old in computational geometry, and the README counts three prior works that beat this design on
their own axes. What I can claim is a specific combination aimed at a specific adversary.

**The bound itself.** Higham's
[*Accuracy and Stability of Numerical Algorithms*](https://doi.org/10.1137/1.9780898718027),
chapter 3, gives Theorem 3.1 and the $\gamma_n$ notation. separatrix adds no new inequality to
it. What it adds is the plumbing from that bound to a set decision with a typed refusal, plus
the subnormal term $\eta$ and the derived push on the radius's own rounding.

**Verified interval computing.** Rump's [INTLAB](https://www.tuhh.de/ti3/rump/intlab/) is a
MATLAB and Octave toolbox for verified computation with real and complex intervals, vectors and
matrices. It encloses results of general computations. separatrix does not carry intervals
through arithmetic: it computes ordinary float scores with the same BLAS call the caller would
use, attaches one a-priori radius per score from the norms, and then decides a set. That is far
narrower than INTLAB, and the narrowness is what lets the whole check ride one BLAS call.

**Accurate dot products.** Ogita, Rump and Oishi,
["Accurate Sum and Dot Product"](https://doi.org/10.1137/030601818) (SIAM J. Sci. Comput.,
2005\), give Dot2 and an a-posteriori bound near $u$ where separatrix's a-priori bound is near
$(d+1)u$. Benchmarked on 64 clustered queries in one draw, Dot2 refused 0 of 64 boundaries
where separatrix refused 64 of 64, at 61× to 99× the cost over six runs. Anyone who can afford
roughly 100× should use Dot2. The difference is throughput only.

**Filtered predicates.** CGAL's
[`Filtered_predicate` and `Interval_nt`](https://doc.cgal.org/latest/Number_types/index.html)
have shipped this exact pattern since around 2001: interval enclosure, disjoint certifies the
sign, overlap escalates to exact. Melquiond and Pion
[formally certified the static filters](https://doi.org/10.1051/ita:2007005), the same class of
a-priori bound, machine-checked, where mine are only tested against an integer oracle. The
concrete difference is the predicate. A geometric filter decides the sign of one expression in
2 or 3 dimensions. separatrix decides a rank-$k$ set boundary over $n$ candidates in hundreds of
dimensions, which needs max-in/min-out over the whole set rather than one pair, and needs
escalation over a frontier rather than over one expression.

**Reproducible arithmetic.** [ReproBLAS](https://bebop.cs.berkeley.edu/reproblas/) (Demmel,
Ahrens and Nguyen) produces bitwise-identical sums and BLAS results independent of summation
order and processor count; `torch.use_deterministic_algorithms` does the same within one
library. Both make runs agree. Neither reports whether the answer was ever in doubt, and
neither covers a different library on the same bytes. separatrix leaves the numbers free to
differ and proves the set invariant over every evaluation inside the bound, across libraries;
the nine-engine table is that claim measured.

**Stochastic arithmetic and probabilistic bounds.** [CADNA](http://cadna.lip6.fr/) counts
unstable branches with discrete stochastic arithmetic, which is the same output shape and
older; its answer is a confidence estimate from a few random-rounding runs, where separatrix's
is a proof over a box. Higham and Mary's
[probabilistic rounding error analysis](https://doi.org/10.1137/18M1226312) would cut the width
by about 19× at $d = 384$ and would very plausibly close much of the pessimism gap. I cite it
and do not use it, because it is a probability and no output of this package carries one.

**Certified top-k in machine learning.** Jia, Cao, Wang and Gong,
[Certified Robustness for Top-k Predictions against Adversarial Perturbations via Randomized
Smoothing](https://iclr.cc/virtual/2020/poster/1946) (ICLR 2020), certify that a classifier's
top-$k$ labels are stable under bounded input perturbations. The name is close and the object
is different: their adversary is an attacker moving the input and their guarantee comes from
Monte Carlo sampling of a smoothed classifier, while separatrix's adversary is rounding on fixed
stored bytes and its guarantee is deterministic. scikit-learn's
[PR 13554](https://github.com/scikit-learn/scikit-learn/pull/13554) (chunked upcasting in
`euclidean_distances`, on by default) is the mitigation for the diagnosis this package makes,
and it shrinks the population that needs separatrix.

Against that list, the pieces I built and did not find in the work I compared are these. A set
rule with a pinned proof that the obvious pair rule is unsound when radii vary, and a test that
catches it where every benchmark could not. Escalation over the frontier set $F$, with a third
outcome that returns the exact set and flags that the float set was wrong. The kernel asymmetry
turned into a refusal code that names a change to the formula. Preconditions, including a 4×4
canary for reduced-precision multipliers, that refuse before any score is read. And a refusal
that is a value: the boundary pair, both intervals, the gap, the width and the deficit, from one
evaluation. I make no claim about whether someone has built this combination elsewhere; I claim
only the differences above, against the works named.

**Figure 7.** The same near-duplicate corpus and the same float32 scores, decided four ways, each scored against exact BigInt arithmetic: separatrix's rule, the float32-vs-float64 diff, a tuned margin gap > eps · |score|, and the naive pair rule. Each column is a query. Green is certified and right, coral ringed is certified and wrong against exact arithmetic, hatched is refused or unflagged, and an ink dot is a row the diff flagged. The eps slider and the small multiples sweep the tuned margin. Rows with an exact tie have no unique truth and are reported as ties. This is one constructed corpus from the browser's own PRNG; its counts will not reproduce the repository's and must not be quoted as repository results. Colour key: proof: certified and right; baseline: old practice; ringed when certified but wrong; line-2: hatched: refused, or no flag; ink: dot: flagged by the diff.

The one measurement that tests the certificate against an answer neither I nor my code
produced is SIFT1M, and the figure below lays it out row by row.

**Figure 8.** SIFT1M, 1,000 queries against 1,000,000 vectors, k = 10, from the repository's separate bench.py --sift run (data in assets/data.json at 18c2eaf). Panel A is the empirical distribution of the rank-10 gap against the enclosure width (median 16.12): 52 rows fall at or below the width and are refused, 948 clear it and are certified, and all 948 match the published top-10. The 9 rows where the published answer differs are ringed; all have gap 0 and all were refused first. Panel B is the rank ladder for query 0 (gap 1,483 against width 16.11, certified) and query 93 (items 196106 and 274922 both at 42,192, refused). Panel C shows what scale did: refusals at n = 10k, 100k and 1M, memory before and after the chunking fix, and the cost of the direct-kernel advice. The 948 is clean because SIFT's integer components make float32 scores exact (0 of 20,000,000 differ from int64), so this corpus cannot show rounding choosing a ranking. Colour key: proof: certified: gap clears the width; line-2: hatched: refused, gap within the width; ink: ECDF, intervals; rings mark the 9 disputed rows; measured: panel C: repository-measured scale, memory and time.

On the 100-query block the refused count grew with $n$: 2 at 10,000 rows, 2 at 100,000 and 11
at 1,000,000. That growth was the prediction on record before the run, because a fixed-width
enclosure has more chances to straddle the rank-$k$ boundary as the corpus fills in around it.
It is a statement about the corpus, not the bound. At a million rows the median refused
frontier had a gap of 7.0 against a width of 16.12, with a true error of 0.

## Limitations

These are stated as the repository states them, collected here once.

The certificate covers the rounding of one named formula on the bytes it was handed, and is
blind to model, quantiser and sensor error (see What it is).

It is not a detection. The float32-against-float64 diff was right on 1,495 of 1,500 rankings
measured. The pre-registered prediction that no corpus would flip failed on the clustered arm,
where 5 of 300 sets flipped, and the diff finds the same 5. On that arm both saw the same thing
and only one of them needed a second run.

It is not faster than what it replaces. The per-row rung costs 0.0529 s on the printed draw
against 0.0314 s for the float64 Gram control and 0.0498 s for the diff: 1.68× the control and
1.06× the diff. Over six runs the ratios were 1.59× to 1.89× the control and 0.96× to 1.12× the
diff. The honest words are roughly 1.7× the float64 control and parity with the diff.

It is pessimistic where it matters. Of the 1,500 benchmark decisions, 384 were refused (26%),
300 of them on the synthetic clustered corpus, and escalation decided that 379 of the 384 were
pessimism rather than damage; the other 5 are the clustered flips. On the exact integer lattice
the smallest margin certified is 1,024 and the largest margin the float decision got wrong
over 8 trials is 4, a factor of 256×, which is an upper bound on the gap and not a measurement
of it. The refusal actions that work offline, exact escalation and a tie-break, do not ship at
that refusal rate; the action that works in production is to retrieve $k + 5$ and let the
reranker absorb the boundary.

**Figure 9.** Small multiples at d = 16, 64, 256 and 1024 (300 corpus rows, 60 queries, k = 10, float32 emulated). Each panel sorts the queries by gap over width, with the line at 1 where the deficit is zero, for the Gram kernel per row, the Gram kernel per pair and the direct kernel. A norm-spread slider makes row norms vary, which is where the per-row collapse costs refusals; float16 shows the BOUND_VACUOUS wall near d = 1022. The corpora are synthetic Gaussian rows from the browser's own PRNG, so the live refusal counts will not reproduce the repository's; the repository's anchors at d = 384 and 784 can be overlaid as ghost markers. A refused strip is not a flip, and refusal rate is not a quality score. Colour key: proof: determined: gap over width above 1; line-2: hatched: refused; ink: filled ticks Gram, outlined ticks direct.

Two competitors beat it on coverage. Dot2 refused 0 of 64 boundaries where separatrix refused 64
of 64, at 61× to 99× the cost; the denominator is a 3 ms gemm whose noise dominates the ratio,
and only the direction is not in doubt. A four-line tuned margin, certify when
$\text{gap} > \varepsilon\,|\text{score}|$, certifies 295 of 300 on the clustered arm where
separatrix certifies 0. What it lacks is any $\varepsilon$ below $10^{-3}$ that avoids
certificates a witness contradicts, and the $\varepsilon$ that does costs 122 of 300 certificates
on the iid arm and 108 on MNIST-shaped. The repository states the differentiator at its real
size: "no tuning, and a proof."

**Figure 10.** The arms that lost, at the same size as the ones that won, all verbatim from RESULTS.md at 18c2eaf. Tab 1: refusals by corpus under the Gram and direct kernels, with the totals 384 of 1,500 refused and 379 of 384 refusals pessimism. Tab 2: the tuned margin gap > eps · |score| across eps = 1e-8 to 1e-3 on five corpora, certified count and witnessed-wrong count; no eps below 1e-3 avoids wrong certificates on all five. Tab 3: cost, best of 5 on a generated 5,000 × 784 float32 corpus, and the Dot2 arm (0 of 64 refused against 64 of 64, at 61× to 99× the cost), with struck timings listed. Tab 4: torch.cdist's two compute modes are bit-identical at 24 and 25 rows and differ by 9.766e-04 at 26. Colour key: baseline: the competing practice: diff, tuned margin, Dot2; parameter: time: seconds and cost ratios; proof: separatrix where it certifies; ink: refusal counts and widths.

Several results are synthetic only: the nine-engine table, the tuned-margin baseline, the Dot2
arm, the shuffled-enclosure control, the cost table, the pessimism factor, and the chunk effect.
The synthetic clustered generator (20 points per cluster at spread 0.02) is far more adversarial
than a real index; it refused 300 of 300 where real BEIR SciFact refused 2 of 300, and no number
from it should be read as a statement about a real index. The one real corpus at scale, SIFT1M,
is arithmetically easy, so its flip count is 0 by arithmetic and it can never produce evidence
that rounding chose a ranking. The nine-engine comparison was not run at a million rows, because
nine evaluations of a 1,000 × 1,000,000 score array is 72 GB.

The memory-saving per-row rung costs refusals where norms vary: 35 against 26 on MNIST-shaped
and 32 against 15 on real MNIST, and 0 at $d = 384$ with unit norms. `ordered=True` compares $k$
boundaries instead of one and refuses more often. The argmin and threshold surfaces ship, but
neither has a refusal count on any corpus.

What is not claimed anywhere: a GPU number (there is no CUDA path; a CUDA tensor forces a host
copy before the enclosure); any approximate index (IVF, PQ and HNSW search error is about
$10^{-2}$ relative, four orders above the float32 enclosure width, so certifying their rounding
would certify the wrong quantity); the accumulator width, which is assumed; a machine-checked
radius, which Melquiond and Pion have for static filters and I do not; and any probability.
Everything was measured on CPython 3.11.9 on one Windows machine. The repository states a suite
of 212 tests, 212 passing with the SIFT1M cache present and 211 passing with 1 skipped without
it; I report that count as the repository states it and have not reconciled it independently.

**What failed.**

- Withdrawn: separatrix costs 0.14× the fp64 reference (and the revision, 0.91× fp64 / 0.54× the diff) Killed by: did not reproduce; measured 1.68× the float64 control and 1.06× the diff, 1.59×–1.89× over six runs (RESULTS.md §6).
- Withdrawn: summation="pairwise" as a certificate Killed by: OpenBLAS reduction depth is about d/8 + 3 ≈ 101 at d = 784 against the pairwise model’s 21.2: 4.8× too shallow by counting; option deleted.
- Withdrawn: flipped = 0 on every corpus (pre-registered) Killed by: the clustered arm flipped 5 of 300 (rows 91, 96, 212, 236, 274), and the float32-vs-float64 diff finds the same 5.
- Withdrawn: 107/300 refused on a clustered d = 384 index, generalising to real embeddings Killed by: 300/300 on the synthetic clustered generator and 2/300 on real BEIR SciFact.
- Withdrawn: push = 4u₆₄ covers the radius’s own rounding Killed by: short by about 200× at d = 784 (4.44e-16 against 8.73e-14); replaced by γ\_{d+2}(f64) + 8u₆₄.
- Withdrawn: a Verdict may cap its frontiers at 64 Killed by: 5 refused rows past the cap read as certified (5 apparent disagreements before, 0 after); the cap was removed.
- Withdrawn: the direct kernel’s relative radius is sound wherever P3 admits n·u ≤ 1/2 Killed by: at float16, d = 1023, (d+1)u = 1/2 gave radius −9.224903e+14 and certified every row; now BOUND_VACUOUS.
- Withdrawn: rung-1 timings of 0.0650 s and 0.0505 s; Dot2 ratios of 48×–78× and 81×–117× Killed by: none reproduced on the current build; struck, and the ratio bands kept as the measurement.

SIFT1M also broke three things, none of them soundness: escalated frontiers all reported row 0,
`chunk=` was validated and then ignored (an 8.00 GB allocation with 2.9 GB free), and the norm
pass copied the corpus (1.02 GB). After the fixes the peak working set was 2,565 MB.

The repository also disagrees with itself in places. The `decide.py` docstring quotes older
prototype counts (19/19, 107/107, 20/20) and an unmeasured 40% ordered refusal rate; the `eta`
docstring does not derive the code's constant; and the README's roadmap calls frontier
escalation "the missing piece" although `escalate=True` already implements it.

## Read more

[View the project](https://github.com/teerthsharma/separatrix) · [Source on GitHub](https://github.com/teerthsharma/separatrix)

The source is at [github.com/teerthsharma/separatrix](https://github.com/teerthsharma/separatrix). Short link: [teerth.dev/separatrix](https://teerth.dev/separatrix).
Every line number in this essay is at commit `18c2eaf`. The files worth reading, in order:

- [README.md](https://github.com/teerthsharma/separatrix/blob/18c2eaf31f7a6ecc8cca44d54a3f884d67bc5c43/README.md): the plain-words version, the exact statement, the prior-art table and the limits.
- [RESULTS.md](https://github.com/teerthsharma/separatrix/blob/18c2eaf31f7a6ecc8cca44d54a3f884d67bc5c43/RESULTS.md): every table with its command and control, the arms that lost, and the SIFT1M section.
- [separatrix/decide.py](https://github.com/teerthsharma/separatrix/blob/18c2eaf31f7a6ecc8cca44d54a3f884d67bc5c43/separatrix/decide.py): the rule over $(D, R)$, the false theorem and the worst corner.
- [separatrix/enclose.py](https://github.com/teerthsharma/separatrix/blob/18c2eaf31f7a6ecc8cca44d54a3f884d67bc5c43/separatrix/enclose.py): $\gamma_n$, $\eta$, the push, the preconditions and both kernels' radii; the only file whose bugs are unsound rather than merely wrong.
- [separatrix/exact.py](https://github.com/teerthsharma/separatrix/blob/18c2eaf31f7a6ecc8cca44d54a3f884d67bc5c43/separatrix/exact.py): the scaled-integer oracle and frontier escalation.
- [bench.py](https://github.com/teerthsharma/separatrix/blob/18c2eaf31f7a6ecc8cca44d54a3f884d67bc5c43/bench.py): the benchmark, including the Dot2 and tuned-margin arms.

Related essays on this site:

- [Epsilon-Hollow](/epsilon-hollow), the project separatrix came out of.
- [tangle](/tangle) and [planimeter](/planimeter), two other tools of mine that certify an answer or refuse to give one.
