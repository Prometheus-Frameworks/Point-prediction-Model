import { buildFeatureRow } from '../builders/buildFeatureRow.js';
import { sampleFeatureInputs } from './sampleFeatureInputs.js';

export const sampleFeatureRows = {
  stableVeteranWr: buildFeatureRow(sampleFeatureInputs.stableVeteranWr),
  rookieWr: buildFeatureRow(sampleFeatureInputs.rookieWr),
  volatileTe: buildFeatureRow(sampleFeatureInputs.volatileTe),
  tradedWr: buildFeatureRow(sampleFeatureInputs.tradedWr),
  teammateInjuryBeneficiary: buildFeatureRow(sampleFeatureInputs.teammateInjuryBeneficiary),
};
