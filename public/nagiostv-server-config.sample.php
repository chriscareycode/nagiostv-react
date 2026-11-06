<?php

  /**
   * NagiosTV https://nagiostv.com
   * Copyright (C) 2008-2025 Chris Carey https://chriscarey.com
   * License: GPL-2.0-or-later
   *
   * Optional hardening config for the NagiosTV server-side PHP helpers
   * (auto-version-switch.php and save-client-settings.php).
   *
   * By default those scripts are reachable by anyone who can reach the web
   * server. To require a secret token:
   *
   *   1. Copy this file to nagiostv-server-config.local.php in the same folder
   *      (the .local.php copy is gitignored, so the secret stays out of git).
   *   2. Replace the value below with a long random string, for example:
   *         php -r "echo bin2hex(random_bytes(32));"
   *
   * Once nagiostv-server-config.local.php exists, both scripts reject requests
   * that do not pass the token as ?token=... or an X-NagiosTV-Token header.
   * Note: with a token configured, the "Save settings to server" button in the
   * UI cannot write; use the manual copy/paste instructions in the settings
   * screen instead.
   *
   * Direct requests to this .sample file execute it and produce no output, so
   * the placeholder below is not disclosed by the web server.
   */

  return [
    'write_token' => 'change-me-to-a-long-random-string',
  ];
