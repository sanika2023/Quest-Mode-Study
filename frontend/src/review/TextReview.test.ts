import { afterEach, describe, expect, it, vi } from 'vitest'
import { TextReview } from './TextReview'

function mockReplies(...replies: { reply: string; done: boolean }[]) {
  const queue = [...replies]
  const fn = vi.fn().mockImplementation(async () => ({ ok: true, status: 200, json: async () => queue.shift() }))
  vi.stubGlobal('fetch', fn)
  return fn
}

const body = (fn: ReturnType<typeof vi.fn>, call: number) => JSON.parse(fn.mock.calls[call][1].body)

afterEach(() => vi.unstubAllGlobals())

describe('TextReview', () => {
  it('start asks for the opening turn and records the character line', async () => {
    const fetchMock = mockReplies({ reply: 'Q1?', done: false })
    const review = new TextReview()
    const seen: unknown[] = []
    review.onTurn((t) => seen.push(t))
    await review.start('ch1', 'quiz')
    expect(body(fetchMock, 0)).toEqual({ chapter_id: 'ch1', mode: 'quiz', transcript: [] })
    expect(seen).toEqual([{ role: 'character', text: 'Q1?' }])
    expect(review.done).toBe(false)
  })

  it('send posts the earlier transcript plus the message, then records both turns', async () => {
    const fetchMock = mockReplies({ reply: 'Q1?', done: false }, { reply: 'Good. Q2?', done: false })
    const review = new TextReview()
    await review.start('ch1', 'quiz')
    await review.send('my answer')
    expect(body(fetchMock, 1)).toEqual({
      chapter_id: 'ch1',
      mode: 'quiz',
      transcript: [{ role: 'character', text: 'Q1?' }],
      message: 'my answer',
    })
    expect(await review.end()).toEqual([
      { role: 'character', text: 'Q1?' },
      { role: 'student', text: 'my answer' },
      { role: 'character', text: 'Good. Q2?' },
    ])
  })

  it('tracks done from the server', async () => {
    mockReplies({ reply: 'Q1?', done: false }, { reply: 'Well done.', done: true })
    const review = new TextReview()
    await review.start('ch1', 'quiz')
    await review.send('a')
    expect(review.done).toBe(true)
  })

  it('leaves the transcript untouched when a send fails', async () => {
    mockReplies({ reply: 'Q1?', done: false })
    const review = new TextReview()
    await review.start('ch1', 'quiz')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => ({ error: 'down' }) }))
    await expect(review.send('a')).rejects.toThrow('down')
    expect(await review.end()).toEqual([{ role: 'character', text: 'Q1?' }])
  })

  it('skip posts the skip flag and records a skipped student turn', async () => {
    const fetchMock = mockReplies({ reply: 'Q1?', done: false }, { reply: 'Skipped. Q2?', done: false })
    const review = new TextReview()
    await review.start('ch1', 'quiz')
    await review.skip()
    expect(body(fetchMock, 1).skip).toBe(true)
    expect((await review.end())[1]).toEqual({ role: 'student', text: '(skipped)' })
  })

  it('finish marks the review done without a request', async () => {
    mockReplies({ reply: 'I think so.', done: false })
    const review = new TextReview()
    await review.start('ch1', 'teachback')
    review.finish()
    expect(review.done).toBe(true)
  })
})
