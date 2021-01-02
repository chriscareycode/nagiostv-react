<?php

/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2020 Chris Carey https://chriscarey.com
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

$socket_path = "/usr/local/nagios/var/rw/live.sock";

# load the ini config if it exists. This allows us to override the socket path
# in a way that will not overwrite when we get a new version of NagiosTV
if (file_exists("livestatus-settings.ini")) {
    $config = parse_ini_file("livestatus-settings.ini", true);
    $socket_path = $config["livestatus"]["socket_path"];
}

/**
 * Start Livestatus functions
 * Livestatus functions taken from nagios-dashboard
 */

# The nagios-dashboard was written by Morten Bekkelund & Jonas G. Drange in 2010
#
# Patched, modified and added to by various people, see README
# Maintained as merlin-dashboard by Mattias Bergsten <mattias.bergsten@op5.com>
#
# Parts copyright (C) 2010 Morten Bekkelund & Jonas G. Drange
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# See: http://www.gnu.org/copyleft/gpl.html

function readSocket($len) {
    global $sock;
    $offset = 0;
    $socketData = '';
    
    while($offset < $len) {
        if(($data = @socket_read($sock, $len - $offset)) === false)
            return false;
    
        $dataLen = strlen ($data);
        $offset += $dataLen;
        $socketData .= $data;
        
        if($dataLen == 0)
            break;
    }
    
    return $socketData;
}

function queryLivestatus($query) {
    global $sock;
	global $socket_path;
	
    $sock = socket_create(AF_UNIX, SOCK_STREAM, 0);
    socket_set_option($sock, SOL_SOCKET, SO_RCVTIMEO, array('sec' => 10, 'usec' => 0));
    socket_set_option($sock, SOL_SOCKET, SO_SNDTIMEO, array('sec' => 10, 'usec' => 0));
    $result = socket_connect($sock, $socket_path);

    socket_write($sock, $query . "\n\n");

    $read = readSocket(16);

    if($read === false) {
        $init = shell_exec('/usr/local/bin/nems-info init');
        if ($init == 0) {
        die("NEMS is not yet initilized. Please run: sudo nems-init");
        } else {
            die("Livestatus error: ".socket_strerror(socket_last_error($sock)));
        }
    }

    $status = substr($read, 0, 3);
    $len = intval(trim(substr($read, 4, 11)));

    $read = readSocket($len);
    
    if($read === false)
	die("Livestatus error: ".socket_strerror(socket_last_error($sock)));
    
    if($status != "200")
	die("Livestatus error: ".$read);
    
    if(socket_last_error($sock) == 104)
	die("Livestatus error: ".socket_strerror(socket_last_error($sock)));

    $result = socket_close($sock);
    
    return $read;

}

/**
 * Start NagiosTV functions
 */

function translateStateToStatus($state) {
    switch($state) {
        case 0:
            # service OK
            return 2;
        case 1:
            # service WARNING
            return 4;
        case 2:
            # service CRITICAL?
            return 16;
        case 3:
            # service UNKNOWN
            return 8;
        default:
            return $state;
    }
}

function translateHostAlertState($state) {
    switch($state) {
        case 0:
            # host up
            return 1;
        case 1:
            # host down
            return 2;
        case 2:
            # host unreachable
            return 4;
        

        default:
            return $state;
    }
}
function translateServiceAlertState($state) {
    switch($state) {
        
        case 0:
            # service ok
            return 8;
        case 1:
            # service warning
            return 16;
        case 2:
            # service critical
            return 32;
        case 3:
            # service unknown
            return 64;

        default:
            return $state;
    }
}

/**
 * Start Program
 */

# Add CORS header to the response if ORIGIN header is present
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN'] . "");
}

# get the query string from the URL
$query_string = array();
parse_str($_SERVER['QUERY_STRING'], $query_string);

