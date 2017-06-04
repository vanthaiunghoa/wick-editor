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
    
var PaperInterface = function (wickEditor) {

    var self = this;

    var pathSelectionTool;
    var polygonTool;

    var active;

    var paperCanvas;

    self.setup = function () {
        self.needsUpdate = true;

        this.pathRoutines = new PathRoutines(this, wickEditor);

        // Create the canvas to be used with paper.js and init the paper.js instance.
        paperCanvas = document.createElement('canvas');
        paperCanvas.className = 'paperCanvas';
        paperCanvas.style.backgroundColor = "rgb(0,0,0,0)";
        paperCanvas.style.position = 'absolute';
        paperCanvas.style.top = "0px";
        paperCanvas.style.left = "0px";
        paperCanvas.style.width  = window.innerWidth+'px';
        paperCanvas.style.height = window.innerHeight+'px';
        paper.setup(paperCanvas);
        paper.settings.handleSize = 10;
        paper.view.viewSize.width  = window.innerWidth;
        paper.view.viewSize.height = window.innerHeight;

        window.addEventListener('resize', function () {
            paperCanvas.style.width  = window.innerWidth+'px';
            paperCanvas.style.height = window.innerHeight+'px';
            paper.view.viewSize.width  = window.innerWidth;
            paper.view.viewSize.height = window.innerHeight;
        }, false);
        paper.view.viewSize.width  = window.innerWidth;
        paper.view.viewSize.height = window.innerHeight;

        document.getElementById('editorCanvasContainer').appendChild(paperCanvas);

        /*var point = new paper.Point(220, 220);
        var size = new paper.Size(60, 60);
        var path = new paper.Path.Rectangle(point, size);
        path.fillColor = { hue: Math.random() * 360, saturation: 1, lightness: 1.0 };
        path.strokeColor = 'black';*/

        pathSelectionTool = wickEditor.tools.pen.paperTool;
        polygonTool = wickEditor.tools.polygon.paperTool;

    }

    self.isActive = function () {
        return active;
    }

    self.smoothPath = function () {
        hitResult.item.smooth()
    }

    self.simplifyPath = function () {
        hitResult.item.simplify()
    }

    self.flattenPath = function () {
        hitResult.item.flatten()
    }
   
    self.smoothPoint = function () {
        hitResult.segment.smooth()
    }

    self.setStrokeCap = function (newStrokeCap) {
        // 'round', 'square', 'butt'
        //console.log(hitResult.item)
        hitResult.item.strokeCap = newStrokeCap;
    }

    self.setStrokeJoin = function (newStrokeJoin) {
        // 'miter', 'round', 'bevel'
         hitResult.item.strokeJoin = newStrokeJoin;
    }

    self.setShadow = function () {
        hitResult.item.shadowColor = new paper.Color(0, 0, 0),
        // Set the shadow blur radius to 12:
        hitResult.item.shadowBlur = 12,
        // Offset the shadow by { x: 5, y: 5 }
        hitResult.item.shadowOffset = new paper.Point(5, 5)
    }

    self.getItem = function () {
        return hitResult.item;
    }

    self.syncWithEditorState = function () {

        var lastActive = active;

        active = (wickEditor.currentTool instanceof Tools.FillBucket)
              || (wickEditor.currentTool instanceof Tools.Pen)
              || (wickEditor.currentTool instanceof Tools.Polygon);

        if(wickEditor.currentTool instanceof Tools.Polygon) {
            polygonTool.activate();
        } else {
            pathSelectionTool.activate();
        }

        if(active) {

            paperCanvas.style.display = 'block';

            var canvasTransform = wickEditor.fabric.getCanvasTransform();
            paper.view.matrix = new paper.Matrix();
            paper.view.matrix.translate(new paper.Point(canvasTransform.x,canvasTransform.y))
            paper.view.matrix.scale(canvasTransform.zoom)

            refreshSelection();

            if(!self.needsUpdate) return;
            self.needsUpdate = false;

            paper.project.activeLayer.removeChildren();

            var activeObjects = wickEditor.project.getCurrentObject().getAllActiveChildObjects();
            activeObjects.forEach(function (wickObject) {
                if(!wickObject.isPath) return;
                
                self.pathRoutines.refreshPathData(wickObject);
                self.pathRoutines.regenPaperJSState(wickObject);
                paper.project.activeLayer.addChild(wickObject.paper);
                
                var absPos = wickObject.getAbsolutePosition();
                wickObject.paper.position.x = absPos.x;
                wickObject.paper.position.y = absPos.y;

                /*wickObject.paper.position.x = wickObject.x;
                wickObject.paper.position.y = wickObject.y;*/
                
                wickObject.paper.wick = wickObject;
            });

            refreshSelection();
        } else {
            active = false;

            wickEditor.cursorIcon.hide();

            paperCanvas.style.display = 'none';
        }

    }

    function refreshSelection () {

        paper.project.activeLayer.selected = false;
        paper.project.activeLayer.children.forEach(function (child) {
            if(wickEditor.project.isObjectSelected(child.wick)) {
                child.selected = true;
                //if(showHandles) {
                    child.fullySelected = true;
                //} 
            }
        });

    }

 }