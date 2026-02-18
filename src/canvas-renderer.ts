import { Point, DrawingColor } from './types';
import { COLOR_MAP } from './constants';

export class CanvasRenderer {
	private ctx: CanvasRenderingContext2D;
	private cachedRect: DOMRect | null = null;

	constructor(private canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Failed to get canvas context');
		}
		this.ctx = ctx;
		this.setupContext();
	}

	private setupContext(): void {
		this.ctx.lineCap = 'round';
		this.ctx.lineJoin = 'round';
	}

	resize(): void {
		const rect = this.canvas.getBoundingClientRect();
		this.cachedRect = rect;
		this.canvas.width = rect.width;
		this.canvas.height = rect.height;
		this.setupContext();
	}

	clear(): void {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	getCanvasPoint(clientX: number, clientY: number): Point {
		const rect = this.cachedRect || this.canvas.getBoundingClientRect();
		return {
			x: clientX - rect.left,
			y: clientY - rect.top
		};
	}

	drawStroke(points: Point[], color: DrawingColor, width: number, opacity: number = 1.0): void {
		if (points.length < 2) return;

		this.ctx.save();
		this.ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
		this.ctx.strokeStyle = COLOR_MAP[color];
		this.ctx.lineWidth = width;

		this.ctx.beginPath();
		const firstPoint = points[0];
		if (firstPoint) {
			this.ctx.moveTo(firstPoint.x, firstPoint.y);
		}

		for (let i = 1; i < points.length; i++) {
			const point = points[i];
			if (point) {
				this.ctx.lineTo(point.x, point.y);
			}
		}

		this.ctx.stroke();
		this.ctx.restore();
	}

	getContext(): CanvasRenderingContext2D {
		return this.ctx;
	}
}
