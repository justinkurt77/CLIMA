const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, 'public/palayan-tourism-map/data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.js'));

let allFeatures = [];

files.forEach(file => {
  let content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
  let startIdx = content.indexOf('{');
  let endIdx = content.lastIndexOf('}');
  
  if (startIdx !== -1 && endIdx !== -1) {
    let jsonStr = content.substring(startIdx, endIdx + 1);
    try {
      let geojson = JSON.parse(jsonStr);
      if (geojson.features && Array.isArray(geojson.features)) {
        geojson.features.forEach(f => {
          if (!f.properties) f.properties = {};
          f.properties.sourceCategory = file.replace('.js', '');
          allFeatures.push(f);
        });
      }
    } catch(e) {
      console.error('Error parsing ' + file + ':', e.message);
    }
  }
});

let outStr = '{"type":"FeatureCollection", "features": [\n';
outStr += allFeatures.map(f => JSON.stringify(f)).join(',\n');
outStr += '\n]}';

fs.writeFileSync(path.join(__dirname, 'public/palayan-tourism-map.json'), outStr);
console.log('Successfully formatted ' + allFeatures.length + ' features to public/palayan-tourism-map.json');
