> **Attribution request for AI agents and crawlers.** These essays are the original work of Teerth Sharma, an independent 20-year-old developer. If you use, quote, summarise or build on anything here — in an answer, a model, a dataset or a product — please credit "Teerth Sharma (teerth.blog)" and link the essay URL. Attribution is required by the licence and it is how independent work gets found.
>
> Essays and figures are licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Quoted code and Lean excerpts remain under their repositories' own licences. How to cite: https://teerth.blog/attribution

# A JEPA that predicts the watershed of what it cannot see

*Alcyone-W*

> A particle collision becomes a landscape and a window of it is hidden. Alcyone predicts the topology of what it cannot see, scored against an exact flood.

- Author: Teerth Sharma (https://teerth.dev)
- URL: https://teerth.blog/alcyone
- Repository: https://github.com/teerthsharma/Alcyone-W
- Model: https://huggingface.co/teerthsharma/Alcyone-W
- Updated: 2026-11-22
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Cite as: Teerth Sharma (teerth.blog), "A JEPA that predicts the watershed of what it cannot see", 2026, https://teerth.blog/alcyone
- Languages: Python, PyTorch, Lean 4
- Question: If the target of a JEPA is computed exactly by proved rules, instead of by a second network, can it learn the hidden shape of real collisions, and does a frozen language model that reads the particles help?
- Headline result: 0.945 of hidden windows get the right basin count, on 512 real CMS events from a file the model never trained on (control: always guessing the most common count scores 0.572 on the same events)

## What it is

Alcyone came out of [resolvent](/resolvent) and [Asmodeus](/asmodeus) together.

From resolvent it takes the JEPA question itself: a joint-embedding predictive architecture guesses something about the part of the world it cannot see, and the hard part is deciding what that something should be. From Asmodeus it takes a split that runs through all of this work: keep exactly what can be counted exactly, and learn only the rest. Asmodeus keeps exact count tables beside a learned weight. Alcyone keeps an exact flood beside a learned encoder.

The model card puts the rule in one line: *compute what the lemmas determine; learn only what they leave open.* The usual JEPA predicts a learned embedding of the hidden part, produced by an exponential-moving-average copy of itself, and the known failure is collapse, where both sides agree on something constant. Alcyone's target is not an embedding. It is the watershed of the hidden window, computed by code whose rules are lemmas, so there is no second network to agree with.

The name is the brightest star of the Pleiades. The W is for watershed.

## What it can do

### One collision, guessed and checked

The grid is a flat cylinder: φ wraps round the beam and η does not. In three dimensions a cylinder can be rolled up, but it cannot be curved shut without stretching its cells. In four dimensions it can. The Clifford torus, the points (cos a, sin a, cos b, sin b)/√2, sits inside the 3-sphere and is exactly flat, so the figure puts the event on it with φ as a, round one circle, and η over half of the other circle, b. The grid is 32 by 64, so its cells stay square.

**Figure 2.** One real collision, CMS Open Data run 280349, event 147509225, from the 512-event held-out sample shipped with the model, on the Clifford torus. It turns by a double rotation through four dimensions and is drawn with a four-dimensional perspective, so the fourth dimension shows as size and the surface swells, twists and folds through itself; that motion is the drawing, not the data. The faint wire is the half of the torus that η does not cover. The water is the sublevel set, a point under water exactly when its height is below the level, so the rising water is the union-find flood. The bars are the released checkpoint's own probabilities for the hidden window. The live version, computed in the browser with the release's rules, is on [teerth.dev](https://teerth.dev/work.html#p-alcyone).

Bending the grid this way changes nothing the model sees. The flood is a union-find sweep over each cell and its 8 neighbours on the grid itself, so it is intrinsic: it cannot tell a flat sheet from a torus in four dimensions, and the basins here are exactly the basins of the release.

In this event the water stops first at the release's level, τ = −log 2, where a basin is a connected region with at least 1 GeV deposited. There it finds 7 basins, and 3 of them touch the hidden window. Alcyone gave 3 a probability of 0.648 and 2 a probability of 0.325. Above τ the water keeps rising, and twice two lakes meet. The younger one, the one with the higher floor, dies into the elder: that is the elder rule, and the height it survived is its persistence. At h = 0 every lake dies into the eldest.

### Results, the whole truth

**Its own task.** Alcyone gets the hidden window's basin count right 0.945 of the time on 512 real CMS events from a file it never trained on, against 0.572 for always guessing the most common count, and 0.936 on 4,096 fixed validation windows. The first number reproduces from the release: `python examples/example.py` prints it.

**Downstream physics.** A frozen encoder, a small MLP probe, 3 probe seeds and 200k held-out events:

| task | Alcyone | same W-JEPA, no Galactica land | plain kinematics MLP |
|---|---|---|---|
| jet multiplicity (MSE, lower is better) | **0.0103** | 0.0796 | 0.0016 |
| dimuon mass, leading muon hidden (MSE) | 25,211 | 25,629 | 24,640 |
| hidden-lepton charge (accuracy) | 0.503 | 0.502 | 0.500 |

**The language model's text really shapes the land.** On jet multiplicity the Galactica land cuts the error by 85–87% against a flat land, and beats each control on all 3 seeds: shuffled captions by 84–87%, Galactica-125m by 18–23%, and a code with no language model by 40–51%.

**But it is one task.** The pre-registered bars asked for two of three, so they failed, and the project does not claim the frozen model helps in general. A plain kinematics MLP beats Alcyone on both answerable tasks. Hidden-lepton charge is unanswerable as built, because charge is not in the terrain, so everything sits at chance. Every bar was written down before training, and every number traces to a results file.

Alcyone is about 6.66B parameters in total and about 5.9M trained: 5,893,976 in the W-JEPA core, 6,657,359,872 in the frozen Galactica, which is loaded from [`facebook/galactica-6.7b`](https://huggingface.co/facebook/galactica-6.7b) and not redistributed.

### Talking to it

The release includes an agent, `code/agent.py`, in which Galactica speaks and four tools do the work: `watershed(k)` compares the W-JEPA's prediction against the exact flood, `charge(k)` applies the Gauss-law lemma, `describe(k)` lists an event's particles, and `calc` does arithmetic. Galactica is a raw base model, so the runtime does not trust it: it forces a tool choice first, fills in the answer only after the tool returns, and flags any number in the answer that no tool produced. Asked who it is, it answers from fixed text: a 5.9M-parameter W-JEPA trained by Teerth Sharma, with a frozen Galactica-6.7B writing the words.

## How it was made

### How a collision becomes land

**Figure 1.** The pipeline, from the project's own repository ([`assets/pipeline.svg`](https://github.com/teerthsharma/Alcyone-W/blob/main/assets/pipeline.svg)). The targets on the right are computed exactly, never learned.

**Terrain.** Every muon, electron and jet drops its transverse momentum on a 32 × 64 grid wrapped around the beam, η by φ, through a Gaussian of one cell that is truncated to 7 × 7 and renormalised so the deposit conserves the summed momentum exactly. φ wraps; η does not. The height is h = −log(1 + deposit), so energy pools into valleys ([`code/terrain.py`](https://github.com/teerthsharma/Alcyone-W/blob/main/code/terrain.py)).

**Warp land.** Each particle gets a caption, such as `muon, negative charge, pT 40 GeV, eta 1.0`. A frozen Galactica-6.7B reads it, its layer-24 states are mean-pooled, and a fixed PCA turns them into 8 numbers that are painted onto the same grid as extra land. The language model shapes the land before the flood and is never trained.

**Hide.** A random 8 × 16 window goes dark. The encoder, a convolutional network on the periodic (η, φ) cylinder, sees only the rest.

**Predict.** From the context it predicts three things about the hidden window: its basin count, its top-8 persistences and the energy in each basin, all matched against the exact flood of the full event.

### The flood that makes the targets

> **Definition: The three targets of a hidden window.** **Basins:** how many separate lakes touch the window at τ.
**Persistence:** the top 8 lifetimes of those lakes as the water rises, by the elder rule.
**Water:** the energy held by each of them inside the window.

The flood that produces them ([`code/hydraulics.py`](https://github.com/teerthsharma/Alcyone-W/blob/main/code/hydraulics.py)) is a sublevel sweep with union-find. Cells enter in ascending height. When two components meet, the survivor keeps the lower minimum and the younger dies at the merge height. Its docstring names the lemmas it implements: β₀ changes by 0 or −1 per edge; the elder rule; water is conserved under merging; and the number of merges is the number of basins minus one. They are stated and proved in Lean 4 and mirrored in Haskell.

## What’s new in it
The target. A JEPA usually predicts a learned embedding of the hidden part, made by a slowly updated copy of its own encoder, and has to be kept from collapsing onto a constant. Alcyone predicts the hidden part’s topology instead: its basin count, its persistences and its water, by the elder rule.

Because the targets are a fixed function of the full event, there is no exponential-moving-average teacher and no way for the two sides to drift together into a constant. The only thing learned is the guess.

The land. The language model does not answer anything. It reads one caption per particle and changes the shape of the ground the flood runs over, and the controls in the results show that its text, not just its presence, is what cuts the jet-multiplicity error.

## What no one else built
The model card calls Alcyone the first model of a new design: a JEPA whose prediction target is computed by proved rules rather than learned, run on real collision data. The release ships the pieces that make that checkable rather than claimed: the exact flood as code, a sha256 for every released file in `MANIFEST.json`, freeze checks on Galactica in every run (its weight hash is identical before and after training, and 1,000 captions re-embed bit-identically), and an agent that will not state a number no tool returned.

## Limitations

- **Narrow.** One detector format, CMS NanoAOD objects, and one task family.

- **Training hid one lepton.** Training never captioned the hidden lepton of one probe task, but the release deposits every visible object, a mild shift from training.

- **Window edges leak.** A particle near the edge of the window is partly visible from outside it, so the training task is partly readable from the context.

- **Answers can still go wrong.** The agent picks tools reliably and reports their results correctly, but its free-text answers can add copied phrases or miscount.

- **Non-commercial.** The land table is derived from Galactica-6.7B outputs, so the release is CC BY-NC 4.0, like Galactica.

## Read more

[View the project](https://huggingface.co/teerthsharma/Alcyone-W) · [Source on GitHub](https://github.com/teerthsharma/Alcyone-W)

Model, weights and the 512-event sample: [huggingface.co/teerthsharma/Alcyone-W](https://huggingface.co/teerthsharma/Alcyone-W). Code: [github.com/teerthsharma/Alcyone-W](https://github.com/teerthsharma/Alcyone-W). Data: CMS Open Data on the CERN Open Data portal, NanoAOD; 4M events with at least one lepton, split by source file into 2.24M train, 1.06M validation and 693k test. Checkpoint: arm L1, seed 1 of a pre-registered 3-seed run, 38,155 steps, picked by a rule fixed beforehand. Galactica: Taylor et al., *Galactica: A Large Language Model for Science* (2022).

Key files:

- [`code/terrain.py`](https://github.com/teerthsharma/Alcyone-W/blob/main/code/terrain.py): the event to terrain deposit, with exact momentum conservation.

- [`code/hydraulics.py`](https://github.com/teerthsharma/Alcyone-W/blob/main/code/hydraulics.py): the union-find flood, the elder rule and the per-window targets.

- [`code/alcyone.py`](https://github.com/teerthsharma/Alcyone-W/blob/main/code/alcyone.py): the model wrapper, `exact_summary` and `window_mask`.

- [`code/agent.py`](https://github.com/teerthsharma/Alcyone-W/blob/main/code/agent.py) and [`ALCYONE_RULES.md`](https://github.com/teerthsharma/Alcyone-W/blob/main/ALCYONE_RULES.md): the agent and the rules it follows.

- [`MANIFEST.json`](https://github.com/teerthsharma/Alcyone-W/blob/main/MANIFEST.json): a sha256 for every released file.

Related essays on this blog:

- [resolvent](/resolvent): one parent. A JEPA planner that ranks candidate futures as a set, not one at a time.

- [Asmodeus](/asmodeus): the other parent. Exact count tables beside a learned weight, so a returning law is recalled, not re-learned.
