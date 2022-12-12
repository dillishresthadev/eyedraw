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
 * Lacrimal
 *
 * @class Lacrimal
 * @property {String} className Name of doodle subclass
 * @param {Drawing} _drawing
 * @param {Object} _parameterJSON
 */

ED.Lacrimal = function (_drawing, _parameterJSON) {
    this.className = "Lacrimal";
    this.yShift = 100; // for easy repositioning

    ED.Doodle.call(this, _drawing, _parameterJSON);
    if (this.drawing.eye === ED.eye.Left) {
        this.drawing.flipDrawingHorizontally();
    }

    this.loaded = false;
    // parameters of child doodles are to be tracked, saved, and set in this doodle
    // Punctum parameters
    this.savedParameterArray = ['flowType_lowerPunctum', 'flowType_upperPunctum'];
    if (_parameterJSON) {
        this.flowType_lowerPunctum = _parameterJSON.flowType_lowerPunctum;
        this.flowType_upperPunctum = _parameterJSON.flowType_upperPunctum;
    }
    else {
        this.flowType_lowerPunctum = 'patent';
        this.flowType_upperPunctum = 'patent';
    }
    this.lowerPunctumParams = { x1: -50, y1: 55 + this.yShift, x2: -90, y2: -10 + this.yShift, flowType: this.flowType_lowerPunctum, lacrimalChildName: 'lowerPunctum' }; // , isLower: 'true'
    this.upperPunctumParams = { x1: -50, y1: -250 + this.yShift, x2: -85, y2: -190 + this.yShift, flowType: this.flowType_upperPunctum, lacrimalChildName: 'upperPunctum' }; // , isLower: 'false'

    // Duct parameters
    this.lowerDuctParams = { x1: -60, y1: 55 + this.yShift, x2: 200, y2: -100 + this.yShift, lacrimalChildName: 'lowerDuct' };
    this.upperDuctParams = { x1: -60, y1: -250 + this.yShift, x2: 200, y2: -100 + this.yShift, lacrimalChildName: 'upperDuct' };
    this.horizontalDuctParams = { x1: 200, y1: -100 + this.yShift, x2: 440, y2: -100 + this.yShift, lacrimalChildName: 'horizontalDuct' };
    let ductParams = ['flowType', 'flowPct', 'flowPosition', 'flowDirection'];
    let defaultParams = ['patent', 100, 50, this.drawing.isFlipped ? 1 : -1]; // redundant, flowPct determines
    let ductNames = ['upperDuct', 'lowerDuct', 'horizontalDuct'];
    ductNames.forEach(ductName => {
        ductParams.forEach((ductParam, index) => {
            let fieldName = ductParam + '_' + ductName;
            this.savedParameterArray.push(fieldName);
            if (_parameterJSON)  // doodle is loaded
            {
                this[fieldName] = _parameterJSON[fieldName];
            }
            else {
                this[fieldName] = defaultParams[index];
            }

            this[ductName + 'Params'][ductParam] = this[fieldName];
        });
    });

    // notifications for adding parameter changes in child doodles
    this.drawing.registerForNotifications(this, 'parameterChangedFcn', 'parameterChanged')
    this.drawing.registerForNotifications(this, 'onReady', 'ready')
};

/**
 * Sets superclass and constructor
 */
ED.Lacrimal.prototype = new ED.Doodle;
ED.Lacrimal.prototype.constructor = ED.Lacrimal;
ED.Lacrimal.superclass = ED.Doodle.prototype;

// start adding child doodles only when everything is ready
ED.Lacrimal.prototype.onReady = function () {
    this.upperPunctum = this.drawing.addDoodle('LacrimalPunctum', this.upperPunctumParams);
    this.lowerPunctum = this.drawing.addDoodle('LacrimalPunctum', this.lowerPunctumParams);
    this.horizontalDuct = this.drawing.addDoodle('LacrimalDuct', this.horizontalDuctParams);
    this.upperDuct = this.drawing.addDoodle('LacrimalDuct', this.upperDuctParams);
    this.lowerDuct = this.drawing.addDoodle('LacrimalDuct', this.lowerDuctParams);
    this.drawing.deselectDoodles();
    this.loaded = true;
};

// capture changed parameters in child doodles
ED.Lacrimal.prototype.parameterChangedFcn = function (data) {
    if (this.loaded) {
        let _doodleName = data.object.doodle.lacrimalChildName; // ignore changes in unassociated doodles
        if (_doodleName) {
            let _parameter = data.object.parameter;
            let _value = data.object.value;
            this[_parameter + '_' + _doodleName] = _value; // keep track of changes in ducts and puncta
        }
        // if upper and lower ducts are blocked, block common duct as well
        if (this.upperDuct.flowPct === 0 && this.lowerDuct.flowPct === 0 && this.horizontalDuct.flowType !== 'blocked') {
            this.horizontalDuct.setParameterFromString('flowPct', '0');
            // if either upper or lower duct is blocked, flow in common duct will be equal to the remaining unblocked one's
        }
        else if (this.upperDuct.flowPct === 0 && this.lowerDuct.flowPct > 0 && this.horizontalDuct.flowPct !== this.lowerDuct.flowPct) {
            this.horizontalDuct.setParameterFromString('flowPct', this.lowerDuct.flowPct + '');
        }
        else if (this.lowerDuct.flowPct === 0 && this.upperDuct.flowPct > 0 && this.horizontalDuct.flowPct !== this.upperDuct.flowPct) {
            this.horizontalDuct.setParameterFromString('flowPct', this.upperDuct.flowPct + '');
        }
    }
};

