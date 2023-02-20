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

$socket_path = "/usr/local/nagios/var/rw/live.sock";

# load the ini config if it exists. This allows us to override the socket path
# in a way that will not overwrite when we get a new version of NagiosTV
if (file_exists("livestatus-settings.ini")) {
	$config = parse_ini_file("livestatus-settings.ini", true);
	$socket_path = $config["livestatus"]["socket_path"];
}

/**
 * Note to developers:
 * 
 * mk livestatus does not seem to have state "pending", the items show state=0
 * It would be nice to figure out another piece of data we can use to signify pending, and fake it out.
 * 
 * To debug issues like this I have lines in each section marked as "debug" that you can uncomment.
 * Then in the web browser, you can inspect the raw output coming from the livestatus api call hitting the url (or others): "livestaus.php?query=servicelist"
 * With debug turned on there, The field names are in the first row, use that to find what you are looking for.
 * Then each other row is data for each item.
 * 
 */

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

	# for nems linux
	#if($read === false) {
	#	$init = shell_exec('/usr/local/bin/nems-info init');
	#	if ($init == 0) {
	#	die("NEMS is not yet initilized. Please run: sudo nems-init");
	#	} else {
	#			die("Livestatus error: ".socket_strerror(socket_last_error($sock)));
	#	}
	#}

	if($read === false) {
	  die("Livestatus error 1: ".socket_strerror(socket_last_error($sock)));
	}

	$status = substr($read, 0, 3);
	$len = intval(trim(substr($read, 4, 11)));

	$read = readSocket($len);
	
	if($read === false)
	die("Livestatus error 2: ".socket_strerror(socket_last_error($sock)));
	
	if($status != "200")
	die("Livestatus error 3: ".$read);
	
	if(socket_last_error($sock) == 104)
	die("Livestatus error: ".socket_strerror(socket_last_error($sock)));

	$result = socket_close($sock);
	
	return $read;
}

/**
 * Start NagiosTV functions
 */

