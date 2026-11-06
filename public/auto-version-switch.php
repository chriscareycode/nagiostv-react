<?php

  /**
   * NagiosTV https://nagiostv.com
   * Copyright (C) 2008-2025 Chris Carey https://chriscarey.com
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

  /**
   * Version changes require a shared secret in
   * nagiostv-server-config.local.php (see the sample config). Send it in an
   * X-NagiosTV-Token header; never put secrets in URLs or server access logs.
   */
  function nagiostvTokenCheck() {
    $configFile = __DIR__ . '/nagiostv-server-config.local.php';
    if (!is_file($configFile) || !is_readable($configFile)) {
      return false; // no configured secret means version changes are disabled
    }
    $config = include $configFile;
    $expected = (is_array($config) && isset($config['write_token']) && is_string($config['write_token'])) ? $config['write_token'] : '';
    if ($expected === '' || $expected === 'change-me-to-a-long-random-string') {
      return false;
    }
    $provided = isset($_SERVER['HTTP_X_NAGIOSTV_TOKEN']) ? $_SERVER['HTTP_X_NAGIOSTV_TOKEN'] : '';
    return is_string($provided) && $provided !== '' && hash_equals($expected, $provided);
  }

  // The NagiosTV web app sends this header on actions that expose server
  // details or change state. Browsers cannot attach custom headers to
  // cross-origin requests without a CORS approval, which this script never
  // grants, so requiring it blocks cross-site requests and casual
  // address-bar probing.
  function nagiostvRequireUpdateHeader() {
    $updateHeader = isset($_SERVER['HTTP_X_NAGIOSTV_UPDATE']) ? $_SERVER['HTTP_X_NAGIOSTV_UPDATE'] : '';
    if ($updateHeader !== '1') {
      header('Content-Type: application/json');
      http_response_code(403);
      echo json_encode(array('error' => 'Forbidden: missing X-NagiosTV-Update header'));
      exit();
    }
  }

  header('X-Content-Type-Options: nosniff');

  /**
   * Functions
   */
  function deleteFilesAndDirectories($dir) {
    $files = array_diff(scandir($dir), array('.','..'));
    foreach ($files as $file) {
        (is_dir("$dir/$file")) ? deleteFilesAndDirectories("$dir/$file") : unlink("$dir/$file");
    }
    return rmdir($dir);
  }

  /**
   * Main
   */
  $temp_dir = 'temp';
  $cwd = getcwd();

  //echo "cwd is $cwd\n";

  // test if php is installed, report back to browser
  if (isset($_GET['testphp']) && $_GET['testphp'] == 'true') {

    nagiostvRequireUpdateHeader();

    // Without a valid token, only report whether PHP is working. Do not
    // disclose server paths or the web server username to unauthenticated callers.
    $data = [ 'name' => 'NagiosTV', 'script' => null, 'whoami' => null ];
    if (nagiostvTokenCheck()) {
      $data['script'] = dirname($_SERVER['SCRIPT_FILENAME']);
      $data['whoami'] = exec('whoami');
    }
    header('Content-Type: application/json');
    echo json_encode($data);

  } elseif (isset($_GET['version']) && $_GET['version']) {

    nagiostvRequireUpdateHeader();
    if (!nagiostvTokenCheck()) {
      header('Content-Type: application/json');
      http_response_code(403);
      echo json_encode(array('error' => 'Forbidden: configure a write token and provide it in X-NagiosTV-Token'));
      exit();
    }

    // Only plain release version numbers are accepted. This prevents shell
    // metacharacters and URL path traversal from reaching the commands below.
    $version = $_GET['version'];
    if (!preg_match('/^v?\d+(\.\d+)*$/', $version)) {
      header('Content-Type: application/json');
      http_response_code(400);
      echo json_encode(array('error' => 'Invalid version format'));
      exit();
    }
    $version_without_v = ltrim($version, 'v');

    // download software from github
    // https://api.github.com/repos/chriscareycode/nagiostv-react/tags
    // https://api.github.com/repos/chriscareycode/nagiostv-react/releases

    $url = "https://github.com/chriscareycode/nagiostv-react/releases/download/v$version_without_v/nagiostv-$version_without_v.tar.gz";

    // Use basename() function to return the base name of file
    $file_name = basename($url);

    // make temp directory if it does not exist
    if (!file_exists($temp_dir)) {
      $mkdir_success = mkdir($temp_dir, 0755, true);
      if ($mkdir_success) {
        echo "Temp directory $temp_dir created.\n";
      } else {
        echo "Failed creating temp directory.\n";
        exit();
      }
    } else {
      // temp dir exists. delete all files in there
      echo "Temp directory exists, deleting files in there..\n";
      deleteFilesAndDirectories($temp_dir);
      // deleteFilesAndDirectories removes the directory itself, so re-create
      // it or the download below fails on repeat updates.
      if (!is_dir($temp_dir) && !mkdir($temp_dir, 0755, true)) {
        echo "Failed re-creating temp directory.\n";
        exit();
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

    shell_exec('tar xvfz ' . escapeshellarg("$temp_dir/$file_name") . ' --directory ' . escapeshellarg($temp_dir . '/'));
    echo "Done extracting. Copying files from temp directory over top of the old build..\n";
    echo 'cp -r ' . escapeshellarg("$cwd/$temp_dir/nagiostv") . "/* $cwd/\n";

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
    shell_exec('cp -r ' . escapeshellarg("$cwd/$temp_dir/nagiostv") . '/* ' . escapeshellarg($cwd) . '/');
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
