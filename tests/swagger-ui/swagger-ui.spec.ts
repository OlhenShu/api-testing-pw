import { expect, test } from '@playwright/test';

test.describe('Swagger UI', () => {
    test.describe.configure({ timeout: 60_000 });
    test.beforeEach(async ({ page }) => {
        await page.goto('swagger-ui/index.html');
        await expect(page.locator('.info .title')).toContainText('Teach UA API', { timeout: 30_000 });
        await page.getByRole('combobox').selectOption({ label: 'http://speak-ukrainian.eastus2.cloudapp.azure.com/dev/ - dev server' });
    });

    test('shows city and club sections', async ({ page }) => {
        await expect(page.locator('#operations-tag-city')).toContainText('City API');
        await expect(page.locator('#operations-tag-club')).toContainText('Club API');
    });

    test('authorizes with the bearer dialog', async ({ page }) => {
        await page.getByRole('button', { name: 'Authorize' }).first().click();

        const dialog = page.locator('.dialog-ux');
        await expect(dialog.getByText('bearer')).toBeVisible();
        await dialog.getByRole('button', { name: 'Close' }).click();
        await expect(dialog).toBeHidden();
    });

    test('executes GET /api/city/{id}', async ({ page }) => {
        const operation = page.locator('.opblock').filter({
            has: page.getByRole('button', { name: 'get /api/city/{id}', exact: true }),
        });
        await operation.getByRole('button', { name: 'get /api/city/{id}', exact: true }).click();
        await operation.getByRole('button', { name: 'Try it out' }).click();
        await operation.getByRole('textbox').fill('1');

        const responsePromise = page.waitForResponse((response) => response.url().endsWith('/api/city/1'));
        await operation.getByRole('button', { name: 'Execute' }).click();
        expect((await responsePromise).status()).toBe(200);

        await expect(operation.locator('td.response-col_status').last()).toHaveText('200');
        await expect(operation.locator('.live-responses-table').last()).toContainText('Київ');
    });
});
