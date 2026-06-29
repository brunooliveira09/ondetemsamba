import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' })

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  try {
    const [
      { data: ev,   error: e1 },
      { data: org,  error: e2 },
      { data: dash, error: e3 },
      { data: v7,   error: e4 },
    ] = await Promise.all([
      supabase.from('eventos').select('*,organizadores(nome)').order('data_inicio'),
      supabase.from('organizadores').select('*').order('nome'),
      supabase.from('v_dashboard').select('*').single(),
      supabase.from('v_views_por_dia').select('*'),
    ])

    if (e1 || e2) {
      console.error('Erros:', e1?.message, e2?.message)
      return res.status(500).json({ error: 'Erro ao carregar dados' })
    }

    return res.status(200).json({ ev: ev||[], org: org||[], dash: dash||null, v7: v7||[] })

  } catch(e) {
    console.error(e)
    return res.status(500).json({ error: e.message })
  }
}
