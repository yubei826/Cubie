<?php 
/**
 * 常用函数集
 * @author: Zawa
 */

/** 
 * 权限访问控制检查
 * @param string $module 模块名
 * @param string $name 操作名
 */ 
function hasAccess($module, $name) {
	// hasAccess 已对超级管理员做了判断
	return AuthTicket::hasAccess($module, $name);
}

/** 
 * 是否超级管理员
 */ 
function isSuper() {
	return AuthTicket::super();
}


// 去除空格, $data为一维数组
function trim_all($data) {
	foreach ($data as $k => $v) {
		$data[$k] = trim($v);
	}
	return $data;
}

/**
 * 显示面包屑导航
 * @param {String} [name] 当前操作名,适合未在config.php里配置的操作使用
 */
function show_breadcrumb($name) {
	$nav = C('APP_NAV');
	$name = isset($name) ? $name : $nav[MODULE_NAME]['SUB_NAV'][ACTION_NAME];

	$tpl = '<ul class="breadcrumb">'
		. '<li><i class="icon-map-marker"></i> <a href="/">Home</a> <span class="divider">/</span></li>'
		. '<li><a href="/index.php/' . MODULE_NAME . '">' . $nav[MODULE_NAME]['NAME'] . '</a> <span class="divider">/</span></li>'
		. '<li class="active">' . $name . ' <span style="margin:0 10px;">|</span> <a href="javascript:history.back();" title="后退"><i class="icon-arrow-left"></i></a></li>'
		. '</ul>';
	echo($tpl);
}

/**
 * 转换HTML标签为实体符号
 * @param {Array} $data
 * @return 
 */ 
function convert_htmlspecialchars($data) {
	if (is_array($data)) {
		foreach ($data as $k =>$v) {
			$data[$k] = convert_htmlspecialchars($v);
		}
	} else {
		$data = htmlspecialchars($data);
	}
	return $data;
}

/**
 * 是否为合法的日期
 * @param {String} $date YYYY-MM-DD
 * @return {Boolean}
 */ 
function isLegalDate($date) {
	$date = explode('-', $date);
	return (count($date) == 3 && checkdate($date[1], $date[2], $date[0]));
}

/**
 * 是否为合法的时间
 * @param {String} $time hh:mm:ss
 * @return {Boolean}
 */ 
function isLegalTime($time) {
	$pattern = '/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/';
	return !!preg_match($pattern, $time, $matches);
}

/**
 * 是否为合法的时间
 * @param {String} $time hh:mm:ss
 * @return {Boolean}
 */ 
function isLegalURL($url) {
	$pattern = '/^(http|https|ftp):\/\/([A-Z0-9][A-Z0-9_-]*(?:\.[A-Z0-9][A-Z0-9_-]*)+):?(\d+)?\/?/i';
	return !!preg_match($pattern, $url, $matches);
}

/**
 * 获取时间戳
 * @param {String} $t YYYY-MM:DD hh:mm:ss
 * @return {Boolean}
 */ 
function getTimestamp($t) {
	$t = explode(' ', $t);
	$date = explode('-', $t[0]);
	$time = explode(':', $t[1]);
	return mktime($time[0], $time[1], $time[2], $date[1], $date[2], $date[0]);
}

/**
 * 获取时间串
 * @param {String} $t YYYY-MM:DD hh:mm:ss
 * @return {Boolean}
 */ 
function getTime($timestamp) {
	$t = date('Y-m-d H:i:s', $timestamp);
	$time = explode(' ', $t);
	return array(
		't' => $t,
		'date' => $time[0],
		'time' => $time[1],
	);
}

/**
 * 获取文件后缀(不带点)
 * @param {String} $file
 * @return {String} eg: jpg
 */ 
function getFileSuffix($file) {
	$suffix = pathinfo($file);
	return $suffix['extension'];
}

/**
 * 目录不存在则创建
 * @param {String} $dest 目录或文件
 */ 
function makeDir($dest) {
	$dir = dirname($dest);
	if (!is_dir($dir)) {
		mkdir($dir, 0777, true);
	}
}

/**
 * 改变图片质量
 * @param {String} $image 图片文件
 * @param {String} $quality 质量，0-100
 * @param {String} [$dest] 存储目录，缺省覆盖
 */ 
function changeImgQuality($image, $quality = 80, $dest = null) {
	$quality = min(abs($quality), 100);
	$imageInfo = getimagesize($image);
    $type = strtolower(substr(image_type_to_extension($imageInfo[2]), 1));
	$dest = isset($dest) ? $dest : $image;

	// 载入原图
    $createFun = 'ImageCreateFrom' . ($type == 'jpg' ? 'jpeg' : $type);
    if(!function_exists($createFun)) {
        return false;
    }
    $srcImg = $createFun($image);

	$imageFun = 'image' . ($type == 'jpg' ? 'jpeg' : $type);
	$imageFun($srcImg, $dest, $quality);
	imagedestroy($srcImg);
}

/**
 * 格式化URL, 开头不以斜杠开始,结尾以斜杠结束
 * /a/b/c -> a/b/c/
 * http://www.qq.com -> http://www.qq.com/
 */
function formatUrl($url) {
	// /2013/ -> 2013/
	$url = (substr($url, 0, 1) == '/') ? substr($url, 1) : $url; // 去除首个斜杠
	// 2013 -> 2013/
	$url = (substr($url, strlen($url)-1, 1) != '/') ? $url . '/' : $url; // 末尾添加斜杠

	return $url;
}

// 加盐MD5
function salt_md5($str) {
	return md5('ds#&s(!d4' . $str);
}