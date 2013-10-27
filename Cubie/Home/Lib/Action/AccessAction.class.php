<?php
/**
 * 权限管理
 * @author: Zawa
 */

class AccessAction extends PublicAction {
	
	// 查看用户
	public function index() {
		$kw = $this->_get('kw');
		$qs = array();
		if ($kw != '') {
			$qs['account'] = $kw;
		}
		
		$pagesize = 15;
		$page = $this->_get('p');
		if (empty($page)) {
			$page = 1;
		}
		
		// 角色
		$Role = M('Role');
		$role = $Role->select();
		
		
		$User = M('User');
		$user = $User->where($qs)->order('last_login_time desc')->page($page . ',' . $pagesize)->select();
		$count = $User->where($qs)->count();
		foreach ($user  as $k => $v) {
			$user[$k]['last_login_time'] = date('Y-m-d H:i:s', $v['last_login_time']);
			$user[$k]['user_type'] = $v['type_id'] == 1 ? '<div class="green">超级管理员</div>' : '';
			if ($user[$k]['status'] == 1) { // 正常用户
				$user[$k]['lock_status'] = '<span class="green">正常</span>';
			} else { // 锁定用户
				$user[$k]['lock_status'] = '<span class="red">锁定</span>';
			}
			
			$role_name = $this->getRoleByUid($role, $v['id']);
			$user[$k]['role_name'] = implode(' | ', $role_name);
		}
		$this->assign('kw', $kw);
		$this->assign('count', $count);
		$this->assign('user', $user);
				
		import('ORG.Util.Page'); // 导入分页类
		$Page = new Page($count, $pagesize);
		$show = $Page->show();
		$this->assign('page', $show);
				
		$this->display();
	}

	// 新建用户
	public function add() {
		if ($this->isPost()) {
			$User = M('User');

			$account = trim($this->_post('account'));

			// 不区分大小写比较
			$qs = array();
			$qs['account'] = $account;
			$is_exist = $User->where($qs)->count();
			if ($is_exist) {
				$this->error('登录账号' . $account . '已存在，请重新输入');
				return false;
			}

			
			// 表单校验
			$validate = array(
				array('account', 'require', '请输入账号'),
				array('password', 'require', '请输入密码'),
			);
			$User->setProperty('_validate', $validate);
			
			$data = $User->create();
			if ($data) {
				$data['account'] = trim($data['account']);
				$data['password'] = salt_md5(trim($data['password']));
				$result = $User->add($data);
				if ($result) {
					$this->success('新建用户成功', '/index.php/Access');
				} else {
					$this->error('新建用户失败');
				}
			} else {
				$this->error($User->getError());
			}
		} else {
			$this->display('edit');
		}
	}

	// 编辑用户
	public function edit() {
		$id = $this->_param('id');
		$User = M('User');
		$user = $User->find($id);

		if (!$user) {
			$this->error('用户不存在');
			return false;
		}

		if ($this->isPost()) {
			$account = trim($this->_post('account'));

			// 不区分大小写比较
			$qs = array();
			$qs['id'] = array('neq', $id);
			$qs['account'] = $account;
			$is_exist = $User->where($qs)->count();
			if ($is_exist) {
				$this->error('登录账号' . $account . '已存在，请重新输入');
				return false;
			}

			
			// 表单校验
			$validate = array(
				array('account', 'require', '请输入账号'),
			);
			$User->setProperty('_validate', $validate);
			
			$data = $User->create();
			if ($data) {
				$data['account'] = trim($data['account']);
				$data['password'] = trim($data['password']);
				 
				if (empty($data['password'])) {
					unset($data['password']);
				} else {
					$data['password'] = salt_md5($data['password']);
				}

				$result = $User->save($data);
				if ($result) {
					$this->success('用户编辑成功', '/index.php/Access');
				} else {
					$this->error('用户编辑失败,可能是数据未发生更改');
				}
			} else {
				$this->error($User->getError());
			}
		} else {
			$this->assign('user', $user);
			$this->display();
		}
	}

