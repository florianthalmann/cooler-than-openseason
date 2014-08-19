<?php

// PDO Connection to mysql db

try {

	$pdo = new PDO('mysql:host=' . Config::DB_HOST . ';dbname=' . Config::DB_NAME, Config::DB_USER, Config::DB_PASS);

}
catch( PDOException $Exception ) {

    throw new Exception($Exception->getMessage(), (int)$Exception->getCode());
    
}

$pdo->exec("SET NAMES utf8");
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
$pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);  
