<?php

// 退出登录
class LogoutAction extends Action {
	public function index() {
//    	session(C('USER_AUTH_KEY'), null);
//    	session(C('ADMIN_AUTH_KEY'), null);
		session(null); // 清空所有session
		$this->redirect('Index/index');
	}
}