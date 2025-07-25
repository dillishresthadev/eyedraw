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
?>
<div class="ed2-widget <?php echo ($isEditable) ? ' edit' : ' display';?>" id="eyedrawwidget_<?php echo $idSuffix ?>">
	<?php $this->render('toolbar', $data);?>
	<div class="ed2-body">
		<div class="ed2-editor-wrap">
			<?php if (@$data['imageUrl']) {?>
				<img src="<?php echo $data['imageUrl']?>" height=<?=$height?> width=<?=$width?> />
			<?php }else{?>
				<?php $this->render('editor', $data);?>
				<?php $this->render('fields', $data);?>
			<?php }?>
		</div>

		<?php if ($showDrawingControls) {?>
			<div class="ed2-no-doodle-elements">
				<ul class="no-doodles"></ul>
			</div>
		<?php }?>
	</div>
</div>
