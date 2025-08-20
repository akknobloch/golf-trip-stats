const fs = require('fs');
const path = require('path');

// SVG content from your favicon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <!-- Green gradient background -->
  <defs>
    <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#059669;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#047857;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle with green gradient -->
  <circle cx="16" cy="16" r="16" fill="url(#greenGradient)"/>
  
  <!-- Trophy icon -->
  <g transform="translate(8, 6)">
    <!-- Trophy base -->
    <ellipse cx="8" cy="18" rx="6" ry="2" fill="#fbbf24" stroke="#d97706" stroke-width="0.5"/>
    
    <!-- Trophy cup -->
    <path d="M 4 18 L 4 8 Q 4 6 6 6 L 10 6 Q 12 6 12 8 L 12 18 Z" fill="#fbbf24" stroke="#d97706" stroke-width="0.5"/>
    
    <!-- Trophy handles -->
    <path d="M 4 10 Q 2 10 2 12 Q 2 14 4 14" fill="none" stroke="#d97706" stroke-width="1" stroke-linecap="round"/>
    <path d="M 12 10 Q 14 10 14 12 Q 14 14 12 14" fill="none" stroke="#d97706" stroke-width="1" stroke-linecap="round"/>
    
    <!-- Trophy top rim -->
    <ellipse cx="8" cy="8" rx="4" ry="1" fill="#d97706"/>
    
    <!-- Trophy shine -->
    <ellipse cx="7" cy="9" rx="2" ry="0.5" fill="#fef3c7" opacity="0.8"/>
  </g>
</svg>`;

// Create a simple HTML file that will render the SVG and allow downloading
const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Apple Touch Icon Generator</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .icon { margin: 20px; display: inline-block; text-align: center; }
        canvas { border: 1px solid #ccc; }
        button { margin: 10px; padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Apple Touch Icons Generated</h1>
    <p>Your Apple touch icons have been created successfully!</p>
    
    <div class="icon">
        <h3>180x180 (iPhone 6 Plus and newer)</h3>
        <canvas id="canvas180" width="180" height="180"></canvas><br>
        <button onclick="downloadIcon(180)">Download 180x180</button>
    </div>
    
    <div class="icon">
        <h3>152x152 (iPad)</h3>
        <canvas id="canvas152" width="152" height="152"></canvas><br>
        <button onclick="downloadIcon(152)">Download 152x152</button>
    </div>
    
    <div class="icon">
        <h3>120x120 (iPhone 4/4S)</h3>
        <canvas id="canvas120" width="120" height="120"></canvas><br>
        <button onclick="downloadIcon(120)">Download 120x120</button>
    </div>
    
    <div class="icon">
        <h3>76x76 (iPad mini)</h3>
        <canvas id="canvas76" width="76" height="76"></canvas><br>
        <button onclick="downloadIcon(76)">Download 76x76</button>
    </div>

    <script>
        const svgContent = \`${svgContent.replace(/`/g, '\\`')}\`;
        
        function renderIcon(size) {
            const canvas = document.getElementById(\`canvas\${size}\`);
            const ctx = canvas.getContext('2d');
            
            const img = new Image();
            const svgBlob = new Blob([svgContent], {type: 'image/svg+xml'});
            const url = URL.createObjectURL(svgBlob);
            
            img.onload = function() {
                ctx.clearRect(0, 0, size, size);
                ctx.drawImage(img, 0, 0, size, size);
                URL.revokeObjectURL(url);
            };
            
            img.src = url;
        }

        function downloadIcon(size) {
            const canvas = document.getElementById(\`canvas\${size}\`);
            const link = document.createElement('a');
            link.download = \`apple-touch-icon-\${size}x\${size}.png\`;
            link.href = canvas.toDataURL();
            link.click();
        }

        window.onload = function() {
            renderIcon(180);
            renderIcon(152);
            renderIcon(120);
            renderIcon(76);
        };
    </script>
</body>
</html>`;

// Write the HTML file
fs.writeFileSync(path.join(__dirname, 'public', 'apple-touch-icon-generator.html'), htmlContent);

console.log('✅ Apple touch icon generator created at: public/apple-touch-icon-generator.html');
console.log('');
console.log('📱 To generate Apple touch icons:');
console.log('1. Open http://localhost:3000/apple-touch-icon-generator.html in your browser');
console.log('2. Click the download buttons to save each icon size');
console.log('3. Save them in your public/ folder with these names:');
console.log('   - apple-touch-icon.png (180x180)');
console.log('   - apple-touch-icon-152x152.png');
console.log('   - apple-touch-icon-120x120.png');
console.log('   - apple-touch-icon-76x76.png');
console.log('');
console.log('🎯 Your layout.tsx has already been updated with the necessary meta tags!');
