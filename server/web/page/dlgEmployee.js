function initDlgEmployee()
{
	var jdlg = $(this);
	var jfrm = jdlg.find("form:first");
	var frm = jfrm[0];

	jdlg.on("beforeshow", onBeforeShow)
		.on("validate", onValidate);
	
	function onBeforeShow(ev, formMode, opt) 
	{
		var objParam = opt.objParam;
		setTimeout(onShow);

		if (formMode == FormMode.forSet) {
			opt.data.pwd = "****";
		}

		function onShow() {
			var isMgr = g_data.hasPerm("mgr");
			if (!isMgr) {
				frm.uname.disabled = true;
				frm.phone.disabled = true;
				frm.pwd.disabled = true;
				jfrm.find(".perms :checkbox").prop("disabled", true);
			}
		}
	}

	function onValidate(ev, mode, oriData, newData) 
	{
		if (mode != FormMode.forFind && frm.phone.value.length == 0 && frm.uname.value.length == 0) {
			app_alert("手机号和用户名至少填一项!", "w", function () {
				frm.phone.focus();
			});
			return false;
		}
	}
}

$.extend($.fn.validatebox.defaults.rules, {
	uname_zn: {
		validator: function (v) {
			return /^[^\d]/i.test(v);
		},
		message: "用户名不可以数字开头."
	}
});
