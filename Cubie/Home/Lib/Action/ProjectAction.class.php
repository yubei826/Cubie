<?php
/**
 * 项目管理
 * @author: Zawa
 */

class ProjectAction extends PublicAction {


	// 项目缩略图上传目录
	private $project_upload_path;


	public function _initialize() {
		parent::_initialize();

		$this->project_upload_path = __ROOT__ . 'Upload/project_thumb/';
	}


	/**
	 * 格式化分号分割的字符串,并去重去空
	 * @return string
	 */
	private function formatStr($str) {
		$str = trim($str);
		if (!empty($str)) {
			$str = explode(';', $str);
			// 去除空白
			foreach ($str as $k => $v) {
				$v = trim($v);
				if (empty($v)) {
					unset($str[$k]);
				} else {
					$str[$k] = $v;
				}
			}
			$str = implode(';', array_unique($str)); // 关注人列表去重
		}
		return $str;
	}
	
	// 获取分类信息
	private function getCategoryInfo($category, $id) {
		foreach ($category as $k => $v) {
			if ($v['id'] == $id) {
				return $v;
			}
		}
	}

	// 去除空格, $data为一维数组
	private function trim_all($data) {
		foreach ($data as $k => $v) {
			$data[$k] = trim($v);
		}
		return $data;
	}
	/**
	 * 根据是否AJAX状态输出不同的数据格式
	 */
	private function output($json, $success_url = null, $fail_url = null) {
		if (IS_AJAX) {
			echo json_encode($json);
		} else {
			if ($json['retcode'] == 0) {
				$this->success($json['retmsg'], $success_url);
			} else {
				if (empty($fail_url)) {
					$fail_url = $success_url;
				}
				$this->error($json['retmsg'], $fail_url);
			}
		}
	}


	// 所有项目
	public function index() {
		$pagesize = 16;
		$p = $this->_get('p');
		if (empty($p)) {
			$p = 1;
		}
		$category_id = $this->_get('category_id');
		$kw = $this->_get('kw');
		$w = '';
		if (!empty($category_id)) {
			$w .= 'category_id=' . intval($category_id);
		}
		if (!empty($kw)) {
			$w .= (empty($category_id) ? '' : ' and ') . ' title like "%' . $kw . '%"';
		}

		// 分类
		$Category = M('Category');
		$category = $Category->select();

		$Project = M('Project');
		$project = $Project->where($w)->order('update_time desc')->page($p . ',' . $pagesize)->select();
		$count = $Project->where($w)->count();
		foreach ($project as $k => $v) {
			// 是否可申请审批, 初始化状态或驳回编辑审批状态下才可申请审批
			// 注意: 申请编辑审批成功后的审批流需要用户手动结束
			if (in_array($v['audit_status'], array(self::AS_INIT, self::AS_REJECT))) {
				$project[$k]['_apply_audit_able'] = true;
			} else {
				$project[$k]['_apply_audit_able'] = false;
			}

			// 是否可编辑
			if ($this->is_project_editable($v['audit_status'], $v['audit_applicant'])) {
				$project[$k]['_edit_able'] = true;
			} else {
				$project[$k]['_edit_able'] = false;
			}

			
			if ($v['audit_status'] == self::AS_TOCHECK) { // 申请中
				$project[$k]['_current_applicant'] = $v['audit_applicant']; // 当前申请人
				$project[$k]['_current_editor'] = ''; // 当前编辑人
			} else if (in_array($v['audit_status'], array(self::AS_CHECKED, self::AS_TOCHECK_PUB, self::AS_CHECKED_PUB, self::AS_REJECT_PUB))) { // 编辑中
				$project[$k]['_current_applicant'] = '';
				$project[$k]['_current_editor'] = $v['audit_applicant'];
			}

			$cat = $this->getCategoryInfo($category, $v['category_id']);
			$project[$k]['_category_info'] = $cat;

			// 替换路径变量
			$project[$k]['_url'] = $this->getProjectUrl($cat['pub_api'], $cat['url'], $v['create_time']) . $v['flag'];

			$project[$k]['thumbnail'] = $this->getProjectThumb($v['id'], $v['thumbnail']);
		}

		// 分页
		import('ORG.Util.Page');
		$Page = new Page($count, $pagesize);
		$page = $Page->show();

		$this->assign('count', $count);
		$this->assign('project', $project);
		$this->assign('page', $page);
		$this->assign('category', $category);
		$this->assign('category_id', $category_id);
		$this->assign('kw', $kw);
		$this->display();
	}

	// 新建项目信息(不含布局处理)
	public function add() {
		// 上传缩略图处理
		$action = $this->_post('action');
		if ($action == 'upload_tpl_thumbnail') {
			$json = $this->upload_tpl_thumb();
			echo json_encode($json); // uploadify上传接口不能使用$this->output,需显式指定为json
			return false;
		}

		if ($this->isPost()) {
			// 项目资料再编辑模板前入库
			$Project = M('Project');

			// 表单校验
			$validate = array(
				array('title', 'require', '请输入项目名称'),
				array('intro', 'require', '请输入项目描述'),
				array('category_id', 'require', '请选择项目分类'),
				array('flag', 'require', '请输入项目路径'),
			);
			$Project->setProperty('_validate', $validate);
			
			$data = $Project->create();
			if ($data) {
				$data = $this->trim_all($data);


				// 由于分类已经限制了URL的唯一性,这里只需校验相同分类下的唯一性即可
				$w = array();
				$w['flag'] = $data['flag'];
				$w['category_id'] = $data['category_id'];
				$available = $Project->where($w)->count();
				if ($available) {
					echo json_encode(array(
						'retcode' => 1,
						'retmsg' => '当前分类下已存在路径为“' . $data['flag'] . '”的项目',
					));
					return false;
				}

				// 日期时间处理
				$sDate = $this->_post('s_date');
				$sTime = $this->_post('s_time');
				$eDate = $this->_post('e_date');
				$eTime = $this->_post('e_time');
				if (!empty($sDate) && !empty($eDate) && isLegalDate($sDate) && isLegalDate($eDate)) {
					if (!isLegalTime($sTime)) {
						$sTime = '00:00:00';
					}
					if (!isLegalTime($eTime)) {
						$eTime = '23:59:59';
					}

					$data['start_time'] = getTimestamp($sDate . ' ' . $sTime);
					$data['end_time'] = getTimestamp($eDate . ' ' . $eTime);
				}

				$time = time();

				// 新增项目,设置审批状态为已编辑审批
				$data['audit_applicant'] = AuthTicket::$name;
				$data['audit_status'] = self::AS_CHECKED;
				$data['audit_apply_msg'] = '新项目，申请编辑';

				$data['update_user'] = AuthTicket::$name;
				$data['update_time'] = $time;
				$data['create_time'] = $time;

				$result = $Project->add($data);
				if ($result) {
					// 缓存当前缩略图地址,发布时才入库
					$thumbnail = $this->_post('thumbnail');
					if (!empty($thumbnail)) {
						$this->projectCache($result, 'thumbnail', $thumbnail);
					}

					$json = array(
						'retcode' => 0,
						'retmsg' => 'OK',
						'projectID' => $result,
					);

					// 审批流通知
					// $this->audit_notice($result);
				} else {
					$json = array(
						'retcode' => 2,
						'retmsg' => '项目初始化失败',
					);
				}
			} else {
				$json = array(
					'retcode' => 3,
					'retmsg' => $Project->getError(),
				);
			}
			echo json_encode($json);
		} else {
			// 选择模板
			$Tpl = M('Tpl');
			$tpl = $Tpl->order('update_time desc')->select();
			$count = $Tpl->count();
			foreach ($tpl as $k => $v) {
				$tpl[$k]['thumbnail'] = (empty($v['thumbnail']) ? '/Public/Home/Img/tpl.png' : $v['thumbnail']);
			}

			// 分类
			$Category = M('Category');
			$category = $Category->select();

			// 项目分类路径处理
			foreach ($category as $k => $v) {
				// 替换路径变量(新建时以当前时间为基准)
				$category[$k]['url'] = $this->getProjectUrl($v['pub_api'], $v['url'], time());
			}

			$this->assign('count', $count);
			$this->assign('tpl', $tpl);
			$this->assign('category', $category);
			$this->display();	
		}
	}


