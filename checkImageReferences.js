// Node.js script to check image usage consistency

const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, 'public', 'lovable-uploads');
const showcaseFile = path.join(__dirname, 'src', 'components', 'ImageShowcase.tsx');

const uploadedImages = fs.readdirSync(uploadsDir).filter(file => file.endsWith('.png'));

const showcaseContent = fs.readFileSync(showcaseFile, 'utf8');
const usedImagePaths = Array.from(showcaseContent.matchAll(/\/lovable-uploads\/([a-z0-9\-]+\.png)/g)).map(match => match[1]);

const unusedImages = uploadedImages.filter(file => !usedImagePaths.includes(file));
const missingImages = usedImagePaths.filter(file => !uploadedImages.includes(file));

console.log(`✅ 上传图片数: ${uploadedImages.length}，代码引用数: ${usedImagePaths.length}`);
console.log(`🧼 未被引用的图片:`);
unusedImages.forEach(img => console.log('  - ' + img));

console.log(`❌ 代码中引用但缺失的图片:`);
missingImages.forEach(img => console.log('  - ' + img));
