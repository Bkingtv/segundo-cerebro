#!/bin/bash
# Script to move pages to Segundo Cerebro using curl

NOTION_KEY="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"
DESTINO="33a6d89aa55f803a9aa0c119ac95a169"

PAGES=(
  "a3ee5f07-8f3a-438e-9337-f6b1a303c21c:Mis viajes"
  "3c248d39-063b-473b-a4f9-83eebd27e0a7:Inversiones"
  "a2c5bcec-438e-4810a205bc85a251db10:Planificador Comidas"
  "b1004a29-f048-4123-98e2-831ecde46757:Planificación de Proyectos"
  "ac274c6e-778e-40b4-b919-4a9205b5cb06:No Code"
  "a8ed8f5c-d804-445b-a3db-342bb1fe12a6:Cerebro"
  "5981e055-9f95-43b5-92be-3e22ae1b79e9:Sistema de Gamificación"
  "11301463-3762-4b4a-96af-f27e7c8503bf:Sistema de Notas"
  "e304cc94-d3e4-4644-b039-3300901df814:Diario personal"
  "120aa116-6005-4a06-ac20-364197c810cf:Entrenamiento"
  "c3c23534-9e71-4beb-b3b3-b6693ddc49c0:Seguimiento de Hábitos"
  "d9c69f00-67cc-463b-b3bf-eaffa564ec5b:Finanzas Personales"
  "616de00a-b8be-4641-8625-6867bf6d82b6:Presupuesto mensual"
  "75739ae7-502f-4cd2-8459-983f77afa5a9:Seguimiento de Empleo"
  "2806d89aa55f-80a7-a846-ef933ae4d4bf:Agenda de Estudiante"
  "2806d89aa55f-8092-94f9-e5059eab7c3e:Currículum"
)

for PAGE in "${PAGES[@]}"; do
  ID="${PAGE%%:*}"
  NAME="${PAGE##*:}"
  
  echo "Moviendo: $NAME..."
  
  RESULT=$(curl -s -X PATCH "https://api.notion.com/v1/pages/$ID" \
    -H "Authorization: Bearer $NOTION_KEY" \
    -H "Content-Type: application/json" \
    -H "Notion-Version: 2022-06-28" \
    -d "{\"parent\":{\"page_id\":\"$DESTINO\"}}")
  
  if echo "$RESULT" | grep -q '"object":"page"'; then
    echo "  ✅ Exito"
  else
    echo "  ❌ Error: $(echo $RESULT | grep -o '\"message\":\"[^\"]*\"' | head -1)"
  fi
  
  sleep 1
done