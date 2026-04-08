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
    console.log('Telegram send error:', e.message);
  }
}

function analizar(mensaje) {
  const m = mensaje.toLowerCase();
  let cat = 'Personal';
  let pri = 'Media';
  
  if (m.includes('mascota') || m.includes('perro') || m.includes('gato') || m.includes('luna') || m.includes('husky')) cat = 'Mascota';
  else if (m.includes('universidad') || m.includes('tarea') || m.includes('cátedra') || m.includes('investigación') || m.includes('examen')) cat = 'Universidad';
  else if (m.includes('trabajo') || m.includes('reunión') || m.includes('proyecto')) cat = 'Trabajo';
  else if (m.includes('moto') || m.includes('carro') || m.includes('mantenimiento') || m.includes('vehículo')) cat = 'Vehículo';
  else if (m.includes('dinero') || m.includes('gasto') || m.includes('finanza')) cat = 'Finanzas';
  else if (m.includes('comprar') || m.includes('leche') || m.includes('mercado') || m.includes('casa')) cat = 'Hogar';
  
  if (m.includes('urgente') || m.includes('importante') || m.includes('ahora')) pri = 'Alta';
  
  return { titulo: mensaje.substring(0, 50), categoria: cat, prioridad: pri, fecha: getFecha(mensaje), proyecto: getProyecto(mensaje), ubicacion: getUbicacion(mensaje) };
}

const UBICACIONES = {
  'luna': 'Casa',
  'supermercado': 'Supermercado',
  'tienda': 'Tienda',
  'mercado': 'Mercado',
  'casa': 'Casa',
  'trabajo': 'Trabajo',
  'universidad': 'Universidad',
  'facultad': 'Universidad',
  'veterinaria': 'Veterinaria',
  'vet': 'Veterinaria',
  'clinica': 'Clínica',
  'consultorio': 'Consultorio',
  'hospital': 'Hospital',
  'peluquería': 'Peluquería',
  'peluqueria': 'Peluquería',
  'gimnasio': 'Gimnasio',
  'farmacia': 'Farmacia',
  'restaurante': 'Restaurante',
  'restaurant': 'Restaurante',
  'banco': 'Banco',
  'oficina': 'Oficina',
  'parque': 'Parque',
  'mecánico': 'Mecánico',
  'mecanico': 'Mecánico',
  'ferretería': 'Ferretería',
  'ferreteria': 'Ferretería',
  'tienda mascotas': 'Tienda de Mascotas',
  'tienda animals': 'Tienda de Mascotas'
};

const COMPRAS_SUPERMERCADO = [
  'leche', 'harina', 'pan', 'huevos', 'queso', 'mantequilla', 'aceite', 'sal',
  'azúcar', 'azucar', 'café', 'cafe', 'arroz', 'frijoles', 'pasta', 'salsa',
  'tomate', 'cebolla', 'ajo', 'papa', 'patata', 'zanahoria', 'lechuga',
  'tomate', 'aguacate', 'plátano', 'platano', 'manzana', 'naranja', 'limón', 'limon',
  'pollo', 'carne', 'pescado', 'huevo', 'embutidos', 'jamón', 'jamon',
  'tocino', 'perro', 'hot dog', 'pizza', 'hamburguesa', 'papitas', 'chips',
  'galletas', 'chocolate', 'candy', 'dulces', 'refresco', 'jugo', 'agua',
  'cereal', 'avena', 'yogurt', 'yoghurt', 'mermelada', 'crema', 'nutella',
  'pañales', 'panales', 'servilletas', 'papel', 'jabón', 'jabon', 'detergente',
  'azeite', 'vinagre', 'mostaza', 'mayonesa', 'ketchup', 'aderezos',
  'levadura', 'polvo', 'royal', 'congelado', 'helado',
  'yogurt', 'yoghurt', 'croissant', 'donut', 'empanada', 'panqueta',
  'quesadilla', 'taco', 'arepa', 'cachapa', 'tequeño', ' pastel'
];

