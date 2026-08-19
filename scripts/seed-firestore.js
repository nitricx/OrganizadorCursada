const fs = require('fs');
const path = require('path');

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const PROJECT_ID = process.env.GCP_PROJECT || 'organizador-cursada-demo';

const BASE_URL = `http://${EMULATOR_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/**
 * Converts a plain JS object/array/primitive into Firestore REST API format
 */
function toFirestoreValue(val) {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue),
      },
    };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [key, value] of Object.entries(val)) {
      fields[key] = toFirestoreValue(value);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    fields[key] = toFirestoreValue(value);
  }
  return { fields };
}

async function seedDocument(collection, docId, data) {
  const url = `${BASE_URL}/${collection}/${docId}`;
  const body = toFirestoreFields(data);

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      console.log(`✅ Seeded document: ${collection}/${docId}`);
    } else {
      const errText = await response.text();
      console.error(`❌ Failed seeding ${docId}:`, response.status, errText);
    }
  } catch (err) {
    console.error(`❌ Connection error seeding ${docId}:`, err.message);
  }
}

async function runSeed() {
  console.log(`🌱 Starting Firestore Seeding at ${BASE_URL}...`);

  const seedDataDir = path.join(__dirname, 'seed-data');
  if (!fs.existsSync(seedDataDir)) {
    console.error(`❌ Seed directory not found: ${seedDataDir}`);
    return;
  }

  const files = fs.readdirSync(seedDataDir).filter((file) => file.endsWith('.json'));

  if (files.length === 0) {
    console.warn(`⚠️ No JSON seed files found in ${seedDataDir}`);
    return;
  }

  for (const file of files) {
    const filePath = path.join(seedDataDir, file);
    try {
      const plan = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (plan && plan.id && plan.name) {
        await seedDocument('workshop_plans', plan.id, plan);
      } else {
        console.warn(`⚠️ Skipping ${file}: Missing required "id" or "name" property.`);
      }
    } catch (err) {
      console.error(`❌ Error parsing ${file}:`, err.message);
    }
  }

  console.log('🎉 Seeding completed successfully!');
}

runSeed().catch((err) => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
