/**
 * 布局编辑
 *
 * 注意：基于提取方便原则,请将不需要提取的样式放到样式文件里定义,内联样式一般用于提到CSS文件使用
 *
 * @author: Zawa
 *
 * [Ref]
 * jQuery上传插件uploadify中文开发文档    http://www.muxi.me/web/jquery/295.html
 * uploadify 参数列表   http://www.pooy.net/uploadify-parameters.html
 * jQuery.Validate   http://www.cnblogs.com/weiqt/articles/2013800.html
 * jQuery验证控件jquery.validate.js使用说明+中文API    http://www.cnblogs.com/hejunrex/archive/2011/11/17/2252193.html
 * jQuery Form Plugin    https://github.com/malsup/form
 * jQuery contextMenu    http://medialize.github.io/jQuery-contextMenu/demo.html
 * CSS z-index 属性的使用方法和层级树的概念   http://www.neoease.com/css-z-index-property-and-layering-tree/
 * jQuery Caret (jCaret) Plugin - determine or set caret position   http://www.examplet.buss.hk/jquery/caret.php
 * Editing events for contentEditable   http://codebits.glennjones.net/editing/events-contenteditable.htm
 */

$(function() {

	var _layout = $('#cubie_layout_body'), // 布局body
		_layoutWrapper = $('#cubie_layout_wrapper'), // 布局
		_layoutTplSubstrate = $('#cubie_layout_tpl_substrate'), // 项目模板映射
		_blockPanelTpl = $('#cubie_modal_block_tpl'), // 区块面板模版
		_modulePanelTpl = $('#cubie_modal_module_tpl'), // 组件面板模版
		_projectPanel = $('#cubie_modal_project'), // 项目属性面板
		_layoutPanel = $('#cubie_modal_layout'), // 布局属性面板
		_outputPanel = $('#cubie_modal_output'), // 预览/输出设置面板
		_globalHtmlPanel = $('#cubie_modal_global_html'), // 编辑全局HTML面板
		_CodeMirror = {}, // CodeMirror实例引用
		_coord = $('#cubie_coord'), // 坐标值
		_tips = $('#cubie_tips'), // 提示
		_coordinateX = $('#cubie_coordinate_x'), // X坐标
		_coordinateY = $('#cubie_coordinate_y'), // Y坐标
		_sidebarWrapper = $('#cubie_sidebar_wrapper'), // 侧边栏
		_sidebarToggle = $('#cubie_sidebar_toggle'); // 侧边栏开关
		

	var _projectTplData = {}, // 项目模板相关数据
		_projectJSON = { // 项目相关数据(缺省值配置)
			// 项目属性(缺省由后台输出)
			Project: {
			
			},
			// 布局属性
			Layout: {
				// 不要在此设置layout_width与layout_height,因为首次使用时需要取模版宽高
				'slices_height': 200,
				'bg_quality': 80,
				'bg_align': 'center',
				'bg_repeat': 'no-repeat'
			},
			// 预览/输出设置
			Output: {
				'layout_zindex': '',
				'bg_zindex': -1, // 缺省的背景层叠
				'file_suffix': 'shtml', // 缺省的文件后缀
				'css_lnk': 0, // 缺省不生成外链css
				'js_lnk': 0 // 缺省不生成外链js
			},
			// 全局额外设置
			Global: {
				css: '', // 全局CSS
				js: '' // 全局Js
			}
		},
		_requiredFeature = [], // 必须的系统特性
		_layoutOffsetTop = _layout.offset().top, // 布局区域距离顶部高度
		_sidebarWidth = _sidebarWrapper.width(), // 侧边栏宽度
		_layoutWrapperOffsetLeft = 0, // 可编辑布局区域(_layoutWrapper)距离文档(_layout)左侧距离
		_moduleInitWidth = 180, // 组件初始宽度
		_moduleInitHeight = 100, // 组件初始高度
		_moveStep = 10, // Ctrl下移动像素步进, px
		_autoSaveTime = 8 * 60; // 自动保存草稿时间, 单位: 秒

	// 新开窗口时的提示
	var _newWinTips = '<div style="position: absolute; top: 0; left: 50%; z-index:99999; margin-left: -100px; width: 200px; height: 30px; line-height: 30px; background-color: #ebb70e; color: #fff; text-align:center; font-size:12px;">处理中，请稍后...</div>';

	var _showGridLine =  true, // 是否显示网格线
		_showCoordinateLine = true, // 是否显示坐标线
		_showTplSubstrate = true, // 显示项目模板衬底
		_showTplSubstrateBlock = false, // 显示项目模板衬底区块
		_alertTimer = null, // alert定时器
		_blockStatus = null, // 区块按下Ctrl时的状态
		_ghostStatus = null, // ghost模式下的ghost状态
		_editMode = false, // 组件编辑状态
		_exitWithoutConfirm = false; // 退出无需确认

		
	// 发布状态
	var PubStatus = {
		INIT: 0, // 待发布
		PREPUB: 1, // 预发布
		PUB: 2 // 正式发布
	};
	
	// 审批状态
	var AuditStatus = {
		INIT: 0, // 默认
		TOCHECK: 1, // 待编辑审批
		CHECKED: 2, // 已编辑审批
		REJECT: 3, // 驳回编辑申请
		TOCHECK_PUB: 4, // 待正式发布审批
		CHECKED_PUB: 5, // 已正式发布审批
		REJECT_PUB: 6 // 驳回正式发布申请
	};

	var _Toast = $.Layout.Toast;
	var _Modal = $.getModalInstance(); // 与公用接口使用同一个Modal实例,避免多个Modal状态干扰

	var __MODULE_API__ = {}; // 组件API实例


	/**
	 * 锁定模式的Modal
	 */
	function showLockModal(content) {
		_Modal.open({
			content: content,
			backdrop: 'static',
			lockMode: true
		});
	}

	/**
	 * 显示操作提示
	 */
	function showHints(tips, error) {
		tips = error ? '<span style="color:red;">' + error + '</span>' : tips;
		_tips.html(tips);
	}

	/**
	 * 是否百分比
	 */
	function isPercent(val) {
		return /^\d+(?:\.\d*)?%$/.test(val);
	}

	/**
	 * 重置(初始化)
	 */ 
	function reset(e) {
		_layoutWrapperOffsetLeft = Math.max(0, _layoutWrapper.offset().left);

		var windowWidth = $(window).width();
		var windowHeight = $(window).height();

		// 若当前布局宽度大于浏览器可见区域宽度,则调整背景、衬底的宽度为布局宽度
		var selfAdaptionWidth = isPercent(_projectJSON.Layout.layout_width)
			? windowWidth // 百分比(不可超过100%)时取当前窗口宽度
			: Math.max(windowWidth, _projectJSON.Layout.layout_width);

		// 项目区&项目模板衬底高度
		_layout.width(selfAdaptionWidth);
		_layout.height(_projectJSON.Layout.layout_height);
		_layoutTplSubstrate.width(selfAdaptionWidth);
		_layoutTplSubstrate.height(_projectJSON.Layout.layout_height);

		// 衬底页面宽度适应当前窗口宽度变化,防止衬底不适配
		var iframeDocBd = _layoutTplSubstrate[0].contentWindow.document.body;
		iframeDocBd.style.width = selfAdaptionWidth + 'px';
		iframeDocBd.style.height = _projectJSON.Layout.layout_height + 'px';

		// 初始化坐标线
		_coordinateX.width(selfAdaptionWidth);
		_coordinateY.height(_projectJSON.Layout.layout_height);

		// 调整光标位置
		e && moveCoordinate(e);

		// 初始化侧边栏
		_sidebarWrapper.css({
			// top: _layoutOffsetTop,
			height: (windowHeight - _layoutOffsetTop - 40)
		});

		// 初始化侧边栏开关
		_sidebarToggle.css({
			top: _layoutOffsetTop,
			height: (_projectJSON.Layout.layout_height - _layoutOffsetTop)
		});
	}

	/**
	 * 坐标线
	 */ 
	function moveCoordinate(e) {
		if (_showCoordinateLine) {
			var x = e.pageX,
				y = e.pageY - _layoutOffsetTop;

			_coordinateX.css({
				'-moz-transform': 'translateY(' + y + 'px)',
				'-webkit-transform': 'translateY(' + y + 'px)',
				'transform': 'translateY(' + y + 'px)',
			});
			_coordinateY.css({
				'-moz-transform': 'translateX(' + x + 'px)',
				'-webkit-transform': 'translateX(' + x + 'px)',
				'transform': 'translateX(' + x + 'px)'
			});
		}

		_coord.html('X=' + (e.pageX - _layoutWrapperOffsetLeft) + '; Y=' + (e.pageY - _layoutOffsetTop));	
	}

	/**
	 * 隐藏坐标线
	 */
	function hideCoordinate() {
		_coordinateX.hide();
		_coordinateY.hide();
	}

	/**
	 * 隐藏坐标线
	 */
	function showCoordinate() {
		_coordinateX.show();
		_coordinateY.show();
	}

	/**
	 * 网格线
	 */
	function toggleGridLine(t, init) {
		_showGridLine = init ? !_showGridLine : _showGridLine;
		if (_showGridLine) {
			_layoutWrapper.removeClass('cubie-layout-gridline');
			t.addClass('icon-white cubie-icon-on').attr('title', '显示网格线');
			_showGridLine = false;
		} else {
			_layoutWrapper.addClass('cubie-layout-gridline');
			t.removeClass('icon-white cubie-icon-on').attr('title', '隐藏网格线');
			_showGridLine = true;
		}
	}

	/**
	 * 坐标线
	 */
	function toggleCoordinateLine(t, init) {
		_showCoordinateLine = init ? !_showCoordinateLine : _showCoordinateLine;
		if (_showCoordinateLine) {
			hideCoordinate();
			t.addClass('icon-white cubie-icon-on').attr('title', '显示坐标线');
			_showCoordinateLine = false;
		} else {
			showCoordinate();
			t.removeClass('icon-white cubie-icon-on').attr('title', '隐藏坐标线');
			_showCoordinateLine = true;
		}
	}

	/**
	 * 项目模板衬底
	 */
	function toggleTplSubstrate(t, init) {
		_showTplSubstrate = init ? !_showTplSubstrate : _showTplSubstrate;
		if (_showTplSubstrate) {
			_layoutTplSubstrate.hide();
			t.addClass('icon-white cubie-icon-on').attr('title', '显示项目模板衬底');
			_showTplSubstrate = false;
		} else {
			_layoutTplSubstrate.show();
			t.removeClass('icon-white cubie-icon-on').attr('title', '隐藏项目模板衬底');
			_showTplSubstrate = true;
		}
	}

	/**
	 * 项目模板衬底区块
	 */
	function toggleTplSubstrateBlock(t, init) {
		// 模板衬底隐藏时不处理
		if (!_showTplSubstrate) {
			return false;
		}

		_showTplSubstrateBlock = init ? !_showTplSubstrateBlock : _showTplSubstrateBlock;
		if (_showTplSubstrateBlock) {
			$.each(_projectTplData.blocks, function(k, v) {
				$(v.block).hide();
			});
			t.addClass('icon-white cubie-icon-on').attr('title', '显示衬底区块');
			_showTplSubstrateBlock = false;
		} else {
			$.each(_projectTplData.blocks, function(k, v) {
				$(v.block).show();
			});
			t.removeClass('icon-white cubie-icon-on').attr('title', '隐藏衬底区块');
			_showTplSubstrateBlock = true;
		}
	}

	/**
	 * 禁用右键菜单
	 */
	function disableContextMenu() {
		$.contextMenu({
			trigger: 'none',
			selector: 'body',
			build: function(trigger, e) {
				return function() {};
			}
		});
	}

	/**
	 * 为draggable对象附加第三方组件不可拖拽元素
	 */
	function fixDraggableCancel(target) {
		var cancel = target.draggable('option', 'cancel');
		cancel += ',.uploadify,.CodeMirror';
		target.draggable('option', 'cancel', cancel);
	}


	/**
	 * 关闭侧边栏
	 */
	function closeSidebar() {
		_sidebarWrapper.animate({
			width: 0
		}, {
			duration: 300,
			complete: function() {
				_sidebarWrapper.hide();
				_sidebarToggle.fadeIn();
			}
		});
	}

	/**
	 * 展开侧边栏
	 */
	function openSidebar() {
		_sidebarToggle.fadeOut();
		_sidebarWrapper.show();
		_sidebarWrapper.animate({
			width: _sidebarWidth + 'px'
		}, {
			duration: 300
		});
	}

	/**
	 * 组件源是否存在
	 * @param {Int} moduleSourceID
	 * @return {Boolean}
	 */
	function isModuleSourceExist(moduleSourceID) {
		var prefix = '#module_source_' + moduleSourceID + '_';
		return $(prefix + 'title').length > 0;
	}

	/**
	 * 获取组件源信息(实体符数据获取后会自动转义)
	 * @param {Int} moduleSourceID
	 * @return {Object|False}
	 */
	function getModuleSourceInfo(moduleSourceID) {
		try {
			var prefix = '#module_source_' + moduleSourceID + '_',
				title = $.trim($(prefix + 'title').val()),
				html = $.trim($(prefix + 'html').val()),
				css = $.trim($(prefix + 'css').val()),
				js = $.trim($(prefix + 'js').val()),
				featureJs = $.trim($(prefix + 'feature_js').val()),
				feature =$.trim($(prefix + 'feature').val());

			feature = feature ?  $.parseJSON(feature) : {};

			return {
				title: title,
				html: html,
				css: css,
				js: js,
				featureJs: featureJs,
				feature: feature
			};	
		} catch (e) {
			return false;
		}
	}

	/**
	 * 从DOM节点获取并解析JSON数据
	 */
	function getJSON(obj) {
		var json = $.trim($(obj).val());
		try {
			json = JSON.parse(json);
		} catch (e) {
			json = {};
		}
		return json;
	}

	/**
	 * 写项目JSON(深度克隆方式)
	 * @param {String|Object} name
	 * @param {*} value
	 */
	function setProjectJSON(name, value) {
		if ($.type(name) == 'object') {
			$.extend(true, _projectJSON, name); // extend方式,防止重置所有
		} else if ($.type(name) == 'string') {
			$.extend(true, _projectJSON[name], value);
		}
	}

	/**
	 * 缓存项目JSON
	 */
	function cacheProjectJSON() {
		var resource = $.Layout._resource(),
			json;

		_projectJSON._resourceToPublish = resource;

		json = JSON.stringify(_projectJSON);
		$('#cubie_project_json').val(json).html(json);
	}

	/**
	 * 项目属性面板
	 */
	function toggleProjectPanel() {
		_projectPanel.modal({
			backdrop: false
		});

		// 根据缓存恢复表单数据
		initForm(_projectPanel, _projectJSON.Project);
	}

	/**
	 * 布局属性面板
	 */
	function toggleLayoutPanel() {
		_layoutPanel.modal({
			backdrop: false
		});

		// 根据缓存恢复表单数据
		initForm(_layoutPanel, _projectJSON.Layout);
	}

	/**
	 * 预览/输出设置面板
	 */
	function toggleOutputPanel() {
		_outputPanel.modal({
			backdrop: false
		});

		// 根据缓存恢复表单数据
		initForm(_outputPanel, _projectJSON.Output);
	}

	/**
	 * 全局HTML/CSS/Javascript
	 */
	function toggleGlobalHtml() {
		_globalHtmlPanel.modal({
			backdrop: false
		});

		// 根据缓存恢复表单数据
		initForm(_globalHtmlPanel, {
			html: _projectJSON.Global.html,
			css: _projectJSON.Global.css,
			js: _projectJSON.Global.js
		});

		// 更新CodeMirror的值
		_CodeMirror.html.doc.setValue(_projectJSON.Global.html);
		_CodeMirror.css.doc.setValue(_projectJSON.Global.css);
		_CodeMirror.js.doc.setValue(_projectJSON.Global.js);
	}

	/**
	 * 根据name初始化表单
	 */
	function initForm(form, data) {
		$.each(data, function(k, v) {
			var field = form.find('[name="' + k + '"]'),
				type = field.attr('type');
			
			switch (type) {
				case 'checkbox':
					field.prop('checked', (field.val() == v));
					break;
				default:
					field.val(v);
					break;
			}
		});
	}

	/**
	 * 初始化项目全局信息
	 */
	function initProject() {
		// 获取项目JSON配置
		var textarea = $('#cubie_project_json');

		// 首次使用,初始化JSON配置
		if (textarea.length < 1) {
			textarea = $('<textarea id="cubie_project_json" class="cubie-redundant-dom-inner" style="display:none;"></textarea>').appendTo(_layout);
		}

		// 1)
		// 由于项目属性JSON信息首次使用时是由后台输出的,这里先初始化项目属性JSON配置
		// 而且由于缩略图上传时实时写入文件缓存(project.cache),所以项目缩略图以project.cache为准
		var data = $.serializeArrayToJSON(_projectPanel.find('form').serializeArray());
		setProjectJSON('Project', data);

		// 2) 再合并JSON缓存与当前JSON配置
		setProjectJSON(getJSON(textarea));


		// 对JSON配置中的某些值做特殊处理
		var layout_width = ($.type(_projectJSON.Layout.layout_width) != 'undefined') ? _projectJSON.Layout.layout_width : _projectTplData.width || 960;
		var layout_height = ($.type(_projectJSON.Layout.layout_height) != 'undefined') ? _projectJSON.Layout.layout_height : _projectTplData.height || 640;

		setProjectJSON('Layout', {
			'layout_width': layout_width,
			'layout_height': layout_height
		});


		// 初始化需发布的资源
		$.Layout._resource(_projectJSON._resourceToPublish || []);

		// 获取系统required特性
		var features = $.Feature.get();
		$.each(features, function(k, v) {
			if ($.inArray('required', v.property) != -1) {
				_requiredFeature.push(k);
			}
		});

		// 恢复背景色
		if (_projectJSON.Layout.bg_color) {
			updateBgColor(_projectJSON.Layout.bg_color);
		}

		// 初始化布局编辑区
		if (isPercent(_projectJSON.Layout.layout_width)) {
			// 百分比布局
			_layoutWrapper.css({
				'position': 'absolute',
				'top': 0,
				'left': '50%',
				'margin-left': '-' + (parseInt(_projectJSON.Layout.layout_width, 10) / 2) + '%',
				'width': _projectJSON.Layout.layout_width,
				'height': _projectJSON.Layout.layout_height
			});
		} else {
			_layoutWrapper.css({
				'position': 'absolute',
				'top': 0,
				'left': '50%',
				'margin-left': '-' + (_projectJSON.Layout.layout_width / 2) + 'px',
				'width': _projectJSON.Layout.layout_width,
				'height': _projectJSON.Layout.layout_height
			});	
		}

		// 初始化项目属性
		initProjectPanel();

		// 初始化布局属性
		initLayoutPanel();

		// 初始化预览/输出设置面板
		initOutputPanel();

		// 初始化编辑全局Html/CSS/JS
		initGlobalHtml();

		// 恢复背景
		updateLayoutBg();
	}

	/**
	 * 初始化项目属性
	 */
	function initProjectPanel() {
		// 日期校验
		$.validator.addMethod('checkSDate', function(value, element) {
			var sDate = $('#project_s_date').val(),
				eDate = $('#project_e_date').val(),
				sTime = $('#project_s_time').val();

			return !(!sDate && (eDate || sTime));
		}, '请选择开始日期');

		$.validator.addMethod('checkEDate', function(value, element) {
			var sDate = $('#project_s_date').val(),
				eDate = $('#project_e_date').val()
				eTime = $('#project_e_time').val();

			return !(!eDate && (sDate || eTime));
		}, '请选择结束日期');

		$.validator.addMethod('checkDateRange', function(value, element) {
			var sDate = $('#project_s_date').val().replace(/-/g, '') - 0,
				eDate = $('#project_e_date').val().replace(/-/g, '') - 0;

			return (eDate >= sDate);
		}, '开始时间不能大于结束时间');

		// 时间
		$.validator.addMethod('checkTime', function(value, element) {
			var time = value.split(':');
			return (value == 0 || (time.length = 3 && /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value)));
		}, '时间格式有误');

		// 表单校验
		var validator = _projectPanel.find('form').validate({
			errorElement: 'span',
			errorPlacement: function(error, element) {
				var name = element.attr('name');
				switch (name) {
					case 'project_s_date':
					case 'project_e_date':
						error.insertAfter(element.parent());
						break;
					default:
						error.insertAfter(element);
						break;
				}
			},
			rules: {
				project_title: {
					required: true
				},
				project_intro: {
					required: true
				},
				project_s_date: {
					dateISO: true,
					checkSDate: true
				},
				project_s_time: {
					checkTime: true
				},
				project_e_date: {
					dateISO: true,
					checkEDate: true,
					checkDateRange: true
				},
				project_e_time: {
					checkTime: true
				}
			},
			messages: {
				project_title: {
					required: '请输入项目名称'
				},
				project_intro: {
					required: '请输入项目描述'
				}
			},
			submitHandler: function(form) {
				form = $(form);
				// serializeArray: disabled、不含name的、没选中的checkbox或者radio都不获取
				var data = $.serializeArrayToJSON(form.serializeArray());

				// 更新JSON
				setProjectJSON('Project', data);

				// 关闭modal
				_projectPanel.modal('hide');
				return false;
			}
		});

		// 上传缩略图
		$('#project_tpl_thumbnail').uploadify({
			auto: true, // 自动上传
			swf: '/Public/Home/Js/uploadify/uploadify.swf',
			buttonText: '选择图片',
			width: 100, // 按钮宽度
			height: 25, // 按钮高度
			multi: false, // 不支持多图片上传
			fileObjName: 'thumbnail',
			formData: {
				id: __project__.id,
				action: 'upload_tpl_thumbnail'
			},
			uploader: '/index.php/Project/layout',
			fileTypeDesc: '支持的格式',
			fileTypeExts: '*.jpg;*.jpge;*.gif;*.png',
			fileSizeLimit: '1MB',
			onUploadStart: function() {
				// 上传时锁定
				_projectPanel.find('button[type="submit"]').attr('disabled', true);
			},
			onUploadSuccess: function(file, data, response) {
				var json = JSON.parse(data);
				var rc = parseInt(json.retcode, 10);
				if (rc == 0) {
					$('#project_thumbnail').val(json.file.path); // 存储根路径即可
					initProjectThumb(json.file.path);
				} else {
					$.showTips(json.retmsg);
				}
				// 上传完毕后方可下一步
				_projectPanel.find('button[type="submit"]').attr('disabled', false);
			}
		});
		
		function initProjectThumb(path) {
			if (path) {
				$('#project_thumbnail_img').html('<a id="project_thumbnail_remove" class="close" href="#" title="移除此缩略图">&times;</a><img src="' + path + '" class="img-polaroid" style="max-width:400px;" />');
				$('#project_thumbnail_remove').click(removeProjectThumb);	
			}
		}

		// 移除当前缩略图
		function removeProjectThumb(e) {
			$('#project_thumbnail').val('');
			$('#project_thumbnail_img').html('');

			// 发送异步请求,删除缩略图缓存
			$.ajax({
				type: 'POST',
				dataType: 'json',
				url: '/index.php/Project/layout/',
				data: {
					id: __project__.id,
					action: 'del_project_thumbcache'
				},
				success: function(data) {
					// 删除缓存不处理回调
				}
			});

			return false;
		}

		// 开始结束时间
		var dpConf = {
			showAnim: 'drop',
			prevText: '上个月',
			nextText: '下个月',
			monthNamesShort: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
			dayNames: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
			dayNamesMin: ['日', '一', '二', '三', '四', '五', '六'],
			changeMonth: true,
			changeYear: true,
			yearRange: ':c+2',
			dateFormat: 'yy-mm-dd',
			minDate: 0,
			onClose: function() {
				// 失焦触发校验
				$('#project_s_date').blur();
				$('#project_e_date').blur();
			}
		};

		function clearDate(e) {
			e.preventDefault();
			var t = $(e.currentTarget),
				id = t.attr('id');

			if (id == 'btn_clear_sdate') {
				$('#project_s_date').val('');
			} else {
				$('#project_e_date').val('');
			}
		}

		$('#project_s_date').datepicker(dpConf);
		$('#project_e_date').datepicker(dpConf);
		$('#btn_clear_sdate').click(clearDate);
		$('#btn_clear_edate').click(clearDate);

		
		// 恢复缩略图
		initProjectThumb(_projectJSON.Project.project_thumbnail);

		// 项目属性面板可拖拽
		_projectPanel.draggable({
			// fade样式影响draggable
			start: function() {
				_projectPanel.removeClass('fade');
			},
			stop: function() {
				_projectPanel.addClass('fade');
			}
		});
		fixDraggableCancel(_projectPanel);
	}

	/**
	 * 更新背景色
	 */
	function updateBgColor(hex) {
		// 使用background而非background-color,防止初始样式设置了背景图后不生效
		_layout.css('background', hex ? '#' + hex : '');
	}

	/**
	 * 初始化布局属性面板
	 */
	function initLayoutPanel() {
		// 正整数&百分比
		$.validator.addMethod('checkIntPencent', function(value, element) {
			value = $.trim(value);
			if (value) {
				if (isPercent(value)) { // 百分比布局,<=100%
					value = Math.min(Math.abs(parseInt(value, 10)), 100) + '%';
				} else {
					value = Math.abs(parseInt(value, 10)) || '';
				}
			}
			$(element).val(value);
			return true;
		}, '');

		// 整数
		$.validator.addMethod('checkInt', function(value, element, range) {
			value = $.trim(value);
			if (value) {
				value = /-\d*/.test(value) ? value : parseInt(value, 10);
				if ($.isNumeric(value) && $.type(range) == 'array') {
					value = Math.max(value, range[0]);
					if (range[1]) {
						value = Math.min(value, range[1]);
					}
				}
				$(element).val(value);
			}
			return true;
		}, '');

		// 布局属性表单
		_layoutPanel.find('form').validate({
			// errorElement: 'span',
			// errorPlacement: function(error, element) {
			// 	error.insertAfter(element.parent());
			// },
			onkeyup: false, // keyup时不触发
			rules: {
				layout_width: { // 宽度支持百分比
					checkIntPencent: true
				},
				layout_height: { // 高度不能百分比
					checkInt: [0]
				},
				slices_height: {
					checkInt: [1]
				},
				bg_quality: {
					checkInt: [0, 100]
				}
			},
			submitHandler: function(form) {
				form = $(form);
				// serializeArray: disabled、不含name的、没选中的checkbox或者radio都不获取
				var data = $.serializeArrayToJSON(form.serializeArray());

				// 为空时的默认值
				data.layout_width = data.layout_width || '100%';
				data.layout_height = data.layout_height || _projectJSON.Layout.layout_height;
				data.bg_quality = data.bg_quality || '80';

				if (isPercent(data.layout_width)) {
					_layoutWrapper.width(data.layout_width)
						.css('margin-left', '-' + (parseInt(data.layout_width, 10) / 2) + '%');	
				} else {
					_layoutWrapper.width(data.layout_width)
						.css('margin-left', '-' + (data.layout_width / 2) + 'px');	
				}
				_layoutWrapper.height(data.layout_height);
				
				// 更新JSON
				setProjectJSON('Layout', data);

				// 更新表单值
				initForm(form, _projectJSON.Layout);

				// 背景居中平铺等重置
				updateLayoutBg();

				// 重置相关变量初始值
				reset();

				// 关闭modal
				_layoutPanel.modal('hide');
				return false;
			}
		});

		// 初始化布局属性背景图
		initLayoutBg(_projectJSON.Layout.bg_list || []);

		// 上传背景图
		var obj = $('#layout_bg_init');
		obj.uploadify({
			auto: true, // 自动上传
			swf: '/Public/Home/Js/uploadify/uploadify.swf',
			buttonText: '选择图片',
			width: 100, // 按钮宽度
			height: 25, // 按钮高度
			multi: false, // 不支持多图片上传
			fileObjName: 'layout_bg_file',
			// formData: formData,
			uploader: '/index.php/Project/layout',
			fileTypeDesc: '支持的格式',
			fileTypeExts: '*.jpg;*.jpeg;*.gif;*.png',
			fileSizeLimit: '5MB',
			onUploadStart: function() {
				var form = _layoutPanel.find('form'),
					data = $.serializeArrayToJSON(form.serializeArray());

				obj.uploadify('settings', 'formData', {
					action: 'upload_layout_bg',
					id: __project__.id,
					slices_height: data.slices_height,
					bg_quality: data.bg_quality
				});

				// 上传时锁定确定按钮
				form.find('button').attr('disabled', true);
			},
			onUploadSuccess: function(file, data, response) {
				var json = JSON.parse(data),
					rc = parseInt(json.retcode, 10),
					form = _layoutPanel.find('form');

				if (rc == 0) {
					initLayoutBg(json.file);

					// 上传完毕立即更新背景图
					updateLayoutBg();
				} else {
					$.showTips(json.retmsg);
				}

				form.find('button').attr('disabled', false);
			}
		});

		// 背景图拖动排序
		$('#layout_bg_list').sortable({
				cursor: 'move',
				stop: function() {
					// 排序完毕更新背景
					updateLayoutBg();
				}
			})
			.disableSelection();

		// 背景色选择
		$('#bg_color').ColorPicker({
				onSubmit: function(hsb, hex, rgb, el) {
					$(el).val(hex);
					$(el).ColorPickerHide();
				},
				onBeforeShow: function () {
					$(this).ColorPickerSetColor(this.value);
				},
				onChange: function(hsb, hex, rgb) {
					$('#bg_color').val(hex);
					// 实时反馈到布局背景色
					updateBgColor(hex);
				}
			})
			.bind('keyup', function() {
				$(this).ColorPickerSetColor(this.value);
			})
			.on('input', function(e) {
				var hex = $.trim($(this).val());
				// 实时反馈到布局背景色
				updateBgColor(hex);
			});

		// 综合设置面板可拖拽
		_layoutPanel.draggable({
			// fade样式影响draggable
			start: function() {
				_layoutPanel.removeClass('fade');
			},
			stop: function() {
				_layoutPanel.addClass('fade');
			}
		});
		fixDraggableCancel(_layoutPanel);
	}

	/**
	 * 初始化预览/输出设置面板
	 */
	function initOutputPanel() {
		// 整数
		$.validator.addMethod('checkInteger', function(value, element, range) {
			value = $.trim(value);
			if (value) {
				value = /-\d*/.test(value) ? value : parseInt(value, 10);
				if ($.isNumeric(value) && $.type(range) == 'array') {
					value = Math.max(value, range[0]);
					if (range[1]) {
						value = Math.min(value, range[1]);
					}
				}
				$(element).val(value);
			}
			return true;
		}, '');

		_outputPanel.find('form').validate({
			onkeyup: false, // keyup时不触发
			rules: {
				layout_zindex: {
					checkInteger: true
				},
				bg_zindex: {
					checkInteger: true
				}
			},
			submitHandler: function(form) {
				form = $(form);
				var data = $.serializeArrayToJSON(form.serializeArray());
				
				data.file_suffix = data.file_suffix || 'shtml';
				// 去掉首个点号
				if(data.file_suffix.substr(0, 1) == '.') {
					data.file_suffix = data.file_suffix.substr(1);
				}
				data.css_lnk = parseInt(data.css_lnk, 10) || 0;
				data.js_lnk = parseInt(data.js_lnk, 10) || 0;

				// 更新JSON
				setProjectJSON('Output', data);

				// 更新背景层叠关系
				updateLayoutBg();

				// 关闭modal
				_outputPanel.modal('hide');
				return false;
			}
		});

		// 综合设置面板可拖拽
		_outputPanel.draggable({
			// fade样式影响draggable
			start: function() {
				_outputPanel.removeClass('fade');
			},
			stop: function() {
				_outputPanel.addClass('fade');
			}
		});
		fixDraggableCancel(_outputPanel);
	}

	/**
	 * 初始化全局Html/CSS/JS
	 */
	function initGlobalHtml() {
		// CSS
		_globalHtmlPanel.find('form').validate({
			submitHandler: function(form) {
				form = $(form);
				var data = $.serializeArrayToJSON(form.serializeArray());

				// JS语法检查
				// data.js = $.trim(data.js);
				// try {
				// 	$.globalEval('(function() {' + data.js + '})();');
				// } catch (e) {
				// 	_Toast.open('Javascript语法有误，请检查~');
				// 	return false;
				// }

				// 更新JSON
				setProjectJSON('Global', {
					html: $.trim(data.html),
					css: $.trim(data.css),
					js: $.trim(data.js)
				});

				_globalHtmlPanel.modal('hide');
				return false;
			}
		});

		// CodeMirror
		_CodeMirror.html = initCodeMirror({
			selector: _globalHtmlPanel.find('[name="html"]'),
			mode: 'text/html'
		});
		_CodeMirror.css = initCodeMirror({
			selector: _globalHtmlPanel.find('[name="css"]'),
			mode: 'text/css'
		});
		_CodeMirror.js = initCodeMirror({
			selector: _globalHtmlPanel.find('[name="js"]'),
			mode: 'text/javascript'
		});

		// 面板可拖拽
		_globalHtmlPanel.draggable({
			// fade样式影响draggable
			start: function() {
				_globalHtmlPanel.removeClass('fade');
			},
			stop: function() {
				_globalHtmlPanel.addClass('fade');
			}
		});
		fixDraggableCancel(_globalHtmlPanel);
	}

	/**
	 * CodeMirror
	 */
	function initCodeMirror(options) {
		var cmDefaultConf = {
			height: 200,
			lineNumbers: true,
			theme: 'ambiance',
			indentUnit: 4, // 缩进
			indentWithTabs: true,
			extraKeys: {
				'F11': function(cm) {
					cm.setOption('fullScreen', !cm.getOption('fullScreen'));
				},
				'Esc': function(cm) {
					if (cm.getOption('fullScreen')) {
						cm.setOption('fullScreen', false);
					}
				}
			}
		};

		// HTML
		var cmConf = {
			mode: options.mode || 'text/html'
		};
		$.extend(true, cmConf, cmDefaultConf);

		var obj = $(options.selector);
		var cm = CodeMirror.fromTextArea(obj[0], cmConf);

		cm.setSize('100%', cmConf.height);
		cm.on('keyup', function(cm, e) {
			cm.save(); // 保存数据到textarea

			if ($.type(options.keyupHandler) == 'function') {
				options.keyupHandler.apply(null, [cm, e]);
			}
		});

		return cm;
	};

	/**
	 * 生成背景图,背景色设置
	 */
	function updateLayoutBg() {
		var iframeDoc = _layoutTplSubstrate[0].contentWindow,
			bgs = $('#layout_bg_list img'),
			repeat = $('#bg_repeat').val(),
			bg_align = $('#bg_align').val(),
			zIndex = _projectJSON.Output.bg_zindex,
			initData = [],
			images = [],
			tpl = '';

		zIndex = (zIndex === '') ? -1 : parseInt(zIndex, 10) || 0;

		// 删除当前背景图
		var obj = iframeDoc.$('#cubie_layout_bg');
		obj[0] && obj.remove();

		if (bgs.length > 0) {
			$.each(bgs, function(k, v) {
				v = $(v);

				initData[k] = {
					'width': v.attr('data-width'),
					'height': v.attr('data-height'),
					'path': v.attr('src'), // 本地路径
					'release_url': v.attr('data-release-src'), // 发布时的相对路径
					'filename': v.attr('data-filename'),
					'repeat': repeat,
					'bg_align': bg_align
				};

				images.push(initData[k].filename);

				// 布局样式
				var css = 'width: 100%; height: ' + initData[k].height + 'px; background:url(' + initData[k].path + ') ' + initData[k].repeat + ' top ' + initData[k].bg_align + ';';
				// 最终发布样式
				var releaseCss = 'width: 100%; height: ' + initData[k].height + 'px; background:url(' + initData[k].release_url + ') ' + initData[k].repeat + ' top ' + initData[k].bg_align + ';';

				tpl += '<div class="cubie-bg" style="' + css + '" data-release-style="' + releaseCss + '"></div>';
			});

			tpl = '<div id="cubie_layout_bg" style="position: absolute; z-index: ' + zIndex + '; left: 0; top: 0; width: 100%;">' + tpl + '</div>';
			iframeDoc.$('body').append(tpl);	
		}

		// 缓存背景图JSON前先清空Layout.bg_list
		setProjectJSON('Layout', {
			bg_list: null
		});
		// 缓存背景图到JSON
		setProjectJSON('Layout', {
			bg_list: initData
		});

		// 缓存需要发布的资源
		$.Layout.saveResource(images);
	}

	/**
	 * 初始化布局属性背景图
	 */
	function initLayoutBg(data) {
		var tpl = '';
		$.each(data, function(k, v) {
			tpl += '<li>'
				+ '<i class="icon-remove" title="移除此背景图" data-event="removeLayoutBg"></i>'
				+ '<img data-width="' + v.width + '" data-height="' + v.height + '" data-release-src="' + v.release_url + '" data-filename="' + v.filename + '" src="' + v.path + '" />'
				+ '</li>';
		});

		// 追加的形式,保留上次的背景图
		$('#layout_bg_list').append(tpl);
	}

	/**
	 * 移除背景图
	 */
	function removeLayoutBg(t) {
		var p = t.parent(),
			filename = p.find('img').attr('data-filename');
		
		// 移除已保存的图片
		$.Layout.removeResource(filename);

		p.remove();
		updateLayoutBg();
	}

	/**
	 * 组件Drag & Drop
	 */
	function initModuleDragDrop() {
		// 存在项目组件时,显示标签
		if ($('#cubie_module_project li').length > 0) {
			$('#cubie_module_tab_project').show();
		}

		$('#cubie_module_list li').draggable({
			cursor: 'move',
			opacity: '0.8',
			revert: 'invalid', // when not dropped, the item will revert back to its initial position
			appendTo: 'body', // 将克隆对象append到布局区
			containment: _layout, // 限定只能在_layout区域拖动
			helper: function(e) {
				var t = $(e.currentTarget),
					helper = '<div class="cubie cubie-module-draggable">' + t.html() + '</div>';

				return helper;
			},
			start: function(e, ui) {
				// 关闭打开未隐藏的右键菜单
				$('.context-menu-list').hide();
			}
		});

		$('.cubie-droppable').droppable({
			greedy: true, // 拖拽到可释放的区域时，若有嵌套层级，则父级不接受释放，http://api.jqueryui.com/droppable/#option-greedy
			accept: '#cubie_module_list li, .cubie-layout-wrapper>.cubie-module', // 接受组件列表的拖拽以及全局组件
			hoverClass: 'cubie-droppable-hover',
			tolerance: 'fit', // 对于_layoutWrapper需要完全在可拖拽范围内才能释放
			over: function(e, ui) {
				// var isOnBlock = $(e.target).hasClass('cubie-block');
				// isOnBlock && showHints('按Ctrl释放到全局布局');
			},
			out: function(e, ui) {
				// showHints('');
			},
			drop: function(e, ui) {
				var droppableEl = $(e.target), // 接受拖拽的对象
					isOnBlock = droppableEl.hasClass('cubie-block'), // 是否拖拽到区块上
					blockID = isOnBlock ? droppableEl.attr('id') : '',
					insertEl = isOnBlock ? droppableEl.find('.cubie-block-editarea') : _layoutWrapper, // 组件需要插入的DOM节点
					helper = $(ui.helper),
					isCreate = !helper.hasClass('cubie-module'); // 拖拽类型

				// ui.position: Current CSS position of the draggable helper as { top, left } object
				// ui.offset: Current offset position of the draggable helper as { top, left } object.
				var left, top;

				if (isCreate) { // 新增(此时的ui.position相对body)
					var draggableEl = $(ui.draggable),
						moduleSourceID = draggableEl.attr('data-moduleid');

					if (isOnBlock) {
						var droppableElOffset = droppableEl.offset();
						left = ui.position.left - droppableElOffset.left;
						top = ui.position.top - droppableElOffset.top;
					} else {
						left = ui.position.left -  _layoutWrapperOffsetLeft;
						top = ui.position.top - _layoutOffsetTop;
					}

					var module = createModule({
						moduleSourceID: moduleSourceID,
						insertEl: insertEl,
						blockID: blockID,
						left: left,
						top: top
					});

					// 模拟选择组件
					e.ctrlKey = $('.ui-selected').length > 0;
					setModuleStatus(e, module);	

				} else { // 已有组件拖拽(此时的ui.position相对_layoutWrapper)
					if (isOnBlock) {
						left = ui.position.left - parseFloat(droppableEl.css('left'));
						top = ui.position.top - parseFloat(droppableEl.css('top'));

						helper.attr('data-blockid', blockID)
							.css({
								left: left,
								top: top
							})
							.draggable({ // 重设可拖动范围
								containment: insertEl
							})
							.resizable({ // 重设可resize范围
								containment: insertEl
							});

						// 要是insertEl不存在helper，则append方法会移动元素到insertEl
						insertEl.append(helper);
					}
				}
			}
		});
	}

	/**
	 * 创建一个新组件
	 * 1) 新建
	 * 	options = {
	 *		moduleSourceID: moduleSourceID,
	 *		insertEl: insertEl,
	 *		blockID: blockID,
	 *		left: left,
	 *		top: top
	 *	}
	 *
	 * 2) 从克隆对象新建
	 * 	options = {
	 *		clone: clone, // 被克隆对象
	 *	}
	 *
	 * @return {Object} module
	 */
	function createModule(options) {
		// 由于opacity的继承性, 这里使用cubie-module-opacity模拟透明区域;cubie-module-editorarea为实际可编辑区域
		var guid = $.getGUID();
		var clone = options.clone ? $(options.clone) : null;
		var moduleSource = clone ? null : getModuleSourceInfo(options.moduleSourceID);
		var moduleJSON = null; // 组件的初始化JSON数据,clone时传入即可

		// 组件解析异常
		if (!clone && !moduleSource) {
			_Toast.open('组件解析异常');
			return false;
		}

		var content = clone ? clone.find('.cubie-module-editarea').html() : moduleSource.html;
		var html = '<div class="cubie-module">'
			+ '<div class="cubie-module-editarea">' + content + '</div>'
			+ '<div class="cubie-module-opacity cubie-redundant-dom-inner"></div>'
			+ '<textarea id="' + guid + '_json" class="cubie-redundant-dom-inner" style="display:none;"></textarea>' //  组件数据存储JSON
			+ '</div>';
		var module = $(html);


		if (!clone) {
			module.css({
				position: 'absolute',
				// overflow: 'hidden',
				left: options.left,
				top: options.top,
				width: _moduleInitWidth,
				height: _moduleInitHeight,
			});
		} else {
			// 复制组件的同时,复制组件存储的数据
			var M = getModuleAPI(clone);
			moduleJSON = M && M.getCloneJSON() || {};

			var cloneCss = clone.attr('style');
			module.attr('style', cloneCss)
				.css({ // 位置轻度偏移,以示提示
					left: parseFloat(clone.css('left')) + 10,
					top: parseFloat(clone.css('top')) + 10
				});

			options.moduleSourceID = clone.attr('data-modulesourceid');
			options.blockID = clone.attr('data-blockid');
			options.insertEl = options.blockID ? $('#' + options.blockID).find('.cubie-block-editarea') : _layoutWrapper;
		}

		module.attr('id', guid);

		options.insertEl.append(module);


		// 设置editarea的overflow为auto;防止内容过多溢出
		module.find('.cubie-module-editarea')
			.css({
				'overflow': 'auto'
			});


		// 初始化事件
		initModuleEvent(module, {
			moduleID: guid,
			moduleSourceID: options.moduleSourceID,
			blockID: options.blockID,
			insertEl: options.insertEl,
			moduleJSON: moduleJSON
		});

		return module;
	}

	/**
	 * 恢复已有组件
	 */
	function recoverModule() {
		var modules = $('.cubie-module');
		modules.each(function(k, v) {
			var module = $(v),
				moduleID = module.attr('id'),
				moduleSourceID = module.attr('data-modulesourceid'),
				blockID = module.attr('data-blockid'),
				insertEl = blockID ? $('#' + blockID).find('.cubie-block-editarea') : _layoutWrapper;

			// 恢复组件事件
			initModuleEvent(module, {
				moduleID: moduleID,
				moduleSourceID: moduleSourceID,
				blockID: blockID,
				insertEl: insertEl,
				moduleJSON: null
			});
		});
	}

	/**
	 * 初始化组件事件
	 * @param {Object} module
	 * @param {Object} options
	 */
	function initModuleEvent(module, options) {
		// 组件源是否存在
		var isSourceExist = isModuleSourceExist(options.moduleSourceID);

		module.attr('data-modulesourceid', options.moduleSourceID)
			.attr('data-blockid', options.blockID || '') // 所属区块标识
			.click(function(e) {
				setModuleStatus(e);
				return false; // 防止冒泡到区块
			})
			.dblclick(function(e) {
				// 检查组件是否还存在,不存在时不作处理
				if (isSourceExist) {
					toggleModuleEditMode($(this));
				} else {
					_Toast.open('组件源不存在或已被删除，不可编辑！');
				}
				
				return false; // 防止冒泡到区块
			})
			.mouseover(function(e) {
				var module = $(this),
					blockID = module.attr('data-blockid');

				// 编辑模式下,mouseover隐藏坐标线
				if (inEditMode(module)) {
					hideCoordinate();
				}

				if (blockID) {
					showHints('Shift+拖拽即可脱离区块');
				}
			})
			.mouseout(function(e) {
				var module = $(this),
					blockID = module.attr('data-blockid');

				// 编辑模式下,mouseout显示坐标线
				if (inEditMode(module)) {
					showCoordinate();
				}

				if (blockID) {
					showHints('');
				}
			})
			.mousedown(function(e) {
				// 区块内的组件在按下Shift时，要是实时将组件切换出区块(即切换到_layoutWrapper)，则会造成draggable的位置混乱

				// 区块内的组件移出解决方案：
				// 1) 按下Shift,mousedown时改变组件containment为_layoutWrapper
				// 2) 组件拖拽开始时,生成ghost,同步组件的位置
				var helper = $(this),
					blockID = helper.attr('data-blockid');

				if (e.shiftKey && blockID) {
					helper.draggable({
						containment: _layoutWrapper
					});
					_ghostStatus = 'ready';
				}
			})
			.mouseup(function(e) {
				// 防止按下Shift不移动的情况，ghost状态为ready表示没有发生拖拽， 此时恢复组件的containment
				if (_ghostStatus == 'ready') {
					var helper = $(this),
						blockID = helper.attr('data-blockid'),
						containment = $('#' + blockID).find('.cubie-block-editarea');

					helper.draggable({
						containment: containment
					});

					_ghostStatus = null;
				}
			})
			.draggable({
				containment: options.insertEl,
				// zIndex: 4, // 缺省为0， 拖拽时设为1，拖拽结束恢复
				start: function(e, ui) {
					// 是否已按下Shift改变了containment，是的话则生成ghost，拖拽时同步组件的位置
					if (_ghostStatus == 'ready') {
						createGhostModule(e, ui);
						_ghostStatus = 'init'
					}
				},
				drag: function(e, ui) {
					// ghost模式，同步ghost
					if (_ghostStatus == 'init') {
						moveGhostModule(e, ui);
					}

					// 组件API resize回调
					var M = getModuleAPI($(ui.helper));
					M && M.onDrag(e, ui);
				},
				stop: function(e, ui) {
					// ghost模式才处理
					if (_ghostStatus == 'init') {
						var helper = $(ui.helper),
							moduleID = helper.attr('id');

						// 移除ghost
						removeGhostModule(moduleID);

						// 更新组件位置
						helper.attr('data-blockid', '') // 更新所属区块标识
							.css({
								'left': (ui.offset.left - _layoutWrapperOffsetLeft),
								'top': (ui.offset.top - _layoutOffsetTop)
							})
							.resizable({ // 重设可resize范围
								containment: _layoutWrapper
							});

						// 移动helper到_layoutWrapper最后一个元素后
						_layoutWrapper.find('>div:last-child').after(helper);

						_ghostStatus = null;
					}
				}
			})
			.resizable({
				containment: options.insertEl,
				autoHide: true,
				handles: 'all', // 所有方向可调节
				create: function(e, ui) {
					// http://api.jqueryui.com/resizable/#event-create
					// Note: The ui object is empty but included for consistency with other events.

					// 标识resizable创建的DOM节点为冗余节点,方便后续提取
					$(e.target).find('.ui-resizable-handle').addClass('cubie-redundant-dom');
				},
				resize: function(e, ui) {
					// 组件API resize回调
					var M = getModuleAPI($(ui.helper));
					M && M.onResize(e, ui);
				}
			})
			.data('contextMenuCallback', moduleContextMenuCallback);


		if (isSourceExist) {
			// 注册组件内容变化回调
			module.find('.cubie-module-editarea')
				.on('input', function(e) {
					var obj = $(this),
						module = obj.parent(),
						data = obj.html();

					// 组件API onEdit回调
					var M = getModuleAPI(module);
					M && M.onEdit(data);
				});


			// 初始化组件面板
			initModulePanel(module, {
				moduleJSON: options.moduleJSON
			});	

			// 组件右键菜单
			$.contextMenu({
				selector: '#' + options.moduleID,
				customData: { // 自定义数据
					blockID: options.blockID,
					moduleID: options.moduleID
				},
				build: function(trigger, e) {
					// 动态获取执行句柄
					return trigger.data('contextMenuCallback')(trigger);
				}
			});	
		}
	}

	/**
	 * 初始化组件特性面板
	 * @param {Object} module
	 * @param {Object} [options]
	 */
	function initModulePanel(module, options) {
		options = options || {};
		var moduleID = module.attr('id'),
			moduleSourceID = module.attr('data-modulesourceid'),
			moduleSource = getModuleSourceInfo(moduleSourceID),
			moduleFeature = moduleSource.feature,
			feature = {},
			tpl = '';

		// 保持顺序不变的前提下,检查是否有新增的required特性未整合,是的话添加到组件特性最前面
		$.each(_requiredFeature, function(k, v) {
			if (!moduleFeature[v]) {
				feature[v] = {};
			}
		});
		$.extend(true, feature, moduleFeature);

		// 插件
		tpl += '<fieldset style="display:none;">'
			+ '<legend>插件</legend>'
			+ '<div class="js-plugins"></div>'
			+ '</fieldset>';

		$.each(feature, function(k, v) {
			// 是否系统特性
			var isSysFeature = !(v.title && v.html);

			if (isSysFeature) {
				var sysFeature = $.Feature.get(k);
				// 先判断sysFeature是否存在,避免特性删减出错
				tpl += sysFeature ? sysFeature.html : '';
			} else {
				tpl += '<fieldset>'
				+ '<legend>' + v.title + '</legend>'
				+ (v.css ? '<style type="text/css">' + v.css + '</style>' : '')
				+ v.html
				+ '</fieldset>'
			}
		});

		// 每个组件对应自己的面板
		_modulePanelTpl.find('.js-title')
			.html('[ ' + moduleSource.title + ' ] 特性面板');
		_modulePanelTpl.find('.modal-body')
			.html(tpl);

		var panel = _modulePanelTpl.clone();
		panel.attr('id', moduleID + '_panel')
			.modal({
				backdrop: false,
				show: false
			})
			.appendTo($(document.body))
			.draggable(); // draggable要在append后,否则panel的position会被设置为relative

		// 修正面板内第三方组件元素拖拽问题
		fixDraggableCancel(panel);

		// 绑定关闭取消按钮事件
		// panel.find('.js-close').click(function(e) {
		// 	toggleModuleEditMode(module);
		// 	return false;
		// });

		// 面板折叠
		panel.find('.js-fold').click(function(e) {
			var modalBody = $(this).parents('form').find('.modal-body');
			if ($(this).hasClass('icon-resize-small')) {
				$(this).removeClass('icon-resize-small')
					.addClass('icon-resize-full')
					.attr('title', '展开');

				modalBody.slideUp();
			} else {
				$(this).removeClass('icon-resize-full')
					.addClass('icon-resize-small')
					.attr('title', '折叠');

				modalBody.slideDown();
			}
			return false;
		});

		// 绑定表单提交事件
		panel.find('form').validate({
			submitHandler: function(form) {
				var data = $.serializeArrayToJSON($(form).serializeArray());

				// 组件API onSubmit回调
				var M = getModuleAPI(module);
				M && M.onSubmit(data, $(form));

				// 关闭编辑模式
				toggleModuleEditMode(module, true);

				return false;
			}
		});


		// 实例化组件API
		__MODULE_API__[moduleID] = new $.CUBIE_MODULE_API({
			projectID: __project__.id,
			module: module,
			JSON: options.moduleJSON
		});
		
		// 初始化特性
		var randomKey = '__M__' + moduleID;
		window[randomKey] = __MODULE_API__[moduleID];

		moduleSource.featureJs = $.trim(moduleSource.featureJs);
		
		// 注册组件初始化函数,但不执行,防止组件过多造成的初始化缓慢
		// 在组件初次启用编辑模式时再执行
		var api = randomKey + '._onInit(function() {'
			// 初始化系统特性API
			+ '$.Feature.initEvent(' + randomKey + ');'
			// 初始化自定义特性API
			+ (moduleSource.featureJs ? '(' + moduleSource.featureJs + ')(' + randomKey + ');' : '')
			+ '});';

		try {
			$.globalEval(api);
		} catch (e) {
			_Toast.open('组件初始化异常：' + e);
		}
	}

	/**
	 * 根据组件(ID)获取组件API引用
	 */
	function getModuleAPI(moduleID) {
		moduleID = ($.type(moduleID) == 'object') ? moduleID.attr('id') : moduleID;
		return __MODULE_API__[moduleID] || null;
	}

	/**
	 * 组件右键菜单动态回调函数
	 */
	function moduleContextMenuCallback(trigger) {
		// 编辑模式下的组件右键不可用
		if (inEditMode(trigger)) {
			return;
		}

		return {
			callback: function(key, options) {
				var data = options.customData,
					block = $('#' + data.blockID),
					module = $('#' + data.moduleID);

				switch (key) {
					case 'copy':
						var insertEl = block[0] ? block.find('.cubie-block-editarea') : _layoutWrapper,
							left = parseFloat(module.css('left')) + 10,
							top = parseFloat(module.css('top')) + 10;

						createModule({
							clone: module
						});
						break;
					case 'delete':
						removeCurrentModule(module);
						break;
					case 'up': // 图层上移
						var el = module.next('.cubie-module');
						if (el.length > 0) {
							module.insertAfter(el);
						}
						break;
					case 'down': // 图层下移
						var el = module.prev('.cubie-module');
						if (el.length > 0) {
							el.insertAfter(module);
						}
						break;
					case 'openEditMode':
						toggleModuleEditMode(module);
						break;
				}
			},
			items: {
				'copy': {
					name: '复制组件'
				},
				'delete': {
					name: '删除组件'
				},
				'sep': '---',
				'up': {
					name: '图层上移'
				},
				'down': {
					name: '图层下移'
				},
				'sep2': '---',
				'openEditMode': {
					name: '属性设置'
				},
			}
		};
	}

	/**
	 * 生成组件ghost
	 */
	function createGhostModule(e, ui) {
		var helper = $(ui.helper),
			cloneHelper = helper.clone(),
			moduleID = helper.attr('id');

		cloneHelper.attr('id', moduleID + '_ghost') // 清空ID，防止重复
			.css({
				'left': (ui.offset.left - _layoutWrapperOffsetLeft),
				'top': (ui.offset.top - _layoutOffsetTop)
			});

		_layoutWrapper.append(cloneHelper);
		helper = cloneHelper = null;
	}

	/**
	 * 移动组件ghost
	 */
	function moveGhostModule(e, ui) {
		var helper = $(ui.helper),
			moduleID = helper.attr('id'),
			ghost = $('#' + moduleID + '_ghost');

		ghost.css({
			'left': (ui.offset.left - _layoutWrapperOffsetLeft),
			'top': (ui.offset.top - _layoutOffsetTop)
		});
		helper = ghost = null;
	}

	/**
	 * 删除组件ghost
	 */
	function removeGhostModule(moduleID) {
		var ghost = $('#' + moduleID + '_ghost');
		ghost.remove();
		ghost = null;
	}

	/**
	 * 切换组件状态
	 */
	function setModuleStatus(e, module) {
		module = module || $(e.currentTarget);

		// 编辑状态下,不可切换状态
		if (inEditMode(module)) {
			return;
		}

		// 恢复区块到默认状态
		resetBlockStatus();

		if (e.ctrlKey) { // Ctrl+点击,添加为框选组件
			// 非框选的聚焦组件添加框选
			$('.cubie-module-focus:not(.ui-selected)').addClass('ui-selected');

			if (module.hasClass('ui-selected')) {
				module.removeClass('cubie-module-focus ui-selected');
			} else {
				module.addClass('cubie-module-focus ui-selected');
			}
		} else {
			resetModuleStatus();
			module.addClass('cubie-module-focus');
		}
	}

	/**
	 * 恢复组件到默认状态
	 */
	function resetModuleStatus() {
		$('.cubie-module').removeClass('cubie-module-focus ui-selected');
	}

	/**
	 * 恢复区块到默认状态
	 */
	function resetBlockStatus() {
		$('.cubie-block').removeClass('cubie-block-focus');
	}

	/**
	 * 移动元素
	 * @param {Event} e
	 */
	function moveElement(e) {
		// 当光标处于表单元素或者编辑状态下的组件时, 不处理方向键
		var target = $(e.target);
		if ($.inArray(target[0].nodeName.toLowerCase(), ['input', 'textarea', 'select', 'checkbox', 'radio']) != -1 
			// || target.prop('contenteditable')
			|| inEditMode(target.parent())) {
			return;
		}


		var key = e.which,
			el = $('.cubie-module-focus:not(.cubie-module-edit)');

		// 聚焦组件与聚焦区块互斥, 移动其中一种即可
		el = (el.length > 0) ? el : $('.cubie-block-focus');

		if (el.length > 0 && $.inArray(key, [37, 38, 39, 40]) != -1) {
			var offset = e.ctrlKey ?  _moveStep : 1,
				d = (key == 37 || key == 39) ? 'left' : 'top';

			$.each(el, function(k, v) {
				var el = $(v),
					v = parseFloat(el.css(d));

				v = (key < 39) ? v - offset  : v + offset;
				v = (v < 0) ? 0 : v;
				el.css(d, v);
			});
		}

		e.preventDefault(); // 阻止页面滚动
	}

	/**
	 * 删除聚焦组件
	 */
	function removeFocusModule(e) {
		var target = $(e.target),
			nodeName = target[0].nodeName.toLowerCase();

		// 防止焦点在表单元素时按delete键时触发删除组件操作
		if ($.inArray(nodeName, ['input', 'textarea', 'select']) == -1 && confirm('你确定要删除所选组件?')) {
			module = $('.cubie-module-focus');
			removeModule(module);
		}
	}

	/**
	 * 删除当前(指定)组件
	 */
	function removeCurrentModule(module) {
		if (confirm('你确定要删除当前组件?')) {
			removeModule(module);
		}
	}

	/**
	 * 删除组件及其相关模块
	 */
	function removeModule(module) {
		module.each(function(k, v) {
			var m = $(v),
				moduleID = m.attr('id');

			// 移除组件面板
			$('#' + moduleID + '_panel').remove();

			// 组件API onDestroy回调
			var M = getModuleAPI(module);
			M && M.onDestroy();

			// 移除组件API实例引用
			window['__M__' + moduleID] = __MODULE_API__[moduleID] = null;
			delete __MODULE_API__[moduleID];
			delete window['__M__' + moduleID];

			m.remove();
		});
	}


	/**
	 * 组件是否处于编辑模式
	 */
	function inEditMode(module) {
		return module.hasClass('cubie-module-edit');
	}

	/**
	 * 启用编辑模式(全局只能有一个组件处于编辑模式)
	 * @param {Object} module
	 */
	function openEditMode(module) {
		if (!inEditMode(module)) {
			var moduleID = module.attr('id');

			// 关闭当前处于编辑模式下的组件
			var prevEditModule = $('.cubie-module-edit');
			if (prevEditModule[0]) {
				closeEditMode(prevEditModule); 
			}

			// 编辑模式下,组件的可编辑状态由特性或插件决定
			module.draggable('disable') // 锁住拖拽
				.removeClass('no-user-select') // 移除文本可不框选
				.addClass('cubie-module-edit user-select') // 进入编辑模式, 并设置内容可选
				.find('.cubie-module-editarea')
				.blur(); // blur用于防止双击开启时造成内容被选中

			// 隐藏坐标线
			hideCoordinate();

			// 销毁selectable, 避免编辑模式下选择不到内容的问题
			destroyModuleSelected();

			$('#' + moduleID + '_panel').modal('show');

			// 组件API onEditIn回调
			var M = getModuleAPI(module);
			M && M.onEditIn();

			_editMode = true;
		}
	}

	/**
	 * 关闭编辑模式
	 * @param {Object} module
	 */
	function closeEditMode(module, fromSubmit) {
		if (inEditMode(module)) {
			var moduleID = module.attr('id');

			module.draggable('enable')
				.removeClass('cubie-module-edit user-select')
				.addClass('no-user-select'); // 防止双击关闭时,文本有被选中的效果


			$('#' + moduleID + '_panel').modal('hide');

			// 恢复框选模式
			initModuleSelected();

			// 组件API onEditOut回调
			var M = getModuleAPI(module);
			M && M.onEditOut(!!fromSubmit);

			// 不可编辑
			M.setContentEditable(false);
			// 防止组件外层被设置了可编辑,这里同时去除
			module.attr('contenteditable', false);

			_editMode = false;
		}
	}

	/**
	 * toggle组件编辑模式
	 * @param {Boolean} fromSubmit 标识是否来自于面板设置引起的退出操作
	 */
	function toggleModuleEditMode(module, fromSubmit) {
		// 编辑模式下,执行组件初始化(一次函数)
		var M = getModuleAPI(module);
		try {
			M._onInit();
		} catch (e) {
			_Toast.open('组件入口函数异常：' + e);
			throw e;
		}

		if (inEditMode(module)) {
			closeEditMode(module, fromSubmit);
		} else {
			openEditMode(module);
		}
	}

	/**
	 * 组件框选
	 */
	function initModuleSelected() {
		_layoutWrapper.selectable({
			tolerance: 'fit', // 整个框选才算选到
			filter: '.cubie-module', // 只选择组件
			distance: 10, // >10px时才触发框选
			start: function(e, ui) {
				// 框选时清空聚焦组件
				$('.cubie-module-focus').removeClass('cubie-module-focus');
			},
			selected: function(e, ui) {
				// 恢复区块到默认状态
				resetBlockStatus();
				// 框选后激活为聚焦组件
				$(ui.selected).addClass('cubie-module-focus');
			}
		});
	}

	/**
	 * 销毁组件框选
	 */
	function destroyModuleSelected() {
		_layoutWrapper.selectable('destroy');
	}

	/**
	 * 初始化区块
	 */
	function initBlock() {
		if (_projectTplData.blocksNum > 0) {
			var blocks = _projectTplData.blocks;

			// 遍历创建区块
			$.each(blocks, function(k, v) {
				var block = $('#' + v.guid),
					offset = v.offset,
					// 宽度不可超过布局宽度
					// 对于宽度百分比的布局, 不作处理(可能存在超出布局的情况)
					w = Math.min(v.width, _projectJSON.Layout.layout_width),
					h = Math.min(v.height, _projectJSON.Layout.layout_height);

				// 1) 若是模版区块修改了,会出现区块匹配失败等情况,此情况视为每个依赖此模版的项目都需要重新修改
				// 2) GUID不随内容改变而改变,而key值是可能随DOM结构改变或顺序调整而改变的

				// 已存在guid的区块,无需创建,绑定事件即可
				if (block.length > 0) {
					// 原则上模板区块录入后不建议修改,若是修改了这里强制更新
					// 若模板固定宽高,则更新宽高;否则不作改变
					if (w > 0) {
						block.width(w);
					}
					if (h > 0) {
						block.height(h);
					}

					recoverBlock(block);
				} else {
					createBlock(v.guid, {
						// 由于布局宽度可变,所以offset.left - _layoutWrapperOffsetLeft有可能为负值, 负值时统一设为0
						left: Math.max(0, offset.left - _layoutWrapperOffsetLeft),
						top: Math.max(0, offset.top)
					}, {
						
						width: w,
						height: h
					});
				}
			});
		}

		// 对已有区块进行一些处理,防止模板变更造成已有区块匹配失败;
		// 此种情况下, 删除匹配失败的区块,并移除此区块内的组件所属区块标记
		var blocks = $('.cubie-block');
		var removeBlockGUID = [];
		blocks.each(function(k, v) {
			v = $(v);

			var guid = v.attr('id'),
				data = getBlockDataByGUID(guid);

			if (!data) {
				// 保持组件相对文档位置不变,只删除区块
				var left = parseInt(v.css('left'), 10),
					top = parseInt(v.css('top'), 10);
				
				var modules = v.find('.cubie-module');

				modules.each(function(i, m) {
					m = $(m);
					m.attr('data-blockid', '')
						.css({
							left: left + parseInt(m.css('left'), 10),
							top: top + parseInt(m.css('top'), 10)
						})
						.appendTo(_layoutWrapper); // 将组件移动到全局下
				});

				v.remove();
				removeBlockGUID.push('GUID：' + guid);
			}
		});

		if (removeBlockGUID.length > 0) {
			$.showTips('由于模板变更，以下区块已被删除，组件已移动到全局下，请注意校验！<br /><br /><ul><li>' + removeBlockGUID.join('</li><li>') + '</li></ul>');	
		}
	}

	/**
	 * 获取区块数据
	 */
	function getBlockDataByGUID(guid) {
		return _projectTplData.blocks[guid] || null;
	}

	/**
	 * 获取区块标题
	 */
	function getBlockTitle(guid, x, y) {
		var data = getBlockDataByGUID(guid);
		return '区块' + data.key + '[' + (data.width == 0 ? '变宽' : '定宽') + ',' + (data.height == 0 ? '变高' : '定高') + '](' + (x == 0 ? '100%' : x) + 'x' + (y == 0 ? '100%' : y) + ')';
	}

	/**
	 * 设置区块尺寸
	 */
	function setBlockSize(block, width, height) {
		// 0表示自适应,其他表示固定高度,不支持百分比
		// 0时给一个初始高度,防止没有显示
		// 非0时宽度或高度不可设置
		block.css({
			'width': (width == 0 ? '' : width),
			'height': (height == 0 ? '20' : height)
		})
		.attr('data-width', width)
		.attr('data-height', height);
	}

	/**
	 * 创建区块
	 * @param {String} guid 区块guid
	 * @param {Object} offset 偏移
	 * @param {Object} size 宽高
	 */
	function createBlock(guid, offset, size) {
		var title = getBlockTitle(guid, size.width, size.height);

		var block = $('<div class="cubie-block cubie-droppable"><div class="cubie-block-editarea"></div><div class="cubie-block-opacity cubie-redundant-dom-inner">' + title + '</div></div>');

		block.attr('id', guid)
			.css({
				'position': 'absolute',
				'left': offset.left,
				'top': offset.top,
				// 由于这里的区块使用绝对定位,当使用自适应时,设置100%在coord.X>0时会超出布局,所以使用right
				'right': 0,
				'overflow': 'hidden'
			});

		setBlockSize(block, size.width, size.height);

		_layoutWrapper.append(block);

		initBlockEvent(block);
	}

	/**
	 * 恢复区块
	 * @param {Object} block
	 */
	function recoverBlock(block) {
		// key值可能存在改变,更新key值
		var guid = block.attr('id'),
			data = getBlockDataByGUID(guid),
			title = getBlockTitle(guid, block.attr('data-width'), block.attr('data-height'));

		block.find('.cubie-block-opacity').html(title);

		initBlockEvent(block);
	}

	/**
	 * 显示区块属性设置面板
	 */
	function showBlockPropertyModal(guid) {
		var panel = $('#' + guid + '_panel');
		panel.modal('show');
	}

	/**
	 * 绑定区块事件
	 * @param {Object} block
	 */
	function initBlockEvent(block) {
		var guid = block.attr('id'),
			data = getBlockDataByGUID(guid);

		block.click(function(e) {
				// click事件在拖拽后仍触发(即draggable.stop先于click触发)
				if (e.ctrlKey && _blockStatus !== 'stop') {
					// 恢复组件到默认状态
					resetModuleStatus();
					// ctrl+单击选择
					$(e.currentTarget).toggleClass('cubie-block-focus');
				}
				_blockStatus = null;
			})
			.dblclick(function(e) {
				// 双击显示属性设置面板
				var guid = $(this).attr('id');
				showBlockPropertyModal(guid);
			})
			.mouseover(function(e) {
				// 直接mouseover在区块上才触发,防止区块内的组件mouseover时,组件的提示被覆盖
				if ($(e.toElement).hasClass('cubie-block-editarea')) {
					showHints('Ctrl+单击选择区块');
				}
			})
			.mouseout(function(e) {
				showHints('');
			})
			.mousedown(function(e) {
				// ctrl+mousedown方可拖动区块, 使用mousedowmn,在draggable前触发
				// $(e.currentTarget).draggable(e.ctrlKey ? 'enable' : 'disable');

				// ctrl或已选中都可拖动
				var block = $(this),
					enable = e.ctrlKey || block.hasClass('cubie-block-focus');

				block.draggable(enable ? 'enable' : 'disable');
			})
			.draggable({
				containment: _layoutWrapper,
				start: function(e, ui) {
					var helper = $(ui.helper);
					helper.addClass('cubie-block-focus');
					_blockStatus = 'start';
				},
				drag: function(e, ui) {
					// 属性面板表单
					var block = $(ui.helper),
						guid = block.attr('id'),
						panel = $('#' + guid + '_panel');

					panel.find('input[name="x"]').val(ui.position.left);
					panel.find('input[name="y"]').val(ui.position.top);
				},
				stop: function(e, ui) {
					_blockStatus = 'stop';
				}
			});


		// 定宽定高处理
		var resizeOptions = {
			containment: _layoutWrapper,
			autoHide: true,
			handles: 'all', // 所有方向可调节
			create: function(e, ui) {
				// 标识resizable创建的DOM节点为冗余节点,方便后续提取
				$(e.target).find('.ui-resizable-handle').addClass('cubie-redundant-dom');
			},
			resize: function(e, ui) {
				var block = $(ui.helper),
					guid = block.attr('id'),
					panel = $('#' + guid + '_panel'),
					title = getBlockTitle(guid, ui.size.width, ui.size.height);

				$(ui.element).find('.cubie-block-opacity').html(title);

				// 属性面板表单
				panel.find('input[name="width"]').val(ui.size.width);
				panel.find('input[name="height"]').val(ui.size.height);

				block.attr('data-width', ui.size.width)
					.attr('data-height', ui.size.height);
			}
		};

		if (data.width > 0) {
			$.extend(resizeOptions, {
				minWidth:  data.width,
				maxWidth: data.width
			});
		}
		if (data.height > 0) {
			$.extend(resizeOptions, {
				minHeight:  data.height,
				maxHeight: data.height
			});
		}
		// 若是宽高均为固定,则不需要resizable
		if (!(data.width > 0 && data.height > 0)) {
			block.resizable(resizeOptions);
		}
		


		// 每个区块对应自己的面板
		initBlockPanel(block);

		// 右键菜单
		$.contextMenu({
			selector: '#' + guid,
			customData: { // 自定义数据
				guid: guid
			},
			callback: function(key, options) {
				var data = options.customData;
				switch (key) {
					case 'setting':
						showBlockPropertyModal(data.guid);
						break;
				}
			},
			items: {
				'setting': {
					name: data.key + '属性设置'
				}
			}
		});
	}

	/**
	 * 初始化区块面板
	 */
	function initBlockPanel(block) {
		var guid = block.attr('id'),
			data = getBlockDataByGUID(guid),
			panel = _blockPanelTpl.clone(),
			form = panel.find('form');

		function checkForm(form) {
			var data = $.serializeArrayToJSON($(form).serializeArray());
			var block = $('#' + data.guid);
			var panel = $('#' + data.guid + '_panel');
			var title, legalLeft, legalTop;

			// 宽度为百分比时,取布局宽度
			var maxWidth = isPercent(_projectJSON.Layout.layout_width) ? _layout.width() : _projectJSON.Layout.layout_width;
			// 宽度不能大于布局宽度
			data.width = Math.min(Math.abs(parseInt(data.width, 10) || 0), maxWidth);
			// 高度不能大于布局高度
			data.height = Math.min(Math.abs(parseInt(data.height, 10) || 0), _projectJSON.Layout.layout_height);
			// 合法的偏移范围
			legalLeft = maxWidth - data.width;
			legalTop = _projectJSON.Layout.layout_height - data.height;

			data.left = Math.min(Math.abs(parseInt(data.x, 10) || 0), legalLeft);
			data.top = Math.min(Math.abs(parseInt(data.y, 10) || 0), legalTop);

			title = getBlockTitle(data.guid, data.width, data.height);
		
			block.css({
					left: data.left,
					top: data.top
				})
				.find('.cubie-block-opacity').html(title);
			setBlockSize(block, data.width, data.height);

			// 更新表单
			initForm(panel, {
				x: data.left,
				y: data.top,
				width: data.width,
				height: data.height
			});

			return panel;
		}

		// 克隆面板
		panel.attr('id', guid + '_panel')
			.modal({
				backdrop: false,
				show: false
			})
			.appendTo($(document.body))
			.draggable() // draggable要在append后,否则panel的position会被设置为relative
			.click(function(e) {
				var target = $(e.target);
				// 恢复至模板默认值
				if (target.hasClass('js-reset')) {
					var panel = $(this),
						guid = panel.find('input[name="guid"]').val(),
						data = getBlockDataByGUID(guid),
						block = $('#' + guid);

					panel.find('input[name="width"]').val(data.width);
					panel.find('input[name="height"]').val(data.height);
					setBlockSize(block, data.width, data.height);
				}
			})

		// 表单校验
		form.validate({
			submitHandler: function(form) {
				var panel = checkForm(form);
				// 关闭modal
				panel.modal('hide');
				return false;
			}
		});

		
		// 初始化表单内容
		var oX = panel.find('input[name="x"]'),
			oY = panel.find('input[name="y"]'),
			oWidth = panel.find('input[name="width"]'),
			oHeight = panel.find('input[name="height"]');

		panel.find('.js-title').html('[ 区块' + data.key + ' ] 属性设置');
		panel.find('input[name="guid"]').val(guid);
		oX.val(parseFloat(block.css('left')));
		oY.val(parseFloat(block.css('top')));
		oWidth.val(block.attr('data-width'));
		oHeight.val(block.attr('data-height'));

		
		// 实时反馈
		var args = {
			form: form
		};
		oX.on('input', args, function(e) {
			checkForm(e.data.form);
		});
		oY.on('input', args, function(e) {
			checkForm(e.data.form);
		});
		// 宽高是否自适应,否则不可修改
		if (data.width > 0) {
			oWidth.attr('readonly', true)
				.attr('title', '定宽');
		} else {
			oWidth.on('input', args, function(e) {
				if ($.trim($(this).val())) {
					checkForm(e.data.form);
				}
			})
			.attr('readonly', false);
		}
		
		if (data.height > 0) {
			oHeight.attr('readonly', true)
				.attr('title', '定高');
		} else {
			oHeight.on('input', args, function(e) {
				if ($.trim($(this).val())) {
					checkForm(e.data.form);
				}
			})
			.attr('readonly', false);
		}
	}

	/**
	 * 切换组件类型
	 */
	function switchModule(t) {
		var type = t.attr('data-module-type');

		// 先停止滚动,否则切换后存在计算错误的情况
		var moduleList = $('#cubie_module_list');

		$('#cubie_module_tab li').removeClass('on');
		t.addClass('on');
		moduleList.find('ul').hide();
		$('#cubie_module_' + type).show();
	}

	/**
	 * 获取布局入库数据
	 */
	function getSaveLayoutData() {
		// _layout内存在动态添加的内容,如背景图,以及冗余的结构
		var clone = _layout.clone();

		// 入库保存的数据只去除冗余的cubie-redundant-dom DOM结构
		// 输出时去除cubie-redundant-dom与cubie-redundant-dom-inner DOM结构
		clone.find('.cubie-redundant-dom').remove();
		
	
		// 组件处理
		clone.find('.cubie-module').each(function(k, v) {
			// 去除聚焦、可编辑状态
			// ui-state-disabled会影响鼠标类型
			$(v).removeClass('cubie-module-focus cubie-module-edit ui-state-disabled')
				.attr('contenteditable', false)
				.find('.cubie-module-editarea')
				.attr('contenteditable', false);
		});
		

		var layout = $.trim(clone.html());
		clone = null;

		return layout;
	}

	/**
	 * 替换样式中的某项,不存在则添加
	 * @param {String} css
	 * @param {String} name
	 * @param {String|Null} value null时移除
	 */
	function replaceCss(css, name, value) {
		css = $.trim(css).split(';');

		$.each(css, function(k, v) {
			v = v.split(':');
			v[0]  = $.trim(v[0]);
			v[1] = $.trim(v[1]);

			if (v[0] == name) {
				v[1] = value;
			}

			css[k] = v[0] && v.join(': ');
		});
		return css.join('; ');
	}

	/**
	 * 获取Host
	 * @return {String} eg: http://cubie.oa.com
	 */
	function getHost() {
		return location.protocol + '//' + location.host; // 含端口号
	}

	/**
	 * 布局解析器
	 * @param {Boolean} preview:false 是否预览
	 */
	function layoutParser(preview, callback) {
		var iframeDoc = _layoutTplSubstrate[0].contentWindow,
			mixCss = [], // 布局样式(含组件、区块样式)
			mixBgCss = [], // 布局背景样式
			mixModuleSourceCss = [], // 组件源样式
			mixModuleJs = [], // 组件驱动JS
			arrModuleJoined = [];

		// 待发布资源列表
		var resource = $.Layout._resource();

		// 背景图
		var bgWrapper = iframeDoc.$('#cubie_layout_bg'),
			bgClassName = 'cubie-bg',
			bgHtml = '',
			bgZIndex = $.trim($('#bg_zindex').val());

		bgZIndex = bgZIndex ? parseInt(bgZIndex, 10) : -1;

		if (bgWrapper.length > 0) {
			var css = $.trim(bgWrapper.attr('style'));

			// 替换排版时的背景层叠z-index
			css = replaceCss(css, 'z-index', bgZIndex);
			

			mixBgCss.push('.' + bgClassName + ' {' + $.trim(css) + '}');
			bgHtml += '<div class="' + bgClassName + '">\n';

			var bgs = iframeDoc.$('.cubie-bg');
			bgs.each(function(k, v) {
				v = $(v);
				var className = bgClassName + '-' + k;
				// 保持Tab结构,方便查看
				bgHtml += '<div class="' + className + '"></div>';
				mixBgCss.push('.' + bgClassName + ' .' + className + ' {' 
					+ (preview ? $.trim(v.attr('style')) : $.trim(v.attr('data-release-style'))) 
					+ '}');
			});
			bgHtml += '\n</div>';
		}


		// 布局区域
		var clone = _layoutWrapper.clone(),
			wrapperClassName = 'cubie-layout',
			blockClassName = 'cubie-block';

		// 入库保存的数据只去除冗余的cubie-redundant-dom DOM结构
		// 输出时去除cubie-redundant-dom与cubie-redundant-dom-inner DOM结构
		clone.find('.cubie-redundant-dom ').remove();
		clone.find('.cubie-redundant-dom-inner').remove();


		// 提取cubie_layout_wrapper样式
		var css = $.trim(clone.attr('style')),
			layoutZIndex = $.trim($('#layout_zindex').val());

		layoutZIndex = layoutZIndex ? parseInt(layoutZIndex, 10) : null;

		// 去除cubie_layout_wrapper排版时的高度,设为0,将cubie_layout_wrapper至于顶部,仅作定位参考线
		// 注意不能设置overflow:hidden;否则组件会被遮挡
		css = replaceCss(css, 'height', 0);

		// 设置cubie_layout_wrapper的层叠关系
		css = replaceCss(css, 'z-index', layoutZIndex);
		

		mixCss.push('.' + wrapperClassName + ' {' + $.trim(css) + '}');
		mixCss.push('.' + blockClassName + ' {position: relative;}');


		// 组件处理
		var modules = clone.find('.cubie-module');
		var jsRefHandler = {};
		modules.each(function(k, v) {
			v = $(v);
			var moduleSourceID = v.attr('data-modulesourceid'),
				moduleSource = getModuleSourceInfo(moduleSourceID),
				moduleID = v.attr('id'),
				editArea = v.find('.cubie-module-editarea'),
				className = 'cubie-module-' + k, // 生成的组件样式名
				css = $.trim(v.attr('style')),
				html,
				isInBlock = !!v.attr('data-blockid'); // 是否在区块内


			// 替换资源路径
			if (!preview) {
				$.each(resource, function(i, res) {
					// 1) 这里只处理img显示的图片,其他方式保存的图片保存的时最终发布时的相对路径.无需处理
					// /issue/release/1/res/52293d884abae.gif -> res/52293d884abae.gif
					editArea.find('img[src*="' + res + '"]').attr('src', 'res/' + res);

					// 2) flash
					var flashObject = editArea.filter(function() {
						return (this.classid || '').toLowerCase() == 'clsid:d27cdb6e-ae6d-11cf-96b8-444553540000'
					});
					flashObject.find('param[name="movie"]').attr('value', 'res/' + res);
					flashObject.find('embed').attr('src', 'res/' + res);
				});	
			}
			

			// 移除组件内元素的自定义cubie属性
			editArea.find('[cubie]').removeAttr('cubie');
			html = editArea.html();

			// 添加新组合后的组件DOM,再移除原有组件DOM
			$('<div id="' + moduleID + '" class="' + className + '">' + html + '</div>').insertAfter(v);
			v.remove();

			// 将module-editarea的样式追加到module
			css += (css.substr(css.length - 1) == ';' ? '' : ';') + ' ' + $.trim(editArea.attr('style'));

			mixCss.push('.' + (isInBlock ? blockClassName : wrapperClassName) + ' .' + className + ' {' + $.trim(css) + '}');

			
			if ($.inArray(moduleSourceID, arrModuleJoined) == -1) {
				// 组件对应的源css只处理一次
				if (moduleSource.css) {
					mixModuleSourceCss.push(moduleSource.css);
				}

				// 组件对应的源JS,生成函数引用
				moduleSource.js = $.trim(moduleSource.js);
				if (moduleSource.js) {
					var jsRefHandlerName = 'C' + MD5(moduleSource.js).toUpperCase(); // 采用MD5计算,防止每次生成的文件hash不一样
					var jsRefStr = 'var ' + jsRefHandlerName + '=' + moduleSource.js + ';';
					mixModuleJs.push(jsRefStr);
					jsRefHandler[moduleSourceID] = jsRefHandlerName;
				}
			}

			// 一个组件对应一份组件JS, 组件JS参数为其对应的组件ID引用
			if (moduleSource.js) {
				var jsStr = jsRefHandler[moduleSourceID] + '("' + moduleID + '");';
				mixModuleJs.push(jsStr);
			}

			arrModuleJoined.push(moduleSourceID);
		});


		// 提取区块内容,并移除区块
		var blocks = clone.find('.cubie-block'),
			blocksData = {};

		blocks.each(function(k, v) {
			v = $(v);

			var guid = v.attr('id'),
				w = v.attr('data-width'),
				h = v.attr('data-height'),
				className = 'cubie-block-' + k,
				html = '<div class="' + blockClassName + ' ' + className + '">' + v.find('.cubie-block-editarea').html() + '</div>';

			v.remove();
			blocksData[guid] = html;

			// 区块宽高可修改
			mixCss.push('.' + className + ' {' + (w == 0 ? '' : 'width: ' + w + 'px; ') + (h == 0 ? '' : 'height: ' + h + 'px;') + '}');
		});		


		// 获取模版
		var tplData = {
			id: __project__.id,
			action: 'get_tpl'
		};
		
		// 同时提交项目属性数据,用于模版变量替换
		$.extend(true, tplData, _projectJSON.Project);
		
		$.ajax({
			type: 'POST',
			dataType: 'json',
			url: '/index.php/Project/layout/',
			data: tplData,
			success: function(data) {
				var rc = parseInt(data.retcode, 10);
				if (rc == 0) {
					var cssLnk = _projectJSON.Output.css_lnk == 1,
						jsLnk = _projectJSON.Output.js_lnk == 1;

					// preview时,需要指定外链文件的地址,防止受base基准地址影响
					var baseUrl = preview ? getHost() + '/issue/release/' + __project__.id + '/' : '';

					// $(data.html) 处理后会丢失部分数据,这里只提取body里的内容作处理
					var reg = /([\s\S]*<body)(\s+[\s\S]*?)?(>)([\s\S]*)(<\/body>[\s\S]*)/im;
					var matches = preview ? data.ssi_html.match(reg) : data.tpl.html.match(reg);

					// 去除body上的自定义data-cubie-xxx属性
					if (matches[2]) {
						matches[2] = matches[2].replace(/\s*data-cubie-[^=]+=\s*"[^"]*"/gi, '');
					}

					// step1: 合并区块内容到模板区块内
					var dom = $('<div>' + matches[4] + '</div>'); // 用DIV包裹成一个元素,方便提取
					var blocks = dom.find('.js-cubie-block');
					blocks.each(function(k, v) {
						v = $(v);
						var guid = v.attr('data-cubie-guid');
						v.append('\n<!-- Cubie Start -->\n' + (blocksData[guid] || '') + '\n<!-- Cubie End -->\n')
							.removeAttr('data-cubie-width data-cubie-height data-cubie-guid');
					});


					// step2: 合并背景、全局组件、css、js到模板内
					var cssContent = ''
						+ (mixModuleSourceCss.length > 0 ? mixModuleSourceCss.join('\n') + '\n' : '') // 组件源样式最前
						+ mixCss.join('\n') // 布局样式次之,这样子组件样式可重置组件源样式
						+ (mixBgCss.length > 0 ? '\n' + mixBgCss.join('\n') : '') // 背景样式
						+ (_projectJSON.Global.css ? '\n' + _projectJSON.Global.css : ''); // 追加的CSS样式最后, 这里可以重置一些不想要的样式啥的
					var css = '';

					if (cssLnk) {
						// 外链文件以MD5值作为版本号,防止未修改也更新
						css = '<link type="text/css" href="' + baseUrl + '{$project.__css__}" rel="stylesheet" />';
						// 外链样式为u8编码
						cssContent = '@charset "utf-8";\n' + cssContent;
					} else {
						css = '<style type="text\/css">\n' 
							+ cssContent
							+ '\n<\/style>';
					}

					var jsContent = '';
					var js = '';
					if (mixModuleJs.length > 0 || _projectJSON.Global.js) {
						jsContent =  '(function(window, document, undefined) {' 
							+ (mixModuleJs.length > 0 ? '\n' + mixModuleJs.join('\n') : '')
							+ (_projectJSON.Global.js ? '\n' + _projectJSON.Global.js : '') // 追加的JS,放到最后
							+ '\n})(window, document);';

						if (jsLnk) {
							// 外链文件以MD5值作为版本号,防止未修改也更新
							js = '<script type="text/javascript" src="' + baseUrl + '{$project.__js__}" charset="utf-8"></script>';
						} else {
							js = '<script type="text\/javascript">\n'
								+ jsContent
								+ '\n<\/script>';
						}
					}

					var layoutHtml = '<div class="' + wrapperClassName + '">\n' + clone.html() + '\n</div>';

					var html = '<!-- Generated By Cubie | ' + data.serverTime + ' -->\n' 
						+ matches[1] + matches[2] + matches[3] + '\n'
						+ dom.html()  + '\n'
						+ '<!-- Cubie Start -->' + '\n'
						+ css + '\n'
						+ layoutHtml + '\n'
						+ bgHtml + '\n'
						+ js + '\n'
						+ '<!-- Cubie End -->' + '\n'
						+ matches[5];

					callback && callback({
						css: (cssLnk ? cssContent : ''), // 外链时才传,否则为空
						js: (jsLnk ? jsContent : ''),
						html: html
					});

					dom = null;
				} else {
					$.showTips('获取模版失败，请重试！');
				}

				clone = null;
			}
		});
	}

	/**
	 * 缓存项目以及组件JSON
	 */
	function cacheJSON() {
		cacheProjectJSON();

		// 保存所有组件JSON数据
		try {
			$.each(__MODULE_API__, function(k, v) {
				v._cacheJSON();
			});
		} catch (e) {
			_Toast.open('缓存组件JSON数据失败：' + e);
			throw e;
		}
	}

	/**
	 * 保存草稿(草稿只针对编辑状态,输出时需删除)
	 */
	function saveDraft() {
		_Toast.open('正在保存草稿...', false);

		// 保存JSON数据
		cacheJSON();

		var data = {
			action: 'save_draft',
			id: __project__.id,
			layout: getSaveLayoutData()
		};

		$.ajax({
			type: 'POST',
			dataType: 'json',
			url: '/index.php/Project/layout/',
			data: data,
			success: function(data) {
				var rc = parseInt(data.retcode, 10);
				if (rc == 0) {
					_Toast.open('草稿保存成功');

					$('#delDraft_li').removeClass('disabled');
				} else {
					_Toast.open('草稿保存失败');
				}
			}
		});
	}

	/**
	 * 自动保存
	 */
	function autoSave() {
		setInterval(saveDraft, _autoSaveTime * 1000);
	}

	/**
	 * 删除草稿
	 */
	function delDraft(t) {
		// 不存在草稿时
		if (t.parent().hasClass('disabled')) {
			return;
		}

		$.showConfirm('删除草稿后当前布局数据将恢复到线上状态，你确定要继续吗？', function() {
			showLockModal('请稍后，正在删除...');

			var data = {
				action: 'del_draft',
				id: __project__.id
			};

			$.ajax({
				type: 'POST',
				dataType: 'json',
				url: '/index.php/Project/layout/',
				data: data,
				success: function(data) {
					var rc = parseInt(data.retcode, 10);

					if (rc == 0) {
						showLockModal('草稿删除成功，正在为你刷新...');
						setTimeout(function() {
							window.location.reload();
						}, 2000);
					} else {
						$.showTips(data.retmsg);
					}
				}
			});
		});
	}

	/**
	 * 获取项目数据(布局,提交的数据等等)
	 */
	function getProjectData(preview, callback) {
		// 布局解析
		layoutParser(preview, function(layout) {
			var resource = $.Layout._resource();
			var data = {
				id: __project__.id,
				css_lnk: _projectJSON.Output.css_lnk, // 是否生产外链CSS文件
				css: layout.css, // 样式内容,非外链时为空
				js_lnk: _projectJSON.Output.js_lnk, // 是否生产外链JS文件
				js: layout.js, // js,非外链时为空
				suffix: _projectJSON.Output.file_suffix, // 发布文件后缀
				layout: getSaveLayoutData(), // 入库的布局数据
				resource: resource.join(','), // 要发布的资源
				html: layout.html // 发布的页面数据
			};

			// 项目属性数据
			$.extend(true, data, _projectJSON.Project);

			callback && callback(data);	
		});
	}
	
	/**
	 *  发送项目数据
	 */
	function sendProjectData(action, successHandler) {
		// 预览时使用SSI替换的html; (预)发布/zip使用未解析的html内容
		var preview = (action == 'preview');

		// 后台同时保存草稿,这里需要保存JSON数据
		cacheJSON();

		getProjectData(preview, function(data) {
			data.action = action;

			$.ajax({
				type: 'POST',
				dataType: 'json',
				url: '/index.php/Project/layout/',
				data: data,
				success: function(data) {
					successHandler && successHandler(data);
				}
			});
		});
	}

	/**
	 * 开启窗口
	 */
	var openWin = function() {
		var count = 0;

		return function(name) {
			var win = window.open('', name);
			try {
				win.document.body;
				$(win.document.body).append(_newWinTips);
			} catch (e) {
				// 防止新开窗口设置了document.domain等不可访问
				win && win.close();
				win = openWin(name);
				count++;

				// 防止死循环
				if (count > 1) {
					return win;
				}
			}

			return win;
		};
	}();

	/**
	 * 预览(不保存草稿,只生成预览文件)
	 * 不能使用模拟表单提交方式预览,否则chrome等会阻止其中的js执行(XSS过滤)
	 */
	function preview() {
		showLockModal('请稍后，正在生成预览...');

		// 预开启窗口,防止被拦截
		var win = openWin('cubie_project_view');

		// 生成文件
		sendProjectData('preview', function(data) {
			var rc = parseInt(data.retcode, 10);

			if (rc == 0) {
				// 没有指定域名时直接打开本地预览地址
				if (!__tpl__.domain) {
					window.open(data.url + '?_=' + (+new Date()), 'cubie_project_view');
				} else {
					// data-cubie-domain与项目所选分类的域名应该是一致的,否则可能出现问题
					window.open(__tpl__.domain + '/cubie.html?_=' + (+new Date()), 'cubie_project_view');
					win.name = JSON.stringify({
						name: 'cubie_project_view',
						url: __project__.url,
						html: data.html
					});
				}

				$.showTips('请在新打开的窗口预览效果');
			} else {
				$.showTips(data.retmsg || '生成预览失败');
				win && win.close();
			}
		});
	}

	/**
	 * 是否可发布(预发布/正式发布)
	 */ 
	function pubEnable() {
		// 待正式发布审批状态认为可正式发布(审批通过后就无需刷新页面了)
		// 已正式发布审批状态可正式发布
		return $.inArray(__project__.audit_status, [AuditStatus.TOCHECK_PUB, AuditStatus.CHECKED_PUB]) != -1;
	}

	/**
	 * 预发布
	 */
	function prePub() {
		// 不支持发布
		if ($('#prePub_li').hasClass('disabled')) {
			return;
		}
		publish(true);
	}

	/**
	 * (申请)正式发布
	 */
	function pub() {
		// 不支持发布
		if ($('#pub_li').hasClass('disabled')) {
			return;
		}
		
		if (pubEnable()) {
			publish();
		} else { // 正式发布前审批
			$.applyAudit(__project__.id, '申请正式发布', function(form, msg) {
				applyAudit(msg);
				return true;
			});
		}
	}

	/**
	 * 申请审批
	 */
	function applyAudit(msg) {
		_Toast.open('发送申请中...', false);

		var data = {
			action: 'apply_audit',
			id: __project__.id,
			msg: msg
		};

		$.ajax({
			type: 'POST',
			dataType: 'json',
			url: '/index.php/Project/layout/',
			data: data,
			success: function(data) {
				var rc = parseInt(data.retcode, 10);
				if (rc == 0) {
					// 预更新审批状态为已正式发布审批
					__project__.audit_status = AuditStatus.CHECKED_PUB;
					// 切换菜单"申请正式发布"为"正式发布",这样子审批通过后,无需刷新页面
					$('#pub_li a').html('正式发布');

					_Toast.open('发布申请已发送，请留意审批通知。');
				} else {
					_Toast.open(data.retmsg);
				}
			}
		});
	}

	/**
	 * 发布
	 */
	function publish(pre) {
		$.showConfirm('你确定要' + (pre === true ? '预' : '正式') + '发布？', function() {
			showLockModal('请稍后，正在发布...');

			// 预开启窗口,防止被拦截
			var win = openWin('cubie_project_view');

			// 生成文件
			var action = (pre === true) ? 'pre_pub' : 'pub';
			sendProjectData(action, function(data) {
				var rc = parseInt(data.retcode, 10);

				if (rc == 0) {
					window.open(data.url, 'cubie_project_view');
					var html = (pre === true  ? '预' : '正式') + '发布成功，请检查~';

					$.showTips(html);
				} else {
					$.showTips(data.retmsg || '发布失败');
					win && win.close();
				}
			});	
		});
	}

	/**
	 * 生成zip包
	 */
	function zip() {
		var menu = $('#zip_li');
		// 不支持导出
		if (menu.hasClass('disabled')) {
			return;
		}

		showLockModal('请稍后，正在导出...');

		// 生成导出文件
		sendProjectData('zip', function(data) {
			var rc = parseInt(data.retcode, 10);

			if (rc == 0) {
				var html = 'Zip包导出成功，<a href="' + data.archive_url + '" target="_blank">若无自动下载请点此：' + data.archive_name + '</a>';
				window.open(data.archive_url, 'cubie_project_zip');
				$.showTips(html);
			} else {
				$.showTips(data.retmsg);
			};
		});
	}

	/**
	 * 结束编辑
	 */
	function endEdit() {
		var str = '你确定要结束编辑？';
		str += '<br /><br /><p style="color:#666">同时执行以下操作：</p>';
		str += '<form>'
		str += '<ul style="color:#666">';
		str += '<li><label class="checkbox"><input type="checkbox" checked="checked" disabled /> 保存草稿</label></li>';
		// 不支持发布的项目才可以选择是否入库
		if (__category__.pub_api == '') {
			str += '<li><label class="checkbox"><input type="checkbox" id="cubie_end_edit_save_db" /> 保存布局数据到数据库</label></li>';
		}
		str += '</ul>';
		str += '</form>';


		$.showConfirm(str, function() {
			// showLockModal前调用,防止表单被移除
			var saveDB = !!$('#cubie_end_edit_save_db').prop('checked');

			showLockModal('请稍后，正在提交...');

			// 保存JSON数据
			cacheJSON();

			getProjectData(false, function(data) {
				data.action = 'end_edit';
				data._save_db = saveDB ? 1 : 0;

				$.ajax({
					type: 'POST',
					dataType: 'json',
					url: '/index.php/Project/layout/',
					data: data,
					success: function(data) {
						var rc = parseInt(data.retcode, 10);

						if (rc == 0) {
							showLockModal('已结束编辑，正在为你跳转...');
							setTimeout(function() {
								_exitWithoutConfirm = true;
								window.location.href = '/index.php/Project';
							}, 2000);
						} else {
							$.showTips(data.retmsg);
						}
					}
				});
			});
		});
	}

	/**
	 * 防止误操作
	 */
	function misoperation() {
		// 防止一些实时更改URL操作的地方触发,非顶端调用时不注册
		if (window.parent == window) {
			window.onbeforeunload = function(e) {
				if (!_exitWithoutConfirm) {
					var str = '退出编辑前请确保数据已保存!';
					e = e || window.event;
					e.returnValue = str;
					return str;
				}
			};
		}
	}

	/**
	 * Ctrl快捷键操作
	 */
	function ctrlEdit(e) {
		var keyCode = e.which;
		if (e.ctrlKey) {
			switch (keyCode) {
				case 80: // P键, 预览
					preview();
					e.preventDefault();
					break;
				case 83: // S键, 保存草稿
					saveDraft();
					e.preventDefault();
					break;
			}
		}
	}

	/**
	 * 全局事件委托
	 */
	function route(e) {
		var t = $(e.target),
			evt = t.attr('data-event');

		switch (evt) {
			case 'toggleProjectPanel':
				toggleProjectPanel();
				break;	
			case 'toggleLayoutPanel':
				toggleLayoutPanel();
				break;
			case 'toggleOutputPanel':
				toggleOutputPanel();
				break;
			case 'toggleGlobalHtml':
				toggleGlobalHtml();
				break;
			case 'closeSidebar':
				closeSidebar();
				break;
			case 'saveDraft':
				saveDraft();
				break;
			case 'preview':
				preview();
				break;
			case 'prePub':
				prePub();
				break;
			case 'pub':
				pub();
				break;
			case 'removeLayoutBg':
				removeLayoutBg(t);
				break;
			case 'toggleGridLine':
				toggleGridLine(t);
				break;
			case 'toggleCoordinateLine':
				toggleCoordinateLine(t);
				break;
			case 'toggleTplSubstrate':
				toggleTplSubstrate(t);
				break;
			case 'toggleTplSubstrateBlock':
				toggleTplSubstrateBlock(t);
				break;
			case 'switchModule':
				switchModule(t);
				break;
			case 'zip':
				zip();
				break;
			case 'delDraft':
				delDraft(t);
				break;
			case 'endEdit':
				endEdit();
				break;
		}

		if (evt) {
			return false;
		}
	}

	/**
	 * 键盘事件监听
	 * 1) 只有字符按键才能触发keypress事件，任何按键都能触发keydown事件，比如：F1-F12、方向键等只能用keydown
	 * 2) keydown返回的是键盘的代码, keypress返回的是ASCII字符，以字符a为例，keydown返回65，而keypress返回97
	 */
	function keydown(e) {
		var keyCode = e.which;
		switch (keyCode) {
			case 37: // 左
			case 38: // 上
			case 39: // 右
			case 40: // 下
				moveElement(e);
				break;
			case 46: // delete
				removeFocusModule(e);
				break;
			default:
				ctrlEdit(e);
				break;
			// case 9: // Tab
			// case 16: // Shift
			// case 13: // Enter
		}
	}

	/**
	 * 与初始化与项目无关的信息
	 */
	function init() {
		// 初始化提示
		_Toast.open('正在初始化系统，请稍后...', false);

		// 支持运维发布的分类,可以执行以下操作
		// 1) 可以调用生成zip包
		// 2) 可以调用(预)发布
		if (__category__.pub_api == '') {
			$('#prePub_li').addClass('disabled').attr('title', '当前项目不支持发布');
			$('#pub_li').addClass('disabled').attr('title', '当前项目不支持发布');
		} else {
			// $('#zip_li').addClass('disabled').attr('title', '当前项目不支持导出Zip包');

			// 待正式发布审批状态认为可正式发布
			// 已正式发布审批状态可正式发布
			$('#pub_li a').html(pubEnable() ? '正式发布' : '申请正式发布');
		}

		// 不存在草稿
		if (__project__.draft == 0) {
			$('#delDraft_li').addClass('disabled');
		}

		// 禁用右键菜单
		disableContextMenu();
	}

	/**
	 * 注册全局接口,与衬底进行通讯
	 */
	window.Cubie_Layout_API = {
		/**
		 * 衬底iframe回调
		 * @param {Object} data 项目模板数据
		 */
		ready: function(data) {
			_projectTplData = data;

			// 初始化项目全局信息
			initProject();

			// init/reset
			reset();
			$(window).resize(reset);

			// 初始化区块
			initBlock();

			// 恢复已有组件
			recoverModule();

			// 组件drag&drop
			initModuleDragDrop();

			// 组件框选
			initModuleSelected();

			// 坐标线
			_layoutWrapper.mousemove(moveCoordinate);

			// 侧边栏鼠标移上时展开
			_sidebarToggle.mouseover(openSidebar);

			// 事件委托
			$(document).click(route)
				.keydown(keydown);


			// 组件内若有iframe,则在iframe上的点击或拖拽无效;
			// 这里检查若是iframe,则添加div覆盖使之可以点击或拖拽
			$(_layoutWrapper).on('mouseover', function(e) {
				var target = $(e.target),
					p;

				// 只处理组件内的iframe,flash
				if ($.inArray(nodeName, ['param', 'embed']) != -1) {
					target = target.parent('object');
					nodeName = target[0].nodeName.toLowerCase();
				}

				if ($.inArray(nodeName, ['iframe', 'object']) != -1 && (p = target.parent('.cubie-module-editarea')).length> 0) {
					$('<div class="cubie-module-maskfix cubie-redundant-dom-inner"></div>').insertAfter(p)
						.on('mouseout', function(e) {
							$(this).remove();
						});
				}
			});


			// 初始化右上角控制按钮状态
			toggleGridLine($('#cubie_toggleGridLine'), true);
			toggleCoordinateLine($('#cubie_toggleCoordinateLine'), true);
			toggleTplSubstrate($('#cubie_toggleTplSubstrate'), true);
			toggleTplSubstrateBlock($('#cubie_toggleTplSubstrateBlock'), true);

			// 自动保存
			autoSave();

			// 防止刷新/关闭误操作
			misoperation();

			// 初始化完毕,去除提示
			if (__project__.draft == 1) {
				_Toast.open('已从' + __project__.draftFileTime + '保存的草稿中恢复~', 5000);
			} else {
				_Toast.close();
			}
		}
	};

	init();
});
