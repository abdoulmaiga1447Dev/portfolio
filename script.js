// Menu mobile
const burger = document.querySelector('.burger');
const menu = document.getElementById('menu');

function setMenu(open) {
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  burger.querySelector('.burger__label').textContent = open ? 'Fermer' : 'Menu';
  menu.classList.toggle('is-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

burger.addEventListener('click', () => {
  setMenu(burger.getAttribute('aria-expanded') !== 'true');
});

menu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenu(false));
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setMenu(false);
});

window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => {
  if (e.matches) setMenu(false);
});

// Année du footer
document.getElementById('year').textContent = new Date().getFullYear();

// Barre de progression de lecture
const progress = document.querySelector('.progress');
let ticking = false;

const toTop = document.querySelector('.to-top');

function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.setProperty('--p', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
  toTop.classList.toggle('is-visible', window.scrollY > 600);
  ticking = false;
}

// Retour en haut : logo, lien du pied de page et bouton flottant
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('a[href="#top"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  });
});

window.addEventListener('scroll', () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(updateProgress);
  }
}, { passive: true });
updateProgress();

// Capsule qui glisse sous le lien actif (barre de navigation sur ordinateur)
const navGroup = menu.querySelector('.nav__group');
const navPill = navGroup && navGroup.querySelector('.nav__pill');
const activeNavLink = () => navGroup && navGroup.querySelector('a.is-active');

function movePill(link) {
  if (!navPill) return;
  if (!link) {
    navPill.style.width = '0px';
    return;
  }
  navPill.style.left = `${link.offsetLeft}px`;
  navPill.style.width = `${link.offsetWidth}px`;
}

if (navGroup) {
  navGroup.querySelectorAll('a').forEach((link) => {
    link.addEventListener('mouseenter', () => movePill(link));
  });
  navGroup.addEventListener('mouseleave', () => movePill(activeNavLink()));
  window.addEventListener('resize', () => movePill(activeNavLink()));
}

// Section active dans le menu
const navLinks = new Map(
  [...menu.querySelectorAll('a[href^="#"]')].map((a) => [a.getAttribute('href').slice(1), a])
);

if ('IntersectionObserver' in window) {
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.remove('is-active'));
      navLinks.get(entry.target.id).classList.add('is-active');
      movePill(activeNavLink());
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  navLinks.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) spy.observe(section);
  });
}

// ---------- Animations d'apparition ----------
// La classe "js" est posée dans le <head>, sauf si le visiteur a réduit les animations.
const animated = document.documentElement.classList.contains('js');

