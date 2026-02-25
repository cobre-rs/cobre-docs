# ticket-010 Refactor communication-patterns.md for Trait References

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Update `src/specs/hpc/communication-patterns.md` to reference the `Communicator` trait methods instead of ferrompi API signatures. SS1.1 (Operations Summary) must show trait method signatures alongside the SDDP use cases. SS5 (SharedWindow) must reference the `SharedMemoryProvider` trait. The document retains its role as the canonical reference for communication volumes and performance analysis (SS2-SS4), but the API column changes from ferrompi-specific to trait-based.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/hpc/communication-patterns.md`
- **Key decisions needed**:
  - Whether SS1.1's table should show both the trait method and the ferrompi API (for context) or only the trait method
  - How SS4 (Persistent Collectives) should reference the ferrompi backend's internal optimization
  - How SS5 (SharedWindow) should transition to referencing SharedMemoryProvider
- **Open questions**:
  - Should the communication volume analysis (SS3) be parameterized by backend, or is it backend-independent? (It should be backend-independent since data volumes are the same regardless of transport.)
  - Should SS6 (Deterministic Communication) reference the trait's determinism contract or remain as a standalone invariant?

## Dependencies

- **Blocked By**: ticket-001, ticket-002, ticket-005
- **Blocks**: ticket-011, ticket-013

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
