import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

export default function CalendarPage() {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selDay, setSelDay] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', time: '', desc: '' });

  const year = date.getFullYear();
  const month = date.getMonth();

  useEffect(() => {
    api.get('/calendar', { params: { year, month: month + 1 } }).then(setEvents).catch(() => {});
  }, [year, month]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const today = new Date();

  const addEvent = async () => {
    if (!form.title.trim()) return;
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selDay).padStart(2, '0')}`;
    try {
      await api.post('/calendar', { ...form, date: dayStr });
    } catch {}
    setEvents(prev => [...prev, { id: Date.now(), title: form.title, date: dayStr, time: form.time, desc: form.desc, creator_id: 1 }]);
    setForm({ title: '', time: '', desc: '' });
    setShowAdd(false);
  };

  const dayEvents = selDay ? events.filter(e => {
    const d = new Date(e.date);
    return d.getDate() === selDay && d.getMonth() === month && d.getFullYear() === year;
  }) : [];

  const isToday = (day) => today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  return (
    <Layout title="Календарь">
      <div className="calendar-grid">
        <div className="calendar-header">Пн</div>
        <div className="calendar-header">Вт</div>
        <div className="calendar-header">Ср</div>
        <div className="calendar-header">Чт</div>
        <div className="calendar-header">Пт</div>
        <div className="calendar-header">Сб</div>
        <div className="calendar-header">Вс</div>
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} className="calendar-day empty" />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvts = events.filter(e => { const d = new Date(e.date); return d.getDate() === day && d.getMonth() === month; });
          return (
            <div key={day} className={`calendar-day${selDay === day ? ' selected' : ''}${isToday(day) ? ' today' : ''}`} onClick={() => setSelDay(day)}>
              <span className="calendar-date">{day}</span>
              {dayEvts.slice(0, 2).map(e => (
                <div key={e.id} className="calendar-event">{e.title}</div>
              ))}
              {dayEvts.length > 2 && <div className="calendar-more">+{dayEvts.length - 2}</div>}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button className="btn-sm" onClick={() => setDate(new Date(year, month - 1, 1))}>← {MONTHS[month - 1] || ''}</button>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{MONTHS[month]} {year}</h3>
        <button className="btn-sm" onClick={() => setDate(new Date(year, month + 1, 1))}>{MONTHS[month + 1] || ''} →</button>
      </div>

      {selDay && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ fontSize: 16, fontWeight: 600 }}>{selDay} {MONTHS[month]}</h4>
            <button className="btn-sm" onClick={() => setShowAdd(true)}>➕ Событие</button>
          </div>
          {dayEvents.length === 0 && <p style={{ color: 'var(--text2)', fontSize: 14 }}>Нет событий</p>}
          {dayEvents.map(e => (
            <div key={e.id} className="calendar-event-card">
              <div className="calendar-event-time">{e.time || 'весь день'}</div>
              <div className="calendar-event-title">{e.title}</div>
              {e.desc && <div className="calendar-event-desc">{e.desc}</div>}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="lightbox" onClick={() => setShowAdd(false)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <h3 style={{ marginBottom: 16 }}>Новое событие</h3>
            <div className="form-group"><label>Название</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} autoFocus /></div>
            <div className="form-group"><label>Время</label><input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} /></div>
            <div className="form-group"><label>Описание</label><textarea value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} rows={2} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn-primary" onClick={addEvent}>Создать</button>
              <button className="btn-sm" onClick={() => setShowAdd(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