	// 查看项目信息
	public function check() {
		$id = $this->_param('id');
		$Project = M('Project');
		$project = $Project->find($id);
		if (!$project) {
			$this->error('指定ID的数据不存在');
			return false;
		}

		// 日期时间处理
		if (!empty($project['start_time']) && !empty($project['end_time'])) {
			$stime = getTime($project['start_time']);
			$project['start_time'] = $stime['t'];

			$etime = getTime($project['end_time']);
			$project['end_time'] = $etime['t'];
		}
		// 缩略图
		$project['_thumbnail'] = $this->getProjectThumb($id, $project['thumbnail'], true);

		$project['update_time'] = date('Y-m-d H:i:s', $project['update_time']);
		$project['create_time'] = date('Y-m-d H:i:s', $project['create_time']);

		// 模板标题
		$Tpl = M('Tpl');
		$project['_tpl_title'] = $Tpl->where($project['tpl_id'])->getField('title');

		// 分类
		$Category = M('Category');
		$category = $Category->find($project['category_id']);

		// 替换路径变量
		$project['_url'] = $this->getProjectUrl($category['pub_api'], $category['url'], $project['create_time']);

		$this->assign('category', $category);
		$this->assign('project', $project);
		$this->display();
	}


	// 删除项目
	public function del() {
		$id = $this->_get('id');
		if (empty($id)) {
			$this->error('参数错误');
			return false;
		}
		$Project = M('Project');
		$result = $Project->delete($id);
		if ($result) {
			$this->success('项目删除成功', '/index.php/Project/');
		} else {
			$this->error('项目删除失败');
		}
	}

	// 上传项目缩略图图片
	private function upload_tpl_thumb() {
		// 1 * 1024 * 1024 = 1M
		$maxUploadFileSize = 1 * 1024 * 1024; 

		// 以"Upload/project_thumb/201306/xxx.jpg"的文件夹存放文件
		$upload_path = $this->project_upload_path . date('Ym') . '/';
		makeDir($upload_path);

		import('ORG.Net.UploadFile');
		$upload = new UploadFile(); // 实例化上传类
		$upload->maxSize = $maxUploadFileSize ; // 设置附件上传大小
		$upload->allowExts = array('jpg', 'gif', 'png', 'jpeg'); // 设置附件上传类型
		$upload->savePath = './' . $upload_path; // 设置附件上传目录
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
			$file = array();
			$file['path'] = '/' . $upload_path . $info['savename'];


			$json = array(
				'retcode' => 0,
				'retmsg' => 'OK',
				'info' => $info,
				'file' => $file,
			);
		}

