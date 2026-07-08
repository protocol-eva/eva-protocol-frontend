// @ts-nocheck
/* ============================================================================
   CoinField — floating chrome coins with rapier physics that collide with the
   chat box. Hyperrealistic pipeline (researched):
     • Environment (reflections only, background stays pure black) — the
       load-bearing piece: chrome is 100% reflected environment.
     • metalness ~1 / low roughness + ACES tone-mapping (in the composer).
     • @react-three/postprocessing: Bloom → ChromaticAberration (RGB split) →
       colour grade → Vignette → film-grain Noise → SMAA.
     • N8AO / SSR deliberately excluded (high cost, ~zero gain on floating
       coins) to hold ~60fps.
   Look is fixed in the `ctrl` constant below (Leva debug panel removed).
   ========================================================================== */
import {
  useRef,
  useMemo,
  useState,
  useEffect,
  createContext,
  useContext,
} from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import {
  useGLTF,
  Environment,
  Lightformer,
  AdaptiveDpr,
  AdaptiveEvents,
} from '@react-three/drei'
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
} from '@react-three/rapier'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  SMAA,
  ToneMapping,
  BrightnessContrast,
  HueSaturation,
  // extra "try-it" effects — all OFF in the fixed `ctrl` config below
  Glitch,
  Pixelation,
  DotScreen,
  Scanline,
  Sepia,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'

// ACES Filmic = the production tone-mapping curve (Leva mode selector removed).
const TONE_MODE_DEFAULT = ToneMappingMode.ACES_FILMIC

const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
const isFirefox =
  typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox')
const params =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams()
const DEBUG = params.has('debug')
const FREEZE = params.has('freeze')

// Global attraction point (follows the mouse). Canvas is pointer-events:none,
// so we feed pointer coords in from a window listener.
const attractionPointRef = { current: { x: 0, y: 0, z: 0 } }
const pointerNorm = { x: 0, y: 0, active: false, lastMove: 0 }

// ── lighting — specular glints on the metal (the env supplies reflections) ──
function SceneLighting() {
  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight intensity={6} position={[0, 10, -5]} color="#ffffff" />
      <directionalLight intensity={6} position={[5, 5, -10]} color="#e0e0e0" />
      <directionalLight intensity={9} position={[-8, 0, 2]} color="#d0d0d0" />
      <pointLight
        intensity={55}
        position={[0, 0, 5]}
        color="#ffffff"
        distance={30}
        decay={2}
      />
      <pointLight
        intensity={36}
        position={[0, 0, 15]}
        color="#ffffff"
        distance={28}
        decay={1.1}
      />
    </>
  )
}

// ── studio environment built from Lightformers (offline, no HDRI download).
//    Bright defined panels become the chrome reflection streaks. Baked once. ──
function StudioEnv() {
  return (
    <Environment resolution={256} frames={1} background={false}>
      {/* big soft key */}
      <Lightformer
        intensity={2.0}
        form="rect"
        position={[0, 4, -6]}
        scale={[14, 7, 1]}
        color="#ffffff"
      />
      {/* vertical streaks the chrome catches */}
      <Lightformer
        intensity={3.6}
        form="rect"
        position={[-6, 1, -1]}
        rotation={[0, 0.35, 0]}
        scale={[1.4, 9, 1]}
        color="#ffffff"
      />
      <Lightformer
        intensity={3.2}
        form="rect"
        position={[6, -1, -1]}
        rotation={[0, -0.35, 0]}
        scale={[1.4, 9, 1]}
        color="#cfe0ff"
      />
      {/* cool rim + soft underfill */}
      <Lightformer
        intensity={1.4}
        form="ring"
        position={[0, -4, 4]}
        scale={[5, 5, 1]}
        color="#8fa8ff"
      />
      <Lightformer
        intensity={1.1}
        form="rect"
        position={[0, 0, 8]}
        scale={[10, 10, 1]}
        color="#9aa3c0"
      />
    </Environment>
  )
}

// ── soft radial center glow plane (the "punto central clarito"), kept dark ──
function CenterGlowPlane() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 512, 512)
    const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 320)
    g.addColorStop(0, 'rgba(60,63,72,0.36)')
    g.addColorStop(0.18, 'rgba(40,42,50,0.24)')
    g.addColorStop(0.36, 'rgba(24,25,31,0.15)')
    g.addColorStop(0.55, 'rgba(12,12,16,0.08)')
    g.addColorStop(0.72, 'rgba(6,6,8,0.035)')
    g.addColorStop(0.88, 'rgba(2,2,3,0.01)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 512, 512)
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh position={[0, 0, -8]}>
      <planeGeometry args={[40, 20]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  )
}

