// Live API audio: 16 kHz mono PCM16 in, 24 kHz mono PCM16 out.

const INPUT_RATE = 16000
const OUTPUT_RATE = 24000

// Runs on the audio thread and forwards fixed-size mono chunks to the page.
const CAPTURE_WORKLET = `
class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.buffer = new Float32Array(2048)
    this.length = 0
  }
  process(inputs) {
    const channel = inputs[0][0]
    if (!channel) return true
    for (let i = 0; i < channel.length; i++) {
      this.buffer[this.length++] = channel[i]
      if (this.length === this.buffer.length) {
        this.port.postMessage(this.buffer.slice(0))
        this.length = 0
      }
    }
    return true
  }
}
registerProcessor("capture-processor", CaptureProcessor)
`

function toBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function floatToPcm16(samples: Float32Array): Uint8Array {
  const pcm = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    pcm[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
  }
  return new Uint8Array(pcm.buffer)
}

export interface MicCapture {
  stop: () => void
}

/** Streams the microphone as base64 PCM16 chunks until stopped. */
export async function startMicCapture(
  onChunk: (base64Pcm: string) => void
): Promise<MicCapture> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
  })
  const context = new AudioContext({ sampleRate: INPUT_RATE })
  const workletUrl = URL.createObjectURL(
    new Blob([CAPTURE_WORKLET], { type: "application/javascript" })
  )
  try {
    await context.audioWorklet.addModule(workletUrl)
  } finally {
    URL.revokeObjectURL(workletUrl)
  }
  const source = context.createMediaStreamSource(stream)
  const node = new AudioWorkletNode(context, "capture-processor")
  node.port.onmessage = (event: MessageEvent<Float32Array>) => {
    onChunk(toBase64(floatToPcm16(event.data)))
  }
  source.connect(node)

  return {
    stop: () => {
      node.port.onmessage = null
      source.disconnect()
      node.disconnect()
      stream.getTracks().forEach((track) => track.stop())
      void context.close()
    },
  }
}

export interface AudioPlayer {
  enqueue: (base64Pcm: string) => void
  /** Drops queued speech, e.g. when the admin interrupts. */
  clear: () => void
  setMuted: (isMuted: boolean) => void
  close: () => void
}

export function createAudioPlayer(): AudioPlayer {
  const context = new AudioContext({ sampleRate: OUTPUT_RATE })
  const gain = context.createGain()
  gain.connect(context.destination)
  const playing = new Set<AudioBufferSourceNode>()
  let nextStart = 0

  return {
    enqueue(base64Pcm) {
      const pcm = new Int16Array(fromBase64(base64Pcm).buffer)
      const buffer = context.createBuffer(1, pcm.length, OUTPUT_RATE)
      const channel = buffer.getChannelData(0)
      for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 0x8000
      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(gain)
      nextStart = Math.max(nextStart, context.currentTime)
      source.start(nextStart)
      nextStart += buffer.duration
      playing.add(source)
      source.onended = () => playing.delete(source)
    },
    clear() {
      playing.forEach((source) => {
        source.onended = null
        source.stop()
      })
      playing.clear()
      nextStart = 0
    },
    setMuted(isMuted) {
      gain.gain.value = isMuted ? 0 : 1
    },
    close() {
      void context.close()
    },
  }
}
