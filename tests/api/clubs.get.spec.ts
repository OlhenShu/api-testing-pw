import { expect, test } from '@playwright/test';

/**
 * From Swagger API Documentation, tag club
 * GET /api/clubs
 * GET /api/club/{id}
 * Schema ClubResponse: id, name, ageFrom, ageTo, categories, description
 */

const knownClub = {
    id: 1,
    name: 'Jerome IT School',
    ageFrom: 2,
    ageTo: 18,
    category: {
        id: 4,
        name: 'Програмування, робототехніка, STEM',
    },
};

test.describe('Swagger API Documentation club GET endpoints', () => {
    test('GET /api/clubs', async ({ request }) => {
        const response = await request.get('api/clubs');
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');

        const clubs: { id: number; name: string; ageFrom: number; ageTo: number }[] = await response.json();
        expect(clubs.length).toBeGreaterThan(0);
        expect(clubs).toEqual(expect.arrayContaining([
            expect.objectContaining({
                id: knownClub.id,
                name: knownClub.name,
                ageFrom: knownClub.ageFrom,
                ageTo: knownClub.ageTo,
            }),
        ]));
    });

    test('GET /api/club/{id}', async ({ request }) => {
        const response = await request.get(`api/club/${knownClub.id}`);
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');

        const club: {
            id: number;
            name: string;
            ageFrom: number;
            ageTo: number;
            categories: { id: number; name: string }[];
        } = await response.json();
        expect(club).toEqual(expect.objectContaining({
            id: knownClub.id,
            name: knownClub.name,
            ageFrom: knownClub.ageFrom,
            ageTo: knownClub.ageTo,
        }));
        expect(club.categories).toEqual(expect.arrayContaining([
            expect.objectContaining(knownClub.category),
        ]));
    });
});
