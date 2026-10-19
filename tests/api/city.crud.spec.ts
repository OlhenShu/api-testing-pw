import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * From Swagger API Documentation, tag city:
 * POST /api/city        addCity
 * GET /api/city/{id}    getCity -> 200 CityResponse
 * PUT /api/city/{id}    updateCity
 * DELETE /api/city/{id} deleteCity
 * Schema CityRequest: name, latitude, longitude
 * with bearer JWT token (POST /api/signin)
 *
 * ROLE_MANAGER can read a city. Creating, updating, and deleting a city
 * returns 403. Each test signs in on its own.
 */

process.loadEnvFile('.env');

const kyiv = {
    id: 1,
    name: 'Київ',
    latitude: 50.4501,
    longitude: 30.5234,
};

function authHeader(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
}

async function signIn(request: APIRequestContext): Promise<string> {
    const response = await request.post('api/signin', {
        data: {
            email: process.env.USER_EMAIL,
            password: process.env.USER_PASSWORD,
        },
    });
    expect(response.status()).toBe(200);

    const body = (await response.json()) as { accessToken: string };
    return body.accessToken;
}

test.describe('Swagger City CRUD endpoints', () => {
    test('POST /api/city', async ({ request }) => {
        const token = await signIn(request);

        const response = await request.post('api/city', {
            headers: authHeader(token),
            data: {
                name: `Test City post ${Date.now()}`,
                latitude: 50.4501,
                longitude: 30.5234,
            },
        });
        expect(response.status()).toBe(403);
    });

    test('GET /api/city/{id}', async ({ request }) => {
        const token = await signIn(request);

        const response = await request.get(`api/city/${kyiv.id}`, {
            headers: authHeader(token),
        });
        expect(response.status()).toBe(200);
        expect(await response.json()).toEqual(kyiv);
    });

    test('PUT /api/city/{id}', async ({ request }) => {
        const token = await signIn(request);

        const response = await request.put(`api/city/${kyiv.id}`, {
            headers: authHeader(token),
            data: {
                name: kyiv.name,
                latitude: kyiv.latitude,
                longitude: kyiv.longitude,
            },
        });
        expect(response.status()).toBe(403);
    });

    test('DELETE /api/city/{id}', async ({ request }) => {
        const token = await signIn(request);

        const response = await request.delete(`api/city/${kyiv.id}`, {
            headers: authHeader(token),
        });
        expect(response.status()).toBe(403);
    });
});
