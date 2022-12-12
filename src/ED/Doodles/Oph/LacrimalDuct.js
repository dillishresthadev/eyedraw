/**
 * OpenEyes
 *
 * Copyright (C) OpenEyes Foundation, 2011-2017
 * This file is part of OpenEyes.
 * OpenEyes is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * OpenEyes is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License along with OpenEyes in a file titled COPYING. If not, see <http://www.gnu.org/licenses/>.
 *
 * @package OpenEyes
 * @link http://www.openeyes.org.uk
 * @author OpenEyes <info@openeyes.org.uk>
 * @copyright Copyright 2011-2017, OpenEyes Foundation
 * @license http://www.gnu.org/licenses/agpl-3.0.html The GNU Affero General Public License V3.0
 */

ED.LacrimalDuct = function (_drawing, _parameterJSON) {
    this.className = "LacrimalDuct";
    this.loaded = false;
    this.flowHandle = 0;

    this.savedParameterArray = ['flowType', 'flowPct', 'flowDirection', 'flowPosition', 'x1', 'x2', 'y1', 'y2', 'lacrimalChildName'];
    this.controlParameterArray = { 'flowType': 'flow', 'flowPct': 'flow percentage' };

    // Call superclass constructor
    ED.Doodle.call(this, _drawing, _parameterJSON);
    this.drawing.registerForNotifications(this, 'onReady', 'ready');
};

/**
 * Sets superclass and constructor
 */
ED.LacrimalDuct.prototype = new ED.Doodle;
ED.LacrimalDuct.prototype.constructor = ED.LacrimalDuct;
ED.LacrimalDuct.superclass = ED.Doodle.prototype;

ED.LacrimalDuct.prototype.onReady = function () { // x,y is not set earlier for some reason
    this.originX = this.x1;
    this.originY = this.y1;
    this.xl = this.x2 - this.x1;
    this.yl = this.y2 - this.y1;
    this.startPoint = new ED.Point(this.x1, this.x2);
    this.endPoint = new ED.Point(this.x2, this.y2);
    this.normalPoint = new ED.Point(this.x2 - this.x1, this.y2 - this.y1);
    this.squiggleArray[0].pointsArray[this.flowHandle].x = this.xl * this.flowPosition / 100;
    this.squiggleArray[0].pointsArray[this.flowHandle].y = this.yl * this.flowPosition / 100;
    this.loaded = true;
    this.drawing.repaint();
};

ED.LacrimalDuct.prototype.setHandles = function () {

    this.handleArray[this.flowHandle] = new ED.Doodle.Handle(null, true, ED.Mode.Handles, false);
    this.handleVectorRangeArray = [];
    this.handleVectorRangeArray[this.flowHandle] = { length: new ED.Range(-0, +1000), angle: new ED.Range(0, Math.PI * 2) };
};


ED.LacrimalDuct.prototype.setPropertyDefaults = function () {
    this.isSaveable = false;
    this.isMoveable = false;
    this.isRotatable = false;
    this.isScaleable = false;
    this.isUnique = false;
    this.isDeletable = false;
    this.originX = 0;
    this.originY = 0;

    this.parameterValidationArray.lacrimalChildName = {
        kind: 'other',
        type: 'string',
        list: ['horizontalDuct', 'upperDuct', 'lowerDuct'],
        animate: false
    };
    this.parameterValidationArray.flowType = {
        kind: 'other',
        type: 'string',
        list: ['patent', 'partial flow', 'blocked'],
        animate: false
    };
    this.parameterValidationArray.flowPct = {
        kind: 'other',
        type: 'int',
        range: new ED.Range(0, 100),
        animate: false
    };
    this.parameterValidationArray.flowPosition = {
        kind: 'other',
        type: 'int',
        range: new ED.Range(0, 100),
        animate: false
    };
    this.parameterValidationArray.flowDirection = {
        kind: 'other',
        type: 'int',
        range: new ED.Range(-1, 1),
        animate: false
    };
    this.parameterValidationArray.blockagePosition = {
        kind: 'other',
        type: 'float',
        range: new ED.Range(0, 1),
        animate: false
    };
    this.parameterValidationArray.x1 = {
        kind: 'derived',
        type: 'int',
        range: new ED.Range(-500, 500),
        animate: false
    };
    this.parameterValidationArray.y1 = {
        kind: 'derived',
        type: 'int',
        range: new ED.Range(-500, 500),
        animate: false
    };
    this.parameterValidationArray.x2 = {
        kind: 'derived',
        type: 'int',
        range: new ED.Range(-500, 500),
        animate: false
    };
    this.parameterValidationArray.y2 = {
        kind: 'derived',
        type: 'int',
        range: new ED.Range(-500, 500),
        animate: false
    };
};

