/**
 * Tests for the ChatWebSocket singleton.
 *
 * MSW intercepts WebSocket at the global level, so we close it for these tests
 * and provide our own mock WebSocket that the ChatWebSocket class uses internally.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest'
import { server } from '../mocks/server'

// Close MSW so it doesn't interfere with our WebSocket mocking
beforeAll(() => server.close())
afterAll(() => server.listen({ onUnhandledRequest: 'bypass' }))

// Mock WebSocket with all required properties
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: ((error: Event) => void) | null = null

  send = vi.fn()
  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.()
  })
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
  dispatchEvent = vi.fn(() => true)

  simulateOpen() {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.()
  }

  simulateMessage(data: Record<string, unknown>) {
    this.onmessage?.({ data: JSON.stringify(data) })
  }

  simulateError() {
    this.onerror?.(new Event('error'))
  }
}

let mockWsInstance: MockWebSocket | undefined

const MockWebSocketConstructor = vi.fn(() => {
  mockWsInstance = new MockWebSocket()
  return mockWsInstance
}) as unknown as typeof WebSocket

Object.defineProperties(MockWebSocketConstructor, {
  CONNECTING: { value: 0 },
  OPEN: { value: 1 },
  CLOSING: { value: 2 },
  CLOSED: { value: 3 },
})

vi.stubGlobal('WebSocket', MockWebSocketConstructor)

// Import after mocking WebSocket
import { chatWebSocket, type MessageHandler } from '@/lib/websocket'

describe('ChatWebSocket', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    chatWebSocket.disconnect()
    // Flush any pending reconnect timers
    vi.runAllTimers()
    chatWebSocket.disconnect()
    vi.clearAllMocks()
    mockWsInstance = undefined
  })

  afterEach(() => {
    chatWebSocket.disconnect()
    vi.runAllTimers()
    vi.useRealTimers()
  })

  describe('connect', () => {
    it('should create a WebSocket connection', async () => {
      const connectPromise = chatWebSocket.connect()
      mockWsInstance!.simulateOpen()
      await connectPromise

      expect(chatWebSocket.isConnected).toBe(true)
    })

    it('should resolve immediately if already connected', async () => {
      const connectPromise = chatWebSocket.connect()
      mockWsInstance!.simulateOpen()
      await connectPromise

      // Second connect should resolve immediately
      await chatWebSocket.connect()
      expect(chatWebSocket.isConnected).toBe(true)
    })

    it('should reject on connection error', async () => {
      const connectPromise = chatWebSocket.connect()
      mockWsInstance!.simulateError()

      await expect(connectPromise).rejects.toBeDefined()
    })
  })

  describe('disconnect', () => {
    it('should close the WebSocket connection', async () => {
      const connectPromise = chatWebSocket.connect()
      mockWsInstance!.simulateOpen()
      await connectPromise

      chatWebSocket.disconnect()
      expect(chatWebSocket.isConnected).toBe(false)
    })

    it('should clear message handlers on disconnect', async () => {
      const handler: MessageHandler = vi.fn()
      chatWebSocket.onMessage(handler)

      const connectPromise = chatWebSocket.connect()
      mockWsInstance!.simulateOpen()
      await connectPromise

      chatWebSocket.disconnect()
      vi.runAllTimers()
      chatWebSocket.disconnect()

      // Reconnect and send message - handler should not fire
      const reconnectPromise = chatWebSocket.connect()
      mockWsInstance!.simulateOpen()
      await reconnectPromise

      mockWsInstance!.simulateMessage({ type: 'message', content: 'test' })
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('authenticate', () => {
    it('should send auth message with token', async () => {
      const connectPromise = chatWebSocket.connect()
      mockWsInstance!.simulateOpen()
      await connectPromise

      chatWebSocket.authenticate('test-jwt-token')
      expect(mockWsInstance!.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'auth', token: 'test-jwt-token' })
      )
    })
  })

  describe('setGuestSession', () => {
    it('should send guest session message', async () => {
      const connectPromise = chatWebSocket.connect()
      mockWsInstance!.simulateOpen()
      await connectPromise

      chatWebSocket.setGuestSession('session-token', 'guest@example.com')
      expect(mockWsInstance!.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'guest',
          session_token: 'session-token',
          email: 'guest@example.com',
        })
      )
    })
  })

  describe('sendMessage', () => {
    it('should send chat message', async () => {
      const connectPromise = chatWebSocket.connect()
      mockWsInstance!.simulateOpen()
      await connectPromise

      chatWebSocket.sendMessage('Hello, I need help')
      expect(mockWsInstance!.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'message', content: 'Hello, I need help' })
      )
    })

    it('should not send if not connected', () => {
      expect(() => chatWebSocket.sendMessage('Hello')).not.toThrow()
    })
  })

  describe('onMessage', () => {
    it('should register and call message handlers', async () => {
      const handler: MessageHandler = vi.fn()
      chatWebSocket.onMessage(handler)

      const connectPromise = chatWebSocket.connect()
      mockWsInstance!.simulateOpen()
      await connectPromise

      mockWsInstance!.simulateMessage({ type: 'message', content: 'Hello!' })
      expect(handler).toHaveBeenCalledWith({
        type: 'message',
        content: 'Hello!',
      })
    })

    it('should support multiple handlers', async () => {
      const handler1: MessageHandler = vi.fn()
      const handler2: MessageHandler = vi.fn()

      chatWebSocket.onMessage(handler1)
      chatWebSocket.onMessage(handler2)

      const connectPromise = chatWebSocket.connect()
      mockWsInstance!.simulateOpen()
      await connectPromise

      mockWsInstance!.simulateMessage({ type: 'auth_success', status: true })

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('should return unsubscribe function', async () => {
      const handler: MessageHandler = vi.fn()
      const unsubscribe = chatWebSocket.onMessage(handler)

      const connectPromise = chatWebSocket.connect()
      mockWsInstance!.simulateOpen()
      await connectPromise

      unsubscribe()

      mockWsInstance!.simulateMessage({ type: 'message', content: 'Hello!' })
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(chatWebSocket.isConnected).toBe(false)
    })

    it('should return true when connected', async () => {
      const connectPromise = chatWebSocket.connect()
      mockWsInstance!.simulateOpen()
      await connectPromise

      expect(chatWebSocket.isConnected).toBe(true)
    })
  })
})
