const pptxgen = require("pptxgenjs");
const path = require("path");

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_16x9';

// Colors
const COLOR_PRIMARY = '0F172A'; // Dark slate
const COLOR_SECONDARY = '3B82F6'; // Bright blue
const COLOR_ACCENT = 'F59E0B'; // Amber/Gold
const COLOR_LIGHT = 'F8FAFC'; // Off white
const COLOR_TEXT = '334155'; // Slate gray

// Ensure absolute path for the image
const logoPath = path.resolve(__dirname, 'palayan_ict.png');

// --- SLIDE 1: Title Slide ---
const slide1 = pptx.addSlide();
slide1.background = { color: COLOR_PRIMARY };

// Decorative shapes
slide1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '20%', h: '100%', fill: { color: COLOR_SECONDARY } });
slide1.addShape(pptx.ShapeType.triangle, { x: '10%', y: '50%', w: 3, h: 4, fill: { color: COLOR_ACCENT }, rotate: 90 });

try {
  slide1.addImage({ path: logoPath, x: '80%', y: '5%', w: 1.5, h: 1.5, sizing: { type: 'contain' } });
} catch (e) {
  console.log("Could not load logo:", e);
}

slide1.addText('PalaSumbong', {
  x: '25%', y: '35%', w: '70%', h: 1.5,
  fontSize: 64, color: 'FFFFFF', bold: true, fontFace: 'Segoe UI'
});
slide1.addText('Citizen Grievance & Reporting System', {
  x: '25%', y: '55%', w: '70%', h: 1,
  fontSize: 28, color: COLOR_ACCENT, bold: true, fontFace: 'Segoe UI'
});
slide1.addText('Empowering the Community through Technology', {
  x: '25%', y: '65%', w: '70%', h: 0.5,
  fontSize: 18, color: '94A3B8', fontFace: 'Segoe UI'
});

// --- SLIDE 2: What is PalaSumbong? ---
const slide2 = pptx.addSlide();
slide2.background = { color: COLOR_LIGHT };

// Left sidebar for modern look
slide2.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '35%', h: '100%', fill: { color: COLOR_SECONDARY } });
slide2.addText('What is\nPalaSumbong?', {
  x: '2%', y: '10%', w: '30%', h: 2,
  fontSize: 42, color: 'FFFFFF', bold: true, fontFace: 'Segoe UI'
});
try {
  slide2.addImage({ path: logoPath, x: '2%', y: '75%', w: 1, h: 1, sizing: { type: 'contain' } });
} catch (e) {}

slide2.addText(
  'A modern, user-friendly platform designed to empower citizens to easily report local issues, incidents, and grievances directly to the appropriate city departments.',
  { x: '40%', y: '15%', w: '55%', h: 2, fontSize: 24, color: COLOR_PRIMARY, fontFace: 'Segoe UI', lineSpacing: 32 }
);

const s2Points = [
  { text: 'Connects citizens and the local government transparently.' },
  { text: 'Promotes accountability in public service.' },
  { text: 'Ensures faster response to community needs.' }
];

s2Points.forEach((pt, i) => {
  // Add checkmark icon (simulated with shape/text)
  slide2.addShape(pptx.ShapeType.ellipse, { x: '40%', y: 4 + (i * 1.2), w: 0.5, h: 0.5, fill: { color: COLOR_ACCENT } });
  slide2.addText('✓', { x: '40%', y: 4 + (i * 1.2), w: 0.5, h: 0.5, fontSize: 18, color: 'FFFFFF', align: 'center', bold: true });
  slide2.addText(pt.text, { x: '46%', y: 3.9 + (i * 1.2), w: '50%', h: 0.7, fontSize: 20, color: COLOR_TEXT, fontFace: 'Segoe UI' });
});

// --- SLIDE 3: Key Features ---
const slide3 = pptx.addSlide();
slide3.background = { color: 'FFFFFF' };

slide3.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '15%', fill: { color: COLOR_PRIMARY } });
slide3.addText('Key Platform Features', {
  x: '5%', y: '2%', w: '90%', h: '10%',
  fontSize: 36, color: 'FFFFFF', bold: true, fontFace: 'Segoe UI'
});

// Feature Cards
const features = [
  { title: '📍 Geolocation', desc: 'Pinpoint the exact location of the incident on an interactive map for precise reporting.', color: 'EFF6FF', borderColor: 'BFDBFE' },
  { title: '📸 Photo Evidence', desc: 'Upload images to provide clear visual evidence of the issue directly from your phone.', color: 'FFFBEB', borderColor: 'FDE68A' },
  { title: '🔄 Live Tracking', desc: 'Citizens can track the status of their reports (Pending, In Progress, Resolved) in real-time.', color: 'F0FDF4', borderColor: 'BBF7D0' }
];

