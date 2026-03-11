type Family = 'dune' | 'petal' | 'saddle' | 'ribbon'

type Candidate = {
  id: number
  family: Family
  title: string
}

type CardLayout = {
  x: number
  y: number
  width: number
  height: number
}

const candidates: Candidate[] = [
  { id: 11, family: 'dune', title: 'Slip' },
  { id: 19, family: 'petal', title: 'Bloom' },
  { id: 23, family: 'saddle', title: 'Notch' },
  { id: 31, family: 'ribbon', title: 'Drift' },
  { id: 37, family: 'dune', title: 'Shelf' },
  { id: 43, family: 'petal', title: 'Knot' },
  { id: 47, family: 'saddle', title: 'Fold' },
  { id: 53, family: 'ribbon', title: 'Wake' },
  { id: 59, family: 'dune', title: 'Basin' },
  { id: 61, family: 'petal', title: 'Veil' },
  { id: 67, family: 'saddle', title: 'Hollow' },
  { id: 71, family: 'ribbon', title: 'Sweep' },
]

const domCache = {
  app: document.getElementById('app') as HTMLDivElement,
  stage: document.getElementById('stage') as HTMLDivElement,
  status: document.getElementById('status') as HTMLDivElement,
  cards: [] as Array<{
    card: HTMLDivElement
    svg: HTMLDivElement
    family: HTMLSpanElement
    title: HTMLSpanElement
    metaLeft: HTMLSpanElement
    metaRight: HTMLSpanElement
  }>,
}

let scheduledRender = false

function scheduleRender(): void {
  if (scheduledRender) return
  scheduledRender = true
  requestAnimationFrame(function renderBlobField() {
    scheduledRender = false
    render()
  })
}

window.addEventListener('resize', () => scheduleRender())

function hash(n: number): number {
  n = Math.imul((n >>> 16) ^ n, 0x21f0aaad)
  n = Math.imul((n >>> 15) ^ n, 0x735a2d97)
  return (((n >>> 15) ^ n) >>> 0) / 0x100000000
}

function hash2(a: number, b: number): number {
  return hash((a + Math.imul(b, 0x9e3779b9)) | 0)
}

function ensureCard(index: number) {
  let entry = domCache.cards[index]
  if (entry !== undefined) return entry

  const card = document.createElement('div')
  card.className = 'card'

  const label = document.createElement('div')
  label.className = 'card-label'
  const family = document.createElement('span')
  family.className = 'card-family'
  const title = document.createElement('span')
  title.className = 'card-title'
  label.append(family, title)

  const svg = document.createElement('div')
  svg.className = 'card-svg'

  const meta = document.createElement('div')
  meta.className = 'card-meta'
  const metaLeft = document.createElement('span')
  const metaRight = document.createElement('span')
  meta.append(metaLeft, metaRight)

  card.append(label, svg, meta)
  domCache.stage.appendChild(card)

  entry = { card, svg, family, title, metaLeft, metaRight }
  domCache.cards[index] = entry
  return entry
}

function computeCardLayouts(stageWidth: number): { layouts: CardLayout[], stageHeight: number, cols: number } {
  const cols =
    stageWidth >= 1280 ? 4
    : stageWidth >= 920 ? 3
    : stageWidth >= 620 ? 2
    : 1

  const gap = cols === 1 ? 18 : 22
  const outer = cols === 1 ? 18 : 24
  const cardWidth = Math.floor((stageWidth - outer * 2 - gap * (cols - 1)) / cols)
  const cardHeight = Math.round(cardWidth * 0.88)
  const layouts: CardLayout[] = []

  for (let i = 0; i < candidates.length; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols
    layouts.push({
      x: outer + col * (cardWidth + gap),
      y: outer + row * (cardHeight + gap),
      width: cardWidth,
      height: cardHeight,
    })
  }

  const rows = Math.ceil(candidates.length / cols)
  return {
    layouts,
    stageHeight: outer * 2 + rows * cardHeight + Math.max(0, rows - 1) * gap + 76,
    cols,
  }
}

function familyNumber(family: Family): number {
  switch (family) {
    case 'dune': return 0
    case 'petal': return 1
    case 'saddle': return 2
    case 'ribbon': return 3
  }
}

