const BYTE_UNITS = ['Bytes', 'KB', 'MB', 'GB', 'TB'] as const;
const LOG_1024 = Math.log(1024);

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const i = Math.floor(Math.log(bytes) / LOG_1024);
  const formattedSize = (bytes / Math.pow(1024, i)).toFixed(2);

  return `${formattedSize} ${BYTE_UNITS[i]}`;
}

export function createStyleSheet(id: string): HTMLStyleElement {
  const style = document.createElement('style');
  style.setAttribute('id', id);
  style.setAttribute('rel', 'stylesheet');
  style.setAttribute('type', 'text/css');
  document.head.appendChild(style);
  return style;
}
