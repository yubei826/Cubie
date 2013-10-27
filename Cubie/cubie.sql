-- phpMyAdmin SQL Dump
-- version 4.0.4.1
-- http://www.phpmyadmin.net
--
-- 主机: 127.0.0.1
-- 生成日期: 2013 年 10 月 27 日 06:51
-- 服务器版本: 5.5.32
-- PHP 版本: 5.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- 数据库: `cubie`
--
CREATE DATABASE IF NOT EXISTS `icubie` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `cubie`;

-- --------------------------------------------------------

--
-- 表的结构 `cubie_access`
--

CREATE TABLE IF NOT EXISTS `cubie_access` (
  `role_id` smallint(6) unsigned NOT NULL,
  `node_id` smallint(6) unsigned NOT NULL,
  `level` tinyint(1) NOT NULL,
  `pid` smallint(6) NOT NULL,
  `module` varchar(50) DEFAULT NULL,
  KEY `groupId` (`role_id`),
  KEY `nodeId` (`node_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `cubie_access`
--

INSERT INTO `cubie_access` (`role_id`, `node_id`, `level`, `pid`, `module`) VALUES
(8, 83, 3, 82, NULL),
(8, 82, 2, 62, NULL),
(8, 62, 1, 0, NULL),
(8, 64, 3, 63, NULL),
(8, 63, 2, 62, NULL),
(8, 65, 3, 63, NULL),
(8, 66, 3, 63, NULL),
(8, 67, 3, 63, NULL),
(8, 68, 3, 63, NULL),
(8, 69, 3, 63, NULL),
(8, 70, 3, 63, NULL),
(8, 71, 3, 63, NULL),
(8, 72, 3, 63, NULL),
(8, 73, 3, 63, NULL),
(8, 74, 3, 63, NULL),
(8, 75, 3, 63, NULL),
(8, 76, 3, 63, NULL),
(8, 77, 3, 63, NULL),
(8, 78, 3, 63, NULL),
(8, 79, 3, 63, NULL),
(2, 66, 3, 63, NULL),
(2, 63, 2, 62, NULL),
(2, 64, 3, 63, NULL),
(2, 62, 1, 0, NULL),
(2, 67, 3, 63, NULL),
(2, 68, 3, 63, NULL),
(2, 69, 3, 63, NULL),
(2, 70, 3, 63, NULL),
(2, 71, 3, 63, NULL),
(2, 72, 3, 63, NULL),
(2, 73, 3, 63, NULL),
(2, 74, 3, 63, NULL),
(2, 75, 3, 63, NULL),
(2, 76, 3, 63, NULL),
(2, 77, 3, 63, NULL),
(2, 78, 3, 63, NULL),
(2, 79, 3, 63, NULL),
(2, 83, 3, 82, NULL),
(2, 82, 2, 62, NULL),
(2, 65, 3, 63, NULL),
(2, 84, 3, 82, NULL),
(2, 86, 3, 85, NULL),
(2, 85, 2, 62, NULL),
(2, 87, 3, 85, NULL),
(2, 88, 3, 85, NULL),
(2, 89, 3, 85, NULL),
(2, 90, 3, 85, NULL),
(2, 91, 3, 85, NULL),
(2, 92, 3, 85, NULL),
(2, 93, 3, 85, NULL),
(2, 94, 3, 85, NULL),
(2, 96, 3, 95, NULL),
(2, 95, 2, 62, NULL),
(2, 97, 3, 95, NULL),
(2, 98, 3, 95, NULL),
(2, 100, 3, 99, NULL),
(2, 99, 2, 62, NULL),
(2, 101, 3, 99, NULL),
(2, 102, 3, 99, NULL),
(2, 103, 3, 99, NULL),
(2, 104, 3, 99, NULL),
(2, 105, 3, 99, NULL),
(2, 106, 3, 99, NULL),
(2, 107, 3, 99, NULL),
(2, 108, 3, 99, NULL),
(2, 109, 3, 99, NULL),
(2, 110, 3, 99, NULL),
(2, 111, 3, 99, NULL);

-- --------------------------------------------------------

--
-- 表的结构 `cubie_category`
--

CREATE TABLE IF NOT EXISTS `cubie_category` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(20) NOT NULL COMMENT '分类名称',
  `intro` varchar(20) NOT NULL COMMENT '分类标识',
  `url` varchar(255) DEFAULT NULL COMMENT '分类对应的路径',
  `pub_api` varchar(20) DEFAULT '' COMMENT '发布接口类型',
  `auditor` varchar(255) NOT NULL COMMENT '编辑审批人,以分号分割',
  `pub_auditor` varchar(255) DEFAULT NULL COMMENT '发布审批人;已分号分割',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=22 ;

--
-- 转存表中的数据 `cubie_category`
--

INSERT INTO `cubie_category` (`id`, `title`, `intro`, `url`, `pub_api`, `auditor`, `pub_auditor`) VALUES
(15, 'cat', '不支持发布的分类', 'http://www.zawaliang.com/demo/', '', 'zawa', ''),
(14, 'test', '测试', '%year%/', 'test', 'zawa', 'zawa');

-- --------------------------------------------------------

--
-- 表的结构 `cubie_log`
--

CREATE TABLE IF NOT EXISTS `cubie_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `type` tinyint(3) unsigned NOT NULL COMMENT '日志类型',
  `user` varchar(20) NOT NULL COMMENT '操作用户',
  `operation` varchar(255) NOT NULL COMMENT '操作',
  `create_time` int(11) unsigned NOT NULL COMMENT '时间',
  PRIMARY KEY (`id`),
  KEY `type` (`type`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=74 ;

--
-- 转存表中的数据 `cubie_log`
--

INSERT INTO `cubie_log` (`id`, `type`, `user`, `operation`, `create_time`) VALUES
(71, 1, 'admin', 'pub=1|category_id=14|project_id=28', 1382851073),
(72, 1, 'admin', 'pub=1|category_id=14|project_id=28', 1382851132),
(73, 1, 'admin', 'pub=2|category_id=14|project_id=28', 1382851161);

-- --------------------------------------------------------

--
-- 表的结构 `cubie_module`
--

CREATE TABLE IF NOT EXISTS `cubie_module` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` varchar(255) NOT NULL DEFAULT '0' COMMENT '组件所属分类,0表示公用组件',
  `title` varchar(20) NOT NULL COMMENT '组件标题',
  `html` mediumtext NOT NULL COMMENT '组件HTML结构',
  `css` mediumtext NOT NULL COMMENT '组件HTML结构',
  `js` mediumtext NOT NULL COMMENT '组件HTML结构',
  `feature_js` mediumtext NOT NULL COMMENT '特性驱动JS',
  `thumbnail` varchar(255) DEFAULT NULL COMMENT '组件缩略图',
  `feature` mediumtext NOT NULL COMMENT '组件特性',
  `create_time` int(11) unsigned NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=14 ;

--
-- 转存表中的数据 `cubie_module`
--

INSERT INTO `cubie_module` (`id`, `category_id`, `title`, `html`, `css`, `js`, `feature_js`, `thumbnail`, `feature`, `create_time`) VALUES
(6, '0', '链接', '<a href="" cubie="lnk">链接文本</a>', '', '', 'function(M) {  \r\n  // 组件编辑区链接\r\n  var oLnk = M.find(''lnk'');\r\n\r\n // 组件面板表单元素\r\n var oText = M.panel.find(''.js-text'');\r\n var oHref = M.panel.find(''.js-href'');\r\n var oStatname = M.panel.find(''.js-statname'');\r\n var oBlank = M.panel.find(''.js-blank'');\r\n\r\n // 恢复数据\r\n oText.val(M.jsonFeature(''text'') || '''');\r\n oHref.val(M.jsonFeature(''href'') || '''');\r\n oStatname.val(M.jsonFeature(''statname'') || '''');\r\n oBlank.prop(''checked'', !!M.jsonFeature(''blank''));\r\n\r\n // 组件面板内交互\r\n\r\n  oText.on(''input'', function(e) {\r\n   var val = $(this).val();\r\n    M.jsonFeature(''text'', val);\r\n   oLnk.html(val);\r\n });\r\n oHref.on(''input'', function(e) {\r\n   var val = $.trim($(this).val());\r\n    M.jsonFeature(''href'', val);\r\n   oLnk.attr(''href'', val);\r\n });\r\n oStatname.on(''input'', function(e) {\r\n   var val = $.trim($(this).val());\r\n    M.jsonFeature(''statname'', val);\r\n   oLnk.attr(''data-stat'', val);\r\n  });\r\n oBlank.click(function(e) {\r\n    var checked = $(this).prop(''checked'');\r\n    M.jsonFeature(''blank'', checked);\r\n    if (checked) {\r\n      oLnk.attr(''target'', ''_blank'');\r\n    } else {\r\n      oLnk.removeAttr(''target'');\r\n    }\r\n });\r\n}', '', '{"base":{},"global":{},"c18bca0e418afb6f1c10a6fa7ad1fad32":{"title":"链接属性","html":"<div class=\\"input-prepend cubie-field\\">\\r\\n\\t<span class=\\"add-on\\">文本</span>\\r\\n\\t<input name=\\"color\\" type=\\"text\\" class=\\"input-small span2 js-text\\" autocomplete=\\"off\\">\\r\\n</div>\\r\\n<div class=\\"input-prepend cubie-field\\">\\r\\n\\t<span class=\\"add-on\\">地址</span>\\r\\n\\t<input name=\\"color\\" type=\\"text\\" placeholder=\\"需包含http(s)://\\" class=\\"input-small span3 js-href\\" autocomplete=\\"off\\">\\r\\n</div>\\r\\n<hr />\\r\\n<div class=\\"input-prepend cubie-field\\">\\r\\n\\t<span class=\\"add-on\\">点击流</span>\\r\\n\\t<input name=\\"color\\" type=\\"text\\" placeholder=\\"使用data-stat\\" class=\\"input-small span2 js-statname\\" autocomplete=\\"off\\">\\r\\n</div>\\r\\n<label class=\\"checkbox inline\\">\\r\\n    <input type=\\"checkbox\\" class=\\"js-blank\\"> 新开窗口\\r\\n</label>","css":""}}', 1378351918),
(7, '0', '图片', '<img src="#" cubie="img" />', '', '', 'function(M) {\r\n  // 删除组件时移除图片\r\n  M.onDestroy(function() {\r\n    var img = M.jsonFeature(''image'')\r\n    img && M.Common.removeResource(img);\r\n  }); \r\n\r\n  // 组件编辑区链接\r\n  var oImg = M.find(''img'');\r\n\r\n var oUpload = M.panel.find(''.js-upload'');\r\n var oWidth = M.panel.find(''.js-width'');\r\n var oHeight = M.panel.find(''.js-height'');\r\n var oAlt = M.panel.find(''.js-alt'');\r\n\r\n // 恢复数据\r\n oWidth.val(M.jsonFeature(''width'') || '''');\r\n oHeight.val(M.jsonFeature(''height'') || '''');\r\n oAlt.val(M.jsonFeature(''alt'') || '''');\r\n\r\n // 初始化上传\r\n  M.initUpload({\r\n    selector: oUpload,\r\n    onUploadSuccess: function(file, data, response) {\r\n     var f = data.file[0];\r\n     var info = data.info[0];\r\n\r\n      oImg.attr(''src'', f.path);\r\n     oWidth.val(f.width);\r\n      oHeight.val(f.height);\r\n\r\n      // 上一张上传的图片\r\n     var lastImage = M.jsonFeature(''image'') || '''';\r\n     // 移除上一张图片\r\n      lastImage && M.Common.removeResource(lastImage);\r\n      // 添加新增的图片到缓存队列\r\n     M.Common.saveResource(info.savename);\r\n     M.jsonFeature(''image'', info.savename);\r\n    }\r\n });\r\n\r\n oWidth.on(''input'', function(e) {\r\n    var val = parseInt($.trim($(this).val()), 10) || 0;\r\n   M.jsonFeature(''width'', val);\r\n    if (val > 0) {\r\n      oImg.css(''width'', val);\r\n   } else {\r\n      oImg.css(''width'', '''');\r\n    }\r\n });\r\n oHeight.on(''input'', function(e) {\r\n   var val = parseInt($.trim($(this).val()), 10) || 0;\r\n   M.jsonFeature(''height'', val);\r\n   if (val > 0) {\r\n      oImg.css(''height'', val);\r\n    } else {\r\n      oImg.css(''height'', '''');\r\n   }\r\n });\r\n oAlt.on(''input'', function(e) {\r\n    var val = $.trim($(this).val());\r\n    M.jsonFeature(''alt'', val);\r\n    if (val > 0) {\r\n      oImg.attr(''alt'', val);\r\n    } else {\r\n      oImg.removeAttr(''alt'');\r\n   }\r\n });\r\n\r\n //---------------------------\r\n\r\n function getLnk() {\r\n   var p = oImg.parent();\r\n    if (p.is(''a'')) {\r\n      return p;\r\n   } else {\r\n      oImg.wrap(''<a></a>'');\r\n     return oImg.parent();\r\n   }\r\n }\r\n // 检查是否需要移除链接\r\n function detectLnk() {\r\n    var h = $.trim(href.val());\r\n   var p = oImg.parent();\r\n    // 链接地址不存在时移除\r\n   if (!h && p.is(''a'')) {\r\n      oImg.unwrap();\r\n    }\r\n }\r\n\r\n // 组件面板表单元素\r\n var href = M.panel.find(''.js-href'');\r\n  var statname = M.panel.find(''.js-statname'');\r\n  var blank = M.panel.find(''.js-blank'');\r\n\r\n  // 恢复数据\r\n href.val(M.jsonFeature(''href'') || '''');\r\n  statname.val(M.jsonFeature(''statname'') || '''');\r\n  blank.prop(''checked'', !!M.jsonFeature(''blank''));\r\n\r\n  href.on(''input'', function(e) {\r\n    var val = $.trim($(this).val());\r\n    var lnk = getLnk();\r\n   M.jsonFeature(''href'', val);\r\n   if (val) {\r\n      lnk.attr(''href'', val);\r\n    } else {\r\n      lnk.removeAttr(''href'');\r\n   }\r\n   detectLnk();\r\n  });\r\n statname.on(''input'', function(e) {\r\n    var val = $.trim($(this).val());\r\n    var lnk = getLnk()\r\n    M.jsonFeature(''statname'', val);\r\n   if (val) {\r\n      lnk.attr(''data-stat'', val);\r\n   } else {\r\n      lnk.removeAttr(''data-stat'');\r\n    }\r\n   detectLnk();\r\n  });\r\n blank.click(function(e) {\r\n   var checked = $(this).prop(''checked'');\r\n    var lnk = getLnk()\r\n    M.jsonFeature(''blank'', checked);\r\n    if (checked) {\r\n      lnk.attr(''target'', ''_blank'');\r\n   } else {\r\n      lnk.removeAttr(''target'');\r\n   }\r\n   detectLnk();\r\n  });\r\n}', '', '{"base":{},"c28f43214499f84d6b4dcb37dbf323db5":{"title":"图片属性","html":"<div class=\\"js-upload\\"></div>\\r\\n<hr />\\r\\n<div class=\\"input-prepend cubie-field\\">\\r\\n\\t<span class=\\"add-on\\">宽度</span>\\r\\n\\t<input name=\\"color\\" type=\\"text\\" class=\\"input-mini js-width\\" autocomplete=\\"off\\">\\r\\n</div>\\r\\n<div class=\\"input-prepend cubie-field\\">\\r\\n\\t<span class=\\"add-on\\">高度</span>\\r\\n\\t<input name=\\"color\\" type=\\"text\\" class=\\"input-mini js-height\\" autocomplete=\\"off\\">\\r\\n</div>\\r\\n<div class=\\"input-prepend cubie-field\\">\\r\\n\\t<span class=\\"add-on\\">图片说明</span>\\r\\n\\t<input name=\\"color\\" type=\\"text\\" class=\\"input-small span2 js-alt\\" autocomplete=\\"off\\">\\r\\n</div>","css":""},"ce1eb53f444e94b539e60cc5165deee8e":{"title":"图片链接","html":"<div class=\\"input-prepend cubie-field\\">\\r\\n\\t<span class=\\"add-on\\">地址</span>\\r\\n\\t<input name=\\"color\\" type=\\"text\\" placeholder=\\"需包含http(s)://\\" class=\\"input-small span4 js-href\\" autocomplete=\\"off\\">\\r\\n</div>\\r\\n<hr />\\r\\n<div class=\\"input-prepend cubie-field\\">\\r\\n\\t<span class=\\"add-on\\">点击流</span>\\r\\n\\t<input name=\\"color\\" type=\\"text\\" placeholder=\\"使用data-stat\\" class=\\"input-small span2 js-statname\\" autocomplete=\\"off\\">\\r\\n</div>\\r\\n<label class=\\"checkbox inline\\">\\r\\n    <input type=\\"checkbox\\" class=\\"js-blank\\"> 新开窗口\\r\\n</label>","css":""}}', 1378364627),
(8, '0', 'iframe框架', '<iframe src="about:blank" frameborder="0" scrolling="no" width="100%" height="100%" cubie="iframe"></iframe>', '', '', 'function(M) {\r\n var oIframe = M.find(''iframe'');\r\n\r\n var oUrl = M.panel.find(''.js-url'');\r\n var oS = M.panel.find(''.js-scrolling'');\r\n var oX = M.panel.find(''.js-overflow-x'');\r\n  var oY = M.panel.find(''.js-overflow-y'');\r\n  var oWidth = M.panel.find(''.js-width'')\r\n  var oHeight = M.panel.find(''.js-height'')\r\n  var oMarginTop = M.panel.find(''.js-margin-top'');\r\n\r\n  // 恢复数据\r\n oUrl.val(M.jsonFeature(''url'') || '''');\r\n oS.val(M.jsonFeature(''scrolling'') || ''no'');\r\n oX.val(M.jsonFeature(''overflow-x'') || ''hidden'');\r\n  oY.val(M.jsonFeature(''overflow-y'') || ''scroll'');\r\n  oWidth.val(M.jsonFeature(''width'') || ''100%'');\r\n oHeight.val(M.jsonFeature(''height'') || ''100%'');\r\n oMarginTop.val(M.jsonFeature(''margin-top'') || '''');\r\n\r\n  oUrl.on(''input'', function(e) {\r\n    var val = $.trim($(this).val());\r\n    M.jsonFeature(''url'', val);\r\n    oIframe.attr(''src'', val);\r\n });\r\n oS.on(''change'', function(e) {\r\n   var val = $.trim($(this).val());\r\n    M.jsonFeature(''scrolling'', val);\r\n    oIframe.attr(''scrolling'', val);\r\n });\r\n oX.on(''change'', function(e) {\r\n   var val = $.trim($(this).val());\r\n    M.jsonFeature(''overflow-x'', val);\r\n   oIframe.css(''overflow-x'', val);\r\n });\r\n oY.on(''change'', function(e) {\r\n   var val = $.trim($(this).val());\r\n    M.jsonFeature(''overflow-y'', val);\r\n   oIframe.css(''overflow-y'', val);\r\n });\r\n oWidth.on(''input'', function(e) {\r\n    var val = $.trim($(this).val());\r\n    M.jsonFeature(''width'', val);\r\n    oIframe.css(''width'', val);\r\n  });\r\n oHeight.on(''input'', function(e) {\r\n   var val = $.trim($(this).val());\r\n    M.jsonFeature(''width'', val);\r\n    oIframe.css(''height'', val);\r\n });\r\n oMarginTop.on(''input'', function(e) {\r\n    var val = parseInt($.trim($(this).val()), 10) || '''';\r\n    M.jsonFeature(''margin-top'', val);\r\n   oIframe.css(''margin-top'', val);\r\n });\r\n oMarginTop.on(''blur'', function(e) {\r\n   $(this).val(parseInt($.trim($(this).val()), 10) || '''');\r\n });\r\n}', '', '{"base":{},"c1c4c41ce02d0446807475072702849e6":{"title":"iframe属性","html":"<div class=\\"input-prepend cubie-field\\">\\r\\n\\t<span class=\\"add-on\\">地址</span>\\r\\n\\t<input type=\\"text\\" placeholder=\\"需包含http(s)://\\" class=\\"input-small span5 js-url\\" autocomplete=\\"off\\">\\r\\n</div>\\r\\n<hr />\\r\\n<div class=\\"input-prepend cubie-field\\">\\r\\n\\t<span class=\\"add-on\\">宽度</span>\\r\\n\\t<input type=\\"text\\" placeholder=\\"PX/%\\" class=\\"input-small js-width\\" autocomplete=\\"off\\" value=\\"100%\\">\\r\\n</div>\\r\\n<div class=\\"input-prepend cubie-field\\">\\r\\n\\t<span class=\\"add-on\\">高度</span>\\r\\n\\t<input type=\\"text\\" placeholder=\\"PX/%\\" class=\\"input-small js-height\\" autocomplete=\\"off\\" value=\\"100%\\">\\r\\n</div>\\r\\n<div class=\\"input-prepend input-append cubie-field\\">\\r\\n\\t<span class=\\"add-on\\">上边距</span>\\r\\n\\t<input type=\\"text\\" placeholder=\\"负值可截取头部\\" class=\\"input-small js-margin-top\\" autocomplete=\\"off\\">\\r\\n\\t<span class=\\"add-on\\">px</span>\\r\\n</div>\\r\\n<hr />\\r\\n<div class=\\"input-prepend cubie-field\\">\\r\\n\\t<span class=\\"add-on\\">scrolling</span>\\r\\n\\t<select class=\\"js-scrolling\\">\\r\\n\\t\\t<option value=\\"auto\\">auto</option>\\r\\n\\t\\t<option value=\\"yes\\">yes</option>\\r\\n\\t\\t<option value=\\"no\\">no</option>\\r\\n\\t</select>\\r\\n</div>\\r\\n<div class=\\"input-prepend cubie-field\\">\\r\\n\\t<span class=\\"add-on\\">overflow-x</span>\\r\\n\\t<select class=\\"js-overflow-x\\">\\r\\n\\t\\t<option value=\\"auto\\">auto</option>\\r\\n\\t\\t<option value=\\"hidden\\">hidden</option>\\r\\n\\t\\t<option value=\\"scroll\\">scroll</option>\\r\\n\\t</select>\\r\\n</div>\\r\\n<div class=\\"input-prepend cubie-field\\">\\r\\n\\t<span class=\\"add-on\\">overflow-y</span>\\r\\n\\t<select class=\\"js-overflow-y\\">\\r\\n\\t\\t<option value=\\"auto\\">auto</option>\\r\\n\\t\\t<option value=\\"hidden\\">hidden</option>\\r\\n\\t\\t<option value=\\"scroll\\">scroll</option>\\r\\n\\t</select>\\r\\n</div>","css":""}}', 1378689680),
(9, '0', '文本编辑', '在此输入文字', '', '', 'function(M) {\r\n // 插件\r\n M.addPlugins(''sourcecode'');\r\n\r\n // 设置组件内容可编辑\r\n  M.onEditIn(function() {\r\n   M.setContentEditable();\r\n });\r\n\r\n // 预加载CKEditor\r\n  M.loadPlugin(''ckeditor'');\r\n}', '', '{"base":{},"global":{},"padding":{},"margin":{}}', 1378784757);

-- --------------------------------------------------------

--
-- 表的结构 `cubie_node`
--

CREATE TABLE IF NOT EXISTS `cubie_node` (
  `id` smallint(6) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `title` varchar(50) DEFAULT NULL,
  `status` tinyint(1) DEFAULT '0',
  `remark` varchar(255) DEFAULT NULL,
  `sort` smallint(6) unsigned DEFAULT '0',
  `pid` smallint(6) unsigned NOT NULL,
  `level` tinyint(1) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `level` (`level`),
  KEY `pid` (`pid`),
  KEY `status` (`status`),
  KEY `name` (`name`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=112 ;

--
-- 转存表中的数据 `cubie_node`
--

INSERT INTO `cubie_node` (`id`, `name`, `title`, `status`, `remark`, `sort`, `pid`, `level`) VALUES
(86, 'index', '项目模板', 1, '项目模板', 0, 85, 3),
(85, 'Build', '构建管理', 1, '构建管理', 0, 62, 2),
(84, 'del', '删除日志', 1, '删除日志', 0, 82, 3),
(83, 'index', '发布日志', 1, '发布日志', 0, 82, 3),
(82, 'Log', '日志管理', 1, '日志管理', 0, 62, 2),
(79, 'delNode', '删除节点', 1, '删除节点', 0, 63, 3),
(78, 'editNode', '编辑节点', 1, '编辑节点', 0, 63, 3),
(77, 'addNode', '添加节点', 1, '添加节点', 0, 63, 3),
(76, 'node', '查看节点', 1, '查看节点', 0, 63, 3),
(75, 'delRole', '删除角色', 1, '删除角色', 0, 63, 3),
(74, 'auth', '授权', 1, '授权', 0, 63, 3),
(73, 'editRole', '编辑角色', 1, '编辑角色', 0, 63, 3),
(72, 'addRole', '添加角色', 1, '添加角色', 0, 63, 3),
(71, 'addRoleUser', '给角色添加用户', 1, '给角色添加用户', 0, 63, 3),
(70, 'roleUser', '角色用户', 1, '角色用户', 0, 63, 3),
(69, 'role', '查看角色', 1, '查看角色', 0, 63, 3),
(68, 'unsuper', '取消超级管理员身份', 1, '取消超级管理员身份', 0, 63, 3),
(67, 'super', '设为超级管理员', 1, '设为超级管理员', 0, 63, 3),
(66, 'unlock', '解锁用户', 1, '解锁用户', 0, 63, 3),
(65, 'lock', '锁定用户', 1, '锁定用户', 0, 63, 3),
(64, 'index', '查看用户', 1, '查看用户', 0, 63, 3),
(63, 'Access', '权限管理', 1, '权限管理', 0, 62, 2),
(62, 'Home', 'Cubie', 1, 'Cubie(组件化构建平台)', 0, 0, 1),
(94, 'delModule', '删除组件', 1, '删除组件', 0, 85, 3),
(95, 'Index', '工作台', 1, '工作台', 0, 62, 2),
(96, 'index', '首页', 1, '首页', 0, 95, 3),
(97, 'editing', '进行中项目', 1, '进行中项目', 0, 95, 3),
(98, 'tocheck', '待审批项目', 1, '待审批项目', 0, 95, 3),
(99, 'Project', '项目', 1, '项目', 0, 62, 2),
(100, 'index', '所有项目', 1, '所有项目', 0, 99, 3),
(101, 'add', '新建项目', 1, '新建项目', 0, 99, 3),
(103, 'check', '查看项目信息', 1, '查看项目信息', 0, 99, 3),
(104, 'del', '删除项目', 1, '删除项目', 0, 99, 3),
(105, 'applyAudit', '申请审批', 1, '申请审批', 0, 99, 3),
(106, 'setAudit', '审批', 1, '审批', 0, 99, 3),
(107, 'layout', '布局编辑', 1, '布局编辑', 0, 99, 3),
(108, 'category', '项目分类', 1, '项目分类', 0, 99, 3),
(109, 'addCategory', '新建项目分类', 1, '新建项目分类', 0, 99, 3),
(110, 'editCategory', '编辑项目分类', 1, '编辑项目分类', 0, 99, 3),
(111, 'delCategory', '删除项目分类', 1, '删除项目分类', 0, 99, 3),
(87, 'preview', '预览模板', 1, 'preview', 0, 85, 3),
(88, 'add', '新建项目模板', 1, '新建项目模板', 0, 85, 3),
(89, 'edit', '编辑项目模板', 1, '编辑项目模板', 0, 85, 3),
(90, 'del', '删除项目模板', 1, '删除项目模板', 0, 85, 3),
(91, 'module', '组件', 1, '组件', 0, 85, 3),
(92, 'addModule', '新建组件', 1, '新建组件', 0, 85, 3),
(93, 'editModule', '编辑组件', 1, '编辑组件', 0, 85, 3);

-- --------------------------------------------------------

--
-- 表的结构 `cubie_project`
--

CREATE TABLE IF NOT EXISTS `cubie_project` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` int(10) unsigned NOT NULL COMMENT '所属分类',
  `tpl_id` int(10) unsigned NOT NULL COMMENT '项目模板ID',
  `title` varchar(20) NOT NULL COMMENT '项目名称',
  `intro` varchar(255) NOT NULL COMMENT '项目描述',
  `flag` varchar(20) NOT NULL COMMENT '项目标识',
  `start_time` int(11) unsigned DEFAULT NULL COMMENT '项目开始时间',
  `end_time` int(11) unsigned DEFAULT NULL COMMENT '项目结束时间',
  `layout` longtext NOT NULL COMMENT '页面布局',
  `thumbnail` varchar(255) DEFAULT NULL COMMENT '缩略图',
  `status` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '发布状态;0:待发布;1:预发布;2:正式发布;',
  `audit_applicant` varchar(20) NOT NULL COMMENT '申请审批人',
  `audit_auditor` varchar(20) NOT NULL COMMENT '审批人',
  `audit_status` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '审批状态;0:初始化;1:待编辑审批;2:已编辑审批;3:驳回编辑申请;4:待正式发布审批;5:已正式发布审批;6:驳回正式发布申请',
  `audit_apply_msg` varchar(255) NOT NULL COMMENT '申请审批信息',
  `audit_msg` varchar(255) NOT NULL COMMENT '审批意见',
  `update_user` varchar(20) NOT NULL COMMENT '最新更新人',
  `update_time` int(11) unsigned NOT NULL COMMENT '最近更新时间',
  `create_time` int(11) unsigned NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=29 ;

--
-- 转存表中的数据 `cubie_project`
--

INSERT INTO `cubie_project` (`id`, `category_id`, `tpl_id`, `title`, `intro`, `flag`, `start_time`, `end_time`, `layout`, `thumbnail`, `status`, `audit_applicant`, `audit_auditor`, `audit_status`, `audit_apply_msg`, `audit_msg`, `update_user`, `update_time`, `create_time`) VALUES
(28, 14, 6, 'vip', 'vip', 'demo', NULL, NULL, '<div id="cubie_layout_wrapper" class="cubie-layout-wrapper cubie-layout-gridline cubie-droppable ui-droppable ui-selectable" style="position: absolute; top: 0px; left: 50%; margin-left: -480px; width: 960px; height: 640px;"><div class="cubie-block cubie-droppable ui-draggable ui-resizable ui-droppable ui-draggable-disabled ui-state-disabled ui-resizable-autohide" id="c0a8cf17692ac69e620989f21374e4605" data-width="960" data-height="640" style="position: absolute; left: 0px; top: 0px; right: 0px; overflow: hidden; height: 640px;" aria-disabled="true"><div class="cubie-block-editarea"><div class="cubie-module ui-draggable ui-resizable no-user-select ui-selectee ui-resizable-autohide" id="c06c841de72e0ea7a201b362bff576bc6" data-modulesourceid="7" data-blockid="c0a8cf17692ac69e620989f21374e4605" aria-disabled="false" contenteditable="false" style="position: absolute; left: 136px; top: 92px; width: 180px; height: 100px;"><div class="cubie-module-editarea" style="overflow: auto;" contenteditable="false"><img src="http://www.cubie.com/issue/release/28/res/526ca19247397.png" cubie="img"></div><div class="cubie-module-opacity cubie-redundant-dom-inner"></div><textarea id="c06c841de72e0ea7a201b362bff576bc6_json" class="cubie-redundant-dom-inner" style="display:none;">{"sys":{},"feature":{"image":"526ca19247397.png"},"plugin":{}}</textarea></div></div><div class="cubie-block-opacity cubie-redundant-dom-inner">区块B0[变宽,变高](960x640)</div></div></div>  \n  \n  \n\n  \n  \n  \n<textarea id="cubie_project_json" class="cubie-redundant-dom-inner" style="display:none;">{"Project":{"project_title":"vip","project_intro":"vip","project_s_date":"","project_s_time":"","project_e_date":"","project_e_time":"","project_thumbnail":""},"Layout":{"slices_height":"200","bg_quality":"80","bg_align":"center","bg_repeat":"no-repeat","layout_width":"960","layout_height":"640","bg_list":[{"width":"1600","height":"200","path":"http://www.cubie.com/issue/release/28/res/526ca19b5f8a5_1.jpg","release_url":"res/526ca19b5f8a5_1.jpg","filename":"526ca19b5f8a5_1.jpg","repeat":"no-repeat","bg_align":"center"},{"width":"1600","height":"200","path":"http://www.cubie.com/issue/release/28/res/526ca19b5f8a5_2.jpg","release_url":"res/526ca19b5f8a5_2.jpg","filename":"526ca19b5f8a5_2.jpg","repeat":"no-repeat","bg_align":"center"},{"width":"1600","height":"200","path":"http://www.cubie.com/issue/release/28/res/526ca19b5f8a5_3.jpg","release_url":"res/526ca19b5f8a5_3.jpg","filename":"526ca19b5f8a5_3.jpg","repeat":"no-repeat","bg_align":"center"},{"width":"1600","height":"200","path":"http://www.cubie.com/issue/release/28/res/526ca19b5f8a5_4.jpg","release_url":"res/526ca19b5f8a5_4.jpg","filename":"526ca19b5f8a5_4.jpg","repeat":"no-repeat","bg_align":"center"},{"width":"1600","height":"200","path":"http://www.cubie.com/issue/release/28/res/526ca19b5f8a5_5.jpg","release_url":"res/526ca19b5f8a5_5.jpg","filename":"526ca19b5f8a5_5.jpg","repeat":"no-repeat","bg_align":"center"},{"width":"1600","height":"160","path":"http://www.cubie.com/issue/release/28/res/526ca19b5f8a5_6.jpg","release_url":"res/526ca19b5f8a5_6.jpg","filename":"526ca19b5f8a5_6.jpg","repeat":"no-repeat","bg_align":"center"}],"bg_color":"ffffff"},"Output":{"layout_zindex":"","bg_zindex":-1,"file_suffix":"shtml","css_lnk":0,"js_lnk":0},"Global":{"css":"","js":""},"_resourceToPublish":["526ca19247397.png","526ca19b5f8a5_1.jpg","526ca19b5f8a5_2.jpg","526ca19b5f8a5_3.jpg","526ca19b5f8a5_4.jpg","526ca19b5f8a5_5.jpg","526ca19b5f8a5_6.jpg"]}</textarea>', '', 2, 'admin', 'admin', 5, 'fa', 'OK', 'admin', 1382851161, 1382850831);

-- --------------------------------------------------------

--
-- 表的结构 `cubie_role`
--

CREATE TABLE IF NOT EXISTS `cubie_role` (
  `id` smallint(6) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `pid` smallint(6) DEFAULT '0',
  `status` tinyint(1) unsigned DEFAULT '0',
  `remark` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parentId` (`pid`),
  KEY `status` (`status`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=9 ;

--
-- 转存表中的数据 `cubie_role`
--

INSERT INTO `cubie_role` (`id`, `name`, `pid`, `status`, `remark`) VALUES
(2, '初始角色', 0, 1, '初始角色，只有浏览权限。\r\n（程序初始标记位，请勿删除：APP_DEFAULT_ROLE）');

-- --------------------------------------------------------

--
-- 表的结构 `cubie_role_user`
--

CREATE TABLE IF NOT EXISTS `cubie_role_user` (
  `role_id` mediumint(9) unsigned DEFAULT NULL,
  `user_id` char(32) DEFAULT NULL,
  KEY `group_id` (`role_id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `cubie_role_user`
--

INSERT INTO `cubie_role_user` (`role_id`, `user_id`) VALUES
(2, '4'),
(2, '3'),
(8, '4'),
(8, '4');

-- --------------------------------------------------------

--
-- 表的结构 `cubie_tpl`
--

CREATE TABLE IF NOT EXISTS `cubie_tpl` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(20) NOT NULL COMMENT '模板标题',
  `charset` varchar(10) NOT NULL DEFAULT 'UTF-8' COMMENT '编码',
  `thumbnail` varchar(255) DEFAULT NULL COMMENT '缩略图',
  `html` mediumtext NOT NULL COMMENT '模板HTML结构',
  `update_user` varchar(20) NOT NULL COMMENT '更新用户',
  `update_time` int(11) unsigned NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=7 ;

--
-- 转存表中的数据 `cubie_tpl`
--

INSERT INTO `cubie_tpl` (`id`, `title`, `charset`, `thumbnail`, `html`, `update_user`, `update_time`) VALUES
(6, '区块测试模板', 'UTF-8', '', '<!DOCTYPE html>\r\n<html>\r\n <head>\r\n    <meta charset="utf8" />\r\n   <meta name="description" content="{$project.intro}" />\r\n    <title>{$project.title} - Cubie模版</title>\r\n   <style type="text/css">\r\n     .wrapper {width: 996px; margin: 0 auto;}\r\n    </style>\r\n  </head>\r\n \r\n  <body data-cubie-width="996" data-cubie-height="1160" data-cubie-domain="http://www.zawaliang.com">\r\n   <div class="wrapper">\r\n     <!-- 区块编辑 -->\r\n     <div class="js-cubie-block" data-cubie-width="0" data-cubie-height="0" data-cubie-guid="c0a8cf17692ac69e620989f21374e4605"></div>\r\n   </div>\r\n  </body>\r\n</html>', 'admin', 1382851120);

-- --------------------------------------------------------

--
-- 表的结构 `cubie_user`
--

CREATE TABLE IF NOT EXISTS `cubie_user` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `account` varchar(64) NOT NULL,
  `nickname` varchar(50) NOT NULL,
  `password` char(32) NOT NULL,
  `bind_account` varchar(50) NOT NULL,
  `last_login_time` int(11) unsigned DEFAULT '0',
  `last_login_ip` varchar(40) DEFAULT NULL,
  `login_count` mediumint(8) unsigned DEFAULT '0',
  `verify` varchar(32) DEFAULT NULL,
  `email` varchar(50) NOT NULL,
  `remark` varchar(255) NOT NULL,
  `create_time` int(11) unsigned NOT NULL,
  `update_time` int(11) unsigned NOT NULL,
  `status` tinyint(1) DEFAULT '1',
  `type_id` tinyint(2) unsigned DEFAULT '0',
  `info` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `account` (`account`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=8 ;

--
-- 转存表中的数据 `cubie_user`
--

INSERT INTO `cubie_user` (`id`, `account`, `nickname`, `password`, `bind_account`, `last_login_time`, `last_login_ip`, `login_count`, `verify`, `email`, `remark`, `create_time`, `update_time`, `status`, `type_id`, `info`) VALUES
(3, 'admin', '', 'dd4160544f8cf6b4498a15c6c6f671a7', '', 1382840113, '127.0.0.1', 15, NULL, 'zawaliang@tencent.com', '', 1370656539, 1370656539, 1, 1, '');
