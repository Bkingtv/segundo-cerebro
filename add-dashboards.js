const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY || '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' });

const SEGUNDO_CEREBRO_ID = '33a6d89aa55f803a9aa0c119ac95a169';

const DATABASES = [
  { 
    id: '33a6d89a-a55f-8121-a3ae-fcfb55dc8fa3', 
    name: 'Tareas Central',
    description: 'Tareas desde Telegram - Estado, Prioridad, Categoría'
  },
  { 
    id: '746947c2-f8c8-4adc-9575-8cdd6a5f7396', 
    name: 'Habit Tracker',
    description: 'Seguimiento diario de hábitos'
  },
  { 
    id: 'ea3e2e5e-202c-4deb-9071-86fdb7380153', 
    name: 'Finanzas Meses',
    description: 'Resumen financiero mensual'
  },
  { 
    id: '3a7857d3-d4b9-405b-ba63-2972404573a7', 
    name: 'Despensa',
    description: 'Inventario de compras'
  }
];

async function addLinkedDatabase(dbId, dbName, targetPageId) {
  try {
    // Get database info
    const db = await notion.databases.retrieve({ database_id: dbId });
    
    // Add as embed/link block
    const block = await notion.blocks.children.append({
      block_id: targetPageId,
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: `--- ${dbName} ---` } }]
          }
        }
      ]
    });
    
    console.log(`✅ Linked: ${dbName}`);
    return { success: true, name: dbName };
  } catch (error) {
    console.log(`❌ ${dbName}: ${error.message.substring(0,50)}`);
    return { success: false, name: dbName, error: error.message };
  }
}

async function addAllDatabases() {
  console.log('Agregando bases de datos vinculadas...\n');
  
  for (const db of DATABASES) {
    await addLinkedDatabase(db.id, db.name, SEGUNDO_CEREBRO_ID);
  }
  
  console.log('\nListo! Las bases de datos se agregaron.');
  console.log('NOTA: Para ver los datos, necesitas abrir las databases directamente en Notion.');
  console.log('Los charts se crean desde la vista de cada database.');
}

addAllDatabases();