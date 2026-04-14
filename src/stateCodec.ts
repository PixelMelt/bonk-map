import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
// @ts-ignore
import PSON from 'pson';
// @ts-ignore
import ByteBuffer from 'bytebuffer';

const STATE_DICT = [
	'physics',
	'shapes',
	'fixtures',
	'bodies',
	'bro',
	'joints',
	'ppm',
	'lights',
	'spawns',
	'lasers',
	'capZones',
	'type',
	'w',
	'h',
	'c',
	'a',
	'v',
	'l',
	's',
	'sh',
	'fr',
	're',
	'de',
	'sn',
	'fc',
	'fm',
	'f',
	'd',
	'n',
	'bg',
	'lv',
	'av',
	'ld',
	'playSound',
	'fr',
	'bu',
	'cf',
	'rv',
	'p',
	'd',
	'bf',
	'ba',
	'bb',
	'aa',
	'ab',
	'axa',
	'dr',
	'em',
	'mmt',
	'mms',
	'ms',
	'ut',
	'lt',
	'New body',
	'Box Shape',
	'Circle Shape',
	'Polygon Shape',
	'EdgeChain Shape',
	'priority',
	'Light',
	'Laser',
	'Cap Zone',
	'BG Shape',
	'Background Layer',
	'Rotate Joint',
	'Slider Joint',
	'Rod Joint',
	'Gear Joint',
	65535,
	16777215,
];

const pson = new PSON.StaticPair(STATE_DICT);

function caseSwap(str: string): string {
	let out = '';
	for (let i = 0; i < str.length; i++) {
		if (i <= 100 && str.charAt(i) === str.charAt(i).toLowerCase()) {
			out += str.charAt(i).toUpperCase();
		} else if (i <= 100 && str.charAt(i) === str.charAt(i).toUpperCase()) {
			out += str.charAt(i).toLowerCase();
		} else {
			out += str.charAt(i);
		}
	}
	return out;
}

export function encodeState(state: Record<string, unknown>): string {
	const encoded = pson.encode(state);
	const base64 = encoded.toBase64();
	const compressed = compressToEncodedURIComponent(base64);
	return caseSwap(compressed);
}

export function decodeState(encoded: string): Record<string, unknown> {
	const unswapped = caseSwap(encoded);
	const base64 = decompressFromEncodedURIComponent(unswapped);
	const buf = ByteBuffer.fromBase64(base64);
	return pson.decode(buf) as Record<string, unknown>;
}

export function encodeInputs(input: {
	left: boolean;
	right: boolean;
	up: boolean;
	down: boolean;
	action: boolean;
	action2: boolean;
}): number {
	let val = 0;
	if (input.left) val += 1;
	if (input.right) val += 2;
	if (input.up) val += 4;
	if (input.down) val += 8;
	if (input.action) val += 16;
	if (input.action2) val += 32;
	return val;
}

export function decodeInputs(val: number): {
	left: boolean;
	right: boolean;
	up: boolean;
	down: boolean;
	action: boolean;
	action2: boolean;
} {
	return {
		left: (val & 1) === 1,
		right: (val & 2) === 2,
		up: (val & 4) === 4,
		down: (val & 8) === 8,
		action: (val & 16) === 16,
		action2: (val & 32) === 32,
	};
}
