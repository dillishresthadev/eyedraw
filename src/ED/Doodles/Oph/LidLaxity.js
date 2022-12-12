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
 * LidLaxity
 *
 * @class LidLaxity
 * @property {String} className Name of doodle subclass
 * @param {Drawing} _drawing
 * @param {Object} _parameterJSON
 */
ED.LidLaxity = function (_drawing, _parameterJSON) {
    // Set classname
    this.className = "LidLaxity";

    // Saved parameters
    this.savedParameterArray = ['center', 'size'];

    // Call superclass constructor
    ED.Doodle.call(this, _drawing, _parameterJSON);
};

/**
 * Sets superclass and constructor
 */
ED.LidLaxity.prototype = new ED.Doodle;
ED.LidLaxity.prototype.constructor = ED.LidLaxity;
ED.LidLaxity.superclass = ED.Doodle.prototype;

/**
 * Sets handle attributes
 */
ED.LidLaxity.prototype.setHandles = function () {
    this.handleArray[0] = new ED.Doodle.Handle(null, true, ED.Mode.Move, false);
    this.handleArray[1] = new ED.Doodle.Handle(null, true, ED.Mode.Apex, false);
};

/**
 * Sets default dragging attributes
 */
ED.LidLaxity.prototype.setPropertyDefaults = function () {
    this.isMoveable = true;
    this.isRotatable = false;
    this.isUnique = true;
    this.size = 0.4;
    this.center = 0.5;

    this.parameterValidationArray.center = {
        kind: 'derived',
        type: 'int',
        range: new ED.Range(-500, 500),
        animate: false
    };
    this.parameterValidationArray.size = {
        kind: 'derived',
        type: 'int',
        range: new ED.Range(-500, 500),
        animate: false
    };
};

ED.LidLaxity.prototype.draw = function (_point) {

    let LacrimalDoodle = this.drawing.firstDoodleOfClass('Lacrimal');
    let lidParams = LacrimalDoodle.getLidCurveParams();
    let lidLength = lidParams.endPoint.x - lidParams.startPoint.x;

    // this.parameterValidationArray.apexX.range.setMinAndMax(20, lidLength);

    if (!this.initialized) { // first run, set originX from this.center
        this.initialized = true;
        this.originX = this.center * lidLength + lidParams.startPoint.x;
    }

    if (this.rightEye === 1) {
        this.parameterValidationArray.originX.range.setMinAndMax(lidParams.startPoint.x + lidLength * this.size / 2, lidParams.endPoint.x - lidLength * this.size / 2);
    }
    else {
        this.parameterValidationArray.originX.range.setMinAndMax(-lidParams.endPoint.x + lidLength * this.size / 2, -lidParams.startPoint.x - lidLength * this.size / 2);
    }

    // this.center is derived after the first run
    this.center = (this.originX - lidParams.startPoint.x) / lidLength;

    this.originY = 0;

    // Get context
    var ctx = this.drawing.context;

    // Call draw method in superclass
    ED.LidLaxity.superclass.draw.call(this, _point);

    ctx.beginPath();

    // draw the laxity
    let bezPoint = MathHelper.calculateBezierPoints(this.center - this.size / 2, lidParams.startPoint, lidParams.endPoint, lidParams.controlPoint1, lidParams.controlPoint2);

    ctx.moveTo(bezPoint.x - this.originX, bezPoint.y);

    let sgn = 1;
    for (let t = this.center - this.size / 2; t <= this.center + this.size / 2; t += 0.025) {
        let lastPoint = bezPoint;
        bezPoint = MathHelper.calculateBezierPoints(t, lidParams.startPoint, lidParams.endPoint, lidParams.controlPoint1, lidParams.controlPoint2);
        let t0 = new Turtle({ x: bezPoint.x, y: bezPoint.y, vx: lastPoint.x - bezPoint.x, vy: lastPoint.y - bezPoint.y });
        let controlPoint = t0.move(Math.abs(bezPoint.x - lastPoint.x) / 2).turnLeft().move(10 * sgn).getPoint();
        ctx.lineTo(controlPoint.x - this.originX, controlPoint.y);
        ctx.lineTo(bezPoint.x - this.originX, bezPoint.y);
        sgn *= -1;
    }

    ctx.strokeStyle = "rgba(200,0,0,1)";
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.lineWidth = 5;

    // Draw boundary path (also hit testing)
    this.drawBoundary(_point);

    // calculate points for handles
    let centerPoint = MathHelper.calculateBezierPoints(this.center, lidParams.startPoint, lidParams.endPoint, lidParams.controlPoint1, lidParams.controlPoint2);

    let sidePoint = MathHelper.calculateBezierPoints(this.center + this.size / 2, lidParams.startPoint, lidParams.endPoint, lidParams.controlPoint1, lidParams.controlPoint2);
    if (this.handleArray[1].location.x === 0 && this.handleArray[1].location.y === 0) { // initial setting
        this.apexX = this.size * lidLength;
    }
    else {
        this.size = this.apexX / lidLength;
    }

    // constraining apexX
    if (this.apexX > lidLength) {
        this.apexX = lidLength;
    }
    this.parameterValidationArray.apexX.range.setMinAndMax(20, lidLength); // it's not redundant, needed to avoid bumpiness

    // constaring originX
    if (this.originX < lidParams.startPoint.x + lidLength * this.size / 2) {
        this.originX = lidParams.startPoint.x + lidLength * this.size / 2;
    }
    else if (this.originX > lidParams.endPoint.x - lidLength * this.size / 2) {
        this.originX = lidParams.endPoint.x - lidLength * this.size / 2;
    }
    this.parameterValidationArray.originX.range.setMinAndMax(lidParams.startPoint.x + lidLength * this.size / 2, lidParams.endPoint.x - lidLength * this.size / 2); // it's not redundant, needed to avoid bumpiness

    this.handleArray[0].location = this.transform.transformPoint({ x: 0, y: centerPoint.y });
    this.handleArray[1].location = this.transform.transformPoint({ x: sidePoint.x - this.originX, y: sidePoint.y });

    if (this.isSelected && !this.isForDrawing) {
        this.drawHandles(_point);
    }

    // Return value indicating successful hittest
    return this.isClicked;
};

/**
 * Returns a string containing a text description of the doodle
 *
 * @returns {String} Description of doodle
 */
ED.LidLaxity.prototype.description = function () {

    let lateralBound = 0.25;
    let medialBound = 0.75;
    let isCentral = false;
    let isMedial = false;
    let isLateral = false;
    if (this.center - this.size / 2 < lateralBound) {
        isLateral = true;
    }
    else if (this.center - this.size / 2 < medialBound) {
        isCentral = true;
    }
    else {
        isMedial = true;
    }

    if (this.center + this.size / 2 > medialBound) {
        isMedial = true;
    }
    else if (this.center + this.size / 2 > lateralBound) {
        isCentral = true;
    }
    else {
        isLateral = true;
    }

    if (isMedial && isLateral) {
        isCentral = true;
    }

    let description = '';
    if (isLateral) {
        description += 'lateral, ';
    }
    if (isCentral) {
        description += 'central, ';
    }
    if (isMedial) {
        description += 'medial, ';
    }

    description = description.charAt(0).toUpperCase() + description.slice(1, description.length - 2) + ' lid laxity. ';
    return description;
};

/**
 * Returns the SnoMed code of the doodle
 *
 * @returns {number} SnoMed code of entity represented by doodle
 */
// ED.LidLaxity.prototype.snomedCode = function () {
//     'use strict';
//     return -1;
// };
