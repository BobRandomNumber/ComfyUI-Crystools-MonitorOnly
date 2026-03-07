import { ProgressBarUIBase } from './progressBarUIBase.js';
import { createStyleSheet, formatBytes } from './utils.js';

export class MonitorUI extends ProgressBarUIBase {
  lastMonitor = 1; // just for order on monitors section
  styleSheet: HTMLStyleElement;
  maxVRAMUsed: Record<number, number> = {}; // Add this to track max VRAM per GPU
  private _disableSmooth = false;
  private _numbersOnly = false;
  private _numbersOnlySheet: HTMLStyleElement;
  private _disableSmoothSheet: HTMLStyleElement;
  private _pendingData: TStatsData | null = null;
  private _rafId = 0;

  constructor(
    public override rootElement: HTMLElement,
    private monitorCPUElement: TMonitorSettings,
    private monitorRAMElement: TMonitorSettings,
    private monitorHDDElement: TMonitorSettings,
    private monitorGPUSettings: TMonitorSettings[],
    private monitorVRAMSettings: TMonitorSettings[],
    private monitorTemperatureSettings: TMonitorSettings[],
    private currentRate: number,
    disableSmooth: boolean = false,
    numbersOnly: boolean = false,
  ) {
    super('crysmonitor-monitors-root', rootElement);
    this._disableSmooth = disableSmooth;
    this._numbersOnly = numbersOnly;
    this._numbersOnlySheet = createStyleSheet('crysmonitor-numbers-only');
    this._disableSmoothSheet = createStyleSheet('crysmonitor-disable-smooth');
    this.createDOM();

    this.styleSheet = createStyleSheet('crysmonitor-monitors-size');

    // Apply initial states
    this._applyNumbersOnlyCSS();
    this._applyDisableSmoothCSS();
  }

  createDOM = (): void => {
    if (!this.rootElement) {
      throw Error('CrysMonitor: MonitorUI - Container not found');
    }

    // this.container.style.order = '2';
    this.rootElement.appendChild(this.createMonitor(this.monitorCPUElement));
    this.rootElement.appendChild(this.createMonitor(this.monitorRAMElement));
    this.rootElement.appendChild(this.createMonitor(this.monitorHDDElement));
    this.updateAllAnimationDuration(this.currentRate);
  };

  createDOMGPUMonitor = (monitorSettings?: TMonitorSettings): void => {
    if (!(monitorSettings && this.rootElement)) {
      return;
    }

    this.rootElement.appendChild(this.createMonitor(monitorSettings));
    this.updateAllAnimationDuration(this.currentRate);
  };

  orderMonitors = (): void => {
    try {
      // @ts-ignore
      this.monitorCPUElement.htmlMonitorRef.style.order = '' + this.lastMonitor++;
      // @ts-ignore
      this.monitorRAMElement.htmlMonitorRef.style.order = '' + this.lastMonitor++;
      // @ts-ignore
      this.monitorGPUSettings.forEach((_monitorSettings, index) => {
        // @ts-ignore
        this.monitorGPUSettings[index].htmlMonitorRef.style.order = '' + this.lastMonitor++;
        // @ts-ignore
        this.monitorVRAMSettings[index].htmlMonitorRef.style.order = '' + this.lastMonitor++;
        // @ts-ignore
        this.monitorTemperatureSettings[index].htmlMonitorRef.style.order = '' + this.lastMonitor++;
      });
      // @ts-ignore
      this.monitorHDDElement.htmlMonitorRef.style.order = '' + this.lastMonitor++;
    } catch (error) {
      console.error('orderMonitors', error);
    }
  };

  updateDisplay = (data: TStatsData): void => {
    // Store latest data; if multiple messages arrive before next frame, only the last one is rendered
    this._pendingData = data;
    if (!this._rafId) {
      this._rafId = requestAnimationFrame(this._flushDisplay);
    }
  };

  private _flushDisplay = (): void => {
    this._rafId = 0;
    const data = this._pendingData;
    if (!data) return;

    // Skip all DOM writes when the tab is not visible — keep data so the
    // next rAF after the tab becomes visible will use the latest snapshot.
    if (document.hidden) return;

    this._pendingData = null;
    this._doUpdateDisplay(data);
  };

