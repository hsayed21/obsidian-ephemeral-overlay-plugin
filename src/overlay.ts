import { App, MarkdownView, Platform } from 'obsidian';
import { DrawingColor, DrawingState, FadeMode, Stroke } from './types';
import { MobileToolbar } from './toolbar';
import { PluginSettings } from './settings';
import { ContentFreezer } from './content-freezer';
import { PointerTracker } from './pointer-tracker';
import { CanvasRenderer } from './canvas-renderer';
import { FadeAnimator } from './fade-animator';
import { 
	DEFAULT_COLOR, 
	DEFAULT_STROKE_WIDTH, 
	DEFAULT_FADE_MODE,
	MIN_STROKE_WIDTH,
	MAX_STROKE_WIDTH,
	FADE_LABELS 
} from './constants';

export class DrawingOverlay {
	private app: App;
	private markdownView: MarkdownView;
	private settings: PluginSettings;
	private overlayEl: HTMLElement;
	private canvas: HTMLCanvasElement;
	private state: DrawingState;
	private toolbar: MobileToolbar | null = null;
	private resizeObserver: ResizeObserver | null = null;
	private layoutChangeRef: (() => void) | null = null;
	private cursorEl: HTMLElement | null = null;
	private statusBarItem: HTMLElement | null = null;
	private pendingResize: boolean = false;
	
	private contentFreezer: ContentFreezer;
	private pointerTracker: PointerTracker;
	private renderer: CanvasRenderer;
	private fadeAnimator: FadeAnimator;
	
	private boundHandlers: {
		pointerDown: (e: PointerEvent) => void;
		pointerMove: (e: PointerEvent) => void;
		pointerUp: (e: PointerEvent) => void;
		pointerCancel: (e: PointerEvent) => void;
		keyDown: (e: KeyboardEvent) => void;
		resize: () => void;
		wheel: (e: WheelEvent) => void;
		mouseMove: (e: MouseEvent) => void;
		contextMenu: (e: Event) => void;
		selectStart: (e: Event) => void;
	};

	constructor(
		app: App, 
		markdownView: MarkdownView, 
		settings: PluginSettings, 
		statusBarItem: HTMLElement | null, 
		onExit: () => void
	) {
		this.app = app;
		this.markdownView = markdownView;
		this.settings = settings;
		this.statusBarItem = statusBarItem;
		
		this.state = {
			currentColor: DEFAULT_COLOR,
			strokeWidth: DEFAULT_STROKE_WIDTH,
			isDrawing: false,
			currentStroke: [],
			strokes: [],
			fadeMode: DEFAULT_FADE_MODE
		};

		this.contentFreezer = new ContentFreezer();
		this.pointerTracker = new PointerTracker();

		if (!this.settings.penOnlyMode) {
			this.contentFreezer.freeze(this.markdownView.contentEl);
		}

		this.createOverlay();
		this.renderer = new CanvasRenderer(this.canvas);
		
		this.fadeAnimator = new FadeAnimator(
			this.renderer,
			() => this.state.strokes,
			(strokes) => { this.state.strokes = strokes; },
			() => ({ 
				points: this.state.currentStroke, 
				color: this.state.currentColor, 
				width: this.state.strokeWidth 
			}),
			() => this.state.isDrawing
		);

		this.boundHandlers = {
			pointerDown: this.handlePointerDown.bind(this),
			pointerMove: this.handlePointerMove.bind(this),
			pointerUp: this.handlePointerUp.bind(this),
			pointerCancel: this.handlePointerCancel.bind(this),
			keyDown: this.handleKeyDown.bind(this, onExit),
			resize: this.handleResize.bind(this),
			wheel: this.handleWheel.bind(this),
			mouseMove: this.handleMouseMove.bind(this),
			contextMenu: (e) => { e.preventDefault(); e.stopPropagation(); },
			selectStart: (e) => { e.preventDefault(); e.stopPropagation(); }
		};

		this.attachListeners();
		this.updateStatusBar();

		if (!Platform.isMobile) {
			this.createCustomCursor();
		}

		if (Platform.isMobile) {
			this.createMobileToolbar(onExit);
		}

		this.renderer.resize();
		this.setupResizeObserver();
	}

