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

/**
 * Anterior segment with adjustable sized pupil
 *
 * @class AntSeg
 * @property {String} className Name of doodle subclass
 * @param {Drawing} _drawing
 * @param {Object} _parameterJSON
 */
ED.AntSeg = function (_drawing, _parameterJSON) {
    // Set classname
    this.className = "AntSeg";

    // Derived parameters
    this.pupilSize = 'Large';
    this.pupilShape = 'Round';

    // Other parameters
    this.pxe = false;
    this.aniridia = false;
    this.coloboma = false;
    this.colour = (typeof default_iris_colour) !== 'undefined' ? default_iris_colour : 'Blue';
    this.ectropion = false;
    this.cornealSize = 'Not Checked';
    this.csApexX = 0;
    this.irisTrauma = false;

    this.distortedPupilHandleNum = 8;
    this.apexHandle = this.distortedPupilHandleNum;
    this.limbusRadius = 380;
    this.origX = 150;
    this.origY = 150;

    // Saved parameters
    this.savedParameterArray = [
        'pupilSize',
        'pupilShape',
        'apexY',
        'rotation',
        'pxe',
        'aniridia',
        'irisTrauma',
        'coloboma',
        'colour',
        'ectropion',
        'cornealSize',
        'csApexX' // store of cross section apex x value
    ];

    // Parameters in doodle control bar (parameter name: parameter label)
    this.controlParameterArray = {
        'pupilSize': 'Pupil size',
        'pupilShape': 'Pupil shape',
        'pxe': 'Pseudoexfoliation',
        'aniridia': 'Aniridia',
        'irisTrauma': 'Iris trauma',
        'coloboma': 'Coloboma',
        'colour': 'Colour',
        'ectropion': 'Ectropion uveae',
        'cornealSize': 'Corneal size',
    };

    // Call superclass constructor
    ED.Doodle.call(this, _drawing, _parameterJSON);
    this.checkSquiggleArray();

    //if a peripheral iridectomy is set, reset the handle constraints
    this.drawing.registerForNotifications(this, 'notificationHandler', ['mouseup', 'ready']);
    this.notificationHandler = function (_messageArray) {
        if (_messageArray && _messageArray.eventName === 'mouseup' && _messageArray.selectedDoodle && _messageArray.selectedDoodle.className === 'PI') {
            this.setHandleConstraints();
        }
        else if (_messageArray && _messageArray.eventName === 'ready') {
            this.setHandleConstraints();
        }
    };
};

/**
 * Sets superclass and constructor
 */
ED.AntSeg.prototype = new ED.Doodle();
ED.AntSeg.prototype.constructor = ED.AntSeg;
ED.AntSeg.superclass = ED.Doodle.prototype;

ED.AntSeg.prototype.setHandles = function () {
    this.initialRadius = 250;

    this.distortHandlesVisible = false;
    if (this.pupilShape === 'Distorted') {
        this.distortHandlesVisible = true;
    }

    // set apex handle for round pupil
    this.handleArray[this.apexHandle] = new ED.Doodle.Handle(null, true, ED.Mode.Apex, false);
    this.handleArray[this.apexHandle].isVisible = !this.distortHandlesVisible;

    // set handles for distorted pupil
    for (let i = 0; i < this.distortedPupilHandleNum; i++) {
        this.handleArray[i] = new ED.Doodle.Handle(null, true, ED.Mode.Handles, false);
        this.handleArray[i].isVisible = this.distortHandlesVisible;
    }
};

ED.AntSeg.prototype.setHandleLocations = function () {
    for (let i = 0; i < this.distortedPupilHandleNum; i++) {
        this.handleArray[i].location = this.transform.transformPoint(this.squiggleArray[0].pointsArray[i]);
    }
};

