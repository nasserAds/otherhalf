'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageTransition } from '@/components/ui/PageTransition';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Stepper } from '@/components/ui/Stepper';
import { PillToggle } from '@/components/ui/PillToggle';
import { Switch } from '@/components/ui/Switch';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRoomStore } from '@/store/roomStore';
import { useToast } from '@/components/ui/Toast';
import { DebateMode } from '@/types';

export default function CreateRoomPage() {
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [debateMode, setDebateMode] = useState<DebateMode>('TEXT');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setRoom = useRoomStore((s) => s.setRoom);
  const { show } = useToast();

  async function handleCreate() {
    if (!accessToken) return;
    setLoading(true);
    try {
      const room = await api.createRoom(accessToken, {
        maxPlayers,
        debateMode,
        visibility: isPublic ? 'PUBLIC' : 'PRIVATE',
      });
      setRoom(room);
      router.push(`/room/${room.code}/lobby`);
    } catch (err) {
      show(err instanceof ApiError ? err.message : 'تعذر إنشاء الغرفة');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/games/jadal" className="text-fg-100"><BackIcon /></Link>
        <h1 className="text-xl font-extrabold">إنشاء غرفة</h1>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm">الحد الأقصى للاعبين</span>
            <Stepper value={maxPlayers} min={4} max={12} onChange={setMaxPlayers} />
          </div>
        </Card>

        <Card>
          <div className="font-bold text-sm mb-2.5">نمط المناظرة</div>
          <PillToggle
            value={debateMode}
            onChange={setDebateMode}
            options={[
              { value: 'TEXT', label: 'نص' },
              { value: 'VOICE', label: 'صوت' },
              { value: 'TEXT_VOICE', label: 'نص + صوت' },
            ]}
          />
        </Card>

        <Card className="flex items-center justify-between">
          <span className="font-bold text-sm">غرفة عامة</span>
          <Switch checked={isPublic} onChange={setIsPublic} />
        </Card>
      </div>

      <Button onClick={handleCreate} disabled={loading} className="mt-auto">
        إنشاء
      </Button>
    </PageTransition>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="12 19 5 12 12 5" />
      <line x1="19" y1="12" x2="5" y2="12" />
    </svg>
  );
}
