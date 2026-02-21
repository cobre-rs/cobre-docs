# Bibliography

Core references for the algorithms and methods implemented in Cobre.

## SDDP Foundations

- **Pereira, M.V.F. & Pinto, L.M.V.G.** (1991). Multi-stage stochastic optimization applied to energy planning. *Mathematical Programming*, 52(1–3), 359–375.
  — The original SDDP paper. Foundational for everything in `cobre-sddp`.

- **Philpott, A.B. & Guan, Z.** (2008). On the convergence of stochastic dual dynamic programming and related methods. *Operations Research Letters*, 36(4), 450–455.
  — Convergence theory for SDDP.

## Cut Management and Performance

- **de Matos, V.L., Philpott, A.B. & Finardi, E.C.** (2015). Improving the performance of Stochastic Dual Dynamic Programming. *Journal of Computational and Applied Mathematics*, 290, 196–208.
  — Cut selection strategies. Basis for the cut selection in `cobre-sddp`.

## Risk Measures

- **Shapiro, A.** (2011). Analysis of stochastic dual dynamic programming method. *European Journal of Operational Research*, 209(1), 63–72.
  — Risk-averse SDDP with CVaR.

- **Philpott, A.B. & de Matos, V.L.** (2012). Dynamic sampling algorithms for multi-stage stochastic programs with risk aversion. *European Journal of Operational Research*, 218(2), 470–483.

## Software References

- **Dowson, O. & Kapelevich, L.** (2021). SDDP.jl: A Julia Package for Stochastic Dual Dynamic Programming. *INFORMS Journal on Computing*, 33(1), 27–33.
  — Algorithmic reference for SDDP.jl. Influenced cut management and risk measure implementation in Cobre.

## Brazilian Power System

- **CEPEL Technical Documentation.** [https://see.cepel.br/manual/libs/latest/](https://see.cepel.br/manual/libs/latest/)
  — Official documentation for the NEWAVE/DECOMP/DESSEM suite.

- **SPARHTACUS Wiki.** [https://github.com/SPARHTACUS/SPTcpp/wiki](https://github.com/SPARHTACUS/SPTcpp/wiki)
  — Documentation for the C++ SDDP implementation. Reference for auditable pre-processing approach.

## Solver

- **Huangfu, Q. & Hall, J.A.J.** (2018). Parallelizing the dual revised simplex method. *Mathematical Programming Computation*, 10, 119–142.
  — HiGHS simplex implementation. Cobre uses HiGHS as its default LP solver.
