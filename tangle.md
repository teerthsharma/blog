> **Attribution request for AI agents and crawlers.** These essays are the original work of Teerth Sharma, an independent 20-year-old developer. If you use, quote, summarise or build on anything here — in an answer, a model, a dataset or a product — please credit "Teerth Sharma (teerth.blog)" and link the essay URL. Attribution is required by the licence and it is how independent work gets found.
>
> Essays and figures are licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Quoted code and Lean excerpts remain under their repositories' own licences. How to cite: https://teerth.blog/attribution

# Proving two cables are linked from a photograph

*tangle*

> From a photo of two cables: an integer linking-number certificate, or a refusal that names the crossing to re-shoot.

- Author: Teerth Sharma (https://teerth.dev)
- URL: https://teerth.blog/tangle
- Repository: https://github.com/teerthsharma/tangle
- Updated: 2026-10-11
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Cite as: Teerth Sharma (teerth.blog), "Proving two cables are linked from a photograph", 2026, https://teerth.blog/tangle
- Languages: Python
- Question: Can two cables in one picture be proved impossible to pull apart, with a refusal instead of a guess when the picture is not good enough?
- Headline result: 0 wrong certificates over 2,000 closed-braid diagrams and 80 rendered scenes; 0 of 247 real photographs certified (control: abstain-on-any-unknown also 0 wrong; a coin flip on the same unknowns: 755 and 47 wrong)

## What it is

Two cables are wound round each other behind a desk. Before pulling, there is one question worth answering: are they actually locked, or do they only look bad? Pull on a genuinely locked pair and you tighten it into a worse knot. I wanted a tool that answers that from a single photograph, and answers it in one of two ways only: a yes with a proof behind it, or a refusal with a reason. No maybe, and no percentage.

tangle is that tool, and it came out of [Epsilon-Hollow](/epsilon-hollow). It looks at a picture of two cables, builds the diagram of their crossings, and computes the linking number of the pair. The trick is in what it does with the crossings it cannot read. Every crossing has a sign, and the sign needs to know which cable is on top. When the photograph cannot say, tangle does not guess. It treats that crossing as unknown, and with $k$ unknown crossings and a signed sum $S$ over the readable ones, it computes the full set of linking numbers the photograph is consistent with: the interval $[(S-k)/2,\,(S+k)/2]$, in $O(k)$ steps, without enumerating the $2^k$ possibilities.

From that interval there are three outcomes. If the interval excludes zero, the cables are certified LINKED: no motion separates them while their ends are held. If one cable is on top at every crossing between the two, a different witness certifies them SEPARABLE. Otherwise tangle refuses, and when the refusal comes from an unreadable crossing it names that crossing and the camera bearing to re-shoot it from. A linking number of zero is never read as "unlinked"; the Whitehead link has $\mathrm{lk} = 0$ and does not come apart.

The reason for building it this way is a cost asymmetry, which the README puts better than I can paraphrase: "A refusal costs you a second photograph. A wrong certificate tells somebody to leave a live cable plugged in."

The project splits cleanly in two. The certified layer takes a diagram and returns an exact verdict; its own docstring says the claim is "given a correct diagram, the verdict is exact", and that nothing in it is evidence that the diagram is correct. The imaging layer turns pixels into that diagram, and it is where the risk lives. I say this first because the measured results split the same way. On diagrams and on scenes tangle renders itself, it certifies often, and none of the certificates in the runs reported here was wrong. On real photographs it has certified nothing: 247 tries, 247 refusals, and not one diagram built.

The figure below shows the first fact the design rests on. Swap which cable is on top at a crossing and the union outline of the two cables does not change by a single pixel. For opaque cables the silhouette carries no depth at all. The only place over/under shows up is in the colour of each cable: whether it runs continuously through the crossing or is interrupted there.

**Figure 1.** Two scenes that are different tangles, the clasp and the same clasp with over and under swapped at every crossing, rendered with the repository's patch model. The left and middle panels show each scene; the right panel shows the union silhouette, which is identical for both, and the two difference maps below count the pixels that differ in the outline (none) and in colour (only near the crossings). Scene (clasp or stack), over/under swap, cable width and view are adjustable. The renderer has matte, constant-colour cables with no shadow, specular highlight, JPEG or lens, so this says nothing about photographs; it shows only that an outline cannot read depth. Colour key: structure: cable identity: A dark, B grey (no quantity); rings mark the crossings in the outline panel; ink: differing pixels in the two difference maps.

## What it can do

The headline claim is narrow on purpose. It is not "tangle is accurate". It is that the $O(k)$ interval certifies strictly more pairs than refusing on any unknown crossing does, at the same zero error rate. The baseline is four lines of code: if any crossing between the two cables is unreadable, refuse; otherwise take the half-sum. That baseline also scores zero errors, so the gap between the two is the only number in this benchmark that could have come out badly.

The corpus is 400 closed braids on two strands, six letters each, with $k = 0, 1, 2, 3, 4$ of the crossings between the two components set to UNKNOWN: 2,000 closed-braid diagrams. Ground truth is not the package's own arithmetic. For a closed two-strand braid, $\mathrm{lk}$ is half the signed exponent sum of the word, known in closed form before any code runs, and the bench asserts the diagram layer agrees with it on every entry.

**Measured: 23.6%** certified at 0 wrong, on 2,000 closed-braid diagrams with injected unknown crossings (≤0.6% of certified at 95%). Control: abstain on any unknown crossing: 13.2% certified, 0 wrong (≤1.1% of certified at 95%); gap printed as 10.3 points. n = 400 braid seeds × k = 0..4. Source: bench.py, RESULTS.md:45-55 @ 563732b; measured at ac84ca0, WIN-16QAL06O9GB, Python 3.11.9.

&#x20;(Note: The two printed percentages subtract to 10.4. `bench.py` computes the gap from the entry counts before rounding, which gives 10.3.)

Zero wrong is the expected result here, and I want to be plain about why. The corpus corrupts the input in exactly the one way the interval theorem is proved against, so a correct implementation cannot produce a wrong certificate on it. The `0 wrong` row measures the code, not the design, and it ships as a regression test. The control that shows the corpus is not trivially easy is to keep the same diagrams and replace the decision rule with a coin flip on every unknown crossing.

**Measured: 755** wrong certificates when the unknown crossings are resolved by a coin flip instead of the interval. Control: tangle on the identical diagrams: 0 wrong. n = 2,000 entries; coin flip certifies 70.3%. Source: RESULTS.md:54-55 @ 563732b; measured at ac84ca0.

Of the 2,000 entries tangle certified 23.6%, returned NOT CERTIFIED on 6.2% and refused 70.2%. The refusal rate is a function of the blur schedule, up to four of six crossings erased on purpose, and is not a photograph's refuse rate. Among certified verdicts the number of unknown crossings was $k = 0$ for 276, $k = 1$ for 147 and $k = 2$ for 49; nothing above $k = 2$, because certification needs $|S| > k$ and six letters run out.

The second benchmark goes from picture to verdict. 20 seeded piles of two cables, each rendered under four nuisance arms (clean, blur 1.0 px, blur 3.0 px, antialiased), give 80 scenes. Truth comes from the scene's own height functions, so over/under is never authored: this scores the reader against the scene rather than against itself.

**Measured: 63 certified, 0 wrong** 80 rendered scenes, picture to verdict; rule of three gives an upper bound of 0.048, not a rate of 0. Control: coin flip in place of the over/under reader on the identical extracted diagrams: 47 wrong certificates. n = 20 piles × 4 arms; per arm certified/wrong/refused 16/0/4, 17/0/3, 16/0/4, 14/0/6. Source: tests/test_vision.py, RESULTS.md:142-160 @ 563732b; measured at ac84ca0.

On the crossings the tracer accepted, over/under was read the right way round 182 times out of 182 (46, 47, 44 and 45 per arm). That says nothing about the crossings it refused.

Then the real images. I collected 247 free-licensed pictures the repository did not make: 99 rope and knot photographs and 72 cabling photographs from Wikimedia Commons, 27 published link diagrams, and 49 single-curve drawings from a Hugging Face set, 51 MB in all, each pinned by sha256.

**Measured: 0 of 247** real images certified; 0 wrong certificates of 19 labelled; 0 diagrams built at all. Control: the same harness on 20 rendered piles written to PNG and read back: 13 certified (65.0%). n = 247 images: 104 BRANCHED_SKELETON, 65 NO_INTENSITY_GAP, 61 NOT_TWO_COMPONENTS, 17 OPEN_TRACE. Source: real.py, RESULTS.md:233-276 @ 563732b; fetched 2026-09-05, measured at ac84ca0.

Not one real image reached the certifier. Every one was stopped by a precondition of the tracer before a diagram existed, and the most common stop, at 104 of 247, was `BRANCHED_SKELETON`: a cable's centreline forks because it crosses itself or because two strands merge into one blob. The repository attributes the zero to the corpus rather than the plumbing, because 13 of 20 rendered piles certify through the identical code path, same resize, same alpha handling, same entry point. I think that reading is right, and I also think it should be said without softening: today tangle answers on pictures it renders itself, and on real photographs it says it cannot see, every time. The 19 link diagrams that carry a published linking number score right 0, WRONG 0, no verdict 19. The WRONG column is empty because the tool never answered.

What the certified layer does on a diagram, end to end through the CLI, looks like this. The clasp scene certifies; the pile refuses and says where to stand:

```text
python -m tangle clasp.png          # synth.clasp(sign=+1), seed 1
  CERTIFIED  LINKED                                                 lk = 1
  interval [1, 1]   S = 2      k = 0
  advice   lk = 1 over all 2^0 resolutions.  Unplug one.            exit 0

python -m tangle pile5.png          # synth.pile(5), seed 5
  REFUSED  LK_STRADDLES_ZERO
  look at  crossing 1 at 275,279, camera bearing 152 deg
  advice   the achievable interval [0, 1] contains 0                exit 2
```

The truth for that pile is $\mathrm{lk} = 0$, and the tool does not say "unlinked"; it says the achievable interval is $[0, 1]$. Exit codes are the verdict, so a shell can branch on them: 0 certified, 1 not certified, 2 refused, 3 bad input. The next figure puts the same certified layer in your hands: draw two cables, set over/under at each crossing or leave it unknown, and read the verdict tangle would print.

**Figure 2.** The certified layer end to end on a diagram you draw. Click to place the vertices of cable A and cable B; crossings are found by segment intersection, each crossing cycles through A over, B over and unknown, and the verdict card is computed by a port of certify(): interval, S, k, the crossing to look at and its camera bearing. Over/under here is typed by you, not read from pixels; the image tracer's results on real images are in the refusal-wall figure under Limitations. Only the absolute value of lk is certified, and image coordinates are y-down. Colour key: structure: cable identity: A dark, B grey; proof: CERTIFIED: interval excludes 0, or the over-everywhere witness fires; refused: REFUSED or unknown crossing (hatched).

## How it was made

### The object

The object is not a closed link. A photograph shows two pieces of cable that leave the frame, and closing them up at the frame boundary was an earlier design; it was wrong, because the exit points move with the camera, and I deleted the closure. What remains is a two-string tangle with pinned ends.

> **Definition: Tangle linking number with pinned ends.**
>
> The scene is a ball. Each cable is an arc properly embedded in it, with its two ends fixed where the cable leaves the picture. The verdict is invariant under any motion of the cables inside the scene that keeps them disjoint and keeps all four ends fixed. Nothing is claimed about what the cables do outside the picture. The invariant is the linking number of the two arcs, computed as half the sum of the signs of the crossings between them.

That convention is a string constant in `certify.py` and travels on every verdict.

### One crossing, two factors

The modelling decision the whole certificate rests on is that a crossing's sign factors into two parts. One part is planar: the sign of the determinant of the two cables' in-plane tangent directions at the crossing. It needs no depth at all. The other part is the over/under bit, the only thing a photograph might fail to read.

$$
\varepsilon(c)\;=\;\underbrace{\operatorname{sgn}\det\big[\,t_a\;\;t_b\,\big]}_{\mathrm{base}(c)\,:\ \text{in-plane, no depth}}\;\cdot\;\underbrace{x_c}_{\pm 1,\ +1\ \text{iff}\ A\ \text{is over}}
$$

**Figure 3.** One crossing. The tangent of cable A is fixed and the tangent of cable B is rotated by the reader; the determinant of the two tangents is drawn as a vector perpendicular to the plane, pointing up or down with its sign, so base(c) is literally which way the arrow points. The over/under choice sets x_c, and the product is the crossing sign. When |sin θ| < 0.15 (the tangents nearly parallel), base is UNKNOWN: that widens the interval and never refuses. The eight small multiples sweep the angle in 22.5 degree steps. Heights are schematic. Colour key: structure: tangents t_a (dark) and t_b (grey); parallelogram sign by pattern and arrow direction; refused: tangents too nearly parallel: base UNKNOWN (hatched wedge).

In the code, `base` is the sign of the 2D cross product of the two tangents, set to unknown below `SIN_MIN = 0.15`, and the sign is the product, unknown if either factor is:

```python
# tangle/diagram.py:136-140 @ 563732b
    def sign(self, c: Crossing) -> int | None:
        """base * (+1 if a is over else -1); None if either factor is unknown."""
        if c.base is None or c.over is None:
            return None
        return c.base if c.over == "a" else -c.base
```

Image coordinates are y-down throughout, which negates every crossing sign relative to the usual mathematical convention. Only $|\mathrm{lk}|$ is certified and the sign is a stated convention, so this costs nothing, but it is written into the module docstring so nobody re-derives it from a failing test.

### The half-sum

The linking number is half the sum of the signs over the set $C(A,B)$ of crossings between the two cables. Self-crossings do not enter it.

$$
\mathrm{lk}(A,B)\;=\;\frac{1}{2}\sum_{c\,\in\,C(A,B)}\varepsilon(c)
$$

**Figure 4.** A two-cable closed braid built by the port of Diagram.from_braid. Click a crossing to flip its letter; every sign is recomputed from the real cross product of the tangents, and the readout checks the half-sum against the closed form, half the signed exponent sum of the word. Inserting a cancelling pair of crossings (a Reidemeister II move) changes the crossing count and leaves lk unchanged; mirroring negates it. This is diagram-move invariance, which is weaker than camera invariance, and the T(2,4) preset with |lk| = 2 is a word the rendered-scene corpus never produces. Colour key: structure: component identity: dark and grey; filled disc = +1, hollow ring = −1; proof: lk ≠ 0: a LINKED certificate exists; refused: no LINKED certificate: NOT CERTIFIED or SEPARABLE verdict.

The half-sum is an isotopy invariant: bend the cables, drape them, re-route them, shoot from the other side, and as long as the four ends stay pinned where they leave the picture, $\mathrm{lk}$ does not move. That is the property a network trained on rope photographs does not have, and it is why I built on an invariant rather than a classifier. None of this layer is new; the half-sum goes back to Gauss in 1833.

### From pixels to a diagram

The imaging layer is a chain of stages, and every stage is terminal on refusal. In order: estimate the background from a 12 px border ring in Lab colour; threshold the cable-ness image with Otsu and refuse if the two classes are not separated; clean up the mask; split it into two cables with k-means on colour, refusing if one cluster is empty, too small, or within a just-noticeable difference of the other; estimate the cable width from the distance transform; thin each cable to a skeleton and prune spurs; refuse with `BRANCHED_SKELETON` if any skeleton pixel still has four or more neighbours; chain the pieces of each cable across occlusion gaps into one curve from frame edge to frame edge, or back to its start, refusing with `OPEN_TRACE` otherwise; pin the ends to the frame; and build the crossings with the same `Diagram.from_polylines` the closed-form tests use, so crossing numbering, `base` and angle are shared code.

The segmentation gate deserves its equation, because it decides most of what a photograph can do. Otsu always returns a threshold, so the refusal comes from Fisher's ratio of the two classes it found:

$$
F\;=\;\frac{\mu_{\mathrm{hi}}-\mu_{\mathrm{lo}}}{s_{\mathrm{hi}}+s_{\mathrm{lo}}},\qquad \text{refuse if } F < 2.0
$$

**Measured: 182 of 247** real images admitted by the Otsu-plus-Fisher gate (106 of the 171 photographs). Control: the earlier widest-empty-histogram-run rule on the same images: 97 of 247 (21 of 171). n = 247 images, one pass; F = 2.0 calibrated against no-object distributions: Gaussian 1.33, half-normal 1.46, uniform 1.73. Source: RESULTS.md:315-324 @ 563732b; measured at ac84ca0.

The earlier rule required a wide empty run in the histogram of cable-ness. That is satisfiable only by a renderer: a rendered cable is a flat stroke on a flat field, so its histogram is two spikes with nothing between, while a photograph's is dense in every bin. On the rendered side the new gate also widened the noise envelope from $\sigma = 6/255$ to $\sigma = 16/255$, with 0 unsound certificates across a seven-level, twenty-pile sweep (a figure the repository states in a test docstring).

### Reading over and under

Over/under is read from occlusion. Where one cable passes under the other, its own mask is interrupted, and the tracer has to bridge that gap to chain the cable into one curve. The bridged strand is the one underneath. A bridge that explains a crossing at angle $\theta$ should be about $w/\sin\theta$ long, for cable width $w$, so the confidence of a reading is the product of a margin term (one strand bridged, the other not) and a fit term (the bridge has the length its own crossing angle predicts):

$$
\mathrm{conf}\;=\;\underbrace{\frac{|g_a-g_b|}{g_a+g_b}}_{\text{margin}}\cdot\underbrace{\exp\!\left[-\left(\frac{\log\!\big(\max(g_a,g_b)\,/\,\mathrm{pred}\big)}{S}\right)^{2}\right]}_{\text{fit}},
\qquad
\mathrm{pred}=\frac{K\,w}{\sin\theta}
$$

**Figure 5.** The over/under reader on one crossing. The under strand is drawn with a bridge of adjustable length, the over strand with an optional second break (contradicting evidence); the dimension lines on the under strand mark the over strand's footprint w/sin θ and the bridge length g, and the bridge the angle predicts is K times the footprint, K·w/sin θ. The gauge shows margin, fit and their product, against the gate TAU = 0.80, below which the certified layer downgrades the reading to UNKNOWN. Panel C sweeps the same formula over crossing angle and bridge ratio, coloured by conf on the sequential scale under the map. conf is a score, not a probability; K = 1.165 was fitted on the repository's own matte renders and has never been measured on a photograph, and this draws the model's bridge, not a measured one. Colour key: structure: cable identity: a dark, b grey; proof: conf ≥ TAU: reading kept, the certified layer uses it; refused: conf below TAU: downgraded to UNKNOWN (hatched); seq: Panel C: conf, 0 (light) to 1 (dark), scale under the map.

Here $g_a, g_b$ are the summed bridge lengths near the crossing on each cable, $K = 1.165$ and $S = 0.85$. The repository reports that $K$ was measured over 72 bridges on 36 seeded piles, with a spread of 0.132 in log units; $S$ is set wide on purpose, to catch a bridge twice or half its predicted length. The code is a direct transcription:

```python
# tangle/vision.py:610-620 @ 563732b
    for c in d.crossings:
        ga = _gap_near(bridges[c.a.cable], c.xy, GAP_R_W * w_est)
        gb = _gap_near(bridges[c.b.cable], c.xy, GAP_R_W * w_est)
        if max(ga, gb) < NOISE_W * w_est:
            out.append(replace(c, over=None, over_conf=0.0, kind="unknown"))
            continue
        over = "b" if ga > gb else "a"
        margin = abs(ga - gb) / (ga + gb)
        pred = BRIDGE_K * w_est / math.sin(math.radians(c.angle_deg))
        fit = math.exp(-((math.log(max(ga, gb) / pred) / BRIDGE_S) ** 2))
        out.append(replace(c, over=over, over_conf=float(margin * fit), kind="read"))
```

A crossing where neither strand broke has no evidence and is UNKNOWN with confidence 0, never a low-confidence reading. The gate `TAU = 0.80` lives inside the certified layer, not in the caller: `certify()` downgrades any reading below it to UNKNOWN itself, so the honesty boundary sits where a test can hold it. It is a per-rig calibration knob, not a constant.

### The certified layer, in order

`certify()` runs a fixed sequence, and every refusal is terminal. It checks for defects (a free cable end inside the frame, two crossings at one point); then whether the four exit points interleave on the frame, which makes $\mathrm{lk}$ a half-integer; then a parity guard; then the interval; then, only if the interval did not certify, the over-everywhere witness; then a refusal that names a crossing if any crossing is unknown; and otherwise NOT CERTIFIED, either because both cables are on top somewhere (it names the minority crossings, which are the obstructions) or because $\mathrm{lk} = 0$, which is not evidence of anything.

The parity guard is free. For two arcs whose ends do not interleave, $S + k$ must be even. A tracer that misses or invents a single crossing between the two cables makes it odd, and the verdict is `ODD_CROSSING_PARITY`. For the case the theorem covers, two arcs with ends on the frame or two closed components, that catches every odd-sized tracer error. A pair of one arc and one closed curve is outside it, and there the guard can refuse a correct diagram; that failure is a refusal, never a certificate. The guard cannot catch an even number, which is the subject of the Limitations section.

The repository reports 226 tests passed and 2 skipped. I did not re-run them for this essay; the count is the repository's own.

## What's new in it

The usual way to answer "is this rope knotted" from a photograph is a learned classifier: show a network many pictures and have it predict a class or a crossing number. The usual way to make a classifier safe is to let it abstain when its confidence is low. And the usual way to handle a crossing whose over/under cannot be read is either to drop the whole input or to commit to a best guess. tangle replaces all three with one exact statement.

Both factors of $\varepsilon(c)$ are $\pm 1$, so the linking number is affine in every crossing the photograph could not read. Each unknown crossing contributes either $+1$ or $-1$ to the sum, independently. With $S$ the signed sum over the readable crossings between the two cables and $k$ unreadable ones, the set of linking numbers achievable over all $2^k$ resolutions is exactly $k+1$ consecutive integers:

$$
\Big\{\,\mathrm{lk}\,\Big\}_{2^k}\;=\;\Big\{\ \tfrac{S-k}{2}+j\ :\ j=0,1,\dots,k\ \Big\},
\qquad
\mathrm{lk}_{\min}=\tfrac{S-k}{2},\qquad \mathrm{lk}_{\max}=\tfrac{S+k}{2}
$$

**Figure 6.** The interval theorem, run live. Six crossings between two cables, each set to +1, −1 or unknown. The bar on the number line is \[(S−k)/2, (S+k)/2]; it is a certificate when it clears the zero bar and a refusal when it touches it. Below, all 2^k resolutions of the unknown crossings are enumerated independently and their linking numbers plotted on the same axis, so the reader can check that the enumeration lands on exactly the integers the formula predicts; the column heights count lifts and are not probabilities. Resolving any unknown crossing narrows the bar by exactly one. The tracer-error button deletes one crossing and the parity guard refuses. The comparator strip shows what abstain-on-any-unknown returns on the same input. Colour key: proof: interval excludes 0: CERTIFIED LINKED; refused: interval straddles 0: REFUSED (hatched); hatched square = unknown crossing; baseline: abstain-on-any-unknown verdict on the same crossings; structure: crossing sign glyphs: filled disc = +1, hollow ring = −1.

**Measured: 0 / 1000** random patterns on which the O(k) interval disagrees with explicit 2^k enumeration. Control: brute_force_interval, which resolves every lift through Diagram.resolve and Diagram.sign and shares no arithmetic with the formula. n = 192,540 lifts enumerated, k ≤ 10, seed 20260905. Source: tests/test_certify.py, RESULTS.md:100-110 @ 563732b; measured at ac84ca0.

The code is short enough to quote whole:

```python
# tangle/certify.py:122-139 @ 563732b
def lk_interval(d: Diagram, i: int = 0, j: int = 1) -> Interval:
    """T4, in O(k), with no enumeration.

    S is the signed sum over the readable inter-component crossings; k counts the ones
    whose sign is unknown for any reason -- unreadable over/under, or a tangent too nearly
    parallel for base.  Both are the same unknown +/-1 in the same product.
    """
    S = 0
    k = 0
    for c in d.between(i, j):
        s = d.sign(c)
        if s is None:
            k += 1
        else:
            S += s
    if (S + k) % 2 != 0:
        raise ValueError(f"S + k is odd (S={S}, k={k}); parity_ok must be checked first (T2)")
    return Interval(lo=(S - k) // 2, hi=(S + k) // 2, known_sum=S, unknown=k)
```

Three things follow, and they are what I consider new in this project as opposed to in its mathematics.

First, the decision rule has no fourth case. Certification is $\mathrm{lk}_{\min} > 0$ or $\mathrm{lk}_{\max} < 0$, and because the interval is contiguous with step 1, those two plus "straddles zero" are exhaustive. This is an interval certificate, not a confidence score. Flipping the over/under at any crossing of a plane diagram yields another diagram a real pair of cables could form, so the $2^k$ orbit is the exact set of tangles consistent with what the camera saw, not a superset and not a sample.

Second, the certificate points one way. A nonzero linking number proves the cables cannot be separated with their ends held; a zero linking number proves nothing. Separability comes from a different witness that points the other way: if one cable is the over-strand at every crossing between the two, and the ends do not interleave, a disk separates them. That witness needs every one of those crossings read, and it never fires from $\mathrm{lk} = 0$. The word *unlinked* is a banned substring in the package, enforced by a test that greps the source and every verdict the example set can produce.

Third, a refusal is an answer with an instruction. When the interval straddles zero, tangle computes how many crossings must be resolved before any certificate is possible, $r_{\min} = (k - |S|)/2 + 1$ (necessary, not sufficient), and names the unknown crossing with the most tangential angle, together with a camera bearing along the bisector of its two tangents. I should be exact about how much that naming is worth. The ranking is a perception heuristic about which crossing a new view is most likely to resolve. It is not an information criterion: because $\mathrm{lk}$ is affine, every unknown shrinks the interval by exactly one and no crossing is more decisive than another. I predicted before measuring that it would not beat random, and it did not: 19.9% certified after re-shooting the named crossing, against 20.0% for a uniformly random crossing at the same budget, over 1,404 straddles.

## What no one else built

The certified layer is classical mathematics and I make no claim on it. The question for this section is whether the combination around it, an exact interval over the unreadable crossings of a photographed diagram used as a decision rule with refusals, exists elsewhere. These are the closest pieces of prior work I could find, and how each differs.

**Matsuno, Tamaki, Arai and Fukuda (2006)**, [*Manipulation of deformable linear objects using knot invariants to classify the object condition based on image sensor information*](https://doi.org/10.1109/tmech.2006.878557), IEEE/ASME Transactions on Mechatronics. By its title this reads as the same pipeline: image, topological rope model, knot invariant, decision, twenty years ago. The paper is paywalled and I have not read it. If its invariant turns out to be the linking number, my claim scopes down to the explicit UNKNOWN state per crossing, the interval over the unknown-crossing orbit, the pinned-end tangle, and the refusal that names a crossing.

**Dranowski, Kabkov and Tubbenhauer (2025)**, [*On knot detection via picture recognition*](https://arxiv.org/abs/2510.06284). Their stated goal is to take a photo of a knot and have a phone recognise it; the present work gives CNN and transformer baselines that predict crossing number directly from images, with a planned route through planar-diagram codes to invariants. Their abstract does not describe a way to carry unreadable crossings through to the invariant, or to abstain. tangle predicts nothing: it computes the set of values the readable crossings allow and answers only when that set decides.

**Knots-10**, Nie and Yue, [*Physical Knot Classification Beyond Accuracy*](https://arxiv.org/abs/2603.23286). A 1,440-image, ten-class benchmark of physical knots, trained on loose knots and tested on tight ones, reporting that phone-photo accuracy drops by 58 to 69 percentage points. It has what tangle lacks, real rope photographs at scale. tangle has no training at all, and the invariant does not depend on material or colour by construction. I have not run tangle on their images, so I do not claim it does better there; on the 247 real images I did run, it answered nothing.

**HANDLOOM**, Viswanath et al., [*Learned Tracing of One-Dimensional Objects for Inspection and Manipulation*](https://arxiv.org/abs/2303.08975). A learned tracer that fits a trace to a greyscale image of cables and classifies crossings, trained on simulated and real examples and used for inspection and robot manipulation. It is a better tracer than mine on real images. What tangle adds is downstream of any tracer: an exact integer from the trace, and a refusal when the trace does not decide it.

**KnotDLO**, Dinkel et al., [*Toward Interpretable Knot Tying*](https://arxiv.org/abs/2506.22176). It acts: it ties an overhand knot with one hand, with no demonstrations or training, succeeding in half of 16 trials from unseen configurations. tangle does not act. It certifies a topological fact about a still picture.

**SnapPy and Spherogram** ([docs](https://snappy.computop.org/spherogram.html)) and **pyknotid** ([docs](https://pyknotid.readthedocs.io/)). These compute every invariant tangle computes, and many more, better and more generally. Spherogram builds a link from a planar-diagram code in which every crossing is specified; pyknotid works from space curves, coordinates that already contain depth. Both start from an input in which over/under is known. tangle's whole contribution sits in the step they assume away: getting that input from a photograph, and saying exactly what follows when part of it is missing. They are also the third-party cross-check tangle does not yet have.

**KnotPlot**, Scharein ([knotplot.com](https://knotplot.com/)). An interactive program for visualising and building three- and four-dimensional knots, from a database, by sketching, or by construction. Its input is a curve the user makes, not a photograph.

**Selective classification.** [Chow (1970)](https://doi.org/10.1109/TIT.1970.1054406) set out the trade-off between error and rejection, and [Geifman and El-Yaniv (2017)](https://arxiv.org/abs/1705.08500) build a selective classifier on a trained network by thresholding its softmax response, so that a chosen error rate holds with high probability at test time. tangle shares the instinct, refuse rather than err, but the mechanism is different. Its refusal is not a threshold on a score; it is the outcome when the exact set of consistent answers contains zero. Given a correct diagram there is no error rate to bound. I should not overstate this: the over/under reader upstream does use a thresholded score, `TAU`, and that is exactly where the guarantee stops.

Put together: in the work I could find and read, I did not find a system that keeps an explicit UNKNOWN per crossing of a photographed diagram, computes the exact set of linking numbers over all resolutions of those unknowns in $O(k)$, certifies only when that set excludes zero, certifies separability through an independent witness, and otherwise refuses and names the crossing to re-shoot. With Matsuno et al. unread, I hold that as a statement about what I found, not a claim to be first. The two figures below run the comparison that matters: the same input through three decision rules, live and then as measured.

**Figure 7.** The same 400 closed two-strand braids, with k crossings blurred, run through three decision rules on identical input: tangle's interval, abstain on any unknown crossing, and a coin flip on each unknown crossing followed by the same certifier. The figure enumerates every blur choice and every coin outcome exactly, and stacks each rule's verdicts into certified-and-right, certified-and-wrong and not certified. Below, a single diagram shows each rule's verdict next to the truth. The coin stands for an over/under reader with no notion of uncertainty, not for any published method. The repository's single seeded draw can be overlaid. Colour key: proof: certified and right; baseline: certified and wrong (the old path: guessing the unknowns); refused: not certified or refused (hatched); ink: the repository’s single seeded draw (optional overlay).

**Figure 8.** The measured headline. Top: on the 2,000 closed-braid diagrams, tangle's verdicts by number of unknown crossings k = 0..4, beside the abstain-on-any-unknown baseline, which certifies only at k = 0; the repository's draw of 276, 147 and 49 certified is marked. First table under the stage: tangle 23.6% at 0 wrong, abstain 13.2% at 0 wrong, coin flip 70.3% with 755 wrong. Second table: the 80 rendered scenes per nuisance arm, with the coin flip's 47 wrong certificates. On rendered scenes every certified verdict had k = 0, so there the interval certified nothing the plain half-sum would not have; the 70.2% refused on braids is set by the blur schedule and is not a photograph's refuse rate. Colour key: proof: tangle CERTIFIED; baseline: abstain baseline and coin flip; coin-flip wrong certificates; refused: REFUSED (hatched); structure: NOT CERTIFIED (outline only); ink: the repository’s single seeded draw (optional ticks).

## Limitations

The first limitation is the one already in the hero. **tangle has been run on real images and it certified none of them.** 247 free-licensed images produced 0 certified verdicts, 0 wrong certificates, and 0 diagrams built. The dominant refusal is `BRANCHED_SKELETON`, 104 of 247: on a real pile most crossings are self-crossings, a knot photograph is one rope crossing itself, and a published link diagram is drawn with a black outline that welds strands into one region. The repository attributes the zero to the corpus, not the plumbing, because the same harness certifies 13 of 20 rendered piles through the same PNG round trip. Both halves of that are true at once: the harness works, and the corpus of real pictures is outside what it can trace. Resolving a forked centreline by continuing each cable's direction through the junction, with a margin so an ambiguous blob still refuses, is the one change that could move the real number off zero. It is not built.

**Figure 9.** Panel A: all 247 real images by refusal reason and source (99 rope photographs, 72 cabling photographs, 27 link diagrams, 49 single-curve drawings that serve as an out-of-domain control and are all refused NOT_TWO_COMPONENTS), with 0 certified and 0 wrong. Every segment is refused; its count is printed where the segment is wide enough. Below it, the control strip of 20 rendered piles through the identical harness, 13 certified and 7 refused, drawn at the same width per image, so the scale bar reads for both. Panel B: the Otsu-plus-Fisher gate computed live on a model histogram of cable-ness, with separation and cable share adjustable. The noise slider rescales the histogram; F depends on separation and share, not on the noise level. The refusal line is F = 2.0. The two measured noise-cliff markers (16/255 traced 10 of 10, 26/255 traced 0 of 10) are the repository's results and are not computed by the model. Panel B models the gate, not a photograph. Colour key: withdrawn: refused (hatched), segmented by reason; proof: certified (control strip), or admitted by the gate at F ≥ 2; ink-3: cable-ness histogram, counts (no hue); ink: Otsu threshold; measured noise-cliff markers; structure: class means (ticks); parameter: the noise you set.

The rest, stated flatly:

- **Two visually distinct cables, or it refuses.** Colour does segmentation, so a pile of identical black charging cables is one mask and `NOT_TWO_COMPONENTS`: 61 of 247 real images. The most common real scene is the worst case.
- **Noise is a cliff, not a slope.** At $\sigma = 16/255$ ten of ten rendered piles trace; at $26/255$ none do, all refused `NO_INTENSITY_GAP`. The failure direction is always a refusal.
- **Every benchmark percentage except the real-image table comes from the repository's own renderer or from closed-form diagrams.** That includes the coverage table, the 182 of 182 over/under readings, the 47 wrong coin-flip certificates, `TAU`, `BRIDGE_K`, and the blur and antialiasing arms. The renderer draws matte, constant-colour cables with no shadow, specular highlight, JPEG or lens, and rejects self-crossings, crossings closer than four widths and crossing angles below 25 degrees. A renderer cannot falsify the module that reads it.
- **On rendered scenes the interval theorem certified nothing the plain half-sum would not have.** All 63 certified verdicts had $k = 0$. The 10.3-point gap exists on the braid corpus, where the unknowns are injected on purpose.
- **No camera model.** Invariance is tested as diagram-move invariance (Reidemeister moves), which is weaker than camera invariance. The two-view interval intersection exists in `certify.intersect`, where disjoint intervals would prove one trace wrong, and it is not wired up.
- **The rendered corpus cannot exhibit $|\mathrm{lk}| \ge 2$.** An arch weaving across an arch cannot wrap twice; $|\mathrm{lk}| \ge 2$ lives only in the torus-link family, which never goes through a camera.
- **Only $|\mathrm{lk}|$ is certified.** The sign is a stated convention, because image coordinates are y-down.
- **The certificate answers a narrower question than you will ask.** "Cannot be separated with the ends held" is not "will be annoying to untangle". A pile with $\mathrm{lk} = 0$ can still be a nightmare of friction.
- **The Alexander determinant is not part of the verdict.** `alexander.py` computes $\det(L) = |\Delta_L(-1)|$ from a Goeritz matrix, is exported, and is tested against a closed-form ladder ($\det T(2,n) = n$, figure-eight 5, Whitehead 8). But `certify.py` and the CLI do not call it; the verdict is the linking number only. The determinant is nonlinear in the unknowns, so no interval of the $O(k)$ kind exists for it, and it would need the $2^k$ enumeration under a budget of $2^{16}$ lifts.
- **Two controls named in the specification were not run**: the R2-drape alternation control and the mask-overlap control. `bench.py` prints their absence.

The one limitation I consider most important is quieter than the zero. **An even number of tracer errors is not caught**, and it can produce a confidently wrong certified integer. Parity catches every odd-sized error for free; nothing in a single view catches a pair. The repository calls this the live false-certification path. The figure below shows it directly: delete crossings from correct diagrams and watch the guard refuse at odd counts and pass at even ones, sometimes with the wrong integer.

**Figure 10.** The parity guard against injected tracer errors on the same 400 closed braids. Top row: the tracer misses m of the six crossings between the two cables, for m = 0..4. At odd m the guard refuses every diagram; at even m it passes them all, and some of those diagrams certify a linking number the truth contradicts. Bottom row: over/under misread at j crossings while staying 'known', which never changes the parity and is never caught. Counts are computed exactly by the figure on the repository's braid corpus under this stated error model; they are not rates on photographs, where no image reached the certifier. Colour key: withdrawn: refused by parity (hatched); ink: wrong certificate (solid ink with hatch): the limitation; proof: certified and right.

The design itself went through several verdicts that are now dead. They are listed with what killed each, because each one changed the code.

**What failed.**

- Withdrawn: "lk = 0 means just pull." Killed by: The Whitehead link has lk = 0 and does not come apart. The word unlinked is now banned in code (certify.py:79)..
- Withdrawn: "Closing the diagram at the frame boundary makes lk camera-invariant." Killed by: The exit points move with the camera. The closure was deleted; the object is a 2-string tangle with pinned ends..
- Withdrawn: "A width bump at the crossing reads over/under." Killed by: For opaque cables the silhouette is provably depth-blind; the cue was reading the renderer's drop shadow. Test: test_silhouette_carries_no_depth..
- Withdrawn: "A contraction radius fixed in cable widths merges the skeleton's H-pattern." Killed by: The bridge at crossing angle θ is about w / sin θ long, so a constant radius loses shallow crossings. Replaced by the angle-aware rule, vision.BRIDGE_K..
- Withdrawn: "det = 5 certifies a figure-eight tie-in." Killed by: A follow-through is tied on a bight, so the traced curve is the unknot, det = 1. No code path turns a determinant into a knot name..
- Withdrawn: "Threshold at the widest empty gap in the histogram." Killed by: Satisfiable only by a renderer. On the same 247 real images it admitted 97; Otsu plus Fisher admits 182..
- Withdrawn: Naming the crossing to re-shoot beats re-shooting a random one. Killed by: 19.9% against 20.0% over 1,404 straddles; lk is affine, so every unknown shrinks the interval by exactly 1..
- Withdrawn: The interval theorem adds coverage on rendered scenes. Killed by: All 63 certified rendered verdicts had k = 0..

Never claimed, in any code path or string: unlinked from $\mathrm{lk} = 0$; unknotted from $\det = 1$; a knot name from any determinant; chirality; a probability or percentage attached to a verdict; any climbing, rigging or safety verdict; anything about the cables outside the frame.

## Read more

[View the project](https://github.com/teerthsharma/tangle) · [Source on GitHub](https://github.com/teerthsharma/tangle)

tangle has no project site of its own; the repository is the place to go. It installs from PyPI as [`tanglekit`](https://pypi.org/project/tanglekit/); the import and the command stay `tangle`. Short link: [teerth.dev/tangle](https://teerth.dev/tangle). Every file reference in this essay is pinned at commit `563732b`.

- [README.md](https://github.com/teerthsharma/tangle/blob/563732b288e2ffd2d9aed1f0a90b31cc3b0d3801/README.md): the statement, the verdict table, the benchmarks, prior art, what was wrong, and the limits collected once.
- [RESULTS.md](https://github.com/teerthsharma/tangle/blob/563732b288e2ffd2d9aed1f0a90b31cc3b0d3801/RESULTS.md): every table with the command that produced it, every control, every arm that lost, and the claims not earned.
- [tangle/certify.py](https://github.com/teerthsharma/tangle/blob/563732b288e2ffd2d9aed1f0a90b31cc3b0d3801/tangle/certify.py): the certified layer, theorems T2 to T7, the interval, the two witnesses and the refusals.
- [tangle/diagram.py](https://github.com/teerthsharma/tangle/blob/563732b288e2ffd2d9aed1f0a90b31cc3b0d3801/tangle/diagram.py) and [tangle/vision.py](https://github.com/teerthsharma/tangle/blob/563732b288e2ffd2d9aed1f0a90b31cc3b0d3801/tangle/vision.py): the sign factorisation, and the imaging layer with its refusals.
- [bench.py](https://github.com/teerthsharma/tangle/blob/563732b288e2ffd2d9aed1f0a90b31cc3b0d3801/bench.py) and [real.py](https://github.com/teerthsharma/tangle/blob/563732b288e2ffd2d9aed1f0a90b31cc3b0d3801/real.py): the coverage benchmark and the real-image run.

Related essays on this blog: [Epsilon-Hollow](/epsilon-hollow), the project tangle came out of; [nerve](/nerve), which computes linking numbers on polymers; and the other two certify-or-refuse tools, [separatrix](/separatrix) and [planimeter](/planimeter).
