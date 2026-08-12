import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, MessageSquare, Shield } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { SectionHeader } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { EmptyBlock } from '../components/ui/States'
import { MessageSquare as MsgIcon } from 'lucide-react'

export default function Chat() {
  const { db, addChatMessage } = useWorkspace()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const messages = [...db.chatMessages].sort((a, b) => new Date(a.at) - new Date(b.at))
  const me = db.currentMember
  const authorOf = (id) => db.teamMembers.find((m) => m.id === id)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async (e) => {
    e.preventDefault()
    const value = text.trim()
    if (!value || sending) return
    setSending(true)
    try {
      await addChatMessage(null, value)
      setText('')
    } catch (err) {
      window.alert(err.message || 'Failed to send message. Are you signed in?')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[520px] flex-col">
      <SectionHeader
        title="Team Chat"
        subtitle="One thread for the build. Messages are stored in Supabase and shared with the whole team."
      />

      <div className="panel flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
          <div className="relative">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><MessageSquare size={16} /></span>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-base-850 bg-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white"># secure-file-sharing</p>
            <p className="text-[10px] text-slate-500">
              {db.teamMembers.length} members · persisted to <span className="font-mono">public.chat_messages</span>
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <EmptyBlock
              icon={MsgIcon}
              title="No messages yet"
              description="Send the first message to kick off the thread. Your identity is pulled from your team profile."
            />
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m, i) => {
                const author = authorOf(m.authorId)
                const mine = me && m.authorId === me.id
                if (m.kind === 'system') {
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="my-3 flex items-center gap-2">
                      <Shield size={12} className="text-accent" />
                      <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">{m.text}</p>
                      <span className="h-px flex-1 bg-white/5" />
                    </motion.div>
                  )
                }
                const prev = messages[i - 1]
                const grouped = prev && prev.authorId === m.authorId && Date.parse(m.at) - Date.parse(prev.at) < 3 * 60000
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 24, stiffness: 260 }}
                    className={`mb-2.5 flex gap-2.5 ${mine ? 'justify-end' : ''}`}
                  >
                    {!mine && !grouped && (author || me) && (
                      <Avatar name={author?.name || me?.name || 'You'} color={author?.color || me?.color} size={30} />
                    )}
                    <div className={`max-w-[75%] ${mine ? 'items-end' : 'items-start'}`}>
                      {!mine && !grouped && author && (
                        <p className="mb-0.5 px-1 text-[10px] font-semibold text-slate-400">
                          {author?.name || m.authorId}
                          <span className="font-normal text-slate-600">
                            {' '}· {new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </p>
                      )}
                      <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        mine
                          ? 'rounded-br-sm bg-accent/15 text-accent-bright shadow-[inset_0_0_0_1px_rgba(0,212,168,0.2)]'
                          : 'rounded-bl-sm bg-base-800/80 text-slate-300 shadow-card'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="flex items-center gap-2 border-t border-white/5 p-3">
          {me && <Avatar name={me.name} color={me.color} size={32} />}
          <input
            className="input flex-1"
            placeholder={`Message # secure-file-sharing${me ? ` as ${me.name}` : ''}…`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
          />
          <button type="submit" disabled={!text.trim() || sending} className="btn-primary !px-3">
            <Send size={15} />
          </button>
        </form>
      </div>

      <p className="mt-2 text-center font-mono text-[10px] tracking-widest text-slate-600">
        chat_messages persists via Supabase · everyone authenticated in this project shares the board
      </p>
    </div>
  )
}