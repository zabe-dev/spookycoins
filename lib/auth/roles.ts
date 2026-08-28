type MetadataValue = unknown;

type RoleMetadata = {
  role?: MetadataValue;
  roles?: MetadataValue;
};

export function getUserRole(metadataSources: RoleMetadata[]) {
  return metadataSources.some(hasAdminRole) ? 'admin' : 'user';
}

function hasAdminRole(metadata: RoleMetadata) {
  return isAdminValue(metadata.role) || isAdminValue(metadata.roles);
}

function isAdminValue(value: MetadataValue): boolean {
  if (typeof value === 'string') return value.toLowerCase() === 'admin';
  if (Array.isArray(value)) return value.some(isAdminValue);
  return false;
}
