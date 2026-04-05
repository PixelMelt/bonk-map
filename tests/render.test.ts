import { describe, it, expect } from 'bun:test';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { decodeFromDatabase, renderToBuffer } from '../src/index';
import maps from './maps.json';

const testMaps = maps as string[];

GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'DejaVu Sans');

// PNG magic bytes: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('renderToBuffer', () => {
	it('renders a random map from map data to a valid PNG buffer', async () => {
		const index = Math.floor(Math.random() * testMaps.length);
		const map = decodeFromDatabase(testMaps[index]);

		const buffer = renderToBuffer(map);

		expect(buffer).toBeInstanceOf(Buffer);
		expect(buffer.length).toBeGreaterThan(PNG_HEADER.length);
		expect(buffer.subarray(0, 8).equals(PNG_HEADER)).toBe(true);

		const img = await loadImage(buffer);
		const canvas = createCanvas(img.width, img.height);
		const ctx = canvas.getContext('2d');
		ctx.drawImage(img, 0, 0);

		const label = map.metadata.name || `map #${index}`;
		ctx.font = '14px "DejaVu Sans"';
		ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
		const metrics = ctx.measureText(label);
		ctx.fillRect(4, 4, metrics.width + 12, 22);
		ctx.fillStyle = '#ffffff';
		ctx.fillText(label, 10, 19);

		writeFileSync(join(__dirname, 'render-test.png'), canvas.toBuffer('image/png'));
	});

	it('renders at a custom resolution', () => {
		const index = Math.floor(Math.random() * testMaps.length);
		const map = decodeFromDatabase(testMaps[index]);

		const buffer = renderToBuffer(map, { width: 365, height: 250 });

		expect(buffer).toBeInstanceOf(Buffer);
		expect(buffer.subarray(0, 8).equals(PNG_HEADER)).toBe(true);
	});
});