// show either handle for round pupil or handles for distorted pupil
ED.AntSeg.prototype.resetHandles = function () {
    this.distortHandlesVisible = false;
    if (this.pupilShape === 'Distorted') {
        this.distortHandlesVisible = true;
    }
    this.handleArray[this.apexHandle].isVisible = !this.distortHandlesVisible;

    // set handles for distorted pupil
    for (let i = 0; i < this.distortedPupilHandleNum; i++) {
        this.handleArray[i].isVisible = this.distortHandlesVisible;
    }

    // if aniridia is checked, turn apex handle off
    if (this.aniridia) {
        this.handleArray[this.apexHandle].isVisible = false;
        // this.handleArray.forEach(handle => handle.isVisible = false)
    }
};

ED.AntSeg.prototype.setHandleConstraints = function () {
    // constrain distorted pupil handles to within cornea
    if (!this.handleVectorRangeArray) this.handleVectorRangeArray = [];
    for (let i = 0; i < this.distortedPupilHandleNum; i++) {
        // Full circle in radians
        let cir = 2 * Math.PI;
        let n = this.distortedPupilHandleNum;
        let range = {};
        range.length = new ED.Range(+50, +this.limbusRadius);
        // constrain to segment
        range.angle = new ED.Range((((2 * n - 1) * cir / (2 * n)) + i * cir / n) % cir, ((1 * cir / (2 * n)) + i * cir / n) % cir);
        this.handleVectorRangeArray[i] = range;
    }

    // are there any peripheral iridectomies?
    let PIs = this.drawing.allDoodlesOfClass('PI');

    let squiggleLengths = [];
    let squiggleDirections = [];
    for (let i = 0; i < this.distortedPupilHandleNum; i++) {
        squiggleLengths.push(this.squiggleArray[0].pointsArray[i].length());
        squiggleDirections.push(this.squiggleArray[0].pointsArray[i].direction());
    }

    // constrain to peripheral iriodotomies, if they exist
    PIs.forEach(PI => {
        // find two neighbouring handles of PI
        let PI_squiggle_angles = squiggleDirections.map((item) => this.radianDiff(item, PI.rotation));
        let sorted_angles = [...PI_squiggle_angles].sort();
        let neighbor1 = PI_squiggle_angles.findIndex((i) => i === sorted_angles[0]); // closest handle
        let neighbor2 = PI_squiggle_angles.findIndex((i) => i === sorted_angles[1]); // second closest handle

        let max_dist = 280; // radius of PI

        let neighborPoint1 = this.squiggleArray[0].pointsArray[neighbor1];
        if (neighborPoint1.length() > max_dist)  // if the handle is outside PI
            neighborPoint1.setWithPolars(max_dist, neighborPoint1.direction());

        let neighborPoint2 = this.squiggleArray[0].pointsArray[neighbor2];
        if (neighborPoint2.length() > max_dist)  // if the handle is outside PI
            neighborPoint2.setWithPolars(max_dist, neighborPoint2.direction());

        this.handleVectorRangeArray[neighbor1].length.max = max_dist;
        this.handleVectorRangeArray[neighbor2].length.max = max_dist;

        this.drawing.repaint();
    });
};

/**
 * Set default properties
 */
ED.AntSeg.prototype.setPropertyDefaults = function () {
    this.version = 1.1;
    this.isDeletable = false;
    this.isMoveable = false;
    this.isRotatable = false;
    this.isUnique = true;

    // Update component of validation array for simple parameters (enable 2D control by adding -50,+50 apexX range
    this.parameterValidationArray.apexX.range.setMinAndMax(0, 0);
    this.parameterValidationArray.apexY.range.setMinAndMax(-300, -60);

    // Add complete validation arrays for derived parameters
    this.parameterValidationArray.pupilSize = {
        kind: 'derived',
        type: 'string',
        list: ['Large', 'Medium', 'Small', ''],
        animate: true
    };

    this.parameterValidationArray.pupilShape = {
        kind: 'derived',
        type: 'string',
        list: ['Round', 'Distorted'],
        animate: true
    };

    this.parameterValidationArray.pxe = {
        kind: 'derived',
        type: 'bool',
        display: true
    };

    this.parameterValidationArray.coloboma = {
        kind: 'derived',
        type: 'bool',
        display: true
    };

    this.parameterValidationArray.colour = {
        kind: 'other',
        type: 'string',
        list: ['Blue', 'Brown', 'Gray', 'Green'],
        animate: false
    };

    this.parameterValidationArray.ectropion = {
        kind: 'derived',
        type: 'bool',
        display: true
    };

    this.parameterValidationArray.aniridia = {
        kind: 'derived',
        type: 'bool',
        display: true
    };

    this.parameterValidationArray.irisTrauma = {
        kind: 'derived',
        type: 'bool',
        display: true
    };

    this.parameterValidationArray.cornealSize = {
        kind: 'other',
        type: 'string',
        list: ['Not Checked', 'Micro', 'Normal', 'Macro'],
        animate: false
    };
};

