<?php

include_once('ajax-includes.php');


// Config
$filePath = '../userfiles/' . Session::read('username') . '/';
$message    = array();

if($_POST["action"]=="deletefile" && true === Session::read('isLogged') && null !== Session::read('token')) {

    $file = $filePath . $_POST['filename'];
    echo $filePath;
  
    unlink($file);
    
}
