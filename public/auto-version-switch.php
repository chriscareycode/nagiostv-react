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

  function nagiostv_remove_tree($path) {
    if (is_link($path) || is_file($path)) {
      return @unlink($path);
    }
    if (!is_dir($path)) {
      return true;
    }
    $items = scandir($path);
    if ($items === false) {
      return false;
    }
    foreach ($items as $item) {
      if ($item !== '.' && $item !== '..' && !nagiostv_remove_tree($path . DIRECTORY_SEPARATOR . $item)) {
        return false;
      }
    }
    return @rmdir($path);
  }

  function nagiostv_safe_archive_path($path) {
    if ($path === '' || strpos($path, "\0") !== false || strpos($path, '\\') !== false) {
      return false;
    }
    if ($path[0] === '/' || preg_match('/^[A-Za-z]:/', $path)) {
      return false;
    }
    foreach (explode('/', $path) as $segment) {
      if ($segment === '..') {
        return false;
      }
    }
    return true;
  }

  function nagiostv_validate_archive($archive, $archivePath) {
    $prefix = 'phar://' . $archivePath . '/';
    $iterator = new RecursiveIteratorIterator($archive);
    $entryCount = 0;
    $totalBytes = 0;
    foreach ($iterator as $entry) {
      $entryCount++;
      $totalBytes += $entry->isFile() ? $entry->getSize() : 0;
      if ($entryCount > 20000 || $totalBytes > 536870912) {
        throw new RuntimeException('Release archive expands beyond the safety limit');
      }
      $entryPath = $entry->getPathname();
      if (strpos($entryPath, $prefix) !== 0) {
        throw new RuntimeException('Archive entry has an invalid path');
      }
      $relativePath = substr($entryPath, strlen($prefix));
      if (!nagiostv_safe_archive_path($relativePath) || $entry->isLink()) {
        throw new RuntimeException('Archive contains an unsafe entry');
      }
    }
  }

  // Files that must never be overwritten by a browser update or restored by a
  // rollback: the hardened admin endpoints, local configuration, and the pinned
  // release-signing public key that anchors update integrity.
  function nagiostv_protected_paths() {
    return [
      'admin-security.php',
      'auto-version-switch.php',
      'save-client-settings.php',
      'client-settings.json',
      'livestatus-settings.ini',
      'nagiostv-release-ed25519.pub'
    ];
  }

  function nagiostv_load_release_public_key($keyFile) {
    $contents = @file_get_contents($keyFile);
    if ($contents === false) {
      throw new RuntimeException('Release signing public key is not installed');
    }
    // Accept a single base64 key line; ignore blank and "#" comment lines.
    $key = '';
    foreach (preg_split('/\r?\n/', $contents) as $line) {
      $line = trim($line);
      if ($line === '' || $line[0] === '#') {
        continue;
      }
      $key = $line;
      break;
    }
    if ($key === '') {
      throw new RuntimeException('Release signing public key is not configured');
    }
    $decoded = base64_decode($key, true);
    if ($decoded === false || strlen($decoded) !== SODIUM_CRYPTO_SIGN_PUBLICKEYBYTES) {
      throw new RuntimeException('Release signing public key is invalid');
    }
    return $decoded;
  }

  function nagiostv_verify_release_signature($archivePath, $signaturePath) {
    if (!function_exists('sodium_crypto_sign_verify_detached')) {
      throw new RuntimeException('PHP libsodium signature support is required');
    }
    $publicKey = nagiostv_load_release_public_key(__DIR__ . '/nagiostv-release-ed25519.pub');
    $rawSignature = @file_get_contents($signaturePath, false, null, 0, 4096);
    if ($rawSignature === false) {
      throw new RuntimeException('Unable to read the release signature');
    }
    $signature = base64_decode(trim($rawSignature), true);
    if ($signature === false || strlen($signature) !== SODIUM_CRYPTO_SIGN_BYTES) {
      throw new RuntimeException('Release signature is malformed');
    }
    $message = file_get_contents($archivePath);
    if ($message === false) {
      throw new RuntimeException('Unable to read the release archive');
    }
    if (!sodium_crypto_sign_verify_detached($signature, $message, $publicKey)) {
      throw new RuntimeException('Release signature verification failed');
    }
  }

  // Installs the release with per-file atomic replacement while recording an
  // undo log so a partial failure can be rolled back to the previous state.
  function nagiostv_backup_and_install($source, $destination, $backupDir, &$restoreLog) {
    $protectedPaths = nagiostv_protected_paths();
    $iterator = new RecursiveIteratorIterator(
      new RecursiveDirectoryIterator($source, FilesystemIterator::SKIP_DOTS),
      RecursiveIteratorIterator::SELF_FIRST
    );
    foreach ($iterator as $entry) {
      if ($entry->isLink()) {
        throw new RuntimeException('Release contains a symbolic link');
      }
      $relativePath = substr($entry->getPathname(), strlen($source) + 1);
      $relativePath = str_replace(DIRECTORY_SEPARATOR, '/', $relativePath);
      if (!nagiostv_safe_archive_path($relativePath) || in_array($relativePath, $protectedPaths, true)) {
        continue;
      }
      $target = $destination . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativePath);
      if ($entry->isDir()) {
        if (!is_dir($target)) {
          if (!mkdir($target, 0755, true)) {
            throw new RuntimeException('Unable to create release directory');
          }
          $restoreLog[] = ['type' => 'dir', 'path' => $target];
        }
        continue;
      }

      $targetDirectory = dirname($target);
      if (!is_dir($targetDirectory)) {
        if (!mkdir($targetDirectory, 0755, true)) {
          throw new RuntimeException('Unable to create target directory');
        }
        $restoreLog[] = ['type' => 'dir', 'path' => $targetDirectory];
      }

      if (is_file($target)) {
        $backupTarget = $backupDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativePath);
        $backupParent = dirname($backupTarget);
        if (!is_dir($backupParent) && !mkdir($backupParent, 0700, true)) {
          throw new RuntimeException('Unable to create a backup directory');
        }
        if (!copy($target, $backupTarget)) {
          throw new RuntimeException('Unable to back up an existing file');
        }
        $restoreLog[] = [
          'type' => 'modified',
          'path' => $target,
          'backup' => $backupTarget,
          'mode' => fileperms($target) & 0777
        ];
      } else {
        $restoreLog[] = ['type' => 'created', 'path' => $target];
      }

      $temporaryTarget = tempnam($targetDirectory, '.nagiostv-update-');
      if ($temporaryTarget === false || !copy($entry->getPathname(), $temporaryTarget)) {
        if ($temporaryTarget !== false) {
          @unlink($temporaryTarget);
        }
        throw new RuntimeException('Unable to stage a release file');
      }
      chmod($temporaryTarget, $entry->isExecutable() ? 0755 : 0644);
      if (!rename($temporaryTarget, $target)) {
        @unlink($temporaryTarget);
        throw new RuntimeException('Unable to install a release file');
      }
    }
  }

  function nagiostv_restore_backup(array $restoreLog) {
    // Undo a partial install in reverse order: restore modified files from the
    // backup, remove newly created files, and drop now-empty new directories.
    foreach (array_reverse($restoreLog) as $item) {
      if ($item['type'] === 'modified') {
        $temporary = tempnam(dirname($item['path']), '.nagiostv-restore-');
        if ($temporary !== false && copy($item['backup'], $temporary)) {
          chmod($temporary, isset($item['mode']) ? $item['mode'] : 0644);
          @rename($temporary, $item['path']);
        } elseif ($temporary !== false) {
          @unlink($temporary);
        }
      } elseif ($item['type'] === 'created') {
        @unlink($item['path']);
      } elseif ($item['type'] === 'dir') {
        @rmdir($item['path']);
      }
    }
  }

  if ($_SERVER['REQUEST_METHOD'] === 'GET' && (isset($_GET['capabilities']) || isset($_GET['testphp']))) {
    nagiostv_admin_capabilities();
  }

  $request = nagiostv_require_admin_post(4096);
  $version = isset($request['version']) && is_string($request['version'])
    ? ltrim(trim($request['version']), 'v')
    : '';
  if (!preg_match('/^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/', $version)) {
    nagiostv_json_response(400, ['error' => 'Version must be a valid NagiosTV release identifier']);
  }
  if (!class_exists('PharData')) {
    nagiostv_json_response(500, ['error' => 'PHP PharData support is required']);
  }

  $workingDirectory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'nagiostv-update-' . bin2hex(random_bytes(16));
  if (!mkdir($workingDirectory, 0700, true)) {
    nagiostv_json_response(500, ['error' => 'Unable to create a secure update directory']);
  }

  try {
    $archivePath = $workingDirectory . DIRECTORY_SEPARATOR . 'nagiostv-' . $version . '.tar.gz';
    $url = 'https://github.com/chriscareycode/nagiostv-react/releases/download/v'
      . rawurlencode($version) . '/nagiostv-' . rawurlencode($version) . '.tar.gz';
    $context = stream_context_create([
      'http' => [
        'follow_location' => 1,
        'max_redirects' => 5,
        'timeout' => 30,
        'user_agent' => 'NagiosTV secure updater'
      ],
      'ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true,
        'allow_self_signed' => false
      ]
    ]);
    $input = @fopen($url, 'rb', false, $context);
    $output = @fopen($archivePath, 'xb');
    if ($input === false || $output === false) {
      throw new RuntimeException('Unable to open the release download');
    }
    $bytes = stream_copy_to_stream($input, $output, 104857601);
    fclose($input);
    fclose($output);
    if ($bytes === false || $bytes <= 0 || $bytes > 104857600) {
      throw new RuntimeException('Release archive is empty or exceeds 100 MiB');
    }

    // Download and verify the detached Ed25519 signature before trusting the
    // archive contents, so a compromised release host cannot install code.
    $signatureUrl = $url . '.sig';
    $signaturePath = $archivePath . '.sig';
    $signatureInput = @fopen($signatureUrl, 'rb', false, $context);
    $signatureOutput = @fopen($signaturePath, 'xb');
    if ($signatureInput === false || $signatureOutput === false) {
      if ($signatureInput !== false) {
        fclose($signatureInput);
      }
      if ($signatureOutput !== false) {
        fclose($signatureOutput);
      }
      throw new RuntimeException('Unable to open the release signature download');
    }
    $signatureBytes = stream_copy_to_stream($signatureInput, $signatureOutput, 4097);
    fclose($signatureInput);
    fclose($signatureOutput);
    if ($signatureBytes === false || $signatureBytes <= 0 || $signatureBytes > 4096) {
      throw new RuntimeException('Release signature is empty or exceeds the size limit');
    }
    nagiostv_verify_release_signature($archivePath, $signaturePath);

    $compressedArchive = new PharData($archivePath);
    $compressedArchive->decompress();
    $tarPath = substr($archivePath, 0, -3);
    $archive = new PharData($tarPath);
    nagiostv_validate_archive($archive, $tarPath);

    $extractDirectory = $workingDirectory . DIRECTORY_SEPARATOR . 'extract';
    if (!mkdir($extractDirectory, 0700, true) || !$archive->extractTo($extractDirectory, null, true)) {
      throw new RuntimeException('Unable to extract the release archive');
    }
    $releaseRoot = $extractDirectory . DIRECTORY_SEPARATOR . 'nagiostv';
    if (!is_dir($releaseRoot)) {
      throw new RuntimeException('Release archive does not contain the expected root directory');
    }

    $backupDirectory = $workingDirectory . DIRECTORY_SEPARATOR . 'backup';
    if (!mkdir($backupDirectory, 0700, true)) {
      throw new RuntimeException('Unable to create a backup directory');
    }
    $restoreLog = [];
    try {
      nagiostv_backup_and_install($releaseRoot, __DIR__, $backupDirectory, $restoreLog);
    } catch (Throwable $installError) {
      nagiostv_restore_backup($restoreLog);
      throw $installError;
    }
  } catch (Throwable $error) {
    nagiostv_remove_tree($workingDirectory);
    error_log('NagiosTV updater: ' . $error->getMessage());
    nagiostv_json_response(500, ['error' => 'Update failed. See the server error log for details.']);
  }

  nagiostv_remove_tree($workingDirectory);
  nagiostv_json_response(200, [
    'updated' => true,
    'version' => $version,
    'message' => 'Update installed. Refresh the dashboard to load the new version.'
  ]);

?>
