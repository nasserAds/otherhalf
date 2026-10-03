'use client';

import { useState } from 'react';
import { PageTransition } from '@/components/ui/PageTransition';
import { Button } from '@/components/ui/Button';
import { ApiError, api } from '@/lib/api';

export default function AdminUsersPage() {
  const [adminKey, setAdminKey] = useState('');
  const [username, setUsername] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  async function handleDelete() {
    const key = adminKey.trim();
    const targetUsername = username.trim();

    if (!key || !targetUsername) {
      setMessage('أدخل Admin Key واسم المستخدم أولاً.');
      return;
    }

    if (!window.confirm(`هل أنت متأكد من حذف المستخدم "${targetUsername}" وكل بياناته؟`)) {
      return;
    }

    setDeleting(true);
    setMessage('');

    try {
      const result = await api.deleteAdminUser(key, targetUsername);
      setUsername('');
      setMessage(`تم حذف "${result.username}" وجميع بياناته بنجاح.`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setMessage('Admin Key غير صحيح.');
      } else if (error instanceof ApiError && error.status === 404) {
        setMessage('المستخدم غير موجود.');
      } else if (error instanceof ApiError && error.status === 503) {
        setMessage('Admin deletion غير مفعّل على السيرفر.');
      } else {
        setMessage('تعذر حذف المستخدم الآن.');
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageTransition wide>
      <div className="mb-6">
        <h1 className="text-xl font-extrabold">Admin — حذف مستخدم</h1>
        <p className="mt-1 text-sm text-fg-500">
          احذف مستخدمًا وجميع بياناته المرتبطة من قاعدة البيانات.
        </p>
      </div>

      <div className="rounded-2xl border border-line-800 bg-ink-900 p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="admin-key" className="font-bold text-sm">
              Admin Key
            </label>
            <input
              id="admin-key"
              type="password"
              value={adminKey}
              onChange={(e) => {
                setAdminKey(e.target.value);
                setMessage('');
              }}
              autoComplete="off"
              className="mt-2 w-full min-w-0 rounded-xl border border-line-700 bg-bg-900 px-3 py-2.5 text-sm outline-none focus:border-mint"
            />
          </div>

          <div>
            <label htmlFor="username" className="font-bold text-sm">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setMessage('');
              }}
              maxLength={20}
              dir="auto"
              className="mt-2 w-full min-w-0 rounded-xl border border-line-700 bg-bg-900 px-3 py-2.5 text-sm outline-none focus:border-mint"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleDelete();
              }}
            />
          </div>

          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full border-danger/30 text-danger"
          >
            {deleting ? 'جاري الحذف...' : 'حذف المستخدم'}
          </Button>

          {message && (
            <p className="text-sm font-bold text-fg-500" role="status">
              {message}
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-fg-500">
        الحذف نهائي ويشمل الغرف التي يملكها المستخدم، الرسائل، المشاركات،
        المباريات، التصويتات، التوقعات، وسجل XP المرتبط به.
      </p>
    </PageTransition>
  );
}
