import { initDB, getDB } from './dist/db/db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const items = [
  {"sku":"002004201","name":"Smart Waste Sensor Retrofit","prodMinPerUnit":3,"montMinPerUnit":5},
  {"sku":"002013011","name":"Smart Waste Station 120 4-fach einseitig weiß v3","prodMinPerUnit":51,"montMinPerUnit":10},
  {"sku":"002013012","name":"Smart Waste Station 120 4-fach einseitig anthrazit v3","prodMinPerUnit":51,"montMinPerUnit":10},
  {"sku":"002014011","name":"Smart Waste Station 90 2-fach einseitig weiß v3","prodMinPerUnit":29,"montMinPerUnit":8},
  {"sku":"002014012","name":"Smart Waste Station 90 2-fach einseitig anthrazit v3","prodMinPerUnit":29,"montMinPerUnit":8},
  {"sku":"002016011","name":"Smart Waste Station 60 2-fach einseitig weiß v3","prodMinPerUnit":29,"montMinPerUnit":8},
  {"sku":"002016012","name":"Smart Waste Station 60 2-fach einseitig anthrazit v3","prodMinPerUnit":29,"montMinPerUnit":8},
  {"sku":"002003402","name":"Smart Waste Bin SchnappHans XL schwarz v2","prodMinPerUnit":8,"montMinPerUnit":3}
];

const employees = [
  {"name":"Anna","role":"production","weeklyHours":40,"days":{"mo":true,"di":false,"mi":true,"do":false,"fr":true,"sa":false,"so":false},"color":"#7dd3fc"},
  {"name":"Ben","role":"montage","weeklyHours":32,"days":{"mo":true,"di":false,"mi":true,"do":false,"fr":true,"sa":false,"so":false},"color":"#86efac"},
  {"name":"Chris","role":"montage","weeklyHours":20,"days":{"mo":true,"di":false,"mi":true,"do":false,"fr":true,"sa":false,"so":false},"color":"#fca5a5"}
];

function daysToBitmask(days) {
  let mask = 0;
  if (days.mo) mask |= (1 << 0); // Monday = bit 0
  if (days.di) mask |= (1 << 1); // Tuesday = bit 1
  if (days.mi) mask |= (1 << 2); // Wednesday = bit 2
  if (days.do) mask |= (1 << 3); // Thursday = bit 3
  if (days.fr) mask |= (1 << 4); // Friday = bit 4
  if (days.sa) mask |= (1 << 5); // Saturday = bit 5
  if (days.so) mask |= (1 << 6); // Sunday = bit 6
  return mask;
}

async function seed() {
  const dbPath = join(__dirname, 'dev.db');
  const schemaPath = join(__dirname, '..', 'docs', 'schema.sql');
  
  console.log('Initializing database...');
  await initDB({ dbPath, schemaPath });
  
  const db = getDB();
  const settingsRepo = db.getSettingsRepo();
  
  console.log('\nSeeding items...');
  for (const item of items) {
    await settingsRepo.upsertItem({
      sku: item.sku,
      name: item.name,
      prodMinPerUnit: item.prodMinPerUnit,
      montMinPerUnit: item.montMinPerUnit,
      active: true
    });
    console.log(`  ✓ ${item.sku} - ${item.name}`);
  }
  
  console.log('\nSeeding employees...');
  for (const emp of employees) {
    const daysMask = daysToBitmask(emp.days);
    const id = await settingsRepo.upsertEmployee({
      name: emp.name,
      role: emp.role,
      weeklyHours: emp.weeklyHours,
      daysMask,
      active: true,
      color: emp.color
    });
    const daysStr = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
      .filter((_, i) => (daysMask & (1 << i)) !== 0)
      .join(', ');
    console.log(`  ✓ ${emp.name} (${emp.role}, ${emp.weeklyHours}h/Woche, ${daysStr}) [ID: ${id}]`);
  }
  
  console.log('\n✅ Seed completed successfully!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