ED.LacrimalDuct.prototype.setParameterDefaults = function () {
    this.dir = this.drawing.eye == ED.eye.Right ? 1 : -1;

    // Create a squiggle to store the handles points
    var squiggle = new ED.Squiggle(this, new ED.Colour(100, 100, 100, 1), 4, true);

    // Add it to squiggle array
    this.squiggleArray.push(squiggle);

    // Populate with handles on each lid
    var point1 = new ED.Point(0, 0);
    this.squiggleArray[0].pointsArray.push(point1);
    var point2 = new ED.Point(0, 0);
    this.squiggleArray[0].pointsArray.push(point2);
};

ED.LacrimalDuct.prototype.dependentParameterValues = function (_parameter, _value) {
    let returnArray = {};

    switch (_parameter) {
        case 'flowType':
            switch (_value) {
                case 'patent':
                    if (this.flowPct !== 100) {
                        returnArray.flowPct = 100;
                    }
                    break;
                case 'partial flow':
                    if (this.flowPct === 0 || this.flowPct === 100) {
                        returnArray.flowPct = 50;
                    }
                    break;
                case 'blocked':
                    if (this.flowPct !== 0) {
                        returnArray.flowPct = 0;
                    }
                    break;
            }
            break;
        case 'flowPct':
            if (_value === 100) {
                returnArray.flowType = 'patent';
            }
            else if (_value === 0) {
                returnArray.flowType = 'blocked';
            }
            else if (_value > 0 && _value < 100) {
                returnArray.flowType = 'partial flow';
            }
            break;
    }
    this.drawing.updateBindings();
    return returnArray;
};