/**
 * Sets default parameters (Only called for new doodles)
 * Use the setParameter function for derived parameters, as this will also update dependent variables
 */
ED.AntSeg.prototype.setParameterDefaults = function () {
    this.setParameterFromString('pupilSize', 'Large');
    this.setParameterFromString('pupilShape', 'Round');
    this.setParameterFromString('pxe', 'false');
    this.setParameterFromString('aniridia', 'false');
    this.setParameterFromString('irisTrauma', 'false');
    this.setParameterFromString('cornealSize', 'Not Checked');
};

ED.AntSeg.prototype.checkSquiggleArray = function () {
    if (!this.squiggleArray[0] || this.squiggleArray[0].length === 0) {
        // Create a squiggle to store the handles points
        let squiggle = new ED.Squiggle(this, new ED.Colour(100, 100, 100, 1), 4, true);
        this.squiggleArray.push(squiggle); // Add it to squiggle array

        // Populate with handles at equidistant points around circumference
        for (let i = 0; i < this.distortedPupilHandleNum; i++) {
            let point = new ED.Point(0, 0);
            point.setWithPolars(this.initialRadius, i * 2 * Math.PI / this.distortedPupilHandleNum);
            this.addPointToSquiggle(point);
        }
    }
};

/**
 * Calculates values of dependent parameters. This function embodies the relationship between simple and derived parameters
 * The returned parameters are animated if the 'animate' property in the parameterValidationArray is set to true
 *
 * @param {String} _parameter Name of parameter that has changed
 * @param {Undefined} _value Value of parameter to calculate
 * @returns {Array} Associative array of values of dependent parameters
 */
