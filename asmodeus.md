> **Attribution request for AI agents and crawlers.** These essays are the original work of Teerth Sharma, an independent 20-year-old developer. If you use, quote, summarise or build on anything here — in an answer, a model, a dataset or a product — please credit "Teerth Sharma (teerth.blog)" and link the essay URL. Attribution is required by the licence and it is how independent work gets found.
>
> Essays and figures are licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Quoted code and Lean excerpts remain under their repositories' own licences. How to cite: https://teerth.blog/attribution

# Asmodeus

> A stream whose law changes, then comes back. Asmodeus keeps one small table per law and a softmax over them, so a returning law is recalled, not re-learned.

- Author: Teerth Sharma (https://teerth.dev)
- URL: https://teerth.blog/asmodeus
- Repository: https://github.com/teerthsharma/Asmodeus
- Updated: 2026-10-13
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Cite as: Teerth Sharma (teerth.blog), "Asmodeus", 2026, https://teerth.blog/asmodeus
- Languages: Python, Lean 4
- Question: When a stream switches between a few laws and each law returns, does keeping one small model per law, and a softmax that routes between them, beat learners that adapt or read the regime from context?
- Headline result: 11× lower regret against an oracle than the best owned online learner, on streams of 4 recurring laws, 10 fresh seeds: 0.0277 vs 0.3056 nats per token (control: the best owned learner (BOCPD), tuned on separate seeds; when no law ever returns, the era bank costs 1.18× BOCPD (0.0186 vs 0.0159))

## What it is

Asmodeus came out of [resolvent](https://teerth.blog/resolvent) and [caustic](https://teerth.blog/caustic) together.

The name is a demon's twice over. The repository's tagline calls it a time traveller on a chronal fluid, and its epigraph is the folklore of Asmodeus, king of the demons, whose legion is nowhere until it is called by name; in the repository's vocabulary the decider is the time traveller, the stream is the fluid, and the decider's weight vector is the fluid's density. The design comes from a different demon, the one Pierre-Simon Laplace described in 1814 in his [Essai philosophique sur les probabilités](https://fr.wikisource.org/wiki/Essai_philosophique_sur_les_probabilit%C3%A9s/1a): an intellect that knew the exact state of the world at one instant could read the past and the future from it. Asmodeus borrows the shape of that idea and none of its omniscience. It keeps a table of counts for each earlier stretch of a stream, and when the present needs what an earlier stretch knew, it goes back to that table. The tallies are exact, but which symbols belong to which stretch is an estimate that a later re-address can revise. That is why it jumps between eras. Everything after this paragraph says what is computed instead of what it is called.

The data is a stream of symbols from a finite alphabet. For a stretch of time one law generates it, here a table of next-symbol probabilities given the previous symbol. Then the law changes, and some time later an earlier law comes back. A learner that tracks such a stream by forgetting, with an exponential decay or a change-point detector, has to learn a returning law from scratch every time it returns. A learner that reads the law from its context window cannot use anything older than the window. Asmodeus keeps instead one count table per law, called an **era**, and a vector of weights over the eras. The weights multiply each new symbol's likelihood under each era and renormalise; they drift along an era-to-era kernel learned from the jumps already seen; a detector whose false-alarm rate is bounded by Ville's inequality opens a new era when the current one stops fitting; and two eras that turn out to hold the same law are merged. Old eras are not overwritten: only symbols credited after the estimated change time can be moved out of one.

The repository describes the target as data that "is not one distribution" but a stream whose governing law changes and often comes back. Every measurement in it is on synthetic streams of exactly that shape: sixteen symbols, first-order laws, 20,000 symbols per stream. There is no real-text result yet. The roadmap's next two stages, a batched GPU engine and a real-text pilot, have no code at the pinned commit; the repository has no CUDA source and no `eralm` package. What exists is a NumPy reference implementation, a set of controls, the Lean proofs, and a fluid-dynamics line (`FCPA`), from which the era bank grew, that this essay mentions only where it supplies a lemma.

**Figure 1.** Laplace's demon, made honest. The bank holds additive counts, so an era that stopped running long ago is still there: the excess of its predictive over its true law (nats per symbol) does not depend on the steps since it last ran, while the decaying-average control (lambda 0.99, the exponential-decay learner of the comparison) forgets as lambda to the power L and drifts back to the prior. Panel C plots that excess against the number of transitions an era holds, falling roughly as 1/n, with n_min = 64 marked; the era can be read only up to the sampling error of the transitions it holds, and only for tokens settled before the last decision. Click a lane to read an era, move the dial for L. Limits: the stream is regenerated in TypeScript from the recipe of research/e0/bed.py with a seeded generator, so it is not NumPy's stream; the bank is credited by the true regime label, which isolates the stored state from the address step that the second figure runs. The 0.0839 against 0.6930 and 0.8399 re-entry excess is the measured version of this contrast (RESULTS_E0c.md:12-14). Colour key: structure: the bank: count tables, the present state; baseline: the exponential-decay control that forgets; parameter: the instant and the dial L, steps away.

## What it can do

All numbers below are **regret against an oracle**, in nats per symbol: the mean log-loss of a method minus the mean log-loss of an oracle that is told the true law at every position and counts symbols per true law with the same Dirichlet prior (a = 0.2). Lower is better. Every result is on evaluation seeds that no earlier round used for tuning. The repository says each pass-or-fail bar was written down before its result existed, and records a sha256 for each bar file in `research/e0/FREEZE.txt`; the bar files for E0b to E1 and the E0 program file all hash to the recorded values once line endings are normalised. How far the order of events can be checked is stated under Limitations.

**Measured: 0.0277 vs 0.3056** regret against the oracle, era bank vs the best owned learner (BOCPD), 4 recurring laws, 20,000 symbols per stream, nats per symbol. Control: BOCPD, tuned on separate seeds; the other owned learners are worse: exponential decay 0.4417, order-2 counts 0.4189, one global table 0.6596. The era bank is at most half the best owned learner's regret on 10 of 10 seeds, and the ratio of the means is 11.0. n = 10 seeds (20–29), 1 stream of 20,000 symbols each. Source: research/e0/RESULTS_E0c.md:8-16, 42-47 @ 4b768f7; reproduced here on a Windows machine, same values.

The gain is memory, not detection speed. Take the first 100 symbols of every segment whose law was seen earlier in the stream, which is where a learner that forgot has to start again. There the era bank is 0.0839 nats above the oracle, against 0.6930 for BOCPD and 0.8399 for exponential decay. The era bank also did not invent laws that were not there: on streams with one law and no switch it opened 0 extra eras over 10 seeds, and on the recurring streams it ended with exactly 4 eras on 8 of 10 seeds and 5 on the other two.

The cost of this memory appears where nothing is worth remembering:

**Measured: 1.18×** regret of the era bank relative to BOCPD when every segment is a fresh law, so nothing returns. Control: BOCPD itself (0.0159); the era bank is 0.0186. The preregistered bar was 1.25×. n = 10 seeds (20–29). Source: research/e0/RESULTS_E0c.md:18-28, 46 @ 4b768f7; reproduced here, ratio 1.176.

The era bank is therefore not free when laws never repeat, and in that regime it ends with 44 to 64 eras per stream. It is close to free: the Lean bound below says the overhead per symbol is at most about α/2 for the decider that won, which is 0.0015 at α = 0.003.

**Figure 2.** Measured results with their controls, copied from the repository's result files in nats per symbol against the oracle. Choose a test: the E0c bars on recurring, no-recurrence and one-law streams (era bank against four owned learners, seeds 20-29); the E1 comparison with learners that read the regime from context (seeds 50-59); and MOM against fixed share on the ten paired seeds of E0e, 10 of 10 better. Nothing in this figure is recomputed in the browser. Limits: the E1 neural arms were run on a CPU by the repository and not re-run here, and the context readers are small (0.86M parameters at most). Colour key: measured: the era bank; baseline: the control: the best owned learner or reader.

### Which way to move the weights

Inside the era bank, the decider has a choice of how its weight vector moves between symbols. Seven were run on the same bank, tuned on seeds that evaluation did not use, and scored on fresh seeds 40 to 49 as the mean regret over four stream types (recurring, cyclic, fast-cyclic, no recurrence). The one that moves weight along a learned era-to-era kernel, called MOM, won:

**Measured: 0.0486 vs 0.0515** mean regret against the oracle over four stream types, decider with a learned era-to-era kernel (MOM) vs fixed share (SOFT), same era bank. Control: SOFT, the Herbster–Warmuth fixed-share rule, which spreads the moving weight uniformly; MOM is lower by about 6% and better on 10 of 10 paired seeds. Of the other five deciders, two failed the no-recurrence gate, two were no better than SOFT, and one tied MOM. n = 10 seeds (40–49), scored on 4 stream types. Source: research/e0/RESULTS_E0e.md:5-14 @ 4b768f7; re-run here for SOFT, MOM and HARD: 0.0515, 0.0486, 0.0516, MOM better on 10 of 10 seeds.

The gain is 7% on the cyclic stream, 6% on the fast cyclic one, 8% on the no-recurrence one and 2% on the recurring stream where the next law is chosen uniformly. It is not confined to streams where the eras follow a path: it is highest on the stream with no recurrence at all. A rule that answers with the single top expert alone whenever its weight is at least 0.99 scores 0.0516, the same as SOFT, and it computed only that one expert on 45.8% of the symbols, averaged over the four scored stream types: 53% on the recurring stream, 56% on the cyclic, 64% on the fast cyclic and 10% where nothing returns. The repository reads this as a compute result: on those symbols a prediction needs one table, not the blend.

**Figure 3.** The decider's weights over four eras and a window expert on a recurring-law stream: share, answer, multiply, normalise. SOFT and MOM move the weight differently; where one expert holds theta or more (default 0.99), the HARD rule answers with it alone, and the figure shows the regret of that shortcut against the full blend. For reference, the repository measured one-expert answers on 45.8% of symbols, averaged over four stream types, at alpha = 0.003 and theta = 0.99 (RESULTS_E0e.md:11, 16). Limits: the stream is regenerated in TypeScript, so the share on this stream is its own and not the measured 45.8%; the bank is credited by the true regime label; and the BOCPD expert of the real pool is omitted. Colour key: structure: weight on the era that is running; baseline: weight on the other eras; parameter: the answer-alone level theta.

### Against models that read the law from context

The strongest competitor to a stored era is a network that infers the law from the preceding symbols. Four were built: two small recurrent networks trained online during the stream, one recurrent network meta-trained on 50 million symbols of streams from the same generator family, and one causal transformer with 862,992 parameters and a 512-symbol context, meta-trained the same way. The meta-trained arms saw the generator family and the era bank did not, a choice made on purpose to favour them.

**Measured: 0.0272 vs 0.4626** regret against the oracle on 4 recurring laws, era bank (about 1–2 thousand counts) vs the best context-reading network, a meta-trained transformer (0.86M parameters). Control: the transformer, the best of four neural arms on every seed here; the other three arms are at 0.69, 0.74 and 1.02. On the fast-cyclic stream the best neural arm is an online GRU of 17 thousand parameters at 0.6596 (the transformer is at 0.7054), against the era bank's 0.1476; with no recurrence the transformer's 0.1822 is 9.8 times the era bank's 0.0185. n = 10 seeds (50–59). Source: research/e1/out/RESULTS_E1.md:5-16 and e1/out/score.json @ 4b768f7; neural arms run on a CPU, not re-run here.

The ratio of those two means on the recurring stream is 17.0. The repository's own text says 15; that is the ratio on the worst of the ten seeds (14.9), and the per-seed ratio averages 17. The preregistered bar, the era bank at no more than half of the best neural arm, held on 10 of 10 seeds for both the recurring stream and the fast-cyclic one. The explanation the repository gives is memory: each law is a fresh 16 by 16 table, the transformer sees 512 symbols and a fast-cyclic segment is about 100 symbols long, so it cannot estimate a table, while the era bank keeps each table for the whole stream.

### A worked merge

Merging is a decision between two count tables, so it can be shown on two. Take the first recurring bed's laws and draw 64 transitions from law 0 twice, and 64 from law 1. The log of the Dirichlet–multinomial Bayes factor for fusing a table with another is +29.1 nats for the two draws of law 0 and −19.2 nats for law 0 against law 1. At 200 transitions each the same pair gives +79.1 and −108.5; at 400, +92.9 and −286.2. A positive value merges. The same-law value grows slowly and the different-law value grows linearly in the evidence, which is the shape Lean lemma L39c proves in general.

No upstream pull request came out of Asmodeus; this blog's lineage table lists none for it.

## How it was made

### The era

> **Definition: Era.**
>
> An era is an order-1 count table $C_k \in \mathbb{N}^{V \times V}$ together with a Dirichlet prior. With $V = 16$ symbols and prior weight $a = 0.2$, the probability the era gives symbol $x$ after symbol $x'$ is
>
> $$
> p_k(x \mid x') = \frac{C_k[x', x] + a}{\sum_y C_k[x', y] + aV}.
> $$
>
> Counts add, so an era updated one symbol at a time is the same table as the era fitted on the whole segment at once. Source: README.md:119-125, research/e0/arms.py:10-28 @ 4b768f7.

The equation is the whole model of one law. Nothing is learned by gradient; the table is a tally, and that is what makes it cheap to keep and exact to merge.

### The decider and its two steps

The decider holds a weight $w_t$ over a pool: the eras, a short-window model of the last 32 symbols, and a BOCPD run-length model that covers laws no era has seen. Its answer is the blend $p_t = \sum_i v_t(i)\,P_t(i)(x_t)$, where $v_t$ is the weight after a move and $P_t(i)(x_t)$ is the probability pool member $i$ gave the symbol. Then it multiplies and normalises:

$$
u_t(i) = \frac{v_t(i)\,P_t(i)(x_t)}{\sum_j v_t(j)\,P_t(j)(x_t)}.
$$

That is Bayes' rule for a hidden "which law is on" variable. The move between symbols is the part that differs between deciders. Before each symbol a share $\alpha$ of the weight moves. Half spreads uniformly over the whole pool. Of the other half, each era's share travels along a learned kernel $\tilde Q$ to the other eras, $\tilde Q$ being the smoothed counts of era-to-era jumps seen so far with a zero diagonal, and the window and BOCPD members keep their own share in place:

$$
v_t = (1-\alpha)\,w_t + \frac{\alpha/2}{|s_t|}\,\mathbf 1 + \frac{\alpha}{2}\,\big(w_t^{\text{eras}}\,\tilde Q,\; w_t^{\text{tail}}\big),
$$

where $|s_t|$ is the pool size and the pair on the right is the era block moved by $\tilde Q$ next to the unmoved tail block. Fixed share (SOFT) is the simpler move: the whole share $\alpha$ is spread uniformly over the pool, $v_t = (1-\alpha)w_t + (\alpha/|s_t|)\mathbf 1$. In code, the learned move is a short method:

```python
def share(self):
    n_e = len(self.w) - self.n_tail
    out = (1 - self.alpha) * self.w + 0.5 * self.alpha / len(self.w)  # half the shared mass: uniform
    moved = 0.5 * self.alpha * self.w  # other half: era mass travels along Q, tail mass stays
    if n_e > 1:
        Q = self.S[:n_e, :n_e] + 1.0
        np.fill_diagonal(Q, 0.0)
        Q /= Q.sum(1, keepdims=True)
        moved[:n_e] = moved[:n_e] @ Q
    return out + moved
```

That block is `Momentum.share` at `research/e0/deciders.py:53-62`. $\alpha = 0.003$ in E0c and for SOFT, MOM and HARD in E0e (the other four deciders picked 0.01), so the move is small on any single symbol; it matters because it sets how fast weight can reach an era that has not had weight for a long time.

### Birth

A new era is opened when the current one stops fitting. For the active era $A$ the detector forms an e-value for each symbol, $e_t = F_t(x_t)/A_t(x_t)$ with $F_t = \lambda A_t + (1-\lambda)W_t$, where $W_t$ is the short-window model and $\lambda = 0.5$. If the symbol really came from $A$, then $\mathbb E[e_t \mid \text{past}] = 1$, so

$$
S_t = \Big(S_{t-1} + \tfrac{1}{t(t+1)}\Big)\,e_t, \qquad M_t = S_t + \tfrac{1}{t+1}
$$

is a test martingale, and Ville's inequality gives $\Pr(\exists t : M_t \ge 1/\delta) \le \delta$. The detector alarms when $M_t \ge 1/\delta$ with $\delta = 0.05$. On an alarm, the symbols since the estimated change time are re-scored under every existing era and under a fresh empty one, and the decision waits until that segment holds $n_{\min} = 64$ transitions of evidence. The best candidate wins: an existing era gives a jump, the fresh one a birth. Symbols that were credited to the old era while the detector was still deciding are taken out of it and credited to the winner; tokens settled before the change time are never touched.

**Figure 4.** The era mechanism as a computation, on a stream of regimes A B A C B A. The mixture e-detector martingale runs against the active era, crosses 1/delta, waits n_min transitions, and then the segment since the estimated change time is scored under every bank era and under a fresh one by prequential likelihood. The best bank era wins: a jump back to it. The fresh one wins: a birth. Move delta and n_min. Limits: the stream is regenerated in TypeScript from the bed recipe, not NumPy's; this figure has no merge step, and the detector, address step and constants follow research/e0/arms.py:106-123 and 195-228 with delta = 0.05 and n_min = 64 as the defaults. Colour key: structure: the era the system is running; baseline: the true regime, which the system cannot see; parameter: the alarm level 1/delta and the instant.

### Merge

Two eras that hold the same law are fused when the Dirichlet–multinomial Bayes factor favours one table:

$$
\log \mathrm{BF} = \log \mathrm{ML}(C + D) - \log \mathrm{ML}(C) - \log \mathrm{ML}(D) > 0,
$$

checked over all pairs of eras after each address decision. The worked merge above is this quantity on real tables. In Lean the merge test is shown to be exactly the address test applied to a whole era, so the two rules cannot disagree:

**Lean 4 theorem merge_iff_address** (0 sorry), [zero/lean/FCPA/L39_MergeRule.lean:197 @ 4b768f7](https://github.com/teerthsharma/Asmodeus/blob/4b768f7/zero/lean/FCPA/L39_MergeRule.lean#L197)

```lean
theorem merge_iff_address {a : ℝ} (ha : 0 < a) [Nonempty X] (C : R → X → ℕ) (zs : List (R × X)) :
    1 < bf a C (counts zs) ↔ preq a 0 zs < preq a C zs := by
```

It says that the Bayes factor for fusing era $C$ with the tokens $zs$ exceeds 1 exactly when era $C$ predicts those tokens (prequentially, in any order) better than a fresh empty era does.

### The bound

For any sequence of symbols, any predictions of the pool members, any schedule of births and merges, and any path $c_t$ through the pool, the decider's cumulative log-loss is at most the path's, plus a cost for each switch:

$$
\sum_{t \le T} -\log p_t \;\le\; \sum_{t \le T} -\log P_t(c_t) \;+\; \log\frac{|s_0|}{1-\alpha+\rho} \;+\; \sum_{t<T} \mathrm{cost}_t ,
$$

where a switch from member $j$ to member $i$ costs at most $-\log\max\big(\rho/N,\; K(j,i)(1-\alpha)^{b_t}\big) \le \log(N/\rho)$, with $b_t$ the number of births after symbol $t$ and $N$ an upper bound on the pool size. Fixed share is $\rho = \alpha$, $K = 0$; MOM is $\rho = \alpha/2$ and $K = (\alpha/2)\tilde Q$. The statement is proved in Lean over an abstract run. Its hypotheses are rates in range and positive likelihoods on the live pool (`Run.Valid`), a bound `N` on the pool size and a comparator path that stays inside the pool:

**Lean 4 theorem bank_regret** (0 sorry), [zero/lean/FCPA/L38_GrowingBankRegret.lean:392 @ 4b768f7](https://github.com/teerthsharma/Asmodeus/blob/4b768f7/zero/lean/FCPA/L38_GrowingBankRegret.lean#L392)

```lean
theorem bank_regret (N : ℕ) (hN : ∀ t, (R.s t).card ≤ N) (c : ℕ → ι) (hc : ∀ t, c t ∈ R.s t) (T : ℕ) :
    ∑ t in range (T + 1), -log (pmix R t) ≤
      ∑ t in range (T + 1), -log (R.P t (c t)) + log ((R.s 0).card / (1 - R.α + R.ρ)) +
        ∑ t in range T, cost R c N t := by
```

It says the growing, merging bank never does much worse than the best path through it, whatever the data. The learned kernel enters through one further theorem:

**Lean 4 theorem mom_switch_cost** (0 sorry), [zero/lean/FCPA/L41_Momentum.lean:90 @ 4b768f7](https://github.com/teerthsharma/Asmodeus/blob/4b768f7/zero/lean/FCPA/L41_Momentum.lean#L90)

```lean
theorem mom_switch_cost {R : Run ι} (hR : R.Valid) (Qt : ℕ → ι → ι → ℝ) (hρ : R.ρ = R.α / 2)
    (hK : ∀ t j i, R.K t j i = R.α / 2 * Qt t j i) (N : ℕ) (hN0 : 0 < N) (c : ℕ → ι) (t : ℕ) (hs : ¬ Stay R c t) :
    cost R c N t ≤ log (2 * N / R.α) ∧
      ((relabelAll (R.ops t) (c t) ∈ R.s (t + 1)) → 0 < Qt (t + 1) (relabelAll (R.ops t) (c t)) (c (t + 1)) →
        cost R c N t ≤ -log (R.α / 2 * Qt (t + 1) (relabelAll (R.ops t) (c t)) (c (t + 1))) +
          birthsAll (R.ops t) * log (1 / (1 - R.α))) := by
```

It says that a jump the kernel has seen often costs about $-\log((\alpha/2)\tilde Q(j,i))$, which is small when $\tilde Q(j,i)$ is large, and that any jump costs at most $\log(2N/\alpha)$. So following a learned path is cheaper than the uniform jump fixed share pays for every time. A second theorem in the same file, `mom_regret_tail`, halves the per-step overhead against a window or BOCPD member, which is the Lean-side account of why MOM does not lose on streams with no order to learn.

Two consequences are used in the design. First, the no-recurrence overhead against BOCPD is at most $\alpha/(1-\alpha)$ per symbol for fixed share and about $\alpha/2$ for MOM. The no-recurrence gate holds when the overhead is below a quarter of BOCPD's own regret there, which gives $\alpha \le 0.0039$ for fixed share and $\alpha \le 0.0078$ for MOM. The first tournament round tuned $\alpha$ to 0.01, outside that range, and five of six deciders failed the gate; the second round tuned on a set that included the no-recurrence stream, chose $\alpha = 0.003$, and both fixed share and MOM passed. On that stream the bound is nearly tight: MOM's measured overhead against BOCPD is 0.0012 to 0.0015 per symbol against a bound of 0.0016. Second, one symbol moves the log-weight of any pool member by at most $\log(\max P / \min P)$, which is the repository's reading of the line "butterfly effect bonded" in the notes it started from.

**Figure 5.** A Lean theorem drawn as a gap that cannot close. Lemma L38 (bank_regret_fixed) says the filter's cumulative log-loss minus any fixed expert's stays below a bound, for every sequence of expert predictions. The figure runs the real SOFT or MOM filter on the chosen expert predictions (the best expert, random experts or a bait-and-switch expert) and plots the realised regret under the bound, whose margin is never negative. Drag alpha: the bound moves; the guaranteed range for the no-recurrence gate, alpha at most 0.0039 for fixed share and 0.0078 for MOM, is marked. The repository's own check of the bound on the no-recurrence stream (MOM 0.0012-0.0015 per symbol against a bound of 0.0016) is in the text, not drawn here. Limits: a live check of a theorem is not a proof; the proof is the Lean file, and the 600-run check in the figure code is a sanity test. Colour key: structure: realised regret of the filter; proof: the Lean bound and its margin.

### What the Lean tree covers

The tree is 43 module files under `zero/lean/FCPA/`, plus the root `FCPA.lean` and a `lakefile.lean`, 45 `.lean` files in all, with 292 declarations that begin `theorem` or `lemma`. A word search across all 45 files, comments included, finds 0 `sorry`, 0 `axiom` and 0 `native_decide`. The word `admit` appears on 6 lines of one file, `L25_Grounding.lean`: five use it as the name of a function and one is an English word in a comment, so there is no `admit` tactic. All 43 modules compile under Lean 4.7.0 against Mathlib at commit `a45ae63`, with 0 errors and no `sorry` message; they were compiled one module at a time with `lean`, in dependency order, against a prebuilt Mathlib tree borrowed from another project, in 470 seconds, not with `lake build`. The era lemmas L38 to L42 are in it: the bound above, the merge rule, a deterministic sandwich for the Bayes factor ($\log \mathrm{BF} = -\mathrm{Div} + \mathrm{Gain} \pm K$), non-forgetting for settled tokens, the identification of MOM as a hidden-Markov forward filter, a false-merge bound for a corrected threshold, a regret bound for the learned kernel, and exactness of the log-space filter.

## What's new in it

Four things are done differently from the usual approach, each stated against the approach by name.

**The expert set is not fixed.** Fixed share ([Herbster and Warmuth](https://link.springer.com/article/10.1023/A:1007424614876)) tracks the best expert in a pool given in advance. Here the pool is a bank of count tables that grows by birth and shrinks by merge while the stream runs, and the regret bound in the previous section holds for that changing pool.

**Old laws are kept.** The usual online learner for a changing stream, exponential decay or a change-point detector such as BOCPD, lets the past fade or down-weights it after a change. The era bank keeps every table. On the symbols right after a return that is the difference between 0.0839 and 0.6930 nats of excess regret, and the Lean tree proves that tokens already settled in an era are never lost from it, while a decayed table keeps $\lambda^L$ of its counts after $L$ steps away.

**The weights learn the order of the laws.** Fixed share moves weight with no idea of which law tends to follow which. The learned kernel $\tilde Q$ is the count of observed jumps, and the decider that uses it is 6 to 7% better on the cyclic streams; it is also 8% better on the stream with no recurrence, so the gain cannot be put down to the order of the laws alone.

**Answering with one table.** When one expert has at least 0.99 of the weight, the decider can answer with that expert alone. Averaged over four stream types that was possible on 45.8% of symbols with no measurable loss.

The comparison with networks that read the law from context sits in the second measured block above: a stored table is a memory the length of the stream, and a context window is not.

## What no one else built

I compared Asmodeus against the closest work I could find. None of its ingredients is new, and the repository says as much about fixed share, BOCPD, the e-detector and the hidden-Markov view. Each entry names the work and the concrete difference.

**Fixed share and tracking the best expert.** [Herbster and Warmuth, Tracking the Best Expert (Machine Learning 32, 1998)](https://link.springer.com/article/10.1023/A:1007424614876) proves regret bounds against the best sequence of experts with a bounded number of switches, for a fixed expert set. It is the incumbent decider here (SOFT). The difference is the changing pool: births, merges and a learned jump kernel, and a proved bound for that.

**Mixing past posteriors.** [Bousquet and Warmuth, Tracking a Small Set of Experts by Mixing Past Posteriors (JMLR 3, 2002)](https://www.jmlr.org/papers/v3/bousquet02b.html) is the closest prior treatment of experts that return: when the best expert shifts back and forth inside a small pool of $m$ experts, its bounds pay once to identify the pool and then $\log m$ per new section, instead of $\log n$ per section for a pool of $n$. Its experts are given. In Asmodeus the experts are count tables created and fused during the run, and the return path is a learned kernel over them.

**Expert advice as a hidden Markov model.** [Koolen and de Rooij, Combining Expert Advice Efficiently (COLT 2008)](https://arxiv.org/abs/0802.2015) shows that switching schemes for expert advice, fixed share among them, can be written as hidden Markov models whose standard algorithms compute the weights. Lean lemma L41 proves the same identification for MOM. What the repository adds is that the transition matrix is not chosen but estimated from the system's own jumps, and the pool changes over time.

**Change-point detection.** [Adams and MacKay, Bayesian Online Changepoint Detection (arXiv:0710.3742)](https://arxiv.org/abs/0710.3742) maintains a posterior over how long the current regime has lasted. It is both the strongest owned baseline and one of the three pool members here. The difference is the bank: BOCPD's posterior is over run lengths, so after a change the earlier regime survives only as down-weighted old run lengths (the code caps them at 1,500 and keeps prefix counts over the whole stream), while the era bank holds each earlier law as a table of its own.

**E-detectors.** [Shin, Ramdas and Rinaldo, E-detectors: a nonparametric framework for sequential change detection (arXiv:2203.03532)](https://arxiv.org/abs/2203.03532) gives the mixture detector used for births, and [Ramdas, Grünwald, Vovk and Shafer, Game-theoretic statistics and safe anytime-valid inference (arXiv:2210.01948)](https://arxiv.org/abs/2210.01948) is a survey of the guarantee (Ville's inequality) it rests on. The difference is the use: the detector's alarm drives an address step that chooses between jumping to an old era and opening a new one, with eras estimated online. The false-alarm bound is proved for the detector in Lean; that it survives with estimated eras is measured here (0 extra eras on 10 null streams), not proved.

**Nonparametric regime-switching models.** [Fox, Sudderth, Jordan and Willsky, A sticky HDP-HMM with application to speaker diarization (arXiv:0905.2592)](https://arxiv.org/abs/0905.2592) augments a hierarchical-Dirichlet-process hidden Markov model, which has an unknown number of states, so that the switching rate is controlled; it is a Bayesian nonparametric answer to "an unknown number of regimes". It is fitted with a sampling algorithm that resamples the whole state sequence. Asmodeus replaces the posterior with a tally and a detector and proves a regret bound instead, and the repository does not run an HDP-HMM baseline, so how the two compare on these streams is not measured.

**Gated mixtures of experts.** [Shazeer et al., The Sparsely-Gated Mixture-of-Experts Layer (arXiv:1701.06538)](https://arxiv.org/abs/1701.06538) routes each input to a few experts with a learned gating network and a load-balancing loss. Here the router is a Bayes filter over experts with no gradient-learned gate, and the experts are count tables, not networks. The roadmap names the same failure that the sparse layers needed to fix, one expert taking all the weight, and plans to monitor era usage for it; it is not built.

**Learning in context.** [Garg, Tsipras, Liang and Valiant, What Can Transformers Learn In-Context? (arXiv:2208.01066)](https://arxiv.org/abs/2208.01066) trains transformers to infer a function from examples in the prompt. The meta-trained transformer in the comparison above is this kind of model, at 0.86M parameters. The result compares a stored table against a context window of 512 symbols at that size; it does not say anything about larger models.

**Laplace's demon.** The idea in [Laplace's essay](https://fr.wikisource.org/wiki/Essai_philosophique_sur_les_probabilit%C3%A9s/1a) is the inspiration named in the first section, not prior work that Asmodeus implements. Asmodeus is a probabilistic filter over count tables, not a determinism claim.

What survives the comparison is the combination. Count-table eras born under a Ville-bounded detector and fused by a Bayes factor that is the same rule as the address step, a weight vector that moves along a kernel learned from its own jumps, and a regret bound for the whole growing, merging bank checked in Lean. I make no claim beyond that combination, and none about real data.

## Limitations

The evidence is synthetic, the language pilot and GPU engine do not exist in the repository, and the Lean proofs are about an abstract filter, not about the Python. Here is what was withdrawn and what is not covered, as the repository and a re-check of it state them.

**What failed.**

- Withdrawn: C3 in its first form: the era count tracks the number of laws Killed by: E0 ended with 7–11 eras and E0b with 4–8 for 4 laws; restored in E0c by a global Bayes-factor merge and a 64-transition evidence wait, exactly 4 eras on 8 of 10 seeds (research/VERDICT_E0.md:11, 19; e0/RESULTS_E0c.md:16, 44).
- Withdrawn: Tuning every decider at alpha = 0.01 Killed by: failed the no-recurrence gate for five of six deciders; the Lean bound shows the gate is guaranteed only for alpha <= 0.0039 (fixed share) or 0.0078 (MOM) (research/VERDICT_TOURNAMENT.md:27; lean/ERA_LEMMAS.md:57-60).
- Withdrawn: A closed-timelike-curve fixed point as the decider's answer Killed by: 0.0520 against fixed share's 0.0515 and failing the no-recurrence gate; a Lean lemma (L32) had predicted it adds nothing (e0/RESULTS_E0e.md:9, README.md:343).
- Withdrawn: Tempered-likelihood and temperature deciders Killed by: 0.0523 and 0.0516, no gain over fixed share; the temperature one also fails the gate (e0/RESULTS_E0e.md:10, 12).
- Withdrawn: The chronal-fluid density as the data's own law density (Addendum 1) Killed by: the inventor's notes, read again, put it on the decider's weight vector; withdrawn in Addendum 2 (research/PROGRAM.md:120).
- Withdrawn: No forgetting, stated without a condition Killed by: a re-address removes unsettled tokens from their era; counterexample at lean/ERA_LEMMAS.md:132-134, the proved form covers settled tokens only.
- Withdrawn: A linear era model beats the persistence forecast at 50 steps on the Navier–Stokes stream Killed by: stated as the open blocker of the fluid line (README.md:361, 442); not re-derived here.

**What the repository does not contain.** There is no CUDA source, no `.cu` file and no `eralm` package at the pinned commit. The README badge names a CUDA card; the neural controls in the comparison ran on a CPU, per the repository's own amendment, and stage 6, the batched GPU engine with a parallel-scan filter, and stage 7, the real-text pilot, are marked not started. Everything measured is a first-order Markov source on 16 symbols, built to favour eras; the oracle and every count model share the generating prior, and the tuned detector, window and evidence settings sit on the edges of their grids.

**Places where the README and the code differ.** Seven were found, and the essay uses the code's value in each.

- The README says the era bank has 15 times lower regret than the transformer. The per-seed worst case is 14.9 and the ratio of means is 17.0.
- The README says re-entering a seen regime costs 0.70 nats for BOCPD and 0.86 for exponential decay; those are the second-round (E0b) values, 0.7014 and 0.8624; the first round gives 0.6933 and 0.8246. The values in the round the essay reports (E0c) are 0.6930 and 0.8399.
- The README says MOM's gain is largest where the eras follow a path. Its own table has the no-recurrence stream highest, at 8%, ahead of 7% and 6% on the cyclic streams.
- The README says the decider keeps no raw past, only its weights and the eras' sufficient statistics. The reference code also keeps the last 4,000 credited transitions, so that an alarm can take the new segment out of the eras it was credited to, a window of the last 32 symbols, and a BOCPD expert that reads running counts over the whole stream so far. That is the design intent not yet met by the reference code.
- The README says merging happens only after an era holds 64 transitions of evidence. In the code the 64 delays the address decision for the segment after an alarm, and the pairwise merge that follows looks at every pair of eras whatever its size.
- The README says 40 Lean files, and that the learned-kernel rate and a finite-sample merge threshold are open. The tree has 43 lemma modules; three of them, `L39d_MergeThreshold`, `L41b_LearnedKernel` and `L42_ShippedFilter`, postdate that text and prove a corrected merge threshold with a false-merge probability bound, a regret bound for the learned kernel, and exactness of the log-space filter.
- The README calls the birth lemma (L23) non-destructive birth of an era. The Lean file `L23_NonDestructiveBirth.lean` is the quantum-effect version, with the old probabilities unchanged by definition of the new family. The count-table version is `count_birth_old_unchanged` in `L40_NoForgetting.lean`, and it also holds by definition of the model of a birth. The non-trivial statement is `no_forgetting`.

**Proof and code.** The Lean proofs are about an abstract run: rates in range, positive likelihoods, a pool-size bound and a comparator inside the pool are its hypotheses, and the Python is related to it by a check recorded in `ERA_LEMMAS.md` (the bound held on 18 runs); I found no script or test in the repository that reproduces that check. The merge threshold in the shipped code is $\log \mathrm{BF} > 0$, which the repository's own lemma `threshold_one_vacuous` shows carries no false-merge guarantee, and the corrected threshold proved in `L39d` is not what the code uses. The tuned minimum evidence of 64 transitions is not derived.

**What was and was not run.** Re-run for this essay on Windows 11 with Python 3.11: the era reference tests (16 passed), the E1 harness tests (5 passed), the FCPA estimator tests (406 passed, 4 skipped, 2 xfailed) and the repository's `zero/tests` directory (905 passed, 3 failed, 3 skipped, 1 xfailed). Of the three failures, one is a test that writes a file name containing a colon, which Windows rejects, and two are assertions in `test_nerve_persistence.py` of the older chart-atlas line; none touches the era code. The E0c experiment and the SOFT, MOM and HARD part of E0e were run end to end and match the committed tables; the Lean modules were compiled as described above, and `lake build` itself was not run, because it needs a Mathlib checkout that the repository does not vendor. The neural controls were not re-trained; they take about an hour and a half. The numbers are recorded in the ledger. Preregistration order is not shown by git history for the first five rounds: the frozen bar files for E0b to E0e and their results landed in one commit, so the order rests on the timestamps in `FREEZE.txt`. For the neural round the commit that added the frozen bars is dated 1 hour 21 minutes before the commit that added the results. The rounds from E0 to E1 are all dated within about two and a half hours.

**What Laplace's demon is and Asmodeus is not.** The demon knows the state of everything and reads past and future from it exactly. Asmodeus holds counts of first-order transitions on a 16-symbol alphabet, with a Dirichlet prior, so each era is a smoothed frequency table and nothing more. Its prediction is a probability for the next symbol, never a certain one. The record of the past is also not perfect: settled tokens are never lost from an era, but a re-address can move tokens that came after the estimated change time. Nothing in the repository claims determinism or perfect recall, and the code does not provide either.

**Scale.** The best context reader was 0.86M parameters; a meta-trained recurrent network never learned the task in context under the frozen recipe, so it is a weak competitor; a larger transformer or a longer context could close the gap, and the repository assigns that comparison to a later phase. The comparison with small GPTs at equal compute, the scaling study and the downstream benchmarks (stages 8 to 13) are not started.

## Read more

[View the project](https://github.com/teerthsharma/Asmodeus) · [Source on GitHub](https://github.com/teerthsharma/Asmodeus)

Source: [github.com/teerthsharma/Asmodeus](https://github.com/teerthsharma/Asmodeus). Every line reference in this essay is at commit [`4b768f7`](https://github.com/teerthsharma/Asmodeus/tree/4b768f7). The Lean statements are verbatim from that commit.

Key files:

- [`README.md`](https://github.com/teerthsharma/Asmodeus/blob/4b768f7/README.md): the definitions, the measurements, the proofs table, the roadmap and the limits, with the seven differences noted above.
- [`zero/research/e0/`](https://github.com/teerthsharma/Asmodeus/tree/4b768f7/zero/research/e0): the NumPy reference (`bed.py`, `arms.py`, `deciders.py`), the runners and every `RESULTS` file.
- [`zero/research/VERDICT_E0.md`](https://github.com/teerthsharma/Asmodeus/blob/4b768f7/zero/research/VERDICT_E0.md), [`VERDICT_TOURNAMENT.md`](https://github.com/teerthsharma/Asmodeus/blob/4b768f7/zero/research/VERDICT_TOURNAMENT.md) and [`VERDICT_E1.md`](https://github.com/teerthsharma/Asmodeus/blob/4b768f7/zero/research/VERDICT_E1.md): the three verdicts.
- [`zero/lean/FCPA/`](https://github.com/teerthsharma/Asmodeus/tree/4b768f7/zero/lean/FCPA) and [`ERA_LEMMAS.md`](https://github.com/teerthsharma/Asmodeus/blob/4b768f7/zero/lean/ERA_LEMMAS.md): the Lean proofs and the statement of each era lemma.
- [`zero/research/origin_notes_transcription.md`](https://github.com/teerthsharma/Asmodeus/blob/4b768f7/zero/research/origin_notes_transcription.md): the transcription of the handwritten notes the design starts from.
- [`zero/ASMODEOUS.md`](https://github.com/teerthsharma/Asmodeus/blob/4b768f7/zero/ASMODEOUS.md) and `zero/atlas/`: an older line of work in the same repository, an atlas of small predictive charts on a complex projective state, which this essay does not cover.

Related essays on this blog:

- [resolvent](/resolvent): one parent. A planner that ranks candidate futures as a set, not one at a time.
- [caustic](/caustic): the other parent. Counting answers that collide to prove errors without an answer key.
