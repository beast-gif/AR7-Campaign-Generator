import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Campaign } from '@/types/api'

const BASE = 'http://localhost:8000'
type Tab = 'dna' | 'thread' | 'linkedin' | 'carousel'

const XI  = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
const LII = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
const IGI = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>

const TAB_CFG = {
  dna:      { color:'#CAE4DB', rgb:'202,228,219', glow:.45, label:'Brand DNA',   num:'01', atmo:'rgba(202,228,219,.12)' },
  thread:   { color:'#CDC7BE', rgb:'205,199,190', glow:.24, label:'X Thread',    num:'02', atmo:'rgba(205,199,190,.06)' },
  linkedin: { color:'#87A7B3', rgb:'135,167,179', glow:.30, label:'LinkedIn',    num:'03', atmo:'rgba(135,167,179,.08)' },
  carousel: { color:'#766161', rgb:'118,97,97',   glow:.26, label:'IG Carousel', num:'04', atmo:'rgba(118,97,97,.07)'   },
}

const TAB_ORDER = ['dna', 'thread', 'linkedin', 'carousel'] as const

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '')
  return [parseInt(clean.slice(0,2),16), parseInt(clean.slice(2,4),16), parseInt(clean.slice(4,6),16)]
}

// ── Canvas background animations ─────────────────────────────────────────
function BgCanvas({ tab, r, g, b }: { tab: Tab; r: number; g: number; b: number }) {
  const cvRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    let W = cv.width  = window.innerWidth
    let H = cv.height = window.innerHeight
    let t = 0, raf = 0
    const onResize = () => { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight }
    window.addEventListener('resize', onResize)

    const drawDNA = () => {
      const cx = W/2, helixH = H*.88, rad = Math.min(W,H)*.14, turns = 4, pts = 400
      for (let strand = 0; strand < 2; strand++) {
        const phase = strand * Math.PI
        ctx.beginPath(); let started = false
        for (let i = 0; i <= pts; i++) {
          const prog = i/pts
          const angle = prog*Math.PI*2*turns + t*.55 + phase
          const x = cx + Math.cos(angle)*rad
          const y = H*.06 + prog*helixH
          if (!started) { ctx.moveTo(x,y); started=true } else ctx.lineTo(x,y)
        }
        const grad = ctx.createLinearGradient(0,H*.06,0,H*.94)
        grad.addColorStop(0,`rgba(${r},${g},${b},0)`)
        grad.addColorStop(.15,`rgba(${r},${g},${b},.55)`)
        grad.addColorStop(.5,`rgba(${r},${g},${b},.7)`)
        grad.addColorStop(.85,`rgba(${r},${g},${b},.55)`)
        grad.addColorStop(1,`rgba(${r},${g},${b},0)`)
        ctx.strokeStyle=grad; ctx.lineWidth=2.5; ctx.stroke()
      }
      const rungs = 36
      for (let i = 0; i <= rungs; i++) {
        const prog = i/rungs
        const angle = prog*Math.PI*2*turns + t*.55
        const x1 = cx+Math.cos(angle)*rad, x2 = cx+Math.cos(angle+Math.PI)*rad
        const y = H*.06 + prog*helixH
        const depth = Math.abs(Math.cos(angle))
        const edgeAlpha = Math.min(prog*5,(1-prog)*5,1)
        const alpha = (0.2+depth*.5)*edgeAlpha
        ctx.beginPath(); ctx.strokeStyle=`rgba(${r},${g},${b},${alpha*.7})`; ctx.lineWidth=1.2
        ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke()
        ;[x1,x2].forEach(x => {
          const grd = ctx.createRadialGradient(x,y,0,x,y,8+depth*6)
          grd.addColorStop(0,`rgba(${r},${g},${b},${alpha*.9})`)
          grd.addColorStop(.4,`rgba(${r},${g},${b},${alpha*.4})`)
          grd.addColorStop(1,`rgba(${r},${g},${b},0)`)
          ctx.beginPath(); ctx.fillStyle=grd; ctx.arc(x,y,8+depth*6,0,Math.PI*2); ctx.fill()
          ctx.beginPath(); ctx.fillStyle=`rgba(${r},${g},${b},${alpha})`; ctx.arc(x,y,3+depth*2,0,Math.PI*2); ctx.fill()
        })
      }
    }

    type P = { x:number; y:number; vx:number; vy:number; life:number; max:number }
    const pts: P[] = Array.from({length:50}, () => ({
      x:Math.random()*W, y:Math.random()*H,
      vx:(Math.random()-.5)*.5, vy:(Math.random()-.5)*.5,
      life:Math.random()*200, max:150+Math.random()*280,
    }))

    const drawWaves = () => {
      const waveDefs = [
        {amp:50,freq:.005,speed:.35,yFrac:.28,alpha:.08,lw:2.0},
        {amp:70,freq:.004,speed:.22,yFrac:.42,alpha:.14,lw:2.5},
        {amp:38,freq:.007,speed:.48,yFrac:.50,alpha:.08,lw:1.2},
        {amp:65,freq:.0035,speed:.18,yFrac:.58,alpha:.16,lw:2.5},
        {amp:32,freq:.009,speed:.55,yFrac:.72,alpha:.06,lw:1.0},
        {amp:45,freq:.006,speed:.30,yFrac:.82,alpha:.09,lw:1.5},
      ]
      waveDefs.forEach(w => {
        const baseY = H*w.yFrac
        ctx.beginPath()
        for (let x=0; x<=W; x+=3) {
          const y = baseY + Math.sin(x*w.freq+t*w.speed)*w.amp + Math.sin(x*w.freq*1.7+t*w.speed*.75)*w.amp*.38
          x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y)
        }
        const grad = ctx.createLinearGradient(0,0,W,0)
        grad.addColorStop(0,`rgba(${r},${g},${b},0)`)
        grad.addColorStop(.15,`rgba(${r},${g},${b},${w.alpha})`)
        grad.addColorStop(.85,`rgba(${r},${g},${b},${w.alpha})`)
        grad.addColorStop(1,`rgba(${r},${g},${b},0)`)
        ctx.strokeStyle=grad; ctx.lineWidth=w.lw; ctx.stroke()
      })
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.life++
        if (p.life>p.max||p.x<0||p.x>W||p.y<0||p.y>H) {
          Object.assign(p,{x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.5,life:0,max:150+Math.random()*280})
        }
        const fade = .5-Math.abs(p.life/p.max-.5)
        ctx.beginPath(); ctx.fillStyle=`rgba(${r},${g},${b},${fade*.35})`; ctx.arc(p.x,p.y,1.5,0,Math.PI*2); ctx.fill()
      })
    }

    type Node = { x:number; y:number; vx:number; vy:number; r:number; phase:number }
    const nodes: Node[] = Array.from({length:40}, () => ({
      x:Math.random()*W, y:Math.random()*H,
      vx:(Math.random()-.5)*.4, vy:(Math.random()-.5)*.4,
      r:2.5+Math.random()*3, phase:Math.random()*Math.PI*2,
    }))

    const drawNetwork = () => {
      nodes.forEach(n => { n.x+=n.vx; n.y+=n.vy; if (n.x<0||n.x>W) n.vx*=-1; if (n.y<0||n.y>H) n.vy*=-1 })
      const MAX=200
      for (let i=0; i<nodes.length; i++) {
        for (let j=i+1; j<nodes.length; j++) {
          const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y
          const d=Math.sqrt(dx*dx+dy*dy)
          if (d<MAX) {
            const a=(1-d/MAX)*.18
            const grad=ctx.createLinearGradient(nodes[i].x,nodes[i].y,nodes[j].x,nodes[j].y)
            grad.addColorStop(0,`rgba(${r},${g},${b},${a})`); grad.addColorStop(1,`rgba(${r},${g},${b},${a*.3})`)
            ctx.beginPath(); ctx.strokeStyle=grad; ctx.lineWidth=(1-d/MAX)*1.8
            ctx.moveTo(nodes[i].x,nodes[i].y); ctx.lineTo(nodes[j].x,nodes[j].y); ctx.stroke()
          }
        }
      }
      nodes.forEach(n => {
        const pulse=(Math.sin(t*2+n.phase)+1)*.5
        ctx.beginPath(); ctx.fillStyle=`rgba(${r},${g},${b},${.2+pulse*.15})`; ctx.arc(n.x,n.y,n.r,0,Math.PI*2); ctx.fill()
        ctx.beginPath(); ctx.strokeStyle=`rgba(${r},${g},${b},${.06+pulse*.04})`; ctx.lineWidth=1; ctx.arc(n.x,n.y,n.r+4+pulse*6,0,Math.PI*2); ctx.stroke()
      })
    }

    const drawAurora = () => {
      const bands=6
      for (let i=0; i<bands; i++) {
        const prog=i/(bands-1), baseY=H*(.15+prog*.7), amp=H*(.04+prog*.03)
        const freq=.003+i*.0008, speed=.12+i*.04, alpha=.03+i*.018
        ctx.beginPath()
        const yVals:number[]=[]
        for (let x=0; x<=W; x+=4) {
          const y=baseY+Math.sin(x*freq+t*speed)*amp+Math.sin(x*freq*2.3+t*speed*.8)*amp*.35+Math.cos(x*freq*.7+t*speed*1.2)*amp*.25
          yVals.push(y); x===0?ctx.moveTo(x,y):ctx.lineTo(x,y)
        }
        ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath()
        ctx.fillStyle=`rgba(${r},${g},${b},${alpha*.25})`; ctx.fill()
        ctx.beginPath()
        yVals.forEach((y,xi)=>{ xi===0?ctx.moveTo(xi*4,y):ctx.lineTo(xi*4,y) })
        const lineGrad=ctx.createLinearGradient(0,0,W,0)
        lineGrad.addColorStop(0,`rgba(${r},${g},${b},0)`)
        lineGrad.addColorStop(.2,`rgba(${r},${g},${b},${alpha*1.8})`)
        lineGrad.addColorStop(.8,`rgba(${r},${g},${b},${alpha*1.8})`)
        lineGrad.addColorStop(1,`rgba(${r},${g},${b},0)`)
        ctx.strokeStyle=lineGrad; ctx.lineWidth=1.5; ctx.stroke()
      }
    }

    const tick = () => {
      t+=.012; ctx.clearRect(0,0,W,H)
      switch(tab) {
        case 'dna':      drawDNA();     break
        case 'thread':   drawWaves();   break
        case 'linkedin': drawNetwork(); break
        case 'carousel': drawAurora();  break
      }
      raf=requestAnimationFrame(tick)
    }
    raf=requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize',onResize) }
  }, [tab,r,g,b]) // eslint-disable-line

  return <canvas ref={cvRef} style={{ position:'fixed', inset:0, width:'100%', height:'100%', zIndex:0, pointerEvents:'none' }}/>
}

