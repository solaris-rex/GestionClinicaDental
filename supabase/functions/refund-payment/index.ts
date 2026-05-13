import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!

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
    const { payment_intent_id, fecha_pago } = await req.json()

    if (!payment_intent_id) {
      throw new Error("payment_intent_id es requerido")
    }

    // Verificar si está dentro de las 24 horas
    const ahora = new Date()
    const fechaPagoDate = new Date(fecha_pago)
    const diferenciaMs = ahora.getTime() - fechaPagoDate.getTime()
    const diferenciaHoras = diferenciaMs / (1000 * 60 * 60)

    if (diferenciaHoras > 24) {
      return new Response(
        JSON.stringify({
          reembolsado: false,
          fuera_de_plazo: true,
          mensaje: "Han pasado más de 24 horas desde el pago. No aplica reembolso.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }

    // Ejecutar reembolso en Stripe
    const body = new URLSearchParams({
      payment_intent: payment_intent_id,
    })

    const stripeRes = await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    })

    const refund = await stripeRes.json()

    if (!stripeRes.ok) {
      throw new Error(refund.error?.message || "Error al procesar reembolso")
    }

    return new Response(
      JSON.stringify({
        reembolsado: true,
        fuera_de_plazo: false,
        refund_id: refund.id,
        mensaje: "Reembolso procesado correctamente.",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }
})