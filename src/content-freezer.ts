import { FROZEN_CLASS, INTERACTIVE_SELECTORS } from './constants';


export class ContentFreezer {
	private applyFreezeStyles(element: HTMLElement): void {
		element.addClass(FROZEN_CLASS);
		element.dataset.ephemeralFrozen = 'true';
	}

	private removeFreezeStyles(element: HTMLElement): void {
		element.removeClass(FROZEN_CLASS);
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