ED.AntSeg.prototype.dependentParameterValues = function (_parameter, _value) {
    var returnArray = {},
        returnValue;

    switch (_parameter) {
        case 'apexY':
            if (_value < -200) {
                returnArray.pupilSize = 'Large';
            } else if (_value < -100) {
                returnArray.pupilSize = 'Medium';
            } else {
                returnArray.pupilSize = 'Small';
            }
            break;

        case 'pupilSize':
            switch (_value) {
                case 'Large':
                    if (this.apexY >= -200) {
                        this.apexY = -260;
                    }
                    break;
                case 'Medium':
                    if (this.apexY < -200 || this.apexY >= -100) {
                        this.apexY = -200;
                    }
                    break;
                case 'Small':
                    if (this.apexY < -100) {
                        this.apexY = -100;
                    }
                    break;
            }
            if (_value !== '') { // large, medium, or small, make it round, uncheck aniridia
                if (this.pupilShape !== 'Round') {
                    this.setParameterFromString('pupilShape', 'Round');
                }
                if (this.aniridia) {
                    this.setParameterFromString('aniridia', 'false');
                }
            }
            break;
        case 'pupilShape':
            if (_value === 'Distorted') {
                this.setParameterFromString('pupilSize', '');
            }
            else if (_value === 'Round') {
                if (this.apexY < -200) {
                    this.setParameterFromString('pupilSize', 'Large');
                } else if (this.apexY < -100) {
                    this.setParameterFromString('pupilSize', 'Medium');
                } else {
                    this.setParameterFromString('pupilSize', 'Small');
                }
            }
            this.resetHandles();
            break;
        case 'aniridia':
            if (_value === 'true') { // set pupil shape to distorted
                this.setParameterFromString('pupilShape', 'Distorted');
                this.setParameterFromString('coloboma', 'false');
                if (!this.pointsArrayBeforeAniridia) { // backup squiggle array
                    this.pointsArrayBeforeAniridia = this.squiggleArray[0].pointsArray.map(p => { return { x: p.x, y: p.y } })
                }
                let squiggleLengths = [];
                let squiggleDirections = [];
                for (let i = 0; i < this.distortedPupilHandleNum; i++) {
                    squiggleLengths.push(this.squiggleArray[0].pointsArray[i].length());
                    squiggleDirections.push(this.squiggleArray[0].pointsArray[i].direction());
                }
                let maxIndex = squiggleLengths.indexOf(Math.max(...squiggleLengths));
                let lengthMultiplier = (this.limbusRadius - 10) / squiggleLengths[maxIndex]; // scale by farthest point in squiggle array
                this.squiggleArray[0].pointsArray.forEach((point, index) => {
                    point.setWithPolars(squiggleLengths[index] * lengthMultiplier, squiggleDirections[index]);
                });
            } else if (_value === 'false' && this.pointsArrayBeforeAniridia) { // retrieve squiggle array before aniridia
                this.pointsArrayBeforeAniridia.forEach((p, i) => {
                    this.squiggleArray[0].pointsArray[i].x = p.x;
                    this.squiggleArray[0].pointsArray[i].y = p.y;
                });
                this.pointsArrayBeforeAniridia = undefined;
            }
            this.resetHandles();
            break;
        case 'irisTrauma':
            if (_value === 'true') {
                this.drawing.addDoodle('IrisTrauma');
            }
            else {
                let ITs = this.drawing.allDoodlesOfClass('IrisTrauma');
                ITs.forEach(it => this.drawing.deleteDoodle(it));
            }
            break;
        case 'coloboma':
            this.isRotatable = (_value === "true");
            this.rotation = _value === "true" ? this.rotation : 0;

            if (_value === 'true') {
                this.setParameterFromString('aniridia', 'false');
            }
            break;
    }

    return returnArray;
};

/**
 * Draws doodle or performs a hit test if a Point parameter is passed
 *
 * @param {Point} _point Optional point in canvas plane, passed if performing hit test
 */
