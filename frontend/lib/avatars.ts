import { Avatar } from '@/types';

export const AVATARS: {
  key: Avatar;
  name: string;
  image: string;
  gradient: string;
}[] = [
  { key: 'LION', name: 'نور', image: '/avatars/1.png', gradient: 'from-[#FFE6A8] to-[#FFC6A8]' },
  { key: 'TIGER', name: 'راشد', image: '/avatars/2.png', gradient: 'from-[#FFD8C7] to-[#BFE6FF]' },
  { key: 'FOX', name: 'ليث', image: '/avatars/3.png', gradient: 'from-[#C8F2DD] to-[#FFD1DC]' },
  { key: 'PANDA', name: 'قطقوط', image: '/avatars/4.png', gradient: 'from-[#DDE7FF] to-[#F7D8FF]' },
  { key: 'OWL', name: 'جنى', image: '/avatars/5.png', gradient: 'from-[#FFF1B8] to-[#CFF7F0]' },
  { key: 'WOLF', name: 'زيد', image: '/avatars/6.png', gradient: 'from-[#D7FBE8] to-[#D6E4FF]' },
  { key: 'AVATAR_7', name: 'ليان', image: '/avatars/7.png', gradient: 'from-[#F4D7C8] to-[#D6E4FF]' },
  { key: 'AVATAR_8', name: 'يارا', image: '/avatars/8.png', gradient: 'from-[#FFF1B8] to-[#C8F2DD]' },
  { key: 'AVATAR_9', name: 'حكيم', image: '/avatars/9.png', gradient: 'from-[#DDE7FF] to-[#CFF7F0]' },
  { key: 'AVATAR_10', name: 'بندق', image: '/avatars/10.png', gradient: 'from-[#FFD8C7] to-[#D7FBE8]' },
];

export function avatarProfile(avatar: Avatar) {
  return AVATARS.find((a) => a.key === avatar) ?? AVATARS[0];
}

export function avatarGradient(avatar: Avatar): string {
  return avatarProfile(avatar).gradient;
}
