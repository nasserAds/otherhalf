'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRoomStore } from '@/store/roomStore';
import { getSocket } from '@/lib/socket';
import { SocketEvents } from '@/lib/socketEvents';

// Public STUN server for NAT traversal. Good enough for most home/mobile
// networks; a symmetric-NAT minority will need a TURN server added here
// before this works reliably for them — flagged as a follow-up, not solved
// here (TURN needs paid relay bandwidth, out of scope for this pass).
const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

type SignalData =
  | { type: 'offer'; sdp: string }
  | { type: 'answer'; sdp: string }
  | { type: 'candidate'; candidate: RTCIceCandidateInit };

export function useVoiceChat() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const room = useRoomStore((s) => s.room);
  const [micOn, setMicOn] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [micStates, setMicStates] = useState<Record<string, boolean>>({});
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const joinedVoiceRoomRef = useRef<string | null>(null);

  const closePeer = useCallback((userId: string) => {
    peersRef.current.get(userId)?.close();
    peersRef.current.delete(userId);
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }, []);

  const createPeerConnection = useCallback((remoteUserId: string, token: string) => {
    peersRef.current.get(remoteUserId)?.close();
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current as MediaStream);
    });

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      getSocket(token).emit(SocketEvents.VOICE_SIGNAL, {
        targetUserId: remoteUserId,
        data: { type: 'candidate', candidate: e.candidate.toJSON() } satisfies SignalData,
      });
    };

    pc.ontrack = (e) => {
      setRemoteStreams((prev) => ({ ...prev, [remoteUserId]: e.streams[0] }));
    };

    peersRef.current.set(remoteUserId, pc);
    return pc;
  }, []);

  const callPeer = useCallback(
    async (remoteUserId: string, token: string) => {
      const pc = createPeerConnection(remoteUserId, token);
      const offer = await pc.createOffer();
      if (!offer.sdp) throw new Error('failed to create voice offer');
      await pc.setLocalDescription(offer);
      getSocket(token).emit(SocketEvents.VOICE_SIGNAL, {
        targetUserId: remoteUserId,
        data: { type: 'offer', sdp: offer.sdp } satisfies SignalData,
      });
    },
    [createPeerConnection],
  );

  useEffect(() => {
    if (!accessToken || !room) return;
    const socket = getSocket(accessToken);
    const voiceEnabled = room.debateMode === 'VOICE' || room.debateMode === 'TEXT_VOICE';
    if (!voiceEnabled) return;

    if (joinedVoiceRoomRef.current !== room.id) {
      socket.emit(SocketEvents.VOICE_JOIN);
      joinedVoiceRoomRef.current = room.id;
    }

    const onActivePeers = ({ peerIds }: { peerIds: string[] }) => {
      if (!localStreamRef.current) return;
      peerIds.forEach((peerId) => {
        if (peersRef.current.has(peerId)) return;
        callPeer(peerId, accessToken).catch((err) => console.error('voice call failed:', err));
      });
    };

    const onPeerJoined = ({ userId }: { userId: string }) => {
      if (!localStreamRef.current || peersRef.current.has(userId)) return;
      callPeer(userId, accessToken).catch((err) => console.error('voice call failed:', err));
    };

    const onPeerLeft = ({ userId }: { userId: string }) => closePeer(userId);

    const onSignal = async ({ fromUserId, data }: { fromUserId: string; data: SignalData }) => {
      const pc = peersRef.current.get(fromUserId);
      if (data.type === 'offer') {
        const answerPc = pc ?? createPeerConnection(fromUserId, accessToken);
        await answerPc.setRemoteDescription({ type: 'offer', sdp: data.sdp });
        const answer = await answerPc.createAnswer();
        if (!answer.sdp) throw new Error('failed to create voice answer');
        await answerPc.setLocalDescription(answer);
        socket.emit(SocketEvents.VOICE_SIGNAL, {
          targetUserId: fromUserId,
          data: { type: 'answer', sdp: answer.sdp } satisfies SignalData,
        });
      } else if (data.type === 'answer' && pc) {
        await pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
      } else if (data.type === 'candidate' && pc) {
        await pc.addIceCandidate(data.candidate).catch(() => undefined);
      }
    };

    const onMicState = ({ userId, isMicOn }: { userId: string; isMicOn: boolean }) =>
      setMicStates((prev) => ({ ...prev, [userId]: isMicOn }));

    socket.on(SocketEvents.VOICE_ACTIVE_PEERS, onActivePeers);
    socket.on(SocketEvents.VOICE_PEER_JOINED, onPeerJoined);
    socket.on(SocketEvents.VOICE_PEER_LEFT, onPeerLeft);
    socket.on(SocketEvents.VOICE_SIGNAL, onSignal);
    socket.on(SocketEvents.VOICE_MIC_STATE, onMicState);

    return () => {
      socket.off(SocketEvents.VOICE_ACTIVE_PEERS, onActivePeers);
      socket.off(SocketEvents.VOICE_PEER_JOINED, onPeerJoined);
      socket.off(SocketEvents.VOICE_PEER_LEFT, onPeerLeft);
      socket.off(SocketEvents.VOICE_SIGNAL, onSignal);
      socket.off(SocketEvents.VOICE_MIC_STATE, onMicState);
    };
  }, [accessToken, room, callPeer, createPeerConnection, closePeer]);

  // Tears down every connection on unmount (e.g. leaving the room/app) so
  // we don't leak mic access or dangling peer connections. This hook now
  // lives in app/room/[code]/layout.tsx (persists across Lobby <-> Game
  // navigation within a room) rather than in each page, so this only fires
  // when actually leaving the room, not on every screen change.
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
    };
  }, []);

  const toggleMic = useCallback(async () => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);
    setMicError(null);

    if (micOn) {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      setRemoteStreams({});
      socket.emit(SocketEvents.VOICE_MIC_STATE, { isMicOn: false });
      socket.emit(SocketEvents.VOICE_JOIN);
      setMicOn(false);
      return;
    }

    try {
      if (!window.isSecureContext) {
        throw new Error('PHONE_MIC_REQUIRES_HTTPS');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
    } catch (err) {
      // Permission denied or no mic available — stay off, don't join voice.
      const message =
        err instanceof Error && err.message === 'PHONE_MIC_REQUIRES_HTTPS'
          ? 'Microphone needs HTTPS on phones. You can still listen here, but phone mic will not open from this HTTP LAN URL.'
          : 'Microphone permission was blocked or no microphone is available.';
      setMicError(message);
      return;
    }

    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    setRemoteStreams({});
    socket.emit(SocketEvents.VOICE_JOIN);
    socket.emit(SocketEvents.VOICE_MIC_STATE, { isMicOn: true });
    setMicOn(true);
  }, [accessToken, micOn]);

  return { micOn, micError, micStates, remoteStreams, toggleMic };
}
