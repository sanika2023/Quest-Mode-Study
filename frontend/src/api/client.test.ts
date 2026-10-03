import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCampaign, getCampaign, updateChapterStatus } from './client'

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
