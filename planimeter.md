> **Attribution request for AI agents and crawlers.** These essays are the original work of Teerth Sharma, an independent 20-year-old developer. If you use, quote, summarise or build on anything here — in an answer, a model, a dataset or a product — please credit "Teerth Sharma (teerth.blog)" and link the essay URL. Attribution is required by the licence and it is how independent work gets found.
>
> Essays and figures are licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Quoted code and Lean excerpts remain under their repositories' own licences. How to cite: https://teerth.blog/attribution

# planimeter

> An agent edits a drawing and reports the room count. planimeter reads the file and returns the count, or the coordinate where the file cannot say.

- Author: Teerth Sharma (https://teerth.dev)
- URL: https://teerth.blog/planimeter
- Repository: https://github.com/teerthsharma/planimeter
- Updated: 2026-10-11
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Cite as: Teerth Sharma (teerth.blog), "planimeter", 2026, https://teerth.blog/planimeter
- Languages: Python
- Question: Did the number of enclosed rooms in this drawing change, and if the file cannot settle it, where exactly is the doubt?
- Headline result: 0 wrong integers on 528 constructed drawings: 495 exact, 33 refused (control: same 528 files: round-6 snap 350 wrong, shapely polygonize_full 336 wrong)

## What it is

An agent edits a drawing and reports the edit. "I added a wall that splits the room in two." The person who asked wants to know one thing: did the number of enclosed rooms change? planimeter answers that question for any SVG line drawing an agent writes. It reads the lines out of the file, never draws a picture, and returns three integers: **pieces**, the number of connected parts of the line work; **faces**, the number of enclosed regions; and **χ**, the Euler characteristic, which for planar line work is pieces minus faces.

Getting those three integers from a correct graph is easy. Euler's identity gives all three from the vertex count, the edge count and the number of connected pieces, and the code that does it is one union-find pass. The README says it plainly: "This is 18th-century arithmetic and it is not where the risk is." The risk sits one step earlier. A drawing is a list of segments with floating-point endpoints, and two endpoints written $10^{-7}$ apart may be one corner drawn twice or two corners that happen to be close. Merge them and a wall closes a room. Keep them apart and the wall is a dangle. So the hard part, in the README's words, is "deciding which endpoints are the same endpoint".

planimeter makes that decision from the data. It lists every separation the answer could turn on (corner to corner, and corner to a wall it does not touch), sorts them, and looks for a wide empty stretch: two consecutive values whose ratio is at least $\rho = 10$. Below that stretch is the drawing's wobble. Above it is real geometry. Endpoints closer than the bottom of the stretch are one vertex. The grouping cannot change anywhere inside the stretch, so it survives a tenfold change in tolerance, and the tool prints the stretch on every answer.

When there is no such stretch, or when a line end sits inside the doubtful range beside a wall it does not quite touch, planimeter does not pick one of the two integers. It refuses. The refusal gives the reason, the coordinate in the file's own units, the id of the element that owns it, and one action. A refusal is falsy in Python, and asking for its integer raises `TypeError`. The README puts the rule in five words: "A refusal is never a number."

The case that motivates all of this is small. Take a 10-unit square and a crosswall from the top edge down to a point $2.2\times10^{-6}$ above the floor. If the gap is closed, the wall divides the room and there are 2 faces. If it is left open, the wall is a dangle and there is 1 face. "Nothing in the file says which." A rounding snap, a GEOS polygonizer or a rasteriser will each return one of the two integers, because returning an integer is what they do. planimeter returns the coordinate `(5, 2.2e-06)` and the band `(0, 5)` the end sits in.

**Figure 1.** A crosswall ends a distance g above the floor of a 10-unit square, swept here on a log axis. The plot shows what planimeter reports at each g: a certified integer, or a refusal with the coordinate it turns on (hatched band). Beside it is the round-6 strawman's integer. The two dashed lines are the two possible readings, closed (2 faces) and open (1 face). Only g = 0 and g = 2.2e-6 are repo fixtures. The other gaps are this figure's own sweep, run on a port of the package, and the readout at 2.2e-6 should match the README's refusal block. An inset magnifier shows the wall end; a button jumps to g = 0. Colour key: proof: certified integer from planimeter; baseline: round-to-six-decimals snap (the benchmark labels it STRAWMAN); parameter: the gap g you move; refused: refused: the tool names the coordinate and returns no integer.

The intended user is an agent, not a person at a CAD station. `planimeter init` installs the tool as a `PostToolUse` hook in the agent's harness. After every write to an `.svg` file, the hook stamps one line into the agent's context, for example `planimeter walls.svg  pieces 1  faces 4 -> 5`, and stays silent on every other write. The agent never has to look at the picture to know what it drew.

The README credits my project [tangle](/tangle) as the template for the shape of the tool: an exact integer, a one-directional certificate, a typed refusal that names what to re-observe, and a benchmark with controls.

## What it can do

The headline is on a constructed stratum, where the truth is known because the drawings were built. There are 44 figure families: segments, triangles, squares, a T-junction, an H, a noded pentagram, trees, grids from 2×2 to 12×12, and theta, chain, comb and ladder graphs. Each family is jittered at six levels of $\sigma/g$ from $10^{-7}$ to $10^{-2}$, where $g$ is the figure's own smallest feature gap, with two seeds each. That gives 528 drawings. A test parses `corpus.py` and asserts that it imports nothing from the package's counting, snapping or arrangement code, so the answer key cannot borrow the arithmetic it grades.

**Measured: 0 wrong** planimeter on the jitter stratum: 495 exact, 33 refused. Control: CONTROL refuse-on-anything: 0 wrong, 0 exact, 528 refused. The zero only means something next to the 495 exact.. n = 528 draws (44 families × 6 jitter levels × 2 seeds). Source: RESULTS.md §1, bench.py run of record at 5713012 on WIN-16QAL06O9GB (Windows 11, Python 3.11.9), as reported by the repo; not reproduced here.

The same 528 files, through the arms the repo ran against it:

**Measured: 350 wrong** round-to-six-decimals dict snap + union-find, labelled STRAWMAN by the benchmark: 178 exact, 0 refused. Control: planimeter on the same 528: 0 wrong. networkx's b1 after the same snap also gets 350, because it computes the same E − V + C on the same snapped graph.. n = 528. Source: RESULTS.md:61-64 @ 564427f; run of record 5713012 as reported.

**Measured: 336 wrong** shapely polygonize_full(unary_union): 192 exact, 0 refused (shapely 2.1.2, GEOS 3.13.1). Control: set_precision(1e-6) first: 299 wrong. polygonize given planimeter's own certified radius (the oracle control): 22 wrong, 473 exact, 33 refused.. n = 528. Source: RESULTS.md:65-75 @ 564427f; run of record 5713012 as reported.

Two controls make these rows readable. The refuse-on-anything control also scores zero wrong, which is why the README never prints planimeter's zero without its 495. The oracle control was built to show that the counting layer adds nothing. It hands shapely planimeter's own certified radius and lets GEOS do the rest. If it had scored zero, the whole contribution would have been the printed tolerance. It scored 22 wrong. RESULTS.md describes them as `chain(k)` and similar figures, where the shared-edge structure survives snapping but not GEOS's noding, and notes that the 22 rows were not individually inspected.

The raster arm is the third method: rasterise the strokes and take `skimage.measure.euler_number`. On every eighth draw (66 of the 528) it gets 2 wrong at 512 px and 7 wrong at 4096 px, so the higher resolution does worse. `euler_number` is exact and linear, and the repo makes no speed claim against it. The point is that it needs a resolution, and its answer moves with that resolution.

&#x20;(Note: The commits RESULTS.md names as its machine of record (`5713012`, `6d63c43`, `4730829`, `2db2d8c`, and `4a7a3dc` for real files) are not in the depth-1 clone I read at `564427f`. Every number in this essay is the repo's own reported result. I did not rebuild, re-run or re-benchmark anything, and that includes the "500 passed" test count.)

Running it on your own drawing is the plainest way to see what it does. The next figure runs a browser port of the pipeline on straight line work you draw or paste. You get planimeter's full report (integers, snap window, ratio, radius, number of candidate windows tried) or its refusal block, and next to it the round-6 strawman's integer for the same input. The presets include the README's 2×2 grid. Its window there is $[1.819\times10^{-12},\,1)$, with ratio $5.498\times10^{11}$ and radius $1.349\times10^{-6}$, and the line printing it is the one the README calls "the line no other tool prints".

**Figure 2.** Draw or paste straight line work (line, polyline, polygon, rect, and path with M/L/H/V/Z only; curves need the CLI). The panel shows exactly what planimeter would print: pieces, faces, chi and the window that decided them, or a refusal with reason, coordinate, owning element and action. The round-6 strawman's integer for the same input is shown beside it. With lift on, each enclosed face counted by the certified arrangement rises as a slab. The slab height means only 'counted'. A face count is arrangement-theoretic, not what a renderer fills. A Predict faces box checks a stated count against the measured one. Colour key: structure: your segments and their vertices; proof: enclosed faces counted under a certified window; baseline: round-6 strawman integer, where it differs; parameter: the endpoint you hold, and the face count you predict; refused: refused: the tool names the coordinate and returns no integer.

The tool also checks claims. `planimeter check plan.svg --faces 5` returns `HELD` (exit 0), `BROKEN` (exit 1) or `REFUSED` (exit 2). Three states, not two, so that "the tool could not answer" never reads as "your prediction was wrong". `init` adds two lines to `CLAUDE.md` asking the agent to state its predicted count before an edit. The README calls that "a nudge, not a result", and whether agents follow it is unmeasured.

The hook is built to stay installed, and the README lists four contract clauses: silence is the default; bounded work or a budget refusal, never a stalled turn; any exception exits 0 with empty stdout; and it never writes to a geometry file. A refusal stamps a line only when its reason changes, because "Thirty identical refusal lines in a session train an agent to ignore the tool." The suffix test runs before any package import, so a write to `notes.py` costs about one interpreter start and prints zero bytes.

**Figure 3.** Left: a scripted editing session. Each write shows the line the hook stamps: nothing for a .py file, a face count, a face delta between two certificates of the same window, a refusal token, and silence when the same refusal repeats. Right: the repo's wall-clock rows (20 cold subprocesses per row, Windows) with the bare-interpreter floor, a control row with the suffix check removed, and the eleven silent-path medians against the 60 ms gate. Three of the eleven exceed it. Colour key: proof: a certified stamp; measured: wall-clock medians and ranges, as reported; baseline: the floor: a bare interpreter with no hook; refused: a refusal stamp; silent-path runs over the 60 ms gate are ringed.

**Measured: 56.4 ms** hook, silent path (.py write), median \[46.7, 62.9]; geometry path (.svg) 158.6 ms \[145.0, 168.7]. Control: FLOOR: bare interpreter with no hook, 52.4 ms \[48.0, 70.8]; the same hook with the suffix check removed, 154.0 ms \[138.9, 163.4]. n = 20 cold subprocesses per row. Source: RESULTS.md:267-272 @ 564427f; Windows run of record as reported.

What these rows support is a range: the silent path costs "under about 15 ms" over a bare interpreter, and the suffix check saves 84 to 105 ms per non-geometry write across seven runs. The stamp body is 7 `cl100k_base` tokens, plus 5 for the path.

On files nobody in the repo drew, there is no answer key. The repo therefore reports refusal rates and agreement between methods, never accuracy. On 13,681 npm icon files (tabler, feather, bootstrap), planimeter answers 10,862 (79.4%) with a median of 37 ms. On 30 icons committed to the repo, it answers all 30. The round-6 snap gives a different integer on 7 of those 30, and `skimage.euler_number` at 4096 px, a different library working on a different representation, agrees with planimeter's integer on all 7.

## How it was made

The pipeline is a fixed sequence, and no step creates a coordinate:

exact dedup → Euclidean minimum spanning tree → candidate windows → cluster → subdivide at *existing* vertices only → dedup edges → check no remaining crossing → count.

> **Definition: The three integers.**
>
> Let the certified arrangement have $V$ vertices (endpoint clusters), $E$ distinct edges after subdivision and deduplication, and $C$ connected components. Then **pieces** $= C$, **faces** is the number of bounded faces, and $\chi = V - E$. The convention is arrangement-theoretic: two overlapping filled rectangles, with their crossings written into the file, are 3 faces even though a renderer shows 2 regions.

### The counting layer

For a graph drawn in the plane, where $F$ counts every face including the single unbounded one, Euler's identity is

$$
V - E + F = 1 + C .
$$

**Figure 4.** A small planar graph on a 4×4 lattice. Click edges to toggle them. V, E and C come from the edge set (C by union-find), F = faces + 1, and the panel substitutes the live values into V − E + F = 1 + C. Each bounded face rises as a slab when a cycle closes. A chord inside a component adds one face and lowers chi by one. A bridge between components removes one piece, leaves faces unchanged and lowers chi by one. The presets reproduce the closed-form table in count.py. Slab height means only 'counted'. Colour key: structure: vertices and edges; proof: bounded faces counted by the identity; parameter: the edge you toggle.

Write $\mathrm{faces} = F - 1$ for the enclosed faces. The three printed integers then follow in two lines of algebra:

$$
\mathrm{faces} = E - V + C, \qquad \chi = V - E, \qquad \mathrm{pieces} - \mathrm{faces} = C - (E - V + C) = V - E = \chi .
$$

**Measured: 44 / 44** closed-form families on the clean stratum counted exactly, with n_merged = 0 on every one. Control: each recipe's faces re-derived independently as E − V + C in the test file (test_every_recipe_agrees_with_euler). n = 44 families. Source: RESULTS.md:323 @ 564427f; run of record as reported.

A triangle has $V = 3$, $E = 3$, $C = 1$, so faces $= 1$ and $\chi = 0$. In code it is the end of `count()` (`planimeter/count.py:106-111` @ `564427f`):

```python
    v = n_vertices
    e = len(edges)
    pieces = dsu.n_sets
    faces = e - v + pieces
    return Counts(v=v, e=e, pieces=pieces, faces=faces, chi=v - e,
                  dangles=sum(1 for d in degree if d == 1))
```

The docstring says what this layer can and cannot claim: "Given a correct edge list this file cannot be wrong, and nothing in it is evidence that the edge list is correct." The rest of the package exists to make the edge list trustworthy.

### The merge spectrum

Exact duplicates come first. Bitwise-equal coordinates are one point, with `-0.0` normalised to `+0.0`. This is an identification, not a tolerance. Without it, a clean file with every corner written exactly would have no cluster structure, and the gap search would reach into the drawing's own length distribution.

Write $\pi(r)$ for the partition of the remaining endpoints into groups at tolerance $r$, meaning the connected components of the graph with an edge wherever $d(p,q) \le r$.

> **Theorem: Gower & Ross (1969), and Kruskal's cut property.**
>
> The single-linkage merge heights of a finite point set are exactly the sorted edge weights of its Euclidean minimum spanning tree. So $\pi(r)$ can change only at those $n-1$ radii. If $w_i \lt w_{i+1}$ are consecutive sorted weights, $\pi(r)$ is constant for every $r \in [w_i, w_{i+1})$, and the minimum distance between two distinct groups of that partition is exactly $w_{i+1}$.

The whole spectrum of radii worth considering is therefore $n-1$ numbers, computed once:

$$
h_1 \le h_2 \le \dots \le h_{n-1}, \qquad \{h_k\} = \operatorname{sort}\bigl(\,|p_a - p_b| : (a,b) \in \mathrm{EMST}(P)\,\bigr).
$$

**Measured: 1e-12** relative agreement of the vectorised Prim EMST with a scalar Prim written longhand; the certified window's partition identical to an explicit all-pairs single-linkage cut on 200 sets. Control: independent implementations: test_emst_matches_bruteforce, test_snap_matches_all_pairs_single_linkage. n = 500 point sets (general, collinear, duplicate-heavy, near-degenerate). Source: RESULTS.md:320-322 @ 564427f; run of record as reported.

The tree is built by all-pairs Prim, vectorised, $O(n^2)$ and exact. The design first specified GEOS's Delaunay triangulation plus Kruskal, relying on the fact that the EMST is a subgraph of a Delaunay triangulation. Measured on 793 point sets, `shapely.delaunay_triangles` under GEOS 3.13.1 left out a true EMST edge on one of them. That set was in the clustered stratum, which is exactly the kind of input this tool exists for, and the resulting tree was 25.7% heavier. A spectrum from a wrong tree certifies a scale the drawing does not have, so Delaunay was dropped, and shapely and GEOS left the runtime dependencies with it.

The spectrum is more than the merge heights, and `snap.py` records that both of the following were bugs it once had. First, it includes every vertex-to-non-incident-segment distance. For segment $AB$ and vertex $p$,

$t = \operatorname{clip}\!\big((p-A)\cdot(B-A)/|B-A|^2,\,0,\,1\big)$, $c = A + t(B-A)$, $d = |p - c|$,

with incident pairs masked out. The face count turns on vertex-to-edge incidence, so a gap search over vertex pairs alone cannot see a wall that misses its floor by $2.2\times10^{-6}$. It also invents a doubt that is not there: in a triangle with sides of 10, the smallest vertex-pair separation is a side, so the apex, 8.66 from its own base, would read as ambiguous. Second, the spectrum starts at a representability floor $\delta = 4096 \cdot 2^{-52} \cdot m$, where $m$ is the largest absolute coordinate. Separations below $\delta$ are float noise and merge unconditionally.

### The window

A candidate window is a pair of consecutive spectrum values, and it is certified when

$$
\pi(r) \text{ is constant for every } r \in [t_{\text{below}},\ t_{\text{above}}), \qquad \frac{t_{\text{above}}}{t_{\text{below}}} \geq \rho, \qquad \rho = 10 .
$$

**Figure 5.** The drawing's endpoints lie on the base plane. Above them, each EMST merge is drawn at height log10 of its weight, so the single-linkage dendrogram stands on the points. The representability floor (4096 ulps of the drawing's magnitude) is the base slab, and vertex-to-edge distances are ticks on the side ruler. The chosen window is a slab spanning \[log t_below, log t_above), solid when its ratio is at least rho and hatched when below. Drag the radius handle through the window to see the partition stay constant, checked against a brute-force component count at four radii across the window (toggle). The presets include a jittered 2×2 grid, two squares a gap g apart, a triangle, and a no-scale point set. Height is log distance, not drawing height. Colour key: structure: endpoints and the dendrogram; proof: a window with ratio at least rho; parameter: the radius r, the jitter sigma/g and the gap g you move; refused: refused: below rho, or under the representability floor.