const deviceConfig = {
  coinRepeat: isMobile ? 5 : isFirefox ? 9 : 13,
  // cap DPR — full 2.0 on retina is the #1 silent fps killer (research).
  // AdaptiveDpr drops it further on weak GPUs.
  dpr: isMobile ? 0.85 : isFirefox ? 1.1 : ([1, 1.4] as [number, number]),
}

// ── release the WebGL context on unmount. Re-entering the landing otherwise
//    leaks a whole context (Canvas + composer + PMREM cubemap); browsers cap
//    live contexts at ~8-16 → exhaustion → GPU OOM → tab crash. THE crash fix.
function DisposeGuard() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    return () => {
      try {
        gl.dispose()
        gl.forceContextLoss?.()
      } catch {
        /* context already gone */
      }
    }
  }, [gl])
  return null
}

// Live tone-mapping EXPOSURE knob. The composer's <ToneMapping> effect reads the
// renderer's toneMappingExposure uniform, so setting it here changes exposure
// every frame WITHOUT recompiling materials (cheap). The curve/algorithm itself
// is chosen on the <ToneMapping mode> below. Pure dev-tuning; default 1.0.
function ExposureControl({ exposure }: { exposure: number }) {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    gl.toneMappingExposure = exposure
  }, [gl, exposure])
  return null
}

const coinModels = [{ name: 'EvaCoin.glb' }, { name: 'solanacoin-v1.glb' }]

const shuffle = () => {
  const coins = []
  for (let i = 0; i < deviceConfig.coinRepeat; i++) {
    coinModels.forEach((coin) => coins.push({ ...coin }))
  }
  return coins
}

const PhysicsResetContext = createContext({ isActive: { current: false } })

const generateVisiblePositions = (count) => {
  const r = THREE.MathUtils.randFloatSpread
  return Array.from({ length: count }, () => [r(10), r(10), r(8)])
}

type CoinFieldProps = { collisionRef: React.RefObject<HTMLElement | null> }

