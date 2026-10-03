import type { ReviewMode, TranscriptTurn } from '../api/client'

export type { ReviewMode, TranscriptTurn }

export interface ReviewProvider {
  start(chapterId: string, mode: ReviewMode): Promise<void>
  // Text provider only: voice turns arrive through onTurn.
  send?(message: string): Promise<void>
  onTurn(callback: (turn: TranscriptTurn) => void): void
  end(): Promise<TranscriptTurn[]>
}