ED.AntSeg.prototype.draw = function (_point) {
    // Get context
    var ctx = this.drawing.context;
    this.rimSize = 20;

    // Call draw method in superclass
    ED.AntSeg.superclass.draw.call(this, _point);

    // Radius of limbus
    this.ro = this.limbusRadius;
    this.ri = -this.apexY;

    this.colAngle = (Math.PI / 3) * 280 / this.ri;
    this.colAngleOuter = Math.PI / 6;

    ctx.beginPath(); // Boundary path
    ctx.arc(0, 0, this.ro, 0, Math.PI * 2, true); // Do a 360 arc

    this.drawInnerPupil(ctx);

    // Edge attributes
    ctx.lineWidth = 4;
    ctx.strokeStyle = "gray";

    // Iris colour
    switch (this.colour) {
        case 'Blue':
            ctx.fillStyle = "rgba(100, 200, 250, 0.5)";
            break;
        case 'Brown':
            ctx.fillStyle = "rgba(172, 100, 55, 0.5)";
            break;
        case 'Gray':
            ctx.fillStyle = "rgba(125, 132, 116, 0.5)";
            break;
        case 'Green':
            ctx.fillStyle = "rgba(114, 172, 62, 0.5)";
            break;
    }

    // Draw boundary path (also hit testing)
    this.drawBoundary(_point);
    this.setHandleLocations();

    // Other paths and drawing here
    if (this.drawFunctionMode === ED.drawFunctionMode.Draw) {
        // Pseudo exfoliation
        if (this.pxe) {
            ctx.lineWidth = 8;
            ctx.strokeStyle = "darkgray";

            var rl = this.ri * 0.8;
            var rp = this.ri * 1.05;
            var segments = 36;
            var i;
            var phi = Math.PI * 2 / segments;

            // Loop around alternating segments
            for (i = 0; i < segments; i++) {
                // PXE on lens
                ctx.beginPath();
                ctx.arc(0, 0, rl, i * phi, i * phi + phi / 2, false);
                ctx.stroke();

                // PXE on pupil
                ctx.beginPath();
                ctx.arc(0, 0, rp, i * phi, i * phi + phi / 2, false);
                ctx.stroke();
            }
        }

        // Ectropion uveae
        if (this.ectropion) {
            ctx.beginPath();
            this.drawInnerPupil(ctx);
            ctx.lineWidth = 32;
            ctx.lineCap = "round";
            ctx.strokeStyle = "brown";
            ctx.stroke();
        }
    }

    // Coordinates of handles (in canvas plane)
    this.handleArray[this.apexHandle].location = this.transform.transformPoint(new ED.Point(this.apexX, this.apexY));

    // Draw handles if selected
    if (this.isSelected && !this.isForDrawing) {
        this.drawHandles(_point);
    }

    // Return value indicating successful hit test
    return this.isClicked;
};

/**
 * Returns a string containing a text description of the doodle
 *
 * @returns {String} Description of doodle
 */
ED.AntSeg.prototype.description = function () {
    var returnValue = "";
    var pupilSize = Math.round(-this.apexY * 0.03);

    // Pupil size and coloboma and corneal size
    if (this.pupilShape === 'Round')
        returnValue += this.pupilSize.toLowerCase() + " pupil (diameter: " + pupilSize + "mm), ";
    if (this.cornealSize.toLowerCase() !== 'not checked') {
        returnValue += 'corneal size : ' + this.cornealSize.toLowerCase() + ", ";
    }

    // Coloboma
    if (this.coloboma) {
        returnValue += "coloboma at " + this.clockHour(6) + " o'clock, ";
    }

    // Ectopion
    if (this.ectropion) {
        returnValue += "ectropion uveae, ";
    }

    // PXE
    if (this.pxe) {
        returnValue += "pseudoexfoliation, ";
    }

    // aniridia
    if (this.aniridia) {
        returnValue += "aniridia, ";
    }

    if (this.pupilShape === 'Distorted') {
        let squiggleLengths = [];
        let squiggleDirections = [];
        for (let i = 0; i < this.distortedPupilHandleNum; i++) {
            squiggleLengths.push(this.squiggleArray[0].pointsArray[i].length());
            squiggleDirections.push(this.squiggleArray[0].pointsArray[i].direction());
        }
        let maxIndex = squiggleLengths.indexOf(Math.max(...squiggleLengths));
        let maxClock = Math.ceil((squiggleDirections[maxIndex] - Math.PI / 12) / Math.PI / 2 * 12);
        if (this.drawing.eye === ED.eye.Left) // for left eye, directions are mirrored
            maxClock = 12 - maxClock;
        if (maxClock <= 0) maxClock += 12;

        returnValue += "pupil peaked at " + maxClock + " o'clock,";
    }

    // Empty report so far
    if (returnValue.length === 0 && this.drawing.doodleArray.length === 1) {
        returnValue = "No abnormality";
    }

    // Remove final comma and space and capitalise first letter
    returnValue = returnValue.replace(/, +$/, '').replace('<', '&lt;');
    returnValue = returnValue.charAt(0).toUpperCase() + returnValue.slice(1);

    return returnValue;
};

ED.AntSeg.prototype.snomedCodes = function () {
    let snomedCodes = [];
    if (this.pxe) {
        snomedCodes.push([44219007, 3]);
    }
    if (this.aniridia) {
        snomedCodes.push([69278003, 3]);
    }
    return snomedCodes;
};