function translateStateToStatus($state) {
	// TODO: livestatus does not seem to have pending? they show state=0
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
	// TODO: livestatus does not seem to have pending? they show state=0
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
			"query" => "hostlist"
		)
	);
	
	# create the query
	$query_arr = array();
	$query_arr[] = "GET hosts";
	$query_arr[] = "Filter: state = 1";
	$query_arr[] = "Filter: state = 2";
	$query_arr[] = "Or: 2";
	$query_arr[] = "OutputFormat: json";
	$query_arr[] = "ResponseHeader: fixed16";
	$query = join($query_arr, "\n");

	
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

		# livestatus notifications_enabled is 0 or 1, needs to be false or true
		if ($item["notifications_enabled"] === 0) { $item["notifications_enabled"] = false; }
		if ($item["notifications_enabled"] === 1) { $item["notifications_enabled"] = true; }

		# livestatus acknowledged needs to be problem_has_been_acknowledged
		if ($item["acknowledged"] === 0) { $item["problem_has_been_acknowledged"] = false; }
		if ($item["acknowledged"] === 1) { $item["problem_has_been_acknowledged"] = true; }

		# add max_attempts from max_check_attempts
		if ($item["max_check_attempts"]) { $item["max_attempts"] = $item["max_check_attempts"]; }

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
			"query" => "servicelist"
		)
	);

	# create query
	$query_arr = array();
	$query_arr[] = "GET services";
	$query_arr[] = "Filter: state = 1";
	$query_arr[] = "Filter: state = 2";
	$query_arr[] = "Filter: state = 3";
	$query_arr[] = "Or: 3";
	$query_arr[] = "OutputFormat: json";
	$query_arr[] = "ResponseHeader: fixed16";
	$query = join($query_arr, "\n");

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
	
		# livestatus notifications_enabled is 0 or 1, needs to be false or true
		if ($item["notifications_enabled"] === 0) { $item["notifications_enabled"] = false; }
		if ($item["notifications_enabled"] === 1) { $item["notifications_enabled"] = true; }
		
		# livestatus acknowledged needs to be problem_has_been_acknowledged
		if ($item["acknowledged"] === 0) { $item["problem_has_been_acknowledged"] = false; }
		if ($item["acknowledged"] === 1) { $item["problem_has_been_acknowledged"] = true; }

		# add max_attempts from max_check_attempts
		if ($item["max_check_attempts"]) { $item["max_attempts"] = $item["max_check_attempts"]; }
		
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
			"query" => "alertlist"
		)
	);

	# create query
	$query_arr = array();
	$query_arr[] = "GET log";
	$query_arr[] = "Filter: class = 1";
	$query_arr[] = "Filter: time >= " . $alert_starttime;
	$query_arr[] = "OutputFormat: json";
	$query_arr[] = "ResponseHeader: fixed16";
	$query = join($query_arr, "\n");

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

		# livestatus adds state_type of STARTED and STOPPED which I assume is Nagios start and stop times
		# we do not need to see these in the alert list so we will just skip them so they will go away
		if ($item["state_type"] == "STARTED") { continue; }
		if ($item["state_type"] == "STOPPED") { continue; }

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
	
		# add the item to the list, reversed using unshift() instead of push()
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
			"query" => "commentlist"
		)
	);

	# create query
	$query_arr = array();
	$query_arr[] = "GET comments";
	$query_arr[] = "OutputFormat: json";
	$query_arr[] = "ResponseHeader: fixed16";
	$query = join($query_arr, "\n");
	
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
			"query" => "hostgrouplist"
		)
	);

	# create query
	$query_arr = array();
	$query_arr[] = "GET hostgroups";
	$query_arr[] = "OutputFormat: json";
	$query_arr[] = "ResponseHeader: fixed16";
	$query = join($query_arr, "\n");
	
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

} elseif ($query_string["query"] == "servicegrouplist") {
	
	# commentlist

	# create the base object
	$res = array(
		"format_version" => 0,
		"result" => array(
			"query" => "servicegrouplist"
		)
	);

	# create query
	$query_arr = array();
	$query_arr[] = "GET servicegroups";
	$query_arr[] = "OutputFormat: json";
	$query_arr[] = "ResponseHeader: fixed16";
	$query = join($query_arr, "\n");
	
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
	
	$res["data"]["servicegrouplist"] = $list;

	# output the result
	$encoded = json_encode($res);
	header('Content-Type: application/json');
	print_r($encoded);

} elseif ($query_string["query"] == "hostcount") {
	
	# hostcount

	# create the base object
	$res = array(
		"format_version" => 0,
		"result" => array(
			"query" => "hosts"
		)
	);

	# create query
	$query_arr = array();
	$query_arr[] = "GET hosts";
	$query_arr[] = "Columns: state";
	$query_arr[] = "OutputFormat: json";
	$query_arr[] = "ResponseHeader: fixed16";
	$query = join($query_arr, "\n");
	
	$json = queryLivestatus($query);
	
	# debug
	// header('Content-Type: application/json');
	// print_r($json);
	// exit();
	
	$decoded = json_decode($json, true);
	$decoded_size = sizeof($decoded);

	$list = array();

	$list["all"] = $decoded_size;
	
	$res["data"]["count"] = $list;

	# output the result
	$encoded = json_encode($res);
	header('Content-Type: application/json');
	print_r($encoded);

} elseif ($query_string["query"] == "servicecount") {
	
	# servicecount

	# create the base object
	$res = array(
		"format_version" => 0,
		"result" => array(
			"query" => "services"
		)
	);

	# create query
	$query_arr = array();
	$query_arr[] = "GET services";
	$query_arr[] = "Columns: state";
	$query_arr[] = "OutputFormat: json";
	$query_arr[] = "ResponseHeader: fixed16";
	$query = join($query_arr, "\n");
	
	$json = queryLivestatus($query);
	
	# debug
	// header('Content-Type: application/json');
	// print_r($json);
	// exit();
	
	$decoded = json_decode($json, true);
	$decoded_size = sizeof($decoded);

	$list = array();

	$list["all"] = $decoded_size;
	
	$res["data"]["count"] = $list;

	# output the result
	$encoded = json_encode($res);
	header('Content-Type: application/json');
	print_r($encoded);

} else {
	print("unknown or no 'query' queryparam");
}

?>