/**
 * Sets handle attributes
 */
ED.Lacrimal.prototype.setPropertyDefaults = function () {
    this.isMoveable = false;
    this.isRotatable = false;
    this.isScaleable = false;
    this.isUnique = true;
    this.originX = 0;
    this.originY = 0;

    this.parameterValidationArray.flowType_upperDuct = {
        kind: 'other',
        type: 'string',
        list: ['patent', 'partial flow', 'blocked'],
        animate: false
    };

    this.parameterValidationArray.flowPct_upperDuct = {
        kind: 'other',
        type: 'int',
        range: new ED.Range(0, 100),
        animate: false
    };
    this.parameterValidationArray.flowPosition_upperDuct = {
        kind: 'other',
        type: 'float',
        range: new ED.Range(0, 1),
        animate: false
    };
    this.parameterValidationArray.flowDirection_upperDuct = {
        kind: 'other',
        type: 'int',
        range: new ED.Range(-1, 1),
        animate: false
    };
};

ED.Lacrimal.prototype.dependentParameterValues = function (_parameter, _value) {
    var returnArray = {};
    return returnArray;
};

/**
 * Draws doodle or performs a hit test if a Point parameter is passed
 *
 * @param {Point} _point Optional point in canvas plane, passed if performing hit test
 */

ED.Lacrimal.prototype.draw = function (_point) {
    // Get context
    var ctx = this.drawing.context;
    // Call draw method in superclass
    ED.LacrimalDuct.superclass.draw.call(this, _point);

    // lids parameters
    let upperRight = new ED.Point(-80, -180 + this.yShift);
    let commonLeft = new ED.Point(-450, -90 + this.yShift);
    let controlU1 = new ED.Point(-175, -250 + this.yShift);
    let controlU2 = new ED.Point(-375, -250 + this.yShift);
    let lowerRight = new ED.Point(-80, -20 + this.yShift);
    if (this.flowType_lowerPunctum === 'everted') {
        lowerRight.x = -125;
        lowerRight.y = 40 + this.yShift;
    }
    let controlL1 = new ED.Point(-375, 50 + this.yShift);
    let controlL2 = new ED.Point(-175, 50 + this.yShift);

    // draw lids
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0,0,209,1)";
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.lineWidth = 12;
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = -4;
    ctx.moveTo(upperRight.x, upperRight.y);
    ctx.bezierCurveTo(controlU1.x, controlU1.y, controlU2.x, controlU2.y, commonLeft.x, commonLeft.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(commonLeft.x, commonLeft.y);
    ctx.bezierCurveTo(controlL1.x, controlL1.y, controlL2.x, controlL2.y, lowerRight.x, lowerRight.y);
    ctx.strokeStyle = "rgba(0,0,209,1)";
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.shadowOffsetY = 4;
    ctx.stroke();

    this.lidCurveParams = { startPoint: commonLeft, endPoint: lowerRight, controlPoint1: controlL1, controlPoint2: controlL2 };

    // draw the ducts
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.lineWidth = 20;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.moveTo(this.horizontalDuctParams.x2, -105 + this.yShift);
    ctx.lineTo(this.horizontalDuctParams.x2, 300 + this.yShift);
    ctx.lineTo(this.horizontalDuctParams.x2, this.horizontalDuctParams.y2);
    ctx.lineTo(this.horizontalDuctParams.x1, this.horizontalDuctParams.y1);
    ctx.lineTo(this.upperDuctParams.x1, this.upperDuctParams.y1);
    ctx.moveTo(this.horizontalDuctParams.x1, this.horizontalDuctParams.y1);
    ctx.lineTo(this.lowerDuctParams.x1, this.lowerDuctParams.y1);
    ctx.stroke();

    // Draw boundary path (also hit testing)
    this.drawBoundary(_point);

    // Return value indicating successful hittest
    return this.isClicked;
};

// a helper to anchor to the lower lid, e.g. lid laxity
ED.Lacrimal.prototype.getLidCurveParams = function () {
    return this.lidCurveParams;
};

ED.Lacrimal.prototype.description = function () {
    var returnValue = "";
    if (this.loaded) {
        returnValue += 'Upper duct: ' + this.upperDuct.flowType + ', flow ' + this.upperDuct.flowPct + '%. ';
        returnValue += 'Lower duct: ' + this.lowerDuct.flowType + ', flow ' + this.lowerDuct.flowPct + '%. ';
        returnValue += 'Horizontal duct: ' + this.horizontalDuct.flowType + ', flow ' + this.horizontalDuct.flowPct + '%. ';
        returnValue += 'Upper punctum: ' + this.upperPunctum.flowType + '. ';
        returnValue += 'Lower punctum: ' + this.lowerPunctum.flowType + '. ';
    }
    return returnValue;
};
