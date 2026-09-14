export function resampleMono(input: Float32Array, sourceRate: number, targetRate = 16000): Float32Array {
  if (!Number.isFinite(sourceRate) || sourceRate <= 0 || targetRate <= 0) throw new Error('Invalid audio sample rate.');
  if (sourceRate === targetRate) return input.slice();
  const outputLength = Math.max(1, Math.round(input.length * targetRate / sourceRate));
  const output = new Float32Array(outputLength);
  const ratio = sourceRate / targetRate;
  for (let index = 0; index < outputLength; index += 1) {
    const position = index * ratio;
    const left = Math.min(input.length - 1, Math.floor(position));
    const right = Math.min(input.length - 1, left + 1);
    const fraction = position - left;
    output[index] = input[left] * (1 - fraction) + input[right] * fraction;
  }
  return output;
}

export function floatToPcm16Le(input: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  input.forEach((sample, index) => {
    const clamped = Math.max(-1, Math.min(1, Number.isFinite(sample) ? sample : 0));
    view.setInt16(index * 2, clamped < 0 ? clamped * 32768 : clamped * 32767, true);
  });
  return buffer;
}
