<?php
$ac = @$_GET["ac"];
if ($ac == "model") {
	header("Content-Type: text/plain; charset=utf-8");

	// 调用create-wui-page.php
	echo("=== 处理前端页面\n");
	$content = $_POST["content"];
	$dir = __DIR__."/../server/web/page";
	$metafile = "$dir/meta.txt";
	chdir($dir);
	file_put_contents($metafile, $content);
	if (@$_POST["doMui"]) {
		putenv("mui=1"); // 同时生成移动端页面, 
	}
	if (@$_POST["doGitAdd"]) {
		putenv("doGitAdd=1"); // 添加到git
	}
	$argv = ["tool/index", "-"];
	include(__DIR__ . "/create-wui-page/create-wui-page.php");
	// 可用变量: $obj, $baseObj, $title, $meta

	// upgrade db
	echo("=== 升级数据库\n");
	putenv("P_METAFILE=$metafile");
	require_once('upgrade.php');
 	$h = new UpgHelper();
	$h->updateDB();

	// add backend code
	echo("=== 处理后端接口\n");
	$f = __DIR__."/../server/php/api_objects.php";
	$tag = "class AC2_{$baseObj} ";
	$str = file_get_contents($f);
	if (stripos($str, $tag) === false) {
		$code = <<<EOL

// TODO: add codes
class AC_{$baseObj} extends AccessControl
{
}
class AC2_{$baseObj} extends AccessControl
{
}
EOL;
		file_put_contents($f, $code, FILE_APPEND);
	}

	// add web menu
	echo("=== 处理管理端菜单\n");
	$f = __DIR__."/../server/web/store.html";
	$tag = "<a href=\"#page{$obj}\">";
	$str = file_get_contents($f);
	if (stripos($str, $tag) === false) {
		$n = 0;
		$str1 = preg_replace_callback('/<div class="menu-expandable">/', function ($ms) use ($obj, $title, &$n) {
			if (++$n != 2)
				return $ms[0];
			return $ms[0] . <<<EOL

<a href="#page{$obj}">{$title}管理</a>
EOL;
		}, $str);
		file_put_contents($f, $str1);
	}

	if (@$_POST["doMui"]) {
	// mobile link
	echo("=== 移动端页面:\n");
	echo("m2/index.html#". lcfirst($obj) ."\n");
	echo("m2/index.html#". lcfirst(getListName($obj)) ."\n");
	}

	exit();
}
?>
<style>
iframe {
	width: 98%;
	border: 1px solid #aaa;
	height: 300px;
}
</style>
<li><a href="../server/web/store.html" target="_blank">管理端</a></li>
<li><a href="../server/m2/index.html" target="_blank">移动端</a></li>

<li><a href="../server/tool/init.php" target="_blank">初始化/升级数据库</a></li>
<li>导入模型
<form action="?ac=model" method="POST" target="ifrResult" enc-type="text-plain">
<textarea name="content" wrap="off" rows=5 style="width:98%;">
@VendorExample: id, name, phone, idCard, picId
供应商: 编号, 姓名, 手机号, 身份证号, 身份证图
</textarea>
<button>生成</button>
<input type="checkbox" name="doMui" id="doMui" value="1" style="margin-left:20px"><label for="doMui">生成移动端页面</label>
<input type="checkbox" name="doGitAdd" id="doGitAdd" value="1" checked style="margin-left:20px"><label for="doGitAdd">添加到Git库</label>
<a href="create-wui-page/meta-example.txt" style="margin-left:20px" target="_blank">查看示例</a>
</form>

<div id="divResult">
	<h3>结果</h3>
	<iframe id="ifrResult" name="ifrResult"></iframe>
</div>