const COMPRA_FERRETERIA = [
  'brocha', 'pintura', 'pintar', 'martillo', 'clavo', 'tornillo', 'destornillador',
  'alambre', 'cable', 'extension', 'protector', 'enchufe', 'interruptor',
  'taladro', 'sierra', 'limalla', 'lija', 'espatula', 'rodillo',
  'cincel', 'formón', 'serrucho', 'tenaza', 'pinza', 'alicate',
  'cemento', 'pegamento', 'silicon', 'sellador', 'masilla',
  'tubo', 'caño', 'valvula', 'grifo', 'llave paso',
  'bombillo', 'foco', 'led', 'bombilla', 'interruptor',
  'candado', 'cerrojo', 'bisagra', 'tirador', 'manija',
  'alicuota', 'pvc', 'conduit', 'box', 'toner',
  'espatula', 'paleta', 'andamio', 'escalera', 'carretilla'
];

const COMPRA_VETERINARIA = [
  'comida perro', 'comida gato', 'alimento mascota', 'balanceado', 'croqueta',
  'hueso', 'juguete masticable', 'pellet', 'trace', 'snack perro',
  'collar', 'correa', 'arnes', 'bozal', 'cama perro', 'cama gato',
  'arena gato', 'arena sanitaria', 'little cats', 'viruta',
  'medicamento mascota', 'antibiotico perro', 'desparasitante', 'vacuna perro',
  'shampoo medico', 'jabon medico', 'cepillo peine', 'cortaunas',
  'plato', 'comedero', 'bebedero', 'fuente agua'
];

const PROYECTOS = {
  'casa': 'Casa',
  'mascota': 'Mascota',
  'mascotas': 'Mascota',
  'luna': 'Mascota',
  'husky': 'Mascota',
  'trabajo': 'Trabajo',
  'universidad': 'Universidad',
  'estudio': 'Universidad',
  'finanzas': 'Finanzas',
  'salud': 'Salud',
  'ejercicio': 'Salud',
  'vehículo': 'Vehículo',
  'vehiculo': 'Vehículo',
  'moto': 'Vehículo',
  'carro': 'Vehículo'
};

function getProyecto(mensaje) {
  const m = mensaje.toLowerCase();
  const match = m.match(/proyecto[:\s]+(.+?)(?:\s+|$)/);
  if (match) return match[1].trim();
  for (const [key, value] of Object.entries(PROYECTOS)) {
    if (m.includes(key)) return value;
  }
  return null;
}

function getUbicacion(mensaje) {
  const m = mensaje.toLowerCase();
  const match = m.match(/ubicación[:\s]+(.+?)(?:\s+|$)|ubicacion[:\s]+(.+?)(?:\s+|$)/);
  if (match) return match[1] || match[2];
  for (const [key, value] of Object.entries(UBICACIONES)) {
    if (m.includes(key)) return value;
  }
  for (const item of COMPRAS_SUPERMERCADO) {
    if (m.includes(item)) return 'Supermercado';
  }
  for (const item of COMPRA_FERRETERIA) {
    if (m.includes(item)) return 'Ferretería';
  }
  for (const item of COMPRA_VETERINARIA) {
    if (m.includes(item)) return 'Tienda de Mascotas';
  }
  if ((m.includes('luna') || m.includes('husky') || m.includes('perro') || m.includes('mascota') || m.includes('gato')) && 
      (m.includes('medico') || m.includes('médico') || m.includes('doctor') || m.includes('veterinario'))) {
    return 'Veterinaria';
  }
  if ((m.includes('yo') || m.includes('mis hijos') || m.includes('mi esposa') || m.includes('jessika') || m.includes('mi')) && 
      (m.includes('medico') || m.includes('médico') || m.includes('doctor') || m.includes('dentista') || m.includes('clínica'))) {
    return 'Clínica';
  }
  return null;
}

