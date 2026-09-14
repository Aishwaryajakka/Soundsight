import type { SoundEvent } from '@/types/sound';

export interface GroupedSoundOccurrence {
  event: SoundEvent;
  eventIds: string[];
  count: number;
  averageConfidence: number;
}

const GROUP_WINDOW_MS = 5 * 60 * 1000;

/** Derive quieter display occurrences without changing or discarding canonical history. */
export function groupSoundHistory(events: SoundEvent[]): GroupedSoundOccurrence[] {
  const groups: GroupedSoundOccurrence[] = [];
  for (const event of [...events].sort((a, b) => b.timestamp - a.timestamp)) {
    const previous = groups.find((group) => group.event.soundType === event.soundType && group.event.direction === event.direction && group.event.timestamp - event.timestamp <= GROUP_WINDOW_MS);
    if (previous) {
      previous.eventIds.push(event.id);
      previous.count += 1;
      previous.averageConfidence = ((previous.averageConfidence * (previous.count - 1)) + event.confidence) / previous.count;
    } else {
      groups.push({ event, eventIds: [event.id], count: 1, averageConfidence: event.confidence });
    }
  }
  return groups;
}
