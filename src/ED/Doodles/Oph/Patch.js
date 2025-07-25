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
 * Patch
 *
 * @class Patch
 * @property {String} className Name of doodle subclass
 * @param {Drawing} _drawing
 * @param {Object} _parameterJSON
 */
ED.Patch = function(_drawing, _parameterJSON) {
	// Set classname
	this.className = "Patch";

	// Other parameters
	this.material = 'Sclera';

	// Saved parameters
	this.savedParameterArray = ['originX', 'originY', 'width', 'height', 'apexX', 'material'];

	// Parameters in doodle control bar (parameter name: parameter label)
	this.controlParameterArray = {'material':'Material'};

	// Call superclass constructor
	ED.Doodle.call(this, _drawing, _parameterJSON);
}

/**
 * Sets superclass and constructor
 */
ED.Patch.prototype = new ED.Doodle;
ED.Patch.prototype.constructor = ED.Patch;
ED.Patch.superclass = ED.Doodle.prototype;

/**
 * Sets handle attributes
 */
ED.Patch.prototype.setHandles = function() {
	this.handleArray[3] = new ED.Doodle.Handle(null, true, ED.Mode.Size, false);
}

/**
 * Sets default dragging attributes
 */
ED.Patch.prototype.setPropertyDefaults = function() {
	this.isOrientated = true;

	// Add complete validation arrays for derived parameters
	this.parameterValidationArray['material'] = {
		kind: 'other',
		type: 'string',
		list: ['Sclera', 'Tenons', 'Cornea', 'Pericardium', 'Fascia lata', 'Other'],
		animate: false
	};
}

/**
 * Sets default parameters
 */
ED.Patch.prototype.setParameterDefaults = function() {
	this.width = 200;
	this.height = 200;

	this.setParameterFromString('material', 'Sclera');
	
	// Position over tube if present
	var doodle = this.drawing.lastDoodleOfClass("Tube");
	if (doodle) {
		var isRE = (this.drawing.eye == ED.eye.Right);
		
		switch (doodle.platePosition) {
			case 'STQ':
				this.originX = isRE?-350:+350;
				this.originY = -350;
				this.rotation = (isRE?7:1) * Math.PI/4;
				break;
			case 'SNQ':
				this.originX = isRE?+350:-350;
				this.originY = -350;
				this.rotation = (isRE?1:7) * Math.PI/4;
				break;
			case 'INQ':
				this.originX = isRE?+350:-350;
				this.originY = +350;
				this.rotation = (isRE?3:5) * Math.PI/4;
				break;
			case 'ITQ':
				this.originX = isRE?-350:+350;
				this.originY = +350;
				this.rotation = (isRE?5:3) * Math.PI/4;
				break;	
		}
	}

	// Different size and position for a trabeculectomy flap
	var doodle = this.drawing.lastDoodleOfClass("TrabyFlap");
	if (doodle) {
		this.originY = -360;
		this.width = 488;
		this.height = 228;
	}
}

/**
 * Draws doodle or performs a hit test if a Point parameter is passed
 *
 * @param {Point} _point Optional point in canvas plane, passed if performing hit test
 */
ED.Patch.prototype.draw = function(_point) {
	// Get context
	var ctx = this.drawing.context;

	// Call draw method in superclass
	ED.Patch.superclass.draw.call(this, _point);

	// Boundary path
	ctx.beginPath();
	ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
	ctx.closePath();

	// Colour of fill
	switch (this.material) {
		case 'Sclera':
			ctx.fillStyle = "rgba(200,200,50,0.5)";
			break;
		case 'Tenons':
			ctx.fillStyle = "rgb(51,193,107,0.5)";
			break;
		case 'Pericardium':
			ctx.fillStyle = "rgb(245,166,35,0.5)";
			break;
		case 'Fascia lata':
			ctx.fillStyle = "rgb(155,155,155,0.5)";
			break;
        case 'Cornea':
			ctx.fillStyle = "rgb(40,101,231,0.5)";
        	break;
		case 'Other':
			ctx.fillStyle = "rgb(255,255,255,0.5)";
			break;
		default:
			ctx.fillStyle = "rgb(155,155,155,0.3)";
	}
	ctx.strokeStyle = "rgba(120,120,120,0.5)";

	// Draw boundary path (also hit testing)
	this.drawBoundary(_point);

	// Non boundary paths
	if (this.drawFunctionMode == ED.drawFunctionMode.Draw) {
		var xd = this.width/2;
		var yd = this.height/2 - 10;

		// Suture knots
		this.drawSpot(ctx, -xd, -yd, 5, "blue");
		this.drawSpot(ctx, -xd, yd, 5, "blue");
		this.drawSpot(ctx, xd, -yd, 5, "blue");
		this.drawSpot(ctx, xd, yd, 5, "blue");
	}

	// Coordinates of handles (in canvas plane)
	this.handleArray[3].location = this.transform.transformPoint(new ED.Point(this.width / 2, -this.height / 2));

	this.drawLabel(ctx);

	// Draw handles if selected
	if (this.isSelected && !this.isForDrawing) this.drawHandles(_point);

	// Return value indicating successful hittest
	return this.isClicked;
}

/**
 * Displays a text anotation over the doodle to show which material is used.
 * @param ctx 
 */
ED.Patch.prototype.drawLabel = function (ctx) {

	var label = '';
	switch (this.material) {
		case 'Sclera':
			label = 'SCL';
			break;
		case 'Tenons':
			label = 'T';
			break;
		case 'Pericardium':
			label = 'P';
			break;
		case 'Fascia lata':
			label = 'FL';
			break;
		case 'Cornea':
			label = 'C';
			break;
		case 'Other':
			label = 'Other';
			break;
	}

	ctx.save();
	ctx.beginPath();

	ctx.fillStyle = "black";
	ctx.font = "36px Arial";
	ctx.fillText(label, 0 - (ctx.measureText(label).width / 2), this.height / 2 - 20);
	ctx.fill();
	ctx.stroke();
	ctx.restore();
};

/**
 * Returns a string containing a text description of the doodle
 *
 * @returns {String} Description of doodle
 */
ED.Patch.prototype.description = function() {
	if (this.material === 'Other') {
		return 'patch';
	}

	return this.material + " patch";
}
