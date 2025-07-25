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
 * Corneal scar
 *
 * @class CornealScar
 * @property {String} className Name of doodle subclass
 * @param {Drawing} _drawing
 * @param {Object} _parameterJSON
 */
ED.CornealScar = function(_drawing, _parameterJSON) {
	// Set classname
	this.className = "CornealScar";

	// Doodle specific property
	this.isInVisualAxis = false;

	// Saved parameters
	this.savedParameterArray = ['originX', 'originY', 'apexY', 'scaleX', 'scaleY'];

	// Call superclass constructor
	ED.Doodle.call(this, _drawing, _parameterJSON);
}

/**
 * Sets superclass and constructor
 */
ED.CornealScar.prototype = new ED.Doodle;
ED.CornealScar.prototype.constructor = ED.CornealScar;
ED.CornealScar.superclass = ED.Doodle.prototype;

/**
 * Sets handle attributes
 */
ED.CornealScar.prototype.setHandles = function() {
	this.handleArray[2] = new ED.Doodle.Handle(null, true, ED.Mode.Scale, false);
	this.handleArray[4] = new ED.Doodle.Handle(null, true, ED.Mode.Apex, false);
}

/**
 * Sets default dragging attributes
 */
ED.CornealScar.prototype.setPropertyDefaults = function() {
	this.isSqueezable = true;
	this.isRotatable = false;

	// Update component of validation array for simple parameters
	this.parameterValidationArray['apexX']['range'].setMinAndMax(-0, +0);
	this.parameterValidationArray['apexY']['range'].setMinAndMax(-100, -10);
}

/**
 * Sets default parameters
 */
ED.CornealScar.prototype.setParameterDefaults = function() {
	this.apexY = -50;
	this.scaleX = 0.7;
	this.scaleY = 0.5;

	this.setOriginWithDisplacements(0, 25);
}

/**
 * Draws doodle or performs a hit test if a Point parameter is passed
 *
 * @param {Point} _point Optional point in canvas plane, passed if performing hit test
 */
ED.CornealScar.prototype.draw = function(_point) {
	// Get context
	var ctx = this.drawing.context;

	// Call draw method in superclass
	ED.CornealScar.superclass.draw.call(this, _point);

	// Boundary path
	ctx.beginPath();

	// CornealScar
	var r = 100;
	ctx.arc(0, 0, r, 0, Math.PI * 2, false);

	// Close path
	ctx.closePath();

	// Create fill
	var alpha = -this.apexY / 100;
	ctx.fillStyle = "rgba(100,100,100," + alpha.toFixed(2) + ")";

	// Transparent stroke
	ctx.strokeStyle = "rgba(100,100,100,0.9)";

	// Draw boundary path (also hit testing)
	this.drawBoundary(_point);

	// Non-boundary paths
	if (this.drawFunctionMode == ED.drawFunctionMode.Draw) {
		// Work out whether visual axis is involved
		var centre = new ED.Point(0, 0);
		var visualAxis = this.drawing.transform.transformPoint(centre);
		var ctx = this.drawing.context;
		if (ctx.isPointInPath(visualAxis.x, visualAxis.y)) this.isInVisualAxis = true;
		else this.isInVisualAxis = false;
	}

	// Coordinates of handles (in canvas plane)
	var point = new ED.Point(0, 0);
	point.setWithPolars(r, Math.PI / 4);
	this.handleArray[2].location = this.transform.transformPoint(point);
	this.handleArray[4].location = this.transform.transformPoint(new ED.Point(this.apexX, this.apexY));

	this.parameterValidationArray['originX']['circularRange'] = 380 - Math.min(r * this.scaleX, r * this.scaleY);

	// Draw handles if selected
	if (this.isSelected && !this.isForDrawing) this.drawHandles(_point);

	// Return value indicating successful hittest
	return this.isClicked;
};

/**
 * Returns a string containing a text description of the doodle
 *
 * @returns {String} Description of doodle
 */
ED.CornealScar.prototype.description = function() {
	var returnString = "";

	// Calculate size
	var averageScale = this.scaleX + this.scaleY;

	// Arbitrary cutoffs
	if (averageScale < 2) returnString = "Small ";
	else if (averageScale < 4) returnString = "Medium ";
	else returnString = "Large ";

	returnString += "corneal scar";

	if (this.isInVisualAxis) returnString += " involving visual axis";

	return returnString;
}

/**
 * Returns the SnoMed code of the doodle
 *
 * @returns {Int} SnoMed code of entity representated by doodle
 */
ED.CornealScar.prototype.snomedCode = function() {
	return 95726001;
}

/**
 * Returns a number indicating position in a hierarchy of diagnoses from 0 to 9 (highest)
 *
 * @returns {Int} Position in diagnostic hierarchy
 */
ED.CornealScar.prototype.diagnosticHierarchy = function() {
	return 0;
}
