'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageTransition } from '@/components/ui/PageTransition';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { OtpInput } from '@/components/ui/OtpInput';
import { Spinner } from '@/components/ui/Spinner';
import { AvatarBadge } from '@/components/ui/Avatar';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRoomStore } from '@/store/roomStore';
import { useToast } from '@/components/ui/Toast';
import { PublicRoomSummary } from '@/types';

export default function JoinRoomPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [publicRooms, setPublicRooms] = useState<PublicRoomSummary[] | null>(null);
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setRoom = useRoomStore((s) => s.setRoom);
  const { show } = useToast();

  useEffect(() => {
    if (!accessToken) return;
    api.listPublicRooms(accessToken).then(setPublicRooms).catch(() => setPublicRooms([]));
  }, [accessToken]);

  async function handleJoin(joinCode: string) {
    if (!accessToken || joinCode.length !== 6) return;
    setLoading(true);
    try {
      const room = await api.joinRoom(accessToken, joinCode);
      setRoom(room);
      router.push(`/room/${room.code}/lobby`);
    } catch (err) {
      show(err instanceof ApiError ? err.message : 'تعذر الانضمام للغرفة');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/games/jadal" className="text-fg-100" aria-label="العودة"><BackIcon /></Link>
        <h1 className="text-xl font-extrabold">الانضمام لغرفة</h1>
      </div>

      <p className="text-sm text-fg-500 text-center mb-3.5" id="otp-label">أدخل كود الغرفة المكوّن من 6 رموز</p>
      <div className="mb-6" role="group" aria-labelledby="otp-label">
        <OtpInput value={code} onChange={setCode} />
      </div>
      <Button onClick={() => handleJoin(code)} disabled={loading || code.length !== 6}>
        انضمام
      </Button>

      <div className="text-xs font-bold text-fg-500 mt-6 mb-2">غرف عامة متاحة</div>
      {publicRooms === null ? (
        <Spinner />
      ) : (
        <div className="flex flex-col gap-2">
          {publicRooms.length === 0 && <p className="text-xs text-fg-600">لا توجد غرف عامة حاليًا</p>}
          {publicRooms.map((room) => (
            <Card
              key={room.id}
              onClick={() => handleJoin(room.code)}
              className="flex items-center gap-3 py-2.5 px-3.5 cursor-pointer hover:border-mint"
            >
              <AvatarBadge avatar={room.host.avatar} size="sm" />
              <span className="font-bold text-[13px] flex-1">غرفة {room.host.username}</span>
              <span className="text-xs text-fg-500 ltr-nums">
                {room._count.players}/{room.maxPlayers}
              </span>
            </Card>
          ))}
        </div>
      )}
    </PageTransition>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="12 19 5 12 12 5" />
      <line x1="19" y1="12" x2="5" y2="12" />
    </svg>
  );
}
