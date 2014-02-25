var account;
function relsClick(e) {

}

var listeners = {};
$.addEventListener = function(event, fn) {
	if (event === 'mention') {
		listeners.mention = fn;
	}
};
$.init = function(params) {
	account = params.account;
};
$.addMention = function(e) {
	$.statusarea.setValue($.statusarea.value + '^[' + e.name + '](' + e.entity + ')');
};
function showRels(e) {
	if (listeners.mention) {
		$.statusarea.blur();
		listeners.mention();
	}
}

function hideRels() {

}

function togglePrivacy(e) {
	if ($.privacy.ispublic === false) {
		$.privacy.ispublic = true;
		$.privacy.setImage('lo24.png');
	} else {
		$.privacy.ispublic = false;
		$.privacy.setImage('lc24.png');
	}
}

function charCounter(params) {
	//need a native module to normalize unicode characters
	var mention = /\^\[(.*?)\]\((.*?)\)/g;
	var ctr = 0;
	var mentions = [];
	var mentionsobj = [];
	var reduced = $.statusarea.value.replace(mention, function(match, name, url, offset, fullstring) {
		var index = ctr;
		ctr++;
		mentions.push(url);
		mentionsobj.push({
			entity : url
		});
		return '^[' + name + '](' + index + ')';
	});
	$.charcount.setText('~' + reduced.length + '/256');
	return {
		mentions : mentions,
		mentionsobj : mentionsobj,
		text : reduced
	};
}

var mediaoptiondialog = Ti.UI.createOptionDialog({
	destructive : 2,
	cancel : 3,
	options : ['Take a picture', 'Image library', 'Remove image', 'Cancel']
});
var mediaimage = Ti.UI.createImageView();
var gotimage;
var gotthumb;
var imagetype;
mediaoptiondialog.addEventListener('click', function(e) {
	switch(e.index) {
		case 0:
			Titanium.Media.showCamera({

				success : function(event) {
					Ti.API.info("picture was taken");
					var mime_type = event.media.mimeType;
					var arr = Array();
					arr = mime_type.split('/');
					imagetype = arr[1];
					mediaimage.setImage(event.media);
					gotimage = mediaimage.toImage();
					gotthumb = event.media.imageAsThumbnail(25);
					$.photobg.setImage(event.media);
					Ti.Media.hideCamera();
				},
				cancel : function() {
				},
				error : function(error) {
					var a = Titanium.UI.createAlertDialog({
						title : 'Camera'
					});
					if (error.code == Titanium.Media.NO_CAMERA) {
						a.setMessage('Your device must have a camera.');
					} else {
						a.setMessage('Unexpected error: ' + error.code);
					}
					a.show();
				},
				mediaTypes : Ti.Media.MEDIA_TYPE_PHOTO,
			});
			break;
		case 1:
			Titanium.Media.openPhotoGallery({
				success : function(event) {
					var mime_type = event.media.mimeType;
					var arr = Array();
					arr = mime_type.split('/');
					imagetype = arr[1];
					gotimage = event.media;
					gotthumb = event.media.imageAsThumbnail(25);
					$.photobg.setImage(gotthumb);
				},
				cancel : function() {
					$.statusarea.focus();
				},
				error : function(error) {
					var a = Titanium.UI.createAlertDialog({
						title : 'Camera'
					});
					if (error.code === Titanium.Media.NO_CAMERA) {
						a.setMessage('Your device must have a camera.');
					} else {
						a.setMessage('Unexpected error: ' + error.code);
					}
					a.show();
				},
				mediaTypes : Ti.Media.MEDIA_TYPE_PHOTO,
			});
			break;
		case 2:
			gotimage = false;
			gotthumb = false;
			$.photobg.setImage(null);
			break;
	}
});
function photoClick() {
	mediaoptiondialog.show();
}

function locationClick() {
	if ($.location.location) {
		$.location.location = false;
		$.location.setTintColor('white');
	} else {
		Ti.Geolocation.getCurrentPosition(function(g) {
			if (g.success) {
				$.location.location = true;
				$.location.latitude = '' + g.coords.latitude;
				$.location.longitude = '' + g.coords.longitude;
				$.location.altitude = '' + g.coords.altitude;
				$.location.setTintColor('green');
			}
		});
	}
}

$.sendPost = function() {
	var cc = charCounter();
	if (cc.text.length > 0) {
		var post = {
			type : "https://tent.io/types/status/v0#",
			content : {
				text : cc.text
			},
			permissions : {}
		};
		if (cc.mentions && cc.mentions.length > 0) {
			post.permissions.entities = cc.mentions;
		}
		if (cc.mentionsobj && cc.mentionsobj.length > 0) {
			post.mentions = cc.mentionsobj;
		}
		if ($.privacy.ispublic) {
			post.permissions.public = true;
		} else {
			post.permissions.public = false;
		}
		if ($.location.location) {
			post.content.location = {
				latitude : $.location.latitude,
				longitude : $.location.longitude,
				altitude : $.location.altitude
			};
		}
		Ti.API.info($.privacy.ispublic);
		Ti.API.info(JSON.stringify(post));

		Alloy.Globals.tent.sendRequest({
			endpoint : 'new_post',
			account : account,
			postjson : post
		}, function(postcallback) {
			Ti.API.info('postcallback:');
			Ti.API.info(JSON.stringify(postcallback, null, '  '));
		});

	} else {
		alert('You can\'t post a status with no text!');
	}
};
