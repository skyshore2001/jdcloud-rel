function initPage<?=$obj?>()
{
	var jpage = $(this);
	var jtpl<?=$baseObj?> = $(jpage.find("#tpl<?=$baseObj?>").html());

	var lstIf = MUI.initPageList(jpage, {
		// pageItf: Page<?=$obj?>,
		navRef: ">.hd .mui-navbar",
		listRef: ">.bd .p-list",
		onGetQueryParam: function (jlst, queryParam) {
			queryParam.ac = "<?=$baseObj?>.query";
			queryParam.orderby = "id desc";
		},
		onAddItem: onAddItem
	});

	function onAddItem(jlst, itemData)
	{
		// MUI.formatField(itemData);
		// itemData.statusStr_ = StatusStr[itemData.status];

		var ji = jtpl<?=$baseObj?>.clone();
		MUI.setFormData(ji, itemData);
		// Use html template. Recommend lib [jquery-dataview](https://github.com/skyshore2001/jquery-dataview)
		// ji.dataview(itemData);
		ji.appendTo(jlst);

		// ev.data = itemData
		ji.on("click", null, itemData, li_click);
	}

	function li_click(ev)
	{
		var id = ev.data.id;
		// TODO: 显示详情页
		// Page<?=$baseObj?>.show(id);
		return false;
	}
}

/* example: page interface (move to index.js)
var Page<?=$obj?> = {
	refresh: null
};
*/
