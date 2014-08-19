app.UI = {
    
    // The container that content is loaded into
    container: '#container',
    
    // The container that delegated events are attached to
    delegate:  '#container'
    
};

$(function () {

    // Dismiss message box
    $('#message').click( function() {
        $(this).fadeOut();
    });
    
    // Load permission message by default
    $(app.UI.container).load('nopermission.html');
    
});