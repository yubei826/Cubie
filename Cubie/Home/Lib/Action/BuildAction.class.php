<?php
/**
 * 构建管理
 * @author: Zawa
 */

class BuildAction extends PublicAction {
	
	// 缺省最大上传文件尺寸(字节) 5M = 5 * 1024 * 1024
	// private $maxUploadFileSize = 5242880;
	// 上传根路径
	private $root_upload_path;


	public function _initialize() {
		parent::_initialize();
		$this->root_upload_path = __ROOT__ . 'Upload/';
	}



	// 所有项目模板
	public function index() {
		$Tpl = M('Tpl');
		$tpl = $Tpl->order('update_time desc')->select();
		$count = $Tpl->count();
		foreach ($tpl as $k => $v) {
			$tpl[$k]['thumbnail'] = (empty($v['thumbnail']) ? '/Public/Home/Img/tpl.png' : $v['thumbnail']);
		}
		$this->assign('count', $count);
		$this->assign('tpl', $tpl);
		$this->display();
	}

	// 预览模板
	public function preview() {
		$id = $this->_get('id');
		$Tpl = M('Tpl');
		$tpl = $Tpl->find($id);
		if (!$tpl) {
			$this->error('参数非法');
			return false;
		}

		// 解析模版
		import('@.Common.TemplateParser');
		$tp = new TemplateParser();
		$tpl['html'] = $tp->replace_include_ssi($tpl['html'], $tpl['charset'], true);


		$this->assign('html', $tpl['html']);
		$this->display('Public:blank');
	}

	// 新建项目模板
	public function add() {
		// 上传缩略图处理
		$action = $this->_post('action');
		if ($action == 'upload_tpl_thumbnail') {
			$this->uploadTplThumb();
			return false;
		}

		if ($this->isPost()) {
			$Tpl = M('Tpl');
			// 表单校验
			$validate = array(
				array('title', 'require', '请输入模板标题'),
				array('html', 'require', '请输入模板HTML'),
			);
			$Tpl->setProperty('_validate', $validate);
			
			$data = $Tpl->create();
			if ($data) {
				$data['charset'] = strtoupper($data['charset']);
				$data['update_user'] = AuthTicket::$name;
				$data['update_time'] = time();
				$result = $Tpl->add($data);
				if ($result) {
					$this->success('模板新建成功', '/index.php/Build');
				} else {
					$this->error('模板新建失败');
				}
			} else {
				$this->error($Tpl->getError());
			}
		} else {
			$this->display('edit');
		}
	}

	// 编辑项目模板
	public function edit() {
		// 上传缩略图处理
		$action = $this->_post('action');
		if ($action == 'upload_thumbnail') {
			$this->uploadTplThumb();
			return false;
		}

		$Tpl = M('Tpl');
		if ($this->isPost()) {
			// 表单校验
			$validate = array(
				array('title', 'require', '请输入模板标题'),
				array('html', 'require', '请输入模板HTML'),
			);
			$Tpl->setProperty('_validate', $validate);
			
			$data = $Tpl->create();
			if ($data) {
				$data['charset'] = strtoupper($data['charset']);
				$data['update_user'] = AuthTicket::$name;
				$data['update_time'] = time();
				$result = $Tpl->save($data);
				if ($result) {
					$this->success('模板更新成功', '/index.php/Build');
				} else {
					$this->error('模板更新失败');
				}
			} else {
				$this->error($Tpl->getError());
			}
		} else {
			$id = $this->_get('id');
			$tpl = $Tpl->find($id);
			if (!$tpl) {
				$this->error('指定ID的数据不存在');
				return false;
			}
			$tpl['thumb_url'] = empty($tpl['thumbnail']) ? '' : $tpl['thumbnail'];
			$this->assign('tpl', $tpl);
			$this->display();
		}
	}

