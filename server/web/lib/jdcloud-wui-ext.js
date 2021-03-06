/**
@module JdcloudExt

框架扩展功能或常用函数.
 */

JdcloudExt.call(window.WUI || window.MUI);
function JdcloudExt()
{
var self = this;

/**
@key .wui-upload

对话框上的上传文件组件。

用于在对象详情对话框中，展示关联图片字段。图片可以为单张或多张。
除显示图片外，也可以展示其它用户上传的文件，如视频、文本等。

预览图样式在style.css中由 `.wui-upload img`定义。
点击一张预览图，如果有jqPhotoSwipe插件，则全屏显示图片且可左右切换；否则在新窗口打开大图。

示例：只需要标注wui-upload类及指定data-options，即可实现图片预览、上传等操作。

	<table>
		<tr>
			<td>上传多图</td>
			<td class="wui-upload">
				<input name="pics">
			</td>
		</tr>
		<tr>
			<td>上传单图</td>
			<td class="wui-upload" data-options="multiple:false">
				<input name="picId">
			</td>
		</tr>
		<tr>
			<td>上传附件</td>
			<td class="wui-upload" data-options="pic:false,fname:'attName'"> <!-- v5.5: 显示使用虚拟字段attName,须后端提供,也可以用 fname=1将显示内容保存到atts字段 -->
				<input name="atts">
			</td>
		</tr>
		<tr>
			<td>上传单个附件</td>
			<td class="wui-upload" data-options="multiple:false,pic:false,fname:'attName'">
				<input name="attId">
			</td>
		</tr>
	</table>

- 带name组件的input绑定到后端字段，并被自动隐藏。允许有多个带name的input组件，仅第一个input被处理。
- options中可以设置：{ nothumb, pic, fname  }

组件会自动添加预览区及文件选择框等，完整的DOM大体如下：

	<div class="wui-upload">
		<input name="atts">
		<div class="imgs"></div>
		<input type="file" multiple>
		<p class="hint"><a href="javascript:;" class="btnEditAtts">编辑</a></p>
	</div>

其中imgs为预览区，内部DOM结构为 `.imgs - a标签 - img或p标签`。
在上传图片或文件后，会在imgs下创建`<a>`标签，对于图片a标签里面是img标签，否则是p标签。
a标签上数据如下：

- attr("attId")为当前图片的缩略图编号，如"100"。如果无该属性，表示尚未上传。
- attr("att")为当前预览图的原始数据。在opt.fname=1时包含文件名，如"100:file1.pdf"。
- prop("fileObj_") 当上传无缩略图图片(opt.nothumb=1)或上传附件(opt.pic=false)时，fileObj_中保存了文件对象，用于之后上传。

在a下的img标签上，有以下数据：

- attr("picId")保存图片缩略图ID。如果无该属性，表示尚未上传。
- prop("picData_")保存图片压缩信息。仅当新选择的图片才有。

@param opt.multiple=true 设置false限制只能选一张图。

@param opt.nothumb=false 设置为true表示不生成缩略图，且不做压缩（除非指定maxSize参数，这时不生成缩略图，但仍然压缩）。

	<td class="wui-upload" data-options="nothumb:true">...</td>

@param opt.pic=true 设置为false，用于上传视频或其它非图片文件

如果为false, 在.imgs区域内显示文件名链接而非图片。

@param opt.fname 是否显示文件名。默认为0。目前不用于图片，只用于附件（即pic=false时有效）。

(v5.5) 

- 当值为0时，字段只保存文件编号或编号列表，如"100", "100,101"。
- 当值为1时，字段保存文件编号及文件名（可当备注使用），如"100:合同.docx", "100:合同.docx,101:合同附件.xlsx"
- 还可以指定一个虚拟字段名，表示字段虽然只保存编号，但显示时可使用指定的虚拟字段，且其格式与fname=1时相同。这样看到的效果与fname=1类似。

示例：用attId字段保存单个附件，并显示附件名

由于attId是数值字段，不可存额外字符串信息，所以不能设置fname=1。
这时在后端做一个虚拟字段如attName，格式为"{attId}:{fileName}":

		protected $vcolDefs = [
			[
				"res" => ["concat(att.id,':',att.orgName) attName"],
				"join" => "LEFT JOIN Attachment att ON att.id=t0.attId",
				"default" => true
			]
			...
		];

列表页中展示使用虚拟字段attName而非attId：

			<th data-options="field:'attName', formatter:Formatter.atts">模板文件</th>

在详情对话框中指定fname为虚拟字段"att"：

			<td>模板文件</td>
			<td class="wui-upload" data-options="multiple:false,pic:false,fname:'attName'">
				<input name="attId">
			</td>

示例：用atts存多个附件。

这时，可设置fname=1，即把文件名也存到atts字段。
也可以设置fname='attName'(虚拟字段)，其格式为"{attId}:{filename},{attId2}:{filename2}"，后端实现参考如下(使用find_in_set)：

			[
				"res" => ["(SELECT group_concat(concat(att.id,':',att.orgName)) FROM Attachment att WHERE find_in_set(id, t0.atts)) attName"],
				"default" => true
			]

@param opt.manual=false 是否自动上传提交

默认无须代码即可自动上传文件。如果想要手工操控，可以触发submit事件，
示例：在dialog的validate事件中先确认提示再上传，而不是直接上传：

HTML:

	<div class="wui-upload" data-options="manual:true">...</div>

JS:

	jdlg.on("validate", onValidate);
	function onValidate(ev)
	{
		var dfd = $.Deferred();
		app_alert("确认上传?", "q", function () {
			var dfd1 = WUI.triggerAsync(jdlg.find(".wui-upload"), "submit");
			dfd1.then(doNext);
		});
		// dialog的validate方法支持异步，故设置ev.dfds数组来告知调用者等异步操作结束再继续
		ev.dfds.push(dfd.promise());

		function doNext() {
			dfd.resolve();
		}
	}

## 右键菜单

@param opt.menu 设置右键菜单

在预览区右键单击会出现菜单，默认有“删除”菜单。
示例：商品可以上传多张照片，其中选择一张作为商品头像。
我们在右键中添加一个“设置为缺省头像”菜单，点击后将该图片圈出，将其图片编号保存到字段中。
数据结构为：

	@Item: id, picId, pics

上面表Item中，picId为头像的图片ID，pics为逗号分隔的图片列表。

HTML: 在data-options中指定菜单的ID和显示文字。缺省头像将添加"active"类：

	<style>
	.wui-upload img.active {
		border: 5px solid red;
	}
	</style>

	<tr>
		<td>门店照片</td>
		<td class="wui-upload" data-options="menu:{mnuSetDefault:'设置为缺省头像'}">
			<input name="pics">
			<input type="input" style="display:none" name="picId">
		</td>
	</tr>

在右键点击菜单时，wui-upload组件会触发onMenu事件，其中参数item为当前预览项（.imgs区域下的a标签，在它下面才是img或p标签）

	// 在initDlgXXX中：
	jdlg.on("menu", onMenu);
	function onMenu(ev, menuId, item)
	{
		if (menuId == "mnuSetDefault") {
			var ja = $(item);
			if (ja.attr("attId")) {
				ja.closest(".wui-upload").find("img").removeClass("active");
				var jimg = ja.find("img");
				jimg.addClass("active");

				frm = jdlg.find("form")[0];
				frm.picId.value = jimg.attr("picId");
			}
		}
	}
	// 高亮显示选中的头像picId。
	// 注意：要用jdlg而不是jfrm的show事件。否则wui-upload尚未初始化完成
	jdlg.on("show", function (ev, formMode, initData) {
		if (initData && initData.picId) {
			jdlg.find(".wui-upload img[picId=" + initData.picId + "]").addClass("active");
		}
	});
	
## 音频等文件上传

@param opt.accept 指定可上传的文件类型

示例：上传单个音频文件，如m4a, mp3等格式。

	<td>文件</td>
	<td class="wui-upload" data-options="multiple:false,pic:false,accept:'audio/*'">
		<input name="attId">
		<p class="hint">要求格式m4a,mp3,wav; 采样率为16000</p>
	</td>

## 压缩参数

@param opt.maxSize?=1280 指定压缩后图片的最大长或宽
@param opt.quality?=0.8 指定压缩质量, 一般不用修改.

示例：默认1280像素不够, 增加到2000像素:

	<tr>
		<td>图片</td>
		<td class="wui-upload" data-options="maxSize:2000">
			<input name="pics">
		</td>
	</tr>

## 动态设置选项

示例：在dialog的beforeshow事件回调中，根据情况设置upload组件的选项，如是否压缩图片：

	// function initDlgXXX
	//
	jdlg.on("beforeshow", onBeforeShow);
	
	function onBeforeShow(ev, formMode, opt) 
	{
		var objParam = opt.objParam;
		var jo = jpage.find(".picId");
		// 获取和动态设置选项：
		var uploadOpt = WUI.getOptions(jo);
		uploadOpt.nothumb = (objParam.type === "A");
	}

 ## 定制上传接口

 - opt.onGetQueryParam: Function() -> {ac?, ...} 定义上传接口名和接口参数。
 - opt.onGetData: Function(ret)  处理接口返回结果ret。

 示例：调用`upload1(resource, version) -> [{id, ..., url}]` 接口。
 该接口扩展了默认的upload接口，需要传入resource等参数，返回的url字段需要设置到form相应字段上。

    // function initDlgVersion
 	var jo = jdlg.find(".uploadFile");
	var uploadOpt = WUI.getOptions(jo);
	uploadOpt.onGetQueryParam = function () {
		return {
			ac: "upload1",
			resource: $(frm.resourceId).val(),
			version: $(frm.name).val()
		}
	}
	uploadOpt.onGetData = function (ret) {
		var resUrl = ret[0].url;
		$(frm.url).val(resUrl);
	}

 */
self.m_enhanceFn[".wui-upload"] = enhanceUpload;

function enhanceUpload(jupload)
{
	var jdlg = jupload.closest(".wui-dialog");
	if (jdlg.size() == 0)
		return;

	var defOpt = {
		multiple: true,
		pic: true,
		manual: false,
		fname: 0
	};
	var opt = WUI.getOptions(jupload, defOpt);

	var jname = jupload.find("input[name]:first");
	var jimgs = $('<div class="imgs"></div>');
	var jfile = $('<input type="file">');
	var jedit = $('<p class="hint"><a href="javascript:;" class="btnEditAtts">编辑文本</a> 右键删除</p>');
	jname.after(jimgs, jfile, jedit);

	jupload.css("white-space", "normal");
	jupload.find(".btnEditAtts").click(function () {
		jname.toggle();
	});

	jfile.prop("multiple", opt.multiple);

	if (opt.accept) {
		jfile.attr("accept", opt.accept);
	}
	else if (opt.pic) {
		jfile.attr("accept", "image/*");
	}
	jfile.change(onChooseFile);

	// 右键菜单
	var jmenu = $('<div><div id="mnuDelPic">删除</div></div>');
	if (opt.menu && $.isPlainObject(opt.menu)) {
		$.each(opt.menu, function (k, v) {
			$("<div>").attr("id", k).html(v).appendTo(jmenu);
		});
	}

	var curSel;
	jmenu.menu({
		onClick: function (mnuItem) {
			var mnuId = mnuItem.id;
			jupload.trigger("menu", [mnuId, curSel]);
			switch (mnuItem.id) {
			case "mnuDelPic":
				$(curSel).remove();
				break;
			}
		}
	});
	// a下面有：img-预览图, p-文件名
	jupload.on("contextmenu", ".imgs>a", function (ev) {
		ev.preventDefault();
		jmenu.menu('show', {left: ev.pageX, top: ev.pageY});
		curSel = this;
	});

	jupload.on("submit", onSubmit);

	jdlg.on("show", onShow);
	if (!opt.manual)
		jdlg.on("validate", onValidate);

	function onShow(ev, formMode, initData) {
		jname.hide();
		var val = null;
		if (opt.fname == 0 || opt.fname == 1) {
			val = jupload.find("input[name]:first").val();
		}
		else {
			val = initData && initData[opt.fname];
		}
		var sep = DEFAULT_SEP;
		var arr = val? val.split(sep) : [];
		arrayToImg(jupload, arr);
	}

	function onValidate(ev, mode, oriData, newData) {
		if (mode != FormMode.forAdd && mode != FormMode.forSet)
			return;
		onSubmit(ev);
	}

	function onSubmit(ev) {
		var dfd = imgToHidden(jupload);
		if (ev.dfds && $.isArray(ev.dfds) && dfd && dfd.then)
			ev.dfds.push(dfd);
	}
}

function arrayToImg(jp, arr)
{
	var opt = WUI.getOptions(jp);
	var jImgContainer = jp.find("div.imgs");
	jImgContainer.empty();
	jImgContainer.addClass("my-reset"); // 用于在 查找/添加 模式时清除内容.
	
	$.each (arr, function (i, att) {
		if (!att)
			return;
		var attId,text;
		if (att.indexOf(':') > 0) {
			var arr1 = att.split(':');
			attId = arr1[0];
			text = arr1[1];
		}
		else {
			attId = text = att;
		}
		if (attId == "")
			return;
		var url = WUI.makeUrl("att", {id: attId});
		var linkUrl = (opt.nothumb||!opt.pic) ? url: WUI.makeUrl("att", {thumbId: attId});
		var ja = $('<a target="_blank">').attr({
			"href": linkUrl,
			"att": att,
			"attId": attId
		}).appendTo(jImgContainer);
		if (opt.pic) {
			$("<img>").attr({
					'src': url,
					'picId':attId
				})
				.appendTo(ja);
		}
		else {
			createFilePreview(ja, text);
		}
	});
	// 图片浏览器升级显示
	if (opt.pic && jQuery.fn.jqPhotoSwipe)
		jImgContainer.jqPhotoSwipe({selector:"a"});
}

// 创建<p>标签显示文件名，添加到<a>标签上。<p>标签内有"删除"按钮
function createFilePreview(ja, text)
{
	var jp = $("<p>").text(text).css("margin", "0").appendTo(ja);
	var jx = $("<span style='color:#aaa; margin-left:8px'>[删除]</span>").appendTo(jp);
	jx.click(function () {
		$(this).closest("a").remove();
		return false;
	});
	return jp;
}

/*
@fn imgToHidden(jp, sep?=",")

用于在对象详情对话框中，展示关联图片字段。图片可以为单张或多张。

如果有文件需要上传, 调用upload接口保存新增加的图片。使用异步上传，返回Deferred对象给dialog的validate事件处理函数。
可显示文件上传进度条。

*/
function imgToHidden(jp, sep)
{
	if (sep == null)
		sep = DEFAULT_SEP;
	var val = [];
	jp.find("div.imgs").addClass("my-reset"); // 用于在 查找/添加 模式时清除内容.

	var dfd;
	var ajaxOpt = {
		onUploadProgress: function (e) {
			if (e.lengthComputable) {
				var value = e.loaded / e.total * 100;
				console.log("upload " + value + "% " + (e.loaded/1024).toFixed(1) + "KB/" + (e.total/1024).toFixed(1) + "KB");
				WUI.app_progress(value);
			}
		},
		xhr: function () {
			var xhr = $.ajaxSettings.xhr();
			if (xhr.upload) {
				xhr.upload.addEventListener('progress', this.onUploadProgress, false);
			}
			return xhr;
		}
	};
	var opt = WUI.getOptions(jp);
	if (opt.pic && !opt.nothumb) {
		var fd = new FormData();
		var imgArr = [];
		jp.find("img").each(function (i, e) {
			// e.g. "data:image/jpeg;base64,..."
			if (this.picData_ != null) {
				imgArr.push(this);
				fd.append("file" + imgArr.length, this.picData_.blob, this.picData_.name);
			}
			else {
				var picId = $(this).attr("picId");
				if (picId)
					val.push(picId);
			}
		});
		if (imgArr.length > 0) {
			var params = {genThumb: 1, autoResize: 0};
			dfd = callUpload(params, fd, function (data) {
				$.each(data, function (i, e) {
					val.push(e.thumbId);
					$(imgArr[i]).attr("picId", e.thumbId);
					imgArr[i].picData_ = null;
				});
			});
		}
	}
	else {
		var files = [];
		jp.find(".imgs a").each(function() {
			var att = $(this).attr(opt.fname==1? 'att': 'attId'); //=1时保存文件名到字段中。
			if (att)
				val.push(att);
			if (this.fileObj_)
				files.push(this.fileObj_);
		});
		if (files.length > 0) {
			var fd = new FormData();
			$.each(files, function (i, e) {
				fd.append('file' + (i+1), e);
			});
			var params = {autoResize: 0};
			dfd = callUpload(params, fd, function (data) {
				$.each(data, function (i, e) {
					var att = e.id;
					if (opt.fname == 1) {
						att += ":" + e.orgName.replace(/[:,]/g, '_'); // 去除文件名中特殊符号
					}
					val.push(att);
				});
			});
		}
	}
	if (dfd) {
		dfd.then(done);
		return dfd;
	}
	else {
		done();
	}

	function callUpload(params, fd, api_upload) {
		var ac = 'upload';
		if (opt.onGetQueryParam) {
			params = opt.onGetQueryParam();
			if (params.ac) {
				ac = params.ac;
				delete params.ac;
			}
		}
		var dfd = callSvr(ac, params, function (data) {
			api_upload && api_upload.call(this, data);
			opt.onGetData && opt.onGetData(data);
		}, fd, ajaxOpt);
		return dfd;
	}

	function done() {
		jp.find("input:hidden:first").val( val.join(sep));
	}
}

/*
@fn onChooseFile()

与hiddenToImg/imgToHidden合用，在对话框上显示一个图片字段。
在文件输入框中，选中一个文件后，调用此方法，可将图片压缩后显示到指定的img标签中(div.imgs)。

使用WUI.compressImg组件进行图片压缩，最大宽高不超过1280px。然后以base64字串方式将图片显示到一个img组件中。

TODO: 添加图片压缩参数，图片框显示大小等。

*/
function onChooseFile(ev)
{
	var jp = $(this).closest(".wui-upload");
	var jdiv = jp.find("div.imgs");
	var opt = WUI.getOptions(jp);
	if (!opt.multiple) {
		jdiv.empty();
	}
	if (!opt.pic) { // 显示附件
		$.each(this.files, function (i, fileObj) {
			console.log(fileObj);
			var ja = $('<a target="_blank">').appendTo(jdiv);
			ja.prop('fileObj_', fileObj);
			createFilePreview(ja, fileObj.name);
		});
		this.value = "";
		return;
	}

	var picFiles = this.files;
	var compress = ! (opt.nothumb && opt.maxSize === undefined);

	$.each(picFiles, function (i, fileObj) {
		if (compress) {
			var compressOpt = {quality: opt.quality||0.8, maxSize: opt.maxSize||1280};
			WUI.compressImg(fileObj, function (picData) {
				var jimg;
				if (! opt.multiple) {
					jimg = jdiv.find("img:first");
					if (jimg.size() == 0) {
						jimg = null;
					}
				}
				if (jimg == null) {
					jimg = $("<img>");
				}
				jimg.attr("src", picData.b64src)
					.prop("picData_", picData);
				addNewItem(jimg);
			}, compressOpt);
		}
		else {
			var windowURL = window.URL || window.webkitURL;
			var dataURL = windowURL.createObjectURL(fileObj);
			var jimg = $("<img>");
			jimg.attr('src', dataURL);
			var ja = addNewItem(jimg);
			ja.prop("fileObj_", fileObj);
		}
	});
	this.value = "";

	function addNewItem(ji) {
		var ja = $('<a target="_blank">');
		ja.append(ji).appendTo(jdiv);
		ja.attr("href", ji.attr("src"));
		/*
		if (ja.jqPhotoSwipe)
			ja.jqPhotoSwipe();
		*/
		return ja;
	}
}

/**
@key .wui-checkList

用于在对象详情对话框中，以一组复选框(checkbox)来对应一个逗号分隔式列表的字段。
例如对象Employee中有一个“权限列表”字段perms定义如下：

	perms:: List(perm)。权限列表，可用值为: item-上架商户管理权限, emp-普通员工权限, mgr-经理权限。

现在以一组checkbox来在表达perms字段，希望字段中有几项就将相应的checkbox选中，例如值"emp,mgr"表示同时具有emp与mgr权限，显示时应选中这两项。
定义HTML如下：

	<tr>
		<td>权限</td>
		<td class="wui-checkList">
			<input type="hidden" name="perms">
			<label><input type="checkbox" value="emp" checked>员工(默认)</label><br>
			<label><input type="checkbox" value="item">上架商品管理</label><br>
			<label><input type="checkbox" value="mgr">经理</label><br>
		</td>
	</tr>

wui-checkList块中包含一个hidden对象和一组checkbox. hidden对象的name设置为字段名, 每个checkbox的value字段设置为每一项的内部名字。
 */ 
self.m_enhanceFn[".wui-checkList"] = enhanceCheckList;

function enhanceCheckList(jp)
{
	var jdlg = jp.closest(".wui-dialog");
	if (jdlg.size() == 0)
		return;

	var defOpt = {
		sep: ','
	};
	var opt = WUI.getOptions(jp, defOpt);
	var dfd = $.Deferred();
	if (opt.url) {
		var url = opt.url;
		self.assert(opt.valueField && opt.textField, "wui-checkList: 使用url选项，必须设置valueField和textField选项");
		if (m_dataCache[url] === undefined) {
			self.callSvr(url, onLoadOptions);
		}
		else {
			onLoadOptions(m_dataCache[url]);
		}
	}
	else {
		dfd.resolve();
	}
	function onLoadOptions(data) {
		m_dataCache[url] = data;
		applyData(data);
	}
	function applyData(data) {
		var ls = WUI.rs2Array(data);
		$.each(ls, function (i, e) {
			$('<div><label><input type="checkbox" value="' + e[opt.valueField] + '">' + e[opt.textField] + '</label></div>').appendTo(jp);
		});
		dfd.resolve();
	}

	jdlg.on("show", onShow)
		.on("validate", onValidate);

	function onShow(ev) {
		dfd.then(function () {
			hiddenToCheckbox(jp);
		});
	}

	function onValidate(ev, mode, oriData, newData) {
		checkboxToHidden(jp);
	}
}

/*
@fn checkboxToHidden(jp, sep?=',')

@param jp  jquery结点
@param sep?=','  分隔符，默认为逗号
*/
function checkboxToHidden(jp, sep)
{
	if (sep == null)
		sep = DEFAULT_SEP;
	var val = [];
	jp.find(":checkbox").each (function () {
		if (this.checked) {
			val.push(this.value);
		}
	});
	jp.find("input:hidden:first").val(val.join(sep));
}

/*
@fn hiddenToCheckbox(jp, sep?=",")

@param jp  jquery结点
@param sep?=','  分隔符，默认为逗号
*/
function hiddenToCheckbox(jp, sep)
{
	if (sep == null)
		sep = DEFAULT_SEP;
	var val = jp.find("input:hidden:first").val().split(sep);
	jp.find(":checkbox").each (function () {
		this.checked = val.indexOf(this.value) !== -1;
	});
}

/**
@key .wui-labels

标签字段（labels）是空白分隔的一组词，每个词是一个标签（label）。
可以在字段下方将常用标签列出供用户选择，点一下标签则添加到文本框中，再点一下删除它。

	<tr>
		<td>标签</td>
		<td class="wui-labels">
			<input name="label" >
			<p class="hint">企业类型：<span class="labels" dfd="StoreDialog.dfdLabel"></span></p>
			<p class="hint">行业标签：<span class="labels">IT 金融 工业</span></p>
			<p class="hint">位置标签：<span class="labels">一期 二期 三期 四期</span></p>
		</td>
	</tr>

示例2：设置配置项，并配以说明和示例

	<tr>
		<td>配置项名称</td>
		<td class="wui-labels">
			<input name="name" class="easyui-validatebox" data-options="required:true">
			<div class="hint">可选项和示例值：
				<p class="easyui-tooltip" title="在移动端提交缺陷问题时，可从下拉列表中选择问题类型，就是在此处配置的，多个值以英文分号分隔。"><span class="labels">常见问题</span> 内饰;轮胎</p>
				<p class="easyui-tooltip" title="多个值以英文空格分隔"><span class="labels">集市品类</span> 办公用品 书籍 卡票券</p>
				<p class="easyui-tooltip" title="格式为`姓名,电话`"><span class="labels">会议室预订联系人</span> Candy,13917091068</p>
			</div>
		</td>
	</tr>

- 最终操作的文本字段是.wui-labels下带name属性的输入框。
- 在.labels中的文本将被按空白切换，优化显示成一个个标签，可以点击。
- 支持异步获取，比如要调用接口获取内容，可以指定`dfd`属性是一个Deferred对象。
- 添加的标签具有`labelMark`类(label太常用，没有用它以免冲突)，默认已设置样式。

异步获取示例：

	var StoreDialog = {
		dfdLabel: $.Deferred()
	}
	callSvr("Conf.query", {cond: "name='企业分类'", fmt: "one", res: "value"}, function (data) {
		StoreDialog.dfdLabel.resolve(data.value);
	})

// TODO: 支持beforeShow时更新
 */ 
self.m_enhanceFn[".wui-labels"] = enhanceLabels;

function enhanceLabels(jp)
{
	var jdlg = jp.closest(".wui-dialog");
	if (jdlg.size() == 0)
		return;

	var doInit = true;
	jdlg.on("beforeshow", onBeforeShow);

	function onBeforeShow() {
		if (! doInit)
			return;
		doInit = false;

		jp.on("click", ".labelMark", function () {
			var label = $(this).text();
			var o = jp.find(":input[name]")[0];
			var str = o.value;
			if (str.indexOf(label) < 0) {
				if (str.length == 0)
					str = label;
				else
					str += ' ' + label;
			}
			else {
				str = str.replace(/\s*(\S+)/g, function (m, m1) {
					if (m1 == label)
						return "";
					return m;
				});
			}
			o.value = str;
		});

		showLabel();
	}

	function showLabel() {
		jp.find(".labels").each(function () {
			var jo = $(this);
			var prop = jo.attr("dfd");
			if (prop) {
				var rv = WUI.evalAttr(jo, "dfd");
				WUI.assert(rv.then, "Property `dfd' MUST be a Deferred object: " + prop);
				rv.then(function (text) {
					handleLabel(jo, text);
				})
			}
			else {
				handleLabel(jo, jo.html());
			}
		});
	}

	function handleLabel(jo, s) {
		if (s && s.indexOf("span") < 0) {
			var spanHtml = s.split(/\s+/).map(function (e) {
				return '<span class="labelMark">' + e + '</span>';
			}).join(' ');
			jo.html(spanHtml);
		}
	}
}

/**
@key #menu

管理端功能菜单，以"menu"作为id:

	<div id="menu">
		<div class="menu-expand-group">
			<a class="expanded"><span><i class="fa fa-pencil-square-o"></i>主数据管理</span></a>
			<div class="menu-expandable">
				<a href="#pageCustomer">客户管理</a>
				<a href="#pageStore">门店管理</a>
				<a href="#pageVendor">供应商管理</a>
			</div>
		</div>
		<!-- 单独的菜单项示例 -->
		<a href="javascript:WUI.showDlg('#dlgImport',{modal:false})"><span><i class="fa fa-pencil-square-o"></i>批量导入</span></a>
		<a href="javascript:showDlgChpwd()"><span><i class="fa fa-user-times"></i>修改密码</span></a>
	</div>

菜单组由menu-expand-group标识，第一个a为菜单组标题，可加"expanded"类使其默认展开。
图标使用font awesome库，由`<i class="fa fa-xxx"></i>`指定，图标查询可参考 http://www.fontawesome.com.cn/faicons/ 或 https://fontawesome.com/icons

 */
function enhanceMenu()
{
	var jo = $('#menu');

	jo.find("a").addClass("my-menu-item");
	jo.find(".menu-expandable").hide();
	jo.find(".menu-expand-group").each(function () {
		$(this).find("a:first")
			.addClass("menu-item-head")
			.click(menu_onexpand)
			.append('<i class="fa fa-angle-down" aria-hidden="true"></i>')
			.each(function () {
				if ($(this).hasClass("expanded")) {
					$(this).removeClass("expanded");
					menu_onexpand.call(this);
				}
			});
	});
	// set active
	jo[0].addEventListener("click", function (ev) {
		if (ev.target.tagName != "A" || !$(ev.target).is(".my-menu-item:not(.menu-item-head)")<0)
			return;
		jo.find(".my-menu-item").removeClass("active");
		$(ev.target).addClass("active");
	}, true);

	// add event handler to menu items
	function menu_onexpand(ev) {
		$(this).toggleClass('expanded');
		var show = $(this).hasClass('expanded');
		var $expandContainer = $(this).next();
		$expandContainer.toggle(show);
	}
}
$(enhanceMenu);

/**
@key .wui-combogrid

可搜索的下拉列表。
示例：在dialog上，填写门店字段（填写Id，显示名字），从门店列表中选择一个门店。

	<form my-obj="Task" title="安装任务" wui-script="dlgTask.js" my-initfn="initDlgTask">
		<tr>
			<td>门店</td>
			<td>
				<input class="wui-combogrid" name="storeId" data-options="ListOptions.StoreGrid">
			</td>
		</tr>
	</form>

选项定义如下：

	ListOptions.StoreGrid = {
		jd_vField: "storeName",
		panelWidth: 450,
		width: '95%',
		textField: "name",
		columns: [[
			{field:'id',title:'编号',width:80},
			{field:'name',title:'名称',width:120}
		]],
		url: WUI.makeUrl('Store.query', {
			res: 'id,name',
		})
	};

属性请参考easyui-combogrid相关属性。wui-combogrid扩展属性如下:

- jd_vField: 显示文本对应的虚拟字段, 用于初始显示和查询。
- jd_showId: 默认为true. 显示"idField - textField"格式. 设置为false时只显示textField.

在选择一行并返回时，它会触发choose事件：

	var jo = jdlg.find("[comboname=storeId]"); // 注意不是 "[name=storeId]"（原始的input已经变成一个hidden组件，只存储值）
	jo.on("choose", function (ev, row) {
		console.log('choose row: ', row);
		...
	});

在输入时，它会自动以url及参数q向后端发起查询，如`callSvr("Store.query", {res:'id,name', q='1'})`.
在筋斗云后端须支持相应对象的模糊查询(请查阅文档qsearch)。

特别逻辑：

- 在初始化时，由于尚未从后端查询文本，这时显示jd_vField字段的文本。
- 如果输入值不在列表中，且不是数字，将当作非法输入被清空。
- 特别地，在查询模式下（forFind），可以输入任意条件，比如">10", "1-10"等。如果输入的是文本，比如"上海*"，则自动以jd_vField字段进行而非数值编号进行查询。

示例2：简单的情况，选择时只用名字，不用id。

	// var ListOptions 定义中：
	// 只用name不用id
	CateGrid: {
		jd_vField: "category",
		jd_showId: false,
		panelWidth: 450,
		width: '95%',
		idField: "name",
		textField: "name",
		columns: [[
			{field:'name',title:'类别',width:120},
			{field:'fatherName',title:'父类别',width:120},
		]],
		url: WUI.makeUrl('Category.query', {
			res: 'id,name,fatherName'
		})
	}

在dialog中：

		<input class="wui-combogrid" name="category" data-options="ListOptions.CateGrid">

设置方法：

- idField和textField一样，都用name;
- jd_showId指定为false即不显示idField;

## markRefresh 标记下次打开时刷新列表

(v5.5) 与my-combobox类似，组件会在其它页面更新对象后自动刷新列表。
外部想要刷新组件列表，可以触发markRefresh事件：

	jo.trigger("markRefresh", obj); // obj是可选的，若指定则仅当obj匹配组件对应obj时才会刷新。

 */
self.m_enhanceFn[".wui-combogrid"] = enhanceCombogrid;
function enhanceCombogrid(jo)
{
	var opt1 = WUI.getOptions(jo);
	jo.removeAttr("data-options"); // 避免被easyui错误解析
	var jdlg;
	var $dg;
	var doInit = true;

	var opt = $.extend({}, $.fn.datagrid.defaults, {
		delay: 500,
		idField: "id",
		textField: "name",
		jd_showId: true,
		mode: 'remote',
		// 首次打开面板时加载url
		onShowPanel: function () {
			if (doInit && opt1.url) {
				doInit = false;
				$dg.datagrid("options").url = opt1.url;
				$dg.datagrid("reload");
			}
		},
		// 值val必须为数值(因为值对应id字段)才合法, 否则将清空val和text
		onHidePanel: function () {
			var val = jo.combogrid("getValue");
			if (! val)
				return;
			if (jdlg.size() > 0 && jdlg.jdata().mode == FormMode.forFind) {
				if (vfield && /[^\d><=!,-]/.test(val) ) {
					jo.prop("nameForFind", vfield);
				}
				return;
			}
			jo.removeProp("nameForFind");

			var isId = (opt.idField == "id");
//			var val1 = jo.combogrid("textbox").val();
			if (isId && ! $.isNumeric(val)) {
				jo.combogrid("setValue", "");
			}
			else if (opt.jd_showId) {
				var txt = jo.combogrid("getText");
				if (! /^\d+ - /.test(txt)) {
					jo.combogrid("setText", val + " - " + txt);
				}
			}
			var row = $dg.datagrid("getSelected");
			if (row)
				jo.trigger("choose", [row]);
		},
		// !!! TODO: 解决combogrid 1.4.2的bug. 1.5.2以上已修复, 应移除。
		onLoadSuccess: function () {
			$dg && $.fn.datagrid.defaults.onLoadSuccess.apply($dg[0], arguments);
		}
	}, opt1);

	var vfield = opt.jd_vField;
	var showId = opt.jd_showId;

	// 创建后再指定，这样初始化时不调用接口
	opt.url = null;
	jo.combogrid(opt);
	$dg = jo.combogrid("grid");
// 	if (url) {
// 		$dg.datagrid("options").url = url;
// 	}

/*
	jo.combogrid("textbox").blur(function (ev) {
		var val1 = this.value;
	});
	*/

	jdlg = jo.closest(".wui-dialog");
	if (jdlg.size() == 0)
		return;

	jdlg.on("beforeshow", onBeforeShow);
	jo.on("markRefresh", markRefresh);

	function onBeforeShow(ev, formMode, opt) {
		if (vfield && opt.data && opt.data[vfield]) {
			setTimeout(function () {
				// onShow
				var val = jo.combogrid("getValue");
				if (val != "") {
					var txt = opt.data[vfield];
					if (showId) {
						var prefix = val + " - ";
						if (!txt.startsWith(prefix))
							txt = prefix + txt;
					}
					jo.combogrid("setText", txt);
				}
			});
			// nameForFind用于find模式下指定字段名，从而可以按名字来查询。Add/set模式下应清除。
			jo.removeProp("nameForFind");
		}
	}

	function markRefresh(ev, obj)
	{
		var url = WUI.getOptions(jo).url;
		if (url == null)
			return;
		if (obj) {
			var ac = obj + ".query";
			if (url.action != ac)
				return;
		}
		doInit = true;
	}
}

/**
@key .combo-f

支持基于easyui-combo的表单扩展控件，如 combogrid/datebox/datetimebox等, 在使用WUI.getFormData时可以获取到控件值.

示例：可以在对话框或页面上使用日期/日期时间选择控件：

	<input type="text" name="startDt" class="easyui-datebox">
	<input type="text" name="startTm" data-options="showSeconds:false" class="easyui-datetimebox">

form提交时能够正确获取它们的值：
	var d = WUI.getFormData(jfrm); // {startDt: "2019-10-10", startTm: "2019-10-10 10:10"}

而且在查询模式下，日期等字段也不受格式限制，可输入诸如"2019-10", "2019-1-1~2019-7-1"这样的表达式。
*/
self.formItems[".combo-f"] = $.extend({}, self.defaultFormItems, {
	getComboType_: function (jo) {
		var o = jo[0];
		if (! o.comboType) {
			var arr = Object.keys(jo.data()); // e.g. ["combogrid", "combo", "textbox"]
			// console.log(arr);
			for (var i=0; i<arr.length; ++i) {
				if (jo[arr[i]]) {
					o.comboType = arr[i];
					break;
				}
			}
		}
		return o.comboType;
	},
	getName: function (jo) {
		// 取原始名字comboname
		return jo.prop("nameForFind") || jo.attr("comboname");
	},
	setValue: function (jo, val) {
		var type = this.getComboType_(jo);
		jo[type]("setValue", val);
	},
	getValue: function (jo) {
		var type = this.getComboType_(jo);
		return jo[type]("getValue");
	},
	getReadonly: function (jo) {
		return jo.combo("textbox").prop("readonly");
	},
	setReadonly: function (jo, val) {
		jo.combo("textbox").prop("readonly", val);
	},
	// 用于显示的虚拟字段值
	getValue_vf: function (jo) {
		var type = this.getComboType_(jo);
		return jo[type]("getText");
	}
});

/*
self.formItems[".combogrid-f"] = $.extend({}, self.defaultFormItems, {
	getName: function (jo) {
		return jo.attr("comboname");
	},
	setValue: function (jo, val) {
		jo.combogrid("setValue", val);
	},
	getValue: function (jo) {
		return jo.combogrid("getValue");
	}
});

self.formItems[".datebox-f"] = $.extend({}, self.defaultFormItems, {
	getName: function (jo) {
		return jo.attr("comboname");
	},
	setValue: function (jo, val) {
		jo.datebox("setValue", val);
	},
	getValue: function (jo) {
		return jo.datebox("getValue");
	}
});

self.formItems[".datetimebox-f"] = $.extend({}, self.defaultFormItems, {
	getName: function (jo) {
		return jo.attr("comboname");
	},
	setValue: function (jo, val) {
		jo.datetimebox("setValue", val);
	},
	getValue: function (jo) {
		return jo.datetimebox("getValue");
	}
});
*/

/**
@fn toggleCol(jtbl, col, show)

显示或隐藏datagrid的列。示例：

	WUI.toggleCol(jtbl, 'status', false);

如果列不存在将出错。
*/
self.toggleCol = toggleCol;
function toggleCol(jtbl, col, show)
{
	jtbl.datagrid(show?"showColumn":"hideColumn", col);
}

/**
@fn toggleFields(jtbl_or_jfrm, showMap)

根据type隐藏datagrid列表或明细页form中的项。示例：

	function toggleItemFields(jo, type)
	{
		WUI.toggleFields(jo, {
			type: !type,
			status: !type || type!="公告",
			tm: !type || type=="活动" || type=="卡券" || type=="停车券",
			price: !type || type=="集市",
			qty: !type || type=="卡券"
		});
	}

列表中调用，控制列显示：pageItem.js

		var type = objParam & objParam.type; // 假设objParam是initPageXX函数的传入参数。
		toggleItemFields(jtbl, type);

明细页中调用，控制字段显示：dlgItem.js

		var type = objParam && objParam.type; // objParam = 对话框beforeshow事件中的opt.objParam
		toggleItemFields(jfrm, type);

@key .wui-field

在隐藏字段时，默认是找到字段所在的行(tr)或标识`wui-field`类的元素控制其显示或隐藏。示例：

		<tr>
			<td></td>
				<label class="wui-field"><input name="forEnd" type="checkbox" value="1"> 结束打卡</label>
			</td>

			<td></td>
			<td>
				<label class="wui-field"><input name="repairFlag" type="checkbox" value="1"> 是否维修</label>
			</td>
		</tr>

这里一行有两组字段，以wui-field类来指定字段所在的范围。如果不指定该类，则整行(tr层)将默认当作字段范围。
JS控制：(dialog的onShow时)

		WUI.toggleFields(jfrm, {
			forEnd: formMode == FormMode.forSet && !frm.tm1.value,
			repairFlag: g_args.repair
		})

 */
self.toggleFields = toggleFields;
function toggleFields(jo, showMap)
{
	if (jo.prop("tagName") == "TABLE") {
		var jtbl = jo;
		$.each(showMap, function (k, v) {
			// 忽略找不到列的错误
			try {
				toggleCol(jtbl, k, !!v);
			} catch (ex) {
				// console.error('fail to toggleCol: ' + k);
			}
		});
	}
	else if (jo.prop("tagName") == "FORM") {
		var frm = jo[0];
		$.each(showMap, function (k, v) {
			var o = frm[k];
			if (o)
				$(o).closest("tr,.wui-field").toggle(!!v);
		});
	}
}

function initPermSet(rolePerms)
{
	if (!rolePerms)
		return;

	var permSet = {};
	var rpArr = rolePerms.split(/\s+/);
	$.each (rpArr, function (i, e) {
		var e1 = e.replace(/不可/, '');
		if (e1.length != e.length) {
			permSet[e1] = false;
		}
		else {
			var n = e.indexOf('.');
			if (n > 0)
				permSet[e.substr(0, n)] = true;
			permSet[e] = true;
		}
	});
	console.log('permSet', permSet);
	return permSet;
}

/**
@fn WUI.applyPermission()

@key permission 菜单权限控制

前端通过菜单项来控制不同角色可见项，具体参见store.html中菜单样例。

	<div class="perm-mgr" style="display:none">
		<div class="menu-expand-group">
			<a><span><i class="fa fa-pencil-square-o"></i>系统设置</span></a>
			<div class="menu-expandable">
				<a href="#pageEmployee">登录帐户管理</a>
				...
			</div>
		</div>
	</div>

系统默认使用mgr,emp两个角色。一般系统设置由perm-mgr控制，其它菜单组由perm-emp控制。
其它角色则需要在角色表中定义允许的菜单项。

根据用户权限，如"item,mgr"等，菜单中有perm-xxx类的元素会显示，有nperm-xxx类的元素会隐藏

示例：只有mgr权限显示

	<div class="perm-mgr" style="display:none"></div>

示例：bx权限不显示（其它权限可显示）

	<a href="#pageItem" class="nperm-bx">商品管理</a>

可通过 g_data.hasRole(roles) 查询是否有某一项或几项角色。注意：由于历史原因，hasRole/hasPerm是同样的函数。

	var isMgr = g_data.hasRole("mgr"); // 最高管理员
	var isEmp = g_data.hasRole("emp"); // 一般管理员
	var isAdm = g_data.hasRole("mgr,emp"); // 管理员(两种都行)
	var isKF = g_data.hasRole("客服");

自定义权限规则复杂，一般由框架管理，可以用g_data.permSet[perm]查询，如：

	var bval = g_data.permSet["客户管理"];

 */
self.applyPermission = applyPermission;
function applyPermission()
{
	var perms = g_data.userInfo.perms;
	var rolePerms = g_data.userInfo.rolePerms;

	// e.g. "item,mgr" - ".perm-item, .perm-mgr"
	if (!perms)
		return;
	// replace special chars
	perms = perms.replace(/[&]/g, '_');
	var sel = perms.replace(/([^, ]+)/g, '.perm-$1');
	var arr = perms.split(/,/);
	if (sel) {
		$(sel).show();
		var sel2 = sel.replace(/perm/g, 'nperm');
		$(sel2).hide();
	}

	g_data.hasRole = g_data.hasPerm = function (perms) {
		var arr1 = perms.split(',');
		for (var i=0; i<arr1.length; ++i) {
			var perm = arr1[i].trim();
			if (arr.indexOf(perm) >= 0)
				return true;
		}
		return false;
		
/*
		var found = false;
		$.each(arr, function (i, e) {
				if (e == perm) {
					found = true;
					return false;
				}
		});
		return found;
*/	}

	if (rolePerms) {
		g_data.permSet = initPermSet(rolePerms);
		if (! g_data.hasRole("mgr,emp")) {
			var defaultShow = self.canDo("*", null, false);
			$("#menu .perm-emp .menu-expand-group").each(function () {
				showGroup($(this));
			});
		}

		// 支持多级嵌套
		function showGroup(jo) {
			var t = jo.find("a:first").text(); // 菜单组名称
			var doShowGroup = self.canDo(t, null, defaultShow);
			var doShow = defaultShow;
			var allHidden = true;
			jo.find(">.menu-expandable>a").each(function () {
				var t = $(this).text();
				if (WUI.canDo(t, null, doShowGroup)) {
					doShow = true;
					allHidden = false;
					// $(this).show();
				}
				else {
					$(this).hide();
				}
			});
			jo.find(">.menu-expand-group").each(function () {
				if (showGroup($(this))) {
					doShow = true;
					allHidden = false;
				}
			});
			if (allHidden) {
				jo.closest(".perm-emp").hide();
				return false;
			}
			else if (doShowGroup || doShow) {
				jo.closest(".perm-emp").show();
				return true;
			}
			return false;
		}
	}
}

/**
@fn WUI.fname(fn)

为fn生成一个名字。一般用于为a链接生成全局函数。

	function onGetHtml(value, row) {
		var fn = WUI.fname(function () {
			console.log(row);
		});
		return '<a href="' + fn + '()">' + value + '</a>';
	}

或：

	function onGetHtml(value, row) {
		return WUI.makeLink(value, function () {
			console.log(row);
		});
	}

@see makeLink
 */
window.fnarr = [];
self.fname = fname;
function fname(fn)
{
	fnarr.push(fn);
	return "fnarr[" + (fnarr.length-1) + "]";
}

/**
@fn WUI.makeLink(text, fn)

生成一个A链接，显示text，点击运行fn.
用于为easyui-datagrid cell提供html.

	<table>
		...
		<th data-options="field:'orderCnt', sortable:true, sorter:intSort, formatter:ItemFormatter.orderCnt">订单数/报名数</th>
	</table>

定义formatter:

	var ItemFormatter = {
		orderCnt: function (value, row) {
			if (!value)
				return value;
			return WUI.makeLink(value, function () {
				var objParam = {type: row.type, itemId: row.id};
				WUI.showPage("pageOrder", "订单-" + objParam.itemId, [ objParam ]);
			});
		},
	};

@see fname
 */
self.makeLink = makeLink;
function makeLink(text, fn)
{
	return '<a href="javascript:' + self.fname(fn) + '()">' + text + '</a>';
}

function getObjFromJtbl(jtbl)
{
	if (!jtbl || jtbl.size() == 0 || !jtbl.hasClass("datagrid-f")) {
		console.error("bad datagrid: ", jtbl);
		throw "getObjFromJtbl error: bad datagrid.";
	}
	var url = jtbl.datagrid("options").url;
	var m = url.match(/\w+(?=\.query\b)/);
	return m && m[0];
}

$.extend(self.dg_toolbar, {
	"import": function (ctx) {
		return {text: "导入", "wui-perm": "新增", iconCls:'icon-ok', handler: function () {
			var obj = getObjFromJtbl(ctx.jtbl);
			self.assert(obj, "dg_toolbar.import: 对象未指定，无法导入");
			self.assert(DlgImport, "DlgImport未定义");
			DlgImport.show({obj: obj}, function () {
				WUI.reload(ctx.jtbl);
			});
		}};
	},

	qsearch: function (ctx) {
		var randCls = "qsearch-" + WUI.randChr(4); // 避免有多个qsearch组件时重名冲突
		setTimeout(function () {
			ctx.jpage.find(".qsearch." + randCls).click(function () {
				return false;
			});
			ctx.jpage.find(".qsearch." + randCls).keydown(function (e) {
				if (e.keyCode == 13) {
					$(this).closest(".l-btn").click();
				}
			});
		});
		return {text: "<input style='width:8em' class='qsearch " + randCls + "'>", iconAlign:'right', iconCls:'icon-search', handler: function () {
			var val = $(this).find(".qsearch").val();
			WUI.reload(ctx.jtbl, null, {q: val});
		}};
	}
});

/**
@key .wui-subobj

选项：{obj, relatedKey, res?, dlg?/关联的明细对话框, datagrid/treegrid}

这些选项在dlg设置时有效：{valueField, readonly, objParam, toolbar, vFields}

## 示例1：可以增删改查的子表：

	<div class="wui-subobj" data-options="obj:'CusOrder', relatedKey:'cusId', valueField:'orders', dlg:'dlgCusOrder'">
		<p><b>物流订单</b></p>
		<table>
			<thead><tr>
				<th data-options="field:'tm', sortable:true">制单时间</th>
				<th data-options="field:'status', sortable:true, jdEnumMap:CusOrderStatusMap, formatter:Formatter.enum(CusOrderStatusMap), styler:Formatter.enumStyler({CR:'Warning',CL:'Disabled'})">状态</th>
				<th data-options="field:'amount', sortable:true, sorter:numberSort">金额</th>
			</tr></thead>
		</table>
	</div>

选项说明：

- obj: 子表对象，与relatedKey字段一起自动生成子表查询，即`{obj}.query`接口。

		class AC2_CusOrder extends AccessControl
		{
		}

- relatedKey: 关联字段. 指定两表(当前表与obj对应表)如何关联, 用于自动创建子表查询条件以及子表对话框的关联值设置(wui-fixed-field)
 值"cusId"与"cusId={id}"等价, 表示`主表.id=CusOrder.cusId`.
 可以明确指定被关联字段, 如relatedKey="name={name}" 表示`主表.name=CusOrder.name`. 
 支持多个关联字段设置, 如`relId={id} AND type={type}`.

- dlg: 对应子表详情对话框。如果指定，则允许添加、更新、查询操作。

以下字段仅当关联对话框（即dlg选项设置）后有效：

- valueField: 对应后端子表名称，在随主表一起添加子表时，会用到该字段。如果不指定，则不可在主表添加时一起添加。它对应的后端实现示例如下：

		class AC2_Customer extends AccessControl
		{
			protected $subobj = [
				"orders" => [ "obj" => "CusOrder", "cond" => "cusId=%d" ]
			]
		}

- readonly: 默认为false, 设置为true则在主表添加之后，不可对子表进行添加、更新或删除。

- objParam: 关联的明细对象对话框的初始参数, 对应dialogOpt.objParam. 例如有 offline, onCrud()等选项. 
@see objParam

示例：在对话框dlgOrder上设置子表关联对话框dlgOrder1:

		<div class="wui-subobj" id="tabOrder1" data-options="...">

注意：要在onBeforeShow中设置objParam，如果在onShow中设置就晚了：

	jdlg.on("beforeshow", onBeforeShow)
	function onBeforeShow(ev, formMode, opt)
	{
		var type = opt.objParam && opt.objParam.type;
		var tab1Opt = WUI.getOptions(jdlg.find("#tabOrder1"));
		tab1Opt.objParam = { type: type };
		...
	}

- toolbar: 指定修改对象时的增删改查按钮, Enum(a-add, s-set, d-del, f-find, r-refresh), 字符串或数组, 缺省是所有按钮, 空串""或空数组[]表示没有任何按钮.
示例：只留下删除和刷新: toolbar='rd'
@see dg_toolbar

可以在validate事件中，对添加的子表进行判断处理：

	function onValidate(ev, mode, oriData, newData) 
	{
		// 由于valueField选项设置为"orders", 子表数组会写在newDate.orders中
		if (newData.orders.length == 0) {
			WUI.app_alert("请添加子表项!", "w");
			return false;
		}
		// 假如需要压缩成一个字符串：
		// newData.orders = WUI.objarr2list(newData.orders, ["type", "amount"]);
	}

选项可以动态修改，如：

	// 在dialog的beforeshow回调中：
	var jsub = jdlg.find(".wui-subobj");
	WUI.getOptions(jsub).readonly = !g_data.hasRole("emp,mgr");

- forceLoad: 显示为Tab页时（即每个Tab页一个子表），为减少后端查询，若该Tab页尚未显示，是不加载该子表的。设置forceLoad为true则无论是否显示均强制加载。

## 示例2：主表记录添加时不需要展示，添加之后子表/关联表可以增删改查：

	<div class="wui-subobj" data-options="obj:'CusOrder', relatedKey:'cusId', dlg:'dlgCusOrder'>
		...
	</div>

## 示例3：和主表字段一起添加，添加后变成只读不可再新增、更新、删除：

	<div class="wui-subobj" data-options="obj:'CusOrder', relatedKey:'cusId', valueField:'orders', dlg:'dlgCusOrder', readonly: true">
		...
	</div>

示例4：最简单的只读子表，只查看，也不关联对话框

	<div class="wui-subobj" data-options="obj:'CusOrder', res:'id,tm,status,amount', relatedKey:'cusId'">
	</div>

- res: 指定返回字段以提高性能，即query接口的res参数。注意在关联详细对话框（即指定dlg选项）时，一般不指定res，否则双击打开对话框时会字段显示不全。


## 示例4: 动态启用/禁用子表

启用或禁用可通过事件发送指令:
	jo.trigger("setDisabled", boolDisabledVal); // 会自动刷新UI

示例: 在物料明细对话框(dlgItem)中, 在Tabs组件中放置"组合"子表, 当下拉框选择"组合"时, 启用"组合"子表Tab页:

	<select name="type">
		<option value="">(无)</option>
		<option value="P">组合</option>
		<!--<option value="U">拆卖</option>-->
	</select>

	<div class="easyui-tabs">
		<div class="wui-subobj" id="tabItem1" data-options="obj:'Item1', valueField:'item1', relatedKey:'itemId', dlg:'dlgItem1'" title="组合">
			<table>
				<thead><tr>
					<th data-options="field:'srcItemName'">源商品</th>
					<th data-options="field:'qty', formatter:WUI.formatter.number">数量</th>
				</tr></thead>
			</table>
		</div>
	</div>

设置"组合"页随着type选择启用禁用:

	$(frm.type).change(function () {
		toggleItem1(this.value);
	});

	jdlg.on("beforeshow", onBeforeShow)
		.on("validate", onValidate);
	
	function onBeforeShow(ev, formMode, opt) 
	{
		toggleItem1(opt.data && opt.data.type);
	}

	function onValidate(ev, mode, oriData, newData) 
	{
		// 添加时验证子表值
		if (mode == FormMode.forAdd) {
			var type = frm.type.value;
			if (type == "P") {
				console.log(newData.item1);
				if (newData.item1 == null || newData.item1.length == 0) {
					app_alert("请添加组合明细!", "w");
					// 自动切换到该页
					jdlg.find(".easyui-tabs").tabs("select", "组合");
					return false;
				}
			}
		}
	}

	// 启用或禁用子表的Tab
	function toggleItem1(type)
	{
		var dis = type!="P";
		jdlg.find("#tabItem1").trigger("setDisabled", dis);
	}

## 示例5：显示为树表(treegrid)

- opt.datagrid: 设置easyui-datagrid的选项
- opt.treegrid: 如果指定，则以树表方式展示子表，设置easyui-treegrid的选项

默认使用以下配置：

	{
		idField: "id",  // 不建议修改
		fatherField: "fatherId", // 指向父结点的字段，不建议修改
		treeField: "id", // 显示树结点的字段名，可根据情况修改
	}

子表以树表显示时，不支持分页（查询时自动设置参数pagesz=-1）。

@see treegrid

## 示例6：offline模式时显示虚拟字段以及提交时排除虚拟字段

在添加主对象时，对子对象的添加、更新、删除操作不会立即操作数据库，而是将最终子对象列表与主对象一起提交（接口是主对象.add）。
我们称这时的子对象对话框为offline模式，它会带来一个问题，即子对象对话框上点确定后，子表列表中无法显示虚拟字段。

解决方案是：1. 在对话框中用jd_vField选项指定虚拟字段名，2. 在subobj选项中以vFields选项指定这些字段只显示而不最终提交到add接口中。

- opt.vFields: (v5.5) 指定虚拟字段(virtual field)，多个字段以逗号分隔。这些字段只用于显示，不提交到后端。

示例：InvRecord对象包含子表InvRecord1，字段定义为：

	@InvRecord1: id, invId, whId, whId2, itemId
	vcol: itemName, whName, whName2

打开对话框dlgInvRecord添加对象，再打开子表明细对话框dlgInvRecord1添加子表项。
在subobj组件中，通过选项vFields排除只用于显示而不向后端提交的虚拟字段，dlgInvRecord.html中：

		<div class="wui-subobj" data-options="obj:'InvRecord1', relatedKey:'invId', valueField:'inv1', vFields:'itemName,whName,whName2', dlg:'dlgInvRecord1'" title="物料明细">
			...子表与字段列表...
		</div>

子表明细对话框中，为了在点击确定后将虚拟字段拷贝回subobj子表列表中，应通过data-options中指定jd_vField选项来指定虚拟字段名，如 dlgInvRecord1.html:

	仓库   <select name="whId" class="my-combobox" required data-options="ListOptions.Warehouse()"></select>  (Warehouse函数中已定义{jd_vField: 'whName'})
	到仓库 <select name="whId2" class="my-combobox" required data-options="$.extend(ListOptions.Warehouse(), {jd_vField:'whName2'})"></select> (覆盖Warehouse函数定义中的jd_vField选项)
	物料   <input name="itemId" class="wui-combogrid" required data-options="ListOptions.ItemGrid()">  (ItemGrid函数中已定义{jd_vField: 'itemName'})

ListOptions中对下拉列表参数的设置示例：(store.js)

	var ListOptions = {
		...
		Warehouse: function () {
			return {
				jd_vField: "whName", // 指定它在明细对话框中对应的虚拟字段名
				textField: "name", // 注意区别于jd_vField，textField是指定显示内容是url返回表中的哪一列
				url: ...
			}
		},
		ItemGrid: function () {
			return {
				jd_vField: "itemName",
				textField: "name",
				url: ...
			}
		},
	}

注意带Grid结尾的选项用于wui-combogrid组件; 否则应用于my-combobox组件； 
两者选项接近，wui-combogrid选项中应包含columns定义以指定下拉列表中显示哪些列，而my-combobox往往包含formatter选项来控制显示（默认是显示textField选项指定的列，设置formatter后textField选项无效）

上例中, 通过为组件指定jd_vField选项，实现在offline模式的子表对话框上点确定时，会自动调用WUI.getFormData_vf将虚拟字段和值字段拼到一起，返回并显示到表格中。

@see getFormData_vf
 */
self.m_enhanceFn[".wui-subobj"] = enhanceSubobj;
function enhanceSubobj(jo)
{
	var opt = WUI.getOptions(jo);
	self.assert(opt.relatedKey, "wui-subobj: 选项relatedKey未设置");

	var relatedKey = opt.relatedKey;
	if (relatedKey.match(/^\w+$/))
		relatedKey += "={id}";

	var ctx = {};

	// 子表表格和子表对话框
	var jtbl = jo.find("table:first");
	self.assert(jtbl.size() >0, "wui-subobj: 未找到子表表格");

	var jdlg = jo.closest(".wui-dialog");
	if (jdlg.size() == 0)
		return;

	var jtabs = jo.closest(".easyui-tabs");
	var inTab = jtabs.size() > 0;
	var tabIndex = -1;

	jdlg.on("beforeshow", onBeforeShow);
	if (inTab) {
		tabIndex = jtabs.tabs("getTabIndex", jo);
		jo.on("tabSelect", loadData);
	}
	jo.on("setDisabled", function (ev, val) {
		opt.disabled = val;
		loadData();
	});

	var jdlg1;
	if (opt.dlg) {
		jdlg1 = $("#" + opt.dlg);
		if (opt.valueField)
			jdlg.on("validate", onValidate);
	}

	var datagrid = opt.treegrid? "treegrid": "datagrid";
	
	function onBeforeShow(ev, formMode, beforeShowOpt) 
	{
		var objParam = beforeShowOpt.objParam;
		setTimeout(onShow);

		function onShow() {
			ctx = {
				formMode: formMode,
				formData: beforeShowOpt.data
			};
			jo.data("subobjLoaded_", false);
			loadData();
		}
	}

	function onValidate(ev, mode, oriData, newData) 
	{
		if (opt.disabled)
			return;
		if (mode == FormMode.forAdd) {
			// 添加时设置子表字段
			self.assert(opt.valueField, "wui-subobj: 选项valueField未设置");
			if (jo.data("subobjLoaded_")) {
				var rows = jtbl[datagrid]("getData").rows;
				if (opt.vFields) {
					var fields = opt.vFields.split(/\s*,\s*/);
					newData[opt.valueField] = $.map(rows, function (e, i) {
						var e1 = $.extend({}, e);
						$.each(fields, function (idx, k) {
							delete e1[k];
						});
						return e1;
					});
				}
				else {
					newData[opt.valueField] = rows;
				}
			}
		}
	}

	function loadData() {
		var formMode = ctx.formMode;
		var formData = ctx.formData;
		var show = formMode == FormMode.forSet;
		if (jdlg1 && (formMode == FormMode.forAdd && !!opt.valueField))
			show = true;
		toggle(!opt.disabled && show);

		if (jo.is(":hidden") && !opt.forceLoad)
			return;

		if (jo.data("subobjLoaded_"))
			return;
		jo.data("subobjLoaded_", true);

		if (jdlg1) {
			jdlg1.objParam = $.extend({}, opt.objParam);
			if (formMode == FormMode.forAdd) {
				if (opt.valueField) {
					jdlg1.objParam.offline = true; // 添加时主子表一起提交
					setObjParam(jdlg1.objParam, formData);
					jtbl.jdata().toolbar = "ads"; // add/del/set
					var dgOpt = $.extend({
						toolbar: WUI.dg_toolbar(jtbl, jdlg1),
						onDblClickRow: WUI.dg_dblclick(jtbl, jdlg1),
						data: [],
						url: null,
					}, opt[datagrid]);
					jtbl[datagrid](dgOpt);
				}
			}
			else if (formMode == FormMode.forSet) {
				setObjParam(jdlg1.objParam, formData);
				jdlg1.objParam.readonly = opt.readonly;
				jtbl.jdata().toolbar = opt.toolbar;  // 允许所有
				var dgOpt = $.extend({
					toolbar: WUI.dg_toolbar(jtbl, jdlg1),
					onDblClickRow: WUI.dg_dblclick(jtbl, jdlg1),
					url: getQueryUrl(formData)
				}, opt[datagrid]);
				jtbl[datagrid](dgOpt);

				// 隐藏子表工具栏，不允许操作（但可以双击一行查看明细，会设置这时子对话框只读）
				jtbl.closest(".datagrid").find(".datagrid-toolbar").toggle(!opt.readonly);
			}
		}
		else {
			if (formMode == FormMode.forSet) {
				var dgOpt = {
					url: getQueryUrl(formData)
				};
				jtbl[datagrid](dgOpt);
			}
		}
	}

	// 根据主表数据和relatedKey设置子表固定数据
	function setObjParam(objParam, formData) {
		// 格式示例: `relId={id}`, `type='工艺'`, `flag=1`
		relatedKey.replace(/(\w+)=(?:\{(\w+)\}|(\S+))/g, function (ms, key, key2, value) {
			if (key2) {
				objParam[key] = formData[key2];
			}
			else {
				objParam[key] = value.replace(/['"]/g, '');
			}
		});
	}

	function toggle(show) {
		if (inTab) {
			toggleTab(jtabs, tabIndex, show);
		}
		else {
			jo.toggle(show);
		}
	}

	// 根据主表数据和relatedKey设置url
	function getQueryUrl(formData) {
		var cond = relatedKey.replace(/(\w+=)\{(\w+)\}/g, function (ms, ms1, ms2) {
			return ms1 + Q(formData[ms2]);
		});
		var param = {cond: cond, res: opt.res};
		// 树型子表，一次全部取出
		if (opt.treegrid)
			param.pagesz = -1;
		return WUI.makeUrl(opt.obj + ".query", param);
	}
}

/**
@key easyui-tabs

扩展: 若未指定onSelect回调, 默认行为: 点Tab发出tabSelect事件, 由Tab自行处理
*/
$.fn.tabs.defaults.onSelect = function (title, idx) {
	$(this).tabs("getTab", idx).trigger("tabSelect");
	console.log('onSelect', arguments);
};

/**
@fn WUI.toggleTab(jtabs, which, show, noEvent?)

禁用或启用easyui-tabs组件的某个Tab页.
which可以是Tab页的索引数或标题.
示例:

	var jtabs = jdlg.find(".easyui-tabs");
	WUI.toggleTab(jtabs, "组合物料", formData.type == "P");

 */
self.toggleTab = toggleTab;
function toggleTab(jtabs, which, show, noEvent) {
	var jtab = jtabs.tabs("getTab", which);
	jtabs.tabs(show?"enableTab":"disableTab", which);
	// jtab.toggle(show); // 如果用隐藏, 且刚好jtab是当前活动Tab, 则有问题: 其它Tab无法点击
	jtab.css("visibility", show?"visible":"hidden");
}

/**
@key .wui-picker 字段后的工具按钮

示例：输入框后添加一个编辑按钮，默认不可编辑，点按钮编辑：

	<input name="value" class="wui-picker-edit">

示例：输入框后添加一个帮助按钮：

	<input name="value" class="wui-picker-help" data-helpKey="取消工单">

点击帮助按钮，跳往WUI.options.helpUrl指定的地址。如果指定data-helpKey，则跳到该锚点处。

可以多个picker一起使用。
*/

self.m_enhanceFn[".wui-picker-edit, .wui-picker-help"] = enhancePicker;
function enhancePicker(jo)
{
	var jbtns = $();
	if (jo.hasClass("wui-picker-edit")) {
		var jbtn = $("<a></a>");
		jbtn.linkbutton({
			iconCls: 'icon-edit',
			plain: true
		});
		jbtns = jbtns.add(jbtn);

		disable();
		jbtn.click(enable);
		jo.blur(disable);
	}
	if (jo.hasClass("wui-picker-help")) {
		var jbtn = $("<a></a>");
		jbtn.linkbutton({
			iconCls: 'icon-help',
			plain: true
		});
		jbtns = jbtns.add(jbtn);

		jbtn.click(help);
	}

	if (jbtns.length > 0) {
		jo.after(jbtns);
		if (jo.is(":input"))
			jo.css("margin-right", -5 -24 * jbtns.length);
		if (jo.is("textarea"))
			jo.css("vertical-align", "top");
	}

	//var jdlg = jo.closest(".wui-dialog");
	//jdlg.on("beforeshow", disable);

	function enable() {
		jo.prop("readonly", false);
	}
	function disable() {
		jo.prop("readonly", true);
	}
	function help() {
		var url = WUI.options.helpUrl;
		if (! url)
			return;
		if (jo.attr("data-helpKey"))
			url += "#" + jo.attr("data-helpKey");
		window.open(url);
	}
}


/**
@fn WUI.showByType(jo, type)

对话框上form内的一组控件中，根据type决定当前显示/启用哪一个控件。

需求：ItemStatusList定义了Item的状态，但当Item类型为“报修”时，其状态使用`ItemStatusList_报修`，当类型为“公告”时，状态使用ItemStatusList_公告，其它类型的状态使用ItemStatusList

HTML: 在对话框中，将这几种情况都定义出来：

	<select name="status" class="my-combobox" data-options="jdEnumList:ItemStatusList"></select>
	<select name="status" class="my-combobox type-报修" style="display:none" data-options="jdEnumList:ItemStatusList_报修"></select>
	<select name="status" class="my-combobox type-公告" style="display:none" data-options="jdEnumList:ItemStatusList_公告"></select>

注意：当type与“报修”时，它按class为"type-报修"来匹配，显示匹配到的控件（并添加active类），隐藏其它控件，并添加disabled属性（从而在WUI.getFormData时不会取到它的数据）。

JS: 根据type设置合适的status下拉列表，当type变化时更新列表：

	function initDlgXXX()
	{
		...
		jdlg.on("beforeshow", onBeforeShow);
		// 1. 根据type动态显示status
		$(frm.type).on("change", function () {
			var type = $(this).val();
			WUI.showByType(jfrm.find("[name=status]"), type);
		});
		function onBeforeShow(ev, formMode, opt) 
		{
			...
			setTimeout(onShow);
			function onShow() {
				...
				// 2. 打开对话框时根据type动态显示status
				$(frm.type).trigger("change");
			}
		}
	}
 */
self.showByType = showByType;
function showByType(jo, type) {
	if (!type && jo.hasClass("active"))
		return;
	var j1 = type? jo.filter(".type-" + type): null;
	if (!j1 || j1.size() == 0)
		j1 = jo.first();
	if (j1.hasClass("active"))
		return;
	jo.removeClass("active").prop("disabled", true).hide();
	j1.addClass("active").prop("disabled", false).show();
}

}
