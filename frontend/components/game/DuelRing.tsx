import { MatchDebater } from '@/types';
import { Avatar } from '@/types';
import { AvatarBadge } from '../ui/Avatar';

interface DuelRingProps {
  debaterA: MatchDebater & { avatar: Avatar };
  debaterB: MatchDebater & { avatar: Avatar };
  speakerId?: string | null;
  size?: 'md' | 'lg';
  micStates?: Record<string, boolean>;
}

export function DuelRing({ debaterA, debaterB, speakerId, size = 'lg', micStates }: DuelRingProps) {
  const avatarSize = size === 'lg' ? 'lg' : 'md';
  return (
    <div className="flex items-center justify-center my-1.5 mb-[22px]">
      <Duelist debater={debaterA} avatarSize={avatarSize} speaking={speakerId === debaterA.userId} micOn={micStates?.[debaterA.userId]} stanceClass="bg-mint/15 text-mint" />
      <div className="w-11 h-11 rounded-xl bg-amber text-[#35260A] font-black text-[13px] flex items-center justify-center -mx-1.5 flex-none rotate-45 shadow-amber">
        <span className="-rotate-45">VS</span>
      </div>
      <Duelist debater={debaterB} avatarSize={avatarSize} speaking={speakerId === debaterB.userId} micOn={micStates?.[debaterB.userId]} stanceClass="bg-amber/15 text-amber" />
    </div>
  );
}

function Duelist({
  debater,
  avatarSize,
  speaking,
  micOn,
  stanceClass,
}: {
  debater: MatchDebater & { avatar: Avatar };
  avatarSize: 'md' | 'lg';
  speaking: boolean;
  micOn?: boolean;
  stanceClass: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 w-[120px]">
      <AvatarBadge avatar={debater.avatar} size={avatarSize} speaking={speaking} micOn={micOn} />
      <span className="font-bold text-sm">{debater.username}</span>
      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-pill ${stanceClass}`}>{debater.stanceLabel}</span>
    </div>
  );
}
