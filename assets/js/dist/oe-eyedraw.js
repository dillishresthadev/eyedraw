/**
 * Javascript file containing functions for the EyeDraw widget
 *
 * @link http://www.openeyes.org.uk/
 * @copyright Copyright &copy; 2012 OpenEyes Foundation
 * @license http://www.yiiframework.com/license/
 * Modification date: 17th August 2012
 *
 * This file is part of OpenEyes.
 *
 * OpenEyes is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * OpenEyes is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; with§§§out even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OpenEyes.  If not, see <http://www.gnu.org/licenses/>.
 * @package EyeDraw
 * @author Bill Aylward <bill.aylward@openeyes.org>
 * @version 0.95
 */


/**
 * Defines the EyeDraw namespace
 * @namespace ED
 * @description Namespace for all EyeDraw classes
 */
var ED = ED || {};

ED.init = (function() {

	'use strict';

	/**
	 * In some scenarios, we load the eyedraw markup (including all dependent
	 * scripts and stylesheets) via AJAX, and then insert the markup into the DOM. This
	 * causes the scripts to be loaded synchronously, and the stylesheet to be
	 * loaded asynchronously. Some of the eyedraw script relies on the existance of
	 * certain CSS rules, thus we have to ensure the styles are loaded before initiating
	 * the eyedraw.
	 * @param  {String}   fileName  The string to match the filename of the stylesheet.
	 * @param  {Number}   maxTime   The max amount of time to check for existence of stylesheet (ms).
	 * @param  {Function} done      Callback function.
	 */
	function waitForStyleSheet(fileName, maxTime, done, startTime) {

		if (!startTime) {
			startTime = (new Date()).getTime();
		}
		if (((new Date()).getTime() - startTime) >= maxTime) {
			return ED.errorHandler('OEEyeDraw.js', 'waitForStyleSheet', 'Unable to init eyedraw, stylesheet is not loaded.');
		}

		var styleSheets = window.document.styleSheets;
		var i = 0;
		var j = styleSheets.length;

		for(; i < j; i++) {
			var sheet = styleSheets[i];
			if (sheet.href && sheet.href.indexOf(fileName) >= 0) {
				return done();
			}
		}
		window.setTimeout(
			waitForStyleSheet.bind(null, fileName, maxTime, done, startTime), 100);
	}

	/**
	 * Public init method: Initialise an EyeDraw widget.
	 *
	 * @param {object} properties Object of properties passed from widget
	 *     @property drawingName The EyeDraw drawing object
	 *     @property canvasId The DOM id of the associated canvas element
	 *     @property eye The eye (right = 0, left = 1) ***TODO*** handle this better
	 *     @property idSuffix A suffix for DOM elements to distinguish those associated with this drawing object
	 *     @property isEditable Flag indicating whether drawing object is editable or not
	 *     @property graphicsPath Path to folder containing EyeDraw graphics
	 *     @property onReadyCommandArray Array of commands and arguments to be run when images are loaded
	 */
	return function init(properties, done) {
		done = $.isFunction(done) ? done : $.noop;
		done(new ED.Controller(properties));
	};
}());
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

/**
 * @namespace ED
 * @description Namespace for all EyeDraw classes
 */
var ED = ED || {};

/**
 * ED.Checker is used to track when eyedraws are "ready" and execute callbacks
 * when ready. An eyedraw is ready when all doodles have been loaded.
 * @namespace ED.Checker
 * @memberOf ED
 */
