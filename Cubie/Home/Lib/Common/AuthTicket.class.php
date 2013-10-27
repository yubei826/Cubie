<?php
/**
 * 登录票据验证
 * @author: Zawa
 */
class AuthTicket {

	public static $name = null;


	/**
	 * 构造函数
	 */
	public function __construct() {
		self::__checkLogin();
	}
	
	/**
	 * 登录校验
	 */
	private static function __checkLogin() {		
		$authId = session(C('USER_AUTH_KEY'));
		if (!empty($authId)) {
			self::$name = $authId;
			return true;
		} else {
			redirect(U('Public/login'));
			exit();
		}
		
	}
	
	// 是否超级管理员
	public static function super() {
		$s = session(C('ADMIN_AUTH_KEY'));
		return !empty($s);
	}


	// 获取当前用户权限列表
	public static function getAccessList($app=null, $module=null, $name=null) {
		if (self::super()) {
			return true;
		}
		if (C('USER_AUTH_TYPE') == 2) {
			import('ORG.Util.RBAC');
			$access_list = RBAC::getAccessList(session(C('USER_AUTH_KEY')));
		} else {
			$access_list = session('_ACCESS_LIST');
		}
		if ($app) {
			$access_list = $access_list[strtoupper($app)];
		}
		if ($module && $access_list) {
			$access_list = $access_list[strtoupper($module)];
		}
		if ($name && $access_list) {
			$access_list = $access_list[strtoupper($name)];
		}
		return $access_list;
	}
	
	/**
	 * 是否有指定操作权限
	 * @param string $module 模块名
	 * @param string [$name] 操作名, 缺省时只判断是否拥有模块权限
	 * @return boolean
	 */
	public static function hasAccess($module, $name = null) {
		if (self::super()) {
			return true;
		} else {
			$name = strtoupper($name);
			$module = strtoupper($module);

			// 无需认证模块
			$not_auth_module = explode(',', strtoupper(C('NOT_AUTH_MODULE')));
			if (in_array($module, $not_auth_module)) {
				return true;
			}
			
			// 用户拥有的权限
			$access_list = self::getAccessList();
			$module_access = $access_list[strtoupper(APP_NAME)][$module];

			if (empty($name)) { // 只检查模块权限
				if (!empty($module_access)) {
					return true;
				}
				return false;
			} else {
				$access = $module_access[$name];
				if (!empty($access)) {
					return true;
				}
				return false;	
			}
		}
	}
}