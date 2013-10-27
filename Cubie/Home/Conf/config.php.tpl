<?php
return array(
	
	'VERSION' => 'beta',
	
	// 显示页面Trace信息(开发)
	//  'SHOW_PAGE_TRACE' => true, 
	
	// 系统运行信息(开发)
	//  'SHOW_RUN_TIME'    => true, // 运行时间显示
	//  'SHOW_ADV_TIME'    => true, // 显示详细的运行时间
	//  'SHOW_DB_TIMES'    => true, // 显示数据库查询和写入次数
	//  'SHOW_CACHE_TIMES' => true, // 显示缓存操作次数
	//  'SHOW_USE_MEM'     => true, // 显示内存开销
	//  'SHOW_LOAD_FILE'   => true, // 显示加载文件数
	//  'SHOW_FUN_TIMES'   => true, // 显示函数调用次数


	// 导航配置
	'APP_NAV' => array(
		'Index' => array(
			'NAME' => '工作台',
			'SUB_NAV' => array(
				'index' => '待办事项',
				'editing' => ' 进行中项目',
				'tocheck' => ' 待审批项目',
			),
		),
		'Project' => array(
			'NAME' 	=> '项目',
			'SUB_NAV' => array(
				'index' => '所有项目',
				'add' => '新建项目',
				'category' => '项目分类',
				'addCategory' => '新建项目分类',
			),
		),
		'Build' => array(
			'NAME' => '构建管理',
			'SUB_NAV' => array(
				'index' => '项目模板',
				'add' => '新建项目模板',
				'module' => '组件',
				'addModule' => '新建组件',
			),
		),
		'Log' => array(
			'NAME' => '日志管理',
			'SUB_NAV' => array(
				'index' => '发布日志',
			),
		),
		'Access' => array(
			'NAME' => '权限管理',
			'SUB_NAV' => array(
				'index' => '查看用户',
				'add' => '新建用户',
				'role' => '查看角色',
				'addRole' => '新建角色',
				'node' => '查看节点',
				'addNode' => '新建节点',
			),
		),
	),

	// 当前域名及端口号(如果有) http://cubie.oa.com
	'HTTP_HOST' => (strpos(strtolower($_SERVER['SERVER_PROTOCOL']), 'https') == false ? 'http' : 'https') . '://' . $_SERVER['HTTP_HOST'],

	// 模板后缀
	// 'TMPL_TEMPLATE_SUFFIX' => '.tpl',   
	
	// 默认错误跳转对应的模板文件
	'TMPL_ACTION_ERROR' => 'Public:error',
	// 默认成功跳转对应的模板文件
	'TMPL_ACTION_SUCCESS' => 'Public:success',
	
	// 预加载Html标签库
	//  'TAGLIB_PRE_LOAD' => 'html',
	
	// session
	'SESSION_OPTIONS' => array(
		'path' => './Home/Runtime/Session/',
	),  
	
	// 关闭页面压缩输出
	'OUTPUT_ENCODE' => false,   
	
	// 数据库设计
	'DB_TYPE'	=> 'mysql',			// 数据库类型
	'DB_HOST'	=> '{DB_HOST}',		// 服务器地址
	'DB_NAME'	=> '{DB_NAME}',		// 数据库名
	'DB_USER'	=> '{DB_USER}',		// 用户名
	'DB_PWD'	=> '{DB_PWD}',		// 密码
	'DB_PORT'	=> '{DB_PORT}',		// 端口
	'DB_PREFIX'	=> '{DB_PREFIX}',		// 表前缀 
	
	
	// RBAC配置
	'USER_AUTH_ON'		=>  true,
	'USER_AUTH_TYPE'		=>  1,			// 默认认证类型 1 登录认证(权限设置在下一次登录生效) 2 实时认证(实时查询数据库)
	'USER_AUTH_KEY'		=>  'authId',		// 用户认证SESSION标记
	'ADMIN_AUTH_KEY'		=>  'admin',
	'USER_AUTH_MODEL'		=>  'User',		// 默认验证数据表模型
	'AUTH_PWD_ENCODER'	=>  'md5',		// 用户认证密码加密方式
	'USER_AUTH_GATEWAY'	=>  '/index.php',		// 默认认证网关
	'NOT_AUTH_MODULE'		=>  'Public',		// 默认无需认证模块
	'REQUIRE_AUTH_MODULE'	=>  '',			// 默认需要认证模块
	'NOT_AUTH_ACTION'		=>  '',			// 默认无需认证操作
	'REQUIRE_AUTH_ACTION'	=>  '',			// 默认需要认证操作
	'GUEST_AUTH_ON'		=>  false,		// 是否开启游客授权访问
	'GUEST_AUTH_ID'		=>  0,			// 游客的用户ID
	'DB_LIKE_FIELDS'		=>  'title|remark',
	'RBAC_ROLE_TABLE'		=>  'cubie_role',
	'RBAC_USER_TABLE'		=>  'cubie_role_user',
	'RBAC_ACCESS_TABLE'	=>  'cubie_access',
	'RBAC_NODE_TABLE'		=>  'cubie_node',
);
