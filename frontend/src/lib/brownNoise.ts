// Brown noise: a leaky random walk, scaled to stay within [-1, 1].
export function fillBrownNoise(out: Float32Array, random: () => number = Math.random): void {
  let last = 0
  for (let i = 0; i < out.length; i++) {
    last = (last + 0.02 * (random() * 2 - 1)) / 1.02
    out[i] = Math.max(-1, Math.min(1, last * 3.5))
  }
}

export interface BrownNoise {
  start(): void
  stop(): void
}

export function createBrownNoise(): BrownNoise {
  let ctx: AudioContext | null = null
  let source: AudioBufferSourceNode | null = null

  return {
    start() {
      if (source) return
      ctx ??= new AudioContext()
      void ctx.resume()
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate)
      fillBrownNoise(buffer.getChannelData(0))
      const gain = ctx.createGain()
      gain.gain.value = 0.3
      source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(gain).connect(ctx.destination)
      source.start()
    },
    stop() {
      source?.stop()
      source = null
    },
  }
}