ED.Checker = ED.Checker || (function() {

	'use strict';

	var callbacks = [];
	var ids = [];
	var readyIds = [];
	var instances = {};

	function registerCanvasEyeDraws() {
		$('canvas').each(function() {
			var canvas = $(this);
			var id = this.id;
			// Is it an eyedraw canvas?
			if (canvas.hasClass('ed-canvas-edit') || canvas.hasClass('ed-canvas-display')) {
				storeCanvasId(id);
			}
		});
	}
	$(registerCanvasEyeDraws);

	function storeCanvasId(id) {
    if (ids.indexOf(id) === -1) {
      ids.push(id);
    }
	}

	function removeCanvasId(id) {
		var idx = ids.indexOf(id);
		if (idx > -1) {
			ids.splice(idx, 1);
		}
		idx = readyIds.indexOf(id);
		if (idx > -1) {
      readyIds.splice(idx, 1);
		}
	}

	/**
	 * Loop through all the registered callbacks and execute them.
	 */
	function executeCallbacks(){
		callbacks.forEach(function(callback) {
			callback();
		});
		callbacks = [];
	}

	/**
	 * Register a Drawing instance.
	 * @param  {ED.Drawing}   instance A ED.Drawing instance.
	 */
	function register(instance) {
		// Store instance
		instances[instance.drawingName] = instance;
		storeCanvasId(instance.canvas.id);

		// Register 'doodlesLoaded' event
		instance.registerForNotifications({
			callback: function drawingReady() {
        var id = instance.canvas.id;
				if (readyIds.indexOf(id) === -1) {
					readyIds.push(id);
				}

				if (isAllReady()) {
					executeCallbacks();
				}
			}
		}, 'callback', ['ready']);
	}

	/**
	 * Check if all registered EyeDraws are ready.
	 * @return {Boolean}
	 */
	function isAllReady() {
		return (ids.length === readyIds.length);
	}

	/**
	 * Register a callback to be executed once all EyeDraws are ready.
	 * @param  {Function} callback The callback to be executed.
	 */
	function allReady(callback) {
		if (isAllReady()) {
			callback();
		} else {
			callbacks.push(callback);
		}
	}

	/**
	 * Returns an eyedraw instance by drawing name.
	 * @param {String} drawingName The eyedraw drawing name
	 * @return {ED.Drawing} An eyedraw instance.
	 */
	function getInstance(drawingName) {
		return instances[drawingName];
	}

	/**
	 * Returns an eyedraw instance by idSuffix.
	 * @param {String} idSuffix The idSuffix of the eyedraw instance.
	 * @return {ED.Drawing} An eyedraw instance.
	 */
	function getInstanceByIdSuffix(idSuffix) {
		return Object.keys(instances).filter(function(key) {
			return instances[key].idSuffix === idSuffix;
		}).map(function(key) {
			return instances[key];
		})[0];
	}

	/**
	 * Resets all eyedraw instances and registered callback functions.
	 */
	function reset() {
		instances = {};
		callbacks = [];
		ids = [];
	}

	function getInternalState()
	{
		return [ids, readyIds];
	}

	function removeMissingCanvasIds()
	{
		$(ids).each(function(idx, id) {
			if (!$('#' + id).length) {
				removeCanvasId(id);
			}
		})
	}

	/**
	 * Get eyedraw instance by drawingName.
	 */
	ED.getInstance = getInstance;

	/**
	 * Public API
	 */
	return {
		register: register,
		onAllReady: allReady,
		isReady: isAllReady,
		getInstance: getInstance,
		getInstanceByIdSuffix: getInstanceByIdSuffix,
		reset: reset,
		resync: removeMissingCanvasIds,
		inspect: getInternalState,
		storeCanvasId: storeCanvasId,

		/** BACKWARDS COMPATABILITY **/
		registerForReady: allReady
	};
}());

/** BACKWARDS COMPATABILITY **/
window.getOEEyeDrawChecker = function() {
	return ED.Checker;
};

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

var ED = ED || {};

/**
* @property Tag[]
* @property Drawing
* @property isEditable Boolean
*/
ED.TagCloud = (function() {
	'use strict';

	function TagCloud(drawing, container, isEditable, side) {
		this.drawing = drawing;
		this.container = container;
		this.TagArray = [];
		this.isEditable = isEditable;
		this.side = side;
	}

	TagCloud.prototype.constructor = TagCloud;

	TagCloud.prototype.loadTags = function(_id) {

		// Get element containing JSON string
		var sourceElement = document.getElementById(_id);

		// If it exists and contains something, load it
		if (sourceElement && sourceElement.value.length > 0) {
			var tagSet = window.JSON.parse(sourceElement.value);

			//remove tags from doodle loading
			tagSet = tagSet.filter(tag => tag.hasOwnProperty('tags'));

			if(tagSet[0] !== undefined)
			{
				let tagList = tagSet[0].tags;

				tagList.forEach(tag => {
					let tagObject = JSON.parse(tag);
					this.AddTag(tagObject.pk_id, tagObject.text, tagObject.snomed_code);
				});
			}
		}
	};

	TagCloud.prototype.AddTag = function(pk_id, text, snomed_code) {
		//Add tag to array
		let tag = document.createElement('li');
		$(tag).addClass('ed-tag');
		$(tag).attr('pk_id', pk_id);
		$(tag).attr('snomed_code', snomed_code);

		let textSpan = document.createElement('span');
		$(textSpan).addClass('text');
		$(textSpan).text(text);
		$(tag).append(textSpan);

		if(this.isEditable)
		{
			let parentCloud = this;

			let buttonSpan = document.createElement('span');
			$(buttonSpan).addClass('multi-select-remove remove-one 5');

			let button = document.createElement('i');
			$(button).addClass('oe-i remove-circle small');
			$(button).click(function() {
				$(tag).remove();
				parentCloud.RemoveTagByText(text);
			});

			$(buttonSpan).append(button);
			$(tag).append(buttonSpan);
		}

		this.TagArray.push({pk_id: pk_id, text: text, snomed_code: snomed_code});
		let list = this.container.find('.no-doodles');

		list.append(tag);
	};

	TagCloud.prototype.RemoveTagByText = function(text) {
		//Remove the tag from the array
		_.remove(this.TagArray, function(item) {
				return text === item.text;
		});

		this.drawing.notify('tagDeleted', text);
	};

	return TagCloud;
}());
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

