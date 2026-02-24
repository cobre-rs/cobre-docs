In "4. Overview", the cobre-solver crate is decribed as "LP/MIP solver abstraction with HiGHS backend", but it is important that we mention that HiGHS isn't the only backend. Highlight that we will support at least HiGHS and CLP.

In "22. Deffered Features", there is a section for "C.5 Non-Controllable Sources", but we did not deffer it anymore, it is modeled and will be implemented.

In the "16.1 Design Principles", inside "3.2 Validation Requirements", there is a reference with a label "01-math spec category", but this 01-math is the name of the subfolder in the old powers-rs specification, must be updated.

In the "4. LP Subproblem Formulation Reference", there is the same mention to this "01-math" section.

The "16.3 Production Scale Reference" must be updated as a whole. There are some estimates like "N_{withdrawal} = 20" and "M_{planes} = 10" that we can't quite understand where they came from. Run the lp_sizing.py script in "~/git/powers/scripts" with the default json input file in this same folder to have some better numbers to use as reference. This script is mentioned as future work in this same section, but it exists. Also, all the performance expectations by scale numbers don't have robust references. It seems as if they were created from nothing. If we create performance expectations, we must have a robust reference, since when we read this in the future, we can assume it is a hard truth. Lets either add explicitly that these are not hard goals, or think a robust way to create feasible values to it, or remove them.

Regarding the notation for the benders's cuts coefficients, I think we should use \pi instead of \beta for compatibility with other litterature. With this, the discount factor could be denoted \beta again. Lets plan how to do this update in a structured way so we don't let anything lost.

In the "5 Risk-Averse Subgradient Theorem" I think there are some latex errors. Some things in the theorem text are with a line in the middle of the text at random places. Lets ensure it is correct.

I didn't understand the "10 Lower Bound Validity with Risk Measures" section. In SDDP for minimization problems, what actually holds is the lower bound. It is the upper bound estimated via sampling of the forward costs that doesn't hold. Double check your affirmatives here.

In the "18. Data Model" section, I saw a mention to "the solver core (cobre-core)", but I think cobre-core is the data model crate, not the solver one... lets ensure we are using the correct cobre subcrates for their actual role across the specification.

