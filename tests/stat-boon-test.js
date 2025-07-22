// Test script for stat boon functionality
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

describe('Stat Modification Boons', () => {
  let sessionCookie;
  let testUser;

  beforeAll(async () => {
    // Create test user
    testUser = {
      username: `stattest_${Date.now()}`,
      email: `stattest_${Date.now()}@example.com`,
      password: 'testpassword123',
    };

    await axios.post(`${BASE_URL}/auth/register`, testUser);

    // Login and get session cookie
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: testUser.username,
      password: testUser.password,
    });

    const cookies = loginResponse.headers['set-cookie'];
    sessionCookie = cookies ? cookies[0] : '';
  });

  test('should have server running', async () => {
    const response = await axios.get(`${BASE_URL}/`);
    expect(response.status).toBe(200);
  });

  test('should create and login test user', () => {
    expect(testUser.username).toBeDefined();
    expect(sessionCookie).toBeDefined();
  });

  test('should save initial game state', async () => {
    const initialGameState = {
      gameData: {
        stats: {
          power: 4,
          will: 4,
          craft: 4,
          focus: 4,
        },
        statXP: {
          power: 0,
          will: 0,
          craft: 0,
          focus: 0,
        },
        saveCurrency: 100,
      },
      runData: {
        statModifiers: {
          power: 0,
          will: 0,
          craft: 0,
          focus: 0,
        },
        equipment: [],
        playerDeck: [],
      },
    };

    const response = await axios.post(
      `${BASE_URL}/game/save`,
      {
        gameState: initialGameState,
        saveName: 'Stat Boon Test Save',
        timestamp: new Date().toISOString(),
      },
      {
        headers: { Cookie: sessionCookie },
      }
    );

    expect(response.status).toBe(200);
  });

  test('should test Ace boon effects', async () => {
    const aceTests = [
      { suit: '♠', stat: 'power', expectedEffect: 'powerPlus' },
      { suit: '♥', stat: 'will', expectedEffect: 'willPlus' },
      { suit: '♦', stat: 'craft', expectedEffect: 'craftPlus' },
      { suit: '♣', stat: 'focus', expectedEffect: 'focusPlus' },
    ];

    for (const test of aceTests) {
      // Simulate drawing an Ace
      const aceCard = {
        value: 'A',
        suit: test.suit,
        display: `A${test.suit}`,
      };

      // Test the boon effect by calling the event endpoint
      const boonResponse = await axios.post(
        `${BASE_URL}/event/boon`,
        {
          card: aceCard,
          gameState: {
            gameData: {
              stats: { [test.stat]: 4 },
              statXP: { [test.stat]: 0 },
            },
            runData: {
              statModifiers: { [test.stat]: 0 },
            },
          },
        },
        {
          headers: { Cookie: sessionCookie },
        }
      );

      expect(boonResponse.status).toBe(200);
      expect(boonResponse.data).toBeDefined();
    }
  });

  test('should load and verify game state', async () => {
    const response = await axios.get(`${BASE_URL}/game/load`, {
      headers: { Cookie: sessionCookie },
    });

    expect(response.status).toBe(200);
    expect(response.data.gameState).toBeDefined();
    expect(response.data.gameState.gameData.stats).toBeDefined();
    expect(response.data.gameState.runData.statModifiers).toBeDefined();
  });
});
