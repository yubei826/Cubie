/**
 * 插件模版
 */

;(function($) {

	/**
	 * 插件构造函数, 在插件被调用时进行实例化
	 */
	function Demo(M, options) {
		// M为组件实例引用
		// options为组件加载时传入的额外参数, 可选
	}

	/**
	 * 入口点函数, 在插件每次被调用时触发
	 */
	Demo.prototype.init = function() {
		
	};

	// 注册插件(注册的插件名必须与目录名相同,大小写敏感)
	$.Plugin.add('demo', Demo);

})(jQuery);