	// 删除用户
	public function del() {
		$id = $this->_get('id');
		if (empty($id)) {
			$this->error('参数非法');
			return false;
		}
		$pid = $this->_get('pid');
		$User = M('User');
		$result = $User->delete($id);
		if ($result) {
			$this->success('用户删除成功', '/index.php/Access');
		} else {
			$this->error('用户删除失败');
		}
	}
	
	/**
	 * 通过用户ID获取角色
	 */
	private function getRoleByUid($role, $uid) {
		$RoleUser = M('RoleUser');
		$role_id = $RoleUser->where('user_id=' . $uid)->getField('role_id', true);
		$result = array();
		foreach ($role_id as $k => $v) {
			foreach ($role as $k2 => $v2) {
				if ($v2['id'] == $v) {
					$result[] = $v2['name'];
				}
			}
		}
		return $result;
	}
	
	// 锁定用户
	public function lock() {
		$id = $this->_get('id');
		$User = M('User');
		$data['id'] = $id;
		$data['status'] = 0;
		$result = $User->save($data);
		if ($result) {
			$this->success('用户锁定成功', '/index.php/Access');
		} else {
			$this->error('用户锁定失败');
		}
	}
	
	// 解锁用户
	public function unlock() {
		$id = $this->_get('id');
		$User = M('User');
		$data['id'] = $id;
		$data['status'] = 1;
		$result = $User->save($data);
		if ($result) {
			$this->success('用户解锁成功', '/index.php/Access');
		} else {
			$this->error('用户解锁失败');
		}
	}
	
	// 设为超级管理员
	public function super() {
		$id = $this->_get('id');
		$User = M('User');
		$data['id'] = $id;
		$data['type_id'] = 1;
		$result = $User->save($data);
		if ($result) {
			$this->success('已设置为超级管理员，重新登录后生效', '/index.php/Access');
		} else {
			$this->error('操作失败');
		}
	}
	// 取消超级管理员
	public function unsuper() {
		$id = $this->_get('id');
		$User = M('User');
		$data['id'] = $id;
		$data['type_id'] = 0;
		$result = $User->save($data);
		if ($result) {
			$this->success('已取消超级管理员身份，重新登录后生效', '/index.php/Access');
		} else {
			$this->error('操作失败');
		}
	}
	

	//------------------------ Role-----------------------------------

	// 查看角色
	public function role() {
		$Role = M('Role');
		$role = $Role->select();
		$count = $Role->count();
		$this->assign('count', $count);
		$this->assign('role', $role);
		$this->display();
	}
	
	// 检查用户是否在指定角色下
	private function isUserInRole($role_user, $user_id) {
		foreach ($role_user as $k => $v) {
			if ($v['user_id'] == $user_id) {
				return true;
			}
		}
		return false;
	}
	
	// 角色用户
	public function roleUser() {
		$role_id = $this->_get('id');
		$role_name = M('Role')->where('id=' . $role_id)->getField('name');
		if (!$role_name) {
			$this->error('不存在的角色');
			return false;
		}
		$this->assign('role_name', $role_name);
		
		// 当前角色用户列表
		$RoleUser = M('RoleUser');
		$qs['role_id'] = $role_id;
		$role_user = $RoleUser->where($qs)->select();
		
		
		// 罗列所有用户
		$User = M('User');
		$user = $User->order('id desc')->select();
		$original_user_id = array();
		foreach ($user  as $k => $v) {
			// 当前用户是否在当前角色下
			$isUserInRole = $this->isUserInRole($role_user, $v['id']);
			$user[$k]['checked'] = $isUserInRole;
			
			if ($isUserInRole) {
				$original_user_id[] = $v['id'];
			}
			
			
			$user[$k]['last_login_time'] = date('Y-m-d H:i:s', $v['last_login_time']);
			$user[$k]['user_type'] = $v['type_id'] == 1 ? '<span class="green">超级管理员</span>' : '普通用户';
			if ($user[$k]['status'] == 1) { // 正常用户
				$user[$k]['lock_status'] = '<span class="green">正常</span>';
			} else { // 锁定用户
				$user[$k]['lock_status'] = '<span class="red">锁定</span>';
			}
		}
		asort($user); // 按是否选中排序输出
		
		$this->assign('role_id', $role_id);
		$this->assign('original_user_id', implode(',', $original_user_id));
		$this->assign('user', $user);
				
		$this->display();
	}
	
