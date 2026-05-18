export const SERIES = [
  "Architektūra",
  "Creator 3in1",
  "Dekoracijos",
  "Disney",
  "Dreamz",
  "Harry Potter",
  "Icons",
  "Ideas",
  "Marvel",
  "Minecraft",
  "Minifigūrėlės",
  "Pokėmonai",
  "Star Wars",
  "Technic",
  "Batman",
  "City",
  "Jurassic World",
  "Super Mario",
  "Creator Expert",
  "Kita",
] as const

export type SeriesName = (typeof SERIES)[number]
