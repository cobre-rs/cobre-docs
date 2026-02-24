# Overview

This section contains the foundational specifications that underpin all other sections of the Cobre documentation. It establishes the design philosophy that guides every architectural and algorithmic decision, the notation conventions that ensure consistency across all mathematical and data-model specs, and the production-scale reference dimensions that anchor performance analysis and memory budget calculations throughout the HPC specs.

These three specs are prerequisites for reading any other specification section. They are referenced pervasively -- design principles inform trade-off discussions in the architecture specs, notation conventions define the symbols used in every equation, and production-scale dimensions appear whenever a spec quantifies communication volume, memory footprint, or computational cost.

## Reading Order

The specs are short and self-contained; reading them in order takes under fifteen minutes:

1. **[Design Principles](./overview/design-principles.md)** -- The 8 foundational principles guiding the Cobre solver design. These principles are cited throughout the architecture and HPC specs to justify specific design choices.
2. **[Notation Conventions](./overview/notation-conventions.md)** -- Index sets, symbols, and unit conventions used throughout all mathematical formulations. Required context before reading any spec in the [Mathematical Formulations](./math.md) section.
3. **[Production Scale Reference](./overview/production-scale-reference.md)** -- Representative problem dimensions for a national-scale hydrothermal system (number of plants, stages, scenarios, state dimension). Referenced by every spec that performs sizing analysis or communication volume estimation.

## Spec Index

| Spec                                                                   | Description                                                                                                             |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [Design Principles](./overview/design-principles.md)                   | Foundational design goals and trade-off principles that govern all architectural decisions                              |
| [Notation Conventions](./overview/notation-conventions.md)             | Index sets, mathematical symbols, physical units, and naming conventions for the specification suite                    |
| [Production Scale Reference](./overview/production-scale-reference.md) | Concrete problem dimensions for a national-scale hydrothermal dispatch system, used for sizing and performance analysis |

## Navigation

The Specifications section contains 7 subsections: Overview (this section), [Mathematical Formulations](./math.md), [Data Model](./data-model.md), [Architecture](./architecture.md), [High-Performance Computing](./hpc.md), [Configuration](./configuration.md), and [Deferred Features](./deferred.md). Readers encountering the specs for the first time should complete the three overview specs before proceeding to any other subsection.
