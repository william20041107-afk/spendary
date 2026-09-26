import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'spendary.entries.v1'
const categories = [
  { name: '餐饮', color: '#76a9df' },
  { name: '交通', color: '#9ac9bd' },
  { name: '购物', color: '#d2b6df' },
  { name: '娱乐', color: '#e7bd95' },
  { name: '其他', color: '#aebbd0' },
]

function dateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateFromKey(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function shiftDate(key, amount) {
  const date = dateFromKey(key)
  date.setDate(date.getDate() + amount)
  return dateKey(date)
}

function formatMoney(amount) {
  return Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function initialEntries() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(saved) ? saved.filter((item) => item && typeof item.id === 'string' && typeof item.date === 'string' && Number.isFinite(Number(item.amount))) : []
  } catch {
    return []
  }
}

function positionFor(index) {
  // A quiet spiral gives every new record a stable place without relying on screen size.
  const angle = index * 2.39996 - 1.4
  const radius = Math.min(36, 10 + Math.sqrt(index) * 10)
  return { left: `${50 + Math.cos(angle) * radius}%`, top: `${49 + Math.sin(angle) * radius}%` }
}

function App() {
  const today = dateKey(new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const [entries, setEntries] = useState(initialEntries)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('餐饮')
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  useEffect(() => {
    if (!sheetOpen && !activeId) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSheetOpen(false)
        setActiveId(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sheetOpen, activeId])

  const dayEntries = useMemo(() => entries.filter((entry) => entry.date === selectedDate), [entries, selectedDate])
  const total = dayEntries.reduce((sum, entry) => sum + Number(entry.amount), 0)
  const selectedEntry = dayEntries.find((entry) => entry.id === activeId)
  const date = dateFromKey(selectedDate)
  const dayLabel = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(date)
  const isToday = selectedDate === today

  function openSheet() {
    setAmount('')
    setCategory('餐饮')
    setNote('')
    setFormError('')
    setActiveId(null)
    setSheetOpen(true)
  }

  function saveEntry(event) {
    event.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0 || value > 9999999 || !/^\d+(\.\d{1,2})?$/.test(amount)) {
      setFormError('请输入大于 0 的金额，最多保留两位小数。')
      return
    }
    setEntries((current) => [...current, {
      id: crypto.randomUUID(),
      date: selectedDate,
      amount: value,
      category,
      note: note.trim().slice(0, 80),
      createdAt: Date.now(),
    }])
    setSheetOpen(false)
  }

  function deleteEntry() {
    setEntries((current) => current.filter((entry) => entry.id !== activeId))
    setActiveId(null)
  }

  return (
    <div className="app-shell">
      <div className="app-container">
        <header className="topbar">
          <div className="brand" aria-label="Spendary">
            <span className="brand-mark"><span /><span /><span /><span /></span>
            <span>spendary<span className="brand-period">.</span></span>
          </div>
          <span className="topbar-caption">把日常，点点记下来</span>
        </header>

        <main>
          <section className="intro" aria-labelledby="page-title">
            <div className="eyebrow"><span className="eyebrow-dot" /> MY SPENDING DIARY</div>
            <h1 id="page-title">每一天，都有<br /><em>自己的形状。</em></h1>
            <p>一笔消费，一颗圆点。看看今天的生活，留下了怎样的轨迹。</p>
          </section>

          <section className="diary-card" aria-label="每日消费地图">
            <div className="card-header">
              <div>
                <div className="section-kicker">DAILY MAP <span>／ 每日地图</span></div>
                <h2>{dayLabel}<span className="date-tag">{isToday ? '今天' : date.getFullYear()}</span></h2>
              </div>
              <div className="date-controls" aria-label="切换日期">
                <button type="button" aria-label="前一天" onClick={() => { setSelectedDate(shiftDate(selectedDate, -1)); setActiveId(null) }}>‹</button>
                <button type="button" aria-label="后一天" disabled={isToday} onClick={() => { setSelectedDate(shiftDate(selectedDate, 1)); setActiveId(null) }}>›</button>
              </div>
            </div>

            <div className="map-area">
              <div className="map-orbit orbit-one" />
              <div className="map-orbit orbit-two" />
              <div className="map-axis map-axis-horizontal" />
              <div className="map-axis map-axis-vertical" />
              <span className="map-coordinate coordinate-top">N 01°</span>
              <span className="map-coordinate coordinate-bottom">YOUR DAY, IN DOTS</span>
              {dayEntries.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-orb"><span /></span>
                  <strong>{isToday ? '今天的地图，等你点亮。' : '这一天，还没有消费记录。'}</strong>
                  <span>{isToday ? '从第一笔消费开始，画下今天的生活。' : '记下一笔消费，点亮这天的地图。'}</span>
                  <button type="button" onClick={openSheet}>记下第一笔 <span>↗</span></button>
                </div>
              ) : (
                dayEntries.map((entry, index) => {
                  const color = categories.find((item) => item.name === entry.category)?.color || categories[4].color
                  const size = Math.min(76, Math.max(32, 26 + Math.sqrt(Number(entry.amount)) * 5))
                  return <button key={entry.id} type="button" className="map-dot" style={{ ...positionFor(index), '--dot-color': color, width: size, height: size }} onClick={() => setActiveId(entry.id)} aria-label={`${entry.category} $${formatMoney(entry.amount)}${entry.note ? `，${entry.note}` : ''}`} title={`${entry.category} · $${formatMoney(entry.amount)}`} />
                })
              )}
            </div>

            <div className="card-footer">
              <div className="daily-total"><span>当日花费</span><strong><small>$</small> {formatMoney(total)}</strong></div>
              <div className="entry-count"><span className="count-icon">●</span> {dayEntries.length} 笔记录</div>
            </div>
          </section>

          {dayEntries.length > 0 && <section className="entry-list" aria-label="当天消费记录">
            <div className="entry-list-heading"><span>当天记录</span><span>{dayEntries.length} 笔</span></div>
            {dayEntries.map((entry) => {
              const color = categories.find((item) => item.name === entry.category)?.color || categories[4].color
              return <button className="entry-row" type="button" key={entry.id} onClick={() => setActiveId(entry.id)}>
                <span className="entry-row-dot" style={{ background: color }} />
                <span className="entry-row-copy"><strong>{entry.category}</strong>{entry.note && <span className="entry-note">{entry.note}</span>}</span>
                <strong className="entry-amount">${formatMoney(entry.amount)}</strong>
              </button>
            })}
          </section>}

          <section className="below-card">
            <div className="legend">
              <span className="legend-title">圆点的颜色</span>
              <div className="legend-items">{categories.map((item) => <span key={item.name}><i style={{ background: item.color }} />{item.name}</span>)}</div>
            </div>
            <p>圆点越大，金额越高。每一笔，都是生活的一部分。</p>
          </section>
        </main>
      </div>

      <button className="add-button" type="button" onClick={openSheet} aria-label="记一笔消费"><span>＋</span> 记一笔</button>

      {sheetOpen && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSheetOpen(false) }}>
        <section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
          <div className="sheet-handle" />
          <div className="sheet-heading"><div><span>NEW ENTRY</span><h2 id="sheet-title">记下一笔消费</h2></div><button className="close-button" type="button" onClick={() => setSheetOpen(false)} aria-label="关闭">×</button></div>
          <form onSubmit={saveEntry}>
            <label className="field-label" htmlFor="amount">金额</label>
            <div className="amount-field"><span>$</span><input id="amount" type="text" inputMode="decimal" autoFocus placeholder="0.00" value={amount} onChange={(event) => { setAmount(event.target.value); setFormError('') }} /></div>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <span className="field-label">分类</span>
            <div className="category-grid">{categories.map((item) => <button key={item.name} type="button" className={category === item.name ? 'category-option selected' : 'category-option'} onClick={() => setCategory(item.name)}><i style={{ background: item.color }} />{item.name}</button>)}</div>
            <label className="field-label" htmlFor="note">给这笔消费留句话 <span>选填</span></label>
            <input id="note" className="note-field" type="text" maxLength="80" placeholder="比如，午后的那杯咖啡" value={note} onChange={(event) => setNote(event.target.value)} />
            <div className="sheet-date">记录在 {dayLabel}</div>
            <button className="save-button" type="submit">保存这笔消费 <span>↗</span></button>
          </form>
        </section>
      </div>}

      {selectedEntry && <div className="overlay detail-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveId(null) }}>
        <section className="detail-card" role="dialog" aria-modal="true" aria-labelledby="detail-title">
          <button className="close-button" type="button" onClick={() => setActiveId(null)} aria-label="关闭">×</button>
          <span className="detail-category"><i style={{ background: categories.find((item) => item.name === selectedEntry.category)?.color }} />{selectedEntry.category}</span>
          <h2 id="detail-title"><small>$</small> {formatMoney(selectedEntry.amount)}</h2>
          <p>{selectedEntry.note || '这笔消费还没有备注。'}</p>
          <div className="detail-actions"><span>{dayLabel}</span><button type="button" onClick={deleteEntry}>删除记录</button></div>
        </section>
      </div>}
    </div>
  )
}

export default App