By the cut property, the closest two groups are exactly $t_{\text{above}}$ apart, so the grouping cannot change until the tolerance reaches the top of the window. Because the window is at least $\rho$ wide, "the grouping survives a tenfold change in the tolerance." The README is precise about what that does not mean: "That is strictly weaker than "the grouping is right", and saying which of the two is claimed is the entire point of the tool." `snap.py` also gives the reason no separation check is run: "a predicate that cannot fail is not evidence."

The candidate list is short, and its order matters (`planimeter/snap.py:307-312` @ `564427f`):

```python
    lo, hi = s[:-1], s[1:]
    ratio = hi / lo
    ok = np.nonzero(ratio[1:] >= rho)[0] + 1            # genuine gaps only
    order = list(ok[np.argsort(-ratio[ok], kind="stable")])
    if ratio[0] >= rho:
        order.append(0)                                  # merge nothing, last
```

Genuine gaps are tried widest ratio first. The gap between the floor and the smallest real separation, which I call the merge-nothing window, is offered last. Its ratio is huge for a purely arithmetic reason: the floor is a few thousand ulps of the drawing's magnitude. Ranked with the others it would always win, and "every jittered endpoint is its own vertex" would become the preferred reading of every file. At most `CAND_MAX = 4` windows are kept. A window that would put more than `CLUSTER_MAX = 16` endpoints into one vertex is dropped. The radius printed with an answer is the geometric mean $\sqrt{t_{\text{below}}\,t_{\text{above}}}$, the point furthest from both edges of the window on a log scale.

