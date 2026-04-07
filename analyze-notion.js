require('dotenv').config();
const axios = require('axios');

const NOTION_KEY = process.env.NOTION_API_KEY || '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';
const HEADERS = {
  'Authorization': `Bearer ${NOTION_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json'
};

const PAGES = [
  { id: '02167f978bbc48b49ad9b8fa430b6586', name: '80+ Recursos para Universitarios', type: 'page' },
  { id: '05f46a0b5f20432da70163b1db9819c6', name: '50+ Recursos para Aprendizaje en Línea', type: 'page' },
  { id: 'a206663634c049feaf8f3452d287c3a1', name: '30+ Recursos para Aprendizaje de Idiomas', type: 'page' },
  { id: 'c23b40d2d0d24880848f3e2089795d31', name: '100+ Plantillas de prompts para profesores', type: 'page' },
  { id: '91b5afb26e5a41e6977bdb37f00e096b', name: '100+ webs basadas en IA', type: 'page' },
  { id: '1130146337624b4a96aff27e7c8503bf', name: 'Sistema de Notas de Rubén Loan', type: 'page' },
  { id: '6166143e9d444f21a3405eacfcb38be4', name: 'Diarios de reflexión imprimibles', type: 'page' },
  { id: '95e81c2b7a17489b9ddad11c1b3a0ae3', name: 'Lecturas y más', type: 'page' },
  { id: '9ca0946805bd49f988f0cf3ff7c91f10', name: 'Planificación de comidas', type: 'page' },
  { id: 'e4a7e2fbcfcb4a05af63202084a5c355', name: 'Sitio web personal', type: 'page' },
  { id: '0c8a0fc11c144eb288d0416507b76864', name: 'Guía', type: 'page' },
];

async function getPageInfo(page) {
  try {
    if (page.type === 'database') {
      const response = await axios.get(`https://api.notion.com/v1/databases/${page.id}`, { headers: HEADERS });
      const db = response.data;
      return {
        name: db.title?.[0]?.plain_text || page.name,
        type: 'database',
        properties: Object.keys(db.properties),
        description: db.description?.[0]?.plain_text || ''
      };
    } else {
      const response = await axios.get(`https://api.notion.com/v1/blocks/${page.id}/children?page_size=50`, { headers: HEADERS });
      const children = response.data.results;
      const databases = children.filter(c => c.type === 'child_database').map(c => c.child_database.title);
      return {
        name: page.name,
        type: 'page',
        databases: databases,
        blockCount: children.length
      };
    }
  } catch (error) {
    return { name: page.name, error: error.message };
  }
}

async function analyzeAll() {
  console.log('🔍 Analizando páginas de Notion...\n');
  for (const page of PAGES) {
    const info = await getPageInfo(page);
    console.log(`📌 ${info.name}`);
    console.log(`   Tipo: ${info.type}`);
    if (info.properties) console.log(`   Propiedades: ${info.properties.join(', ')}`);
    if (info.databases) console.log(`   Databases: ${info.databases.join(', ')}`);
    if (info.error) console.log(`   Error: ${info.error}`);
    console.log('');
  }
}

analyzeAll();