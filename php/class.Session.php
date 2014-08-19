<?php

// Simple Session wrapper
// 

class Session {

    private $message;
    private $msgType;


    private static function start() {
        
        if ( '' === session_id() ) {
             
            return session_start();
            
        }
        
    }
    
    public static function destroy() {
        
        session_destroy();
        
    }
    
    public static function write($key, $var = false) {
        
        if( !is_string($key) ) {
        
            return false;
            
        }
        
        self::start();
        
        $_SESSION[$key] = $var;
        return $var;
        
    }
    
    public static function read($key) {
        
        if( !is_string($key) ) {
            
            return false;
            
        }
        
        self::start();
        
        if( isset($_SESSION[$key]) ) {
        
            return $_SESSION[$key];
            
        }
        
    }
    
    
    // Set and get notification messages

    public static function setMessage($msg, $type) {
    
        self::start();
        
        $_SESSION['message']['text'] = $msg;
        $_SESSION['message']['type'] = $type;
        
    }
    
    public static function outputMessage() {
    
        self::start();
    
        if( isset($_SESSION['message']) ) {
        
            $text    = $_SESSION['message']['text'];
            $type    = $_SESSION['message']['type'];
            
            $message = '<div class="message ' . $type . '">' . $text . '</div>';
            
            unset($_SESSION['message']);
            
            return $message;
        
        }
        
    }
    
}