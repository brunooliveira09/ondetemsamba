import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' })

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Variáveis de ambiente não configuradas' })
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

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

  if (e1) return res.status(500).json({ error: e1.message })

  return res.status(200).json({ ev: ev||[], org: org||[], dash: dash||null, v7: v7||[] })
}
