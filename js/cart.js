/* ═══════════════════════════════════════════════════════════════
   MAGNOLIA BEAUTY & FASHION — v3.0
   cart.js — Carrito de Compras (Tienda)
   ═══════════════════════════════════════════════════════════════

   SKILLS APLICADOS (design-weplash plugin):
   ─────────────────────────────────────────
   /design-system   → Componente carrito completo con estados:
                      vacío, con items, checkout, success.
   /ux-copy         → Todos los textos de acción son específicos
                      y orientados al usuario:
                      "🛍 Agregar al carrito" (no "Add")
                      "Confirmar pedido por WhatsApp" (no "Submit")
                      Mensaje de éxito con próximo paso claro.
                      Toast de confirmación al agregar item.
   /accessibility   → Sidebar con aria-label, botones con
                      aria-label descriptivos (qty +/-),
                      badge numérico con show/hide por JS,
                      Escape key para cerrar sidebar.
   /handoff         → Estados del carrito documentados:
                      vacío / con items / seleccionando pago /
                      subiendo comprobante / checkout / success.
   /design-critique → Toast fugaz para feedback inmediato.
                      Footer del cart siempre al fondo.
                      Comprobante solo visible si pago electrónico.

   FLUJO DE COMPRA:
   ─────────────────────────────────────────
   1. addToCart() → agrega item, abre sidebar, muestra toast
   2. updateQty() → ajusta cantidad, recalcula total
   3. removeFromCart() → elimina item, actualiza badge
   4. selectPay() → elige método, muestra/oculta comprobante
   5. previewComprobante() → confirma archivo seleccionado
   6. checkout() → arma mensaje, abre WhatsApp, muestra success
   7. clearCart() → resetea estado completo del carrito

   PERSISTENCIA: localStorage ('magnolia_cart')
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ── Estado del módulo ── */
let cart = [];              /* Array de items en el carrito */
let selectedPayMethod = ''; /* Método de pago seleccionado */
let comprobanteFile = null; /* Archivo de comprobante subido */

/* ══════════════════════════════════════════════════════════════
   PERSISTENCIA — localStorage
   Guardar y cargar el carrito entre sesiones.
   try/catch: localStorage puede fallar en modo privado.
   ══════════════════════════════════════════════════════════════ */

/** Carga el carrito desde localStorage */
function loadCart() {
  try {
    const stored = localStorage.getItem('magnolia_cart');
    if(stored) cart = JSON.parse(stored);
  } catch(e) {
    cart = []; /* Si falla, carrito vacío */
  }
}

/** Guarda el carrito en localStorage */
function saveCart() {
  try {
    localStorage.setItem('magnolia_cart', JSON.stringify(cart));
  } catch(e) {
    /* Silenciar — no es crítico */
  }
}

/* ══════════════════════════════════════════════════════════════
   ABRIR / CERRAR SIDEBAR
   /accessibility: Overlay captura clicks fuera del sidebar.
   Escape cierra — registrado en event listener global al fondo.
   /handoff: Clase .open controla visibilidad en CSS.
   ══════════════════════════════════════════════════════════════ */

/** Abre el sidebar del carrito */
window.openCart = function() {
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden'; /* Bloquear scroll del body */
};

/** Cierra el sidebar del carrito */
window.closeCart = function() {
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = ''; /* Restaurar scroll */
};

/* ══════════════════════════════════════════════════════════════
   AGREGAR AL CARRITO
   /ux-copy: Si el producto requiere consulta (consult:true),
   abre WhatsApp directamente en lugar de agregar al carrito.
   Si ya existe, incrementa qty en lugar de duplicar.
   Toast de confirmación: feedback inmediato, desaparece en 2s.
   ══════════════════════════════════════════════════════════════ */

/**
 * Agrega un producto al carrito.
 * @param {Object} product - { id, name, price, img, cat, consult? }
 */