if (animated) {
  // Titres : chaque mot dans un masque, pour le faire monter
  document.querySelectorAll('[data-split]').forEach((el) => {
    const text = el.textContent.replace(/[ \n\t]+/g, ' ').trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    const words = text.split(' ');
    words.forEach((word, i) => {
      const mask = document.createElement('span');
      mask.className = 'w';
      mask.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.textContent = word;
      inner.style.setProperty('--i', i);
      mask.appendChild(inner);

      if (i === words.length - 1 && el.hasAttribute('data-last-line')) {
        // Le dernier mot seul sur sa ligne : la place à droite est pour le dragon
        const line = document.createElement('span');
        line.className = 'last-line';
        line.append(mask);
        el.append(line);
      } else {
        el.append(mask, ' ');
      }
    });
  });

  // Éléments révélés au défilement, en cascade entre voisins
  const groups = [
    '.profil2__art',
    '.profil2 .section-kicker',
    '.profil2 .section-title',
    '.profil2__content > p',
    '.figures > div',
    '.exp__head > *',
    '.sec__head > *',
    '.skill-group',
    '.edu2__label',
    '.mini-tl li',
    '.tl-item',
    '.project',
    '.contact .kicker',
    '.contact__text',
    '.contact__actions',
    '.contact__cards > li',
  ];

  groups.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      const siblings = [...el.parentElement.children].filter((c) => c.matches(selector));
      el.style.setProperty('--d', `${Math.min(siblings.indexOf(el), 6) * 90}ms`);
      el.setAttribute('data-reveal', '');
    });
  });

  // Compteurs : "4", "2", "~50"
  function countUp(el) {
    const match = el.textContent.trim().match(/^(\D*)(\d+)(.*)$/);
    if (!match) return;
    const [, prefix, digits, suffix] = match;
    const target = Number(digits);
    const start = performance.now();
    const duration = 1300;

    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // Détection par position : un élément masqué par clip-path n'est pas vu
  // par IntersectionObserver dans Chromium.
  let pending = [...document.querySelectorAll('[data-reveal], [data-split]')];
  let checking = false;

  function show(el) {
    el.classList.add('is-in');

    const counter = el.matches('.figures > div') && el.querySelector('dt');
    if (counter) countUp(counter);

    // Une fois l'apparition terminée, on rend la main aux effets de survol
    if (el.hasAttribute('data-reveal')) {
      const delay = parseFloat(el.style.getPropertyValue('--d')) || 0;
      setTimeout(() => el.removeAttribute('data-reveal'), delay + 1400);
    }
  }

  function checkReveals() {
    checking = false;
    const limit = window.innerHeight * 0.92;
    pending = pending.filter((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top > limit) return true;
      show(el);
      return false;
    });
    if (!pending.length) {
      window.removeEventListener('scroll', requestCheck);
      window.removeEventListener('resize', requestCheck);
    }
  }

  function requestCheck() {
    if (!checking) {
      checking = true;
      requestAnimationFrame(checkReveals);
    }
  }

  window.addEventListener('scroll', requestCheck, { passive: true });
  window.addEventListener('resize', requestCheck);
  checkReveals();

  // Machine à écrire sur la ligne d'accroche
  const typed = document.querySelector('.kicker--type');
  if (typed) {
    const text = typed.textContent.trim();
    const label = document.createElement('span');
    label.className = 'sr-only';
    label.textContent = text;

    const line = document.createElement('span');
    line.setAttribute('aria-hidden', 'true');
    const chars = [...text].map((ch) => {
      const span = document.createElement('span');
      span.className = 'ch';
      span.textContent = ch;
      line.appendChild(span);
      return span;
    });
    const caret = document.createElement('span');
    caret.className = 'caret';
    line.insertBefore(caret, chars[0]);

    typed.textContent = '';
    typed.append(label, line);

    let i = 0;
    const timer = setInterval(() => {
      chars[i].classList.add('on');
      i += 1;
      if (i < chars.length) {
        line.insertBefore(caret, chars[i]);
      } else {
        line.appendChild(caret);
        clearInterval(timer);
      }
    }, 34);
  }
}

// Dragon du titre : la tête se place juste après le dernier caractère du titre,
// où que tombe le retour à la ligne.
const headline = document.querySelector('.headline');
const wyrm = headline && headline.querySelector('.wyrm');

function placeWyrm() {
  const walker = document.createTreeWalker(headline.querySelector('.intro__title'), NodeFilter.SHOW_TEXT);
  let lastText = null;
  while (walker.nextNode()) {
    if (walker.currentNode.textContent.trim()) lastText = walker.currentNode;
  }
  if (!lastText) return;

  const end = lastText.textContent.trimEnd().length;
  const range = document.createRange();
  range.setStart(lastText, end - 1);
  range.setEnd(lastText, end);
  const last = range.getBoundingClientRect();
  const box = headline.getBoundingClientRect();
  wyrm.style.setProperty('--wyrm-x', `${Math.round(last.right - box.left)}px`);
}

if (wyrm) {
  placeWyrm();
  window.addEventListener('resize', placeWyrm);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeWyrm);
}

// ---------- Comparateur de portraits ----------
// La barre se déplace à la souris, au doigt ou au clavier. À l'arrivée sur la
// page, elle fait quelques allers-retours pour montrer qu'on peut la bouger.
const compare = document.querySelector('.compare');

