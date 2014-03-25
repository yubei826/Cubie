/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here. For example:
	// config.language = 'fr';
	// config.uiColor = '#AADC6E';
	
	// 缺省的全部插件
	// http://docs.cksource.com/CKEditor_3.x/Developers_Guide/Toolbar
	// config.toolbar = [
	// 	{ name: 'document', items : [ 'Source','-','Save','NewPage','DocProps','Preview','Print','-','Templates' ] },
	// 	{ name: 'clipboard', items : [ 'Cut','Copy','Paste','PasteText','PasteFromWord','-','Undo','Redo' ] },
	// 	{ name: 'editing', items : [ 'Find','Replace','-','SelectAll','-','SpellChecker', 'Scayt' ] },
	// 	{ name: 'forms', items : [ 'Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 
	//         'HiddenField' ] },
	// 	'/',
	// 	{ name: 'basicstyles', items : [ 'Bold','Italic','Underline','Strike','Subscript','Superscript','-','RemoveFormat' ] },
	// 	{ name: 'paragraph', items : [ 'NumberedList','BulletedList','-','Outdent','Indent','-','Blockquote','CreateDiv',
	// 	'-','JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock','-','BidiLtr','BidiRtl' ] },
	// 	{ name: 'links', items : [ 'Link','Unlink','Anchor' ] },
	// 	{ name: 'insert', items : [ 'Image','Flash','Table','HorizontalRule','Smiley','SpecialChar','PageBreak','Iframe' ] },
	// 	'/',
	// 	{ name: 'styles', items : [ 'Styles','Format','Font','FontSize' ] },
	// 	{ name: 'colors', items : [ 'TextColor','BGColor' ] },
	// 	{ name: 'tools', items : [ 'Maximize', 'ShowBlocks','-','About' ] }
	// ];

	//  去除安全检查,防止某些内敛元素样式之类的被去除
	config.allowedContent = true;

	config.toolbar = [
		// { name: 'document', items : [ 'Source','-','Save','NewPage','DocProps','Preview','Print','-','Templates' ] },
		// { name: 'editing', items : [ 'Find','Replace','-','SelectAll','-','SpellChecker', 'Scayt' ] },
		{ name: 'clipboard', items : [ 'Cut','Copy','Paste','PasteText','PasteFromWord','-','Undo','Redo' ] },
		{ name: 'basicstyles', items : ['Bold','Italic','Underline','Strike','Subscript','Superscript','-','RemoveFormat' ] },
		{ name: 'tools', items : [ 'Link','Unlink','Anchor'] },
		'/',
		{ name: 'paragraph', items : [ 'NumberedList','BulletedList','-','Outdent','Indent','-','Blockquote','-','JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock','-','BidiLtr','BidiRtl' ] },
		'/',
		{ name: 'styles', items : [ 'Styles','Format','Font','FontSize','lineheight'] },
		{ name: 'colors', items : [ 'TextColor','BGColor' ] },
		'/',
		{ name: 'forms', items : [ 'Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'HiddenField' ] },
		{ name: 'insert', items : [ 'Image','Flash','Table','HorizontalRule','SpecialChar','PageBreak','Iframe' ] }
	];

	// lineheight插件
	config.extraPlugins += (config.extraPlugins ? ',lineheight' : 'lineheight');

	// 重置lineheight插件行高可选值
	config.lineheight_sizes = 'normal;10px;12px;14px;16px;18px;20px;22px;24px;26px;28px;30px;32px;34px;36px;48px;56px;72px;100%;120%;130%;150%;170%;180%;190%;200%;220%;250%;300%;400%;500%';
};