function familyPalette(family: Family): { fillA: string, fillB: string, stroke: string, contour: string } {
  switch (family) {
    case 'dune':
      return {
        fillA: '#f0cb91',
        fillB: '#7d4d28',
        stroke: 'rgba(58, 36, 18, 0.22)',
        contour: 'rgba(255, 240, 214, 0.48)',
      }
    case 'petal':
      return {
        fillA: '#efd1b0',
        fillB: '#8e5a4a',
        stroke: 'rgba(69, 41, 31, 0.2)',
        contour: 'rgba(255, 241, 224, 0.54)',
      }
    case 'saddle':
      return {
        fillA: '#ecc18b',
        fillB: '#5e3b27',
        stroke: 'rgba(43, 26, 15, 0.22)',
        contour: 'rgba(255, 242, 221, 0.42)',
      }
    case 'ribbon':
      return {
        fillA: '#f2d59f',
        fillB: '#6d4528',
        stroke: 'rgba(51, 31, 17, 0.2)',
        contour: 'rgba(255, 246, 230, 0.46)',
      }
  }
}

function blobPoint(
  candidate: Candidate,
  angle: number,
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
): { x: number, y: number } {
  const family = familyNumber(candidate.family)
  const seed = candidate.id

  const centerX = width * (0.5 + (hash2(seed, 41) - 0.5) * 0.06 + Math.sin(viewportWidth * 0.0016 + family) * 0.015)
  const centerY = height * (0.52 + (hash2(seed, 59) - 0.5) * 0.05 + Math.cos(viewportHeight * 0.0018 + seed * 0.03) * 0.015)
  const aspect = viewportWidth / Math.max(1, viewportHeight)
  const warp = Math.sin(viewportWidth * 0.0023 + angle * (2.2 + family * 0.3) + seed * 0.09)
  const warp2 = Math.cos(viewportHeight * 0.0027 - angle * (3.4 + family * 0.2) + seed * 0.13)

  let base = 1
  let stretchX = 1
  let stretchY = 1

  switch (candidate.family) {
    case 'dune':
      base += 0.16 * Math.sin(angle * 2 + seed * 0.11)
      base += 0.08 * Math.cos(angle * 5 - viewportWidth * 0.0019)
      stretchX = 1.28 + 0.04 * Math.sin(viewportHeight * 0.0011 + seed)
      stretchY = 0.92 + 0.05 * Math.cos(viewportWidth * 0.0013 + seed * 0.2)
      break
    case 'petal':
      base += 0.19 * Math.sin(angle * 4 + seed * 0.07)
      base += 0.06 * Math.cos(angle * 7 - viewportHeight * 0.0016)
      stretchX = 1.02 + 0.08 * Math.sin(aspect + seed * 0.03)
      stretchY = 1.08 + 0.08 * Math.cos(aspect * 1.7 + seed * 0.05)
      break
    case 'saddle':
      base += 0.15 * Math.sin(angle * 3 + seed * 0.08)
      base += 0.09 * Math.cos(angle * 6 + viewportWidth * 0.0014)
      base -= 0.13 * Math.cos(angle * 2 - viewportHeight * 0.0013)
      stretchX = 1.12 + 0.06 * Math.sin(seed * 0.02 + viewportWidth * 0.001)
      stretchY = 0.98 + 0.08 * Math.cos(seed * 0.03 + viewportHeight * 0.001)
      break
    case 'ribbon':
      base += 0.11 * Math.sin(angle * 2 + seed * 0.09)
      base += 0.13 * Math.cos(angle * 5 - seed * 0.04 + viewportWidth * 0.0018)
      base += 0.04 * Math.sin(angle * 9 + viewportHeight * 0.0014)
      stretchX = 1.34 + 0.06 * Math.cos(seed * 0.05 + aspect)
      stretchY = 0.8 + 0.05 * Math.sin(seed * 0.02 + aspect * 1.3)
      break
  }

  const radiusX = width * 0.28 * stretchX * (base + warp * 0.1)
  const radiusY = height * 0.24 * stretchY * (base + warp2 * 0.08)
  const driftX = width * 0.03 * Math.sin(angle * 3 + viewportWidth * 0.003 + seed)
  const driftY = height * 0.03 * Math.cos(angle * 4 - viewportHeight * 0.003 + seed * 0.5)

  return {
    x: centerX + Math.cos(angle) * radiusX + driftX,
    y: centerY + Math.sin(angle) * radiusY + driftY,
  }
}

