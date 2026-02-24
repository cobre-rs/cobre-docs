# Glossary

Power system terminology used in Cobre, with Portuguese equivalents where they appear in NEWAVE/CEPEL documentation or Brazilian regulatory context.

## Power System

| English     | Portuguese      | Definition                                                            |
| ----------- | --------------- | --------------------------------------------------------------------- |
| Bus         | Barra           | A node in the electrical network where components connect             |
| Branch      | Ramo / Circuito | A transmission line or transformer connecting two buses               |
| Subsystem   | Subsistema      | A region of the interconnected grid (e.g., SE/CO, S, NE, N in Brazil) |
| Interchange | Intercâmbio     | Power transfer between subsystems                                     |
| Load        | Carga / Demanda | Electrical power consumption at a bus                                 |
| Deficit     | Déficit         | Unmet demand — load that cannot be served by available generation     |

## Hydro Generation

| English          | Portuguese                | Definition                                                                                                              |
| ---------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Hydro plant      | Usina hidrelétrica (UHE)  | A hydroelectric generating station                                                                                      |
| Reservoir        | Reservatório              | Water storage volume behind a dam                                                                                       |
| Storage          | Armazenamento             | Current water volume in a reservoir (hm³)                                                                               |
| Inflow           | Afluência / Vazão natural | Natural water flow arriving at a reservoir                                                                              |
| Turbined outflow | Vazão turbinada           | Water passing through turbines to generate electricity                                                                  |
| Spillage         | Vertimento                | Water released from a reservoir without generating electricity                                                          |
| Cascade          | Cascata                   | Sequence of hydro plants along the same river                                                                           |
| Downstream       | Jusante                   | Direction of water flow; the plant that receives outflow from upstream                                                  |
| Upstream         | Montante                  | Direction against water flow                                                                                            |
| Productivity     | Produtibilidade           | Conversion factor from water flow (m³/s) to power (MW)                                                                  |
| Run-of-river     | Fio d'água                | Hydro plant with no significant storage capacity                                                                        |
| Diversion        | Desvio                    | Water bypassed to a separate channel, not passing through turbines                                                      |
| Evaporation      | Evaporação                | Water loss from the reservoir surface due to heat                                                                       |
| Forebay level    | Nível de montante         | Water level at the upstream face of the dam, a function of reservoir storage                                            |
| FPHA             | -                         | Four-Point Head Approximation — piecewise-linear model of hydro generation as a function of storage, flow, and spillage |
| Head             | Queda                     | Height difference between reservoir level and tailrace level, determining generation efficiency                         |
| Tailrace level   | Nível de jusante          | Water level at the downstream channel below the dam, a function of total outflow                                        |

## Thermal Generation

| English            | Portuguese               | Definition                                  |
| ------------------ | ------------------------ | ------------------------------------------- |
| Thermal unit       | Usina termelétrica (UTE) | A fossil-fuel or nuclear generating station |
| Minimum generation | Geração mínima           | Minimum output when the unit is committed   |
| Operating cost     | Custo de operação / CVU  | Variable cost per MWh of generation         |
| Startup cost       | Custo de partida         | Cost incurred when bringing a unit online   |

## Stochastic Modeling

| English           | Portuguese         | Definition                                                          |
| ----------------- | ------------------ | ------------------------------------------------------------------- |
| Scenario          | Cenário            | One realization of uncertain quantities (inflows, wind, etc.)       |
| Stage             | Estágio            | A time period in the planning horizon                               |
| State variable    | Variável de estado | Variables that link one stage to the next (storage, lagged inflows) |
| PAR(p)            | PAR(p)             | Periodic Autoregressive model of order p for inflow generation      |
| Historical record | Registro histórico | Observed inflow data used to fit stochastic models                  |

## SDDP Algorithm