/* global EventEmitter2: false, $: false */

/**
 * @namespace ED
 * @description Namespace for all EyeDraw classes
 */
var ED = ED || {};

/**
 * Base view.
 * @namespace ED.View
 * @memberOf ED
 */
ED.View = (function() {

	'use strict';

	/** Helpers */
	var ucFirst = ED.firstLetterToUpperCase;

	/**
	 * View constructor
	 * @param {ED.Drawing} drawing   A doodle drawing instance.
	 * @param {HTMLElement|jQuery} widgetContainer The widget container element
	 * @extends {EventEmitter2}
	 */
	function View(drawing, container) {
		EventEmitter2.call(this);
		this.delayTimer = 0;
	}

	View.prototype = Object.create(EventEmitter2.prototype);
	View.prototype.constructor = View;

	/**
	 * This notification handler will simply route events to handlers.
	 * @param  {Object} notification The notification object.
	 */
	View.prototype.notificationHandler = function(notification) {
		var eventName = notification.eventName;
		var handlerName = 'on' + ucFirst(eventName);
		if (!this[handlerName]) {
			console.error('No handler defined for event:', handlerName);
		}
		this[handlerName](notification);
	};

	/**
	 * Delay executing a callback.
	 * @param  {Function} fn    The callback function to execute.
	 * @param {Integer} amount The delay time (in ms)
	 */
	View.prototype.delay = function(fn, amount) {
		clearTimeout(this.delayTimer);
		amount = typeof amount === 'number' ? amount : 50;
		this.delayTimer = setTimeout(fn, amount);
	};

	return View;
}());

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

/* global $: false, Mustache: false, ED: true */

/**
 * @namespace ED
 * @description Namespace for all EyeDraw classes
 */
var ED = ED || {};
ED.Views = ED.Views || {};

/**
 * This view class manages the doodle popup.
 */
ED.Views.DoodlePopup = (function() {

	'use strict';

	/**
	 * The amount of time (in ms) for the animation to complete. This should match
	 * the animation time set in CSS.
	 * @type {Number}
	 */
	var animateTime = 0;

	/**
	 * DoodlePopup constructor
	 * @param {ED.Drawing} drawing   A doodle drawing instance.
	 * @param {HTMLElement} widgetContainer The widget container element
	 * @extends {ED.View}
	 */
	function DoodlePopup(drawing, container, popupDoodles) {
		ED.View.apply(this, arguments);

		// don't want to be checking against an empty array
		if (popupDoodles !== undefined && !popupDoodles.length) {
			popupDoodles = undefined;
		}

		this.drawing = drawing;
		this.container = container;
		this.containerWidth = container.outerWidth();
		this.popupDoodles = popupDoodles;


		if ($(this.container).data('display-side')) {
			this.side = $(this.container).data('display-side');
		}
		else {
			this.side = 'right';
		}

		this.registerForNotifications();
		this.createToolbar();
		this.createHelpButton();
		this.createTemplate();
	}

	DoodlePopup.prototype = Object.create(ED.View.prototype);
	DoodlePopup.prototype.constructor = DoodlePopup;

	/**
	 * Create the manipulation toolbar.
	 */
	DoodlePopup.prototype.createToolbar = function() {
		this.toolbar = new ED.Views.Toolbar(this.drawing, this.container);
		this.toolbar.on('button.action', this.render.bind(this));
	};

	/**
	 * Create the help button.
	 */
	DoodlePopup.prototype.createHelpButton = function() {
		this.helpButton = new ED.Views.DoodlePopup.Help(this);
	};

	/**
	 * Create the template for the popup.
	 */
	DoodlePopup.prototype.createTemplate = function() {
		this.template = ED.scriptTemplates['doodle-popup'];
	};

	/**
	 * Register for drawing notifications and bind interaction events.
	 */
	DoodlePopup.prototype.registerForNotifications = function() {
		this.drawing.registerForNotifications(this, 'notificationHandler', [
			'doodleAdded',
			'doodleDeleted',
			'doodleSelected',
			'doodleDeselected'
		]);
	};

	/**
	 * Compile the mustache template.
	 * @param  {Object} data Template data.
	 */
	DoodlePopup.prototype.render = function() {

		var doodle = this.drawing.selectedDoodle;

		// In some cases we won't have a selected doodle (like when deleting a doodle)
		if (!doodle) {
			return;
		}
		
		// Template data
		var data = {
			doodle: doodle,
			drawing: this.drawing,
			title: ED.titles[doodle.className],
			desc: ED.trans[doodle.className],
			lockedButtonClass: doodle.isLocked ? ' disabled' : '',
		};

		// Render the template
		var html = Mustache.render(this.template, data);

		// Forced GC. Remove data & event handlers from all child nodes.
		// Both will clear out the element content however empty() is faster. html('') is a fallback for the removeChild() error that shows when jquery tries to access an element that no longer exists
		try {
			this.container.empty();
		} catch(e) {
			this.container.html('');
		}

		// Now we can safely replace the html.
		this.container.html(html);

		// Add doodle controls
		doodle.showDoodleControls();

		this.emit('render');
	};

	/**
	 * Update the menu content with the specific doodle and either show or hide it.
	 * @param  {Boolean} show   Show or hide the menu.
	 */
	DoodlePopup.prototype.update = function(show) {
		var shouldDisplayForDoodle = true;
		if (this.popupDoodles && this.drawing.selectedDoodle && this.popupDoodles.indexOf(this.drawing.selectedDoodle.className) == -1) {
			shouldDisplayForDoodle = false;
		}
		if (show && this.drawing.selectedDoodle && shouldDisplayForDoodle) {
			this.render();
			this.show();
		} else {
			this.hide();
		}
	};

	/**
	 * Hide the menu.
	 */
	DoodlePopup.prototype.hide = function() {
		this.delay(function() {

			this.emit('hide.before');

			this.container.addClass('closed');
			this.emit('hide.after');
			var css = {};
			css[this.side] = 0;
			this.container.css(css);
		}.bind(this));
	};

	/**
	 * Show the menu.
	 */
	DoodlePopup.prototype.show = function() {
		this.delay(function() {

			this.emit('show.before');

			if (this.side == 'left') {
				this.container.css({
					left: -1 * (this.containerWidth - 2)
				}).find('.ed-button .label').addClass('left');
				;
			} else {
				this.container.css({
					right: -1 * (this.containerWidth - 1)
				}).find('.ed-button .label').addClass('right');
			}
			this.container.removeClass('closed');

			this.emit('show.after');

		}.bind(this));
	};

	/*********************
	 * EVENT HANDLERS
	 *********************/

	DoodlePopup.prototype.onDoodleAdded = function() {
		this.drawing.selectDoodle(this.drawing.selectedDoodle);
	};

	DoodlePopup.prototype.onDoodleDeleted = function() {
		this.update(false);
	};

	DoodlePopup.prototype.onDoodleSelected = function() {
		this.update(true);
	};

	DoodlePopup.prototype.onDoodleDeselected = function() {

		// When clicking on the drawing canvas to select a doodle, the "doodleDeselect"
		// event is fired after the "doodleSelect" event. This causes the popup to
		// be hidden, when we want it open. We thus need to check if the selectDoodle
		// is set, and if so, don't hide.
		var hasSelectedDoodle = !!this.drawing.selectedDoodle;

		if (!hasSelectedDoodle) {
			this.update(false);
		}
	};

	return DoodlePopup;
}());

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

