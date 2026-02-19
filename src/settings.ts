import { App, PluginSettingTab, Setting } from 'obsidian';
import EphemeralOverlayPlugin from './main';

export interface PluginSettings {
	penOnlyMode: boolean;
	clearOnScroll: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	penOnlyMode: false,
	clearOnScroll: false
};

export class EphemeralOverlaySettingTab extends PluginSettingTab {
	plugin: EphemeralOverlayPlugin;

	constructor(app: App, plugin: EphemeralOverlayPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Pen only mode')
			.setDesc('Only allow drawing with stylus/pen input (e.g., Apple Pencil). When enabled, you can draw with your pen and scroll with your finger simultaneously - perfect for iPad! Finger touches will not draw, only scroll the page. Note: If using an iPad, disable the Apple Pencil "Scribble" setting in iPadOS settings for a better experience.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.penOnlyMode)
				.onChange(async (value) => {
					this.plugin.settings.penOnlyMode = value;
					await this.plugin.saveSettings();
				}));

		const clearOnScrollSetting = new Setting(containerEl)
			.setName('Clear on scroll')
			.setDesc('Automatically clear all drawings when you touch with your finger to scroll. Useful for quick annotation sessions where you want a fresh canvas after scrolling.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.clearOnScroll)
				.onChange(async (value) => {
					this.plugin.settings.clearOnScroll = value;
					await this.plugin.saveSettings();
				}));

		if (!this.plugin.settings.penOnlyMode) {
			clearOnScrollSetting.settingEl.addClass('ephemeral-display-none');
		}
	}
}
