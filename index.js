const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = 'triana2026';
const WA_TOKEN = process.env.WA_TOKEN;
const PHONE_ID = process.env.PHONE_ID;
const CLAUDE_KEY = process.env.CLAUDE_KEY;

const SYSTEM_PROMPT = `Eres el asistente virtual de TRIANA TRUCK, especialistas en neumáticos de alto tonelaje marca Fullrun, ubicados en Ruta H-30, Rancagua. Tu objetivo es CERRAR VENTAS. Responde siempre en español, de forma directa y profesional. Máximo 3 párrafos cortos.

CATÁLOGO FULLRUN (precios con IVA incluido):
- 11R22.5 (16 telas) TB875/TB906: $203.025
- 11R22.5 (18 telas) TB656 tracción: $217.149
- 295/80R22.5 (18 telas) TB906 tracción: $209.743
- 295/80R22.5 (18 telas) TB875 lineal: $211.468
- 315/80R22.5 (20 telas) TB906 faena pesada: $229.924

FLETES PULLMAN CARGO (set 4 unidades, por unidad):
- Santiago/RM: $20.764 | Talca/Linares: $21.140
- Chillán/Concepción: $23.624 | Temuco: $25.062
- Copiapó/Valdivia: $27.676 | Antofagasta: $36.797
- Iquique/Arica: $43.681 | Punta Arenas: $49.325
- AHORRO comprando 12 unidades: hasta $2.180 menos por neumático

REGLAS:
1. Siempre preguntar medida y cantidad para cotizar
2. Siempre mencionar que precios incluyen IVA y emiten factura inmediata
3. Solo trabajamos aro 22.5 transporte pesado, no vehículos livianos
4. Urgencia de cierre: si compra hoy, despacho mañana a primera hora
5. NO inventar precios ni productos fuera del catálogo`;

// Verificación webhook
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

// Recibir mensajes
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg || msg.type !== 'text') return;
    const reply = await askClaude(msg.text.body);
    await sendWhatsApp(msg.from, reply);
  } catch (err) {
    console.error('Error:', err.message);
  }
});

async function askClaude(userMessage) {
  const res = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }]
    },
    {
      headers: {
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    }
  );
  return res.data.content[0].text;
}

async function sendWhatsApp(to, message) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`,
    { messaging_product: 'whatsapp', to, type: 'text', text: { body: message } },
    { headers: { Authorization: `Bearer ${WA_TOKEN}` } }
  );
}

app.listen(process.env.PORT || 3000, () => console.log('Bot Triana Truck activo ✅'));
