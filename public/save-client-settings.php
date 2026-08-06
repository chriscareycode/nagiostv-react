<?php

  /**
   * NagiosTV https://nagiostv.com
   * Copyright (C) 2008-2025 Chris Carey https://chriscarey.com
   *
   * This program is free software: you can redistribute it and/or modify
   * it under the terms of the GNU General Public License as published by
   * the Free Software Foundation, either version 2 of the License, or
   * (at your option) any later version.
   */

  require_once __DIR__ . '/admin-security.php';

  if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['capabilities'])) {
    nagiostv_admin_capabilities();
  }

  $settings = nagiostv_require_admin_post(262144);
  unset($settings['llmApiKey']);

  if (count($settings) > 500) {
    nagiostv_json_response(400, ['error' => 'Settings contain too many properties']);
  }

  foreach ($settings as $key => $value) {
    if (!is_string($key) || !preg_match('/^[A-Za-z][A-Za-z0-9]{0,63}$/', $key)) {
      nagiostv_json_response(400, ['error' => 'Settings contain an invalid property name']);
    }
    if (!is_string($value) && !is_bool($value) && !is_int($value) && !is_float($value) && $value !== null) {
      nagiostv_json_response(400, ['error' => 'Settings values must be scalar']);
    }
    if (is_string($value) && strlen($value) > 65536) {
      nagiostv_json_response(400, ['error' => 'A settings value is too large']);
    }
  }

  $encoded = json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  if ($encoded === false) {
    nagiostv_json_response(400, ['error' => 'Settings could not be encoded']);
  }

  $target = __DIR__ . '/client-settings.json';

  // Atomic rename requires the temp file on the same filesystem, so it must
  // live beside the target. Sweep stale transactions left by killed requests.
  foreach (glob(__DIR__ . '/.client-settings-*') ?: [] as $stale) {
    if (is_file($stale) && (time() - filemtime($stale)) > 3600) {
      @unlink($stale);
    }
  }

  $temporary = tempnam(__DIR__, '.client-settings-');
  if ($temporary === false) {
    nagiostv_json_response(500, ['error' => 'Unable to create a settings transaction']);
  }

  $written = file_put_contents($temporary, $encoded . "\n", LOCK_EX);
  if ($written === false || !chmod($temporary, 0640) || !rename($temporary, $target)) {
    @unlink($temporary);
    nagiostv_json_response(500, ['error' => 'Unable to save settings atomically']);
  }

  nagiostv_json_response(200, [
    'saved' => true,
    'settings' => $settings
  ]);

?>
