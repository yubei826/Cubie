<?php

/**
 * Home项目Action基类
 * @author: Zawa
 */
class PublicAction extends Action {

	// 本地发布目录
	protected $LOCAL_RELEASE_PATH;

	
	// 是否超级管理员
	protected $is_super = false;


	// 发布状态
	const PS_INIT = 0; // 待发布
	const PS_PREPUB = 1; // 预发布
	const PS_PUB = 2; // 正式发布


	// 审批状态
	const AS_INIT = 0; // 默认
	const AS_TOCHECK = 1; // 待编辑审批
	const AS_CHECKED = 2; // 已编辑审批
	const AS_REJECT = 3; // 驳回编辑申请
	const AS_TOCHECK_PUB = 4; // 待正式发布审批
	const AS_CHECKED_PUB = 5; // 已正式发布审批
	const AS_REJECT_PUB = 6; // 驳回正式发布申请


	// 日志类型
	const LT_PUB = 1; // 发布日志


	// 支持的发布接口配置
	protected $PUB_API = array(
		 // 发布接口, url需以斜杠结尾
		'test' => array(
			'name' => '测试发布接口',
			'url' => 'http://www.zawaliang.com/test/',
		),
	);



	/**
	 * 获取审批状态
	 */
	protected function getAuditStatus($status) {
		$conf = array(
			self::AS_INIT => '初始化',
			self::AS_TOCHECK => '待编辑审批',
			self::AS_CHECKED => '已编辑审批',
			self::AS_REJECT => '编辑申请被驳回',
			self::AS_TOCHECK_PUB => '待正式发布审批',
			self::AS_CHECKED_PUB => '已正式发布审批',
			self::AS_REJECT_PUB => '正式发布申请被驳回',
		);

		return $conf[$status];
	}


	/**
	 * 项目缓存信息
	 * @param {Int} $id 项目ID
	 * @param {String} $name
	 * @param {*} $value, null时删除缓存
	 */
	protected function projectCache($id, $name, $value) {
		$project_path = $this->LOCAL_RELEASE_PATH . $id . '/';
		$cache_path = $project_path . '/project.cache';
		$cache = file_exists($cache_path) ? unserialize(trim(file_get_contents($cache_path))) : array();

		if (func_num_args() == 3) {
			if ($value === null) {  // 删
				unset($cache[$name]);
			} else {
				$cache[$name] = $value;
			}
			
			$cache = serialize($cache);
			$this->generateFile($cache_path, $cache);
		} else { // 读
			return isset($cache[$name]) ? $cache[$name] : '';
		}
	}

	/**
	 * 生成文件
	 * @param string $filename 文件路径
	 * @param string $content
	 * @retuen boolean
	 */
	private function mkFile($filename, $content) {
		makeDir($filename);

		// 文件锁
		$fp = fopen($filename, 'w');
		if (flock($fp, LOCK_EX)) { // 进行排它型锁定
			$result = fwrite($fp, $content);
			flock($fp, LOCK_UN); // 释放锁定
		} else {
			$result = 0;
		}
		fclose($fp);
		return $result;
	}

	/**
	 * 生成文件
	 * @param {String} $filename 文件路径
	 * @param {String} $content 文件内容
	 * @param {String} $charset 文件编码
	 */
	protected function generateFile($filename, $content, $charset = 'UTF-8') {
		if (strtoupper($charset) == 'GB2312') {
			// UTF-8 -> GBK
			$c = iconv('UTF-8', 'GBK//IGNORE', $content); // //IGNORE忽略转换为gbk时的错误

			// iconv转换出错时,尝试使用mb_convert_encoding转换
			if (!$c && function_exists(mb_convert_encoding)) {
				// UTF-8 -> GBK
				$c = mb_convert_encoding($content, 'GBK', 'UTF-8');
			}

			// 转码出错,原样返回
			if (!$c) {
				$c = $content;
			}
		} else {
			// http://www.tiger-blog.com/201216731/
			// 添加UTF-8 BOM头
//			$content = chr(0xEF).chr(0xBB).chr(0xBF) . $content;
			$c = $content;
		}
		
		return $this->mkFile($filename, $c);
	}

	/**
	 * 格式化项目URL
	 * @param {String} $url
	 * @param {Int} $create_time
	 */
	protected function formatProjectUrl($url, $create_time) {
		$url = str_replace('%year%', date('Y', $create_time), $url); // 2013
		$url = str_replace('%month%', date('m', $create_time), $url); // 01
		$url = str_replace('%day%', date('d', $create_time), $url); // 08	
		
		return $url;
	}

	/**
	 * 获取格式化后的项目完整URL
	 * @param {String} $pub_api
	 * @param {String} $url
	 * @param {Int} $create_time
	 */
	protected function getProjectUrl($pub_api, $url, $create_time) {
		$url = $this->formatProjectUrl($url, $create_time);
		$url = formatUrl($url);

		// 添加发布接口路径前缀
		if (!empty($pub_api)) {
			$url =  $this->PUB_API[$pub_api]['url'] . $url;
		}

		return $url;
	}



