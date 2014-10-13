<?php

include_once('ajax-includes.php');

$usernames = new RecentUsers($pdo);

$message['usernames'] = $usernames->getUsernames();

// Return user info as JSON
header('Content-Type: application/json');
echo json_encode($message);
