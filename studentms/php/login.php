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
    sendResponse("error", "Email/ID and password are required.", [], 400);
}

// Support logins with or without explicit domain (e.g., 'john' or 'john@gmail.com')
$emailWithDomain = (strpos($email, '@') === false) ? $email . '@gmail.com' : $email;

try {
    // First, check admins table by email, email with @gmail.com, or name
    $stmt = $pdo->prepare("SELECT * FROM admins WHERE LOWER(email) = LOWER(?) OR LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)");
    $stmt->execute([$email, $emailWithDomain, $email]);
    $user = $stmt->fetch();
    $role = 'admin';

    // If not found in admins, check students table by email, email with @gmail.com, roll number, or name
    if (!$user) {
        $stmt = $pdo->prepare("SELECT * FROM students WHERE LOWER(email) = LOWER(?) OR LOWER(email) = LOWER(?) OR LOWER(roll) = LOWER(?) OR LOWER(name) = LOWER(?)");
        $stmt->execute([$email, $emailWithDomain, $email, $email]);
        $user = $stmt->fetch();
        $role = 'student';
    }

    if (!$user) {
        sendResponse("error", "Account ID or email does not exist.", [], 404);
    }

    $passwordMatches = password_verify($password, $user['password']);
    if (!$passwordMatches && $password === $user['password']) {
        $passwordMatches = true;
    }

    if (!$passwordMatches) {
        sendResponse("error", "Incorrect password.", [], 401);
    }

    // Start session and save details
    $_SESSION['admin_id'] = $user['id'];
    $_SESSION['admin_name'] = $user['name'];
    $_SESSION['admin_email'] = $user['email'];
    $_SESSION['role'] = $role;

    sendResponse("success", "Logged in successfully.", [
        "user" => [
            "id" => $user['id'],
            "name" => $user['name'],
            "email" => $user['email'],
            "role" => $role
        ]
    ]);

} catch (PDOException $e) {
    sendResponse("error", "Database error: " . $e->getMessage(), [], 500);
}
?>
