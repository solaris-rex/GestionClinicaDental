import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const SUPABASE_URL = "https://jyvwqtvsiqktbmplkojh.supabase.co"
const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}"
const secretKeys = JSON.parse(secretKeysRaw)
const SERVICE_ROLE_KEY = secretKeys.default ?? ""

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    })
  }

  try {
    const { email, password, nombre, apellido, telefono, rol } = await req.json()

    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "apikey": SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ email, password, email_confirm: true }),
    })

    const userData = await res.json()
    if (!res.ok) throw new Error(userData.message || userData.error || "Error al crear usuario")

    const userId = userData.id

    const perfilRes = await fetch(`${SUPABASE_URL}/rest/v1/perfiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "apikey": SERVICE_ROLE_KEY,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ id: userId, nombre, apellido, telefono, rol }),
    })

    if (!perfilRes.ok) {
      const perfilErr = await perfilRes.text()
      throw new Error("Error en perfil: " + perfilErr)
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    )
  }
})