	private createOverlay(): void {
		const contentEl = this.markdownView.contentEl;
		this.overlayEl = contentEl.createDiv({ cls: 'ephemeral-overlay' });

		if (this.settings.penOnlyMode) {
			this.overlayEl.addClass('pen-only-mode');
			this.overlayEl.addClass('ephemeral-pointer-events-none');
		}

		this.canvas = this.overlayEl.createEl('canvas', { cls: 'ephemeral-overlay-canvas' });

		if (this.settings.penOnlyMode) {
			this.canvas.addClass('ephemeral-pointer-events-none');
		}
	}

	private createMobileToolbar(onExit: () => void): void {
		this.toolbar = new MobileToolbar(
			this.overlayEl,
			(color) => this.setColor(color),
			(width) => this.setWidth(width),
			() => this.clearCanvas(),
			() => onExit(),
			this.state.strokeWidth,
			(mode) => this.setFadeMode(mode)
		);
	}

	private setupResizeObserver(): void {
		this.resizeObserver = new ResizeObserver(() => this.handleResize());
		this.resizeObserver.observe(this.canvas);

		this.layoutChangeRef = () => {
			setTimeout(() => this.handleResize(), 50);
		};
		this.app.workspace.on('layout-change', this.layoutChangeRef);
	}

	private enableCanvasForDrawing(): void {
		if (!this.settings.penOnlyMode) return;

		this.canvas.removeClass('ephemeral-pointer-events-none');
		this.canvas.addClass('ephemeral-pointer-events-auto');
		this.overlayEl.removeClass('ephemeral-pointer-events-none');
		this.overlayEl.addClass('ephemeral-pointer-events-auto');
		this.contentFreezer.freeze(this.markdownView.contentEl);
	}

	private disableCanvasForDrawing(): void {
		if (!this.settings.penOnlyMode) return;

		if (this.settings.clearOnScroll) {
			this.clearCanvas();
		}

		this.canvas.removeClass('ephemeral-pointer-events-auto');
		this.canvas.addClass('ephemeral-pointer-events-none');
		this.overlayEl.removeClass('ephemeral-pointer-events-auto');
		this.overlayEl.addClass('ephemeral-pointer-events-none');
		this.contentFreezer.unfreeze(this.markdownView.contentEl);
	}

	private attachListeners(): void {
		this.overlayEl.addEventListener('contextmenu', this.boundHandlers.contextMenu);
		this.overlayEl.addEventListener('selectstart', this.boundHandlers.selectStart);
		this.canvas.addEventListener('contextmenu', this.boundHandlers.contextMenu);
		this.canvas.addEventListener('selectstart', this.boundHandlers.selectStart);

		const target = this.settings.penOnlyMode ? this.markdownView.contentEl : this.canvas;
		const options = this.settings.penOnlyMode ? { capture: true } : undefined;
		target.addEventListener('pointerdown', this.boundHandlers.pointerDown, options);
		
		document.addEventListener('pointermove', this.boundHandlers.pointerMove, { passive: false });
		document.addEventListener('pointerup', this.boundHandlers.pointerUp, { passive: false });
		document.addEventListener('pointercancel', this.boundHandlers.pointerCancel, { passive: false });

		if (!Platform.isMobile) {
			document.addEventListener('keydown', this.boundHandlers.keyDown);
			this.canvas.addEventListener('wheel', this.boundHandlers.wheel, { passive: false });
			this.canvas.addEventListener('mousemove', this.boundHandlers.mouseMove);
		}

		window.addEventListener('resize', this.boundHandlers.resize);
	}

	private detachListeners(): void {
		this.overlayEl.removeEventListener('contextmenu', this.boundHandlers.contextMenu);
		this.overlayEl.removeEventListener('selectstart', this.boundHandlers.selectStart);
		this.canvas.removeEventListener('contextmenu', this.boundHandlers.contextMenu);
		this.canvas.removeEventListener('selectstart', this.boundHandlers.selectStart);
		
		const target = this.settings.penOnlyMode ? this.markdownView.contentEl : this.canvas;
		const options: AddEventListenerOptions | undefined = this.settings.penOnlyMode ? { capture: true } : undefined;
		target.removeEventListener('pointerdown', this.boundHandlers.pointerDown, options);
		
		document.removeEventListener('pointermove', this.boundHandlers.pointerMove);
		document.removeEventListener('pointerup', this.boundHandlers.pointerUp);
		document.removeEventListener('pointercancel', this.boundHandlers.pointerCancel);
		
		if (!Platform.isMobile) {
			document.removeEventListener('keydown', this.boundHandlers.keyDown);
			this.canvas.removeEventListener('wheel', this.boundHandlers.wheel);
			this.canvas.removeEventListener('mousemove', this.boundHandlers.mouseMove);
		}
		
		window.removeEventListener('resize', this.boundHandlers.resize);
	}

