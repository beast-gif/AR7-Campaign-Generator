export interface FontSpec {
  family: string
  weight: number
}

export interface Palette {
  primary: string
  secondary: string
  accent: string
  neutral_dark: string
  neutral_light: string
}

export interface Typography {
  heading: FontSpec
  body: FontSpec
}

export interface Vocabulary {
  preferred: string[]
  avoided: string[]
}

export interface Voice {
  tone: string[]
  formality: number
  rhythm: 'short_punchy' | 'flowing' | 'measured' | 'staccato'
  vocabulary: Vocabulary
  sample_sentences: string[]
}

export interface Visual {
  palette: Palette
  typography: Typography
  motifs: string[]
  photography_style: string
  composition_rules: string[]
}

export interface Sound {
  soundtrack_mood: string
  reference_artists: string[]
  tempo_range_bpm: [number, number]
}

export interface Brand {
  name: string
  manifesto: string
  audience: string
  positioning: string
  taglines: string[]
}

export interface BrandDNA {
  brand: Brand
  voice: Voice
  visual: Visual
  sound: Sound
}

export interface Tweet {
  position: number
  text: string
}

export interface Thread {
  hook: string
  tweets: Tweet[]
  hashtags: string[]
  cta?: string | null
}

export interface LinkedInPost {
  hook: string
  body: string
  format: 'story' | 'insight' | 'list' | 'announcement'
  hashtags: string[]
  cta: string
}

export interface Slide {
  position: number
  role: 'hook' | 'context' | 'point' | 'example' | 'payoff' | 'cta'
  headline: string
  body?: string | null
}

export interface Carousel {
  slides: Slide[]
  caption: string
  hashtags: string[]
}

export interface ComposedSlide {
  position: number
  image_url: string
  width: number
  height: number
}

export interface ComposedCarousel {
  slides: ComposedSlide[]
}

export interface Campaign {
  id: string
  seed: string
  vibe: string
  created_at: string
  dna: BrandDNA
  thread: Thread
  linkedin: LinkedInPost
  carousel: Carousel
  composed: ComposedCarousel
  download_url: string
}

export interface CampaignRequest {
  seed: string
  vibe: string
}