const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY || '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' });

const DASHBOARD_ID = '33a6d89a-a55f-81d6-b03f-e7573eab6b47';

const ALL_CONTENT = [
  { type: 'heading_2', text: 'Tareas Central' },
  { type: 'paragraph', text: 'Base de datos central para todas las tareas - se maneja desde Telegram' },
  { type: 'to_do', text: 'Tareas Central', link: 'https://www.notion.so/33a6d89aa55f8121a3aefcfb55dc8fa3' },
  { type: 'divider' },
  
  { type: 'heading_2', text: 'Compras' },
  { type: 'paragraph', text: 'Gestion de compras y despensa' },
  { type: 'to_do', text: 'Despensa', link: 'https://www.notion.so/3a7857d3d4b9405bba632972404573a7' },
  { type: 'to_do', text: 'Lista de Compras', link: 'https://www.notion.so/c793828519a04b41b7484e286861f514' },
  { type: 'divider' },
  
  { type: 'heading_2', text: 'Finanzas' },
  { type: 'paragraph', text: 'Control de finanzas e inversiones' },
  { type: 'to_do', text: 'Inversiones', link: 'https://www.notion.so/3c248d39063b473ba4f983eebd27e0a7' },
  { type: 'to_do', text: 'Finanzas Personales', link: 'https://www.notion.so/d9c69f0067cc463bb3bfeaffa564ec5b' },
  { type: 'to_do', text: 'Presupuesto mensual', link: 'https://www.notion.so/616de00ab8be464186256867bf6d82b6' },
  { type: 'divider' },
  
  { type: 'heading_2', text: 'Salud' },
  { type: 'paragraph', text: 'Entrenamiento fisico y seguimiento de habitos' },
  { type: 'to_do', text: 'Entrenamiento', link: 'https://www.notion.so/120aa11660054a06ac20364197c810cf' },
  { type: 'to_do', text: 'Seguimiento de Habitos', link: 'https://www.notion.so/c3c235349e714bebb3b3b6693ddc49c0' },
  { type: 'divider' },
  
  { type: 'heading_2', text: 'Aprendizaje' },
  { type: 'paragraph', text: 'Educacion, estudios y lectura' },
  { type: 'to_do', text: 'Agenda de Estudiante', link: 'https://www.notion.so/2806d89aa55f80a7a846ef933ae4d4bf' },
  { type: 'to_do', text: 'Lista de Lectura', link: 'https://www.notion.so/7baa88e964984898b405edda314a85be' },
  { type: 'to_do', text: 'Calculadora de Notas', link: 'https://www.notion.so/2806d89aa55f805aada9eac016dcd7cb' },
  { type: 'divider' },
  
  { type: 'heading_2', text: 'Proyectos y Trabajo' },
  { type: 'paragraph', text: 'Gestion de proyectos y busqueda de empleo' },
  { type: 'to_do', text: 'Planificacion de Proyectos', link: 'https://www.notion.so/b1004a29f048412398e2831ecde46757' },
  { type: 'to_do', text: 'Seguimiento de Empleo', link: 'https://www.notion.so/75739ae7502f4cd28459983f77afa5a9' },
  { type: 'divider' },
  
  { type: 'heading_2', text: 'Comidas' },
  { type: 'paragraph', text: 'Planificacion de comidas y recetas' },
  { type: 'to_do', text: 'Planificador de Comidas', link: 'https://www.notion.so/a2c5bcec438e4810a205bc85a251db10' },
  { type: 'divider' },
  
  { type: 'heading_2', text: 'Personal' },
  { type: 'paragraph', text: 'CV profesional y gamificacion (UNEXCA/UNESR + Trabajo)' },
  { type: 'to_do', text: 'Curriculum', link: 'https://www.notion.so/2806d89aa55f809294f9e5059eab7c3e' },
  { type: 'to_do', text: 'Sistema de Gamificacion', link: 'https://www.notion.so/5981e0559f9543b592be3e22ae1b79e9' }
];

async function addBlocks() {
  console.log('Adding blocks to Master Dashboard...\n');
  
  for (let i = 0; i < ALL_CONTENT.length; i++) {
    const item = ALL_CONTENT[i];
    
    try {
      if (item.type === 'divider') {
        await notion.blocks.children.append({
          block_id: DASHBOARD_ID,
          children: [{ object: 'block', type: 'divider', divider: {} }]
        });
        console.log(`[${i+1}/${ALL_CONTENT.length}] Added divider`);
      } else {
        const block = { object: 'block', type: item.type };
        block[item.type] = {
          rich_text: [{
            text: item.link ? { content: item.text, link: { url: item.link } } : { content: item.text }
          }]
        };
        
        await notion.blocks.children.append({
          block_id: DASHBOARD_ID,
          children: [block]
        });
        console.log(`[${i+1}/${ALL_CONTENT.length}] Added ${item.type}: ${item.text}`);
      }
    } catch (e) {
      console.error(`Error adding ${item.type}: ${e.message}`);
    }
  }
  
  console.log('\n✅ Master Dashboard completado!');
}

addBlocks();