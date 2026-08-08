<?php
// api/signup.php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse("error", "Method not allowed. Use POST.", [], 405);
}

// Get POST input data (support both JSON and raw POST)
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$name = isset($input['name']) ? trim($input['name']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

// Validation
if (empty($name) || empty($email) || empty($password)) {
    sendResponse("error", "All fields are required.", [], 400);
}

if (strlen($name) < 2) {
    sendResponse("error", "Name must be at least 2 characters.", [], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse("error", "Invalid email address format.", [], 400);
}

if (strlen($password) < 4) {
    sendResponse("error", "Password must be at least 4 characters.", [], 400);
}

try {
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM admins WHERE LOWER(email) = LOWER(?)");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendResponse("error", "Email is already registered.", [], 409);
    }

    // Hash password and insert
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    $stmtInsert = $pdo->prepare("INSERT INTO admins (name, email, password) VALUES (?, ?, ?)");
    $stmtInsert->execute([$name, $email, $hashedPassword]);
    
    $adminId = $pdo->lastInsertId();

    // Start session
    $_SESSION['admin_id'] = $adminId;
    $_SESSION['admin_name'] = $name;
    $_SESSION['admin_email'] = $email;

    sendResponse("success", "Account created successfully.", [
        "user" => [
            "id" => $adminId,
            "name" => $name,
            "email" => $email
        ]
    ]);

} catch (PDOException $e) {
    sendResponse("error", "Database error: " . $e->getMessage(), [], 500);
}
?>
