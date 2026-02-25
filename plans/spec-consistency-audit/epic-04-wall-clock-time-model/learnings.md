# Epic 04 Learnings: Wall-Clock Time Model & Performance Targets

**Epic**: epic-04-wall-clock-time-model
**Tickets**: ticket-013, ticket-014, ticket-015
**Completed**: 2026-02-25

---

## Key Timing Model Findings

- **50-iteration production run uses 33.9% of the 2-hour budget** at the 2 ms warm-start LP solve KPI: per-iteration total is 48.83 s (compute 47.84 s + sync overhead 0.99 s), giving 2,441.6 s over 50 iterations versus a 7,200 s budget; see `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md` §12
- **Backward pass constitutes 97.5% of iteration compute**: per-iteration breakdown is forward compute 0.240 s (0.49%), backward compute 47.600 s (97.48%), pure communication 0.040 s (0.08%), load imbalance barrier 0.952 s (1.95%); see `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md` §4.6
- **Critical LP solve time threshold is ~6 ms**: $T_{crit} = 7{,}200 / 1{,}196{,}000 \approx 5.98$ ms — if the effective warm-start LP solve time exceeds this, the 50-iteration budget is violated; the spec KPI of 2 ms provides a 3x safety margin; see `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md` §4.6
- **Backward pass warm-start is the single most sensitive parameter**: a drop from 100% to 80% backward warm-start nearly triples compute time (to 6,709 s, 93.2% of budget); forward pass warm-start has negligible impact (total changes by only ~108 s across the full range 0%–100%); see timing model §7.5
- **Thread utilization at 64 ranks is 12.5%**: with 192 forward passes / 64 ranks = 3 items per rank and 24 threads per rank, only 3 threads are active per rank; the optimal utilization deployment is 8 ranks × 24 threads = 100% utilization with identical per-iteration time; the 64-rank deployment trades utilization for reduced per-rank memory pressure and future scaling headroom; see `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md` §4.4
- **Pure communication overhead is 0.08% of iteration time** on InfiniBand HDR (not 1% as previously estimated in `communication-patterns.md` §3.2); the original "<1%" claim was pure data transfer and remains valid; the total synchronization overhead (including load imbalance barriers at 119 stage boundaries) is 2.03%, marginally above the §4.4 claim of "<2%"; see timing model §11.11
- **Per-stage cut exchange (0.230 ms at D=1,120) is 22x below the 5 ms KPI**: the KPI in §4.3 is extremely conservative; see timing model §11.4

## Planned vs. Implemented Deviations

- **§4.4 "<2% communication" claim**: ticket-015 retained the claim as-is but added a note clarifying that "pure data transfer communication fraction: <0.1%" and that the 2% includes barriers; this is the annotation-not-modification pattern, not a wholesale replacement; see `/home/rogerio/git/cobre-docs/src/specs/hpc/communication-patterns.md` §3.2
- **communication-patterns.md §3.1 volume discrepancy**: the spec's "~587 MB" total used mixed state dimensions (trial points at D=1,120 and cuts at D=2,080); the timing model separates these cleanly (411.7 MB at D=1,120; 764.1 MB at D=2,080); the spec was not corrected — only a clarifying note was added; see timing model §11.3
- **Backward stages = T-1 = 119 (not T = 120)**: the backward pass processes stages T down to 2, so $N_{stages}^{bwd} = 119$; this exact value matters for the barrier overhead term (119 × 8 ms = 952 ms) and cut exchange (119 × 0.230 ms = 27 ms); confirmed in `training-loop.md` §6.1
- **Load imbalance barrier is the dominant sync overhead component**: the model conservatively estimates 2% of per-stage backward compute time = 8 ms per stage = 952 ms per iteration, versus only 40 ms of pure data transfer; this ordering (barriers >> wire time) was not explicitly anticipated in the tickets but was confirmed by the statistical derivation in §11.7

## Process Patterns That Worked Well

- **First-principles derivation with boxed intermediate results**: expressing $T_{fwd} = 120 \times \tau_{LP}$ and $T_{bwd} = 23{,}800 \times \tau_{LP}$ as closed-form expressions before substituting numbers made sensitivity analysis trivial (linearity in $\tau_{LP}$ is immediately obvious); reuse for any quantitative model ticket
- **Dual-pass warm-start distinction**: separating forward warm-start (inter-stage, 70% hit rate, low sensitivity) from backward warm-start (inter-opening, ~100% by design, high sensitivity) was a required analytical step that is not obvious from the spec alone; make this distinction explicit in any future LP solve time modeling
- **Consistency check table with CONFIRMED / NEEDS UPDATE verdicts** (ticket-014 §11.11): checking three existing spec claims (C1/C2/C3) against the model predictions revealed C3 required qualification and C1/C2 were both confirmed; this pattern catches silent inconsistencies without needing full re-audits of other specs; see timing model §11.11
- **Standalone audit artifact in plans/ directory**: `timing-model-analysis.md` (831 lines) was placed in the epic directory, not in `src/`; this keeps the spec files concise (§4.6–§4.7 in `production-scale-reference.md` are ~80 lines referencing the derivation) while preserving full traceability; the mdBook build is unaffected because `plans/` is not in the book source
- **Engineering estimate documentation**: for parameters without spec values (MPI base latency = 2 µs, protocol overhead = 50%, load imbalance = 2%), the timing model §9 and §11.14 explicitly tag these as "Engineering Estimate" with Medium confidence; this prevents future readers from treating estimates as spec-defined requirements; see §4.7 in `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md`
- **Section numbering discipline**: §4.5 (Convergence Reference) already existed; new sections were added as §4.6 and §4.7 to avoid renumbering existing cross-references; this pattern should be followed in any spec that has downstream cross-references by section number

## Recommendations for Future Epics

- **Solver benchmarking should prioritize two measurements**: (a) effective LP warm-start solve time, and (b) backward pass opening warm-start hit rate; these are the only two parameters with high sensitivity to the 2-hour budget; all other parameters (rank count, thread count, stage count, network) have low sensitivity; see `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md` §4.7
- **Barrier overhead (1.95% of iteration) is the primary synchronization cost** — not network bandwidth; any spec that discusses "synchronization overhead" should distinguish pure wire time (0.08%) from load imbalance wait time (1.95%); future HPC tuning specs should target the load imbalance source, not the network
- **The timing model analysis document is a living audit artifact**: as the solver is implemented, actual benchmark numbers should be compared against the model's predictions to validate the KPIs; the document at `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md` is the reference for this comparison
- **The annotation-not-modification pattern was applied to three files**: `production-scale-reference.md` §4.4, `communication-patterns.md` §3.2, and `work-distribution.md` §2.3 all received qualifying notes rather than content replacement; this pattern is correct when the existing claim is approximately right but needs scope qualification
