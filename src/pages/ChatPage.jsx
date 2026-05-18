import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  Send,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Briefcase,
} from 'lucide-react'
import { Avatar, Badge, Card, Input } from '../components/common'
import { ChatMessage } from '../components/features'
import { useAppContext } from '../store'
import { chatsApi, jobsApi } from '../api'
import { formatRelativeDate } from '../utils/helpers'

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
  const messagesEndRef = useRef(null)

  const activeChat = chats.find((c) => c.id === activeChatId)

  // Загрузка списка чатов
  useEffect(() => {
    const initialChatId = location.state?.chatId

    const loadChats = async () => {
      try {
        const data = await chatsApi.getMyChats()
        setChats(data || [])

        if (initialChatId) {
          const found = data?.find((c) => c.id === initialChatId)
          if (found) {
            setActiveChatId(initialChatId)
          } else if (data?.length > 0 && !activeChatId) {
            setActiveChatId(data[0].id)
          }
        } else if (data?.length > 0 && !activeChatId) {
          setActiveChatId(data[0].id)
        }
      } catch (err) {
        console.error('Error loading chats:', err)
        setChats([])
      } finally {
        setChatsLoading(false)
      }
    }

    loadChats()
  }, [location.state?.chatId])

  // Polling списка чатов каждые 5 секунд
  useEffect(() => {
    if (!state.isAuthenticated) return

    const interval = setInterval(async () => {
      try {
        const data = await chatsApi.getMyChats()
        setChats(data || [])
      } catch (err) {
        console.error('Error polling chats:', err)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [state.isAuthenticated])

  // Загрузка и polling сообщений активного чата
  useEffect(() => {
    if (!activeChatId) return

    const loadMessages = async () => {
      try {
        const data = await chatsApi.getMessages(activeChatId)
        const sorted = (data.items || []).sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        )
        setMessages((prev) => {
          // Обновляем только если есть новые сообщения
          if (JSON.stringify(prev) !== JSON.stringify(sorted)) {
            return sorted
          }
          return prev
        })
      } catch (err) {
        console.error('Error loading messages:', err)
      }
    }

    // Загружаем сразу
    loadMessages()

    // И запускаем polling каждые 2 секунды
    const interval = setInterval(loadMessages, 2000)

    return () => clearInterval(interval)
  }, [activeChatId])

  // Загрузка информации о проекте
  useEffect(() => {
    if (!activeChatId || !activeChat?.jobId) {
      setProject(null)
      return
    }

    if (project?.id !== activeChat.jobId) {
      setProject(null)
      jobsApi.getById(activeChat.jobId).then(setProject).catch(() => setProject(null))
    }
  }, [activeChatId, activeChat?.jobId])

  // Отметка о прочтении
  useEffect(() => {
    if (activeChatId) {
      chatsApi.markAsRead(activeChatId).catch(console.error)
    }
  }, [activeChatId])

  // Отправка сообщения
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !activeChatId) return
    
    const text = messageText.trim()
    setMessageText('')
    
    try {
      // Отправляем через API
      await chatsApi.sendMessage(activeChatId, text)
      
      // Сразу обновляем список сообщений
      const data = await chatsApi.getMessages(activeChatId)
      const sorted = (data.items || []).sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      )
      setMessages(sorted)
      
      // Обновляем список чатов
      const chatsData = await chatsApi.getMyChats()
      setChats(chatsData || [])
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }, [messageText, activeChatId])

  const filteredChats = chats.filter((c) =>
    c.participantName?.toLowerCase().includes(chatSearch.toLowerCase())
  )

  const isOwn = (senderId) => senderId === currentUserId

  return (
    <div className="h-[calc(100vh-5rem)] lg:h-[calc(100vh-6rem)] flex">
      <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white flex flex-col">
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
                  onClick={() => setActiveChatId(chat.id)}
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

      <div className="hidden md:flex flex-1 flex-col">
        {chatsLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
          </div>
        ) : activeChat ? (
          <>
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
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
                <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors" aria-label="Позвонить">
                  <Phone className="w-5 h-5 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors" aria-label="Видеозвонок">
                  <Video className="w-5 h-5 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors" aria-label="Ещё">
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
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
              <div ref={messagesEndRef} />
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
                  <button className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Эмодзи">
                    <Smile className="w-5 h-5 text-gray-400" />
                  </button>
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
                {project.budget.min.toLocaleString('ru-RU')} — {project.budget.max.toLocaleString('ru-RU')} ₽
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