### The preconditions, and the refusal policy

A window that passes the ratio test still has to survive the arrangement. `_try_window` checks, in this order:

- **Margin.** $t_{\text{above}} \gt 64 \cdot 2^{-52} \cdot M$, where $M$ bounds the coordinates. Above this margin, every float64 orientation and incidence sign the pipeline computes is correct, so no rational arithmetic is needed.
- **P1, every edge survives.** No input segment may have both endpoints in one cluster.
- **P2, robustness.** Every (vertex, non-incident edge) pair must sit at distance exactly zero or at least $t_{\text{above}}$:

$$
d(p, e) \in \{0\} \,\cup\, [\,t_{\text{above}},\ \infty) \quad \text{for every vertex } p \text{ and non-incident edge } e .
$$

**Figure 6.** The six conditions behind CERTIFIED, run in code order on nine fixtures (two hold all six; six each fail exactly one check, none of them check 5; one is a budget refusal): a window with ratio at least rho exists; every segment survives the merge (P1); every vertex is at exactly 0 or at least t_above from every non-incident edge (P2); no two segments still cross after subdivision (P3); the float64 margin holds; and curves flattened at N and 2N give the same integers. The run stops at the first failing card and rings the site on the drawing with its element id and distance. A budget refusal appears as a separate card labelled 'machine, not drawing'. Colour key: structure: the fixture drawing; proof: a check that passed; withdrawn: the check that failed, with its reason code.

