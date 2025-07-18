import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testBasicFunctionality() {
  try {
    // Test 1: Server is running
    await axios.get(`${BASE_URL}/`);

    // Test 2: Registration
    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123',
    };

    await axios.post(`${BASE_URL}/auth/register`, testUser);

    // Test 3: Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: testUser.username,
      password: testUser.password,
    });

    // Get session cookie
    const cookies = loginResponse.headers['set-cookie'];
    const sessionCookie = cookies ? cookies[0] : '';

    // Test 4: Authentication check
    await axios.get(`${BASE_URL}/auth/check`, {
      headers: { Cookie: sessionCookie },
    });

    // Test 5: Game save
    const gameData = {
      gameState: { player: { health: 100, gold: 50 }, currentRealm: 'home' },
      saveName: 'Test Save',
      timestamp: new Date().toISOString(),
    };

    await axios.post(`${BASE_URL}/game/save`, gameData, {
      headers: { Cookie: sessionCookie },
    });

    // Test 6: Game load
    await axios.get(`${BASE_URL}/game/saves`, {
      headers: { Cookie: sessionCookie },
    });
  } catch (error) {
    process.exit(1);
  }
}

// Run tests
testBasicFunctionality();