window.addToCart = function(product) {
  loadCart();

  /* /ux-copy: Productos que requieren consulta → WhatsApp directo */
  if(product.consult) {
    const text = encodeURIComponent(
      `Hola! 🌸 Me interesa: ${product.name} — ¿Cuál es el precio actual?`
    );
    window.open(`https://wa.me/584125944627?text=${text}`, '_blank');
    return;
  }

  /* Si ya existe en el carrito, incrementar qty */
  const existing = cart.find(i => i.id === product.id);
  if(existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    /* Agregar nuevo item con qty inicial = 1 */
    cart.push({...product, qty: 1});
  }

  saveCart();
  renderCart();
  updateCartBadge();
  openCart(); /* Abrir sidebar automáticamente */

  /* /ux-copy: Toast de confirmación — feedback inmediato */
  showAddedFeedback(product.name);
};

/**
 * Muestra un toast fugaz confirmando el item agregado.
 * /ux-copy: Desaparece en 2s, no bloquea interacción.
 */
function showAddedFeedback(name) {
  const toast = document.createElement('div');
  toast.textContent = `✓ ${name} agregado`;
  toast.style.cssText = `
    position:fixed; bottom:100px; left:50%; transform:translateX(-50%);
    background:var(--gold); color:#060606; padding:10px 20px;
    font-size:13px; font-weight:600; z-index:9999;
    white-space:nowrap; pointer-events:none;
  `;
  document.body.appendChild(toast);
  /* Remover tras 2 segundos */
  setTimeout(() => toast.remove(), 2000);
}

/* ══════════════════════════════════════════════════════════════
   ELIMINAR DEL CARRITO
   /accessibility: El botón de eliminar tiene aria-label con
   el nombre del producto en el HTML generado.
   ══════════════════════════════════════════════════════════════ */

/**
 * Elimina un item del carrito por su ID.
 * @param {string} id - ID único del producto
 */
window.removeFromCart = function(id) {
  loadCart();
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
  updateCartBadge();
};

/* ══════════════════════════════════════════════════════════════
   ACTUALIZAR CANTIDAD
   /handoff: Mínimo qty = 1. Si llega a 0, se elimina el item.
   /accessibility: Botones +/- tienen aria-label en HTML generado.
   ══════════════════════════════════════════════════════════════ */

/**
 * Ajusta la cantidad de un item.
 * @param {string} id - ID del producto
 * @param {number} delta - +1 o -1
 */
