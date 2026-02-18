import { SCROLL_THRESHOLD } from './constants';

export class PointerTracker {
	private activePointerId: number | null = null;
	private activePenId: number | null = null;
	private fingerTouchStart: { x: number; y: number; id: number } | null = null;

	setActivePointer(id: number): void {
		this.activePointerId = id;
	}

	clearActivePointer(): void {
		this.activePointerId = null;
	}

	getActivePointer(): number | null {
		return this.activePointerId;
	}

	isActivePointer(id: number): boolean {
		return this.activePointerId === id;
	}

	isPointerActive(): boolean {
		return this.activePointerId !== null;
	}

	setActivePen(id: number): void {
		this.activePenId = id;
	}

	clearActivePen(): void {
		this.activePenId = null;
	}

	isPenActive(): boolean {
		return this.activePenId !== null;
	}

	startFingerTracking(x: number, y: number, id: number): void {
		this.fingerTouchStart = { x, y, id };
	}

	clearFingerTracking(): void {
		this.fingerTouchStart = null;
	}

	isScrollGesture(currentX: number, currentY: number, pointerId: number): boolean {
		if (!this.fingerTouchStart || this.fingerTouchStart.id !== pointerId) {
			return false;
		}

		const deltaY = Math.abs(currentY - this.fingerTouchStart.y);
		const deltaX = Math.abs(currentX - this.fingerTouchStart.x);
		
		return deltaY > SCROLL_THRESHOLD && deltaY > deltaX;
	}

	getFingerTrackingId(): number | null {
		return this.fingerTouchStart?.id ?? null;
	}
}
