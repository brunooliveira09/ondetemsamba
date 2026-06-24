import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // chave service_role, nunca a anon
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { nome, whatsapp, cidade } = req.body

  const { error } = await supabase
    .from('leads')
    .insert([{ nome, whatsapp, cidade }])

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ ok: true })
}