ED.LacrimalDuct.prototype.draw = function (_point) {
    // Get context
    var ctx = this.drawing.context;

    // Call draw method in superclass
    ED.LacrimalDuct.superclass.draw.call(this, _point);

    if (this.loaded) {
        // draw the main line
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0,0,209,0)";
        ctx.fillStyle = this.isSelected ? "rgba(150,0,0,.1)" : "rgba(100,100,100,0)";
        ctx.lineWidth = 1;
        this.drawRectangle(ctx, 0, 0, this.xl, this.yl, 55);
        ctx.closePath();

        //draw text
        let textDist = this.y2 < this.y1 ? 120 : -90;
        let p1 = MathHelper.perpendicularToLine(0, 0, this.xl, this.yl, this.xl / 2, this.yl / 2, textDist);

        this.putText(ctx, p1.x, p1.y, this.flowPct + '%');

        // Draw boundary path (also hit testing)
        this.drawBoundary(_point);

        let newPositions = [];
        // make the handle slide along the bar
        currHandle = 0;
        newPositions[this.flowHandle] = new ED.Point(this.squiggleArray[0].pointsArray[this.flowHandle].x, this.squiggleArray[0].pointsArray[this.flowHandle].y);
        if (this.x2 - this.x1 > this.y2 - this.y1) {
            newPositions[this.flowHandle].x = newPositions[this.flowHandle].x < 0 ? 0 : newPositions[this.flowHandle].x;
            newPositions[this.flowHandle].x = newPositions[this.flowHandle].x > this.xl ? this.xl : newPositions[this.flowHandle].x;
            newPositions[this.flowHandle].y = newPositions[this.flowHandle].x / this.xl * this.yl;
        }
        else { // steep slope
            newPositions[this.flowHandle].y = newPositions[this.flowHandle].y < 0 ? 0 : newPositions[this.flowHandle].y;
            newPositions[this.flowHandle].y = newPositions[this.flowHandle].y > this.yl ? this.yl : newPositions[this.flowHandle].y;
            newPositions[this.flowHandle].x = newPositions[this.flowHandle].y / this.yl * this.xl;
        }

        this.handleArray[this.flowHandle].location = this.transform.transformPoint(newPositions[this.flowHandle]);
        this.setSimpleParameter('flowPosition', Math.round(newPositions[this.flowHandle].x / (this.x2 - this.x1) * 100));

        // which way the triangle will point
        let newDirection;
        if (this.handleArray[this.flowHandle].location.x > this.prevFlowHandleX) {
            newDirection = -1;
        }
        else if (this.handleArray[this.flowHandle].location.x < this.prevFlowHandleX) {
            newDirection = 1;
        }
        this.prevFlowHandleX = this.handleArray[this.flowHandle].location.x;
        if (newDirection && this.flowDirection !== newDirection) {
            this.setSimpleParameter('flowDirection', newDirection);
        }

        switch (this.flowType) {
            case 'patent':
                this.handleArray[this.flowHandle].isVisible = true;
                this.drawTriangle(ctx, newPositions[this.flowHandle].x, newPositions[this.flowHandle].y);
                break;
            case 'partial flow':
                this.handleArray[this.flowHandle].isVisible = true;
                let t0 = new Turtle({ x: newPositions[this.flowHandle].x, y: newPositions[this.flowHandle].y, vx: this.x2 - this.x1, vy: this.y2 - this.y1 });
                let p1 = t0.move(-40 * this.flowDirection).getPoint();
                let p2 = t0.move(80 * this.flowDirection).getPoint();
                this.drawTriangle(ctx, p1.x, p1.y, -1);
                this.drawBlockage(ctx, p2.x, p2.y);
                break;
            case 'blocked':
                this.handleArray[this.flowHandle].isVisible = true;
                this.drawBlockage(ctx, newPositions[this.flowHandle].x, newPositions[this.flowHandle].y);
                if (this.lacrimalChildName === 'upperDuct') {
                    break;
                }
        }
    }

    if (this.isSelected && !this.isForDrawing) {
        this.drawHandles(_point);
    }
    // Return value indicating successful hittest
    return this.isClicked;

};

ED.LacrimalDuct.prototype.putText = function (ctx, x, y, text) {
    ctx.font = "50px Arial";
    ctx.textAlign = 'center';
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,1)";

    let dir = 1;
    if (this.drawing.isFlipped) {
        dir = -1;
    }
    ctx.scale(dir, 1);
    ctx.fillText(this.flowPct + '%', x * dir, y);
    ctx.restore();
};

ED.LacrimalDuct.prototype.drawRectangle = function (ctx, x1, y1, x2, y2, width) {
    let p1 = MathHelper.perpendicularToLine(x1, y1, x2, y2, x1, y1, width / 2);
    let p2 = MathHelper.perpendicularToLine(x1, y1, x2, y2, x1, y1, -width / 2);
    let p3 = MathHelper.perpendicularToLine(x1, y1, x2, y2, x2, y2, -width / 2);
    let p4 = MathHelper.perpendicularToLine(x1, y1, x2, y2, x2, y2, width / 2);
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.fill();
};

