import { app, api } from './comfy/index.js';
import { commonPrefix } from './common.js';
import { MonitorUI } from './monitorUI.js';
import { addStylesheet, Colors } from './styles.js';
import { ComfyKeyMenuDisplayOption, MenuDisplayOptions } from './progressBarUIBase.js';

class CrysMonitorMonitor {
  readonly idExtensionName = 'CrysMonitor.monitor';
  private readonly menuPrefix = commonPrefix;
  private menuDisplayOption: MenuDisplayOptions = MenuDisplayOptions.Disabled;
  private folderName: string = '';
  private crysmonitorButtonGroup: HTMLDivElement = null!;

  private settingsRate: TMonitorSettings = null!;
  private settingsMonitorHeight: TMonitorSettings = null!;
  private settingsMonitorHeightLegacy: TMonitorSettings = null!;
  private settingsMonitorWidth: TMonitorSettings = null!;
  private monitorCPUElement: TMonitorSettings = null!;
  private monitorRAMElement: TMonitorSettings = null!;
  private monitorHDDElement: TMonitorSettings = null!;
  private settingsHDD: TMonitorSettings = null!;
  private monitorGPUSettings: TMonitorSettings[] = [];
  private monitorVRAMSettings: TMonitorSettings[] = [];
  private monitorTemperatureSettings: TMonitorSettings[] = [];

  private monitorUI: MonitorUI = null!;

  private readonly monitorWidthId = 'CrysMonitor.MonitorWidth';
  private readonly monitorWidth = 60;
  private readonly monitorHeightId = 'CrysMonitor.MonitorHeight';
  private readonly monitorHeight = 40;
  private readonly monitorHeightLegacyId = 'CrysMonitor.MonitorHeightLegacy';
  private readonly monitorHeightLegacy = 19;

