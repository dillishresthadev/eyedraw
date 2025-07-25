<?php

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

$min = (defined('YII_DEBUG') && YII_DEBUG) ? '' : '.min';

return array(
    'import' => array(
        'application.modules.eyedraw.*',
    ),
    'components' => array(
        'clientScript' => array(
            'packages' => array(
                'eyedraw' => array(
                    'js' => array(
                        "js/dist/eyedraw{$min}.js",
                        "js/dist/oe-eyedraw{$min}.js"
                    ),
                    'css' => array(
                    ),
                    'basePath' => 'application.modules.eyedraw.assets',
                    'depends' => array(
                        'eventemitter2',
                        'jquery', // a package that should be defined in core
                        'mustache' // a package that should be defined in core
                    ),
                )
            ),
        )
    )
);
