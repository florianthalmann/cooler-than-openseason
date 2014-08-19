<?php

include_once('ajax-includes.php');


// Config
$uploadPath = '../userfiles/' . Session::read('username') . '/';
$message    = array();

if(isset($_FILES['data']) && true === Session::read('isLogged') && null !== Session::read('token')) {

    // XMLHttpRequest handler
    $handle = new upload($_FILES['data']);
    
    // Allow any audio MIME type
    $handle->allowed = array('audio/*');
    
    // Maximum file size in bytes
    $handle->file_max_size = '1000000'; // 1MB
    
    
    if($handle->uploaded) {
        
        $handle->file_overwrite = true;
        // $handle->file_name_body_pre =  . '-';
        
        $handle->process($uploadPath);
        
        if($handle->processed) {
            
            $message['filename']    = $handle->file_dst_name;
            $message['destination'] = $handle->file_dst_path;
            $message['mimetype']    = $handle->file_src_mime;
            $message['filesize']    = $handle->file_src_size . ' (Source file size)';
            
        }
        else {
            
            $message['error'] = $handle->error;
            
        }
        
    }
    else {
        
        $message['error'] = $handle->file_src_error;
        
    }
    
}

// Return file info as JSON
header('Content-Type: application/json');
echo json_encode($message);