	// 给角色添加用户
	public function addRoleUser() {
		$RoleUser = M('RoleUser');
		$role_id = $this->_post('role_id');
		$original_user_id= $this->_post('original_user_id');
		$user_id = $this->_post('user_id');
		
		$result = true;
		
		// 批量删除原来存在但此次没选择的用户
		$original_user_id = explode(',', $original_user_id);
		if (!empty($original_user_id[0])) {
			$where = array();
			foreach ($original_user_id as $k => $v) {
				if (!in_array($v, $user_id)) {
					$where[] = '(role_id=' . $role_id . ' and user_id=' . $v . ')';
				}
			}
			if (count($where) > 0) {
				$where = implode(' or ', $where);
				$result = $RoleUser->where($where)->delete();
			}
		}
		
		
		if ($result) {
			// 批量添加新增用户
			$data = array();
			foreach ($user_id as $k => $v) {
				if (!in_array($v, $original_user_id)) {
					$data[] = array(
						'role_id' => $role_id,
						'user_id' => $v,
					);
				}
			}
			$result = count($data) > 0 ? $RoleUser->addAll($data) : true;
			if ($result) {
				$this->success('角色对应用户已更新', '/index.php/Access/roleUser/id/' . $role_id);
			} else {
				$this->error('更新用户失败');
			}
		} else {
			$this->error('更新用户失败');
		}
	}
	
	// 添加角色
	public function addRole() {
		if ($this->isPost()) {
			$Role = M('Role');
			
			// 表单校验
			$validate = array(
				array('name', 'require', '请输入角色名称'),
				array('remark', 'require', '请输入角色描述'),
			);
			$Role->setProperty('_validate', $validate);
			
			if ($Role->create()) {
				$result = $Role->add();
				if ($result) {
					$this->success('角色新建成功', '/index.php/Access/role');
				} else {
					$this->error('角色新建失败');
				}
			} else {
				$this->error($Role->getError());
			}
		} else {
			$this->display('editRole');
		}
	}
	
	// 编辑角色
	public function editRole() {
		$Role = M('Role');
		if ($this->isPost()) {
			// 表单校验
			$validate = array(
				array('name', 'require', '请输入角色名称'),
				array('remark', 'require', '请输入角色描述'),
			);
			$Role->setProperty('_validate', $validate);
			
			if ($Role->create()) {
				$result = $Role->save();
				if ($result) {
					$this->success('角色编辑成功', '/index.php/Access/role');
				} else {
					$this->error('角色编辑失败');
				}
			} else {
				$this->error($Role->getError());
			}
		} else {
			$id = $this->_get('id');
			$role = $Role->find($id);
			if (!$role) {
				$this->error('指定ID的数据不存在');
				return false;
			}
			$this->assign('role', $role);
			$this->display();
		}
	}
	
	
	// 通过节点ID获取父节点ID
	private function getPID($role, $id) {
		foreach ($role as $k => $v) {
			if ($id == $v['id']) {
				return $v['pid'];
			}
		}
		return 0;
	}
	
	// 节点是否存在于指定角色的权限列表中
	private function isNodeInAccess($access, $node_id) {
		foreach ($access as $k => $v) {
			if ($node_id == $v['node_id']) {
				return true;
			}
		}
		return false;
	}
	