features.forEach((feat, i) => {
  const xPos = 0.5 + (i * 3.2);
  // Card background
  slide3.addShape(pptx.ShapeType.roundRect, { x: xPos, y: 1.5, w: 3, h: 4, fill: { color: feat.color }, line: { color: feat.borderColor, width: 2 }, rectRadius: 0.1 });
  // Card Title
  slide3.addText(feat.title, { x: xPos + 0.1, y: 1.8, w: 2.8, h: 0.8, fontSize: 22, color: COLOR_PRIMARY, bold: true, fontFace: 'Segoe UI', align: 'center' });
  // Card Desc
  slide3.addText(feat.desc, { x: xPos + 0.2, y: 2.8, w: 2.6, h: 2, fontSize: 18, color: COLOR_TEXT, fontFace: 'Segoe UI', align: 'center', lineSpacing: 24 });
});

// --- SLIDE 4: Participating Departments ---
const slide4 = pptx.addSlide();
slide4.background = { color: COLOR_LIGHT };

slide4.addText('Participating Departments', {
  x: '5%', y: '5%', w: '90%', h: 1,
  fontSize: 36, color: COLOR_PRIMARY, bold: true, fontFace: 'Segoe UI'
});
slide4.addText('Reports are automatically routed to the right office for immediate action.', {
  x: '5%', y: '15%', w: '90%', h: 0.8,
  fontSize: 20, color: COLOR_TEXT, fontFace: 'Segoe UI'
});

const depts = [
  'CDRRMO', 'ENRO', 'CITY TRAFFIC', 
  'CITY VET OFFICE', 'ENGINEERING', 'GENERAL SERVICES'
];

depts.forEach((dept, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const xPos = 0.5 + (col * 3.2);
  const yPos = 2.5 + (row * 1.5);
  
  slide4.addShape(pptx.ShapeType.roundRect, { x: xPos, y: yPos, w: 3, h: 1, fill: { color: COLOR_PRIMARY }, rectRadius: 0.2 });
  slide4.addText(dept, { x: xPos, y: yPos, w: 3, h: 1, fontSize: 20, color: 'FFFFFF', bold: true, fontFace: 'Segoe UI', align: 'center' });
});

// --- SLIDE 5: How It Works ---
const slide5 = pptx.addSlide();
slide5.background = { color: 'FFFFFF' };

slide5.addText('How It Works', {
  x: '0%', y: '5%', w: '100%', h: 1,
  fontSize: 36, color: COLOR_PRIMARY, bold: true, fontFace: 'Segoe UI', align: 'center'
});

const steps = [
  { num: '1', title: 'Report', desc: 'Citizen submits issue with details & photo' },
  { num: '2', title: 'Route', desc: 'System automatically notifies the department' },
  { num: '3', title: 'Resolve', desc: 'Department fixes issue & updates status' }
];

steps.forEach((step, i) => {
  const xCenter = 1.6 + (i * 3.3);
  // Circle for number
  slide5.addShape(pptx.ShapeType.ellipse, { x: xCenter - 0.5, y: 2, w: 1, h: 1, fill: { color: COLOR_SECONDARY } });
  slide5.addText(step.num, { x: xCenter - 0.5, y: 2, w: 1, h: 1, fontSize: 32, color: 'FFFFFF', bold: true, align: 'center' });
  
  // Title
  slide5.addText(step.title, { x: xCenter - 1.5, y: 3.2, w: 3, h: 0.5, fontSize: 24, color: COLOR_PRIMARY, bold: true, align: 'center' });
  
  // Desc
  slide5.addText(step.desc, { x: xCenter - 1.25, y: 3.8, w: 2.5, h: 1, fontSize: 16, color: COLOR_TEXT, align: 'center' });
  
  // Arrow
  if (i < 2) {
    slide5.addShape(pptx.ShapeType.rightArrow, { x: xCenter + 1.2, y: 2.25, w: 0.8, h: 0.5, fill: { color: COLOR_ACCENT } });
  }
});

// --- SLIDE 6: Thank You ---
const slide6 = pptx.addSlide();
slide6.background = { color: COLOR_PRIMARY };

slide6.addShape(pptx.ShapeType.rect, { x: 0, y: '85%', w: '100%', h: '15%', fill: { color: COLOR_SECONDARY } });

slide6.addText('Thank You', {
  x: 0, y: '35%', w: '100%', h: 1.5,
  fontSize: 56, color: 'FFFFFF', bold: true, align: 'center', fontFace: 'Segoe UI'
});
slide6.addText('Building a Better Community, Together.', {
  x: 0, y: '55%', w: '100%', h: 1,
  fontSize: 24, color: COLOR_ACCENT, align: 'center', fontFace: 'Segoe UI'
});

try {
  slide6.addImage({ path: logoPath, x: '45%', y: '10%', w: 1.5, h: 1.5, sizing: { type: 'contain' } });
} catch (e) {}

// Save
pptx.writeFile({ fileName: 'PalaSumbong_Presentation_v2.pptx' })
  .then(fileName => {
    console.log(`Presentation generated successfully as ${fileName}`);
  })
  .catch(err => {
    console.error('Error generating presentation:', err);
  });
