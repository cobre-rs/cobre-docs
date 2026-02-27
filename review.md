GAP-018:
I don't have any basis for deciding among rayon, std::thread with manual affinity and FFI to OpenMP via C. I know that rayon is much more popular in Rust, but I'm afraid to add an unnecessary dependency which might result in some other incompatibilities in the future, since we are dealing with very low-level stuff here. My initial insight was to use OpenMP because of the optimized builds that we have in HPC clusters, such as AWS ParallelCluster images that ship with their own build of OpenMP 5.0 now, made specially for their environment. You can leverage pros and cons by consulting external references and documentation and help me deciding now, or we make some notes on this and decide in the future.

GAP-019:
The retry max attempts and time budgets can actually be external config paramemters, but much of this is from the implementation of each solver. Each solver might have some implementation particularities that will require us to define how many retries are possible and worth doing, which solution methods we use on each retry and which parameters we change. This should be all defined inside the implementation os the solver abstraction, not visible to the other crates.

GAP-021:
We can add the complete FlatBuffers to the spec, but maybe we should only document the requirements that they must satisfy and let the actual definition for later. I mean this because this schema will be very important for the performance of the final software and even if we implement if fully now, we might have to change it later based on decisions that we will make during implementation. However, we can highlight that the cut coefficients must be easy to extract in batch, for all the active cuts, so we can update the LP quickly and solve it, since this is made in the hot path. We will prefer making it such it fits in some level of cache for optimizing this process.

GAP-022:
Regarding the PAR model processing, I think we have plenty documentation, but I will write here to make it clearer.

When the user fits a PAR model and gives as input, we expect it to have the parameters that we see in this canonical form of the PAR equation (following the notation in src/algorithms/par-model.md):


$$
\left( \frac{a_{h,t} - \mu_{m(t)}}{\sigma_{m(t)} }  \right) = + \sum_{\ell=1}^{p} \phi_{m(t),\ell} \left( \frac{a_{h,t-\ell} - \mu_{m(t-\ell)}}{\sigma_{m(t-\ell)} }  \right) +  \varepsilon_t
$$

In the docs it is written in a slightly different manner:

$$
a_{h,t} = \mu_{m(t)} + \sum_{\ell=1}^{p} \psi_{m(t),\ell} \left( a_{h,t-\ell} - \mu_{m(t-\ell)} \right) + \sigma_{m(t)} \cdot \varepsilon_t
$$

This is possible by defining these new $\psi$ coefficients using the standard deviation ratio:

$$
\psi_{m(t),\ell} = \phi_{m(t),\ell} \cdot \left( \frac{\sigma_{m(t)}}{\sigma_{m(t-\ell)}} \right)
$$

If we think about what we need to input in the LP, we need to isolate the terms that will multiply each inflow lag and the constant term, so:

$$
a_{h,t} =\sum_{\ell=1}^{p} \psi_{m(t),\ell} a_{h,t-\ell} + \left[\mu_{m(t)} - \sum_{\ell=1}^{p} \psi_{m(t),\ell}\mu_{m(t-\ell)} \right]+ \sigma_{m(t)} \cdot \varepsilon_t 
$$

So each $\psi_{m(t),\ell}$ term multiplies each lagged inflow, all the terms inside the brackets [] is what we call the deterministic base, and the sampled noise innovation has to be multiplied by the standard deviation before being added to the deterministic base.

So this is the different between what the user inputs in the PAR definition and what actually we put into the LP, considering that the deterministic base and the stardard deviation of that season must be cached for a multiply-add before setting them as RHS. Consider adding this flow explicitly to the docs and constructing the struct that optimizes handling this for each stage (different PAR models seasonally) and each hydro plant.

GAP-024:
You can add this tolerance as a parameter, no problem.

GAP-025:
We can design some penalty ordering checks, true. Lets think about it.

GAP-026:
Yes, lets add this documentation.

GAP-027:
Lets not assume any default, it is a mandatory configuration.

GAP-028:
Lets reason about the minimal set of compatibility checks. Since we are warm-starting and not checkpointing, we are using pre-calcualted cuts and visited states to begin a SDDP execution. Thinking on the most reasonable usage for this, is to begin evaluating the operative policy for the next month or week based on the last result that you have, so some values such as exchange limits can change, the load can change, the inflow can change, many things. Also, the block durations might suffer some alterations too. What we should validate to accept this warm starting is if we can use the cuts and visited states that already exist in the LPs that we will assemble. If we consider this minimal validation, we have basically a dimension problem. We must have the same state and cut dimensions, so the same number of hydros, same order of max PAR model order, and the cut construction equations should be the same, so we should have the same hydro production methods (FPHA contributes to storage cut coefficients) and PAR models for each hydro.

GAP-030:
For the TrajectoryRecord type, I think we should store the complete LP solution, both primal, dual and costs, because we might even use it as a common structure for both training forward pass and the simulation, and we will want to export more information at simulation time than what we actually need as state information for cut evaluation. This TrajectoryRecord should be stored in a highly optimized way, contiguously in memory as you mentioned.

GAP-031:
Lets uniformize this scenario notation. The scenario_source is clearly what we have defined later and it is more general thinking on future features. Remove the old fields and lets have a coherent and simpler data model.

GAP-032:
In the same way that we will try to avoid unnecessary dependencies as we did with rayon, lets try to not use tokio and crossbeam for now, unless we really need them. We prefer std::sync::mpsc if possible, lets add this note.

GAP-033:
We can enforce this requirement in the training entrypoint. However, I'm beginning to be a little bit confused about where we will actually prefer shared memory or isolated memory areas for each MPI rank. Even if we have multiple NUMA regions, is it worth for us to use MPI shared memory? On which situations? 

GAP-034:
For now lets assume that we have a immutable number of forward passes. Later in the future we might add some scheduler to change it among the iterations, but not for now.

GAP-035:
Update the example as needed.