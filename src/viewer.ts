/*
   Copyright 2023 Bernhard Walter
  
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import * as vscode from "vscode";
import { template } from "./display";
import { CadqueryController } from "./controller";
import * as output from "./output";

export class CadqueryViewer {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */

    public static currentPanel: CadqueryViewer | undefined;
    public static controller: CadqueryController | undefined;

    public static readonly viewType = "cadqueryViewer";

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(
        extensionUri: vscode.Uri,
        _controller: CadqueryController
    ) {
        this.controller = _controller;

        if (CadqueryViewer.currentPanel) {
            // If we already have a panel, show it.

            output.debug("Revealing existing webview panel");

            CadqueryViewer.currentPanel._panel.reveal(vscode.ViewColumn.Two);
        } else {
            // Otherwise, create a new panel.

            output.debug("Creating new webview panel");

            const panel = vscode.window.createWebviewPanel(
                CadqueryViewer.viewType,
                "OCP CAD Viewer",
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );
            CadqueryViewer.currentPanel = new CadqueryViewer(
                panel,
                extensionUri
            );
        }
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        output.debug("Reviving webview panel");

        CadqueryViewer.currentPanel = new CadqueryViewer(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = "";

        // TODO This doesn't seem to be needed: Remove?
        // Update the content based on view changes
        // this._panel.onDidChangeViewState(
        //     (e) => {
        //         if (this._panel.visible) {
        //             output.debug("Webview panel changed state");
        //             this.update(template());
        //         }
        //     },
        //     null,
        //     this._disposables
        // );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            (message) => {
                // output.debug(`Received message ${message} from Webview panel`);
                switch (message.command) {
                    case "alert":
                        vscode.window.showErrorMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        output.debug("CadqueryViewer dispose");
        CadqueryViewer.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
        CadqueryViewer.controller?.dispose();
    }

    public update(div: string) {
        if (div !== "") {
            output.debug("Updateing webview");
            const webview = this._panel.webview;
            this._panel.title = "OCP CAD Viewer";
            webview.html = div;
        }
    }

    public getView() {
        return this._panel.webview;
    }
}
/*  */