'use client';

import { useEffect, useState } from 'react';
import { PageTransition } from '@/components/ui/PageTransition';
import { Button } from '@/components/ui/Button';
import { ApiError, api } from '@/lib/api';

type Stats = Awaited<ReturnType<typeof api.getAdminAnalytics>>;
const ADMIN_KEY_STORAGE = 'otherhalf_admin_session';

export default function AdminDashboardPage() {
  const [adminKey, setAdminKey] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [savedSession, setSavedSession] = useState(false);
  const [playerUsername, setPlayerUsername] = useState('');
  const [currencyAction, setCurrencyAction] = useState<'add' | 'remove'>('add');
  const [xpAmount, setXpAmount] = useState('0');
  const [coinAmount, setCoinAmount] = useState('0');
  const [currencyLoading, setCurrencyLoading] = useState(false);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (saved) {
      setAdminKey(saved);
      setSavedSession(true);
    }
  }, []);

  async function load(key = adminKey) {
    const trimmed = key.trim();
    if (!trimmed) { setMessage('أدخل Admin Key أولاً.'); return; }
    setLoading(true); setMessage('');
    try {
      const nextStats = await api.getAdminAnalytics(trimmed);
      setStats(nextStats);
      window.sessionStorage.setItem(ADMIN_KEY_STORAGE, trimmed);
      setSavedSession(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setMessage('Admin Key غير صحيح.');
        window.sessionStorage.removeItem(ADMIN_KEY_STORAGE);
        setSavedSession(false);
      } else if (error instanceof ApiError && error.status === 503) setMessage('Admin غير مفعّل على السيرفر.');
      else setMessage('تعذر تحميل الإحصائيات.');
    } finally { setLoading(false); }
  }

  function logoutAdmin() {
    window.sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setAdminKey('');
    setStats(null);
    setSavedSession(false);
    setMessage('تم تسجيل الخروج من لوحة الإدارة.');
  }

  async function adjustPlayerCurrency() {
    const username = playerUsername.trim();
    const xp = Number(xpAmount);
    const coins = Number(coinAmount);

    if (!username) {
      setMessage('أدخل Username أولاً.');
      return;
    }
    if (!Number.isInteger(xp) || !Number.isInteger(coins) || xp < 0 || coins < 0 || (xp === 0 && coins === 0)) {
      setMessage('أدخل XP أو Coins بقيمة صحيحة أكبر من صفر.');
      return;
    }

    setCurrencyLoading(true);
    setMessage('');
    try {
      const result = await api.adjustAdminPlayerCurrency(adminKey.trim(), {
        username,
        action: currencyAction,
        xp,
        coins,
      });
      setMessage(
        `${currencyAction === 'add' ? 'تمت الإضافة' : 'تمت الإزالة'} لـ ${result.username}: XP ${result.xp} · Coins ${result.coins}`,
      );
      setXpAmount('0');
      setCoinAmount('0');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setMessage('Admin Key غير صحيح.');
      else if (error instanceof ApiError && error.status === 404) setMessage('اللاعب غير موجود.');
      else if (error instanceof ApiError && error.status === 409) setMessage(error.message);
      else setMessage('تعذر تعديل XP وCoins.');
    } finally {
      setCurrencyLoading(false);
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(stats), adminKey]);

  return (
    <PageTransition>
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black">Admin — Analytics & Rooms</h1>
            <p className="mt-1 text-sm text-fg-500">مراقبة الموقع والغرف والمباريات في الوقت الحقيقي.</p>
          </div>
          {stats && (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => void load()} disabled={loading}>
                {loading ? 'جاري التحديث...' : '↻ تحديث'}
              </Button>
              <Button variant="ghost" onClick={logoutAdmin}>تسجيل خروج</Button>
            </div>
          )}
        </div>
      </div>

      {!stats && (
        <div className="mb-6 rounded-2xl border border-line-800 bg-ink-900 p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void load(); }} placeholder="Admin Key" autoComplete="current-password" className="min-w-0 flex-1 rounded-xl border border-line-700 bg-bg-900 px-3 py-2.5 text-sm outline-none focus:border-mint" />
            <Button onClick={() => void load()} disabled={loading} className="w-full sm:w-auto">{loading ? 'جاري التحميل...' : savedSession ? 'متابعة الجلسة' : 'فتح Dashboard'}</Button>
          </div>
          {savedSession && <p className="mt-2 text-xs font-bold text-mint">✓ جلسة الإدارة محفوظة لهذه الجلسة في هذا المتصفح.</p>}
          {message && <p className="mt-3 text-sm font-bold text-danger">{message}</p>}
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {([['زيارات اليوم', stats.traffic.todayVisits], ['زوار فريدون اليوم', stats.traffic.todayUniqueVisitors], ['متصلون الآن', stats.traffic.onlineVisitors], ['إجمالي الزيارات', stats.traffic.totalVisits], ['المستخدمون', stats.users], ['المباريات الكلية', stats.totalMatches], ['مباريات الآن', stats.activeGames], ['الغرف المفتوحة', stats.rooms.filter((r) => r.status !== 'CLOSED').length]] as [string, number][]).map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-line-800 bg-ink-900 p-4"><div className="text-xs font-bold text-fg-500">{label}</div><div className="mt-2 text-2xl font-black text-mint">{value.toLocaleString('en-US')}</div></div>
            ))}
          </div>


          <div className="mt-6 rounded-2xl border border-line-800 bg-ink-900 p-4">
            <div className="mb-4">
              <h2 className="font-black">إدارة XP و Coins</h2>
              <p className="mt-1 text-xs text-fg-500">ابحث بالـ Username وأضف أو اطرح XP وCoins. لن تنخفض القيم عن صفر.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={playerUsername}
                onChange={(e) => setPlayerUsername(e.target.value)}
                placeholder="Username"
                className="rounded-xl border border-line-700 bg-bg-900 px-3 py-2.5 text-sm outline-none focus:border-mint"
              />
              <select
                value={currencyAction}
                onChange={(e) => setCurrencyAction(e.target.value as 'add' | 'remove')}
                className="rounded-xl border border-line-700 bg-bg-900 px-3 py-2.5 text-sm outline-none focus:border-mint"
              >
                <option value="add">إضافة</option>
                <option value="remove">إزالة</option>
              </select>
              <input
                type="number"
                min="0"
                step="1"
                value={xpAmount}
                onChange={(e) => setXpAmount(e.target.value)}
                placeholder="XP amount"
                className="rounded-xl border border-line-700 bg-bg-900 px-3 py-2.5 text-sm outline-none focus:border-mint"
              />
              <input
                type="number"
                min="0"
                step="1"
                value={coinAmount}
                onChange={(e) => setCoinAmount(e.target.value)}
                placeholder="Coins amount"
                className="rounded-xl border border-line-700 bg-bg-900 px-3 py-2.5 text-sm outline-none focus:border-mint"
              />
            </div>
            <Button
              onClick={() => void adjustPlayerCurrency()}
              disabled={currencyLoading}
              className="mt-3 w-full sm:w-auto"
            >
              {currencyLoading ? 'جاري الحفظ...' : currencyAction === 'add' ? 'إضافة XP / Coins' : 'إزالة XP / Coins'}
            </Button>
          </div>

          <div className="mt-6 rounded-2xl border border-line-800 bg-ink-900 p-4">
            <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-black">الغرف المفتوحة</h2><p className="text-xs text-fg-500">يتحدث تلقائياً كل 10 ثوانٍ.</p></div><span className="rounded-full bg-mint/10 px-3 py-1 text-xs font-bold text-mint">{stats.rooms.filter((r) => r.status !== 'CLOSED').length} rooms</span></div>
            <div className="space-y-3">
              {stats.rooms.filter((room) => room.status !== 'CLOSED').map((room) => (
                <div key={room.id} className="flex flex-col gap-3 rounded-xl border border-line-800 bg-bg-900 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0"><div className="flex items-center gap-2"><span className="font-black tracking-wider">{room.code}</span><span className="text-xs text-fg-500">{room.status}</span></div><div className="mt-1 text-sm text-fg-500">Host: <span className="font-bold text-fg-300">{room.host.username}</span> · {room.players.length}/{room.maxPlayers} online · {room.debateMode}</div></div>
                  <Button variant="ghost" onClick={() => void closeRoom(room.id, room.code)} disabled={closing === room.id} className="w-full border-danger/30 text-danger sm:w-auto">{closing === room.id ? 'جاري الإغلاق...' : 'إغلاق الغرفة'}</Button>
                </div>
              ))}
              {stats.rooms.filter((room) => room.status !== 'CLOSED').length === 0 && <p className="py-6 text-center text-sm text-fg-500">لا توجد غرف مفتوحة حالياً.</p>}
            </div>
          </div>
          {message && <p className="mt-3 text-sm font-bold text-danger">{message}</p>}
        </>
      )}
    </PageTransition>
  );
}