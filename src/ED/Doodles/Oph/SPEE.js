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
 * 
 *
 * @class SPEE
 * @property {String} className Name of doodle subclass
 * @param {Drawing} _drawing
 * @param {Object} _parameterJSON
 */
ED.SPEE = function (_drawing, _parameterJSON) {
	// Set classname
	this.className = "SPEE";

	// Saved parameters
	this.savedParameterArray = ['originX', 'originY', 'apexY', 'apexX', 'scaleX', 'scaleY', 'rotation', 'configuration', 'previousConfiguration'];
	this.configuration = 'Diffuse, moderate';
	this.previousConfiguration = 'Diffuse, moderate';

	this.controlParameterArray = { 'configuration': 'Set configuration' };

	this.randomArray = new Array(20000); // we need a longer randomArray than ED.randomArray
	for (let i = 0; i < this.randomArray.length; i++) {
		this.randomArray[i] = Math.random();
	}

	// Call superclass constructor
	ED.Doodle.call(this, _drawing, _parameterJSON);
};

/**
 * Sets superclass and constructor
 */
ED.SPEE.prototype = new ED.Doodle;
ED.SPEE.prototype.constructor = ED.SPEE;
ED.SPEE.superclass = ED.Doodle.prototype;

/**
 * Sets handle attributes
 */
ED.SPEE.prototype.setHandles = function() {
	
	// pigmentation density
	this.handleArray[0] = new ED.Doodle.Handle(null, true, ED.Mode.Handles, false);
	
	// shape
	this.handleArray[4] = new ED.Doodle.Handle(null, true, ED.Mode.Apex, false);
	this.handleArray[4].isRotatable = true;
};

/**
 * Sets default properties
 */
ED.SPEE.prototype.setPropertyDefaults = function() {
	this.isSqueezable = true;
	
	// Update component of validation array for simple parameters
	this.parameterValidationArray['apexX']['range'].setMinAndMax(-400, +400);
	this.parameterValidationArray['apexY']['range'].setMinAndMax(-400, +400);

	this.parameterValidationArray['configuration'] = {
		kind: 'other',
		type: 'string',
		list: ['Lower 1/3 light', 'Lower 1/3 dense', 'Middle 1/3 light', 'Middle 1/3 dense', 'Diffuse, light', 'Diffuse, moderate', 'Diffuse, heavy'],
		animate: false
	};

	this.handleVectorRangeArray = new Array();
	var range = new Object;
	range.length = new ED.Range(+20, +350);
	range.angle = new ED.Range(0.5 * Math.PI, 0.5 * Math.PI);
	this.handleVectorRangeArray[0] = range;
};

/**
 * Sets default parameters
 */
ED.SPEE.prototype.setParameterDefaults = function() {
	this.originX = 0;
	this.originY = 0;
	this.apexY = 370;
	this.apexX = 370;

	// Create a squiggle to store the handles points
	var squiggle = new ED.Squiggle(this, new ED.Colour(100, 100, 100, 1), 4, true);

	// Add it to squiggle array
	this.squiggleArray.push(squiggle);

	var point = new ED.Point(100, 0);
	this.addPointToSquiggle(point);
};

ED.SPEE.prototype.dependentParameterValues = function (_parameter, _value) {
	var returnArray = [];

	switch (_parameter) {
		case 'configuration':
			if (_value !== this.previousConfiguration) {

				this.originX = 0;
				this.originY = 0;
				this.apexX = 370;
				this.apexY = 370;

				switch (_value) {
					case 'Diffuse, moderate':
						this.squiggleArray[0].pointsArray[0].x = 100;
						break;
					case 'Diffuse, light':
						this.squiggleArray[0].pointsArray[0].x = 50;
						break;
					case 'Diffuse, heavy':
						this.squiggleArray[0].pointsArray[0].x = 150;
						break;
					case 'Lower 1/3 light':
						this.squiggleArray[0].pointsArray[0].x = 50;
						this.originY = 220;
						this.apexX = 300;
						this.apexY = 125;
						break;
					case 'Lower 1/3 dense':
						this.squiggleArray[0].pointsArray[0].x = 150;
						this.originY = 220;
						this.apexX = 300;
						this.apexY = 125;
						break;
					case 'Middle 1/3 light':
						this.squiggleArray[0].pointsArray[0].x = 50;
						this.apexY = 100;
						break;
					case 'Middle 1/3 dense':
						this.squiggleArray[0].pointsArray[0].x = 150;
						this.apexY = 100;
						break;
				}
				this.previousConfiguration = _value;
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
ED.SPEE.prototype.draw = function (_point) {
	// Get context
	var ctx = this.drawing.context;

	// Call draw method in superclass
	ED.SPEE.superclass.draw.call(this, _point);

	// Boundary path
	ctx.beginPath();

	// Invisible boundary
	ctx.ellipse(0, 0, Math.abs(this.apexY), Math.abs(this.apexX), 0.5 * Math.PI, 0, 2 * Math.PI);
	
	// Set line attributes  
	ctx.lineWidth = 1;
	ctx.strokeStyle = "rgba(0, 0, 0, 0)";
	ctx.fillStyle = "rgba(0,0,0,0)";

	// Draw boundary path (also hit testing)
	this.drawBoundary(_point);
	
	// Coordinates of expert handles (in canvas plane)
	this.handleArray[0].location = this.transform.transformPoint(this.squiggleArray[0].pointsArray[0]);
	
	// Non boundary paths
	if (this.drawFunctionMode == ED.drawFunctionMode.Draw) {
		// Pigment dots
		
		// Colours
		var fill = "rgba(50,205,50,1)";
		
		// Pigmentation density
		var pD = this.squiggleArray[0].pointsArray[0].x;
		
		// Radius
		var dr = 2;

		// Calculate shape area
		var A = Math.PI * Math.abs(this.apexX * this.apexY);
		
		// Calculate number of dots within boundary
		let n = Math.ceil(A / 250 * (pD / 50));
		if (n >= this.randomArray.length / 2) {
			n = Math.round(this.randomArray.length / 2);
		}

		let p = new ED.Point(0, 0);
		
		// Calculate random positions for dots			
		for (let i = 0; i < n; i++) {
			let theta = this.randomArray[i] * 2 * Math.PI;
			let r = this.randomArray[i + this.randomArray.length / 2] * 100;
			p.setWithPolars(r, theta);
			p.x *= this.apexX / 100;
			p.y *= this.apexY / 100;

			// Draw dot
			this.drawSpot(ctx, p.x, p.y, dr, fill);
		}
		
		// Additionally draw spots at boundarys to ensure indicated
		this.drawSpot(ctx, 0, Math.abs(this.apexY), dr, fill);
		this.drawSpot(ctx, 0, -1 * Math.abs(this.apexY), dr, fill);
		this.drawSpot(ctx, Math.abs(this.apexX), 0, dr, fill);
		this.drawSpot(ctx, -1 * Math.abs(this.apexX), 0, dr, fill);
	}

	this.parameterValidationArray['originX']['circularRange'] = 380 - Math.min(Math.abs(this.apexX), Math.abs(this.apexY));

	// Coordinates of handles (in canvas plane)
	this.handleArray[4].location = this.transform.transformPoint(new ED.Point(this.apexX, this.apexY));

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
ED.SPEE.prototype.groupDescription = function() {	
	return "Superficial punctate epithelial erosions";
};
