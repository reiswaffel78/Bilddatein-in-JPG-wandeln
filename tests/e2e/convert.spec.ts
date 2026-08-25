import { test, expect } from '@playwright/test';
import path from 'node:path';

const SAMPLE_PNG = path.join(process.cwd(), 'fixtures/e2e/sample.png');

test('keine Requests an fremde Domains während des gesamten Ablaufs', async ({ page }) => {
  const foreignRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      foreignRequests.push(request.url());
    }
  });

  await page.goto('/');
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(SAMPLE_PNG);

  await expect(page.getByText('sample.png')).toBeVisible();

  expect(foreignRequests).toEqual([]);
});

test('Upload -> Zielformat wählen -> Qualität ändern -> Konvertieren -> Download', async ({ page }) => {
  await page.goto('/');

  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(SAMPLE_PNG);

  await expect(page.getByText('sample.png')).toBeVisible();

  const targetSelect = page.getByRole('combobox', { name: /zielformat/i });
  await expect(targetSelect).toBeVisible({ timeout: 10_000 });
  await targetSelect.selectOption('webp');

  const qualitySlider = page.locator('#quality-slider');
  await qualitySlider.fill('75');

  await page.getByRole('button', { name: 'Konvertieren', exact: true }).first().click();
  await expect(page.getByText('Fertig')).toBeVisible({ timeout: 20_000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Herunterladen', exact: true }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.webp$/);
});
