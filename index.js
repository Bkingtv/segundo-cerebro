require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { Client } = require('@notionhq/client');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const PORT = process.env.PORT || 3000;

const SEGUNDO_CEREBRO_PAGE = '33a6d89a-a55f-803a-9aa0-c119ac95a169';
const TAREA_DATABASE = '33a6d89a-a55f-8121-a3ae-fcfb55dc8fa3';

const notion = new Client({ auth: NOTION_API_KEY });
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

async function sendTelegramMessage(chatId, text) {
  try {
    await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Telegram Error:', error.message);
  }
}

async function analyzeWithAI(message) {
  const categorias = ['Mascota', 'Vehiculo', 'Universidad', 'Hogar', 'Trabajo', 'Finanzas', 'Personal'];
  const prioridades = ['Alta', 'Media', 'Baja'];
  
  let categoria = 'Personal';
  let prioridad = 'Media';
  let titulo = message;
  let detalle = null;
  
  const msgLower = message.toLowerCase();
  
  if (msgLower.includes('universidad') || msgLower.includes('tarea') || msgLower.includes('examen') || msgLower.includes('tesis') || msgLower.includes('cátedra') || msgLower.includes('investigación')) {
    categoria = 'Universidad';
  } else if (msgLower.includes('trabajo') || msgLower.includes('reunión') || msgLower.includes('proyecto') || msgLower.includes('junta')) {
    categoria = 'Trabajo';
  } else if (msgLower.includes('comprar') || msgLower.includes('leche') || msgLower.includes('mercado') || msgLower.includes('casa') || msgLower.includes('limpieza')) {
    categoria = 'Hogar';
  } else if (msgLower.includes('moto') || msgLower.includes('carro') || msgLower.includes('vehículo') || msgLower.includes('mantenimiento')) {
    categoria = 'Vehiculo';
  } else if (msgLower.includes('mascota') || msgLower.includes('perro') || msgLower.includes('gato')) {
    categoria = 'Mascota';
  } else if (msgLower.includes('dinero') || msgLower.includes('gasto') || msgLower.includes('pagar') || msgLower.includes('finanza')) {
    categoria = 'Finanzas';
  }
  
  if (msgLower.includes('urgente') || msgLower.includes('importante') || msgLower.includes('ahora') || msgLower.includes('para hoy')) {
    prioridad = 'Alta';
  } else if (msgLower.includes('mañana') || msgLower.includes('esta semana') || msgLower.includes('pronto')) {
    prioridad = 'Media';
  } else {
    prioridad = 'Baja';
  }
  
  if (message.length > 30) {
    detalle = message;
    titulo = message.substring(0, 30).trim() + '...';
  }
  
  return {
    titulo: titulo,
    categoria: categoria,
    prioridad: prioridad,
    detalle: detalle
  };
}

async function saveToTareas(task) {
  try {
    const properties = {
      Name: { title: [{ text: { content: task.titulo || 'Tarea' } }] },
      Estado: { select: { name: 'Pendiente' } },
      Categoria: { select: { name: task.categoria || 'Personal' } },
      Prioridad: { select: { name: task.prioridad || 'Media' } }
    };
    
    if (task.detalle) {
      properties.Detalle = { rich_text: [{ text: { content: task.detalle } }] };
    }

    const response = await notion.pages.create({
      parent: { page_id: SEGUNDO_CEREBRO_PAGE },
      properties: properties
    });
    
    console.log('Saved:', response.id);
    return response;
  } catch (error) {
    console.error('Save Error:', error.message);
    return null;
  }
}

app.get('/', (req, res) => res.send('Segundo Cerebro 🚀'));

app.post('/webhook', async (req, res) => {
  const message = req.body.message;
  if (!message || !message.text) return res.send('OK');
  
  const chatId = message.chat.id;
  const text = message.text.trim();
  
  console.log('Msg:', text);

  if (text === '/start') {
    await sendTelegramMessage(chatId, 
      '🎯 <b>Segundo Cerebro</b>\n\n' +
      'Envíame tus tareas y las guardaré en Notion.\n\n' +
      '<b>Comandos:</b>\n' +
      '/start - Iniciar\n' +
      '/tareas - Ver tareas\n' +
      '/ayuda - Ayuda'
    );
    return res.send('OK');
  }

  if (text === '/tareas') {
    try {
      const tasks = await notion.databases.query({
        database_id: TAREA_DATABASE,
        filter: { property: 'Estado', select: { equals: 'Pendiente' } },
        page_size: 10
      });
      
      if (tasks.results.length === 0) {
        await sendTelegramMessage(chatId, '✅ No hay tareas');
      } else {
        let msg = '📋 <b>Tareas:</b>\n\n';
        tasks.results.forEach(t => {
          const name = t.properties?.Name?.title[0]?.plain_text || 'X';
          msg += `• ${name}\n`;
        });
        await sendTelegramMessage(chatId, msg);
      }
    } catch (e) {
      await sendTelegramMessage(chatId, '❌ Error');
    }
    return res.send('OK');
  }

  if (text === '/ayuda' || text === '/help') {
    await sendTelegramMessage(chatId, 
      '<b>Cómo usar:</b>\n' +
      'Simplemente envíame tu tarea.\n\n' +
      'Ej: "Comprar leche mañana"\n' +
      'Ej: "Tarea de la universidad"\n' +
      'Ej: "Mantenimiento de la moto"'
    );
    return res.send('OK');
  }

  await sendTelegramMessage(chatId, '⏳ Guardando...');
  
  const task = analyzeWithAI(text);
  console.log('Task:', JSON.stringify(task));
  
  const saved = await saveToTareas(task);
  
  if (saved) {
    await sendTelegramMessage(chatId, 
      `✅ <b>Guardado</b>\n\n📝 ${task.titulo}\n🏷️ ${task.categoria} | ⚡ ${task.prioridad}`
    );
  } else {
    await sendTelegramMessage(chatId, '❌ Error al guardar');
  }

  res.send('OK');
});

app.listen(PORT, () => console.log('Listo'));