  private _doUpdateDisplay = (data: TStatsData): void => {
    this.updateMonitor(this.monitorCPUElement, data.cpu_utilization);
    this.updateMonitor(this.monitorRAMElement, data.ram_used_percent, data.ram_used, data.ram_total);
    this.updateMonitor(this.monitorHDDElement, data.hdd_used_percent, data.hdd_used, data.hdd_total);

    if (data.gpus === undefined || data.gpus.length === 0) {
      console.warn('UpdateAllMonitors: no GPU data');
      return;
    }

    this.monitorGPUSettings.forEach((monitorSettings, index) => {
      if (data.gpus[index]) {
        const gpu = data.gpus[index];
        if (gpu === undefined) {
          // console.error('UpdateAllMonitors: no GPU data for index', index);
          return;
        }

        this.updateMonitor(monitorSettings, gpu.gpu_utilization);
      } else {
        // console.error('UpdateAllMonitors: no GPU data for index', index);
      }
    });

    this.monitorVRAMSettings.forEach((monitorSettings, index) => {
      if (data.gpus[index]) {
        const gpu = data.gpus[index];
        if (gpu === undefined) {
          // console.error('UpdateAllMonitors: no GPU VRAM data for index', index);
          return;
        }

        this.updateMonitor(monitorSettings, gpu.vram_used_percent, gpu.vram_used, gpu.vram_total);
      } else {
        // console.error('UpdateAllMonitors: no GPU VRAM data for index', index);
      }
    });

    this.monitorTemperatureSettings.forEach((monitorSettings, index) => {
      if (data.gpus[index]) {
        const gpu = data.gpus[index];
        if (gpu === undefined) {
          // console.error('UpdateAllMonitors: no GPU VRAM data for index', index);
          return;
        }

        this.updateMonitor(monitorSettings, gpu.gpu_temperature);
        if (!this._numbersOnly && monitorSettings.cssColorFinal && monitorSettings.htmlMonitorSliderRef) {
          const tempFloored = Math.floor(gpu.gpu_temperature);
          if (monitorSettings._lastTempColor !== tempFloored) {
            monitorSettings._lastTempColor = tempFloored;
            monitorSettings.htmlMonitorSliderRef.style.backgroundColor =
              `color-mix(in srgb, ${monitorSettings.cssColorFinal} ${tempFloored}%, ${monitorSettings.cssColor})`;
          }
        }
      } else {
        // console.error('UpdateAllMonitors: no GPU VRAM data for index', index);
      }
    });
  };

  // eslint-disable-next-line complexity
  updateMonitor = (monitorSettings: TMonitorSettings, percent: number, used?: number, total?: number): void => {
    if (!(monitorSettings.htmlMonitorSliderRef && monitorSettings.htmlMonitorLabelRef)) {
      return;
    }

    if (percent < 0) {
      return;
    }

    const flooredPercent = Math.floor(percent);
    // Skip all DOM writes if nothing has changed
    if (monitorSettings._lastPercent === flooredPercent &&
        monitorSettings._lastUsed === used &&
        monitorSettings._lastTotal === total) {
      return;
    }
    monitorSettings._lastPercent = flooredPercent;
    monitorSettings._lastUsed = used;
    monitorSettings._lastTotal = total;

    const prefix = monitorSettings.monitorTitle ? monitorSettings.monitorTitle + ' - ' : '';
    let title = `${flooredPercent}${monitorSettings.symbol}`;
    let postfix = '';

    // Add max VRAM tracking for VRAM monitors
    if (used !== undefined && total !== undefined) {
      // Extract GPU index from monitorTitle (assuming format "X: GPU Name")
      const gpuIndex = parseInt(monitorSettings.monitorTitle?.split(':')[0] || '0');

      // Initialize max VRAM if not set or  glitch
      if (!this.maxVRAMUsed[gpuIndex] || this.maxVRAMUsed[gpuIndex]! > total) {
        this.maxVRAMUsed[gpuIndex] = 0;
      }

      // Update max VRAM if current usage is higher
      if ( used > this.maxVRAMUsed[gpuIndex]!) {
        this.maxVRAMUsed[gpuIndex] = used;
      }

      postfix = ` - ${formatBytes(used)} / ${formatBytes(total)}`;
      // Add max VRAM to tooltip
      postfix += ` Max: ${formatBytes(this.maxVRAMUsed[gpuIndex]!)}`;
    }

    title = `${prefix}${title}${postfix}`;

    if (monitorSettings.htmlMonitorRef) {
      monitorSettings.htmlMonitorRef.title = title;
    }
    monitorSettings.htmlMonitorLabelRef.textContent = `${flooredPercent}${monitorSettings.symbol}`;

    // Skip slider transform when in numbers-only mode — no compositor work for hidden elements
    if (!this._numbersOnly) {
      monitorSettings.htmlMonitorSliderRef.style.transform = `scaleX(${Math.min(flooredPercent / 100, 1).toFixed(4)})`;
    }
  };

  updateAllAnimationDuration = (value: number): void => {
    this.currentRate = value;
    this.updatedAnimationDuration(this.monitorCPUElement, value);
    this.updatedAnimationDuration(this.monitorRAMElement, value);
    this.updatedAnimationDuration(this.monitorHDDElement, value);
    this.monitorGPUSettings.forEach((monitorSettings) => {
      monitorSettings && this.updatedAnimationDuration(monitorSettings, value);
    });
    this.monitorVRAMSettings.forEach((monitorSettings) => {
      monitorSettings && this.updatedAnimationDuration(monitorSettings, value);
    });
    this.monitorTemperatureSettings.forEach((monitorSettings) => {
      monitorSettings && this.updatedAnimationDuration(monitorSettings, value);
    });
  };

