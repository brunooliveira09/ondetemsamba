import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { tipo, action, payload } = req.body
  if (!tipo || !payload) return res.status(400).json({ error: 'Dados inválidos' })

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const table = tipo === 'ev' ? 'eventos' : 'organizadores'
  const { id, ...data } = payload

  try {
    if (action === 'delete') {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ ok: true })
    }

    if (id) {
      // Update
      const { error } = await supabase.from(table).update(data).eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
    } else {
      // Insert
      const { error } = await supabase.from(table).insert([data])
      if (error) return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ ok: true })
  } catch(e) {
    return res.status(500).json({ error: e.message })
  }
}
