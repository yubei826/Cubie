<?php
/**
 * 日志管理
 * @author: Zawa
 */

class LogAction extends PublicAction {
	
	// 解析日志操作格式
	private function parse($operation) {
		$operation = explode('|', $operation);
		foreach ($operation as $k => $v) {
			$e = explode('=', $operation[$k]);
			$data[$e[0]] = $e[1];
		}
		return $data;
	}
	
	// 获取发布状态
	private function getPubStatus($status) {
		$arr = array(
			self::PS_INIT 		=> '初始化',
			self::PS_PREPUB 	=> '预发布',
			self::PS_PUB 		=> '<span class="green">正式发布</span>',
		);
		$result = !empty($arr[$status]) ? $arr[$status] : '异常操作';
		return $result;
	}
	
	// 获取配置分类信息
	private function getCategory($category, $id) {
		foreach ($category as $k => $v) {
			if ($v['id'] == $id) {
				return $category[$k];
			}
		}
		return false;
	}
	
	// 发布日志
	public function index() {
		$user = $this->_get('user');
		$project_id = $this->_get('project_id');

		$qs = 'type=' . self::LT_PUB;
		if ($user != '') {
			$qs .= ' and user="' . $user . '"';
		}
		if ($project_id != '') {
			$qs .= ' and operation like "%project_id=' . $project_id . '"';
		}
		
		$pagesize = 20;
		$page = $this->_get('p');
		if (empty($page)) {
			$page = 1;
		}

		$Category = M('Category');
		$category = $Category->select();

		$Log = M('Log');
		$log = $Log->where($qs)->order('create_time desc')->page($page . ',' . $pagesize)->select();
		$count = $Log->where($qs)->count();
		foreach ($log  as $k => $v) {
			$operation = $this->parse($v['operation']);
			$cat = $this->getCategory($category, $operation['category_id']);
			$log[$k]['pub'] = $this->getPubStatus($operation['pub']);
			$log[$k]['project_id'] = $operation['project_id'];
			$log[$k]['category_type'] = $cat['type'];
			$log[$k]['create_time'] = date('Y-m-d H:i:s', $v['create_time']);
		}
		$this->assign('user', $user);
		$this->assign('project_id', $project_id);
		$this->assign('count', $count);
		$this->assign('log', $log);
				
		import('ORG.Util.Page'); // 导入分页类
		$Page = new Page($count, $pagesize);
		$show = $Page->show();
		$this->assign('page', $show);
				
		$this->display();
	}
	
	// 删除日志
	public function del() {
		$id = $this->_post('id');
		$where = array();
		foreach ($id as $k => $v) {
			$where[] = 'id=' . $v;
		}
		$where = implode(' or ', $where);
		$Log = M('Log');
		$result = $Log->where($where)->delete();
		if ($result) {
			$this->success('日志删除成功', '/index.php/Log');
		} else {
			$this->error('日志删除失败');
		}
	}
	
}