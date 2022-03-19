import * as vscode from 'vscode';
import { EXT_NAME, DEFUALT_TOOLTIP, DEFAULT_CMD, DEFAULT_TEXT, Config} from './Config';
/*
    MakefileProvider
    https://code.visualstudio.com/api/references/vscode-api
 */
export class MakefileProvider implements vscode.CodeLensProvider {

    private codeLenses: vscode.CodeLens[] = [];
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    /*
        TODO: add caching system for the n most recently used files. Keeps running
        through script when I switch tabs.
    */
    constructor() {
        vscode.workspace.onWillSaveTextDocument(( e: vscode.TextDocumentWillSaveEvent) => {
            console.log("onWillSaveTextDocument");
        });
        
        vscode.workspace.onDidChangeConfiguration((_) => {
            console.log("onDidChangeConfiguration");
            this._onDidChangeCodeLenses.fire();
            let newCmdTemplate = vscode.workspace.getConfiguration(EXT_NAME).get('cmdTemplate', DEFAULT_CMD);
            Config.setCmdTemplate(newCmdTemplate);
            let newTextTemplate = vscode.workspace.getConfiguration(EXT_NAME).get('textTemplate', DEFAULT_TEXT);
            Config.setTextTemplate(newTextTemplate);
        });
    }

    /*
        TODO: only execute after saving, don't process the file on each keystore live.
    */
    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        if (!this.enabled()) { return []; }
        this.codeLenses = [];
        const text = document.getText().split("\n");
        for(let i = 0; i < text.length; i++) {
            if( (text[i][0] >= 'a' && text[i][0] <= 'z') || (text[i][0] >= 'A' && text[i][0] <= 'Z') ) {
                if(text[i].indexOf("=") !== -1) { continue; }  // must not have equals
                const indexOfColon = text[i].indexOf(":");
                if(indexOfColon === -1) {continue;} // must have colon
                const target = text[i].substring(0, indexOfColon);
                const position = new vscode.Position(i, 0);
                const range = document.getWordRangeAtPosition(position) as vscode.Range;
                const title = Config.replaceTextTemplate(document.fileName, target);
                const codeLens = new vscode.CodeLens(range, {
                    title: title,
                    tooltip: DEFUALT_TOOLTIP,
                    command: `${EXT_NAME}.make`,
                    arguments: [document.fileName, target]
                });
                this.codeLenses.push(codeLens);
            } 
        }
        return this.codeLenses;
        
    }

    /*
        @return: true if the codelens are enabled, false otherwise.
    */
    private enabled() : boolean {
        return vscode.workspace.getConfiguration(EXT_NAME).get("enableCodeLens", true);
    }
}