/* global ED: true */

/**
 * @namespace ED
 * @description Namespace for all EyeDraw classes
 */
var ED = ED || {};
ED.Views = ED.Views || {};

/**
 * This view class manages the display of the doodle help text within the doodle popup.
 */
ED.Views.DoodlePopup.Help = (function() {

	'use strict';

	/**
	 * Helpers
	 */

	function ifHelpButton(fn) {
		return function(data) {
			return (
				// If it's the help button and it's not disabled then execute fn.
				data.button.hasClass('ed2-doodle-help') &&
				!data.button.hasClass('disabled') &&
				fn(data)
			);
		};
	}

	/**
	 * DoodleHelp class
	 * @param {ED.Views.DoodlePopup} doodlePopup The doodle popup view.
	 */
	function DoodleHelp(doodlePopup) {
		this.doodlePopup = doodlePopup;
		this.locked = false;
		this.delayTimer = 0;
		this.bindEvents();
	}

	/**
	 * Bind event handlers
	 */
	DoodleHelp.prototype.bindEvents = function() {

		var doodlePopup = this.doodlePopup;
		doodlePopup.on('render', this.onDoodlePopupRender.bind(this));
		doodlePopup.on('hide', this.onDoodlePopupHide.bind(this));

		var toolbar = doodlePopup.toolbar;
		toolbar.on('button.mouseenter', ifHelpButton(this.onButtonMouseEnter.bind(this)));
		toolbar.on('button.mouseleave', ifHelpButton(this.onButtonMouseLeave.bind(this)));
		toolbar.on('button.action', ifHelpButton(this.onButtonMouseClick.bind(this)));
	};

	/**
	 * Show the help text.
	 */
	DoodleHelp.prototype.showDescription = function() {
		clearTimeout(this.delayTimer);
		this.button.addClass('hover');
		this.doodleInfo.show();
		this.doodleControls.hide();
	};

	/**
	 * Hide the help text.
	 */
	DoodleHelp.prototype.hideDescription = function() {
		clearTimeout(this.delayTimer);
		this.button.removeClass('hover');
		this.doodleInfo.hide();
		this.doodleControls.show();
	};

	/**
	 * EVENT HANDLERS
	 */

	/**
	 * Store reference to elements whenever the doodlePopup view is re-rendered.
	 */
	DoodleHelp.prototype.onDoodlePopupRender = function() {
		this.doodleInfo = this.doodlePopup.container.find('.ed2-doodle-info');
		this.doodleControls = this.doodlePopup.container.find('.ed2-doodle-controls');
		this.button = this.doodlePopup.toolbar.container.find('.ed2-doodle-help');
	};

	/**
	 * Unlock the help whenever the doodle popup is hidden.
	 */
	DoodleHelp.prototype.onDoodlePopupHide = function() {
		this.locked = false;
	};

	/**
	 * On button mouse enter. Delay showing the help text.
	 * @param  {Object} data Event data.
	 */
	DoodleHelp.prototype.onButtonMouseEnter = function() {
		this.delayTimer = setTimeout(this.showDescription.bind(this), 300);
	};

	/**
	 * On button mouse leave, hide the help text if not locked.
	 * @param  {Object} data The event data.
	 */
	DoodleHelp.prototype.onButtonMouseLeave = function() {
		if (!this.locked) {
			this.hideDescription();
		}
	};

	/**
	 * On button mouse click, show or hide the help text.
	 * @param  {Object} data The event data.
	 */
	DoodleHelp.prototype.onButtonMouseClick = function() {
		if (this.locked) {
			this.hideDescription();
		} else {
			this.showDescription();
		}
		this.locked = !this.locked;
	};

	return DoodleHelp;

}());
var ED = ED || {};
ED.Views = ED.Views || {};