	// 删除项目模板
	public function del() {
		$id = $this->_get('id');
		if (empty($id)) {
			$this->error('参数非法');
			return false;
		}
		$Tpl = M('Tpl');
		$result = $Tpl->delete($id);
		if ($result) {
			$this->success('项目模板删除成功', '/index.php/Build/');
		} else {
			$this->error('项目模板删除失败');
		}
	}

	// 上传模板缩略图图片(250*156)
	private function uploadTplThumb($options) {
		// 1 * 1024 * 1024 = 1M
		$maxUploadFileSize = 1048576; 

		// 以"Upload/tpl_thumb/2013/xxx.jpg"的文件夹存放文件
		$upload_path = $this->root_upload_path . 'tpl_thumb/' . date('Ym') . '/';
		makeDir($upload_path);

		import('ORG.Net.UploadFile');
		$upload = new UploadFile(); // 实例化上传类
		$upload->maxSize = $maxUploadFileSize ; // 设置附件上传大小
		$upload->allowExts = array('jpg', 'gif', 'png', 'jpeg'); // 设置附件上传类型
		$upload->savePath = $upload_path; // 设置附件上传目录
		$upload->uploadReplace = false; // 同名不可覆盖
		$upload->saveRule = uniqid; // 保存规则 
		// $upload->thumb = true;
		// $upload->thumbPrefix = ''; // 去除缩略图前缀后不能生成文件,bug?
		// $upload->thumbMaxWidth = '250';
		// $upload->thumbMaxHeight = '156';
		// $upload->thumbRemoveOrigin = true; // 生成缩略图后删除原图

		if (!$upload->upload()) { // 上传错误提示错误信息
			$json = array(
				'retcode' => 1,
				'retmsg' => $upload->getErrorMsg(),
			);
		} else { // 上传成功 获取上传文件信息
			$info =  $upload->getUploadFileInfo();
			$info = $info[0];
			$upload_file = $upload_path . $info['savename'];

			// 使用GD库裁剪图片为制定尺寸250x156
			import('ORG.Util.Image.ThinkImage'); 
			$img = new ThinkImage(THINKIMAGE_GD, $upload_file);
			$img->crop(250, 156)->save($upload_file);
			
			$file = array();
			$file['path'] = '/' . $upload_file;

			$json = array(
				'retcode' => 0,
				'retmsg' => 'OK',
				'info' => $info,
				'file' => $file,
			);
		}

		echo json_encode($json);
	}


	// 上传组件缩略图图片(90*90)
	private function uploadModuleThumb($options) {
		// 1 * 1024 * 1024 = 1M
		$maxUploadFileSize = 1048576; 

		// 以"Upload/module_thumb/2013/xxx.jpg"的文件夹存放文件
		$upload_path = $this->root_upload_path . 'module_thumb/' . date('Ym') . '/';
		makeDir($upload_path);

		import('ORG.Net.UploadFile');
		$upload = new UploadFile(); // 实例化上传类
		$upload->maxSize = $maxUploadFileSize ; // 设置附件上传大小
		$upload->allowExts = array('jpg', 'gif', 'png', 'jpeg'); // 设置附件上传类型
		$upload->savePath = $upload_path; // 设置附件上传目录
		$upload->uploadReplace = false; // 同名不可覆盖
		$upload->saveRule = uniqid; // 保存规则

		if (!$upload->upload()) { // 上传错误提示错误信息
			$json = array(
				'retcode' => 1,
				'retmsg' => $upload->getErrorMsg(),
			);
		} else { // 上传成功 获取上传文件信息
			$info =  $upload->getUploadFileInfo();
			$info = $info[0];
			$upload_file = $upload_path . $info['savename'];

			// 使用GD库裁剪图片为制定尺寸90*90
			import('ORG.Util.Image.ThinkImage'); 
			$img = new ThinkImage(THINKIMAGE_GD, $upload_file);
			$img->crop(90, 90)->save($upload_file);
			
			$file = array();
			$file['path'] = '/' . $upload_file;

			$json = array(
				'retcode' => 0,
				'retmsg' => 'OK',
				'info' => $info,
				'file' => $file,
			);
		}

		echo json_encode($json);
	}


