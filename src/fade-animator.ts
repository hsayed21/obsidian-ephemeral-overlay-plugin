import { Stroke, FadeMode, Point, DrawingColor } from './types';
import { FADE_DURATIONS } from './constants';
import { CanvasRenderer } from './canvas-renderer';

export class FadeAnimator {
	private animationId: number | null = null;

	constructor(
		private renderer: CanvasRenderer,
		private getStrokes: () => Stroke[],
		private setStrokes: (strokes: Stroke[]) => void,
		private getCurrentStroke: () => { points: Point[]; color: DrawingColor; width: number },
		private isDrawing: () => boolean
	) {}

	start(fadeMode: FadeMode): void {
		if (this.animationId !== null || fadeMode === 'off') {
			return;
		}

		const animate = () => {
			const now = Date.now();
			const fadeDuration = FADE_DURATIONS[fadeMode];
			
			const activeStrokes = this.getStrokes().filter(stroke => {
				const age = now - stroke.timestamp;
				return age < fadeDuration;
			});

			this.setStrokes(activeStrokes);
			this.redrawWithFade(now, fadeDuration);

			if (activeStrokes.length > 0) {
				this.animationId = requestAnimationFrame(animate);
			} else {
				this.animationId = null;
			}
		};

		this.animationId = requestAnimationFrame(animate);
	}

	stop(): void {
		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
	}

	private redrawWithFade(now: number, fadeDuration: number): void {
		this.renderer.clear();
		
		for (const stroke of this.getStrokes()) {
			const age = now - stroke.timestamp;
			const opacity = 1 - (age / fadeDuration);
			this.renderer.drawStroke(stroke.points, stroke.color, stroke.width, opacity);
		}
		
		if (this.isDrawing()) {
			const current = this.getCurrentStroke();
			if (current.points.length > 0) {
				this.renderer.drawStroke(current.points, current.color, current.width, 1.0);
			}
		}
	}
}
