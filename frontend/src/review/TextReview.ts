import { reviewTurn, type ReviewMode, type TranscriptTurn } from '../api/client'
import type { ReviewProvider } from './types'

const SKIPPED = '(skipped)'

export class TextReview implements ReviewProvider {
  done = false
  private transcript: TranscriptTurn[] = []
  private chapterId = ''
  private mode: ReviewMode = 'quiz'
  private listener: (turn: TranscriptTurn) => void = () => {}

  onTurn(callback: (turn: TranscriptTurn) => void): void {
    this.listener = callback
  }

  async start(chapterId: string, mode: ReviewMode): Promise<void> {
    this.chapterId = chapterId
    this.mode = mode
    this.transcript = []
    this.done = false
    await this.turn()
  }

  async send(message: string): Promise<void> {
    await this.turn(message)
  }

  async skip(): Promise<void> {
    await this.turn(SKIPPED, true)
  }

  finish(): void {
    this.done = true
  }

  end(): Promise<TranscriptTurn[]> {
    return Promise.resolve([...this.transcript])
  }

  // Turns are recorded only after the server replies, so a failed request can be retried.
  private async turn(message?: string, skip = false): Promise<void> {
    const res = await reviewTurn({
      chapter_id: this.chapterId,
      mode: this.mode,
      transcript: [...this.transcript],
      ...(message !== undefined && { message }),
      ...(skip && { skip }),
    })
    const added: TranscriptTurn[] = []
    if (message !== undefined) added.push({ role: 'student', text: message })
    added.push({ role: 'character', text: res.reply })
    for (const t of added) {
      this.transcript.push(t)
      this.listener(t)
    }
    this.done = res.done
  }
}
