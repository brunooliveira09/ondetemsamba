import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { nome, whatsapp, cidade } = req.body

  // Validação básica no servidor
  if (!nome || !whatsapp || !cidade) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' })
  }

  // Credenciais ficam APENAS no servidor — nunca chegam ao browser
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const { error } = await supabase
    .from('lista_espera')
    .insert([{ nome, whatsapp, cidade }])

  if (error) {
    console.error('Supabase error:', error)
    return res.status(500).json({ error: 'Erro ao salvar. Tente novamente.' })
  }

  return res.status(200).json({ ok: true })
}
