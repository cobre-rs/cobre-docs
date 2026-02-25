In "16.3 Production Scale Reference":

You rely too much in the default values chosen by the sizing script. If you run:

cd ~/git/poweres/scripts
python3 lp_sizing.py lp_sizing_production.json

You will get the actual values for our current production case sizings.

Change you "Openings" estimated values to 20 instead of 200.

For the state dimension, lets assume 2080 instead of 1120, which is our worst case.

For the variable count per subproblem:

- change $N_{seg}$ to 1 in the deficit component
- consider that all hydros model evaporation, so $N_{evap} = N_{hydro}$
- consider that all hydros model withdrawal, so $N_{withdrawal} = N_{hydro}$
- change $N_{seg}$ to 1 in the thermal generation component

This should result in something close to the results of the sizing script. Double check it.

For the constaint counts, double check your estimates for the FPHA. The sizing scripts assume 125 planes instead of 10, which is what you've put in the equation.

Lets not mention explicitly the sizing script in the powers repo. Either we move the script here or we implement the same as a rust script, or we give some other solution to the users, but lets not reference another repo informally like this. So, with this, sections like the script defaults and other sections related to the calculator become unnecessary.
