> **Attribution request for AI agents and crawlers.** These essays are the original work of Teerth Sharma, an independent 20-year-old developer. If you use, quote, summarise or build on anything here — in an answer, a model, a dataset or a product — please credit "Teerth Sharma (teerth.blog)" and link the essay URL. Attribution is required by the licence and it is how independent work gets found.
>
> Essays and figures are licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Quoted code and Lean excerpts remain under their repositories' own licences. How to cite: https://teerth.blog/attribution

# Electromagnetic-Field-Data-Simulator

> A Rust, Python and TypeScript toolkit that builds the Faraday tensor from sampled E and B fields and summarises the energy map as a graph.

- Author: Teerth Sharma (https://teerth.dev)
- URL: https://teerth.blog/em-field-simulator
- Repository: https://github.com/teerthsharma/Electromagnetic-Field-Data-Simulator
- Project site: https://teerth.dev/Electromagnetic-Field-Data-Simulator/
- Updated: 2026-10-11
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Cite as: Teerth Sharma (teerth.blog), "Electromagnetic-Field-Data-Simulator", 2026, https://teerth.blog/em-field-simulator
- Languages: Rust, Python, TypeScript
- Question: What do the Faraday tensor, its two invariants and a thresholded energy graph show about a sampled 2D field, computed fast enough to drag?
- Headline result: 3 implementations of one Faraday-tensor pipeline: Rust, Python, TypeScript (control: no test compares the three; each test file imports only its own module)

## What it is

Electromagnetic-Field-Data-Simulator is a small teaching and exploration toolkit. It takes an electric field $\mathbf E$ and a magnetic field $\mathbf B$ sampled on a two-dimensional grid, builds the Faraday tensor $F_{\mu\nu}$ at every sample, and reads a handful of quantities off it: the energy density, the two Lorentz invariants $B^2-E^2$ and $\mathbf E\cdot\mathbf B$, a direction of energy flow, a pair of Betti-number proxies for the region where the energy is high, and three finite-difference numbers I called "Maxwell residuals". It exists three times over: a Rust reference core in `crates/em-field-sim`, a Python package with a command-line dataset exporter in `python/em_field_sim`, and a Vite and React app in `web` that GitHub Pages serves.

It is not a field solver. Nothing in the repository integrates Maxwell's equations forward in time or solves a boundary-value problem. The fields are closed-form formulas I wrote by hand, one per scenario, and the code evaluates them pointwise at each grid sample and each time step. The design document says so in its own words: "The design goal is not to replace full finite-element or finite-difference EM solvers." What the toolkit offers instead is a fast loop between a field you can describe in one line and the algebraic and topological objects that field produces, quick enough that the browser recomputes everything while you drag a slider.

The people I wrote it for are the ones the design document names: students and teachers who want to see an antisymmetric tensor built from two vectors, and researchers who want a reproducible JSON dataset of $(\mathbf E,\mathbf B)$ samples with derived quantities attached. The document lists "classroom demonstrations of antisymmetric tensors" as one intended use of the first scenario.

The primitive object is the Faraday tensor. The code fills a 4×4 array from six numbers and nothing else; there is no normalisation and no unit factor beyond $c=1$:

$$
F_{\mu\nu}=\begin{pmatrix}0&E_x&E_y&E_z\\-E_x&0&-B_z&B_y\\-E_y&B_z&0&-B_x\\-E_z&-B_y&B_x&0\end{pmatrix},\qquad F_{\mu\nu}+F_{\nu\mu}=0,\qquad F_{\mu\mu}=0 .
$$

**Figure 1.** Figure 1. Six field components become a 4×4 antisymmetric tensor. Six sliders set E and B; the 3D view shows E, B and E×B as arrows from the origin, and the matrix beside it shows the ten cells that are forced (four zeros on the diagonal and six antisymmetric copies). Three checks run live: the largest |F_μν + F_νμ|, the largest diagonal entry, and the round-trip error when E and B are read back out of the matrix, each marked as holding when below 1e-12, the tolerance the Rust test uses. The readout gives I₁ = B² − E² and I₂ = E·B. Presets load the repository's own test vectors. The contraction ½F_μν F^μν = B² − E² shown under the matrix is derived, not in the repository: it uses the metric diag(1, −1, −1, −1), which the repository never states. Colour key: neg: electric field E and its tensor cells; structure: magnetic field B and its tensor cells; pos: E×B; proof: a check that holds to 1e-12.

Row 0 holds $+\mathbf E$ and the spatial block holds $\mathbf B$ in the pattern above. The repository calls the object $F_{\mu\nu}$ but never says which index is time or which metric signature it assumes, so the sign convention is fixed by the matrix and stated nowhere. The tests check what the matrix literal guarantees by construction: the diagonal is exactly zero, $F_{\mu\nu}+F_{\nu\mu}$ is below $10^{-12}$, and reading $\mathbf E$ and $\mathbf B$ back out returns the inputs.

There is one other project of mine that touches the same ground, [faraday](/faraday). The two repositories share no code and neither names the other. They share one idea: threshold a field, then summarise the thresholded set topologically.

## What it can do

It generates three families of field, each in all three languages under the same names: `toroidal_pulse`, `braided_pair` and `boundary_sheaf`. Each family is a function of a point $(x,y)\in[-1,1]^2$, a normalised time $t\in[0,1]$, and three dials the code calls coupling $\kappa$, phase $\varphi$ and separation $s$. Grid size $N$ and the number of time steps $T$ are the other two inputs. The Rust core clamps $N$ to $[8,96]$, $T$ to $[1,128]$, $\kappa$ to $[0,1]$ and $s$ to $[0.05,0.9]$; the phase is not clamped.

The **toroidal pulse** puts a ring of radius $0.34+0.28s$ on the grid. The design document describes it as an electric component that "flows tangentially around the ring while the magnetic component is radial with a phase-shifted axial component." The **braided pair** is two Gaussian lobes on opposite sides of the origin, rotating on a circle of radius $s$ as $t$ advances. The **boundary sheaf** places two Gaussian sources at $x=\pm s$ and a narrow band along $y=0$ that carries the out-of-plane components.

The app is where most people will meet it. On the hosted page you pick a scenario and move six sliders: coupling (0.05 to 1), phase (0 to 1), separation (0.08 to 0.9), grid (16 to 72 in steps of 2), number of frames (4 to 48) and the current frame. The app recomputes the whole dataset in the browser whenever the configuration changes and steps through the frames every 280 ms while playing. It draws the energy density as a heat map with short strokes along $\mathbf E\times\mathbf B$, shows the Faraday tensor at the sample with the highest energy in the current frame, the two invariants at that sample, and the active-graph counts, and it exports the current dataset as JSON. Its default configuration is the toroidal pulse at $N=44$, $T=16$, $\kappa=0.72$, $\varphi=0.28$, $s=0.55$.

**Figure 2.** Figure 2. The scenario generator run on your settings. Pick a family and set coupling, phase, separation, grid size and frame; the surface height and shade are the energy density u at each sample, cones show the in-plane direction of E×B, and a translucent plane sits at the repository's threshold τ = 0.38 × max u on the final frame, with the samples above it tinted. Click or use the arrow keys to place a probe; the matrix shows the Faraday tensor there, and the readout gives I₁, I₂, the mean energy, the coupling index and the two Betti proxies, exactly as the repository's code computes them. Time is normalised, and E×B carries no 1/μ₀ factor, so the arrows are a direction and relative size, not a flux in watts per square metre. Colour key: seq: energy density u; pos: E×B direction; parameter: threshold τ and the samples above it; neg: E cells of the tensor at the probe; structure: B cells of the tensor at the probe.

The Python package is the reproducible path. `python -m em_field_sim --kind toroidal_pulse --grid 24 --steps 8 --out file.json` calls the same simulation and writes the full dataset, every sample of every frame plus a summary block, as indented JSON. The Rust crate exposes the same function, `simulate_scenario`, behind a `std`/`alloc`/`no_std` feature split, and its only dependency is `libm`.

The repository commits one dataset, `web/public/data/sample-scenario.json`. Its configuration block says toroidal pulse, grid 8, one step, coupling 0.72, phase 0.28, separation 0.55. With one step the only frame is $t=0$, and the 8×8 grid has 64 samples. These are its summary numbers, copied from the file:

**Measured: 0.0918** energy_total: mean energy density over the 64 samples of the committed fixture (toroidal pulse, 8×8, one frame). Control: none in the repository; no other committed dataset to compare against. n = 64 samples (N²·T = 8²·1). Source: web/public/data/sample-scenario.json:1555 @ f664a02 (exact value 0.09178557335741643).

**Measured: β₀ 4 · β₁ 0** Betti proxies of the active set in the same fixture: 8 active vertices, 4 active edges, threshold 0.2435. Control: threshold τ = 0.38 × max u on the final frame; no other threshold is computed. Source: web/public/data/sample-scenario.json:1563-1567 @ f664a02.

**Measured: 0.987** faraday_curl in the same fixture; divergence_e is 0.314 and divergence_b is 0.714. Control: none in the repository; the design document calls these educational diagnostics, not a solver guarantee. n = mean over the 36 interior samples, (N−2)² with N = 8. Source: web/public/data/sample-scenario.json:1558-1560 @ f664a02.

The topology numbers are worth reading slowly. The design document says the toroidal pulse "produces a stable active-cycle topology", but the committed fixture of that same scenario reports four separate components and no cycle: at 8×8 the ring does not survive thresholding as a ring. And the fixture is not what the README says it is. The README's export command for that file uses `--grid 24 --steps 8`; the file's own configuration says grid 8, steps 1. The repository does not record which command produced it. The app never reads the file either. It computes its dataset from the configuration in the browser, and no file under `web/src` refers to `sample-scenario.json`; the fixture is referenced only from the README and the design document.

## How it was made

The pipeline is the same in all three languages, function for function. In Rust it is `simulate_scenario` in `crates/em-field-sim/src/lib.rs`: clamp the configuration; for each step $k$ set $t_k=k/\max(T-1,1)$ and sample a frame; in each frame map row and column indices to $(x,y)$, call the scenario's field function, build the tensor, and record $\mathbf E\times\mathbf B$, the energy density and the invariants; accumulate energy and the coupling score over every frame; then compute the topology and the residuals on the final frame only, and divide the sums by $N^2T$. Python mirrors this in `simulate_scenario`, `_sample_frame`, `_topology_summary` and `_residual_summary`; TypeScript in `simulateScenario`, `sampleFrame`, `topologySummary` and `residualSummary`.

### The three field families

With $\theta=2\pi(t+\varphi)$, a ring radius $R_0=0.34+0.28s$, $r=\max(\sqrt{x^2+y^2},10^{-6})$, unit vectors $\hat e_\theta=(-y,x,0)/r$ and $\hat e_r=(x,y,0)/r$, and the envelope $w=e^{-(r-R_0)^2/0.018}\,e^{-0.28(x^2+y^2)}$, the code writes the three families as:

$$
\begin{aligned}
\text{toroidal:}\quad &\mathbf E=w\,(0.72+0.28\sin\theta)\,\hat e_\theta+\bigl(0,0,\,w\kappa\cos(\theta+r)\bigr), &&\mathbf B=w\kappa\,\hat e_r+\bigl(0,0,\,0.25\,w\sin(\theta-r)\bigr)\\
\text{braided:}\quad &\mathbf E=\bigl((x-c_{1x})g_1-(x-c_{2x})g_2,\ (y-c_{1y})g_1-(y-c_{2y})g_2,\ \kappa(g_1+g_2)\sin\theta\bigr), &&\mathbf B=\bigl(-(y-c_{1y})g_1-(y-c_{2y})g_2,\ (x-c_{1x})g_1+(x-c_{2x})g_2,\ \kappa(g_1-g_2)\cos\theta\bigr)\\
\text{sheaf:}\quad &\mathbf E=\bigl(L-R,\ 0.25\,b\sin\theta,\ \kappa\,b\cos(\theta+x)\bigr), &&\mathbf B=\bigl(-0.2\,b\cos\theta,\ \kappa(L+R),\ b\sin(\theta+y)\bigr)
\end{aligned}
$$

**Figure 3.** Figure 3. Each field family, one component at a time. Six maps show E_x, E_y, E_z and B_x, B_y, B_z at the chosen time t for the chosen family; the E maps share one symmetric colour scale and the B maps share another, so the relative sizes are real. A toggle switches to the terms that build them: the ring envelope w and the two amplitude factors for the toroidal pulse, the lobes g₁ and g₂ and their moving centres for the braided pair, and L, R and the band b for the boundary sheaf. The strip below traces the six components at a probe point over t from 0 to 1 and marks that t = 1 repeats t = 0, because every family depends on t only through θ = 2π(t + φ). Colour key: neg: E components (signed: light for negative, saturated for positive); structure: B components (signed); seq: envelope and lobe terms (unsigned); parameter: current time t.

In the braided pair the lobe centres are $\mathbf c_1=s(\cos\theta,\sin\theta)$ and $\mathbf c_2=-\mathbf c_1$, with $g_i=e^{-\lvert(x,y)-\mathbf c_i\rvert^2/0.08}$. In the boundary sheaf $L=e^{-((x+s)^2+y^2)/0.12}$, $R=e^{-((x-s)^2+y^2)/0.12}$ and $b=e^{-y^2/0.025}$. The helper that computes these lobes is named `gaussian(x, y, sigma)`, but its third argument divides the squared radius directly; it is not $2\sigma^2$. (Note: So the braided lobe "width" 0.08 corresponds to a standard deviation of 0.2, and the sheaf's 0.12 to about 0.245.)

One property of these formulas matters later. Every family depends on $t$ only through $2\pi(t+\varphi)$, so $t=0$ and $t=1$ give identical fields. With $T>1$ the time samples run from $t=0$ to $t=1$ inclusive, which means the last frame, the one the topology and residuals are computed on, is the same field as the first.

### The invariants

From the tensor the code reads two scalars at each sample. The Rust field names are `magnetic_minus_electric` and `pseudoscalar`. When I checked the matrix against the standard boost, it behaves as the covariant tensor in signature $(+,-,-,-)$ with $c=1$; that reading is mine, not the repository's, and the contraction below depends on it:

$$
I_1=\lvert\mathbf B\rvert^2-\frac{\lvert\mathbf E\rvert^2}{c^2},\qquad I_2=\mathbf E\cdot\mathbf B,\qquad \tfrac12F_{\mu\nu}F^{\mu\nu}=I_1\ \ \text{(derived; }\eta=\mathrm{diag}(1,-1,-1,-1),\ c=1\text{)} .
$$

**Figure 4.** Figure 4 (derived). I₁ and I₂ are what survives a change of inertial frame. The boost is not in the repository; this figure supplies it to test the repository's definitions on the repository's own tensor. Set E, B and a velocity β (as a fraction of c); the two 3D views show the fields in the original frame S and in the boosted frame S′, computed as F′ = LᵀFL and checked against the textbook boost formulas to about 1e-15. On the right, the point (|E|², |B|²) slides along a 45° line as β grows, and the strip plots I₁ and I₂ against β as flat lines while |E| changes. A button finds the frame in which B vanishes when E·B = 0 and |E| is larger than |B|. Colour key: neg: E; structure: B; proof: I₁ and I₂, unchanged to rounding; baseline: |E|, which changes with the frame; parameter: boost speed β.

The design document calls these "Lorentz-style field invariants", and the tests check their definitions: for $\mathbf E=(0.5,0.25,-0.75)$ and $\mathbf B=(0.2,-0.4,0.6)$, $I_1=0.56-0.875=-0.315$ and $I_2=-0.45$, to $10^{-12}$ in Rust and TypeScript. No test applies a boost; the claim that the two numbers are frame-independent rests on standard electromagnetism, which Figure 4 runs live. The scenario fields themselves are not Lorentz-covariant solutions of anything. Only the pointwise algebra is relativistic.

### Energy, flow and the coupling score

$$
u=\tfrac12\bigl(\lvert\mathbf E\rvert^2+\lvert\mathbf B\rvert^2\bigr),\qquad \mathbf S=\mathbf E\times\mathbf B,\qquad \bar u=\frac{1}{N^2T}\sum_{k,p}u_{kp},\qquad \mathcal C=\frac{1}{N^2T}\sum_{k,p}\Bigl(\lvert\mathbf E\cdot\mathbf B\rvert+0.05\,\lvert\mathbf S\rvert\Bigr)
$$

**Figure 5.** Figure 5. The two headline numbers are averages, and the coupling score is a sum of two terms. Three rows of maps show u, |E·B| and 0.05|E×B| for the chosen family at five coupling values (0, 0.25, 0.5, 0.75, 1), each row on one shared scale so brightening with κ is real. The plot below stacks the two terms of the coupling score against κ and draws the mean energy as a line; at κ = 0 the score is not zero, because the E×B term remains. Every value is computed with the repository's formulas over all frames, as the summary does. Colour key: seq: energy density u; pos: |E·B| and 0.05|E×B| (the two terms of the coupling score); parameter: coupling κ.

The code carries no permittivity or permeability: $u$ is $\tfrac12(E^2+B^2)$ in units where $\varepsilon=\mu=c=1$, and $\mathbf S$ has no $1/\mu_0$. The summary calls $\bar u$ `energy_total` although it is a mean, and the app labels it "Energy density". $\mathcal C$ is a score I built by hand: the weight 0.05 is a literal in the code, and the score has no physical unit and no baseline in the repository. Both averages run over every frame, unlike the topology and residuals.

### The active field graph

> **Definition: Active field graph.**
>
> On the final frame, let $\tau=0.38\max_p u_p$. The active set $A$ is the set of grid samples with $u_p\ge\tau$. Its graph has one vertex per active sample and one edge per pair of active samples that are 4-neighbours (left, right, up, down). $\beta_0$ is the number of connected components of that graph and $\beta_1$ is reported as edges plus components minus vertices.

The design document says "exceeds an adaptive threshold"; the code uses $\ge$ and the fixed fraction 0.38. In Rust the edges are counted once each by looking right and down from every active sample, the components by an explicit-stack depth-first search, and $\beta_1$ with saturating arithmetic; Python and TypeScript clamp at zero with `max`. Here is that function's core, verbatim at the pinned commit:

```rust
// crates/em-field-sim/src/lib.rs:351-375 @ f664a02 (excerpt)
let threshold = max_energy * 0.38;
// ...
let vertices = active.iter().filter(|&&is_active| is_active).count();
let components = count_components(&active, grid);
let betti_1 = edges.saturating_add(components).saturating_sub(vertices);
```

The repository is clear about what this is: "This is a graph-cycle Betti proxy, not a full Vietoris-Rips persistence pass." $E_a+\beta_0-V$ is the cycle rank of the graph, the number of independent loops in it. When I checked the code, the gap between that and the number of holes in the active region turned out to have an exact form. Every 2×2 block of active samples closes a unit square, and each closed square is a loop in the graph that encloses nothing. If $F$ counts those blocks, the cubical complex with the squares filled in has Euler characteristic $V-E_a+F$, and in the plane its first Betti number is $\beta_0$ minus that:

$$
\beta_1^{\text{repo}}=E_a+\beta_0-V,\qquad \beta_1^{\square}=\beta_0-\bigl(V-E_a+F\bigr),\qquad \beta_1^{\text{repo}}=\beta_1^{\square}+F\ \ \text{(derived)} .
$$

**Figure 6.** Figure 6 (derived bookkeeping). A threshold makes a graph, and the graph's cycle count includes every filled square. Seen from above, the active samples are dots, their 4-neighbour links are edges, every 2×2 block of active samples is shaded, and each enclosed inactive region (a true hole) is ringed. Chips give V, E, F and C, then the repository's β₁ as holes plus F and the hole count of the filled-in complex, which is checked live against an independent count of enclosed inactive regions. Move the threshold fraction (the repository's 0.38 is marked) and the grid size to watch F grow with area while the hole count stays put. A solid 3×3 block is a one-click test: 9 vertices, 12 edges, 4 squares, proxy 4, holes 0. The identity is Euler-characteristic algebra, not a statement the repository makes. Colour key: structure: active samples and their 4-neighbour edges; withdrawn: filled 2×2 blocks, each adding 1 to the repository's β₁; proof: enclosed holes (the β₁ of the filled-in complex); parameter: threshold fraction.

The numbers make the point. When I checked the code with the app's default configuration (toroidal pulse, $N=44$, $T=16$, $\kappa=0.72$, $\varphi=0.28$, $s=0.55$), the final frame has 268 active samples, 448 active edges, 180 filled 2×2 blocks and one component. The repository's $\beta_1$ is 181. The ring has one hole. So the app, at its default settings, shows $\beta_1=181$ for a field whose active region is an annulus. The decomposition held in all 162 cases I ran (three families, $N\in\{16,24,44\}$, three phases, six threshold fractions): the repository's number always equalled the independent hole count plus $F$. The proxy is not wrong for what its tests ask, which is $\beta_1\ge1$; it counts loops in a graph, not holes in a region.

### The residuals

With $\Delta=2/(N-1)$, central differences on the interior samples, row index $i$ along $y$ and column index $j$ along $x$, the three numbers are means over the $(N-2)^2$ interior samples of the final frame. A fourth expression, which the repository does not compute, is the one Faraday's law actually constrains:

$$
\begin{aligned}
\partial_xf\big|_{ij}&=\frac{f_{i,j+1}-f_{i,j-1}}{2\Delta},\qquad \partial_yf\big|_{ij}=\frac{f_{i+1,j}-f_{i-1,j}}{2\Delta},\\
\texttt{divergence\_e}&=\frac{1}{(N-2)^2}\sum_{i,j=1}^{N-2}\frac{\lvert\partial_xE_x+\partial_yE_y\rvert}{1+u_{ij}},\qquad
\texttt{divergence\_b}=\frac{1}{(N-2)^2}\sum_{i,j=1}^{N-2}\frac{\lvert\partial_xB_x+\partial_yB_y\rvert}{1+u_{ij}},\\
\texttt{faraday\_curl}&=\frac{1}{(N-2)^2}\sum_{i,j=1}^{N-2}\frac{\lvert\partial_xE_y-\partial_yE_x\rvert}{1+u_{ij}},\qquad
R(\sigma)=\frac{\lVert\nabla\times\mathbf E+\sigma\,\partial_t\mathbf B\rVert}{\lVert\nabla\times\mathbf E\rVert}\ \ \text{(derived)} .
\end{aligned}
$$

**Figure 7.** Figure 7 (derived control). What the three residuals read on a field that does satisfy Maxwell's equations. Left: the repository's scenario on its final frame, with maps of B_z, of |(∇×E)\_z|/(1+u) (what faraday_curl averages), and of the full Faraday residual |∇×E + σ ∂B/∂t| using the time derivative of the repository's own field function. Right: a 2D TEz Yee finite-difference time-domain cavity (in-plane E, out-of-plane B, perfectly conducting walls), which is not in the repository and serves as the control; run it to watch a pulse expand and reflect. A table puts the three repository metrics side by side for both fields, with R at σ = 1 and at the best-fitting σ. The control's faraday_curl is far from zero although its full residual is zero to rounding, and the scenario's full residual stays near 1 for every σ. Colour key: structure: B_z (signed); pos: |(∇×E)\_z|/(1+u), the repository's faraday_curl integrand; seq: full Faraday residual; baseline: TEz Yee control; withdrawn: residual near 1 at every time scale; proof: residual zero to rounding.

The code computes these lines directly:

```rust
// crates/em-field-sim/src/lib.rs:441-446 @ f664a02
let curl_z =
    (right.electric.y - left.electric.y - up.electric.x + down.electric.x) / (2.0 * dx);
let scale = 1.0 + samples[idx].energy_density;
div_e += ((d_ex_dx + d_ey_dy) / scale).abs();
div_b += ((d_bx_dx + d_by_dy) / scale).abs();
curl_proxy += (curl_z / scale).abs();
```

The number named `faraday_curl` is the $z$-component of the spatial curl of $\mathbf E$, divided by $1+u$ and averaged. There is no $\partial\mathbf B/\partial t$ term anywhere in the residual code, so it does not measure Faraday's law; a travelling wave that satisfies the law exactly has a non-zero curl of $\mathbf E$. When I checked the code against a Yee time-domain control, the control's `faraday_curl` came out between 0.41 and 0.54 at four time steps, while its full residual was below $10^{-6}$ at all four, and its discrete energy read 0.0628319 at steps 20, 40 and 80. I then asked the opposite question of the scenarios: is there any time scale $\sigma$ at which $\nabla\times\mathbf E=-\sigma\,\partial_t\mathbf B$ holds for the field I wrote? The best-fit relative residual was at least 0.998 for all three families at $N=44$, $t=0.5$ (toroidal 0.999, braided 1.000, sheaf 1.000), and for the toroidal pulse the best-fitting $\sigma$ even had the wrong sign. The synthetic fields cannot satisfy Faraday's law at any time scale. That is consistent with what the repository says they are, "finite-difference educational residuals", but it means a smaller `faraday_curl` is not a more Maxwell-like field.

## What's new in it

Two usual approaches sit on either side of this toolkit.

The usual way to teach electromagnetism interactively is to draw fields: field lines, arrow grids, coloured potentials, or a running wave simulation. [PhET's Faraday's Law](https://phet.colorado.edu/en/simulations/faradays-law) moves a magnet through a coil; [Paul Falstad's 2D electromagnetic wave applet](https://www.falstad.com/emwave2/) solves a time-domain wave problem in the browser and shows $\mathbf E$ and $\mathbf B$ directly. Neither puts the Faraday tensor on the screen. Here the tensor is the primitive: every sample builds $F_{\mu\nu}$, the invariants are read from it, and the app shows the 4×4 matrix at the peak-energy sample next to $B^2-E^2$ and $\mathbf E\cdot\mathbf B$. The cost is that the fields are written down rather than solved for.

The usual way to summarise a scalar field topologically is a filtration: sweep a level through the whole range of the field and record when components and holes are born and die, as persistent homology or a Morse–Smale complex does. This toolkit takes one level, 0.38 of the maximum energy, and counts the graph at that level. The design document says the choice is deliberate: "the browser can recompute the field and topology instantly as users drag controls." Figure 8 puts the two side by side on the same field. Its filtration is derived, not in the repository:

$$
A_f=\{\,p:\ u_p\ge f\cdot\max_q u_q\,\},\qquad f\in[0,1],\qquad A_{f'}\subseteq A_f\ \text{ whenever } f'\ge f .
$$

**Figure 8.** Figure 8 (derived baseline). One fixed threshold against the whole superlevel filtration of the same energy map. Cells are added in decreasing order of u with a union-find, so a single pass gives, for every threshold fraction f from 0 to 1, the vertex, edge, filled-square and component counts, the repository's β₁ proxy, and the hole count of the filled-in complex. A vertical line marks the repository's f = 0.38; a band on the axis marks the range of f over which the active region is one component with exactly one hole. Under the plot, the H₀ barcode of the filtration shows one bar per component, born at a local peak of u and ending where it merges into an older one. The filtration is the standard method the design document points to for higher-fidelity work, computed here as a baseline; it is not the repository's code. Colour key: proof: β₁ of the filled-in complex (holes); structure: the repository's β₁ proxy; withdrawn: filled 2×2 blocks F; baseline: component count C and the H₀ barcode; parameter: threshold fraction f; the repository's 0.38 is marked.

What is different, then, is the combination and its speed, not any one piece. The same three files of arithmetic produce the field, the tensor, the invariants, the energy graph and the residuals, so one configuration gives one dataset whichever language you run, and the browser can redo the whole thing between two slider events. The single threshold is the price of that speed; the filtration is what the design document leaves to "the existing EMFS persistent-homology stack", which this repository does not contain.

## What no one else built

I looked for the closest prior work in four directions: browser simulations for teaching electromagnetism, research field solvers, visualisations of relativistic field transformations, and topological summaries of scalar fields. Each of the pieces here has a predecessor; what I can claim is narrower than any of them.

**Teaching simulations.** [PhET's Faraday's Law](https://phet.colorado.edu/en/simulations/faradays-law) and [Falstad's 2D wave applet](https://www.falstad.com/emwave2/) are browser tools built for classrooms. Falstad's applet is a real solver: it covers reflection at conductors, dielectric boundaries, dipole radiation and waveguides, which is the list my design document files under "future layers". MIT's TEAL project went further on energy flow; Belcher and Koleci's [animated textures](https://arxiv.org/abs/0802.4034) show field motion and energy transport with a second velocity field. None of these shows $F_{\mu\nu}$ or the two invariants, and none exports a dataset; my toolkit does both and solves nothing.

**Research solvers.** [Meep](https://meep.readthedocs.io/) is the standard open-source finite-difference time-domain package, with materials, sources and boundary conditions. It produces fields that satisfy a discretised Maxwell's equations. My toolkit does not compete with it, and Figure 7's control exists because a Yee scheme like Meep's is the right reference for what a "Maxwell residual" should read.

**Relativistic field visualisation.** [Seeing through the light cone](https://arxiv.org/abs/2505.20596) extends a past-light-cone visualisation method to electromagnetic fields, and is the closest work I found to showing how $\mathbf E$ and $\mathbf B$ transform between frames. My repository does not boost anything; it computes the invariants at fixed frames. Figure 4 adds the boost, and is marked derived for that reason.

**Topology of scalar fields.** The [Topology ToolKit](https://topology-tool-kit.github.io/) ([Tierny et al.](https://arxiv.org/abs/1805.09110)) computes persistence diagrams, merge trees and Morse–Smale complexes of scalar fields on regular grids. [GUDHI's cubical complexes](https://gudhi.inria.fr/python/latest/cubical_complex_user.html) and [Cubical Ripser](https://arxiv.org/abs/2005.12692) compute persistent homology of grid data with the squares filled in, which is exactly the correction Figure 6 shows my proxy lacks. Persistence itself goes back to [Edelsbrunner, Letscher and Zomorodian](https://doi.org/10.1007/s00454-002-2885-2). Applied to electromagnetism, Gross and Kotiuga's [Electromagnetic Theory and Computation: A Topological Approach](https://library.slmath.org/books/Book48/desc.html) uses cohomology for boundary-value problems, and a 2024 APS abstract by [Bohlsen, Robins and Hole](https://archive.aps.org/dpp/2024/tp12/49) applies persistent homology to magnetic field-line orbits. Every one of these does more topology than my single-threshold graph.

What survives the comparison is one specific arrangement. In a single browser loop, the same code builds the Faraday tensor at every sample, reads both invariants, thresholds the energy density and summarises the thresholded set as a graph, and computes three finite-difference diagnostics, and that code exists line for line in Rust, Python and TypeScript with a JSON export. I did not find another tool that puts a Faraday-tensor readout and a topological summary of the same field's energy on one screen. That is the extent of the claim: an arrangement for teaching, not a method.

**Figure 9.** Figure 9. The same mathematics in three languages, with the repository's assertions run live. A table re-runs every assertion from the three test files (antisymmetry, field round trip, invariant definitions, and each file's scenario test) on the figure's TypeScript port with the repository's own inputs, compares the port's output for the committed fixture configuration with the fixture's stored digits, and fuzzes 1,000 seeded random field pairs. A 3×3 coverage matrix shows which scenario family each language's tests exercise: the Rust and TypeScript tests use only the toroidal pulse, the Python test only the braided pair, no test uses the boundary sheaf, and no test compares one language's output with another's. The Rust crate itself is not run here; its assertions are re-run on the port. Colour key: proof: an assertion that holds; withdrawn: an assertion that fails, or a family no test covers; measured: a value copied from a committed file; baseline: cross-language comparison: none in the repository.

## Limitations

**It is not a solver.** The fields are closed-form patterns, not solutions. The repository says the residuals are "not a substitute for a production Maxwell solver with boundary conditions, material models, and stability proofs", and lists material models, anisotropic media, boundary-condition solvers and GPU kernels as future layers. Figure 7 quantifies the gap: no time scale makes any of the three families satisfy Faraday's law.

**The residual named `faraday_curl` is not Faraday's law.** It is the spatial curl of $\mathbf E$ with no $\partial\mathbf B/\partial t$ term. It is non-zero for any travelling wave and small for any nearly curl-free $\mathbf E$, so its size says nothing about how Maxwell-like a field is.

**The $\beta_1$ proxy counts squares.** It equals the number of holes plus the number of filled 2×2 blocks. The repository documents it as a proxy and its tests ask only $\beta_1\ge1$, which any blob of four active samples satisfies.

**Only the final frame is analysed, and with $T>1$ it is the first frame again.** Topology and residuals ignore every frame but the last, and because the fields are periodic in $t$ with period 1, the last frame repeats $t=0$. The energy and coupling averages, by contrast, count that frame twice.

**The residuals and counts do not converge to the quantities their names suggest.** When I checked the code across the clamp range of grid sizes, the toroidal `divergence_e` fell like $\Delta^2$ (0.0149 at $N=44$, 0.0030 at $N=96$) because its in-plane $\mathbf E$ is divergence-free by construction, but toroidal `divergence_b` settled near 0.88, braided `divergence_e` near 0.159, and the boundary sheaf's three numbers near 0.45, 0.38 and 0.51. Those are non-zero limits, properties of the formulas rather than of the grid. The toroidal proxy grew from 33 at $N=24$ to 181 at $N=44$ and 1,121 at $N=96$, while the hole count stayed at 1.

**Figure 10.** Figure 10. What the diagnostics do as the grid refines from 8 to 96. One row per family, three plots per row, all on the final frame and sharing the grid-size axis: the three residuals, the topology counts (components, the repository's β₁ proxy, and the hole count of the filled-in complex), and the number of active samples. The sweep runs the repository's own formulas, one grid per animation frame. A dashed line marks the Rust test's bound of 0.25 on divergence_e; a solid dot marks the committed fixture's values at N = 8; residuals that settle at a non-zero level are labelled as limits. Colour key: neg: divergence_e; structure: divergence_b; pos: faraday_curl; proof: hole count of the filled-in complex; withdrawn: the repository's β₁ proxy; baseline: Rust test bound 0.25; measured: committed fixture at N = 8; parameter: grid size N.

**What failed.**

- Withdrawn: The toroidal pulse produces a stable active-cycle topology. Killed by: The committed fixture of that scenario (8×8, one frame) reports β₀ 4, β₁ 0; at larger grids the reported β₁ is mostly filled squares (181 at N = 44 against one hole, from my check of the code)..
- Withdrawn: faraday_curl is a Maxwell residual for Faraday's law. Killed by: lib.rs:441-446 computes only (∇×E)\_z/(1+u); no ∂B/∂t term exists in residual_summary..
- Withdrawn: The boundary sheaf checks whether neighbouring patch summaries remain compatible. Killed by: The code defines only the field function (lib.rs:325-341); no patch, restriction or compatibility computation exists in any of the three languages..
- Withdrawn: sample-scenario.json is the output of the README's export command. Killed by: The README command uses grid 24, steps 8; the file's configuration says grid 8, steps 1..
- Withdrawn: Pushes to main deploy the Pages site. Killed by: The workflow triggers on master (pages.yml:4-5)..
- Withdrawn: The Faraday tensor is implemented and tested in Rust, Python and TypeScript. Killed by: Implemented, yes; but no test compares the three outputs, and each test file imports only its own module..

**The documents and the code disagree in several places.** Beyond the items above: the design document lists `npm audit` among the current checks, but the Pages workflow runs only `npm ci`, `npm test` and `npm run build`. The design document says vertices "exceed" the threshold; the code uses $\ge$. The README's opening sentence calls the simulator "high-performance"; the repository contains no benchmark and lists benchmark fixtures as future work. The app's "Maxwell residual" tile shows only `divergence_e`.

**Test coverage is thin and one family is untested.** Rust tests the toroidal pulse, Python the braided pair, TypeScript the toroidal pulse; nothing tests the boundary sheaf. The scenario assertions are loose: $\beta_0\ge1$, $\beta_1\ge1$, positive energy, and `divergence_e` below 0.25 (Rust) or 0.35 (Python).

**The three implementations can disagree on non-integer input.** TypeScript rounds `grid` and `steps` with `Math.round`, Python truncates with `int()`, and Rust takes an unsigned integer, so a grid of 24.6 gives 25 in one language and 24 in another. Python also falls back silently to the toroidal pulse for any unknown `kind`; only its command-line parser restricts the choices.

**What I did not do.** There are no benchmarks of any kind in the repository, so there is no speed claim to report. There is no Lean or other formal proof; the only guarantees are the antisymmetry and round-trip tests, which hold by construction of the matrix. I did not build or run the Rust crate or the TypeScript module for this essay. The numbers marked "when I checked the code" come from running the Python module's own functions, which reproduce the committed fixture digit for digit; Rust and TypeScript agreement with them is expected from the line-for-line identity of the three sources, not observed. The time-domain control, the boost, the filled-square identity and the filtration are mathematics I added to test the repository, and each is labelled derived.

## Read more

[View the project](https://github.com/teerthsharma/Electromagnetic-Field-Data-Simulator) · [Source on GitHub](https://github.com/teerthsharma/Electromagnetic-Field-Data-Simulator)

The hosted app is at [teerth.dev/Electromagnetic-Field-Data-Simulator](https://teerth.dev/Electromagnetic-Field-Data-Simulator/) and the source at [github.com/teerthsharma/Electromagnetic-Field-Data-Simulator](https://github.com/teerthsharma/Electromagnetic-Field-Data-Simulator). Version 0.1.0 is archived on Zenodo as [10.5281/zenodo.21997896](https://doi.org/10.5281/zenodo.21997896). The files that carry the substance, all at commit `f664a02`:

- [`docs/EM_FIELD_DATA_SIMULATOR.md`](https://github.com/teerthsharma/Electromagnetic-Field-Data-Simulator/blob/f664a02ac981f3f4bb785d7015904e1c4f240386/docs/EM_FIELD_DATA_SIMULATOR.md): the design document, scenario descriptions and stated limits.
- [`crates/em-field-sim/src/lib.rs`](https://github.com/teerthsharma/Electromagnetic-Field-Data-Simulator/blob/f664a02ac981f3f4bb785d7015904e1c4f240386/crates/em-field-sim/src/lib.rs): the Rust reference core; [`crates/em-field-sim/tests/faraday_contract.rs`](https://github.com/teerthsharma/Electromagnetic-Field-Data-Simulator/blob/f664a02ac981f3f4bb785d7015904e1c4f240386/crates/em-field-sim/tests/faraday_contract.rs): its tests.
- [`python/em_field_sim/core.py`](https://github.com/teerthsharma/Electromagnetic-Field-Data-Simulator/blob/f664a02ac981f3f4bb785d7015904e1c4f240386/python/em_field_sim/core.py): the Python mirror and the command-line exporter.
- [`web/src/sim/faraday.ts`](https://github.com/teerthsharma/Electromagnetic-Field-Data-Simulator/blob/f664a02ac981f3f4bb785d7015904e1c4f240386/web/src/sim/faraday.ts) and [`web/src/App.tsx`](https://github.com/teerthsharma/Electromagnetic-Field-Data-Simulator/blob/f664a02ac981f3f4bb785d7015904e1c4f240386/web/src/App.tsx): the TypeScript port and the app.
- [`web/public/data/sample-scenario.json`](https://github.com/teerthsharma/Electromagnetic-Field-Data-Simulator/blob/f664a02ac981f3f4bb785d7015904e1c4f240386/web/public/data/sample-scenario.json): the committed 8×8 fixture.

Related essays on this site: [faraday](/faraday), which shares the idea of thresholding a field and summarising the thresholded set topologically, and [topological-ml-toolkit](/topological-ml-toolkit), a separate library of mine for topology in machine-learning pipelines, including persistent homology.
