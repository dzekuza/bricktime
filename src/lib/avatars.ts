export const AVATAR_SRCS = [
  '/avatars/avatar-classic.png',
  '/avatars/avatar-beanie.png',
  '/avatars/avatar-ninja.png',
  '/avatars/avatar-robot.png',
  '/avatars/avatar-wizard.png',
]

export function avatarSrc(id: number): string {
  return AVATAR_SRCS[id] ?? AVATAR_SRCS[0]
}