ED.Views.SearchBar = (function () {
	var tb;

	function SearchBar(drawing, container, doodlePopup, tagCloud) {
		tb = new ED.Views.Toolbar(drawing, container)
		ED.View.apply(this, arguments);

		this.drawing = drawing;
		this.container = container;
		this.tagCloud = tagCloud;
		this.input = this.container[0];
		this.doodlePopup = doodlePopup;
		this.searchRequest = null;

		that = this;

		this.bindEvents();
	}

	SearchBar.prototype = Object.create(ED.View.prototype);

	SearchBar.prototype.constructor = SearchBar;

	function createListItem(text, icon, callback) {
		let item = $(document.createElement('li'));

		var aTag = $(document.createElement('a'));
		aTag.html("");
		aTag.addClass('add-ed-doodle');

		var txtSpan = document.createElement('span');
		txtSpan.innerText = text;

		aTag.append(txtSpan);
		aTag.append(icon);

		aTag.off('click').on('click', callback);

		item.append(aTag);

		return item;
	};

	SearchBar.prototype.bindEvents = function () {
		tb.bindEvents()
		var that = this;
		var searchResult = this.container.siblings();
		searchResult.addClass('oe-autocomplete');

		var searchTimer = null;

		var toolbar = this.getToolbar();
		$(this.input).off('keyup').on('keyup', function () {
			if(searchTimer){
				searchTimer = null;
			}

			let input = this;

			searchTimer = setTimeout(function() {
				searchResult.empty();

				if (input.value.length <= 0) {
					searchResult.hide();
					searchResult.html("");
				} else {
					searchResult.show();

					let targetCloud = that.tagCloud;

					if(that.searchRequest !== null){
						that.searchRequest.abort();
					}

					that.searchRequest = $.getJSON("/OphCiExamination/Default/EDTagSearch", {
						YII_CSRF_TOKEN: YII_CSRF_TOKEN,
						EDSearchTerm: input.value,
					}, function (resp) {
						resp.forEach(function (item, index) {
							searchResult.append(
								createListItem(
									item['text'],
									$(document.createElement('span')),
									function () {
										targetCloud.AddTag(item['pk_id'], item['text'], item['snomed_code']);
										that.drawing.notify('tagAdded', item['text']);
										searchResult.empty();
										searchResult.hide();
										$(that.input).val("");
									}));
						});
					});

					var searchList = toolbar.filter((item, index) => {
						var txt = $(item).find('span.label').text().toLowerCase();
						return txt.includes(input.value.toLowerCase());
					});

					searchList.forEach(item => {
						let txt = $(item).find('span.label').text();
						let arg = $(item).find('a').data('arg');
						let icon = $(document.createElement('span')).addClass('icon-ed-' + arg);

						searchResult.append(
							createListItem(
								txt,
								icon,
								function () {
									that.drawing["addDoodle"](arg);
									searchResult.empty();
									searchResult.hide();
									$(that.input).val("");
								}));
					});
				}
			}, 500);
		}
		);
	};
	SearchBar.prototype.getToolbar = function () {
		var toolbar = [];

		this.container.prevObject.find('.ed2-toolbar ul li').each((index, item) => {
			var inner_ul = item.getElementsByTagName('ul')
			if (inner_ul.length <= 0) {
				toolbar.push(item);
			}
		});
		return toolbar;
	};
	return SearchBar;
}());

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

/* global $: false, ED: true */

/**
 * @namespace ED
 * @description Namespace for all EyeDraw classes
 */
