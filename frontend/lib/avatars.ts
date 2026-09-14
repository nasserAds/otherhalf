import { Avatar } from '@/types';

export const AVATARS: {
  key: Avatar;
  name: string;
  gradient: string;
  skin: string;
  hair: string;
  accent: string;
}[] = [
  { key: 'LION', name: 'نور', gradient: 'from-[#FFE6A8] to-[#FFC6A8]', skin: '#B96E42', hair: '#3B2417', accent: '#16A36A' },
  { key: 'TIGER', name: 'سامي', gradient: 'from-[#FFD8C7] to-[#BFE6FF]', skin: '#8F5B3B', hair: '#111827', accent: '#F4B63D' },
  { key: 'FOX', name: 'ليان', gradient: 'from-[#C8F2DD] to-[#FFD1DC]', skin: '#C9875F', hair: '#8A3E1F', accent: '#EE6C4D' },
  { key: 'PANDA', name: 'رامي', gradient: 'from-[#DDE7FF] to-[#F7D8FF]', skin: '#D39B75', hair: '#2F3142', accent: '#7C5CFF' },
  { key: 'OWL', name: 'هالة', gradient: 'from-[#FFF1B8] to-[#CFF7F0]', skin: '#A66A48', hair: '#5A3A28', accent: '#0EA5A3' },
  { key: 'WOLF', name: 'آدم', gradient: 'from-[#D7FBE8] to-[#D6E4FF]', skin: '#7B513D', hair: '#4B5563', accent: '#3B82F6' },
];

export function avatarProfile(avatar: Avatar) {
  return AVATARS.find((a) => a.key === avatar) ?? AVATARS[0];
}

export function avatarGradient(avatar: Avatar): string {
  return avatarProfile(avatar).gradient;
}
