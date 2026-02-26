Minimal working SDDP solver:

1. The code must be done in a way that considers every point that will need flexibility, but it can implement just one of the candidates. For example, we can go with just the Expectation implementation of the RiskMeasure trait, we don't need to implement all possibilities.

2. We must use the real crates for the real thing. So the data models must be in the cobre-core, the IO must be done via cobre-io, the communication for parallel processing via cobre-comm, etc. We NEVER bypass the way the definitive solution will be done with some stub implementation, we might just not do all cases for now.

3. Our main use case will be the production executable with MPI parallelization for maximum performance, so we don't need python interface, TUI, generic communication backends yet. We can assume that we will have a rust binary compiled and expecting to be called with mpiexec -n N ...

4. We don't need all the system elements working and being inserted in the LP. Of course, we might read them and already prepare the parts of the code that will deal with them (inserting in the LP, extracting results, etc.), but these functions can work as a NO-OP for now, or even return an error if called with non-empty arguments. We really need for the first implementation is having Buses, Lines, Thermals and Hydros.

5. We don't need all the hydro production models for now, we can begin with just the constant productivity. 

6. We should dedicate some effort in the scenario generation. However, we don't need to implement all the flexible cases (receiving PAR models, fitting from history, etc.), we can just implement a single way to input scenarios now, but leave the terrain prepared for the future flexibility.

7. We need to be able to run both training and simulation and run at least one cut selection strategy on training. We need to support parallel processing and have result reproducibility.

8. We must produce the desired outputs following the specs schemas, via the correct crate, just like we do with the input