'use client';

import { useEffect, useState } from 'react';
import { PageTransition } from '@/components/ui/PageTransition';
import { Button } from '@/components/ui/Button';
import { ApiError, api } from '@/lib/api';

type Stats = Awaited<ReturnType<typeof api.getAdminAnalytics>>;

export default function AdminDashboardPage() {
  const [adminKey, setAdminKey] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function load(key = adminKey) {
    if (!key.trim()) { setMessage('أدخل Admin Key أولاً.'); return; }
    setLoading(true); setMessage('');
    try { setStats(await api.getAdminAnalytics(key.trim())); }
    catch (error) {
      if (error instanceof ApiError && error.status === 401) setMessage('Admin Key غير صحيح.');
      else if (error instanceof ApiError && error.status === 503) setMessage('Admin غير مفعّل على السيرفر.');
      else setMessage('تعذر تحميل الإحصائيات.');
    } finally { setLoading(false); }
  }

  async function closeRoom(roomId: string, code: string) {
    if (!window.confirm(`إغلاق الغرفة ${code}؟ سيتم إخراج اللاعبين منها.`)) return;
    setClosing(roomId); setMessage('');
    try { await api.closeAdminRoom(adminKey.trim(), roomId); await load(); }
    catch (error) {
      if (error instanceof ApiError && error.status === 401) setMessage('Admin Key غير صحيح.');
      else setMessage('تعذر إغلاق الغرفة.');
    } finally { setClosing(null); }
  }

  useEffect(() => {
    if (!stats || !adminKey.trim()) return;
    const interval = window.setInterval(() => { void load(); }, 10_000);
    return () => window.clearInterval(interval);
  }, [stats, adminKey]);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-black">Admin — Analytics & Rooms</h1>
        <p className="mt-1 text-sm text-fg-500">مراقبة الموقع والغرف والمباريات في الوقت الحقيقي.</p>
      </div>

      <div className="mb-6 rounded-2xl border border-line-800 bg-ink-900 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void load(); }}
            placeholder="Admin Key"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-line-700 bg-bg-900 px-3 py-2.5 text-sm outline-none focus:border-mint"
          />
          <Button onClick={() => void load()} disabled={loading} className="w-full sm:w-auto">
            {loading ? 'جاري التحميل...' : 'فتح Dashboard'}
          </Button>
        </div>
        {message && <p className="mt-3 text-sm font-bold text-danger">{message}</p>}
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {([
              ['زيارات اليوم', stats.traffic.todayVisits],
              ['زوار فريدون اليوم', stats.traffic.todayUniqueVisitors],
              ['متصلون الآن', stats.traffic.onlineVisitors],
              ['إجمالي الزيارات', stats.traffic.totalVisits],
              ['المستخدمون', stats.users],
              ['المباريات الكلية', stats.totalMatches],
              ['مباريات الآن', stats.activeGames],
              ['الغرف المفتوحة', stats.rooms.filter((r) => r.status !== 'CLOSED').length],
            ] as [string, number][]).map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-line-800 bg-ink-900 p-4">
                <div className="text-xs font-bold text-fg-500">{label}</div>
                <div className="mt-2 text-2xl font-black text-mint">{value.toLocaleString('en-US')}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-line-800 bg-ink-900 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><h2 className="font-black">الغرف المفتوحة</h2><p className="text-xs text-fg-500">يتحدث تلقائياً كل 10 ثوانٍ.</p></div>
              <span className="rounded-full bg-mint/10 px-3 py-1 text-xs font-bold text-mint">{stats.rooms.filter((r) => r.status !== 'CLOSED').length} rooms</span>
            </div>
            <div className="space-y-3">
              {stats.rooms.filter((room) => room.status !== 'CLOSED').map((room) => (
                <div key={room.id} className="flex flex-col gap-3 rounded-xl border border-line-800 bg-bg-900 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><span className="font-black tracking-wider">{room.code}</span><span className="text-xs text-fg-500">{room.status}</span></div>
                    <div className="mt-1 text-sm text-fg-500">Host: <span className="font-bold text-fg-300">{room.host.username}</span> · {room.players.length}/{room.maxPlayers} online · {room.debateMode}</div>
                  </div>
                  <Button variant="ghost" onClick={() => void closeRoom(room.id, room.code)} disabled={closing === room.id} className="w-full border-danger/30 text-danger sm:w-auto">
                    {closing === room.id ? 'جاري الإغلاق...' : 'إغلاق الغرفة'}
                  </Button>
                </div>
              ))}
              {stats.rooms.filter((room) => room.status !== 'CLOSED').length === 0 && <p className="py-6 text-center text-sm text-fg-500">لا توجد غرف مفتوحة حالياً.</p>}
            </div>
          </div>
        </>
      )}
    </PageTransition>
  );
}