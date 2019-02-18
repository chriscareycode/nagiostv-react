<?php

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