var ED = ED || {};
ED.Views = ED.Views || {};

/**
 * This view class manages the selected doodle dropdown.
 */
ED.Views.SelectedDoodle = (function() {

	'use strict';

	/** Constants **/
	var EVENT_NAMESPACE = 'eyedraw.selected-doodle';

	/**
	 * SelectedDoodle constructor
	 * @param {ED.Drawing} drawing   A doodle drawing instance.
	 * @param {HTMLElement} container The widget container element
	 * @extends {ED.View}
	 */
	function SelectedDoodle(drawing, container, doodlePopup) {
		ED.View.apply(this, arguments);
		this.drawing = drawing;
		this.container = container;
		this.select = this.container.find('select');
		this.doodlePopup = doodlePopup;

		this.registerForNotifications();
		this.bindEvents();
	}

	SelectedDoodle.prototype = Object.create(ED.View.prototype);
	SelectedDoodle.prototype.constructor = SelectedDoodle;

	/**
	 * Register a ED.Drawing notification handler. For each event, re-render the view.
	 */
	SelectedDoodle.prototype.registerForNotifications = function() {

		this.drawing.registerForNotifications(this, 'render', [
			'ready',
			'doodleAdded',
			'doodleDeleted',
			'doodleSelected',
			'doodleDeselected',
			'doodlesLoaded',
			'moveToFront',
			'moveToBack',
			'doodleLocked',
			'doodleUnlocked'
		]);
	};

	/**
	 * Bind UI events
	 */
	SelectedDoodle.prototype.bindEvents = function() {
		this.select.on('change.' + EVENT_NAMESPACE, this.onSelectChange.bind(this));
	};

	/**
	 * Render the select element.
	 */
	SelectedDoodle.prototype.render = function() {

		var optgroup = $('<optgroup label="Selected doodle" />');

		// "None" option
		var noneText = 'None';
		var noneSelected = (this.drawing.selectedDoodle === null);
		optgroup.append(this.createOption(noneText, noneSelected));

		// Doodle options
		var doodles = this.drawing.doodleArray.slice(); // break reference
		doodles.reverse();

		var doodleOptions = doodles.map(this.createDoodleOption.bind(this));
		optgroup.append(doodleOptions);

		// Update the select dropdown.
		this.select.html(optgroup);
	};

	/**
	 * Create a jQuery instance for an <option> element.
	 * @param  {String} text     The <option> text.
	 * @param  {Boolean} selected Is the option selected?
	 * @return {jQuery}          The jQuery instance.
	 */
	SelectedDoodle.prototype.createOption = function(text, selected) {
		return $('<option />', {
			text: text,
			selected: selected
		});
	};

	/**
	 * Create an doodle jQuery option element.
	 * @param  {ED.Doodle} doodle
	 * @return {jQuery} The jQuery instance.
	 */
	SelectedDoodle.prototype.createDoodleOption = function(doodle) {

		if (!doodle.isSelectable)
			return $('');

		var text = ED.titles[doodle.className] || doodle.className;
		var selected = (doodle === this.drawing.selectedDoodle);

		// Find matching doodles, in order of created time.
		var doodles = this.drawing.doodleArray.filter(function(d) {
			return (d.className === doodle.className);
		}).sort(function(a, b) {
			return (a.createdTime - b.createdTime);
		});

		if (doodles.length > 1) {
			// Find the index of this doodle within the set of matching doodles.
			var index = doodles.indexOf(doodle);
			text += ' (' + (index + 1) + ')';
		}

		if (doodle.isLocked) {
			text += ' (*)';
		}

		var option = this.createOption(text, selected);

		// Store the doodle reference
		option.data('doodle', doodle);

		return option;
	};

	/*********************
	 * EVENT HANDLERS
	 *********************/

	/**
	 * Select a doodle or de-select all doodles (when selecting "none")
	 * @param  {Object} e DOM event object.
	 */
	SelectedDoodle.prototype.onSelectChange = function(e) {
		var doodle = $(e.target).find(':selected').data('doodle');
		if (!doodle) {
			this.drawing.deselectDoodles();
		} else {
			this.drawing.selectDoodle(doodle);
		}
	};

	return SelectedDoodle;
}());
/*! Generated on 9/10/2023 */
ED.scriptTemplates = {
  "doodle-popup": "\n\n{{#doodle}}\n{{^doodle.isNode}}\n\t<ul class=\"ed2-toolbar-panel ed2-doodle-popup-toolbar\">\n\t\t<li>\n\t\t\t{{#desc}}\n\t\t\t\t<a class=\"ed-button ed2-doodle-help{{lockedButtonClass}}\" href=\"#\" data-function=\"toggleHelp\">\n\t\t\t\t\t<i class=\"ed-i icon-ed-help\"></i>\n\t\t\t\t</a>\n\t\t\t{{/desc}}\n\t\t</li>\n\t\t{{#doodle.isLocked}}\n\t\t\t<li>\n\t\t\t\t<a class=\"ed-button\" href=\"#\" data-function=\"unlock\">\n\t\t\t\t\t<i class=\"ed-i icon-ed-unlock\"></i>\n\t\t\t\t\t<span class=\"label\">Unlock</span>\n\t\t\t\t</a>\n\t\t\t</li>\n\t\t{{/doodle.isLocked}}\n\t\t{{^doodle.isLocked}}\n\t\t\t<li>\n\t\t\t\t<a class=\"ed-button\" href=\"#\" data-function=\"lock\">\n\t\t\t\t\t<i class=\"ed-i icon-ed-lock\"></i>\n\t\t\t\t\t<span class=\"label\">Lock</span>\n\t\t\t\t</a>\n\t\t\t</li>\n\t\t{{/doodle.isLocked}}\n\t\t<li>\n\t\t\t<a class=\"ed-button{{lockedButtonClass}}\" href=\"#\" data-function=\"moveToBack\">\n\t\t\t\t<i class=\"ed-i icon-ed-move-to-back\"></i>\n\t\t\t\t<span class=\"label\">Move to back</span>\n\t\t\t</a>\n\t\t</li>\n\t\t<li>\n\t\t\t<a class=\"ed-button{{lockedButtonClass}}\" href=\"#\" data-function=\"moveToFront\">\n\t\t\t\t<i class=\"ed-i icon-ed-move-to-front\"></i>\n\t\t\t\t<span class=\"label\">Move to front</span>\n\t\t\t</a>\n\t\t</li>\n\t\t<li>\n\t\t\t{{#doodle.isDeletable}}\n\t\t\t\t<a class=\"ed-button{{lockedButtonClass}}\" href=\"#\" data-function=\"deleteSelectedDoodle\">\n\t\t\t\t\t<i class=\"ed-i icon-ed-delete\"></i>\n\t\t\t\t\t<span class=\"label\">Delete</span>\n\t\t\t\t</a>\n\t\t\t{{/doodle.isDeletable}}\n\t\t</li>\n\t</ul>\n\t<div class=\"ed2-doodle-info\" style=\"display: none;\">\n\t\t{{^doodle.isLocked}}\n\t\t\t{{#desc}}\n\t\t\t\t<div class=\"ed2-doodle-description\">{{{desc}}}</div>\n\t\t\t{{/desc}}\n\t\t{{/doodle.isLocked}}\n\t</div>\n\t<div class=\"ed2-doodle-controls\" {{#doodle.isLocked}}style=\"display: none;\"{{/doodle.isLocked}} id=\"{{drawing.canvas.id}}_controls\">\n\t</div>\n\t{{/doodle.isNode}}\n\t{{#doodle.isLocked}}\n\t\t<div class=\"ed2-doodle-description\">\n\t\t\t<strong>This doodle is locked and cannot be edited.</strong>\n\t\t</div>\n\t{{/doodle.isLocked}}\n{{/doodle}}"
};
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

