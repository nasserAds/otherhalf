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
  // Try remote playback immediately. Browsers that enforce autoplay may still
  // require a prior page interaction, but voice no longer waits on a separate
  // "listen" control or on local microphone permission.
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [mutedUsers, setMutedUsers] = useState<Record<string, boolean>>({});

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const joinedVoiceRoomRef = useRef<string | null>(null);
  const voicePeerIdsRef = useRef<Set<string>>(new Set());

  const closePeer = useCallback((userId: string) => {
    peersRef.current.get(userId)?.close();
    peersRef.current.delete(userId);
    pendingCandidatesRef.current.delete(userId);
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }, []);

  const createPeerConnection = useCallback((remoteUserId: string, token: string) => {
    peersRef.current.get(remoteUserId)?.close();
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // A listen-only browser still needs an audio recvonly m-line in its offer.
    // Without this transceiver, the speaking peer has nowhere to send audio
    // until the listener enables their own microphone.
    const localAudioTrack = localStreamRef.current?.getAudioTracks()[0] ?? null;
    const audioTransceiver = pc.addTransceiver('audio', {
      direction: localAudioTrack ? 'sendrecv' : 'recvonly',
    });
    if (localAudioTrack) {
      audioTransceiver.sender.replaceTrack(localAudioTrack).catch(() => undefined);
    }

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      getSocket(token).emit(SocketEvents.VOICE_SIGNAL, {
        targetUserId: remoteUserId,
        data: { type: 'candidate', candidate: e.candidate.toJSON() } satisfies SignalData,
      });
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0] ?? new MediaStream([e.track]);
      setRemoteStreams((prev) => ({ ...prev, [remoteUserId]: stream }));
    };

    peersRef.current.set(remoteUserId, pc);
    return pc;
  }, []);

  const renegotiatePeer = useCallback(async (remoteUserId: string, token: string) => {
    const pc = peersRef.current.get(remoteUserId);
    if (!pc) return;

    const localTracks = localStreamRef.current?.getTracks() ?? [];
    const audioSender = pc.getSenders().find((sender) => sender.track?.kind === 'audio');
    const localAudioTrack = localTracks.find((track) => track.kind === 'audio') ?? null;
    const audioTransceiver = pc.getTransceivers().find((transceiver) => transceiver.receiver.track.kind === 'audio');
    if (audioTransceiver) {
      audioTransceiver.direction = localAudioTrack ? 'sendrecv' : 'recvonly';
      await audioTransceiver.sender.replaceTrack(localAudioTrack);
    } else if (audioSender) {
      await audioSender.replaceTrack(localAudioTrack);
    } else if (localAudioTrack) {
      pc.addTrack(localAudioTrack, localStreamRef.current as MediaStream);
    }

    const offer = await pc.createOffer();
    if (!offer.sdp) throw new Error('failed to create voice renegotiation offer');
    await pc.setLocalDescription(offer);
    getSocket(token).emit(SocketEvents.VOICE_SIGNAL, {
      targetUserId: remoteUserId,
      data: { type: 'offer', sdp: offer.sdp } satisfies SignalData,
    });
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

    const onActivePeers = ({
      peerIds,
      micOnPeerIds = [],
    }: {
      peerIds: string[];
      micOnPeerIds?: string[];
    }) => {
      setMicStates((prev) => {
        const next = { ...prev };
        peerIds.forEach((peerId) => {
          next[peerId] = micOnPeerIds.includes(peerId);
        });
        return next;
      });
      peerIds.forEach((peerId) => {
        voicePeerIdsRef.current.add(peerId);
        if (peersRef.current.has(peerId)) return;
        callPeer(peerId, accessToken).catch((err) => console.error('voice call failed:', err));
      });
    };

    const onPeerLeft = ({ userId }: { userId: string }) => {
      voicePeerIdsRef.current.delete(userId);
      setMicStates((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      closePeer(userId);
    };

    const onSignal = async ({ fromUserId, data }: { fromUserId: string; data: SignalData }) => {
      try {
        const pc = peersRef.current.get(fromUserId);
        if (data.type === 'offer') {
          const answerPc = pc ?? createPeerConnection(fromUserId, accessToken);
          await answerPc.setRemoteDescription({ type: 'offer', sdp: data.sdp });
          const queued = pendingCandidatesRef.current.get(fromUserId) ?? [];
          pendingCandidatesRef.current.delete(fromUserId);
          for (const candidate of queued) {
            await answerPc.addIceCandidate(candidate).catch(() => undefined);
          }
          const answer = await answerPc.createAnswer();
          if (!answer.sdp) throw new Error('failed to create voice answer');
          await answerPc.setLocalDescription(answer);
          socket.emit(SocketEvents.VOICE_SIGNAL, {
            targetUserId: fromUserId,
            data: { type: 'answer', sdp: answer.sdp } satisfies SignalData,
          });
        } else if (data.type === 'answer' && pc) {
          await pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
        } else if (data.type === 'candidate') {
          if (!pc || !pc.remoteDescription) {
            const pending = pendingCandidatesRef.current.get(fromUserId) ?? [];
            pending.push(data.candidate);
            pendingCandidatesRef.current.set(fromUserId, pending);
          } else {
            await pc.addIceCandidate(data.candidate).catch(() => undefined);
          }
        }
      } catch (err) {
        console.error('voice signaling failed:', err);
      }
    };

    const onMicState = ({ userId, isMicOn }: { userId: string; isMicOn: boolean }) =>
      setMicStates((prev) => ({ ...prev, [userId]: isMicOn }));

    socket.on(SocketEvents.VOICE_ACTIVE_PEERS, onActivePeers);
    socket.on(SocketEvents.VOICE_PEER_LEFT, onPeerLeft);
    socket.on(SocketEvents.VOICE_SIGNAL, onSignal);
    socket.on(SocketEvents.VOICE_MIC_STATE, onMicState);

    const joinVoiceAfterRoomJoin = () => {
      if (joinedVoiceRoomRef.current === room.id) return;
      // RoomsGateway is also responsible for the normal room join. Sending
      // this idempotent join with an acknowledgement guarantees voice starts
      // only after the server has populated client.data.roomId.
      socket.emit(SocketEvents.ROOM_JOIN, { code: room.code }, () => {
        if (joinedVoiceRoomRef.current === room.id) return;
        socket.emit(SocketEvents.VOICE_JOIN);
        joinedVoiceRoomRef.current = room.id;
      });
    };

    socket.on('connect', joinVoiceAfterRoomJoin);
    if (socket.connected) joinVoiceAfterRoomJoin();

    return () => {
      socket.off('connect', joinVoiceAfterRoomJoin);
      socket.off(SocketEvents.VOICE_ACTIVE_PEERS, onActivePeers);
      socket.off(SocketEvents.VOICE_PEER_LEFT, onPeerLeft);
      socket.off(SocketEvents.VOICE_SIGNAL, onSignal);
      socket.off(SocketEvents.VOICE_MIC_STATE, onMicState);
      if (joinedVoiceRoomRef.current === room.id) {
        socket.emit(SocketEvents.VOICE_LEAVE);
        joinedVoiceRoomRef.current = null;
      }
      voicePeerIdsRef.current.clear();
    };
  }, [accessToken, room?.id, room?.debateMode, callPeer, createPeerConnection, closePeer]);

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
      pendingCandidatesRef.current.clear();
      voicePeerIdsRef.current.clear();
    };
  }, []);

  const enableAudio = useCallback(() => {
    setAudioEnabled(true);
  }, []);

  const toggleRemoteMute = useCallback((userId: string) => {
    setMutedUsers((prev) => ({ ...prev, [userId]: !prev[userId] }));
  }, []);

  const toggleMic = useCallback(async () => {
    if (!accessToken || !room) return;
    const socket = getSocket(accessToken);
    setMicError(null);
    const voiceEnabled = room.debateMode === 'VOICE' || room.debateMode === 'TEXT_VOICE';
    if (!voiceEnabled) return;

    if (micOn) {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      socket.emit(SocketEvents.VOICE_MIC_STATE, { isMicOn: false });
      setMicOn(false);
      await Promise.all(
        [...voicePeerIdsRef.current].map((peerId) =>
          renegotiatePeer(peerId, accessToken).catch((err) => console.error('voice mute failed:', err)),
        ),
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
    } catch (err) {
      // Permission denied or no mic available — stay off, don't join voice.
      const message =
        !window.isSecureContext
          ? 'Microphone needs HTTPS on phones. You can still listen here, but phone mic will not open from this HTTP LAN URL.'
          : 'Microphone permission was blocked or no microphone is available.';
      setMicError(message);
      return;
    }

    socket.emit(SocketEvents.VOICE_MIC_STATE, { isMicOn: true });
    setMicOn(true);
    await Promise.all(
      [...voicePeerIdsRef.current].map((peerId) =>
        renegotiatePeer(peerId, accessToken).catch((err) => console.error('voice mic failed:', err)),
      ),
    );
  }, [accessToken, micOn, renegotiatePeer, room]);

  return {
    micOn,
    micError,
    micStates,
    remoteStreams,
    audioEnabled,
    enableAudio,
    mutedUsers,
    toggleRemoteMute,
    toggleMic,
  };
}
