export var EStatus;
(function (EStatus) {
    EStatus["executing"] = "Executing";
    EStatus["executed"] = "Executed";
    EStatus["execution_error"] = "Execution error";
})(EStatus || (EStatus = {}));
export const ComfyKeyMenuDisplayOption = 'Comfy.UseNewMenu';
export var MenuDisplayOptions;
(function (MenuDisplayOptions) {
    MenuDisplayOptions["Disabled"] = "Disabled";
    MenuDisplayOptions["Top"] = "Top";
    MenuDisplayOptions["Bottom"] = "Bottom";
})(MenuDisplayOptions || (MenuDisplayOptions = {}));
export class ProgressBarUIBase {
    rootId;
    rootElement;
    htmlClassMonitor = 'crysmonitor-monitors-container';
    constructor(rootId, rootElement) {
        this.rootId = rootId;
        this.rootElement = rootElement;
        // IMPORTANT duplicate on crystools-save
        if (this.rootElement && this.rootElement.children.length === 0) {
            this.rootElement.setAttribute('id', this.rootId);
            this.rootElement.classList.add(this.htmlClassMonitor);
            this.rootElement.classList.add(this.constructor.name);
        }
        else {
            // it was created before
        }
    }
}
//# sourceMappingURL=progressBarUIBase.js.map