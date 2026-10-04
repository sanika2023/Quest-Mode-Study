export interface Concept {
  name: string
  explanation: string
  source_quote: string
}

export interface QuizItem {
  question: string
  answer: string
  source_quote: string
}

export interface Misconception {
  wrong_claim: string
  correction: string
  source_quote: string
}

export type ChapterStatus = 'locked' | 'active' | 'done'

export interface Chapter {
  id: string
  position: number
  title: string
  story_beat: string
  concepts: Concept[]
  quiz: QuizItem[]
  misconception: Misconception | null
  villains: Concept[]
  status: ChapterStatus
}

export interface Campaign {
  id: string
  title: string
  premise: string
  has_notes: boolean
  chapters: Chapter[]
}

export type CampaignInput = { planned_minutes: number } & (
  | { notes_text: string }
  | { topic: string }
  | { file: File }
)

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      message = (await res.json()).error ?? message
    } catch {
      // body was not JSON; keep the generic message
    }
    throw new Error(message)
  }
  return res.json()
}

export function createCampaign(input: CampaignInput): Promise<Campaign> {
  if ('file' in input) {
    const form = new FormData()
    form.append('planned_minutes', String(input.planned_minutes))
    form.append('file', input.file)
    return request('/api/campaigns', { method: 'POST', body: form })
  }
  return request('/api/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function getCampaign(id: string): Promise<Campaign> {
  return request(`/api/campaigns/${id}`)
}

export function updateChapterStatus(id: string, status: ChapterStatus): Promise<Chapter> {
  return request(`/api/chapters/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}

export type ReviewMode = 'quiz' | 'teachback'

export interface TranscriptTurn {
  role: 'character' | 'student'
  text: string
}

export interface ReviewTurnInput {
  chapter_id: string
  mode: ReviewMode
  transcript: TranscriptTurn[]
  message?: string
  skip?: boolean
}

export function reviewTurn(input: ReviewTurnInput): Promise<{ reply: string; done: boolean }> {
  return request('/api/review/turn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export type Verdict = 'correct' | 'partial' | 'missed' | 'wrong'

export interface GradeResult {
  concept: string
  verdict: Verdict
  student_said: string
  source_quote: string
  quote_verified: boolean | null
}

export async function gradeChapter(
  chapterId: string,
  mode: ReviewMode,
  transcript: TranscriptTurn[],
): Promise<GradeResult[]> {
  const res = await request<{ results: GradeResult[] }>(`/api/chapters/${chapterId}/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, transcript }),
  })
  return res.results
}
