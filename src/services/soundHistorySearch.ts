import type { SoundEvent } from '../types/sound';

/** View-only, case-insensitive search over user-meaningful SoundEvent metadata. */
export function filterSoundHistory(events: SoundEvent[], query: string): SoundEvent[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return events;

  return events.filter((event) => {
    const category = typeof event.category === 'string' ? event.category : '';
    return event.label.toLocaleLowerCase().includes(normalizedQuery)
      || event.soundType.toLocaleLowerCase().includes(normalizedQuery)
      // Prefix matching avoids surprising matches such as "door" in "outdoor".
      || category.toLocaleLowerCase().startsWith(normalizedQuery);
  });
}
