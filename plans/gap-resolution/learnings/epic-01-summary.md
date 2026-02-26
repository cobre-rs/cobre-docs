# Learnings from Epic 01: Ecosystem Guidelines

## What Went Well

- **Content extraction from learnings**: The epic-05-summary.md from spec-readiness was comprehensive enough to serve as the sole source for CLAUDE.md. All durable patterns were extractable without ambiguity.
- **Structural pattern reuse**: The overview-section structural conventions (plain numbered headers, Cross-References section at bottom) were well-established by prior spec-readiness work. ticket-002 followed them without any guardian rejections.
- **Guardian verification**: All three tickets passed guardian review on the first attempt (6/6, 6/6, 3/3 criteria respectively). The acceptance criteria were specific enough to be mechanically verifiable.

## What Could Be Improved

- **mdbook-katex version mismatch**: Local `cargo install mdbook-katex` installs v0.9.x from crates.io, but CI uses v0.10.0-alpha binary. This caused a build failure during ticket-001 verification. Resolution: install the alpha binary directly from GitHub releases (same as CI workflow).
- **Quality scoring for documentation tickets**: The test_delta dimension scores 0.0 for pure documentation tickets because Markdown files count as "source lines" but have no matching test files. This is mechanically correct per the rubric but penalizes documentation work. The 0.10 weight makes the impact minor (composite still 0.90), but this could be addressed by adding a documentation-only exemption to the rubric.
- **Readiness scoring should be part of plan creation**: The initial plan was created without readiness scores. This was caught mid-execution and required batch-scoring all 10 detailed tickets before resuming. The implement-plan protocol was updated to include scoring gates (steps 4f-bis and 4i-bis).

## Patterns Established

- **CLAUDE.md at repo root**: Contains durable development guidelines loaded automatically by agents. Source of truth for agent context.
- **ecosystem-guidelines.md in mdBook**: Human-readable counterpart in `src/specs/overview/`. Same content, formatted as a proper specification page with numbered sections and Cross-References.
- **Build tool versions**: mdbook v0.5.2, mdbook-katex v0.10.0-alpha (pre-release binary from CI).

## Recommendations for Epic 02

- Epic 02 tickets (004-007) involve modifying existing spec files — more complex than file creation. Guardian verification will need to check that existing content is preserved while new content is added.
- ticket-004 (SystemRepresentation) and ticket-006 (rkyv serialization) are the most technically dense. Dispatch to `sddp-specialist` or `data-model-format-specialist` rather than documentation writer.
- ticket-007 (gap inventory update) should be done last within Epic 02 — it marks GAP-001/002/003 as resolved and needs to reference the actual changes made by tickets 004-006.
