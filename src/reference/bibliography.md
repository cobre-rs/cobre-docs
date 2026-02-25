# Bibliography

Core references for the algorithms and methods implemented in Cobre.

## SDDP Foundations

- **Benders, J.F.** (1962). Partitioning procedures for solving mixed-variables programming problems. _Numerische Mathematik_, 4(1), 238–252.
  — The original Benders decomposition paper. Foundation for the L-shaped method and SDDP.

- **Birge, J.R.** (1985). Decomposition and partitioning methods for multistage stochastic linear programs. _Operations Research_, 33(5), 989–1007.
  — Multi-cut formulation for stochastic programs. Origin of the multi-cut L-shaped method.

- **Birge, J.R. & Louveaux, F.V.** (2011). _Introduction to Stochastic Programming_. Springer, 2nd edition.
  — Standard textbook reference for stochastic programming theory and decomposition methods.

- **Pereira, M.V.F. & Pinto, L.M.V.G.** (1991). Multi-stage stochastic optimization applied to energy planning. _Mathematical Programming_, 52(1–3), 359–375.
  — The original SDDP paper. Foundational for everything in `cobre-sddp`.

- **Philpott, A.B. & Guan, Z.** (2008). On the convergence of stochastic dual dynamic programming and related methods. _Operations Research Letters_, 36(4), 450–455.
  — Convergence theory for SDDP.

- **Costa, B.F.P., Calixto, A.O., Sousa, R.F.S., Figueiredo, R.T., Penna, D.D.J., Khenayfis, L.S. & Oliveira, A.M.R.** (2025). Boundary conditions for hydrothermal operation planning problems: the infinite horizon approach. _Proceeding Series of the Brazilian Society of Computational and Applied Mathematics_, 11(1), 1–7. [doi:10.5540/03.2025.011.01.0355](https://doi.org/10.5540/03.2025.011.01.0355)
  — Infinite horizon boundary conditions for hydrothermal planning. Related to the infinite horizon extension in `cobre-sddp`.

## Cut Management and Performance

- **de Matos, V.L., Philpott, A.B. & Finardi, E.C.** (2015). Improving the performance of Stochastic Dual Dynamic Programming. _Journal of Computational and Applied Mathematics_, 290, 196–208.
  — Cut selection strategies. Basis for the cut selection in `cobre-sddp`.

- **Bandarra, M. & Guigues, V.** (2021). Single cut and multicut stochastic dual dynamic programming with cut selection for multistage stochastic linear programs: convergence proof and numerical experiments. _Computational Management Science_, 18(2), 125–148. [doi:10.1007/s10287-021-00387-8](https://doi.org/10.1007/s10287-021-00387-8). Preprint: [arXiv:1902.06757](https://arxiv.org/abs/1902.06757)
  — Convergence proof for Level-1 and LML1 cut selection strategies. Guarantees finite convergence with probability 1.

## Risk Measures

- **Shapiro, A.** (2011). Analysis of stochastic dual dynamic programming method. _European Journal of Operational Research_, 209(1), 63–72.
  — Convergence analysis, complexity bounds, and risk-averse extensions (including CVaR) for SDDP.

- **Philpott, A.B. & de Matos, V.L.** (2012). Dynamic sampling algorithms for multi-stage stochastic programs with risk aversion. _European Journal of Operational Research_, 218(2), 470–483.
  — Dynamic sampling with risk aversion and Markovian scenario transitions.

- **Philpott, A.B., de Matos, V.L. & Finardi, E.C.** (2013). On solving multistage stochastic programs with coherent risk measures. _Operations Research_, 61(4), 957–970. [doi:10.1287/opre.2013.1175](https://doi.org/10.1287/opre.2013.1175)
  — Time-consistent risk-averse SDDP with CVaR. Dual representation for risk-averse cut generation and nested risk measures.

## Upper Bound and Inner Approximation

- **Costa, B.F.P. & Leclere, V.** (2023). Duality of upper bounds in stochastic dynamic programming. _Optimization Online_. [optimization-online.org/?p=23738](https://optimization-online.org/?p=23738)
  — Duality framework for upper bounds in stochastic dynamic programming. Basis for the upper bound evaluation in `cobre-sddp`.

## Inflow Modeling

- **Larroyd, P.V., Pedrini, R., Beltran, F., Teixeira, G., Finardi, E.C. & Picarelli, L.B.** (2022). Dealing with Negative Inflows in the Long-Term Hydrothermal Scheduling Problem. _Energies_, 15(3), 1115. [doi:10.3390/en15031115](https://doi.org/10.3390/en15031115)
  — Inflow non-negativity treatment for PAR(p) models in hydrothermal dispatch.

## Software References

- **Dowson, O. & Kapelevich, L.** (2021). SDDP.jl: A Julia Package for Stochastic Dual Dynamic Programming. _INFORMS Journal on Computing_, 33(1), 27–33.
  — Algorithmic reference for SDDP.jl. Influenced cut management and risk measure implementation in Cobre.

## Brazilian Power System

- **CEPEL Technical Documentation.** [https://see.cepel.br/manual/libs/latest/](https://see.cepel.br/manual/libs/latest/)
  — Official documentation for the NEWAVE/DECOMP/DESSEM suite.

- **SPARHTACUS Wiki.** [https://github.com/SPARHTACUS/SPTcpp/wiki](https://github.com/SPARHTACUS/SPTcpp/wiki)
  — Documentation for the C++ SDDP implementation. Reference for auditable pre-processing approach.

## Solver

- **Huangfu, Q. & Hall, J.A.J.** (2018). Parallelizing the dual revised simplex method. _Mathematical Programming Computation_, 10, 119–142.
  — HiGHS simplex implementation. Cobre uses HiGHS as its default LP solver.
