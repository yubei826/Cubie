/**
 * 组件编辑
 * @author: Zawaliang
 */

$(function() {

	var _modulePanel = $('#cubie_modal_module'), // 组件预览面板
		_modulePanelBody = $('#cubie_modal_module').find('.modal-body'),
		_modulePanelWidth = _modulePanel.width(), // 组件预览面板
		_features = {}, // 缓存特性
		_featureIDPrefix = 'cubie_module_preview_', // 预览特性ID前缀
		_cmFeatureHtml = null, // 自定义特性html CodeMirrr
		_cmFeatureCss = null; // 自定义特性css CodeMirrr
		

	/**
	 * 切换组件分类
	 */
	var switchCategotyType = function(e) {
		var categoryList = $('#category_list');
		$('#category_type').val()  == 0 ? categoryList.hide() : categoryList.show();
	};

	/**
	 * 移除缩略图
	 */
	var removeThumb = function(e) {
		$('#thumbnail').val('');
		$('#thumbnail_img').html('');
		return false;
	}

	/**
	 * 初始化缩略图
	 */
	var initThumb = function(img) {
		$('#thumbnail_img').html('<a class="close" href="#" title="移除缩略图">&times;</a><img src="' + img + '" class="img-polaroid" />')
			.find('a')
			.click(removeThumb);

	};

	// resize
	var resize = function(e) {
		initModulePanel();
	};

	/**
	 * 初始化特性列表
	 */
	var initFeatureList = function(filterRequiredFeature) {
		var features = $.Feature.get(),
			html = '';

		$.each(features, function(k, v) {
			// 只罗列非required的特性
			if ($.inArray('required', v.property) == -1) {
				html += '<li>'
					+ '<input type="checkbox" class="cubie-feature-cbx" id="cbx_feature_' + k + '" data-featureid="' + k + '" data-event="toggleFeatureToModulePanel" />' 
					+ v.html
					+ '</li>';
			} else if ($.inArray(k, filterRequiredFeature) == -1) { // 只罗列由于增删造成的没有入库的required的特性, 已初始化的required特性不再处理
				addSysFeature(k);
			}
		});
		$('#feature_list').html(html);
	};

	/**
	 * 组件预览面板
	 */
	var toggleModulePanel = function(e) {
		var obj = $(e.target),
			close = false;

		if (obj.hasClass('icon-chevron-right')) {
			close = true;
		} else {
			_modulePanel.show();
		}

		_modulePanel.animate({
			width:  close ? 0 : _modulePanelWidth
		}, {
			duration: 300,
			complete: function() {
				if (close) {
					_modulePanel.hide();
				}
			}
		});
	};

	/**
	 * 初始化组件面板高度自适应
	 */ 
	var initModulePanel = function() {
		var panelHeight = $(window).height() - 100,
			header = _modulePanel.find('.modal-header'),
			footer = _modulePanel.find('.modal-footer'),
			modalBodyMaxHeight = panelHeight - header.outerHeight() - footer.outerHeight() - (_modulePanelBody.outerHeight() - _modulePanelBody.height());

		_modulePanel.css({
				'max-height': panelHeight + 'px'
			});

		_modulePanelBody.css({
				'max-height': modalBodyMaxHeight + 'px'
			});
	};

	/**
	 * 特性排序
	 */
	var resortFeatures = function(e, ui) {
		var features = $('.cubie-feature-fieldset');
		var result = {};
		features.each(function(k, v) {
			var featureID = $(v).attr('id').replace(_featureIDPrefix, '');
			result[featureID] = _features[featureID];
		});
		_features = result;
		updateFeatureField();
	};

	/**
	 * 更新特性字段
	 */
	var updateFeatureField = function() {
		var json = JSON.stringify(_features);
		$('textarea[name="feature"]').val(json);
	};

	/**
	 * 添加系统特性到组件面板
	 * @param {String} featureID
	 */
	var addSysFeature = function(featureID) {
		var feature = $.Feature.get(featureID);

		// 过滤掉可能由于特性删减造成的不存在的特性
		if (!feature) {
			return;
		}

		var id = _featureIDPrefix + featureID;

		var obj = $('<div class="cubie-feature-fieldset">' 
			+ ($.inArray('required', feature.property) == -1 ? '<i class="icon-remove js-feature-remove" title="移除" data-featureid="' + featureID + '" data-event="toggleFeatureToModulePanel"></i>' : '') 
			+ feature.html + '</div>');

		obj.attr('id', id);
		$('#cbx_feature_' + featureID).prop('checked', true);
		_modulePanelBody.append(obj);

		_features[featureID] = {};
	};

	/**
	 * 从组件面板移除特性
	 * @param {String} featureID
	 */
	var removeFeature = function(featureID) {
		$('#' + _featureIDPrefix + featureID).remove();

		_features[featureID] = null;
		delete _features[featureID];
	};

	/**
	 * 特性添加/移除到组件面板
	 */
	var toggleFeatureToModulePanel = function(e) {
		var obj = $(e.target),
			featureID = obj.attr('data-featureid'),
			isCbx = !obj.hasClass('js-feature-remove');

		// 关闭按钮点击时
		if (isCbx && obj.prop('checked')) {
			addSysFeature(featureID);
		} else {
			removeFeature(featureID);
			if (!isCbx) {
				var cbx = $('#cbx_feature_' + featureID);
				cbx[0] && cbx.prop('checked', false);
			}
		}

		updateFeatureField();
	};

	/**
	 * 打开自定义特性面板
	 */
	var openCustomFeaturePanel = function() {
		$('#cubie_modal_add_feature').modal({
				backdrop: false
			})
			.find('form')[0]
			.reset();

		 $('#custom_feature_id').val('');
		 $('#custom_feature_btn').html('添 加');
		 $('#custom_feature_title').focus();

		 onceInitCustomCodeMirror();

		 // 清空上次CodeMirror的值
		 _cmFeatureHtml.doc.setValue('');
		 _cmFeatureCss.doc.setValue('');
	};

	/**
	 * 自定义特性面板
	 */
	var initCustomFeaturePanel = function() {
		var panel = $('#cubie_modal_add_feature');
		// 可拖拽
		panel.draggable({
			cancel: 'input,.CodeMirror' // CodeMirror内不可拖拽
		});

		panel.find('form').validate({
			errorLabelContainer: '#feature_error',
			rules: {
				custom_feature_title: {
					required: true
				},
				custom_feature_html: {
					required: true
				}
			},
			messages: {
				custom_feature_title: {
					required: '请填写特性名称'
				},
				custom_feature_html: {
					required: '请填写特性HTML'
				}
			},
			submitHandler: function(form) {
				var data = $.serializeArrayToJSON($(form).serializeArray());
				$('#custom_feature_btn').html('更 新');
				addCustomFeature({
					title: data.custom_feature_title,
					html: data.custom_feature_html,
					css: data.custom_feature_css
				});
			}
		});
	};

	/**
	 * 添加自定义特性
	 */
	var addCustomFeature = function(data) {
		var id = $('#custom_feature_id').val();
		var customObj = $('#' + id);
		var featureID;

		if (customObj[0]) {
			featureID = id.replace(_featureIDPrefix, '');
		} else {
			featureID = $.getGUID();
			id = _featureIDPrefix + featureID;
		}

		var obj = $('<div class="cubie-feature-fieldset">'
			+ '<i class="icon-pencil js-feature-edit" title="编辑" data-featureid="' + featureID + '" data-event="editFeature"></i>'
			+ '<i class="icon-remove js-feature-remove" title="移除" data-featureid="' + featureID + '" data-event="toggleFeatureToModulePanel"></i>'
			+ '<fieldset><legend>' + data.title + '</legend>'
			+ (data.css ? '<style type="text/css">' + data.css + '</style>' : '')
			+ data.html
			+ '</fieldset>'
			+ '</div>');

		obj.attr('id', id);
		
		if (customObj[0]) {
			// 插入后删除,保持顺序不变
			customObj.after(obj);
			customObj.remove();
		} else {
			_modulePanelBody.append(obj)
		}

		$('#custom_feature_id').val(id);

		_features[featureID] = {
			title: data.title ,
			html: data.html,
			css: data.css
		};

		updateFeatureField();
	};

	/**
	 * 编辑特性
	 */
	var editFeature = function(e) {
		var obj = $(e.target),
			featureID = obj.attr('data-featureid'),
			data = _features[featureID];

		$('#cubie_modal_add_feature').modal({
				backdrop: false
			});
		$('#custom_feature_id').val(_featureIDPrefix + featureID);
		$('#custom_feature_title').val(data.title).focus();
		$('#custom_feature_html').val(data.html);
		$('#custom_feature_css').val(data.css);
		$('#custom_feature_btn').html('更 新');

		onceInitCustomCodeMirror();

		// 设置CodeMirror的值
		_cmFeatureHtml.doc.setValue(data.html);
		_cmFeatureCss.doc.setValue(data.css);
	};


	/**
	 * CodeMirror
	 */
	// var isFullScreen = function(cm) {
	// 	return $(cm.getWrapperElement()).hasClass('CodeMirror-fullscreen');
	// }
	// var setFullScreen = function(cm, full) {
	// 	var wrap = cm.getWrapperElement();
	// 	if (full) {
	// 		$(wrap).addClass('CodeMirror-fullscreen')
	// 			.css({
	// 				height: $(window).height() + 'px'
	// 			});
	// 		$(document.body).css({
	// 			overflow: 'hidden'
	// 		});
	// 	} else {
	// 		$(wrap).removeClass('CodeMirror-fullscreen')
	// 			.css({
	// 				height: ''
	// 			});
	// 		$(document.body).css({
	// 			overflow: ''
	// 		});
	// 	}
	// 	cm.refresh();
	// }

	var initCodeMirror = function(options) {
		var cmDefaultConf = {
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
		
		// CodeMirror.on(window, 'resize', function() {
		// 	var showing = $('.CodeMirror-fullscreen')[0];
		// 	if (!showing) {
		// 		return;
		// 	}
		// 	$(showing.CodeMirror.getWrapperElement()).css({
		// 		height: $(window).height() + 'px'
		// 	});
		// });

		// HTML
		var cmConf = {
			mode: options.mode || 'text/html'
		};
		$.extend(true, cmConf, cmDefaultConf);

		var obj = $(options.selector),
			width = obj.innerWidth(),
			height = obj.innerHeight();

		var cm = CodeMirror.fromTextArea(obj[0], cmConf);
		// 对于隐藏的元素,就不设置尺寸;使用默认样式
		if (width > 0 && height > 0) {
			cm.setSize(width, height);	
		}
		cm.on('keyup', function(cm, e) {
			cm.save(); // 保存数据到textarea

			if ($.type(options.keyupHandler) == 'function') {
				options.keyupHandler.apply(null, [cm, e]);
			}
		});

		return cm;
	};

	/**
	 * 初始化自定义特性CodeMirror
	 * 自定义特性面板弹出时执行一次
	 */
	var onceInitCustomCodeMirror = $.once(function() {
		_cmFeatureHtml = initCodeMirror({
			selector: '#custom_feature_html',
			mode: 'text/html'
		});
		_cmFeatureCss = initCodeMirror({
			selector: '#custom_feature_css',
			mode: 'text/css'
		});
	});

	/**
	 * 全局事件委托
	 */
	var route = function(e) {
		var t = $(e.target),
			evt = t.attr('data-event');

		switch (evt) {
			case 'toggleModulePanel':
				toggleModulePanel(e);
				break;
			case 'toggleFeatureToModulePanel':
				toggleFeatureToModulePanel(e);
				break;
			case 'openCustomFeaturePanel':
				openCustomFeaturePanel();
				break;
			case 'editFeature':
				editFeature(e);
				break;
		}
	};

	

	// ---------------------init-----------------------

	// 表单验证
	$.validator.addMethod('checkCategoryID', function(value, element) {
		if (value == 1) {
			var checkedObj = $('input[name="_category_id"]:checked'),
				val = [];

			checkedObj.each(function(k, v) {
				val.push($(v).val());
			});
			$('input[name="category_id"]').val(val.join('|'));
			return val.length > 0;
		} else {
			$('input[name="category_id"]').val(0);
		}
		return true;
	}, '请选择组件分类');

	var validator = $('#frm').validate({
		errorElement: 'span',
		rules: {
			title: {
				required: true
			},
			category_type: {
				checkCategoryID: true
			}
		},
		messages: {
			title: {
				required: '请输入组件名称'
			}
		}
	});

	// 分类点选时,触发组件分类下拉表单校验
	$('.js-category-id').click(function(e) {
		if ($(e.target).is('input')) {
			// http://jqueryvalidation.org/Validator.element/
			validator.element('#category_type');
		}
	});

	// 上传缩略图
	$('#module_thumbnail').uploadify({
		auto: true, // 自动上传
		swf: '/Public/Home/Js/uploadify/uploadify.swf',
		// buttonClass: 'btn btn-primary',
		buttonText: '选择图片 (180x100)',
		width: 140, // 按钮宽度
		height: 25, // 按钮高度
		multi: false, // 不支持多图片上传
		fileObjName: 'thumbnail',
		formData: {
			action: 'upload_thumbnail'
		},
		uploader: '/index.php/Build/' + __action__,
		fileTypeDesc: '支持的格式',
		fileTypeExts: '*.jpg;*.jpge;*.gif;*.png',
		fileSizeLimit: '1MB',
		onUploadSuccess: function(file, data, response) {
			var json = JSON.parse(data);
			var rc = parseInt(json.retcode, 10);
			if (rc == 0) {
				$('#thumbnail').val(json.file.path); // 存储根路径即可
				initThumb(json.file.path);
			} else {
				$.showTips(json.retmsg);
			}
		}
	});


	// 组件面板
	initModulePanel();

	// 自定义特性面板
	initCustomFeaturePanel();

	// 分类切换
	$('#category_type').change(switchCategotyType);

	// 特性排序
	_modulePanelBody.sortable({
		stop: resortFeatures
	});

	// CodeMirror
	initCodeMirror({
		selector: '#html',
		mode: 'text/html'
	});
	initCodeMirror({
		selector: '#css',
		mode: 'text/css'
	});
	initCodeMirror({
		selector: '#js',
		mode: 'text/javascript'
	});
	initCodeMirror({
		selector: '#debug_js',
		mode: 'text/javascript',
		keyupHandler: function(cm, e) {
			$('textarea[name="feature_js"]').val(cm.doc.getValue()); // 同步到表单feature_js
		}
	});
	


	$(window).resize(resize);
	$(document).click(route);


	//--------------------初始化修改操作时的数据----------------------


	// 初始化组件分类
	var categoryID = $('input[name="category_id"]').val();
	if (categoryID != '' && categoryID != '0') {
		categoryID = categoryID.split('|');
		$('#category_type').val(1);
		$.each(categoryID, function(k, v) {
			$('input[name="_category_id"][value="' + v + '"]').prop('checked', true);
		});
	} else {
		$('#category_type').val(0);
	}
	switchCategotyType();

	// 初始化缩略图
	if (__action__ == 'editModule' && __thumbnail__) {
		initThumb(__thumbnail__);	
	}


	

	// 初始化特性
	if (__action__ == 'editModule') {
		var customFeatures = $.trim($('textarea[name="feature"]').val());
		customFeatures = customFeatures ? $.parseJSON(customFeatures) : {};

		// 获取已入库的required特性
		var  filterRequiredFeature = [];
		$.each(customFeatures, function(k, v) {
			var curFeature = $.Feature.get(k) || {};
			if ($.inArray('required', curFeature.property) != -1) {
				filterRequiredFeature.push(k);
			}
		});

		// 先初始化没入库的required特性
		initFeatureList(filterRequiredFeature);

		//  再初始化已入库的required特性,保持顺序不变
		$.each(customFeatures, function(k, v) {
			// 是否系统特性
			var isSysFeature = !(v.title && v.html);

			if (isSysFeature) {
				addSysFeature(k);
			} else { // 自定义特性
				var curCustomFeature = customFeatures[k];
				addCustomFeature({
					title: curCustomFeature.title,
					html: curCustomFeature.html,
					css: curCustomFeature.css
				});
				// 添加完后需清空custom_feature_id,否则会被后续的覆盖
				$('#custom_feature_id').val('');
			}
		});
	} else {
		initFeatureList([]);
	}

});