	private handlePointerDown(e: PointerEvent): void {
		if (this.settings.penOnlyMode) {
			if (e.pointerType === 'touch') {
				this.pointerTracker.startFingerTracking(e.clientX, e.clientY, e.pointerId);
				return;
			}
			if (e.pointerType === 'pen') {
				this.pointerTracker.setActivePen(e.pointerId);
				this.enableCanvasForDrawing();
			}
		}

		if (this.state.isDrawing && this.pointerTracker.isPointerActive() && !this.pointerTracker.isActivePointer(e.pointerId)) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();
		
		const point = this.renderer.getCanvasPoint(e.clientX, e.clientY);
		this.state.isDrawing = true;
		this.state.currentStroke = [point];
		this.pointerTracker.setActivePointer(e.pointerId);

		if (this.cursorEl) {
			this.cursorEl.addClass('ephemeral-display-none');
		}

		this.canvas.setPointerCapture(e.pointerId);
	}

	private handlePointerMove(e: PointerEvent): void {
		if (this.settings.penOnlyMode && e.pointerType === 'touch') {
			if (this.pointerTracker.isScrollGesture(e.clientX, e.clientY, e.pointerId)) {
				this.pointerTracker.clearFingerTracking();
				this.disableCanvasForDrawing();
				return;
			}
		}
		
		if (!this.state.isDrawing) return;
		if (this.pointerTracker.isPointerActive() && !this.pointerTracker.isActivePointer(e.pointerId)) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
		const prevLength = this.state.currentStroke.length;
		
		for (const event of events) {
			const point = this.renderer.getCanvasPoint(event.clientX, event.clientY);
			this.state.currentStroke.push(point);
		}

		if (prevLength > 0) {
			const segmentStart = prevLength - 1;
			const newSegment = this.state.currentStroke.slice(segmentStart);
			this.renderer.drawStroke(newSegment, this.state.currentColor, this.state.strokeWidth);
		} else {
			this.renderer.drawStroke(this.state.currentStroke, this.state.currentColor, this.state.strokeWidth);
		}
	}

	private handlePointerUp(e: PointerEvent): void {
		if (this.settings.penOnlyMode && e.pointerType === 'touch') {
			if (this.pointerTracker.getFingerTrackingId() === e.pointerId) {
				this.pointerTracker.clearFingerTracking();
				return;
			}
		}
		
		if (this.pointerTracker.isPointerActive() && !this.pointerTracker.isActivePointer(e.pointerId)) {
			return;
		}

		if (!this.state.isDrawing) return;

		e.preventDefault();
		e.stopPropagation();

		this.saveStroke();
		this.cleanupPointer(e);
	}

	private handlePointerCancel(e: PointerEvent): void {
		if (this.pointerTracker.isPointerActive() && !this.pointerTracker.isActivePointer(e.pointerId)) {
			return;
		}

		if (!this.state.isDrawing) return;

		this.saveStroke();
		this.cleanupPointer(e);
	}

	private saveStroke(): void {
		if (this.state.currentStroke.length > 0) {
			this.state.strokes.push({
				points: [...this.state.currentStroke],
				color: this.state.currentColor,
				width: this.state.strokeWidth,
				timestamp: Date.now()
			});
			this.fadeAnimator.start(this.state.fadeMode);
		}
	}

	private cleanupPointer(e: PointerEvent): void {
		this.state.currentStroke = [];
		this.state.isDrawing = false;
		this.pointerTracker.clearActivePointer();
		
		if (e.pointerType === 'pen') {
			this.pointerTracker.clearActivePen();
		}

		if (this.cursorEl) {
			this.cursorEl.removeClass('ephemeral-display-none');
		}

		if (this.canvas.hasPointerCapture(e.pointerId)) {
			this.canvas.releasePointerCapture(e.pointerId);
		}

		if (this.pendingResize) {
			this.performResize();
		}
	}

