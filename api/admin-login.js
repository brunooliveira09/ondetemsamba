import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { email, senha } = req.body
  if (!email || !senha) return res.status(400).json({ error: 'Campos obrigatórios ausentes' })

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )

  const { data: session, error } = await supabase.auth.signInWithPassword({ email, password: senha })

  if (error) return res.status(401).json({ error: 'Credenciais incorretas' })

  return res.status(200).json({ ok: true, email: session.user.email })
}
