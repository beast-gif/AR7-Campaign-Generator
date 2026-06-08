import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import confetti from 'canvas-confetti'

// ── CONSTANTS ────────────────────────────────────────────────────────────────

const STAGE_COLORS: [number, number, number][] = [
  [255, 211, 0],
  [0, 200, 255],
  [255, 120, 0],
  [180, 80, 255],
]

const CIRC = 2 * Math.PI * 52

const SEED_INSPO = [
  'A cold brew brand for night-shift workers who treat sleep as optional',
  'A luxury pet food company that treats dogs like Michelin-star diners',
  'A fitness app built for people who hate the gym but love looking like they go',
  'A sustainable streetwear label made entirely from ocean plastic',
  'A meditation app designed specifically for overthinkers and anxious minds',
  'A hot sauce brand founded by a grandmother from Oaxaca with a secret recipe',
  'A Gen Z bank that makes saving money feel like leveling up in a video game',
  'An indie perfume house that turns memories into personalised scents',
]

const VIBE_INSPO = [
  'Cyberpunk underground, neon-soaked, typographically aggressive',
  'Tokyo streetwear meets Paris gallery — clean lines with serious edge',
  'Dark academia — leather, candlelight, intellectual chaos',
  'Vintage NASA meets hype culture — technical but electric',
  'Brutalist editorial — raw, bold, no apologies',
  'Soft luxury — cashmere and cream tones, but with real attitude',
  'Y2K nostalgia — chrome, bubble type, iridescent everything',
  'Military surplus meets high fashion — utilitarian but covetable',
]

const icons: Record<string, React.ReactNode> = {
  ig: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  li: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  tt: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.29 6.29 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.16 8.16 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
    </svg>
  ),
  yt: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
    </svg>
  ),
  fb: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  sc: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.289 4.783l-.022.296c-.451.081-.905.131-1.083.131-.32 0-.964-.107-1.206-.107-.265 0-.34.263-.34.36 0 .101.024.201.072.295.232.473.752.878.752 1.573 0 .58-.328 1.18-.9 1.54-.232.144-.507.224-.79.224h-.023c-.36 0-.65-.104-.85-.196l-.014-.006c-.065-.03-.156-.072-.258-.072-.121 0-.22.048-.279.118-.1.118-.138.334-.138.478v.063c0 .186.027.352.073.52.07.258.179.484.282.696.128.262.249.508.249.788 0 .393-.225.693-.66.9-.45.213-.93.32-1.42.32-.49 0-.97-.107-1.42-.32-.435-.207-.66-.507-.66-.9 0-.28.121-.526.249-.788.103-.212.212-.438.282-.696.046-.168.073-.334.073-.52v-.063c0-.144-.038-.36-.138-.478-.059-.07-.158-.118-.279-.118-.102 0-.193.042-.258.072l-.014.006c-.2.092-.49.196-.85.196h-.023c-.283 0-.558-.08-.79-.224-.572-.36-.9-.96-.9-1.54 0-.695.52-1.1.752-1.573.048-.094.072-.194.072-.295 0-.097-.075-.36-.34-.36-.242 0-.886.107-1.206.107-.178 0-.632-.05-1.083-.131l-.022-.296c-.114-1.564-.24-3.59.289-4.783C7.853 1.069 11.21.793 12.206.793z" />
    </svg>
  ),
  pi: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  ),
}

const orbs = [
  { type: 'ig', size: 114, left: '5%',  top: '6%',  animIdx: 1, delay: '0s',  opacity: 1.0  },
  { type: 'x',  size: 80,  left: '85%', top: '6%',  animIdx: 2, delay: '-3s', opacity: 0.95 },
  { type: 'li', size: 100, left: '1%',  top: '38%', animIdx: 3, delay: '-6s', opacity: 0.95 },
  { type: 'tt', size: 70,  left: '89%', top: '30%', animIdx: 4, delay: '-2s', opacity: 0.92 },
  { type: 'yt', size: 92,  left: '6%',  top: '68%', animIdx: 5, delay: '-8s', opacity: 0.95 },
  { type: 'fb', size: 68,  left: '81%', top: '65%', animIdx: 6, delay: '-4s', opacity: 0.92 },
  { type: 'ig', size: 60,  left: '28%', top: '2%',  animIdx: 7, delay: '-1s', opacity: 0.88 },
  { type: 'x',  size: 74,  left: '65%', top: '84%', animIdx: 8, delay: '-5s', opacity: 0.90 },
  { type: 'pi', size: 58,  left: '17%', top: '60%', animIdx: 3, delay: '-7s', opacity: 0.85 },
  { type: 'sc', size: 96,  left: '90%', top: '52%', animIdx: 1, delay: '-9s', opacity: 0.95 },
]

