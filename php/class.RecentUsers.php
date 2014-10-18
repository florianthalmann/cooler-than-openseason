<?php

class RecentUsers {

    private $dbh;

    private $usernames;


    public function __construct($dbh) {
        
        $this->dbh = $dbh;
        
        $sql = "SELECT `username` FROM `users` ORDER BY `lastactivity` DESC LIMIT 5";

        $stmtUsernames = $dbh->prepare($sql);
        $stmtUsernames->execute();

        if( $data = $stmtUsernames->fetchAll() ) {
          
            for($i = 0; $i < count($data); ++$i) {
                $this->usernames[$i] = $data[$i]['username'];
            }
                
        }
        else return false;
        
    }
    
    public function getUsernames() {
        
        return $this->usernames;
        
    }
  
}