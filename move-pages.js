const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY || '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' });

const SEGUNDO_CEREBRO_ID = '33a6d89aa55f803a9aa0c119ac95a169';

const PAGES_TO_MOVE = [
  { id: 'a3ee5f07-8f3a-438e-9337-f6b1a303c21c', name: 'Mis viajes', from: 'Planificaciones' },
  { id: '3c248d39-063b-473b-a4f9-83eebd27e0a7', name: 'Inversiones', from: 'Planificaciones' },
  { id: 'a2c5bcec-438e-4810a205-bc85a251db10', name: 'Planificador Comidas', from: 'Planificaciones' },
  { id: 'b1004a29-f048-4123-98e2-831ecde46757', name: 'Planificación de Proyectos', from: 'Planificaciones' },
  { id: 'ac274c6e-778e-40b4-b919-4a9205b5cb06', name: 'No Code', from: 'Recursos' },
  { id: 'a8ed8f5c-d804-445b-a3db-342bb1fe12a6', name: 'Cerebro', from: 'Sistemas' },
  { id: '5981e055-9f95-43b5-92be-3e22ae1b79e9', name: 'Sistema de Gamificación', from: 'Sistemas' },
  { id: '11301463-3762-4b4a-96af-f27e7c8503bf', name: 'Sistema de Notas de Rubén Loan', from: 'Sistemas' },
  { id: 'e304cc94-d3e4-4644-b039-3300901df814', name: 'Diario personal', from: 'Personal' },
  { id: '120aa116-6005-4a06-ac20-364197c810cf', name: 'Entrenamiento', from: 'Personal' },
  { id: 'c3c23534-9e71-4beb-b3b3-b6693ddc49c0', name: 'Seguimiento de Hábitos', from: 'Personal' },
  { id: 'd9c69f00-67cc-463b-b3bf-eaffa564ec5b', name: 'Seguimiento de finanzas personales', from: 'Personal' },
  { id: '616de00a-b8be-4641-8625-6867bf6d82b6', name: 'Presupuesto mensual', from: 'Personal' },
  { id: '75739ae7-502f-4cd2-8459-983f77afa5a9', name: 'Seguimiento de solicitudes de empleo', from: 'Personal' },
  { id: '2806d89aa55f-80a7-a846-ef933ae4d4bf', name: 'Agenda de estudiante', from: 'Personal' },
  { id: '2806d89aa55f-8092-94f9-e5059eab7c3e', name: 'Currículum', from: 'Personal' },
  { id: '7baa88e9-6498-4898-b405-edda314a85be', name: 'Lista de lectura', from: 'Personal' },
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
  console.log('🔄 Moviendo páginas a Segundo Cerebro...\n');
  console.log(`Destino: ${SEGUNDO_CEREBRO_ID}\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const page of PAGES_TO_MOVE) {
    console.log(`Moviendo: ${page.name} (${page.from})...`);
    const result = await movePage(page.id, SEGUNDO_CEREBRO_ID);
    
    if (result.success) {
      console.log(`  ✅ Exito!`);
      successCount++;
    } else {
      console.log(`  ❌ Error: ${result.error}`);
      failCount++;
    }
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`  Exitosos: ${successCount}`);
  console.log(`  Fallidos: ${failCount}`);
}

moveAllPages();