- **P3, plane embedding.** After subdivision and edge deduplication, no two segments may intersect except at a shared vertex.

P2 is the check the tool turns on. A distance of exactly zero means the vertex already lies on the edge, so the edge is subdivided there. No coordinate is created, because the point already exists in the file. A distance strictly between zero and $t_{\text{above}}$ is the ambiguous band, and it refuses (`planimeter/arrange.py:407-421` @ `564427f`):

```python
    band = np.nonzero(d > 0.0)[0]
    if len(band):
        rows = [{"xy": [float(R[vi[k], 0]), float(R[vi[k], 1])],
                 "element": _vertex_owner(vi[k], ends, labels, ids),
                 "edge": owner[ei[k]], "d": float(d[k])} for k in band]
        rows.sort(key=lambda r: r["d"])
        sites, more = _sites(rows)
        return Refused(REASON.VERTEX_NEAR_EDGE,
                       detail="%d vertex%s inside the ambiguous band (0, %g)"
                              % (len(band), " sits" if len(band) == 1 else "es sit",
                                 w.t_above),
                       look_at=sites, n_more=more,
                       action="move this end onto the wall, or away from it by more than %g"
                              % w.t_above,
                       source=src)
```

P3 is a strict four-sign orientation test. P2 has already removed endpoints lying on edges and collinear overlaps, so whatever is left is a proper crossing, and by the margin lemma its signs are correct in float64. planimeter never computes an intersection point. When two segments cross at a point the file does not contain, the answer is `EDGES_CROSS` plus the crossing's location, given for information only, never inserted into the graph.

