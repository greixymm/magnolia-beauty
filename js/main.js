/* ═══════════════════════════════════════════════════════════════
   MAGNOLIA BEAUTY & FASHION — v3.0
   main.js — JavaScript Global
   ═══════════════════════════════════════════════════════════════

   SKILLS APLICADOS (design-weplash plugin):
   ─────────────────────────────────────────
   /accessibility   → Cursor solo en pointer, prefers-reduced-motion,
                      aria-expanded en hamburger, focus trap mobile nav,
                      scroll reveal con IntersectionObserver,
                      FAQ accordion aria-expanded, Escape key close.
   /ux-copy         → Formulario con validación contextual y mensajes
                      descriptivos; CTA → WhatsApp con mensaje prellenado.
   /handoff         → Todos los estados de interacción documentados.
   /design-system   → Carousel y promo con misma lógica de índice.

   MÓDULOS EN ESTE ARCHIVO:
   ─────────────────────────────────────────
   1.  Custom cursor (pointer devices only)
   2.  Nav scroll (clase .scrolled)
   3.  Mobile nav (aria-expanded + focus management)
   4.  Scroll reveal (IntersectionObserver)
   5.  FAQ accordion (aria-expanded + max-height)
   6.  Packages carousel (carTo, carPrev, carNext)
   7.  Promo carousel (promoTo, promoPrev, promoNext)
   8.  Sticky service tabs (highlight activo)
   9.  Video section (playVideo)
   10. Contact form (validación + WhatsApp redirect)
   11. Smooth scroll (hash links)
   12. Hero parallax (pointer + not reduced motion)
   13. Gallery keyboard nav
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ══════════════════════════════════════════════════════════════
   1. CUSTOM CURSOR
   /accessibility: Activado SOLO en dispositivos pointer (mouse).
   En touch o teclado el cursor es el nativo del OS.
   prefers-reduced-motion: Si el usuario prefiere menos movimiento,
   el ring deja de seguir suavemente (se desactiva el rAF).
   ══════════════════════════════════════════════════════════════ */
const cur = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
const isPointer = window.matchMedia('(pointer:fine)').matches;
const prefersReduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

if(cur && ring && isPointer) {
  let mx=0, my=0, rx=0, ry=0;
  document.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; });

  if(!prefersReduced) {
    /* rAF loop para seguimiento suave del ring (lerp 12%) */
    (function anim(){
      cur.style.left = mx+'px'; cur.style.top = my+'px';
      rx += (mx-rx)*.12; /* Lerp: 12% de la distancia por frame */
      ry += (my-ry)*.12;
      ring.style.left = rx+'px'; ring.style.top = ry+'px';
      requestAnimationFrame(anim);
    })();
  }

  /* /handoff: cursor se agranda sobre elementos interactivos */
  document.querySelectorAll(
    'a,button,.srv-card,.tienda-cat,.gal-item,.pkg-card,.product-card,.blog-card,.price-card'
  ).forEach(el => {
    el.addEventListener('mouseenter', () => {
      cur.style.transform = 'translate(-50%,-50%) scale(2.5)';
      ring.style.transform = 'translate(-50%,-50%) scale(1.5)';
    });
    el.addEventListener('mouseleave', () => {
      cur.style.transform = 'translate(-50%,-50%) scale(1)';
      ring.style.transform = 'translate(-50%,-50%) scale(1)';
    });
  });
} else if(cur) {
  /* Touch/teclado: ocultar cursor custom, usar el nativo */
  cur.style.display = 'none';
  if(ring) ring.style.display = 'none';
}

/* ══════════════════════════════════════════════════════════════
   2. NAV SCROLL
   /handoff: Clase .scrolled activa glassmorphism cuando
   scrollY > 60px. passive:true para mejor performance.
   ══════════════════════════════════════════════════════════════ */
const nav = document.getElementById('mainNav');
const onScroll = () => {
  if(nav) nav.classList.toggle('scrolled', window.scrollY > 60);
};
window.addEventListener('scroll', onScroll, {passive:true});
onScroll(); /* Ejecutar al cargar (puede ya estar scrolleado) */

/* ══════════════════════════════════════════════════════════════
   3. MOBILE NAV
   /accessibility:
   - aria-expanded cambia en cada toggle (WCAG 4.1.2)
   - Al abrir: focus pasa al primer link del nav (WCAG 2.4.3)
   - Escape cierra (WCAG 2.1.2)
   - Al cerrar: focus regresa al botón hamburger
   ══════════════════════════════════════════════════════════════ */
