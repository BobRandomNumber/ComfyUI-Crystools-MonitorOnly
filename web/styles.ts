import { utils } from './comfy/index.js';

export function addStylesheet(folderName: string) {
  const version = Math.random().toString(36).substring(7);
  utils.addStylesheet(`extensions/${folderName}/monitor.css?v=${version}`);
}

export enum Colors {
  'CPU' = '#0AA015',
  'RAM' = '#07630D',
  'DISK' = '#730F92',
  'GPU' = '#0C86F4',
  'VRAM' = '#176EC7',
  'TEMP_START' = '#00ff00',
  'TEMP_END' = '#ff0000',
}
