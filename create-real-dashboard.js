const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY || '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' });

const DASHBOARD_ID = '33a6d89a-a55f-81d6-b03f-e7573eab6b47';

const DB_IDS = {
  tareas: '33a6d89a-a55f-8121-a3ae-fcfb55dc8fa3',
  habitos: '746947c2-f8c8-4adc-9575-8cdd6a5f7396',
  finanzas: 'ea3e2e5e-202c-4deb-9071-86fdb7380153'
};

const DASHBOARD_CONTENT = [
  {
    type: 'heading_1',
    text: 'Segundo Cerebro - Dashboard Profesional',
    color: 'blue'
  },
  {
    type: 'paragraph',
    text: 'Vista centralizada de todas tus metricas y actividades'
  },
  { type: 'divider' },
  
  {
    type: 'heading_2',
    text: '📊 Resumen de Tareas'
  },
  {
    type: 'paragraph',
    text: 'Estado actual de tus tareas desde Telegram'
  },
  {
    type: 'callout',
    text: 'Usa /chart en la base de datos Tareas Central para crear graficos - Estado por prioridad, categoria, proyecto'
  },
  { type: 'divider' },
  
  {
    type: 'heading_2',
    text: '🏋️ Hábitos Hoy'
  },
  {
    type: 'paragraph',
    text: 'Seguimiento diario de hábitos - GYM, Leer, Cocinar, Correr, Escribir'
  },
  {
    type: 'callout',
    text: 'Usa la vista de Board o Gallery en Habit Tracker para mejor visualizacion'
  },
  { type: 'divider' },
  
  {
    type: 'heading_2',
    text: '💰 Finanzas'
  },
  {
    type: 'paragraph',
    text: 'Resumen de ingresos, gastos y balance mensual'
  },
  {
    type: 'callout',
    text: 'Database de Meses tiene formulas automáticas - Neto mensual = Ingresos - Gastos'
  },
  { type: 'divider' },
  
  {
    type: 'heading_2',
    text: '🎮 Gamificación - UNEXCA/UNESR + Trabajo'
  },
  {
    type: 'paragraph',
    text: 'Sistema de recompensas y progreso'
  },
  { type: 'divider' },
  
  {
    type: 'heading_2',
    text: '🎯 Acciones Rapidas'
  },
  {
    type: 'to_do',
    text: 'Ver todas las tareas pendientes',
    link: 'https://www.notion.so/33a6d89aa55f8121a3aefcfb55dc8fa3'
  },
  {
    type: 'to_do',
    text: 'Abrir Habit Tracker',
    link: 'https://www.notion.so/746947c2f8c84adc95758cdd6a5f7396'
  },
  {
    type: 'to_do',
    text: 'Ver Finanzas Mes',
    link: 'https://www.notion.so/ea3e2e5e202c4deb907186fdb7380153'
  },
  {
    type: 'to_do',
    text: 'Sistema de Gamificacion',
    link: 'https://www.notion.so/5981e0559f9543b592be3e22ae1b79e9'
  }
];

const CREATE_VIEWS_SCRIPT = `
📊 PARA CREAR LOS CHARTS Y VISTAS EN NOTION:

1. VE A CADA DATABASE Y CREA LAS VISTAS:

Tareas Central:
- Vista "Por Estado" - Group by Estado
- Vista "Por Prioridad" - Group by Prioridad  
- Vista "Por Categoria" - Group by Categoria
- Vista "Grafico Tareas" - Chart view con Bar chart por Estado

Habit Tracker:
- Vista "Hoy" - Filter Fecha = Today
- Vista "Calendario" - Calendar view
- Vista "Semana" - Group by week

Finanzas Meses:
- Vista "Resumen" - Table view
- Vista "Grafico Gastos" - Chart tipo Donut por categoria

2. PARA AGREGAR AL DASHBOARD:
- Ve al Dashboard
- Escribe "/linked database"
- Selecciona cada database
- Elige la vista que quieras mostrar

3. KPIs RECOMENDADOS:
- Tareas: Count by Estado (Pendiente/Completado)
- Habitos: % completado Hoy
- Finanzas: Neto mensual (formula ya existe)
`;

async function createDashboard() {
  console.log('🎯 Creando Dashboard Profesional...\n');
  
  console.log('Limpiando contenido anterior...');
  const existing = await notion.blocks.children.list({ block_id: DASHBOARD_ID, page_size: 100 });
  for (const block of existing.results) {
    await notion.blocks.delete({ block_id: block.id });
  }
  
  console.log('Agregando estructura del Dashboard...\n');
  
  for (let i = 0; i < DASHBOARD_CONTENT.length; i++) {
    const item = DASHBOARD_CONTENT[i];
    try {
      if (item.type === 'divider') {
        await notion.blocks.children.append({
          block_id: DASHBOARD_ID,
          children: [{ object: 'block', type: 'divider', divider: {} }]
        });
      } else {
        const block = { object: 'block', type: item.type };
        
        if (item.type === 'heading_1') {
          block.heading_1 = { 
            rich_text: [{ text: { content: item.text } }],
            color: item.color || 'default'
          };
        } else if (item.type === 'heading_2') {
          block.heading_2 = { 
            rich_text: [{ text: { content: item.text } }]
          };
        } else if (item.type === 'paragraph') {
          block.paragraph = { 
            rich_text: [{ text: { content: item.text } }]
          };
        } else if (item.type === 'callout') {
          block.callout = { 
            rich_text: [{ text: { content: item.text } }],
            icon: { emoji: '💡' },
            color: 'gray_background'
          };
        } else if (item.type === 'to_do') {
          block.to_do = {
            rich_text: [{
              text: { 
                content: item.text, 
                link: item.link ? { url: item.link } : undefined 
              }
            }],
            checked: false
          };
        }
        
        await notion.blocks.children.append({
          block_id: DASHBOARD_ID,
          children: [block]
        });
      }
      console.log(`[${i+1}/${DASHBOARD_CONTENT.length}] ${item.type}: ${item.text.substring(0,40)}...`);
    } catch (e) {
      console.error(`Error: ${e.message}`);
    }
  }
  
  console.log('\n✅ Dashboard base creado!');
  console.log('\n' + '='.repeat(50));
  console.log(CREATE_VIEWS_SCRIPT);
  console.log('='.repeat(50));
}

createDashboard().catch(console.error);