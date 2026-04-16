import LearningMaterial from '../models/LearningMaterial.js';

function normalizeItem(item) {
  if (!item) return null;
  return typeof item.toObject === 'function' ? item.toObject() : item;
}

function hasSourceMetadata(item) {
  return Boolean(
    item?.sourceMaterial ||
      item?.sourceMaterialName ||
      item?.sourceClassName ||
      item?.sourceClassColor,
  );
}

function applyMaterialMetadata(item, material) {
  if (!item || !material) return item;
  return {
    ...item,
    sourceMaterial: item.sourceMaterial || material._id,
    sourceMaterialName: item.sourceMaterialName || material.originalName || '',
    sourceClassName: item.sourceClassName || material.className || '',
    sourceClassColor: item.sourceClassColor || material.classColor || '',
  };
}

export async function attachStudySourceMetadata(items, field) {
  const list = (Array.isArray(items) ? items : [items]).map(normalizeItem).filter(Boolean);
  const missingIds = list
    .filter((item) => !hasSourceMetadata(item))
    .map((item) => item._id)
    .filter(Boolean);

  if (!missingIds.length) {
    return Array.isArray(items) ? list : list[0] || null;
  }

  const materials = await LearningMaterial.find({ [field]: { $in: missingIds } })
    .select(`_id originalName className classColor ${field}`)
    .lean();

  const materialsByStudyId = new Map(
    materials
      .filter((material) => material?.[field])
      .map((material) => [String(material[field]), material]),
  );

  const enriched = list.map((item) => {
    if (hasSourceMetadata(item)) return item;
    return applyMaterialMetadata(item, materialsByStudyId.get(String(item._id)));
  });

  return Array.isArray(items) ? enriched : enriched[0] || null;
}
