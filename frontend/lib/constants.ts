export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? API_URL;

export const REACTION_EMOJIS = ['🔥', '😂', '👏', '😮'];

export const PHASE_LABELS_AR: Record<string, string> = {
  PREPARING: 'التحضير',
  ROUND_1: 'الجولة الأولى',
  ROUND_2: 'الجولة الثانية',
  FINAL: 'الكلمة الأخيرة',
  VOTING: 'صوّت الآن',
  COMPLETED: 'انتهت الجولة',
};
