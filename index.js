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

const notion = new Client({ auth: NOTION_API_KEY });
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

async function sendTelegramMessage(chatId, text) {
  try {
    await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function analyzeWithAI(message) {
  const systemPrompt = `Categorías: Mascota, Vehiculo, Universidad, Hogar, Trabajo, Finanzas, Personal
Prioridades: Alta, Media, Baja

Responde solo con JSON:
{"tipo":"tarea","titulo":"título","categoria":"categoría","prioridad":"Alta|Media|Baja","fecha":null,"detalle":null}`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error('AI Error:', error.message);
    return null;
  }
}

async function saveToTareas(task) {
  try {
    const response = await notion.pages.create({
      parent: { page_id: '33a6d89a-a55f-803a-9aa0-c119ac95a169' },
      properties: {
        Name: { title: [{ text: { content: task.titulo || 'Tarea' } }] },
        Categoria: task.categoria ? { select: { name: task.categoria } } : { select: { name: 'Personal' } },
        Prioridad: task.prioridad ? { select: { name: task.prioridad } } : { select: { name: 'Media' } },
        Estado: { select: { name: 'Pendiente' } }
      }
    });
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
  const text = message.text;

  if (text === '/start') {
    await sendTelegramMessage(chatId, '🎯 <b>Segundo Cerebro</b>\n\n/enviar - Nueva tarea\n/tareas - Ver tareas');
    return res.send('OK');
  }

  if (text === '/tareas') {
    try {
      const tasks = await notion.databases.query({
        database_id: '33a6d89a-a55f-8121-a3ae-fcfb55dc8fa3',
        filter: { property: 'Estado', select: { equals: 'Pendiente' } },
        page_size: 5
      });
      
      if (tasks.results.length === 0) {
        await sendTelegramMessage(chatId, '✅ Sin tareas pendientes');
      } else {
        let msg = '📋 <b>Tareas:</b>\n\n';
        tasks.results.forEach(t => {
          const name = t.properties?.Name?.title[0]?.plain_text || 'Sin título';
          msg += `• ${name}\n`;
        });
        await sendTelegramMessage(chatId, msg);
      }
    } catch (e) {
      await sendTelegramMessage(chatId, '❌ Error');
    }
    return res.send('OK');
  }

  if (text === '/enviar') {
    await sendTelegramMessage(chatId, '📝 Envía tu tarea:');
    return res.send('OK');
  }

  await sendTelegramMessage(chatId, '⏳ Procesando...');
  const task = await analyzeWithAI(text);
  
  if (task && await saveToTareas(task)) {
    await sendTelegramMessage(chatId, `✅ Guardado: ${task.titulo}`);
  } else {
    await sendTelegramMessage(chatId, '❌ Error');
  }

  res.send('OK');
});

app.listen(PORT, () => console.log(`Puerto ${PORT}`));