export default function CoinField({ collisionRef }: CoinFieldProps) {
  const [enabled] = useState(() => {
    if (typeof window === 'undefined') return true
    return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  })
  const connectors = useMemo(() => shuffle(), [])
  const visiblePositions = useRef(generateVisiblePositions(connectors.length))
  const containerRef = useRef(null)
  const isPhysicsActive = useRef(true)
  const [boundariesActive, setBoundariesActive] = useState(false)
  const [physicsPaused, setPhysicsPaused] = useState(false)
  const [frozen, setFrozen] = useState(false)

  const resetContext = useMemo(() => ({ isActive: isPhysicsActive }), [])

  // ── Fixed production look (Leva debug panel removed). These are the values
  //    dialled in during tuning — edit them here to change the coins' grade.
  //    ACES Filmic tone-map + exposure 1.0, chrome material, bloom, subtle CA,
  //    colour grade, vignette + grain. Experimental effects stay OFF. ──
  const ctrl = {
    toneMode: TONE_MODE_DEFAULT,
    exposure: 1.0,
    metalness: 1.0,
    roughness: 0.15,
    envMapIntensity: 1.35,
    bloomIntensity: 0.7,
    luminanceThreshold: 0.82,
    luminanceSmoothing: 0.3,
    bloomRadius: 0.72,
    caOffset: 0.0008,
    caModulation: 0.15,
    saturation: 0.06,
    contrast: 0.1,
    brightness: -0.02,
    vignetteOffset: 0.32,
    vignetteDarkness: 0.55,
    noiseOpacity: 0.035,
    glitch: false,
    pixelation: false,
    pixelSize: 6,
    dotScreen: false,
    scanline: false,
    scanlineDensity: 1.25,
    sepia: false,
    sepiaIntensity: 0.6,
  }

  const mat = useMemo(
    () => ({
      metalness: ctrl.metalness,
      roughness: ctrl.roughness,
      envMapIntensity: ctrl.envMapIntensity,
    }),
    [ctrl.metalness, ctrl.roughness, ctrl.envMapIntensity]
  )
  const caOffset = useMemo(
    () => new THREE.Vector2(ctrl.caOffset, ctrl.caOffset),
    [ctrl.caOffset]
  )

  // walls activate a bit after mount so coins are still settling at reveal
  useEffect(() => {
    const id = setTimeout(() => setBoundariesActive(true), 900)
    return () => clearTimeout(id)
  }, [])

  // pause physics + rendering when scrolled out of view
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => setPhysicsPaused(!e.isIntersecting),
      { threshold: 0.05 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // pause when the tab is hidden (perf)
  useEffect(() => {
    const onVis = () => setPhysicsPaused(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // /?freeze — stop the render loop after the coins settle (for static capture)
  useEffect(() => {
    if (!FREEZE) return
    const id = setTimeout(() => setFrozen(true), 4500)
    return () => clearTimeout(id)
  }, [])

  // feed pointer position from the window (canvas is pointer-events:none)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerNorm.x = (e.clientX / window.innerWidth) * 2 - 1
      pointerNorm.y = -(e.clientY / window.innerHeight) * 2 + 1
      pointerNorm.active = true
      pointerNorm.lastMove = performance.now()
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  if (!enabled) return null

  return (
    <>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        <Canvas
          dpr={deviceConfig.dpr}
          frameloop={physicsPaused || frozen ? 'never' : 'always'}
          // depth:false on the DEFAULT framebuffer — all 3D renders into the
          // EffectComposer's own render targets (which keep their depth buffer,
          // so coin sorting is unchanged). Without this, the composer's final
          // blit shares a depth-stencil image with the default FB, which ANGLE
          // (Chrome/Windows in production) rejects: "glBlitFramebuffer: Read and
          // write depth stencil attachments cannot be the same image".
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: 'high-performance',
            stencil: false,
            depth: false,
          }}
          camera={{ position: [0, 0, 15], fov: 17.5, near: 1, far: 100 }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace
            gl.toneMapping = THREE.NoToneMapping // ACES is applied in the composer
          }}
          style={{ width: '100%', height: '100%', background: 'transparent' }}
        >
          <DisposeGuard />
          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
          <CenterGlowPlane />
          <SceneLighting />
          <StudioEnv />
          <PhysicsResetContext.Provider value={resetContext}>
            <Physics
              timeStep={1 / 60}
              gravity={[0, 0, 0]}
              paused={physicsPaused}
              debug={DEBUG}
            >
              <Pointer />
              {boundariesActive && <Boundaries />}
              <ChatBoxCollider collisionRef={collisionRef} />
              <CoinsContainer
                connectors={connectors}
                visiblePositions={visiblePositions}
                mat={mat}
              />
            </Physics>
          </PhysicsResetContext.Provider>

          {/* Exposure is applied on the renderer uniform that the composer's
              ToneMapping reads — kept outside <EffectComposer> (it's not an effect). */}
          <ExposureControl exposure={ctrl.exposure} />

          {/* Post-processing chain. ToneMapping FIRST (HDR→display) then bloom,
              chromatic aberration, colour grade, vignette, grain, AA. The extra
              effects below are OFF unless toggled in Leva → production is unchanged.
              DO NOT reorder ToneMapping after Bloom — bloom must read HDR. */}
          {/* IMPORTANT: pass children as a .filter(Boolean) ARRAY. EffectComposer
              reads child.blendMode.alpha on every child, so a `null`/`false` child
              (from a toggled-off effect) crashes it ("Cannot read properties of
              null (reading 'alpha')"). Filtering keeps only real effects. The
              experimental toggles default OFF, so production is unchanged.
              Keep ToneMapping FIRST (HDR→display) — bloom must read HDR. */}
          <EffectComposer multisampling={0}>
            {[
              <ToneMapping key="tonemap" mode={ctrl.toneMode} />,
              <Bloom
                key="bloom"
                mipmapBlur
                intensity={ctrl.bloomIntensity}
                luminanceThreshold={ctrl.luminanceThreshold}
                luminanceSmoothing={ctrl.luminanceSmoothing}
                radius={ctrl.bloomRadius}
              />,
              <ChromaticAberration
                key="ca"
                offset={caOffset}
                radialModulation
                modulationOffset={ctrl.caModulation}
              />,
              <HueSaturation key="hue" hue={0} saturation={ctrl.saturation} />,
              <BrightnessContrast
                key="bc"
                brightness={ctrl.brightness}
                contrast={ctrl.contrast}
              />,
              <Vignette
                key="vig"
                offset={ctrl.vignetteOffset}
                darkness={ctrl.vignetteDarkness}
                eskil={false}
              />,
              <Noise
                key="noise"
                premultiply
                blendFunction={BlendFunction.SOFT_LIGHT}
                opacity={ctrl.noiseOpacity}
              />,
              // experimental toggles (Leva → Effects) — only included when ON
              ctrl.pixelation && (
                <Pixelation key="px" granularity={ctrl.pixelSize} />
              ),
              ctrl.dotScreen && <DotScreen key="dot" scale={0.9} />,
              ctrl.scanline && (
                <Scanline key="scan" density={ctrl.scanlineDensity} />
              ),
              ctrl.sepia && (
                <Sepia key="sepia" intensity={ctrl.sepiaIntensity} />
              ),
              ctrl.glitch && <Glitch key="glitch" />,
              <SMAA key="smaa" />,
            ].filter(Boolean)}
          </EffectComposer>
        </Canvas>
      </div>
    </>
  )
}

const coinSettings = {
  linearDamping: 2.5,
  angularDamping: 8,
  mass: 2,
  attractionForce: 0.008,
  attractionDistanceMultiplier: 0.008,
  friction: 1.5,
  restitution: 0,
  coinColliderRadius: 0.66, // smaller coins (more of them, to compensate)
}

const COIN_SCALE = 0.7 // visual scale matched to the smaller collider

const pointerSettings = {
  colliderRadius: 1.4,
  restitution: 0,
  friction: 2.5,
  lerpSpeed: isMobile ? 0.12 : 0.08,
}

function CoinsContainer({ connectors, visiblePositions, mat }) {
  return (
    <>
      {connectors.map((coin, i) => (
        <CryptoCoins
          key={i}
          index={i}
          initialPosition={visiblePositions.current[i]}
          modelName={coin.name}
          mat={mat}
        />
      ))}
    </>
  )
}

function CryptoCoins({ initialPosition, modelName, mat }) {
  const api = useRef()
  const ref = useRef()
  const { isActive } = useContext(PhysicsResetContext)
  const { scene } = useGLTF(`/3dmodels/${modelName}`)
  const vec = useMemo(() => new THREE.Vector3(), [])
  const clonedScene = useMemo(() => scene.clone(), [scene])

  // apply material settings (re-applies live when leva changes)
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        if (child.material.name !== 'symbolMaterial') {
          child.material.metalness = mat.metalness
          child.material.roughness = mat.roughness
          child.material.envMapIntensity = mat.envMapIntensity
        } else {
          child.material.emissiveIntensity = 0.35
        }
        child.material.needsUpdate = true
      }
    })
  }, [clonedScene, mat.metalness, mat.roughness, mat.envMapIntensity])

  useFrame((_, delta) => {
    if (!isActive.current || !api.current) return
    const attr = attractionPointRef.current
    const pos = api.current.translation()
    const dx = pos.x - attr.x
    const dy = pos.y - attr.y
    const dz = pos.z - attr.z
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const deltaMultiplier = Math.min(delta * 60, 3)
    const force =
      coinSettings.attractionForce +
      distance * coinSettings.attractionDistanceMultiplier
    vec
      .set(-dx, -dy, -dz)
      .normalize()
      .multiplyScalar(force * distance * deltaMultiplier)
    api.current?.applyImpulse(vec)
  })

  return (
    <RigidBody
      linearDamping={coinSettings.linearDamping}
      angularDamping={coinSettings.angularDamping}
      friction={coinSettings.friction}
      restitution={coinSettings.restitution}
      mass={coinSettings.mass}
      position={initialPosition}
      ref={api}
      colliders={false}
    >
      <BallCollider args={[coinSettings.coinColliderRadius]} />
      <group ref={ref} scale={COIN_SCALE}>
        <primitive object={clonedScene} />
      </group>
    </RigidBody>
  )
}

