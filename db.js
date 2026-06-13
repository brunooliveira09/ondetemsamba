// ============================================
// ONDE TEM SAMBA — Camada de Dados
// ============================================
// Busca eventos do Supabase.
// Se as credenciais não estiverem configuradas,
// usa automaticamente os dados locais de exemplo.

const OTS_DB = (() => {

  // ── Dados locais (fallback) ──
  const today = new Date();
  const add = n => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };

  const SEED = [
    { id:1, nome:"Pagode no Coreto",
      local:"Praça Coronel Almeida", bairro:"Centro",
      lat:-23.2155, lng:-47.5270,
      data:add(0), hora:"19h", recorrencia:"Toda sexta",
      tipo_ingresso:"gratuito", preco:null, estilos:["pagode"],
      foto_url:"https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=620&q=80",
      organizador_nome:"Praça Coronel Almeida" },

    { id:2, nome:"Roda de samba do Léo",
      local:"Bar do Léo", bairro:"Centro",
      lat:-23.2142, lng:-47.5258,
      data:add(1), hora:"21h", recorrencia:"Todo sábado",
      tipo_ingresso:"pago", preco:15, estilos:["raiz","pagode"],
      foto_url:"https://images.unsplash.com/photo-1501386761578-eaa54b492c24?w=620&q=80",
      organizador_nome:"Bar do Léo" },

    { id:3, nome:"Samba às margens do Tietê",
      local:"Orla do Rio Tietê", bairro:"Beira Rio",
      lat:-23.2098, lng:-47.5312,
      data:add(2), hora:"17h", recorrencia:"Todo domingo",
      tipo_ingresso:"gratuito", preco:null, estilos:["raiz"],
      foto_url:"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=620&q=80",
      organizador_nome:"Orla do Rio Tietê" },

    { id:4, nome:"Partido alto na Vila",
      local:"Associação Recreativa", bairro:"Vila Maria",
      lat:-23.2178, lng:-47.5220,
      data:add(3), hora:"20h", recorrencia:"Quinzenal",
      tipo_ingresso:"pago", preco:10, estilos:["partido alto"],
      foto_url:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=620&q=80",
      organizador_nome:"Associação Recreativa" },

    { id:5, nome:"Pagode Monções",
      local:"Espaço das Monções", bairro:"Jd. Monções",
      lat:-23.2205, lng:-47.5185,
      data:add(5), hora:"20h30", recorrencia:"Semanal",
      tipo_ingresso:"pago", preco:20, estilos:["pagode"],
      foto_url:"https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=620&q=80",
      organizador_nome:"Espaço das Monções" },

    { id:6, nome:"Noite do cavaquinho",
      local:"Boteco do Tião", bairro:"Jd. Martelli",
      lat:-23.2130, lng:-47.5295,
      data:add(0), hora:"20h", recorrencia:"Toda quinta",
      tipo_ingresso:"gratuito", preco:null, estilos:["raiz"],
      foto_url:"https://images.unsplash.com/photo-1501386761578-eaa54b492c24?w=620&q=80",
      organizador_nome:"Boteco do Tião" },

    { id:7, nome:"Samba de raiz no Bambuzal",
      local:"Chácara Bambuzal", bairro:"Bambu",
      lat:-23.2240, lng:-47.5148,
      data:add(1), hora:"18h", recorrencia:"Único",
      tipo_ingresso:"pago", preco:25, estilos:["raiz"],
      foto_url:"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=620&q=80",
      organizador_nome:"Chácara Bambuzal" },
  ];

  // ── Checa se Supabase está configurado ──
  function isConfigured() {
    return OTS_CONFIG.supabase.url     !== 'https://SEU_PROJECT_ID.supabase.co'
        && OTS_CONFIG.supabase.anonKey !== 'SUA_ANON_KEY_AQUI';
  }

  // ── Busca do Supabase ──
  async function fetchSupabase(filters) {
    const client = window.supabase.createClient(
      OTS_CONFIG.supabase.url,
      OTS_CONFIG.supabase.anonKey
    );

    const todayStr = new Date().toISOString().split('T')[0];

    let q = client
      .from('v_eventos_mapa')
      .select('*')
      .gte('data_inicio', todayStr)
      .order('data_inicio', { ascending: true });

    if (filters.tipo === 'hoje') {
      q = q.eq('data_inicio', todayStr);
    } else if (filters.tipo === 'fds') {
      const d   = new Date();
      const sat = new Date(d); sat.setDate(d.getDate() + (6 - d.getDay()));
      const sun = new Date(d); sun.setDate(d.getDate() + (7 - d.getDay()));
      q = q.in('data_inicio', [
        sat.toISOString().split('T')[0],
        sun.toISOString().split('T')[0],
      ]);
    }

    if (filters.search) {
      q = q.or(
        `nome.ilike.%${filters.search}%,` +
        `organizador_nome.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await q;
    if (error) throw error;

    return (data || []).map(e => ({
      id:             e.id,
      nome:           e.nome,
      local:          e.organizador_nome,
      bairro:         e.cidade || '',
      lat:            e.lat,
      lng:            e.lng,
      data:           e.data_inicio,
      hora:           (e.hora_inicio || '').slice(0,5).replace(':', 'h'),
      recorrencia:    e.recorrencia || '',
      tipo_ingresso:  e.tipo_ingresso,
      preco:          e.preco,
      estilos:        e.estilos || [],
      foto_url:       e.foto_url || null,
      organizador_nome: e.organizador_nome,
    }));
  }

  // ── Filtro local ──
  function filterLocal(list, filters) {
    const today = new Date();
    return list.filter(ev => {
      const d   = new Date(ev.data + 'T12:00:00');
      const diff = Math.round((d - today) / 86400000);
      const dow  = d.getDay();
      if (filters.tipo === 'hoje' && diff !== 0)               return false;
      if (filters.tipo === 'fds'  && !(dow === 0 || dow === 6)) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const h = [ev.nome, ev.bairro, ev.local].join(' ').toLowerCase();
        if (!h.includes(q)) return false;
      }
      return true;
    });
  }

  // ── API pública ──
  async function getEventos(filters = {}) {
    if (!isConfigured()) {
      return filterLocal(SEED, filters);
    }
    try {
      return await fetchSupabase(filters);
    } catch (err) {
      console.warn('[OTS] Supabase erro, usando dados locais:', err.message);
      return filterLocal(SEED, filters);
    }
  }

  function formatIngresso(ev) {
    if (ev.tipo_ingresso === 'gratuito') return 'Gratuito';
    if (ev.tipo_ingresso === 'chapeu')   return 'Chapéu';
    return ev.preco ? `R$ ${Number(ev.preco).toFixed(0)}` : 'A confirmar';
  }

  function dayType(ds) {
    const d    = new Date(ds + 'T12:00:00');
    const diff = Math.round((d - new Date()) / 86400000);
    const dow  = d.getDay();
    if (diff === 0)             return 'hoje';
    if (dow === 0 || dow === 6) return 'fds';
    return 'sem';
  }

  function dayLabel(ds) {
    if (dayType(ds) === 'hoje') return 'HOJE';
    const d = new Date(ds + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', {
      weekday:'short', day:'numeric', month:'short'
    }).toUpperCase();
  }

  return { getEventos, formatIngresso, dayType, dayLabel, isConfigured };
})();
