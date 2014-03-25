/**
 * Cubie公用JS
 * @author: Zawaliang
 */

// ref: https://github.com/jquery/jquery-migrate/blob/master/src/core.js
// Don't clobber any existing jQuery.browser in case it's different
// 部分插件(如$.caret)需要依赖$.browser
if ( !jQuery.browser ) {
	var uaMatch = function( ua ) {
		ua = ua.toLowerCase();

		var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
			/(webkit)[ \/]([\w.]+)/.exec( ua ) ||
			/(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
			/(msie) ([\w.]+)/.exec( ua ) ||
			ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
			[];

		return {
			browser: match[ 1 ] || "",
			version: match[ 2 ] || "0"
		};
	};

	matched = uaMatch( navigator.userAgent );
	browser = {};

	if ( matched.browser ) {
		browser[ matched.browser ] = true;
		browser.version = matched.version;
	}

	// Chrome is Webkit, but Webkit is also Safari.
	if ( browser.chrome ) {
		browser.webkit = true;
	} else if ( browser.webkit ) {
		browser.safari = true;
	}

	jQuery.browser = browser;
}


;(function($) {

	/**
	 * 获取GUID
	 */
	function getGUID() {
		var S4 = function() {
			return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
		};
		// return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4());
		// 防止ID以数字开头
		return 'c' + (S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4());
	}


	//  Modal窗口
	function Modal() {
		this._init();
	}
	Modal.prototype._init = function() {
		var id = getGUID();
		var modal = $('<div id="' + id + '" class="cubie modal" style="display:none;">'
			+ '<div class="modal-header">'
			+ '<button type="button" class="close js-closer" data-dismiss="modal">&times;</button>'
			+ '<h3 class="js-title"></h3>'
			+ '</div>'
			+ '<div class="modal-body js-body"></div>'
			+ '<div class="modal-footer js-footer">'
			+ '<a href="#" class="btn js-cancel">取 消</a>'
			+ '<a href="#" class="btn btn-primary js-ok">确 定</a>'
			+ '</div>'
			+ '</div>').appendTo(document.body);

		// draggable
		modal.draggable({
			// fade样式影响draggable
			start: function() {
				modal.removeClass('fade');
			},
			stop: function() {
				modal.addClass('fade');
			}
		});

		// 附加第三方组件不可拖拽元素: .uploadify
		var cancel = modal.draggable('option', 'cancel');
		cancel += ',.uploadify';
		modal.draggable('option', 'cancel', cancel);

		this.id = id;
		this.modal = modal;
		this.title = modal.find('.js-title');
		this.body = modal.find('.js-body');
		this.footer = modal.find('.js-footer');
		this.closer = modal.find('.js-closer');
		this.identifier = null; // 标识符, 用于标识每一次open是何种操作
	};
	Modal.prototype._setBtnContext = function(options) {
		if (options && $.type(options.handler) == 'function') {
			options.context = options.context || null;
			options.args = options.args || null;
		}
		return options;
	};
	Modal.prototype.open = function(options) {
		var modal = this.modal;
		var opts = {
			backdrop: false, // 遮罩
			draggable: true, // 是否可拖拽
			lockMode: false, // 锁定模式,没有按钮
			title: '提示',
			content: '', // content支持JQuery对象
			btns: {
				cancel: {
					text: '取 消',
					context: this,
					args: null,
					handler: this.close
				},
				ok: {
					text: '确 定',
					context: this,
					args: null,
					handler: this.close
				}
			}
		};

		this.identifier = ($.type(options.identifier) == 'undefined') ? null : options.identifier;

		if (options.btns) {
			this._setBtnContext(options.btns.cancel);
			this._setBtnContext(options.btns.ok);
		}
		
		$.extend(true, opts, options);
		$.extend(true, opts, {show: true});

		this.title.html(opts.title);
		this.body.html(opts.content);


		if (!opts.btns || (!opts.btns.cancel && !opts.btns.ok)) {
			this.footer.hide();
		} else {
			var btn = modal.find('.js-cancel');
			if (!opts.btns.cancel) {
				btn.hide();
			} else {
				btn.html(opts.btns.cancel.text);
				btn[0].onclick = function() {
					opts.btns.cancel.handler.apply(opts.btns.cancel.context || null, opts.btns.cancel.args || []);
					return false;
				};
				btn.show();
			}

			var btn = modal.find('.js-ok');
			if (!opts.btns.ok) {
				btn.hide();
			} else {
				btn.html(opts.btns.ok.text);
				btn[0].onclick = function() {
					opts.btns.ok.handler.apply(opts.btns.ok.context || null, opts.btns.ok.args || []);
					return false;
				};
				btn.show();
			}

			this.footer.show();
		}

		// closer handler
		if (opts.btns.closer && $.type(opts.btns.closer.handler) == 'function') {
			this.closer[0].onclick = function() {
				opts.btns.closer.handler.apply(opts.btns.closer.context || null, opts.btns.closer.args || []);
				return false;
			};
		} else {
			this.closer[0].onclick = function() {};
		}

		// 锁定模式
		if (opts.lockMode) {
			this.closer.hide();
			this.footer.hide();
		} else {
			this.closer.show();
			this.footer.show();
		}

		// draggable
		modal.draggable(opts.draggable ? 'enable' : 'disable');

		modal.modal(opts);
	};
	Modal.prototype.close = function() {
		this.isOpen() && this.modal.modal('hide');
	};
	/**
	 * 是否处于开启状态
	 */
	Modal.prototype.isOpen = function() {
		return (this.modal.css('display') == 'block');
	};
	/**
	 * 寻找Modal插入内容的节点
	 * @param {String} selector
	 * @return {Object}
	 */
	Modal.prototype.find = function(selector) {
		return this.body.find(selector);
	};


	var _Modal = new Modal();


	// 扩展
	$.extend({
		Modal: Modal,

		/**
		 * 返回公用Modal实例
		 * @return {Object}
		 */
		getModalInstance: function() {
			return _Modal;
		},

		/**
		 * 提示
		 * @param {String} content
		 */
		showTips: function(content) {
			_Modal.open({
				backdrop: true,
				draggable: false,
				content: content,
				btns: {
					cancel: false,
					ok: {
						handler: function() {
							_Modal.close();
						}
					}
				}
			});
		},
		
		/**
		 * 确认
		 * @param {String} content
		 * @param {Function} callback
		 * @param {Object} options
		 */
		showConfirm: function(content, callback, options) {
			options = options || {};

			_Modal.open({
				title: options.title,
				backdrop: true,
				draggable: false,
				content: content,
				btns: {
					cancel: {
						handler: function() {
							_Modal.close();
						}
					},
					ok: {
						handler: function() {
							_Modal.close();
							callback && callback();
						}
					}
				}
			});
		},

		/**
		 * 申请审批
		 * @param {Int} id
		 * @param {String} [title]
		 * @param {String} [handler]
		 */
		applyAudit: function(id, title, handler) {
			var content = '<form id="frm_app_apply" name="frm_app_apply" method="post" action="/index.php/Project/applyAudit" autocomplete="off">'
				+ '<input type="hidden" name="id" value="' + id + '" />'
				+ '<div class="row-fluid">'
				+ '<textarea name="msg" placeholder="申请说明" class="span12" rows="5"></textarea>'
				+ '</div>'
				+ '</form>';

			_Modal.open({
				title: title || '申请审批',
				content: content,
				btns: {
					ok: {
						handler: function() {
							var form = $('#frm_app_apply');
							var val = $.trim(form.find('[name="msg"]').val());
							// 为空时不处理
							if (val) {
								var result = handler(form, val);
								// 返回true时, 关闭弹层
								result && _Modal.close();
							}
						}
					}
				}
			});

			$('#frm_app_apply').find('[name="msg"]').focus();
		},

		/**
		 * 审批
		 * @param {Int} id
		 * @param {String} [title]
		 */
		setAudit: function(id, title, pass, reject) {
			var content = '<form id="frm_app_apply" name="frm_app_apply" method="post" action="/index.php/Project/setAudit" autocomplete="off">'
				+ '<input type="hidden" name="id" value="' + id + '" />'
				+ '<input type="hidden" name="type" value="" />'
				+ '<div class="row-fluid">'
				+ '<textarea name="msg" placeholder="审批意见" class="span12" rows="5">OK</textarea>'
				+ '</div>'
				+ '</form>';

			var handler = function(fn) {
				var form = $('#frm_app_apply');
				var val = $.trim(form.find('[name="msg"]').val());
				// 为空时不处理
				if (val) {
					var result = fn(form, val);
					// 返回true时, 关闭弹层
					result && _Modal.close();
				}
			};

			_Modal.open({
				title: title || '审批意见',
				content: content,
				btns: {
					cancel: {
						text: '驳 回',
						handler: function() {
							var form = $('#frm_app_apply');
							form.find('[name="type"]').val(0);
							handler(reject);
						}
					},
					ok: {
						text: '通 过',
						handler: function() {
							var form = $('#frm_app_apply');
							form.find('[name="type"]').val(1);
							handler(pass);
						}
					}
				}
			});

			$('#frm_app_apply').find('[name="msg"]').focus();
		},

		/**
		 * 转换特殊符号为html实体符
		 * @param {String} str
		 * @param {String}
		 */
		htmlspecialchars: function(str) {
			return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		},

		/**
		 * 将序列化的表单数组转换为JSON. 同名的会被覆盖
		 * @return {Object}
		 */
		serializeArrayToJSON: function(array) {
			var result = {};
			$.each(array, function(k, v) {
				result[v.name] = v.value;
			});
			return result;
		},

		/**
		 * 只执行一次函数
		 * @param {Function} fn
		 * @return {Function}
		 */
		once: function(fn) {
			return function() { 
				try { 
					fn && fn.apply(this, arguments); 
				} catch (e) {  
					throw e; // 防止首次执行时产生异常
				} finally { 
					fn = null; 
				} 
			};
		},
	
		/**
		 * 模拟表单提交
		 * @param {String} url
		 * @param {Object} data
		 * @param {String} [method:post]
		 */
		doForm: function(url, data, method) {
			method = method || 'post';
			var field = '';
			$.each(data, function(k, v) {
				field += '<input type="hidden" name="' + k + '" value="' + v + '" />';
			});
			var form = $('<form name="' + (+new Date()) + '" action="' + url + '" method="' + method + '" style="display:none;">' + field + '</form>');
			form.appendTo(document.body).submit();
		},

		/**
		 * 获取节点自身HTML
		 */
		selfHtml: function(obj) {
			return $('<p>').append($(obj).clone()).html();
		},

		/**
		 * 获取GUID
		 */
		getGUID: getGUID,

		/**
		 * 获取组件style
		 * @param {Object} obj 
		 * @return {Object}
		 */
		getStyleData: function(obj) {
			var css = $.trim($(obj).attr('style')).split(';'),
				data = {};

			$.each(css, function(k, v) {
				v = v.split(':');
				var key = $.trim(v[0]);
				if (key) {
					data[key] = $.trim(v[1] || '');
				}
			});

			return data;
		},

		/**
		 * 将样式中的颜色转换为Hex
		 */
		RGBToHex: function(str) {
			var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
			if (/^(rgb|RGB)/.test(str)) {
				var hex = [];
				var rgb = str.replace(/(?:\(|\)|rgb|RGB)*/g, '').split(',');
				$.each(rgb, function(k, v) {
					hex[k] = parseInt(v, 10).toString(16);
					if (hex[k].length == 1) {
						hex[k] = '0' + hex[k];
					}
				});
				return hex.join('');
			} else if(reg.test(str)) {
				str = str.replace('#', '').split('');
				if (str.length === 6) {
					return str;	
				} else if (str.length === 3) {
					var r = '#';
					$.each(str, function(k, v) {
						r += v + '' + v;
					});
					return r;
				}
			}
			return str;
		}
	});


	$(function() {
		// 只建议在chrome下使用
		if (!$.browser.chrome) {
			window.location.href = '/index.php/Public/err/s/' + encodeURIComponent('请使用最新版Chrome进行操作~');
		}
	});
	
})(jQuery);