| English             | Portuguese                    | Definition                                                                           |
| ------------------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| Cut (Benders cut)   | Corte (de Benders)            | A linear inequality approximating the future cost function                           |
| Cost-to-go function | Função de custo futuro (FCF)  | Expected cost from the current stage to the end of the horizon                       |
| Forward pass        | Passagem direta               | Simulation phase: solve stages sequentially under sampled scenarios                  |
| Backward pass       | Passagem reversa              | Optimization phase: generate cuts by solving from the last stage backward            |
| Lower bound         | Limite inferior               | Estimate from the first-stage problem (improves with more cuts)                      |
| Upper bound         | Limite superior               | Statistical estimate from simulation (converges to true cost)                        |
| Optimality gap      | Gap de otimalidade            | Difference between upper and lower bounds, as a percentage                           |
| Dual variable       | Variável dual / Multiplicador | Shadow price from LP solution; indicates marginal value of a resource                |
| Marginal cost (CMO) | Custo Marginal de Operação    | Shadow price of the demand constraint — the cost of one additional MWh               |
| Cut pool            | Conjunto de cortes            | Collection of all generated Benders cuts for a given stage                           |
| Infinite horizon    | Horizonte infinito            | Policy graph with cyclic transitions, used for long-term planning                    |
| Opening             | Abertura                      | A pre-generated scenario noise vector used in the backward pass                      |
| Policy graph        | Grafo de política             | Directed graph defining the stage structure and transitions in an SDDP problem       |
| Trial point         | Ponto de prova                | The state visited during a forward pass, used to construct cuts in the backward pass |

## Risk Measures

| English      | Portuguese      | Definition                                                             |
| ------------ | --------------- | ---------------------------------------------------------------------- |
| CVaR         | CVaR            | Conditional Value at Risk — expected cost in the worst α% of scenarios |
| Risk-neutral | Neutro ao risco | Optimization that minimizes expected cost only                         |
| Risk-averse  | Averso ao risco | Optimization that penalizes high-cost tail scenarios                   |

## NEWAVE / CEPEL Ecosystem

| Term   | Definition                                                                  |
| ------ | --------------------------------------------------------------------------- |
| NEWAVE | Long-term hydrothermal dispatch model (monthly, 5–10 years)                 |
| DECOMP | Medium-term model (weekly resolution)                                       |
| DESSEM | Short-term model (hourly/half-hourly, day-ahead)                            |
| GEVAZP | Synthetic scenario generation tool                                          |
| ONS    | Operador Nacional do Sistema Elétrico — Brazilian grid operator             |
| CCEE   | Câmara de Comercialização de Energia Elétrica — electricity trading chamber |
| CEPEL  | Centro de Pesquisas de Energia Elétrica — R&D center that develops NEWAVE   |
| SIN    | Sistema Interligado Nacional — the Brazilian interconnected power system    |

## Solver

| English             | Portuguese             | Definition                                                                            |
| ------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| Basis               | Base                   | The set of basic variables defining a vertex of the LP feasible region                |
| CLP                 | -                      | Open-source LP solver from COIN-OR, used as a reference backend in cobre-solver       |
| HiGHS               | -                      | Open-source LP/MIP solver used as the default backend in cobre-solver                 |
| LP (Linear Program) | Programa Linear        | An optimization problem with a linear objective and linear constraints                |
| Simplex method      | Método Simplex         | Algorithm for solving linear programs by traversing vertices of the feasible polytope |
| Warm-start          | Inicialização a quente | Reusing a previous solution basis to accelerate solving a modified LP                 |

## Data Formats

| English                        | Portuguese | Definition                                                                         |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------- |
| Arrow                          | -          | In-memory columnar data format for analytics; Parquet is its on-disk counterpart   |
| CSC (Compressed Sparse Column) | -          | Column-major sparse matrix format used for stage LP templates passed to solvers    |
| CSR (Compressed Sparse Row)    | -          | Row-major sparse matrix format used for batch cut addition via solver addRows APIs |
| FlatBuffers                    | -          | Zero-copy serialization library used for policy data (cuts, states)                |
| Parquet                        | -          | Columnar file format for efficient storage and retrieval of large tabular datasets |

## HPC (High-Performance Computing)

| English         | Portuguese | Definition                                                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| MPI             | -          | Message Passing Interface — standard for distributed-memory parallel computing                               |
| NUMA            | -          | Non-Uniform Memory Access — hardware topology where memory access time depends on processor-memory proximity |
| OpenMP          | -          | API for shared-memory parallel programming via compiler directives                                           |
| Rank            | -          | An MPI process; each rank has its own address space                                                          |
| Thread affinity | -          | Binding of threads to specific CPU cores to prevent migration and ensure NUMA-local memory access            |
