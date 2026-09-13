import type { SoundPriority } from '../types/sound';

export type SoundHapticAction = 'none' | 'impact-heavy' | 'notification-warning';

export function acceptUniqueEventId(
  id: string,
  rememberedIds: Set<string>,
  rememberedOrder: string[],
  maximumIds: number
): boolean {
  if (rememberedIds.has(id)) return false;
  rememberedIds.add(id);
  rememberedOrder.push(id);
  if (rememberedOrder.length > maximumIds) {
    const oldestId = rememberedOrder.shift();
    if (oldestId) rememberedIds.delete(oldestId);
  }
  return true;
}

export function shouldDisplayAlert(priority: SoundPriority): boolean {
  return priority === 'high' || priority === 'critical';
}

export function hapticActionForPriority(
  priority: SoundPriority,
  options: { enabled: boolean; muted: boolean; isWeb: boolean }
): SoundHapticAction {
  if (!options.enabled || options.muted || options.isWeb) return 'none';
  if (priority === 'critical') return 'notification-warning';
  if (priority === 'high') return 'impact-heavy';
  return 'none';
}
