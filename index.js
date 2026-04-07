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
const TAREA_DATA_SOURCE = '33a6d89a-a55f-813f-b699-000bd8519e92';

const notion = new Client({ auth: NOTION_API_KEY });
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

async function sendTelegramMessage(chatId, text) {
  try {
    await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Error sending:', error.message);
  }
}

async function analyzeWithAI(message) {
  const systemPrompt = `Categorías exactas: Mascota, Vehiculo, Universidad, Hogar, Trabajo, Finanzas, Personal
Prioridades: Alta, Media, Baja

Responde solo con JSON válido (sin texto adicional):
{"titulo":"título corto","categoria":"UNA CATEGORÍA","prioridad":"Alta|Media|Baja","detalle":"descripción o null"}`;

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
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://render.com',
          'X-Title': 'Segundo Cerebro'
        }
      }
    );
    const content = response.data.choices[0].message.content;
    console.log('AI response:', content);
    return JSON.parse(content);
  } catch (error) {
    console.error('AI Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return null;
  }
}

async function saveToTareas(task) {
  try {
    console.log('Saving task:', JSON.stringify(task));
    
    const properties = {
      Name: { title: [{ text: { content: task.titulo || 'Tarea sin título' } }] },
      Estado: { select: { name: 'Pendiente' } }
    };
    
    if (task.categoria) {
      properties.Categoria = { select: { name: task.categoria } };
    }
    
    if (task.prioridad) {
      properties.Prioridad = { select: { name: task.prioridad } };
    } else {
      properties.Prioridad = { select: { name: 'Media' } };
    }
    
    if (task.detalle) {
      properties.Detalle = { rich_text: [{ text: { content: task.detalle } }] };
    }

    const response = await notion.pages.create({
      parent: { page_id: SEGUNDO_CEREBRO_PAGE },
      properties: properties
    });
    
    console.log('Saved successfully:', response.id);
    return response;
  } catch (error) {
    console.error('Save Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data));
    }
    return null;
  }
}

app.get('/', (req, res) => res.send('Segundo Cerebro 🚀'));

app.post('/webhook', async (req, res) => {
  const message = req.body.message;
  if (!message || !message.text) {
    console.log('No message or text');
    return res.send('OK');
  }
  
  const chatId = message.chat.id;
  const text = message.text.trim();
  
  console.log('Received:', text);

  if (text === '/start') {
    await sendTelegramMessage(chatId, 
      '🎯 <b>Segundo Cerebro</b>\n\n' +
      'Envíame tus tareas y las guardaré en Notion.\n\n' +
      '<b>Comandos:</b>\n' +
      '/start - Iniciar\n' +
      '/tareas - Ver tareas pendientes\n' +
      '/enviar - Nueva tarea\n\n' +
      '<b>Ejemplos:</b>\n' +
      '• "Comprar leche mañana"\n' +
      '• "Tarea de la universidad para mañana"\n' +
      '• "Reunión con equipo el viernes"'
    );
    return res.send('OK');
  }

  if (text === '/tareas' || text === '/tareas@AsistNotion_bot') {
    try {
      const tasks = await notion.databases.query({
        database_id: TAREA_DATABASE,
        filter: { property: 'Estado', select: { equals: 'Pendiente' } },
        page_size: 10
      });
      
      if (tasks.results.length === 0) {
        await sendTelegramMessage(chatId, '✅ No hay tareas pendientes.');
      } else {
        let msg = '📋 <b>Tareas Pendientes:</b>\n\n';
        tasks.results.forEach(t => {
          const name = t.properties?.Name?.title[0]?.plain_text || 'Sin título';
          const prioridad = t.properties?.Prioridad?.select?.name || '';
          const categoria = t.properties?.Categoria?.select?.name || '';
          msg += `• ${name}`;
          if (prioridad) msg += ` (${prioridad})`;
          if (categoria) msg += ` - ${categoria}`;
          msg += '\n';
        });
        await sendTelegramMessage(chatId, msg);
      }
    } catch (e) {
      console.error('Error querying:', e.message);
      await sendTelegramMessage(chatId, '❌ Error al obtener tareas.');
    }
    return res.send('OK');
  }

  if (text === '/enviar' || text === '/enviar@AsistNotion_bot') {
    await sendTelegramMessage(chatId, '📝 Escribe tu tarea:');
    return res.send('OK');
  }

  if (text === '/help') {
    await sendTelegramMessage(chatId, 
      '<b>Comandos:</b>\n' +
      '/start - Iniciar\n' +
      '/tareas - Ver tareas\n' +
      '/enviar - Nueva tarea\n\n' +
      'Simplemente envíame cualquier texto y lo convertiré en tarea.'
    );
    return res.send('OK');
  }

  await sendTelegramMessage(chatId, '⏳ Analizando con IA...');
  
  const task = await analyzeWithAI(text);
  
  if (!task) {
    await sendTelegramMessage(chatId, '❌ Error al analizar. Intenta de nuevo.');
    return res.send('OK');
  }

  const saved = await saveToTareas(task);
  
  if (saved) {
    const msg = `✅ <b>Tarea guardada</b>\n\n📝 ${task.titulo}\n🏷️ ${task.categoria || 'Personal'} | ⚡ ${task.prioridad || 'Media'}`;
    if (task.detalle) {
      await sendTelegramMessage(chatId, msg + `\n📋 ${task.detalle}`);
    } else {
      await sendTelegramMessage(chatId, msg);
    }
  } else {
    await sendTelegramMessage(chatId, '❌ Error al guardar en Notion. La IA analizó la tarea pero no se pudo guardar.');
  }

  res.send('OK');
});

app.listen(PORT, () => console.log(`Puerto ${PORT}`));