	/**
	 * 获取项目缩略图缓存,project.cache优先级大于数据库
	 * @param {Int} $id 项目ID
	 * @param {string} $thumbnail 数据库里的缩略图地址
	 * @param {Boolean} $blank 不存在缩略图是是否返回空
	 */
	protected function getProjectThumb($id, $thumbnail, $blank = false) {
		$cache = $this->projectCache($id, 'thumbnail');
		return empty($cache) 
			? empty($thumbnail) 
				? ($blank ? '' : '/Public/Home/Img/project.png')
				: $thumbnail
			: $cache;
	}



	public function _initialize() {
		import('@.Common.AuthTicket');
		
		$this->LOCAL_RELEASE_PATH = __ROOT__ . 'issue/release/';


		// 公用模块不处理
		if (MODULE_NAME == 'Public' && in_array(ACTION_NAME, array('install', 'err', 'login'))) {
			return;
		}
		
		// 是否安装
		$file = __ROOT__ . 'install.data';
		if (!file_exists($file)) {
			$this->redirect('Public/install');
			return;
		}

		// 登录验证
		new AuthTicket;
		
		// 是否超级管理员
		$this->is_super = AuthTicket::super();
		
		// 是否系统维护
		$maintain_file = __ROOT__ . 'maintain.data';
		if (!$this->is_super && file_exists($maintain_file)) {
			$this->redirect('Public/err/', array('s' => urlencode('系统维护中，请稍候再试！')));
			return;
		}
		
		// RBAC权限验证(获取)
		import('ORG.Util.RBAC');
		RBAC::saveAccessList();
			
		// 公用模板渲染
		$APP['Version'] = C('VERSION');
		$APP['User'] = AuthTicket::$name;
		$APP['Super'] = $this->is_super ? true : false;
		$APP['NAV'] = C('APP_NAV');
		// $APP['Access'] = array_change_key_case(AuthTicket::getAccessList(APP_NAME), CASE_UPPER); // 所有权限列表
		$this->assign('APP', $APP);

		// RBAC权限验证(验证)
		if (!RBAC::AccessDecision()) {
			$this->assign('waitSecond', 5);
			$this->error('你没有权限执行当前操作！');
			exit();
		}
	}

	
	// 系统初始化
	public function install() {
		if ($this->isPost()) {
			$data = $this->_post();

			// 读取配置文件
			$config_file_tpl = __ROOT__ . 'Home/Conf/config.php.tpl';
			$config_file = __ROOT__ . 'Home/Conf/config.php';
			$content = file_get_contents($config_file_tpl);

			foreach ($data as $k => $v) {
				$content = str_replace('{' . $k . '}', $v, $content);
			}
			$result = file_put_contents($config_file, $content);

			if ($result) {
				$install_file = __ROOT__ . 'install.data';
				file_put_contents($install_file, '');

				$this->redirect('/Index');
			} else {
				$this->error('安装初始化失败');
			}
		} else {
			$this->display();
		}
	}
	
	
	// 公用的提示(不作登录检查)
	public function err() {
		$s = urldecode($this->_get('s'));
		$this->assign('error', $s);
		$this->display();
	}

	
	/**
	 * 系统维护(超级管理员only)
	 */
	public function maintain() {
		if (!AuthTicket::super()) {
			$this->error('权限不足');
			return;
		}
		$file = __ROOT__ . 'maintain.data';
		
		if ($this->isPost()) {
			$maintain = (bool) $this->_post('maintain');

			if ($maintain) { // 开启维护
				file_put_contents($file, '1');
			} else {
				if (file_exists($file)) {
					unlink($file);
				}
			}

			$this->success('系统已' . ($maintain ? '开启' : '关闭') . '维护', '/index.php/Public/maintain');
		} else {
			$maintain = file_exists($file) ? true : false;
			$this->assign('maintain', $maintain);
			$this->display();
		}
	}

	// 登录
	public function login() {
		if ($this->isPost()) {
			$User = M('User');

			// 表单校验
			$validate = array(
				array('account', 'require', '请输入账号'),
				array('password', 'require', '请输入密码'),
			);

			$User->setProperty('_validate', $validate);
			
			$data = $User->create();
			if ($data) {
				// 加盐,不要更改
				$password = salt_md5(trim($data['password']));
				
				$arr = array();
				$arr['account'] = trim($data['account']);
				$arr['password'] = $password;
				$user = $User->where($arr)->find();

				if ($user) {
					// 受限用户
					if ($user['status'] == 0) {
						session(null);
						$this->error('你已被禁止登录，请联系系统管理员~');
						exit();
					}

					// 写session
					session(C('USER_AUTH_KEY'), $user['account']);
					// 是否超级管理员
					if ($user['type_id'] == 1) {
						session(C('ADMIN_AUTH_KEY'), $user['account']);
					}
				
					// 登录日志
					$d = array();
					$d['id'] = $user['id'];
					$d['last_login_time'] = time();
					$d['last_login_ip'] = get_client_ip();
					$d['login_count'] = $user['login_count'] + 1;
					$User->save($d);

					$this->redirect('/Index');
				} else {
					$this->error('账号或密码有误');
				}
			} else {
				$this->error($User->getError());
			}
		} else {
			$authId = session(C('USER_AUTH_KEY'));
			if (!empty($authId)) {
				$this->redirect('/Index');
				die;
			}
			$this->display();
		}
	}
}