window.updateQty = function(id, delta) {
  loadCart();
  const item = cart.find(i => i.id === id);
  if(!item) return;

  item.qty = Math.max(1, (item.qty || 1) + delta); /* Mínimo 1 */

  /* Si por algún motivo llega a 0, eliminar */
  if(item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  saveCart();
  renderCart();
  updateCartBadge();
};

/* ══════════════════════════════════════════════════════════════
   LIMPIAR CARRITO
   Usado después de checkout exitoso o para resetear.
   ══════════════════════════════════════════════════════════════ */

/** Vacía el carrito completamente y resetea la UI */
window.clearCart = function() {
  cart = [];
  localStorage.removeItem('magnolia_cart');
  saveCart();
  renderCart();
  updateCartBadge();

  /* Resetear estados de la UI del carrito */
  const success = document.getElementById('orderSuccess');
  const btn = document.getElementById('checkoutBtn');
  const payOpts = document.getElementById('payOptions');
  const payTitle = document.querySelector('.pay-select-title');

  if(success) success.classList.remove('show');
  if(btn) btn.style.display = '';
  if(payOpts) payOpts.style.display = '';
  if(payTitle) payTitle.style.display = '';

  selectedPayMethod = ''; /* Reset método de pago */
  comprobanteFile = null; /* Reset comprobante */
};

/* ══════════════════════════════════════════════════════════════
   RENDERIZAR CARRITO
   /design-system: Construye el HTML de los items dinámicamente.
   /handoff: Estados que renderiza:
   - Vacío: .cart-empty visible, .cart-footer oculto
   - Con items: .cart-empty oculto, items + total visible
   /ux-copy: Estado vacío con instrucción clara.
   ══════════════════════════════════════════════════════════════ */

/** Renderiza el contenido del carrito en el sidebar */
function renderCart() {
  loadCart();
  const container = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  const empty = document.getElementById('cartEmpty');
  const totalEl = document.getElementById('cartTotal');
  if(!container) return;

  /* Limpiar items existentes (mantener el estado vacío) */
  container.querySelectorAll('.cart-item').forEach(i => i.remove());

  /* ── Estado vacío ── */
  if(cart.length === 0) {
    if(empty) empty.style.display = 'block';
    if(footer) footer.style.display = 'none';
    return;
  }

  /* ── Estado con items ── */
  if(empty) empty.style.display = 'none';
  if(footer) footer.style.display = 'block';

  let total = 0;

  cart.forEach(item => {
    const qty = item.qty || 1;
    total += (item.price || 0) * qty;

    /* Construir HTML del item */
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <img src="${item.img}"
           alt="${item.name}"
           class="cart-item-img"
           loading="lazy"/>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">
          ${item.price > 0
            ? '$' + (item.price * qty).toFixed(2)
            : 'Consultar precio'}
        </div>
        <!-- Controles de cantidad -->
        <div class="cart-item-qty">
          <button class="qty-btn"
                  onclick="updateQty('${item.id}',-1)"
                  aria-label="Reducir cantidad de ${item.name}">−</button>
          <span class="qty-num" aria-label="Cantidad: ${qty}">${qty}</span>
          <button class="qty-btn"
                  onclick="updateQty('${item.id}',1)"
                  aria-label="Aumentar cantidad de ${item.name}">+</button>
        </div>
      </div>
      <button class="cart-item-remove"
              onclick="removeFromCart('${item.id}')"
              aria-label="Eliminar ${item.name} del carrito">✕</button>
    `;
    container.appendChild(el);
  });

  /* Actualizar total */
  if(totalEl) {
    totalEl.textContent = total > 0
      ? `$${total.toFixed(2)}`
      : 'Consultar precio'; /* Para items sin precio definido */
  }
}

/* ══════════════════════════════════════════════════════════════
   BADGE DEL BOTÓN FLOTANTE
   /accessibility: Badge con número visible.
   Se oculta (display:none) cuando carrito está vacío.
   /handoff: Clase .show controla visibilidad.
   ══════════════════════════════════════════════════════════════ */

/** Actualiza el badge numérico del botón flotante de carrito */
function updateCartBadge() {
  loadCart();
  const badge = document.getElementById('cartBadge');
  if(!badge) return;

  /* Total de items (sumando qtys) */
  const count = cart.reduce((sum, i) => sum + (i.qty || 1), 0);
  badge.textContent = count;
  /* /handoff: Mostrar solo si hay items */
  badge.classList.toggle('show', count > 0);
}

/* ══════════════════════════════════════════════════════════════
   SELECCIÓN DE MÉTODO DE PAGO
   /ux-copy: Opciones claras y visuales. Estado "selected" obvio.
   Al seleccionar pago electrónico, muestra upload de comprobante.
   /handoff: Estado selected → clase .selected en .pay-opt.
   ══════════════════════════════════════════════════════════════ */

/**
 * Registra el método de pago seleccionado.
 * @param {HTMLElement} el - El elemento .pay-opt clickeado
 * @param {string} method - Nombre del método de pago
 */
window.selectPay = function(el, method) {
  selectedPayMethod = method;

  /* Deseleccionar todos, seleccionar el clickeado */
  document.querySelectorAll('.pay-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');

  /* /ux-copy: Solo mostrar comprobante para pagos electrónicos */
  const comprobanteWrap = document.getElementById('comprobanteWrap');
  const electronic = ['Transferencia','Zelle','Pago Móvil'].includes(method);
  if(comprobanteWrap) {
    comprobanteWrap.classList.toggle('show', electronic);
  }
};

/* ══════════════════════════════════════════════════════════════
   PREVIEW DE COMPROBANTE
   /ux-copy: Confirmar el nombre del archivo seleccionado
   da feedback inmediato al usuario antes de enviar.
   ══════════════════════════════════════════════════════════════ */

/**
 * Muestra el nombre del archivo seleccionado como comprobante.
 * @param {HTMLInputElement} input - El input file
 */
window.previewComprobante = function(input) {
  const preview = document.getElementById('comprobantePreview');
  if(!input.files || !input.files[0]) return;

  comprobanteFile = input.files[0];
  if(preview) {
    preview.textContent = `📎 ${comprobanteFile.name}`;
    preview.style.display = 'block';
  }
};

/* ══════════════════════════════════════════════════════════════
   CHECKOUT → WHATSAPP
   /ux-copy: Arma un mensaje WhatsApp con todos los detalles
   del pedido: items, cantidades, total, método de pago,
   y mención del comprobante si fue subido.
   /handoff: Después del checkout:
   - Ocultar botón CTA y opciones de pago
   - Mostrar .order-success con mensaje amigable
   - Limpiar carrito tras 3 segundos (UX: no inmediato)
   ══════════════════════════════════════════════════════════════ */

/** Ejecuta el checkout: arma mensaje WhatsApp y muestra success */
window.checkout = function() {
  loadCart();
  if(cart.length === 0) return; /* Seguridad: no hacer nada si vacío */

  /* Armar lista de items para el mensaje */
  const items = cart.map(i =>
    `• ${i.name} (x${i.qty||1}) — ` +
    `${i.price > 0 ? '$'+((i.price*(i.qty||1)).toFixed(2)) : 'Consultar precio'}`
  ).join('\n');

  const total = cart.reduce((s, i) => s + (i.price||0)*(i.qty||1), 0);

  /* Líneas opcionales según contexto */
  const payText = selectedPayMethod
    ? `\n💳 Método de pago: ${selectedPayMethod}`
    : '';
  const comprobanteText = comprobanteFile
    ? `\n📎 Comprobante: ${comprobanteFile.name} (te lo envío por aquí)`
    : '';

  /* /ux-copy: Mensaje conversacional, no robótico */
  const message = encodeURIComponent(
    `Hola! 🌸 Tengo un pedido de la tienda Magnolia:\n\n` +
    `${items}\n\n` +
    `💰 Total: ${total > 0 ? '$'+total.toFixed(2) : 'Consultar'}` +
    payText +
    comprobanteText +
    `\n\n¿Confirman disponibilidad?`
  );

  /* Abrir WhatsApp con el mensaje prellenado */
  window.open(`https://wa.me/584125944627?text=${message}`, '_blank');

  /* /handoff: Transición al estado success */
  const success = document.getElementById('orderSuccess');
  const btn = document.getElementById('checkoutBtn');
  const payOpts = document.getElementById('payOptions');
  const compr = document.getElementById('comprobanteWrap');
  const payTitle = document.querySelector('.pay-select-title');

  if(success) success.classList.add('show');
  if(btn) btn.style.display = 'none';       /* Ocultar CTA */
  if(payOpts) payOpts.style.display = 'none';
  if(compr) compr.classList.remove('show');
  if(payTitle) payTitle.style.display = 'none';

  /* Limpiar carrito tras 3 segundos (no inmediato para mejor UX) */
  setTimeout(() => clearCart(), 3000);
};

/* ══════════════════════════════════════════════════════════════
   FILTRO DE PRODUCTOS
   /ux-copy: "Todos" muestra todo. Filtros por subcategoría.
   /handoff: display:none/block para mostrar/ocultar. Estado
   active en botón de filtro indica cuál está activo.
   ══════════════════════════════════════════════════════════════ */

/**
 * Filtra los productos de una sección por categoría.
 * @param {string} section - ID de la sección ('lenceria', 'deportiva')
 * @param {string} cat - Categoría a filtrar ('all' o nombre específico)
 * @param {HTMLElement} btn - El botón de filtro clickeado
 */
window.filterProducts = function(section, cat, btn) {
  const grid = document.getElementById(section + 'Grid');
  if(!grid) return;

  /* Actualizar botones de filtro */
  const filterBar = document.getElementById(section + 'Filters');
  if(filterBar) {
    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  /* Mostrar/ocultar cards según categoría */
  grid.querySelectorAll('.product-card').forEach(card => {
    if(cat === 'all' || card.dataset.cat === cat) {
      card.style.display = 'block'; /* Mostrar */
    } else {
      card.style.display = 'none'; /* Ocultar */
    }
  });
};

/* ══════════════════════════════════════════════════════════════
   INICIALIZACIÓN
   Al cargar la página: restaurar carrito de localStorage
   y actualizar el badge del botón flotante.
   ══════════════════════════════════════════════════════════════ */
loadCart();
renderCart();
updateCartBadge();

/* /accessibility WCAG 2.1.2: Cerrar sidebar con Escape */
document.addEventListener('keydown', e => {
  if(e.key === 'Escape') closeCart();
});

})(); /* IIFE: scope privado para evitar colisiones globales */