const PIPELINE = [
  { id: 'dna',    label: 'DNA SYNTHESIS',   hint: 'Palette · Voice · Typography · Motifs', ms: 6000 },
  { id: 'text',    label: 'TEXT GENERATION', hint: 'X Thread · LinkedIn · Captions',         ms: 8000 },
  { id: 'slides',  label: 'IG CAROUSEL',     hint: 'Slide copy · Narrative arc',             ms: 5000 },
  { id: 'compose', label: 'COMPOSITION',    hint: 'Rendering PNG slides · Packaging ZIP',   ms: 9000 },
]

const tickerItems = [
  { label: 'AR7 Engine', hi: true },    { label: 'Slash The Rules', hi: false },
  { label: 'DNA Synthesis', hi: false }, { label: 'Thread Gen', hi: false },
  { label: 'IG Carousel ×7', hi: true }, { label: 'LinkedIn Post', hi: false },
  { label: 'Brand Palette', hi: false }, { label: 'Slide Compose', hi: true },
  { label: 'ZIP Export', hi: false },    { label: 'Selective Regen', hi: false },
]

const L_SCROLL = ['A·R·7', 'CAMPAIGN', 'GENERATOR', 'BRAND·DNA', 'A·R·7', 'CAMPAIGN', 'GENERATOR', 'BRAND·DNA']
const R_SCROLL = ['IG·SLIDES', 'LINKEDIN', 'THREAD', 'COMPOSE', 'IG·SLIDES', 'LINKEDIN', 'THREAD', 'COMPOSE']

const MAX_CHARS = 400

const BOOT_LINES = [
  { text: '▌ AR7 CAMPAIGN ENGINE v0.1',           type: 'header',   color: '#FF2D00'              },
  { text: '▌ BOOT SEQUENCE INITIATED...',            type: 'sub',      color: 'rgba(255,255,255,.28)' },
  { text: '',                                        type: 'blank'                                    },
  { text: '  neural synthesis core',                 type: 'sys',      suffix: 'OK'                   },
  { text: '  brand DNA schema',                      type: 'sys',      suffix: 'OK'                   },
  { text: '  mounting platform adapters',            type: 'sys',      suffix: null                   },
  { text: '     ■ instagram',                         type: 'platform', color: '#C13584'               },
  { text: '     ■ x / twitter',                       type: 'platform', color: '#E7E9EA'               },
  { text: '     ■ linkedin',                          type: 'platform', color: '#4C9ED9'               },
  { text: '     ■ tiktok',                            type: 'platform', color: '#FF0050'               },
  { text: '     ■ youtube',                           type: 'platform', color: '#FF5555'               },
  { text: '     ■ facebook',                          type: 'platform', color: '#4C8AFF'               },
  { text: '',                                        type: 'blank'                                    },
  { text: '  content generation matrix',             type: 'sys',      suffix: 'OK'                   },
  { text: '  voice & tone calibration',              type: 'sys',      suffix: 'OK'                   },
  { text: '  visual composition layer',              type: 'sys',      suffix: 'OK'                   },
  { text: '',                                        type: 'blank'                                    },
  { text: '▌ ALL SYSTEMS NOMINAL',                   type: 'success',  color: 'rgba(80,200,120,.9)'   },
  { text: '▌ CAMPAIGN INTELLIGENCE ENGINE — ONLINE', type: 'final',    color: '#FF2D00'              },
] as const

