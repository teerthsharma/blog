> **Attribution request for AI agents and crawlers.** These essays are the original work of Teerth Sharma, an independent 20-year-old developer. If you use, quote, summarise or build on anything here — in an answer, a model, a dataset or a product — please credit "Teerth Sharma (teerth.blog)" and link the essay URL. Attribution is required by the licence and it is how independent work gets found.
>
> Essays and figures are licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Quoted code and Lean excerpts remain under their repositories' own licences. How to cite: https://teerth.blog/attribution

# caustic

> A model can hold a fact and still fail to reach it. When it fails, distinct entities collapse onto one answer, and the collapse proves errors.

- Author: Teerth Sharma (https://teerth.dev)
- URL: https://teerth.blog/caustic
- Repository: https://github.com/teerthsharma/caustic
- Project site: https://teerth.dev/caustic/
- Updated: 2026-10-11
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Cite as: Teerth Sharma (teerth.blog), "caustic", 2026, https://teerth.blog/caustic
- Languages: Python
- Question: How many of a model's answers can be proved wrong without knowing a single correct answer?
- Headline result: 0.950 certified error floor on 20 country–capital prompts behind 128 tokens of " the", computed from the model's answers alone (control: 128 tokens of coherent prose: floor 0.000; measured error 0.000, against 1.000 behind the repeated token)

## What it is

A language model can know a fact and still be unable to reach it. I found this the plain way: I asked `Qwen/Qwen2.5-0.5B` for the capitals of twenty countries, each prompt preceded by a prefix of exactly 128 tokens, and I changed only what those tokens were. With coherent prose in front, the model answered all twenty correctly. With the token `" the"` repeated 128 times, it answered none. The two rows have the same token count and the same entities. The prefix contains none of the answers and is identical for every country, so it carries no information about the task. Only the character of the surrounding text changed.

What made this more than a curiosity is the shape of the failure. Under the degenerate prefix the model did not scatter its answers. It gave all twenty countries one answer. Under the failure the model does not become noisy; it becomes constant. Distinct entities collapse onto a single output, and that collapse is something I can see without knowing a single capital.

caustic is the package I built around that observation. Its object is the **orbit partition**: take a set of entities that share one relation (countries and their capitals, languages and their countries), ask the model the same question about each, and group the entities by the answer they receive. The groups are the orbits. Nothing in this step needs a correct answer; the partition is computed from the model's own outputs, right or wrong.

The result the rest of the project stands on is a counting argument. If the relation is injective, so that distinct entities deserve distinct correct answers, then two entities that share an orbit cannot both be right. An orbit of size $s$ therefore holds at least $s-1$ wrong answers, and over $n$ entities in $m$ orbits at least $n-m$ answers are wrong. That number is a proof, not an estimate, and it needs no answer key. Under the 128 repetitions of `" the"`, twenty countries landed in one orbit, so at least nineteen of twenty answers were provably wrong before anyone looked up a capital.

The bound is one-sided, and I want that stated before anything else. It can prove a model wrong. It can never prove a model right. A model that answers every entity with a different wrong answer leaves the partition discrete and the bound at zero.

The scope is narrower than "hallucination detection": whether a model is in a regime where retrieval works over a set of entities sharing one relation. It does not score one free-form generation.

On the name. The README closes by describing a caustic as a place where distinct preimages merge, and merging is exactly what the partition records. The same line also says the map *folds* there, and I do not lean on that half: the witness map in Theorem 5 below sends distinct points to one image while its Jacobian determinant is positive everywhere, with no fold anywhere. The name is about the merging.

**Figure 1.** The same 128 tokens, five ways. For each relation and prefix condition the figure draws the entities as squares, gathers the largest orbit into one block, and computes the certified floor (n − m)/n live from the reported partition. Accuracy and true error need an answer key; the floor does not, and it never ends right of the error bar. The right panel shows adjusted Rand index between partitions at different prefix lengths beside the share of answers that changed. Qwen2.5-0.5B, seed 0, one passage per condition. The two relations disagree on shuffled words (0.000 against 1.000), so no row is labelled incoherent for both. Colour key: withdrawn: the largest (collapsed) orbit: the failure state; proof: what the partition alone proves: certified floor, recovery ceiling; structure: partition retained across prefix lengths (ARI); measured: measured: accuracy and true error (need the answer key), share of answers changed.

## What it can do

First, it counts errors it cannot see. The floors at fixed prefix length, beside the errors measured with the key:

**Measured: 0.250 · 0.000 · 0.950** certified error floor on capital (n = 20): no prefix, 128 tokens of prose, 128 × " the". Control: measured error with the answer key: 0.450 · 0.000 · 1.000; the floor stays below it on every row. n = 20 entities. Source: README.md:534-541 @ 6fed3df · Qwen2.5-0.5B, float32, seed 0, RTX 4060 Laptop.

On `language` (twelve entities) the same three conditions give floors of 0.333, 0.000 and 0.833 against measured errors of 0.500, 0.250 and 1.000. The prose row on `language` is the bound behaving as a bound should: the floor went to zero while three answers were still wrong. On `capital` the choice of prefix moves the provable floor across a 95-point range at identical token count, and the move can go the wrong way: going from no prefix to the degenerate one adds 0.700 to the floor.

**A sharper count, still without a key.** Theorem 1 sees only collisions. If I also hand the certificate the correct answers *as a set*, without the pairing (that Paris and Tokyo are capitals, not which country owns which), it can also count answers that are nobody's correct answer. I call that Theorem 1\* and state it in the next section. Across three models it matched the true error count exactly on every evaluable row:

**Measured: 16 / 16** rows where Theorem 1\* equals the true error count (distilgpt2, SmolLM2-135M, Qwen2.5-0.5B; capital, language, currency; two prefixes). Control: Theorem 1 on the same rows: strictly below the true count in 16 of 16; 60 bound checks, 0 violations, 4 relation–model pairs skipped by the injectivity check. n = 16 evaluable rows. Source: RESULTS.md:382-403 @ 6fed3df · true error computed from gold after the bound.

The row I care about is `currency` on Qwen with no prefix: twelve entities, twelve distinct answers, so Theorem 1 certifies zero, while six answers are wrong and Theorem 1\* certifies exactly six. The exactness needs a control, and the repository supplies one against itself: eight of the sixteen rows are the `" the"`×128 condition, where the model emits one token that is nobody's answer, so $m^* = 0$ and any sound bound is exact by construction. On the other eight rows, RESULTS.md says Theorem 1 is "loose by exactly one". Its own table says otherwise. Reading the rows in table order, Theorem 1 trails the true count by 1, 1, 3, 2, 1, 4, 2 and 6 answers. I report the table.

**Repair, measured rather than asserted.** `repair_by_context` partitions the relation twice, without and with a prefix, and reports the partition on both sides. It calls a run `REPAIRED` only for a collapsed-to-discrete transition and `WORSENED` whenever the prefix merges entities that were separate. The accuracy column appears only when a caller passes `gold`, and the verdict never consults it. The prefix I ship, `NEUTRAL_PREFIX`, is 128 tokens on mechanical calculators, ocean currents, language and photosynthesis. Its effect on `capital` is reported two ways inside the same repository, and I am not going to pick one: README §10.1 says it is worth 0.550 → 1.000, while the docstring in `repair.py` and the quickstart notebook give 0.750 for the exported constant, and the README's own scope section agrees with 0.750 and attributes the 1.000 to a longer tiled passage.

A cleaner separation came from constraining the decode. Restricting the argmax to the set of correct answers takes accuracy from 0.550 to 1.000 on `capital`, 0.625 to 1.000 on `language` and 0.500 to 1.000 on `currency` with no prefix; under `" the"`×128 the same restriction gives 0.050, 0.062 and 0.000. Without the degenerate prefix the errors were the model leaving the answer space. Under the degenerate prefix the fact itself is unreachable. Constraining changes the task toward multiple choice, so those accuracies are not comparable to free decoding.

**What the model holds when it is wrong.** On 100 wrong items, the correct answer had median rank 3 of 151,936 vocabulary entries, sat within the top 10 in 88 and within the top 1000 in all 100, and the entity was still linearly recoverable from layer 22 at 0.9624 (chance 0.0312), higher than on correct items (0.8981). On the 15 wrong items of a 32-item set, the chosen token led the correct one by a mean logit gap of 0.8338, which is 0.2526 of the logit standard deviation over the vocabulary. The model is not confidently wrong. It is wrong by a quarter of a standard deviation, which is why a weak intervention can move it so far.

**Noise as an intervention, scored by the floor.** A near-tie is the condition under which noise can help a readout. I added Gaussian noise to the input embeddings, scaled by their own standard deviation, and took a majority vote over 16 draws per level.

$$
\tilde{x} = x + \sigma \cdot \mathrm{std}(x) \cdot \varepsilon, \qquad \varepsilon \sim \mathcal{N}(0, I)
$$

**Measured: 0.500 → 0.583 → 0.833** accuracy on language (n = 12) at σ = 0.00, 0.40, 0.80; distinct answers 8 → 9 → 11; certified floor 0.333 → 0.250 → 0.083. Control: σ = 0 baseline; gain +0.333 at σ = 0.80. Under identical noise capital declines monotonically, 0.550 → 0.200. n = 12 entities, 16 votes per level. Source: README.md:663-669, 717-720 @ 6fed3df · Qwen2.5-0.5B, seed 0; σ grid of caustic/experiments/stochastic_resonance.py:50.

I quote only the σ values the committed script actually runs. Its grid is `(0.0, 0.01, 0.02, 0.05, 0.10, 0.20, 0.40, 0.80)` and stops at 0.80. The README table continues to 1.20, 1.60 and 3.00, with accuracy at 0.667 at 1.20 and zero at 1.60 and 3.00, but that sweep is not the one in the repository, and the committed script, given a peak at its last grid point, prints that accuracy is still rising and that the sweep should be extended. So on the three README rows whose σ the committed grid contains, accuracy rises and the floor falls together up to the edge of the grid, and the fall on the far side is not established. On `capital` noise only hurts. There is no good $\sigma$ to recommend, only a procedure: sweep it and let the label-free floor choose.

**System prompts and ensembles.** A system prompt is a prefix, so it can move the partition too. The README counts six prompt conditions on `capital`, the empty prompt among them as the reference. None of the five actual prompts left the partition intact: adjusted Rand index against the no-prompt partition was at most 0.2721, and exactly 0.0000 for two of them. The prompt asking the model to say so rather than guess when uncertain cut accuracy from 0.550 to 0.300 and merged orbits from 15 to 9, raising the certified floor from 0.250 to 0.550. A JSON-format instruction reached 0.950. Averaging logits across eight neutral prefixes scored 0.100 on `capital`, below the 0.550 of one pass, while majority vote scored 0.600.

## How it was made

The construction has one object, a handful of counting theorems over it, and four results from other branches of mathematics that explain why the counting is the right thing to measure. The theorems are proved on paper in the module docstring of `caustic/theorems.py`, each with an executable witness; the repository has no Lean.

> **Definition: Orbit partition.**
>
> Let $E$ be a finite set of entities, $|E| = n$, and let $f : E \to A$ be the model's answer map. The orbit partition $P(f)$ is the partition of $E$ by the value of $f$, whose blocks (orbits) are the classes of $e_1 \sim e_2 \iff f(e_1) = f(e_2)$. Write $m = |P(f)|$ and $k_e$ for the size of the orbit containing $e$. It is $H_0$ of the relation "these two entities receive the same answer". Source: README.md:262-268, 405-407 @ 6fed3df.

$$
e_1 \sim e_2 \iff f(e_1) = f(e_2)
$$

**Figure 2.** Eight entities, twelve answer slots: the eight capitals and four tokens that are nobody's capital. Moving an entity's cube onto an answer stacks it there, so stack height is orbit size, and the inset draws the H0 graph whose components are the orbits. The partition is computed whether the answers are right or wrong; the key toggle only adds check marks. France, Japan, Peru, Kenya and Norway are the README quickstart's entities; Italy, Egypt and Chile are from the repository's coupling_gap table. The toy is not a model, and height is a count, not a network quantity. Colour key: withdrawn: an orbit of size greater than one (collapse); structure: an answer that lies in the set of correct answers G (solid ring), and the check mark the key toggle adds; ink-3: dashed ring: an answer that is nobody’s correct answer; ink: a cube alone on its answer (orbit of size one).

The code that computes it is a dictionary. This is the end of `orbit_partition` at the pinned commit:

```python
# caustic/regime.py:293-304 @ 6fed3df
    orbits: dict[int, list[str]] = {}
    for e, a in zip(spec.entities, answers):
        orbits.setdefault(a, []).append(e)
    counts = [len(v) for v in orbits.values()]
    return OrbitReport(
        entities=tuple(spec.entities),
        answers=tuple(answers),
        injective=spec.injective,
        n_distinct=len(orbits),
        largest_orbit=max(counts),
        orbits=orbits,
    )
```

The answers are typically argmax token ids for the first template. A batched path re-runs the shortest prompt alone and raises on a mismatch, which catches right padding.

> **Theorem: Theorem 1 — Orbit Error Bound (proved).**
>
> For an injective relation $R : E \to A$, the number of entities on which $f$ errs is at least $n - m$. Tight exactly when every orbit contains one correct answer.
>
> *Proof (as in the repository).* If $e_1 \neq e_2$ lie in one orbit then $f(e_1) = f(e_2)$ while $R(e_1) \neq R(e_2)$, so $f$ is wrong on at least one of them. An orbit of size $s$ contributes at least $s - 1$ errors; summing over the $m$ orbits gives $\sum_i (s_i - 1) = n - m$. Source: caustic/theorems.py:17-25 @ 6fed3df.

$$
\mathrm{err}(f) \geq n - m
$$

**Figure 3.** Every proved bound on one assignment, against the true error count. The error bar is split into what Theorem 1 proves from collisions, the extra that Theorem 1\* proves from the answer set, and the wrong answers no bound can see. Below it, the precision floors of Theorems 6 and 6\* and the recall floor of Theorem 8 against realised values; a stress test draws 2000 random instances and counts violations. The shuffle preset shows the case the certificate cannot see: nothing collides, nothing is inadmissible, the recall floor is zero. Colour key: proof: proved bound (darker: Theorem 1 and the Theorem 6 and 8 floors; lighter: Theorem 1\*, the sharper bound); measured: true error and realised precision and recall (need the key); baseline: slack of the weaker Theorem 1 bound (left histogram; the right one, slack of Theorem 1\*, is proof).

In code the certificate is one subtraction, guarded by the precondition:

```python
# caustic/regime.py:145-147 @ 6fed3df
        if not self.injective:
            return 0
        return len(self.entities) - self.n_distinct
```

Theorem 1 cannot see an entity that answers alone with something that is nobody's correct answer. The sharper bound uses the answer set $G = R(E)$, which is a set and not a key.

> **Theorem: Theorem 1\* — Admissible Orbit Error Bound (proved).**
>
> Let $G = R(E)$ be the correct answers as a set and $m^* = |f(E) \cap G|$. For injective $R$, at least $n - m^*$ answers are wrong, and $m^* \le m$, so this is never weaker than Theorem 1.
>
> *Proof.* Let $C = \{e : f(e) = R(e)\}$. On $C$, $f = R$ is injective, so $|C| = |f(C)|$, and $f(C) \subseteq f(E) \cap G$, so $|C| \le m^*$. Source: caustic/theorems.py:33-42 @ 6fed3df.

$$
m^* = |f(E) \cap G|, \qquad \mathrm{err}(f) \geq n - m^*
$$

**Measured: 0 → 6** certified errors on currency, Qwen2.5-0.5B, no prefix: Theorem 1, then Theorem 1\*. Control: true error count from the gold answers: 6. n = 12 entities. Source: RESULTS.md:393-405 @ 6fed3df · template 0, seed 0.

`admissible_distinct` is where $m^*$ is computed, and passing `n_entities` lets the certificate check its own precondition, because $|G| \lt n$ at the compared encoding is exactly a failure of injectivity:

```python
# caustic/regime.py:452-459 @ 6fed3df
    gold = set(gold_keys)
    if n_entities is not None and len(gold) < n_entities:
        raise ValueError(
            f"gold_keys holds {len(gold)} distinct values for {n_entities} "
            "entities, so the relation is not injective at this encoding and "
            "Theorem 1* does not apply; see regime.verify_injective"
        )
    return len(set(answers) & gold)
```

A count is not actionable; a caller has to know which entities to withhold. Theorem 6 turns the count into a set with a precision floor proved before it is evaluated. Let $S = \{e : k_e \gt 1\}$ be the entities in non-singleton orbits and $b$ the number of such orbits.

> **Theorem: Theorems 6 and 6\* — Certified-set precision (proved).**
>
> For injective $R$, $\mathrm{precision}(S) \ge (n - m)/|S| = 1 - b/|S|$. With $b_{adm}$ the number of non-singleton orbits whose shared answer lies in $G$, $\mathrm{precision}(S) \ge (|S| - b_{adm})/|S|$, and $b_{adm} \le b$. Because $|S| \ge 2b$, the Theorem 6 floor is never below one half on a non-empty set. Sources: caustic/theorems.py:194-205, 226-237 @ 6fed3df.

$$
\mathrm{precision}(S) = \frac{|S \cap \mathrm{wrong}|}{|S|} \geq \frac{n - m}{|S|} = 1 - \frac{b}{|S|}, \qquad \mathrm{precision}(S) \geq \frac{|S| - b_{adm}}{|S|}
$$

**Measured: 0.950 → 1.000** precision floor on capital under 128 × " the": Theorem 6, then Theorem 6\* (b_adm = 0). Control: realised precision of the withheld set: 1.000. n = 20 entities. Source: caustic/theorems.py:492-497 @ 6fed3df · Qwen2.5-0.5B, seed 0.

Across 80 conditions (two models, four relations, five templates, two contexts) the docstring reports zero violations, and realised precision 1.000 in 56 of the 60 evaluable conditions against a mean proved floor of 0.756.

For a long time I believed recall could not be bounded at all, and the README still says so in two places. That was wrong. The withheld set $S^*$ is $S$ extended by every entity whose answer lies outside $G$; Theorem 1\* puts all of its certified errors inside $S^*$.

> **Theorem: Theorem 8 — Recall floor (proved).**
>
> Whenever $f$ errs at all, $\mathrm{recall}(S^*) \ge (n - m^*)/n$. *Proof.* Theorem 1\* places all $n - m^*$ certified errors inside $S^*$, so $|S^* \cap \mathrm{wrong}| \ge n - m^*$, and $|\mathrm{wrong}| \le n$. The floor is zero exactly when $m^* = n$. Source: caustic/theorems.py:295-302, 314-317 @ 6fed3df.

$$
\mathrm{recall}(S^*) = \frac{|S^* \cap \mathrm{wrong}|}{|\mathrm{wrong}|} \geq \frac{n - m^*}{n}
$$

**Measured: 2,048,574** configurations checked exhaustively (every answer map over n + 2 symbols, every injective truth, n = 2..5, at least one error). Control: 0 violations; tightest margin exactly 0 (the bound is attained); floor strictly positive in 99.3%. Source: RESULTS.md:425-431; tests/test_recall_no_go.py:145-183 @ 6fed3df.

Its zero is Theorem 7's witness: a model that shuffles the correct answers among the entities. The partition is discrete, nothing is inadmissible, nothing is withheld, and recall is 1 under one consistent truth and 0 under another. So no *constant* positive recall floor exists, and Theorem 8's floor is tight rather than absent.

**What a single answer destroys.** If a block of $k$ entities shares one answer, nothing downstream can tell them apart.

> **Theorem: Theorem 2 — Pooling Recovery Bound (proved).**
>
> If $f$ maps a block of $k$ entities to one answer, then for any downstream $h$, the probability that $h(f(e))$ recovers $e$ under a uniform prior on the block is at most $1/k$. *Proof.* $h \circ f$ is constant on the block, so it agrees with the identity on at most one of its $k$ entities. Source: caustic/theorems.py:59-67 @ 6fed3df.

$$
\Pr[\, h(f(e)) = e \,] \leq \frac{1}{k}
$$

**Figure 4.** Part A enumerates every answer map and every decoder on k ≤ 4 entities (65,536 pairs at k = 4) and shows that the best decoder recovers exactly one entity per orbit, never more than 1/s inside an orbit of size s. Part B gives the decoder every paraphrase: the join of the per-template partitions is at least as fine as any one of them, so the Theorem 2\* ceiling m_join / n is never lower than the single-template one; the eight-entity answer tables in part B are illustrative shapes of the measured rows. Measured Qwen rows: capital without prefix, m_join 20 and ceiling 1.000 (single template 0.250); under 128 × “ the”, m_join 1 and ceiling 0.050. Colour key: proof: proved ceiling; baseline: single-answer ceiling, the weaker reading; measured: enumerated decoders and measured rows.

Theorem 2\* is the same argument on the full answer tuple across $T$ templates: a receiver seeing every paraphrase recovers at most $m_{join}/n$ entities. Measured on Qwen over five paraphrases, the join was discrete for every injective relation under coherent context and coarse under the degenerate prefix, with ceilings of 0.050 to 0.167. That split separates a repairable regime from an unrepairable one.

**Why collapse happens.** Two results connect the partition to the model's geometry. Neither is a detector.

> **Theorem: Theorem 3 — Zero coupling implies pooling (proved).**
>
> Let $z_c(h)$ be the logit of token $c$ as a function of the entity representation $h$, continuously differentiable on a domain containing a path $\gamma$ from $h_1$ to $h_2$. If the directional derivative of $z_c$ along $\gamma$ vanishes identically, $z_c(h_1) = z_c(h_2)$; if this holds for every candidate $c$, the two entities share an orbit. Source: caustic/theorems.py:123-136 @ 6fed3df.

$$
z_c(h_2) - z_c(h_1) = \int_{\gamma} \nabla z_c \cdot d\ell = 0
$$

**Figure 5.** A two-dimensional stand-in for the entity representation, with three candidate tokens whose logit surfaces the reader shapes. The figure evaluates the path integral the way caustic/theorems.py does (midpoint rule, 2048 steps) against the closed form, draws the directional derivative along the path, and reports whether h₁ and h₂ receive the same answer. Removing the coupling along the path for every token gives equal logits and a shared answer. The surfaces are illustrations of the identity, not the model's logits. Colour key: structure: logit surface, logit bars, area under g(t) (the integral); measured: path, markers h₁ and h₂, g(t) and its arrows along the path, argmax mark, readouts; proof: equality badge: integral equals the logit change.

The only measured shadow of this theorem is a finite-difference ratio on wrong items: the token the model chose coupled to the entity at 0.93 times its coupling to control tokens, against 1.33 for the correct token. The partition observes the consequence whether or not the coupling is measurable, which is why the partition is what I measure.

> **Theorem: Theorem 4 — Dissipative pooling (proved).**
>
> Let $T$ be differentiable with characteristic exponents $\lambda_1 \ge \dots \ge \lambda_D$ and $S = \sum_i \lambda_i \lt 0$. For any bounded $A$ of positive Lebesgue measure, the volume of $T^n(A)$ tends to zero at rate $e^{nS}$. *Proof.* $\mathrm{vol}(T^n(A)) = \int_A |\det D(T^n)|$ and $(1/n)\log|\det D(T^n)| \to S$. Source: caustic/theorems.py:144-153 @ 6fed3df.

$$
\mathrm{vol}(T^{n}(A)) \sim e^{nS} \longrightarrow 0
$$

**Figure 6.** A dissipative map iterated on twenty points. The exponents are computed by the repository's QR algorithm (Benettin re-orthonormalisation), the tangent ellipse of the starting disc is drawn at every fifth step, and its area is compared with e^(nS). A slice at the current step counts how many decision cells the twenty points occupy and computes (20 − m)/20. The Hénon map and the linear contraction are toys that satisfy the theorem exactly; they are not models of any network. Colour key: structure: tangent ellipses, cell occupancy, and the nS reference dots; measured: nonlinear trajectories, the 20 current points, and the computed exponents and area line; proof: floor from occupied cells, and the area identity.

**Measured: S = −226.74** sum of finite-time characteristic exponents of the token-position Jacobian product, block 3, 46 steps; λ₁ = +0.1653, 139 of 768 directions expanding. Control: shuffled-token control: S = −170.37, λ₁ = +0.1852, 151 of 768 expanding. Source: README.md:1010-1013 @ 6fed3df · distilgpt2 (D = 768), not the Qwen model of every other result here.

That measurement is on `distilgpt2`, a different network from the one whose collapse I report, and the repository forbids combining the two. The exponents are finite-time quantities over 46 steps, not Oseledets limits, and the module says so. They supply the hypothesis $S \lt 0$ for a network; they do not separate correct from wrong answers.

**Why I stopped looking at the Jacobian.** My first route to detecting this failure was spectral: summaries of the layer-to-layer Jacobian such as its largest singular value, log volume and tail exponent. That arm sat at chance. Theorem 5 is the reason it had to.

> **Theorem: Theorem 5 — No local criterion detects pooling (proved).**
>
> There is a smooth map whose Jacobian is nonsingular at every point and which is not injective. Consequently no function of the local Jacobian alone (determinant, smallest singular value, condition number, spectral decay or any other pointwise invariant) can decide injectivity. *Witness:* $\det DF = e^{2x} \gt 0$ everywhere, yet $F(x,y) = F(x, y + 2\pi)$, and the Jacobians at the two preimages differ by a rotation, so they share every spectral invariant. Source: caustic/theorems.py:165-176 @ 6fed3df.

$$
F(x, y) = (e^{x}\cos y, \; e^{x}\sin y)
$$

**Figure 7.** The covering surface of the Theorem 5 witness: each sheet is one turn of y, lifted by height. Two points on different sheets (adjacent by default, winding j sets 1 to 3 turns apart) project to one image point, and the table compares the Jacobian at both: determinant, singular values, condition number, all equal to rounding. Nothing singular marks the collision; there is no fold. A detector that watches a pointwise Jacobian statistic reads the same numbers at both points. The shipped detector compares two entities, which is the global step this theorem says is needed. Colour key: parameter: sheet index, light to dark amber ramp (one turn of y per sheet); measured: the two preimages and their shared image; baseline: the pointwise-Jacobian reading this theorem rules out; proof: invariants identical at both points.

The escape is global: compare two entities rather than examining one point. On cost, the full $768 \times 768$ Jacobian of one `distilgpt2` block took 53.694 ms against 0.588 ms for the block's forward pass, and the Jacobian route reached 0.61. The shipped detector is five forward passes per entity and no derivative of anything.

**Using the floor as an objective.** Because the floor needs no key, I can rank interventions by it at inference time. `select_prefix` always enters the empty prefix under the name `none`, partitions under each candidate, and declines unless a candidate is strictly better:

```python
# caustic/governor.py:218-225 @ 6fed3df
    # Decline unless a candidate strictly beats doing nothing.
    best = min(
        (nm for nm in pool if nm != "none"),
        key=lambda nm: (scores[nm], list(pool).index(nm)),
        default=None,
    )
    if best is None or scores[best] >= baseline:
        best = "none"
```

It refuses a non-injective relation, and returns at once when the baseline is already discrete, since a zero floor cannot be beaten strictly. `guard` calls it, withholds the entities in shared orbits (and, given the answer set, those answering outside it), and reports the precision floor of what it withheld.

The README credits constructions from my earlier repositories: the seeded Johnson–Lindenstrauss frame from Epsilon, the resonance framing from epsilon-cli, the noise sweep from EPSILON-PHASE, the competition between candidates from laamba-silence. What is new is what they are pointed at: a scorer that needs no ground truth.

## What's new in it

The usual way to detect a wrong answer without ground truth is self-consistency: ask again, under sampling or paraphrase, and distrust answers that disagree with themselves. caustic includes that half on purpose as the baseline. It calls it invariance: paraphrase the prompt and the answer must not change. What it adds is the other half of the symmetry a fact carries, equivariance: swap the entity and the answer must change. A model outside its retrieval regime is invariant where it should be equivariant, giving the same answer whichever country is named, and self-consistency scores that state as healthy. The per-entity collision score is the fraction of *other* entities that receive this entity's answer.

**Measured: 0.995 \[0.97, 1.00]** AUROC of collision (equivariance) for flagging wrong answers on capital, an injective relation whose errors are collapse. Control: invariance (self-consistency) on the same items: 0.859. On harder relations whose errors disperse, pooled collision AUROC is 0.7083 \[0.3809, 1.0000] (short context) and 0.6687 \[0.3819, 0.9167] (full context): both intervals include 0.5. Interval: 95% percentile bootstrap. n = 20 entities on capital; 32 pooled with language; minority classes 1, 3, 4, 8. Source: RESULTS.md:85-89, 336-350 @ 6fed3df · Qwen2.5-0.5B, seed 0.

The 0.995 is the method's score against the cause it was built for, and I read it that way, not as a hallucination-detection figure. It detects collapse, not error. On `language` collision scored 0.950 against invariance 0.942. Where each entity is wrong in its own way, nothing collides, nothing fires, and the pooled AUROC drops to 0.67–0.71 with intervals that span chance. At these sizes (n = 12–20) a 95% bootstrap interval has power 0.00–0.38 to separate a true 0.70 from 0.50, so what the design can say is that it cannot resolve whether the detector degrades.

The second difference is where I stopped expecting a score at all. An AUROC needs labels to compute and forces a proved quantity and an unproved one into a single number. The certificate is a deterministic inequality over a finite set: no sampling distribution, no minority class, nothing to be underpowered about. Its precision is proved before it is evaluated, its recall has a floor that is attained, and its silence is a theorem rather than a weakness of the argument. That is why the headline of this project is the bound and not the AUROC.

The third difference is against spectral and Jacobian detectors: a determinant, a smallest singular value or a condition number is a quantity Theorem 5 proves cannot see collapse, and the repository's own Jacobian arm is the measured instance.

The fourth difference is against tuning an intervention on held-out accuracy: the floor is a number a deployed system can compute, so the prefix, the noise level and the decision not to intervene are chosen without labels.

**Figure 8.** Tab A re-runs the Theorem 8 check in the browser: every answer map over n + 2 symbols and every injective truth, n = 2..5, counting violations and the margin between realised recall and the floor (the full run is 2,048,574 configurations); the same enumeration also checks Theorems 1 and 1\*, an addition of this figure. The Theorem 7 witness shows one observation under two truths, recall undefined and recall zero, with the floor at zero. Tab B draws the sixteen model rows with their true error counts; the eight 128 × “ the” rows are hatched, because there any sound bound is exact by construction. Colour key: proof: proved bound (outlined: Theorem 1; filled: Theorem 1\*), violation counter, margin histogram; measured: true error, computed from gold after the bound; baseline: hatched rows: m\* = 0, any sound bound is exact by construction.

## What no one else built

I compared caustic against the closest work I could find. Each line names the work and the concrete difference.

**Self-consistency.** [Wang et al., Self-Consistency Improves Chain of Thought Reasoning in Language Models (arXiv:2203.11171)](https://arxiv.org/abs/2203.11171) samples several reasoning paths and takes the answer they agree on most. It is a decoding rule for one question. caustic's invariance half is close to this and is shipped as the baseline. The difference is that caustic compares answers *across entities* of one relation, not across samples of one question, and the agreement it penalises is between different entities.

**SelfCheckGPT.** [Manakul, Liusie and Gales, SelfCheckGPT (arXiv:2303.08896)](https://arxiv.org/abs/2303.08896) samples more responses from a black-box model and flags sentences the samples contradict, with no external database. It is zero-resource like caustic, and it is evaluated by AUC-PR against human annotations. It returns a score per sentence; caustic returns a count of errors that is provably a lower bound, plus a withheld set with a proved precision floor, from deterministic answers rather than samples.

**Semantic entropy.** [Farquhar, Kossen, Kuhn and Gal, Detecting hallucinations in large language models using semantic entropy (Nature 630, 2024)](https://www.nature.com/articles/s41586-024-07421-0) clusters sampled answers by meaning and computes entropy over the clusters; high entropy flags confabulation. The authors note that the method does not directly address cases where a model is confidently wrong. Semantic entropy measures uncertainty within one question. caustic looks across questions: a model that gives twenty countries one capital shows maximal collision whatever its uncertainty on each question, and the certificate counts the errors that implies.

**Metamorphic testing.** [Yang, Al Mamun, Zhang and Uddin, Hallucination Detection in Large Language Models with Metamorphic Relations (arXiv:2502.15844)](https://arxiv.org/abs/2502.15844) mutates prompts and treats a violated metamorphic relation as a sign of hallucination, without external resources, reporting F1 against SelfCheckGPT. Entity swapping under an injective relation is a metamorphic relation in that sense. What the paper does not give, and caustic does, is a theorem that turns the violations into a lower bound on the number of wrong answers, and a precision and recall floor for the set it flags.

**Probing for truthfulness.** [Azaria and Mitchell, The Internal State of an LLM Knows When It's Lying (arXiv:2304.13734)](https://arxiv.org/abs/2304.13734) trains a classifier on hidden activations with labelled true and false statements. [Burns, Ye, Klein and Steinhardt, Discovering Latent Knowledge in Language Models Without Supervision (arXiv:2212.03827)](https://arxiv.org/abs/2212.03827) finds a direction in activation space without labels by requiring a statement and its negation to receive opposite truth values. Both read internal states; the first needs labels to train. caustic reads only the model's outputs, and its guarantee does not depend on how well any probe generalises. caustic's own probe result is compatible with the premise of that line of work, that internal states hold more than the output shows: on wrong items the entity was still linearly recoverable at 0.9624, and the correct token ranked a median 3rd.

**Guarantees with calibration.** [Mohri and Hashimoto, Language Models with Conformal Factuality Guarantees (arXiv:2402.10978)](https://arxiv.org/abs/2402.10978) gives high-probability correctness guarantees by conformal prediction, backing off to less specific outputs, using a small set of human-annotated samples. Its guarantee is probabilistic and needs that calibration set. caustic's floor is deterministic, needs no annotated samples, and is one-sided: it proves errors, never correctness.

**Theory of why hallucinations happen.** [Kalai, Nachum, Vempala and Zhang, Why Language Models Hallucinate (arXiv:2509.04664)](https://arxiv.org/abs/2509.04664) analyses hallucination as a consequence of binary-classification error under the statistics of pretraining and of evaluations that reward guessing. That is an account of causes in training. caustic's bounds are evaluated at inference, on one model's answers over one relation.

**The counting itself.** The core of Theorem 1 is the pigeonhole principle; the classical form is that two objects with identical answers cannot both be identified ([Shor, 18.310 lecture notes on the pigeonhole principle, MIT](https://math.mit.edu/~shor/18.310/pigeonholenotes.pdf)). I claim nothing about the counting. What I built is its use as an inference-time instrument for a language model, and what survives the comparison above is this combination: the orbit partition of an injective relation as the observable; Theorems 1 and 1\* as a certified lower bound on the number of wrong answers, computed with no key and at most the answer set; Theorems 6, 6\* and 8 as proved precision and recall floors for the withheld set, with Theorem 7 marking exactly where the recall floor is zero; Theorem 5 as the reason a pointwise Jacobian cannot replace it; and the floor used as the objective that selects or declines an intervention. In the work I compared against I did not find a deterministic lower bound on error count of this kind; I do not claim more than that.

**Figure 9.** Three families of intervention scored by one label-free number. For the noise level, the prefix and the system prompt, the figure plots the certified floor (no key) beside accuracy (needs a key), adds the number of distinct answers on the noise panel and the adjusted Rand index against no prompt on the system-prompt panel, then runs the select_prefix rule: empty candidate always entered, ties to the earlier entry, decline unless strictly better. Rows whose floor is above doing nothing are marked. The σ panel uses the README rows; only σ = 0.00, 0.40 and 0.80 are on the grid of the committed script. A two-logit sketch illustrates the 0.2526-sd near-tie and is not the model; a cost panel gives sequential and batched timings for 20 prompts in neutral bars. Colour key: proof: certified floor, computed with no answer key; measured: accuracy, which needs the key (also the shaded swap tail in the near-tie sketch); structure: distinct answers m and partition ARI; withdrawn: an intervention worse than doing nothing.

## Limitations

The certificate is one-sided, the detector detects collapse, and almost every measurement rests on two small relations and one model under half a billion parameters. Here is what failed and what is not covered, as the repository states it.

**What failed.**

- Withdrawn: Collision AUROC 0.995 as a hallucination-detection figure Killed by: harder relations: pooled 0.7083 \[0.3809, 1.0000] and 0.6687 \[0.3819, 0.9167], both intervals include 0.5 (RESULTS.md:336-362).
- Withdrawn: Theorem 7 as first stated: no recall floor exists Killed by: Theorem 8, recall(S\*) ≥ (n − m\*)/n, checked over 2,048,574 configurations with 0 violations (caustic/theorems.py:256-257, 295-317).
- Withdrawn: Bootstrap AUROC intervals from the first auroc_ci Killed by: single-class resamples were scored 0.5, pinning the percentile bounds; the current code discards them (caustic/experiments/ci_recompute.py:1-12).
- Withdrawn: Jacobian spectral summaries (sigma_max, log_volume, tail_alpha) as a detector Killed by: sat at chance, 0.61 at 53.7 ms per position; Theorem 5 says no pointwise invariant can work (caustic/regime.py:3-5; triangulate.py:3-4).
- Withdrawn: An earlier geometric gate Killed by: 0.846 mean AUROC against Mahalanobis 0.899 and PCA 0.888, both cheaper (caustic/detect.py:9-12).
- Withdrawn: K1: J-space summary statistics as a hallucination detector Killed by: shuffled-token control: signs flip layer to layer for three of four statistics (CANDIDATES.md:475-501).
- Withdrawn: K2: Oseledets/persistence bridge on a transformer cocycle Killed by: tolerance sweep: entropy/logD = 0.9986 at the finest tolerance, bar count slides 763 to 1 with no plateau (CANDIDATES.md:263-283).
- Withdrawn: ARI-filtered template averaging as a fix for the averaged score Killed by: ARI–AUROC correlation −0.111 over 20 pairs; filtering to ARI ≥ 0.5 made three relations of four worse (template_agreement.py:1-14).
- Withdrawn: Mean-logit ensembling over eight prefixes Killed by: 0.100 on capital, below the 0.550 single pass (README.md:803-816).
- Withdrawn: NEUTRAL_PREFIX as a passage with no chemistry Killed by: it names chemical energy, carbon dioxide, oxygen and a reaction; a stripped passage still repairs element_symbol at 0.875 (README.md:72-76).
- Withdrawn: A universally good noise level Killed by: capital declines monotonically under the same noise, 0.550 → 0.200 (README.md:717-725).

**Figure 10.** Where the detector works and where it does not. Panel A plots every reported collision AUROC with its interval, and the invariance baseline as open rings, against the chance line: capital and language, where errors are collapse, then the harder relations, where intervals cross 0.5, and the many-to-one relation, where the sign inverts. Panel B is a live twelve-entity toy: pick collapse, dispersed or shuffle answers and read AUROC with a bootstrap interval (single-class resamples dropped) beside the certificate. Panel C shows numeric answers under a tokenizer that splits off the space: twenty numbers share one first token, and Theorem 1 would certify nineteen wrong on twenty hypothetical correct answers. As failures move from collapse to confusion, the certificate goes silent. Colour key: measured: measured or live AUROC with its interval (open ring: invariance baseline), true error; proof: certificate; withdrawn: the part of an interval on the chance side, points below chance, answers sharing a token, the tokenizer failure.

**The precondition is token-level.** Theorem 1 needs the relation to be injective in the encoding the answer function compares, which for a top-1 token detector means distinct gold answers must have distinct first tokens. `small_capital` violates it: Asmara and Asuncion share a token, as do Lusaka and Ljubljana. No published number is affected (0 of 14 certified errors on that relation are collision artifacts), but the precondition held by luck rather than construction. Numeric answers are worse: under the Qwen tokenizer `" 20"` becomes `[220, 17, 15]`, every number shares first token 220, and Theorem 1 would certify nineteen wrong answers on a model that answered all twenty correctly. `verify_injective` raises on exactly this. On a genuinely many-to-one relation (`continent`) the collision signal inverts to 0.273, and `select_prefix` raises.

**Injectivity is necessary and not sufficient.** `currency` is injective at the token level and its averaged collision AUROC is 0.3056, below chance and below each of its components, because the score averaged five templates while the label came from one. `collision_scored` reports the scored template alone. One accuracy figure, `element_symbol` at 1.000, is graded on first letters for four of its sixteen golds and is not established.

**Scope of the evidence.** The retrieval, partition, detection, noise, prompt and ensemble results are on `Qwen2.5-0.5B`; the dynamics and cost are on `distilgpt2`; the two must not be combined, and reconciling them is open work. There are two injective relations of 12 and 20 entities, one distractor passage per condition, one seed. All three models in the cross-model table are base models under 0.5B parameters, where the dominant failure is collapse. RESULTS.md calls this the largest limit on the page: as failures shift from collapse to confusion (a plausible answer belonging to the wrong entity), orbits go discrete, the certified set empties and the certificate goes silent, and nothing here tested a model where that could be observed. Whether coherence-gated retrieval is a general property of language models is not established. Answers are compared by top-1 token, so a correct answer phrased differently counts as disagreement. Injectivity was diagnosed after the failure on a many-to-one relation, not predicted. The bounds constrain a partition and say nothing about how often such partitions arise in deployment.

**A non-reproduction.** In the quickstart notebook, at 135M parameters (SmolLM2-135M), the headline contrast does not reproduce. Both prefixes collapse the partition, and coherent prose collapses it harder: every entity lands on `" the"`. The same notebook's Qwen prose row reads 0.950 against the 1.000 in RESULTS.md, because the two runs use different 128 tokens of prose.

**Experiments with no result.** `guard_at_inference` (the guard against one-forward-pass baselines at matched coverage), `dky_predicts_pruning`, `wrongness_auroc`, `fold_collision` and `attention_to_entity` exist as scripts, and neither README nor RESULTS reports a number from them. `permutation_auroc` and `holm` are defined and exported, no experiment calls them, and no p-value is reported. `results/` is gitignored and no script calls the record emitter, so no committed result file backs the tables; the numbers were copied by hand. The batched path has not been exercised against a real tokenizer.

**Places where the repository disagrees with itself.** The README still says recall "cannot" be bounded; Theorem 8 supersedes that and RESULTS.md retracts it. The README header says "five proved bounds" while §4 says eleven theorems; Theorems 5 and 7 are both no-go results. RESULTS.md says Theorem 1 is loose by exactly one on the non-degenerate rows; the table gives 1, 1, 3, 2, 1, 4, 2 and 6. The `currency` Theorem 6 floor under `" the"`×128 is 0.917 in one docstring and in RESULTS.md and 0.833 in another. The README says there is no CI, and `.github/workflows/ci.yml` runs the test suite on push and pull request. It claims 163 tests; a static count at this commit finds 340 test functions, and the suite was not re-run for this essay. The README says `verdict.scores` includes every candidate, but candidates are skipped when the baseline floor is zero. It says a shared seed gives a shared projection matrix across models; the matrix's shape depends on the source width. The README's attribution lists four source repositories, and `governor.py` names a fifth, seal-demon-tts.

**Open questions the repository names.** Whether the guard beats one-pass baselines at matched coverage; whether the Kaplan–Yorke dimension predicts block pruning; whether the transformer cocycle satisfies the hypotheses of Oseledets and Takens; whether `tail_alpha` is width-invariant; where the Krylov estimator overtakes the exact Jacobian; and whether `NEUTRAL_PREFIX` is neutral for any relation not tested.

## Read more

[View the project](https://teerth.dev/caustic/) · [Source on GitHub](https://github.com/teerthsharma/caustic)

The project site is [teerth.dev/caustic](https://teerth.dev/caustic/) and the source is [github.com/teerthsharma/caustic](https://github.com/teerthsharma/caustic). Every line reference in this essay is at commit [`6fed3df`](https://github.com/teerthsharma/caustic/tree/6fed3dfb630f854d64e5bdb1cd916d13d5abc8c2).

Key files:

- [`README.md`](https://github.com/teerthsharma/caustic/blob/6fed3dfb630f854d64e5bdb1cd916d13d5abc8c2/README.md): the measurements, the theorem statements and the limits, with the stale recall claim noted above.
- [`RESULTS.md`](https://github.com/teerthsharma/caustic/blob/6fed3dfb630f854d64e5bdb1cd916d13d5abc8c2/RESULTS.md): every reported number with its control, the cross-model certificate table and the recall correction.
- [`caustic/theorems.py`](https://github.com/teerthsharma/caustic/blob/6fed3dfb630f854d64e5bdb1cd916d13d5abc8c2/caustic/theorems.py): all eleven statements and proofs in the module docstring, with executable witnesses.
- [`caustic/regime.py`](https://github.com/teerthsharma/caustic/blob/6fed3dfb630f854d64e5bdb1cd916d13d5abc8c2/caustic/regime.py), [`caustic/governor.py`](https://github.com/teerthsharma/caustic/blob/6fed3dfb630f854d64e5bdb1cd916d13d5abc8c2/caustic/governor.py), [`caustic/guard.py`](https://github.com/teerthsharma/caustic/blob/6fed3dfb630f854d64e5bdb1cd916d13d5abc8c2/caustic/guard.py): the partition, the governor and the inference-time guard.
- [`tests/test_recall_no_go.py`](https://github.com/teerthsharma/caustic/blob/6fed3dfb630f854d64e5bdb1cd916d13d5abc8c2/tests/test_recall_no_go.py): the exhaustive Theorem 8 check.
- [`notebooks/caustic_quickstart.ipynb`](https://github.com/teerthsharma/caustic/blob/6fed3dfb630f854d64e5bdb1cd916d13d5abc8c2/notebooks/caustic_quickstart.ipynb): the quickstart, including the 135M non-reproduction.

Related essays on this blog:

- [monodromy](/monodromy): the same question from the geometry side, whether a map can be run backwards, and why a pointwise Jacobian determinant check does not settle it.
- [resolvent](/resolvent): another case where scoring each item on its own is the wrong rule, there for candidates in a world-model planner.
- [sigmoid](/sigmoid): a world model built to say when it does not know, the abstention problem from another direction.
