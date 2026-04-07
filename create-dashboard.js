const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY || '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' });

const PAGES = {
  'Tareas Central': '33a6d89a-a55f-8121-a3ae-fcfb55dc8fa3',
  'Despensa': '3a7857d3-d4b9-405b-ba63-2972404573a7',
  'Lista de Compras': 'c7938285-19a0-4b41-b748-4e286861f514',
  'Inversiones': '3c248d39-063b-473b-a4f9-83eebd27e0a7',
  'Finanzas Personales': 'd9c69f00-67cc-463b-b3bf-affa564ec5b',
  'Presupuesto mensual': '616de00a-b8be-4641-8625-6867bf6d82b6',
  'Entrenamiento': '120aa116-6005-4a06-ac20-364197c810cf',
  'Seguimiento de Habitos': 'c3c23534-9e71-4beb-b3b3-b6693ddc49c0',
  'Agenda de Estudiante': '2806d89a-a55f-80a7-a846-ef933ae4d4bf',
  'Lista de Lectura': '7baa88e9-6498-4898-b40-5edda314a85be',
  'Planificacion de Proyectos': 'b1004a29-f048-4123-98e2-831ecde46757',
  'Seguimiento de Empleo': '75739ae7-502f-4cd2-8459-9983f77afa5a9',
  'Planificador de Comidas': 'a2c5bcec-438e-4810-a205-bc85a251db10',
  'Curriculum': '2806d89a-a55f-8092-94f9-e5059eab7c3e',
  'Sistema de Gamificacion': '5981e055-9f95-43b5-92be-3e22ae1b79e9',
  'Calculadora de Notas': '2806d89a-a55f-805a-ada9-eac016dcd7cb'
};

const SECTIONS = [
  {
    title: 'Tareas Central',
    pages: ['Tareas Central'],
    description: 'Base de datos central para todas las tareas - se maneja desde Telegram'
  },
  {
    title: 'Compras',
    pages: ['Despensa', 'Lista de Compras'],
    description: 'Gestion de compras y despensa'
  },
  {
    title: 'Finanzas',
    pages: ['Inversiones', 'Finanzas Personales', 'Presupuesto mensual'],
    description: 'Control de finanzas e inversiones'
  },
  {
    title: 'Salud',
    pages: ['Entrenamiento', 'Seguimiento de Habitos'],
    description: 'Entrenamiento fisico y seguimiento de habitos'
  },
  {
    title: 'Aprendizaje',
    pages: ['Agenda de Estudiante', 'Lista de Lectura', 'Calculadora de Notas'],
    description: 'Educacion, estudios y lectura'
  },
  {
    title: 'Proyectos y Trabajo',
    pages: ['Planificacion de Proyectos', 'Seguimiento de Empleo'],
    description: 'Gestion de proyectos y busqueda de empleo'
  },
  {
    title: 'Comidas',
    pages: ['Planificador de Comidas'],
    description: 'Planificacion de comidas y recetas'
  },
  {
    title: 'Personal',
    pages: ['Curriculum', 'Sistema de Gamificacion'],
    description: 'CV profesional y gamificacion (UNEXCA/UNESR + Trabajo)'
  }
];

async function createMasterDashboard() {
  console.log('Creating Master Dashboard...\n');

  const dashboardPageId = '33a6d89a-a55f-81d6-b03f-e7573eab6b47';

  console.log('Clearing existing blocks...');
  const existingBlocks = await notion.blocks.children.list({ block_id: dashboardPageId });
  for (const block of existingBlocks.results) {
    await notion.blocks.delete({ block_id: block.id });
  }

  console.log('Adding new sections with links...\n');

  for (const section of SECTIONS) {
    console.log(`Adding section: ${section.title}`);

    await notion.blocks.children.append({
      block_id: dashboardPageId,
      children: [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: section.title } }]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: section.description } }]
          }
        }
      ]
    });

    for (const pageName of section.pages) {
      const pageId = PAGES[pageName];
      if (pageId) {
        console.log(`  - Linking: ${pageName}`);
        
        await notion.blocks.children.append({
          block_id: dashboardPageId,
          children: [
            {
              object: 'block',
              type: 'to_do',
              to_do: {
                rich_text: [
                  { 
                    text: { 
                      content: pageName,
                      link: { url: `https://notion.so/${pageId.replace(/-/g, '')}` }
                    }
                  }
                ],
                checked: false
              }
            }
          ]
        });
      }
    }

    await notion.blocks.children.append({
      block_id: dashboardPageId,
      children: [
        { object: 'block', type: 'divider', divider: {} }
      ]
    });
  }

  console.log('\n✅ Master Dashboard created successfully!');
}

createMasterDashboard().catch(console.error);