  createSettingsRate = (): void => {
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
      defaultValue: 1,

      // @ts-ignore
      onChange: async(value: string): Promise<void> => {
        let valueNumber: number;

        try {
          valueNumber = parseFloat(value);
          if (isNaN(valueNumber)) {
            throw new Error('invalid value');
          }
        } catch (error) {
          console.error(error);
          return;
        }
        try {
          await this.updateServer({rate: valueNumber});
        } catch (error) {
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

  createSettingsMonitorWidth = (): void => {
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
      onChange: (value: string): void => {
        let valueNumber: number;

        try {
          valueNumber = parseInt(value);
          if (isNaN(valueNumber)) {
            throw new Error('invalid value');
          }
        } catch (error) {
          console.error(error);
          return;
        }

        const h = app.extensionManager.setting.get(this.monitorHeightId);
        this.monitorUI?.updateMonitorSize(valueNumber, h);
      },
    };
  };

  createSettingsMonitorHeight = (): void => {
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
      onChange: async(value: string): void => {
        let valueNumber: number;

        try {
          valueNumber = parseInt(value);
          if (isNaN(valueNumber)) {
            throw new Error('invalid value');
          }
        } catch (error) {
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

  createSettingsMonitorHeightLegacy = (): void => {
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
      onChange: async(value: string): void => {
        let valueNumber: number;

        try {
          valueNumber = parseInt(value);
          if (isNaN(valueNumber)) {
            throw new Error('invalid value');
          }
        } catch (error) {
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

  createSettingsCPU = (): void => {
    // CPU Variables
    this.monitorCPUElement = {
      id: 'CrysMonitor.ShowCpu',
      name: 'CPU Usage',
      category: ['CrysMonitor', this.menuPrefix + ' Hardware', 'Cpu'],
      type: 'boolean',
      label: 'CPU',
      symbol: '%',
      defaultValue: false,
      htmlMonitorRef: undefined,
      htmlMonitorSliderRef: undefined,
      htmlMonitorLabelRef: undefined,
      cssColor: Colors.CPU,
      // @ts-ignore
      onChange: async(value: boolean): Promise<void> => {
        await this.updateServer({switchCPU: value});
        this.updateWidget(this.monitorCPUElement);
      },
    };
  };

  createSettingsRAM = (): void => {
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
      onChange: async(value: boolean): Promise<void> => {
        await this.updateServer({switchRAM: value});
        this.updateWidget(this.monitorRAMElement);
      },
    };
  };

  createSettingsGPUUsage = (name: string, index: number): void => {
    if (name === undefined || index === undefined) {
      console.warn('getGPUsFromServer: name or index undefined', name, index);
      return;
    }

    const monitorGPUNElement: TMonitorSettings = {
      id: 'CrysMonitor.ShowGpuUsage',
      name: ' Usage',
      category: ['CrysMonitor', `${this.menuPrefix} Show GPU`, 'Usage'],
      type: 'boolean',
      label: 'GPU',
      symbol: '%',
      monitorTitle: `0: ${name}`,
      defaultValue: false,
      htmlMonitorRef: undefined,
      htmlMonitorSliderRef: undefined,
      htmlMonitorLabelRef: undefined,
      cssColor: Colors.GPU,
      // @ts-ignore
      onChange: async(value: boolean): Promise<void> => {
        await this.updateServerGPU(index, {utilization: value});
        this.updateWidget(monitorGPUNElement);
      },
    };

    this.monitorGPUSettings[index] = monitorGPUNElement;
    app.ui.settings.addSetting(this.monitorGPUSettings[index]);
    this.monitorUI.createDOMGPUMonitor(this.monitorGPUSettings[index]);
  };

  createSettingsGPUVRAM = (name: string, index: number): void => {
    if (name === undefined || index === undefined) {
      console.warn('getGPUsFromServer: name or index undefined', name, index);
      return;
    }

    // GPU VRAM Variables
    const monitorVRAMNElement: TMonitorSettings = {
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
      onChange: async(value: boolean): Promise<void> => {
        await this.updateServerGPU(index, {vram: value});
        this.updateWidget(monitorVRAMNElement);
      },
    };

    this.monitorVRAMSettings[index] = monitorVRAMNElement;
    app.ui.settings.addSetting(this.monitorVRAMSettings[index]);
    this.monitorUI.createDOMGPUMonitor(this.monitorVRAMSettings[index]);
  };

  createSettingsGPUTemp = (name: string, index: number): void => {
    if (name === undefined || index === undefined) {
      console.warn('getGPUsFromServer: name or index undefined', name, index);
      return;
    }

    // GPU Temperature Variables
    const monitorTemperatureNElement: TMonitorSettings = {
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
      onChange: async(value: boolean): Promise<void> => {
        await this.updateServerGPU(index, {temperature: value});
        this.updateWidget(monitorTemperatureNElement);
      },
    };

    this.monitorTemperatureSettings[index] = monitorTemperatureNElement;
    app.ui.settings.addSetting(this.monitorTemperatureSettings[index]);
    this.monitorUI.createDOMGPUMonitor(this.monitorTemperatureSettings[index]);
  };

  createSettingsHDD = (): void => {
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
      onChange: async(value: boolean): Promise<void> => {
        await this.updateServer({switchHDD: value});
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
      onChange: async(value: string): Promise<void> => {
        await this.updateServer({whichHDD: value});
      },
    };
  };

  createSettings = (): void => {
    app.ui.settings.addSetting(this.settingsRate);
    app.ui.settings.addSetting(this.settingsMonitorHeight);
    app.ui.settings.addSetting(this.settingsMonitorHeightLegacy);
    app.ui.settings.addSetting(this.settingsMonitorWidth);
    app.ui.settings.addSetting(this.monitorRAMElement);
    app.ui.settings.addSetting(this.monitorCPUElement);

    void this.getHDDsFromServer().then((data: string[]): void => {
      // @ts-ignore
      this.settingsHDD.options = data;
      app.ui.settings.addSetting(this.settingsHDD);
    });
    app.ui.settings.addSetting(this.monitorHDDElement);

    void this.getGPUsFromServer().then((gpus: TGpuName[]): void => {
      if (gpus.length > 0) {
        const {name, index} = gpus[0];
        this.createSettingsGPUTemp(name, index);
        this.createSettingsGPUVRAM(name, index);
        this.createSettingsGPUUsage(name, index);
      }

      this.finishedLoad();
    });
  };

  finishedLoad = (): void => {
    this.monitorUI.orderMonitors();
    this.updateAllWidget();
    this.moveMonitor(this.menuDisplayOption);

    const w = app.extensionManager.setting.get(this.monitorWidthId);
    // Use correct height based on menu mode
    let h: number;
    if (this.menuDisplayOption === MenuDisplayOptions.Disabled) {
      h = app.extensionManager.setting.get(this.monitorHeightLegacyId);
    } else {
      h = app.extensionManager.setting.get(this.monitorHeightId);
    }
    this.monitorUI.updateMonitorSize(w, h);
  };

  updateDisplay = (value: MenuDisplayOptions): void => {
    if (value !== this.menuDisplayOption) {
      this.menuDisplayOption = value;
      this.moveMonitor(this.menuDisplayOption);
      // Auto-adjust height based on menu mode
      const w = app.extensionManager.setting.get(this.monitorWidthId);
      let h: number;
      if (value === MenuDisplayOptions.Disabled) {
        // Legacy menu - use legacy height
        h = app.extensionManager.setting.get(this.monitorHeightLegacyId);
      } else {
        // New menu (Top/Bottom) - use standard height
        h = app.extensionManager.setting.get(this.monitorHeightId);
      }
      this.monitorUI?.updateMonitorSize(w, h);
    }
  };

  moveMonitor = (menuPosition: MenuDisplayOptions): void => {
    let parentElement: Element | null | undefined;

    switch (menuPosition) {
      case MenuDisplayOptions.Disabled:
        parentElement = document.getElementById('queue-button');
        if (parentElement && this.monitorUI.rootElement) {
          parentElement.insertAdjacentElement('afterend', this.crysmonitorButtonGroup);
        } else {
          console.error('CrysMonitor: parentElement to move monitors not found!', parentElement);
        }
        break;

      case MenuDisplayOptions.Top:
      case MenuDisplayOptions.Bottom:
        app.menu?.settingsGroup.element.before(this.crysmonitorButtonGroup);
    }
  };

  updateAllWidget = (): void => {
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
  updateWidget = (monitorSettings: TMonitorSettings): void => {
    if (this.monitorUI) {
      const value = app.extensionManager.setting.get(monitorSettings.id);
      this.monitorUI.showMonitor(monitorSettings, value);
    }
  };

  updateServer = async(data: TStatsSettings): Promise<string> => {
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

  updateServerGPU = async(index: number, data: TGpuSettings): Promise<string> => {
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

  getHDDsFromServer = async(): Promise<string[]> => {
    return this.getDataFromServer('HDD');
  };

  getGPUsFromServer = async(): Promise<TGpuName[]> => {
    return this.getDataFromServer<TGpuName>('GPU');
  };

  getDataFromServer = async <T>(what: string): Promise<T[]> => {
    const resp = await api.fetchApi(`/crysmonitor/monitor/${what}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (resp.status === 200) {
      return await resp.json();
    }
    throw new Error(resp.statusText);
  };

  getFolderName = async(): Promise<void> => {
    const resp = await api.fetchApi('/crysmonitor/folder_name', {
      method: 'GET',
      cache: 'no-store',
    });
    if (resp.status === 200) {
      this.folderName = await resp.json();
    } else {
      throw new Error(resp.statusText);
    }
  };

  init = async (): Promise<void> => {
    // Register event listener early to avoid "Unhandled message" warnings
    api.addEventListener('crysmonitor.monitor', (event: CustomEvent) => {
      if (event?.detail === undefined) {
        return;
      }
      this.monitorUI?.updateDisplay(event.detail);
    });
  };

  setup = async (): Promise<void> => {
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

    const currentRate =
      parseFloat(app.extensionManager.setting.get(this.settingsRate.id));

    this.menuDisplayOption = app.extensionManager.setting.get(ComfyKeyMenuDisplayOption);
    app.ui.settings.addEventListener(`${ComfyKeyMenuDisplayOption}.change`, (e: any) => {
        this.updateDisplay(e.detail.value);
      },
    );

    this.crysmonitorButtonGroup = document.createElement('div');
    this.crysmonitorButtonGroup.id = 'crysmonitor-monitors-root';
    app.menu?.settingsGroup.element.before(this.crysmonitorButtonGroup);

    this.monitorUI = new MonitorUI(
      this.crysmonitorButtonGroup,
      this.monitorCPUElement,
      this.monitorRAMElement,
      this.monitorHDDElement,
      this.monitorGPUSettings,
      this.monitorVRAMSettings,
      this.monitorTemperatureSettings,
      currentRate,
    );

    this.updateDisplay(this.menuDisplayOption);
  };
}

const crysmonitorMonitor = new CrysMonitorMonitor();
app.registerExtension({
  name: crysmonitorMonitor.idExtensionName,
  init: crysmonitorMonitor.init,
  setup: crysmonitorMonitor.setup,
});
