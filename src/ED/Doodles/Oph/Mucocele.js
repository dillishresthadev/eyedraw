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
 * Mucocele
 *
 * @class Mucocele
 * @property {String} className Name of doodle subclass
 * @param {Drawing} _drawing
 * @param {Object} _parameterJSON
 */
ED.Mucocele = function (_drawing, _parameterJSON) {
    // Set classname
    this.className = "Mucocele";

    // Saved parameters
    this.savedParameterArray = ['originX', 'originY', 'scaleX', 'scaleY', 'inflamed'];

    // Parameters in doodle control bar (parameter name: parameter label)
    this.controlParameterArray = { 'inflamed': 'inflamed' };

    this.inflamed = false;

    // Call superclass constructor
    ED.Doodle.call(this, _drawing, _parameterJSON);

    this.rightEye = 1;
    this.originX = 430 * this.rightEye;
    this.originY = 150;
};

/**
 * Sets superclass and constructor
 */
ED.Mucocele.prototype = new ED.Doodle;
ED.Mucocele.prototype.constructor = ED.Mucocele;
ED.Mucocele.superclass = ED.Doodle.prototype;

/**
 * Sets handle attributes
 */
ED.Mucocele.prototype.setHandles = function () {
    this.handleArray[2] = new ED.Doodle.Handle(null, true, ED.Mode.Scale, false);
};

/**
 * Sets default dragging attributes
 */
ED.Mucocele.prototype.setPropertyDefaults = function () {
    this.isMoveable = false;
    this.isSqueezable = true;
    this.isRotatable = false;
    this.isUnique = true;

    this.parameterValidationArray['scaleX']['range'].setMinAndMax(+0.25, +1.5);
    this.parameterValidationArray['scaleY']['range'].setMinAndMax(+0.25, +1.5);

    // Add complete validation arrays for derived parameters
    this.parameterValidationArray['inflamed'] = {
        kind: 'derived',
        type: 'bool',
        display: true
    };
};

/**
 * Sets default parameters
 */
ED.Mucocele.prototype.setParameterDefaults = function () {};

/**
 * Draws doodle or performs a hit test if a Point parameter is passed
 *
 * @param {Point} _point Optional point in canvas plane, passed if performing hit test
 */
ED.Mucocele.prototype.draw = function (_point) {
    // Get context
    var ctx = this.drawing.context;

    // Call draw method in superclass
    ED.Mucocele.superclass.draw.call(this, _point);

    // Boundary path
    ctx.beginPath();

    // Mucocele
    var r = 90;
    ctx.arc(0, 0, r, Math.PI * 1.5, Math.PI * .5, true);

    // Close path
    ctx.closePath();

    // Properties
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(100, 100, 100, 1)";
    ctx.fillStyle = this.inflamed ? "rgba(255, 0, 0, 1)" : "rgba(150, 150, 150, 1)";

    // Draw boundary path (also hit testing)
    this.drawBoundary(_point);

    // Coordinates of handles (in canvas plane)
    var point = new ED.Point(0, 0);
    point.setWithPolars(r, -Math.PI / 4);
    this.handleArray[2].location = this.transform.transformPoint(point);

    // Draw handles if selected
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
ED.Mucocele.prototype.description = function () {

    let returnValue = "";
    if (this.inflamed) {
        returnValue += "inflamed ";
    }
    returnValue += "mucocele. ";
    returnValue = returnValue.charAt(0).toUpperCase() + returnValue.slice(1); // capitalize first letter

    return returnValue;
};
