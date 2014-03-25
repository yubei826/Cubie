/**
 * 插件API
 * @author: Zawa
 */

;(function($) {
	
	// 插件声明
	var PLUGIN_CONFIG = {
		'sourcecode': {
			trigger: '<i class="icon-edit"></i> 编辑源码'
		},
		'backgroundImage': {
			trigger: '<i class="icon-picture"></i> 编辑背景'
		},
		'ckeditor': {
			trigger: '<i class="icon-font"></i> 文本编辑'
		}
	};



	// API
	var Plugin = {};


	/**
	 * 注册插件入口函数
	 * @param {String} name 插件名称, 必须与文件夹名称相同,大小写敏感
	 * @param {Function} constructor  插件构造函数引用
	 */
	Plugin.add = function(name, constructor) {
		if ($.type(PLUGIN_CONFIG[name]) == 'undefined') {
			throw 'Plugin is not declared';
		}

		if ($.type(constructor.prototype.init) != 'function') {
			throw name + '.prototype.init must be a function';
		}

		PLUGIN_CONFIG[name].__constructor__ = constructor;
	};

	/**
	 * 获取插件配置
	 * @param {String} [name] 插件名称, 缺省获取整个配置
	 * @return {Object}
	 */
	Plugin.get = function(name) {
		return name ? PLUGIN_CONFIG[name] : PLUGIN_CONFIG;
	};

	/**
	 * 加载(初始化)插件
	 * @param {String} name 插件名称
	 * @param {Object} args 插件配置
	 * @param {Object} M 组件API实例引用
	 * @param {Object} options
	 *	{
	 *		mode: 'trigger', // 插件触发模式,trigger为点击时触发,其他为(预)加载触发
	 *		beforeLoad: function, //加载前的处理句柄
	 *		success: function, // 加载成功回调
	 *		fail: function, // 初始化失败回调
	 *	}
	 */
	Plugin.init = function(name, args, M, options) {
		options = options || {};

		var plugin = PLUGIN_CONFIG[name];

		// 插件初始化
		function initPlugin() {
			var instance = M.getPluginInstance(name);

			if (instance !== false && !instance) { // 未实例化
				try {
					instance = new plugin.__constructor__(M, args);

					// 预加载模式触发时,入口点函数init在onEditIn时触发
					if (options.mode == 'preload') {
						M.onEditIn(function() {
							$.Plugin.init(name, args, this, options);
						});
					}
				} catch (e) {
					instance = false;
				}

				// 缓存插件实例引用
				M._setPluginInstance(name, instance);
			}

			if (instance === false) { // 已初始化,但初始化失败
				M.toast.open('插件初始化异常');
			} else {
				// 组件处于编辑状态时才触发,防止组件加载完毕前退出编辑模式
				M.inEditing && instance.init();				
			}
		}

		if (plugin && plugin.__constructor__) { // 插件已加载
			initPlugin();
		} else {
			var url = '/Public/Home/Plugins/' + name + '/main.js?v=' + (+new Date());

			// 加载前的处理句柄
			if ($.type(options.beforeLoad) == 'function') {
				options.beforeLoad();
			}

			if ($.type(options.fail)  != 'function') {
				options.fail = function() {};
			}

			$.ajax({
				url: url,
				dataType: 'script'
			}).done(function(script, textStatus, jqXHR) {
				if ($.type(options.success) == 'function') {
					options.success(script, textStatus, jqXHR);
				}

				initPlugin();
			}).fail(function(jqXHR, textStatus, errorThrown) {
				if ($.type(options.fail) == 'function') {
					options.fail(jqXHR, textStatus, errorThrown);
				}
			});
		}
	};



	// Expose
	$.Plugin = Plugin;

})(jQuery);