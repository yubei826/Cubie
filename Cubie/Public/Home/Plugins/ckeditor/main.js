/**
 * CKEditor编辑器 inline模式
 * @author: Zawa
 * @version: v1.0.0
 */

// CKEditor基础路径定义
// http://docs.cksource.com/CKEditor_3.x/Developers_Guide/Specifying_the_Editor_Path
var CKEDITOR_BASEPATH = '/Public/Home/Js/ckeditor/';

;(function($) {

	// 防止ckeditor重复加载
	var _loaded = false;
	var _editor = null;

	/**
	 * constructor
	 */
	function CKEditor(M, options) {
		this.M = M;

		// 加载CKEditor文件
		if (!_loaded) {
			M.toast.open('请稍后，正在载入插件...', false);
			$.getScript('/Public/Home/Js/ckeditor/ckeditor.js', function() {
				_loaded = true;
				M.toast.close();

				initCKEditor(M);
			});
		}
	}

	function initCKEditor(M) {
		if (M.inEditing) {
			// jquery方式初始化 http://nightly.ckeditor.com/13-09-09-13-06/standard/samples/jquery.html

			// 禁止自动为contenteditable=true的对象添加编辑器
			CKEDITOR.disableAutoInline = true;

			// _editor && _editor.destroy(); 方式会触发Uncaught TypeError: Cannot call method 'getType' of null
			// 见 https://dev.ckeditor.com/ticket/9684

			// 全局只有一个CKEditor实例, remove之后再次编辑时好像就失效了,额?
			// _editor && CKEDITOR.remove(_editor);

			try {
				_editor && _editor.destroy();
	    			_editor = CKEDITOR.inline(M.editArea[0]);
	    		} catch(e) {
	    			// destroy方式会触发Uncaught TypeError: Cannot call method 'getType' of null
	    			//  CKEditor的bug
	    		}
		}
	}

	/**
	 * 入口点函数
	 */
	CKEditor.prototype.init = function() {
		_loaded && initCKEditor(this.M);
	};

	// 注册插件
	$.Plugin.add('ckeditor', CKEditor);

})(jQuery);