import { NETWORKS } from './networks';
import { isProjectId, type Project } from './types';

export function validateProject(project: Project): string[] {
  const errors: string[] = [];
  if (!isProjectId(project.id)) errors.push('Project ID must be a safe integer of 1000 or higher.');
  if (project.assetType !== 'token') errors.push('Only token projects are supported.');
  if (!NETWORKS[project.network]?.enabled) errors.push('Project network is not supported.');
  if (!project.contractAddress.trim()) errors.push('Token contract address is required.');
  if (!project.externalId.trim()) errors.push('External market identifier is required.');
  if (project.promoted.active && project.promoted.priority < 0) {
    errors.push('Promoted priority cannot be negative.');
  }
  return errors;
}
