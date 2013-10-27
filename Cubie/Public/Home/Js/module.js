/**
 * 组件API
 * @author: Zawa
 */

;(function($) {
	
	var SLICE = Array.prototype.slice;


	// 所有组件共享一个Modal
	var _Modal = new $.Modal();


	/**
	 * 组件API构造函数
	 * @param {Object} options
	 *	{
	 *		projectID: projectID,
	 *		module: module,
	 *		JSON: json, // 初始化的JSON数据,一般用于组件拷贝时传入
	 *	}
	 */
	function Module(options) {
		this.projectID = options.projectID; // 项目ID
		this.module = $(options.module); // 组件引用
		this.editArea = this.module.find('.cubie-module-editarea'); // 可编辑区
		this.moduleID = this.module.attr('id'); // 组件ID
		this.panel = $('#' +  this.moduleID + '_panel'); // 属性面板
		
		this.inEditing = false; // 是否处于编辑状态(onEditIn触发时为true,onEditOut触发时为false)

		// 插件实例引用
		this._pluginInstance = {};

		// Modal模态窗口
		this.modal = _Modal;
		// 额外的Modal实例引用
		this._modals = []; 

		// 组件API实例与布局使用同一个Toast
		this.toast = $.Layout.Toast;

		// 公用接口引用
		this.Common = $.Layout;

		// 组件数据缓存
		this._JSON = {
			'sys': {}, // 存储系统特性JSON
			'feature': {}, // 存储自定义特性JSON
			'plugin': {} // 存储插件JSON
		};

		// 初始化组件数据缓存(新建时为空,恢复组件时就有JSON数据)
		var json = $.trim($('#' + this.moduleID + '_json').val());
		json && $.extend(true, this._JSON, $.parseJSON(json));

		// 扩展默认配置,一般用于组件克隆
		if ($.type(options.JSON) == 'object') {
			$.extend(true, this._JSON, options.JSON);
		}

		// 句柄内部额外调用(不要注册_onInit, 因为_onInit只执行一次,定义在此会多次执行)
		this._innerCall = {
			'onEditOut': function() {
				this.modal.close(); // 关闭当前打开的Modal
				this._closeModals(); // 关闭所有额外实例化的Modal
			}
		};
	}

	/**
	 * 事件回调统一处理
	 */
	Module.prototype._eventHandler = function() {
		var that = this,
			args = SLICE.call(arguments),
			eventName = args[0],
			eventCacheKey = '_' + eventName;

		args.shift();

		if ($.type(args[0]) == 'function') {
			if (!that[eventCacheKey]) {
				that[eventCacheKey] = [];
			}

			that[eventCacheKey].push(args[0]);
		} else {
			$.each(that[eventCacheKey] || [], function(k, v) {
				v.apply(that, args || []);
			});

			if ($.type(that._innerCall[eventName]) == 'function') {
				that._innerCall[eventName].call(that, null);
			}
		}
	};

	/**
	 * 关闭所有额外实例化的Modal
	 */
	Module.prototype._closeModals = function() {
		$.each(this._modals, function(k, v) {
			v.close();
		});
	};
	
	/**
	 * 组件初始化函数,在组件面板首次弹出时触发,后续弹出不再触发(一次函数)
	 *
	 * 1) 注册
	 * @param {Function} fn
	 *
	 * 2) 执行
	 */
	Module.prototype._onInit = function(fn) {
		var _fn = fn;
		if ($.type(fn) == 'function') {
			var that = this;
			_fn = $.once(function() {
				fn && fn.apply(null, arguments);
			});
		}

		this._eventHandler('_onInit', _fn);
	};

	/**
	 * 注册/执行组件drag回调
	 *
	 * 1) 注册
	 * @param {Function} e
	 *
	 * 2) 执行
	 * @param {Event} e
	 * @param {Object} ui
	 */
	Module.prototype.onDrag = function(e, ui) {
		this._eventHandler('onDrag', e, ui);
	};

	/**
	 * 注册/执行组件resize回调
	 *
	 * 1) 注册
	 * @param {Function} e
	 *
	 * 2) 执行
	 * @param {Event} e
	 * @param {Object} ui
	 */
	Module.prototype.onResize = function(e, ui) {
		this._eventHandler('onResize', e, ui);
	};

	/**
	 * 注册/执行组件销毁回调
	 *
	 * 1) 注册
	 * @param {Function} fn
	 *
	 * 2) 执行
	 */
	Module.prototype.onDestroy = function(fn) {
		this._eventHandler('onDestroy', fn);
	};

	/**
	 * 注册/执行组件进入编辑模式回调
	 *
	 * 1) 注册
	 * @param {Function} fn
	 *
	 * 2) 执行
	 */
	Module.prototype.onEditIn = function(fn) {
		if ($.type(fn) != 'function') {
			this.inEditing = true;
		}

		this._eventHandler('onEditIn', fn);
	};

	/**
	 * 注册/执行组件退出编辑模式回调
	 *
	 * 1) 注册
	 * @param {Function} fn
	 *
	 * 2) 执行
	 * @param {Boolean} fn 标识是否来自于面板设置引起的退出操作
	 */
	Module.prototype.onEditOut = function(fn) {
		if ($.type(fn) != 'function') {
			this.inEditing = false;
		}

		this._eventHandler('onEditOut', fn);
	};

	/**
	 * 注册/执行组件实时编辑回调(组件内容发生变化时触发)
	 *
	 * 1) 注册
	 * @param {Function} data
	 *
	 * 2) 执行
	 * @param {String} data 组件内容
	 */
	Module.prototype.onEdit = function(data) {
		this._eventHandler('onEdit', data);
	};

	/**
	 * 注册/执行组件面板提交回调(确定按钮点击时触发)
	 *
	 * 1) 注册
	 * @param {Function} data
	 *
	 * 2) 执行
	 * @param {Object} data 表单数据(注意:同名name的值会被覆盖)
	 * @param {Object} form 表单对象
	 */
	Module.prototype.onSubmit = function(data, form) {
		this._eventHandler('onSubmit', data, form);
	};

	/**
	 * 获取组件信息
	 * @return {Object} 
	 */
	Module.prototype.getModuleInfo = function() {
		return {
			size: {
				width: this.module.width(),
				height: this.module.height()
			},
			offset: this.module.offset(),
			position: {
				left: parseFloat(this.module.css('left')) || 0,
				top: parseFloat(this.module.css('top')) || 0
			}
		};
	};

	/**
	 * 获取组件style
	 * @return {Object} 
	 */
	Module.prototype.getStyleData = function() {
		return $.getStyleData(this.module);
	};

	/**
	 * 获取组件对应的区块信息
	 * @return {Object|Null} 
	 */
	Module.prototype.getBlockInfo = function() {
		var blockID = this.module.data('blockID');
			block = blockID ? $('#' + blockID) : $('#cubie_layout_wrapper'); // 不存在区块时,则缺省区块为layout_wrapper

		return {
			global: !blockID, // 标识是否全局区块
			size: {
				width: block.width(),
				height: block.height()
			},
			offset: block.offset(),
			position: {
				left: parseFloat(block.css('left')) || 0,
				top: parseFloat(block.css('top')) || 0
			}
		};
	};

	/**
	 * 获取组件编辑区元素(组件HTML元素需要使用cubie="xxx"定义,项目生产时cubie节点会被移除)
	 * @param {String} name
	 * @return {Object}
	 */
	Module.prototype.find = function(name) {
		return this.editArea.find('[cubie="' + name + '"]');
	};

	/**
	 * 获取组件克隆的JSON配置
	 * @return {Object}
	 */
	Module.prototype.getCloneJSON = function() {
		var json = {};
		// 深拷贝,防止影响原有数据
		$.extend(true, json, this._JSON);
		return json;
	};

	/**
	 * JSON数据设置
	 * @param {String} type 数据类型, sys|feature|plugin
	 */
	function _json(type, name, value) {
		var data = this._JSON[type];

		if ($.type(name) == 'object') {
			$.extend(true, data, name); // extend方式,防止重置所有
		} else if ($.type(name) == 'string') {
			if ($.type(value) == 'undefined') {
				return data[name];
			} else {
				data[name] = value;
			}
		} else {
			return data;
		}
	}

	/**
	 * 获取/存储JSON数据
	 * @param {Object|String} [name]
	 * @param {Object|String} [value]
	 * @return {JSON}
	 */
	Module.prototype.jsonSys = function(name, value) {
		return _json.apply(this, ['sys', name, value]);
	};
	Module.prototype.jsonFeature = function(name, value) {
		return _json.apply(this, ['feature', name, value]);
	};
	Module.prototype.jsonPlugin = function(name, value) {
		return _json.apply(this, ['plugin', name, value]);
	};

	/**
	 * 将所有JSON数据写入DOM存储
	 */
	Module.prototype._cacheJSON = function() {
		// 防止_onInit未调用时就触发cacheJSON,此时无需处理
		if ($.type(this._JSON) == 'object') {
			var id = this.moduleID + '_json',
				textarea = $('#' + id);

			var data = JSON.stringify(this._JSON);
			// textarea只设置val时,textarea.html()是取不到设置的内容的,要同时设置html内容
			textarea.val(data).html(data);
		}
	};

	/**
	 * 实例化Modal
	 */
	Module.prototype.Modal = function() {
		var modal = new $.Modal();
		this._modals.push(modal);
		return modal;
	};

	/**
	 * Modal提示
	 * @param {Object|String} options
	 */
	Module.prototype.showTips = function(options) {
		options = ($.type(options) == 'string') 
			? {content: options} 
			: options;

		var that = this;
		var opts = {
			backdrop: true,
			draggable: false,
			btns: {
				cancel: false,
				ok: {
					handler: function() {
						that.modal.close();
					}
				}
			}
		};
		$.extend(true, options, opts);
		this.modal.open(options);
	};

	/**
	 * 设置组件可编辑状态
	 * @param {Boolean} [able:true] true时可编辑
	 */
	Module.prototype.setContentEditable = function(able) {
		this.editArea.attr('contenteditable', !(able === false));
	};

	/**
	 * 获取GUID
	 * @return {String}
	 */
	Module.prototype.getGUID = function() {
		return $.getGUID();
	};

	/**
	 * 文件上传
	 * @param {Object} options
	 *  {
	 * 	selector: null, // 初始化的选择器
	 *	buttonText: '选择图片',
	 *	fileTypeExts: 'jpg;jpeg;gif;png', // 允许的文件类型,分号分隔
	 *	fileSizeLimit: '1024', // 单位:B(字节)
	 *	onUploadStart: function() {},
	 *	onUploadSuccess: function(file, data, response) {}
	 *  }
	 */
	Module.prototype.initUpload = function(options) {
		var opts = {
			selector: null, // 初始化的选择器
			buttonText: '选择图片',
			fileTypeExts: 'jpg;jpeg;gif;png',
			fileSizeLimit: 1 * 1024 * 1024, // 1M
			onUploadStart: function() {},
			onUploadSuccess: function() {}
		};
		$.extend(true, opts, options);

		// 转换fileSizeLimit为单位B
		var fileSizeLimit = opts.fileSizeLimit + 'B';

		// 转换fileTypeExts为uploadify格式
		// 'jpg;jpeg;gif;png'  --> '*.jpg;*.jpeg;*.gif;*.png'
		var fileTypeExts = '*.' + opts.fileTypeExts.split(';').join(';*.');

		// uploadify需要初始化对象必须要有ID, 不存在ID时自动添加
		var obj = $(opts.selector);
		if (!obj.attr('id')) {
			obj.attr('id', this.getGUID());
		}

		obj.uploadify({
			auto: true, // 自动上传
			swf: '/Public/Home/Js/uploadify/uploadify.swf',
			buttonText: opts.buttonText,
			width: 100, // 按钮宽度
			height: 25, // 按钮高度
			multi: false, // 不支持多文件上传
			formData: {
				id: this.projectID,
				action: 'upload_module_file',
				fileSizeLimit: opts.fileSizeLimit,
				fileTypeExts: opts.fileTypeExts
			},
			fileObjName: 'module_file',
			uploader: '/index.php/Project/layout',
			fileTypeDesc: '支持的格式',
			fileTypeExts: fileTypeExts,
			fileSizeLimit: fileSizeLimit,
			onUploadStart: opts.onUploadStart,
			onUploadSuccess: function(file, data, response) {
				data = JSON.parse(data);
				opts.onUploadSuccess && opts.onUploadSuccess(file, data, response);
			}
		});
	};

	/**
	 * 获取/设置光标, 缺省对editArea进行操作
	 * @param {String} [selector] 缺省操作editArea
	 * @param {Int} [pos] 当指定selector时, 
	 * @return {Int}
	 */
	// Module.prototype.caret = function(selector, pos) {
	// 	var target;

	// 	if ($.type(selector) == 'undefined') { // 取editArea
	// 		target = this.editArea;
	// 		pos = undefined;
	// 	} else if ($.type(selector) == 'number') { // 设置editArea
	// 		target = this.editArea;
	// 		pos = selector;
	// 	} else { // 自定义元素
	// 		target = $(selector);
	// 	}

	// 	if ($.type(pos) == 'number') {
	// 		target.caret(pos);
	// 	} else {
	// 		return target.caret();
	// 	}
	// };

	/**
	 * 使用$.caret()处理选区
	 *
	 *	1) M.caret(selector).start, M.caret(selector).end - 获取选区开始与结束光标位置
	 *	2) M.caret(selector).text - 获取选区文本
	 *	3) M.caret(selector, 0, 5) 或 caret(selector, {start:0, end:5}) - 设置选区范围
	 *	4) M.caret(selector, 'xxx') - 选中文本为'xxx'的内容
	 *	5) M.caret(selector, reg) - 选中正则匹配reg的内容
	 *	6) M.caret(selector).replace() - 将选区内容替换为输入的内容
	 *	7) 其他用法见 http://www.examplet.buss.hk/jquery/caret.php
	 */
	// Module.prototype.caret = function() {
	// 	var args = SLICE.call(arguments),
	// 		selector = args[0];

	// 	args.shift();

	// 	return $(selector).caret(args);
	// };

	/**
	 * 添加插件(Trigger模式触发)
	 * @param {String} name
	 * @param {*} options 插件配置
	 *
	 * @usage:
	 *	// 添加一个插件,并初始化插件参数
	 *	addPlugins('name', {arg: 1})
	 *	
	 *	// 同时添加a、b、c三个插件，并在a、b插件与c插件之间插入分割符
	 *	addPlugins(['a', 'b', '|', 'c'])
	 */
	Module.prototype.addPlugins = function(name, options) {
		var that = this,
			conf = {},
			pluginWrapper = that.panel.find('.js-plugins'),
			plugins = $.Plugin.get(),
			init = false;

		if ($.type(name) == 'array') { // ['a', 'b', '|', 'c']
			$.each(name, function(k, v) {
				conf[v] = null;
			});
		} else {
			conf[name] = options || null;
		}

		$.each(conf, function(k, v) {
			var plugin = plugins[k];

			if (plugin) {
				var trigger = $('<span class="cubie-plugin-trigger">' + plugin.trigger + '</span>');

				trigger.on('click', {
						M: that,
						name: k,
						args: v
					}, function(e) {
						var data = e.data;

						// 初始化插件
						data.M.loadPlugin.apply(data.M, [data.name, data.args, null, 'trigger']);

						return false;
					});

				pluginWrapper.append(trigger);
				init = true;
			} else if (k == '|') {
				pluginWrapper.append('<hr />');
				init = true;
			}
		});

		if (init) {
			pluginWrapper.parent().show();
		} else {
			pluginWrapper.parent().hide();
		}
	};

	/**
	 * (预)加载组件(onEditIn模式触发)
	 * @param 同addPlugins
	 * @param {Function} callback 插件加载成功回调
	 * @param {String} _mode 触发模式, trigger为点击时触发, preload为预加载触发
	 */
	Module.prototype.loadPlugin = function(name, args, callback, _mode) {
		var that = this;
		// 初始化插件
		$.Plugin.init(name, args, that, {
			mode: _mode || 'preload',
			beforeLoad: function() {
				that.toast.open('请稍后，正在载入插件...', false);
			},
			success: function(script, textStatus, jqXHR) {
				that.toast.close();
				callback && callback();
			},
			fail: function(jqXHR, textStatus, errorThrown) {
				if (jqXHR.status == 404) {
					that.toast.open('插件不存在~');
				} else {
					that.toast.open(textStatus + '：' + errorThrown);
				}
			}
		});
	};

	/**
	 * 缓存插件实例引用
	 * @param {String} name 插件名称
	 */
	Module.prototype._setPluginInstance = function(name, instance) {
		this._pluginInstance[name] = instance;
	}

	/**
	 * 获取插件实例引用
	 * @param {String} name 插件名称
	 */
	Module.prototype.getPluginInstance = function(name) {
		return this._pluginInstance[name];
	};


	// Expose
	$.CUBIE_MODULE_API = Module;

})(jQuery);