#!/usr/bin/env node
/**
 * Patch WorkoutContext.js: corrigir bug dos performanceIds e sendBeacon.
 * Executar: node scripts/patch-workout-context.js
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'context', 'WorkoutContext.js');
let s = fs.readFileSync(filePath, 'utf8');

// 1) Adicionar collectedPerformanceIds antes do bloco "Gravar todos os sets"
const anchor1 = '        }\n\n        // Gravar todos os sets no backend ANTES de navegar';
const insert1 = '        }\n\n        /** IDs das performances gravadas no backend (para associar à sessão permanente) */\n        let collectedPerformanceIds = [];\n\n        // Gravar todos os sets no backend ANTES de navegar';
if (s.includes('let collectedPerformanceIds = [];')) {
  console.log('Patch 1 already applied (collectedPerformanceIds).');
} else if (s.includes(anchor1)) {
  s = s.replace(anchor1, insert1);
  console.log('Patch 1 applied: added collectedPerformanceIds.');
} else {
  console.warn('Patch 1: anchor not found.');
}

// 2) No "já foi gravado", adicionar collectedPerformanceIds.push(setData.id)
const old2 = `                            logger.log(\`Set \${setData.planExerciseId}-\${setData.setNumber} já foi gravado (ID: \${setData.id}), a saltar...\`);
                            successfulSets.push(setData);
                            continue;`;
const new2 = `                            logger.log(\`Set \${setData.planExerciseId}-\${setData.setNumber} já foi gravado (ID: \${setData.id}), a saltar...\`);
                            successfulSets.push(setData);
                            collectedPerformanceIds.push(setData.id);
                            continue;`;
if (s.includes('collectedPerformanceIds.push(setData.id);')) {
  console.log('Patch 2 already applied (push setData.id).');
} else if (s.includes(old2)) {
  s = s.replace(old2, new2);
  console.log('Patch 2 applied: push setData.id when set already has id.');
} else {
  console.warn('Patch 2: anchor not found.');
}

// 3) Guardar retorno de logSet e fazer push do saved.id
const old3 = `                        await logSet(fullSetData);
                        successfulSets.push(setData);
                        logger.log(\`Set \${setData.planExerciseId}-\${setData.setNumber} gravado com sucesso\`)`;
const new3 = `                        const saved = await logSet(fullSetData);
                        successfulSets.push(setData);
                        if (saved?.id) {
                            collectedPerformanceIds.push(saved.id);
                        }
                        logger.log(\`Set \${setData.planExerciseId}-\${setData.setNumber} gravado com sucesso\`)`;
if (s.includes('const saved = await logSet(fullSetData);')) {
  console.log('Patch 3 already applied (saved from logSet).');
} else if (s.includes('await logSet(fullSetData);')) {
  s = s.replace(old3, new3);
  console.log('Patch 3 applied: capture saved id from logSet.');
} else {
  console.warn('Patch 3: anchor not found.');
}

// 4) Usar collectedPerformanceIds na criação da sessão
const old4 = 'const performanceIds = completedSets.map(s => s.id).filter(Boolean);';
const new4 = 'const performanceIds = collectedPerformanceIds;';
if (s.includes(new4)) {
  console.log('Patch 4 already applied (use collectedPerformanceIds).');
} else if (s.includes(old4)) {
  s = s.replace(old4, new4);
  console.log('Patch 4 applied: use collectedPerformanceIds for session.');
} else {
  console.warn('Patch 4: anchor not found.');
}

// 5) Remover sendBeacon para URL inexistente e documentar
const old5 = `                try {
                    persistWorkout(activeWorkout);
                    // Usar sendBeacon como fallback para garantir que os dados são enviados
                    if (navigator.sendBeacon) {
                        const data = JSON.stringify(activeWorkout);
                        navigator.sendBeacon('/api/workout/save-draft', data);
                    }
                } catch (error) {`;
const new5 = `                try {
                    // persistWorkout já chama saveTrainingSessionDraftService (POST /progress/training-session/draft).
                    // sendBeacon não foi usado: a rota /api/workout/save-draft não existe e o beacon não envia Authorization.
                    persistWorkout(activeWorkout);
                } catch (error) {`;
if (s.includes("navigator.sendBeacon('/api/workout/save-draft'")) {
  s = s.replace(old5, new5);
  console.log('Patch 5 applied: removed invalid sendBeacon.');
} else if (s.includes('persistWorkout(activeWorkout);') && !s.includes('sendBeacon')) {
  console.log('Patch 5 already applied or sendBeacon not present.');
} else {
  console.warn('Patch 5: anchor not found.');
}

// Escrever para ficheiro alternativo se o original der EACCES (ex.: ficheiro aberto no IDE)
const outPath = filePath.replace('WorkoutContext.js', 'WorkoutContext.PATCHED.js');
try {
  fs.writeFileSync(filePath, s);
  console.log('Done. WorkoutContext.js updated.');
} catch (err) {
  if (err.code === 'EACCES') {
    fs.writeFileSync(outPath, s);
    console.log('Done. Ficheiro original inacessível (possivelmente aberto no IDE). Conteúdo gravado em:', outPath);
    console.log('Substitui manualmente: cp frontend/src/context/WorkoutContext.PATCHED.js frontend/src/context/WorkoutContext.js');
  } else {
    throw err;
  }
}