	// 删除二维数组中指定元素的项
	private function double_array_del($arr, $item, $val) {
		foreach ($arr as $k => $v) {
			if ($v[$item] == $val) {
				unset($arr[$k]);
			}
		}
		return $arr;
	}
	// 删除一维数组中指定元素的项
	private function array_del($arr, $val) {
		foreach ($arr as $k => $v) {
			if ($arr[$k] == $val) {
				unset($arr[$k]);
			}
		}
		return $arr;
	}
	
	
	// 删除冗余的节点
	private function delRedundantNode($role_id, $access, $level=2) {
		$Access = M('Access');
		$pid = array();
		foreach ($access as $k => $v) {
			$pid[] = $v['pid'];
		}
		
		// 删除孤立的节点
		$where = array();
		foreach ($access as $k => $v) {
			if ($v['level'] == $level && !in_array($v['node_id'], $pid)) {
				$where[] = '(role_id=' . $role_id . ' and node_id=' . $v['node_id'] . ')';
				$access = $this->double_array_del($access, 'node_id', $v['node_id']);
			}
		}
		if (count($where) > 0) {
			$where = implode(' or ', $where);
			$result = $Access->where($where)->delete();
			if ($result) {
				if ($level == 2) {
					return $this->delRedundantNode($role_id, $access, 1);
				} else {
					return $access;	
				}
			} else {
				return false;
			}
		} else {
			return $access;
		}    			
	}
	
	// 授权
	public function auth() {
		if ($this->isPost()) {
			$role_id = $this->_post('role_id');
			$node_id = $this->_post('node_id');
			$node_id = array_unique($node_id); // 移除重复值
			
			// 获取当前角色原有权限
			$Access = M('Access');
			$qs = array();
			$qs['role_id'] = $role_id;
			$access = $Access->where($qs)->select();
			
			
			$where = array();
			foreach ($access as $k => $v) {
				// 移除保持不变的权限节点
				if (in_array($v['node_id'], $node_id)) {
					$node_id = $this->array_del($node_id, $v['node_id']);
					continue;
				}
				
				// 删除原有但此次没选择的3级节点
				if ($v['level'] == 3 && !in_array($v['node_id'], $node_id)) {
					$where[] = '(role_id=' . $role_id . ' and node_id=' . $v['node_id'] . ')';
					$access = $this->double_array_del($access, 'node_id', $v['node_id']);
				}
			}
			
			if (count($where) > 0) {
				$where = implode(' or ', $where);
				$result = $Access->where($where)->delete();
				if ($result) {
					// 删除孤立的1,2级节点
					$result = $this->delRedundantNode($role_id, $access, 2);
					if ($result === false) {
						$this->error('权限删除失败 (S2)');
						return false;
					} else {
						$access = $result;
					}
				} else {
					$this->error('权限删除失败 (S1)');
					return false;
				}
			}
			
			// 新增权限
			$Node = M('Node');
			$node = $Node->select();
			$data = array();
			foreach ($node_id as $k => $v) {
				$node2_id = $this->getPID($node, $v);
				$node1_id = $this->getPID($node, $node2_id);
				// 3级节点
				$data[] = array(
					'role_id' => $role_id,
					'node_id' => $v,
					'level' => 3,
					'pid' => $node2_id,
				);
				// 2级节点
				if (!$this->isNodeInAccess($access, $node2_id)) {
					$data[] = array(
						'role_id' => $role_id,
						'node_id' => $node2_id,
						'level' => 2,
						'pid' => $node1_id,
					);
					$access[] = array(
						'role_id' => $role_id,
						'node_id' => $node2_id,
						'level' => 2,
						'pid' => $node1_id,
					);
				}
				// 1级节点
				if (!$this->isNodeInAccess($access, $node1_id)) {
					$data[] = array(
						'role_id' => $role_id,
						'node_id' => $node1_id,
						'level' => 1,
						'pid' => 0,
					);
					$access[] = array(
						'role_id' => $role_id,
						'node_id' => $node1_id,
						'level' => 1,
						'pid' => 0,
					);
				}
			}
			$result = count($data) > 0 ? $Access->addAll($data) : true;
			if ($result) {
				$this->success('授权成功', '/index.php/Access/auth/id/' . $role_id);
			} else {
				$this->error('授权失败');
			}
		} else {
			$id = $this->_get('id');
			$Role = M('Role');
			$count = $Role->where('id=' . $id)->count();
			if ($count < 1) {
				$this->error('角色不存在');
				return false;
			}
			
			// 获取当前角色权限
			$Access = M('Access');
			$qs = array();
			$qs['role_id'] = $id;
			$access = $Access->where($qs)->select();
			
			// 节点列表
			$role = $Role->select();
			$this->assign('role', $role);
			$this->assign('id', $id);
			
			$Node = M('Node');
			$node = $Node->select();
			$node_list = array();
			
			foreach ($node as $k => $v) {
				if ($v['level'] == 1) {
					$node_list['r' . $v['id']] = $v;
				}
			}
			foreach ($node as $k => $v) {
				if ($v['level'] == 2) {
					$node_list['r' . $v['pid']]['node_2']['r' . $v['id']] = $v;
				}
			}
			foreach ($node as $k => $v) {
				if ($v['level'] == 3) {
					$pid = $this->getPID($node, $v['id']);
					$pid = $this->getPID($node, $pid);
					$v['access'] = $this->isNodeInAccess($access, $v['id']);
					$node_list['r' . $pid]['node_2']['r' . $v['pid']]['node_3']['r' . $v['id']] = $v;
				}
			}
			$this->assign('node_List', $node_list);
			$this->display();
		}
	}
	
