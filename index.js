const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = 'triana2026';
const WA_TOKEN = process.env.WA_TOKEN;
const PHONE_ID = process.env.PHONE_ID;
const CLAUDE_KEY = process.env.CLAUDE_KEY;

const SYSTEM_PROMPT = `Eres el asistente de TRIANA TRUCK, especialistas en neumaticos Fullrun en Rancagua. Responde en español, maximo 3 parrafos. PRECIOS IVA incluido: 11R22.5 TB875/TB906 $203.025, 11R22.5 TB656 $217.149, 295/80R22.5 TB906 $209.743, 295/80R22.5 TB875 $211.468, 315/80R22.5 TB906 $229.924. FLETES por unidad: Santiago $20.764, Chillan $23.624, Temuco $25.062, Antofagasta $36.797, Iquique $43.681. Siempre preguntar medida y cantidad. Precios incluyen IVA con factura. Solo aro 22.5 transporte pesado.`;

app.get('/', (req, res) => res.send('Bot Triana Truck OK'));

app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

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
      model: 'claude-3-haiku-20240307',
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

app.listen(process.env.PORT || 8080, () => console.log('Bot Triana Truck activo'));
