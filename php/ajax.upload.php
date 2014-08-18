<?php

// Load Upload class
include_once('class.upload.php');

// Config
$uploadPath = '../userfiles/';
$message    = array();

if(isset($_FILES['data'])) {

    // XMLHttpRequest handler
    $handle = new upload($_FILES['data']);
    
    // Allow any audio MIME type
    $handle->allowed = array('audio/*');
    
    // Maximum file size in bytes
    $handle->file_max_size = '1000000'; // 1MB
    
    
    if($handle->uploaded) {
        
        $handle->file_overwrite = true;
        
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