function getFecha(mensaje) {
  const m = mensaje.toLowerCase();
  const today = new Date();
  let fecha = null;
  
  if (m.includes('hoy')) {
    fecha = today.toISOString().split('T')[0];
  } else if (m.includes('mañana') || m.includes('manana')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    fecha = tomorrow.toISOString().split('T')[0];
  } else if (m.includes('pasado mañana') || m.includes('pasado manana')) {
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    fecha = dayAfter.toISOString().split('T')[0];
  } else if (m.includes('lunes')) {
    const nextMonday = new Date(today);
    const day = nextMonday.getDay();
    const daysUntil = (8 - day) % 7;
    if (day === 0) daysUntil = 1;
    else if (day === 1) daysUntil = 0;
    nextMonday.setDate(nextMonday.getDate() + daysUntil);
    fecha = nextMonday.toISOString().split('T')[0];
  } else if (m.includes('martes')) {
    const nextDay = new Date(today);
    const day = nextDay.getDay();
    const daysUntil = (2 - day + 7) % 7 || 7;
    nextDay.setDate(nextDay.getDate() + daysUntil);
    fecha = nextDay.toISOString().split('T')[0];
  } else if (m.includes('miércoles')) {
    const nextDay = new Date(today);
    const day = nextDay.getDay();
    const daysUntil = (3 - day + 7) % 7 || 7;
    nextDay.setDate(nextDay.getDate() + daysUntil);
    fecha = nextDay.toISOString().split('T')[0];
  } else if (m.includes('jueves')) {
    const nextDay = new Date(today);
    const day = nextDay.getDay();
    const daysUntil = (4 - day + 7) % 7 || 7;
    nextDay.setDate(nextDay.getDate() + daysUntil);
    fecha = nextDay.toISOString().split('T')[0];
  } else if (m.includes('viernes')) {
    const nextDay = new Date(today);
    const day = nextDay.getDay();
    const daysUntil = (5 - day + 7) % 7 || 7;
    nextDay.setDate(nextDay.getDate() + daysUntil);
    fecha = nextDay.toISOString().split('T')[0];
  } else if (m.includes('sábado') || m.includes('sabado')) {
    const nextDay = new Date(today);
    const day = nextDay.getDay();
    const daysUntil = (6 - day + 7) % 7 || 7;
    nextDay.setDate(nextDay.getDate() + daysUntil);
    fecha = nextDay.toISOString().split('T')[0];
  } else if (m.includes('domingo')) {
    const nextDay = new Date(today);
    const day = nextDay.getDay();
    const daysUntil = (7 - day) % 7 || 7;
    nextDay.setDate(nextDay.getDate() + daysUntil);
    fecha = nextDay.toISOString().split('T')[0];
  }
  
  return fecha;
}

async function guardar(tarea) {
  try {
    const res = await notion.pages.create({
      parent: { 
        data_source_id: TAREA_DATA_SOURCE
      },
      properties: {
        Name: { title: [{ text: { content: tarea.titulo } }] },
        Detalle: { rich_text: [{ text: { content: tarea.titulo } }] },
        Estado: { select: { name: 'Pendiente' } },
        Categoria: { select: { name: tarea.categoria } },
        Prioridad: { select: { name: tarea.prioridad } },
        Seguimiento: { checkbox: false },
        Fecha: { date: tarea.fecha ? tarea.fecha : null },
        Proyecto: { select: tarea.proyecto ? { name: tarea.proyecto } : null },
        Ubicacion: { select: tarea.ubicacion ? { name: tarea.ubicacion } : null }
      }
    });
    return res;
  } catch (e) {
    console.log('Save error:', e.message);
    console.log('Save error details:', JSON.stringify(e));
    return { error: e.message };
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
        database_id: TAREA_DATABASE,
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
  
  if (saved && !saved.error) {
    let response = `✅ <b>Guardado</b>\n📝 ${tarea.titulo}\n🏷️ ${tarea.categoria} | ⚡ ${tarea.prioridad}`;
    if (tarea?.fecha) response += `\n📅 Fecha: ${tarea.fecha}`;
    if (tarea?.proyecto) response += `\n📁 Proyecto: ${tarea.proyecto}`;
    if (tarea?.ubicacion) response += `\n📍 Ubicación: ${tarea.ubicacion}`;
    await send(chatId, response);
  } else {
    await send(chatId, `❌ Error al guardar\n${saved?.error || 'Unknown error'}`);
  }

  res.send('OK');
});

app.listen(PORT, () => console.log('Listo'));
