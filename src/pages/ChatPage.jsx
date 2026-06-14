import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Send,
  Paperclip,
  Briefcase,
  ArrowLeft,
  LogOut,
} from 'lucide-react'
import { Avatar, Badge, Card, Input } from '../components/common'
import { ChatMessage } from '../components/features'
import { useAppContext } from '../store'
import { chatsApi, jobsApi } from '../api'
import { signalRService } from '../api/signalr'
import { formatRelativeDate } from '../utils/helpers'
import { normalizeJob } from '../utils/normalize'

const ChatPage = () => {
  const { state } = useAppContext()
  const location = useLocation()
  const currentUserId = state.currentUser?.id

  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [chatsLoading, setChatsLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [chatSearch, setChatSearch] = useState('')
  const [project, setProject] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const messagesContainerRef = useRef(null)

  const activeChat = chats.find((c) => c.id === activeChatId)

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const el = messagesContainerRef.current
      if (el) {
        el.scrollTop = el.scrollHeight
      }
    }, 50)
  }, [])

  const loadChats = useCallback(async (selectChatId) => {
    try {
      const data = await chatsApi.getMyChats()
      setChats(data || [])
      if (selectChatId) {
        const found = data?.find((c) => c.id === selectChatId)
        if (found) {
          setActiveChatId(selectChatId)
          setShowChat(true)
        } else if (data?.length > 0) {
          setActiveChat(data[0].id)
        }
      }
      return data
    } catch (err) {
      console.error('Ошибка загрузки чатов:', err)
      return []
    }
  }, [])

  const loadMessages = useCallback(async (chatId) => {
    if (!chatId) return
    try {
      const data = await chatsApi.getMessages(chatId)
      const sorted = (data.items || []).sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      )
      return sorted
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err)
      return []
    }
  }, [])

  // Начальная загрузка чатов
  useEffect(() => {
    const initialChatId = location.state?.chatId

    const init = async () => {
      const data = await loadChats(initialChatId)
      setChatsLoading(false)

      const chatIdToSelect = initialChatId || (data?.length > 0 ? data[0].id : null)
      if (chatIdToSelect) {
        const sorted = await loadMessages(chatIdToSelect)
        if (sorted) {
          setMessages(sorted)
          setActiveChatId(chatIdToSelect)
          if (initialChatId) setShowChat(true)
        }
      }
    }

    init()
  }, [location.state?.chatId])

  // SignalR подключение
  useEffect(() => {
    if (!state.isAuthenticated) return

    const handlers = {
      onMessage: (msg) => {
        if (!msg) return
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          const filtered = prev.filter(
            (m) =>
              !(
                typeof m.id === 'string' &&
                m.id.startsWith('temp-') &&
                m.chatId === msg.chatId &&
                m.senderId === msg.senderId &&
                m.text === msg.text
              )
          )
          return [...filtered, msg].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          )
        })
        loadChats()
      },
      onChatUpdated: () => {
        loadChats()
      },
      onMessagesRead: (data) => {
        if (!data?.chatId) return
        setMessages((prev) =>
          prev.map((m) =>
            m.chatId === data.chatId ? { ...m, isRead: true } : m
          )
        )
        setChats((prev) =>
          prev.map((c) =>
            c.id === data.chatId ? { ...c, unreadCount: 0 } : c
          )
        )
      },
      onUserOnline: () => {},
      onUserOffline: () => {},
      onUserTyping: () => {},
      onReconnected: async () => {
        await loadChats()
        if (activeChatId) {
          const sorted = await loadMessages(activeChatId)
          if (sorted) setMessages(sorted)
        }
      },
    }

    signalRService.start(handlers)

    return () => {
      signalRService.stop()
    }
  }, [state.isAuthenticated])

  // Загрузка сообщений при смене активного чата
  useEffect(() => {
    if (!activeChatId) return

    const fetchMessages = async () => {
      const sorted = await loadMessages(activeChatId)
      if (sorted) {
        setMessages(sorted)
        scrollToBottom()
      }
    }

    fetchMessages()
    if (signalRService.isConnected()) {
      signalRService.markAsRead(activeChatId).catch(() => {})
    } else {
      chatsApi.markAsRead(activeChatId).catch(() => {})
    }
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId ? { ...c, unreadCount: 0 } : c
      )
    )
  }, [activeChatId])

  // Загрузка информации о проекте
  useEffect(() => {
    if (!activeChatId || !activeChat?.jobId) {
      setProject(null)
      return
    }

    if (project?.id !== activeChat.jobId) {
      setProject(null)
      jobsApi.getById(activeChat.jobId)
        .then((data) => setProject(normalizeJob(data)))
        .catch(() => setProject(null))
    }
  }, [activeChatId, activeChat?.jobId])

  const handleLeaveChat = useCallback(async () => {
    if (!activeChatId) return
    try {
      await chatsApi.leaveChat(activeChatId)
      setChats((prev) => prev.filter((c) => c.id !== activeChatId))
      setActiveChatId(null)
      setShowChat(false)
    } catch (err) {
      console.error('Ошибка покидания чата:', err)
    }
  }, [activeChatId])

  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !activeChatId) return

    const text = messageText.trim()
    setMessageText('')

    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      chatId: activeChatId,
      senderId: currentUserId,
      senderName: state.currentUser?.name || 'Вы',
      senderAvatar: state.currentUser?.avatarUrl || '',
      text,
      isRead: true,
      attachments: [],
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticMsg])
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() }
          : c
      )
    )
    scrollToBottom()

    try {
      if (signalRService.isConnected()) {
        await signalRService.sendMessage(activeChatId, text)
      } else {
        const msg = await chatsApi.sendMessage(activeChatId, text)
        setMessages((prev) => {
          const without = prev.filter((m) => m.id !== optimisticMsg.id)
          if (without.some((m) => m.id === msg.id)) return without
          return [...without, msg].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          )
        })
        loadChats()
      }
    } catch (err) {
      console.error('Ошибка отправки сообщения:', err)
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
    }
  }, [messageText, activeChatId, currentUserId, state.currentUser, scrollToBottom])

  const filteredChats = chats.filter((c) =>
    c.participantName?.toLowerCase().includes(chatSearch.toLowerCase())
  )

  const isOwn = (senderId) => senderId === currentUserId

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] lg:h-[calc(100vh-6rem)] flex overflow-hidden">
      <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white flex flex-col ${showChat ? 'hidden' : 'flex'} md:flex`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Сообщения</h2>
          <Input
            type="search"
            placeholder="Поиск чатов..."
            value={chatSearch}
            onChange={(e) => setChatSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatsLoading ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">Нет чатов</p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId
              return (
                <button
                  key={chat.id}
                  onClick={() => {
                    setActiveChatId(chat.id)
                    setShowChat(true)
                  }}
                  className={`w-full flex items-start gap-3 p-4 border-b border-gray-50 transition-colors text-left ${
                    isActive
                      ? 'bg-primary-50 border-l-4 border-l-primary-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <Avatar
                    src={chat.participantAvatar || ''}
                    name={chat.participantName || 'Пользователь'}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {chat.participantName || 'Пользователь'}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {chat.lastMessageAt ? formatRelativeDate(chat.lastMessageAt) : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {chat.lastMessage || 'Нет сообщений'}
                    </p>
                    {chat.jobTitle && (
                      <p className="text-xs text-primary-600 mt-1 truncate">
                        {chat.jobTitle}
                      </p>
                    )}
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                      {chat.unreadCount}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      <div className={`flex-1 flex-col ${showChat ? 'flex' : 'hidden'} md:flex`}>
        {chatsLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
          </div>
        ) : activeChat ? (
          <>
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowChat(false)}
                  className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-xl transition-colors"
                  aria-label="Назад к списку"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <Avatar
                  src={activeChat.participantAvatar || ''}
                  name={activeChat.participantName || 'Пользователь'}
                  size="md"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {activeChat.participantName || 'Пользователь'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activeChat.jobTitle || 'Чат'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLeaveChat}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-error-600"
                  title="Покинуть чат"
                  aria-label="Покинуть чат"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>Нет сообщений. Напишите первым!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={{
                      id: message.id,
                      chatId: message.chatId,
                      senderId: message.senderId,
                      senderName: message.senderName,
                      senderAvatar: message.senderAvatar,
                      text: message.text,
                      timestamp: message.createdAt,
                      isRead: message.isRead,
                      attachments: message.attachments || [],
                    }}
                    isOwn={isOwn(message.senderId)}
                  />
                ))
              )}
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors" aria-label="Прикрепить файл">
                  <Paperclip className="w-5 h-5 text-gray-500" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && messageText.trim()) {
                        handleSendMessage()
                      }
                    }}
                    placeholder="Напишите сообщение..."
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  className={`p-3 rounded-xl transition-colors ${
                    messageText.trim()
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  aria-label="Отправить"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>Выберите чат</p>
          </div>
        )}
      </div>

      {project && (
        <div className="hidden xl:block w-72 border-l border-gray-200 bg-white p-6 overflow-y-auto">
          <h3 className="font-bold text-gray-900 mb-4">О проекте</h3>
          <Card className="p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-primary-600" />
              <p className="font-semibold text-gray-900 text-sm">{project.title}</p>
            </div>
            <Badge variant={project.urgent ? 'error' : 'success'} size="sm">
              {project.urgent ? 'Срочно' : 'Активен'}
            </Badge>
            <p className="text-sm text-gray-600 mt-3 line-clamp-3">
              {project.shortDescription}
            </p>
          </Card>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Бюджет</p>
              <p className="font-semibold text-gray-900">
                {project.budget?.min?.toLocaleString('ru-RU') ?? 0} — {project.budget?.max?.toLocaleString('ru-RU') ?? 0} ₽
              </p>
            </div>
            <div>
              <p className="text-gray-500">Дедлайн</p>
              <p className="font-semibold text-gray-900">{project.deadline || 'Не указан'}</p>
            </div>
            <div>
              <p className="text-gray-500">Отклики</p>
              <p className="font-semibold text-gray-900">{project.proposalsCount}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatPage
