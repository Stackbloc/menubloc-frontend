/**
 * Optional diner personal-context lines for profile headers.
 */

const FIELD_MAX = 48;

function trimField(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.slice(0, FIELD_MAX);
}

export function normalizePersonalContextInput(input = {}) {
  return {
    diner_education_status: trimField(input.diner_education_status),
    diner_field_of_study: trimField(input.diner_field_of_study),
    diner_occupation: trimField(input.diner_occupation),
    diner_hometown: trimField(input.diner_hometown),
  };
}

export function buildDinerPersonalContextLines(input = {}) {
  const {
    diner_education_status: educationStatus,
    diner_field_of_study: fieldOfStudy,
    diner_occupation: occupation,
    diner_hometown: hometown,
  } = normalizePersonalContextInput(input);

  const lines = [];

  if (occupation) {
    lines.push(occupation);
  } else {
    const roleParts = [educationStatus, fieldOfStudy].filter(Boolean);
    if (roleParts.length) lines.push(roleParts.join(" · "));
  }

  if (hometown) lines.push(`From ${hometown}`);

  return lines;
}

export function summarizePersonalContext(input = {}) {
  return buildDinerPersonalContextLines(input).join(" · ") || "None added";
}

export { FIELD_MAX };
