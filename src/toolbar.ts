import { DrawingColor, FadeMode } from './types';
import { FADE_LABELS, FADE_MODES, COLOR_BUTTONS, WIDTH_OPTIONS } from './constants';

export class MobileToolbar {
	private containerEl: HTMLElement;
	private widthIndicator: HTMLElement;
	private fadeIndicator: HTMLElement | null = null;
	private currentWidth: number;
	private currentFadeMode: FadeMode = 'off';

	constructor(
		parentEl: HTMLElement,
		private onColorChange: (color: DrawingColor) => void,
		private onWidthChange: (width: number) => void,
		private onClear: () => void,
		private onExit: () => void,
		initialWidth: number = 4,
		private onFadeModeChange?: (mode: FadeMode) => void
	) {
		this.currentWidth = initialWidth;
		this.containerEl = parentEl.createDiv({ cls: 'ephemeral-toolbar ephemeral-pointer-events-auto' });
		this.widthIndicator = this.containerEl.createDiv({ cls: 'ephemeral-width-indicator' });
		this.createAllButtons();
		this.updateWidthIndicator();
	}

	private createAllButtons(): void {
		this.createWidthButtons();
		this.createColorButtons();
		if (this.onFadeModeChange) {
			this.createFadeButton();
		}
		this.createActionButtons();
	}

	private createWidthButtons(): void {
		const group = this.containerEl.createDiv({ cls: 'ephemeral-toolbar-group' });
		WIDTH_OPTIONS.forEach(width => {
			const btn = this.createButton(group, '━', 'ephemeral-width-btn');
			btn.dataset.width = String(width);
			btn.dataset.widthSize = String(width); // For CSS sizing
			
			if (width === this.currentWidth) {
				btn.addClass('is-active');
			}
			
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.selectWidth(width, group);
			});
		});
	}

	private selectWidth(width: number, group: HTMLElement): void {
		this.currentWidth = width;
		this.onWidthChange(width);
		this.updateWidthIndicator();
		
		group.querySelectorAll('.ephemeral-width-btn').forEach(btn => {
			btn.removeClass('is-active');
		});
		group.querySelector(`[data-width="${width}"]`)?.addClass('is-active');
	}

	private createColorButtons(): void {
		const group = this.containerEl.createDiv({ cls: 'ephemeral-toolbar-group' });
		COLOR_BUTTONS.forEach(({ label, color, hex }) => {
			const btn = this.createButton(group, label, `ephemeral-color-btn ephemeral-color-${color}`);
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.onColorChange(color);
			});
		});
	}

	private createFadeButton(): void {
		const group = this.containerEl.createDiv({ cls: 'ephemeral-toolbar-group' });
		this.fadeIndicator = this.createButton(group, '', 'ephemeral-fade-btn');
		this.fadeIndicator.addEventListener('click', (e) => {
			e.stopPropagation();
			this.cycleFadeMode();
		});
		this.updateFadeIndicator();
	}

	private createActionButtons(): void {
		const group = this.containerEl.createDiv({ cls: 'ephemeral-toolbar-group' });

		const clearBtn = this.createButton(group, 'Clear', 'ephemeral-action-btn ephemeral-clear-btn');
		clearBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.onClear();
		});

		const exitBtn = this.createButton(group, 'Exit', 'ephemeral-action-btn ephemeral-exit-btn');
		exitBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.onExit();
		});
	}

	private createButton(parent: HTMLElement, text: string, extraClass?: string): HTMLElement {
		const classes = ['ephemeral-toolbar-btn'];
		if (extraClass) classes.push(extraClass);
		
		const btn = parent.createEl('button', { 
			text, 
			cls: classes.join(' ')
		});
		
		return btn;
	}

	private updateWidthIndicator(): void {
		this.widthIndicator.empty();
		const dot = this.widthIndicator.createDiv({ cls: 'ephemeral-width-dot' });
		dot.dataset.width = String(this.currentWidth);
	}

	private cycleFadeMode(): void {
		const currentIndex = FADE_MODES.indexOf(this.currentFadeMode);
		const nextMode = FADE_MODES[(currentIndex + 1) % FADE_MODES.length];
		if (nextMode && this.onFadeModeChange) {
			this.currentFadeMode = nextMode;
			this.onFadeModeChange(nextMode);
			this.updateFadeIndicator();
		}
	}

	private updateFadeIndicator(): void {
		if (!this.fadeIndicator) return;
		this.fadeIndicator.textContent = FADE_LABELS[this.currentFadeMode];
	}

	setWidth(width: number): void {
		this.currentWidth = width;
		this.updateWidthIndicator();
		
		this.containerEl.querySelectorAll('.ephemeral-width-btn').forEach(btn => {
			const btnWidth = parseInt((btn as HTMLElement).dataset.width || '0');
			btn.toggleClass('is-active', btnWidth === width);
		});
	}

	setFadeMode(mode: FadeMode): void {
		this.currentFadeMode = mode;
		this.updateFadeIndicator();
	}

	destroy(): void {
		this.containerEl.remove();
	}
}
