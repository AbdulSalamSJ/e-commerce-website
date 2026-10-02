import assert from 'node:assert/strict';

async function runE2E() {
  console.log('--- Starting Theme E2E Live Server Tests ---');
  const BASE_URL = 'http://localhost:4000/api';

  // 1. Fetch public shops
  console.log('1. Testing GET /api/shops...');
  const shopsRes = await fetch(`${BASE_URL}/shops`);
  assert.equal(shopsRes.status, 200);
  const { shops } = await shopsRes.json() as any;
  console.log(`Found ${shops.length} active shops:`);
  for (const s of shops) {
    console.log(`  - ${s.name} (${s.slug}): theme = "${s.theme}"`);
    assert.ok(s.theme, `Shop ${s.name} must have a theme`);
  }

  // 2. Login as SuperAdmin
  console.log('\n2. Testing SuperAdmin Login...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'superadmin@platform.local',
      password: 'SuperAdmin#2026!',
    }),
  });
  assert.equal(loginRes.status, 200);
  const { token } = await loginRes.json() as any;
  assert.ok(token, 'Must return JWT token');
  console.log('SuperAdmin logged in successfully.');

  // 3. SuperAdmin creates a shop with custom theme 'luxury-gold'
  console.log('\n3. Creating new shop with theme "luxury-gold"...');
  const testSlug = `aurora-boutique-${Date.now().toString().slice(-4)}`;
  const createRes = await fetch(`${BASE_URL}/superadmin/shops`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Aurora Haute Parfumerie',
      slug: testSlug,
      description: 'Exclusive artisanal fragrance collection and luxury aromatics.',
      theme: 'luxury-gold',
    }),
  });
  assert.equal(createRes.status, 201);
  const { shop: createdShop } = await createRes.json() as any;
  console.log(`Created shop: ${createdShop.name}, assigned theme: "${createdShop.theme}"`);
  assert.equal(createdShop.theme, 'luxury-gold');

  // 4. Update the shop's theme to 'sunset-flare'
  console.log('\n4. Updating shop theme to "sunset-flare"...');
  const updateRes = await fetch(`${BASE_URL}/superadmin/shops/${createdShop.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      theme: 'sunset-flare',
    }),
  });
  assert.equal(updateRes.status, 200);
  const { shop: updatedShop } = await updateRes.json() as any;
  console.log(`Updated shop: ${updatedShop.name}, new theme: "${updatedShop.theme}"`);
  assert.equal(updatedShop.theme, 'sunset-flare');

  // 5. Customer fetches shop by slug
  console.log('\n5. Customer fetching shop by slug...');
  const slugRes = await fetch(`${BASE_URL}/shops/${testSlug}`);
  assert.equal(slugRes.status, 200);
  const { shop: fetchedShop } = await slugRes.json() as any;
  assert.equal(fetchedShop.theme, 'sunset-flare');
  console.log(`Customer successfully retrieved shop "${fetchedShop.name}" with theme "${fetchedShop.theme}"`);

  console.log('\nAll E2E live server theme tests PASSED successfully!');
}

runE2E().catch((err) => {
  console.error('E2E test failed:', err);
  process.exit(1);
});
