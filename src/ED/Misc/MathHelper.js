/**
 * (C) OpenEyes Foundation, 2019
 * This file is part of OpenEyes.
 * OpenEyes is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * OpenEyes is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License along with OpenEyes in a file titled COPYING. If not, see <http://www.gnu.org/licenses/>.
 *
 * @link http://www.openeyes.org.uk
 *
 * @author OpenEyes <info@openeyes.org.uk>
 * @copyright Copyright (C) 2019, OpenEyes Foundation
 * @license http://www.gnu.org/licenses/agpl-3.0.html The GNU Affero General Public License V3.0
 */

var MathHelper = MathHelper || {};

MathHelper.calculateLinearFunctionFromPoints = function(x1, y1, x2, y2, x) {
    /** y = f(x) = a * x + b */
    var a = (y2 - y1) / (x2 - x1);
    var b = y2 - a * x2;
    return a * x + b;
};

MathHelper.perpendicularToLine = function(x1, y1, x2, y2, x3, y3, dist) {
    let a = y1 - y2;
    let b = x2 - x1;
    let norm = Math.sqrt(a*a + b*b);
    a = a / norm;
    b = b / norm;
    let x4 = x3 + a * dist;
    let y4 = y3 + b * dist;
    return {x: x4, y: y4};
};

MathHelper.calculateBezierPoints = function (t, startPoint, endPoint, controlPoint1, controlPoint2) {
    let B0_t = Math.pow(1 - t, 3);
    let B1_t = 3 * t * Math.pow((1 - t), 2);
    let B2_t = 3 * Math.pow(t, 2) * (1 - t);
    let B3_t = Math.pow(t, 3);
    let x = (B0_t * startPoint.x) + (B1_t * controlPoint1.x) + (B2_t * controlPoint2.x) + (B3_t * endPoint.x)
    let y = (B0_t * startPoint.y) + (B1_t * controlPoint1.y) + (B2_t * controlPoint2.y) + (B3_t * endPoint.y)
    return {x:x, y:y};
};
