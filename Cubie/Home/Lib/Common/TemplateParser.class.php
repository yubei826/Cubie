<?php
/**
 * 模版解析
 * @author: Zawaliang
 */
class TemplateParser {

	private $domain = null;

	/**
	 * 构造函数
	 */
	public function __construct() {
		// 检查服务器策略是否支持DNS
		// checkdnsrr函数一般不支持, 但一般支持gethostbyname, 优先使用gethostbyname,否则使用do_get
		$dns = true;
		if (function_exists(gethostbyname) && gethostbyname('www.baidu.com') == 'www.baidu.com') {
			$dns = false;
		} else if ($this->do_get('https://www.baidu.com/') === false) {
			$dns = false;
		}

		if (!$dns) {
			// 加载域名配置
			$this->domain = require CONF_PATH . 'domain.php';
		}
	}
	

	/**
	 * 获取远程文件内容
	 * @param {String} $ip_domain 不支持DNS时提供
	 * @return 获取失败时返回false
	 */
	private function do_get($url, $ip_domain) {
		$ch = curl_init();
		$timeout = 6; // 秒

		// 根据ip获取资源时需要设置header
		// http://artur.ejsmont.org/blog/content/loading-url-with-curl-from-specified-ip-address
		if (!empty($ip_domain)) {
			$headers = array('Host: ' . $ip_domain);
			curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
		}

		// SSL
		// http://blog.csdn.net/linvo/article/details/8816079
		$domain_info = $this->parse_domain($url);
		$ssl = ($domain_info['protocol'] == 'https');
		if ($ssl) {
			curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // 信任任何证书  
			curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 1); // 检查证书中是否设置域名  
		}
		
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); 
		curl_setopt($ch, CURLOPT_TIMEOUT, $timeout); // 设置cURL允许执行的最长秒数 http://php.net/manual/zh/function.curl-setopt.php
		// curl_setopt($ch, CURLOPT_DNS_USE_GLOBAL_CACHE, false);
		// curl_setopt($ch, CURLOPT_DNS_CACHE_TIMEOUT, 2);
		$contents = curl_exec($ch);

		// 如果请求没有发送失败 
		if ($contents !== false) {
			// 检查响应是否为200
			$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE); 
			if ($statusCode != 200) { 
				$contents = false;
			}
		} else {
			// dump(curl_error($ch));
			// dump(curl_errno($ch));
			$contents = file_get_contents($url);
		}

		curl_close($ch);
		return $contents;
	}


	/**
	 * 获取项目自定义域名
	 */
	public function get_domain($content) {
		// 匹配模板自定义属性:data-cubie-domain
		$pattern = '/<body(?:\s+.*data-cubie-domain\s*=\s*"([^"]*)".*)?>/i';
		preg_match($pattern, $content, $matches);

		$domain = $matches[1];

		// 非合法URL时返回空
		if (isLegalURL($domain)) {
			$domain = $this->format_domain($domain);
		} else {
			$domain = '';
		}

		return $domain;
	}

	/**
	 * 去除域名最后的斜杠
	 */
	private function format_domain($domain) {
		$domain = explode('://', $domain);
		$domain[1] .= '/';
		$domain[1] = substr($domain[1], 0, strpos($domain[1], '/'));
		$domain = implode('://', $domain);
		return $domain;
	}

	/**
	 * 获取域名信息
	 * @return {Array}
	 */
	private function parse_domain($domain) {
		$domain = strtolower($domain);
		$domain = explode('://', $domain);
		$domain[1] .= '/';
		$domain[1] = substr($domain[1], 0, strpos($domain[1], '/'));

		return array(
			'protocol' => $domain[0], // https
			'domain' => $domain[1], // www.tenpay.com
		);
	}

	/**
	 * 转换域名到ip
	 * @param {String} $domain eg: http://action.tenpay.com
	 * @return {String} http://10.128.5.170
	 * @ return 不存在域名配置时返回false, 支持DNS时也返回false, 只有在服务器策略不通且存在域名配置时才不返回false
	 */
	private function domain_to_ip($domain) {
		// 策略不支持DNS时才处理
		if (is_array($this->domain)) {
			$d = $this->format_domain($domain);
			$d = explode('://', $d);

			// action.tenpay.com -> 10.128.5.170, 配置不存在时不处理
			$d[1] = $this->domain[$d[1]];
			if (empty($d[1])) {
				return false;
			}

			return implode('://', $d);
		}

		return false;
	}

	/**
	 * 替换SSI的include指令
	 * @param {String} $content
	 * @param {String} $charset 内容编码
	 * @param {Boolean} $base 是否输出base
	 */
	public function replace_include_ssi($content, $charset = '', $base = false) {
		// 不存在data-cubie-domain时不处理,直接返回原有内容
		$domain = $this->get_domain($content);
		if (empty($domain)) {
			return $content;
		}

		// replace_include_ssi_callback不知道咋传多个参数,这里用私有变量吧
		$domain_info =  $this->parse_domain($domain);
		$ip_domain = $this->domain_to_ip($domain);
		$this->__ssi_config__ = array(
			'charset' => (strtoupper($charset) != 'UTF-8') ? 'GBK' : 'UTF-8',
			'dns' => !!$ip_domain,
			'pure_domain' => $domain_info['domain'],
			'domain' => $ip_domain ? $ip_domain : $domain,
		);

		// 匹配SSI指令
		$pattern = '/<!--#include\s+virtual\s*=\s*"([^"]+)"\s*-->/i';
		$new_content = preg_replace_callback($pattern, array(&$this, 'replace_include_ssi_callback'), $content);
		
		// base
		if ($base) {
			// 添加基准路径,防止内容图片链接等错误 <base href="http://www.w3school.com.cn/i/" />
			$pattern = '/^([\s\S]*<head(?:\s+[\s\S]*?)?>)([\s\S]*<\/head>[\s\S]*)$/i';
			// base紧跟<head>,防止模板自定义了base,这样子此处添加的base就不会生效了
			$new_content = preg_replace($pattern, '\\1' . chr(10) . '<base href="' . $domain . '" />\\2', $new_content);
		}

		unset($this->__ssi_config__);
		return $new_content;
	}

	// include指令替换回调
	private function replace_include_ssi_callback($matches) {
		$content = $this->do_get($this->__ssi_config__['domain'] . $matches[1],
				$this->__ssi_config__['dns'] ? $this->__ssi_config__['pure_domain'] : null);

		// 获取失败时返回空
		if (!$content) {
			$content = '';
		}

		// include文件内容跟随模版编码,由于项目是UTF8编码,这里只对GBK的模版做处理即可
		if ($this->__ssi_config__['charset'] == 'GBK') {
			$content = iconv('GBK', 'UTF-8//IGNORE', $content);
		}

		return $content;
	}

	/**
	 * 提取css内容,包含外链与块级样式,按顺序
	 */
	public function fetch_css($content) {
		$domain = $this->get_domain($content);
		$this->__fetch_css_domain__ = $domain;

		$result = array();

		// PREG_OFFSET_CAPTURE按字母出现顺序排序

		// 外链样式
		$pattern = '/<link\s+[^>]*type\s*=\s*"text\/css"[^>]*>/i'; // 先匹配所有type="text/css"的link元素
		preg_match_all($pattern, $content, $css_file, PREG_OFFSET_CAPTURE);

		$pattern = '/(<link\s+[^>]*href\s*=\s*")([^"]*)("[^>]*>)/i'; // 再匹配所有href="xxx"的地址
		foreach ($css_file[0] as $k => $v) {
			// 匹配href, 添加资源域名
			//   /res_action/public/css/action_v4_3.css -> http://action.tenpay.com/res_action/public/css/action_v4_3.css
			// $url = preg_replace($pattern, '\\1' . $domain . '\\2\\3', $v[0]);
			// $url = preg_replace($pattern, $domain . '\\2', $v[0]);
			$url = preg_replace_callback($pattern, array(&$this, 'fetch_css_callback'), $v[0]);

			$result[$v[1]] = $url;

			// 提取外链样式内容
			// $css = $this->do_get($url);

			// $result[$v[1]] = $css;
		}


		// 块级样式
		// [\s\S]*?的?表示懒惰模式,匹配到即停止,防止多个style匹配成一个的问题
		$pattern = '/(<style[^>]*(?:\s+type\s*=\s*"text\/css"[^>]*)?>)([\s\S]*?)(<\/style>)/i';
		preg_match_all($pattern, $content, $css_content, PREG_OFFSET_CAPTURE);

		foreach ($css_content[0] as $k => $v) {
			$result[$v[1]] = $v[0];
		}

		// 按键名排序,保证输出的样式顺序
		ksort($result);

		// 组合所有样式
		$css = '';
		foreach ($result as $k =>$v) {
			$css .= $v . chr(10);
		}

		unset($this->__fetch_css_domain__);
		return $css;
	}
	private function fetch_css_callback($matches) {
		// 判断href是否为合法的url格式,是的话则无需附加domain
		if (!isLegalURL($matches[2])) {
			// 若domain为空,则原样返回
			return $matches[1] . $this->__fetch_css_domain__ . $matches[2] . $matches[3];
		}

		return $matches[0];
	}


	// 替换样式文件内容,生成less文件
	// private function replace_to_less($css) {
	// 	// 替换html、body样式为.cubie-layout-body,控制命名空间,模拟真实页面样式
	// 	// TODO: {content:"a body a"} 还是会被替换

	// 	// 替换body
	// 	$pattern = '/([^a-zA-Z0-9_\-#\.\'\"]+)(body)([^a-zA-Z0-9_\-\'"]+)/i';
	// 	$tmp_css = preg_replace($pattern, '\\1.cubie-layout-body\\3', $css);

	// 	// 替换html
	// 	$pattern = '/([^a-zA-Z0-9_\-#\.\'\"]+)(html)([^a-zA-Z0-9_\-\'"]+)/i';
	// 	$tmp_css = preg_replace($pattern, '\\1.cubie-layout-body\\3', $tmp_css);

	// 	// 递归遍历,
	// 	// 为了兼容以下情况, 否则只有行1的body会被替换,因为首次匹配成功后,正则位移造成行2的body匹配失败
	// 	// 行1 : body, 
	// 	// 行2 : body > p {}
	// 	if ($tmp_css != $css) {
	// 		$tmp_css = $this->replace_to_less($tmp_css);
	// 	}

	// 	return $tmp_css;
	// }
}