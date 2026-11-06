<?php

  /**
   * NagiosTV https://nagiostv.com
   * Copyright (C) 2008-2025 Chris Carey https://chriscarey.com
   * License: GPL-2.0-or-later
   *
   * Write token for the NagiosTV server-side PHP helpers
   * (auto-version-switch.php and save-client-settings.php).
   *
   * Updates/rollbacks require a token; settings saves accept the token if
   * configured. To set one up:
   *
   *   1. Copy this file to nagiostv-server-config.local.php in the same folder
   *      (the .local.php copy is gitignored, so the secret stays out of git).
   *   2. Replace the value below with a long random string, for example:
   *         php -r "echo bin2hex(random_bytes(32));"
   *
   * Once nagiostv-server-config.local.php exists, both scripts reject requests
   * that do not pass the token in an X-NagiosTV-Token header. A missing or
   * unreadable config disables updates; an invalid config denies both writes.
   * The Update page accepts the token without storing it. With a token
   * configured, the "Save settings to server" button cannot write; use the
   * manual copy/paste instructions in the settings screen instead.
   *
   * Direct requests to this .sample file execute it and produce no output, so
   * the placeholder below is not disclosed by the web server.
   */

  return [
    'write_token' => 'change-me-to-a-long-random-string',
  ];
