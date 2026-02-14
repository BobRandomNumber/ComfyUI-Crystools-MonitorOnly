import { app, api } from './comfy/index.js';
import { commonPrefix } from './common.js';
import { MonitorUI } from './monitorUI.js';
import { addStylesheet, Colors } from './styles.js';
import { ComfyKeyMenuDisplayOption, MenuDisplayOptions } from './progressBarUIBase.js';
class CrysMonitorMonitor {
    idExtensionName = 'CrysMonitor.monitor';
    menuPrefix = commonPrefix;
    menuDisplayOption = MenuDisplayOptions.Disabled;
    folderName = '';
    crysmonitorButtonGroup = null;
    settingsRate = null;
    settingsMonitorHeight = null;
    settingsMonitorHeightLegacy = null;
    settingsMonitorWidth = null;
    monitorCPUElement = null;
    monitorRAMElement = null;
    monitorHDDElement = null;
    settingsHDD = null;
    monitorGPUSettings = [];
    monitorVRAMSettings = [];
    monitorTemperatureSettings = [];
    monitorUI = null;
    monitorWidthId = 'CrysMonitor.MonitorWidth';
    monitorWidth = 60;
    monitorHeightId = 'CrysMonitor.MonitorHeight';
    monitorHeight = 40;
    monitorHeightLegacyId = 'CrysMonitor.MonitorHeightLegacy';
    monitorHeightLegacy = 19;
    createSettingsRate = () => {
        this.settingsRate = {
            id: 'CrysMonitor.RefreshRate',
            name: 'Refresh per second',
            category: ['CrysMonitor', this.menuPrefix + ' Configuration', 'refresh'],
            tooltip: 'This is the time (in seconds) between each update of the monitors, 0 means no refresh',
            type: 'slider',
            attrs: {
                min: 0,
                max: 2,
                step: .25,
            },
            defaultValue: .5,
            // @ts-ignore
            onChange: async (value) => {
                let valueNumber;
                try {
                    valueNumber = parseFloat(value);
                    if (isNaN(valueNumber)) {
                        throw new Error('invalid value');
                    }
                }
                catch (error) {
                    console.error(error);
                    return;
                }
                try {
                    await this.updateServer({ rate: valueNumber });
                }
                catch (error) {
                    console.error(error);
                    return;
                }
                const data = {
                    cpu_utilization: 0,
                    device: 'cpu',
                    gpus: [
                        {
                            gpu_utilization: 0,
                            gpu_temperature: 0,
                            vram_total: 0,
                            vram_used: 0,
                            vram_used_percent: 0,
                        },
                    ],
                    hdd_total: 0,
                    hdd_used: 0,
                    hdd_used_percent: 0,
                    ram_total: 0,
                    ram_used: 0,
                    ram_used_percent: 0,
                };
                if (valueNumber === 0) {
                    this.monitorUI.updateDisplay(data);
                }
                this.monitorUI?.updateAllAnimationDuration(valueNumber);
            },
        };
    };
    createSettingsMonitorWidth = () => {
        this.settingsMonitorWidth = {
            id: this.monitorWidthId,
            name: 'Pixel Width',
            category: ['CrysMonitor', this.menuPrefix + ' Configuration', 'width'],
            tooltip: 'The width of the monitor in pixels on the UI (only on top/bottom UI)',
            type: 'slider',
            attrs: {
                min: 60,
                max: 100,
                step: 1,
            },
            defaultValue: this.monitorWidth,
            // @ts-ignore
            onChange: (value) => {
                let valueNumber;
                try {
                    valueNumber = parseInt(value);
                    if (isNaN(valueNumber)) {
                        throw new Error('invalid value');
                    }
                }
                catch (error) {
                    console.error(error);
                    return;
                }
                const h = app.extensionManager.setting.get(this.monitorHeightId);
                this.monitorUI?.updateMonitorSize(valueNumber, h);
            },
        };
    };
    createSettingsMonitorHeight = () => {
        this.settingsMonitorHeight = {
            id: this.monitorHeightId,
            name: 'Pixel Height (New Menu)',
            category: ['CrysMonitor', this.menuPrefix + ' Configuration', 'height'],
            tooltip: 'The height of the monitor in pixels when using new menu (Top/Bottom)',
            type: 'slider',
            attrs: {
                min: 16,
                max: 50,
                step: 1,
            },
            defaultValue: this.monitorHeight,
            // @ts-ignore
            onChange: async (value) => {
                let valueNumber;
                try {
                    valueNumber = parseInt(value);
                    if (isNaN(valueNumber)) {
                        throw new Error('invalid value');
                    }
                }
                catch (error) {
                    console.error(error);
                    return;
                }
                // Only apply if new menu is active
                if (this.menuDisplayOption !== MenuDisplayOptions.Disabled) {
                    const w = await app.extensionManager.setting.get(this.monitorWidthId);
                    this.monitorUI?.updateMonitorSize(w, valueNumber);
                }
            },
        };
    };
    createSettingsMonitorHeightLegacy = () => {
        this.settingsMonitorHeightLegacy = {
            id: this.monitorHeightLegacyId,
            name: 'Pixel Height (Legacy Menu)',
            category: ['CrysMonitor', this.menuPrefix + ' Configuration', 'height-legacy'],
            tooltip: 'The height of the monitor in pixels when using legacy menu (Disabled)',
            type: 'slider',
            attrs: {
                min: 16,
                max: 50,
                step: 1,
            },
            defaultValue: this.monitorHeightLegacy,
            // @ts-ignore
            onChange: async (value) => {
                let valueNumber;
                try {
                    valueNumber = parseInt(value);
                    if (isNaN(valueNumber)) {
                        throw new Error('invalid value');
                    }
                }
                catch (error) {
                    console.error(error);
                    return;
                }
                // Only apply if legacy menu is active
                if (this.menuDisplayOption === MenuDisplayOptions.Disabled) {
                    const w = await app.extensionManager.setting.get(this.monitorWidthId);
                    this.monitorUI?.updateMonitorSize(w, valueNumber);
                }
            },
        };
    };
    createSettingsCPU = () => {
        // CPU Variables
        this.monitorCPUElement = {
            id: 'CrysMonitor.ShowCpu',
            name: 'CPU Usage',
            category: ['CrysMonitor', this.menuPrefix + ' Hardware', 'Cpu'],
            type: 'boolean',
            label: 'CPU',
            symbol: '%',
            defaultValue: true,
            htmlMonitorRef: undefined,
            htmlMonitorSliderRef: undefined,
            htmlMonitorLabelRef: undefined,
            cssColor: Colors.CPU,
            // @ts-ignore
            onChange: async (value) => {
                await this.updateServer({ switchCPU: value });
                this.updateWidget(this.monitorCPUElement);
            },
        };
    };
    createSettingsRAM = () => {
        // RAM Variables
        this.monitorRAMElement = {
            id: 'CrysMonitor.ShowRam',
            name: 'RAM Used',
            category: ['CrysMonitor', this.menuPrefix + ' Hardware', 'Ram'],
            type: 'boolean',
            label: 'RAM',
            symbol: '%',
            defaultValue: true,
            htmlMonitorRef: undefined,
            htmlMonitorSliderRef: undefined,
            htmlMonitorLabelRef: undefined,
            cssColor: Colors.RAM,
            // @ts-ignore
            onChange: async (value) => {
                await this.updateServer({ switchRAM: value });
                this.updateWidget(this.monitorRAMElement);
            },
        };
    };
    createSettingsGPUUsage = (name, index) => {
        if (name === undefined || index === undefined) {
            console.warn('getGPUsFromServer: name or index undefined', name, index);
            return;
        }
        const monitorGPUNElement = {
            id: 'CrysMonitor.ShowGpuUsage',
            name: ' Usage',
            category: ['CrysMonitor', `${this.menuPrefix} Show GPU`, 'Usage'],
            type: 'boolean',
            label: 'GPU',
            symbol: '%',
            monitorTitle: `0: ${name}`,
            defaultValue: true,
            htmlMonitorRef: undefined,
            htmlMonitorSliderRef: undefined,
            htmlMonitorLabelRef: undefined,
            cssColor: Colors.GPU,
            // @ts-ignore
            onChange: async (value) => {
                await this.updateServerGPU(index, { utilization: value });
                this.updateWidget(monitorGPUNElement);
            },
        };
        this.monitorGPUSettings[index] = monitorGPUNElement;
        app.ui.settings.addSetting(this.monitorGPUSettings[index]);
        this.monitorUI.createDOMGPUMonitor(this.monitorGPUSettings[index]);
    };
    createSettingsGPUVRAM = (name, index) => {
        if (name === undefined || index === undefined) {
            console.warn('getGPUsFromServer: name or index undefined', name, index);
            return;
        }
        // GPU VRAM Variables
        const monitorVRAMNElement = {
            id: 'CrysMonitor.ShowGpuVram',
            name: 'VRAM',
            category: ['CrysMonitor', `${this.menuPrefix} Show GPU`, 'VRAM'],
            type: 'boolean',
            label: 'VRAM',
            symbol: '%',
            monitorTitle: `0: ${name}`,
            defaultValue: true,
            htmlMonitorRef: undefined,
            htmlMonitorSliderRef: undefined,
            htmlMonitorLabelRef: undefined,
            cssColor: Colors.VRAM,
            // @ts-ignore
            onChange: async (value) => {
                await this.updateServerGPU(index, { vram: value });
                this.updateWidget(monitorVRAMNElement);
            },
        };
        this.monitorVRAMSettings[index] = monitorVRAMNElement;
        app.ui.settings.addSetting(this.monitorVRAMSettings[index]);
        this.monitorUI.createDOMGPUMonitor(this.monitorVRAMSettings[index]);
    };
    createSettingsGPUTemp = (name, index) => {
        if (name === undefined || index === undefined) {
            console.warn('getGPUsFromServer: name or index undefined', name, index);
            return;
        }
        // GPU Temperature Variables
        const monitorTemperatureNElement = {
            id: 'CrysMonitor.ShowGpuTemperature',
            name: 'Temperature',
            category: ['CrysMonitor', `${this.menuPrefix} Show GPU`, 'Temperature'],
            type: 'boolean',
            label: 'Temp',
            symbol: '°',
            monitorTitle: `0: ${name}`,
            defaultValue: true,
            htmlMonitorRef: undefined,
            htmlMonitorSliderRef: undefined,
            htmlMonitorLabelRef: undefined,
            cssColor: Colors.TEMP_START,
            cssColorFinal: Colors.TEMP_END,
            // @ts-ignore
            onChange: async (value) => {
                await this.updateServerGPU(index, { temperature: value });
                this.updateWidget(monitorTemperatureNElement);
            },
        };
        this.monitorTemperatureSettings[index] = monitorTemperatureNElement;
        app.ui.settings.addSetting(this.monitorTemperatureSettings[index]);
        this.monitorUI.createDOMGPUMonitor(this.monitorTemperatureSettings[index]);
    };
    createSettingsHDD = () => {
        // HDD Variables
        this.monitorHDDElement = {
            id: 'CrysMonitor.ShowHdd',
            name: 'Show HDD Used',
            category: ['CrysMonitor', this.menuPrefix + ' Show Hard Disk', 'Show'],
            type: 'boolean',
            label: 'HDD',
            symbol: '%',
            // tooltip: 'See Partition to show (HDD)',
            defaultValue: false,
            htmlMonitorRef: undefined,
            htmlMonitorSliderRef: undefined,
            htmlMonitorLabelRef: undefined,
            cssColor: Colors.DISK,
            // @ts-ignore
            onChange: async (value) => {
                await this.updateServer({ switchHDD: value });
                this.updateWidget(this.monitorHDDElement);
            },
        };
        this.settingsHDD = {
            id: 'CrysMonitor.WhichHdd',
            name: 'Partition to show',
            category: ['CrysMonitor', this.menuPrefix + ' Show Hard Disk', 'Which'],
            type: 'combo',
            defaultValue: '/',
            options: [],
            // @ts-ignore
            onChange: async (value) => {
                await this.updateServer({ whichHDD: value });
            },
        };
    };
    createSettings = () => {
        app.ui.settings.addSetting(this.settingsRate);
        app.ui.settings.addSetting(this.settingsMonitorHeight);
        app.ui.settings.addSetting(this.settingsMonitorHeightLegacy);
        app.ui.settings.addSetting(this.settingsMonitorWidth);
        app.ui.settings.addSetting(this.monitorRAMElement);
        app.ui.settings.addSetting(this.monitorCPUElement);
        void this.getHDDsFromServer().then((data) => {
            // @ts-ignore
            this.settingsHDD.options = data;
            app.ui.settings.addSetting(this.settingsHDD);
        });
        app.ui.settings.addSetting(this.monitorHDDElement);
        void this.getGPUsFromServer().then((gpus) => {
            if (gpus.length > 0) {
                const { name, index } = gpus[0];
                this.createSettingsGPUTemp(name, index);
                this.createSettingsGPUVRAM(name, index);
                this.createSettingsGPUUsage(name, index);
            }
            this.finishedLoad();
        });
    };
    finishedLoad = () => {
        this.monitorUI.orderMonitors();
        this.updateAllWidget();
        this.moveMonitor(this.menuDisplayOption);
        const w = app.extensionManager.setting.get(this.monitorWidthId);
        // Use correct height based on menu mode
        let h;
        if (this.menuDisplayOption === MenuDisplayOptions.Disabled) {
            h = app.extensionManager.setting.get(this.monitorHeightLegacyId);
        }
        else {
            h = app.extensionManager.setting.get(this.monitorHeightId);
        }
        this.monitorUI.updateMonitorSize(w, h);
    };
    updateDisplay = (value) => {
        if (value !== this.menuDisplayOption) {
            this.menuDisplayOption = value;
            this.moveMonitor(this.menuDisplayOption);
            // Auto-adjust height based on menu mode
            const w = app.extensionManager.setting.get(this.monitorWidthId);
            let h;
            if (value === MenuDisplayOptions.Disabled) {
                // Legacy menu - use legacy height
                h = app.extensionManager.setting.get(this.monitorHeightLegacyId);
            }
            else {
                // New menu (Top/Bottom) - use standard height
                h = app.extensionManager.setting.get(this.monitorHeightId);
            }
            this.monitorUI?.updateMonitorSize(w, h);
        }
    };
    moveMonitor = (menuPosition) => {
        let parentElement;
        switch (menuPosition) {
            case MenuDisplayOptions.Disabled:
                parentElement = document.getElementById('queue-button');
                if (parentElement && this.monitorUI.rootElement) {
                    parentElement.insertAdjacentElement('afterend', this.crysmonitorButtonGroup);
                }
                else {
                    console.error('CrysMonitor: parentElement to move monitors not found!', parentElement);
                }
                break;
            case MenuDisplayOptions.Top:
            case MenuDisplayOptions.Bottom:
                app.menu?.settingsGroup.element.before(this.crysmonitorButtonGroup);
        }
    };
    updateAllWidget = () => {
        this.updateWidget(this.monitorCPUElement);
        this.updateWidget(this.monitorRAMElement);
        this.updateWidget(this.monitorHDDElement);
        this.monitorGPUSettings.forEach((monitorSettings) => {
            monitorSettings && this.updateWidget(monitorSettings);
        });
        this.monitorVRAMSettings.forEach((monitorSettings) => {
            monitorSettings && this.updateWidget(monitorSettings);
        });
        this.monitorTemperatureSettings.forEach((monitorSettings) => {
            monitorSettings && this.updateWidget(monitorSettings);
        });
    };
    /**
     * for the settings menu
     * @param monitorSettings
     */
    updateWidget = (monitorSettings) => {
        if (this.monitorUI) {
            const value = app.extensionManager.setting.get(monitorSettings.id);
            this.monitorUI.showMonitor(monitorSettings, value);
        }
    };
    updateServer = async (data) => {
        const resp = await api.fetchApi('/crysmonitor/monitor', {
            method: 'POST',
            body: JSON.stringify(data),
            cache: 'no-store',
        });
        if (resp.status === 200) {
            return await resp.text();
        }
        throw new Error(resp.statusText);
    };
    updateServerGPU = async (index, data) => {
        const resp = await api.fetchApi(`/crysmonitor/monitor/GPU/${index}`, {
            method: 'POST',
            body: JSON.stringify(data),
            cache: 'no-store',
        });
        if (resp.status === 200) {
            return await resp.text();
        }
        throw new Error(resp.statusText);
    };
    getHDDsFromServer = async () => {
        return this.getDataFromServer('HDD');
    };
    getGPUsFromServer = async () => {
        return this.getDataFromServer('GPU');
    };
    getDataFromServer = async (what) => {
        const resp = await api.fetchApi(`/crysmonitor/monitor/${what}`, {
            method: 'GET',
            cache: 'no-store',
        });
        if (resp.status === 200) {
            return await resp.json();
        }
        throw new Error(resp.statusText);
    };
    getFolderName = async () => {
        const resp = await api.fetchApi('/crysmonitor/folder_name', {
            method: 'GET',
            cache: 'no-store',
        });
        if (resp.status === 200) {
            this.folderName = await resp.json();
        }
        else {
            throw new Error(resp.statusText);
        }
    };
    init = async () => {
        // Register event listener early to avoid "Unhandled message" warnings
        api.addEventListener('crysmonitor.monitor', (event) => {
            if (event?.detail === undefined) {
                return;
            }
            this.monitorUI?.updateDisplay(event.detail);
        });
    };
    setup = async () => {
        if (this.monitorUI) {
            return;
        }
        await this.getFolderName();
        addStylesheet(this.folderName);
        this.createSettingsRate();
        this.createSettingsMonitorHeight();
        this.createSettingsMonitorHeightLegacy();
        this.createSettingsMonitorWidth();
        this.createSettingsCPU();
        this.createSettingsRAM();
        this.createSettingsHDD();
        this.createSettings();
        const currentRate = parseFloat(app.extensionManager.setting.get(this.settingsRate.id));
        this.menuDisplayOption = app.extensionManager.setting.get(ComfyKeyMenuDisplayOption);
        app.ui.settings.addEventListener(`${ComfyKeyMenuDisplayOption}.change`, (e) => {
            this.updateDisplay(e.detail.value);
        });
        this.crysmonitorButtonGroup = document.createElement('div');
        this.crysmonitorButtonGroup.id = 'crysmonitor-monitors-root';
        app.menu?.settingsGroup.element.before(this.crysmonitorButtonGroup);
        this.monitorUI = new MonitorUI(this.crysmonitorButtonGroup, this.monitorCPUElement, this.monitorRAMElement, this.monitorHDDElement, this.monitorGPUSettings, this.monitorVRAMSettings, this.monitorTemperatureSettings, currentRate);
        this.updateDisplay(this.menuDisplayOption);
    };
}
const crysmonitorMonitor = new CrysMonitorMonitor();
app.registerExtension({
    name: crysmonitorMonitor.idExtensionName,
    init: crysmonitorMonitor.init,
    setup: crysmonitorMonitor.setup,
});
//# sourceMappingURL=monitor.js.map