import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * From Swagger API Documentation, tag club:
 * POST /api/club       addClub -> 201 SuccessCreatedClub
 * GET /api/club/{id}   getClubById -> 200 ClubResponse
 * PUT /api/club/{id}   updateClub -> 200 SuccessUpdatedClub
 * DELETE /api/club/{id} deleteClub -> 200
 * Schema ClubProfile: name, description, ageFrom, ageTo, categoriesName
 * with bearer JWT token (POST /api/signin)
 *
 * Each test signs in and prepares its own club. Nothing is shared between tests.
 */

process.loadEnvFile('.env');

const categoryName = 'Програмування, робототехніка, STEM';

type DraftDescription = {
    blocks: { text: string }[];
};

function draftDescription(text: string): string {
    return JSON.stringify({
        blocks: [{
            key: 'test1',
            text,
            type: 'unstyled',
            depth: 0,
            inlineStyleRanges: [],
            entityRanges: [],
            data: {},
        }],
        entityMap: {},
    });
}

function expectDescription(actual: string, expected: string): void {
    const read = (description: string): string => {
        const parsed = JSON.parse(description) as DraftDescription;
        return parsed.blocks.map((block) => block.text).join('\n');
    };
    expect(read(actual)).toBe(read(expected));
}

type Club = {
    id: number;
    name: string;
    description: string;
    ageFrom: number;
    ageTo: number;
};

type ClubInput = {
    name: string;
    description: string;
    ageFrom: number;
    ageTo: number;
    categoriesName: string[];
    isOnline: boolean;
};

function authHeader(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
}

function clubInput(label: string): ClubInput {
    return {
        name: `Test Club ${label} ${Date.now()}`,
        description: draftDescription('Тестовий гурток для перевірки API Speak Ukrainian.'),
        ageFrom: 6,
        ageTo: 10,
        categoriesName: [categoryName],
        isOnline: false,
    };
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

async function createClub(request: APIRequestContext, token: string, club: ClubInput): Promise<Club> {
    const response = await request.post('api/club', {
        headers: authHeader(token),
        data: club,
    });
    expect(response.status()).toBe(201);
    return (await response.json()) as Club;
}

async function removeClub(request: APIRequestContext, token: string, id: number): Promise<void> {
    await request.delete(`api/club/${id}`, {
        headers: authHeader(token),
    });
}

test.describe('Swagger Club CRUD endpoints', () => {
    test('POST /api/club', async ({ request }) => {
        const token = await signIn(request);
        const club = clubInput('post');

        const response = await request.post('api/club', {
            headers: authHeader(token),
            data: club,
        });
        expect(response.status()).toBe(201);

        const created = (await response.json()) as Club;
        try {
            expect(created.id).toEqual(expect.any(Number));
            expect(created).toMatchObject({
                name: club.name,
                ageFrom: club.ageFrom,
                ageTo: club.ageTo,
            });
            expectDescription(created.description, club.description);
        } finally {
            await removeClub(request, token, created.id);
        }
    });

    test('GET /api/club/{id}', async ({ request }) => {
        const token = await signIn(request);
        const club = clubInput('get');
        const created = await createClub(request, token, club);

        try {
            const response = await request.get(`api/club/${created.id}`, {
                headers: authHeader(token),
            });
            expect(response.status()).toBe(200);

            const body = (await response.json()) as Club & {
                categories: { name: string }[];
            };
            expect(body).toMatchObject({
                id: created.id,
                name: club.name,
                ageFrom: club.ageFrom,
                ageTo: club.ageTo,
            });
            expectDescription(body.description, club.description);
            expect(body.categories).toEqual(expect.arrayContaining([
                expect.objectContaining({ name: categoryName }),
            ]));
        } finally {
            await removeClub(request, token, created.id);
        }
    });

    test('PUT /api/club/{id}', async ({ request }) => {
        const token = await signIn(request);
        const created = await createClub(request, token, clubInput('put'));
        const updatedDescription = draftDescription('Оновлений опис тестового гуртка для перевірки API.');

        try {
            const currentResponse = await request.get(`api/club/${created.id}`, {
                headers: authHeader(token),
            });
            expect(currentResponse.status()).toBe(200);
            const current = await currentResponse.json();
            const updated = {
                ...current,
                name: `${created.name} Updated`,
                description: updatedDescription,
                ageFrom: 7,
                ageTo: 12,
                isOnline: true,
            };

            const response = await request.put(`api/club/${created.id}`, {
                headers: authHeader(token),
                data: updated,
            });
            expect(response.status()).toBe(200);
            const body = (await response.json()) as Club & { isOnline: boolean };
            expect(body).toMatchObject({
                id: created.id,
                name: updated.name,
                ageFrom: updated.ageFrom,
                ageTo: updated.ageTo,
                isOnline: updated.isOnline,
            });
            expectDescription(body.description, updated.description);
        } finally {
            await removeClub(request, token, created.id);
        }
    });

    test('DELETE /api/club/{id}', async ({ request }) => {
        const token = await signIn(request);
        const created = await createClub(request, token, clubInput('delete'));

        const response = await request.delete(`api/club/${created.id}`, {
            headers: authHeader(token),
        });
        expect(response.status()).toBe(200);
    });
});
