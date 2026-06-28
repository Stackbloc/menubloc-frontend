export const RELEASE_METADATA_SCHEMA_VERSION = 1;
export const RELEASE_TYPES = Object.freeze(["frontend-only", "backend-only", "database-only", "full-stack", "config/env/domain-only"]);
export function assertReleaseMetadata(value) {
  if (value?.schema_version !== RELEASE_METADATA_SCHEMA_VERSION) throw new Error("unsupported release metadata schema");
  if (!RELEASE_TYPES.includes(value.release_type)) throw new Error("invalid release type");
  if (!value.environment) throw new Error("release environment is required");
  return true;
}
