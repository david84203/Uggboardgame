import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { Users, Clock, Plus, X, MessageCircle, ChevronDown } from 'lucide-react'

function PostCard({ post, isOwner, onClose }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">{post.date} {post.time}</span>
          <span className="text-xs text-stone-400 ml-2">· {post.memberName}</span>
        </div>
        {isOwner && (
          <button onClick={() => onClose(post.id)} className="text-stone-300 hover:text-red-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-sm text-stone-700 font-medium">
          <span className="text-xl">{post.gameName ? '🎲' : '🎯'}</span>
          <span>{post.gameName || '任何遊戲都行'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-stone-500 mb-3">
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          <span>還差 <strong className="text-orange-500">{post.needCount}</strong> 人</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{post.duration || '時間彈性'}</span>
        </div>
      </div>

      {post.note && (
        <p className="text-xs text-stone-500 bg-stone-50 rounded-xl px-3 py-2 leading-relaxed">
          {post.note}
        </p>
      )}
    </div>
  )
}

function PostForm({ member, onSubmit, onCancel, loading }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    date: today, time: '下午', needCount: 1, gameName: '', duration: '', note: ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-stone-800">發布揪團</h3>
        <button onClick={onCancel} className="text-stone-300 hover:text-stone-500"><X className="w-5 h-5" /></button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1 block">日期</label>
            <input type="date" value={form.date} min={today}
              onChange={e => set('date', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1 block">時段</label>
            <select value={form.time} onChange={e => set('time', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-orange-400 bg-white">
              <option>上午</option><option>下午</option><option>晚上</option><option>全天彈性</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1 block">還差幾人</label>
            <select value={form.needCount} onChange={e => set('needCount', Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-orange-400 bg-white">
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} 人</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1 block">預計時長</label>
            <select value={form.duration} onChange={e => set('duration', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-orange-400 bg-white">
              <option value="">彈性</option>
              <option>1 小時內</option><option>1-2 小時</option>
              <option>2-3 小時</option><option>3 小時以上</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-stone-500 mb-1 block">想玩的遊戲（選填）</label>
          <input type="text" value={form.gameName} placeholder="不填代表都可商量"
            onChange={e => set('gameName', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-orange-400" />
        </div>

        <div>
          <label className="text-xs font-medium text-stone-500 mb-1 block">備注（選填）</label>
          <textarea value={form.note} rows={2} placeholder="新手友善、歡迎第一次來…"
            onChange={e => set('note', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-orange-400 resize-none" />
        </div>

        <button
          onClick={() => onSubmit(form)}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-sm shadow-orange-200 hover:opacity-90 transition disabled:opacity-40"
        >
          {loading ? '發布中…' : '🎯 發布揪團'}
        </button>
      </div>
    </div>
  )
}

export default function GroupBoardPage({ member }) {
  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('all')

  async function fetchPosts() {
    setLoadingPosts(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const q = query(
        collection(db, 'group_posts'),
        where('status', '==', 'open'),
        where('date', '>=', today),
        orderBy('date', 'asc')
      )
      const snap = await getDocs(q)
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingPosts(false)
    }
  }

  useEffect(() => { fetchPosts() }, [])

  async function handleSubmit(form) {
    if (!member) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'group_posts'), {
        ...form,
        memberId: member.id,
        memberName: member.name,
        status: 'open',
        createdAt: new Date().toISOString(),
      })
      setShowForm(false)
      fetchPosts()
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleClose(postId) {
    await updateDoc(doc(db, 'group_posts', postId), { status: 'closed' })
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const displayed = filter === 'mine' && member
    ? posts.filter(p => p.memberId === member.id)
    : posts

  return (
    <div className="px-4 py-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-stone-800">🎯 揪團看板</h2>
          <p className="text-xs text-stone-400 mt-0.5">找玩伴，一起玩更好玩</p>
        </div>
        {member && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold shadow-sm shadow-orange-200"
          >
            <Plus className="w-4 h-4" /> 我要揪
          </button>
        )}
      </div>

      {!member && (
        <div className="mb-4 bg-orange-50 rounded-2xl p-4 text-center text-sm text-orange-600 border border-orange-100">
          🔒 登入會員才能發布揪團哦
        </div>
      )}

      {showForm && member && (
        <PostForm member={member} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} loading={submitting} />
      )}

      {member && (
        <div className="flex gap-2 mb-4">
          {['all', 'mine'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-500'}`}>
              {f === 'all' ? '全部' : '我的揪團'}
            </button>
          ))}
        </div>
      )}

      {loadingPosts ? (
        <div className="flex items-center justify-center py-16 text-stone-400 text-sm">載入中…</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🎲</div>
          <p className="text-stone-400 text-sm">目前沒有揪團，成為第一個揪人的吧！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(post => (
            <PostCard
              key={post.id}
              post={post}
              isOwner={member?.id === post.memberId}
              onClose={handleClose}
            />
          ))}
        </div>
      )}
    </div>
  )
}
