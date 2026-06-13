/* ============================================
   ONDE TEM SAMBA — Lógica Principal
   ============================================ */

const OTS_APP = (() => {

  let map, layer;
  let curFilter = 'todos';
  let curSearch  = '';
  let allEvents  = [];

  // Pandeiro SVG inline — tamanho fixo, sem overflow
  const PANDEIRO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none">
    <!-- aro -->
    <circle cx="12" cy="12" r="10" stroke="#0D0A07" stroke-width="2.5" fill="none"/>
    <!-- membrana interna -->
    <circle cx="12" cy="12" r="6" stroke="#0D0A07" stroke-width="1.5" fill="rgba(13,10,7,.3)" stroke-dasharray="2 2"/>
    <!-- platinelas -->
    <rect x="1.5" y="11" width="2.5" height="3.5" rx=".8" fill="#0D0A07" transform="rotate(-40 12 12) translate(-10.5 0)"/>
    <rect x="1.5" y="11" width="2.5" height="3.5" rx=".8" fill="#0D0A07" transform="rotate(80 12 12) translate(-10.5 0)"/>
    <rect x="1.5" y="11" width="2.5" height="3.5" rx=".8" fill="#0D0A07" transform="rotate(200 12 12) translate(-10.5 0)"/>
    <!-- centro -->
    <circle cx="12" cy="12" r="2" fill="#0D0A07"/>
  </svg>`;

  // ── Ícone Leaflet ──
  function makeIcon(faded) {
    const op = faded ? 0.13 : 1;
    const html = `<div class="ots-pin" style="opacity:${op}">
      <div class="ots-pin-head">
        <span class="ots-pin-icon">${PANDEIRO}</span>
      </div>
    </div>`;
    return L.divIcon({
      html,
      className: '',
      iconSize:   [36, 42],
      iconAnchor: [18, 40],
      popupAnchor:[0, -42],
    });
  }

  // ── Inicializa mapa ──
  function initMap() {
    map = L.map('map', {
      center:          OTS_CONFIG.map.defaultCenter,
      zoom:            OTS_CONFIG.map.defaultZoom,
      zoomControl:     false,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:     19,
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      crossOrigin: true,
    }).addTo(map);

    // Zoom no canto inferior direito
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    layer = L.layerGroup().addTo(map);
  }

  // ── Filtra ──
  function filterEvents(events) {
    return events.filter(ev => {
      const t = OTS_DB.dayType(ev.data);
      if (curFilter === 'hoje' && t !== 'hoje') return false;
      if (curFilter === 'fds'  && t !== 'fds')  return false;
      if (curSearch) {
        const q = curSearch.toLowerCase();
        const hay = [ev.nome, ev.bairro, ev.local, ev.organizador_nome || ''].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  // ── Renderiza pins ──
  function renderPins(visible) {
    const ids = new Set(visible.map(e => e.id));
    layer.clearLayers();
    allEvents.forEach(ev => {
      const faded = !ids.has(ev.id);
      const m = L.marker([ev.lat, ev.lng], {
        icon: makeIcon(faded),
        zIndexOffset: faded ? 0 : 100,
      });
      if (!faded) {
        m.on('click', () => {
          map.panTo([ev.lat, ev.lng], { animate: true, duration: 0.4 });
          openDetail(ev);
        });
      }
      m.addTo(layer);
    });
  }

  // ── Abre detail ──
  function openDetail(ev) {
    const ingresso = OTS_DB.formatIngresso(ev);

    // Imagem
    document.getElementById('detail-img-slot').innerHTML = ev.foto_url
      ? `<img id="detail-img" src="${ev.foto_url}" alt="${ev.nome}"
           onerror="this.outerHTML='<div id=detail-img-placeholder>🥁</div>'"/>`
      : `<div id="detail-img-placeholder">🥁</div>`;

    // Tags
    document.getElementById('detail-tags').innerHTML =
      (ev.estilos || []).map(s => `<span class="dtag">${s}</span>`).join('');

    // Header
    document.getElementById('detail-name').textContent  = ev.nome;
    document.getElementById('detail-badge').textContent = OTS_DB.dayLabel(ev.data);

    // Meta
    document.getElementById('detail-meta').innerHTML = `
      <div class="dm">
        <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>${ev.local}</span>
      </div>
      <div class="dm">
        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span>${ev.bairro}</span>
      </div>
      <div class="dm">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>${ev.hora} · ${ev.recorrencia || ''}</span>
      </div>
      <div class="dm">
        <svg viewBox="0 0 24 24"><path d="M2 9a3 3 0 010 6v2a2 2 0 002 2h16a2 2 0 002-2v-2a3 3 0 010-6V7a2 2 0 00-2-2H4a2 2 0 00-2 2v2z"/></svg>
        <span>${ingresso}</span>
      </div>`;

    document.getElementById('detail-btn').onclick = () => {
      alert(`Interesse registrado em:\n${ev.nome}`);
    };

    document.getElementById('detail').classList.add('open');
    document.getElementById('overlay').classList.add('on');
  }

  // ── Fecha detail ──
  function closeDetail() {
    document.getElementById('detail').classList.remove('open');
    document.getElementById('overlay').classList.remove('on');
  }

  // ── Sincroniza filtros desktop + mobile ──
  function syncFilters(f) {
    document.querySelectorAll('.fb').forEach(b => {
      b.classList.toggle('on', b.dataset.filter === f);
    });
  }

  // ── Carrega e renderiza ──
  async function loadEvents() {
    allEvents = await OTS_DB.getEventos({ tipo: curFilter, search: curSearch });
    renderPins(filterEvents(allEvents));
  }

  // ── Init ──
  async function init() {
    initMap();

    document.getElementById('overlay').addEventListener('click', closeDetail);
    document.getElementById('detail-close').addEventListener('click', closeDetail);

    document.getElementById('searchbox').addEventListener('input', e => {
      curSearch = e.target.value.trim();
      renderPins(filterEvents(allEvents));
    });

    document.querySelectorAll('.fb').forEach(btn => {
      btn.addEventListener('click', () => {
        curFilter = btn.dataset.filter;
        syncFilters(curFilter);
        closeDetail();
        renderPins(filterEvents(allEvents));
      });
    });

    await loadEvents();
  }

  return { init, closeDetail };
})();

document.addEventListener('DOMContentLoaded', () => OTS_APP.init());