/* global $: false */

/**
 * @namespace ED
 * @description Namespace for all EyeDraw classes
 */
var ED = ED || {};
ED.Views = ED.Views || {};

/**
 * This view class manages the toolbar.
 */
ED.Views.Toolbar = (function() {

	'use strict';

	/** Constants **/
	var EVENT_NAMESPACE = 'eyedraw.toolbar';

	/**
	 * Toolbar constructor
	 * @param {ED.Drawing} drawing   A doodle drawing instance.
	 * @param {HTMLElement} container The widget container element
	 * @extends {ED.View}
	 */
	function Toolbar(drawing, container) {
		ED.View.apply(this, arguments);

		this.drawing = drawing;
		this.container = $(container);
		this.buttons = this.container.find('.ed-button');

		this.registerForNotifications();
		this.bindEvents();
	}

	Toolbar.prototype = Object.create(ED.View.prototype);
	Toolbar.prototype.constructor = Toolbar;

	/**
	 * Register a ED.Drawing notification handler. For each event, update
	 * the toolbar state.
	 */
	Toolbar.prototype.registerForNotifications = function() {
		this.drawing.registerForNotifications(this, 'updateState', [
			'doodleAdded',
			'doodleDeleted',
		]);
	};

	/**
	 * Bind UI events.
	 */
	Toolbar.prototype.bindEvents = function() {

		$(document).click(this.hideDrawers.bind(this));

		this.container
		.on('click.' + EVENT_NAMESPACE, '.ed-button-more', this.onMoreButtonClick.bind(this))
		.on('click.' + EVENT_NAMESPACE, '.ed-button', this.onButtonClick.bind(this))
		.on('mouseenter.' + EVENT_NAMESPACE, '.ed-button', this.onButtonMouseEnter.bind(this))
		.on('mouseleave.' + EVENT_NAMESPACE, '.ed-button', this.onButtonMouseLeave.bind(this))
	};

	Toolbar.prototype.enableButton = function(button) {
		button.attr('disabled', false).removeClass('disabled');
	};

	Toolbar.prototype.disableButton = function(button) {
		button.attr('disabled', true).addClass('disabled');
	};

	/**
	 * Update the state of a toolbar button. Find the associated doodle
	 * and determine if the button should be enabled or disabled.
	 * @param  {jQuery} button A jQuery button instance
	 */
	Toolbar.prototype.updateButtonState = function(button) {

		this.enableButton(button);

		var func = button.data('function');
		var arg = button.data('arg');

		// Only update the states for "add doodle" buttons.
		if (func !== 'addDoodle') {
			return;
		}

		var doodle = this.drawing.doodleArray.filter(function(doodle) {
			return (doodle.className === arg);
		})[0];

		if (doodle && doodle.isUnique) {
			this.disableButton(button);
		}
	};

	/**
	 * Update the state of all toolbar buttons.
	 */
	Toolbar.prototype.updateState  = function() {
		this.buttons.each(function(i, button) {
			this.updateButtonState($(button));
		}.bind(this));
	};

	/**
	 * Execute the button function.
	 * @param  {jQuery} button The button jQuery instance.
	 */
	Toolbar.prototype.execButtonFunction = function(button) {

		if (button.hasClass('disabled')) {
			return;
		}

		var fn = button.data('function');
		var arg = button.data('arg');

		if (fn && typeof this.drawing[fn] === 'function') {
			this.drawing[fn](arg);
		} else {
			this.emit('button.error', 'Invalid doodle function: ' + fn);
		}

		this.emit('button.action', {
			fn: fn,
			arg: arg,
			button: button
		});
	};

	Toolbar.prototype.hideDrawers = function() {
		var openDrawers = this.container.find('.ed2-drawer-open');
		openDrawers.removeClass('ed2-drawer-open');
	}

	/*********************
	 * EVENT HANDLERS
	 *********************/

	/**
	 * Run an action when clicking on a toolbar button.
	 * @param  {Object} e Event object.
	 */
	Toolbar.prototype.onButtonClick = function(e) {
		e.preventDefault();
		e.stopImmediatePropagation();

		this.hideDrawers();

		var button = $(e.currentTarget);
		this.execButtonFunction(button);
	};

	/**
	 * Show the hidden toolbar when clicking on a more button.
	 * @param  {Object} e Event object.
	 */
	Toolbar.prototype.onMoreButtonClick = function(e) {
		e.preventDefault();
		e.stopImmediatePropagation();

		this.hideDrawers();

		var button = $(e.currentTarget);
		button.closest('li').addClass('ed2-drawer-open');
	};

	/**
	 * Emit mouseenter event on button mouse enter
	 * @param  {Object} e Event object.
	 */
	Toolbar.prototype.onButtonMouseEnter = function(e) {
		this.emit('button.mouseenter', {
			button: $(e.currentTarget)
		});
	};

	/**
	 * Emit mouseleave event on button mouse leave.
	 * @param  {Object} e Event object.
	 */
	Toolbar.prototype.onButtonMouseLeave = function(e) {
		this.emit('button.mouseleave', {
			button: $(e.currentTarget)
		});
	};

	return Toolbar;
}());
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

