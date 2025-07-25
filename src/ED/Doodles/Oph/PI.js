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
 * Peripheral iridectomy
 *
 * @class PI
 * @property {String} className Name of doodle subclass
 * @param {Drawing} _drawing
 * @param {Object} _parameterJSON
 */
ED.PI = function(_drawing, _parameterJSON) {
	// Set classname
	this.className = "PI";

	// Derived parameters
	this.type = 'Laser';
	this.patent = true;

	// Saved parameters
	this.savedParameterArray = ['rotation', 'type', 'patent'];

	// Parameters in doodle control bar (parameter name: parameter label)
	this.controlParameterArray = {'type':'Type', 'patent':'Patent'};

	// Call superclass constructor
	ED.Doodle.call(this, _drawing, _parameterJSON);
}

/**
 * Sets superclass and constructor
 */
ED.PI.prototype = new ED.Doodle;
ED.PI.prototype.constructor = ED.PI;
ED.PI.superclass = ED.Doodle.prototype;

/**
 * Sets default properties
 */
ED.PI.prototype.setPropertyDefaults = function() {
	this.isScaleable = false;
	this.isMoveable = false;

	// Add complete validation arrays for derived parameters
	this.parameterValidationArray['type'] = {
		kind: 'derived',
		type: 'string',
		list: ['Surgical', 'Laser'],
		animate: false
	};
	this.parameterValidationArray['patent'] = {
		kind: 'derived',
		type: 'bool',
		display: false
	};
};

/**
 * Sets default parameters
 */
ED.PI.prototype.setParameterDefaults = function() {
	this.setRotationWithDisplacements(-30, -60);
};

/**
 * Draws doodle or performs a hit test if a Point parameter is passed
 *
 * @param {Point} _point Optional point in canvas plane, passed if performing hit test
 */
ED.PI.prototype.draw = function(_point) {
	// Get context
	var ctx = this.drawing.context;

	// Call draw method in superclass
	ED.PI.superclass.draw.call(this, _point);

	// Outer radius
	var r = 360;

	// Boundary path
	ctx.beginPath();
	switch (this.type) {
		case 'Surgical':
			var phi = Math.PI / 24;
			ctx.arc(0, 0, r, -phi - Math.PI / 2, phi - Math.PI / 2, false);
			ctx.lineTo(0, -r * 0.8);
			ctx.closePath();
			break;
		case 'Laser':
			ctx.arc(0, -r * 0.9, 36, 0, Math.PI * 2, true);
			break;
	}

	// Set line attributes
	ctx.lineWidth = 4;

	// Colour of outer line is dark gray
	ctx.strokeStyle = "rgba(120,120,120,0.75)";

	// Colour of fill
	if (this.patent) ctx.fillStyle = "rgba(255,255,255,1)";
	else ctx.fillStyle = "rgba(150,150,150,1)";

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
ED.PI.prototype.description = function() {
	return "Peripheral iridectomy at " + this.clockHour() + " o'clock";
};