const PRE_PLANETS = [
  { key: 'ig', radius: 52,  speed: 7,  color: '#C13584', glow: 'rgba(193,53,132,.8)'  },
  { key: 'x',  radius: 70,  speed: 11, color: '#E7E9EA', glow: 'rgba(231,233,234,.7)' },
  { key: 'li', radius: 87,  speed: 16, color: '#0A66C2', glow: 'rgba(10,102,194,.8)'  },
  { key: 'tt', radius: 103, speed: 9,  color: '#FF0050', glow: 'rgba(255,0,80,.8)'    },
  { key: 'yt', radius: 118, speed: 20, color: '#FF0000', glow: 'rgba(255,0,0,.8)'     },
  { key: 'fb', radius: 132, speed: 13, color: '#1877F2', glow: 'rgba(24,119,242,.8)'  },
]

// ── AUXILIARY BACKGROUND COMPONENT ───────────────────────────────────────────

function PreStarField() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const ctx = cv.getContext('2d')!
    cv.width = window.innerWidth; cv.height = window.innerHeight
    for (let i = 0; i < 130; i++) {
      const x = Math.random() * cv.width, y = Math.random() * cv.height
      const r = Math.random() < .12 ? 1.8 : .7
      const a = .1 + Math.random() * .7
      ctx.beginPath(); ctx.fillStyle = `rgba(255,255,255,${a})`
      ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    }
    const tints = ['rgba(160,190,255,.55)', 'rgba(255,160,160,.4)', 'rgba(160,255,200,.4)']
    tints.forEach(c => {
      const x = Math.random() * cv.width, y = Math.random() * cv.height
      const g = ctx.createRadialGradient(x, y, 0, x, y, 3)
      g.addColorStop(0, c); g.addColorStop(1, 'transparent')
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill()
    })
  }, [])
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', opacity: .75 }} />
}