ED.LacrimalDuct.prototype.drawTriangle = function (ctx, x, y, direction, strokeStyle) {

    let dir = this.drawing.isFlipped ? this.flowDirection : -this.flowDirection;
    let len = 35 * dir;
    let t0 = new Turtle({ x: x, y: y, vx: this.x2 - this.x1, vy: this.y2 - this.y1 });
    let p3 = t0.move(len * 2).getPoint();
    let p1 = t0.move(-len * 3).turnLeft().move(len).getPoint();
    let p2 = t0.move(-len * 2).getPoint();

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.closePath();

    ctx.lineWidth = 1;
    ctx.strokeStyle = strokeStyle || "rgba(0,150,0,1)";
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
};

ED.LacrimalDuct.prototype.drawBlockage = function (ctx, x, y) {
    let lineAngle = Math.atan((this.x2 - this.x1) / (this.y2 - this.y1));

    let len1 = 10;
    let width = 50;
    let p1 = MathHelper.perpendicularToLine(this.x1, this.y1, this.x2, this.y2, x - len1 * Math.sin(lineAngle), y - len1 * Math.cos(lineAngle), width);
    let p2 = MathHelper.perpendicularToLine(this.x1, this.y1, this.x2, this.y2, x - len1 * Math.sin(lineAngle), y - len1 * Math.cos(lineAngle), -width);
    let p3 = MathHelper.perpendicularToLine(this.x1, this.y1, this.x2, this.y2, x + len1 * Math.sin(lineAngle), y + len1 * Math.cos(lineAngle), width);
    let p4 = MathHelper.perpendicularToLine(this.x1, this.y1, this.x2, this.y2, x + len1 * Math.sin(lineAngle), y + len1 * Math.cos(lineAngle), -width);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.moveTo(p4.x, p4.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();

    ctx.lineWidth = 15;
    ctx.strokeStyle = "rgba(150,0,0,1)";
    ctx.fillStyle = ctx.strokeStyle;
    ctx.stroke();
};

ED.LacrimalPunctum = function (_drawing, _parameterJSON) {
    this.className = "LacrimalPunctum";

    this.flowType = 'patent';
    this.savedParameterArray = ['flowType', 'x1', 'x2', 'y1', 'y2']; //, 'isLower'];
    this.controlParameterArray = { 'flowType': 'flow' };

    // Call superclass constructor
    ED.Doodle.call(this, _drawing, _parameterJSON);
    if (_parameterJSON) { // doodle is loaded, connect with Lacrimal
        this.lacrimalDoodle = this.drawing.firstDoodleOfClass('Lacrimal');
    }
    this.drawing.registerForNotifications(this, 'onReady', 'ready');
};

/**
 * Sets superclass and constructor
 */
ED.LacrimalPunctum.prototype = new ED.Doodle;
ED.LacrimalPunctum.prototype.constructor = ED.LacrimalPunctum;
ED.LacrimalPunctum.superclass = ED.Doodle.prototype;

ED.LacrimalPunctum.prototype.onReady = function () { // x,y is not set before for some freason
    if (this.lacrimalChildName !== 'lowerPunctum') {
        this.parameterValidationArray.flowType.list = this.parameterValidationArray.flowType.list.filter(e => e !== 'everted');
    }
};

ED.LacrimalPunctum.prototype.setPropertyDefaults = function () {
    this.isSaveable = false;
    this.isMoveable = false;
    this.isRotatable = false;
    this.isScaleable = false;
    this.isUnique = false;
    this.isDeletable = false;

    this.parameterValidationArray.lacrimalChildName = {
        kind: 'other',
        type: 'string',
        list: ['upperPunctum', 'lowerPunctum'],
        animate: false
    }; this.parameterValidationArray.flowType = {
        kind: 'other',
        type: 'string',
        list: ['blocked', 'stenosed', 'patent', 'everted'],
        animate: false
    };
    this.parameterValidationArray.x1 = {
        kind: 'derived',
        type: 'int',
        range: new ED.Range(-500, 500),
        animate: false
    };
    this.parameterValidationArray.y1 = {
        kind: 'derived',
        type: 'int',
        range: new ED.Range(-500, 500),
        animate: false
    };
    this.parameterValidationArray.x2 = {
        kind: 'derived',
        type: 'int',
        range: new ED.Range(-500, 500),
        animate: false
    };
    this.parameterValidationArray.y2 = {
        kind: 'derived',
        type: 'int',
        range: new ED.Range(-500, 500),
        animate: false
    };
};

ED.LacrimalPunctum.prototype.draw = function (_point) {
    // Get context
    var ctx = this.drawing.context;
    // Call draw method in superclass
    ED.LacrimalDuct.superclass.draw.call(this, _point);

    // draw the main line
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = 20;
    let len, t0, p1, p2, p3, p4;
    switch (this.flowType) {
        case 'patent':
            ctx.moveTo(this.x1, this.y1);
            ctx.lineTo(this.x2, this.y2);
            break;
        case 'stenosed':
            len = 25;
            t0 = new Turtle({ x: this.x1, y: this.y1, vx: this.x2 - this.x1, vy: this.y2 - this.y1 });
            p3 = t0.move(len * 2.8).getPoint();
            p1 = t0.move(-len * 3).turnLeft().move(len).getPoint();
            p2 = t0.move(-len * 2).getPoint();

            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p1.x, p1.y);

            ctx.lineWidth = 1;
            ctx.fill();
            break;
        case 'blocked':
            // draw original black lines
            ctx.moveTo(this.x1, this.y1);
            ctx.lineTo(this.x2, this.y2);
            ctx.stroke();

            // draw red X
            len = 100;
            t0 = new Turtle({ x: this.x1, y: this.y1, vx: this.x2 - this.x1, vy: this.y2 - this.y1 });
            p1 = t0.move(40).turn(45).move(len / 2).getPoint();
            p2 = t0.move(-len).getPoint();
            t0 = new Turtle({ x: this.x1, y: this.y1, vx: this.x2 - this.x1, vy: this.y2 - this.y1 });
            p3 = t0.move(40).turn(-45).move(len / 2).getPoint();
            p4 = t0.move(-len).getPoint();

            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.moveTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.strokeStyle = "rgba(150,0,0,1)";
            ctx.fillStyle = "rgba(150,0,0,1)";
            ctx.lineWidth = 15;
            break;
        case 'everted':
            len = 60;
            ctx.moveTo(this.x1, this.y1);
            t0 = new Turtle({ x: this.x1 + (this.x2 - this.x1) * 0.75, y: this.y1 + (this.y2 - this.y1) * 0.75, vx: this.x2 - this.x1, vy: this.y2 - this.y1 });
            p1 = t0.getPoint();
            ctx.lineTo(p1.x, p1.y);
            p2 = t0.turnLeft().move(len).getPoint();
            t0 = new Turtle({ x: this.x1 + (this.x2 - this.x1) * 0.75, y: this.y1 + (this.y2 - this.y1) * 0.75, vx: this.x2 - this.x1, vy: this.y2 - this.y1 });
            let cp = t0.turnLeft().move(len / 2).turnRight().move(30).getPoint();
            ctx.quadraticCurveTo(cp.x, cp.y, p2.x, p2.y);
            break;
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "rgba(0,0,209,0)";
    ctx.fillStyle = this.isSelected ? "rgba(150,0,0,.1)" : "rgba(100,100,100,0)";
    ctx.lineWidth = 1;
    ED.LacrimalDuct.prototype.drawRectangle(ctx, this.x1, this.y1, this.x2, this.y2, 55);
    ctx.closePath();

    // Draw boundary path (also hit testing)
    this.drawBoundary(_point);

    if (this.isSelected && !this.isForDrawing) {
        this.drawHandles(_point);
    }

    // Return value indicating successful hittest
    return this.isClicked;
};
