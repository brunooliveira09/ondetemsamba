import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { email, senha } = req.body
  if (!email || !senha) return res.status(400).json({ error: 'Campos obrigatórios ausentes' })

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  // Autenticar via Supabase Auth (service role pode usar Admin API)
  const { data, error } = await supabase.auth.admin.listUsers()

  // Fallback: usar signInWithPassword com a anon key (mais seguro que expor no front)
  const supabaseAnon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )

  const { data: session, error: authError } = await supabaseAnon.auth.signInWithPassword({
    email,
    password: senha
  })

  if (authError) {
    return res.status(401).json({ error: 'Credenciais incorretas' })
  }

  return res.status(200).json({
    ok: true,
    email: session.user.email,
    access_token: session.session.access_token
  })
}
