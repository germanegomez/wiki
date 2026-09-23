import { expect, test } from '@playwright/test';
import { createDoc, deleteDoc, getDoc, updateDoc } from '../helpers/frappe';
import { APP_BASE } from '../helpers/routes';

const TRANSLATIONS_URL = '**/wiki.api.get_translations*';

type TranslationDoc = { name: string };

test.describe('Translations', () => {
	test('updates persistent chrome after a delayed catalog arrives', async ({
		page,
		request,
	}) => {
		const originalUser = await getDoc<{ language: string | null }>(
			request,
			'User',
			'Administrator',
		);
		const translations: TranslationDoc[] = [];

		try {
			translations.push(
				await createDoc<TranslationDoc>(request, 'Translation', {
					language: 'es',
					source_text: 'Spaces',
					translated_text: 'Espacios de prueba',
				}),
				await createDoc<TranslationDoc>(request, 'Translation', {
					language: 'es',
					source_text: 'Toggle Theme',
					translated_text: 'Cambiar tema de prueba',
				}),
			);
			await updateDoc(request, 'User', 'Administrator', { language: 'es' });

			await page.route(TRANSLATIONS_URL, async (route) => {
				// Long enough to prove that mounting and the first paint do not wait for
				// the catalog under a simulated slow network.
				await new Promise((resolve) => setTimeout(resolve, 2000));
				await route.continue();
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
			await expect(
				page.getByText('Toggle Theme', { exact: true }),
			).toBeVisible();

			// The same mounted sidebar and menu update when the catalog arrives.
			await expect(
				page.getByRole('link', { name: 'Espacios de prueba', exact: true }),
			).toBeVisible({ timeout: 15_000 });
			await expect(
				page.getByText('Cambiar tema de prueba', { exact: true }),
			).toBeVisible();
		} finally {
			await updateDoc(request, 'User', 'Administrator', {
				language: originalUser.language ?? '',
			});
			for (const translation of translations.reverse()) {
				await deleteDoc(request, 'Translation', translation.name);
			}
		}
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