  updatedAnimationDuration = (monitorSettings: TMonitorSettings, value: number): void => {
    const slider = monitorSettings.htmlMonitorSliderRef;
    if (!slider) {
      return;
    }

    // When smooth is disabled, the stylesheet handles transition:none globally.
    // Only set inline transition when smooth is enabled.
    if (!this._disableSmooth) {
      slider.style.transition = `transform ${value.toFixed(1)}s linear`;
    } else {
      slider.style.transition = '';
    }
  };

  setDisableSmooth = (value: boolean): void => {
    this._disableSmooth = value;
    this._applyDisableSmoothCSS();
    this.updateAllAnimationDuration(this.currentRate);
  };

  private _applyDisableSmoothCSS = (): void => {
    if (this._disableSmooth) {
      this._disableSmoothSheet.innerText =
        '#crysmonitor-monitors-root .crysmonitor-slider { transition: none !important; }';
    } else {
      this._disableSmoothSheet.innerText = '';
    }
  };

  setNumbersOnly = (value: boolean): void => {
    const wasNumbersOnly = this._numbersOnly;
    this._numbersOnly = value;
    this._applyNumbersOnlyCSS();

    // When switching from numbers-only back to bars, invalidate cached values
    // so the next updateMonitor() call writes fresh slider transforms.
    if (wasNumbersOnly && !value) {
      this._invalidateMonitorCaches();
    }
  };

  private _invalidateMonitorCaches = (): void => {
    const allSettings = [
      this.monitorCPUElement,
      this.monitorRAMElement,
      this.monitorHDDElement,
      ...this.monitorGPUSettings,
      ...this.monitorVRAMSettings,
      ...this.monitorTemperatureSettings,
    ];
    for (const s of allSettings) {
      if (s) {
        s._lastPercent = undefined;
        s._lastUsed = undefined;
        s._lastTotal = undefined;
        s._lastTempColor = undefined;
      }
    }
  };

  private _applyNumbersOnlyCSS = (): void => {
    if (this._numbersOnly) {
      this._numbersOnlySheet.innerText =
        '#crysmonitor-monitors-root .crysmonitor-slider { display: none !important; }' +
        '#crysmonitor-monitors-root .crysmonitor-content { background-color: transparent !important; }';
    } else {
      this._numbersOnlySheet.innerText = '';
    }
  };

  createMonitor = (monitorSettings?: TMonitorSettings): HTMLDivElement => {
    if (!monitorSettings) {
      // just for typescript
      return document.createElement('div');
    }

    const htmlMain = document.createElement('div');
    htmlMain.classList.add(monitorSettings.id);
    htmlMain.classList.add('crysmonitor-monitor');

    monitorSettings.htmlMonitorRef = htmlMain;

    if (monitorSettings.title) {
      htmlMain.title = monitorSettings.title;
    }

    const htmlMonitorText = document.createElement('div');
    htmlMonitorText.classList.add('crysmonitor-text');
    htmlMonitorText.innerHTML = monitorSettings.label;
    htmlMain.append(htmlMonitorText);

    const htmlMonitorContent = document.createElement('div');
    htmlMonitorContent.classList.add('crysmonitor-content');
    htmlMain.append(htmlMonitorContent);

    const htmlMonitorSlider = document.createElement('div');
    htmlMonitorSlider.classList.add('crysmonitor-slider');
    if (monitorSettings.cssColorFinal) {
      htmlMonitorSlider.style.backgroundColor =
        `color-mix(in srgb, ${monitorSettings.cssColorFinal} 0%, ${monitorSettings.cssColor})`;
    } else {
      htmlMonitorSlider.style.backgroundColor = monitorSettings.cssColor;
    }
    monitorSettings.htmlMonitorSliderRef = htmlMonitorSlider;
    htmlMonitorContent.append(htmlMonitorSlider);

    const htmlMonitorLabel = document.createElement('div');
    htmlMonitorLabel.classList.add('crysmonitor-label');
    monitorSettings.htmlMonitorLabelRef = htmlMonitorLabel;
    htmlMonitorContent.append(htmlMonitorLabel);
    htmlMonitorLabel.textContent = '0%';
    return monitorSettings.htmlMonitorRef;
  };

  updateMonitorSize = (width: number, height: number): void => {
    // eslint-disable-next-line max-len
    this.styleSheet.innerText = `#crysmonitor-monitors-root .crysmonitor-monitor .crysmonitor-content {height: ${height}px; width: ${width}px;}`;
  };

  showMonitor = (monitorSettings: TMonitorSettings, value: boolean): void => {
    if (monitorSettings.htmlMonitorRef) {
      monitorSettings.htmlMonitorRef.style.display = value ? 'flex' : 'none';
    }
  };
}
