var args = arguments[0] || {};

var reimburseDetails = Alloy.Collections.reimburseDetail; //$.localReimburseDetails; //
var reimburses = Alloy.Collections.reimburse; //$.localReimburses; //
// fetch existing todo items from storage
//reimburses && reimburses.fetch({remove: false});
var data = reimburses.get(args.id);
reimburseDetails && reimburseDetails.fetch({remove:false, query:"SELECT * FROM reimburseDetail WHERE reimburseId="+args.id});

// Filter the fetched collection before rendering. Don't return the
// collection itself, but instead return an array of models
// that you would like to render.

// Sort Descending
// reimburseDetails.comparator = function(model) {
  // return -(moment.parseZone(model.get('receiptDate')).unix());
// };
//reimburseDetails.sort();

//var abx = require('com.alcoapps.actionbarextras');

function windowOpen(e) {
	Alloy.Globals.reimburseDetailList = $.reimburseDetailList;
	Alloy.Globals.dialogView2 = $.dialogView2;
	data = reimburses.get(args.id);
	var activity = $.reimburseDetailList.getActivity();
	if (activity) {
		var actionBar = activity.getActionBar();
		actionBar.hide();
		// get a handle to the action bar
		//abx.backgroundColor = "white";
		// change the App Title
		//abx.hideLogo();
		//actionBar.homeButtonEnabled = true;
		actionBar.icon = "/icon/ic_back.png";
		//actionBar.logo = "/icon/ic_back.png";
		//actionBar.displayHomeAsUp = true; // back icon
		// Show the "angle" pointing back
		actionBar.onHomeIconItemSelected = doBack;
		var title = data.get("title");
		if (String.format(title).length > 30) title = title.substring(0,27)+"...";
		actionBar.title = "Expense List"; //title;
		actionBar.subtitle = title;
		$.actionTitle.text = "Expense List";
		$.actionSubtitle.text = title;
		// abx.titleFont = "century-gothic";
		// abx.subtitleFont = "century-gothic";
		// abx.titleColor = Alloy.Globals.darkColor;
		// abx.subtitleColor = Alloy.Globals.lightColor;
		$.total.text = "Rp." + String.formatDecimal(data.get("total")); // +" IDR";; //data.get("total");
		activity.invalidateOptionsMenu();
	}
	showList(e);
	var isopen = data.get('status') == STATUSCODE[Const.Open];
	$.editMenu.visible = isopen;
	$.addNewButton.visible = isopen;
	$.submitBtn.visible = isopen;
}

function windowClose(e) {
	$.destroy();
	reimburseDetails = null;
	reimburses = null;
	if (data) {
		Alloy.Globals.scrollableView.views[1].fireEvent("open", e);
		Alloy.Globals.index.fireEvent("refresh", {param:{remove:false/*, query:"SELECT * FROM reimburse WHERE id="+args.id*/}});
		data = null;
	}
}

function doBack(evt) {// what to do when the "home" icon is pressed
	Ti.API.info("Home icon clicked!");
	$.reimburseDetailList.fireEvent('android:back', evt);
}


function dialogViewClick(e) {
    $.dialogView2.hide(); //visible = false;
}

function submitViewClick(e) {
    $.submitDialog.hide(); //visible = false;
}

function dialogSendClick(e) {
    sendReimburse(args.id);
    $.submitDialog.hide();
    $.reimburseDetailList.close();
}

function newDetailClick(e) {
	Alloy.createController("reimburseDetailForm", {reimburseId : args.id, id : null}).getView().open();
}

function doEdit(e) {
	var newview = Alloy.createController("reimburseForm", {id : args.id}).getView(); //.open();
	Alloy.Globals.dialogView2.removeAllChildren();
	Alloy.Globals.dialogView2.add(newview);
	newview.fireEvent("open");
	//$.reimburseDetailList.close();
}

// confirm
function sendReimburse(id) {
	// find the todo task by id
	var reimburse = reimburses.get(id);

	// destroy the model from persistence, which will in turn remove
	// it from the collection, and model-view binding will automatically
	// reflect this in the tableview
	// var dets = reimburseDetails.where({
		// isDeleted : 0,
		// reimburseId : $.homeReimburseRow.rowid
	// });
	// if (!dets) dets = [];
	// TODO: update detail's status
	reimburse.set({"status": STATUSCODE[Const.Pending]});
	reimburse.save();
	// reimburse.save(null, {
            // success: function(model, resp){
                // alert("Success saving.");
            // },
            // error: function(model, resp) {
                // alert("Error saving!");
            // }
        // });
	reimburse.fetch({remove: false}); //reimburses.fetch({remove: false});
	//reimburseDetails && reimburseDetails.fetch({remove:false, query:"SELECT * FROM reimburseDetail WHERE isDeleted=0 and reimburseId="+id});
	if (Alloy.Globals.gcmRegId) {
		libgcm.sendGCM([Alloy.Globals.gcmRegId], {
			title: "Pending Approval ID:"+id,
			message:"You have new pending Reimburse Approval Titled:'"+reimburse.get('title')+"' from '"+Alloy.Globals.CURRENT_USER+"'",
			date: moment().toISOString(),
		}, function(ret) {
			if (ret.error) alert("Error : "+ret.error);
		});
	}
	return reimburse;
}

function doSubmit(e) {
	$.submitDialog.show();
}

function doMenuClick(evt) {
  switch(evt.source.title){
		case "Menu": // in real life you probably wouldn't want to use the text of the menu option as your condition
			var activity = $.reimburseDetailList.getActivity();
			activity.openOptionsMenu();
			break;
		default:
			alert(evt.source.title);	
	}
}

function whereFunction(collection) {
	var ret = collection.where({
		isDeleted : 0,
		reimburseId : parseInt(args.id) //id need to be integer/can't auto cast?
	});
	if (!ret)
		ret = [];
	return ret;
}

function transformFunction(model) {
	var transform = model.toJSON(); 
	transform.status = DETAILSTATUS[transform.status];
	transform.receiptDate = moment.parseZone(transform.receiptDate).local().format("DD-MM-YYYY"); //dateFormat
	transform.amount = "Rp." + String.formatDecimal(transform.amount); // +" IDR";
	if (String.format(transform.name).length > 23)
		transform.name = transform.name.substring(0, 20) + "...";
	return transform;
}

// open the "add item" window
function addItem() {
	Alloy.createController("reimburseDetailForm").getView().open();
}

// Show task list based on selected status type
function showList(e) {
	// if (typeof e.index !== 'undefined' && e.index !== null) {
	// whereIndex = e.index; // TabbedBar
	// } else {
	// whereIndex = INDEXES[e.source.title]; // Android menu
	// }
	reimburseDetails && reimburseDetails.fetch(e.param ? e.param : {remove:false});
}

function thumbPopUp(e) {

}

$.reimburseDetailList.addEventListener('refresh', function(e) {
	showList(e);
});

$.reimburseDetailList.addEventListener("android:back", function(e) {
	//$.tableView.search = Alloy.Globals.searchView;
	//Alloy.Globals.index.activity.actionBar.title = "Reimburse Detail";
	if ($.dialogView2.visible) {
		$.dialogView2.hide();
	} else if($.submitDialog.visible) {
		$.submitDialog.hide();
	} else {
		$.reimburseDetailList.close(e);
	}
});
