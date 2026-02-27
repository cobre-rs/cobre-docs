GAP-018:
I don't have any basis for deciding among rayon, std::thread with manual affinity and FFI to OpenMP via C. I know that rayon is much more popular in Rust, but I'm afraid to add an unnecessary dependency which might result in some other incompatibilities in the future, since we are dealing with very low-level stuff here. My initial insight was to use OpenMP because of the optimized builds that we have in HPC clusters, such as AWS ParallelCluster images that ship with their own build of OpenMP 5.0 now, made specially for their environment. You can leverage pros and cons by consulting external references and documentation and help me deciding now, or we make some notes on this and decide in the future.

GAP-019:
The retry max attempts and time budgets can actually be external config paramemters, but much of this is from the implementation of each solver. Each solver might have some implementation particularities that will require us to define how many retries are possible and worth doing, which solution methods we use on each retry and which parameters we change. This should be all defined inside the implementation os the solver abstraction, not visible to the other crates.

GAP-021:
We can add the complete FlatBuffers to the spec, but maybe we should only document the requirements that they must satisfy and let the actual definition for later. I mean this because this schema will be very important for the performance of the final software and even if we implement if fully now, we might have to change it later based on decisions that we will make during implementation. However, we can highlight that the cut coefficients must be easy to extract in batch, for all the active cuts, so we can update the LP quickly and solve it, since this is made in the hot path. We will prefer making it such it fits in some level of cache for optimizing this process.