const ham = document.getElementById('hamburger');
const mNav = document.getElementById('mobileNav');
const mClose = document.getElementById('mobileClose');

/* Función global para que onclick="closeMob()" en links funcione */
window.closeMob = function() {
  if(mNav) mNav.classList.remove('open');
  if(ham) ham.setAttribute('aria-expanded','false');
  document.body.style.overflow = '';
  if(ham) ham.focus(); /* /accessibility: devolver focus al trigger */
};

if(ham) {
  ham.addEventListener('click', () => {
    const isOpen = mNav.classList.toggle('open');
    ham.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : ''; /* Bloquear scroll body */

    if(isOpen) {
      /* /accessibility: mover focus al primer link del nav */
      const firstLink = mNav.querySelector('a');
      if(firstLink) firstLink.focus();
    }
  });
}
if(mClose) mClose.addEventListener('click', window.closeMob);

/* /accessibility WCAG 2.1.2: Cerrar con Escape */
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && mNav && mNav.classList.contains('open')) {
    window.closeMob();
  }
});

/* ══════════════════════════════════════════════════════════════
   4. SCROLL REVEAL
   /accessibility: Si prefers-reduced-motion está activo,
   todos los elementos se muestran inmediatamente sin animación.
   El JS no los observa — evita el flash de contenido oculto.
   IntersectionObserver: threshold 7%, rootMargin -40px bottom
   para que active justo antes de que el elemento entre al viewport.
   ══════════════════════════════════════════════════════════════ */
if(!prefersReduced) {
  /* Modo normal: observar y animar al entrar en viewport */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target); /* Desobservar: animación solo una vez */
      }
    });
  }, {threshold:.07, rootMargin:'0px 0px -40px 0px'});

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
} else {
  /* /accessibility: Mostrar todo inmediatamente sin animación */
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
}

/* ══════════════════════════════════════════════════════════════
   5. FAQ ACCORDION
   /accessibility WCAG 2.1.1:
   - Cada pregunta es un <button> real (teclado-navegable)
   - aria-expanded="false/true" refleja estado actual
   - aria-controls apunta al panel de respuesta
   - max-height trick para animación suave sin JS
   /handoff: Solo 1 item abierto a la vez (accordion exclusivo).
   ══════════════════════════════════════════════════════════════ */
document.querySelectorAll('.faq-item').forEach(item => {
  const btn = item.querySelector('.faq-q');
  const ans = item.querySelector('.faq-a');
  if(!btn || !ans) return;

  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');

    /* Cerrar todos los items abiertos */
    document.querySelectorAll('.faq-item.open').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-q').setAttribute('aria-expanded','false');
      i.querySelector('.faq-a').style.maxHeight = '';
    });

    /* Abrir el clickeado (si estaba cerrado) */
    if(!isOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded','true');
      /* scrollHeight: altura real del contenido (calculada dinámicamente) */
      ans.style.maxHeight = ans.scrollHeight + 'px';
    }
  });
});

/* ══════════════════════════════════════════════════════════════
   6. PACKAGES CAROUSEL
   /accessibility: Botones prev/next tienen aria-label en HTML.
   Dots tienen role=tab aria-selected en HTML.
   prefers-reduced-motion: auto-avance desactivado.
   /handoff: Calcula cardW dinámicamente según contenedor.
   Responsive: 3 vis en >1100, 2 en >700, 1 en mobile.
   ══════════════════════════════════════════════════════════════ */
let carIdx = 0; /* Índice actual del carousel */
const carTrack = document.getElementById('carTrack');

/* Cantidad de cards visibles según viewport */
function getCarVis() {
  return window.innerWidth > 1100 ? 3 : window.innerWidth > 700 ? 2 : 1;
}

function updateCar() {
  if(!carTrack) return;
  const cards = carTrack.querySelectorAll('.pkg-card');
  const vis = getCarVis();
  const max = Math.max(0, cards.length - vis);
  carIdx = Math.min(carIdx, max); /* No pasar del máximo */

  /* Calcular offset basado en ancho real del contenedor */
  const containerW = carTrack.parentElement.offsetWidth;
  const gap = 20;
  const cardW = (containerW - (vis-1)*gap) / vis;
  carTrack.style.transform = `translateX(-${carIdx*(cardW+gap)}px)`;

  /* Actualizar dots: active + aria-selected */
  document.querySelectorAll('.car-dot').forEach((d,i) => {
    d.classList.toggle('active', i===carIdx);
    d.setAttribute('aria-selected', String(i===carIdx));
  });
}