# based on the query passed in, we query livestatus in different ways and massage the results
if ($query_string["query"] == "hostlist") {
    
    # hostlist

    # create the base object
    $res = array(
        "format_version" => 0,
        "result" => array(
            "cgi" => "statusjson.cgi",
            "query" => "hostlist"
        )
    );
                
    $query = <<<"EOQ"
    GET hosts
    OutputFormat: json
    ResponseHeader: fixed16
    EOQ;
    
    $json = queryLivestatus($query);
    
    # debug
    #header('Content-Type: application/json');
    #print_r($json);
    #exit();
    
    $decoded = json_decode($json, true);
    $decoded_size = sizeof($decoded);
    # convert the json format that livestatus gives us into something readable
    
    $list = array();
    
    for ($x = 1; $x < $decoded_size; $x++) {
        
        $item = array();
        
        # if we have 2 hosts, the livestatus json result will give us an array of size 3
        # the first item in the array will contain the field names
        # then the next two will have the values. 
        # so we have to go through the process to undo this optimization and just give us clear name: value pairs

        # loop through the first index in the result which contains the key names
        # and create a new array of name->value pair objects for this data
        foreach($decoded[0] as $index => $value) {
            $item[$value] = $decoded[$x][$index];
        }

        # livestatus does not have the field name "status" like nagios cgi does. 
        # so we have to get it from the other field called "state"
        $item["status"] = translateStateToStatus($item["state"]);
    
        # livestatus dates are not unix timestamp. We need to multiply them by 1000 I think
        $item["next_check"] = $item["next_check"] * 1000;
        $item["last_time_up"] = $item["last_time_up"] * 1000;

        # livestatus is_flapping is 0 or 1, we need false or true
        if ($item["is_flapping"] === 0) { $item["is_flapping"] = false; }
        if ($item["is_flapping"] === 1) { $item["is_flapping"] = true; }

        # livestatus acknowledged needs to be problem_has_been_acknowledged
        if ($item["acknowledged"] === 0) { $item["problem_has_been_acknowledged"] = false; }
        if ($item["acknowledged"] === 1) { $item["problem_has_been_acknowledged"] = true; }

        # attach the hostitem into the list
        $list[$item["name"]] = $item;
    }
    
    $res["data"]["hostlist"] = $list;
    
    # test query string
    #$res["query_string"] = $query_string;
    
    $encoded = json_encode($res);
    header('Content-Type: application/json');
    print_r($encoded);

} elseif ($query_string["query"] == "servicelist") {
    
    # servicelist

    # create the base object
    $res = array(
        "format_version" => 0,
        "result" => array(
            "cgi" => "statusjson.cgi",
            "query" => "servicelist"
        )
    );
                
    $query = <<<"EOQ"
    GET services
    OutputFormat: json
    ResponseHeader: fixed16
    EOQ;
    
    $json = queryLivestatus($query);
    
    # debug
    #header('Content-Type: application/json');
    #print_r($json);
    #exit();
    
    $decoded = json_decode($json, true);
    $decoded_size = sizeof($decoded);
    # convert the json format that livestatus gives us into something readable
    
    $list = array();
    
    for ($x = 1; $x < $decoded_size; $x++) {
        
        $item = array();
        
        # loop through the first index in the result which contains the key names
        # and create a new array of name->value pair objects for this data
        foreach($decoded[0] as $index => $value) {
            $item[$value] = $decoded[$x][$index];
        }

        # livestatus does not have the field name "status" like nagios cgi does. 
        # so we have to get it from the other field called "state"
        $item["status"] = translateStateToStatus($item["state"]);

        # livestatus dates are not unix timestamp. We need to multiply them by 1000
        $item["next_check"] = $item["next_check"] * 1000;
        $item["last_time_ok"] = $item["last_time_ok"] * 1000;

        # livestatus is_flapping is 0 or 1, we need false or true
        if ($item["is_flapping"] === 0) { $item["is_flapping"] = false; }
        if ($item["is_flapping"] === 1) { $item["is_flapping"] = true; }
    
        # livestatus acknowledged needs to be problem_has_been_acknowledged
        if ($item["is_flapping"] === 0) { $item["is_flapping"] = false; }
        if ($item["is_flapping"] === 1) { $item["is_flapping"] = true; }
        
        # livestatus acknowledged needs to be problem_has_been_acknowledged
        if ($item["acknowledged"] === 0) { $item["problem_has_been_acknowledged"] = false; }
        if ($item["acknowledged"] === 1) { $item["problem_has_been_acknowledged"] = true; }

        # set item into the correct spot in the JSON
        $list[ $item["host_name"] ][ $item["display_name"] ] = $item;
    }
    
    $res["data"]["servicelist"] = $list;
    
    # test query string
    #$res["query_string"] = $query_string;
    
    $encoded = json_encode($res);
    header('Content-Type: application/json');
    print_r($encoded);

} elseif ($query_string["query"] == "alertlist") {
    
    # alertlist

    # for alertlist we pass in starttime. We use this to limit the days back in the alert history
    $alert_starttime = $query_string["starttime"];
    # starttime: strip the negative sign
    $alert_starttime = (int)substr($alert_starttime, 1);
    # starttime: subtract now - starttime
    $alert_starttime = time() - $alert_starttime;

    # create the base object
    $res = array(
        "format_version" => 0,
        "result" => array(
            "cgi" => "archivejson.cgi",
            "query" => "alertlist"
        )
    );
                
    $query = <<<"EOQ"
    GET log
    Filter: class = 1
    Filter: time >= $alert_starttime
    OutputFormat: json
    ResponseHeader: fixed16
    EOQ;
    
    $json = queryLivestatus($query);
    
    # debug
    #header('Content-Type: application/json');
    #print_r($json);
    #exit();
    
    $decoded = json_decode($json, true);
    $decoded_size = sizeof($decoded);
    # convert the json format that livestatus gives us into something readable
    
    $list = array();
    
    for ($x = 1; $x < $decoded_size; $x++) {
        
        $item = array();
        
        # loop through the first index in the result which contains the key names
        # and create a new array of name->value pair objects for this data
        foreach($decoded[0] as $index => $value) {
            $item[$value] = $decoded[$x][$index];
        }

        # livestatus does not have the field name "status" like nagios cgi does. 
        # so we have to get it from the other field called "state"
        
        if ($item["state_type"] == "SOFT") { $item["state_type"] = 2; }
        if ($item["state_type"] == "HARD") { $item["state_type"] = 1; }
                
        if ($item["type"] == "CURRENT_SERVICE_STATE") { $item["object_type"] = 1; }
        if ($item["type"] == "CURRENT_HOST_STATE") { $item["object_type"] = 2; }
        
        if ($item["type"] == "HOST ALERT") {
            $item["name"] = $item["host_name"];
            $item["object_type"] = 1;
            $item["state"] = translateHostAlertState($item["state"]);
        }
        if ($item["type"] == "SERVICE ALERT") {
            $item["object_type"] = 2;
            $item["state"] = translateServiceAlertState($item["state"]);
            $item["description"] = $item["service_description"];
        }

        $item["timestamp"] = $item["time"] * 1000;      
    
        # reverse the array
        array_unshift($list, $item);
    }
    
    $res["data"]["alertlist"] = $list;
    
    # test query string
    #$res["query_string"] = $query_string;
    
    $encoded = json_encode($res);
    header('Content-Type: application/json');
    print_r($encoded);

} elseif ($query_string["query"] == "commentlist") {
    
    # commentlist

    # create the base object
    $res = array(
        "format_version" => 0,
        "result" => array(
            "cgi" => "statusjson.cgi",
            "query" => "commentlist"
        )
    );

    $query = <<<"EOQ"
    GET comments
    OutputFormat: json
    ResponseHeader: fixed16
    EOQ;
    
    $json = queryLivestatus($query);
    
    # debug
    #header('Content-Type: application/json');
    #print_r($json);
    #exit();
    
    $decoded = json_decode($json, true);
    $decoded_size = sizeof($decoded);

    $list = array();
    
    for ($x = 1; $x < $decoded_size; $x++) {
        
        $item = array();
        
        # loop through the first index in the result which contains the key names
        # and create a new array of name->value pair objects for this data
        foreach($decoded[0] as $index => $value) {
            $item[$value] = $decoded[$x][$index];
        }

        $item["comment_type"] = $item["type"];
        $item["host_name"] = $item["host_alias"];
        $item["comment_data"] = $item["comment"];
        $item["entry_time"] = $item["entry_time"] * 1000;       

        # set item into the correct spot in the JSON
        $list[ $item["id"] ] = $item;
    }
    
    $res["data"]["commentlist"] = $list;

    # output the result
    $encoded = json_encode($res);
    header('Content-Type: application/json');
    print_r($encoded);

} elseif ($query_string["query"] == "hostgrouplist") {
    
    # commentlist

    # create the base object
    $res = array(
        "format_version" => 0,
        "result" => array(
            //"cgi" => "statusjson.cgi",
            "query" => "hostgrouplist"
        )
    );

    $query = <<<"EOQ"
    GET hostgroups
    OutputFormat: json
    ResponseHeader: fixed16
    EOQ;
    
    $json = queryLivestatus($query);
    
    # debug
    // header('Content-Type: application/json');
    // print_r($json);
    // exit();
    
    $decoded = json_decode($json, true);
    $decoded_size = sizeof($decoded);

    $list = array();
    
    for ($x = 1; $x < $decoded_size; $x++) {
        
        $item = array();
        
        # loop through the first index in the result which contains the key names
        # and create a new array of name->value pair objects for this data
        foreach($decoded[0] as $index => $value) {
            $item[$value] = $decoded[$x][$index];
        }

        $item["group_name"] = $item["name"];
              
        # set item into the correct spot in the JSON
        $list[ $item["name"] ] = $item;
    }
    
    $res["data"]["hostgrouplist"] = $list;

    # output the result
    $encoded = json_encode($res);
    header('Content-Type: application/json');
    print_r($encoded);

} else {
    print("unknown or no 'query' queryparam");
}

?>
