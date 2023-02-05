<?php

  /**
   * NagiosTV https://nagiostv.com
   * Copyright (C) 2008-2023 Chris Carey https://chriscarey.com
   *
   * This program is free software: you can redistribute it and/or modify
   * it under the terms of the GNU General Public License as published by
   * the Free Software Foundation, either version 2 of the License, or
   * (at your option) any later version.
   *
   * This program is distributed in the hope that it will be useful,
   * but WITHOUT ANY WARRANTY; without even the implied warranty of
   * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   * GNU General Public License for more details.
   *
   * You should have received a copy of the GNU General Public License
   * along with this program.  If not, see <https://www.gnu.org/licenses/>.
   */

  $temp_dir = 'temp';
  $cwd = getcwd();

  $whoami = exec('whoami');

  //echo "cwd is $cwd\n";

  // test if php is installed, report back to browser
  if (isset($_GET['testphp']) && $_GET['testphp'] == 'true') {

    // get the path name from the script filename with dirname()
    $data = [ 'name' => 'NagiosTV', 'script' => dirname($_SERVER['SCRIPT_FILENAME']), 'whoami' => $whoami ];
    header('Content-Type: application/json');
    if (isset($_SERVER['HTTP_ORIGIN'])) {
      header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    }
    echo json_encode($data);

  } elseif (isset($_GET['version']) && $_GET['version']) {

    // capture requested version
    $version = $_GET['version'];
    $version_without_v = $version;
    $pos = strpos($version, "v");
    //echo "pos found at [$pos]";
    if ($pos !== false) {
      $version_without_v = substr($version, $pos + 1);
    }
    
    // download software from github
    // https://api.github.com/repos/chriscareycode/nagiostv-react/tags
    // https://api.github.com/repos/chriscareycode/nagiostv-react/releases

    $url = "https://github.com/chriscareycode/nagiostv-react/releases/download/v$version_without_v/nagiostv-$version_without_v.tar.gz";

    // Use basename() function to return the base name of file  
    $file_name = basename($url); 
    
    // make temp directory if it does not exist
    if (!file_exists($temp_dir)) {
      $mkdir_success = mkdir($temp_dir, 0777, true);
      if ($mkdir_success) {
        echo "Temp directory $temp_dir created.\n";
      } else {
        echo "Failed creating temp directory.\n";
        exit();
      }
    } else {

      echo "Temp directory exists, deleting files in there..\n";

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
    echo "Downloading $url to $temp_dir/\n";

    if(file_put_contents("$temp_dir/$file_name", file_get_contents($url))) { 
      echo "File $temp_dir/$file_name downloaded successfully.\n"; 
    } 
    else { 
      echo "File $temp_dir/$file_name downloaded failed.\n"; 
      exit();
    } 

    // extract the file
    
    shell_exec("tar xvfz $temp_dir/$file_name --directory $temp_dir/");
    echo "Done extracting. Copying files from temp directory over top of the old build..\n";
    echo "cp -r $cwd/$temp_dir/nagiostv/* $cwd/\n";

    // 
    /**
     * TODO: clean up the old files - this is risky since if something 
     * up above did not work cleanly, then we could blow out their only good files before copy
     * 
     * static/css/
     * static/js
     * 
     */

    // copy the files over top ofo the old version
    shell_exec("cp -r $cwd/$temp_dir/nagiostv/* $cwd/");
    echo "Done copying.\n";

    echo "All done!\n";
    echo "\n";
    echo "REFRESH THE PAGE NOW to load the new code.\n";


  } else {
    $data = [ 'name' => 'NagiosTV' ];
    header('Content-Type: application/json');
    echo json_encode($data);
  }
  


?>