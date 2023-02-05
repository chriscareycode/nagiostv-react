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

  // capture JSON POST
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

?>