import * as signalR from '@microsoft/signalr'

class SignalRService {
  constructor() {
    this.connection = null
    this.handlers = {}
    this.retryCount = 0
    this.maxRetries = 5
    this.retryTimeout = null
  }

  start(handlers) {
    this.handlers = handlers

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('/chatHub', {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build()

    this.connection.on('ReceiveMessage', (msg) => this.handlers.onMessage?.(msg))
    this.connection.on('MessageSent', (msg) => this.handlers.onMessage?.(msg))
    this.connection.on('ChatUpdated', (data) => this.handlers.onChatUpdated?.(data))
    this.connection.on('MessagesRead', (data) => this.handlers.onMessagesRead?.(data))
    this.connection.on('UserOnline', (data) => this.handlers.onUserOnline?.(data))
    this.connection.on('UserOffline', (data) => this.handlers.onUserOffline?.(data))
    this.connection.on('UserTyping', (data) => this.handlers.onUserTyping?.(data))

    this.connection.onreconnected(() => {
      this.retryCount = 0
      this.handlers.onReconnected?.()
    })

    return this._connect()
  }

  async _connect() {
    try {
      await this.connection.start()
      this.retryCount = 0
      return true
    } catch (err) {
      console.warn('SignalR connection error:', err.message)
      this.retryCount++
      if (this.retryCount <= this.maxRetries) {
        const delay = Math.min(2000 * Math.pow(2, this.retryCount - 1), 15000)
        return new Promise((resolve) => {
          this.retryTimeout = setTimeout(() => {
            this._connect().then(resolve)
          }, delay)
        })
      }
      return false
    }
  }

  async sendMessage(chatId, text) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('SendMessage', chatId, text)
    }
  }

  async markAsRead(chatId) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('MarkAsRead', chatId)
    }
  }

  async typing(chatId) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('Typing', chatId)
    }
  }

  async stop() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
      this.retryTimeout = null
    }
    if (this.connection) {
      try {
        await this.connection.stop()
      } catch {
        // ignore
      }
      this.connection = null
    }
    this.retryCount = 0
    this.handlers = {}
  }

  isConnected() {
    return this.connection?.state === signalR.HubConnectionState.Connected
  }
}

export const signalRService = new SignalRService()
