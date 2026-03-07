type TMonitorSettings = {
  id: string;
  name: string;
  category: string[];
  type: string;
  label: string;
  symbol: string;
  defaultValue: boolean | string | number;
  htmlMonitorRef: HTMLDivElement | undefined;
  htmlMonitorSliderRef: HTMLDivElement | undefined;
  htmlMonitorLabelRef: HTMLDivElement | undefined;
  cssColor: string;
  cssColorFinal?: string;
  monitorTitle?: string;
  tooltip?: string;
  attrs?: Record<string, number | string>;
  options?: string[];
  experimental?: boolean;
  title?: string;
  // Runtime cache fields — skip DOM writes when value unchanged
  _lastPercent?: number;
  _lastUsed?: number;
  _lastTotal?: number;
  _lastTempColor?: number;
}

type TStatsData = {
  cpu_utilization: number;
  device: string;
  gpus: TGpuStats[];
  hdd_total: number;
  hdd_used: number;
  hdd_used_percent: number;
  ram_total: number;
  ram_used: number;
  ram_used_percent: number;
}

type TGpuStats = {
  gpu_utilization: number;
  gpu_temperature: number;
  vram_total: number;
  vram_used: number;
  vram_used_percent: number;
}

type TGpuName = {
  name: string;
  index: number;
}

type TStatsSettings = {
  rate?: number;
  switchCPU?: boolean;
  switchRAM?: boolean;
  switchHDD?: boolean;
  whichHDD?: string;
}

type TGpuSettings = {
  utilization?: boolean;
  vram?: boolean;
  temperature?: boolean;
}