if (compare) {
  const knob = compare.querySelector('.compare__knob');
  let touched = false;
  let hintFrame = 0;
  let pending = null;

  function setPos(value) {
    const pos = Math.min(100, Math.max(0, value));
    compare.style.setProperty('--pos', `${pos}%`);
    knob.setAttribute('aria-valuenow', Math.round(pos));
  }

  function posFromEvent(e) {
    const rect = compare.getBoundingClientRect();
    return ((e.clientX - rect.left) / rect.width) * 100;
  }

  function stopHint() {
    touched = true;
    cancelAnimationFrame(hintFrame);
  }

  compare.addEventListener('pointerdown', (e) => {
    stopHint();
    compare.setPointerCapture(e.pointerId);
    compare.classList.add('is-dragging');
    // Au doigt, on attend le premier mouvement : un simple appui pour faire
    // défiler la page ne doit pas déplacer la barre.
    if (e.pointerType === 'mouse') setPos(posFromEvent(e));
  });

  compare.addEventListener('pointermove', (e) => {
    if (compare.classList.contains('is-dragging')) setPos(posFromEvent(e));
  });

  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => {
    compare.addEventListener(type, () => compare.classList.remove('is-dragging'));
  });

  knob.addEventListener('keydown', (e) => {
    const now = Number(knob.getAttribute('aria-valuenow'));
    const moves = { ArrowLeft: now - 5, ArrowDown: now - 5, ArrowRight: now + 5, ArrowUp: now + 5, Home: 0, End: 100 };
    if (!(e.key in moves)) return;
    e.preventDefault();
    stopHint();
    setPos(moves[e.key]);
  });

  // Indice d'utilisation : 50 % → 28 % → 72 % → 40 % → 50 %
  function hint() {
    if (touched) return;
    const steps = [50, 28, 72, 40, 50];
    const duration = 700;
    const start = performance.now();
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    function frame(now) {
      if (touched) return;
      const t = (now - start) / duration;
      const i = Math.floor(t);
      if (i >= steps.length - 1) {
        setPos(50);
        return;
      }
      setPos(steps[i] + (steps[i + 1] - steps[i]) * ease(t - i));
      hintFrame = requestAnimationFrame(frame);
    }
    hintFrame = requestAnimationFrame(frame);
  }

  // L'indice part quand la photo est visible (après son apparition)
  function watchForHint() {
    const rect = compare.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0) {
      window.removeEventListener('scroll', watchForHint);
      clearTimeout(pending);
      pending = setTimeout(hint, 1600);
    }
  }

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('scroll', watchForHint, { passive: true });
    watchForHint();
  }
}

// Reflet de la croix du logo (animation SVG) : coupé si le visiteur a réduit les animations
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.cross__shine').forEach((a) => a.remove());
}

// ---------- Effondrement du titre ----------
// Le titre reste affiché 5 s, puis ses lettres tremblent, tombent sous l'effet de
// la gravité, rebondissent et s'empilent au sol. Le message et le bouclier enchaîné
// prennent la place du titre, puis les lettres remontent à leur place, et on recommence.
const heroBand = document.querySelector('.hero-band');
const heroTitle = document.querySelector('.intro__title');
const breach = document.querySelector('.breach');
const fallStage = document.querySelector('.fall-stage');

