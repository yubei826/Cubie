/**
 * 布局编辑公用脚本
 * @author: Zawa
 */

;(function() {
	/**
	 * Toats提示
	 */
	function Toast() {
		this.obj = $('<div class="cubie-layout-toast" style="display:none;"></div>').appendTo(document.body)
		this._timer = null;
	}
	/**
	 * 开启
	 * @param {String} tips
	 * @param {Int} [time:2000] 消失时间, 非正整数时不消失
	 */
	Toast.prototype.open = function(tips, time) {
		var that = this;
		that._timer && clearTimeout(that._timer);

		that.obj.stop()
			.html(tips)
			.show()
			.css({
				'margin-left': - (that.obj.width() / 2)
			});

		if ($.type(time) == 'undefined') {
			time = 2500;
		}

		if ($.isNumeric(time)  && time > 0) {
			that._timer = setTimeout(function() {
				that.obj.hide();
			}, time);
		}
	};
	/**
	 * 关闭
	 */
	Toast.prototype.close = function() {
		this._timer && clearTimeout(this._timer);
		this.obj.hide();
	};



	// 布局公用API
	$.Layout = function() {
		// 缓存需要保存的资源名称
		var _res = [];

		return {
			// 布局以及组件共享一个Toast
			Toast: new Toast(),

			/**
			 * 添加需保存的资源
			 * @param {String|Array} res 资源名称
			 */
			saveResource: function(res) {
				res = ($.type(res) == 'string') ? [res] : res;
				// 去重检查
				$.each(res, function(k, v) {
					if ($.inArray(v, _res) == -1) {
						_res.push(v);
					}
				});
			},
			/**
			 * 移除已保存的资源
			 * @param {String|Array} res 资源名称
			 */
			removeResource: function(res) {
				res = ($.type(res) == 'string') ? [res] : res;
				$.each(res, function(k, v) {
					var index = $.inArray(v, _res);
					if (index != -1) {
						_res.splice(index, 1);
					}
				});
			},
			/**
			 * 获取/初始化 已保存资源队列
			 * @param {Array} res 资源名称 初始化时提供
			 * @return {Array} 资源名称
			 */
			_resource: function(res) {
				if ($.type(res) != 'undefined') {
					_res = [].concat(res || []);
				} else {
					// 防止被修改
					return [].concat(_res);	
				}
			}
		};
	}();
})();