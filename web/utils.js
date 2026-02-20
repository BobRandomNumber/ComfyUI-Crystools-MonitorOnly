export function formatBytes(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const formattedSize = (bytes / Math.pow(1024, i)).toFixed(2);
    return `${formattedSize} ${sizes[i]}`;
}
export function createStyleSheet(id) {
    const style = document.createElement('style');
    style.setAttribute('id', id);
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('type', 'text/css');
    document.head.appendChild(style);
    return style;
}
