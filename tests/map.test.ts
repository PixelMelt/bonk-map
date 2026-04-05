import { describe, it, expect } from 'bun:test';
import { decodeFromDatabase, encodeToDatabase, expandMap, compactMap } from '../src/index';
import type { MapData } from '../src/index';
import maps from './maps.json';

const testMaps = maps as string[];

describe('map encode/decode roundtrip', () => {
	it('has test maps to work with', () => {
		expect(testMaps.length).toBeGreaterThan(0);
	});

	for (let i = 0; i < testMaps.length; i++) {
		const leveldata = testMaps[i];

		describe(`map ${i}`, () => {
			it('decodes without throwing', () => {
				expect(() => decodeFromDatabase(leveldata)).not.toThrow();
			});

			it('roundtrips decode -> encode -> decode to the same map data', () => {
				const decoded = decodeFromDatabase(leveldata);
				if (decoded.version < 15) return; // encoder always writes v15, so older versions can't roundtrip exactly
				const reEncoded = encodeToDatabase(decoded);
				const reDecoded = decodeFromDatabase(reEncoded);
				expect(reDecoded).toEqual(decoded);
			});

			it('roundtrips compact -> expand back to the same map data', () => {
				const decoded = decodeFromDatabase(leveldata);
				const compacted = compactMap(decoded as unknown as Record<string, unknown>);
				const expanded = expandMap(compacted) as unknown as MapData;
				expect(expanded).toEqual(decoded);
			});
		});
	}
});
