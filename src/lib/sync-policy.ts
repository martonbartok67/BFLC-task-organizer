export function shouldApplyExternalUpdate(externalUpdatedAt: string | null, localUpdatedAt: string) {
  if (!externalUpdatedAt) {
    return false;
  }
  return new Date(externalUpdatedAt).getTime() >= new Date(localUpdatedAt).getTime();
}
