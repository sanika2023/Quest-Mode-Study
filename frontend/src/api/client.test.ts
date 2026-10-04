import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCampaign, getCampaign, gradeChapter, reviewTurn, updateChapterStatus } from './client'

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('createCampaign', () => {
  it('posts notes as JSON', async () => {
    const fetchMock = mockFetch(201, { id: 'c1' })
    const result = await createCampaign({ planned_minutes: 60, notes_text: 'my notes' })
    expect(result).toEqual({ id: 'c1' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/campaigns')
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body)).toEqual({ planned_minutes: 60, notes_text: 'my notes' })
  })

  it('posts a PDF as multipart form data without a content-type header', async () => {
    const fetchMock = mockFetch(201, { id: 'c1' })
    const file = new File(['%PDF'], 'notes.pdf', { type: 'application/pdf' })
    await createCampaign({ planned_minutes: 30, file })
    const init = fetchMock.mock.calls[0][1]
    expect(init.body).toBeInstanceOf(FormData)
    expect(init.body.get('planned_minutes')).toBe('30')
    expect((init.body.get('file') as File).name).toBe('notes.pdf')
    expect(init.headers).toBeUndefined()
  })

  it('throws the server error message', async () => {
    mockFetch(400, { error: 'Provide notes_text, a PDF file, or a topic' })
    await expect(createCampaign({ planned_minutes: 30, topic: '' })).rejects.toThrow(
      'Provide notes_text, a PDF file, or a topic',
    )
  })

  it('throws a generic message when the error body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('not json')
        },
      }),
    )
    await expect(createCampaign({ planned_minutes: 30, topic: 'x' })).rejects.toThrow('Request failed (500)')
  })
})

describe('getCampaign', () => {
  it('gets a campaign by id', async () => {
    const fetchMock = mockFetch(200, { id: 'c1' })
    expect(await getCampaign('c1')).toEqual({ id: 'c1' })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/campaigns/c1')
  })

  it('throws on 404', async () => {
    mockFetch(404, { error: 'Campaign not found' })
    await expect(getCampaign('nope')).rejects.toThrow('Campaign not found')
  })
})

describe('updateChapterStatus', () => {
  it('patches the chapter status', async () => {
    const fetchMock = mockFetch(200, { id: 'ch1', status: 'done' })
    expect(await updateChapterStatus('ch1', 'done')).toEqual({ id: 'ch1', status: 'done' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/chapters/ch1')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({ status: 'done' })
  })

  it('throws on 404', async () => {
    mockFetch(404, { error: 'Chapter not found' })
    await expect(updateChapterStatus('x', 'done')).rejects.toThrow('Chapter not found')
  })
})

describe('reviewTurn', () => {
  it('posts the turn and returns the reply', async () => {
    const fetchMock = mockFetch(200, { reply: 'hi', done: false })
    const input = { chapter_id: 'ch1', mode: 'quiz' as const, transcript: [], message: 'a' }
    expect(await reviewTurn(input)).toEqual({ reply: 'hi', done: false })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/review/turn')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual(input)
  })
})

describe('gradeChapter', () => {
  it('posts mode and transcript and returns the results', async () => {
    const results = [{ concept: 'ATP', verdict: 'missed' }]
    const fetchMock = mockFetch(200, { results })
    const transcript = [{ role: 'student' as const, text: 'x' }]
    expect(await gradeChapter('ch1', 'quiz', transcript)).toEqual(results)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/chapters/ch1/grade')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ mode: 'quiz', transcript, practice: false })
  })

  it('sends the practice flag', async () => {
    const fetchMock = mockFetch(200, { results: [] })
    await gradeChapter('ch1', 'teachback', [], true)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).practice).toBe(true)
  })

  it('throws the server error', async () => {
    mockFetch(502, { error: 'Grading failed. Please try again.' })
    await expect(gradeChapter('ch1', 'quiz', [])).rejects.toThrow('Grading failed')
  })
})