	// 组件
	public function module() {
		$Module = M('Module');
		$module = $Module->order('create_time desc')->select();
		$count = $Module->count();
		foreach ($module as $k => $v) {
			$module[$k]['thumbnail'] = (empty($v['thumbnail']) ? '/Public/Home/Img/module.png' : $v['thumbnail']);
		}
		$this->assign('count', $count);
		$this->assign('module', $module);
		$this->display();
	}

	// 新建组件
	public function addModule() {
		// 上传缩略图处理
		$action = $this->_post('action');
		if ($action == 'upload_thumbnail') {
			$this->uploadModuleThumb();
			return false;
		}

		if ($this->isPost()) {
			$Module = M('Module');
			// 表单校验
			$validate = array(
				array('title', 'require', '请输入组件名称'),
				// array('html', 'require', '请输入组件HTML'),
			);
			$Module->setProperty('_validate', $validate);
			
			$data = $Module->create();
			if ($data) {
				$data['category_id'] = empty($data['category_id']) ? 0 : $data['category_id'];
				$data['create_time'] = time();
				$result = $Module->add($data);
				if ($result) {
					$this->success('组件新建成功', '/index.php/Build/module');
				} else {
					$this->error('组件新建失败');
				}
			} else {
				$this->error($Module->getError());
			}
		} else {
			// 查询分类
			$Category = M('Category');
			$category = $Category->select();
			$this->assign('category', $category);

			// 查询公用组件特性
			$Feature = M('Feature');
			$feature = $Feature->where('module_id=0')->select();
			$this->assign('feature', $feature);

			$this->display('editModule');
		}
	}

	// 编辑组件
	public function editModule() {
		// 上传缩略图处理
		$action = $this->_post('action');
		if ($action == 'upload_thumbnail') {
			$this->uploadModuleThumb();
			return false;
		}

		$Module = M('Module');
		if ($this->isPost()) {
			// 表单校验
			$validate = array(
				array('title', 'require', '请输入组件名称'),
				// array('html', 'require', '请输入组件HTML'),
			);
			$Module->setProperty('_validate', $validate);
			
			$data = $Module->create();
			if ($data) {
				$data['category_id'] = empty($data['category_id']) ? 0 : $data['category_id'];
				$result = $Module->save($data);
				if ($result) {
					$this->success('组件编辑成功', '/index.php/Build/module');
				} else {
					$this->error('组件编辑失败');
				}
			} else {
				$this->error($Module->getError());
			}
		} else {
			$id = $this->_get('id');
			$module = $Module->find($id);
			if (!$module) {
				$this->error('指定ID的数据不存在');
				return false;
			}
			$module['thumb_url'] = empty($module['thumbnail']) ? '' : $module['thumbnail'];
			
			// 转换html,css,js为实体符输出
			$module['html'] = convert_htmlspecialchars($module['html']);
			$module['css'] = convert_htmlspecialchars($module['css']);
			$module['js'] = convert_htmlspecialchars($module['js']);

			// 查询分类
			$Category = M('Category');
			$category = $Category->select();
			$this->assign('category', $category);

			// 查询公用组件特性
			$Feature = M('Feature');
			$feature = $Feature->where('module_id=0')->select();
			$this->assign('feature', $feature);

			$this->assign('module', $module);
			$this->display();
		}
	}

	// 删除组件
	public function delModule() {
		$id = $this->_get('id');
		if (empty($id)) {
			$this->error('参数非法');
			return false;
		}
		$Module = M('Module');
		$result = $Module->delete($id);
		if ($result) {
			$this->success('组件删除成功', '/index.php/Build/module');
		} else {
			$this->error('组件删除失败');
		}
	}
}