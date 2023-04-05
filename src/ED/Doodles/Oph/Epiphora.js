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
 * Epiphora
 *
 * @class Epiphora
 * @property {String} className Name of doodle subclass
 * @param {Drawing} _drawing
 * @param {Object} _parameterJSON
 */
ED.Epiphora = function (_drawing, _parameterJSON) {
    // Set classname
    this.className = "Epiphora";

    // Private parameters
    this.degree = '+';

    // Saved parameters
    this.savedParameterArray = ['degree', 'originX'];

    this.controlParameterArray = { 'degree': 'degree' };

    // Call superclass constructor
    ED.Doodle.call(this, _drawing, _parameterJSON);
};

/**
 * Sets superclass and constructor
 */
ED.Epiphora.prototype = new ED.Doodle;
ED.Epiphora.prototype.constructor = ED.Epiphora;
ED.Epiphora.superclass = ED.Doodle.prototype;

/**
 * Sets default dragging attributes
 */
ED.Epiphora.prototype.setPropertyDefaults = function () {
    this.isMoveable = true;
    this.isRotatable = false;
    this.isScaleable = false;
    this.isUnique = true;
    this.originX = 0;
    this.originY = 0;
    this.drawX = 0;
    this.drawY = 0;

    this.parameterValidationArray.degree = {
        kind: 'derived',
        type: 'string',
        list: ['+', '++', '+++'],
        animate: false
    };
};

/**
 * Sets default parameters
 */
ED.Epiphora.prototype.setParameterDefaults = function () {
    this.setParameterFromString('degree', '+');
};

/**
 * Draws doodle or performs a hit test if a Point parameter is passed
 *
 * @param {Point} _point Optional point in canvas plane, passed if performing hit test
 */

ED.Epiphora.prototype.dependentParameterValues = function (_parameter, _value) {
    var returnArray = {};

    switch (_parameter) {
        case 'degree':
            switch (_value) {
                case '+':
                    returnArray.size = 50;
                    break;
                case '++':
                    returnArray.size = 75;
                    break;
                case '+++':
                    returnArray.size = 100;
                    break;
            }
            break;
    }

    return returnArray;
};


ED.Epiphora.prototype.draw = function (_point) {

    // attach to lower lid
    this.originY = 0;
    let lidsDoodle = this.drawing.firstDoodleOfClass('Lids');
    if (lidsDoodle) {
        let lidParams = lidsDoodle.getLidCurveParams();
        let minPoint = Math.min(lidParams.startPointBottom.x, lidParams.endPointBottom.x) / 2;
        let maxPoint = Math.max(lidParams.startPointBottom.x, lidParams.endPointBottom.x) / 2;

        if (this.originX < minPoint) {
            this.originX = minPoint;
        }

        if (this.originX > maxPoint) {
            this.originX = maxPoint;
        }

        let t = 1 - (this.originX - lidParams.endPointBottom.x / 2) / (lidParams.startPointBottom.x - lidParams.endPointBottom.x) * 2;

        let bezPoint = MathHelper.calculateBezierPoints(t, lidParams.startPointBottom, lidParams.endPointBottom, lidParams.controlPointBottom1, lidParams.controlPointBottom2);
        this.drawY = bezPoint.y;
        this.drawX = bezPoint.x - this.originX;
    } else {
        this.drawX = this.originX;
    }

    // Get context
    var ctx = this.drawing.context;

    // Call draw method in superclass
    ED.Epiphora.superclass.draw.call(this, _point);

    // Boundary path
    let y1 = this.drawY + this.size;
    let curviness = 5;
    let arcGap = 0.75;
    let phi1 = Math.PI * 1.5 - arcGap;
    let phi2 = Math.PI * 1.5 + arcGap;
    let arcX = this.drawX;
    let arcY = this.drawY + this.size * 2;
    let arcRadius = this.size;

    let arcStart = new ED.Point();
    arcStart.setWithPolars(arcRadius, phi1 + Math.PI / 2);

    ctx.beginPath();
    ctx.arc(arcX, arcY, arcRadius, phi1, phi2, true);
    ctx.quadraticCurveTo(this.drawX + this.size / curviness, y1 - this.size / curviness, this.drawX, this.drawY);
    ctx.quadraticCurveTo(this.drawX - this.size / curviness, y1 - this.size / curviness, arcX + arcStart.x, arcY + arcStart.y);

    ctx.stroke();
    // Close path
    ctx.closePath();

    // Colour of fill
    ctx.strokeStyle = "rgba(0,209,0,1)";
    ctx.fillStyle = ctx.strokeStyle;

    // Draw boundary path (also hit testing)
    this.drawBoundary(_point);

    // Return value indicating successful hittest
    return this.isClicked;
};

/**
 * Returns a string containing a text description of the doodle
 *
 * @returns {String} Description of doodle
 */
ED.Epiphora.prototype.description = function () {
    return "Epiphora " + this.degree;
};

/**
 * Returns the SnoMed code of the doodle
 *
 * @returns {number} SnoMed code of entity represented by doodle
 */
ED.Epiphora.prototype.snomedCode = function () {
    return 193982009;
};
