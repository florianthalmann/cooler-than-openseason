<?php

include_once('ajax-includes.php');

if(isset($_GET['checkSession'])) {
    
    /*
     * Check if user is logged in
     */    
    
    if ( true === Session::read('isLogged') ) {
        
        $message['success'] = Session::read('username');

    }
    else {
    
        $message['notice'] = 'Not logged in';
        
    }
    
}


// Remove whitespace and related characters from the beginning and end of the string
function trim_value(&$value) {
    $value = trim($value);
}
array_filter($_POST, 'trim_value');

// Filters
$proName = filter_input(INPUT_POST, 'producerName', FILTER_SANITIZE_STRING);
$proPass = filter_input(INPUT_POST, 'producerPassword', FILTER_SANITIZE_STRING);

if(isset($_POST['producerEmail'])) {

    /*
     * Add Account
     */
     
    $proMail = $_POST['producerEmail'];
    if(!filter_input(INPUT_POST, 'producerEmail', FILTER_VALIDATE_EMAIL))
        $error = true;
    else
        $proMail = filter_input(INPUT_POST, 'producerEmail', FILTER_SANITIZE_EMAIL);
    
    
    
    $account = new User('', $pdo);
    $result  = $account->createAccount($proName, $proMail, $proPass);
    
    if( $result === 'success' ) {
    
        $message['success'] = Session::read('username');
        
    }
    else {
        
        $message['error'] = $result;
    }

}
elseif(isset($_POST['producerName'])) {
    
    /*
     * Attempt login
     */
    
    $account = new User($proName, $pdo);
    $result  = $account->login($proName, $proPass);
    
    if( $result === 'success' ) {
    
        $message['success'] = Session::read('username');
        
    }
    else {
        
        $message['error'] = $result;
        
    }
    
}

// Return user info as JSON
header('Content-Type: application/json');
echo json_encode($message);
