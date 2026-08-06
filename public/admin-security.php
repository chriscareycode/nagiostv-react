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

  function nagiostv_json_response($status, $data) {
    http_response_code($status);
    header('Content-Type: application/json');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data);
    exit();
  }

  function nagiostv_is_https() {
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
      || (
        getenv('NAGIOSTV_TRUST_PROXY') === 'true'
        && isset($_SERVER['HTTP_X_FORWARDED_PROTO'])
        && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https'
      );
  }

  function nagiostv_admin_token() {
    $token = getenv('NAGIOSTV_ADMIN_TOKEN');
    return is_string($token) && strlen($token) >= 32 ? $token : '';
  }

  function nagiostv_allow_insecure_admin() {
    return getenv('NAGIOSTV_ALLOW_INSECURE_ADMIN') === 'true';
  }

  function nagiostv_start_admin_session() {
    if (session_status() === PHP_SESSION_ACTIVE) {
      return;
    }

    session_name('nagiostv_admin');
    session_set_cookie_params([
      'lifetime' => 0,
      'path' => '/',
      'secure' => nagiostv_is_https(),
      'httponly' => true,
      'samesite' => 'Strict'
    ]);
    session_start();
  }

  function nagiostv_csrf_token() {
    nagiostv_start_admin_session();
    if (empty($_SESSION['nagiostv_csrf'])) {
      $_SESSION['nagiostv_csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['nagiostv_csrf'];
  }

  function nagiostv_request_is_same_origin() {
    $host = isset($_SERVER['HTTP_HOST']) ? strtolower($_SERVER['HTTP_HOST']) : '';
    if ($host === '') {
      return false;
    }

    if (isset($_SERVER['HTTP_SEC_FETCH_SITE']) && !in_array(
      $_SERVER['HTTP_SEC_FETCH_SITE'],
      ['same-origin', 'none'],
      true
    )) {
      return false;
    }

    $source = isset($_SERVER['HTTP_ORIGIN'])
      ? $_SERVER['HTTP_ORIGIN']
      : (isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '');
    if ($source === '') {
      return false;
    }

    $sourceHost = parse_url($source, PHP_URL_HOST);
    $sourcePort = parse_url($source, PHP_URL_PORT);
    if (!is_string($sourceHost) || $sourceHost === '') {
      return false;
    }
    $sourceAuthority = strtolower($sourceHost . ($sourcePort ? ':' . $sourcePort : ''));
    return hash_equals($host, $sourceAuthority);
  }

  function nagiostv_admin_capabilities() {
    // Only start a session and mint a CSRF token once administration is
    // actually configured, so unauthenticated probes cannot spawn sessions.
    $enabled = nagiostv_admin_token() !== ''
      && (nagiostv_is_https() || nagiostv_allow_insecure_admin());
    nagiostv_json_response(200, [
      'enabled' => $enabled,
      'csrfToken' => $enabled ? nagiostv_csrf_token() : '',
      'httpsRequired' => !nagiostv_is_https() && !nagiostv_allow_insecure_admin()
    ]);
  }

  function nagiostv_require_admin_post($maxBytes) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
      nagiostv_json_response(405, ['error' => 'POST required']);
    }
    if (!nagiostv_is_https() && !nagiostv_allow_insecure_admin()) {
      nagiostv_json_response(403, ['error' => 'HTTPS is required for administrative operations']);
    }
    if (!nagiostv_request_is_same_origin()) {
      nagiostv_json_response(403, ['error' => 'Same-origin request required']);
    }

    $configuredToken = nagiostv_admin_token();
    $providedToken = isset($_SERVER['HTTP_X_NAGIOSTV_ADMIN_TOKEN'])
      ? $_SERVER['HTTP_X_NAGIOSTV_ADMIN_TOKEN']
      : '';
    if ($configuredToken === '' || !hash_equals($configuredToken, $providedToken)) {
      nagiostv_json_response(401, ['error' => 'Administrator authorization failed']);
    }

    $providedCsrf = isset($_SERVER['HTTP_X_NAGIOSTV_CSRF_TOKEN'])
      ? $_SERVER['HTTP_X_NAGIOSTV_CSRF_TOKEN']
      : '';
    if ($providedCsrf === '' || !hash_equals(nagiostv_csrf_token(), $providedCsrf)) {
      nagiostv_json_response(403, ['error' => 'CSRF validation failed']);
    }

    $contentType = isset($_SERVER['CONTENT_TYPE']) ? strtolower($_SERVER['CONTENT_TYPE']) : '';
    if (strpos($contentType, 'application/json') !== 0) {
      nagiostv_json_response(415, ['error' => 'application/json required']);
    }
    $contentLength = isset($_SERVER['CONTENT_LENGTH']) ? intval($_SERVER['CONTENT_LENGTH']) : 0;
    if ($contentLength <= 0 || $contentLength > $maxBytes) {
      nagiostv_json_response(413, ['error' => 'Request body size is invalid']);
    }

    $raw = file_get_contents('php://input', false, null, 0, $maxBytes + 1);
    if ($raw === false || strlen($raw) > $maxBytes) {
      nagiostv_json_response(413, ['error' => 'Request body is too large']);
    }
    $body = json_decode($raw, true);
    if (!is_array($body) || json_last_error() !== JSON_ERROR_NONE) {
      nagiostv_json_response(400, ['error' => 'A JSON object is required']);
    }
    return $body;
  }

?>
