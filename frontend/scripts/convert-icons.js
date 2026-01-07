// Script para converter SVG para PNG nos tamanhos necessários para PWA
const fs = require('fs');
const path = require('path');

// Tamanhos necessários para PWA
const sizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

// Verificar se sharp está instalado
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('❌ Sharp não está instalado.');
  console.log('📦 Instala com: npm install --save-dev sharp');
  console.log('\n💡 Alternativa: Usa uma ferramenta online como:');
  console.log('   - https://convertio.co/svg-png/');
  console.log('   - https://cloudconvert.com/svg-to-png');
  console.log('\n📋 Tamanhos necessários:');
  sizes.forEach(s => console.log(`   - ${s.name} (${s.size}x${s.size}px)`));
  process.exit(1);
}

const publicDir = path.join(__dirname, '../public');
const svgFile = path.join(publicDir, '512x512.svg'); // Usar o maior SVG como base

async function convertIcons() {
  try {
    console.log('🔄 A converter ícones...\n');
    
    if (!fs.existsSync(svgFile)) {
      console.error(`❌ Ficheiro SVG não encontrado: ${svgFile}`);
      process.exit(1);
    }
    
    for (const { size, name } of sizes) {
      const outputPath = path.join(publicDir, name);
      
      await sharp(svgFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Fundo transparente
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Criado: ${name} (${size}x${size}px)`);
    }
    
    console.log('\n✨ Conversão concluída!');
    console.log('📝 Os ícones estão prontos para uso na PWA.');
    
  } catch (error) {
    console.error('❌ Erro ao converter ícones:', error.message);
    process.exit(1);
  }
}

convertIcons();

