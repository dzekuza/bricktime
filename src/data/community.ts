export type AchievementCategory = 'activity' | 'social' | 'collector' | 'loyalty'

export interface AchievementDef {
  id: string
  label: string
  description: string
  points: number
  category: AchievementCategory
  color: string
  icon: string
}

export interface UserAchievement {
  achievementId: string
  unlockedAt: string
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  avatarSrc: string
  avatarBg: string
  tier: string
  tierBg: string
  totalPoints: number
  dropsReceived: number
  achievements: string[]
  isCurrentUser?: boolean
}

export type FeedEventType =
  | 'checkin'
  | 'build_photo'
  | 'comment'
  | 'like'
  | 'achievement'
  | 'first_drop'
  | 'streak'

export interface FeedItem {
  id: string
  userId: string
  userName: string
  avatarSrc: string
  avatarBg: string
  type: FeedEventType
  timestamp: string
  body?: string
  imageSrc?: string
  dropNum?: number
  dropTitle?: string
  achievementId?: string
  likeCount: number
  likedByCurrentUser: boolean
}

export const achievementDefs: AchievementDef[] = [
  {
    id: 'daily_checkin',
    label: 'Kasdienė apsilankymas',
    description: 'Aplankyk puslapį bet kurią dieną',
    points: 10,
    category: 'activity',
    color: '#FFD731',
    icon: '☀️',
  },
  {
    id: 'week_streak',
    label: '7 dienų serija',
    description: 'Aplankyk 7 dienas iš eilės',
    points: 50,
    category: 'activity',
    color: '#FB4903',
    icon: '🔥',
  },
  {
    id: 'old_member',
    label: 'Senas bičas',
    description: 'Būk nariu 3+ mėnesius',
    points: 75,
    category: 'loyalty',
    color: '#5C4ADE',
    icon: '🏛️',
  },
  {
    id: 'first_drop',
    label: 'Pirmasis produktas',
    description: 'Gauk savo pirmąjį produktą',
    points: 25,
    category: 'collector',
    color: '#5DDB9C',
    icon: '📦',
  },
  {
    id: 'collector_5',
    label: 'Kolekcionierius',
    description: 'Išsinuomok 5+ produktus',
    points: 100,
    category: 'collector',
    color: '#4DA2FF',
    icon: '🧱',
  },
  {
    id: 'build_photo',
    label: 'Statybų fotografas',
    description: 'Pasidalink surinkto produkto nuotrauka',
    points: 30,
    category: 'social',
    color: '#FFAEE7',
    icon: '📸',
  },
  {
    id: 'commenter',
    label: 'Komentatorius',
    description: 'Palik komentarą prie produkto',
    points: 20,
    category: 'social',
    color: '#5C4ADE',
    icon: '💬',
  },
  {
    id: 'liker',
    label: 'Entuziastas',
    description: 'Pamėk kito nario statybą',
    points: 15,
    category: 'social',
    color: '#FFD731',
    icon: '❤️',
  },
  {
    id: 'drop_streak_3',
    label: 'Trijų serija',
    description: 'Gauk 3 produktus iš eilės',
    points: 60,
    category: 'collector',
    color: '#FB4903',
    icon: '⚡',
  },
]

export const currentUserAchievements: UserAchievement[] = [
  { achievementId: 'daily_checkin', unlockedAt: '2026-04-30' },
  { achievementId: 'first_drop',    unlockedAt: '2025-03-12' },
  { achievementId: 'commenter',     unlockedAt: '2025-07-04' },
  { achievementId: 'liker',         unlockedAt: '2025-09-18' },
]

