<?php

//echo($_FILES['data']);

if(!empty($_POST['fname'])){
  $data = file_get_contents($_FILES['data']['tmp_name']);
  //$data = serialize($array);
  $fname = $_POST['fname']; //generates random name

  $file = fopen("userfiles/" .$fname, 'wb+'); //creates new file
  fwrite($file, $data);
  fclose($file);
}

?>