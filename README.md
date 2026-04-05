# bonk-map

Encode, decode, validate, and render [bonk.io](https://bonk.io) maps.

## Install

```bash
npm install bonk-map
```

## Encoding & Decoding

Convert between the bonk.io database string format and a typed `MapData` object.

```ts
import { decodeFromDatabase, encodeToDatabase } from 'bonk-map';

const map = decodeFromDatabase(databaseString);
console.log(map.metadata.name);

const encoded = encodeToDatabase(map);
```

## Rendering

### Server-side (Node / Bun)

`renderToBuffer` uses `@napi-rs/canvas` to produce a PNG buffer without a browser.

```ts
import { decodeFromDatabase, renderToBuffer } from 'bonk-map';
import { writeFileSync } from 'fs';

const map = decodeFromDatabase(databaseString);
const png = renderToBuffer(map);
writeFileSync('map.png', png);

// Custom resolution
const small = renderToBuffer(map, { width: 365, height: 250 });
```

### Browser (PIXI.js)

`MapRenderer` wraps a PIXI renderer and provides a canvas element you can insert into the DOM.

```ts
import { decodeFromDatabase, MapRenderer } from 'bonk-map';

const renderer = new MapRenderer({ width: 730, height: 500 });
document.body.appendChild(renderer.canvas);

const map = decodeFromDatabase(databaseString);
renderer.render(map);

// Resize
renderer.resize(1460, 1000);
renderer.render(map);

// Cleanup
renderer.destroy();
```

## Validation

Validate an entire map or individual sections. Every validator returns a `ValidationResult` with `valid` and `issues`.

```ts
import { validateMap, decodeAndValidate } from 'bonk-map';

// Validate a MapData object
const result = validateMap(map);
if (!result.valid) {
	for (const issue of result.issues) {
		console.log(`${issue.path}: ${issue.message}`);
	}
}

// Decode and validate in one step
const { map, validation } = decodeAndValidate(databaseString);
```

Section-level validators are also available:

```ts
import {
	validateShapes,
	validateFixtures,
	validateBodies,
	validateJoints,
	validateSpawns,
	validateCapZones,
	validateMetadata,
	validatePhysics,
} from 'bonk-map';

validateShapes(map.physics.shapes);
validateFixtures(map.physics.fixtures, map.physics.shapes.length);
validateBodies(map.physics.bodies, map.physics.fixtures.length);
validateJoints(map.physics.joints, map.physics.bodies.length);
validateSpawns(map.spawns);
validateCapZones(map.capZones, map.physics.fixtures.length);
validateMetadata(map.metadata);
validatePhysics(map.physics);
```

## Templates

Create new map objects with sensible defaults.

```ts
import {
	getBlankMap,
	getNewBody,
	getNewFixture,
	getNewBoxShape,
	getNewCircleShape,
	getNewPolyShape,
	getNewChainShape,
	getNewRevoluteJoint,
	getNewDistanceJoint,
	getNewLPJJoint,
	getNewLSJJoint,
	getNewGearJoint,
	getNewCapZone,
	getNewSpawn,
} from 'bonk-map';

const map = getBlankMap();

const shape = getNewBoxShape(); // { type: 'bx', width: 10, height: 40, ... }
const fixture = getNewFixture(0); // references shape index 0
const body = getNewBody(); // static body at origin
body.fixtureIndices = [0];

map.physics.shapes.push(shape);
map.physics.fixtures.push(fixture);
map.physics.bodies.push(body);
map.physics.bodyRenderOrder.push(0);
map.spawns.push(getNewSpawn());
```

## Name Conversion

bonk.io uses short single/two-character keys internally. `expandMap` converts short keys to readable names and `compactMap` reverses it. `NAME_MAPS` contains the raw mapping tables.

```ts
import { expandMap, compactMap, NAME_MAPS } from 'bonk-map';

const expanded = expandMap(compactObject); // { n: "foo" } -> { name: "foo" }
const compacted = compactMap(expandedObject); // { name: "foo" } -> { n: "foo" }
```

## Types

All interfaces are exported for use in TypeScript:

```ts
import type {
	MapData,
	MapPhysics,
	MapMetadata,
	MapProperties,
	MapShape,
	MapBoxShape,
	MapCircleShape,
	MapPolyShape,
	MapChainShape,
	MapFixture,
	MapBody,
	MapBodyForce,
	MapBodyForceZone,
	MapBodySettings,
	MapJoint,
	MapJointProperties,
	MapSpawn,
	MapCapZone,
	ValidationResult,
	ValidationIssue,
	MapRendererOptions,
	RenderToBufferOptions,
} from 'bonk-map';
```

## License

GPL3
