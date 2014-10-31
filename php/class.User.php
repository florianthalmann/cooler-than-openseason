<?php

class User {

    private $dbh;

    private $userId = 0;
    private $username;
    private $email;
    private $salt;
    private $passHash;
    
    private $isAdmin = false;
    private $token;    


    public function __construct($username = '', $dbh) {
        
        $this->dbh = $dbh;
        
        // Create object with existing user?
        if( !empty($username) ) {
        
            $sql = "
            SELECT
                *
            FROM
                `users`
            WHERE
                `username` = ?";
            
            $stmtUser = $this->dbh->prepare($sql);
            $stmtUser->execute(array($username));
            
            if( $data = $stmtUser->fetch() ) {
            
                // Populate object with user data

                $this->userId   = $data['id'];
                $this->email    = $data['email'];
                $this->token    = $data['token'];
                
            }
            else return false;
            
        }
        
    }
    
    /* -------------------------------
       PUBLIC FUNCTIONS
       ------------------------------- */
    /* -------------------------------
       Return Member/User Id
       ------------------------------- */
    public function getUserId() {
        
        return $this->userId;
        
    }
    
     /* -------------------------------
       Login
       ------------------------------- */
    public function login($username, $password) {
        
        if(empty($username) || empty($password)) {
            
            return 'Wrong username/password!';
            
        }
        
        $stmtUser = $this->dbh->prepare("SELECT * FROM `users` WHERE `username` = ? OR `email` = ? LIMIT 1");
        $stmtUser->execute(array(strtolower($username), strtolower($username)));

        // User exists
        if($user = $stmtUser->fetch()) {

            // Add salt to entered password
            $pass = $user['salt'] . $password;
            
            // Check if password is correct
            if(hash("sha256", $pass) === $user['passphrase']) {
            
                // LOGIN
            
                Session::write('isLogged', true); 
                Session::write('username', $user['username']);
                
                // Set random access token
                Session::write('token', bin2hex(openssl_random_pseudo_bytes(16)));  
                
                $stmtToken = $this->dbh->prepare("UPDATE `users` SET `token` = ? WHERE `id` = ?");
                $stmtToken->execute(array(Session::read('token'), $this->userId));
                
                return 'success';    
            
            }
            
        }

        Session::write('isLogged', false);
        return 'Wrong username/password!';
        
    }
    
    // Not really used
    public function logout() {
        
        Session::destroy();
        
    }
    
    /* -------------------------------
       Check if the user is logged in
       with matching access token
       ------------------------------- */
    public function isOwnAccount() {
        
        if( $this->token === Session::read('token') ) {
            
            return true;
            
        }
        return false;
        
    }
    
    /* -------------------------------
       Create and send login data
       for new user
       ------------------------------- */
    public function createAccount($username, $email, $password) {
        
        if($this->usernameExists($username)) {
            $error[] = 'Username is already taken.<br>';
        }
        if($this->emailExists($email)) {
            $error[] = 'E-Mail is already taken.<br>';
        }
        
        if(!preg_match('^[a-zA-Z0-9]+$', $username)) {
            $error[] = 'Please enter a name. It may only contain letters A–Z and numbers 0–9.<br>';
        }
        if(empty($email)) {
            $error[] = 'Please enter your e-mail address.<br>';
        }
        if(empty($password)) {
            $error[] = 'Please enter a password.<br>';
        }
        
        if(!isset($error)) {

            $this->passwordHash($password);
                
            $sql = "
            INSERT INTO
                `users`
                (username, email, passphrase, salt)
            VALUES
                (:username, :email, :passHash, :salt)";
            
            $stmtUpdate = $this->dbh->prepare($sql);
                
            $stmtUpdate->bindValue(':username',   strtolower($username), PDO::PARAM_STR);
            $stmtUpdate->bindValue(':email',      strtolower($email), PDO::PARAM_STR);
            $stmtUpdate->bindValue(':passHash',   $this->passHash, PDO::PARAM_STR);
            $stmtUpdate->bindValue(':salt',       $this->salt, PDO::PARAM_STR);
    
            if( $stmtUpdate->execute() ) {
            
                $this->userId = $this->dbh->lastInsertId();
                
                if( $this->login($username, $password) ) {
    
                    return 'success';
                    
                }
                else {
                    
                    $error[] = 'Error: could not login.<br>';
                    
                }
                
            }
            
        }
        
        return $error;
        
    }
    

    /* -------------------------------
       Reset password when forgotten
       ------------------------------- */
    public function resetLogin() {
        
        $this->tempPass = $this->randomPassword();
        $this->passwordHash($this->tempPass);
        $this->passNeedsChange = 1;
        
        $this->updateLoginDetails();
        $this->emailLoginDetails('reset');
        
    }
    
    /* -------------------------------
       Change own password
       ------------------------------- */
    public function changePassword($password) {
    
        if( !$this->isOwnAccount() ) {
        
            return false;
            
        }
                
        if( $this->passwordHash($password) ) {
        
            if( $this->updateLoginDetails() ) {
            
                return true;
            
            }
            else return false;
        
        }
        else return false;
        
    }
    