function BgScene({ tab, brandPrimary }: { tab: Tab; brandPrimary: string }) {
  const cfg = TAB_CFG[tab]
  const [r,g,b] = tab==='dna' ? hexToRgb(brandPrimary) : cfg.rgb.split(',').map(Number) as [number,number,number]
  return (
    <div className="cv2-bg-wrap">
      <div className="cv2-bg-atmosphere" style={{ background:`radial-gradient(ellipse 55% 55% at 50% 50%, rgba(${r},${g},${b},${cfg.glow}) 0%, rgba(${r},${g},${b},.04) 55%, transparent 78%)` }}/>
      <BgCanvas tab={tab} r={r} g={g} b={b}/>
      <div className="cv2-grade" style={{ background:`linear-gradient(150deg, ${cfg.atmo} 0%, transparent 50%)` }}/>
    </div>
  )
}

// ── Laptop Shell ──────────────────────────────────────────────────────────
function LaptopShell({ children, url }: { children: React.ReactNode; url: string }) {
  return (
    <div className="cv2-laptop-outer">
      <div className="cv2-laptop-lid">
        <div className="cv2-laptop-notch"><div className="cv2-laptop-cam"/></div>
        <div className="cv2-browser-bar">
          <div className="cv2-browser-dots">
            <div style={{background:'#ff5f57'}}/><div style={{background:'#febc2e'}}/><div style={{background:'#28c840'}}/>
          </div>
          <div className="cv2-browser-url">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="rgba(231,233,234,.5)"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            {url}
          </div>
          <div className="cv2-browser-spacer"/>
        </div>
        {children}
      </div>
      <div className="cv2-laptop-chin">
        <svg viewBox="0 0 814 1000" fill="rgba(255,255,255,.18)" width="13" height="16">
          <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-127.5c-48.2-86.7-81.5-238.7-81.5-383.5 0-47.8 3.8-103.8 45.5-159.6 28.2-37.8 76.5-72.5 151.5-72.5 73.8 0 123 47.5 165 47.5 39.5 0 101.2-50.2 189.5-50.2zm-221-108.5c-12.5 58.5-48.5 109-85.5 137.5-34 26.2-89.5 42.5-130.5 42.5-4 0-7.5-.5-10.5-.8-.3-2-.3-4.5-.3-7 0-57 30-112.2 66.2-148.5 44-44 111.5-72 167.5-72 3.2 0 6.5.2 9.5.5 1 3.2 1.5 6.5 1.5 9.5z"/>
        </svg>
      </div>
      <div className="cv2-laptop-base-bar"/>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────
export default function Canvas() {
  const location = useLocation()
  const navigate  = useNavigate()

  // Load from shared URL or navigation state
  const campaign = (() => {
    const id = new URLSearchParams(window.location.search).get('id')
    if (id) {
      try {
        const stored = localStorage.getItem(`ar7_c_${id}`)
        if (stored) return JSON.parse(stored) as Campaign
      } catch {}
    }
    return location.state?.campaign as Campaign | undefined
  })()

  const [tab, setTab]       = useState<Tab>('dna')
  const [tabDir, setTabDir] = useState<'forward'|'back'>('forward')
  const [slide, setSlide]   = useState(0)
  const [toast, setToast]   = useState('')

  const dnaRef = useRef<HTMLDivElement>(null)
  const liRef  = useRef<HTMLDivElement>(null)
  const xRef   = useRef<HTMLDivElement>(null)

  // Directional tab switching
  const handleTabChange = useCallback((t: Tab) => {
    const oldIdx = TAB_ORDER.indexOf(tab)
    const newIdx = TAB_ORDER.indexOf(t)
    setTabDir(newIdx >= oldIdx ? 'forward' : 'back')
    setTab(t)
    setSlide(0)
  }, [tab])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2600)
  }, [])

  // Export PNG
  const exportPNG = useCallback(async (refEl: React.RefObject<HTMLDivElement | null>, filename: string) => {
    const el = refEl.current
    if (!el) return showToast('Nothing to export')
    showToast('Capturing image…')
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(el, { backgroundColor:'#08080A', scale:2, useCORS:true, logging:false })
      const link = document.createElement('a')
      link.download = filename; link.href = canvas.toDataURL('image/png'); link.click()
      showToast('✓ Image exported!')
    } catch { showToast('Export failed — try again') }
  }, [showToast])

  // Export PDF
  const exportPDF = useCallback(async () => {
    const el = dnaRef.current
    if (!el) return
    showToast('Generating PDF…')
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { jsPDF } = await import('jspdf')
      const canvas = await html2canvas(el, { backgroundColor:'#08080A', scale:1.5, useCORS:true, logging:false })
      const pdf = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' })
      const imgData = canvas.toDataURL('image/png')
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = (canvas.height * pdfW) / canvas.width
      pdf.addImage(imgData,'PNG',0,0,pdfW,pdfH)
      pdf.save(`${campaign?.dna.brand.name.replace(/\s+/g,'-') ?? 'brand'}-guide.pdf`)
      showToast('✓ PDF saved!')
    } catch { showToast('PDF failed — try again') }
  }, [showToast, campaign])

  // Share link
  const copyShareLink = useCallback(() => {
    if (!campaign) return
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6)
    localStorage.setItem(`ar7_c_${id}`, JSON.stringify(campaign))
    const url = `${window.location.origin}/canvas?id=${id}`
    navigator.clipboard.writeText(url).then(() => showToast('✓ Share link copied! (this browser)'))
  }, [campaign, showToast])

  // Copy text
  const copyText = useCallback((text: string, label = 'Copied!') => {
    navigator.clipboard.writeText(text).then(() => showToast(`✓ ${label}`))
  }, [showToast])

  // Print
  const printGuide = useCallback(() => {
    document.body.classList.add('cv2-print-mode')
    window.print()
    setTimeout(() => document.body.classList.remove('cv2-print-mode'), 500)
  }, [])

  if (!campaign) {
    return (
      <div className="cv2-root" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center', fontFamily:'Space Mono', color:'rgba(255,211,0,.6)', fontSize:'12px', letterSpacing:'.2em' }}>
          NO CAMPAIGN DATA<br/>
          <button onClick={() => navigate('/')} style={{ marginTop:'1rem', background:'var(--y)', color:'#08080A', border:'none', padding:'.5rem 1.5rem', fontFamily:'Bebas Neue', fontSize:'1rem', letterSpacing:'.15em', cursor:'pointer' }}>← BACK</button>
        </div>
      </div>
    )
  }

  const { dna, thread, linkedin, carousel, composed, download_url } = campaign
  const { brand, voice, visual, sound } = dna
  const { palette } = visual
  const cfg = TAB_CFG[tab]

  return (
    <div className="cv2-root">

      {/* ── TOPBAR ── */}
      <div className="cv2-bar" style={{ '--tab-color':cfg.color, '--tab-rgb':cfg.rgb } as React.CSSProperties}>
        <button className="cv2-back" onClick={() => navigate('/')}>← BACK</button>

        <nav className="cv2-nav">
          {(Object.keys(TAB_CFG) as Tab[]).map(t => {
            const tc = TAB_CFG[t]
            return (
              <button
                key={t}
                data-tab={t}
                onClick={() => handleTabChange(t)}
                className={`cv2-navbtn${tab===t?' active':''}`}
                style={{'--tab-color':tc.color,'--active-color':tc.color,'--active-rgb':tc.rgb} as React.CSSProperties}
              >
                <span className="cv2-navbtn-num">{tc.num}</span>
                <span className="cv2-navbtn-ico">
                  {t==='dna'      ? <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'11px' }}>AR7</span>
                  : t==='thread'  ? <XI/>
                  : t==='linkedin'? <LII/>
                  : <IGI/>}
                </span>
                <span className="cv2-navbtn-lbl">{tc.label}</span>
                {tab===t && <span className="cv2-navbtn-bar" style={{ background:tc.color }}/>}
              </button>
            )
          })}
        </nav>

        {/* Share button */}
        <button className="cv2-share-btn" onClick={copyShareLink} title="Copy share link">
          <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
          </svg>
          Share
        </button>

        <a className="cv2-dl-btn" href={`${BASE}${download_url}`} download style={{ background:cfg.color }}>
          ↓ Download ZIP
        </a>
      </div>

      {/* ── PAGE (directional slide) ── */}
      <div className="cv2-page" data-dir={tabDir} key={`${tab}-${tabDir}`}>
        <BgScene tab={tab} brandPrimary={palette.primary}/>

        {/* ════════════ DNA ════════════ */}
        {tab === 'dna' && (
          <div className="cv2-content cv2-dna-content" ref={dnaRef}>
            <div className="cv2-section-lbl" style={{ color:`rgba(${TAB_CFG.dna.rgb},.55)` }}>01 · Brand DNA</div>

            {/* Hero row */}
            <div className="cv2-dna-hero">
              <div className="cv2-dna-id-card">
                <div className="cv2-dna-eyebrow">Brand Identity</div>
                <div className="cv2-dna-brand-hero" style={{
                  color: palette.primary,
                  textShadow: `0 0 80px ${palette.primary}55, 0 0 160px ${palette.primary}22`,
                }}>
                  {brand.name}
                </div>
                <p className="cv2-dna-manifesto-lg">{brand.manifesto}</p>
                <div className="cv2-dna-tagline-list">
                  {brand.taglines.map((tl,i) => (
                    <div key={i} className="cv2-dna-tagline-row">
                      <span className="cv2-dna-tagline-slash" style={{ color:palette.primary }}>//</span>
                      <span className="cv2-dna-tagline-txt">"{tl}"</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cv2-dna-meta-col">
                <div className="cv2-dna-meta-card">
                  <div className="cv2-tile-lbl">Audience</div>
                  <p className="cv2-dna-meta-txt">{brand.audience}</p>
                </div>
                <div className="cv2-dna-meta-card">
                  <div className="cv2-tile-lbl">Positioning</div>
                  <p className="cv2-dna-meta-txt">{brand.positioning}</p>
                </div>
              </div>
            </div>

            {/* ── FEATURE 5: Taller expandable palette (cv2-dna-palette-strip-v2) ── */}
            <div>
              <div className="cv2-dna-sub-lbl">Color Palette — hover to expand · click hex to copy</div>
              <div className="cv2-dna-palette-strip-v2">
                {Object.entries(palette).map(([key, hex]) => {
                  const [pr,pg,pb] = hexToRgb(hex)
                  const luma = .299*pr + .587*pg + .114*pb
                  const textCol = luma > 128 ? 'rgba(0,0,0,.8)' : 'rgba(255,255,255,.9)'
                  return (
                    <div key={key} className="cv2-dna-pal-block" style={{ background:hex }}>
                      <div className="cv2-dna-pal-label">
                        <span className="cv2-dna-pal-role" style={{ color:textCol }}>{key.replace(/_/g,' ')}</span>
                        <span
                          className="cv2-dna-pal-hex"
                          style={{ color:textCol }}
                          onClick={() => copyText(hex, `${hex} copied!`)}
                          title="Click to copy"
                        >
                          {hex}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bottom grid */}
            <div className="cv2-dna-bottom-grid">
              {/* Typography */}
              <div className="cv2-tile">
                <div className="cv2-tile-lbl">Typography</div>
                <div className="cv2-typo-heading-preview" style={{ fontFamily:visual.typography.heading.family }}>
                  {brand.name}
                </div>
                <div className="cv2-typo-body-preview">Forged for champions. Every strike counts.</div>
                <div className="cv2-divider"/>
                <div className="cv2-kv"><span className="cv2-k">Heading</span><span className="cv2-v">{visual.typography.heading.family} · {visual.typography.heading.weight}</span></div>
                <div className="cv2-kv"><span className="cv2-k">Body</span><span className="cv2-v">{visual.typography.body.family} · {visual.typography.body.weight}</span></div>
              </div>

              {/* Voice & Tone */}
              <div className="cv2-tile">
                <div className="cv2-tile-lbl">Voice & Tone</div>
                <div className="cv2-voice-tone-tags">
                  {voice.tone.map(tn => (
                    <span key={tn} className="cv2-voice-tag"
                      style={{ borderColor:`${palette.primary}55`, color:palette.primary, background:`${palette.primary}0D` }}>
                      {tn}
                    </span>
                  ))}
                </div>
                <div className="cv2-formality-row">
                  <span className="cv2-k">Formality</span>
                  <div className="cv2-formality-track">
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className="cv2-formality-pip"
                        style={{ background:n<=voice.formality ? palette.primary : 'rgba(255,255,255,.08)' }}/>
                    ))}
                  </div>
                  <span className="cv2-dna-pip-lbl">{voice.formality}/5</span>
                </div>
                <div className="cv2-kv" style={{ marginTop:'.5rem' }}>
                  <span className="cv2-k">Rhythm</span>
                  <span className="cv2-v">{voice.rhythm.replace(/_/g,' ')}</span>
                </div>
                <div className="cv2-divider"/>
                <div className="cv2-dna-vocab-grid">
                  <div>
                    <div className="cv2-dna-vocab-lbl cv2-dna-vocab-use">Use</div>
                    <div className="cv2-tags">{voice.vocabulary.preferred.map(w => <span key={w} className="cv2-tag cv2-tag-g">{w}</span>)}</div>
                  </div>
                  <div>
                    <div className="cv2-dna-vocab-lbl cv2-dna-vocab-avoid">Avoid</div>
                    <div className="cv2-tags">{voice.vocabulary.avoided.map(w => <span key={w} className="cv2-tag cv2-tag-r">{w}</span>)}</div>
                  </div>
                </div>
              </div>

              {/* Sound */}
              <div className="cv2-tile">
                <div className="cv2-tile-lbl">Sound Direction</div>
                <div className="cv2-bpm-wrap">
                  <div className="cv2-bpm-bars">
                    {Array.from({length:10},(_,i) => {
                      const mid = (sound.tempo_range_bpm[0]+sound.tempo_range_bpm[1])/2
                      const dur = (60/mid).toFixed(2)
                      return (
                        <div key={i} className="cv2-bpm-bar" style={{
                          background: palette.primary,
                          animationDuration: `${dur}s`,
                          animationDelay: `${(i/10)*parseFloat(dur)}s`,
                          height: `${22+Math.abs(Math.sin(i*.9))*20}px`,
                        }}/>
                      )
                    })}
                  </div>
                  <div className="cv2-bpm-num" style={{ color:palette.primary }}>
                    {sound.tempo_range_bpm[0]}<span className="cv2-bpm-sep">–</span>{sound.tempo_range_bpm[1]}
                    <span className="cv2-bpm-unit">BPM</span>
                  </div>
                </div>
                <p className="cv2-sound-mood">{sound.soundtrack_mood}</p>
                <div className="cv2-divider"/>
                <div className="cv2-tile-lbl" style={{ marginTop:'.5rem' }}>Reference Artists</div>
                <div className="cv2-tags">{sound.reference_artists.map(a => <span key={a} className="cv2-tag">{a}</span>)}</div>
                <div className="cv2-divider"/>
                <div className="cv2-tile-lbl" style={{ marginTop:'.5rem' }}>Visual Motifs</div>
                {visual.motifs.map(m => <div key={m} className="cv2-motif">· {m}</div>)}
              </div>
            </div>

            {/* DNA action bar */}
            <div className="cv2-act-bar">
              <button className="cv2-act-btn" onClick={exportPDF}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11zm-3-7H9v-2h6v2zm0 4H9v-2h6v2z"/></svg>
                Export PDF Guide
              </button>
              <button className="cv2-act-btn" onClick={printGuide}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
                Print Brand Guide
              </button>
              <button className="cv2-act-btn" onClick={() => copyText(JSON.stringify(dna,null,2),'Brand DNA copied!')}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                Copy JSON
              </button>
            </div>
          </div>
        )}

        {/* ════════════ X THREAD ════════════ */}
        {tab === 'thread' && (
          <div className="cv2-content" style={{ maxWidth:'100%', alignItems:'center', padding:'1.5rem 1rem 4rem' }}>
            <div className="cv2-section-lbl" style={{ color:'rgba(205,199,190,.45)', width:'100%', maxWidth:960 }}>02 · X Thread</div>

            <LaptopShell url={`x.com/@${brand.name.toLowerCase().replace(/\s+/g,'')}/thread`}>
              <div className="cv2-x-desktop">
                {/* Sidebar */}
                <div className="cv2-x-sidebar-desktop">
                  <div className="cv2-x-sidebar-logo">
                    <svg viewBox="0 0 24 24" fill="rgba(231,233,234,.9)" width="28" height="28"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </div>
                  <div className="cv2-x-nav-item-desktop"><svg viewBox="0 0 24 24" fill="currentColor" width="21" height="21"><path d="M12 2.1L1 12h3v9h6v-6h4v6h6v-9h3L12 2.1z"/></svg><span>Home</span></div>
                  <div className="cv2-x-nav-item-desktop"><svg viewBox="0 0 24 24" fill="currentColor" width="21" height="21"><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.814 5.272l4.521 4.521-.707.707-4.52-4.52C15.065 19.568 12.736 20.25 10.25 20.25c-4.694 0-8.5-3.806-8.5-8.5z"/></svg><span>Explore</span></div>
                  <div className="cv2-x-nav-item-desktop"><svg viewBox="0 0 24 24" fill="currentColor" width="21" height="21"><path d="M11.996 2c-4.062 0-7.49 3.021-7.999 7.051L2.866 12H1.5c-.552 0-1 .448-1 1v4c0 .552.448 1 1 1h1.661l.343 2.051c.254 1.52 1.638 2.949 3.496 2.949h4c.552 0 1-.448 1-1s-.448-1-1-1H7c-.91 0-1.558-.543-1.71-1.051L5.05 18h13.865l-.338-2H7.612l-.337-2H21.5c.552 0 1-.448 1-1v-4c0-.552-.448-1-1-1h-1.366l-1.131-2.949C18.494 3.021 15.066 2 11.996 2z"/></svg><span>Notifications</span></div>
                  <div className="cv2-x-nav-item-desktop"><svg viewBox="0 0 24 24" fill="currentColor" width="21" height="21"><path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.638V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-7.5 3.409L5 10.463V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z"/></svg><span>Messages</span></div>
                  <div className="cv2-x-nav-item-desktop"><svg viewBox="0 0 24 24" fill="currentColor" width="21" height="21"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z"/></svg><span>Bookmarks</span></div>
                  <div className="cv2-x-nav-item-desktop"><svg viewBox="0 0 24 24" fill="currentColor" width="21" height="21"><path d="M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19zm.486-5.56C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46zM12 4c-1.105 0-2 .9-2 2s.895 2 2 2 2-.9 2-2-.895-2-2-2zM8 6c0-2.21 1.791-4 4-4s4 1.79 4 4-1.791 4-4 4-4-1.79-4-4z"/></svg><span>Profile</span></div>
                  <button className="cv2-x-desktop-post-btn" style={{ background:palette.primary, color:'#000', border:'none' }}>Post</button>
                  <div className="cv2-x-profile-bottom-desktop">
                    <div className="cv2-x-av" style={{ width:32, height:32, background:palette.primary, color:'#000', flexShrink:0 }}>
                      <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'.9rem', lineHeight:1 }}>{brand.name.charAt(0)}</span>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'rgba(231,233,234,.9)', lineHeight:1.2, fontFamily:'-apple-system,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{brand.name}</div>
                      <div style={{ fontSize:10, color:'rgba(231,233,234,.38)', fontFamily:'-apple-system,sans-serif' }}>@{brand.name.toLowerCase().replace(/\s+/g,'')}</div>
                    </div>
                    <svg viewBox="0 0 24 24" fill="rgba(231,233,234,.4)" width="14" height="14"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
                  </div>
                </div>

                {/* Main column */}
                <div className="cv2-x-main-desktop">
                  <div className="cv2-x-main-header-desktop">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(231,233,234,.9)"><path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"/></svg>
                    <span>Thread</span>
                  </div>
                  <div className="cv2-x-main-scroll">
                    {/* Profile cover */}
                    <div className="cv2-x-cover-block">
                      <div className="cv2-x-cover-img" style={{ background:`linear-gradient(135deg, ${palette.primary}88 0%, ${palette.primary}33 35%, rgba(255,255,255,.04) 60%, rgba(0,0,0,.2) 100%)` }}>
                        <div style={{ position:'absolute', inset:0, backgroundImage:'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'60\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'28\' fill=\'none\' stroke=\'rgba(255,255,255,0.05)\' stroke-width=\'1\'/%3E%3C/svg%3E")', backgroundSize:'40px 40px' }}/>
                      </div>
                      <div className="cv2-x-cover-bottom">
                        <div className="cv2-x-cover-av" style={{ background:palette.primary, color:'#000' }}>
                          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', lineHeight:1 }}>{brand.name.charAt(0)}</span>
                        </div>
                        <button className="cv2-x-follow-desktop">Follow</button>
                      </div>
                      <div className="cv2-x-cover-info">
                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                          <span style={{ fontSize:17, fontWeight:800, color:'#fff', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>{brand.name}</span>
                          <svg width="18" height="18" viewBox="0 0 24 24" style={{ fill:palette.primary, flexShrink:0 }}>
                            <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.8c.67 1.31 1.91 2.2 3.34 2.2s2.68-.89 3.34-2.2c1.39.46 2.9.21 3.91-.8s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
                          </svg>
                        </div>
                        <div style={{ fontSize:13, color:'rgba(231,233,234,.42)', fontFamily:'-apple-system,sans-serif' }}>@{brand.name.toLowerCase().replace(/\s+/g,'')}</div>
                        <p style={{ fontSize:13.5, color:'rgba(231,233,234,.75)', lineHeight:1.5, margin:'6px 0 8px', fontFamily:'-apple-system,sans-serif' }}>{brand.audience}</p>
                        <div style={{ display:'flex', gap:16, fontSize:13 }}>
                          <span style={{ color:'#fff', fontWeight:700, fontFamily:'-apple-system,sans-serif' }}>247 <span style={{ color:'rgba(231,233,234,.45)', fontWeight:400 }}>Following</span></span>
                          <span style={{ color:'#fff', fontWeight:700, fontFamily:'-apple-system,sans-serif' }}>12.4K <span style={{ color:'rgba(231,233,234,.45)', fontWeight:400 }}>Followers</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Hook */}
                    <div className="cv2-x-hook-inlined">
                      <span style={{ fontFamily:'Georgia,serif', fontSize:'1.6rem', lineHeight:.8, color:`${palette.primary}66`, flexShrink:0 }}>"</span>
                      <p style={{ fontSize:13.5, color:'rgba(231,233,234,.6)', fontStyle:'italic', lineHeight:1.55, fontFamily:'-apple-system,sans-serif' }}>{thread.hook}"</p>
                    </div>
                    <div className="cv2-x-sep">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(205,199,190,.4)"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z"/></svg>
                      <span className="cv2-x-thread-label">Thread</span>
                      <span className="cv2-x-thread-count">{thread.tweets.length} posts</span>
                    </div>

                    {/* ── TWEETS with FEATURE 10: per-tweet copy button ── */}
                    {thread.tweets.map((tweet,i) => {
                      const s = tweet.position*7+3
                      const replies   = 5+(s*13)%45
                      const reposts   = 8+(s*17)%120
                      const likes     = 40+(s*31)%800
                      const views     = 500+(s*97)%12000
                      const bookmarks = 3+(s*7)%60
                      const isLast    = i===thread.tweets.length-1
                      return (
                        <div key={tweet.position} className="cv2-x-tweet-row" style={{ animationDelay:`${i*.06}s` }}>
                          <div className="cv2-x-left">
                            <div className="cv2-x-av" style={{ width:38, height:38, background:palette.primary, color:'#000' }}>
                              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'.95rem', lineHeight:1 }}>{brand.name.charAt(0)}</span>
                            </div>
                            {!isLast && <div className="cv2-x-line" style={{ background:`linear-gradient(to bottom, ${palette.primary}77 0%, rgba(255,255,255,.07) 100%)` }}/>}
                          </div>
                          <div className="cv2-x-body">
                            <div className="cv2-x-header">
                              <span className="cv2-x-name">{brand.name}</span>
                              <svg className="cv2-x-verified" viewBox="0 0 24 24" style={{ fill:palette.primary }}>
                                <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.8c.67 1.31 1.91 2.2 3.34 2.2s2.68-.89 3.34-2.2c1.39.46 2.9.21 3.91-.8s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
                              </svg>
                              <span className="cv2-x-dot">·</span>
                              <span className="cv2-x-num">{tweet.position}h</span>
                            </div>
                            <p className="cv2-x-txt">{tweet.text}</p>
                            <div className="cv2-x-actions">
                              <div className="cv2-x-action cv2-x-action-reply"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z"/></svg><span>{replies}</span></div>
                              <div className="cv2-x-action cv2-x-action-repost"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.932 9.48.568 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-3.932 3.64-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg><span>{reposts}</span></div>
                              <div className="cv2-x-action cv2-x-action-like"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg><span>{likes}</span></div>
                              <div className="cv2-x-action cv2-x-action-views"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"/></svg><span>{views>1000?(views/1000).toFixed(1)+'K':views}</span></div>
                              <div className="cv2-x-action cv2-x-action-bookmark"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z"/></svg><span>{bookmarks}</span></div>
                              <div className="cv2-x-action cv2-x-action-share"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"/></svg></div>
                              {/* ── FEATURE 10: copy individual tweet ── */}
                              <button
                                className="cv2-x-tweet-copy-btn"
                                onClick={() => copyText(tweet.text, `Tweet ${tweet.position} copied!`)}
                                title="Copy this tweet"
                              >
                                <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {thread.cta && (
                      <div style={{ padding:'10px 14px', borderTop:'1px solid rgba(255,255,255,.05)', fontSize:13, color:'#1d9bf0', fontFamily:'-apple-system,sans-serif' }}>→ {thread.cta}</div>
                    )}
                    <div style={{ padding:'10px 14px 16px', display:'flex', flexWrap:'wrap', gap:6 }}>
                      {thread.hashtags.map(h => <span key={h} style={{ fontSize:13, color:'#1d9bf0', fontFamily:'-apple-system,sans-serif' }}>#{h}</span>)}
                    </div>
                  </div>
                </div>

                {/* Right panel */}
                <div className="cv2-x-right-desktop">
                  <div className="cv2-x-search-desktop">
                    <svg viewBox="0 0 24 24" fill="rgba(231,233,234,.4)" width="13" height="13"><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.814 5.272l4.521 4.521-.707.707-4.52-4.52C15.065 19.568 12.736 20.25 10.25 20.25c-4.694 0-8.5-3.806-8.5-8.5z"/></svg>
                    <span>Search</span>
                  </div>
                  <div className="cv2-x-trending-desktop">
                    <div className="cv2-x-trending-title">Trends for you</div>
                    {thread.hashtags.map((h,i) => (
                      <div key={h} className="cv2-x-trend-item">
                        <div className="cv2-x-trend-cat">Trending</div>
                        <div className="cv2-x-trend-name">#{h}</div>
                        <div className="cv2-x-trend-ct">{((h.charCodeAt(0)*137+i*31)%50+1).toFixed(1)}K posts</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </LaptopShell>

            {/* Thread action bar */}
            <div className="cv2-act-bar" ref={xRef} style={{ width:'100%', maxWidth:960 }}>
              <button className="cv2-act-btn" onClick={() => exportPNG(xRef, `${brand.name}-x-thread.png`)}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                Export Thread PNG
              </button>
              <button className="cv2-act-btn" onClick={() => copyText(thread.tweets.map(t=>t.text).join('\n\n---\n\n'),'All tweets copied!')}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                Copy All Tweets
              </button>
            </div>
          </div>
        )}

        {/* ════════════ LINKEDIN ════════════ */}
        {tab === 'linkedin' && (
          <div className="cv2-content" style={{ maxWidth:'100%', alignItems:'center', padding:'1.5rem 1rem 4rem' }}>
            <div className="cv2-section-lbl" style={{ color:'rgba(135,167,179,.55)', width:'100%', maxWidth:960 }}>03 · LinkedIn Post</div>

            <LaptopShell url="linkedin.com/feed">
              <div className="cv2-li-desktop">
                {/* Top nav */}
                <div className="cv2-li-topnav">
                  <svg viewBox="0 0 24 24" fill="#0A66C2" width="30" height="30" style={{ flexShrink:0 }}>
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <div className="cv2-li-search-bar">
                    <svg viewBox="0 0 24 24" fill="rgba(200,200,200,.6)" width="14" height="14"><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.814 5.272l4.521 4.521-.707.707-4.52-4.52C15.065 19.568 12.736 20.25 10.25 20.25c-4.694 0-8.5-3.806-8.5-8.5z"/></svg>
                    <span>Search</span>
                  </div>
                  <div className="cv2-li-nav-item"><svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2.1L1 12h3v9h6v-6h4v6h6v-9h3L12 2.1z"/></svg><span>Home</span></div>
                  <div className="cv2-li-nav-item"><svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg><span>My Network</span></div>
                  <div className="cv2-li-nav-item"><svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M10 2a2 2 0 00-2 2v1H3a1 1 0 00-1 1v13a1 1 0 001 1h18a1 1 0 001-1V6a1 1 0 00-1-1h-5V4a2 2 0 00-2-2h-4zm0 2h4v1h-4V4zM3 7h18v2H3V7zm0 4h18v8H3v-8z"/></svg><span>Jobs</span></div>
                  <div className="cv2-li-nav-item"><svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.638V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-7.5 3.409L5 10.463V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z"/></svg><span>Messaging</span></div>
                  <div className="cv2-li-nav-item"><svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg><span>Notifications</span></div>
                  <div className="cv2-li-nav-item cv2-li-nav-me">
                    <div style={{ width:24, height:24, borderRadius:'50%', background:palette.primary, color:'#000', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',sans-serif", fontSize:'.85rem' }}>{brand.name.charAt(0)}</div>
                    <span>Me ▾</span>
                  </div>
                  <div className="cv2-li-nav-divider"/>
                  <div className="cv2-li-nav-item" style={{ color:'#C37D16' }}>
                    <svg viewBox="0 0 24 24" fill="#C37D16" width="20" height="20"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <span>Premium</span>
                  </div>
                </div>

                {/* Body */}
                <div className="cv2-li-body-desktop">
                  {/* Left panel */}
                  <div className="cv2-li-left-panel">
                    <div className="cv2-li-profile-card">
                      <div className="cv2-li-profile-cover" style={{ background:`linear-gradient(135deg, ${palette.primary}66 0%, ${palette.primary}22 50%, rgba(135,167,179,.15) 100%)` }}/>
                      <div className="cv2-li-profile-av-wrap">
                        <div style={{ width:60, height:60, borderRadius:'50%', background:palette.primary, color:'#000', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', border:'3px solid #1b1f23', marginTop:-30 }}>
                          {brand.name.charAt(0)}
                        </div>
                      </div>
                      <div className="cv2-li-profile-info">
                        <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,.92)', fontFamily:'-apple-system,sans-serif' }}>{brand.name}</div>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,.45)', marginTop:2, lineHeight:1.4, fontFamily:'-apple-system,sans-serif' }}>{brand.positioning}</div>
                        <div className="cv2-li-profile-stats">
                          <div><span>247</span> connections</div>
                          <div><span>1.2K</span> followers</div>
                        </div>
                        <div style={{ borderTop:'1px solid rgba(255,255,255,.08)', marginTop:8, paddingTop:8, fontSize:11, color:'#70B5F9', fontFamily:'-apple-system,sans-serif', cursor:'pointer' }}>View full profile →</div>
                      </div>
                    </div>
                    <div className="cv2-li-left-section">
                      <div className="cv2-li-left-lbl">Recent activity</div>
                      {[
                        { d:'M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z', txt:'Your post · 847 impressions' },
                        { d:'M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19zm.486-5.56C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46zM12 4c-1.105 0-2 .9-2 2s.895 2 2 2 2-.9 2-2-.895-2-2-2zM8 6c0-2.21 1.791-4 4-4s4 1.79 4 4-1.791 4-4 4-4-1.79-4-4z', txt:'Profile viewed · 34 times' },
                        { d:'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z', txt:'5 new followers this week' },
                      ].map((item,i) => (
                        <div key={i} className="cv2-li-left-item">
                          <svg viewBox="0 0 24 24" fill="rgba(255,255,255,.4)" width="12" height="12"><path d={item.d}/></svg>
                          {item.txt}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Main post */}
                  <div className="cv2-li-main-panel">
                    <div className="cv2-li-post-desktop" ref={liRef}>
                      <div className="cv2-li-post-header">
                        <div style={{ width:48, height:48, borderRadius:'50%', background:palette.primary, color:'#000', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.3rem', flexShrink:0 }}>
                          {brand.name.charAt(0)}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                            <span style={{ fontSize:14.5, fontWeight:700, color:'rgba(255,255,255,.93)', fontFamily:'-apple-system,sans-serif' }}>{brand.name}</span>
                            <span style={{ fontSize:10, background:'rgba(10,102,194,.25)', color:'#7FB3E8', padding:'1px 7px', borderRadius:3, fontFamily:'-apple-system,sans-serif' }}>• 3rd+</span>
                          </div>
                          <div style={{ fontSize:11.5, color:'rgba(255,255,255,.42)', fontFamily:'-apple-system,sans-serif', marginTop:1 }}>{brand.positioning}</div>
                          <div style={{ fontSize:11, color:'rgba(255,255,255,.28)', display:'flex', alignItems:'center', gap:4, marginTop:1, fontFamily:'-apple-system,sans-serif' }}>
                            Just now · <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                          </div>
                        </div>
                        <button className="cv2-li-follow-desktop">+ Follow</button>
                      </div>
                      <div style={{ padding:'0 16px 6px', fontSize:10, letterSpacing:'.18em', textTransform:'uppercase', color:'rgba(10,102,194,.75)', fontFamily:'-apple-system,sans-serif' }}>{linkedin.format}</div>
                      <div style={{ padding:'0 16px 10px', fontSize:16, fontWeight:700, color:'rgba(255,255,255,.92)', lineHeight:1.5, fontFamily:'-apple-system,sans-serif' }}>{linkedin.hook}</div>
                      <pre style={{ padding:'0 16px 10px', fontSize:13, color:'rgba(255,255,255,.65)', lineHeight:1.75, whiteSpace:'pre-wrap', fontFamily:'-apple-system,sans-serif', margin:0 }}>{linkedin.body}</pre>
                      <div style={{ padding:'0 16px 10px', fontSize:13, color:'#70B5F9', fontStyle:'italic', fontFamily:'-apple-system,sans-serif' }}>{linkedin.cta}</div>
                      <div style={{ padding:'0 16px 12px', display:'flex', flexWrap:'wrap', gap:4 }}>
                        {linkedin.hashtags.map(h => <span key={h} style={{ fontSize:13, color:'#70B5F9', cursor:'pointer', fontFamily:'-apple-system,sans-serif' }}>#{h}</span>)}
                      </div>
                      <div style={{ padding:'6px 16px', borderTop:'1px solid rgba(255,255,255,.07)', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <span style={{ fontSize:15 }}>👍</span><span style={{ fontSize:15 }}>❤️</span><span style={{ fontSize:15 }}>💡</span>
                          <span style={{ fontSize:12, color:'rgba(255,255,255,.42)', marginLeft:3, fontFamily:'-apple-system,sans-serif' }}>1,204</span>
                        </div>
                        <div style={{ fontSize:12, color:'rgba(255,255,255,.32)', fontFamily:'-apple-system,sans-serif' }}>87 comments · 234 reposts</div>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-around', padding:'3px 8px' }}>
                        {[
                          { label:'Like',    path:'M8 2h.01M12 2a1 1 0 011 1v4h4a1 1 0 01.894 1.447l-4 8A1 1 0 0113 17H6a1 1 0 01-1-1V9a1 1 0 011-1h1.5L8 2h4z', color:'#70B5F9' },
                          { label:'Comment', path:'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z', color:'rgba(255,255,255,.5)' },
                          { label:'Repost',  path:'M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4', color:'rgba(255,255,255,.5)' },
                          { label:'Send',    path:'M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z', color:'rgba(255,255,255,.5)' },
                        ].map(btn => (
                          <button key={btn.label} className="cv2-li-action-btn" style={{ color:btn.color }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d={btn.path}/></svg>
                            <span>{btn.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right panel */}
                  <div className="cv2-li-right-panel">
                    <div className="cv2-li-premium-card">
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                        <svg viewBox="0 0 24 24" fill="#C37D16" width="16" height="16"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,.85)', fontFamily:'-apple-system,sans-serif' }}>Try Premium free</span>
                      </div>
                      <div style={{ fontSize:11.5, color:'rgba(255,255,255,.4)', lineHeight:1.5, marginBottom:10, fontFamily:'-apple-system,sans-serif' }}>AI writing tools, InMail credits, and profile insights.</div>
                      <button style={{ background:'transparent', border:'1px solid #C37D16', color:'#C37D16', borderRadius:16, padding:'5px 12px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'-apple-system,sans-serif', width:'100%' }}>Try free for 1 month</button>
                    </div>
                    <div className="cv2-li-news-card">
                      <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,.88)', marginBottom:8, fontFamily:'-apple-system,sans-serif' }}>LinkedIn News</div>
                      {['Top skills employers want now','AI tools reshaping content','Brand storytelling ROI','Remote leadership trends'].map((item,i) => (
                        <div key={i} style={{ display:'flex', gap:7, fontSize:12, color:'rgba(255,255,255,.58)', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,.04)', fontFamily:'-apple-system,sans-serif', cursor:'pointer', lineHeight:1.3 }}>
                          <span style={{ color:'rgba(255,255,255,.3)', flexShrink:0 }}>·</span><span>{item}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:12 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,.8)', marginBottom:8, fontFamily:'-apple-system,sans-serif' }}>People also viewed</div>
                      {[brand.name+' Team', brand.name+' Page'].map((p,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0' }}>
                          <div style={{ width:28, height:28, borderRadius:'50%', background:`rgba(${TAB_CFG.linkedin.rgb},.5)`, flexShrink:0 }}/>
                          <div style={{ fontSize:12, color:'rgba(255,255,255,.6)', fontFamily:'-apple-system,sans-serif' }}>{p}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </LaptopShell>

            {/* LinkedIn action bar */}
            <div className="cv2-act-bar" style={{ width:'100%', maxWidth:960 }}>
              <button className="cv2-act-btn" onClick={() => exportPNG(liRef, `${brand.name}-linkedin-post.png`)}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                Export Post PNG
              </button>
              <button className="cv2-act-btn" onClick={() => copyText(`${linkedin.hook}\n\n${linkedin.body}\n\n${linkedin.cta}\n\n${linkedin.hashtags.map(h=>'#'+h).join(' ')}`,'Post copied!')}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                Copy Full Post
              </button>
            </div>
          </div>
        )}

        {/* ════════════ IG CAROUSEL ════════════ */}
        {tab === 'carousel' && (
          <div className="cv2-content cv2-ig-content">
            <div className="cv2-section-lbl" style={{ color:'rgba(118,97,97,.65)' }}>04 · IG Carousel</div>

            {composed.slides.length > 0 && (
              <div className="cv2-ig-viewer">
                <div className="cv2-ig-slides-container">
                  <div className="cv2-ig-slides-track" style={{ transform:`translateX(-${slide * 100}%)` }}>
                    {composed.slides.map((s,i) => (
                      <div key={i} className="cv2-ig-slide-item">
                        <img src={`${BASE}${s.image_url}`} alt={`Slide ${i+1}`} className="cv2-ig-slide-img"/>
                        <div className="cv2-ig-slide-badge">{i+1}/{composed.slides.length}</div>
                      </div>
                    ))}
                  </div>
                  {slide > 0 && <button className="cv2-ig-nav cv2-ig-nav-l" onClick={() => setSlide(s=>s-1)}>‹</button>}
                  {slide < composed.slides.length-1 && <button className="cv2-ig-nav cv2-ig-nav-r" onClick={() => setSlide(s=>s+1)}>›</button>}
                </div>
                <div className="cv2-ig-dots">
                  {composed.slides.map((_,i) => (
                    <div key={i} className={`cv2-ig-dot${i===slide?' on':''}`} onClick={() => setSlide(i)}/>
                  ))}
                </div>
              </div>
            )}

            <div className="cv2-ig-copy-grid">
              {carousel.slides.map(s => (
                <div
                  key={s.position}
                  className={`cv2-ig-copy-card${s.position-1===slide?' active':''}`}
                  onClick={() => setSlide(s.position-1)}
                >
                  <div className="cv2-ig-copy-top">
                    <span className="cv2-ig-copy-num">{String(s.position).padStart(2,'0')}</span>
                    <span className="cv2-tag" style={{ fontSize:'7px' }}>{s.role}</span>
                  </div>
                  <div className="cv2-ig-copy-headline">{s.headline}</div>
                  {s.body && <p className="cv2-ig-copy-body">{s.body}</p>}
                </div>
              ))}
            </div>

            <div className="cv2-tile" style={{ marginTop:'1rem' }}>
              <div className="cv2-tile-lbl">Caption</div>
              <p className="cv2-manifesto" style={{ marginTop:'.5rem' }}>{carousel.caption}</p>
              <div className="cv2-tags" style={{ marginTop:'.75rem' }}>
                {carousel.hashtags.map(h => <span key={h} className="cv2-tag">#{h}</span>)}
              </div>
            </div>

            <div className="cv2-act-bar">
              <button className="cv2-act-btn" onClick={() => copyText(`${carousel.caption}\n\n${carousel.hashtags.map(h=>'#'+h).join(' ')}`,'Caption copied!')}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                Copy Caption
              </button>
              <a className="cv2-act-btn" href={`${BASE}${download_url}`} download style={{ textDecoration:'none' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                Download ZIP
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && <div className="cv2-toast">{toast}</div>}
    </div>
  )
} 