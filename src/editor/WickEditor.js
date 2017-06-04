/* Wick - (c) 2017 Zach Rispoli, Luca Damasco, and Josh Rispoli */

/*  This file is part of Wick. 
    
    Wick is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Wick is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Wick.  If not, see <http://www.gnu.org/licenses/>. */
    
/* This is the entry point for the whole editor */

var WickEditor = function () {

    var self = this;

    // http://semver.org/
    self.version = "0.0.0";
    console.log("Wick Editor version " + self.version)
    if(localStorage.wickVersion !== self.version) {
        // Wick has either 
        //   (1) never been used on this machine/browser or 
        //   (2) wick updated since it was last used on this machine/browser
        // So we need to show the update message screen!
        localStorage.wickVersion = self.version;
        console.log("Looks like wick updated!")
    }

    // Friendly console message ~~~
    console.log('%cWelcome to the javascript console! ', 'color: #ff99bb; font-size: 20px; font-weight: bold; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;');
    console.log('%cYou are free to change any of the internal editor stuff from here.', 'color: #7744bb; font-size: 12px;');
    console.log('%cTry typing "wickEditor" into the console to see some stuff!.', 'color: #22bb99; font-size: 12px;');

    // Setup connection to backend 
    this.backend = new WickDemoLoader(this);

    // Setup thing that handles all the electron stuff
    this.electron = new WickElectronWrapper(this);

    if(isElectronMode) {
        this.project = new WickProject();
    } else if(!this.backend.active) {
        this.project = WickProject.fromLocalStorage();
    } else { 
        this.project = new WickProject();
    }

    // Load settings
    this.settings = new WickEditorSettings();

    // Load all interfaces
    this.interfaces = [];
    function registerInterface (interface) {
        self.interfaces.push(interface);
        return interface;
    }

    this.thumbnailRenderer = registerInterface(new ThumbnailRendererInterface(this));
    this.gifRenderer = registerInterface(new GIFRendererInterface(this));
    this.builtinplayer = registerInterface(new BuiltinPlayerInterface(this));
    this.scriptingide = registerInterface(new ScriptingIDEInterface(this));
    this.timeline = registerInterface(new TimelineInterface(this));
    this.library = registerInterface(new LibraryInterface(this));
    this.toolbar = registerInterface(new ToolbarInterface(this));
    this.inspector = registerInterface(new InspectorInterface(this));
    this.rightclickmenu = registerInterface(new RightClickMenuInterface(this));
    this.paper = registerInterface(new PaperInterface(this));
    this.fabric = registerInterface(new FabricInterface(this));
    this.menubar = registerInterface(new MenuBarInterface(this));
    this.breadcrumbs = registerInterface(new BreadcrumbsInterface(this));
    this.alertbox = registerInterface(new AlertBoxInterface(this));
    this.previewplayer = registerInterface(new PreviewPlayer(this));
    this.cursorIcon = registerInterface(new CursorIconInterface(this));

    // Load all tools
    this.tools = {
        "cursor"           : new Tools.Cursor(this),
        "pen"              : new Tools.Pen(this),
        "paintbrush"       : new Tools.Paintbrush(this),
        "eraser"           : new Tools.Eraser(this),
        "fillbucket"       : new Tools.FillBucket(this),
        "rectangle"        : new Tools.Rectangle(this),
        "ellipse"          : new Tools.Ellipse(this),
        "line"             : new Tools.Line(this),
        "polygon"          : new Tools.Polygon(this),
        "dropper"          : new Tools.Dropper(this),
        "text"             : new Tools.Text(this),
        "zoom"             : new Tools.Zoom(this),
        "pan"              : new Tools.Pan(this),
    }
    this.currentTool = this.tools.cursor;
    this.lastTool = this.currentTool;

    // Setup all tools + interfaces
    this.interfaces.forEach(function (interface) {
        interface.setup();
    });
    for(tool in this.tools) {
        this.tools[tool].setup();
    };

    // Setup editor logic handlers
    this.actionHandler = new WickActionHandler(this);
    this.guiActionHandler = new GuiActionHandler(this);

    // Setup inputhandler
    this.inputHandler = new InputHandler(this);

    // Setup renderer
    window.rendererCanvas = document.getElementById('previewRenderContainer');//document.getElementById('builtinPlayer');
    window.rendererCanvas.style.display = 'none';
    if(!window.wickRenderer) {
        window.wickRenderer = new WickPixiRenderer();
        window.wickRenderer.setProject(self.project);
        window.wickRenderer.setup();

        self.thumbnailRenderer.renderAllThumbsOnTimeline();
    }

    this.syncInterfaces();

}

WickEditor.prototype.syncInterfaces = function () {
    this.project.applyTweens();
    
    if(!this.tools) return;
    this.interfaces.forEach(function (interface) {
        interface.syncWithEditorState();
    });
}

WickEditor.prototype.changeTool = function (newTool) {
    this.lastTool = this.currentTool;
    this.currentTool = newTool;
    if(newTool.onSelected) newTool.onSelected();
    this.fabric.forceModifySelectedObjects();
    this.fabric.deselectAll();

    this.syncInterfaces();

    this.guiActionHandler.doAction('previewPause');
}

WickEditor.prototype.useLastUsedTool = function () {
    this.currentTool = this.lastTool;
}