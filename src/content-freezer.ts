import { INTERACTIVE_SELECTORS } from './constants';

export class ContentFreezer {
	private applyFreezeStyles(element: HTMLElement): void {
		element.style.pointerEvents = 'none';
		element.style.userSelect = 'none';
		element.style.webkitUserSelect = 'none';
		(element.style as any).webkitTouchCallout = 'none';
		element.dataset.ephemeralFrozen = 'true';
	}

	private removeFreezeStyles(element: HTMLElement): void {
		element.style.pointerEvents = '';
		element.style.userSelect = '';
		element.style.webkitUserSelect = '';
		(element.style as any).webkitTouchCallout = '';
		delete element.dataset.ephemeralFrozen;
	}

	freeze(contentEl: HTMLElement): void {
		this.applyFreezeStyles(contentEl);
		INTERACTIVE_SELECTORS.forEach(selector => {
			contentEl.querySelectorAll(selector).forEach((el: Element) => {
				this.applyFreezeStyles(el as HTMLElement);
			});
		});
	}

	unfreeze(contentEl: HTMLElement): void {
		this.removeFreezeStyles(contentEl);
		contentEl.querySelectorAll('[data-ephemeral-frozen]').forEach((el: Element) => {
			this.removeFreezeStyles(el as HTMLElement);
		});
	}
}
