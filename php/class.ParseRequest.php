<?php

/* ==========================================================================
   PROCESS URL path/query
   --------------------------------------------------------------------------
   v0.2 02/04/2014
   Author: tobi vogler //tvdesign.ch
   ========================================================================== */
   
class ParseRequest {
    
    protected $url;
    private   $path;
    private   $query;
    
    public function __construct($inURL) {
        $this->url = $inURL;
        $this->parseRequest();
    }
    
    private function parseRequest() {
        
         // Parse path
        $path        = parse_url($this->url, PHP_URL_PATH);
        $this->path  = $this->parsePath($path);
        
        // Parse appended query (?...)
        $query       = parse_url($this->url, PHP_URL_QUERY);
        $this->query = $this->parseQuery($query);
        
    }
    
    private function parsePath($path) {
    
        $pathArray = array();
                
        if(!empty($path)) {
        
            // Strip leading / and explode path
            $path       = strtolower(ltrim($path, '/'));
            $pathArray  = explode('/', $path);
            
        }
        
        return $pathArray;
        
    }
    
    private function parseQuery($query) {
        
        $queryArray = array();
        
        if(!empty($query)) {
            $query = explode('&', $query);
            
            foreach($query as $item) {
            
                $itemPair = explode('=', $item);
                $queryArray[$itemPair[0]] = (isset($itemPair[1])) ? $itemPair[1] : true;
                
            }
                
        }
        
        return $queryArray;
        
    }
    
    public function getPath() {
        
        return $this->path;
    }
    
    public function getQuery() {
        
        return $this->query;
    }
    
}

?>