window.carPrev = () => { carIdx = Math.max(0, carIdx-1); updateCar(); };
window.carNext = () => {
  if(!carTrack) return;
  const max = Math.max(0, carTrack.querySelectorAll('.pkg-card').length - getCarVis());
  carIdx = Math.min(carIdx+1, max);
  updateCar();
};
window.carTo = i => { carIdx = i; updateCar(); };

/* Recalcular en resize (cambia vis) */
window.addEventListener('resize', updateCar);
updateCar(); /* Inicializar */

/* Auto-avance cada 5.5s — solo si no prefiere reducción de movimiento */
if(!prefersReduced && carTrack) {
  setInterval(() => {
    const max = Math.max(0, carTrack.querySelectorAll('.pkg-card').length - getCarVis());
    carIdx = carIdx >= max ? 0 : carIdx + 1; /* Loop al principio */
    updateCar();
  }, 5500);
}

/* ══════════════════════════════════════════════════════════════
   7. PROMO CAROUSEL
   /handoff: Índice global promoIdx, actualizado por click o
   auto-avance. transform: translateX(-idx*100%) mueve el track.
   ══════════════════════════════════════════════════════════════ */
let promoIdx = 0;
const promoTrack = document.getElementById('promoTrack');
const promoDots = document.querySelectorAll('.promo-dot');

function updatePromo() {
  if(!promoTrack) return;
  promoTrack.style.transform = `translateX(-${promoIdx*100}%)`;
  promoDots.forEach((d,i) => {
    d.classList.toggle('active', i===promoIdx);
  });
}

window.promoPrev = () => {
  if(!promoTrack) return;
  const total = promoTrack.querySelectorAll('.promo-slide').length;
  promoIdx = (promoIdx - 1 + total) % total; /* Loop hacia atrás */
  updatePromo();
};
window.promoNext = () => {
  if(!promoTrack) return;
  const total = promoTrack.querySelectorAll('.promo-slide').length;
  promoIdx = (promoIdx + 1) % total; /* Loop hacia adelante */
  updatePromo();
};
window.promoTo = i => { promoIdx = i; updatePromo(); };

/* Auto-avance cada 4.5s */
if(!prefersReduced && promoTrack) {
  setInterval(() => {
    const total = promoTrack.querySelectorAll('.promo-slide').length;
    promoIdx = (promoIdx + 1) % total;
    updatePromo();
  }, 4500);
}

/* ══════════════════════════════════════════════════════════════
   8. STICKY SERVICE TABS — Highlight activo
   /accessibility: Tabs con href a IDs — scroll nativo del browser.
   JS solo resalta cuál tab corresponde a la sección visible.
   ══════════════════════════════════════════════════════════════ */
const srvTabs = document.querySelectorAll('.srv-tab[href]');
if(srvTabs.length) {
  const activateTab = () => {
    const scrollPos = window.scrollY + 150; /* Offset para anticipar */
    srvTabs.forEach(tab => {
      const target = document.querySelector(tab.getAttribute('href'));
      if(target) {
        const top = target.offsetTop;
        const bottom = top + target.offsetHeight;
        /* Activo si el scroll está dentro de la sección */
        tab.classList.toggle('active', scrollPos >= top && scrollPos < bottom);
      }
    });
  };
  window.addEventListener('scroll', activateTab, {passive:true});
}

/* ══════════════════════════════════════════════════════════════
   9. VIDEO SECTION — Play cover
   /handoff: Al click en cover, cargar iframe de YouTube con
   autoplay=1. Cover se oculta. El src del iframe viene del
   HTML — no hardcodeado en JS.
   NOTA: Reemplaza YOUTUBE_VIDEO_ID en el src del iframe.
   ══════════════════════════════════════════════════════════════ */
window.playVideo = function() {
  const cover = document.getElementById('videoCover');
  const iframe = document.getElementById('videoIframe');
  if(!cover || !iframe) return;

  /* Ejemplo para activar video de YouTube:
     1. Pon el ID del video en el atributo data-src del iframe en HTML
     2. Descomenta las siguientes líneas:

  const videoId = iframe.dataset.src || 'TU_VIDEO_ID_AQUI';
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  iframe.style.display = 'block';
  cover.classList.add('hidden');
  */

  /* Por ahora: redirigir a Instagram */
  window.open('https://www.instagram.com/_spamagnolia/', '_blank');
};