		return $json;
	}

	// 上传布局背景图
	private function upload_layout_bg() {
		$id = $this->_post('id');
		$Project = M('Project');
		$project = $Project->find($id);

		// 5 * 1024 * 1024 = 5M
		$maxUploadFileSize = 5 * 1024 * 1024; 

		// 最终发布时的相对目录
		$release_path = 'res/';
		// 以"issue/release/11/res/"的文件夹存放文件
		$upload_path = $this->LOCAL_RELEASE_PATH . $id . '/' . $release_path;

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

			// 背景图质量
			$bg_quality = intval($this->_post('bg_quality'));
			if ($bg_quality > 0 && $bg_quality < 100) {
				changeImgQuality($upload_file, $bg_quality);	
			}

			// 裁剪
			import('ORG.Util.Image.ThinkImage');
			$img = new ThinkImage(THINKIMAGE_GD, $upload_file);
			$bg_width = $img->width();
			$bg_height = $img->height();

			$file = array();
			$slices_height = intval($this->_post('slices_height'));
			if ($slices_height > 0) {
				$suffix = '.' . getFileSuffix($info['savename']);
				$img_name = basename($info['savename'], $suffix);
				$pieces = ceil($bg_height / $slices_height); // 获取切片数
				$slices_y = 0;
				for ($i = 1; $i <= $pieces; $i++) {
					$crop_height = ($bg_height - $slices_y > $slices_height) ? $slices_height : $bg_height - $slices_y;
					// crop后图片资源引用已改变，需每次重新new
					$crop_img = new ThinkImage(THINKIMAGE_GD, $upload_file);
					$crop_name = $img_name . '_' . $i . $suffix;
					$dest = $upload_path . $crop_name;
					$crop_img->crop($bg_width, $crop_height, 0, $slices_y)->save($dest);
					$slices_y += $slices_height;

					$file[] = array(
						'filename' => $crop_name,
						'path' => C('HTTP_HOST') . '/' . $dest, // 本地访问路径,必须包含域名
						'release_url' => $release_path . $crop_name, // 输出时的相对目录, res/xxx.jpg
						'width' => $bg_width,
						'height' => $crop_height,
					);
				}
			} else {
				$file[] = array(
					'filename' => $info['savename'],
					'path' => C('HTTP_HOST') . '/' . $upload_path . $info['savename'],
					'release_url' => $release_path . $info['savename'],
					'width' => $bg_width,
					'height' => $bg_height,
				);
			}

			$json = array(
				'retcode' => 0,
				'retmsg' => 'OK',
				'info' => $info,
				'file' => $file,
			);
		}

		return $json;
	}

	// 上传文件文件
	private function upload_module_file() {
		$id = $this->_post('id');
		// 文件大小上限
		$maxUploadFileSize = $this->_post('fileSizeLimit'); // 字节
		$maxUploadFileSize = empty($fileSizeLimit) ? 1 * 1024 * 1024 : $fileSizeLimit;
		// 允许的文件格式
		$allowExts = $this->_post('fileTypeExts');
		$allowExts = explode(';', $allowExts); // array('jpg', 'gif', 'png', 'jpeg')

		$Project = M('Project');
		$project = $Project->find($id);

		// 最终发布时的相对目录
		$release_path = 'res/';
		// 以"issue/release/11/res/"的文件夹存放文件
		$upload_path = $this->LOCAL_RELEASE_PATH . $id . '/' . $release_path;

		makeDir($upload_path);

		import('ORG.Net.UploadFile');
		$upload = new UploadFile(); // 实例化上传类
		$upload->maxSize = $maxUploadFileSize ; // 设置附件上传大小
		$upload->allowExts = $allowExts; // 设置附件上传类型
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

			// 图片处理库
			import('ORG.Util.Image.ThinkImage');

			$file = array();
			foreach($info as $k => $v) {
				$path = $upload_path . $v['savename'];

				$f = array();
				$f['path'] = C('HTTP_HOST') . '/' . $path; // 本地访问路径
				$f['release_url']  = $release_path . $v['savename']; // 最终发布时的相对当前项目的路径, res/xxx.png

				// 图片则返回宽高
				// getimagesize() 函数将测定任何 GIF，JPG，PNG，SWF，SWC，PSD，TIFF，BMP，IFF，JP2，JPX，JB2，JPC，XBM或 WBMP 图像文件的大小并返回图像的尺寸以及文件类型和一个可以用于普通 HTML 文件中 IMG 标记中的 height/width 文本字符串
				if (strtolower($v['extension']) != 'swf' && getimagesize($path)) {
					$img = new ThinkImage(THINKIMAGE_GD, $path);
					$f['width'] = $img->width();
					$f['height'] = $img->height();
				}

				$file[] = $f;
			}

			$json = array(
				'retcode' => 0,
				'retmsg' => 'OK',
				'info' => $info,
				'file' => $file,
			);
		}

		return $json;
	}
	
	// 保存草稿
	private function save_draft($id, $data) {
		$data = htmlspecialchars_decode(stripslashes($data)); // 去除反斜杠,转换实体符为原有字符
		$file = $this->LOCAL_RELEASE_PATH . $id . '/draft.html';
		$this->generateFile($file, $data);

		$json = array(
			'retcode' => 0,
			'retmsg' => '数据保存成功',
			'url' => '/' . $file,
		);
		return $json;
	}

	// 删除草稿
	private function del_draft($id) {
		$draftFile = $this->LOCAL_RELEASE_PATH . $id . '/draft.html';
		// 草稿不存在时,也认为成功
		if (!file_exists($draftFile) || ($result = unlink($draftFile))) {
			$json = array(
				'retcode' => 0,
				'retmsg' => '草稿删除成功',
			);
		} else {
		 	$json = array(
				'retcode' => 1,
				'retmsg' => '草稿删除失败',
			);
		}
		return $json;
	}


	/**
	 * 删除文件或文件夹下的内容
	 * @param string $folder
	 * @return boolean
	 */
	 private function file_delete($folder) {
		if (is_file($folder) && file_exists($folder)) {
			unlink($folder);
		}
		if (is_dir($folder)) {
			$handle = opendir($folder);
			while(false !== ($myFile = readdir($handle))) {
				if ($myFile != '.' && $myFile != '..') {
					$this->file_delete($folder . '/' . $myFile);
				}
			}
			closedir($handle);
			rmdir($folder);
		}
		unset($folder);
	}
	
	/**
	 * 文件(夹)拷贝
	 * @param $source 源文件夹
	 * @param $dir 目标文件夹
	 * @return boolean
	 */
	private function x_copy($source, $dir) {
		$_dir = dirname($dir);
		if (!is_dir($_dir)) {
			mkdir($_dir, 0777, true);
		}

		if (is_file($source)) { // 如果文件存在且为正常的文件则返回TRUE
			copy($source, $dir);
		} else {
			$handle = dir($source);
			if ($handle) {
				while($entry = $handle->read()) {
					if (($entry != '.') && ($entry != '..')) {
						if (is_dir($source . '/' . $entry)) {
							$this->x_copy($source . '/' . $entry, $dir . '/' . $entry);
						} else {
							copy($source . '/' . $entry, $dir . '/' . $entry);
						}
					}
				}
			}	
		}
		
		return true;
	}
	
	/**
	 * 通知
	 */
	private function notice($sender, $receiver, $title, $body) {
		// TODO: 这里调用通知服务
	}

	/**
	 * 检查发布锁
	 */
	private function is_pub_lock($file) {
		// 文件存在且非死锁则不可发布
		if (file_exists($file)) {
			$content = file_get_contents($file);
			if ($content !== false) {
				$content = explode('|', trim($content));
				$file_lock_time = $content[2]; // Cubie|Zawa|1354845412|2012-12-25 12:02:05
				$now = time();
				$remaintime = $now - $file_lock_time - 5 * 60;
				if ($remaintime < 0) { // 文件产生时间超过5分钟则认为是死锁,无效,可发布
					return array(
						'sys' => $content[0],
						'user' => $content[1],
						'locktime' => date('Y-m-d H:i:s', $file_lock_time),
						'remaintime' => abs($remaintime), // 单位秒
					);
				}
			}
		}
		return false;
	}

	/**
	 * 发布加/解锁
	 */
	private function set_pub_lock($file, $unlock = false) {
		if ($unlock === true) {
			if (is_file($file) && file_exists($file)) {
				unlink($file);
			}
		} else {
			$time = time();
			$content = 'Cubie|' . AuthTicket::$name . '|' . $time . '|' . date('Y-m-d H:i:s', $time);
			
			// 文件锁
			$fp = fopen($file, 'w');
			if (flock($fp, LOCK_EX)) { // 进行排它型锁定
				fwrite($fp, $content);
				flock($fp, LOCK_UN); // 释放锁定
			}
			fclose($fp);
		}
	}

	/**
	 * 添加一条发布日志
	 * @param string $pub_status 发布状态; 1:预发布; 2:正式发布
	 * @param string $category_id 分类ID
	 * @param string $project_id 项目ID
	 */
	private function log($pub_status, $category_id, $project_id) {
		$Log = M('Log');
		$log['type'] = self::LT_PUB; // 1:表示发布日志
		$log['user'] = AuthTicket::$name;
		$log['create_time'] = time();
		$log['operation'] = 'pub=' . $pub_status . '|category_id=' . $category_id . '|project_id=' . $project_id;
		$Log->add($log);
	}

	// 获取带点的后缀
	private function get_suffix($suffix) {
		if (substr($suffix, 0, 1) != '.') {
			$suffix = '.' . $suffix;
		}
		return $suffix;
	}


	/**
	 * 审批流通知
	 * @param int $project_id 项目ID
	 */
	private function audit_notice($project_id) {
		$Project = M('Project');
		$project = $Project->find($project_id);

		// 审批人
		$Category = M('Category');
		$category = $Category->find($project['category_id']);
		$auditor = $category['auditor'];

		// 正式发布状态下,追加正式发布审批人
		if ($project['audit_status'] == self::AS_CHECKED_PUB) {
			$auditor .= ';' . $project['pub_auditor'];
		}

		// 去重
		$auditor = $this->formatStr($auditor);
		
		$status = $project['audit_status'];
		$str = $project['title'] . '（' . $project['intro'] . '）' . chr(10);
		switch ($status) {
			case self::AS_TOCHECK: // 待编辑审批
			case self::AS_TOCHECK_PUB: // 待正式发布审批
				$str .= $project['audit_applicant'] . ' 申请' . ($status == self::AS_TOCHECK ? '编辑' : '正式发布') . chr(10);
				$str .= '申请理由：' . $project['audit_apply_msg'];
				break;
			case self::AS_CHECKED: // 已编辑审批
			case self::AS_CHECKED_PUB: // 已正式发布审批
				$str .= '审批人：' . $project['audit_auditor'] . chr(10);
				$str .= '审批情况：同意' . chr(10);
				$str .= '审批意见：' . $project['audit_msg'];
				break;
			case self::AS_REJECT: // 驳回编辑申请
			case self::AS_REJECT_PUB: // 驳回正式发布申请
				$str .= '审批人：' . $project['audit_auditor'] . chr(10);
				$str .= '审批情况：驳回' . chr(10);
				$str .= '审批意见：' . $project['audit_msg'];
				break;
		}
		
		// 通知所有审批人
		$sender = AuthTicket::$name;
		$receiver = $auditor; // 通知列表, 多人以分号分割
		$title = '【审批通知】- Cubie';
		$body = $str . chr(10) . '[详情|' . C('HTTP_HOST') . '/index.php/Project/check/id/' . $project_id . ']';
		$this->notice($sender, $receiver, $title, $body);
	}

	/**
	 * 审批流校验,是否可编辑
	 * @param int $audit_status 审批状态
	 * @param string $audit_applicant 审批申请人
	 */
	private function is_project_editable($audit_status, $audit_applicant) {
		// 审批流检查,同时满足以下条件方可编辑
		// 1. 管理员或者是当前审批流申请人
		// 2: "已编辑审批/待正式发布审批/已正式发布审批/驳回正式发布申请" 此4种状态均可以编辑项目
		if (($this->is_super || strtolower($audit_applicant) == strtolower(AuthTicket::$name))
			&& in_array($audit_status, array(self::AS_CHECKED, self::AS_TOCHECK_PUB, self::AS_CHECKED_PUB, self::AS_REJECT_PUB))) {
			return true;
		}
		return false;
	}

	// 申请审批
	public function applyAudit($type = 'edit') {
		$id = $this->_post('id');
		$Project = M('Project');
		$project = $Project->find($id);

		$data = array();
		$data['id'] = $id;
		$data['audit_applicant'] = AuthTicket::$name; //  申请人
		$data['audit_apply_msg'] = $this->_post('msg'); // 申请审批信息

		// 状态判断
		$audit_status = $project['audit_status'];

		// 初始化状态或驳回编辑审批状态下才可申请审批(申请编辑审批成功后的审批流需要用户手动结束)
		// 已编辑审批状态下才可申请正式发布审批
		if (($type == 'edit' && in_array($audit_status, array(self::AS_INIT, self::AS_REJECT))) 
			|| ($type == 'pub' && $audit_status == self::AS_CHECKED)) {

			$data['audit_status'] = ($type == 'edit') ? self::AS_TOCHECK : self::AS_TOCHECK_PUB;

			$result = $Project->save($data);
			if ($result) {
				$json = array(
					'retcode' => 0,
					'retmsg' => '申请审批成功，已知会审批人',
				);

				// 审批流通知
				$this->audit_notice($id);
			} else {
				$json = array(
					'retcode' => 2,
					'retmsg' => '申请审批失败(未知的错误)',
				);
			}
		} else {
			$json = array(
				'retcode' => 1,
				'retmsg' => '审批流有误',
			);
		}

		$this->output($json, '/index.php/Index/editing');
	}

	// 审批
	public function setAudit() {
		$id = $this->_post('id');
		$type = $this->_post('type');
		$type  = ($type == 1) ? 1 : 0; // 0:驳回; 1:通过

		$Project = M('Project');
		$project = $Project->find($id);

		$data = array();
		$data['id'] = $id;
		$data['audit_auditor'] = AuthTicket::$name; //  审批人
		$data['audit_msg'] = $this->_post('msg'); // 审批意见
		$data['update_user'] = $project['audit_applicant']; // 审批成功后,更新操作人为申请审批人

		// 状态判断
		$audit_status = $project['audit_status'];

		// 待审批状态下才可驳回或通过
		if (in_array($audit_status, array(self::AS_TOCHECK, self::AS_TOCHECK_PUB))) {
			if ($type == 0) {
				$data['audit_status'] = ($audit_status == self::AS_TOCHECK) ? self::AS_REJECT : self::AS_REJECT_PUB;
			} else {
				$data['audit_status'] = ($audit_status == self::AS_TOCHECK) ? self::AS_CHECKED : self::AS_CHECKED_PUB;
			}

			$result = $Project->save($data);
			if ($result) {
				$json = array(
					'retcode' => 0,
					'retmsg' => ($type == 0  ? '申请已驳回' : '审批成功') . '，已知会申请人',
				);

				// 审批流通知
				$this->audit_notice($id);
			} else {
				$json = array(
					'retcode' => 2,
					'retmsg' => '审批失败(未知的错误)',
				);
			}
		} else {
			$json = array(
				'retcode' => 1,
				'retmsg' => '审批流有误',
			);
		}

		$this->output($json);
	}

	/**
	 * 拷贝项目发布图片到指定目录
	 * @param {Int} $id $id 项目ID
	 * @param {String} $dest 目标路径
	 */
	private function copy_project_images($id, $dest) {
		$project_path = $this->LOCAL_RELEASE_PATH . $id . '/'; // issue/release/1/
		$resource = explode(',', $this->_post('resource'));
		if (count($resource) > 0) {
			foreach ($resource as $k => $v) {
				$source_file = $project_path . 'res/' . $v;
				$dest_file = $dest . $v;

				$this->x_copy($source_file, $dest_file);
			}
		}
	}

	/**
	 * 拷贝项目缩略图到指定目录
	 * @param {Int} $id $id 项目ID
	 * @param {String} $dest 目标路径
	 */
	private function copy_project_thumbnail($id, $dest) {
		$thumbnail_cache = $this->projectCache($id, 'thumbnail');
		if (!empty($thumbnail_cache)) {
			// 由于缩略图缓存相对站点根目录,这里去除路径首个斜杠
			if (substr($thumbnail_cache, 0, 1) == '/') {
				$thumbnail_cache = substr($thumbnail_cache, 1);
			}

			if (file_exists($thumbnail_cache)) {
				// 获取缩略图后缀(不含点), jpg/png...
				$suffix = getFileSuffix($thumbnail_cache);
				// 复制为index.xxx文件
				$dest_file = $dest . 'index.' . $suffix;
				$this->x_copy($thumbnail_cache, $dest_file);	
			}
		}
	}

	/**
	 * 预发布/正式发布(使用发布锁+文件锁方式)
	 * @param {Int} $id 项目ID
	 * @param {Int} $publish_type 发布类型
	 * @param {String} $suffix 项目文件名后缀
	 * @param {Object} $project_data
	 * @return Array
	 */
	private function publish($id, $pub_type = self::PS_PREPUB, $suffix, $project_data) {
		$Project = M('Project');
		$project = $Project->find($id);

		// 是否预发布
		$is_pre = ($pub_type == self::PS_PREPUB) ? true : false;
		
		// 发布锁
		$publock = $this->is_pub_lock($pub_lock_file);
		if ($publock !== false) {
			$lockstr = '<br /><br />占用系统：' . $publock['sys'] . '<br />占用用户：' . $publock['user'] . '<br />占用时间：' . $publock['locktime'] . '<br />预计解锁时间：' . strftime('%M分 %S秒后', $publock['remaintime']);

			return array(
				'rc' => 2,
				'rm' => '当前存在发布中的版本，请稍后再试！' . $lockstr,
			);
		}
		$this->set_pub_lock($pub_lock_file);
		
		// 查询项目所属分类
		$Category = M('Category');
		$category = $Category->find($project['category_id']);


		$project_path = $this->LOCAL_RELEASE_PATH . $id . '/'; // issue/release/1/
		// 替换路径变量, %year%/ -> 2013/
		$pub_api_dir = $this->formatProjectUrl($category['url'], $project['create_time']);
		// 首尾斜杠处理
		$pub_api_dir = formatUrl($pub_api_dir);

		$pub_tmp_dir = $pub_api_dir . $project['flag'] . '/'; // 2013/demo/
		$pub_lock_file = __ROOT__ . 'issue/lock.data'; // 本地发布锁文件
		$pub_tmp_root_path = __ROOT__ . 'issue/tmp/'; // 本地临时发布目录
		$pub_script = '';


		// 根据不同发布接口定义地址(调试模式下无效)
		if (APP_DEBUG !== true) {
			$pub_api = $category['pub_api'];
			// TODO: 这里定义发布接口
			switch ($pub_api) {
				case 'xxx': // xxx发布接口
					$pub_lock_file = '/data/wwwroot/xxx/htdocs/publock/lock.data'; // 定义文件锁路径
					$pub_tmp_root_path = '/data/wwwroot/xxx/htdocs/issue/'; // 定义临时发布目录
					$pub_script = 'xxx.cgi'; // 定义发布脚本
					break;
				default:
					return array(
						'rc' => 3,
						'rm' => '发布接口未定义',
					);
					break;
			}	
		}


		// 拷贝需要的文件到本地临时发布目录
		// 清空临时目录
		$this->file_delete($pub_tmp_root_path);

		// 待发布图片
		$dest = $pub_tmp_root_path . $pub_tmp_dir . 'res/';
		$this->copy_project_images($id, $dest);

		// 首页缩略图
		$dest = $pub_tmp_root_path . $pub_tmp_dir;
		$this->copy_project_thumbnail($id, $dest);

		// 外链CSS、JS
		if ($project_data['css_lnk'] == 1) {
			$source_file = $project_path . 'index.css';
			$dest_file = $pub_tmp_root_path . $pub_tmp_dir . 'index.css'; // 发布文件命名为index.css
			$this->x_copy($source_file, $dest_file);
		}
		if ($project_data['js_lnk'] == 1) {
			$source_file = $project_path . 'index.js';
			$dest_file = $pub_tmp_root_path . $pub_tmp_dir . 'index.js'; // 发布文件命名为index.js
			$this->x_copy($source_file, $dest_file);
		}

		// 生成的布局文件
		$source_file = $project_path . 'index' . $suffix;
		$dest_file = $pub_tmp_root_path . $pub_tmp_dir . 'index' . $suffix; // 发布文件命名为index.xxx
		$this->x_copy($source_file, $dest_file);
		
		if (APP_DEBUG !== true) {
			// TODO: 这里调用发布接口进行项目发布
			

			// 项目线上路径
			$url = $this->getProjectUrl($category['pub_api'], $category['url'], $project['create_time']);
			$url .= $project['flag'] . '/index' . $suffix;	
		} else {
			$url = '/issue/release/' . $id . '/index' . $suffix;
		}
				

		return array(
			'retcode' => 0,
			'retmsg' => 'OK',
			'url' => $url,
		);
	}

	// 获取提交来的项目数据()
	private function get_project_data() {
		$data = array();
		
		$data['css_lnk'] = $this->_post('css_lnk');
		$data['css'] = trim($this->_post('css'));
		$data['js_lnk'] = $this->_post('js_lnk');
		$data['js'] = trim($this->_post('js'));
		$data['suffix'] = trim($this->_post('suffix'));
		$data['layout'] = trim($this->_post('layout'));
		$data['html'] = trim($this->_post('html'));
		$data['resource'] = trim($this->_post('resource'));

		$data['title'] = trim($this->_post('project_title'));
		$data['intro'] = trim($this->_post('project_intro'));
		$data['thumbnail'] = trim($this->_post('project_thumbnail'));

		$project_s_date = trim($this->_post('project_s_date'));
		$project_s_time = trim($this->_post('project_s_time'));
		$project_e_date = trim($this->_post('project_e_date'));
		$project_e_time = trim($this->_post('project_e_time'));
		$project_start_time;
		$project_end_time;

		// 时间格式处理
		if (!empty($project_s_date) && !empty($project_e_date) && isLegalDate($project_s_date) && isLegalDate($project_e_date)) {
			if (!isLegalTime($project_s_time)) {
				$project_s_time = '00:00:00';
			}
			if (!isLegalTime($project_e_time)) {
				$project_e_time = '23:59:59';
			}

			$data['start_time'] = getTimestamp($project_s_date . ' ' . $project_s_time);
			$data['end_time'] = getTimestamp($project_e_date . ' ' . $project_e_time);
		}

		return $data;
	}

	/**
	 * 生成外链文件
	 * @param {String} $action
	 * @param {String} $html
	 * @param {String} $dest 目标路径
	 */
	private function mk_lnk_file($action, $html, $dest) {
		$project_data = $this->get_project_data();

		// 生成的外链文件名配置
		$file_suffix = ($action == 'preview') ? 'preview' : 'index';

		// 是否外链
		$css_lnk = $project_data['css_lnk'];
		$js_lnk = $project_data['js_lnk'];
		if ($css_lnk == 1) {
			$css = htmlspecialchars_decode(stripslashes($project_data['css']));
			$css_file_hash = md5($css);
			$html = str_replace('{$project.__css__}', $file_suffix . '.css?_=' . $css_file_hash, $html);
			$file = $dest . $file_suffix . '.css';
			$this->generateFile($file, $css);
		}
		if ($js_lnk == 1) {
			$js = htmlspecialchars_decode(stripslashes($project_data['js']));
			$js_file_hash = md5($js);
			$html = str_replace('{$project.__js__}', $file_suffix . '.js?_=' . $js_file_hash, $html);
			$file = $dest . $file_suffix . '.js';
			$this->generateFile($file, $js);
		}

		return $html;
	}

	/**
	 * 获取解析过后的模板内容
	 * @param {Boolean} $base 是否给模板添加base标签
	 */
	private function get_tpl($project, $base = false) {
		$Tpl = M('Tpl');
		$tpl = $Tpl->find($project['tpl_id']);

		if (!$tpl) {
			return array(
				'retcode' => 1,
				'retmsg' => '获取模版失败'
			);
		}

		// 项目属性数据
		$project_data = $this->get_project_data();

		// 合并项目属性数据与数据库数据
		$project = array_merge($project, $project_data);

		// 替换模板变量
		$project_var = array();
		$project_var['id'] = $project['id'];
		$project_var['flag'] = $project['flag'];
		$project_var['title'] = $project['title'];
		$project_var['intro'] = $project['intro'];
		$project_var['start_time_Y'] = date('Y', $project['start_time']);
		$project_var['start_time_m'] = date('m', $project['start_time']);
		$project_var['start_time_d'] = date('d', $project['start_time']);
		$project_var['start_time_H'] = date('H', $project['start_time']);
		$project_var['start_time_i'] = date('i', $project['start_time']);
		$project_var['start_time_s'] = date('s', $project['start_time']);
		$project_var['end_time_Y'] = date('Y', $project['end_time']);
		$project_var['end_time_m'] = date('m', $project['end_time']);
		$project_var['end_time_d'] = date('d', $project['end_time']);
		$project_var['end_time_H'] = date('H', $project['end_time']);
		$project_var['end_time_i'] = date('i', $project['end_time']);
		$project_var['end_time_s'] = date('s', $project['end_time']);
		$project_var['create_time_Y'] = date('Y', $project['create_time']);
		$project_var['create_time_m'] = date('m', $project['create_time']);
		$project_var['create_time_d'] = date('d', $project['create_time']);
		$project_var['create_time_H'] = date('H', $project['create_time']);
		$project_var['create_time_i'] = date('i', $project['create_time']);
		$project_var['create_time_s'] = date('s', $project['create_time']);

		$this->assign('project', $project_var);

		// 获取解析后的模板内容
		$tpl['html'] = $this->fetch('', $tpl['html']);

		// 替换include指令
		import('@.Common.TemplateParser');
		$TP = new TemplateParser();
		$ssi_html = $TP->replace_include_ssi($tpl['html'], $tpl['charset'], $base);

		return array(
			'retcode' => 0,
			'retmsg' => 'OK',
			'tpl'=> $tpl,
			'ssi_html' => $ssi_html, // 经过SSI解析的html
			'serverTime' => date('Y-m-d H:i:s', time()),
		);
	}


	// 布局编辑
	public function layout() {
		$id = $this->_param('id');
		if (empty($id)) {
			$json = array(
				'retcode' => 1,
				'retmsg' => '参数错误',
			);
			$this->output($json);
			return false;
		}

		$Project = M('Project');
		$project = $Project->find($id);
		if (!$project) {
			$json = array(
				'retcode' => 1,
				'retmsg' => '指定ID的数据不存在',
			);
			$this->output($json);
			return false;
		}

		// 审批流检查
		if (!$this->is_project_editable($project['audit_status'], $project['audit_applicant'])) {
			$json = array(
				'retcode' => 1,
				'retmsg' => '审批流校验失败（流程错误或权限不足）',
			);
			$this->output($json);
			return false;
		}

		$action = $this->_param('action');
		switch ($action) {
			case 'upload_tpl_thumbnail': // 上传项目缩略图
				$json = $this->upload_tpl_thumb();

				if ($json['retcode'] == 0) {
					// 缓存当前缩略图地址
					$this->projectCache($id, 'thumbnail', $json['file']['path']);
				}

				echo json_encode($json);
				break;
			case 'del_project_thumbcache': // 删除项目缩略图缓存
				$this->projectCache($id, 'thumbnail', null);
				break;
			case 'upload_layout_bg': // 上传背景图
				$json = $this->upload_layout_bg();
				echo json_encode($json);
				break;
			case 'upload_module_file': // 上传文件(组件接口)
				$json = $this->upload_module_file();
				echo json_encode($json);
				break;
			case 'get_tpl': // 获取模版数据
				$json = $this->get_tpl($project);
				$this->output($json);
				break;
			case 'tpl_substrate': // 布局模板衬底
				$json = $this->get_tpl($project, true);

				if ($json['retcode'] == 0) {
					// 模版编码处理,好像不会乱码?

					// 防止模板JS影响衬底与布局页面交互,这里禁用模板里的JS,衬底只做基本的参考作用
					// [\s\S]*?的?表示懒惰模式,匹配到即停止,防止多个script匹配成一个的问题
					$pattern = '/<script[^>]*>([\s\S]*?)<\/script>/i';
					$ssi_html = preg_replace($pattern, '', $json['ssi_html']);

					$this->assign('html', $ssi_html);
					$this->display('tpl_substrate');
				}
				break;
			case 'del_draft': // 删除草稿
				$json = $this->del_draft($id);
				$this->output($json);
				break;
			case 'save_draft': // 保存草稿
				$json = $this->save_draft($id, $this->_post('layout'));
				$this->output($json);
				break;
			case 'preview': // 预览
				$project_data = $this->get_project_data();

				// 模板编码
				$tpl_charset = M('Tpl')->where('id=' . $project['tpl_id'])->getField('charset');

				// 预览跟发布都先保存草稿
				$this->save_draft($id, $project_data['layout']);

				$html = htmlspecialchars_decode(stripslashes($project_data['html'])); // 去除反斜杠,转换实体符为原有字符
				$dest = $this->LOCAL_RELEASE_PATH . $id . '/';
				$html = $this->mk_lnk_file($action, $html, $dest); // 是否外链
				$file = $dest . 'preview.shtml';
				$this->generateFile($file, $html, $tpl_charset);

				$json = array(
					'retcode' => 0,
					'retmsg' => 'OK',
					'url' => '/' . $file,
					'html' => $html,
				);
				$this->output($json);
				break;
			case 'zip': // 导出zip包(只取数据生成文件,不对数据入库)
				$project_data = $this->get_project_data();

				// 模板编码
				$tpl_charset = M('Tpl')->where('id=' . $project['tpl_id'])->getField('charset');

				// 保存草稿
				$this->save_draft($id, $project_data['layout']);

				// zip目录(/issue/release/123/zip/)不存在则创建
				$zip_path = $this->LOCAL_RELEASE_PATH . $id . '/' . 'zip/'; // issue/release/1/
				makeDir($zip_path);

				// 先清空zip目录
				$this->file_delete($zip_path);

				// 自定义文件后缀
				$suffix = $this->get_suffix($project_data['suffix']);
				$suffix = empty($suffix) ? '.shtml' : $suffix;

				// 生成发布文件
				$filename = 'index' . $suffix;
				$html = htmlspecialchars_decode(stripslashes($project_data['html'])); // 去除反斜杠,转换实体符为原有字符
				$html = $this->mk_lnk_file($action, $html, $zip_path); // 是否外链, 外链时将css、js生成到zip目录
				$file = $zip_path . 'index' . $suffix;
				$this->generateFile($file, $html, $tpl_charset);

				// 拷贝图片、css、js、缩略图到zip目录
				$dest = $zip_path . 'res/';
				$this->copy_project_images($id, $dest);
				$this->copy_project_thumbnail($id, $zip_path);


				// http://www.phpconcept.net/pclzip/user-guide
				// PclZip简介与使用 http://www.ccvita.com/59.html
				import('@.Common.pclzip');
				$archive_name = $project['flag'] . '.zip';
				$archive_url = $zip_path . $archive_name; // 生成路径,生成在zip目录下,这样子瞎猜打包时自动删除,不会有冗余文件
				$archive = new PclZip($archive_url);
				// 将zip_path替换为空来生成, 生成的包里只有zip里的目录结构了
				$v_list = $archive->create($zip_path,
						PCLZIP_OPT_REMOVE_PATH, $zip_path,
						PCLZIP_OPT_ADD_PATH, '');
				if ($v_list == 0) {
					$json = array(
						'retcode' => 1,
						'retmsg' => $archive->errorInfo(true),
					);
				} else {
					$json = array(
						'retcode' => 0,
						'retmsg' => 'Zip包导出成功',
						'archive_name' => $archive_name,
						'archive_url' => '/' . $archive_url,
					);	
				}
				
				$this->output($json);
				break;
			case 'pre_pub': // 预发布
			case 'pub': // 正式发布
				// 检查项目是否支持发布
				$Category = M('Category');
				$category = $Category->find($project['category_id']);
				if (empty($this->PUB_API[$category['pub_api']])) {
					$json = array(
						'retcode' => 1,
						'retmsg' => '当前项目不支持发布',
					);
					$this->output($json);
					return false;
				}

				$pub_type = ($action == 'pub') ? self::PS_PUB : self::PS_PREPUB;
				$project_data = $this->get_project_data();

				// 正式发布数据检查
				if ($pub_type == self::PS_PUB) {
					if (empty($project_data['title']) || empty($project_data['intro'])) {
						$json = array(
							'retcode' => 2,
							'retmsg' => '项目名称或描述不能为空',
						);
						$this->output($json);
						return false;
					}
				}

				// 模板编码
				$tpl_charset = M('Tpl')->where('id=' . $project['tpl_id'])->getField('charset');

				// 预览跟发布都先保存草稿
				$this->save_draft($id, $project_data['layout']);

				// 自定义文件后缀
				$suffix = $this->get_suffix($project_data['suffix']);
				$suffix = empty($suffix) ? '.html' : $suffix;

				// 生成发布文件
				$html = htmlspecialchars_decode(stripslashes($project_data['html'])); // 去除反斜杠,转换实体符为原有字符
				$dest = $this->LOCAL_RELEASE_PATH . $id . '/';
				$html = $this->mk_lnk_file($action, $html, $dest); // 是否外链
				$file = $dest . 'index' . $suffix;
				$this->generateFile($file, $html, $tpl_charset);

				// 更新状态
				$data = array();
				$data['id'] = $id;
				$data['update_user'] = AuthTicket::$name;
				$data['update_time'] = time();
				if ($pub_type == self::PS_PUB) {
					$data['status'] = self::PS_PUB; // 更新发布状态

					// 正式发布时才保存数据到数据库,保证数据库数据与线上数据匹配
					$data['title'] = $project_data['title'];
					$data['intro'] = $project_data['intro'];
					$data['start_time'] = $project_data['start_time'];
					$data['end_time'] = $project_data['end_time'];
					$data['thumbnail'] = $project_data['thumbnail'];
					$data['layout'] = htmlspecialchars_decode(stripslashes($project_data['layout'])); // 去除反斜杠,转换实体符为原有字符
				} else {
					$data['status'] = self::PS_PREPUB;
				}
				$Project->startTrans(); // 启动事务
				$result = $Project->save($data);

				if (!$result) {
					$json = array(
						'retcode' => 3,
						'retmsg' => '数据保存失败!',
					);
					$this->output($json);
					return false;
				}

				// 发布
				$result = $this->publish($id, $pub_type, $suffix, $project_data);	
				
				// 事务提交
				if ($pub_type == self::PS_PUB) {
					if ($result['retcode'] == 0) {
						$Project->commit(); // 提交事务
					} else {
						$Project->rollback(); // 事务回滚
					}	
				}

				// 添加发布日志
				$this->log($pub_type, $project['category_id'], $id);

				$json = array(
					'retcode' => $result['retcode'],
					'retmsg' => $result['retmsg'],
					'url' => $result['url'],
				);
				$this->output($json);
				break;
			case 'apply_audit': // 正式发布申请
				$this->applyAudit('pub');
				break;
			case 'end_edit': // 结束编辑
				$project_data = $this->get_project_data();

				$data = array();
				$data['id'] = $id;
				$data['status'] = self::PS_INIT; // 恢复到待发布状态
				$data['audit_status'] = self::AS_INIT; // 恢复到初始化审批状态
				$data['update_time'] = time();


				// 是否保存到数据库,不支持发布才可以保存到数据库, 支持发布的只能在正式发布时入库
				if ($this->_post('_save_db') == 1) {
					$Category = M('Category');
					$category = $Category->find($project['category_id']);

					if (empty($this->PUB_API[$category['pub_api']])) {
						$data['title'] = $project_data['title'];
						$data['intro'] = $project_data['intro'];
						$data['start_time'] = $project_data['start_time'];
						$data['end_time'] = $project_data['end_time'];
						$data['thumbnail'] = $project_data['thumbnail'];
						$data['layout'] = htmlspecialchars_decode(stripslashes($project_data['layout'])); // 去除反斜杠,转换实体符为原有字符
					}
				}
				

				// 结束编辑时保存草稿
				$this->save_draft($id, $project_data['layout']);

				$result = $Project->save($data);
				if ($result) {
					$json = array(
						'retcode' => 0,
						'retmsg' => '已结束编辑',
					);
				} else {
					$json = array(
						'retcode' => 1,
						'retmsg' => '数据保存失败',
					);
				}

				$this->output($json);
				break;
			default: // 载入布局数据
				$project['draft'] = 0;

				// 是否存在草稿
				$draft_file = $this->LOCAL_RELEASE_PATH . $id . '/draft.html';
				if (file_exists($draft_file)) {
					$layout_data = file_get_contents($draft_file);
					if (!empty($layout_data)) {
						$project['layout'] = $layout_data;
						$project['draft'] = 1;
					}
				}
				
				$project['draft_file_time'] = ($project['draft'] == 1) ? date('Y-m-d H:i:s', filemtime($draft_file)) : '';

				// 项目缩略图,缓存中的优先于数据库
				$project['_thumbnail'] = $this->getProjectThumb($id, $project['thumbnail'], true);

				// 项目分类
				$Category = M('Category');
				$category = $Category->find($project['category_id']);

				// 替换路径变量
				$project['_path'] = $this->getProjectUrl($category['pub_api'], $category['url'], $project['create_time']);
				$project['_path'] .= $project['flag'];

				// 项目日期时间处理
				if (!empty($project['start_time']) && !empty($project['end_time'])) {
					$stime = getTime($project['start_time']);
					$project['s_date'] = $stime['date'];
					$project['s_time'] = $stime['time'];

					$etime = getTime($project['end_time']);
					$project['e_date'] = $etime['date'];
					$project['e_time'] = $etime['time'];
				}

				// 项目模板
				$Tpl = M('Tpl');
				$tpl = $Tpl->find($project['tpl_id']);
				
				// 获取解析后的模板
				$tpl_content = $this->get_tpl($project);


				// 提取样式
				$project_tpl = array();
				import('@.Common.TemplateParser');
				$TP = new TemplateParser();
				$project_tpl['domain'] = $TP->get_domain($tpl_content['ssi_html']);
				$project_tpl['css_file'] = $TP->fetch_css($tpl_content['ssi_html']);
	
				// $project_less_file = '';
				// if (!empty($css)) {
				// 	// 替换样式中的html、body为.cubie-layout-body
				// 	$css = $this->replace_to_less($css);
				// 	// 生成less文件
				// 	$css = '.cubie-layout-body {' . $css . '}'; 

				// 	// 生成编辑用less样式文件
				// 	$less_file = $this->LOCAL_RELEASE_PATH . $id . '/project.less';
				// 	$project_less_file = '<link rel="stylesheet/less" type="text/css" href="/' . $less_file . '" /><script type="text/javascript" src="/Public/Home/Js/less-1.4.2.js"></script>';
				// 	$this->generateFile($less_file, $css);
				// }



				// FIND_IN_SET http://www.thinkphp.cn/topic/356.html
				// mysql常用函数 http://blog.csdn.net/thinker87/article/details/1783287

				// 公用组件以及项目组件
				// $w = 'category_id="0" or category_id like "%|' . $project['category_id'] . '|%"';
				$Module = M('Module');
				$module = $Module->select();
				foreach ($module as $k => $v) {
					// 过滤不允许的组件
					$cid = explode('|', $v['category_id']);
					if ($v['category_id'] != '0' && !in_array($project['category_id'], $cid)) {
						unset($module[$k]);
						continue;	
					}
					
					// 转换为实体符输出
					$module[$k]['html'] = convert_htmlspecialchars($module[$k]['html']);
					$module[$k]['css'] = convert_htmlspecialchars($module[$k]['css']);
					$module[$k]['js'] = convert_htmlspecialchars($module[$k]['js']);
					$module[$k]['feature_js'] = convert_htmlspecialchars($module[$k]['feature_js']);
					$module[$k]['feature'] = convert_htmlspecialchars($module[$k]['feature']);
					$module[$k]['thumbnail_url'] = (empty($v['thumbnail']) ? '/Public/Home/Img/module.png' : $v['thumbnail']);
				}

				$this->assign('module', $module);
				$this->assign('project', $project);
				$this->assign('tpl', $tpl);
				$this->assign('category', $category);
				$this->assign('project_tpl', $project_tpl);
				$this->display();
				break;
		}
	}



	// 查看分类
	public function category() {
		$Category = M('Category');
		$category = $Category->select();
		$count = $Category->count();
		foreach ($category as $k => $v) {
			// 含发布接口的分类URL
			if (!empty($v['pub_api'])) {
				$category[$k]['url'] = $this->PUB_API[$v['pub_api']]['url'] . $category[$k]['url'];
			}

			// 多审批人换行处理
			$category[$k]['auditor'] = implode('<br />', explode(';', $category[$k]['auditor']));
			$category[$k]['pub_auditor'] = implode('<br />', explode(';', $category[$k]['pub_auditor']));
		}
		$this->assign('count', $count);
		$this->assign('category', $category);
		$this->display();
	}
	
	// 添加分类
	public function addCategory() {
		$Category = M('Category');
		if ($this->isPost()) {
			$title = trim($this->_post('title'));

			// 不区分大小写比较
			$qs = array();
			$qs['title'] = $title;
			$is_exist = $Category->where($qs)->count();
			if ($is_exist) {
				$this->error('已存在' . $qs['title'] . '的分类，请重新输入');
				return false;
			}
			
			// 为了保证发布的URL唯一性,同一发布接口下不能存在相同的分类URL
			$pub_api = $this->_post('pub_api');
			$url = trim($this->_post('url'));
			$qs = array();
			$qs['pub_api'] = $pub_api;
			$qs['url'] = $url;
			$is_exist = $Category->where($qs)->count();
			if ($is_exist) {
				$pa = $this->PUB_API[$pub_api];
				$this->error($pa['name'] . '下已存在 ' . $pa['url'] . $url . ' 的分类URL');
				return false;
			}

			// 表单校验
			$validate = array(
				array('title', 'require', '请输入分类名称'),
				array('intro', 'require', '请输入分类描述'),
				array('url', 'require', '请输入分类URL'),
				array('auditor', 'require', '请输入编辑审批人'),
			);
			if (!empty($data['pub_api'])) {
				$validate[] = array('pub_auditor', 'require', '请输入发布审批人');
			}
			$Category->setProperty('_validate', $validate);
			
			$data = $Category->create();
			if ($data) {
				$data['title'] = trim($data['title']);
				$data['intro'] = trim($data['intro']);
				$data['url'] = formatUrl(trim($data['url'])); // formatUrl,对url的首尾斜杠做处理
				$data['auditor'] = $this->formatStr($data['auditor']);
				$data['pub_auditor'] = empty($data['pub_api']) ? '' : $this->formatStr($data['pub_auditor']);
				$result = $Category->add($data);
				if ($result) {
					$this->success('分类新建成功', '/index.php/Project/category');
				} else {
					$this->error('分类新建失败');
				}
			} else {
				$this->error($Category->getError());
			}
		} else {
			$this->assign('pub_api', $this->PUB_API);
			$this->display('editCategory');
		}
	}
	
	// 编辑分类
	public function editCategory() {
		$id = $this->_param('id');
		$Category = M('Category');
		$category = $Category->find($id);
		if (!$category) {
			$this->error('指定ID的数据不存在');
			return false;
		}

		if ($this->isPost()) {
			$title = trim($this->_post('title'));

			if ($category['title'] != $title) {
				// 不区分大小写比较
				$qs = array();
				$qs['title'] = $title;
				$is_exist = $Category->where($qs)->count();
				if ($is_exist) {
					$this->error('已存在' . $qs['title'] . '的分类，请重新输入');
					return false;
				}
			}

			// 为了保证发布的URL唯一性,同一发布接口下不能存在相同的分类URL
			$url = trim($this->_post('url'));
			if ($category['url'] != $url) {
				$qs = array();
				$qs['pub_api'] = $category['pub_api'];
				$qs['url'] = $url;
				$is_exist = $Category->where($qs)->count();
				if ($is_exist) {
					$pa = $this->PUB_API[$category['pub_api']];
					$this->error($pa['name'] . '下已存在 ' . $pa['url'] . $url . ' 的分类URL');
					return false;
				}
			}

			// 表单校验
			$validate = array(
				array('title', 'require', '请输入分类名称'),
				array('intro', 'require', '请输入分类描述'),
				array('url', 'require', '请输入分类URL'),
				array('auditor', 'require', '请输入编辑审批人'),
			);
			if (!empty($data['pub_api'])) {
				$validate[] = array('pub_auditor', 'require', '请输入发布审批人');
			}
			$Category->setProperty('_validate', $validate);
			
			$data = $Category->create();
			if ($data) {
				$data['title'] = trim($data['title']);
				$data['intro'] = trim($data['intro']);
				$data['url'] = formatUrl(trim($data['url'])); // formatUrl,对url的首尾斜杠做处理
				$data['auditor'] = $this->formatStr($data['auditor']);
				$data['pub_auditor'] = empty($data['pub_api']) ? '' : $this->formatStr($data['pub_auditor']);
				$result = $Category->save($data);
				if ($result) {
					$this->success('分类编辑成功', '/index.php/Project/category');
				} else {
					$this->error('分类编辑失败');
				}
			} else {
				$this->error($Category->getError());
			}
		} else {
			$this->assign('category', $category);
			$this->assign('pub_api', $this->PUB_API);
			$this->display();
		}
	}
	
	// 删除分类
	public function delCategory() {
		$id = $this->_get('id');
		if (empty($id)) {
			$this->error('参数错误');
			return false;
		}
		$Category = M('Category');
		$result = $Category->delete($id);
		if ($result) {
			$this->success('指定分类删除成功', '/index.php/Project/category');
		} else {
			$this->error('指定分类删除失败');
		}
	}
}
