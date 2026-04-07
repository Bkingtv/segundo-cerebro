require('dotenv').config();
const express = require('express');
const { Client } = require('@notionhq/client');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const PORT = process.env.PORT || 3000;

const SEGUNDO_CEREBRO_PAGE = '33a6d89a-a55f-803a-9aa0-c119ac95a169';
const TAREA_DATABASE = '33a6d89a-a55f-8121-a3ae-fcfb55dc8fa3';
const TAREA_DATA_SOURCE = '33a6d89a-a55f-813f-b699-000bd8519e92';

const notion = new Client({ auth: NOTION_API_KEY });
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

async function send(chatId, text) {
  try {
    await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
  } catch (e) {
    console.log('Error:', e.message);
  }
}

function analizar(mensaje) {
  const m = mensaje.toLowerCase();
  let cat = 'Personal';
  let pri = 'Media';
  
  if (m.includes('universidad') || m.includes('tarea') || m.includes('cátedra') || m.includes('investigación') || m.includes('examen')) cat = 'Universidad';
  else if (m.includes('trabajo') || m.includes('reunión') || m.includes('proyecto')) cat = 'Trabajo';
  else if (m.includes('comprar') || m.includes('leche') || m.includes('mercado') || m.includes('casa')) cat = 'Hogar';
  else if (m.includes('moto') || m.includes('carro') || m.includes('mantenimiento')) cat = 'Vehiculo';
  else if (m.includes('mascota') || m.includes('perro') || m.includes('gato')) cat = 'Mascota';
  else if (m.includes('dinero') || m.includes('gasto') || m.includes('finanza')) cat = 'Finanzas';
  
  if (m.includes('urgente') || m.includes('importante') || m.includes('ahora')) pri = 'Alta';
  
  return { titulo: mensaje.substring(0, 50), categoria: cat, prioridad: pri };
}

async function guardar(tarea) {
  try {
    const res = await notion.pages.create({
      parent: { data_source_id: TAREA_DATA_SOURCE },
      properties: {
        Name: { title: [{ text: { content: tarea.titulo } }] },
        Estado: { select: { name: 'Pendiente' } },
        Categoria: { select: { name: tarea.categoria } },
        Prioridad: { select: { name: tarea.prioridad } }
      }
    });
    return res;
  } catch (e) {
    console.log('Save error:', e.message);
    return null;
  }
}

app.get('/', (req, res) => res.send('Segundo Cerebro'));

app.post('/webhook', async (req, res) => {
  const msg = req.body.message;
  if (!msg || !msg.text) return res.send('OK');
  
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  
  console.log('Text:', text);

  if (text === '/start') {
    await send(chatId, '🎯 <b>Segundo Cerebro</b>\n\n/tareas - Ver tareas\n/ayuda - Ayuda');
    return res.send('OK');
  }

  if (text === '/tareas') {
    try {
      const tasks = await notion.databases.query({
        database_id: TAREA_DATA_SOURCE,
        filter: { property: 'Estado', select: { equals: 'Pendiente' } },
        page_size: 10
      });
      
      if (tasks.results.length === 0) {
        await send(chatId, '✅ Sin tareas');
      } else {
        let m = '📋 <b>Tareas:</b>\n\n';
        tasks.results.forEach(t => {
          m += '• ' + (t.properties?.Name?.title[0]?.plain_text || 'X') + '\n';
        });
        await send(chatId, m);
      }
    } catch (e) {
      await send(chatId, '❌ Error');
    }
    return res.send('OK');
  }

  if (text === '/ayuda' || text === '/help') {
    await send(chatId, '<b>Ejemplos:</b>\n• Comprar leche\n• Tarea de la universidad\n• Mantenimiento de la moto');
    return res.send('OK');
  }

  await send(chatId, '⏳ Guardando...');
  
  const tarea = analizar(text);
  console.log('Task:', tarea);
  
  const saved = await guardar(tarea);
  
  if (saved) {
    await send(chatId, `✅ <b>Guardado</b>\n📝 ${tarea.titulo}\n🏷️ ${tarea.categoria} | ⚡ ${tarea.prioridad}`);
  } else {
    await send(chatId, '❌ Error al guardar');
  }

  res.send('OK');
});

app.listen(PORT, () => console.log('Listo'));
