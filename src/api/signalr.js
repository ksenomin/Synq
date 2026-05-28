import * as signalR from '@microsoft/signalr'

class SignalRService {
  constructor() {
    this.connection = null
    this.listeners = {}
    this.retryCount = 0
    this.maxRetries = 3
    this.retryTimeout = null
  }

  async start(onMessage, onChatUpdated, onMessagesRead, onUserOnline, onUserOffline, onUserTyping) {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('/chatHub', {
        accessTokenFactory: () => token,
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build()

    this.connection.on('ReceiveMessage', onMessage)
    this.connection.on('MessageSent', onMessage)
    this.connection.on('ChatUpdated', onChatUpdated)
    this.connection.on('MessagesRead', onMessagesRead)
    this.connection.on('UserOnline', onUserOnline)
    this.connection.on('UserOffline', onUserOffline)
    this.connection.on('UserTyping', onUserTyping)

    try {
      await this.connection.start()
      this.retryCount = 0
    } catch (err) {
      console.warn('Ошибка подключения SignalR, используется резервный режим:', err.message)
      this.retryCount++
      if (this.retryCount <= this.maxRetries) {
        const delay = Math.min(2000 * Math.pow(2, this.retryCount - 1), 15000)
        this.retryTimeout = setTimeout(() => this.start(onMessage, onChatUpdated, onMessagesRead, onUserOnline, onUserOffline, onUserTyping), delay)
      }
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
      await this.connection.stop()
      this.connection = null
    }
    this.retryCount = 0
  }

  isConnected() {
    return this.connection?.state === signalR.HubConnectionState.Connected
  }
}

export const signalRService = new SignalRService()
