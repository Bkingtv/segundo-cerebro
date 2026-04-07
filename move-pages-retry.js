const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY || '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' });

const SEGUNDO_CEREBRO_ID = '33a6d89aa55f803a9aa0c119ac95a169';

const PAGES_TO_MOVE = [
  { id: 'a2c5bcec438e4810a205bc85a251db10', name: 'Planificador Comidas', from: 'Planificaciones' },
  { id: '2806d89aa55f80a7a846ef933ae4d4bf', name: 'Agenda de estudiante', from: 'Personal' },
  { id: '2806d89aa55f809294f9e5059eab7c3e', name: 'Currículum', from: 'Personal' },
  { id: '7baa88e964984898b405edda314a85be', name: 'Lista de lectura', from: 'Personal' },
];

async function movePage(pageId, newParentId) {
  try {
    const response = await notion.pages.update({
      page_id: pageId,
      parent: { page_id: newParentId }
    });
    return { success: true, id: pageId };
  } catch (error) {
    return { success: false, id: pageId, error: error.message };
  }
}

async function moveAllPages() {
  console.log('🔄 Reintentando mover páginas faltantes...\n');
  
  for (const page of PAGES_TO_MOVE) {
    console.log(`Moviendo: ${page.name}...`);
    const result = await movePage(page.id, SEGUNDO_CEREBRO_ID);
    
    if (result.success) {
      console.log(`  ✅ Exito!`);
    } else {
      console.log(`  ❌ Error: ${result.error}`);
    }
  }
}

moveAllPages();