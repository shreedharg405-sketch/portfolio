<?php
// api/login.php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse("error", "Method not allowed. Use POST.", [], 405);
}

// Get POST input data (support both JSON and raw POST)
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

if (empty($email) || empty($password)) {
    sendResponse("error", "Email and password are required.", [], 400);
}

try {
    $stmt = $pdo->prepare("SELECT * FROM admins WHERE LOWER(email) = LOWER(?)");
    $stmt->execute([$email]);
    $admin = $stmt->fetch();

    if (!$admin) {
        sendResponse("error", "Account email does not exist.", [], 404);
    }

    if (!password_verify($password, $admin['password'])) {
        sendResponse("error", "Incorrect password.", [], 401);
    }

    // Start session and save details
    $_SESSION['admin_id'] = $admin['id'];
    $_SESSION['admin_name'] = $admin['name'];
    $_SESSION['admin_email'] = $admin['email'];

    sendResponse("success", "Logged in successfully.", [
        "user" => [
            "id" => $admin['id'],
            "name" => $admin['name'],
            "email" => $admin['email']
        ]
    ]);

} catch (PDOException $e) {
    sendResponse("error", "Database error: " . $e->getMessage(), [], 500);
}
?>
