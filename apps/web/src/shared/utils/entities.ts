export function getEntityId(entity: { _id?: string; id?: string | null }) {
  return entity.id ?? entity._id ?? '';
}
