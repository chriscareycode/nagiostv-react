<?php


header('Access-Control-Allow-Origin: *'); 

/**
 * 
 * TODO:
 * 
 * Get commandfile automatically from nagios config
 * How to do host only check?
 * 
 */

//$now=date +%s

$host_set = isset($_POST["host"]);
$service_set = isset($_POST["service"]);

if (isset($_POST["host"])) {
    $host = $_POST["host"];
} else {
    $host = "mini";
}

if (isset($_POST["service"])) {
    $service = $_POST["service"];
} else {
    $service = "Check APT";
}

// if both are set
if ($host_set && $service_set) {

    $now = time();
    
    $commandfile='/usr/local/nagios/var/rw/nagios.cmd';
    $lu = "0";
    $cmd = "echo \"[$lu] SCHEDULE_FORCED_SVC_CHECK;$host;$service;$now\n\" $now > $commandfile";
    
    print($cmd);
    print("\n");
    exec($cmd);
} else {
    print("both are not set");
}

?>