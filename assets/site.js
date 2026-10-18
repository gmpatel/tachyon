/* Tachyon site: header menu, the Australia-only section + city picker, reveal on scroll, rotating screens,
   screenshot tabs + lightbox, copy buttons, Manual search + topic highlighting. Plain JS, no dependencies. */
;(() => {
  const d = document
  const $$ = (sel, el = d) => Array.from(el.querySelectorAll(sel))
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---------- header menu (phones)
  const toggle = d.querySelector('.nav-toggle')
  const nav = d.getElementById('nav')
  if (toggle && nav) {
    const set = (open) => {
      nav.classList.toggle('open', open)
      toggle.setAttribute('aria-expanded', String(open))
    }
    toggle.addEventListener('click', () => set(!nav.classList.contains('open')))
    $$('a', nav).forEach((a) => a.addEventListener('click', () => set(false)))
    d.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        set(false)
        toggle.focus()
      }
    })
    d.addEventListener('click', (e) => {
      if (nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) set(false)
    })
  }

  // ---------- Australia: [data-au-only] shows for an Australian time zone (nothing is sent anywhere), or with ?au
  // to preview; the city picker starts on the visitor's city
  const tz = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    } catch {
      return ''
    }
  })()
  const auPreview = /[?&]au\b/.test(location.search)
  const inAu = /^Australia\//.test(tz) || tz === 'Antarctica/Macquarie'
  if (inAu || auPreview) $$('[data-au-only]').forEach((el) => (el.hidden = false))
  const chips = $$('.city-chip')
  if (chips.length) {
    const pick = (city) => {
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.getAttribute('data-city') === city)))
      $$('[data-city-panel]').forEach((p) => (p.hidden = p.getAttribute('data-city-panel') !== city))
    }
    chips.forEach((c) => c.addEventListener('click', () => pick(c.getAttribute('data-city'))))
    // time zone → nearest capital's line-up (Broken Hill and Lord Howe are in NSW; Lindeman is Queensland)
    const TZ_CITY = {
      Sydney: 'sydney', ACT: 'canberra', Canberra: 'canberra', NSW: 'sydney', Broken_Hill: 'sydney', Lord_Howe: 'sydney', LHI: 'sydney',
      Melbourne: 'melbourne', Victoria: 'melbourne',
      Brisbane: 'brisbane', Lindeman: 'brisbane', Queensland: 'brisbane',
      Adelaide: 'adelaide', South: 'adelaide',
      Perth: 'perth', West: 'perth', Eucla: 'perth',
      Hobart: 'hobart', Tasmania: 'hobart', Currie: 'hobart', Macquarie: 'hobart',
      Darwin: 'darwin', North: 'darwin'
    }
    const city = inAu ? TZ_CITY[tz.split('/')[1]] : null
    if (city && chips.some((c) => c.getAttribute('data-city') === city)) {
      pick(city)
      const note = d.querySelector('.city-auto')
      if (note) note.hidden = false
    }
  }

  // ---------- reveal on scroll
  const reveals = $$('.reveal')
  if (reduce || !('IntersectionObserver' in window)) reveals.forEach((el) => el.classList.add('in'))
  else {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }),
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 }
    )
    reveals.forEach((el) => io.observe(el))
  }

  // ---------- rotating device screens: <div data-rotate="5200"><img class="on">…</div>
  if (!reduce)
    $$('[data-rotate]').forEach((screen) => {
      const imgs = $$('img', screen)
      if (imgs.length < 2) return
      let i = Math.max(0, imgs.findIndex((img) => img.classList.contains('on')))
      const ms = Math.max(1500, Number(screen.getAttribute('data-rotate')) || 5000)
      setInterval(() => {
        if (d.hidden) return
        imgs[i].classList.remove('on')
        i = (i + 1) % imgs.length
        imgs[i].classList.add('on')
      }, ms)
    })

  // ---------- tabs (screenshot gallery)
  $$('[role="tablist"]').forEach((list) => {
    const tabs = $$('[role="tab"]', list)
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab
        t.setAttribute('aria-selected', String(on))
        t.tabIndex = on ? 0 : -1
        const panel = d.getElementById(t.getAttribute('aria-controls'))
        if (panel) panel.hidden = !on
      })
      if (focus) tab.focus()
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t))
      t.addEventListener('keydown', (e) => {
        const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
        if (step) {
          e.preventDefault()
          select(tabs[(i + step + tabs.length) % tabs.length], true)
        } else if (e.key === 'Home' || e.key === 'End') {
          e.preventDefault()
          select(tabs[e.key === 'Home' ? 0 : tabs.length - 1], true)
        }
      })
    })
  })

  // ---------- lightbox: <button data-lightbox="group" [data-index="n"]><img alt="caption"></button>
  // a group's order is the gallery's (buttons inside .gallery); outside a gallery, the page order of that group
  const shots = $$('[data-lightbox]')
  if (shots.length) {
    const groupOf = (name) => {
      const all = shots.filter((b) => b.getAttribute('data-lightbox') === name)
      const inGallery = all.filter((b) => b.closest('.gallery'))
      return inGallery.length ? inGallery : all
    }
    const icon = (path) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`
    const lb = d.createElement('div')
    lb.className = 'lightbox'
    lb.setAttribute('role', 'dialog')
    lb.setAttribute('aria-modal', 'true')
    lb.setAttribute('aria-label', 'Screenshot Viewer')
    lb.innerHTML =
      `<button class="lb-btn lb-close" type="button" aria-label="Close">${icon('M6 6l12 12M18 6 6 18')}</button>` +
      `<button class="lb-btn lb-prev" type="button" aria-label="Previous">${icon('m15 6-6 6 6 6')}</button>` +
      `<img alt="">` +
      `<button class="lb-btn lb-next" type="button" aria-label="Next">${icon('m9 6 6 6-6 6')}</button>` +
      `<p class="lb-cap" aria-live="polite"></p>`
    d.body.appendChild(lb)
    const img = lb.querySelector('img')
    const cap = lb.querySelector('.lb-cap')
    const prev = lb.querySelector('.lb-prev')
    const next = lb.querySelector('.lb-next')
    let list = []
    let at = 0
    let lastFocus = null
    const show = (i) => {
      at = (i + list.length) % list.length
      const src = list[at].querySelector('img')
      img.src = src.currentSrc || src.src
      img.alt = src.alt
      cap.textContent = `${src.alt}${list.length > 1 ? `  ·  ${at + 1} / ${list.length}` : ''}`
      prev.hidden = next.hidden = list.length < 2
    }
    const open = (btn) => {
      list = groupOf(btn.getAttribute('data-lightbox'))
      const idx = btn.hasAttribute('data-index') ? Number(btn.getAttribute('data-index')) : list.indexOf(btn)
      lastFocus = btn
      show(Number.isFinite(idx) && idx >= 0 && idx < list.length ? idx : 0)
      lb.classList.add('open')
      d.documentElement.style.overflow = 'hidden'
      lb.querySelector('.lb-close').focus()
    }
    const close = () => {
      lb.classList.remove('open')
      d.documentElement.style.overflow = ''
      img.removeAttribute('src')
      if (lastFocus) lastFocus.focus()
    }
    shots.forEach((b) => b.addEventListener('click', () => open(b)))
    lb.querySelector('.lb-close').addEventListener('click', close)
    prev.addEventListener('click', () => show(at - 1))
    next.addEventListener('click', () => show(at + 1))
    lb.addEventListener('click', (e) => {
      if (e.target === lb) close()
    })
    d.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') show(at - 1)
      else if (e.key === 'ArrowRight') show(at + 1)
      else if (e.key === 'Tab') {
        // keep focus inside the dialog
        const f = $$('button:not([hidden])', lb)
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && d.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && d.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    })
    let tx = null
    let ty = 0
    lb.addEventListener('touchstart', (e) => {
      tx = e.touches[0].clientX
      ty = e.touches[0].clientY
    }, { passive: true })
    lb.addEventListener('touchend', (e) => {
      if (tx === null) return
      const dx = e.changedTouches[0].clientX - tx
      const dy = e.changedTouches[0].clientY - ty
      tx = null
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && list.length > 1) show(at + (dx < 0 ? 1 : -1))
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close()
    })
  }

  // ---------- copy buttons: <button data-copy="7607080"><span>Copy Code</span></button>
  $$('[data-copy]').forEach((btn) => {
    const label = btn.querySelector('span') || btn
    const original = label.textContent
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy')
      let ok = false
      try {
        await navigator.clipboard.writeText(text)
        ok = true
      } catch {
        const ta = d.createElement('textarea')
        ta.value = text
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        d.body.appendChild(ta)
        ta.select()
        try {
          ok = d.execCommand('copy')
        } catch {
          ok = false
        }
        ta.remove()
      }
      label.textContent = ok ? 'Copied' : text
      btn.classList.toggle('copy-ok', ok)
      clearTimeout(btn._t)
      btn._t = setTimeout(() => {
        label.textContent = original
        btn.classList.remove('copy-ok')
      }, 1800)
    })
  })


  // ---------- slideshows (v2): <div class="slides" data-slides="ms"> — crossfade, auto-advance while on screen,
  // pause on hover / focus, swipe, arrows, dots, ← → keys
  $$('[data-slides]').forEach((box) => {
    const slides = $$('.slide', box)
    const dots = $$('.sdot', box)
    if (slides.length < 2) return
    let at = 0
    let timer = 0
    let visible = false
    let hold = false
    const every = Number(box.getAttribute('data-slides')) || 5200
    const show = (n) => {
      at = (n + slides.length) % slides.length
      slides.forEach((s, i) => s.classList.toggle('on', i === at))
      dots.forEach((x, i) => x.classList.toggle('on', i === at))
      const next = slides[(at + 1) % slides.length].querySelector('img')
      if (next && next.loading === 'lazy') next.loading = 'eager'
    }
    const stop = () => clearInterval(timer)
    const run = () => {
      stop()
      if (!reduce && visible && !hold && !d.hidden) timer = setInterval(() => show(at + 1), every)
    }
    box.querySelector('.sprev')?.addEventListener('click', () => (show(at - 1), run()))
    box.querySelector('.snext')?.addEventListener('click', () => (show(at + 1), run()))
    dots.forEach((x, i) => x.addEventListener('click', () => (show(i), run())))
    box.addEventListener('mouseenter', () => ((hold = true), stop()))
    box.addEventListener('mouseleave', () => ((hold = false), run()))
    box.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') (show(at - 1), run())
      if (e.key === 'ArrowRight') (show(at + 1), run())
    })
    let x0 = null
    const track = box.querySelector('.slides-track')
    track.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true })
    track.addEventListener('touchend', (e) => {
      if (x0 === null) return
      const dx = e.changedTouches[0].clientX - x0
      x0 = null
      if (Math.abs(dx) > 40) (show(at + (dx < 0 ? 1 : -1)), run())
    })
    if ('IntersectionObserver' in window)
      new IntersectionObserver((es) => es.forEach((en) => ((visible = en.isIntersecting), run())), { threshold: 0.35 }).observe(box)
    else (visible = true), run()
    d.addEventListener('visibilitychange', run)
  })

  // ---------- Download page: the platform picker (#mac / #windows … open that one; first visit: this device's)
  const pick = $$('.platform-pick [data-platform]')
  if (pick.length) {
    const ids = pick.map((b) => b.getAttribute('data-platform'))
    const select = (id, scroll) => {
      if (!ids.includes(id)) return false
      pick.forEach((b) => b.setAttribute('aria-selected', String(b.getAttribute('data-platform') === id)))
      ids.forEach((x) => {
        const p = d.getElementById(x)
        if (p) p.hidden = x !== id
      })
      const btn = pick[ids.indexOf(id)]
      btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' })
      if (scroll) d.querySelector('.platform-pick').scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
      return true
    }
    pick.forEach((b) =>
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-platform')
        select(id, false)
        history.replaceState(null, '', '#' + id)
      })
    )
    const guess = () => {
      const ua = navigator.userAgent
      if (/AFT|Fire TV|Silk/i.test(ua)) return 'fire-tv'
      if (/Android/i.test(ua) && /TV|BRAVIA|AFT|GoogleTV|SmartTV/i.test(ua)) return 'android-tv'
      if (/Android/i.test(ua)) return 'android'
      if (/Macintosh|Mac OS X/i.test(ua) && !/Mobile/i.test(ua)) return 'mac'
      if (/Windows/i.test(ua)) return 'windows'
      if (/Linux|X11|CrOS/i.test(ua)) return 'linux'
      return null
    }
    const fromHash = () => select(location.hash.slice(1), true)
    if (!fromHash()) select(guess() ?? ids[0], false)
    window.addEventListener('hashchange', fromHash)
  }

  // ---------- Manual: search, topic list, current topic
  const docsMain = d.querySelector('.docs-main')
  if (docsMain) {
    const topics = d.querySelector('.docs-topics')
    const narrow = window.matchMedia('(max-width: 960px)')
    if (topics && narrow.matches) topics.open = false
    const articles = $$('article.doc', docsMain)
    const links = new Map($$('.docs-side a[data-doc]').map((a) => [a.getAttribute('data-doc'), a]))
    links.forEach((a) =>
      a.addEventListener('click', () => {
        if (topics && narrow.matches) topics.open = false
      })
    )
    const fold = (s) =>
      s
        .toLowerCase()
        .replace(/[’‘`]/g, "'")
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
    const text = new Map(articles.map((a) => [a, fold(`${a.textContent} ${a.getAttribute('data-keywords') || ''}`)]))
    const q = d.getElementById('docs-q')
    const empty = d.getElementById('docs-empty')
    const filter = () => {
      const terms = fold(q.value).split(/\s+/).filter((t) => t.length > 1)
      let shown = 0
      articles.forEach((a) => {
        const hit = terms.every((t) => text.get(a).includes(t))
        a.hidden = !hit
        const link = links.get(a.id)
        if (link) link.parentElement.hidden = !hit
        if (hit) shown++
      })
      $$('[data-chapter]').forEach((el) => {
        const id = el.getAttribute('data-chapter')
        const section = docsMain.querySelector(`.doc-chapter[data-chapter="${id}"]`)
        el.hidden = section ? !$$('article.doc', section).some((a) => !a.hidden) : false
      })
      empty.style.display = shown ? 'none' : 'block'
      if (terms.length && topics) topics.open = true
    }
    if (q) q.addEventListener('input', filter)

    if ('IntersectionObserver' in window) {
      let current = null
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return
            const link = links.get(e.target.id)
            if (!link || link === current) return
            if (current) current.classList.remove('active')
            current = link
            link.classList.add('active')
            if (!narrow.matches) {
              const side = d.querySelector('.docs-side')
              const r = link.getBoundingClientRect()
              const s = side.getBoundingClientRect()
              if (r.top < s.top + 60 || r.bottom > s.bottom - 20) side.scrollTop += r.top - s.top - s.height / 3
            }
          })
        },
        { rootMargin: '-90px 0px -65% 0px' }
      )
      articles.forEach((a) => io.observe(a))
    }
  }
})()