	// 删除角色
	public function delRole() {
		$id = $this->_get('id');
		if (empty($id)) {
			$this->error('参数非法');
			return false;
		}
		$Role = M('Role');
		$result = $Role->delete($id);
		if ($result) {
			$this->success('角色删除成功', '/index.php/Access/role');
		} else {
			$this->error('角色删除失败');
		}
	}


	//----------------------Node---------------------------

	// 查看节点
	public function node() {
		$Node = M('Node');
		$breadcrumbs = array();
		$qs = array();
		$pid = $this->_get('pid');
		if (!empty($pid)) {
			$qs['pid'] = $pid;
			$cur_node = $Node->find($pid);
			
			// 是否存在父节点(最多3级节点)
			if ($cur_node['level'] == 2) {
				$p_node = $Node->find($cur_node['pid']);
				$breadcrumbs[] = array(
					'id' => $p_node['id'],
					'title' => $p_node['title'],
					'name' => $p_node['name'],
				);
			}
			
			$breadcrumbs[] = array(
				'id' => $pid,
				'title' => $cur_node['title'],
				'name' => $cur_node['name'],
			);
		} else {
			$qs['pid'] = 0;
		}

		$pagesize = 20;
		$page = $this->_get('p');
		if (empty($page)) {
			$page = 1;
		}
		
		
		$node = $Node->where($qs)->page($page . ',' . $pagesize)->select();
		$count = $Node->where($qs)->count();

		import('ORG.Util.Page'); // 导入分页类
		$Page = new Page($count, $pagesize);
		$show = $Page->show();
		$this->assign('page', $show);
		
		$this->assign('breadcrumbs', $breadcrumbs);
		$this->assign('count', $count);
		$this->assign('node', $node);
		$this->display();
	}
	
	// 添加节点
	public function addNode() {
		if ($this->isPost()) {
			$Node = M('Node');
			// 表单校验
			$validate = array(
				array('name', 'require', '请输入节点名称'),
				array('title', 'require', '请输入节点标题'),
				array('remark', 'require', '请输入节点备注'),
			);
			$Node->setProperty('_validate', $validate);
			
			$data = $Node->create();
			if ($data) {
				$pid = $data['pid'];
				// 节点名称是否存在
				$qs['pid'] = $pid;
				$qs['name'] = $data['name'];
				$count = $Node->where($qs)->count();
				if ($count > 0) {
					$this->error('父节点下已存在同名子节点');
					return false;
				}
				
				$result = $Node->add();
				if ($result) {
					$this->success('节点新建成功', '/index.php/Access/node/pid/' . $data['pid']);
				} else {
					$this->error('节点新建失败');
				}
			} else {
				$this->error($Node->getError());
			}
		} else {
			$Node = M('Node');
			$node = $Node->select();
			$pid_1 = array();
			$pid_2 = array();
			$pid_3 = array();
			foreach ($node as $k => $v) {
				$level = $v['level'];
				switch ($level) {
					case 1:
						$pid_1[] = array(
							'id' => $v['id'],
							'name' => $v['name'],
							'title' => $v['title'],
						);	
						break;
					case 2:
						$pid_2[] = array(
							'id' => $v['id'],
							'pid' => $v['pid'],
							'name' => $v['name'],
							'title' => $v['title'],
						);		
						break;
					case 3:
						$pid_3[] = array(
							'id' => $v['id'],
							'pid' => $v['pid'],
							'name' => $v['name'],
							'title' => $v['title'],
						);	
						break;
				}
			}
			$this->assign('pid_1', $pid_1);
			$this->assign('pid_2', $pid_2);
			$this->assign('pid_3', $pid_3);
			$this->display('editNode');
		}
	}
	
