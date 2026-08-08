<?php
// api/check_session.php
require_once 'config.php';

if (isset($_SESSION['admin_id'])) {
    sendResponse("success", "Active session found.", [
        "logged_in" => true,
        "user" => [
            "id" => $_SESSION['admin_id'],
            "name" => $_SESSION['admin_name'],
            "email" => $_SESSION['admin_email']
        ]
    ]);
} else {
    sendResponse("success", "No active session.", [
        "logged_in" => false
    ], 200);
}
?>
