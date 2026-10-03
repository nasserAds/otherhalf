'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { PageTransition } from '@/components/ui/PageTransition';
import { Button } from '@/components/ui/Button';
import { ConnectionBanner } from '@/components/ui/ConnectionBanner';
import { MicButton } from '@/components/ui/MicButton';
import { RemoteAudioPlayers } from '@/components/ui/RemoteAudioPlayers';
import { DuelRing } from '@/components/game/DuelRing';
import { TimerRing } from '@/components/game/TimerRing';
import { TopicCard, ReactionBar } from '@/components/game/TopicCard';
import { VoteBar } from '@/components/game/VoteBar';
import { ConfettiBurst } from '@/components/game/ConfettiBurst';
import { ChatDrawer } from '@/components/game/ChatDrawer';
import { AvatarBadge } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { useRoomStore } from '@/store/roomStore';
import { useGameStore } from '@/store/gameStore';
import { useRoomSocket } from '@/hooks/useRoomSocket';
import { useGameSocket } from '@/hooks/useGameSocket';
import { useVoiceChatContext } from '@/components/providers/VoiceChatProvider';
import { useSound } from '@/hooks/useSound';
import { PHASE_LABELS_AR } from '@/lib/constants';
import { Avatar, MatchDebater } from '@/types';

