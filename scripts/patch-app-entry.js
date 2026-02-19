#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'frontend', 'src', 'App.js');
let s = fs.readFileSync(filePath, 'utf8');

// 1) Add EntryPage import after ResetPasswordPage (if not already there)
if (!s.includes("import('./pages/EntryPage')")) {
  s = s.replace(
    "const ResetPasswordPage = lazyWithRetry(() => import('./pages/ResetPasswordPage'));\nconst PublicBookingPage",
    "const ResetPasswordPage = lazyWithRetry(() => import('./pages/ResetPasswordPage'));\nconst EntryPage = lazyWithRetry(() => import('./pages/EntryPage'));\nconst PublicBookingPage"
  );
  console.log('Added EntryPage import.');
} else {
  console.log('EntryPage import already present.');
}

// 2) Add route "/" after reset-password (if not already there)
if (!s.includes('path="/" element={!authState.isAuthenticated ? <EntryPage />')) {
  s = s.replace(
    '<Route path="/reset-password" element={<ResetPasswordPage />} />\n          <Route path="/marcar"',
    '<Route path="/reset-password" element={<ResetPasswordPage />} />\n          <Route path="/" element={!authState.isAuthenticated ? <EntryPage /> : (authState.role === \'user\' ? <Navigate to="/dashboard" replace /> : <Navigate to="/admin/dashboard" replace />)} />\n          <Route path="/marcar"'
  );
  console.log('Added route "/" for EntryPage.');
} else {
  console.log('Route "/" already present.');
}

// 3) Catch-all: redirect to "/" instead of "/login" (only the inline one, not "return <Navigate")
if (s.includes('                : <Navigate to="/login" replace />')) {
  s = s.replace('                : <Navigate to="/login" replace />', '                : <Navigate to="/" replace />');
  console.log('Catch-all redirect updated to "/".');
} else if (s.includes('                : <Navigate to="/" replace />')) {
  console.log('Catch-all already redirects to "/".');
} else {
  console.log('Catch-all pattern not found - check App.js manually.');
}

try {
  fs.writeFileSync(filePath, s);
  console.log('App.js updated.');
} catch (err) {
  if (err.code === 'EACCES') {
    const outPath = path.join(__dirname, '..', 'frontend', 'src', 'App.PATCHED.js');
    fs.writeFileSync(outPath, s);
    console.log('Ficheiro original inacessível. Conteúdo gravado em: frontend/src/App.PATCHED.js');
    console.log('Substitui manualmente: cp frontend/src/App.PATCHED.js frontend/src/App.js');
  } else throw err;
}
