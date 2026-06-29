import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' })

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const hoje = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('v_eventos_mapa')
    .select('*')
    .gte('data_inicio', hoje)
    .order('data_inicio')

  if (error) {
    console.error('Supabase error:', error)
    return res.status(500).json({ error: error.message, data: [] })
  }

  return res.status(200).json({ data, error: null })
}
