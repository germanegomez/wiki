import { expect, test } from '@playwright/test';
import { APP_BASE } from '../helpers/routes';

const TRANSLATIONS_URL = '**/api/method/wiki.api.get_translations';

test.describe('Translations', () => {
	test('updates persistent chrome after a delayed catalog arrives', async ({
		page,
	}) => {
		await page.route(TRANSLATIONS_URL, async (route) => {
			// Long enough to prove that mounting and the first paint do not wait for
			// the catalog under a simulated slow network.
			await new Promise((resolve) => setTimeout(resolve, 2000));
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					message: {
						Settings: 'Configuración de prueba',
						Spaces: 'Espacios de prueba',
						'Change Requests': 'Solicitudes de prueba',
						'Toggle Theme': 'Cambiar tema de prueba',
						'Log out': 'Salir de prueba',
					},
				}),
			});
		});

		await page.goto(APP_BASE);

		// Persistent chrome first paints with source strings.
		await expect(
			page.getByRole('link', { name: 'Spaces', exact: true }),
		).toBeVisible();
		await page
			.getByRole('button', { name: /Frappe Wiki/ })
			.first()
			.click();
		await expect(page.getByText('Toggle Theme', { exact: true })).toBeVisible();

		// The same mounted sidebar and menu update when the catalog arrives.
		await expect(
			page.getByRole('link', { name: 'Espacios de prueba', exact: true }),
		).toBeVisible({ timeout: 15_000 });
		await expect(
			page.getByRole('link', {
				name: 'Solicitudes de prueba',
				exact: true,
			}),
		).toBeVisible();

		await expect(
			page.getByText('Configuración de prueba', { exact: true }),
		).toBeVisible();
		await expect(
			page.getByText('Cambiar tema de prueba', { exact: true }),
		).toBeVisible();
		await expect(
			page.getByText('Salir de prueba', { exact: true }),
		).toBeVisible();
	});

	test('falls back to source strings when translations fail', async ({
		page,
	}) => {
		await page.route(TRANSLATIONS_URL, (route) => route.abort());

		await page.goto(APP_BASE);

		await expect(
			page.getByRole('link', { name: 'Spaces', exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole('link', { name: 'Change Requests', exact: true }),
		).toBeVisible();
		await page
			.getByRole('button', { name: /Frappe Wiki/ })
			.first()
			.click();
		await expect(page.getByText('Toggle Theme', { exact: true })).toBeVisible();
	});
});
