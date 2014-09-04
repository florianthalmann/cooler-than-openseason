<?php

// Autoloader
spl_autoload_register('autoloader');
function autoloader($classname) {
    include_once 'php/class.' . $classname . '.php';
}

/* ==========================================================================
   Parse URL request
   ========================================================================== */
$parser = new ParseRequest($_SERVER['REQUEST_URI']);
$path   = $parser->getPath();



$openUsername = ''; // Foreign user to be loaded
$openVersion  = 1;  // Default to version 1

if( !empty($path[0]) ) {
    
    $openUsername = $path[0];
    
    if( isset($path[1]) && $path[1] > 0 ) {
        
        $openVersion = $path[1];
        
    }
    
}

include('layout.html');