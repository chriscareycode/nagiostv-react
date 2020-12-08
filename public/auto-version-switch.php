<?php

  $temp_dir = 'auto-version-switch-temp';
  $cwd = getcwd();

  echo "cwd is $cwd<br />";

  // test if php is installed, report back to browser
  if ($_GET['testphp'] == 'true') {

    $data = [ 'name' => 'God', 'age' => -1 ];
    header('Content-Type: application/json');
    echo json_encode($data);

  } elseif ($_GET['version']) {

    // capture requested version
    $version = $_GET['version'];

    // download software from github
    // https://api.github.com/repos/chriscareycode/nagiostv-react/tags
    // https://api.github.com/repos/chriscareycode/nagiostv-react/releases
    $url = "https://github.com/chriscareycode/nagiostv-react/releases/download/v$version/nagiostv-$version.tar.gz";

    // Use basename() function to return the base name of file  
    $file_name = basename($url); 
    
    // make temp directory if it does not exist
    if (!file_exists($temp_dir)) {
      $mkdir_success = mkdir($temp_dir, 0777, true);
      if ($mkdir_success) {
        echo "temp directory $temp_dir created<br>";
      } else {
        echo "failed creating temp directory<br>";
      }
    } else {

      echo "deleting files<br />";

      // temp dir exists. delete all files in there
      $files = glob($temp_dir.'/*');  
   
      // Deleting all the files in the list 
      foreach($files as $file) { 
        if(is_file($file))  
          // Delete the given file 
          unlink($file);  
      } 

    }

    // Use file_get_contents() function to get the file 
    // from url and use file_put_contents() function to 
    // save the file by using base name
    echo "Downloading $url<br />";

    if(file_put_contents("$temp_dir/$file_name", file_get_contents($url))) { 
      echo "File $temp_dir/$file_name downloaded successfully<br>"; 
    } 
    else { 
      echo "File downloading failed.<br>"; 
    } 

    // move file
    // if (rename($file_name, "$temp_dir/$file_name")) {
    //   echo "file moved success to $temp_dir/$file_name";
    // } else {
    //   echo "failed file move";
    // }

    // extract archive

    // echo "attempting to extract the archive<br>";

    // // decompress from gz
    // $p = new PharData("$temp_dir/$file_name");
    // $p->decompress(); // creates /path/to/my.tar

    // echo "done decompressing<br>";

    // // php PharData decompress is really stupid where it will rename at the first dot
    // // not the last. so we should be using strrpos here but instead we use strpos
    // // to get the same filename they are creating
    // $file_name_tar = substr($file_name, 0, strpos($file_name, "."));


    // echo "file_name_tar $file_name_tar<br />";

    // // unarchive from the tar
    // $phar = new PharData("$file_name_tar.tar");
    // $phar->extractTo($temp_dir);
    
    shell_exec("tar xvfz $temp_dir/$file_name --directory $temp_dir/");
    echo "done extracting<br>";

    shell_exec("cp -r $cwd/$temp_dir/nagiostv/* $cwd/");
    echo "cp -r $cwd/$temp_dir/nagiostv/* $cwd/<br />";
    echo "done copying<br>";

    //echo getcwd();

    // untar software

    // send success or failure to the browser


  } else {
    $data = [ 'name' => 'God', 'age' => -1 ];
    header('Content-Type: application/json');
    echo json_encode($data);
  }
  

  

  // capture JSON POST
  /*
  $json = '';
  if ($_SERVER['REQUEST_METHOD'] == 'POST') {
          $json = file_get_contents("php://input");
  }

  // write JSON to file
  $myfile = fopen("client-settings.json", "w") or die("Unable to open file!");
  fwrite($myfile, $json);
  fclose($myfile);

  header('Content-Type: application/json');
  //echo json_encode($json);
  echo $json;
  */

?>