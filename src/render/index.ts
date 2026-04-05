import * as PIXI from 'pixi.js';
import type { MapData } from '../types/types';
import { buildScene } from './scene';

export interface MapRendererOptions {
	width?: number;
	height?: number;
	antialias?: boolean;
	resolution?: number;
}

export class MapRenderer {
	private renderer: PIXI.IRenderer;
	private stage: PIXI.Container;
	private scaleRatio: number;

	constructor(options?: MapRendererOptions) {
		const width = options?.width ?? 730;
		const height = options?.height ?? 500;
		this.scaleRatio = width / 730;

		this.renderer = PIXI.autoDetectRenderer({
			width,
			height,
			antialias: options?.antialias ?? true,
			resolution: options?.resolution ?? 1,
			autoDensity: true,
			powerPreference: 'high-performance',
			backgroundColor: 0x2c3e50,
		});

		this.stage = new PIXI.Container();
	}

	render(map: MapData): void {
		const oldChildren = this.stage.removeChildren();
		for (const child of oldChildren) {
			child.destroy({ children: true });
		}

		buildScene(this.stage, map, this.scaleRatio);
		this.renderer.render(this.stage);
	}

	get canvas(): HTMLCanvasElement {
		return this.renderer.view as HTMLCanvasElement;
	}

	resize(width: number, height: number): void {
		this.scaleRatio = width / 730;
		this.renderer.resize(width, height);
	}

	destroy(): void {
		this.stage.destroy({ children: true });
		this.renderer.destroy();
	}
}
