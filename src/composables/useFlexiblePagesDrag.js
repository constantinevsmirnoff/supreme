import { ref, computed, onBeforeUnmount } from 'vue'

const DRAG_THRESHOLD_PX = 8

/**
 * Pointer drag for Page Manager flexible pages / folders — fan ghost + drop via elementFromPoint.
 * @param {{
 *   isEnabled: () => boolean,
 *   buildPayload: (start: { kind: 'page'|'folder', id: string }) => { pageIds: string[], folderIds: string[], ghostItems: Array<{ title: string, thumbnail?: string }> },
 *   onDrop: (clientX: number, clientY: number, payload: { pageIds: string[], folderIds: string[] }) => void,
 *   setDropHighlight: (target: 'back' | string | null) => void
 * }} options
 */
function prefersReducedMotion () {
  if (typeof window === 'undefined' || window.matchMedia == null) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useFlexiblePagesDrag (options) {
  const pointerDown = ref(null)
  const dragging = ref(false)
  const payload = ref(
    /** @type {{ pageIds: string[], folderIds: string[], ghostItems: Array<{ title: string, thumbnail?: string }> } | null} */ (
      null
    )
  )
  const pointer = ref({ x: 0, y: 0 })
  /** Degrees — pendulum tilt from horizontal cursor motion (hinge at top of cards). */
  const swingAngle = ref(0)

  /** deg/frame-equivalent angular velocity (integrated each rAF for inertial swing). */
  let swingVelocity = 0

  let lastClientXForSwing = 0
  /** Updated on every pointermove while dragging — used to damp harder when cursor stops. */
  let lastSwingMoveTs = 0
  let swingRafId = null

  /** Smaller = heavier / less twitchy; integrated over frames for momentum. */
  const SWING_IMPULSE_PER_PX = 0.034
  const SWING_MAX_VELOCITY = 2.15
  const SWING_MAX_ANGLE = 32
  const SWING_VELOCITY_DRAG = 0.986
  const SWING_CENTERING = 0.0052
  /** After this many ms without pointer movement, apply extra damping. */
  const SWING_STILL_CURSOR_MS = 42
  /** Extra velocity multiplier per frame while cursor is still (stronger settle). */
  const SWING_STILL_VELOCITY_DAMP = 0.928
  /** Stronger centering torque toward 0° when cursor is still. */
  const SWING_STILL_CENTERING_MULT = 2.35

  function stopSwingLoop () {
    if (swingRafId != null) {
      cancelAnimationFrame(swingRafId)
      swingRafId = null
    }
  }

  function swingLoop () {
    if (!dragging.value) {
      stopSwingLoop()
      return
    }
    if (!prefersReducedMotion()) {
      const now = performance.now()
      const cursorStill =
        lastSwingMoveTs > 0 && now - lastSwingMoveTs > SWING_STILL_CURSOR_MS

      swingAngle.value += swingVelocity
      if (swingAngle.value < -SWING_MAX_ANGLE) {
        swingAngle.value = -SWING_MAX_ANGLE
        swingVelocity *= 0.35
      } else if (swingAngle.value > SWING_MAX_ANGLE) {
        swingAngle.value = SWING_MAX_ANGLE
        swingVelocity *= 0.35
      }

      swingVelocity *= SWING_VELOCITY_DRAG
      if (cursorStill) {
        swingVelocity *= SWING_STILL_VELOCITY_DAMP
      }

      const centering = cursorStill
        ? SWING_CENTERING * SWING_STILL_CENTERING_MULT
        : SWING_CENTERING
      swingVelocity -= swingAngle.value * centering

      if (Math.abs(swingVelocity) < 0.0018) swingVelocity = 0
      if (
        Math.abs(swingAngle.value) < 0.06 &&
        Math.abs(swingVelocity) < 0.01
      ) {
        swingAngle.value = 0
        swingVelocity = 0
      }
    }
    swingRafId = requestAnimationFrame(swingLoop)
  }

  function ensureSwingLoop () {
    if (swingRafId == null) {
      swingRafId = requestAnimationFrame(swingLoop)
    }
  }

  const ghostStyleRoot = computed(() => ({
    position: 'fixed',
    left: `${pointer.value.x}px`,
    top: `${pointer.value.y}px`,
    zIndex: '10060',
    pointerEvents: 'none'
  }))

  function teardownListeners () {
    window.removeEventListener('pointermove', onWindowPointerMove)
    window.removeEventListener('pointerup', onWindowPointerUp, true)
    window.removeEventListener('pointercancel', onWindowPointerUp, true)
  }

  function reset () {
    teardownListeners()
    stopSwingLoop()
    pointerDown.value = null
    dragging.value = false
    payload.value = null
    swingAngle.value = 0
    swingVelocity = 0
    lastSwingMoveTs = 0
    options.setDropHighlight(null)
  }

  function onWindowPointerMove (e) {
    if (!pointerDown.value && !dragging.value) return
    pointer.value = { x: e.clientX, y: e.clientY }

    if (pointerDown.value != null && !dragging.value) {
      const dx = e.clientX - pointerDown.value.x
      const dy = e.clientY - pointerDown.value.y
      if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return
      if (!options.isEnabled()) {
        reset()
        return
      }
      const built = options.buildPayload(pointerDown.value)
      dragging.value = true
      payload.value = built
      pointerDown.value = null
      lastClientXForSwing = e.clientX
      lastSwingMoveTs = performance.now()
      swingAngle.value = 0
      swingVelocity = 0
      ensureSwingLoop()
    }

    if (!dragging.value || payload.value == null) return

    lastSwingMoveTs = performance.now()

    if (!prefersReducedMotion()) {
      const dx = e.clientX - lastClientXForSwing
      lastClientXForSwing = e.clientX
      swingVelocity += dx * SWING_IMPULSE_PER_PX
      swingVelocity = Math.max(
        -SWING_MAX_VELOCITY,
        Math.min(SWING_MAX_VELOCITY, swingVelocity)
      )
    }
    const el = document.elementFromPoint(e.clientX, e.clientY)
    if (!(el instanceof Element)) {
      options.setDropHighlight(null)
      return
    }
    const back = el.closest('[data-pm-back-drop="true"]')
    if (back) {
      options.setDropHighlight('back')
      return
    }
    const folderEl = el.closest('[data-pm-folder-drop]')
    if (folderEl instanceof HTMLElement) {
      const id = folderEl.dataset.pmFolderDrop
      if (id) {
        options.setDropHighlight(id)
        return
      }
    }
    options.setDropHighlight(null)
  }

  function onWindowPointerUp (e) {
    if (dragging.value && payload.value != null) {
      options.onDrop(e.clientX, e.clientY, payload.value)
    }
    reset()
  }

  function onCellPointerDown (e, start) {
    if (e.button !== 0) return
    if (!options.isEnabled()) return
    pointerDown.value = { ...start, x: e.clientX, y: e.clientY }
    pointer.value = { x: e.clientX, y: e.clientY }
    window.addEventListener('pointermove', onWindowPointerMove)
    window.addEventListener('pointerup', onWindowPointerUp, true)
    window.addEventListener('pointercancel', onWindowPointerUp, true)
  }

  onBeforeUnmount(() => {
    reset()
  })

  return {
    dragging,
    payload,
    pointer,
    swingAngle,
    ghostStyleRoot,
    onCellPointerDown,
    reset
  }
}
