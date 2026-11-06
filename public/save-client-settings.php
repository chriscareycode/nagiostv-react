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
   * Optional shared-secret gate.
   *
   * By default this script is reachable by anyone who can reach the web server.
   * To require a secret token, copy nagiostv-server-config.sample.php to
   * nagiostv-server-config.local.php (gitignored) and set 'write_token' to a
   * long random string. Requests must then pass an X-NagiosTV-Token header
   * containing the same value. When a token is
   * configured, the "Save settings to server" button in the UI cannot write;
   * use the manual copy/paste instructions instead.
   */
  function nagiostvTokenCheck() {
    $configFile = __DIR__ . '/nagiostv-server-config.local.php';
    if (!file_exists($configFile) && !is_link($configFile)) {
      return true; // optional for settings saves; the JSON header still blocks browser CSRF
    }
    if (!is_file($configFile) || !is_readable($configFile)) {
      return false;
    }
    $config = include $configFile;
    $expected = (is_array($config) && isset($config['write_token']) && is_string($config['write_token'])) ? $config['write_token'] : '';
    if ($expected === '' || $expected === 'change-me-to-a-long-random-string') {
      return false;
    }
    $provided = isset($_SERVER['HTTP_X_NAGIOSTV_TOKEN']) ? $_SERVER['HTTP_X_NAGIOSTV_TOKEN'] : '';
    return is_string($provided) && $provided !== '' && hash_equals($expected, $provided);
  }

  header('X-Content-Type-Options: nosniff');
  header('Content-Type: application/json');

  // Only POST may write. A plain GET must never truncate the settings file.
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(array('error' => 'Only POST is allowed'));
    exit();
  }

  // Cross-site pages cannot send this non-safelisted header without a CORS
  // preflight, and this endpoint does not grant cross-origin access.
  if (!isset($_SERVER['HTTP_X_NAGIOSTV_SETTINGS']) || $_SERVER['HTTP_X_NAGIOSTV_SETTINGS'] !== '1') {
    http_response_code(403);
    echo json_encode(array('error' => 'Forbidden: missing X-NagiosTV-Settings header'));
    exit();
  }
  $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
  if (!preg_match('/^application\/json(?:\s*;|\s*$)/i', $contentType)) {
    http_response_code(415);
    echo json_encode(array('error' => 'Content-Type must be application/json'));
    exit();
  }
  if (!nagiostvTokenCheck()) {
    http_response_code(403);
    echo json_encode(array('error' => 'Forbidden: missing or invalid token or token configuration'));
    exit();
  }

  // capture JSON POST
  $json = file_get_contents("php://input");

  // refuse oversized bodies
  if (strlen($json) > 65536) {
    http_response_code(413);
    echo json_encode(array('error' => 'Settings payload too large'));
    exit();
  }

  // only accept well-formed JSON objects/arrays, and store re-encoded JSON so
  // arbitrary content can never be written to the file.
  $decoded = json_decode($json);
  if ($json === '' || json_last_error() !== JSON_ERROR_NONE || !is_object($decoded)) {
    http_response_code(400);
    echo json_encode(array('error' => 'Body must be a JSON object'));
    exit();
  }
  $json = json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

  // write JSON to file
  $myfile = fopen("client-settings.json", "w");
  if (!$myfile) {
    http_response_code(500);
    echo json_encode(array('error' => 'Unable to open client-settings.json for writing. Check that the file exists and the web server user has write access.'));
    exit();
  }
  fwrite($myfile, $json);
  fclose($myfile);

  echo $json;

?>