export default function GamePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const room = useRoomStore((s) => s.room);
  const chat = useRoomStore((s) => s.chat);

  // Selective subscriptions instead of the whole store object — each
  // screen only re-renders for the slice of game state it actually reads.
  const topicVote = useGameStore((s) => s.topicVote);
  const matchId = useGameStore((s) => s.matchId);
  const topic = useGameStore((s) => s.topic);
  const debaterAData = useGameStore((s) => s.debaterA);
  const debaterBData = useGameStore((s) => s.debaterB);
  const phase = useGameStore((s) => s.phase);
  const speakerId = useGameStore((s) => s.speakerId);
  const remainingSeconds = useGameStore((s) => s.remainingSeconds);
  const durationSeconds = useGameStore((s) => s.durationSeconds);
  const myVoteAccepted = useGameStore((s) => s.myVoteAccepted);
  const myPredictionAccepted = useGameStore((s) => s.myPredictionAccepted);
  const result = useGameStore((s) => s.result);
  const lastReaction = useGameStore((s) => s.lastReaction);
  const reset = useGameStore((s) => s.reset);

  const { sendChat } = useRoomSocket(params.code); // keeps room membership alive if this screen is entered directly
  const { submitTurn, castVote, castPrediction, castTopicVote, react } = useGameSocket();
  const {
    micOn,
    micError,
    micStates,
    remoteStreams,
    audioEnabled,
    mutedUsers,
    toggleRemoteMute,
    toggleMic,
  } = useVoiceChatContext();
  const sound = useSound();
  const voiceEnabled = room?.debateMode === 'VOICE' || room?.debateMode === 'TEXT_VOICE';

  function avatarFor(userId: string): Avatar {
    return room?.players.find((p) => p.userId === userId)?.user.avatar ?? 'LION';
  }

  function goToLobby() {
    reset(); // clear matchId so the Lobby doesn't immediately redirect back here
    router.push(`/room/${params.code}/lobby`);
  }

  // --- Sound cues, each tied to one specific state transition ---
  const lastTickPlayedAt = useRef<number | null>(null);
  useEffect(() => {
    if (remainingSeconds > 0 && remainingSeconds <= 5 && lastTickPlayedAt.current !== remainingSeconds) {
      lastTickPlayedAt.current = remainingSeconds;
      sound.tick();
    }
  }, [remainingSeconds, sound]);

  useEffect(() => {
    if (lastReaction) sound.notification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastReaction?.ts]);

  useEffect(() => {
    if (myVoteAccepted) sound.success();
  }, [myVoteAccepted, sound]);

  useEffect(() => {
    if (myPredictionAccepted) sound.success();
  }, [myPredictionAccepted, sound]);

  useEffect(() => {
    if (topicVote) sound.notification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!topicVote]);

  useEffect(() => {
    if (!result || !user) return;
    if (result.isDraw) sound.notification();
    else if (result.winnerId === user.id) sound.win();
    else sound.error();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (!topicVote && (!matchId || !debaterAData || !debaterBData)) {
    return (
      <PageTransition wide>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-fg-500 text-sm">لا توجد جولة نشطة حاليًا</p>
          <Button variant="ghost" onClick={goToLobby}>
            العودة لغرفة الانتظار
          </Button>
        </div>
      </PageTransition>
    );
  }

  const debaterA = debaterAData ? { ...debaterAData, avatar: avatarFor(debaterAData.userId) } : null;
  const debaterB = debaterBData ? { ...debaterBData, avatar: avatarFor(debaterBData.userId) } : null;
  const isSpeakingPhase = phase === 'ROUND_1' || phase === 'ROUND_2' || phase === 'FINAL';
  const viewKey = topicVote ? 'topicVote' : phase === 'VOTING' ? 'voting' : phase === 'COMPLETED' ? 'winner' : 'game';

  return (
    <PageTransition wide>
      <RemoteAudioPlayers streams={remoteStreams} audioEnabled={audioEnabled} mutedUsers={mutedUsers} />
      <ConnectionBanner />
      <ReactionOverlay reaction={lastReaction} />
      <ChatDrawer messages={chat} onSend={sendChat} />
      {voiceEnabled && (
        <div className="fixed bottom-5 right-5 z-40">
          <MicButton
            active={micOn}
            onClick={() => {
              sound.click();
              toggleMic();
            }}
          />
          {micError && <p className="mt-2 max-w-[240px] text-center text-xs font-bold text-amber">{micError}</p>}
          <div className="mt-2 rounded-lg border border-line-800 bg-ink-900/95 p-2">
            <p className="mb-1 text-[10px] font-bold text-fg-600">أصوات اللاعبين</p>
            {room?.players
              .filter((player) => player.userId !== user?.id)
              .map((player) => (
                <button
                  key={player.userId}
                  type="button"
                  onClick={() => toggleRemoteMute(player.userId)}
                  aria-pressed={Boolean(mutedUsers[player.userId])}
                  className="flex w-full items-center justify-between gap-4 rounded px-1 py-1 text-xs font-bold text-fg-500 hover:bg-ink-800 hover:text-fg-100"
                >
                  <span>{player.user.username}</span>
                  <span className={mutedUsers[player.userId] ? 'text-amber' : 'text-mint'}>
                    {mutedUsers[player.userId] ? 'مكتوم' : 'مسموع'}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Announces phase changes for screen readers without needing visual focus to move */}
      <span className="sr-only" role="status" aria-live="assertive">
        {topicVote ? 'اختيار الموضوع جارٍ' : phase ? PHASE_LABELS_AR[phase] : ''}
        {phase && remainingSeconds <= 5 && remainingSeconds > 0 ? ` — ${remainingSeconds} ثوانٍ متبقية` : ''}
      </span>

      <AnimatePresence mode="wait">
        {viewKey === 'topicVote' && topicVote && (
          <motion.div
            key="topicVote"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            <TopicVoteView
              state={topicVote}
              onVote={(topicId) => {
                sound.click();
                castTopicVote(topicId);
              }}
            />
          </motion.div>
        )}

        {viewKey === 'voting' && debaterA && debaterB && matchId && (
          <motion.div
            key="voting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            <VotingView
              debaterA={debaterA}
              debaterB={debaterB}
              myUserId={user?.id}
              remaining={remainingSeconds}
              total={durationSeconds}
              accepted={myVoteAccepted}
              onVote={(votedForId) => {
                sound.click();
                castVote(matchId, votedForId);
              }}
            />
          </motion.div>
        )}

        {viewKey === 'winner' && result && debaterA && debaterB && (
          <motion.div
            key="winner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            <WinnerView result={result} debaterA={debaterA} debaterB={debaterB} myUserId={user?.id} onNext={goToLobby} />
          </motion.div>
        )}

        {viewKey === 'game' && phase && debaterA && debaterB && matchId && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            <GameView
              topic={topic ?? ''}
              debaterA={debaterA}
              debaterB={debaterB}
              phase={phase}
              speakerId={speakerId}
              remaining={remainingSeconds}
              total={durationSeconds}
              isMySpeakingTurn={isSpeakingPhase && speakerId === user?.id}
              micStates={micStates}
              myUserId={user?.id}
              predictionAccepted={myPredictionAccepted}
              onSubmitTurn={(text) => submitTurn(matchId, text)}
              onReact={(emoji) => {
                sound.click();
                react(matchId, emoji);
              }}
              onPredict={(predictedWinnerId) => castPrediction(matchId, predictedWinnerId)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

interface DebaterWithAvatar extends MatchDebater {
  avatar: Avatar;
}

function TopicVoteView({
  state,
  onVote,
}: {
  state: {
    candidates: { topicId: string; text: string }[];
    remainingSeconds: number;
    durationSeconds: number;
    debaterA: { userId: string; username: string };
    debaterB: { userId: string; username: string };
    counts: Record<string, number>;
    myChoice: string | null;
  };
  onVote: (topicId: string) => void;
}) {
  const totalVotes = Object.values(state.counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="self-center bg-ink-800 border border-line-800 text-amber text-xs font-extrabold px-4 py-1.5 rounded-pill mb-2">
        اختيار الموضوع
      </div>
      <p className="text-sm text-fg-500 text-center mb-1">
        {state.debaterA.username} × {state.debaterB.username}
      </p>
      <p className="text-xs text-fg-600 text-center mb-4">صوّتوا لموضوع المناظرة القادمة</p>
      <TimerRing remaining={state.remainingSeconds} total={state.durationSeconds || 1} />

      <div className="flex flex-col gap-2.5" role="group" aria-label="التصويت على الموضوع">
        {state.candidates.map((c) => {
          const count = state.counts[c.topicId] ?? 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const chosen = state.myChoice === c.topicId;
          return (
            <button
              key={c.topicId}
              onClick={() => onVote(c.topicId)}
              aria-pressed={chosen}
              className={`relative overflow-hidden text-right p-3.5 rounded-lg border-2 transition-all ${
                chosen ? 'border-mint shadow-mint' : 'border-line-800 hover:border-line-800'
              }`}
            >
              <div
                className="absolute inset-y-0 right-0 bg-mint/10 transition-all"
                style={{ width: `${pct}%` }}
                aria-hidden="true"
              />
              <div className="relative flex items-center justify-between gap-3">
                <span className="text-sm font-bold">{c.text}</span>
                <span className="text-xs text-fg-500 ltr-nums flex-none">{pct}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function GameView({
  topic,
  debaterA,
  debaterB,
  phase,
  speakerId,
  remaining,
  total,
  isMySpeakingTurn,
  micStates,
  myUserId,
  predictionAccepted,
  onSubmitTurn,
  onReact,
  onPredict,
}: {
  topic: string;
  debaterA: DebaterWithAvatar;
  debaterB: DebaterWithAvatar;
  phase: string;
  speakerId: string | null;
  remaining: number;
  total: number;
  isMySpeakingTurn: boolean;
  micStates: Record<string, boolean>;
  myUserId?: string;
  predictionAccepted: boolean;
  onSubmitTurn: (text: string) => void;
  onReact: (emoji: string) => void;
  onPredict: (predictedWinnerId: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const isDebater = myUserId === debaterA.userId || myUserId === debaterB.userId;

  function send() {
    if (!draft.trim()) return;
    onSubmitTurn(draft.trim());
    setDraft('');
  }

  return (
    <>
      <div className="self-center bg-ink-800 border border-line-800 text-amber text-xs font-extrabold px-4 py-1.5 rounded-pill mb-4">
        {PHASE_LABELS_AR[phase]}
      </div>
      <DuelRing debaterA={debaterA} debaterB={debaterB} speakerId={speakerId} micStates={micStates} />
      <TimerRing remaining={remaining} total={total || 1} />
      <TopicCard topic={topic} />

      {/* Predictions only make sense before anyone's spoken — offered once,
          during PREPARING, to the audience (not the two debaters). */}
      {phase === 'PREPARING' && !isDebater && (
        <PredictionPanel debaterA={debaterA} debaterB={debaterB} accepted={predictionAccepted} onPredict={onPredict} />
      )}

      {isMySpeakingTurn ? (
        <div className="mt-4 flex flex-col gap-2">
          <label htmlFor="turn-input" className="sr-only">
            حجتك في هذه الجولة
          </label>
          <textarea
            id="turn-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="اكتب حجتك هنا..."
            rows={3}
            className="w-full bg-ink-800 border border-line-800 rounded-md p-3 text-sm resize-none focus:outline-none focus:border-mint focus:shadow-mint"
          />
          <Button size="sm" onClick={send} disabled={!draft.trim()}>
            إرسال
          </Button>
        </div>
      ) : phase !== 'PREPARING' ? (
        <ReactionBar onReact={onReact} />
      ) : null}
    </>
  );
}

function PredictionPanel({
  debaterA,
  debaterB,
  accepted,
  onPredict,
}: {
  debaterA: DebaterWithAvatar;
  debaterB: DebaterWithAvatar;
  accepted: boolean;
  onPredict: (predictedWinnerId: string) => void;
}) {
  const [choice, setChoice] = useState<string | null>(null);

  function predict(userId: string) {
    setChoice(userId);
    onPredict(userId);
  }

  return (
    <div className="mt-4 p-3.5 bg-ink-900 border border-line-800 rounded-lg">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-base">🎯</span>
        <span className="text-xs font-extrabold text-fg-100">توقع الفائز</span>
        <span className="text-[10px] text-fg-600 mr-auto">+5 XP لو كان توقعك صحيحًا</span>
      </div>
      <div className="flex gap-2" role="group" aria-label="توقع الفائز">
        {[debaterA, debaterB].map((d) => (
          <button
            key={d.userId}
            onClick={() => predict(d.userId)}
            disabled={accepted}
            aria-pressed={choice === d.userId}
            aria-label={`توقع فوز ${d.username}`}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md border text-xs font-bold transition-colors ${
              choice === d.userId ? 'border-amber bg-amber/10 text-amber' : 'border-line-800 text-fg-500 hover:text-fg-100'
            }`}
          >
            {d.username}
          </button>
        ))}
      </div>
      {accepted && (
        <p className="text-amber text-xs font-bold text-center mt-2.5" role="status">
          تم تسجيل توقعك ✓
        </p>
      )}
    </div>
  );
}

function VotingView({
  debaterA,
  debaterB,
  myUserId,
  remaining,
  total,
  accepted,
  onVote,
}: {
  debaterA: DebaterWithAvatar;
  debaterB: DebaterWithAvatar;
  myUserId?: string;
  remaining: number;
  total: number;
  accepted: boolean;
  onVote: (votedForId: string) => void;
}) {
  const [choice, setChoice] = useState<string | null>(null);
  const isDebater = myUserId === debaterA.userId || myUserId === debaterB.userId;

  function vote(userId: string) {
    setChoice(userId);
    onVote(userId);
  }

  return (
    <>
      <div className="self-center bg-ink-800 border border-line-800 text-amber text-xs font-extrabold px-4 py-1.5 rounded-pill mb-2">
        {PHASE_LABELS_AR.VOTING}
      </div>
      <TimerRing remaining={remaining} total={total || 1} />

      {isDebater ? (
        <p className="text-sm text-fg-500 text-center mt-2">أنت تناظر الآن — لا يمكنك التصويت في جولتك</p>
      ) : (
        <>
          <p className="text-sm text-fg-500 text-center mb-5">من كان الأقوى في الحجة؟</p>
          <div className="flex gap-3" role="group" aria-label="التصويت للفائز">
            {[debaterA, debaterB].map((d, i) => (
              <button
                key={d.userId}
                onClick={() => vote(d.userId)}
                disabled={accepted}
                aria-pressed={choice === d.userId}
                aria-label={`صوّت لـ ${d.username}`}
                className={`flex-1 flex flex-col items-center gap-2 p-3.5 rounded-lg border-2 transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0 ${
                  choice === d.userId
                    ? i === 0
                      ? 'border-mint shadow-mint'
                      : 'border-amber shadow-amber'
                    : 'border-line-800'
                }`}
              >
                <AvatarBadge avatar={d.avatar} size="lg" />
                <span className="font-bold text-sm">{d.username}</span>
              </button>
            ))}
          </div>
          {accepted && (
            <p className="text-mint text-sm font-bold text-center mt-4" role="status">
              تم التصويت ✓
            </p>
          )}
        </>
      )}
    </>
  );
}

function WinnerView({
  result,
  debaterA,
  debaterB,
  myUserId,
  onNext,
}: {
  result: {
    winnerId: string | null;
    isDraw: boolean;
    votes: { debaterA: number; debaterB: number };
    xpAwarded: Record<string, number>;
    correctPredictorIds: string[];
  };
  debaterA: DebaterWithAvatar;
  debaterB: DebaterWithAvatar;
  myUserId?: string;
  onNext: () => void;
}) {
  const totalVotes = result.votes.debaterA + result.votes.debaterB;
  const aPct = totalVotes > 0 ? Math.round((result.votes.debaterA / totalVotes) * 100) : null;
  const bPct = totalVotes > 0 ? Math.round((result.votes.debaterB / totalVotes) * 100) : null;
  const winner = result.winnerId === debaterA.userId ? debaterA : result.winnerId === debaterB.userId ? debaterB : null;
  const myXp = myUserId ? result.xpAwarded[myUserId] : undefined;
  const predictedCorrectly = myUserId ? result.correctPredictorIds.includes(myUserId) : false;

  return (
    <div className="relative flex-1 flex flex-col items-center text-center">
      <ConfettiBurst />
      <div className="flex-1 flex flex-col items-center justify-center gap-1 w-full">
        <div className="text-xs font-bold text-fg-500 mb-1">{result.isDraw ? '🤝 تعادل' : '🏆 الفائز'}</div>

        <div className="relative mb-4">
          {myXp !== undefined && myXp > 0 && (
            <motion.div
              animate={{ y: [0, -6, 0], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-mint text-white font-black text-[13px] px-3 py-1 rounded-pill ltr-nums"
            >
              +{myXp} XP
            </motion.div>
          )}
          {result.isDraw ? (
            <div className="flex gap-3">
              <div className="animate-winnerFloat"><AvatarBadge avatar={debaterA.avatar} size="xl" ringColor="amber" glow /></div>
              <div className="animate-winnerFloat"><AvatarBadge avatar={debaterB.avatar} size="xl" ringColor="amber" glow /></div>
            </div>
          ) : (
            <div className="animate-winnerFloat">
              <AvatarBadge avatar={(winner ?? debaterA).avatar} size="xl" ringColor="amber" glow />
            </div>
          )}
        </div>

        <h1 className="text-2xl font-extrabold">{result.isDraw ? `${debaterA.username} و ${debaterB.username}` : winner?.username}</h1>
        <p className="text-sm text-fg-500">{result.isDraw ? 'مناظرة متكافئة تمامًا!' : 'فاز بإقناع الجمهور!'}</p>

        {predictedCorrectly && (
          <p className="text-amber text-xs font-bold mt-2">🎯 توقعك كان صحيحًا! +5 XP</p>
        )}

        <div className="flex flex-col gap-3 w-full mt-6">
          <VoteBar label={debaterA.username} percent={aPct} side="a" />
          <VoteBar label={debaterB.username} percent={bPct} side="b" />
        </div>
      </div>
      <Button onClick={onNext}>الجولة التالية</Button>
    </div>
  );
}

function ReactionOverlay({ reaction }: { reaction: { emoji: string; ts: number } | null }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 flex justify-center z-40">
      <AnimatePresence>
        {reaction && (
          <motion.span
            key={reaction.ts}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -40, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1 }}
            className="text-4xl"
          >
            {reaction.emoji}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