// ── MAIN LANDING COMPONENT ───────────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate()

  const [seed, setSeed] = useState(() => localStorage.getItem('ar7_seed') ?? '')
  const [vibe, setVibe] = useState(() => localStorage.getItem('ar7_vibe') ?? '')

  const [progress, setProgress]       = useState(0)
  const [loaded, setLoaded]           = useState(false)
  const [preComplete, setPreComplete] = useState(false)
  const [cur, setCur]                 = useState({ x: 0, y: 0 })
  const [elapsed, setElapsed]         = useState('0.0s')
  const [activeOrbs, setActiveOrbs]   = useState<number[]>([])
  const [ringOrbs, setRingOrbs]       = useState<number[]>([])
  const [pipelineMs, setPipelineMs]   = useState(0)

  const orbRefs        = useRef<(HTMLDivElement | null)[]>([])
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const activeStageRef = useRef<number>(0)
  const pipelineRef    = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── COMPUTED VALUES (DERIVED FROM PROGRESS) ────────────────────────────────

  const preVisibleLines = (() => {
    if (progress >= 99) return BOOT_LINES.length
    if (progress >= 95) return 17
    if (progress >= 91) return 16
    if (progress >= 87) return 15
    if (progress >= 83) return 14
    if (progress >= 78) return 13
    if (progress >= 74) return 12 // facebook
    if (progress >= 68) return 11 // youtube
    if (progress >= 62) return 10 // tiktok
    if (progress >= 55) return 9  // linkedin
    if (progress >= 47) return 8  // x
    if (progress >= 38) return 7  // instagram
    if (progress >= 28) return 6  // mounting adapters
    if (progress >= 18) return 5  // brand DNA
    if (progress >= 10) return 4  // neural core
    if (progress >= 5)  return 3  // blank
    return 2
  })()

  const prePlanetCount = Math.max(0, preVisibleLines - 6)

  // ── MUTATION ──────────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: () => api.campaign({ seed, vibe }),
    onSuccess: (data) => {
      if (pipelineRef.current) clearInterval(pipelineRef.current)
      const colors = ['#FFD300', '#FF2B00', '#ffffff', '#FFE433']
      confetti({ particleCount: 130, spread: 80, origin: { y: 0.55 }, colors })
      setTimeout(() => {
        confetti({ particleCount: 65, angle: 60,  spread: 65, origin: { x: 0, y: 0.6 }, colors })
        confetti({ particleCount: 65, angle: 120, spread: 65, origin: { x: 1, y: 0.6 }, colors })
      }, 200)
      setTimeout(() => navigate('/canvas', { state: { campaign: data } }), 1000)
    },
  })

  // ── EFFECTS ───────────────────────────────────────────────────────────────

  // Preloader progress loop
  useEffect(() => {
    let cancelled = false
    const phases = [
      { target: 22,  duration: 300 },
      { target: 55,  duration: 440 },
      { target: 82,  duration: 580 },
      { target: 100, duration: 300 },
    ]
    let prog = 0
    let idx = 0
    const runPhase = () => {
      if (cancelled) return
      if (idx >= phases.length) {
        setTimeout(() => { if (!cancelled) setPreComplete(true) }, 160)
        return
      }
      const { target, duration } = phases[idx]
      const from = prog
      const range = target - from
      const t0 = performance.now()
      const step = (now: number) => {
        if (cancelled) return
        const k = Math.min((now - t0) / duration, 1)
        prog = Math.round(from + range * (1 - Math.pow(1 - k, 3)))
        setProgress(prog)
        k < 1 ? requestAnimationFrame(step) : (idx++, setTimeout(runPhase, 60))
      }
      requestAnimationFrame(step)
    }
    setTimeout(runPhase, 260)
    return () => { cancelled = true }
  }, [])

  useEffect(() => { localStorage.setItem('ar7_seed', seed) }, [seed])
  useEffect(() => { localStorage.setItem('ar7_vibe', vibe) }, [vibe])

  // Hotkey trigger (Cmd/Ctrl + Enter)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (seed.trim() && vibe.trim() && !mutation.isPending) {
          mutation.mutate()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [seed, vibe, mutation])

  useEffect(() => {
    const fn = (e: MouseEvent) => setCur({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', fn)
    return () => window.removeEventListener('mousemove', fn)
  }, [])

  useEffect(() => {
    const t0 = Date.now()
    const id = setInterval(() => setElapsed(((Date.now() - t0) / 1000).toFixed(1) + 's'), 100)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (mutation.isPending) {
      setPipelineMs(0)
      pipelineRef.current = setInterval(() => setPipelineMs(ms => ms + 100), 100)
    } else {
      if (pipelineRef.current) clearInterval(pipelineRef.current)
    }
    return () => { if (pipelineRef.current) clearInterval(pipelineRef.current) }
  }, [mutation.isPending])

  // Main system generation connection canvas particle animation
  useEffect(() => {
    if (!mutation.isPending) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width  = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    type P = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number }
    const W = () => canvas.width
    const H = () => canvas.height
    const mkP = (): P => ({
      x: Math.random() * W(), y: Math.random() * H(),
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      r: 1 + Math.random() * 2, life: 0, max: 200 + Math.random() * 300,
    })
    const resetP = (p: P) => { Object.assign(p, mkP()) }
    const pts: P[] = Array.from({ length: 55 }, mkP)
    let col: [number, number, number] = [255, 211, 0]
    let raf: number
    const draw = () => {
      const [tr, tg, tb] = STAGE_COLORS[activeStageRef.current]
      col = col.map((v, i) => v + ([tr, tg, tb][i] - v) * 0.04) as [number, number, number]
      const [r, g, b] = col
      ctx.clearRect(0, 0, W(), H())
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b2 = pts[j]
          const d = Math.hypot(a.x - b2.x, a.y - b2.y)
          if (d < 110) {
            ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - d / 110) * 0.28})`
            ctx.lineWidth = 0.7
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y); ctx.stroke()
          }
        }
      }
      pts.forEach(p => {
        ctx.fillStyle = `rgba(${r},${g},${b},${(0.5 + 0.5 * Math.sin(p.life * 0.04)) * 0.75})`
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
        p.x += p.vx; p.y += p.vy; p.life++
        if (p.x < 0 || p.x > W() || p.y < 0 || p.y > H() || p.life > p.max) resetP(p)
      })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    const scatterContainer = canvas as HTMLCanvasElement & { __scatter?: () => void }
    scatterContainer.__scatter = () => {
      pts.forEach(p => { p.vx = (Math.random() - 0.5) * 4; p.vy = (Math.random() - 0.5) * 4 })
      setTimeout(() => pts.forEach(p => { p.vx = (Math.random() - 0.5) * 0.5; p.vy = (Math.random() - 0.5) * 0.5 }), 600)
    }
    return () => cancelAnimationFrame(raf)
  }, [mutation.isPending])

  useEffect(() => {
    if (!mutation.isPending) return
    const c = canvasRef.current as (HTMLCanvasElement & { __scatter?: () => void }) | null
    c?.__scatter?.()
  }, [pipelineMs]) // eslint-disable-line

  useEffect(() => { activeStageRef.current = activeStage }, [pipelineMs]) // eslint-disable-line

  // ── HANDLERS & COMPUTED NAVIGATION ──────────────────────────────────────────

  const handleOrbClick = (i: number) => {
    setActiveOrbs(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
    const el = orbRefs.current[i]
    if (el) {
      el.classList.remove('ar7-spin-once')
      void el.offsetWidth
      el.classList.add('ar7-spin-once')
    }
    setRingOrbs(prev => [...prev, i])
    setTimeout(() => setRingOrbs(prev => prev.filter(x => x !== i)), 1200)
  }

  const surpriseSeed = useCallback(() => {
    setSeed(SEED_INSPO[Math.floor(Math.random() * SEED_INSPO.length)])
  }, [])

  const surpriseVibe = useCallback(() => {
    setVibe(VIBE_INSPO[Math.floor(Math.random() * VIBE_INSPO.length)])
  }, [])

  const getStageProgress = (stageIdx: number): number => {
    let offset = 0
    for (let i = 0; i < stageIdx; i++) offset += PIPELINE[i].ms
    const into = pipelineMs - offset
    if (into <= 0) return 0
    return Math.min(95, Math.round((into / PIPELINE[stageIdx].ms) * 100))
  }

  const activeStage = (() => {
    let offset = 0
    for (let i = 0; i < PIPELINE.length; i++) {
      offset += PIPELINE[i].ms
      if (pipelineMs < offset) return i
    }
    return PIPELINE.length - 1
  })()

  const totalPct = Math.round(
    PIPELINE.reduce((acc, _, i) => {
      const isDone   = i < activeStage
      const pct      = isDone ? 100 : i === activeStage ? getStageProgress(i) : 0
      return acc + pct
    }, 0) / PIPELINE.length
  )

  const canGenerate = seed.trim().length > 0 && vibe.trim().length > 0

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="ar7-root">
      <div className="ar7-grain" />
      <div className="ar7-glow-1" />
      <div className="ar7-glow-2" />

      {/* Aurora */}
      <div className="ar7-aurora">
        <div className="ar7-ab ar7-ab-1" />
        <div className="ar7-ab ar7-ab-2" />
        <div className="ar7-ab ar7-ab-3" />
        <div className="ar7-ab ar7-ab-4" />
        <div className="ar7-ab ar7-ab-5" />
      </div>

      {/* Floating Orbs */}
      <div className="ar7-orb-layer" style={{ pointerEvents: 'none' }}>
        {orbs.map((orb, i) => (
          <div key={i} className={`ar7-float-wrapper ar7-f${orb.animIdx}`}
            style={{ left: orb.left, top: orb.top, animationDelay: orb.delay }}>
            <div
              ref={el => { orbRefs.current[i] = el }}
              className={`ar7-orb ar7-orb-${orb.type}${activeOrbs.includes(i) ? ' ar7-orb-active' : ''}`}
              style={{ width: orb.size, height: orb.size, opacity: orb.opacity, pointerEvents: 'auto' }}
              onClick={() => handleOrbClick(i)}
            >
              {ringOrbs.includes(i) && (<><div className="ar7-ring" /><div className="ar7-ring-2" /></>)}
              <div style={{ width: orb.size * 0.42, height: orb.size * 0.42, color: 'white' }}>
                {icons[orb.type]}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vertical Scrollers */}
      <div className="ar7-vs ar7-vs-l">
        <div className="ar7-vs-t ar7-vs-up">
          {L_SCROLL.map((t, i) => <span key={i} className="ar7-vi">{t}</span>)}
        </div>
      </div>
      <div className="ar7-vs ar7-vs-r">
        <div className="ar7-vs-t ar7-vs-dn">
          {R_SCROLL.map((t, i) => <span key={i} className="ar7-vi">{t}</span>)}
        </div>
      </div>

      {/* Corner Brackets */}
      <div className="ar7-co ar7-co-tl" />
      <div className="ar7-co ar7-co-tr" />
      <div className="ar7-co ar7-co-bl" />
      <div className="ar7-co ar7-co-br" />

      {/* Cursor tracker */}
      <div className="ar7-ctrk">
        X&nbsp;<span>{String(cur.x).padStart(3, '0')}</span><br />
        Y&nbsp;<span>{String(cur.y).padStart(3, '0')}</span><br />
        T&nbsp;<span>{elapsed}</span>
      </div>

      {/* System status */}
      <div className="ar7-ss">
        SYS&nbsp;<em>ONLINE</em><br />
        API&nbsp;<em>:8000</em><br />
        DNA&nbsp;<em>READY</em>
      </div>

      {/* Ticker */}
      <div className="ar7-tw">
        <div className="ar7-tt">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className={`ar7-ti${item.hi ? ' ar7-ti-hi' : ''}`}>{item.label}</span>
          ))}
        </div>
      </div>

      {/* ── PRELOADER: Solar System + Terminal ── */}
      <div className={`ar7-pre${loaded ? ' done' : ''}`}>
        <PreStarField />
        <div className="ar7-pre-aurora" />

        <div className="ar7-pre-inner">

          {/* ── LEFT: Solar System ── */}
          <div className="ar7-solar">
            {PRE_PLANETS.map((p, i) => (
              <div
                key={p.key}
                className={`ar7-orbit${i < prePlanetCount ? ' on' : ''}`}
                style={{
                  width: p.radius * 2,
                  height: p.radius * 2,
                  borderColor: i < prePlanetCount ? p.color + '28' : 'transparent',
                }}
              >
                {/* Pivot: rotates around the sun */}
                <div
                  className="ar7-planet-pivot"
                  style={{ animationDuration: p.speed + 's' }}
                >
                  {/* Wrapper: counter-rotates so icon stays upright */}
                  <div
                    className="ar7-planet-wrapper"
                    style={{ animationDuration: p.speed + 's' }}
                  >
                    <div
                      className={`ar7-planet${i < prePlanetCount ? ' on' : ''}`}
                      style={{
                        background: p.color + '1A',
                        borderColor: p.color + '88',
                        boxShadow: i < prePlanetCount
                          ? `0 0 10px ${p.glow}, 0 0 22px ${p.glow}55`
                          : 'none',
                      }}
                    >
                      <div className="ar7-planet-ico">
                        {icons[p.key as keyof typeof icons]}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* AR7 Sun */}
            <div className="ar7-sun">
              <div className="ar7-sun-inner">
                <span className="ar7-sun-txt">AR7</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Terminal ── */}
          <div className="ar7-terminal">
            <div className="ar7-terminal-hdr">
              <div className="ar7-terminal-dots">
                <span style={{ background: '#ff5f57' }} />
                <span style={{ background: '#febc2e' }} />
                <span style={{ background: '#28c840' }} />
              </div>
              <span className="ar7-terminal-title">ar7-engine — boot</span>
              <span className="ar7-terminal-pct">{progress}%</span>
            </div>

            <div className="ar7-terminal-body">
              {(BOOT_LINES as readonly { readonly text: string; readonly type: string; readonly color?: string; readonly suffix?: string | null }[])
                .slice(0, preVisibleLines)
                .map((line, i) => {
                  if (!line.text) return <div key={i} className="ar7-tl-gap" />
                  if (line.type === 'sys') return (
                    <div key={i} className="ar7-tl ar7-tl-sys">
                      <span className="ar7-tl-key">{line.text}</span>
                      {'suffix' in line && line.suffix && <span className="ar7-tl-ok">...{line.suffix}</span>}
                    </div>
                  )
                  if (line.type === 'platform') return (
                    <div key={i} className="ar7-tl ar7-tl-plat">
                      <span style={{ color: 'color' in line ? line.color : undefined }}>{line.text}</span>
                      <span className="ar7-tl-ready">READY</span>
                    </div>
                  )
                  return (
                    <div key={i} className={`ar7-tl ar7-tl-${line.type}`}
                      style={{ color: 'color' in line ? line.color : undefined }}>
                      {line.text}
                    </div>
                  )
                })
              }
              {preVisibleLines < BOOT_LINES.length && <span className="ar7-cursor-blk" />}
            </div>

            <div className="ar7-terminal-foot">
              <div className="ar7-pre-bar-new">
                <div className="ar7-pre-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Calibration complete ── */}
        {preComplete && (
          <div className="ar7-pre-done" style={{ marginTop: '1.5rem', position: 'relative', zIndex: 1 }}>
            <div className="ar7-pre-cal-line">CALIBRATION COMPLETE</div>
            <button className="ar7-pre-enter-btn" onClick={() => setLoaded(true)}>
              ENTER AR7 →
            </button>
            <div className="ar7-pre-engine-lbl">AR7 Campaign Intelligence Engine</div>
          </div>
        )}
      </div>

      {/* ── MAIN GENERATOR ZONE ── */}
      <div className={`ar7-main${loaded ? ' on' : ''}`}>
        <div className="ar7-bd" />
        <div className="ar7-cnt">

          <div className="ar7-badge">
            <span className="ar7-bdot" />AR7 System · Online
          </div>

          <div className="ar7-hero">
            <span className="ar7-l1">CAMPAIGN</span>
            <div className="ar7-sr">
              <div className="ar7-sd" />
              <span className="ar7-sm">×× AR7 ××</span>
              <div className="ar7-sd" />
            </div>
            <span className="ar7-l2">GENERATOR</span>
            <p className="ar7-hsub">Seed a concept · Slash the rules · Deploy at scale</p>
          </div>

          <div className="ar7-cl">
            <span className="ar7-ct">— cut here —</span>
            <div className="ar7-cd" />
            <span className="ar7-ci">✂</span>
            <div className="ar7-cd" />
            <span className="ar7-ct">— input zone —</span>
          </div>

          <div className="ar7-ir">
            {/* SEED field */}
            <div className="ar7-fd">
              <div className="ar7-fh">
                <div className="ar7-fl-row">
                  <span className="ar7-fl">SEED</span>
                  <button
                    className="ar7-surprise-btn"
                    type="button"
                    onClick={surpriseSeed}
                    disabled={mutation.isPending}
                    title="Fill with a random creative example"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10">
                      <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                    </svg>
                    Inspire
                  </button>
                </div>
                <span className="ar7-fn">01</span>
              </div>
              <p className="ar7-fds">What is this campaign about?</p>
              <div className="ar7-ta-wrap">
                <textarea
                  className="ar7-ta"
                  value={seed}
                  onChange={e => setSeed(e.target.value.slice(0, MAX_CHARS))}
                  placeholder="e.g. A cold brew brand for night-shift workers who treat sleep as optional..."
                  disabled={mutation.isPending}
                />
                <div className={`ar7-char-count${seed.length > MAX_CHARS * 0.9 ? ' warn' : ''}`}>
                  {seed.length} / {MAX_CHARS}
                </div>
              </div>
            </div>

            {/* VIBE field */}
            <div className="ar7-fd">
              <div className="ar7-fh">
                <div className="ar7-fl-row">
                  <span className="ar7-fl">VIBE</span>
                  <button
                    className="ar7-surprise-btn"
                    type="button"
                    onClick={surpriseVibe}
                    disabled={mutation.isPending}
                    title="Fill with a random aesthetic direction"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10">
                      <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                    </svg>
                    Inspire
                  </button>
                </div>
                <span className="ar7-fn">02</span>
              </div>
              <p className="ar7-fds">How should it feel aesthetically?</p>
              <div className="ar7-ta-wrap">
                <textarea
                  className="ar7-ta"
                  value={vibe}
                  onChange={e => setVibe(e.target.value.slice(0, MAX_CHARS))}
                  placeholder="e.g. Cyberpunk underground, neon-soaked, typographically aggressive..."
                  disabled={mutation.isPending}
                />
                <div className={`ar7-char-count${vibe.length > MAX_CHARS * 0.9 ? ' warn' : ''}`}>
                  {vibe.length} / {MAX_CHARS}
                </div>
              </div>
            </div>
          </div>

          {mutation.isError && (
            <div className="ar7-error-state">
              <span className="ar7-error-icon">⚠</span>
              <span className="ar7-error-msg">
                {(mutation.error as Error)?.message ?? 'Pipeline failed — is the backend running on :8000?'}
              </span>
              <button
                className="ar7-error-retry"
                onClick={() => { mutation.reset(); }}
              >
                ↺ Try Again
              </button>
            </div>
          )}

          <div className="ar7-ca">
            <button
              className={`ar7-gb${canGenerate && !mutation.isPending ? '' : ' off'}`}
              disabled={!canGenerate || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? 'GENERATING…' : 'GENERATE CAMPAIGN'}
            </button>

            {!mutation.isPending && (
              <div className="ar7-shortcut-hint">
                or press <kbd>⌘</kbd> + <kbd>↵</kbd>
              </div>
            )}

            <div className="ar7-pp">
              <span className="ar7-ps">DNA</span><span className="ar7-pa">→</span>
              <span className="ar7-ps">Text Gen</span><span className="ar7-pa">→</span>
              <span className="ar7-ps">Carousel</span><span className="ar7-pa">→</span>
              <span className="ar7-ps">Compose</span>
            </div>
            <p className="ar7-ht">Pipeline ETA · 15–25 sec · Full brand package on output</p>
          </div>

        </div>
      </div>

      {/* ── PIPELINE OVERLAY ── */}
      {mutation.isPending && (() => {
        const sc     = STAGE_COLORS[activeStage]
        const hex    = `rgb(${sc[0]},${sc[1]},${sc[2]})`
        const pct    = getStageProgress(activeStage)
        const offset = CIRC * (1 - pct / 100)
        return (
          <div className="ar7-po">
            <div className="ar7-po-top">
              <div className="ar7-po-eyebrow">// AR7 PIPELINE //</div>
              <div className="ar7-po-elapsed">ELAPSED <span>{Math.round(pipelineMs / 1000)}s</span></div>
            </div>
            <div className="ar7-po-mid">
              <div className="ar7-po-left">
                {PIPELINE.map((stage, i) => {
                  const isDone   = i < activeStage
                  const isActive = i === activeStage
                  return (
                    <div key={stage.id} className={`ar7-po-si ${isDone ? 'done' : isActive ? 'active' : 'pending'}`}>
                      <div className="ar7-po-icon">{isDone ? '✓' : isActive ? '▶' : ''}</div>
                      <div className="ar7-po-si-info">
                        <div className="ar7-po-si-nm">{stage.label}</div>
                        <div className="ar7-po-si-bar">
                          <div className="ar7-po-si-bf"
                            style={{ width: `${isDone ? 100 : isActive ? getStageProgress(i) : 0}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="ar7-po-right">
                <canvas ref={canvasRef} className="ar7-po-canvas" />
                <div className="ar7-po-content">
                  <div className="ar7-po-st-label">STAGE 0{activeStage + 1} OF 04</div>
                  <div key={activeStage} className="ar7-po-st-name"
                    style={{ color: hex, textShadow: `0 0 40px ${hex}55,0 0 80px ${hex}22` }}>
                    {PIPELINE[activeStage].label}
                  </div>
                  <div className="ar7-po-arc-wrap">
                    <svg viewBox="0 0 120 120" fill="none">
                      <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,.06)" strokeWidth="4" />
                      <circle cx="60" cy="60" r="52" stroke={hex} strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={CIRC} strokeDashoffset={offset} transform="rotate(-90 60 60)"
                        style={{ transition: 'stroke-dashoffset .4s ease, stroke .5s ease', filter: `drop-shadow(0 0 6px ${hex}cc)` }} />
                    </svg>
                    <div className="ar7-po-arc-inner">
                      <div className="ar7-po-arc-n" style={{ color: hex }}>{pct}</div>
                      <div className="ar7-po-arc-u">%</div>
                    </div>
                  </div>
                  <div className="ar7-po-st-hint">{PIPELINE[activeStage].hint}</div>
                </div>
              </div>
            </div>
            <div className="ar7-po-bottom">
              <div className="ar7-po-tot-bar">
                <div className="ar7-po-tot-fill"
                  style={{ width: `${totalPct}%`, background: `linear-gradient(90deg, ${hex}66, ${hex})`, boxShadow: `0 0 8px ${hex}88` }} />
              </div>
              <div className="ar7-po-bot-info">
                <div>TOTAL PROGRESS — <span>{totalPct}%</span></div>
                <div>AR7 CAMPAIGN ENGINE · BUILD 0.1</div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
} 