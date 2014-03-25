/**
 * 编辑源码
 * @author: Zawa
 * @version: v1.0.0
 */

;(function($) {

	/**
	 * constructor
	 */
	function SourceCode(M, options) {
		this.M = M;

		// 注册组件编辑回调, 组件编辑时同步更新源码框的内容
		M.onEdit(function(data) {
			if (M.modal.identifier == 'sourcecode' && M.modal.isOpen()) {
				M.modal.find('.js-sourcecode').val(data);
			}
		});
	}

	/**
	 * 入口点函数
	 */
	SourceCode.prototype.init = function() {
		var M = this.M;

		var content = $('<div class="row-fluid"><textarea rows="10" class="span12 js-sourcecode">' + M.editArea.html() + '</textarea></div>');
		M.modal.open({
			identifier: 'sourcecode',
			title: '编辑源码',
			content: content,
			btns: {
				cancel: false
			}
		});

		// 实时同步组件显示
		var textarea = content.find('textarea');
		textarea.on('input', function(e) {
				var val = $.trim($(this).val());
				// 动态设置元素的html不会触发元素绑定的oninput事件
				M.editArea.html(val);
			}).focus();

		// 组件可编辑
		M.setContentEditable(true);
	};

	// 注册插件
	$.Plugin.add('sourcecode', SourceCode);

})(jQuery);