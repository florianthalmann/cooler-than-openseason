/*!
 * user.js 
 * User session functions
 */

var User = {
        
    /*
     * Check for already running session
     * Return the username
     */
    sessionRunning: function() {
        var username = '';
        
        $.ajax({
            type: 'get',
            url: 'php/ajax.user.php',
            data: 'checkSession=true',
            dataType: 'json',
            async: false,
            
            success: function(data) {
                if(data.success) {
                    username = data.success;
                }
            }
        });
        return username;
    },
    
    logout: function() {
        
        $.ajax({
            type: 'get',
            url: 'php/ajax.user.php',
            data: 'logout=true',
            dataType: 'json',
            async: false,
            
            success: function(data) {
                if(data.success) {
                    //
                }
            }
        });
        
        // return this.sdata;
    }
      
};