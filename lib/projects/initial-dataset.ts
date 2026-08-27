import { initialProjects, INITIAL_DATASET_POPULATED_AT } from './initial-dataset.generated';
import { validateProject } from './validation';
import { toProjectListItem } from './view';

const ids = initialProjects.map((project) => project.id);
const promoted = initialProjects.filter((project) => project.promoted.active);
const invalid = initialProjects.flatMap((project) =>
  validateProject(project).map((error) => `${project.id}: ${error}`),
);

if (initialProjects.length !== 100)
  throw new Error('Initial dataset must contain exactly 100 projects.');
if (ids.some((id, index) => id !== 1000 + index)) {
  throw new Error('Initial project IDs must be contiguous from 1000 through 1099.');
}
if (new Set(ids).size !== ids.length) throw new Error('Initial project IDs must be unique.');
if (promoted.length !== 1 || promoted[0].externalId !== 'spookycoins-promoted-demo') {
  throw new Error('Initial dataset must contain exactly one dummy promoted project.');
}
if (invalid.length) throw new Error(`Invalid initial dataset:\n${invalid.join('\n')}`);
if (initialProjects.some((project) => project.submittedAt !== INITIAL_DATASET_POPULATED_AT)) {
  throw new Error(
    'Imported projects must use the dataset population time as their submission time.',
  );
}

export { initialProjects, INITIAL_DATASET_POPULATED_AT };
export const initialProjectListItems = initialProjects.map(toProjectListItem);
