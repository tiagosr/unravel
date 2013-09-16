var current_project = {
    unsaved:true,

}
var menu = Ti.UI.createMenu(),
    file_menu = Ti.UI.createMenuItem('File'),
    new_menu_item = file_menu.addItem('New...', function() {
    }),
    open_menu_item = file_menu.addItem('Open...', function() {
        Ti.UI.currentWindow.openFileChooserDialog(function(files){
            if (files.length > 0) {
                console.log("opening files: %j", files)
            } else {
                console.log("no files selected")
            }
        }, {multiple:false, title:"Open Unravel project file", types:['unproj']});
    }),
    save_fn = function(proj_filename) {

    },
    save_as_fn = function() {
        var opts = {
            multiple:false, types:['unproj']
        }
        if (current_project.filename) opts.defaultFile = current_project.filename;
        Ti.UI.currentWindow.openSaveAsDialog(function(files) {
            if(files.length > 0) {
                save_fn(files[0]);
            }
        }, opts)
    },
    save_menu_item = file_menu.addItem('Save', function() {
        if(current_project.filename) {

        } else {
            save_as_fn();
        }
    }),
    save_as_menu_item = file_menu.addItem('Save as...', save_as_fn)
    file_menu.addSeparatorItem();
var exit_menu_item = file_menu.addItem('Exit', function() {
        if(confirm('Are you sure you want to quit?')) {
            Ti.App.exit();
        }
    });

menu.appendItem(file_menu);
Ti.UI.setMenu(menu);