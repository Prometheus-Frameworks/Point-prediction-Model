import { readFile } from 'node:fs/promises';
import type { WrTeBaselineModelArtifact } from '../types/modelArtifact.js';

export const loadModelArtifact = async (artifactPath: string): Promise<WrTeBaselineModelArtifact> => {
  const raw = await readFile(artifactPath, 'utf8');
  const parsed = JSON.parse(raw) as Partial<WrTeBaselineModelArtifact>;

  if (parsed.artifactVersion !== 'wrte-baseline-model-v1' || parsed.modelName !== 'wrte-weekly-ppr-baseline') {
    throw new Error(`Unsupported model artifact at ${artifactPath}.`);
  }

  if (!parsed.schema || !parsed.config || !parsed.model) {
    throw new Error(`Model artifact at ${artifactPath} is missing required sections.`);
  }

  return parsed as WrTeBaselineModelArtifact;
};