if (heroBand && heroTitle && breach && fallStage
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const rand = (a, b) => a + Math.random() * (b - a);
  const measure = document.createElement('canvas').getContext('2d');

  // Position de chaque lettre du titre, relative au bandeau, avec la boîte réelle du dessin
  // de la lettre (sans les marges de la police) pour qu'elle touche vraiment le sol.
  function letterBoxes() {
    const origin = heroBand.getBoundingClientRect();
    const style = getComputedStyle(heroTitle);
    measure.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const boxes = [];
    const walker = document.createTreeWalker(heroTitle, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      for (let i = 0; i < node.length; i++) {
        const ch = node.data[i];
        if (!ch.trim()) continue;
        const range = document.createRange();
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const r = range.getBoundingClientRect();
        if (!r.width) continue;
        const m = measure.measureText(ch);
        const ascent = m.fontBoundingBoxAscent ?? r.height * 0.8;
        const gx0 = -(m.actualBoundingBoxLeft || 0);
        const gx1 = m.actualBoundingBoxRight || r.width;
        const gy0 = ascent - (m.actualBoundingBoxAscent || ascent);
        const gy1 = ascent + (m.actualBoundingBoxDescent || 0);
        boxes.push({
          ch,
          x: r.left - origin.left,
          y: r.top - origin.top,
          w: r.width,
          h: r.height,
          gcx: (gx0 + gx1) / 2,          // centre du dessin dans la boîte
          gcy: (gy0 + gy1) / 2,
          gw: Math.max(gx1 - gx0, 4),    // taille du dessin
          gh: Math.max(gy1 - gy0, 4),
        });
      }
    }
    return { boxes, style };
  }

  // Sol et murs : sous le texte (une colonne) ou en bas du bandeau (deux colonnes)
  function bounds() {
    const band = heroBand.getBoundingClientRect();
    const text = document.querySelector('.intro__text').getBoundingClientRect();
    const photo = document.querySelector('.intro__photo').getBoundingClientRect();
    const twoColumns = getComputedStyle(document.querySelector('.intro')).gridTemplateColumns.split(' ').length > 1;
    return {
      left: 6,
      right: twoColumns ? photo.left - band.left - 10 : band.width - 6,
      ground: twoColumns ? band.height - 14 : text.bottom - band.top + 20,
    };
  }

  function collapse() {
    return new Promise((resolve) => {
      const { boxes, style } = letterBoxes();
      const { left, right, ground } = bounds();
      const cell = 5;
      const pileHeights = new Map();
      const stackAt = (x0, x1) => {
        let top = 0;
        for (let c = Math.floor(x0 / cell); c <= Math.floor(x1 / cell); c++) top = Math.max(top, pileHeights.get(c) || 0);
        return top;
      };
      const addToPile = (x0, x1, height) => {
        for (let c = Math.floor(x0 / cell); c <= Math.floor(x1 / cell); c++) {
          pileHeights.set(c, Math.max(pileHeights.get(c) || 0, height));
        }
      };

      const letters = boxes.map((b) => {
        const el = document.createElement('span');
        el.className = 'fall-letter';
        el.textContent = b.ch;
        Object.assign(el.style, {
          width: `${b.w}px`,
          height: `${b.h}px`,
          lineHeight: `${b.h}px`,
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
          fontSize: style.fontSize,
          color: style.color,
          transformOrigin: `${b.gcx}px ${b.gcy}px`,
          transform: `translate(${b.x}px, ${b.y}px)`,
        });
        fallStage.appendChild(el);
        return {
          ...b,
          el,
          cx: b.x + b.gcx,
          cy: b.y + b.gcy,
          vx: rand(-150, 150),
          vy: rand(-240, -40),
          rot: 0,
          vr: rand(-280, 280),
          delay: 380 + rand(0, 520),   // 380 ms de tremblement, puis départs échelonnés
          done: false,
        };
      });
      heroTitle.classList.add('is-collapsed');

      const gravity = 2600;
      const start = performance.now();
      let last = start;

      function frame(now) {
        const dt = Math.min((now - last) / 1000, 1 / 30);
        last = now;
        const t = now - start;
        let moving = 0;

        for (const L of letters) {
          if (L.done) continue;
          moving++;

          if (t < L.delay) {
            // tremblement avant la chute (plus fort juste avant de lâcher)
            const k = t < 380 ? t / 380 : 1;
            const jx = rand(-1.6, 1.6) * k;
            const jy = rand(-1.2, 1.2) * k;
            L.el.style.transform = `translate(${L.cx - L.gcx + jx}px, ${L.cy - L.gcy + jy}px) rotate(${rand(-2, 2) * k}deg)`;
            continue;
          }

          L.vy += gravity * dt;
          L.cx += L.vx * dt;
          L.cy += L.vy * dt;
          L.rot += L.vr * dt;

          const a = (L.rot * Math.PI) / 180;
          const hw = (Math.abs(Math.cos(a)) * L.gw + Math.abs(Math.sin(a)) * L.gh) / 2;
          const hh = (Math.abs(Math.sin(a)) * L.gw + Math.abs(Math.cos(a)) * L.gh) / 2;

          if (L.cx - hw < left) { L.cx = left + hw; L.vx = Math.abs(L.vx) * 0.4; }
          if (L.cx + hw > right) { L.cx = right - hw; L.vx = -Math.abs(L.vx) * 0.4; }

          const floor = ground - stackAt(L.cx - hw, L.cx + hw);
          if (L.cy + hh >= floor) {
            L.cy = floor - hh;
            if (L.vy > 280) {
              // rebond : il perd de l'énergie à chaque choc
              L.vy = -L.vy * 0.32;
              L.vx = L.vx * 0.7 + rand(-40, 40);
              L.vr = L.vr * 0.45 + rand(-90, 90);
            } else {
              // posée en haut d'un tas : elle glisse du côté le plus bas, comme dans la réalité
              const under = stackAt(L.cx - 3, L.cx + 3);
              const leftSide = stackAt(L.cx - hw - 14, L.cx - hw);
              const rightSide = stackAt(L.cx + hw, L.cx + hw + 14);
              const drop = under - Math.min(leftSide, rightSide);
              if (under > 0 && drop > L.gh * 0.45) {
                const dir = leftSide < rightSide ? -1 : 1;
                L.vy = 0;
                L.vx += dir * 1400 * dt;
                L.vr += dir * 220 * dt;
                L.rot += L.vr * dt;
                L.el.style.transform = `translate(${L.cx - L.gcx}px, ${L.cy - L.gcy}px) rotate(${L.rot}deg)`;
                continue;
              }
              // au sol : frottement, et la lettre bascule sur son côté le plus stable
              L.vy = 0;
              L.vx *= 0.8;
              L.vr = 0;
              const rest = Math.round(L.rot / 90) * 90;
              L.rot += (rest - L.rot) * 0.24;
              if (Math.abs(L.vx) < 4 && Math.abs(rest - L.rot) < 0.8) {
                // la lettre reste là où elle s'est posée ; les suivantes s'empileront dessus
                L.rot = rest;
                const lying = Math.abs(rest / 90) % 2 === 1;
                const w2 = (lying ? L.gh : L.gw) / 2;
                const h2 = (lying ? L.gw : L.gh) / 2;
                addToPile(L.cx - w2 + 2, L.cx + w2 - 2, ground - (L.cy - h2));
                L.done = true;
              }
            }
          }
          L.el.style.transform = `translate(${L.cx - L.gcx}px, ${L.cy - L.gcy}px) rotate(${L.rot}deg)`;
        }

        // la simulation continue jusqu'à l'arrêt complet (5 s au plus)…
        if (moving && t < 5000) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      // …mais le message n'attend pas les dernières lettres qui roulent encore
      setTimeout(() => resolve(letters), 2700);
    });
  }

  // Pendant le message, le dragon se retire derrière la photo
  async function showMessage() {
    const headline = heroTitle.closest('.headline');
    headline.classList.add('is-breached');
    breach.classList.remove('is-leaving');
    breach.classList.add('is-on');
    await wait(5600);
    breach.classList.add('is-leaving');
    await wait(480);
    breach.classList.remove('is-on', 'is-leaving');
    headline.classList.remove('is-breached');
  }

  // Les lettres se relèvent et reviennent à leur place exacte dans le titre
  async function rebuild(letters) {
    const { boxes } = letterBoxes();
    const flights = letters.map((L, i) => {
      const target = boxes[i] || L;
      return L.el.animate(
        [
          { transform: L.el.style.transform },
          { transform: `translate(${target.x}px, ${target.y}px) rotate(0deg)` },
        ],
        { duration: 950, delay: i * 16, easing: 'cubic-bezier(.55, -0.25, .25, 1)', fill: 'forwards' },
      ).finished;
    });
    await Promise.all(flights);
    heroTitle.classList.remove('is-collapsed');
    fallStage.textContent = '';
  }

  // On ne lance une chute que si le haut de page est à l'écran et l'onglet actif
  function heroInView() {
    const r = heroBand.getBoundingClientRect();
    return !document.hidden && r.bottom > 120 && r.top < window.innerHeight * 0.5;
  }

  (async function loop() {
    await wait(1800);               // fin des animations d'arrivée du titre
    for (;;) {
      await wait(5000);             // le titre reste lisible 5 secondes
      while (!heroInView()) await wait(700);
      const letters = await collapse();
      await showMessage();
      await rebuild(letters);
    }
  })();
}

// ---------- Électrocution du bouclier et des chaînes ----------
// Des arcs électriques crépitent le long des chaînes et autour du bouclier.
// Au repos : quelques étincelles. Pendant les secousses : surtension (plus d'arcs,
// plus grands, plus rapides, et le métal s'illumine par éclairs).
const shieldSvg = document.querySelector('.breach__shield');

if (shieldSvg && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const breachBox = shieldSvg.closest('.breach');
  const shieldBody = shieldSvg.querySelector('.shield__body');
  const chainVolts = shieldSvg.querySelectorAll('.shield__volts--chains path');
  const shieldVolts = shieldSvg.querySelectorAll('.shield__volts--shield path');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  // chaînes : du point d'attache vers l'ancrage, très haut
  const chains = [[22, 26, -70, -460], [138, 26, 230, -460]];
  // contour du bouclier
  const rim = [[80, 6], [114, 16], [148, 26], [148, 60], [148, 92], [140, 128], [118, 160], [98, 180],
    [80, 192], [62, 180], [42, 160], [20, 128], [12, 92], [12, 60], [12, 26], [46, 16]];
  const center = [80, 100];

  // éclair en zigzag entre deux points
  function bolt(x0, y0, x1, y1, amp, steps) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    let d = `M${x0.toFixed(1)} ${y0.toFixed(1)}`;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const off = rnd(-amp, amp) * Math.sin(Math.PI * t);   // l'arc s'écarte surtout au milieu
      d += ` L${(x0 + dx * t + nx * off).toFixed(1)} ${(y0 + dy * t + ny * off).toFixed(1)}`;
    }
    return `${d} L${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }

  function draw(power) {
    // arcs le long des chaînes
    let onChains = '';
    for (const [ax, ay, bx, by] of chains) {
      const count = power > 0.6 ? 2 + (Math.random() < 0.5 ? 1 : 0) : (Math.random() < 0.55 ? 1 : 0);
      for (let k = 0; k < count; k++) {
        const t0 = rnd(0, 0.3);
        const t1 = Math.min(t0 + rnd(0.1, 0.24) * (0.6 + power), 0.75);
        onChains += bolt(ax + (bx - ax) * t0, ay + (by - ay) * t0, ax + (bx - ax) * t1, ay + (by - ay) * t1,
          4 + 9 * power, 7 + Math.round(9 * power));
      }
    }

    // arcs qui sautent d'un point à l'autre du bouclier, et étincelles vers l'extérieur
    let onShield = '';
    const arcs = power > 0.6 ? 3 + Math.floor(Math.random() * 3) : (Math.random() < 0.6 ? 1 : 0);
    for (let k = 0; k < arcs; k++) {
      const i = Math.floor(Math.random() * rim.length);
      const j = (i + 2 + Math.floor(Math.random() * 4)) % rim.length;
      onShield += bolt(rim[i][0], rim[i][1], rim[j][0], rim[j][1], 6 + 12 * power, 6);
    }
    const sparks = power > 0.6 ? 5 + Math.floor(Math.random() * 5) : (Math.random() < 0.7 ? 1 : 0);
    for (let k = 0; k < sparks; k++) {
      const [px, py] = pick(rim);
      const vx = px - center[0];
      const vy = py - center[1];
      const n = Math.hypot(vx, vy) || 1;
      const len = rnd(8, 22) * (0.6 + power);
      onShield += bolt(px, py, px + (vx / n) * len, py + (vy / n) * len, 4, 3);
    }

    chainVolts.forEach((p) => p.setAttribute('d', onChains));
    shieldVolts.forEach((p) => p.setAttribute('d', onShield));
    shieldSvg.classList.toggle('is-surge', power > 0.6 && Math.random() < 0.55);
  }

  function clear() {
    chainVolts.forEach((p) => p.removeAttribute('d'));
    shieldVolts.forEach((p) => p.removeAttribute('d'));
    shieldSvg.classList.remove('is-surge');
  }

  // Les secousses du bouclier (animation CSS « shield-shake ») : 1 s de délai,
  // puis un cycle de 1,3 s dont les 46 premiers % tremblent.
  function shaking() {
    const shake = shieldBody.getAnimations().find((a) => a.animationName === 'shield-shake');
    if (!shake || shake.currentTime == null || shake.currentTime < 1000) return false;
    return ((shake.currentTime - 1000) % 1300) / 1300 < 0.46;
  }

  let power = 0;
  let lastDraw = 0;
  (function tick(now) {
    const active = breachBox.classList.contains('is-on') && !breachBox.classList.contains('is-leaving');
    if (active) {
      const target = shaking() ? 1 : 0.3;
      power += (target - power) * 0.25;                  // montée et descente rapides mais pas instantanées
      if (now - lastDraw > (power > 0.6 ? 45 : 95)) {    // crépite plus vite en surtension
        draw(power);
        lastDraw = now;
      }
    } else if (power || lastDraw) {
      power = 0;
      lastDraw = 0;
      clear();
    }
    requestAnimationFrame(tick);
  })(performance.now());
}
