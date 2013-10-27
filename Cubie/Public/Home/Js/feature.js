/**
 * 系统特性接口
 * @author: Zawa
 */

$(function() {
	
	var _featureMap = {};
	var _features = $('.js-cubie-feature');


	// 预处理系统特性
	_features.each(function(k, v) {
		var featureID = $(v).attr('data-featureid'),
			property = $(v).attr('data-property') || '';

		_featureMap[featureID] = {
			property: property.split(','),
			html: $.selfHtml($(v).removeAttr('data-featureid data-property style'))
		};
		// 从DOM移除
		$(v).remove();
	});

	

	/**
	 * 构造函数
	 * @param {Object} M 组件API引用
	 */
	var Feature = function(M) {
		this.M = M;
		this.data = {}; // 缓存当前组件特性数据
		this._init();
	};
	Feature.prototype._init = function() {
		// 防止特性增减造成数据库更新不及时,这里对所有特性都初始化,但先检查是否存在节点
		this.baseFeature();
		this.globalFeature();
		this.paddingFeature();
		this.marginFeature();
	};

	/**
	 * 值调节
	 */
	Feature.prototype._adjustHandler = function(e) {
		var obj = $(this),
			val = $.trim(obj.val()),
			keyCode = e.which;

		// 上下方向键
		if ($.inArray(keyCode, [38, 40]) != -1) {
			val = Math.abs(parseFloat(val) || 0);
			val += (keyCode == 38) ? 1 : (keyCode == 40) ? -1 : 0;
			val = (val < 0) ? 0 : val;
			obj.val(val);

			// 动态改变值不会触发oninput,手动触发
			obj.trigger('input');
		}
	};

	/**
	 * 初始化base特性
	 */
	Feature.prototype.baseFeature = function() {
		var M = this.M,
			objWidth = M.panel.find('.js-sys-feature-width'),
			objHeight, objLeft, objTop;

		if (objWidth.length > 0) {
			objHeight = M.panel.find('.js-sys-feature-height');
			objLeft = M.panel.find('.js-sys-feature-left');
			objTop = M.panel.find('.js-sys-feature-top');


			// 组件drag时同步XY
			M.onDrag(function(e, ui) {
				objLeft.val(ui.position.left);
				objTop.val(ui.position.top);
			});

			// 组件resize时同步宽高
			M.onResize(function(e, ui) {
				objWidth.val(ui.size.width);
				objHeight.val(ui.size.height);
			});

			
			// oninput事件在内容发生变化时即触发,兼容type=number的up down
			var oninputHandler = function(e) {
				var obj = $(this),
					val = $.trim(obj.val());

				if (val) {
					var data = e.data,
						moduleInfo = M.getModuleInfo(),
						blockInfo = M.getBlockInfo();

					// 限定范围
					var maxVal = (data.type == 'wh')
						? blockInfo.size[data.arg1] - moduleInfo.position[data.arg2]
						: blockInfo.size[data.arg2] - moduleInfo.size[data.arg2];

					val = parseInt(val, 10) || 0;
					val = (val < 0) ? 0 : val;
					val = Math.min(val, maxVal);

					M.module.css(data.arg1, val);
					obj.val(val).data('lastval', val);
				}
			};
			var blurHandler = function(e) {
				var obj = $(this);
				obj.val(obj.data('lastval'));
			};

			objWidth.keydown(this._adjustHandler)
				.on('input', {
					type: 'wh',
					arg1: 'width',
					arg2: 'left'
				}, oninputHandler)
				.blur(blurHandler);

			objHeight.keydown(this._adjustHandler)
				.on('input', {
					type: 'wh',
					arg1: 'height',
					arg2: 'top'
				}, oninputHandler)
				.blur(blurHandler);

			objLeft.keydown(this._adjustHandler)
				.on('input', {
					type: 'xy',
					arg1: 'left',
					arg2: 'width'
				}, oninputHandler)
				.blur(blurHandler);

			objTop.keydown(this._adjustHandler)
				.on('input', {
					type: 'xy',
					arg1: 'top',
					arg2: 'height'
				}, oninputHandler)
				.blur(blurHandler);


			// 初始化宽度xy
			var data = M.getModuleInfo();
			// left,top获取时可能存在小数,取整
			data.position.left = parseInt(data.position.left, 10);
			data.position.top = parseInt(data.position.top, 10);
			objWidth.val(data.size.width).data('lastval', data.size.width);
			objHeight.val(data.size.height).data('lastval', data.size.height);
			objLeft.val(data.position.left).data('lastval', data.position.left);
			objTop.val(data.position.top).data('lastval', data.position.top);
		}
	};

	/**
	 * 初始化global特性
	 * 属性继承性 http://www.cnblogs.com/snowinmay/archive/2013/04/28/3048745.html
	 */
	Feature.prototype.globalFeature = function() {
		var M = this.M,
			objFontFamily = M.panel.find('.js-sys-feature-font-family'),
			objFontSize, objLineHeight;

		if (objFontFamily.length > 0) {
			objFontSize = M.panel.find('.js-sys-feature-font-size');
			objLineHeight = M.panel.find('.js-sys-feature-line-height');
			objColor = M.panel.find('.js-sys-feature-color');
			objBackgroundColor = M.panel.find('.js-sys-feature-background-color');
			objStrong = M.panel.find('.js-sys-feature-strong');
			objEm = M.panel.find('.js-sys-feature-em');
			objTextLeft = M.panel.find('.js-sys-feature-text-left'); 
			objTextCenter = M.panel.find('.js-sys-feature-text-center'); 
			objTextRight = M.panel.find('.js-sys-feature-text-right'); 


			// 字体
			var setFontFamily = function() {
				var obj = $(this),
					val = $.trim(obj.val());

				M.module.css('font-family', val);
			};

			// oninput事件在内容发生变化时即触发,兼容type=number的up down
			var oninputHandler = function(e) {
				var obj = $(this),
					val = $.trim(obj.val()),
					data = e.data;

				if ($.isNumeric(val)) {
					val = (obj.attr('type') == 'number') ? parseFloat(val) : val; // 数字输入框时才格式化,否则支持小数输入
					val = (val < 0) ? 0 : val;

					M.module.css(data.name, val + (data.unit ? data.unit : ''));
					obj.val(val);
				} else {
					M.module.css(data.name, ''); // 非数字时去除样式
				}
			};

			// 字体颜色/背景颜色
			var setColor = function(e) {
				var obj = $(this),
					val = $.trim(obj.val()),
					data = e.data;

				if (val) {
					val = '#' + val;
					val = val.split('#');
					val = '#' + val.pop();
					// 添加已设置背景色样式,防止默认样式影响
					// M.module.addClass('cubie-module-hasbgc');
				} else {
					// M.module.removeClass('cubie-module-hasbgc');
				}

				M.module.css(data.name, val);
			};

			// 其他设置
			var setOther = function(e) {
				var obj = $(this),
					val = $.trim(obj.val()),
					data = e.data;

				if (obj.hasClass('cubie-btn-on')) {
					if (data.name == 'text-align') {
						M.panel.find('.js-sys-feature-text-align')
							.removeClass('cubie-btn-on')
							.find('i.icon-white')
							.removeClass('icon-white');
					} else {
						obj.removeClass('cubie-btn-on');
					}

					M.module.css(data.name, '');
				} else {
					if (data.name == 'text-align') {
						M.panel.find('.js-sys-feature-text-align')
							.removeClass('cubie-btn-on')
							.find('i.icon-white')
							.removeClass('icon-white');

						obj.addClass('cubie-btn-on')
							.find('i')
							.addClass('icon-white');
					} else {
						obj.addClass('cubie-btn-on');
					}

					M.module.css(data.name, data.value);
				}
			};

			objFontFamily.change(setFontFamily);

			objFontSize.keydown(this._adjustHandler)
				.on('input', {
					name: 'font-size'
				}, oninputHandler);

			objLineHeight.keydown(this._adjustHandler)
				.on('input', {
					name: 'line-height',
					unit: 'px'
				}, oninputHandler);

			objColor.on('input', {
					name: 'color'
				}, setColor)
				.ColorPicker({
					onSubmit: function(hsb, hex, rgb, el) {
						$(el).val(hex);
						$(el).ColorPickerHide();
						$(el).trigger('input');
					},
					onBeforeShow: function () {
						$(this).ColorPickerSetColor(this.value);
					},
					onChange: function (hsb, hex, rgb) {
						// onchange接口没有传el参数,晕
						// 多个ColorPicker时, 这里直接调用objColor会存在混乱问题,晕
						
						var obj = $(this.data('colorpicker').el);
						obj.val(hex)
							.trigger('input');
					}
				})
				.bind('keyup', function(){
					$(this).ColorPickerSetColor(this.value);
				});

			objBackgroundColor.on('input', {
					name: 'background-color'
				}, setColor)
				.ColorPicker({
					onSubmit: function(hsb, hex, rgb, el) {
						$(el).val(hex);
						$(el).ColorPickerHide();
						$(el).trigger('input');
					},
					onBeforeShow: function () {
						$(this).ColorPickerSetColor(this.value);
					},
					onChange: function (hsb, hex, rgb) {
						var obj = $(this.data('colorpicker').el);
						obj.val(hex)
							.trigger('input');
					}
				})
				.bind('keyup', function(){
					$(this).ColorPickerSetColor(this.value);
				});

			objStrong.on('click', {
				name: 'font-weight',
				value: 'bold'
			}, setOther);

			objEm.on('click', {
				name: 'font-style',
				value: 'italic'
			}, setOther);

			objTextLeft.on('click', {
				name: 'text-align',
				value: 'left'
			}, setOther);

			objTextCenter.on('click', {
				name: 'text-align',
				value: 'center'
			}, setOther);

			objTextRight.on('click', {
				name: 'text-align',
				value: 'right'
			}, setOther);


			// 初始化
			var data = M.getStyleData();
			objFontFamily.val(data['font-family']);
			objFontSize.val(data['font-size'] ? parseFloat(data['font-size']) : '');
			objLineHeight.val(data['line-height'] ? parseFloat(data['line-height']) : '');
			objColor.val(data['color'] ? $.RGBToHex(data['color']) : '');
			objBackgroundColor.val(data['background-color'] ? $.RGBToHex(data['background-color']) : '');
			if (data['font-weight'] == 'bold') {
				objStrong.trigger('click');
			}
			if (data['font-style'] == 'italic') {
				objEm.trigger('click');
			}
			if (data['text-align'] == 'left') {
				objTextLeft.trigger('click');
			} else if (data['text-align'] == 'center') {
				objTextCenter.trigger('click');
			} else if (data['text-align'] == 'right') {
				objTextRight.trigger('click');
			} 
		}
	};

	/**
	 * 初始化padding/margin特性
	 */
	Feature.prototype._pmFeature = function(type) {
		var M = this.M,
			objTop = M.panel.find('.js-sys-feature-' + type + '-top'),
			objRight, objBottom, objLeft;

		if (objTop.length > 0) {
			objRight = M.panel.find('.js-sys-feature-' + type + '-right');
			objBottom = M.panel.find('.js-sys-feature-' + type + '-bottom');
			objLeft = M.panel.find('.js-sys-feature-' + type + '-left');

			// oninput事件在内容发生变化时即触发,兼容type=number的up down
			var oninputHandler = function(e) {
				var obj = $(this),
					val = $.trim(obj.val()),
					data = e.data,
					name = type + '-' + data.name;

				if ($.isNumeric(val)) {
					val = parseFloat(val) || 0;
					val = (val < 0) ? 0 : val;

					M.module.css(name, val);
					obj.val(val);
				} else {
					M.module.css(name, ''); // 非数字时去除样式
				}
			};

			objTop.keydown(this._adjustHandler)
				.on('input', {
					name: 'top'
				}, oninputHandler);

			objRight.keydown(this._adjustHandler)
				.on('input', {
					name: 'right'
				}, oninputHandler);

			objBottom.keydown(this._adjustHandler)
				.on('input', {
					name: 'bottom'
				}, oninputHandler);

			objLeft.keydown(this._adjustHandler)
				.on('input', {
					name: 'left'
				}, oninputHandler);


			// 初始化
			objTop.val(parseInt(M.module.css(type + '-top')));
			objRight.val(parseInt(M.module.css(type + '-right')));
			objBottom.val(parseInt(M.module.css(type + '-bottom')));
			objLeft.val(parseInt(M.module.css(type + '-left')));
		}
	};

	/**
	 * 初始化padding特性
	 */
	Feature.prototype.paddingFeature = function(M) {
		this._pmFeature('padding');
	};

	/**
	 * 初始化margin特性
	 */
	Feature.prototype.marginFeature = function(M) {
		this._pmFeature('margin');
	};



	// API
	$.Feature = {
		/**
		 * 获取特性对象(深度克隆)
		 * @param {String} [featureID] 特性类型,缺省返回全部
		 * @return {String|Object}
		 */
		get: function(featureID) {
			var cloneMap = {};
			$.extend(true, cloneMap, _featureMap);
			return featureID ? cloneMap[featureID] : cloneMap;
		},
		/**
		 * 获取特性HTML
		 * @param {String} featureID 特性类型
		 * @return {String|Object}
		 */
		getHTML: function(featureID) {
			return this.get(featureID).html;
		},
		/**
		 * 初始化特性事件
		 * @param {Object} M 组件API对象
		 */
		initEvent: function(M) {
			new Feature(M);
		}
	};
});