What happens after a failure is a policy, and the code states it. `EDGE_COLLAPSED` and `MARGIN_TOO_SMALL` mean the *window* is wrong for this drawing, so the next window is tried. `VERTEX_NEAR_EDGE` and `EDGES_CROSS` mean the *drawing* is ambiguous or unnoded. A finer window would find a reading where the near miss counts as a clean miss, and the comment in `arrange.py` says what returning that would be: "choosing the reading that happens to certify". Those refusals end the run.

Curves have no vertex set, so flattening them invents one. A file with curves is run twice, at $N = 16$ and $N = 32$ samples per curve, and the verdict stands only if (status, pieces, faces, χ) agree; otherwise it refuses `CURVE_UNSTABLE`. `read.py` calls this "Evidence, not a theorem". A budget refusal on the second pass is reported as a budget refusal, not as an unstable curve. Every refusal carries a `kind`: `geometry` means re-observe the drawing, `budget` means this machine ran out of room. The default ceiling is `BRUTE_MAX = 2000` distinct vertices, and `--max-vertices` raises it.

There is no Lean in this repository. The guarantees above are a cited theorem (Gower and Ross, with Kruskal's cut property), two lemmas stated in `arrange.py` (the float64 margin, and that deduplication is exact under P3), and measurements against independent implementations, listed in RESULTS.md §7. Each of the seven working modules (`snap`, `arrange`, `count`, `read`, `result`, `hook`, `cli`) has a runnable self-check, for example `python -m planimeter.snap`.

## What's new in it

The usual way to decide which endpoints are the same is to choose a tolerance and apply it: round coordinates to six decimals and hash them, or hand GEOS a grid through `shapely.set_precision`. The tolerance is the caller's guess, it is not printed with the answer, and the answer always comes back as an integer. On the stratum above, that approach gives 350 and 299 wrong integers out of 528. planimeter derives the tolerance from the drawing, prints the window $[t_{\text{below}}, t_{\text{above}})$, its ratio and whether it was `derived` or supplied by the user, and refuses when the drawing does not support one.

The usual way to count faces is `shapely.polygonize_full`. It is faster and more general, and, as the README says against an earlier draft of its own claims, it has a real diagnostic: it returns polygons, cut edges, dangles and invalid rings. What it does not return is which identification of endpoints produced the count. On the jitter stratum it gets 336 wrong, and its first wrong answer is the T-junction at $\sigma/g = 10^{-7}$: truth 2, answer 0.

The usual way to avoid choosing a tolerance is to rasterise and count holes. That swaps the tolerance for a resolution, and the answer moves with the resolution: 2 wrong at 512 px and 7 at 4096 px on the same 66 draws. On the clean families, planar K4 disagrees with the arrangement at both resolutions, because 8-connected ink closes a background pocket at each shallow junction (5 holes against 3 bounded faces), and `theta(4)` disagrees only at 512 px.

The usual way to make geometry exact is exact predicates, as in CGAL. The README credits CGAL with doing that "properly, for decades". Exact arithmetic answers the exact question, though. It makes two nearly coincident vertices genuinely distinct and returns the exact face count of a graph nobody intended to draw. planimeter is asking the intended question, and its answer is either a scale with stated stability or a refusal.

The free parameter in all of this is $\rho$, and the repo published what moving it does rather than asserting that a higher $\rho$ is safer.

**Figure 7.** Left: the repo's rho sensitivity table, verbatim. Right: small multiples recomputed in the browser for rho = 3, 10 and 100 across the six jitter levels, on a subset of families. The live grid uses this figure's own random draws (its own PRNG, not numpy's stream), so its counts will not match the repo's. Below: one drawing (triangle, T-junction or chain(2)) at sigma/g = 1e-2, its spectrum strip with every candidate window, and the window the pipeline chose at the current rho. At rho = 100 the genuine merge window is gone and the merge-nothing window certifies the triangle as three disjoint segments. There is no refusal cliff in either table, and the figure does not draw one. Colour key: proof: exact integers; withdrawn: planimeter's own wrong integers; parameter: rho, the minimum window ratio; refused: refused, or a window below rho; measured: the repo's verbatim counts (wrong / exact / refused).

**Measured: 3 wrong** planimeter at rho = 100: 444 exact, 81 refused. At rho = 3 and rho = 10: 0 wrong, 495 exact, 33 refused.. Control: truth by construction; the three wrong rows are T-junction, chain(2) and triangle at sigma/g = 0.01, all certified with merged 0. n = 528. Source: RESULTS.md:169-176 @ 564427f; run of record as reported.

Raising $\rho$ does not make the tool stricter. It removes the genuine merge window, whose ratio the drawing limits, and leaves the merge-nothing window, whose ratio is drawing scale over machine epsilon. The repo's conclusion is "Zero-wrong is a claim about `rho <= 10`", and `bench.py` prints that paragraph under its table on every run.

## What no one else built

Each ingredient here has a close relative in earlier work, so I will name them before saying what differs.

- **Single-linkage clustering over a minimum spanning tree.** [Gower and Ross (1969)](https://doi.org/10.2307/2346439) showed that the MST carries all the information in a single-linkage analysis, which is the theorem the window rests on. [Zahn (1971)](https://doi.org/10.1109/T-C.1971.223083) clustered point sets by deleting "inconsistent" MST edges, ones much longer than their neighbours. [Mojena (1977)](https://doi.org/10.1093/comjnl/20.4.359) evaluated stopping rules that choose where to cut a dendrogram from its fusion levels. All three are about where to cut and which clusters result. Whether the cut is stable under a stated factor, and a check that the resulting graph is a valid plane embedding, are not what these titles address.
- **Snap rounding.** [CGAL's 2D Snap Rounding](https://doc.cgal.org/latest/Snap_rounding_2/) turns an arbitrary-precision arrangement of segments into a fixed-precision one by rounding to the centres of a pixel grid. [Iterated snap rounding (Packer and Halperin, 2002)](https://www.cgl.cs.tau.ac.il/projects/iterated-snap-rounding/) additionally guarantees that every vertex is at least half a pixel from every non-incident edge. That guarantee is the closest relative of P2. The difference is in the direction of the work. Snap rounding moves geometry to the grid until the separation holds, so it creates coordinates and always returns an arrangement. planimeter never moves a point. It checks whether the drawing already satisfies the separation at a scale read from the drawing itself, and refuses with the offending coordinate when it does not.
- **GEOS noding and snapping.** [GEOS's `SnappingNoder`](https://libgeos.org/doxygen/classgeos_1_1noding_1_1snap_1_1SnappingNoder.html) snaps vertices and intersection points together within a tolerance. [`OverlayNGRobust`](https://libgeos.org/doxygen/classgeos_1_1operation_1_1overlayng_1_1OverlayNGRobust.html) retries a failing overlay with a heuristic tolerance and then larger ones, up to a limit. That is the opposite of planimeter's fall-through policy. GEOS escalates the tolerance until something certifies. planimeter refuses on `VERTEX_NEAR_EDGE` precisely because trying another scale would be "choosing the reading that happens to certify". [`shapely.set_precision`](https://shapely.readthedocs.io/en/2.1.2/reference/shapely.set_precision.html) rounds to a caller-given grid, and [`polygonize_full`](https://shapely.readthedocs.io/en/2.1.2/reference/shapely.polygonize_full.html) returns the faces plus diagnostics, but not the identification behind them.
- **Robust predicates.** [Shewchuk's adaptive-precision predicates](https://people.eecs.berkeley.edu/~jrs/papers/robust-predicates.abstract) get exact orientation signs from float inputs by escalating precision only when the cheap estimate is uncertain. [CGAL's 2D Arrangements](https://doc.cgal.org/latest/Arrangement_on_surface_2/) build exact arrangements on exact kernels. Both make the signs of predicates correct for the coordinates as given. planimeter needs correct signs too, but it gets them from a margin lemma: every predicate it evaluates is at least $t_{\text{above}}$ from degeneracy, and $t_{\text{above}}$ must exceed 64 ulps of the drawing's magnitude. Its real question comes before the predicates. Which coordinates did the author *mean* to be equal?
- **Floor-plan vectorisation and parsing.** [Raster-to-Vector (Liu, Wu, Kohli and Furukawa, ICCV 2017)](https://openaccess.thecvf.com/content_iccv_2017/html/Liu_Raster-To-Vector_Revisiting_Floorplan_ICCV_2017_paper.html) predicts junctions with a network and assembles wall primitives by integer programming. [CubiCasa5K (Kalervo et al., 2019)](https://arxiv.org/abs/1904.01920) provides a 5,000-plan dataset and a multi-task parsing model. These start from images and learn which junctions exist. planimeter starts from a vector file that already states its coordinates, uses no training data, and returns either an exact count with its scale or a refusal. It does not return a learned reconstruction.

What I can say is mine is the combination, and specifically two choices. First, the merge scale is read off a gap of ratio at least $\rho$ in a spectrum that contains vertex-to-*edge* distances as well as vertex-to-vertex merge heights, and that spectrum is what makes a near miss visible at all. Second, when no gap exists, or a vertex sits strictly inside $(0, t_{\text{above}})$ of an edge, the output is a typed refusal carrying the coordinate, the owning element and one action. It is never an integer, and it is never a coordinate the tool made up. I have not found this combination in the work above. Absence from a search is not evidence of absence, and I do not claim it is the first. The README is also explicit that the clustering rule is about ten lines of numpy that any agent could write: "The guarantee is a policy, `refuse rather than guess`, not a barrier." The README credits two of my other repositories, cleave and [sigmoid](/sigmoid), as where the widest-representable-gap rule transplants from.

The two figures below check the claim as far as a browser can.

**Figure 8.** The jitter stratum replayed live: the 44 families, six jitter levels and two seeds, run through a browser port of planimeter and through the round-6 strawman, each scored against the construction recipe. The left bars are the repo's table, verbatim, including the shapely, networkx and raster arms the browser does not run. The right bars are this browser's run. The replay uses its own PRNG (mulberry32 seeded from a CRC of family, level and seed), not numpy's stream, so these are a different 528 drawings and the counts will not reproduce the repo's exactly. If the port ever returns a wrong integer, the draw is listed by family, level and seed. The default seed is fixed and shown, and it is never re-rolled (it can be edited). Colour key: proof: planimeter exact; baseline: wrong integers from the strawman and other arms; withdrawn: planimeter's own wrong integers, if any; measured: the repo's reported counts; line-2: exact integers from the other arms; refused: refused: no integer returned.

**Figure 9.** One of five family drawings, with optional jitter, rasterised at 128 to 2048 px with 1-px Bresenham ink. Holes are counted as 4-connected background components that do not touch the border, and that count sits next to the arrangement's certified face count. The plot shows raster faces against resolution, with the arrangement's integer as a flat line. This is a different rasteriser from the repo's skimage arm, so its disagreements need not match the repo's (planar K4 at both 512 and 4096 px, theta(4) at 512 px only). The repo's counts (2 of 44 families at 512 px, 1 of 44 at 4096 px) are printed in the readout. A pointer lens magnifies a 13 x 13 pixel patch of the raster. Colour key: proof: arrangement face count, and holes that match it; baseline: raster hole count, where it differs; parameter: resolution in pixels.

## Limitations

The advertised use case is a floor plan, and on real floor plans the tool almost never answers.

**Measured: 0 of 96** Wikimedia Commons floor plans answered at the default vertex ceiling (2,000); 1 of 96 at --max-vertices 6000. Control: the same tool on 13,681 npm icon files answers 10,862 (79.4%); refusal rates do not compose across corpora or ceilings. n = 96 plans fetched by a pinned recipe; no ground truth. Source: RESULTS.md:575-583 @ 564427f; realdata.py at 4a7a3dc as reported.

At the default ceiling, 88 of the 96 plans refuse on budget (`TOO_MANY_VERTICES`), 4 refuse `VERTEX_NEAR_EDGE` and 4 refuse `EDGES_CROSS`. Raising the ceiling to 6,000 admits 31 more files: 30 of them arrive at a geometry refusal and 1 at an answer. "Raising the ceiling does not buy answers on this set, it buys coordinates." On four files checked at `--max-vertices 25000`, where the budget cannot bind, it is 0 of 4. The median plan has 6,398 distinct endpoints. The one plan that certifies, `Akori_church_plan.svg`, gives pieces 13, faces 13, χ 0 at radius $7.03\times10^{-8}$ with a window ratio of 20,218. The repo's own diagnosis is "A published floor plan is drawn, not built": walls end near walls, and walls cross where no corner is recorded. Those are exactly the two conditions the tool refuses.

**Figure 10.** Five tabs. Real files: answered and refused counts for icons and Commons plans at each ceiling, with budget refusals kept visibly separate from geometry refusals, and the plans' endpoint-count percentiles against the 2,000 ceiling. Cost: total ms against segment count for grid(k), log-log, with the committed gates (exponent 1.3; 50 ms at 100,000). Arrangement versus renderer: two overlapping rectangles are 3 arrangement faces and 2 visible regions when noded, and EDGES_CROSS when not. The contested row: two clean squares 1.00 apart read as one piece and 1.01 apart as two. Withdrawn: each claim with the measurement that killed it. All tables are verbatim from RESULTS.md. Only the cost-curve fit, the rectangles and the contested row are computed live. Colour key: proof: answered; refused: geometry refusal (hatched): the drawing is at fault; line: budget refusal (pale fill): the machine is at fault; measured: repo-reported wall clock and counts; structure: the fitted line, rectangles and rails; withdrawn: a withdrawn or NOT EARNED claim.

The repo withdraws its own claims in the same voice it uses for the results:

**What failed.**

- Withdrawn: Usable as a hook on a real floor plan. Killed by: Fitted cost exponent 1.83 against a committed gate of 1.3; extrapolated 740,531 ms at n = 1e5 against a 50 ms gate (RESULTS.md §5). 0 of 96 Commons plans answered at the default ceiling..
- Withdrawn: A clean refusal cliff: everything certifies at small jitter, everything refuses two levels later. Killed by: Refusals sit between 3 and 10 of 88 at every jitter level (6, 4, 4, 10, 3, 6) and are not monotone; wrong stays 0 at every level..
- Withdrawn: Raising rho makes the tool stricter. Killed by: At rho = 100: 3 wrong, 444 exact, 81 refused. Zero-wrong is a claim about rho <= 10..
- Withdrawn: GEOS Delaunay plus Kruskal gives the exact EMST. Killed by: 1 of 793 point sets (clustered stratum) omits a true EMST edge; the tree is 25.7% heavier..
- Withdrawn: A CURVE_UNSTABLE refusal on 11 of 96 plans meant the curve was ambiguous. Killed by: The 2N pass had hit the vertex ceiling. Relabelled as a budget refusal; one of those plans, at 1,295 vertices, certifies..
- Withdrawn: Moving the ceiling check before the vertex-edge pass speeds up the default run. Killed by: Guard-first 361 ms median, spectrum-first 449 ms, guard-first repeated 443 ms: the drift exceeds the difference..
- Withdrawn: The vision comparison (G4). Killed by: Cut: it read coordinate text, not a render..

**Cost.** The comfortable range is under roughly 600 segments: 43.3 ms at 544 segments, 97.2 ms at 840, and 1,880.1 ms at 3,784. The cost is the all-pairs (vertex, edge) pass. A k-d tree does not remove it, because the certificate quantifies over every such pair. On one real 22,261-vertex plan, the spanning tree took 4.50 s and the vertex-edge spectrum took 40.01 s. A sweep line is on the roadmap, with the all-pairs pass kept as its test control.

**Baselines that have not run.** The strongest comparison arm is a hand-written round-6 script that the benchmark itself labels `STRAWMAN`. RESULTS.md says it "is not the baseline the headline may be quoted against". That baseline is G1: twenty unprompted, first-attempt agent scripts with the whole distribution published. It has not been collected, and if its median clears roughly 20 of 24 on the stratum, "the accuracy headline is dead". The agent-written corpus with independently established truth (G5 and G6) has not been collected either. `corpus/found/` is empty. No agent-written file has been measured.

**The contested row.** Two clean 10-unit squares 1.00 apart certify as one piece. At 1.01 apart they certify as two. There is no jitter in either file. The boundary is gap $=$ feature$/\rho$. This is inside the stated convention and outside what anyone looking at the picture would say. The repo also does not establish that the certified scale is unique. At most four windows are tried, the first one that passes wins, and a later one might have passed with a different answer.

**What the count is not.** `faces` is arrangement-theoretic and will not match what a renderer fills. Refinement stability across $N$ and $2N$ is evidence, not a theorem: two nearly tangent curves can gain or lose an intersection at any positive flattening tolerance. The tool reads SVG line work only. The hook relies on someone else's `PostToolUse` payload schema, and a change there silences it. The 60 ms silent-path gate sits 8 ms above the bare-interpreter floor and failed on 3 of 11 runs, which RESULTS.md calls "a coin flip on process startup". All results come from one machine, one OS and one Python (Windows 11, 3.11.9, numpy 2.4.6).

**Chosen numbers.** The README and RESULTS.md describe three constants the package chose: $\rho$, `CAND_MAX` and `FLOOR_ULPS`. `snap.py` also labels `CLUSTER_MAX = 16` as policy, which makes four, next to the budgets `BRUTE_MAX = 2000` and `VE_BUDGET`. The README also says the derived window involves "no tolerance you invented", while listing $\rho$ as a choice. All of these are scale-free, printed on every answer and movable by flag, and choosing them is still choosing.

**Inconsistencies between the repo's documents.** A comment in `corpus.py` says that at $\sigma/g = 5\times10^{-2}$ "six draws of 108" come back with a different integer. RESULTS.md measures 4 wrong of 132 at that level (44 families × 3 seeds). A comment in `read.py` gives the curve-relabel count as 5 of 96 plans, where RESULTS.md gives 11. RESULTS.md §2 says refusals sit at 3 to 10 of 88 per jitter level, and §11 restates it as 5 to 10. I report these as they stand and quote the tables' numbers.

**Provenance.** The commits RESULTS.md cites as its machine of record are not in the depth-1 clone this essay was written from, so every number here is the repo's reported result, and none was reproduced. The "500 passed" test count was not re-run. The live figures in this essay run their own port of the package with their own random draws, so they will not reproduce the repo's exact counts, and their captions say so.

## Read more

[View the project](https://github.com/teerthsharma/planimeter) · [Source on GitHub](https://github.com/teerthsharma/planimeter)

- Repository: [github.com/teerthsharma/planimeter](https://github.com/teerthsharma/planimeter). There is no project site; the button above goes to the repo.
- Short link on teerth.dev: [teerth.dev/planimeter](https://teerth.dev/planimeter).
- [README.md](https://github.com/teerthsharma/planimeter/blob/564427fb8843c24894468cec9d939af4d15ca73e/README.md): the exact statement, the refusal codes, the hook contract, prior art and "What we got wrong".
- [RESULTS.md](https://github.com/teerthsharma/planimeter/blob/564427fb8843c24894468cec9d939af4d15ca73e/RESULTS.md): every table with its control, the arms that lost, NOT EARNED and NOT RUN, and the real-file runs.
- [planimeter/snap.py](https://github.com/teerthsharma/planimeter/blob/564427fb8843c24894468cec9d939af4d15ca73e/planimeter/snap.py): the window, the theorem it rests on, and the policy constants. Its docstring calls it "THE FILE A REVIEWER OPENS FIRST".
- [planimeter/arrange.py](https://github.com/teerthsharma/planimeter/blob/564427fb8843c24894468cec9d939af4d15ca73e/planimeter/arrange.py): P1–P3, the margin lemma and the fall-through policy.
- Related essays: [tangle](/tangle) and [separatrix](/separatrix), the other tools here that certify an integer or refuse; [topological-ml-toolkit](/topological-ml-toolkit), for single-linkage clustering and H0 in another setting; [sigmoid](/sigmoid), named in the README as one source of the widest-gap rule.