useGLTF.preload('/3dmodels/EvaCoin.glb')
useGLTF.preload('/3dmodels/solanacoin-v1.glb')

function Pointer() {
  const ref = useRef()
  const currentPos = useRef(new THREE.Vector3(0, 0, 0))
  const targetPos = useRef(new THREE.Vector3(0, 0, 0))

  useFrame(({ viewport }) => {
    // when the mouse has been idle, draw coins back to centre (around the chat box)
    const idle = performance.now() - pointerNorm.lastMove > 1500
    targetPos.current.set(
      idle ? 0 : (pointerNorm.x * viewport.width) / 2,
      idle ? 0 : (pointerNorm.y * viewport.height) / 2,
      0
    )
    currentPos.current.lerp(
      targetPos.current,
      idle ? 0.03 : pointerSettings.lerpSpeed
    )
    attractionPointRef.current.x = currentPos.current.x
    attractionPointRef.current.y = currentPos.current.y
    ref.current?.setNextKinematicTranslation(currentPos.current)
  })

  return (
    <RigidBody
      position={[0, 0, 0]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
      restitution={pointerSettings.restitution}
      friction={pointerSettings.friction}
    >
      <BallCollider args={[pointerSettings.colliderRadius]} />
    </RigidBody>
  )
}

function Boundaries() {
  const { viewport } = useThree()
  const wallThickness = 2.5
  const depth = 20
  // frictionless walls so coins slide along edges instead of sticking
  const wall = { type: 'fixed' as const, restitution: 0.7, friction: 0 }
  const halfWidth = viewport.width / 2 + 0.6
  const halfHeight = viewport.height / 2 + 0.6
  return (
    <>
      <RigidBody {...wall} position={[-halfWidth - wallThickness / 2, 0, 0]}>
        <CuboidCollider args={[wallThickness / 2, halfHeight, depth]} />
      </RigidBody>
      <RigidBody {...wall} position={[halfWidth + wallThickness / 2, 0, 0]}>
        <CuboidCollider args={[wallThickness / 2, halfHeight, depth]} />
      </RigidBody>
      <RigidBody {...wall} position={[0, halfHeight + wallThickness / 2, 0]}>
        <CuboidCollider args={[halfWidth, wallThickness / 2, depth]} />
      </RigidBody>
      <RigidBody {...wall} position={[0, -halfHeight - wallThickness / 2, 0]}>
        <CuboidCollider args={[halfWidth, wallThickness / 2, depth]} />
      </RigidBody>
      {/* back wall (the one the camera looks at). Pushed far from the camera
          so it sits well behind where coins spawn (z∈[-4,4]) — otherwise coins
          spawn embedded in it / get pinned when the walls pop in → sticking. */}
      <RigidBody {...wall} position={[0, 0, -7]}>
        <CuboidCollider args={[halfWidth, halfHeight, wallThickness / 2]} />
      </RigidBody>
      <RigidBody {...wall} position={[0, 0, depth]}>
        <CuboidCollider args={[halfWidth, halfHeight, wallThickness / 2]} />
      </RigidBody>
    </>
  )
}

/* ── the chat box as a kinematic collider the coins bounce off of ── */
function ChatBoxCollider({
  collisionRef,
}: {
  collisionRef: React.RefObject<HTMLElement | null>
}) {
  const body = useRef()
  const collider = useRef<any>(null)
  const { viewport, size } = useThree()
  // Cache the chat-box rect — reading getBoundingClientRect() every frame forces
  // a synchronous layout 60×/sec, which locks the main thread (the hang).
  const rectRef = useRef<DOMRect | null>(null)

  useEffect(() => {
    const el = collisionRef.current
    if (!el) return
    const update = () => {
      rectRef.current = el.getBoundingClientRect()
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    const id = window.setInterval(update, 500) // catch the loader fade-in / font shifts
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      window.clearInterval(id)
    }
  }, [collisionRef])

  useFrame(() => {
    const r = rectRef.current
    const api = body.current
    if (!r || !r.width || !api) return
    const cx = ((r.left + r.width / 2) / size.width - 0.5) * viewport.width
    const cy = -((r.top + r.height / 2) / size.height - 0.5) * viewport.height
    const hx = Math.max((r.width / size.width) * viewport.width * 0.5, 0.1)
    const hy = Math.max((r.height / size.height) * viewport.height * 0.5, 0.1)
    api.setNextKinematicTranslation({ x: cx, y: cy, z: 0 })
    if (collider.current?.setHalfExtents) {
      // VERY deep in z: coins drift in front of / behind the chat box at all
      // sorts of z; a shallow slab let them sail past its screen footprint and
      // look like they passed through. A deep slab makes any coin overlapping
      // the chat box (at any z) actually bounce off it.
      collider.current.setHalfExtents({ x: hx, y: hy, z: 18 })
    }
  })

  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      restitution={0.7}
      friction={0}
    >
      <CuboidCollider ref={collider} args={[2, 0.4, 18]} />
    </RigidBody>
  )
}