export const leaderboard: LeaderboardEntry[] = [
  {
    rank: 1, userId: 'u1', name: 'Lukas M.',
    avatarSrc: '/avatars/avatar-robot.png', avatarBg: '#4DA2FF',
    tier: 'Mega', tierBg: '#FB4903',
    totalPoints: 485, dropsReceived: 22,
    achievements: ['daily_checkin','week_streak','old_member','first_drop','collector_5','build_photo','commenter','liker','drop_streak_3'],
  },
  {
    rank: 2, userId: 'u2', name: 'Gabija K.',
    avatarSrc: '/avatars/avatar-wizard.png', avatarBg: '#5C4ADE',
    tier: 'Pro', tierBg: '#4DA2FF',
    totalPoints: 360, dropsReceived: 18,
    achievements: ['old_member','first_drop','collector_5','build_photo','commenter','liker'],
  },
  {
    rank: 3, userId: 'u3', name: 'Tomas R.',
    avatarSrc: '/avatars/avatar-ninja.png', avatarBg: '#001B21',
    tier: 'Pro', tierBg: '#4DA2FF',
    totalPoints: 295, dropsReceived: 15,
    achievements: ['daily_checkin','first_drop','collector_5','build_photo','drop_streak_3'],
  },
  {
    rank: 4, userId: 'u4', name: 'Rūta S.',
    avatarSrc: '/avatars/avatar-beanie.png', avatarBg: '#FB4903',
    tier: 'Standard', tierBg: '#FFD731',
    totalPoints: 230, dropsReceived: 14,
    achievements: ['first_drop','build_photo','commenter','old_member'],
  },
  {
    rank: 5, userId: 'current', name: 'Alex Kim',
    avatarSrc: '/avatars/avatar-classic.png', avatarBg: '#FFD731',
    tier: 'Standard', tierBg: '#FFD731',
    totalPoints: 195, dropsReceived: 14,
    achievements: ['daily_checkin','first_drop','commenter','liker'],
    isCurrentUser: true,
  },
  {
    rank: 6, userId: 'u5', name: 'Matas V.',
    avatarSrc: '/avatars/avatar-ninja.png', avatarBg: '#5DDB9C',
    tier: 'Mini', tierBg: '#FFAEE7',
    totalPoints: 145, dropsReceived: 9,
    achievements: ['first_drop','commenter','liker'],
  },
  {
    rank: 7, userId: 'u6', name: 'Eglė P.',
    avatarSrc: '/avatars/avatar-wizard.png', avatarBg: '#FFAEE7',
    tier: 'Standard', tierBg: '#FFD731',
    totalPoints: 110, dropsReceived: 8,
    achievements: ['first_drop','daily_checkin'],
  },
  {
    rank: 8, userId: 'u7', name: 'Justinas A.',
    avatarSrc: '/avatars/avatar-robot.png', avatarBg: '#FB4903',
    tier: 'Mini', tierBg: '#FFAEE7',
    totalPoints: 85, dropsReceived: 6,
    achievements: ['first_drop','liker'],
  },
  {
    rank: 9, userId: 'u8', name: 'Inga L.',
    avatarSrc: '/avatars/avatar-beanie.png', avatarBg: '#5C4ADE',
    tier: 'Nano', tierBg: '#F5F1EB',
    totalPoints: 60, dropsReceived: 4,
    achievements: ['first_drop','commenter'],
  },
  {
    rank: 10, userId: 'u9', name: 'Darius K.',
    avatarSrc: '/avatars/avatar-classic.png', avatarBg: '#5DDB9C',
    tier: 'Nano', tierBg: '#F5F1EB',
    totalPoints: 35, dropsReceived: 2,
    achievements: ['first_drop'],
  },
]

