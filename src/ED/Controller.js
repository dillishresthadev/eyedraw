/**
 * Copyright (C) OpenEyes Foundation, 2011-2017
 * This file is part of OpenEyes.
 *
 * OpenEyes is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * OpenEyes is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OpenEyes.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global $:false */

/**
 * @namespace ED
 * @description Namespace for all EyeDraw classes
 */
var ED = ED || {};

/**
 * @namespace ED.Controller
 * @memberOf ED
 * @description Namespace for EyeDraw Controller
 */

ED.Controller = (function() {

	'use strict';

	/** Helpers */
	var ucFirst = ED.firstLetterToUpperCase;

	/**
	 * Controller constructor. The controller will init the various eyedraw components
	 * and manage post-init actions.
	 * @param {Object} properties The EyeDraw widget properties.
	 * @param {ED.Checker} [Checker] The EyeDraw checker.
	 * @param {ED.Drawing} [drawing] An ED.Drawing instance.
	 * @param {ED.TagCloud} [tagCloud] An ED.TagCloud instance.
	 * @param {ED.Views.Toolbar} [mainToolbar] An ED.Views.Toolbar instance.
	 * @param {ED.Views.Toolbar} [drawingToolbar] An ED.Views.Toolbar instance.
	 * @param {ED.Views.DoodlePopup} [doodlePopup] An ED.Views.DoodlePopup instance.
	 */
	function Controller(properties, Checker, drawing, tagCloud, mainToolbar, drawingToolbar, doodlePopup, selectedDoodle) {

		this.properties = properties;
		this.canvas = document.getElementById(properties.canvasId);
		this.input = document.getElementById(properties.inputId);
		this.container = $(this.canvas).closest('.ed2-widget');
		this.previousReport = '';

		this.Checker = Checker || ED.Checker;
		this.drawing = drawing || this.createDrawing();
		this.tagCloud = this.createTagCloud();

		if (this.properties.isEditable) {
			this.mainToolbar = mainToolbar || this.createMainToolbar();
			this.drawingToolbar = drawingToolbar || this.createDrawingToolbar();
			this.doodlePopup = doodlePopup || this.createDoodlePopup();
			this.selectedDoodle = selectedDoodle || this.createSelectedDoodle();

			if(this.tagCloud !== null)
			{
				this.tagCloud.isEditable = true;
			}

			this.searchBar = this.createSearchBar();
			this.bindEditEvents();
		}

		this.registerDrawing(); //Should registering take place after initListeners()
		this.registerForNotifications();
		this.initListeners();
		this.drawing.init();
	}

	/**
	 * Create the canvas drawing instance.
	 */
	Controller.prototype.createDrawing = function() {

		var options = {
			drawingName: this.properties.drawingName,
			offsetX: this.properties.offsetX,
			offsetY: this.properties.offsetY,
			toImage: this.properties.toImage,
			graphicsPath: this.properties.graphicsPath,
			scale: this.properties.scale,
			toggleScale: this.properties.toggleScale
		};

		var drawing = new ED.Drawing(
			this.canvas,
			this.properties.eye,
			this.properties.idSuffix,
			this.properties.isEditable,
			options
		);

		return drawing;
	};

	/**
	 * Create a Toolbar view instance.
	 */
	Controller.prototype.createMainToolbar = function() {

		var container = this.container.find('.ed2-main-toolbar');

		return container.length ? new ED.Views.Toolbar.Main(
			this.drawing,
			container
		) : null;
	};

	Controller.prototype.createDrawingToolbar = function() {

		var container = this.container.find('.ed2-drawing-toolbar');

		return container.length ? new ED.Views.Toolbar.Drawing(
			this.drawing,
			container
		) : null;
	};

	/**
	 * Create a DoodlePopup view instance.
	 */
	Controller.prototype.createDoodlePopup = function() {

		var container = this.container.find('.ed2-doodle-popup:first');

		var popupDoodles = this.properties.showDoodlePopupForDoodles || [];

		return container.length ? new ED.Views.DoodlePopup(
			this.drawing,
			container,
			popupDoodles
		) : null;
	};

	/**
	 * Create a SelectedDoodle instance.
	 * @return {ED.Views.SelectedDoodle} [description]
	 */
	Controller.prototype.createSelectedDoodle = function() {
		var container = this.container.find('.ed2-selected-doodle');
		return container.length ? new ED.Views.SelectedDoodle(
			this.drawing,
			container,
			this.doodlePopup
		) : null;
	};

	Controller.prototype.createTagCloud = function() {
		//TODO: do this more elegantly
		let container = this.container.find('.ed2-body').find('.ed2-no-doodle-elements');

		return container.length ?
			new ED.TagCloud(
				this.drawing,
				container,
				false,
				this.properties.side
		) : null;
	};

	Controller.prototype.createSearchBar = function() {
		if($(this.drawing.canvas).attr('id').endsWith('_side')){
			return;
		}
		var container = this.container.find('#ed2-search-doodle-input');

		return container.length ? new ED.Views.SearchBar(
			this.drawing,
			container,
			this.doodlePopup,
			this.tagCloud
		) : null;
	};

	/**
	 * Register the drawing instance with the Checker.
	 */
	Controller.prototype.registerDrawing = function() {
		this.Checker.register(this.drawing);
	};

	/**
	 * Register drawing and DOM events.
	 */
	Controller.prototype.registerForNotifications = function() {

		this.drawing.registerForNotifications(this, 'notificationHandler', [
			'ready',
			'doodlesLoaded',
			'parameterChanged',
			'doodleAdded'
		]);

		this.drawing.registerForNotifications(this, 'saveDrawingToInputField', [
			'doodleAdded',
			'doodleDeleted',
			'tagDeleted',
			'tagAdded',
			//'doodleSelected',
			//'mousedragged',
			'mouseup',
			'mouseout',
			'drawingZoom',
			'parameterChanged'
		]);
	};

	/**
	 * Bind edit related event handlers.
	 */
	Controller.prototype.bindEditEvents = function() {
		if (this.doodlePopup && this.doodlePopup instanceof ED.Views.DoodlePopup) {

			this.doodlePopup.on('show.before', function() {
				this.container.addClass('ed-state-doodle-popup-show');
			}.bind(this));

			this.doodlePopup.on('hide.after', function() {
				this.container.removeClass('ed-state-doodle-popup-show');
			}.bind(this));
		}
	};

	/**
	 * Create instances of any listener objects.
	 */
	Controller.prototype.initListeners = function() {
		if (!(this.properties.listenerArray instanceof Array)) {
			return;
		}
		// Additional listener controllers
		this.properties.listenerArray.forEach(function(ListenerArray) {
			new ListenerArray(this.drawing);
		}.bind(this));
	};

	/**
	 * Route a notification to an event handler.
	 * @param  {object} notification The notification object.
	 */
	Controller.prototype.notificationHandler = function(notification) {
		var eventName = notification.eventName;
		var handlerName = 'on' + ucFirst(eventName);
		if (this[handlerName]) {
			this[handlerName](notification);
		}
	};

	Controller.prototype.onDoodleAdded = function(notification) {
		const newDoodle = notification.object;
		// move doodle behind the give doodle
		// there is a chance that "behindClassArray" should not be an array as the newDoodle will be placed
		// behind the last doodle in the "behindClassArray" array
		for (let i = 0; i < newDoodle.behindClassArray.length; i++) {
			newDoodle.drawing.moveNextTo(newDoodle, newDoodle.behindClassArray[i], false);
		}
	};

	/**
	 * Check if the associated input field has any data.
	 * @return {Boolean}
	 */
	Controller.prototype.hasInputFieldData = function() {
		return (this.hasInputField() && this.input.value.length > 0);
	};

	/**
	 * Do we have an associated input field.
	 * @return {Boolean}
	 */
	Controller.prototype.hasInputField = function() {
		return (this.input !== null);
	};

	/**
	 * Save drawing data to the associated input field.
	 */
	Controller.prototype.saveDrawingToInputField = function() {
		if (this.hasInputField() && this.drawing.isReady) {
			this.input.value = this.drawing.save();
		}
		clearTimeout(this.saveTimer);
		this.saveTimer = setTimeout(function() {
			if (this.properties.autoReport) {
				var outputElement = document.getElementById(this.properties.autoReport);
				this.autoReport(outputElement);
			}
		}.bind(this), 200);
	};

	/**
	 * Load data from the input field into the drawing.
	 */
	Controller.prototype.loadInputFieldData = function() {
		// Load drawing data from input element
		if(this.tagCloud !== null)
		{
			this.tagCloud.loadTags(this.properties.inputId);
		}
		this.drawing.loadDoodles(this.properties.inputId);
	};

	/**
	 * Add field bindings to the drawing.
	 */
	Controller.prototype.addBindings = function() {
		if (!ED.objectIsEmpty(this.properties.bindingArray)) {
			this.drawing.addBindings(this.properties.bindingArray);
		}
	};

	/**
	 * Add deleted values.
	 */
	Controller.prototype.addDeletedValues = function() {
		if (!ED.objectIsEmpty(this.properties.deleteValueArray)) {
			this.drawing.addDeleteValues(this.properties.deleteValueArray);
		}
	};

	/**
	 * Deselect all synced doodles.
	 */
	Controller.prototype.deselectSyncedDoodles = function() {
		var arr = this.properties.syncArray;
		for (var idSuffix in arr) {
			this.getEyeDrawInstance(idSuffix).deselectDoodles();
		}
	};

	/**
	 * Run commands on the drawing once it's ready. (This is useful for
	 * adding doodles on page load, for example.)
	 */
	Controller.prototype.runOnReadyCommands = function() {
		var arr = (this.properties.onReadyCommandArray || []);
		this.runCommands(arr);

		this.drawing.onReadyCommands.push(arr);
	};

	/**
	 * Run commands once all doodles have been loaded.
	 */
	Controller.prototype.runOnDoodlesLoadedCommands = function() {
		var arr = (this.properties.onDoodlesLoadedCommandArray || []);
		this.runCommands(arr);

		if(this.mainToolbar != null) {
			this.mainToolbar.updateState();
		}
	};

	/**
	 * Run commands (with arguments) on the drawing instance.
	 * @param  {Array} arr The array of commands.
	 */
	Controller.prototype.runCommands = function(arr) {

		for (var i = 0; i < arr.length; i++) {

			var method = arr[i][0];
			var argumentArray = arr[i][1];

			// Run method with arguments
			this.drawing[method].apply(this.drawing, argumentArray);
		}
	};

	/**
	 * Find an eyedraw instance by its' idSuffix.
	 * @param  {String} idSuffix The eyedraw instance idSuffix
	 * @return {ED.Drawing}
	 */
	Controller.prototype.getEyeDrawInstance = function(idSuffix) {
		return ED.Checker.getInstanceByIdSuffix(idSuffix);
	};

	/**
	 * Sync multiple eyedraws. Essentially this will sync parameters for doodles across
	 * different eyedraw instances.
	 * @param  {Object} changedParam The paramater that was changed in the master doodle.
	 */
	Controller.prototype.syncEyedraws = function(changedParam) {

		var masterDoodle = changedParam.doodle;
		var syncArray = this.properties.syncArray;

		// Iterate through sync array
		for (var idSuffix in syncArray) {
			// Get reference to slave drawing

			var slaveDrawing = this.getEyeDrawInstance(idSuffix);

			if (!slaveDrawing) {
				ED.errorHandler('ED.Controller', 'syncEyedraws', 'Cannot sync with ' + idSuffix + ': instance not found');
				break;
			}

			// Iterate through master doodles to sync.
			for (var masterDoodleName in syncArray[idSuffix]) {

				if (!masterDoodle || masterDoodle.className !== masterDoodleName)
					continue;

				// Iterate through slave doodles to sync with master doodle.
				for (var slaveDoodleName in syncArray[idSuffix][masterDoodleName]) {

					// Get the slave doodle instance (uses first doodle in the drawing matching the className)
					var slaveDoodle = slaveDrawing.firstDoodleOfClass(slaveDoodleName);

					// Check that doodles exist, className matches, and sync is allowed
					if (!slaveDoodle && !slaveDoodle.willSync) {
						continue;
					}

					// Sync the doodle parameters.
					var parameterArray = syncArray[idSuffix][masterDoodleName][slaveDoodleName].parameters;

					this.syncDoodleParameters(parameterArray, changedParam, masterDoodle, slaveDoodle, slaveDrawing);
				}
			}

			// Refresh the slave drawing, now that the doodle parameters are synced.
			slaveDrawing.repaint();
		}
	};

	/**
	 * Sync doodle parameters across two eyedraws.
	 * @param  {Array} parameterArray The full list of parameters to sync.
	 * @param  {Object} changedParam   The parameter that was changed in the master doodle.
	 * @param  {ED.Doodle} masterDoodle   The master doodle instance.
	 * @param  {ED.Doodle} slaveDoodle    The slave doodle that will be synced.
	 * @param  {ED.Drawing} slaveDrawing  The slave drawing instance.
	 */
	Controller.prototype.syncDoodleParameters = function(parameterArray, changedParam, masterDoodle, slaveDoodle, slaveDrawing) {
		// Iterate through parameters to sync
		for (var i = 0; i < (parameterArray || []).length; i++) {

			// Check that parameter array member matches changed parameter
			if (parameterArray[i] !== changedParam.parameter) {
				continue;
			}
			// Avoid infinite loop by checking values are not equal before setting
			if (masterDoodle[changedParam.parameter] === slaveDoodle[changedParam.parameter]) {
				continue;
			}
			if (typeof(changedParam.value) == 'string') {
				slaveDoodle.setParameterFromString(changedParam.parameter, changedParam.value, true);
			}
			else {
				var increment = changedParam.value - changedParam.oldValue;
				var newValue = slaveDoodle[changedParam.parameter] + increment;

				// Sync slave parameter to value of master
				slaveDoodle.setSimpleParameter(changedParam.parameter, newValue);
				slaveDoodle.updateDependentParameters(changedParam.parameter);
			}

			// Update any bindings associated with the slave doodle
			slaveDrawing.updateBindings(slaveDoodle);
		}
	};

	/*********************
	 * EVENT HANDLERS
	 *********************/

	/**
	 * On drawing ready.
	 */
	Controller.prototype.onReady = function() {

		// If input exists and contains data, load it into the drawing.
		if (this.hasInputFieldData()) {
			this.loadInputFieldData();
			this.drawing.repaint();
		}
		// Otherwise run commands in onReadyCommand array.
		else {
			this.runOnReadyCommands();
		}

		this.addBindings();
		this.addDeletedValues();
		this.drawing.notifyZoomLevel();

		// Optionally make canvas element focused
		if (this.properties.focus) {
			this.canvas.focus();
		}

		if(this.properties.autoReport){
			var outputElement = document.getElementById(this.properties.autoReport);
			this.autoReport(outputElement, this.properties.autoReportEditable);
		}

		// Mark drawing object as ready
		this.drawing.isReady = true;

		this.saveDrawingToInputField();
	};

	/**
	 * On doodles loaded.
	 */
	Controller.prototype.onDoodlesLoaded = function() {
		this.runOnDoodlesLoadedCommands();
	};

	/**
	 * On parameter changed. This event is fired whenever anything is changed
	 * within the canvas drawing (or via a bound field element).
	 * @param  {Object} notification The notification object.
	 */
	Controller.prototype.onParameterChanged = function(notification) {
		// Sync with other doodles on the page.
		this.syncEyedraws(notification.object);
	};

	/**
	 * Automatically calls the drawings report
	 */
	Controller.prototype.autoReport = function(outputElement, editable) {
		var reportData = this.drawing.reportData();
		var report = '';
		if(reportData.length){

			report = reportData.join('\n');

			var output = '';

			if (!editable) {
				outputElement.value = report;
				return;
			}
			var existing = outputElement.value;

			var reportRegex = String(report).replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");

			if(existing.match(reportRegex)){
				outputElement.rows = (existing.match(/\n/g) || []).length + 1;
				this.previousReport = report;
				return;
			}

			if(this.previousReport){
				output = existing.replace(this.previousReport, report);
			} else {
				if(existing.length && !existing.match(/^[\n ]$/)){
					existing += "\n";
				}
				output = existing + report;
			}
			outputElement.value = output;
			outputElement.rows = (output.match(/\n/g) || []).length + 1;
			this.previousReport = report;
		} else {
			outputElement.value = 'No abnormality';
		}

		function regex_escape(str){
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
		}
	};

	return Controller;
}());