function polygonPoints(
  candidate: Candidate,
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
  scale: number,
): string {
  const points: string[] = []
  const centerX = width * 0.5
  const centerY = height * 0.52
  const steps = 44

  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2
    const point = blobPoint(candidate, angle, width, height, viewportWidth, viewportHeight)
    const x = centerX + (point.x - centerX) * scale
    const y = centerY + (point.y - centerY) * scale
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`)
  }

  return points.join(' ')
}

function buildBlobSvg(
  candidate: Candidate,
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
): string {
  const palette = familyPalette(candidate.family)
  const shapeId = `blob-${candidate.family}-${candidate.id}`
  const outer = polygonPoints(candidate, width, height, viewportWidth, viewportHeight, 1)
  const contourA = polygonPoints(candidate, width, height, viewportWidth, viewportHeight, 0.84)
  const contourB = polygonPoints(candidate, width, height, viewportWidth, viewportHeight, 0.68)
  const contourC = polygonPoints(candidate, width, height, viewportWidth, viewportHeight, 0.54)
  const shadeShiftX = 20 + hash2(candidate.id, 103) * 50
  const shadeShiftY = 18 + hash2(candidate.id, 109) * 44

  return `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <linearGradient id="${shapeId}-fill" x1="${shadeShiftX}%" y1="0%" x2="100%" y2="${shadeShiftY}%">
          <stop offset="0%" stop-color="${palette.fillA}" />
          <stop offset="58%" stop-color="${palette.fillB}" />
          <stop offset="100%" stop-color="#21160f" />
        </linearGradient>
        <radialGradient id="${shapeId}-shine" cx="36%" cy="28%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.72)" />
          <stop offset="46%" stop-color="rgba(255,255,255,0.08)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <polygon points="${outer}" fill="url(#${shapeId}-fill)" stroke="${palette.stroke}" stroke-width="1.2" />
      <polygon points="${outer}" fill="url(#${shapeId}-shine)" opacity="0.55" />
      <polygon points="${contourA}" fill="none" stroke="${palette.contour}" stroke-width="2.3" />
      <polygon points="${contourB}" fill="none" stroke="${palette.contour}" stroke-width="1.7" opacity="0.86" />
      <polygon points="${contourC}" fill="none" stroke="${palette.contour}" stroke-width="1.25" opacity="0.72" />
    </svg>
  `
}

function render(): void {
  const viewportWidth = document.documentElement.clientWidth
  const viewportHeight = document.documentElement.clientHeight
  const stageWidth = domCache.app.getBoundingClientRect().width
  const { layouts, stageHeight, cols } = computeCardLayouts(stageWidth)

  domCache.stage.style.height = `${stageHeight}px`

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]!
    const layout = layouts[i]!
    const card = ensureCard(i)
    const artWidth = layout.width - 24
    const artHeight = layout.height - 74

    card.card.style.left = `${layout.x}px`
    card.card.style.top = `${layout.y}px`
    card.card.style.width = `${layout.width}px`
    card.card.style.height = `${layout.height}px`

    card.family.textContent = candidate.family
    card.title.textContent = candidate.title
    card.metaLeft.textContent = `seed ${candidate.id}`
    card.metaRight.textContent = `${artWidth}×${artHeight}`
    card.svg.innerHTML = buildBlobSvg(candidate, artWidth, artHeight, viewportWidth, viewportHeight)
    card.svg.style.left = '12px'
    card.svg.style.top = '18px'
    card.svg.style.right = '12px'
    card.svg.style.bottom = '38px'
  }

  domCache.status.textContent =
    `12 candidates • ${cols} columns • viewport ${viewportWidth}×${viewportHeight} • every vertex is a pure function of viewport size, family, and seed`
}

scheduleRender()
