import { test, expect } from '@playwright/test';

/**
 * From Swagger API Documentation, tag city
 * GET /api/cities
 * GET /api/city/{id}
 * Schema CityResponse: id, name, latitude, longitude 
 */

test.describe('Swagger API Documentation city GET endpoints', () => {
    test('GET /api/cities', async ({ request }) => {
        const response = await request.get('api/cities');
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');
        const cities:{id:number, name:string, latitude:number, longitude:number}[] = await response.json();
        expect(cities.length).toBeGreaterThan(0);

        expect(cities).toContainEqual({
            id: 1,
            name: 'Київ',
            latitude: 50.4501,
            longitude: 30.5234,
        });
    });
    test('GET /api/city/{id}', async ({ request }) => {
        const response = await request.get('api/city/1');
        
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');
        const city:{id:number, name:string, latitude:number, longitude:number} = await response.json();
        expect(city).toEqual({
            id: 1,
            name: 'Київ',
            latitude: 50.4501,
            longitude: 30.5234,
        });
    });
});


