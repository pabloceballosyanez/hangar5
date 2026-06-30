'use client';

import { useState } from 'react';

type Item = { id: string; name: string; slug: string; type: string };
type Calendar = {
  id: string; itemId: string; name: string; url: string; lastSync: string | null;
  item: { name: string; slug: string; type: string };
  _count: { blocks: number };
};

export default function CalendarsClient({ items, calendars: initialCalendars }: { items: Item[]; calendars: Calendar[] }) {
  const [calendars, setCalendars] = useState(initialCalendars);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ itemId: '', name: '', url: '' });
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const addCalendar = async () => {
    const res = await fetch('/api/admin/ical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const cal = await res.json();
      setCalendars([cal, ...calendars]);
      setShowForm(false);
      setForm({ itemId: '', name: '', url: '' });
    } else {
      const err = await res.json();
      alert(err.error || 'Error al agregar');
    }
  };

  const removeCalendar = async (id: string) => {
    if (!confirm('¿Eliminar esta conexión iCal y todos sus bloques?')) return;
    await fetch(`/api/admin/ical/${id}`, { method: 'DELETE' });
    setCalendars(calendars.filter(c => c.id !== id));
  };

  const syncAll = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await fetch('/api/admin/ical/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setSyncResult(`${data.message} (${JSON.stringify(data.results.map((r: any) => `${r.name}: ${r.status === 'ok' ? `${r.futureBlocks} bloques` : r.error}`).join(', '))})`);
    setSyncing(false);
    // Refresh
    window.location.reload();
  };

  const typeLabels: Record<string, string> = {
    parapente: '🪂 Parapente', aladelta: '🪽 Aladelta', hike: '🥾 Hike',
    moto: '🏍️ Moto', bici: '🚲 Bici', cabana: '🏠 Cabaña', glamping: '⛺ Glamping',
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>📡 Calendarios iCal</h1>
          <p style={{ color: '#666', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Conecta Airbnb, Booking.com y otras plataformas vía iCal para sincronizar disponibilidad
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={syncAll} disabled={syncing}
            style={{ padding: '0.5rem 1rem', background: syncing ? '#ccc' : '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: syncing ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
            {syncing ? '⏳ Sincronizando...' : '🔄 Sync Ahora'}
          </button>
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: '0.5rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
            + Conectar Plataforma
          </button>
          <a href="/admin" style={{ padding: '0.5rem 1rem', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem' }}>
            ← Admin
          </a>
        </div>
      </div>

      {syncResult && (
        <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
          ✅ {syncResult}
        </div>
      )}

      {showForm && (
        <div style={{ padding: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Nueva conexión iCal</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: '#666' }}>Actividad/Renta</label>
              <select value={form.itemId} onChange={e => setForm({ ...form, itemId: e.target.value })}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem', minWidth: '200px' }}>
                <option value="">Seleccionar...</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>{typeLabels[i.type] || i.type} — {i.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: '#666' }}>Plataforma</label>
              <select value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem', minWidth: '150px' }}>
                <option value="">Seleccionar...</option>
                <option value="Airbnb">Airbnb</option>
                <option value="Booking.com">Booking.com</option>
                <option value="Vrbo">Vrbo</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: '#666' }}>URL del iCal</label>
              <input type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}
                placeholder="https://www.airbnb.com/calendar/ical/..." required
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={addCalendar} disabled={!form.itemId || !form.name || !form.url}
                style={{ padding: '0.5rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap', opacity: !form.itemId || !form.name || !form.url ? 0.5 : 1 }}>
                Guardar
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ padding: '0.5rem 1rem', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {calendars.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#9ca3af' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📡</div>
          <p>No hay plataformas conectadas todavía.</p>
          <p style={{ fontSize: '0.85rem' }}>Agrega enlaces iCal de Airbnb o Booking.com para sincronizar disponibilidad.</p>
          <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#666' }}>
            <p><strong>📤 Exportar desde Hangar5:</strong></p>
            {items.map(i => (
              <code key={i.id} style={{ display: 'inline-block', margin: '0.25rem 0.5rem', padding: '0.25rem 0.5rem', background: '#f1f5f9', borderRadius: '4px', fontSize: '0.75rem' }}>
                https://hangar5.onrender.com/api/ical/{i.id} ({i.name})
              </code>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {calendars.map(cal => (
            <div key={cal.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {cal.name === 'Airbnb' ? '🏠' : cal.name === 'Booking.com' ? '🏨' : cal.name === 'Vrbo' ? '🏡' : '🔗'} {cal.name}
                  <span style={{ marginLeft: '0.75rem', color: '#6b7280', fontWeight: 400 }}>
                    → {typeLabels[cal.item.type] || cal.item.type}: {cal.item.name}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  <code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{cal.url}</code>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  {cal._count.blocks} bloques sincronizados
                  {cal.lastSync ? ` · Último sync: ${new Date(cal.lastSync).toLocaleString('es-MX')}` : ' · Sin sincronizar'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  📤 Export iCal:{' '}
                  <code style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '3px' }}>
                    https://hangar5.onrender.com/api/ical/{cal.itemId}
                  </code>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => {
                  // Sync single calendar
                  fetch('/api/admin/ical/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ calendarId: cal.id }),
                  }).then(() => window.location.reload());
                }}
                  style={{ padding: '0.4rem 0.75rem', background: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                  🔄 Sync
                </button>
                <button onClick={() => removeCalendar(cal.id)}
                  style={{ padding: '0.4rem 0.75rem', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '0.85rem' }}>
        <strong>📘 Cómo conectar con Airbnb:</strong>
        <ol style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem', color: '#666' }}>
          <li>En Airbnb, ve a <strong>Anuncios → Disponibilidad → Sincronización de calendario</strong></li>
          <li>Copia la URL de <strong>Exportar calendario</strong> y pégala acá como conexión "Airbnb"</li>
          <li>En esa misma página, pega la URL de exportación de Hangar5 (<code>/api/ical/[id]</code>) en <strong>Importar calendario</strong></li>
        </ol>
        <strong style={{ display: 'block', marginTop: '0.75rem' }}>📘 Cómo conectar con Booking.com:</strong>
        <ol style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem', color: '#666' }}>
          <li>En Booking.com, ve a <strong>Calendario → Sincronización de calendarios</strong></li>
          <li>Copia la URL de exportación y agrégala acá</li>
          <li>Importa la URL de Hangar5 en Booking.com para que vean tu disponibilidad</li>
        </ol>
      </div>
    </div>
  );
}