	private handleKeyDown(onExit: () => void, e: KeyboardEvent): void {
		if (e.ctrlKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
			e.preventDefault();
			this.adjustWidth(e.key === 'ArrowUp' ? 1 : -1);
			return;
		}

		const key = e.key.toLowerCase();
		const shortcuts: Record<string, () => void> = {
			'r': () => this.setColor('red'),
			'y': () => this.setColor('yellow'),
			'b': () => this.setColor('blue'),
			'g': () => this.setColor('green'),
			'o': () => this.setColor('orange'),
			'p': () => this.setColor('pink'),
			'1': () => this.setWidth(2),
			'2': () => this.setWidth(4),
			'3': () => this.setWidth(8),
			'4': () => this.setWidth(12),
			'5': () => this.setWidth(16),
			'f': () => this.cycleFadeMode(),
			'e': () => this.clearCanvas(),
			'escape': () => onExit(),
		};

		const action = shortcuts[key];
		if (action) {
			e.preventDefault();
			e.stopPropagation();
			action();
		}
	}

	private handleWheel(e: WheelEvent): void {
		if (e.ctrlKey) {
			e.preventDefault();
			this.adjustWidth(e.deltaY < 0 ? 1 : -1);
		}
	}

	private handleMouseMove(e: MouseEvent): void {
		if (this.cursorEl) {
			this.cursorEl.style.left = `${e.clientX}px`;
			this.cursorEl.style.top = `${e.clientY}px`;
		}
	}

	private handleResize(): void {
		if (this.state.isDrawing) {
			this.pendingResize = true;
			return;
		}
		this.performResize();
	}

	private performResize(): void {
		const strokes = [...this.state.strokes];
		this.renderer.resize();
		this.redrawStrokes(strokes);
		this.pendingResize = false;
	}

	private setColor(color: DrawingColor): void {
		this.state.currentColor = color;
		this.updateCustomCursor();
	}

	private setWidth(width: number): void {
		this.state.strokeWidth = Math.max(MIN_STROKE_WIDTH, Math.min(MAX_STROKE_WIDTH, width));
		
		if (this.toolbar) {
			this.toolbar.setWidth(this.state.strokeWidth);
		}
		
		this.updateCustomCursor();
	}

	private adjustWidth(increment: number): void {
		this.setWidth(this.state.strokeWidth + increment);
	}

	private clearCanvas(): void {
		this.state.strokes = [];
		this.state.currentStroke = [];
		this.renderer.clear();
		this.fadeAnimator.stop();
	}

	private setFadeMode(mode: FadeMode): void {
		this.state.fadeMode = mode;
		
		if (this.toolbar) {
			this.toolbar.setFadeMode(mode);
		}
		
		this.updateStatusBar();
		
		if (mode === 'off') {
			this.fadeAnimator.stop();
		} else if (this.state.strokes.length > 0) {
			this.fadeAnimator.start(mode);
		}
	}

	private cycleFadeMode(): void {
		const modes: FadeMode[] = ['off', 'fading', 'medium', 'long', 'verylong'];
		const currentIndex = modes.indexOf(this.state.fadeMode);
		const nextMode = modes[(currentIndex + 1) % modes.length];
		if (nextMode) {
			this.setFadeMode(nextMode);
		}
	}

	private redrawStrokes(strokes: Stroke[]): void {
		this.renderer.clear();
		for (const stroke of strokes) {
			this.renderer.drawStroke(stroke.points, stroke.color, stroke.width);
		}
		this.state.strokes = strokes;
	}

	private createCustomCursor(): void {
		this.canvas.addClass('ephemeral-cursor-none');
		this.cursorEl = document.body.createDiv({ cls: 'ephemeral-cursor' });
		this.updateCustomCursor();
	}

	private updateCustomCursor(): void {
		if (!this.cursorEl) return;

		const size = this.state.strokeWidth * 2;
		this.cursorEl.style.width = `${size}px`;
		this.cursorEl.style.height = `${size}px`;
		
		this.cursorEl.dataset.color = this.state.currentColor;
		this.cursorEl.className = `ephemeral-cursor ephemeral-cursor-${this.state.currentColor}`;
	}

	private updateStatusBar(): void {
		if (!this.statusBarItem) return;
		this.statusBarItem.setText(FADE_LABELS[this.state.fadeMode]);
	}

	destroy(): void {
		this.contentFreezer.unfreeze(this.markdownView.contentEl);
		this.fadeAnimator.stop();
		this.detachListeners();

		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}

		if (this.layoutChangeRef) {
			this.app.workspace.off('layout-change', this.layoutChangeRef);
			this.layoutChangeRef = null;
		}

		this.statusBarItem = null;

		if (this.cursorEl) {
			this.cursorEl.remove();
			this.cursorEl = null;
		}

		if (this.toolbar) {
			this.toolbar.destroy();
			this.toolbar = null;
		}

		this.overlayEl.remove();
		this.state.strokes = [];
		this.state.currentStroke = [];
	}
}
