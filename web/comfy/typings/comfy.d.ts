declare global {
  const LiteGraph: any;
	const LGraph: any;
	const LGraphNode: any;
	const LGraphCanvas: any;
	const LGraphGroup: any;
}

// @rgthree: Types on ComfyApp as needed.
export interface ComfyApp {
	extensions: ComfyExtension[];
	async queuePrompt(number?: number, batchCount = 1): Promise<void>;
	graph: any;
	canvas: any;
	clean() : void;
 	registerExtension(extension: ComfyExtension): void;
	getPreviewFormatParam(): string;
	getRandParam(): string;
	loadApiJson(apiData: {}, fileName: string): void;
	async graphToPrompt(graph?: any, clean?: boolean): Promise<void>;
	// workflow: ComfyWorkflowInstance ???
	async loadGraphData(graphData: {}, clean?: boolean, restore_view?: boolean, workflow?: any|null): Promise<void>
	ui: {
		settings: {
			addSetting(config: {id: string, name: string, type: () => HTMLElement}) : void;
		}
	}
	// Just marking as any for now.
	menu?: any;
}

export interface ComfyExtension {
	/**
	 * The name of the extension
	 */
	name: string;
	/**
	 * Allows any initialisation, e.g. loading resources. Called after the canvas is created but before nodes are added
	 * @param app The ComfyUI app instance
	 */
	init?(app: ComfyApp): Promise<void>;
	/**
	 * Allows any additonal setup, called after the application is fully set up and running
	 * @param app The ComfyUI app instance
	 */
	setup?(app: ComfyApp): Promise<void>;
	/**
	 * Called before nodes are registered with the graph
	 * @param defs The collection of node definitions, add custom ones or edit existing ones
	 * @param app The ComfyUI app instance
	 */
	addCustomNodeDefs?(defs: Record<string, any>, app: ComfyApp): Promise<void>;
	/**
	 * Allows the extension to add custom widgets
	 * @param app The ComfyUI app instance
	 * @returns An array of {[widget name]: widget data}
	 */
	getCustomWidgets?(
		app: ComfyApp
	): Promise<
		Record<string, (node, inputName, inputData, app) => { widget?: any; minWidth?: number; minHeight?: number }>
	>;
	/**
	 * Allows the extension to add additional handling to the node before it is registered with LGraph
	 * @rgthree changed nodeType from `typeof LGraphNode` to `ComfyNodeConstructor`
	 * @param nodeType The node class (not an instance)
	 * @param nodeData The original node object info config object
	 * @param app The ComfyUI app instance
	 */
	beforeRegisterNodeDef?(nodeType: any, nodeData: any, app: ComfyApp): Promise<void>;
	/**
	 * Allows the extension to register additional nodes with LGraph after standard nodes are added
	 * @param app The ComfyUI app instance
	 */
	// @rgthree - add void for non async
	registerCustomNodes?(app: ComfyApp): void|Promise<void>;
	/**
	 * Allows the extension to modify a node that has been reloaded onto the graph.
	 * If you break something in the backend and want to patch workflows in the frontend
	 * This is the place to do this
	 * @param node The node that has been loaded
	 * @param app The ComfyUI app instance
	 */
	loadedGraphNode?(node: any, app: ComfyApp);
	/**
	 * Allows the extension to run code after the constructor of the node
	 * @param node The node that has been created
	 * @param app The ComfyUI app instance
	 */
	nodeCreated?(node: any, app: ComfyApp);
}