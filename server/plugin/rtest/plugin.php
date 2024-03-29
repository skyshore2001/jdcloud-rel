<?php

function api_fn()
{
	$ret = null;
	$f = mparam("f");
	if ($f == "param") {
		$ret = param(mparam("name"), param("defVal"), param("coll"));
	}
	else if ($f == "mparam") {
		$ret = mparam(mparam("name"), param("coll"));
	}
	else if ($f == "queryAll") {
		$sql = mparam("sql", null, false);
		$assoc = param("assoc/b", false);
		$ret = queryAll($sql, $assoc);
	}
	else if ($f == "queryOne") {
		$sql = mparam("sql", null, false);
		$assoc = param("assoc/b", false);
		$ret = queryOne($sql, $assoc);	
	}
	else if ($f == "execOne") {
		$sql = mparam("sql", null, false);
		$getNewId = param("getNewId/b", false);
		$ret = execOne($sql, $getNewId);	
	}
	else
		jdRet(E_SERVER, "not implemented");
	return $ret;
}

function api_login()
{
	$uname = mparam("uname");
	$pwd = mparam("pwd");

	$sql = sprintf("SELECT id FROM User WHERE uname=%s", Q($uname));
	$id = queryOne($sql);
	if ($id === false)
		jdRet(E_AUTHFAIL, "bad uname or pwd");
	$_SESSION["uid"] = $id;
	return ["id" => $id];
}

function api_whoami()
{
	checkAuth(AUTH_USER);
	$uid = $_SESSION["uid"];
	return ["id"=> $uid];
}

function api_logout()
{
	session_destroy();
}

function api_hello()
{
	return [
		"id" => 100,
		"name" => "hello"
	];
}

class AC1_UserA extends AccessControl
{
	protected $table = "User";
	
	protected $vcolDefs = [
		[
			"res" => ["(SELECT COUNT(*) FROM ApiLog WHERE userId=t0.id) logCnt"],
			"default" => true
		],
		[
			"res" => ["(SELECT MAX(id) FROM ApiLog WHERE userId=t0.id) lastLogId"]
		],
		[
			"res" => ["null lastLogAc"],
			"require" => "lastLog"
		]
	];

	protected $subobj = [
		"log" => ["obj"=>"ApiLog", "cond"=>"userId=%d", "res"=>"id,tm,ac,addr", "default"=>false],
		"lastLog" => ["obj"=>"ApiLog", "cond"=>"id={lastLogId}", "res"=>"id,tm,ac,addr", "wantOne"=>true, "default"=>true]
	];

	protected function onInit() {
		$this->enumFields["lastLogAc"] = function ($val, $row) {
			return $row["lastLog"]["ac"];
		};
	}
}

class AC_ApiLog extends AccessControl
{
	protected $requiredFields = ["ac"];
	protected $readonlyFields = ["ac", "tm"];
	protected $hiddenFields = ["ua"];
	protected $useStrictReadonly = false;
	protected $vcolDefs = [
		[
			"res" => ["concat(y, '-', m) ym"],
			// 用isExt指定这是外部虚拟字段
			"isExt" => true,
			// 用require指定所有依赖的内层字段
			"require" => 'y,m'
		],
		[
			"res" => ["u.name userName"],
			"join" => "LEFT JOIN User u ON u.id=t0.userId",
			"default" => true
		]
	];

	protected function onValidate()
	{
		if ($this->ac == "add")
		{
			$_POST["tm"] = date(FMT_DT);
		}
	}

	public function api_hello()
	{
		return [
			"id" => 100,
			"name" => "hello"
		];
	}

	protected function onInit() {
		$this->vcolDefs[] = [ "res" => tmCols("t0.tm") ];
	}

	protected function onQuery() {
		$this->qsearch(["ac", "addr"], param("q"));
	}
}

class AC1_UserApiLog extends AC_ApiLog
{
	protected $table = "ApiLog";
	protected $defaultSort = "id DESC";
	protected $allowedAc = [ "get", "query", "add", "del" ];

	private $uid;

	protected function onInit()
	{
		parent::onInit();

		$this->uid = $_SESSION["uid"];

		$this->vcolDefs[] = [
			"res" => ["(SELECT group_concat(concat(id, ':', ac))
FROM (
SELECT id, ac
FROM ApiLog 
WHERE userId={$this->uid} ORDER BY id DESC LIMIT 3) t
) last3LogAc"]
		];

		$this->subobj = [
			"user" => [ "sql" => "SELECT u.id,u.name FROM User u INNER JOIN ApiLog log ON log.userId=u.id WHERE log.id=%d", "wantOne" => true ],
			//"user" => [ "sql" => "SELECT id,name FROM User u WHERE id={$this->uid}", "wantOne" => true, "force"=>true],
			"last3Log" => [ "sql" => "SELECT id,ac FROM ApiLog log WHERE userId={$this->uid} ORDER BY id DESC LIMIT 3" ],

			"user2" => ["obj"=>"User", "AC"=>"AC1_UserA", "cond"=>"id={userId}", "res"=>"id,name", "wantOne"=>true]
		];
	}

	protected function onValidate()
	{
		parent::onValidate();
		if ($this->ac == "add")
		{
			$_POST["userId"] = $this->uid;
		}
	}

	protected function onValidateId()
	{
		if ($this->ac == "del")
		{
			$id = mparam("id");
			$rv = queryOne("SELECT id FROM ApiLog WHERE id={$id} AND userId={$this->uid}");
			if ($rv === false)
				jdRet(E_FORBIDDEN, "not your log");
		}
	}

	protected function onQuery()
	{
		parent::onQuery();
		$this->addCond("userId=" . $this->uid);
	}

	public function api_listByAc()
	{
		$ac = mparam("ac");
		$param = $_GET + [
			"fmt" => "list",
			"cond" => "ac=" . Q($ac)
		];
		return callSvcInt("UserApiLog.query", $param);
	}
}