    /* -------------------------------
       DELETE User
       ------------------------------- */
    public function removeMember() {
    
        if( true === Session::read('isAdmin') ) {
        
            $sql = "
            DELETE FROM
                `members`
            WHERE `id` = ?
            LIMIT 1";
            
            $stmtDelete = $this->dbh->prepare($sql);
            
            if( $stmtDelete->execute(array($this->memberId)) ) {
            
                // Delete uploaded portrait
                $path = './img/member/upload/';
                
                // chmod($path . $this->image, 0755);
                // unlink($path . $this->image);
                
                // If a thumbnail was already created, delete also
                if( file_exists('./img/member/thumbs/' . $this->image) ) {
                    
                    // unlink('./img/member/thumbs/' . $this->image);
                    
                }
            
                return true;
            
            }
        
        }
        return false;
        
    }


    /* -------------------------------
       PRIVATE FUNCTIONS
       ------------------------------- */
    private function usernameExists($username) {
        
        $sql = "
        SELECT
            *
        FROM
            `users`
        WHERE
            `username` = :username
        LIMIT 1";
        
        $stmtCheck = $this->dbh->prepare($sql);
        $stmtCheck->bindValue(':username', strtolower($username), PDO::PARAM_STR);
        
        $stmtCheck->execute();
        
        if( $stmtCheck->fetch() ) {
            
            return true;
            
        }
        return false;
        
    }
    
    private function emailExists($email) {
        
        $sql = "
        SELECT
            *
        FROM
            `users`
        WHERE
            `email` = :email
        LIMIT 1";
        
        $stmtCheck = $this->dbh->prepare($sql);
        $stmtCheck->bindValue(':email', strtolower($email), PDO::PARAM_STR);
        
        $stmtCheck->execute();
        
        if( $stmtCheck->fetch() ) {
            
            return true;
            
        }
        return false;
        
    }
    
    /* -------------------------------
       Create Random, temporary Password
       with CSPRNG
       Return 8 char hex string
       ------------------------------- */
    private function randomPassword() {
    
        // Random Password
        if( $temp = openssl_random_pseudo_bytes(4) ) {
            
            return bin2hex($temp);
            
        }
        return false;
        
    }
       
    /* -------------------------------
       Create Random Salt
       with CSPRNG
       Return 64 char hex string
       (same length as sha256 hash)
       ------------------------------- */
    private function randomSalt() {
    
        // Random Salt
        if( $salt = openssl_random_pseudo_bytes(32) ) {
            
            return bin2hex($salt);
            
        }
        return false;
        
    }
    
    /* -------------------------------
       Create Password Hash
       by adding salt to the password
       and hashing the result
       ------------------------------- */
    private function passwordHash($password) {
        
        if( $this->salt = $this->randomSalt() ) {
        
            $passSalt = $this->salt . $password;
            
            if( $this->passHash = hash("sha256", $passSalt) ) {
            
                return true;
                
            }
            
        }
        else return false;
        
    }

    /* -------------------------------
       Save user data to database
       ------------------------------- */
    private function updateLoginDetails() {
    
        $sql = "
        UPDATE
            `users`
        SET
            `passphrase` = :passHash,
            `salt` = :salt,
        WHERE
            `id` = :userId";
        
        $stmtUpdate = $this->dbh->prepare($sql);
            
        $stmtUpdate->bindValue(':username',   $this->username, PDO::PARAM_STR);
        $stmtUpdate->bindValue(':passHash',   $this->passHash, PDO::PARAM_STR);
        $stmtUpdate->bindValue(':salt',       $this->salt, PDO::PARAM_STR);
        $stmtUpdate->bindValue(':userId',     $this->userId, PDO::PARAM_INT);

        if( $stmtUpdate->execute() ) {
            
            return true;
            
        }  
        return false;
        
    }

    /* -------------------------------
       Send e-mail
       ------------------------------- */
    private function emailLoginDetails($cause) {
    
        global $languageCurrent;
    
        // Headers
		$headers   = array();
		$headers[] = "MIME-Version: 1.0";
		$headers[] = "Content-type: text/html; charset=utf-8";
		$headers[] = "Content-Transfer-Encoding: 8bit"; 
		$headers[] = "From: os <info@openseason.ch>";
		$headers[] = "Reply-To: os <info@openseason.ch>";
		$headers[] = "X-Mailer: PHP/".phpversion();

		$message   = '';
        
        switch($cause) {
            
            case 'create':
                // E-mail template
        		ob_start();
                include('view/mail-login.de.html');
                $message = ob_get_clean();
            
            case 'reset':
                // E-mail text
            
        }
        
        // Send Mail
		if( mail($this->email, "Open Season App", $message, implode("\r\n", $headers), "-finfo@openseason.ch") ) {
		
			return true;
			
		}

        return false;
        
    }

}