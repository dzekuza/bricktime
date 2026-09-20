export type Social = {
  label: string
  href: string
}

// NOTE: the Facebook page has no vanity username, so its canonical URL is the
// numeric profile id that facebook.com/share/1DJZPNZXr2/ redirects to.
export const socials: Social[] = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61589940441540",
  },
  { label: "Instagram", href: "https://www.instagram.com/bricktime.lt" },
  { label: "TikTok", href: "https://www.tiktok.com/@bricktime.lt" },
]