	// 编辑节点
	public function editNode() {
		$Node = M('Node');
		if ($this->isPost()) {
			// 表单校验
			$validate = array(
				array('name', 'require', '请输入节点名称'),
				array('title', 'require', '请输入节点标题'),
				array('remark', 'require', '请输入节点备注'),
			);
			$Node->setProperty('_validate', $validate);
			
			$data = $Node->create();
			if ($data) {
				$pid = $data['pid'];
				// 节点名称是否存在
				$qs = 'id<>' . $data['id'];
				$qs .= ' and pid=' . $pid;
				$qs .= ' and name="' . $data['name'] . '"';
				$count = $Node->where($qs)->count();
				if ($count > 0) {
					$this->error('父节点下已存在同名子节点');
					return false;
				}
				
				unset($data['pid'], $data['level']);
				$result = $Node->save();
				if ($result) {
					$this->success('节点编辑成功', '/index.php/Access/node/pid/' . $pid);
				} else {
					$this->error('节点编辑失败');
				}
			} else {
				$this->error($Node->getError());
			}
		} else {
			$id = $this->_get('id');
			$node = $Node->find($id);
			if (!$node) {
				$this->error('指定ID的数据不存在');
				return false;
			}
			
			// 节点关系
			switch ($node['level']) {
				case 1:
					$node['pid1'] = 0;
					$node['pid2'] = '';
					break;
				case 2:
					$node['pid1'] = $node['pid'];
					$node['pid2'] = '';
					break;
				case 3:
					$node['pid1'] = $Node->where('id=' . $node['pid'])->getField('pid');
					$node['pid2'] = $node['pid'];
					break;
			}	    	
			
			$nodes = $Node->select();
			$pid_1 = array();
			$pid_2 = array();
			$pid_3 = array();
			foreach ($nodes as $k => $v) {
				$level = $v['level'];
				switch ($level) {
					case 1:
						$pid_1[] = array(
							'id' => $v['id'],
							'name' => $v['name'],
							'title' => $v['title'],
						);	
						break;
					case 2:
						$pid_2[] = array(
							'id' => $v['id'],
							'pid' => $v['pid'],
							'name' => $v['name'],
							'title' => $v['title'],
						);		
						break;
					case 3:
						$pid_3[] = array(
							'id' => $v['id'],
							'pid' => $v['pid'],
							'name' => $v['name'],
							'title' => $v['title'],
						);	
						break;
				}
			}
			$this->assign('pid_1', $pid_1);
			$this->assign('pid_2', $pid_2);
			$this->assign('pid_3', $pid_3);
			$this->assign('node', $node);
			$this->display();
		}
	}
	
	// 删除节点
	public function delNode() {
		$id = $this->_get('id');
		if (empty($id)) {
			$this->error('参数非法');
			return false;
		}
		$pid = $this->_get('pid');
		$Node= M('Node');
		$result = $Node->delete($id);
		if ($result) {
			$this->success('节点删除成功', '/index.php/Access/node/pid/' . $pid);
		} else {
			$this->error('节点删除失败');
		}
	}
}