// the inner bezier curve for distorted pupil
ED.AntSeg.prototype.closedBezierCurve = function (ctx, pointsArray) {

    // Bezier points
    let fp, tp, cp1, cp2;
    let phi = 2 * Math.PI / (3 * pointsArray.length);

    // Start curve
    ctx.moveTo(pointsArray[0].x, pointsArray[0].y);

    // Complete curve segments
    for (let i = 0; i < pointsArray.length; i++) {

        // From and to points
        fp = pointsArray[i];
        let toIndex = (i < pointsArray.length - 1) ? i + 1 : 0;
        tp = pointsArray[toIndex];
        if (this.coloboma && toIndex === 4) // draw coloboma instead of point 4
            this.drawColoboma(ctx);
        else {
            if (this.coloboma && toIndex === 5) // next handle after coloboma
                ctx.lineTo(tp.x, tp.y);
            else {
                // Control points
                cp1 = fp.tangentialControlPoint(+phi);
                cp2 = tp.tangentialControlPoint(-phi);
                // Draw Bezier curve
                ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, tp.x, tp.y);
            }
        }
    }
    this.handleArray[4].isVisible = !this.coloboma;
};


ED.AntSeg.prototype.drawColoboma = function (ctx) {
    let colAngle = (this.pupilShape === 'Round') ? this.colAngle : Math.PI / 3;
    let p1 = new ED.Point(0, 0);
    let p1Radius = (this.pupilShape === 'Round') ? this.ri : this.squiggleArray[0].pointsArray[3].length();
    p1.setWithPolars(p1Radius, Math.PI + colAngle / 2);
    ctx.lineTo(-p1.x, p1.y);

    let p2 = new ED.Point(0, 0);
    p2.setWithPolars(this.ro - this.rimSize, Math.PI + this.colAngleOuter / 2);
    ctx.arc(0, 0, this.ro - this.rimSize + 5, Math.PI / 2 - this.colAngleOuter / 2, Math.PI / 2 + this.colAngleOuter / 2, false);

    let p3 = new ED.Point(0, 0);
    let p3Radius = (this.pupilShape === 'Round') ? this.ri : this.squiggleArray[0].pointsArray[5].length();
    p3.setWithPolars(p3Radius, Math.PI + colAngle / 2);
    ctx.lineTo(p3.x, p3.y);
};


ED.AntSeg.prototype.drawInnerPupil = function (ctx) {

    if (this.pupilShape === 'Distorted') { // distorted pupil
        this.closedBezierCurve(ctx, this.squiggleArray[0].pointsArray);
    }
    else if (!this.coloboma) { // round pupil, no coloboma
        ctx.moveTo(this.ri, 0); // Move to inner circle
        ctx.arc(0, 0, this.ri, 0, Math.PI * 2, false); // Arc round edge of pupil
    }
    else { // round pupil, coloboma
        p2 = new ED.Point(0, 0);
        p2.setWithPolars(this.ro - this.rimSize, Math.PI + this.colAngleOuter / 2);
        ctx.moveTo(-p2.x, p2.y);
        this.drawColoboma(ctx);
        // Arc round edge of pupil
        ctx.arc(0, 0, this.ri, Math.PI / 2 + this.colAngle / 2, Math.PI / 2 - this.colAngle / 2, false);
    }
};

// abs difference of 2 radian angles
ED.AntSeg.prototype.radianDiff = function (angle1, angle2) {
    let d = Math.abs((angle1 - angle2) % (Math.PI * 2));
    return Math.min(d, Math.abs(d - Math.PI * 2));
};

ED.AntSeg.prototype.betweenAngles = function (angle1, minAngle, maxAngle) {
    return (this.radianDiff(angle1, minAngle) + this.radianDiff(angle1, maxAngle) - this.radianDiff(minAngle, maxAngle) < 0.001);
};
