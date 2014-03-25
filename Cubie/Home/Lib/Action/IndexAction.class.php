<?php

class IndexAction extends PublicAction {


	public function index(){
		$this->editing();
	}

	// 获取分类信息
	private function getCategoryInfo($category, $id) {
		foreach ($category as $k => $v) {
			if ($v['id'] == $id) {
				return $v;
			}
		}
	}



	// 进行中的项目
	public function editing() {
		$qs = array();
		// 申请人是当前用户,且审批状态不为初始化
		$qs['audit_applicant'] = AuthTicket::$name;
		$qs['audit_status'] = array('not in', array(self::AS_INIT));
		
		$Category = M('Category');
		$category = $Category->select();

		$Project = M('Project');
		$project = $Project->where($qs)->order('update_time desc')->select();

		foreach ($project as $k => $v) {
			// 获取审批状态
			$project[$k]['_audit_status'] = $this->getAuditStatus($v['audit_status']);

			// 是否可编辑(超级管理员或当前用户为编辑人 且 审批状态为已编辑审批/待正式发布审批/已正式发布审批/驳回正式发布申请)
			if (($this->is_super || $v['update_user'] == AuthTicket::$name) 
				&& in_array($v['audit_status'], array(self::AS_CHECKED, self::AS_TOCHECK_PUB, self::AS_CHECKED_PUB, self::AS_REJECT_PUB))) {

				$project[$k]['_edit_able'] = true;
			} else {
				$project[$k]['_edit_able'] = false;
			}
			
			// 是否可结束编辑, 待编辑审批状态还没到达编辑,除去这个状态,其他的都是可以结束的
			$project[$k]['_end_edit'] = ($v['audit_status'] != self::AS_TOCHECK);

			$cat = $this->getCategoryInfo($category, $v['category_id']);
			$project[$k]['_category_info'] = $cat;

			// 替换路径变量
			$project[$k]['_url'] = $this->getProjectUrl($cat['pub_api'], $cat['url'], $v['create_time']) . $v['flag'];

			// 缩略图
			$thumbnail = $this->getProjectThumb($v['id'], $v['thumbnail']);
			$project[$k]['_thumbnail'] = $thumbnail;
		}
		$count = count($project);

		$this->assign('count', $count);
		$this->assign('project', $project);
		$this->display('editing');
	}

	// 我审批的项目
	public function tocheck() {
		$qs = array();
		// 查询待编辑审批和待正式发布审批
		$qs['audit_status'] = array('in', array(self::AS_TOCHECK, self::AS_TOCHECK_PUB));

		// 分类
		$Category = M('Category');
		$category = $Category->select();

		$Project = M('Project');
		$project = $Project->where($qs)->order('update_time desc')->select();

		foreach ($project as $k => $v) {
			// 当前配置可审批人列表
			if ($v['audit_status'] == self::AS_TOCHECK_PUB) {
				$auditor = $category['pub_auditor'];
			} else {
				$auditor = $category['auditor'];
			}

			// 过滤不是当前用户可审批的(超级管理员不限)
			$auditor = explode(';', $auditor);
			if (!$this->is_super && !in_array(AuthTicket::$name, $auditor)) {
				unset($project[$k]);
				continue;
			}

			// 审批类型
			$project[$k]['_audit_type'] = ($v['audit_status'] == self::AS_TOCHECK_PUB) ? '正式发布' : '编辑';

			$cat = $this->getCategoryInfo($category, $v['category_id']);
			$project[$k]['_category_info'] = $cat;

			// 替换路径变量
			$project[$k]['_url'] = $this->getProjectUrl($cat['pub_api'], $cat['url'], $v['create_time']) . $v['flag'];

			$thumbnail = $this->getProjectThumb($v['id'], $v['thumbnail']);
			$project[$k]['_thumbnail'] = $thumbnail;
		}
		$count = count($project);

		$this->assign('count', $count);
		$this->assign('project', $project);
		$this->display('editing');
	}
}