/* global $: false */

/**
 * This view class manages the main toolbar.
 */
ED.Views.Toolbar.Drawing = (function() {

	function DrawingToolbar(drawing, container) {
		ED.Views.Toolbar.apply(this, arguments);
		this.zoomIcon = this.container.find('[class^=icon-ed-zoom]');
	}

	DrawingToolbar.prototype = Object.create(ED.Views.Toolbar.prototype);
	DrawingToolbar.prototype.constructor = DrawingToolbar;

	DrawingToolbar.prototype.registerForNotifications = function() {

		ED.Views.Toolbar.prototype.registerForNotifications.apply(this, arguments);

		this.drawing.registerForNotifications(this, 'handleZoom', [
			'drawingZoomOut',
			'drawingZoomIn',
		]);
	};

	DrawingToolbar.prototype.handleZoom = function(notification) {
		switch(notification.eventName) {
			case 'drawingZoomIn':
				this.updateIcon('icon-ed-zoom-out');
			break;
			case 'drawingZoomOut':
				this.updateIcon('icon-ed-zoom-in');
			break;
		}
	};

	DrawingToolbar.prototype.updateIcon = function(className) {
		this.zoomIcon
			.removeClass('icon-ed-zoom-in icon-ed-zoom-out')
			.addClass(className);
	};

	return DrawingToolbar;
}());
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

/* global $: false */

/**
 * This Toolbar view class manages the main toolbar.
 */
ED.Views.Toolbar.Main = (function() {

	function MainToolbar(drawing, container) {
		ED.Views.Toolbar.apply(this, arguments);
	}

	MainToolbar.prototype = Object.create(ED.Views.Toolbar.prototype);
	MainToolbar.prototype.constructor = MainToolbar;

	return MainToolbar;
}());