import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!

Deno.serve(async (req) => {
  // Manejar CORS preflight
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
    const { monto, descripcion, metadata } = await req.json()

    // Crear PaymentIntent en Stripe
    // monto en centimos: S/20.00 = 2000 centimos
    const body = new URLSearchParams({
      amount: String(monto || 2000),
      currency: "pen",
      description: descripcion || "Reserva de cita dental - DentaNovax",
      "automatic_payment_methods[enabled]": "true",
      ...(metadata?.paciente_id && { "metadata[paciente_id]": metadata.paciente_id }),
      ...(metadata?.odontologo_id && { "metadata[odontologo_id]": metadata.odontologo_id }),
      ...(metadata?.fecha && { "metadata[fecha]": metadata.fecha }),
      ...(metadata?.hora && { "metadata[hora]": metadata.hora }),
    })

    const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    })

    const paymentIntent = await stripeRes.json()

    if (!stripeRes.ok) {
      throw new Error(paymentIntent.error?.message || "Error al crear PaymentIntent")
    }

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
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