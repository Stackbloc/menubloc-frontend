function toNumber(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

export function normalizeModifierOption(option, groupId, index) {
  return {
    optionId: String(option?.optionId ?? option?.option_id ?? option?.id ?? `${groupId}-${index}`),
    groupId,
    name: String(option?.name ?? option?.label ?? option?.title ?? `Option ${index + 1}`),
    priceDeltaCents: toNumber(
      option?.priceDeltaCents ??
        option?.price_delta_cents ??
        option?.priceCents ??
        option?.price_cents ??
        0,
      0
    ),
  };
}

export function normalizeModifierGroup(group, index) {
  const groupId = String(group?.groupId ?? group?.group_id ?? group?.id ?? `group-${index}`);
  const options = (Array.isArray(group?.options)
    ? group.options
    : Array.isArray(group?.choices)
    ? group.choices
    : Array.isArray(group?.items)
    ? group.items
    : Array.isArray(group?.modifiers)
    ? group.modifiers
    : []
  ).map((option, optionIndex) => normalizeModifierOption(option, groupId, optionIndex));
  const minSelections = toNumber(
    group?.minSelections ?? group?.min_selections ?? (group?.required ? 1 : 0),
    0
  );
  const maxSelections = toNumber(
    group?.maxSelections ?? group?.max_selections ?? (options.length > 1 ? 1 : options.length),
    options.length
  );

  return {
    groupId,
    name: String(group?.name ?? group?.label ?? group?.title ?? `Choose ${index + 1}`),
    description: String(group?.description ?? "").trim(),
    options,
    minSelections,
    maxSelections,
    required: Boolean(group?.required || group?.is_required || minSelections > 0),
  };
}

export function normalizeModifierGroups(item) {
  const sourceGroups = Array.isArray(item?.modifier_groups)
    ? item.modifier_groups
    : Array.isArray(item?.modifierGroups)
    ? item.modifierGroups
    : Array.isArray(item?.required_modifiers)
    ? item.required_modifiers
    : [];

  return sourceGroups.map(normalizeModifierGroup).filter((group) => group.options.length > 0);
}

export function itemHasRequiredModifiers(item) {
  return normalizeModifierGroups(item).some((group) => group.required);
}