/* ══════════════════════════════════════════════════════════════
   10. CONTACT FORM → WHATSAPP
   /ux-copy: Validación contextual con mensajes específicos.
   Mensaje prellenado en WhatsApp con todos los datos del form.
   /accessibility: En error, focus pasa al primer campo inválido.
   /handoff: Estados del form: default → error → success.
   ══════════════════════════════════════════════════════════════ */
const form = document.getElementById('contactForm');
if(form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true; /* Flag de validación global */

    /* Validación campo: nombre */
    const nombre = form.nombre ? form.nombre.value.trim() : '';
    const errN = document.getElementById('errFname');
    if(!nombre) {
      if(form.nombre) form.nombre.classList.add('error');
      if(errN) errN.classList.add('show'); /* Mostrar mensaje de error */
      valid = false;
    } else {
      if(form.nombre) form.nombre.classList.remove('error');
      if(errN) errN.classList.remove('show');
    }

    /* Validación campo: teléfono (mínimo 7 chars) */
    const tel = form.telefono ? form.telefono.value.trim() : '';
    const errT = document.getElementById('errFphone');
    if(!tel || tel.length < 7) {
      if(form.telefono) form.telefono.classList.add('error');
      if(errT) errT.classList.add('show');
      valid = false;
    } else {
      if(form.telefono) form.telefono.classList.remove('error');
      if(errT) errT.classList.remove('show');
    }

    /* Validación campo: servicio seleccionado */
    const serv = form.servicio ? form.servicio.value : '';
    const errS = document.getElementById('errFservice');
    if(!serv) {
      if(form.servicio) form.servicio.classList.add('error');
      if(errS) errS.classList.add('show');
      valid = false;
    } else {
      if(form.servicio) form.servicio.classList.remove('error');
      if(errS) errS.classList.remove('show');
    }

    if(!valid) {
      /* /accessibility: Mover focus al primer campo con error */
      const firstErr = form.querySelector('.error');
      if(firstErr) firstErr.focus();
      return;
    }

    /* Armar mensaje de WhatsApp con toda la info del form */
    const msg = form.mensaje ? form.mensaje.value.trim() : '';
    const text = encodeURIComponent(
      `Hola! 🌸 Soy ${nombre}, quiero reservar una cita.\n\n` +
      `Servicio: ${serv}\n` +
      `Mi WhatsApp: ${tel}` +
      (msg ? `\n\nMensaje: ${msg}` : '') +
      `\n\n_(Desde magnoliabeauty.com)_`
    );
    window.open(`https://wa.me/584125944627?text=${text}`, '_blank');

    /* /ux-copy: Estado success — ocultar form, mostrar confirmación */
    form.style.display = 'none';
    const ok = document.getElementById('formSuccess');
    if(ok) ok.style.display = 'block';
  });

  /* Limpiar error al escribir — feedback inmediato */
  form.querySelectorAll('.f-input,.f-select,.f-textarea').forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('error');
    });
  });
}

/* ══════════════════════════════════════════════════════════════
   11. SMOOTH SCROLL
   Hash links internos con scroll suave.
   (html{scroll-behavior:smooth} como fallback CSS).
   ══════════════════════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if(target) {
      e.preventDefault();
      target.scrollIntoView({behavior:'smooth', block:'start'});
    }
  });
});

/* ══════════════════════════════════════════════════════════════
   12. HERO PARALLAX
   Solo en: pointer devices + sin prefers-reduced-motion.
   Factor 0.25 = sutil — no genera mareo.
   passive:true = sin bloquear el scroll del browser.
   ══════════════════════════════════════════════════════════════ */
const heroBg = document.getElementById('heroBg');
if(heroBg && isPointer && !prefersReduced) {
  window.addEventListener('scroll', () => {
    /* Solo cuando el hero es visible (no hacer trabajo innecesario) */
    if(window.scrollY < window.innerHeight) {
      heroBg.style.transform = `translateY(${window.scrollY*.25}px)`;
    }
  }, {passive:true});
}

/* ══════════════════════════════════════════════════════════════
   13. GALLERY — Keyboard navigation
   /accessibility WCAG 2.1.1: Los items de galería tienen
   tabindex=0 en HTML. Aquí manejamos Enter/Space para "click".
   ══════════════════════════════════════════════════════════════ */
document.querySelectorAll('.gal-item[tabindex]').forEach(item => {
  item.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      item.click(); /* Disparar el click del item */
    }
  });
});

})(); /* IIFE: evita contaminar el scope global */