export const feedItems: FeedItem[] = [
  {
    id: 'f1', userId: 'u1', userName: 'Lukas M.',
    avatarSrc: '/avatars/avatar-robot.png', avatarBg: '#4DA2FF',
    type: 'build_photo', timestamp: '2026-04-30T15:32:00Z',
    body: 'Galiausiai surinkau Mailbox Row! Postman Otto — mano mėgstamiausias miniukas iki šiol. 🧱',
    dropNum: 26, dropTitle: 'Mailbox Row',
    likeCount: 14, likedByCurrentUser: false,
  },
  {
    id: 'f2', userId: 'u2', userName: 'Gabija K.',
    avatarSrc: '/avatars/avatar-wizard.png', avatarBg: '#5C4ADE',
    type: 'achievement', timestamp: '2026-04-30T12:10:00Z',
    achievementId: 'collector_5',
    likeCount: 9, likedByCurrentUser: true,
  },
  {
    id: 'f3', userId: 'u3', userName: 'Tomas R.',
    avatarSrc: '/avatars/avatar-ninja.png', avatarBg: '#001B21',
    type: 'comment', timestamp: '2026-04-30T10:45:00Z',
    dropNum: 26, dropTitle: 'Mailbox Row',
    body: 'Ar čia tik man atrodo, kad pašto dėžutė kairėje yra nelygiai pritvirtinta? 🤔',
    likeCount: 3, likedByCurrentUser: false,
  },
  {
    id: 'f4', userId: 'current', userName: 'Alex Kim',
    avatarSrc: '/avatars/avatar-classic.png', avatarBg: '#FFD731',
    type: 'checkin', timestamp: '2026-04-30T09:00:00Z',
    likeCount: 2, likedByCurrentUser: false,
  },
  {
    id: 'f5', userId: 'u4', userName: 'Rūta S.',
    avatarSrc: '/avatars/avatar-beanie.png', avatarBg: '#FB4903',
    type: 'first_drop', timestamp: '2026-04-29T18:22:00Z',
    dropNum: 25, dropTitle: 'The Greenhouse',
    likeCount: 7, likedByCurrentUser: false,
  },
  {
    id: 'f6', userId: 'u1', userName: 'Lukas M.',
    avatarSrc: '/avatars/avatar-robot.png', avatarBg: '#4DA2FF',
    type: 'streak', timestamp: '2026-04-29T09:01:00Z',
    body: '7',
    likeCount: 5, likedByCurrentUser: false,
  },
  {
    id: 'f7', userId: 'u5', userName: 'Matas V.',
    avatarSrc: '/avatars/avatar-ninja.png', avatarBg: '#5DDB9C',
    type: 'build_photo', timestamp: '2026-04-28T20:15:00Z',
    body: 'The Greenhouse užtrukai dvi savaites, bet verta! Botanikė Iris jau stovi ant lango. 🌱',
    dropNum: 25, dropTitle: 'The Greenhouse',
    likeCount: 11, likedByCurrentUser: true,
  },
  {
    id: 'f8', userId: 'u2', userName: 'Gabija K.',
    avatarSrc: '/avatars/avatar-wizard.png', avatarBg: '#5C4ADE',
    type: 'like', timestamp: '2026-04-28T14:30:00Z',
    dropNum: 24, dropTitle: 'Donut Diner',
    likeCount: 1, likedByCurrentUser: false,
  },
  {
    id: 'f9', userId: 'u6', userName: 'Eglė P.',
    avatarSrc: '/avatars/avatar-wizard.png', avatarBg: '#FFAEE7',
    type: 'achievement', timestamp: '2026-04-27T16:00:00Z',
    achievementId: 'old_member',
    likeCount: 4, likedByCurrentUser: false,
  },
  {
    id: 'f10', userId: 'u3', userName: 'Tomas R.',
    avatarSrc: '/avatars/avatar-ninja.png', avatarBg: '#001B21',
    type: 'checkin', timestamp: '2026-04-27T08:45:00Z',
    likeCount: 0, likedByCurrentUser: false,
  },
]

export function calculatePoints(unlocked: UserAchievement[]): number {
  return unlocked.reduce((sum, ua) => {
    const def = achievementDefs.find((a) => a.id === ua.achievementId)
    return sum + (def?.points ?? 0)
  }, 0)
}

export function getRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `prieš ${mins} min.`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `prieš ${hrs} val.`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'vakar'
  return `prieš ${days} d.`
}
