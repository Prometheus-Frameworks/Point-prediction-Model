# Calibration and subgroup stability

## Calibration philosophy

Calibration reporting answers a simple question: when the baseline predicts a certain level of output, how closely does reality match that expectation?

PR9 adds calibration reporting for the existing WR/TE baseline so that point predictions and interval bands can be audited instead of trusted blindly.

## Calibration outputs

Calibration reports summarize predictions by deterministic prediction buckets and include:

- average prediction
- average actual
- bias
- MAE
- RMSE
- interval coverage rates for 50%, 80%, and 90% bands when uncertainty metadata is available

Reliability summaries also flag the worst bucket bias and note material under-coverage.

## Subgroup stability purpose

Subgroup stability reporting makes weaknesses visible instead of hiding them inside one overall error metric.

PR9 evaluates at least the following subgroup families:

- WR vs TE
- rookie vs veteran
- event vs non-event
- projection tiers
- low-sample vs high-sample contexts

These slices help answer questions such as:

- Is the baseline less reliable on rookies?
- Are event-driven projections materially noisier?
- Do high-end projections systematically overstate ceilings?
- Are low-sample players receiving overly narrow intervals?

## Interpreting the reports

- Large positive bias means the model is under-predicting actual outcomes.
- Large negative bias means the model is over-predicting.
- Low coverage versus nominal interval levels means the intervals are too narrow for that context.
- High MAE/RMSE concentrated in a subgroup usually indicates missing context or unstable feature behavior.

## Important limitations

Calibration and subgroup summaries do not magically fix model weakness.

They are reporting tools built on top of the same learned baseline. Their value is in making failure modes visible so future work can improve features, data quality, and guardrails without pretending the model is more certain than it really is.
